import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateGroupSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    permissionIds: z.array(z.string()).optional(),
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

        const canView = await hasSystemPermission(session.user.id, "system.permissions.view")
        if (!canView) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const prisma = getPrisma()
        const group = await prisma.orgCustomGroup.findUnique({
            where: { id },
            include: {
                organization: {
                    select: {
                        id: true,
                        nameEn: true,
                        slug: true
                    }
                },
                permissions: true,
                _count: {
                    select: {
                        assignments: true
                    }
                }
            }
        })

        if (!group) {
            return new NextResponse("Group not found", { status: 404 })
        }

        return NextResponse.json(group)
    } catch (error) {
        console.error("[API] Error fetching org custom group:", error)
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

        const canManage = await hasSystemPermission(session.user.id, "system.permissions.manage")
        if (!canManage) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await req.json()
        const validation = updateGroupSchema.safeParse(body)

        if (!validation.success) {
            return new NextResponse(validation.error.issues[0].message, { status: 400 })
        }

        const { name, permissionIds } = validation.data
        const prisma = getPrisma()

        // Check if group exists
        const existingGroup = await prisma.orgCustomGroup.findUnique({
            where: { id }
        })

        if (!existingGroup) {
            return new NextResponse("Group not found", { status: 404 })
        }

        const updatedGroup = await prisma.orgCustomGroup.update({
            where: { id },
            data: {
                name,
                permissions: permissionIds ? {
                    set: permissionIds.map(permId => ({ id: permId }))
                } : undefined
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        nameEn: true,
                        slug: true
                    }
                },
                permissions: true,
                _count: {
                    select: {
                        assignments: true
                    }
                }
            }
        })

        return NextResponse.json(updatedGroup)
    } catch (error) {
        console.error("[API] Error updating org custom group:", error)
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

        const canManage = await hasSystemPermission(session.user.id, "system.permissions.manage")
        if (!canManage) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const prisma = getPrisma()

        // Check if group has users
        const group = await prisma.orgCustomGroup.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { assignments: true }
                }
            }
        })

        if (!group) {
            return new NextResponse("Group not found", { status: 404 })
        }

        if (group._count.assignments > 0) {
            return new NextResponse("Cannot delete group with assigned users", { status: 400 })
        }

        await prisma.orgCustomGroup.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[API] Error deleting org custom group:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
