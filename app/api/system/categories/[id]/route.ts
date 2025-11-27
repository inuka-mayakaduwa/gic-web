import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateCategorySchema = z.object({
    nameEn: z.string().min(1, "English name is required").optional(),
    nameSi: z.string().optional(),
    nameTa: z.string().optional(),
    description: z.string().optional(),
})

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const canView = await hasSystemPermission(session.user.id, "system.organizations.view")
        if (!canView) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const prisma = getPrisma()
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        organizationCategories: true
                    }
                }
            }
        })

        if (!category) {
            return new NextResponse("Category not found", { status: 404 })
        }

        return NextResponse.json(category)
    } catch (error) {
        console.error("[API] Error fetching category:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const canManage = await hasSystemPermission(session.user.id, "system.organizations.manage")
        if (!canManage) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await req.json()
        const validation = updateCategorySchema.safeParse(body)

        if (!validation.success) {
            return new NextResponse(validation.error.issues[0].message, { status: 400 })
        }

        const prisma = getPrisma()

        const existing = await prisma.category.findUnique({
            where: { id }
        })

        if (!existing) {
            return new NextResponse("Category not found", { status: 404 })
        }

        const category = await prisma.category.update({
            where: { id },
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
        console.error("[API] Error updating category:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const canManage = await hasSystemPermission(session.user.id, "system.organizations.manage")
        if (!canManage) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const prisma = getPrisma()

        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        organizationCategories: true
                    }
                }
            }
        })

        if (!category) {
            return new NextResponse("Category not found", { status: 404 })
        }

        if (category._count.organizationCategories > 0) {
            return new NextResponse("Cannot delete category with assigned organizations", { status: 400 })
        }

        await prisma.category.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[API] Error deleting category:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
