import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasOrgPermission, ORG_PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const createPersonSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    titleEn: z.string().optional(),
    titleSi: z.string().optional(),
    titleTa: z.string().optional(),
    fullNameEn: z.string().min(1, "English full name is required"),
    fullNameSi: z.string().optional(),
    fullNameTa: z.string().optional(),
    designationEn: z.string().optional(),
    designationSi: z.string().optional(),
    designationTa: z.string().optional(),
    bioEn: z.string().optional(),
    bioSi: z.string().optional(),
    bioTa: z.string().optional(),
    image: z.string().optional(),
    order: z.number().int().default(0),
})

const updatePersonSchema = createPersonSchema.partial().extend({
    organizationId: z.string().min(1),
    slug: z.string().optional(),
})

/**
 * GET /api/console/organization/people?organizationId=[id]&all=[true|false]&id=[personId]
 * Get people for an organization
 */
export async function GET(req: Request) {
    console.log('[Org People] GET - Fetching people')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org People] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const organizationId = searchParams.get("organizationId")
        const all = searchParams.get("all") === "true"
        const personId = searchParams.get("id")

        if (!organizationId && !all) {
            console.log('[Org People] Missing organizationId')
            return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
        }

        const prisma = getPrisma()

        // If requesting all, check system permission
        if (all) {
            const { hasSystemPermission } = await import("@/lib/permissions")
            const canViewAll = await hasSystemPermission(session.user.id, "system.organizations.view")
            
            if (!canViewAll) {
                console.log('[Org People] Forbidden - No system permission')
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }

            console.log('[Org People] Fetching all people...')
            const people = await prisma.person.findMany({
                orderBy: [{ order: 'asc' }, { fullNameEn: 'asc' }],
                include: {
                    organization: {
                        select: {
                            id: true,
                            nameEn: true,
                        },
                    },
                    departments: {
                        select: {
                            id: true,
                            nameEn: true,
                            slug: true,
                        },
                    },
                    _count: {
                        select: {
                            contactInfos: true,
                        },
                    },
                },
            })

            console.log('[Org People] Found', people.length, 'people')
            return NextResponse.json({ people })
        }

        // Check org permission
        console.log('[Org People] Checking permissions for org:', organizationId)
        const canView = await hasOrgPermission(session.user.id, organizationId!, ORG_PERMISSIONS.PERSON_VIEW)
        
        if (!canView) {
            console.log('[Org People] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Get single person if ID provided
        if (personId) {
            console.log('[Org People] Fetching single person:', personId)
            const person = await prisma.person.findFirst({
                where: {
                    id: personId,
                    organizationId: organizationId!,
                },
                include: {
                    organization: {
                        select: {
                            id: true,
                            nameEn: true,
                        },
                    },
                    departments: {
                        select: {
                            id: true,
                            nameEn: true,
                            slug: true,
                        },
                    },
                    contactInfos: {
                        select: {
                            id: true,
                            type: true,
                            value: true,
                            descriptionEn: true,
                        },
                    },
                },
            })

            if (!person) {
                console.log('[Org People] Person not found')
                return NextResponse.json({ error: "Person not found" }, { status: 404 })
            }

            console.log('[Org People] Person fetched successfully')
            return NextResponse.json(person)
        }

        // Get all people for organization
        console.log('[Org People] Fetching people for organization...')
        const people = await prisma.person.findMany({
            where: {
                organizationId: organizationId!,
            },
            orderBy: [{ order: 'asc' }, { fullNameEn: 'asc' }],
            include: {
                departments: {
                    select: {
                        id: true,
                        nameEn: true,
                        slug: true,
                    },
                },
                _count: {
                    select: {
                        contactInfos: true,
                    },
                },
            },
        })

        console.log('[Org People] Found', people.length, 'people')
        return NextResponse.json({ people })
    } catch (error) {
        console.error("[Org People] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * POST /api/console/organization/people
 * Create a new person
 */
export async function POST(req: Request) {
    console.log('[Org People] POST - Creating person')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org People] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        console.log('[Org People] Request body:', { organizationId: body?.organizationId, slug: body?.slug })

        const validation = createPersonSchema.safeParse(body)

        if (!validation.success) {
            console.log('[Org People] Validation error:', validation.error.issues)
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { organizationId, ...data } = validation.data

        console.log('[Org People] Checking permissions for org:', organizationId)
        const canCreate = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.PERSON_CREATE)
        
        if (!canCreate) {
            console.log('[Org People] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        })

        if (!organization) {
            console.log('[Org People] Organization not found')
            return NextResponse.json({ error: "Organization not found" }, { status: 404 })
        }

        // Check if slug already exists
        const existingSlug = await prisma.person.findUnique({
            where: { slug: data.slug },
        })

        if (existingSlug) {
            console.log('[Org People] Slug already exists')
            return NextResponse.json({ error: "Person slug already exists" }, { status: 409 })
        }

        console.log('[Org People] Creating person...')
        const person = await prisma.person.create({
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
                departments: true,
                _count: {
                    select: {
                        contactInfos: true,
                    },
                },
            },
        })

        console.log('[Org People] Person created successfully')
        return NextResponse.json(person, { status: 201 })
    } catch (error) {
        console.error("[Org People] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * PATCH /api/console/organization/people
 * Update a person
 */
export async function PATCH(req: Request) {
    console.log('[Org People] PATCH - Updating person')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org People] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { id, organizationId, ...updateData } = body

        if (!id || !organizationId) {
            console.log('[Org People] Missing id or organizationId')
            return NextResponse.json({ error: "Person ID and Organization ID are required" }, { status: 400 })
        }

        console.log('[Org People] Request body:', { id, organizationId })

        const validation = updatePersonSchema.safeParse({ id, organizationId, ...updateData })

        if (!validation.success) {
            console.log('[Org People] Validation error:', validation.error.issues)
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        console.log('[Org People] Checking permissions for org:', organizationId)
        const canEdit = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.PERSON_EDIT)
        
        if (!canEdit) {
            console.log('[Org People] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify person exists and belongs to organization
        const existing = await prisma.person.findFirst({
            where: {
                id,
                organizationId,
            },
        })

        if (!existing) {
            console.log('[Org People] Person not found')
            return NextResponse.json({ error: "Person not found" }, { status: 404 })
        }

        // Check slug uniqueness if slug is being updated
        if (updateData.slug && updateData.slug !== existing.slug) {
            const slugExists = await prisma.person.findUnique({
                where: { slug: updateData.slug },
            })

            if (slugExists) {
                console.log('[Org People] Slug already exists')
                return NextResponse.json({ error: "Person slug already exists" }, { status: 409 })
            }
        }

        // Remove undefined values
        const cleanData = Object.fromEntries(
            Object.entries(updateData).filter(([_, v]) => v !== undefined)
        )

        console.log('[Org People] Updating person...')
        const person = await prisma.person.update({
            where: { id },
            data: cleanData,
            include: {
                organization: {
                    select: {
                        id: true,
                        nameEn: true,
                    },
                },
                departments: {
                    select: {
                        id: true,
                        nameEn: true,
                        slug: true,
                    },
                },
                contactInfos: {
                    select: {
                        id: true,
                        type: true,
                        value: true,
                        descriptionEn: true,
                    },
                },
            },
        })

        console.log('[Org People] Person updated successfully')
        return NextResponse.json(person)
    } catch (error) {
        console.error("[Org People] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * DELETE /api/console/organization/people?id=[id]&organizationId=[id]
 * Delete a person
 */
export async function DELETE(req: Request) {
    console.log('[Org People] DELETE - Deleting person')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org People] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        const organizationId = searchParams.get("organizationId")

        if (!id || !organizationId) {
            console.log('[Org People] Missing id or organizationId')
            return NextResponse.json({ error: "Person ID and Organization ID are required" }, { status: 400 })
        }

        console.log('[Org People] Checking permissions for org:', organizationId)
        const canDelete = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.PERSON_DELETE)
        
        if (!canDelete) {
            console.log('[Org People] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify person exists and belongs to organization
        const person = await prisma.person.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                _count: {
                    select: {
                        contactInfos: true,
                        departments: true,
                    },
                },
            },
        })

        if (!person) {
            console.log('[Org People] Person not found')
            return NextResponse.json({ error: "Person not found" }, { status: 404 })
        }

        console.log('[Org People] Deleting person...')
        await prisma.person.delete({
            where: { id },
        })

        console.log('[Org People] Person deleted successfully')
        return NextResponse.json({ message: "Person deleted successfully" })
    } catch (error) {
        console.error("[Org People] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

