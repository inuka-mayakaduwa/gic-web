import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasOrgPermission, ORG_PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const reorderSchema = z.object({
    organizationId: z.string().min(1),
    personId: z.string().min(1),
    direction: z.enum(["up", "down"]),
})

/**
 * POST /api/console/organization/people/reorder
 * Move a person up or down in the order
 */
export async function POST(req: Request) {
    console.log('[People Reorder] POST - Reordering person')
    
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

        const { organizationId, personId, direction } = validation.data

        const canEdit = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.PERSON_EDIT)
        if (!canEdit) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Get current person
        const current = await prisma.person.findFirst({
            where: { id: personId, organizationId },
        })

        if (!current) {
            return NextResponse.json({ error: "Person not found" }, { status: 404 })
        }

        // Get all people ordered
        const allPeople = await prisma.person.findMany({
            where: { organizationId },
            orderBy: { order: "asc" },
        })

        const currentIndex = allPeople.findIndex(p => p.id === personId)
        if (currentIndex === -1) {
            return NextResponse.json({ error: "Person not found in list" }, { status: 404 })
        }

        // Determine swap target
        let targetIndex: number
        if (direction === "up" && currentIndex > 0) {
            targetIndex = currentIndex - 1
        } else if (direction === "down" && currentIndex < allPeople.length - 1) {
            targetIndex = currentIndex + 1
        } else {
            return NextResponse.json({ error: "Cannot move person in that direction" }, { status: 400 })
        }

        const target = allPeople[targetIndex]

        // Swap orders
        await prisma.$transaction([
            prisma.person.update({
                where: { id: personId },
                data: { order: target.order },
            }),
            prisma.person.update({
                where: { id: target.id },
                data: { order: current.order },
            }),
        ])

        return NextResponse.json({ message: "Person reordered successfully" })
    } catch (error) {
        console.error("[People Reorder] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}




