import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const createOrgSchema = z.object({
    nameEn: z.string().min(1, "English name is required"),
    nameSi: z.string().optional(),
    nameTa: z.string().optional(),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
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
        const organizations = await prisma.organization.findMany({
            orderBy: {
                nameEn: 'asc'
            },
            include: {
                _count: {
                    select: {
                        userGroupAssignments: true,
                        customGroups: true
                    }
                }
            }
        })

        return NextResponse.json(organizations)
    } catch (error) {
        console.error("[API] Error fetching organizations:", error)
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
        const validation = createOrgSchema.safeParse(body)

        if (!validation.success) {
            return new NextResponse(validation.error.issues[0].message, { status: 400 })
        }

        const prisma = getPrisma()

        // Check if slug already exists
        const existing = await prisma.organization.findUnique({
            where: { slug: validation.data.slug }
        })

        if (existing) {
            return new NextResponse("Organization slug already exists", { status: 409 })
        }

        const organization = await prisma.organization.create({
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
        console.error("[API] Error creating organization:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
