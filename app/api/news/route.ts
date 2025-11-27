import { getPrisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

/**
 * GET /api/news?slug=[slug]
 * Public endpoint to get a news article by slug
 */
export async function GET(req: Request) {
    console.log('[Public News] GET - Fetching news by slug')
    
    try {
        const { searchParams } = new URL(req.url)
        const slug = searchParams.get("slug")

        if (!slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 })
        }

        const prisma = getPrisma()

        const news = await prisma.news.findUnique({
            where: { slug },
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
            return NextResponse.json({ error: "News not found" }, { status: 404 })
        }

        // Increment views
        await prisma.news.update({
            where: { id: news.id },
            data: {
                views: {
                    increment: 1,
                },
            },
        })

        // Get related articles (same organizations, different news)
        const relatedArticles = await prisma.news.findMany({
            where: {
                id: { not: news.id },
                status: "PUBLISHED",
                organizations: {
                    some: {
                        id: { in: news.organizations.map(o => o.id) },
                    },
                },
            },
            take: 5,
            orderBy: [{ publishedDate: 'desc' }],
            select: {
                id: true,
                slug: true,
                banner: true,
                titleEn: true,
                publishedDate: true,
            },
        })

        console.log('[Public News] News fetched successfully')
        return NextResponse.json({
            ...news,
            relatedArticles,
        })
    } catch (error) {
        console.error("[Public News] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

