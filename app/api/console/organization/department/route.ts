import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasOrgPermission, ORG_PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const createDepartmentSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    nameEn: z.string().min(1, "English name is required"),
    nameSi: z.string().optional(),
    nameTa: z.string().optional(),
    descriptionEn: z.string().optional(),
    descriptionSi: z.string().optional(),
    descriptionTa: z.string().optional(),
    order: z.number().int().default(0),
})

const updateDepartmentSchema = createDepartmentSchema.partial().extend({
    organizationId: z.string().min(1),
    slug: z.string().optional(),
})

/**
 * GET /api/console/organization/department?organizationId=[id]&all=[true|false]
 * Get departments for an organization
 */
export async function GET(req: Request) {
    console.log('[Org Department] GET - Fetching departments')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Department] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const organizationId = searchParams.get("organizationId")
        const all = searchParams.get("all") === "true"
        const departmentId = searchParams.get("id")

        if (!organizationId && !all) {
            console.log('[Org Department] Missing organizationId')
            return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
        }

        const prisma = getPrisma()

        // If requesting all, check system permission
        if (all) {
            const { hasSystemPermission } = await import("@/lib/permissions")
            const canViewAll = await hasSystemPermission(session.user.id, "system.organizations.view")
            
            if (!canViewAll) {
                console.log('[Org Department] Forbidden - No system permission')
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }

            console.log('[Org Department] Fetching all departments...')
            const departments = await prisma.department.findMany({
                orderBy: [{ order: 'asc' }, { nameEn: 'asc' }],
                include: {
                    organization: {
                        select: {
                            id: true,
                            nameEn: true,
                        },
                    },
                    _count: {
                        select: {
                            people: true,
                            contactInfos: true,
                        },
                    },
                },
            })

            console.log('[Org Department] Found', departments.length, 'departments')
            return NextResponse.json({ departments })
        }

        // Check org permission
        console.log('[Org Department] Checking permissions for org:', organizationId)
        const canView = await hasOrgPermission(session.user.id, organizationId!, ORG_PERMISSIONS.DEPARTMENT_VIEW)
        
        if (!canView) {
            console.log('[Org Department] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Get single department if ID provided
        if (departmentId) {
            console.log('[Org Department] Fetching single department:', departmentId)
            const department = await prisma.department.findFirst({
                where: {
                    id: departmentId,
                    organizationId: organizationId!,
                },
                include: {
                    organization: {
                        select: {
                            id: true,
                            nameEn: true,
                        },
                    },
                    _count: {
                        select: {
                            people: true,
                            contactInfos: true,
                        },
                    },
                },
            })

            if (!department) {
                console.log('[Org Department] Department not found')
                return NextResponse.json({ error: "Department not found" }, { status: 404 })
            }

            console.log('[Org Department] Department fetched successfully')
            return NextResponse.json(department)
        }

        // Get all departments for organization
        console.log('[Org Department] Fetching departments for organization...')
        const departments = await prisma.department.findMany({
            where: {
                organizationId: organizationId!,
            },
            orderBy: [{ order: 'asc' }, { nameEn: 'asc' }],
            include: {
                _count: {
                    select: {
                        people: true,
                        contactInfos: true,
                    },
                },
            },
        })

        console.log('[Org Department] Found', departments.length, 'departments')
        return NextResponse.json({ departments })
    } catch (error) {
        console.error("[Org Department] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * POST /api/console/organization/department
 * Create a new department
 */
export async function POST(req: Request) {
    console.log('[Org Department] POST - Creating department')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Department] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        console.log('[Org Department] Request body:', { organizationId: body?.organizationId, slug: body?.slug })

        const validation = createDepartmentSchema.safeParse(body)

        if (!validation.success) {
            console.log('[Org Department] Validation error:', validation.error.issues)
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { organizationId, ...data } = validation.data

        console.log('[Org Department] Checking permissions for org:', organizationId)
        const canCreate = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.DEPARTMENT_CREATE)
        
        if (!canCreate) {
            console.log('[Org Department] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        })

        if (!organization) {
            console.log('[Org Department] Organization not found')
            return NextResponse.json({ error: "Organization not found" }, { status: 404 })
        }

        // Check if slug already exists
        const existingSlug = await prisma.department.findUnique({
            where: { slug: data.slug },
        })

        if (existingSlug) {
            console.log('[Org Department] Slug already exists')
            return NextResponse.json({ error: "Department slug already exists" }, { status: 409 })
        }

        console.log('[Org Department] Creating department...')
        const department = await prisma.department.create({
            data: {
                ...data,
                organizationId,
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        nameEn: true,
                    },
                },
                _count: {
                    select: {
                        people: true,
                        contactInfos: true,
                    },
                },
            },
        })

        console.log('[Org Department] Department created successfully')
        return NextResponse.json(department, { status: 201 })
    } catch (error) {
        console.error("[Org Department] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * PATCH /api/console/organization/department
 * Update a department
 */
export async function PATCH(req: Request) {
    console.log('[Org Department] PATCH - Updating department')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Department] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { id, organizationId, ...updateData } = body

        if (!id || !organizationId) {
            console.log('[Org Department] Missing id or organizationId')
            return NextResponse.json({ error: "Department ID and Organization ID are required" }, { status: 400 })
        }

        console.log('[Org Department] Request body:', { id, organizationId })

        const validation = updateDepartmentSchema.safeParse({ id, organizationId, ...updateData })

        if (!validation.success) {
            console.log('[Org Department] Validation error:', validation.error.issues)
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        console.log('[Org Department] Checking permissions for org:', organizationId)
        const canEdit = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.DEPARTMENT_EDIT)
        
        if (!canEdit) {
            console.log('[Org Department] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify department exists and belongs to organization
        const existing = await prisma.department.findFirst({
            where: {
                id,
                organizationId,
            },
        })

        if (!existing) {
            console.log('[Org Department] Department not found')
            return NextResponse.json({ error: "Department not found" }, { status: 404 })
        }

        // Check slug uniqueness if slug is being updated
        if (updateData.slug && updateData.slug !== existing.slug) {
            const slugExists = await prisma.department.findUnique({
                where: { slug: updateData.slug },
            })

            if (slugExists) {
                console.log('[Org Department] Slug already exists')
                return NextResponse.json({ error: "Department slug already exists" }, { status: 409 })
            }
        }

        // Remove undefined values
        const cleanData = Object.fromEntries(
            Object.entries(updateData).filter(([_, v]) => v !== undefined)
        )

        console.log('[Org Department] Updating department...')
        const department = await prisma.department.update({
            where: { id },
            data: cleanData,
            include: {
                organization: {
                    select: {
                        id: true,
                        nameEn: true,
                    },
                },
                _count: {
                    select: {
                        people: true,
                        contactInfos: true,
                    },
                },
            },
        })

        console.log('[Org Department] Department updated successfully')
        return NextResponse.json(department)
    } catch (error) {
        console.error("[Org Department] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * DELETE /api/console/organization/department?id=[id]&organizationId=[id]
 * Delete a department
 */
export async function DELETE(req: Request) {
    console.log('[Org Department] DELETE - Deleting department')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Department] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        const organizationId = searchParams.get("organizationId")

        if (!id || !organizationId) {
            console.log('[Org Department] Missing id or organizationId')
            return NextResponse.json({ error: "Department ID and Organization ID are required" }, { status: 400 })
        }

        console.log('[Org Department] Checking permissions for org:', organizationId)
        const canDelete = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.DEPARTMENT_DELETE)
        
        if (!canDelete) {
            console.log('[Org Department] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify department exists and belongs to organization
        const department = await prisma.department.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                _count: {
                    select: {
                        people: true,
                        contactInfos: true,
                    },
                },
            },
        })

        if (!department) {
            console.log('[Org Department] Department not found')
            return NextResponse.json({ error: "Department not found" }, { status: 404 })
        }

        // Check if department has people or contact info
        if (department._count.people > 0 || department._count.contactInfos > 0) {
            console.log('[Org Department] Department has associated data')
            return NextResponse.json(
                { error: "Cannot delete department with associated people or contact information" },
                { status: 400 }
            )
        }

        console.log('[Org Department] Deleting department...')
        await prisma.department.delete({
            where: { id },
        })

        console.log('[Org Department] Department deleted successfully')
        return NextResponse.json({ message: "Department deleted successfully" })
    } catch (error) {
        console.error("[Org Department] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

