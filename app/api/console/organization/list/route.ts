import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasOrgPermission } from "@/lib/permissions"
import { NextResponse } from "next/server"

/**
 * GET /api/console/organization/list
 * List all organizations the current user has access to
 * Query params:
 *   - all: if true, return all organizations (requires system permission)
 *   - scope: organizationId to filter by specific organization
 */
export async function GET(req: Request) {
    console.log('[Org List] GET - Fetching user organizations')
    
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org List] Unauthorized - No session')
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const all = searchParams.get("all") === "true"
        const scope = searchParams.get("scope")

        console.log('[Org List] User:', session.user.id, 'all:', all, 'scope:', scope)

        const prisma = getPrisma()

        // If "all" parameter is true, check system permission
        if (all) {
            const { hasSystemPermission } = await import("@/lib/permissions")
            const canViewAll = await hasSystemPermission(session.user.id, "system.organizations.view")
            
            if (!canViewAll) {
                console.log('[Org List] Forbidden - No system permission for all')
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }

            console.log('[Org List] Fetching all organizations...')
            const organizations = await prisma.organization.findMany({
                orderBy: { nameEn: 'asc' },
            })

            console.log('[Org List] Found', organizations.length, 'organizations')
            return NextResponse.json({ organizations })
        }

        // Get organizations user has access to
        console.log('[Org List] Fetching user organizations...')
        const userOrgs = await prisma.userOrgGroupMap.findMany({
            where: {
                userId: session.user.id,
                ...(scope ? { organizationId: scope } : {}),
            },
            include: {
                organization: true,
                orgGroup: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })

        // Also get custom group assignments
        const customGroupOrgs = await prisma.userOrgCustomGroupMap.findMany({
            where: {
                userId: session.user.id,
                ...(scope ? {
                    orgCustomGroup: {
                        organizationId: scope,
                    },
                } : {}),
            },
            include: {
                orgCustomGroup: {
                    include: {
                        organization: true,
                    },
                },
            },
        })

        // Combine and deduplicate organizations
        const orgMap = new Map<string, any>()
        
        userOrgs.forEach((assignment) => {
            const org = assignment.organization
            if (!orgMap.has(org.id)) {
                orgMap.set(org.id, {
                    ...org,
                    groups: [],
                })
            }
            const orgData = orgMap.get(org.id)
            if (assignment.orgGroup) {
                orgData.groups.push({
                    id: assignment.orgGroup.id,
                    name: assignment.orgGroup.name,
                    type: 'template',
                })
            }
        })

        customGroupOrgs.forEach((assignment) => {
            const org = assignment.orgCustomGroup?.organization
            if (!org) return
            
            if (!orgMap.has(org.id)) {
                orgMap.set(org.id, {
                    ...org,
                    groups: [],
                })
            }
            const orgData = orgMap.get(org.id)
            if (assignment.orgCustomGroup) {
                orgData.groups.push({
                    id: assignment.orgCustomGroup.id,
                    name: assignment.orgCustomGroup.name,
                    type: 'custom',
                })
            }
        })

        const organizations = Array.from(orgMap.values())

        console.log('[Org List] Found', organizations.length, 'organizations for user')
        return NextResponse.json({ organizations })
    } catch (error) {
        console.error("[Org List] ERROR:", error)
        console.error("[Org List] Error type:", error?.constructor?.name)
        console.error("[Org List] Error message:", error instanceof Error ? error.message : String(error))
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

