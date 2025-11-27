import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { hasSystemPermission, PERMISSIONS } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Building2, Settings } from 'lucide-react'
import { getPrisma } from '@/lib/prisma'

interface Organization {
    id: string
    slug: string
    nameEn: string
    nameSi?: string
    nameTa?: string
    groups?: Array<{ id: string; name: string; type: string }>
}

export default async function ConsolePage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const session = await auth()

    if (!session?.user?.id) {
        redirect('/en/console/login')
    }

    const { locale } = await params

    // Fetch organizations directly (same logic as API route)
    const prisma = getPrisma()
    let organizations: Organization[] = []

    try {
        const userOrgs = await prisma.userOrgGroupMap.findMany({
            where: {
                userId: session.user.id,
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

        const customGroupOrgs = await prisma.userOrgCustomGroupMap.findMany({
            where: {
                userId: session.user.id,
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

        organizations = Array.from(orgMap.values())
    } catch (error) {
        console.error('[Console Page] Error fetching organizations:', error)
    }

    // Check if user has system admin permissions
    const hasSystemAccess = await hasSystemPermission(session.user.id, PERMISSIONS.USERS_VIEW)

    async function handleSignOut() {
        'use server'
        const { signOut } = await import('@/auth')
        await signOut({ redirectTo: `/${locale}/console/login` })
    }

    const getOrgName = (org: Organization) => {
        if (locale === 'si' && org.nameSi) return org.nameSi
        if (locale === 'ta' && org.nameTa) return org.nameTa
        return org.nameEn
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            GIC Console
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Hello, <span className="font-semibold">{session.user?.name || session.user?.email}</span>
                        </p>
                    </div>
                    <form action={handleSignOut}>
                        <Button type="submit" variant="destructive">
                            Logout
                        </Button>
                    </form>
                </div>

                {hasSystemAccess && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                System Administration
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Link href={`/${locale}/console/system`}>
                                <Button variant="outline" className="w-full">
                                    Go to Admin Panel
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                        Your Organizations
                    </h2>
                    {organizations.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-gray-500 dark:text-gray-400">
                                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No organizations found. Contact your administrator for access.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {organizations.map((org) => (
                                <Link key={org.id} href={`/${locale}/console/organization/${org.slug}`}>
                                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Building2 className="h-5 w-5" />
                                                {getOrgName(org)}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {org.groups && org.groups.length > 0 && (
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    <p className="font-medium mb-1">Groups:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {org.groups.map((group) => (
                                                            <span
                                                                key={group.id}
                                                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs"
                                                            >
                                                                {group.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
