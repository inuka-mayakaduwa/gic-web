import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasOrgPermission, ORG_PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const reorderSchema = z.object({
    organizationId: z.string().min(1),
    serviceId: z.string().min(1),
    direction: z.enum(["up", "down"]),
})

/**
 * POST /api/console/organization/service/reorder
 * Move a service up or down in the order
 */
export async function POST(req: Request) {
    console.log('[Service Reorder] POST - Reordering service')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const validation = reorderSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { organizationId, serviceId, direction } = validation.data

        const canEdit = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.SERVICE_EDIT)
        if (!canEdit) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Get current service
        const current = await prisma.service.findFirst({
            where: { id: serviceId, organizationId },
        })

        if (!current) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 })
        }

        // Get all services ordered
        const allServices = await prisma.service.findMany({
            where: { organizationId },
            orderBy: { order: "asc" },
        })

        const currentIndex = allServices.findIndex(s => s.id === serviceId)
        if (currentIndex === -1) {
            return NextResponse.json({ error: "Service not found in list" }, { status: 404 })
        }

        // Determine swap target
        let targetIndex: number
        if (direction === "up" && currentIndex > 0) {
            targetIndex = currentIndex - 1
        } else if (direction === "down" && currentIndex < allServices.length - 1) {
            targetIndex = currentIndex + 1
        } else {
            return NextResponse.json({ error: "Cannot move service in that direction" }, { status: 400 })
        }

        const target = allServices[targetIndex]

        // Swap orders
        await prisma.$transaction([
            prisma.service.update({
                where: { id: serviceId },
                data: { order: target.order },
            }),
            prisma.service.update({
                where: { id: target.id },
                data: { order: current.order },
            }),
        ])

        return NextResponse.json({ message: "Service reordered successfully" })
    } catch (error) {
        console.error("[Service Reorder] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}




