import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission, PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"

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

        const canView = await hasSystemPermission(session.user.id, PERMISSIONS.USERS_VIEW)
        if (!canView) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const prisma = getPrisma()

        const user = await prisma.systemUser.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                profilePic: true,
                systemPermissionGroups: true,
            },
        })

        if (!user) {
            return new NextResponse("User not found", { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("[API] Error fetching user:", error)
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

        const canEdit = await hasSystemPermission(session.user.id, PERMISSIONS.USERS_EDIT)
        if (!canEdit) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await req.json()
        const { name, email, mobile, isActive } = body

        const prisma = getPrisma()

        // Check if user exists
        const existingUser = await prisma.systemUser.findUnique({
            where: { id },
        })

        if (!existingUser) {
            return new NextResponse("User not found", { status: 404 })
        }

        // If email is being changed, check uniqueness
        if (email && email !== existingUser.email) {
            const emailExists = await prisma.systemUser.findUnique({
                where: { email },
            })
            if (emailExists) {
                return new NextResponse("Email already exists", { status: 409 })
            }
        }

        const updatedUser = await prisma.systemUser.update({
            where: { id },
            data: {
                name,
                email,
                mobile,
                isActive,
                systemPermissionGroups: body.permissionGroupIds ? {
                    set: body.permissionGroupIds.map((id: string) => ({ id }))
                } : undefined,
            },
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("[API] Error updating user:", error)
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

        const canDelete = await hasSystemPermission(session.user.id, PERMISSIONS.USERS_DELETE)
        if (!canDelete) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        if (session.user.id === id) {
            return new NextResponse("Cannot delete yourself", { status: 400 })
        }

        const prisma = getPrisma()

        // Soft delete
        await prisma.systemUser.update({
            where: { id },
            data: { isActive: false },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[API] Error deleting user:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
