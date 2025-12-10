import { getPrisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

/**
 * GET /api/citizen/search?language=[en|si|ta]&category=[categoryId]&q=[searchTerm]
 * Public search endpoint for searching Organizations, People, Services, and News
 */
export async function GET(req: Request) {
    console.log('[Citizen Search] GET - Performing search')
    
    try {
        const { searchParams } = new URL(req.url)
        const language = searchParams.get("language")
        const categoryId = searchParams.get("category")
        const query = searchParams.get("q") || searchParams.get("query") || ""

        // Validate language parameter
        if (!language || !['en', 'si', 'ta'].includes(language)) {
            return NextResponse.json(
                { error: "Language parameter is required and must be one of: en, si, ta" },
                { status: 400 }
            )
        }

        const prisma = getPrisma()

        // Helper function to get localized field name
        const getLocalizedField = (field: string) => {
            const suffix = language.charAt(0).toUpperCase() + language.slice(1)
            return `${field}${suffix}` as keyof any
        }

        // Helper function to get localized value
        const getLocalizedValue = (obj: any, field: string, fallback?: string) => {
            const localizedField = getLocalizedField(field)
            return obj[localizedField] || obj[fallback || `${field}En`] || ""
        }

        // Build where clause for Organizations
        const orgWhere: any = {}
        if (categoryId) {
            orgWhere.organizationCategories = {
                some: {
                    categoryId: categoryId
                }
            }
        }
        if (query) {
            orgWhere.OR = language === 'en' ? [
                { nameEn: { contains: query, mode: 'insensitive' as const } },
                { descriptionEn: { contains: query, mode: 'insensitive' as const } },
            ] : language === 'si' ? [
                { nameSi: { contains: query, mode: 'insensitive' as const } },
                { descriptionSi: { contains: query, mode: 'insensitive' as const } },
            ] : [
                { nameTa: { contains: query, mode: 'insensitive' as const } },
                { descriptionTa: { contains: query, mode: 'insensitive' as const } },
            ]
        }

        // Fetch Organizations
        const organizations = await prisma.organization.findMany({
            where: orgWhere,
            include: {
                organizationCategories: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                nameEn: true,
                                nameSi: true,
                                nameTa: true,
                            }
                        }
                    }
                },
                services: {
                    select: {
                        id: true
                    }
                }
            }
        })

        // Format Organizations
        const formattedOrganizations = organizations.map(org => ({
            id: org.id,
            slug: org.slug,
            name: getLocalizedValue(org, 'name'),
            logo: org.logo,
            categories: org.organizationCategories.map(oc => ({
                id: oc.category.id,
                name: getLocalizedValue(oc.category, 'name')
            })),
            servicesCount: org.services.length
        }))

        // Fetch People
        const peopleWhere: any = {}
        if (categoryId) {
            peopleWhere.organization = {
                organizationCategories: {
                    some: {
                        categoryId: categoryId
                    }
                }
            }
        }
        if (query) {
            peopleWhere.OR = language === 'en' ? [
                { fullNameEn: { contains: query, mode: 'insensitive' as const } },
                { designationEn: { contains: query, mode: 'insensitive' as const } },
            ] : language === 'si' ? [
                { fullNameSi: { contains: query, mode: 'insensitive' as const } },
                { designationSi: { contains: query, mode: 'insensitive' as const } },
            ] : [
                { fullNameTa: { contains: query, mode: 'insensitive' as const } },
                { designationTa: { contains: query, mode: 'insensitive' as const } },
            ]
        }

        const people = await prisma.person.findMany({
            where: peopleWhere,
            include: {
                organization: {
                    select: {
                        id: true,
                        slug: true,
                        nameEn: true,
                        nameSi: true,
                        nameTa: true,
                    }
                },
                departments: {
                    select: {
                        id: true,
                        nameEn: true,
                        nameSi: true,
                        nameTa: true,
                    }
                }
            }
        })

        // Format People
        const formattedPeople = people.map(person => ({
            id: person.id,
            name: getLocalizedValue(person, 'fullName'),
            organizationName: getLocalizedValue(person.organization, 'name'),
            organizationId: person.organization.id,
            slug: `${person.organization.slug}/${person.slug}`,
            departmentNames: person.departments.map(dept => getLocalizedValue(dept, 'name')).join(', '),
            designation: getLocalizedValue(person, 'designation'),
            image: person.image
        }))

        // Fetch Services
        const servicesWhere: any = {
            status: "ACTIVE"
        }
        if (categoryId) {
            servicesWhere.organization = {
                organizationCategories: {
                    some: {
                        categoryId: categoryId
                    }
                }
            }
        }
        if (query) {
            servicesWhere.OR = language === 'en' ? [
                { nameEn: { contains: query, mode: 'insensitive' as const } },
                { descriptionEn: { contains: query, mode: 'insensitive' as const } },
            ] : language === 'si' ? [
                { nameSi: { contains: query, mode: 'insensitive' as const } },
                { descriptionSi: { contains: query, mode: 'insensitive' as const } },
            ] : [
                { nameTa: { contains: query, mode: 'insensitive' as const } },
                { descriptionTa: { contains: query, mode: 'insensitive' as const } },
            ]
        }

        const services = await prisma.service.findMany({
            where: servicesWhere,
            include: {
                organization: {
                    select: {
                        id: true,
                        slug: true,
                        nameEn: true,
                        nameSi: true,
                        nameTa: true,
                    }
                }
            }
        })

        // Format Services
        const formattedServices = services.map(service => ({
            name: getLocalizedValue(service, 'name'),
            description: getLocalizedValue(service, 'description'),
            slug: `${service.organization.slug}/${service.slug}`,
            organizationName: getLocalizedValue(service.organization, 'name'),
            organizationSlug: service.organization.slug
        }))

        // Fetch News
        const newsWhere: any = {
            status: "PUBLISHED"
        }
        if (categoryId) {
            newsWhere.organizations = {
                some: {
                    organizationCategories: {
                        some: {
                            categoryId: categoryId
                        }
                    }
                }
            }
        }
        if (query) {
            newsWhere.OR = language === 'en' ? [
                { titleEn: { contains: query, mode: 'insensitive' as const } },
                { summaryEn: { contains: query, mode: 'insensitive' as const } },
            ] : language === 'si' ? [
                { titleSi: { contains: query, mode: 'insensitive' as const } },
                { summarySi: { contains: query, mode: 'insensitive' as const } },
            ] : [
                { titleTa: { contains: query, mode: 'insensitive' as const } },
                { summaryTa: { contains: query, mode: 'insensitive' as const } },
            ]
        }

        const news = await prisma.news.findMany({
            where: newsWhere,
            include: {
                organizations: {
                    select: {
                        id: true,
                        slug: true,
                        nameEn: true,
                        nameSi: true,
                        nameTa: true,
                    }
                }
            },
            orderBy: {
                publishedDate: 'desc'
            }
        })

        // Format News
        const formattedNews = news.map(newsItem => ({
            title: getLocalizedValue(newsItem, 'title'),
            summary: getLocalizedValue(newsItem, 'summary'),
            banner: newsItem.banner,
            publishedDate: newsItem.publishedDate,
            organizations: newsItem.organizations.map(org => ({
                id: org.id,
                name: getLocalizedValue(org, 'name'),
                slug: org.slug
            })),
            views: newsItem.views,
            slug: `news/${newsItem.slug}`
        }))

        console.log('[Citizen Search] Search completed successfully')
        return NextResponse.json({
            organizations: formattedOrganizations,
            people: formattedPeople,
            services: formattedServices,
            news: formattedNews
        })
    } catch (error) {
        console.error("[Citizen Search] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

