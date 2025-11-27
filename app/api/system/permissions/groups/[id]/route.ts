import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission, PERMISSIONS } from "@/lib/permissions"
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
            const isSuperAdmin = await hasSystemPermission(session.user.id, PERMISSIONS.SUPERADMIN)
            if (!isSuperAdmin) return new NextResponse("Forbidden", { status: 403 })
        }

        const prisma = getPrisma()
        const group = await prisma.systemPermissionGroup.findUnique({
            where: { id },
            include: {
                permissions: true,
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        })

        if (!group) {
            return new NextResponse("Group not found", { status: 404 })
        }

        return NextResponse.json(group)
    } catch (error) {
        console.error("[API] Error fetching permission group:", error)
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
            const isSuperAdmin = await hasSystemPermission(session.user.id, PERMISSIONS.SUPERADMIN)
            if (!isSuperAdmin) return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await req.json()
        const validation = updateGroupSchema.safeParse(body)

        if (!validation.success) {
            return new NextResponse(validation.error.issues[0].message, { status: 400 })
        }

        const { name, permissionIds } = validation.data
        const prisma = getPrisma()

        // Check if group exists
        const existingGroup = await prisma.systemPermissionGroup.findUnique({
            where: { id }
        })

        if (!existingGroup) {
            return new NextResponse("Group not found", { status: 404 })
        }

        // If name is changing, check uniqueness
        if (name && name !== existingGroup.name) {
            const nameExists = await prisma.systemPermissionGroup.findUnique({
                where: { name }
            })
            if (nameExists) {
                return new NextResponse("Group name already exists", { status: 409 })
            }
        }

        const updatedGroup = await prisma.systemPermissionGroup.update({
            where: { id },
            data: {
                name,
                permissions: permissionIds ? {
                    set: permissionIds.map(permId => ({ id: permId }))
                } : undefined
            },
            include: {
                permissions: true,
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        })

        return NextResponse.json(updatedGroup)
    } catch (error) {
        console.error("[API] Error updating permission group:", error)
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
            const isSuperAdmin = await hasSystemPermission(session.user.id, PERMISSIONS.SUPERADMIN)
            if (!isSuperAdmin) return new NextResponse("Forbidden", { status: 403 })
        }

        const prisma = getPrisma()

        // Check if group has users
        const group = await prisma.systemPermissionGroup.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        })

        if (!group) {
            return new NextResponse("Group not found", { status: 404 })
        }

        if (group._count.users > 0) {
            return new NextResponse("Cannot delete group with assigned users", { status: 400 })
        }

        await prisma.systemPermissionGroup.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[API] Error deleting permission group:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
