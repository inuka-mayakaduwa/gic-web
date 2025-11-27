import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasOrgPermission, ORG_PERMISSIONS } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const editInfoSchema = z.object({
    organizationId: z.string().min(1, "Organization ID is required"),
    nameEn: z.string().min(1, "English name is required").optional(),
    nameSi: z.string().optional(),
    nameTa: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    addressEn: z.string().optional(),
    addressSi: z.string().optional(),
    addressTa: z.string().optional(),
    descriptionEn: z.string().optional(),
    descriptionSi: z.string().optional(),
    descriptionTa: z.string().optional(),
})

/**
 * GET /api/console/organization/edit-info?organizationId=[id]
 * Get organization information
 */
export async function GET(req: Request) {
    console.log('[Org Edit Info] GET - Fetching organization info')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Edit Info] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const organizationId = searchParams.get("organizationId")

        if (!organizationId) {
            console.log('[Org Edit Info] Missing organizationId')
            return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
        }

        console.log('[Org Edit Info] Checking permissions for org:', organizationId)
        const canView = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.ORG_INFO_VIEW)
        
        if (!canView) {
            console.log('[Org Edit Info] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        console.log('[Org Edit Info] Fetching organization...')
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        })

        if (!organization) {
            console.log('[Org Edit Info] Organization not found')
            return NextResponse.json({ error: "Organization not found" }, { status: 404 })
        }

        console.log('[Org Edit Info] Organization fetched successfully')
        return NextResponse.json(organization)
    } catch (error) {
        console.error("[Org Edit Info] ERROR:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

/**
 * PATCH /api/console/organization/edit-info
 * Update organization information
 */
export async function PATCH(req: Request) {
    console.log('[Org Edit Info] PATCH - Updating organization info')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Edit Info] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        console.log('[Org Edit Info] Request body:', { organizationId: body?.organizationId })

        const validation = editInfoSchema.safeParse(body)

        if (!validation.success) {
            console.log('[Org Edit Info] Validation error:', validation.error.issues)
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { organizationId, ...updateData } = validation.data

        console.log('[Org Edit Info] Checking permissions for org:', organizationId)
        const canEdit = await hasOrgPermission(session.user.id, organizationId, ORG_PERMISSIONS.ORG_INFO_EDIT)
        
        if (!canEdit) {
            console.log('[Org Edit Info] Forbidden - No permission')
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const prisma = getPrisma()

        // Verify organization exists
        console.log('[Org Edit Info] Verifying organization exists...')
        const existing = await prisma.organization.findUnique({
            where: { id: organizationId },
        })

        if (!existing) {
            console.log('[Org Edit Info] Organization not found')
            return NextResponse.json({ error: "Organization not found" }, { status: 404 })
        }

        // Remove undefined values
        const cleanData = Object.fromEntries(
            Object.entries(updateData).filter(([_, v]) => v !== undefined)
        )

        console.log('[Org Edit Info] Updating organization...')
        const organization = await prisma.organization.update({
            where: { id: organizationId },
            data: cleanData,
        })

        console.log('[Org Edit Info] Organization updated successfully')
        return NextResponse.json(organization)
    } catch (error) {
        console.error("[Org Edit Info] ERROR:", error)
        console.error("[Org Edit Info] Error type:", error?.constructor?.name)
        console.error("[Org Edit Info] Error message:", error instanceof Error ? error.message : String(error))
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

