import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateOrgSchema = z.object({
    nameEn: z.string().min(1, "English name is required").optional(),
    nameSi: z.string().optional(),
    nameTa: z.string().optional(),
    slug: z.string().min(1, "Slug is required").optional(),
    description: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
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
        const organization = await prisma.organization.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        userGroupAssignments: true,
                        customGroups: true
                    }
                }
            }
        })

        if (!organization) {
            return new NextResponse("Organization not found", { status: 404 })
        }

        return NextResponse.json(organization)
    } catch (error) {
        console.error("[API] Error fetching organization:", error)
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
        const validation = updateOrgSchema.safeParse(body)

        if (!validation.success) {
            return new NextResponse(validation.error.issues[0].message, { status: 400 })
        }

        const prisma = getPrisma()

        // Check if organization exists
        const existing = await prisma.organization.findUnique({
            where: { id }
        })

        if (!existing) {
            return new NextResponse("Organization not found", { status: 404 })
        }

        // If slug is changing, check uniqueness
        if (validation.data.slug && validation.data.slug !== existing.slug) {
            const slugExists = await prisma.organization.findUnique({
                where: { slug: validation.data.slug }
            })
            if (slugExists) {
                return new NextResponse("Organization slug already exists", { status: 409 })
            }
        }

        const organization = await prisma.organization.update({
            where: { id },
            data: validation.data,
            include: {
                _count: {
                    select: {
                        userGroupAssignments: true,
                        customGroups: true
                    }
                }
            }
        })

        return NextResponse.json(organization)
    } catch (error) {
        console.error("[API] Error updating organization:", error)
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

        // Check if organization has users or custom groups
        const organization = await prisma.organization.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        userGroupAssignments: true,
                        customGroups: true
                    }
                }
            }
        })

        if (!organization) {
            return new NextResponse("Organization not found", { status: 404 })
        }

        if (organization._count.userGroupAssignments > 0 || organization._count.customGroups > 0) {
            return new NextResponse("Cannot delete organization with assigned users or custom groups", { status: 400 })
        }

        await prisma.organization.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[API] Error deleting organization:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
