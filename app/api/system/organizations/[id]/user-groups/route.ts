import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission, hasOrgPermission } from "@/lib/permissions"
import { NextResponse } from "next/server"

/**
 * GET /api/system/organizations/[id]/user-groups
 * Get all available organization user groups (OrgUserGroup templates)
 * and custom groups for this organization
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log('[Org User Groups] GET - Fetching available user groups')
    
    try {
        const { id: organizationId } = await params
        console.log('[Org User Groups] Organization ID:', organizationId)
        
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org User Groups] Unauthorized - No session')
            return new NextResponse("Unauthorized", { status: 401 })
        }

        console.log('[Org User Groups] Checking permissions for user:', session.user.id)
        const hasSystemPerm = await hasSystemPermission(session.user.id, "system.organizations.view")
        const hasOrgPerm = await hasOrgPermission(session.user.id, organizationId, "org.users.view")
        console.log('[Org User Groups] System permission:', hasSystemPerm, 'Org permission:', hasOrgPerm)

        if (!hasSystemPerm && !hasOrgPerm) {
            console.log('[Org User Groups] Forbidden - No permissions')
            return new NextResponse("Forbidden", { status: 403 })
        }

        const prisma = getPrisma()

        // Verify organization exists
        console.log('[Org User Groups] Verifying organization exists...')
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        })

        if (!organization) {
            console.log('[Org User Groups] Organization not found')
            return new NextResponse("Organization not found", { status: 404 })
        }

        // Get all available org user groups (templates)
        console.log('[Org User Groups] Fetching org user groups...')
        const orgUserGroups = await prisma.orgUserGroup.findMany({
            include: {
                permissions: {
                    orderBy: {
                        code: 'asc'
                    }
                },
                _count: {
                    select: {
                        assignments: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })
        console.log('[Org User Groups] Found', orgUserGroups.length, 'org user groups')

        // Get custom groups for this organization
        console.log('[Org User Groups] Fetching custom groups...')
        const customGroups = await prisma.orgCustomGroup.findMany({
            where: {
                organizationId
            },
            include: {
                permissions: {
                    orderBy: {
                        code: 'asc'
                    }
                },
                _count: {
                    select: {
                        assignments: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })
        console.log('[Org User Groups] Found', customGroups.length, 'custom groups')

        return NextResponse.json({
            orgUserGroups,
            customGroups
        })
    } catch (error) {
        console.error("[Org User Groups] ERROR fetching user groups:", error)
        console.error("[Org User Groups] Error type:", error?.constructor?.name)
        console.error("[Org User Groups] Error message:", error instanceof Error ? error.message : String(error))
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

