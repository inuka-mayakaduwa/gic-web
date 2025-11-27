import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasOrgPermission, ORG_PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const createContactInfoSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
    type: z.enum(["Email", "Mobile", "Landline", "Fax", "Hotline"]),
    value: z.string().min(1, "Value is required"),
    descriptionEn: z.string().optional(),
    descriptionSi: z.string().optional(),
    descriptionTa: z.string().optional(),
    personId: z.string().optional(),
    departmentId: z.string().optional(),
}).refine(
    (data) => data.personId || data.departmentId,
    {
        message: "Either personId or departmentId must be provided",
        path: ["personId"],
    }
)

const updateContactInfoSchema = createContactInfoSchema.partial().extend({
    organizationId: z.string().min(1),
})

/**
 * GET /api/console/organization/contact-info?organizationId=[id]&personId=[id]&departmentId=[id]
 * Get contact info for an organization, person, or department
 */
export async function GET(req: Request) {
    console.log('[ContactInfo] GET - Fetching contact info')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[ContactInfo] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const organizationId = searchParams.get("organizationId")
        const personId = searchParams.get("personId")
        const departmentId = searchParams.get("departmentId")

        if (!organizationId) {
            return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
        }

        const prisma = getPrisma()

        // Check permission
        const canView = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.ORG_INFO_VIEW)
        if (!canView) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Build where clause
        const where: any = {
            organizationId,
        }

        if (personId) {
            where.personId = personId
        } else if (departmentId) {
            where.departmentId = departmentId
        } else {
            // Organization-level contacts (no personId or departmentId)
            where.personId = null
            where.departmentId = null
        }

        const contactInfos = await prisma.contactInfo.findMany({
            where,
            orderBy: { type: 'asc' },
        })

        console.log('[ContactInfo] Found', contactInfos.length, 'contact info entries')
        return NextResponse.json({ contactInfos })
    } catch (error) {
        console.error("[ContactInfo] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * POST /api/console/organization/contact-info
 * Create a new contact info entry
 */
export async function POST(req: Request) {
    console.log('[ContactInfo] POST - Creating contact info')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const validation = createContactInfoSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { organizationId, personId, departmentId, ...data } = validation.data

        // Check permission
        const canEdit = personId
            ? await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.PERSON_EDIT)
            : departmentId
            ? await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.DEPARTMENT_EDIT)
            : await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.ORG_INFO_EDIT)

        if (!canEdit) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify person or department belongs to organization
        if (personId) {
            const person = await prisma.person.findFirst({
                where: { id: personId, organizationId },
            })
            if (!person) {
                return NextResponse.json({ error: "Person not found" }, { status: 404 })
            }
        }

        if (departmentId) {
            const department = await prisma.department.findFirst({
                where: { id: departmentId, organizationId },
            })
            if (!department) {
                return NextResponse.json({ error: "Department not found" }, { status: 404 })
            }
        }

        const contactInfo = await prisma.contactInfo.create({
            data: {
                ...data,
                organizationId,
                personId: personId || null,
                departmentId: departmentId || null,
            },
        })

        console.log('[ContactInfo] Contact info created successfully')
        return NextResponse.json(contactInfo)
    } catch (error) {
        console.error("[ContactInfo] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * PATCH /api/console/organization/contact-info
 * Update a contact info entry
 */
export async function PATCH(req: Request) {
    console.log('[ContactInfo] PATCH - Updating contact info')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const validation = updateContactInfoSchema.extend({
            id: z.string().min(1),
        }).safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { id, organizationId, ...data } = validation.data

        const prisma = getPrisma()

        // Get existing contact info
        const existing = await prisma.contactInfo.findFirst({
            where: { id, organizationId },
        })

        if (!existing) {
            return NextResponse.json({ error: "Contact info not found" }, { status: 404 })
        }

        // Check permission based on what the contact info belongs to
        const canEdit = existing.personId
            ? await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.PERSON_EDIT)
            : existing.departmentId
            ? await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.DEPARTMENT_EDIT)
            : await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.ORG_INFO_EDIT)

        if (!canEdit) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const contactInfo = await prisma.contactInfo.update({
            where: { id },
            data,
        })

        console.log('[ContactInfo] Contact info updated successfully')
        return NextResponse.json(contactInfo)
    } catch (error) {
        console.error("[ContactInfo] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * DELETE /api/console/organization/contact-info?id=[id]&organizationId=[id]
 * Delete a contact info entry
 */
export async function DELETE(req: Request) {
    console.log('[ContactInfo] DELETE - Deleting contact info')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")
        const organizationId = searchParams.get("organizationId")

        if (!id || !organizationId) {
            return NextResponse.json({ error: "ID and Organization ID are required" }, { status: 400 })
        }

        const prisma = getPrisma()

        // Get existing contact info
        const existing = await prisma.contactInfo.findFirst({
            where: { id, organizationId },
        })

        if (!existing) {
            return NextResponse.json({ error: "Contact info not found" }, { status: 404 })
        }

        // Check permission
        const canDelete = existing.personId
            ? await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.PERSON_EDIT)
            : existing.departmentId
            ? await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.DEPARTMENT_EDIT)
            : await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.ORG_INFO_EDIT)

        if (!canDelete) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        await prisma.contactInfo.delete({
            where: { id },
        })

        console.log('[ContactInfo] Contact info deleted successfully')
        return NextResponse.json({ message: "Contact info deleted successfully" })
    } catch (error) {
        console.error("[ContactInfo] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

