/**
 * Fresh Database Seed File
 * 
 * This script provides a complete fresh start for the database:
 * 1. Prompts for superadmin email and name
 * 2. Seeds all system permissions
 * 3. Seeds system permission groups
 * 4. Seeds organizational permissions
 * 5. Seeds organizational permission groups
 * 6. Creates superadmin user
 * 7. Assigns superadmin group to user
 * 
 * Usage:
 *   pnpm exec tsx prisma/seed-fresh.ts
 * 
 * Or add to package.json:
 *   "seed:fresh": "node node_modules/.pnpm/tsx@4.20.6/node_modules/tsx/dist/cli.mjs prisma/seed-fresh.ts"
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as readline from 'readline'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Create readline interface for user input
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })
}

// Prompt for user input
function question(rl: readline.Interface, query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, resolve)
    })
}

// Validate email format
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
}

// System Permissions (from lib/permissions.ts)
const SYSTEM_PERMISSIONS = [
    { code: 'system.superadmin', description: 'Full system access - bypasses all permission checks' },
    { code: 'system.users.view', description: 'View system users' },
    { code: 'system.users.create', description: 'Create system users' },
    { code: 'system.users.edit', description: 'Edit system users' },
    { code: 'system.users.delete', description: 'Delete system users' },
    { code: 'system.permissions.view', description: 'View system permissions and groups' },
    { code: 'system.permissions.manage', description: 'Manage system permissions and groups' },
    { code: 'system.organizations.view', description: 'View all organizations' },
    { code: 'system.organizations.manage', description: 'Manage organizations (create, edit, delete)' },
]

// System Permission Groups
const SYSTEM_GROUPS = [
    {
        name: 'Superadmin',
        description: 'Full system access with all permissions',
        permissions: [
            'system.superadmin',
            'system.users.view',
            'system.users.create',
            'system.users.edit',
            'system.users.delete',
            'system.permissions.view',
            'system.permissions.manage',
            'system.organizations.view',
            'system.organizations.manage',
        ],
    },
    {
        name: 'System Admin',
        description: 'Full system management except superadmin access',
        permissions: [
            'system.users.view',
            'system.users.create',
            'system.users.edit',
            'system.users.delete',
            'system.permissions.view',
            'system.permissions.manage',
            'system.organizations.view',
            'system.organizations.manage',
        ],
    },
    {
        name: 'User Manager',
        description: 'Manage system users and permissions',
        permissions: [
            'system.users.view',
            'system.users.create',
            'system.users.edit',
            'system.permissions.view',
        ],
    },
    {
        name: 'Organization Manager',
        description: 'View and manage organizations',
        permissions: [
            'system.organizations.view',
            'system.organizations.manage',
        ],
    },
    {
        name: 'Viewer',
        description: 'View-only access to system data',
        permissions: [
            'system.users.view',
            'system.organizations.view',
        ],
    },
]

// Organizational Permissions (from lib/permissions.ts)
const ORG_PERMISSIONS = [
    // Organization Info
    { code: 'org.info.view', description: 'View organization information' },
    { code: 'org.info.edit', description: 'Edit organization information' },

    // People
    { code: 'org.person.view', description: 'View organizational people' },
    { code: 'org.person.create', description: 'Create organizational people' },
    { code: 'org.person.edit', description: 'Edit organizational people' },
    { code: 'org.person.delete', description: 'Delete organizational people' },

    // Departments
    { code: 'org.department.view', description: 'View departments' },
    { code: 'org.department.create', description: 'Create departments' },
    { code: 'org.department.edit', description: 'Edit departments' },
    { code: 'org.department.delete', description: 'Delete departments' },

    // Services
    { code: 'org.service.view', description: 'View services' },
    { code: 'org.service.create', description: 'Create services' },
    { code: 'org.service.edit', description: 'Edit services' },
    { code: 'org.service.delete', description: 'Delete services' },

    // News
    { code: 'org.news.view', description: 'View news articles' },
    { code: 'org.news.manage', description: 'Manage news articles (create, edit, delete)' },

    // Users
    { code: 'org.users.view', description: 'View organization users' },
    { code: 'org.users.manage', description: 'Manage organization users and permissions' },
]

// Organizational Permission Groups
const ORG_GROUPS = [
    {
        name: 'Organization Admin',
        description: 'Full access to all organization features and settings',
        permissions: [
            'org.info.view',
            'org.info.edit',
            'org.person.view',
            'org.person.create',
            'org.person.edit',
            'org.person.delete',
            'org.department.view',
            'org.department.create',
            'org.department.edit',
            'org.department.delete',
            'org.service.view',
            'org.service.create',
            'org.service.edit',
            'org.service.delete',
            'org.news.view',
            'org.news.manage',
            'org.users.view',
            'org.users.manage',
        ],
    },
    {
        name: 'Content Manager',
        description: 'Manage all organization content (people, departments, services, news)',
        permissions: [
            'org.info.view',
            'org.person.view',
            'org.person.create',
            'org.person.edit',
            'org.person.delete',
            'org.department.view',
            'org.department.create',
            'org.department.edit',
            'org.department.delete',
            'org.service.view',
            'org.service.create',
            'org.service.edit',
            'org.service.delete',
            'org.news.view',
            'org.news.manage',
        ],
    },
    {
        name: 'Content Editor',
        description: 'Edit existing content only (no create/delete)',
        permissions: [
            'org.info.view',
            'org.person.view',
            'org.person.edit',
            'org.department.view',
            'org.department.edit',
            'org.service.view',
            'org.service.edit',
            'org.news.view',
        ],
    },
    {
        name: 'Content Viewer',
        description: 'View-only access to organization content',
        permissions: [
            'org.info.view',
            'org.person.view',
            'org.department.view',
            'org.service.view',
            'org.news.view',
        ],
    },
    {
        name: 'User Manager',
        description: 'Manage organization users and their permissions',
        permissions: [
            'org.info.view',
            'org.users.view',
            'org.users.manage',
        ],
    },
]

async function main() {
    console.log('\n🌱 ============================================')
    console.log('   Fresh Database Seed')
    console.log('   ============================================\n')

    const rl = createReadlineInterface()

    try {
        // 1. Prompt for superadmin details
        console.log('📝 Please provide superadmin details:\n')

        let superadminEmail = ''
        let superadminName = ''

        // Get email
        while (!superadminEmail || !isValidEmail(superadminEmail)) {
            superadminEmail = await question(rl, 'Superadmin Email: ')
            if (!superadminEmail.trim()) {
                console.log('❌ Email is required')
                continue
            }
            if (!isValidEmail(superadminEmail)) {
                console.log('❌ Invalid email format. Please try again.')
                superadminEmail = ''
                continue
            }
            superadminEmail = superadminEmail.trim().toLowerCase()
        }

        // Get name
        while (!superadminName || superadminName.trim().length === 0) {
            superadminName = await question(rl, 'Superadmin Name: ')
            if (!superadminName.trim()) {
                console.log('❌ Name is required')
                continue
            }
            superadminName = superadminName.trim()
        }


        // Get mobile (optional)
        const mobile = await question(rl, 'Superadmin Mobile (optional): ')

        console.log('\n✅ Superadmin details received')
        console.log(`   Email: ${superadminEmail}`)
        console.log(`   Name: ${superadminName}`)
        console.log(`   Mobile: ${mobile || 'N/A'}\n`)

        // 2. Seed System Permissions
        console.log('📋 Step 1/6: Seeding System Permissions...')
        const systemPermissionMap: Record<string, string> = {}

        for (const perm of SYSTEM_PERMISSIONS) {
            const created = await prisma.systemPermission.upsert({
                where: { code: perm.code },
                update: { description: perm.description },
                create: {
                    code: perm.code,
                    description: perm.description,
                },
            })
            systemPermissionMap[perm.code] = created.id
            console.log(`   ✓ ${perm.code}`)
        }
        console.log(`✅ Created/updated ${SYSTEM_PERMISSIONS.length} system permissions\n`)

        // 3. Seed System Permission Groups
        console.log('👥 Step 2/6: Seeding System Permission Groups...')
        const systemGroupMap: Record<string, string> = {}

        for (const group of SYSTEM_GROUPS) {
            const permissionIds = group.permissions
                .map(code => systemPermissionMap[code])
                .filter(Boolean) as string[]

            if (permissionIds.length === 0) {
                console.warn(`   ⚠️  Skipping group "${group.name}" - no valid permissions found`)
                continue
            }

            const createdGroup = await prisma.systemPermissionGroup.upsert({
                where: { name: group.name },
                update: {},
                create: { name: group.name },
            })

            // Set permissions for group
            await prisma.systemPermissionGroup.update({
                where: { id: createdGroup.id },
                data: {
                    permissions: {
                        set: permissionIds.map(id => ({ id })),
                    },
                },
            })

            systemGroupMap[group.name] = createdGroup.id
            console.log(`   ✓ ${group.name} (${permissionIds.length} permissions)`)
            console.log(`     ${group.description}`)
        }
        console.log(`✅ Created/updated ${SYSTEM_GROUPS.length} system permission groups\n`)

        // 4. Seed Organizational Permissions
        console.log('📋 Step 3/6: Seeding Organizational Permissions...')
        const orgPermissionMap: Record<string, string> = {}

        for (const perm of ORG_PERMISSIONS) {
            const created = await prisma.orgPermission.upsert({
                where: { code: perm.code },
                update: { description: perm.description },
                create: {
                    code: perm.code,
                    description: perm.description,
                },
            })
            orgPermissionMap[perm.code] = created.id
            console.log(`   ✓ ${perm.code}`)
        }
        console.log(`✅ Created/updated ${ORG_PERMISSIONS.length} organizational permissions\n`)

        // 5. Seed Organizational Permission Groups
        console.log('👥 Step 4/6: Seeding Organizational Permission Groups...')
        const orgGroupMap: Record<string, string> = {}

        for (const group of ORG_GROUPS) {
            const permissionIds = group.permissions
                .map(code => orgPermissionMap[code])
                .filter(Boolean) as string[]

            if (permissionIds.length === 0) {
                console.warn(`   ⚠️  Skipping group "${group.name}" - no valid permissions found`)
                continue
            }

            const createdGroup = await prisma.orgUserGroup.upsert({
                where: { name: group.name },
                update: {},
                create: { name: group.name },
            })

            // Set permissions for group
            await prisma.orgUserGroup.update({
                where: { id: createdGroup.id },
                data: {
                    permissions: {
                        set: permissionIds.map(id => ({ id })),
                    },
                },
            })

            orgGroupMap[group.name] = createdGroup.id
            console.log(`   ✓ ${group.name} (${permissionIds.length} permissions)`)
            console.log(`     ${group.description}`)
        }
        console.log(`✅ Created/updated ${ORG_GROUPS.length} organizational permission groups\n`)

        // 6. Create Superadmin User
        console.log('👤 Step 5/6: Creating Superadmin User...')

        // Check if user already exists
        const existingUser = await prisma.systemUser.findUnique({
            where: { email: superadminEmail },
        })

        let superadminUserId: string

        if (existingUser) {
            console.log(`   ⚠️  User with email ${superadminEmail} already exists`)
            console.log('   Updating user details...')

            await prisma.systemUser.update({
                where: { id: existingUser.id },
                data: {
                    name: superadminName,
                    mobile: mobile || null,
                    isActive: true,
                },
            })

            superadminUserId = existingUser.id
            console.log(`   ✓ Updated existing user`)
        } else {
            const newUser = await prisma.systemUser.create({
                data: {
                    name: superadminName,
                    email: superadminEmail,
                    mobile: mobile || null,
                    isActive: true,
                },
            })
            superadminUserId = newUser.id
            console.log(`   ✓ Created new user: ${superadminName} (${superadminEmail})`)
        }
        console.log(`✅ Superadmin user ready\n`)

        // 7. Assign Superadmin Group to User
        console.log('🔗 Step 6/6: Assigning Superadmin Group...')

        const superadminGroupId = systemGroupMap['Superadmin']
        if (!superadminGroupId) {
            throw new Error('Superadmin group not found!')
        }

        // Check if user is already in the group using a more efficient query
        const userWithGroup = await prisma.systemUser.findUnique({
            where: { id: superadminUserId },
            select: {
                id: true,
                systemPermissionGroups: {
                    where: { id: superadminGroupId },
                    select: { id: true },
                },
            },
        })

        const hasGroup = (userWithGroup?.systemPermissionGroups?.length ?? 0) > 0

        if (!hasGroup) {
            await prisma.systemUser.update({
                where: { id: superadminUserId },
                data: {
                    systemPermissionGroups: {
                        connect: { id: superadminGroupId },
                    },
                },
            })
            console.log(`   ✓ Assigned Superadmin group to user`)
        } else {
            console.log(`   ✓ User already has Superadmin group`)
        }
        console.log(`✅ Superadmin group assigned\n`)

        // Summary
        console.log('\n🎉 ============================================')
        console.log('   Seed Completed Successfully!')
        console.log('   ============================================\n')
        console.log('📊 Summary:')
        console.log(`   • System Permissions: ${SYSTEM_PERMISSIONS.length}`)
        console.log(`   • System Permission Groups: ${SYSTEM_GROUPS.length}`)
        console.log(`   • Organizational Permissions: ${ORG_PERMISSIONS.length}`)
        console.log(`   • Organizational Permission Groups: ${ORG_GROUPS.length}`)
        console.log(`   • Superadmin User: ${superadminName} (${superadminEmail})`)
        console.log('\n💡 Next Steps:')
        console.log('   1. The superadmin can now log in using OTP authentication')
        console.log('   2. Request OTP at: /api/auth/request-otp')
        console.log('   3. Login with the OTP code')
        console.log('   4. Start creating organizations and assigning users\n')

    } catch (error) {
        console.error('\n❌ Error during seeding:', error)
        throw error
    } finally {
        try {
            rl.close()
        } catch {
            // Readline interface may already be closed, ignore error
        }
    }
}

main()
    .catch((e) => {
        console.error('❌ Fatal error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

