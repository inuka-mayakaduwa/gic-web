import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasOrgPermission, ORG_PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const assignPersonSchema = z.object({
    organizationId: z.string().min(1),
    personId: z.string().min(1),
    departmentId: z.string().min(1),
})

const removePersonSchema = z.object({
    organizationId: z.string().min(1),
    personId: z.string().min(1),
    departmentId: z.string().min(1),
})

/**
 * POST /api/console/organization/person-department
 * Assign a person to a department
 */
export async function POST(req: Request) {
    console.log('[Person-Department] POST - Assigning person to department')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const validation = assignPersonSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { organizationId, personId, departmentId } = validation.data

        // Check permissions
        const canEditPerson = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.PERSON_EDIT)
        const canEditDept = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.DEPARTMENT_EDIT)

        if (!canEditPerson || !canEditDept) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify person and department belong to organization
        const person = await prisma.person.findFirst({
            where: { id: personId, organizationId },
        })

        if (!person) {
            return NextResponse.json({ error: "Person not found" }, { status: 404 })
        }

        const department = await prisma.department.findFirst({
            where: { id: departmentId, organizationId },
        })

        if (!department) {
            return NextResponse.json({ error: "Department not found" }, { status: 404 })
        }

        // Check if already assigned
        const existing = await prisma.person.findFirst({
            where: {
                id: personId,
                departments: {
                    some: {
                        id: departmentId,
                    },
                },
            },
        })

        if (existing) {
            return NextResponse.json({ error: "Person is already assigned to this department" }, { status: 400 })
        }

        // Assign person to department
        await prisma.person.update({
            where: { id: personId },
            data: {
                departments: {
                    connect: { id: departmentId },
                },
            },
        })

        console.log('[Person-Department] Person assigned to department successfully')
        return NextResponse.json({ message: "Person assigned to department successfully" })
    } catch (error) {
        console.error("[Person-Department] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * DELETE /api/console/organization/person-department?personId=[id]&departmentId=[id]&organizationId=[id]
 * Remove a person from a department
 */
export async function DELETE(req: Request) {
    console.log('[Person-Department] DELETE - Removing person from department')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const personId = searchParams.get("personId")
        const departmentId = searchParams.get("departmentId")
        const organizationId = searchParams.get("organizationId")

        if (!personId || !departmentId || !organizationId) {
            return NextResponse.json(
                { error: "Person ID, Department ID, and Organization ID are required" },
                { status: 400 }
            )
        }

        // Check permissions
        const canEditPerson = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.PERSON_EDIT)
        const canEditDept = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.DEPARTMENT_EDIT)

        if (!canEditPerson || !canEditDept) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify person and department belong to organization
        const person = await prisma.person.findFirst({
            where: { id: personId, organizationId },
        })

        if (!person) {
            return NextResponse.json({ error: "Person not found" }, { status: 404 })
        }

        const department = await prisma.department.findFirst({
            where: { id: departmentId, organizationId },
        })

        if (!department) {
            return NextResponse.json({ error: "Department not found" }, { status: 404 })
        }

        // Remove person from department
        await prisma.person.update({
            where: { id: personId },
            data: {
                departments: {
                    disconnect: { id: departmentId },
                },
            },
        })

        console.log('[Person-Department] Person removed from department successfully')
        return NextResponse.json({ message: "Person removed from department successfully" })
    } catch (error) {
        console.error("[Person-Department] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}




