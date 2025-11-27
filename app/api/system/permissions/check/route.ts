import { auth } from "@/auth"
import { hasSystemPermission } from "@/lib/permissions"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { permission } = await req.json()
        if (!permission) {
            return new NextResponse("Permission code required", { status: 400 })
        }

        const hasPermission = await hasSystemPermission(session.user.id, permission)

        return NextResponse.json({ hasPermission })
    } catch (error) {
        console.error("[API] Error checking permission:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
