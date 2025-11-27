import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const createCategorySchema = z.object({
    nameEn: z.string().min(1, "English name is required"),
    nameSi: z.string().optional(),
    nameTa: z.string().optional(),
    description: z.string().optional(),
})

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const canView = await hasSystemPermission(session.user.id, "system.organizations.view")
        if (!canView) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const prisma = getPrisma()
        const categories = await prisma.category.findMany({
            orderBy: {
                nameEn: 'asc'
            },
            include: {
                _count: {
                    select: {
                        organizationCategories: true
                    }
                }
            }
        })

        return NextResponse.json(categories)
    } catch (error) {
        console.error("[API] Error fetching categories:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const canManage = await hasSystemPermission(session.user.id, "system.organizations.manage")
        if (!canManage) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await req.json()
        const validation = createCategorySchema.safeParse(body)

        if (!validation.success) {
            return new NextResponse(validation.error.issues[0].message, { status: 400 })
        }

        const prisma = getPrisma()

        const category = await prisma.category.create({
            data: validation.data,
            include: {
                _count: {
                    select: {
                        organizationCategories: true
                    }
                }
            }
        })

        return NextResponse.json(category)
    } catch (error) {
        console.error("[API] Error creating category:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
