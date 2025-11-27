import { auth } from "@/auth"
import { getPrisma } from "@/lib/prisma"
import { hasSystemPermission, PERMISSIONS } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, Activity } from "lucide-react"

export default async function SystemDashboard() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/en/console/login")
    }

    const canView = await hasSystemPermission(session.user.id, PERMISSIONS.USERS_VIEW)
    if (!canView) {
        // If they don't have user view permission, check if they have ANY system permission
        // For now, we'll just redirect to home if they have no access
        redirect("/en/console")
    }

    const prisma = getPrisma()

    const [userCount, activeUserCount] = await Promise.all([
        prisma.systemUser.count(),
        prisma.systemUser.count({ where: { isActive: true } }),
    ])

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">System Dashboard</h2>
                <p className="text-muted-foreground">
                    Overview of system status and user activity.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{userCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered system users
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Users
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeUserCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Users with active access
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Permission Groups
                        </CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">
                            Defined permission roles
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
