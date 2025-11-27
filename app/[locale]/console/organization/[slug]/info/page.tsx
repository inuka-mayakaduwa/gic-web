"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Edit2, Save, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { OrganizationInfoForm } from "@/components/console/organization/InfoForm"

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

export default function OrganizationInfoPage() {
    const params = useParams()
    const slug = params.slug as string
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchOrganization()
    }, [slug])

    async function fetchOrganization() {
        try {
            setLoading(true)
            const listRes = await fetch(`/api/console/organization/list`)
            if (!listRes.ok) throw new Error("Failed to fetch organizations")
            
            const listData = await listRes.json()
            const org = listData.organizations?.find((o: Organization) => o.slug === slug)
            
            if (!org) {
                toast.error("Organization not found")
                return
            }

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

    async function handleUpdate(values: any) {
        if (!organization) return

        try {
            setIsSaving(true)
            const res = await fetch("/api/console/organization/edit-info", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organizationId: organization.id,
                    ...values,
                }),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            const updated = await res.json()
            setOrganization(updated)
            setIsEditing(false)
            toast.success("Organization information updated successfully")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update organization")
        } finally {
            setIsSaving(false)
        }
    }

    function handleCancel() {
        setIsEditing(false)
        // Optionally reload to discard changes
        fetchOrganization()
    }

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
            {/* Header with Edit Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organization Information</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage basic information for {organization.nameEn}
                    </p>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit Information
                    </Button>
                )}
            </div>

            {/* Form or View */}
            {isEditing ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
                    <OrganizationInfoForm
                        initialData={{
                            nameEn: organization.nameEn,
                            nameSi: organization.nameSi ?? undefined,
                            nameTa: organization.nameTa ?? undefined,
                            email: organization.email ?? undefined,
                            phone: organization.phone ?? undefined,
                            addressEn: organization.addressEn ?? undefined,
                            addressSi: organization.addressSi ?? undefined,
                            addressTa: organization.addressTa ?? undefined,
                            descriptionEn: organization.descriptionEn ?? undefined,
                            descriptionSi: organization.descriptionSi ?? undefined,
                            descriptionTa: organization.descriptionTa ?? undefined,
                            website: organization.website ?? undefined,
                        }}
                        onSubmit={handleUpdate}
                        onCancel={handleCancel}
                        isSubmitting={isSaving}
                    />
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                    Names
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">English Name</p>
                                        <p className="text-lg font-medium">{organization.nameEn || <span className="text-muted-foreground italic">Not set</span>}</p>
                                    </div>
                                    {organization.nameSi ? (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Sinhala Name</p>
                                            <p className="text-lg">{organization.nameSi}</p>
                                        </div>
                                    ) : null}
                                    {organization.nameTa ? (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Tamil Name</p>
                                            <p className="text-lg">{organization.nameTa}</p>
                                        </div>
                                    ) : null}
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Slug</p>
                                        <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                                            {organization.slug}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            {(organization.email || organization.phone || organization.website) && (
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                        Contact Information
                                    </h3>
                                    <div className="space-y-3">
                                        {organization.email && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Email</p>
                                                <p className="text-lg">{organization.email}</p>
                                            </div>
                                        )}
                                        {organization.phone && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                                                <p className="text-lg">{organization.phone}</p>
                                            </div>
                                        )}
                                        {organization.website && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Website</p>
                                                <a
                                                    href={organization.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-lg text-primary hover:underline break-all"
                                                >
                                                    {organization.website}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            {(organization.addressEn || organization.addressSi || organization.addressTa) && (
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                        Address
                                    </h3>
                                    <div className="space-y-3">
                                        {organization.addressEn && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">English</p>
                                                <p className="text-lg whitespace-pre-wrap">{organization.addressEn}</p>
                                            </div>
                                        )}
                                        {organization.addressSi && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Sinhala</p>
                                                <p className="text-lg whitespace-pre-wrap">{organization.addressSi}</p>
                                            </div>
                                        )}
                                        {organization.addressTa && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Tamil</p>
                                                <p className="text-lg whitespace-pre-wrap">{organization.addressTa}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(organization.descriptionEn || organization.descriptionSi || organization.descriptionTa) && (
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                        Description
                                    </h3>
                                    <div className="space-y-3">
                                        {organization.descriptionEn && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">English</p>
                                                <p className="text-lg whitespace-pre-wrap">{organization.descriptionEn}</p>
                                            </div>
                                        )}
                                        {organization.descriptionSi && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Sinhala</p>
                                                <p className="text-lg whitespace-pre-wrap">{organization.descriptionSi}</p>
                                            </div>
                                        )}
                                        {organization.descriptionTa && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Tamil</p>
                                                <p className="text-lg whitespace-pre-wrap">{organization.descriptionTa}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
