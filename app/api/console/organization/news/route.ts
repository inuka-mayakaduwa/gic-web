import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasOrgPermission, ORG_PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const createNewsSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    titleEn: z.string().min(1, "English title is required"),
    titleSi: z.string().optional(),
    titleTa: z.string().optional(),
    summaryEn: z.string().optional(),
    summarySi: z.string().optional(),
    summaryTa: z.string().optional(),
    contentEn: z.string().min(1, "English content is required"),
    contentSi: z.string().optional(),
    contentTa: z.string().optional(),
    banner: z.string().optional(),
    publishedDate: z.string().datetime().optional().or(z.literal("")),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    major: z.boolean().default(false),
    featuredPriority: z.number().int().optional(),
    organizationIds: z.array(z.string()).min(1, "At least one organization is required"),
})

const updateNewsSchema = createNewsSchema.partial().extend({
    organizationId: z.string().min(1),
    slug: z.string().optional(),
    organizationIds: z.array(z.string()).optional(),
})

/**
 * GET /api/console/organization/news?organizationId=[id]&all=[true|false]&id=[newsId]&slug=[slug]
 * Get news articles
 */
export async function GET(req: Request) {
    console.log('[Org News] GET - Fetching news')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org News] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const organizationId = searchParams.get("organizationId")
        const all = searchParams.get("all") === "true"
        const newsId = searchParams.get("id")
        const slug = searchParams.get("slug")

        const prisma = getPrisma()

        // If requesting all, check system permission
        if (all) {
            const { hasSystemPermission } = await import("@/lib/permissions")
            const canViewAll = await hasSystemPermission(session.user.id, "system.organizations.view")
            
            if (!canViewAll) {
                console.log('[Org News] Forbidden - No system permission')
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }

            console.log('[Org News] Fetching all news...')
            const news = await prisma.news.findMany({
                orderBy: [{ publishedDate: 'desc' }, { createdAt: 'desc' }],
                include: {
                    organizations: {
                        select: {
                            id: true,
                            nameEn: true,
                            slug: true,
                            logo: true,
                        },
                    },
                },
            })

            console.log('[Org News] Found', news.length, 'news articles')
            return NextResponse.json({ news })
        }

        if (!organizationId && !slug) {
            console.log('[Org News] Missing organizationId or slug')
            return NextResponse.json({ error: "Organization ID or slug is required" }, { status: 400 })
        }

        // Get single news article if ID or slug provided
        if (newsId || slug) {
            const where: any = {}
            if (newsId) where.id = newsId
            if (slug) where.slug = slug

            console.log('[Org News] Fetching single news:', where)
            const news = await prisma.news.findFirst({
                where,
                include: {
                    organizations: {
                        select: {
                            id: true,
                            nameEn: true,
                            nameSi: true,
                            nameTa: true,
                            slug: true,
                            logo: true,
                        },
                    },
                },
            })

            if (!news) {
                console.log('[Org News] News not found')
                return NextResponse.json({ error: "News not found" }, { status: 404 })
            }

            // Check if user has access to any organization in the news
            if (organizationId) {
                const canView = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.NEWS_VIEW)
                if (!canView) {
                    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
                }
            }

            console.log('[Org News] News fetched successfully')
            return NextResponse.json(news)
        }

        // Get all news for organization
        console.log('[Org News] Fetching news for organization...')
        const canView = await hasOrgPermission(session.user.id, organizationId!, ORG_PERMISSIONS.NEWS_VIEW)
        
        if (!canView) {
            console.log('[Org News] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const news = await prisma.news.findMany({
            where: {
                organizations: {
                    some: {
                        id: organizationId!,
                    },
                },
            },
            orderBy: [{ publishedDate: 'desc' }, { createdAt: 'desc' }],
            include: {
                organizations: {
                    select: {
                        id: true,
                        nameEn: true,
                        slug: true,
                        logo: true,
                    },
                },
            },
        })

        console.log('[Org News] Found', news.length, 'news articles')
        return NextResponse.json({ news })
    } catch (error) {
        console.error("[Org News] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * POST /api/console/organization/news
 * Create a new news article
 */
export async function POST(req: Request) {
    console.log('[Org News] POST - Creating news')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const validation = createNewsSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { organizationId, organizationIds, publishedDate, ...data } = validation.data

        // Check permission
        const canManage = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.NEWS_MANAGE)
        if (!canManage) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify all organizations exist
        const orgs = await prisma.organization.findMany({
            where: {
                id: { in: organizationIds },
            },
        })

        if (orgs.length !== organizationIds.length) {
            return NextResponse.json({ error: "One or more organizations not found" }, { status: 404 })
        }

        // Check if slug already exists
        const existing = await prisma.news.findUnique({
            where: { slug: data.slug },
        })

        if (existing) {
            return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
        }

        const news = await prisma.news.create({
            data: {
                ...data,
                publishedDate: publishedDate ? new Date(publishedDate) : null,
                organizations: {
                    connect: organizationIds.map(id => ({ id })),
                },
            },
            include: {
                organizations: {
                    select: {
                        id: true,
                        nameEn: true,
                        slug: true,
                        logo: true,
                    },
                },
            },
        })

        console.log('[Org News] News created successfully')
        return NextResponse.json(news)
    } catch (error) {
        console.error("[Org News] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * PATCH /api/console/organization/news
 * Update a news article
 */
export async function PATCH(req: Request) {
    console.log('[Org News] PATCH - Updating news')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = session.user.id

        const body = await req.json()
        const validation = updateNewsSchema.extend({
            id: z.string().min(1),
        }).safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { id, organizationId, organizationIds, publishedDate, ...data } = validation.data

        const prisma = getPrisma()

        // Get existing news
        const existing = await prisma.news.findUnique({
            where: { id },
            include: {
                organizations: true,
            },
        })

        if (!existing) {
            return NextResponse.json({ error: "News not found" }, { status: 404 })
        }

        // Check permission - user must have access to at least one organization
        const userOrgs = existing.organizations.map(o => o.id)
        const hasAccess = await Promise.all(
            userOrgs.map(orgId => hasOrgPermission(userId, orgId, ORG_PERMISSIONS.NEWS_MANAGE))
        )

        if (!hasAccess.some(Boolean)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Check slug uniqueness if changing
        if (data.slug && data.slug !== existing.slug) {
            const slugExists = await prisma.news.findUnique({
                where: { slug: data.slug },
            })

            if (slugExists) {
                return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
            }
        }

        // Prepare update data
        const updateData: any = { ...data }
        if (publishedDate !== undefined) {
            updateData.publishedDate = publishedDate ? new Date(publishedDate) : null
        }

        // Update organizations if provided
        if (organizationIds) {
            updateData.organizations = {
                set: organizationIds.map((orgId: string) => ({ id: orgId })),
            }
        }

        const news = await prisma.news.update({
            where: { id },
            data: updateData,
            include: {
                organizations: {
                    select: {
                        id: true,
                        nameEn: true,
                        slug: true,
                        logo: true,
                    },
                },
            },
        })

        console.log('[Org News] News updated successfully')
        return NextResponse.json(news)
    } catch (error) {
        console.error("[Org News] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * DELETE /api/console/organization/news?id=[id]&organizationId=[id]
 * Delete a news article
 */
export async function DELETE(req: Request) {
    console.log('[Org News] DELETE - Deleting news')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        const organizationId = searchParams.get("organizationId")

        if (!id || !organizationId) {
            return NextResponse.json({ error: "ID and Organization ID are required" }, { status: 400 })
        }

        const prisma = getPrisma()

        // Get existing news
        const existing = await prisma.news.findUnique({
            where: { id },
            include: {
                organizations: true,
            },
        })

        if (!existing) {
            return NextResponse.json({ error: "News not found" }, { status: 404 })
        }

        // Check permission
        const canManage = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.NEWS_MANAGE)
        if (!canManage) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        await prisma.news.delete({
            where: { id },
        })

        console.log('[Org News] News deleted successfully')
        return NextResponse.json({ message: "News deleted successfully" })
    } catch (error) {
        console.error("[Org News] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

