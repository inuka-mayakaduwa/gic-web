"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Shield, Settings, LayoutDashboard, Building2 } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface SidebarItem {
    title: string
    href: string
    icon: React.ElementType
    permission?: string
}

const items: SidebarItem[] = [
    {
        title: "Dashboard",
        href: "/en/console/system",
        icon: LayoutDashboard,
    },
    {
        title: "User Management",
        href: "/en/console/system/users",
        icon: Users,
        permission: "system.users.view",
    },
    {
        title: "Organizations",
        href: "/en/console/system/organizations",
        icon: Building2,
        permission: "system.organizations.view",
    },
    {
        title: "Permission Groups",
        href: "/en/console/system/permissions",
        icon: Shield,
        permission: "system.permissions.view",
    },
    {
        title: "Settings",
        href: "/en/console/system/settings",
        icon: Settings,
        permission: "system.settings.view",
    },
]

export function SystemSidebar() {
    const pathname = usePathname()
    const [authorizedItems, setAuthorizedItems] = useState<SidebarItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function checkPermissions() {
            try {
                const checkedItems = await Promise.all(
                    items.map(async (item) => {
                        if (!item.permission) return item

                        const res = await fetch("/api/system/permissions/check", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ permission: item.permission }),
                        })

                        if (!res.ok) return null

                        const { hasPermission } = await res.json()
                        return hasPermission ? item : null
                    })
                )
                setAuthorizedItems(checkedItems.filter((item): item is SidebarItem => item !== null))
            } catch (error) {
                console.error("Failed to check permissions:", error)
            } finally {
                setLoading(false)
            }
        }

        checkPermissions()
    }, [])

    if (loading) {
        return <div className="w-64 h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 animate-pulse" />
    }

    if (authorizedItems.length === 0) return null

    return (
        <div className="w-64 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:block">
            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">System Console</h2>
            </div>
            <nav className="px-4 space-y-1">
                {authorizedItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-blue-700 dark:text-blue-400" : "text-gray-400")} />
                            {item.title}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
