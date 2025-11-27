import { getPrisma } from "@/lib/prisma"

export const PERMISSIONS = {
    SUPERADMIN: 'system.superadmin',
    USERS_VIEW: 'system.users.view',
    USERS_CREATE: 'system.users.create',
    USERS_EDIT: 'system.users.edit',
    USERS_DELETE: 'system.users.delete',
    PERMISSIONS_VIEW: 'system.permissions.view',
    PERMISSIONS_MANAGE: 'system.permissions.manage',
    ORGANIZATIONS_VIEW: 'system.organizations.view',
    ORGANIZATIONS_MANAGE: 'system.organizations.manage',
}

/**
 * Check if a user has a specific system permission
 */
export async function hasSystemPermission(userId: string, permissionCode: string): Promise<boolean> {
    const prisma = getPrisma()

    // 1. Check if user is superadmin
    const isSuperAdmin = await hasSuperAdminAccess(userId)
    if (isSuperAdmin) return true

    // 2. Check group permissions
    const groupPermission = await prisma.systemUser.findFirst({
        where: {
            id: userId,
            systemPermissionGroups: {
                some: {
                    permissions: {
                        some: {
                            code: permissionCode
                        }
                    }
                }
            }
        }
    })

    return !!groupPermission
}

/**
 * Check if a user has superadmin access
 */
export async function hasSuperAdminAccess(userId: string): Promise<boolean> {
    const prisma = getPrisma()

    // Check group permission
    const groupSuperAdmin = await prisma.systemUser.findFirst({
        where: {
            id: userId,
            systemPermissionGroups: {
                some: {
                    permissions: {
                        some: {
                            code: PERMISSIONS.SUPERADMIN
                        }
                    }
                }
            }
        }
    })

    return !!groupSuperAdmin
}

/**
 * Get all system permissions for a user
 */
export async function getUserSystemPermissions(userId: string): Promise<string[]> {
    const prisma = getPrisma()

    const user = await prisma.systemUser.findUnique({
        where: { id: userId },
        include: {
            systemPermissionGroups: {
                include: {
                    permissions: true
                }
            }
        }
    })

    if (!user) return []

    const permissions = new Set<string>()

    // Add group permissions
    user.systemPermissionGroups.forEach(g => {
        g.permissions.forEach(p => permissions.add(p.code))
    })

    return Array.from(permissions)
}

/**
 * Organizational permission constants
 */
export const ORG_PERMISSIONS = {
    // Organization Info
    ORG_INFO_VIEW: 'org.info.view',
    ORG_INFO_EDIT: 'org.info.edit',
    // People
    PERSON_VIEW: 'org.person.view',
    PERSON_CREATE: 'org.person.create',
    PERSON_EDIT: 'org.person.edit',
    PERSON_DELETE: 'org.person.delete',
    // Departments
    DEPARTMENT_VIEW: 'org.department.view',
    DEPARTMENT_CREATE: 'org.department.create',
    DEPARTMENT_EDIT: 'org.department.edit',
    DEPARTMENT_DELETE: 'org.department.delete',
    // Services
    SERVICE_VIEW: 'org.service.view',
    SERVICE_CREATE: 'org.service.create',
    SERVICE_EDIT: 'org.service.edit',
    SERVICE_DELETE: 'org.service.delete',
    // News
    NEWS_VIEW: 'org.news.view',
    NEWS_MANAGE: 'org.news.manage',
    // Users
    USERS_VIEW: 'org.users.view',
    USERS_MANAGE: 'org.users.manage',
}

/**
 * Check if a user has an organizational permission
 * Checks both global org groups and custom groups
 */
export async function hasOrgPermission(
    userId: string,
    organizationId: string,
    permissionCode: string
): Promise<boolean> {
    const prisma = getPrisma()

    // Check global org groups
    const globalGroup = await prisma.userOrgGroupMap.findFirst({
        where: {
            userId,
            organizationId,
            orgGroup: {
                permissions: {
                    some: { code: permissionCode }
                }
            }
        }
    })

    if (globalGroup) return true

    // Check custom groups
    const customGroup = await prisma.userOrgCustomGroupMap.findFirst({
        where: {
            userId,
            orgCustomGroup: {
                organizationId,
                permissions: {
                    some: { code: permissionCode }
                }
            }
        }
    })

    return !!customGroup
}

/**
 * Get all organizational permissions for a user in a specific organization
 */
export async function getUserOrgPermissions(
    userId: string,
    organizationId: string
): Promise<string[]> {
    const prisma = getPrisma()

    const permissions = new Set<string>()

    // Get permissions from global org groups
    const globalGroups = await prisma.userOrgGroupMap.findMany({
        where: {
            userId,
            organizationId
        },
        include: {
            orgGroup: {
                include: {
                    permissions: true
                }
            }
        }
    })

    globalGroups.forEach(assignment => {
        assignment.orgGroup.permissions.forEach(p => permissions.add(p.code))
    })

    // Get permissions from custom groups
    const customGroups = await prisma.userOrgCustomGroupMap.findMany({
        where: {
            userId,
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
    })

    customGroups.forEach(assignment => {
        assignment.orgCustomGroup.permissions.forEach(p => permissions.add(p.code))
    })

    return Array.from(permissions)
}
