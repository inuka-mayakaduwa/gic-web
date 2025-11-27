import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission, PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const createGroupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    permissionIds: z.array(z.string()).optional(),
})

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const canView = await hasSystemPermission(session.user.id, "system.permissions.view")
        if (!canView) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const prisma = getPrisma()
        const groups = await prisma.orgUserGroup.findMany({
            include: {
                permissions: true,
                _count: {
                    select: {
                        assignments: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json(groups)
    } catch (error) {
        console.error("[API] Error fetching org permission groups:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const canManage = await hasSystemPermission(session.user.id, "system.permissions.manage")
        if (!canManage) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await req.json()
        const validation = createGroupSchema.safeParse(body)

        if (!validation.success) {
            return new NextResponse(validation.error.issues[0].message, { status: 400 })
        }

        const { name, permissionIds } = validation.data
        const prisma = getPrisma()

        // Check if name already exists
        const existing = await prisma.orgUserGroup.findUnique({
            where: { name }
        })

        if (existing) {
            return new NextResponse("Group name already exists", { status: 409 })
        }

        const group = await prisma.orgUserGroup.create({
            data: {
                name,
                permissions: permissionIds ? {
                    connect: permissionIds.map(id => ({ id }))
                } : undefined
            },
            include: {
                permissions: true,
                _count: {
                    select: {
                        assignments: true
                    }
                }
            }
        })

        return NextResponse.json(group)
    } catch (error) {
        console.error("[API] Error creating org permission group:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
