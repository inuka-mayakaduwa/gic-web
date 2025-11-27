import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission, PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const canView = await hasSystemPermission(session.user.id, PERMISSIONS.USERS_VIEW)
        if (!canView) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "10")
        const search = searchParams.get("search") || ""
        const status = searchParams.get("status")

        const skip = (page - 1) * limit

        const prisma = getPrisma()

        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ]
        }

        if (status === "active") {
            where.isActive = true
        } else if (status === "inactive") {
            where.isActive = false
        }

        const [users, total] = await Promise.all([
            prisma.systemUser.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    mobile: true,
                    isActive: true,
                    lastLogin: true,
                    createdAt: true,
                    profilePic: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.systemUser.count({ where }),
        ])

        return NextResponse.json({
            users,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit,
            },
        })
    } catch (error) {
        console.error("[API] Error fetching users:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const canCreate = await hasSystemPermission(session.user.id, PERMISSIONS.USERS_CREATE)
        if (!canCreate) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await req.json()
        const { name, email, mobile, isActive } = body

        if (!name || !email) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        // Validate email format
        if (!email.includes("@")) {
            return new NextResponse("Invalid email format", { status: 400 })
        }

        const prisma = getPrisma()

        // Check if email already exists
        const existingUser = await prisma.systemUser.findUnique({
            where: { email },
        })

        if (existingUser) {
            return new NextResponse("Email already exists", { status: 409 })
        }

        const user = await prisma.systemUser.create({
            data: {
                name,
                email,
                mobile,
                isActive: isActive ?? true,
            },
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("[API] Error creating user:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
