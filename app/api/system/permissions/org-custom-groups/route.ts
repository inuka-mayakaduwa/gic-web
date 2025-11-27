import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const createGroupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    organizationId: z.string().min(1, "Organization is required"),
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

        const { searchParams } = new URL(req.url)
        const organizationId = searchParams.get('organizationId')

        const prisma = getPrisma()
        const groups = await prisma.orgCustomGroup.findMany({
            where: organizationId ? { organizationId } : undefined,
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
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json(groups)
    } catch (error) {
        console.error("[API] Error fetching org custom groups:", error)
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

        const { name, organizationId, permissionIds } = validation.data
        const prisma = getPrisma()

        // Check if organization exists
        const org = await prisma.organization.findUnique({
            where: { id: organizationId }
        })

        if (!org) {
            return new NextResponse("Organization not found", { status: 404 })
        }

        const group = await prisma.orgCustomGroup.create({
            data: {
                name,
                organizationId,
                permissions: permissionIds ? {
                    connect: permissionIds.map(id => ({ id }))
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

        return NextResponse.json(group)
    } catch (error) {
        console.error("[API] Error creating org custom group:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
