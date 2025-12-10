import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasOrgPermission, ORG_PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const reorderSchema = z.object({
    organizationId: z.string().min(1),
    departmentId: z.string().min(1),
    direction: z.enum(["up", "down"]),
})

/**
 * POST /api/console/organization/department/reorder
 * Move a department up or down in the order
 */
export async function POST(req: Request) {
    console.log('[Department Reorder] POST - Reordering department')
    
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

        const { organizationId, departmentId, direction } = validation.data

        const canEdit = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.DEPARTMENT_EDIT)
        if (!canEdit) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Get current department
        const current = await prisma.department.findFirst({
            where: { id: departmentId, organizationId },
        })

        if (!current) {
            return NextResponse.json({ error: "Department not found" }, { status: 404 })
        }

        // Get all departments ordered
        const allDepartments = await prisma.department.findMany({
            where: { organizationId },
            orderBy: { order: "asc" },
        })

        const currentIndex = allDepartments.findIndex(d => d.id === departmentId)
        if (currentIndex === -1) {
            return NextResponse.json({ error: "Department not found in list" }, { status: 404 })
        }

        // Determine swap target
        let targetIndex: number
        if (direction === "up" && currentIndex > 0) {
            targetIndex = currentIndex - 1
        } else if (direction === "down" && currentIndex < allDepartments.length - 1) {
            targetIndex = currentIndex + 1
        } else {
            return NextResponse.json({ error: "Cannot move department in that direction" }, { status: 400 })
        }

        const target = allDepartments[targetIndex]

        // Swap orders
        await prisma.$transaction([
            prisma.department.update({
                where: { id: departmentId },
                data: { order: target.order },
            }),
            prisma.department.update({
                where: { id: target.id },
                data: { order: current.order },
            }),
        ])

        return NextResponse.json({ message: "Department reordered successfully" })
    } catch (error) {
        console.error("[Department Reorder] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}




