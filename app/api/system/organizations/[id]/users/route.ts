import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission, hasOrgPermission } from "@/lib/permissions"
import { NextResponse } from "next/server"
import { z } from "zod"

const assignUserSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    orgGroupIds: z.array(z.string()).optional(),
    customGroupIds: z.array(z.string()).optional(),
})

const updateUserAssignmentSchema = z.object({
    orgGroupIds: z.array(z.string()).optional(),
    customGroupIds: z.array(z.string()).optional(),
})

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log('[Org Users] POST - Adding user to organization')
    
    try {
        const { id: organizationId } = await params
        console.log('[Org Users] Organization ID:', organizationId)
        
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Users] Unauthorized - No session')
            return new NextResponse("Unauthorized", { status: 401 })
        }

        console.log('[Org Users] Checking permissions for user:', session.user.id)
        // Check if user has system permission OR org permission to manage users
        const hasSystemPerm = await hasSystemPermission(session.user.id, "system.organizations.manage")
        const hasOrgPerm = await hasOrgPermission(session.user.id, organizationId, "org.users.manage")
        console.log('[Org Users] System permission:', hasSystemPerm, 'Org permission:', hasOrgPerm)

        if (!hasSystemPerm && !hasOrgPerm) {
            console.log('[Org Users] Forbidden - No permissions')
            return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await req.json()
        console.log('[Org Users] Request body:', { userId: body?.userId, orgGroupIds: body?.orgGroupIds?.length, customGroupIds: body?.customGroupIds?.length })
        
        const validation = assignUserSchema.safeParse(body)

        if (!validation.success) {
            console.log('[Org Users] Validation error:', validation.error.issues)
            return new NextResponse(validation.error.issues[0].message, { status: 400 })
        }

        const { userId, orgGroupIds, customGroupIds } = validation.data
        const prisma = getPrisma()

        // Verify organization exists
        console.log('[Org Users] Verifying organization exists...')
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        })

        if (!organization) {
            console.log('[Org Users] Organization not found')
            return new NextResponse("Organization not found", { status: 404 })
        }

        // Verify user exists
        console.log('[Org Users] Verifying user exists...')
        const user = await prisma.systemUser.findUnique({
            where: { id: userId }
        })

        if (!user) {
            console.log('[Org Users] User not found')
            return new NextResponse("User not found", { status: 404 })
        }

        // Verify org groups exist if provided
        if (orgGroupIds && orgGroupIds.length > 0) {
            console.log('[Org Users] Verifying org groups exist...')
            const existingGroups = await prisma.orgUserGroup.findMany({
                where: { id: { in: orgGroupIds } }
            })
            
            if (existingGroups.length !== orgGroupIds.length) {
                console.log('[Org Users] Some org groups not found')
                return new NextResponse("One or more organization user groups not found", { status: 400 })
            }
        }

        // Assign org groups
        if (orgGroupIds && orgGroupIds.length > 0) {
            console.log('[Org Users] Assigning org groups:', orgGroupIds.length)
            // Remove existing assignments for this org
            await prisma.userOrgGroupMap.deleteMany({
                where: {
                    userId,
                    organizationId
                }
            })

            // Create new assignments
            await prisma.userOrgGroupMap.createMany({
                data: orgGroupIds.map(orgGroupId => ({
                    userId,
                    orgGroupId,
                    organizationId
                }))
            })
            console.log('[Org Users] Org groups assigned successfully')
        }

        // Assign custom groups
        if (customGroupIds && customGroupIds.length > 0) {
            console.log('[Org Users] Assigning custom groups:', customGroupIds.length)
            // Verify custom groups belong to this organization
            const existingCustomGroups = await prisma.orgCustomGroup.findMany({
                where: {
                    id: { in: customGroupIds },
                    organizationId
                }
            })
            
            if (existingCustomGroups.length !== customGroupIds.length) {
                console.log('[Org Users] Some custom groups not found or don\'t belong to organization')
                return new NextResponse("One or more custom groups not found or don't belong to this organization", { status: 400 })
            }

            // Remove existing custom group assignments
            await prisma.userOrgCustomGroupMap.deleteMany({
                where: {
                    userId,
                    orgCustomGroup: {
                        organizationId
                    }
                }
            })

            // Create new assignments
            await prisma.userOrgCustomGroupMap.createMany({
                data: customGroupIds.map(orgCustomGroupId => ({
                    userId,
                    orgCustomGroupId
                }))
            })
            console.log('[Org Users] Custom groups assigned successfully')
        }

        // Fetch updated user with org assignments
        console.log('[Org Users] Fetching updated user...')
        const updatedUser = await prisma.systemUser.findUnique({
            where: { id: userId },
            include: {
                orgUserGroups: {
                    where: { organizationId },
                    include: {
                        orgGroup: {
                            include: {
                                permissions: true
                            }
                        },
                        organization: true
                    }
                },
                orgCustomGroups: {
                    where: {
                        orgCustomGroup: {
                            organizationId
                        }
                    },
                    include: {
                        orgCustomGroup: {
                            include: {
                                organization: true,
                                permissions: true
                            }
                        }
                    }
                }
            }
        })

        console.log('[Org Users] User assigned successfully')
        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("[Org Users] ERROR assigning user to organization:", error)
        console.error("[Org Users] Error type:", error?.constructor?.name)
        console.error("[Org Users] Error message:", error instanceof Error ? error.message : String(error))
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log('[Org Users] GET - Fetching organization users')
    
    try {
        const { id: organizationId } = await params
        console.log('[Org Users] Organization ID:', organizationId)
        
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Users] Unauthorized - No session')
            return new NextResponse("Unauthorized", { status: 401 })
        }

        console.log('[Org Users] Checking permissions for user:', session.user.id)
        const hasSystemPerm = await hasSystemPermission(session.user.id, "system.organizations.view")
        const hasOrgPerm = await hasOrgPermission(session.user.id, organizationId, "org.users.view")
        console.log('[Org Users] System permission:', hasSystemPerm, 'Org permission:', hasOrgPerm)

        if (!hasSystemPerm && !hasOrgPerm) {
            console.log('[Org Users] Forbidden - No permissions')
            return new NextResponse("Forbidden", { status: 403 })
        }

        const prisma = getPrisma()

        console.log('[Org Users] Fetching users assigned to organization...')
        // Get all users assigned to this organization
        const users = await prisma.systemUser.findMany({
            where: {
                OR: [
                    {
                        orgUserGroups: {
                            some: {
                                organizationId
                            }
                        }
                    },
                    {
                        orgCustomGroups: {
                            some: {
                                orgCustomGroup: {
                                    organizationId
                                }
                            }
                        }
                    }
                ]
            },
            include: {
                orgUserGroups: {
                    where: { organizationId },
                    include: {
                        orgGroup: {
                            include: {
                                permissions: true
                            }
                        }
                    }
                },
                orgCustomGroups: {
                    where: {
                        orgCustomGroup: {
                            organizationId
                        }
                    },
                    include: {
                        orgCustomGroup: {
                            include: {
                                permissions: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        console.log('[Org Users] Found', users.length, 'users')
        return NextResponse.json(users)
    } catch (error) {
        console.error("[Org Users] ERROR fetching organization users:", error)
        console.error("[Org Users] Error type:", error?.constructor?.name)
        console.error("[Org Users] Error message:", error instanceof Error ? error.message : String(error))
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log('[Org Users] PATCH - Updating user assignment')
    
    try {
        const { id: organizationId } = await params
        console.log('[Org Users] Organization ID:', organizationId)
        
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Users] Unauthorized - No session')
            return new NextResponse("Unauthorized", { status: 401 })
        }

        console.log('[Org Users] Checking permissions for user:', session.user.id)
        const hasSystemPerm = await hasSystemPermission(session.user.id, "system.organizations.manage")
        const hasOrgPerm = await hasOrgPermission(session.user.id, organizationId, "org.users.manage")
        console.log('[Org Users] System permission:', hasSystemPerm, 'Org permission:', hasOrgPerm)

        if (!hasSystemPerm && !hasOrgPerm) {
            console.log('[Org Users] Forbidden - No permissions')
            return new NextResponse("Forbidden", { status: 403 })
        }

        const url = new URL(req.url)
        const userId = url.searchParams.get('userId')
        
        if (!userId) {
            console.log('[Org Users] Missing userId query parameter')
            return new NextResponse("User ID is required as query parameter", { status: 400 })
        }

        const body = await req.json()
        console.log('[Org Users] Request body:', { orgGroupIds: body?.orgGroupIds?.length, customGroupIds: body?.customGroupIds?.length })
        
        const validation = updateUserAssignmentSchema.safeParse(body)

        if (!validation.success) {
            console.log('[Org Users] Validation error:', validation.error.issues)
            return new NextResponse(validation.error.issues[0].message, { status: 400 })
        }

        const { orgGroupIds, customGroupIds } = validation.data
        const prisma = getPrisma()

        // Verify user exists and is assigned to this organization
        console.log('[Org Users] Verifying user assignment...')
        const user = await prisma.systemUser.findFirst({
            where: {
                id: userId,
                OR: [
                    {
                        orgUserGroups: {
                            some: { organizationId }
                        }
                    },
                    {
                        orgCustomGroups: {
                            some: {
                                orgCustomGroup: { organizationId }
                            }
                        }
                    }
                ]
            }
        })

        if (!user) {
            console.log('[Org Users] User not found or not assigned to organization')
            return new NextResponse("User not found or not assigned to this organization", { status: 404 })
        }

        // Update org groups if provided
        if (orgGroupIds !== undefined) {
            console.log('[Org Users] Updating org groups...')
            if (orgGroupIds.length > 0) {
                // Verify org groups exist
                const existingGroups = await prisma.orgUserGroup.findMany({
                    where: { id: { in: orgGroupIds } }
                })
                
                if (existingGroups.length !== orgGroupIds.length) {
                    console.log('[Org Users] Some org groups not found')
                    return new NextResponse("One or more organization user groups not found", { status: 400 })
                }

                // Remove existing assignments for this org
                await prisma.userOrgGroupMap.deleteMany({
                    where: {
                        userId,
                        organizationId
                    }
                })

                // Create new assignments
                await prisma.userOrgGroupMap.createMany({
                    data: orgGroupIds.map(orgGroupId => ({
                        userId,
                        orgGroupId,
                        organizationId
                    }))
                })
            } else {
                // Remove all org group assignments
                await prisma.userOrgGroupMap.deleteMany({
                    where: {
                        userId,
                        organizationId
                    }
                })
            }
            console.log('[Org Users] Org groups updated successfully')
        }

        // Update custom groups if provided
        if (customGroupIds !== undefined) {
            console.log('[Org Users] Updating custom groups...')
            if (customGroupIds.length > 0) {
                // Verify custom groups belong to this organization
                const existingCustomGroups = await prisma.orgCustomGroup.findMany({
                    where: {
                        id: { in: customGroupIds },
                        organizationId
                    }
                })
                
                if (existingCustomGroups.length !== customGroupIds.length) {
                    console.log('[Org Users] Some custom groups not found or don\'t belong to organization')
                    return new NextResponse("One or more custom groups not found or don't belong to this organization", { status: 400 })
                }

                // Remove existing custom group assignments
                await prisma.userOrgCustomGroupMap.deleteMany({
                    where: {
                        userId,
                        orgCustomGroup: {
                            organizationId
                        }
                    }
                })

                // Create new assignments
                await prisma.userOrgCustomGroupMap.createMany({
                    data: customGroupIds.map(orgCustomGroupId => ({
                        userId,
                        orgCustomGroupId
                    }))
                })
            } else {
                // Remove all custom group assignments for this org
                await prisma.userOrgCustomGroupMap.deleteMany({
                    where: {
                        userId,
                        orgCustomGroup: {
                            organizationId
                        }
                    }
                })
            }
            console.log('[Org Users] Custom groups updated successfully')
        }

        // Fetch updated user with org assignments
        console.log('[Org Users] Fetching updated user...')
        const updatedUser = await prisma.systemUser.findUnique({
            where: { id: userId },
            include: {
                orgUserGroups: {
                    where: { organizationId },
                    include: {
                        orgGroup: {
                            include: {
                                permissions: true
                            }
                        },
                        organization: true
                    }
                },
                orgCustomGroups: {
                    where: {
                        orgCustomGroup: {
                            organizationId
                        }
                    },
                    include: {
                        orgCustomGroup: {
                            include: {
                                organization: true,
                                permissions: true
                            }
                        }
                    }
                }
            }
        })

        console.log('[Org Users] User assignment updated successfully')
        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("[Org Users] ERROR updating user assignment:", error)
        console.error("[Org Users] Error type:", error?.constructor?.name)
        console.error("[Org Users] Error message:", error instanceof Error ? error.message : String(error))
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log('[Org Users] DELETE - Removing user from organization')
    
    try {
        const { id: organizationId } = await params
        console.log('[Org Users] Organization ID:', organizationId)
        
        const session = await auth()
        if (!session?.user?.id) {
            console.log('[Org Users] Unauthorized - No session')
            return new NextResponse("Unauthorized", { status: 401 })
        }

        console.log('[Org Users] Checking permissions for user:', session.user.id)
        const hasSystemPerm = await hasSystemPermission(session.user.id, "system.organizations.manage")
        const hasOrgPerm = await hasOrgPermission(session.user.id, organizationId, "org.users.manage")
        console.log('[Org Users] System permission:', hasSystemPerm, 'Org permission:', hasOrgPerm)

        if (!hasSystemPerm && !hasOrgPerm) {
            console.log('[Org Users] Forbidden - No permissions')
            return new NextResponse("Forbidden", { status: 403 })
        }

        const url = new URL(req.url)
        const userId = url.searchParams.get('userId')
        
        if (!userId) {
            console.log('[Org Users] Missing userId query parameter')
            return new NextResponse("User ID is required as query parameter", { status: 400 })
        }

        const prisma = getPrisma()

        // Verify organization exists
        console.log('[Org Users] Verifying organization exists...')
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        })

        if (!organization) {
            console.log('[Org Users] Organization not found')
            return new NextResponse("Organization not found", { status: 404 })
        }

        // Remove all org group assignments
        console.log('[Org Users] Removing org group assignments...')
        const deletedOrgGroups = await prisma.userOrgGroupMap.deleteMany({
            where: {
                userId,
                organizationId
            }
        })
        console.log('[Org Users] Deleted', deletedOrgGroups.count, 'org group assignments')

        // Remove all custom group assignments for this org
        console.log('[Org Users] Removing custom group assignments...')
        const deletedCustomGroups = await prisma.userOrgCustomGroupMap.deleteMany({
            where: {
                userId,
                orgCustomGroup: {
                    organizationId
                }
            }
        })
        console.log('[Org Users] Deleted', deletedCustomGroups.count, 'custom group assignments')

        if (deletedOrgGroups.count === 0 && deletedCustomGroups.count === 0) {
            console.log('[Org Users] User was not assigned to this organization')
            return new NextResponse("User is not assigned to this organization", { status: 404 })
        }

        console.log('[Org Users] User removed from organization successfully')
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[Org Users] ERROR removing user from organization:", error)
        console.error("[Org Users] Error type:", error?.constructor?.name)
        console.error("[Org Users] Error message:", error instanceof Error ? error.message : String(error))
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
