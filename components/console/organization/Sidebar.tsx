"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { Building2, Users, Briefcase, Settings, ArrowLeft, LayoutGrid, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Organization {
    id: string
    slug: string
    nameEn: string
    nameSi: string | null
    nameTa: string | null
}

interface OrganizationSidebarProps {
    organization: Organization
}

export function OrganizationSidebar({ organization }: OrganizationSidebarProps) {
    const params = useParams()
    const pathname = usePathname()
    const locale = params.locale as string

    const navItems = [
        {
            label: "Overview",
            icon: LayoutGrid,
            href: `/${locale}/console/organization/${organization.slug}`,
        },
        {
            label: "Organization Info",
            icon: Settings,
            href: `/${locale}/console/organization/${organization.slug}/info`,
        },
        {
            label: "Departments",
            icon: Building2,
            href: `/${locale}/console/organization/${organization.slug}/departments`,
        },
        {
            label: "People",
            icon: Users,
            href: `/${locale}/console/organization/${organization.slug}/people`,
        },
        {
            label: "Services",
            icon: Briefcase,
            href: `/${locale}/console/organization/${organization.slug}/services`,
        },
        {
            label: "News",
            icon: Newspaper,
            href: `/${locale}/console/organization/${organization.slug}/news`,
        },
    ]

    return (
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <Link href={`/${locale}/console`}>
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Console
                    </Button>
                </Link>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {organization.nameEn}
                    </h2>
                    {organization.nameSi && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {organization.nameSi}
                        </p>
                    )}
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    
                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors cursor-pointer",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </div>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}

