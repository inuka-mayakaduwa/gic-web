import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission } from "@/lib/permissions"
import { NextResponse } from "next/server"

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
        const permissions = await prisma.orgPermission.findMany({
            orderBy: {
                code: 'asc'
            }
        })

        return NextResponse.json(permissions)
    } catch (error) {
        console.error("[API] Error fetching org permissions:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
