"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Briefcase, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Organization {
    id: string
    slug: string
    nameEn: string
    nameSi: string | null
    nameTa: string | null
    email: string | null
    phone: string | null
    website: string | null
    addressEn: string | null
    addressSi: string | null
    addressTa: string | null
    descriptionEn: string | null
    descriptionSi: string | null
    descriptionTa: string | null
    logo: string | null
}

interface Stats {
    departments: number
    people: number
    services: number
}

export default function OrganizationPage() {
    const params = useParams()
    const slug = params.slug as string
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [stats, setStats] = useState<Stats>({ departments: 0, people: 0, services: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOrganization()
        fetchStats()
    }, [slug])

    async function fetchOrganization() {
        try {
            setLoading(true)
            // Get all organizations user has access to
            const listRes = await fetch(`/api/console/organization/list`)
            if (!listRes.ok) throw new Error("Failed to fetch organizations")
            
            const listData = await listRes.json()
            const org = listData.organizations?.find((o: Organization) => o.slug === slug)
            
            if (!org) {
                toast.error("Organization not found")
                return
            }

            // Get full details
            const detailRes = await fetch(`/api/console/organization/edit-info?organizationId=${org.id}`)
            if (!detailRes.ok) throw new Error("Failed to fetch organization details")
            
            const detailData = await detailRes.json()
            setOrganization(detailData)
        } catch (error) {
            console.error("Failed to fetch organization:", error)
            toast.error("Failed to load organization")
        } finally {
            setLoading(false)
        }
    }

    async function fetchStats() {
        try {
            if (!organization) return

            const [deptRes, peopleRes, serviceRes] = await Promise.all([
                fetch(`/api/console/organization/department?organizationId=${organization.id}`),
                fetch(`/api/console/organization/people?organizationId=${organization.id}`),
                fetch(`/api/console/organization/service?organizationId=${organization.id}`),
            ])

            const [deptData, peopleData, serviceData] = await Promise.all([
                deptRes.json(),
                peopleRes.json(),
                serviceRes.json(),
            ])

            setStats({
                departments: deptData.departments?.length || 0,
                people: peopleData.people?.length || 0,
                services: serviceData.services?.length || 0,
            })
        } catch (error) {
            console.error("Failed to fetch stats:", error)
        }
    }

    useEffect(() => {
        if (organization) {
            fetchStats()
        }
    }, [organization])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!organization) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Organization not found</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{organization.nameEn}</h1>
                {organization.nameSi && (
                    <p className="text-muted-foreground mt-1">{organization.nameSi}</p>
                )}
                {organization.descriptionEn && (
                    <p className="text-muted-foreground mt-2">{organization.descriptionEn}</p>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Departments</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.departments}</div>
                        <p className="text-xs text-muted-foreground">Total departments</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">People</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.people}</div>
                        <p className="text-xs text-muted-foreground">Organizational people</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Services</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.services}</div>
                        <p className="text-xs text-muted-foreground">Active services</p>
                    </CardContent>
                </Card>
            </div>

            {/* Organization Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Organization Information</CardTitle>
                    <CardDescription>Basic details about this organization</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {organization.email && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Email</p>
                                <p className="text-sm">{organization.email}</p>
                            </div>
                        )}
                        {organization.phone && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                                <p className="text-sm">{organization.phone}</p>
                            </div>
                        )}
                        {organization.website && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Website</p>
                                <a
                                    href={organization.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline"
                                >
                                    {organization.website}
                                </a>
                            </div>
                        )}
                        {organization.addressEn && (
                            <div className="md:col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">Address</p>
                                <p className="text-sm">{organization.addressEn}</p>
                                {organization.addressSi && (
                                    <p className="text-sm text-muted-foreground mt-1">{organization.addressSi}</p>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

