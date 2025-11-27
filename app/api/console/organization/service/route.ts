import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasOrgPermission, ORG_PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const createServiceSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    nameEn: z.string().min(1, "English name is required"),
    nameSi: z.string().optional(),
    nameTa: z.string().optional(),
    descriptionEn: z.string().optional(),
    descriptionSi: z.string().optional(),
    descriptionTa: z.string().optional(),
    requiredDocsEn: z.string().optional(),
    requiredDocsSi: z.string().optional(),
    requiredDocsTa: z.string().optional(),
    paymentDetailsEn: z.string().optional(),
    paymentDetailsSi: z.string().optional(),
    paymentDetailsTa: z.string().optional(),
    processingTimeEn: z.string().optional(),
    processingTimeSi: z.string().optional(),
    processingTimeTa: z.string().optional(),
    serviceUrl: z.string().url().optional().or(z.literal("")),
    status: z.enum(["ACTIVE", "HIDDEN"]).default("ACTIVE"),
    order: z.number().int().default(0),
    ctas: z.array(z.object({
        label: z.string().min(1),
        url: z.string().url(),
    })).optional(),
})

const updateServiceSchema = createServiceSchema.partial().extend({
    organizationId: z.string().min(1),
    slug: z.string().optional(),
})

/**
 * GET /api/console/organization/service?organizationId=[id]&all=[true|false]&id=[serviceId]
 * Get services for an organization
 */
export async function GET(req: Request) {
    console.log('[Org Service] GET - Fetching services')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Service] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const organizationId = searchParams.get("organizationId")
        const all = searchParams.get("all") === "true"
        const serviceId = searchParams.get("id")

        if (!organizationId && !all) {
            console.log('[Org Service] Missing organizationId')
            return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
        }

        const prisma = getPrisma()

        // If requesting all, check system permission
        if (all) {
            const { hasSystemPermission } = await import("@/lib/permissions")
            const canViewAll = await hasSystemPermission(session.user.id, "system.organizations.view")
            
            if (!canViewAll) {
                console.log('[Org Service] Forbidden - No system permission')
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }

            console.log('[Org Service] Fetching all services...')
            const services = await prisma.service.findMany({
                orderBy: [{ order: 'asc' }, { nameEn: 'asc' }],
                include: {
                    organization: {
                        select: {
                            id: true,
                            nameEn: true,
                        },
                    },
                    ctas: {
                        select: {
                            id: true,
                            label: true,
                            url: true,
                        },
                    },
                },
            })

            console.log('[Org Service] Found', services.length, 'services')
            return NextResponse.json({ services })
        }

        // Check org permission
        console.log('[Org Service] Checking permissions for org:', organizationId)
        const canView = await hasOrgPermission(session.user.id, organizationId!, ORG_PERMISSIONS.SERVICE_VIEW)
        
        if (!canView) {
            console.log('[Org Service] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Get single service if ID provided
        if (serviceId) {
            console.log('[Org Service] Fetching single service:', serviceId)
            const service = await prisma.service.findFirst({
                where: {
                    id: serviceId,
                    organizationId: organizationId!,
                },
                include: {
                    organization: {
                        select: {
                            id: true,
                            nameEn: true,
                        },
                    },
                    ctas: {
                        select: {
                            id: true,
                            label: true,
                            url: true,
                        },
                    },
                },
            })

            if (!service) {
                console.log('[Org Service] Service not found')
                return NextResponse.json({ error: "Service not found" }, { status: 404 })
            }

            console.log('[Org Service] Service fetched successfully')
            return NextResponse.json(service)
        }

        // Get all services for organization
        console.log('[Org Service] Fetching services for organization...')
        const services = await prisma.service.findMany({
            where: {
                organizationId: organizationId!,
            },
            orderBy: [{ order: 'asc' }, { nameEn: 'asc' }],
            include: {
                ctas: {
                    select: {
                        id: true,
                        label: true,
                        url: true,
                    },
                },
            },
        })

        console.log('[Org Service] Found', services.length, 'services')
        return NextResponse.json({ services })
    } catch (error) {
        console.error("[Org Service] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * POST /api/console/organization/service
 * Create a new service
 */
export async function POST(req: Request) {
    console.log('[Org Service] POST - Creating service')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Service] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        console.log('[Org Service] Request body:', { organizationId: body?.organizationId, slug: body?.slug })

        const validation = createServiceSchema.safeParse(body)

        if (!validation.success) {
            console.log('[Org Service] Validation error:', validation.error.issues)
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { organizationId, ctas, ...data } = validation.data

        console.log('[Org Service] Checking permissions for org:', organizationId)
        const canCreate = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.SERVICE_CREATE)
        
        if (!canCreate) {
            console.log('[Org Service] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        })

        if (!organization) {
            console.log('[Org Service] Organization not found')
            return NextResponse.json({ error: "Organization not found" }, { status: 404 })
        }

        // Check if slug already exists
        const existingSlug = await prisma.service.findUnique({
            where: { slug: data.slug },
        })

        if (existingSlug) {
            console.log('[Org Service] Slug already exists')
            return NextResponse.json({ error: "Service slug already exists" }, { status: 409 })
        }

        console.log('[Org Service] Creating service...')
        const service = await prisma.service.create({
            data: {
                ...data,
                organizationId,
                ctas: ctas ? {
                    create: ctas,
                } : undefined,
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        nameEn: true,
                    },
                },
                ctas: {
                    select: {
                        id: true,
                        label: true,
                        url: true,
                    },
                },
            },
        })

        console.log('[Org Service] Service created successfully')
        return NextResponse.json(service, { status: 201 })
    } catch (error) {
        console.error("[Org Service] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * PATCH /api/console/organization/service
 * Update a service
 */
export async function PATCH(req: Request) {
    console.log('[Org Service] PATCH - Updating service')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Service] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { id, organizationId, ctas, ...updateData } = body

        if (!id || !organizationId) {
            console.log('[Org Service] Missing id or organizationId')
            return NextResponse.json({ error: "Service ID and Organization ID are required" }, { status: 400 })
        }

        console.log('[Org Service] Request body:', { id, organizationId })

        const validation = updateServiceSchema.safeParse({ id, organizationId, ...updateData, ctas })

        if (!validation.success) {
            console.log('[Org Service] Validation error:', validation.error.issues)
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        console.log('[Org Service] Checking permissions for org:', organizationId)
        const canEdit = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.SERVICE_EDIT)
        
        if (!canEdit) {
            console.log('[Org Service] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify service exists and belongs to organization
        const existing = await prisma.service.findFirst({
            where: {
                id,
                organizationId,
            },
        })

        if (!existing) {
            console.log('[Org Service] Service not found')
            return NextResponse.json({ error: "Service not found" }, { status: 404 })
        }

        // Check slug uniqueness if slug is being updated
        if (updateData.slug && updateData.slug !== existing.slug) {
            const slugExists = await prisma.service.findUnique({
                where: { slug: updateData.slug },
            })

            if (slugExists) {
                console.log('[Org Service] Slug already exists')
                return NextResponse.json({ error: "Service slug already exists" }, { status: 409 })
            }
        }

        // Remove undefined values
        const cleanData = Object.fromEntries(
            Object.entries(updateData).filter(([_, v]) => v !== undefined)
        )

        // Handle CTAs update
        const updatePayload: any = cleanData
        if (ctas !== undefined) {
            // Delete existing CTAs and create new ones
            await prisma.serviceCTA.deleteMany({
                where: { serviceId: id },
            })
            updatePayload.ctas = {
                create: ctas,
            }
        }

        console.log('[Org Service] Updating service...')
        const service = await prisma.service.update({
            where: { id },
            data: updatePayload,
            include: {
                organization: {
                    select: {
                        id: true,
                        nameEn: true,
                    },
                },
                ctas: {
                    select: {
                        id: true,
                        label: true,
                        url: true,
                    },
                },
            },
        })

        console.log('[Org Service] Service updated successfully')
        return NextResponse.json(service)
    } catch (error) {
        console.error("[Org Service] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * DELETE /api/console/organization/service?id=[id]&organizationId=[id]
 * Delete a service
 */
export async function DELETE(req: Request) {
    console.log('[Org Service] DELETE - Deleting service')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Service] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        const organizationId = searchParams.get("organizationId")

        if (!id || !organizationId) {
            console.log('[Org Service] Missing id or organizationId')
            return NextResponse.json({ error: "Service ID and Organization ID are required" }, { status: 400 })
        }

        console.log('[Org Service] Checking permissions for org:', organizationId)
        const canDelete = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.SERVICE_DELETE)
        
        if (!canDelete) {
            console.log('[Org Service] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify service exists and belongs to organization
        const service = await prisma.service.findFirst({
            where: {
                id,
                organizationId,
            },
        })

        if (!service) {
            console.log('[Org Service] Service not found')
            return NextResponse.json({ error: "Service not found" }, { status: 404 })
        }

        console.log('[Org Service] Deleting service...')
        await prisma.service.delete({
            where: { id },
        })

        console.log('[Org Service] Service deleted successfully')
        return NextResponse.json({ message: "Service deleted successfully" })
    } catch (error) {
        console.error("[Org Service] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

