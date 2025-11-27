import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const prisma = getPrisma()
        const permissions = await prisma.systemPermission.findMany({
            orderBy: { code: 'asc' }
        })

        return NextResponse.json(permissions)
    } catch (error) {
        console.error("[API] Error listing permissions:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
