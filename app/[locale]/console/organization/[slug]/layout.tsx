import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getPrisma } from "@/lib/prisma"
import { hasOrgPermission } from "@/lib/permissions"
import { OrganizationSidebar } from "@/components/console/organization/Sidebar"

export default async function OrganizationLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ slug: string; locale: string }>
}) {
    const { slug, locale } = await params
    const session = await auth()

    if (!session?.user?.id) {
        redirect(`/${locale}/console/login`)
    }

    const prisma = getPrisma()

    // Get organization by slug
    const organization = await prisma.organization.findUnique({
        where: { slug },
        select: {
            id: true,
            slug: true,
            nameEn: true,
            nameSi: true,
            nameTa: true,
        },
    })

    if (!organization) {
        redirect(`/${locale}/console`)
    }

    // Check if user has access to this organization
    const hasAccess = await hasOrgPermission(session.user.id, organization.id, "org.info.view")

    if (!hasAccess) {
        redirect(`/${locale}/console`)
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <OrganizationSidebar organization={organization} />
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}

