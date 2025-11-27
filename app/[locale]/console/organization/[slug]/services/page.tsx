"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Edit2, X, Save, ChevronUp, ChevronDown, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const serviceSchema = z.object({
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    nameEn: z.string().min(1, "English name is required"),
    nameSi: z.string().optional(),
    nameTa: z.string().optional(),
    descriptionEn: z.string().optional(),
    descriptionSi: z.string().optional(),
    descriptionTa: z.string().optional(),
    requiredDocsEn: z.string().optional(),
    requiredDocsSi: z.string().optional(),
    requiredDocsTa: z.string().optional(),
    paymentDetailsEn: z.string().optional(),
    paymentDetailsSi: z.string().optional(),
    paymentDetailsTa: z.string().optional(),
    processingTimeEn: z.string().optional(),
    processingTimeSi: z.string().optional(),
    processingTimeTa: z.string().optional(),
    serviceUrl: z.string().url().optional().or(z.literal("")),
    status: z.enum(["ACTIVE", "HIDDEN"]),
    order: z.number().int(),
    ctas: z.array(z.object({
        label: z.string().min(1),
        url: z.string().url(),
    })).optional(),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

interface Service {
    id: string
    slug: string
    nameEn: string
    nameSi: string | null
    nameTa: string | null
    descriptionEn: string | null
    serviceUrl: string | null
    status: string
    order: number
    ctas: Array<{
        id: string
        label: string
        url: string
    }>
}

export default function ServicesPage() {
    const params = useParams()
    const slug = params.slug as string
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [organizationId, setOrganizationId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const addForm = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            slug: "",
            nameEn: "",
            nameSi: "",
            nameTa: "",
            descriptionEn: "",
            descriptionSi: "",
            descriptionTa: "",
            requiredDocsEn: "",
            requiredDocsSi: "",
            requiredDocsTa: "",
            paymentDetailsEn: "",
            paymentDetailsSi: "",
            paymentDetailsTa: "",
            processingTimeEn: "",
            processingTimeSi: "",
            processingTimeTa: "",
            serviceUrl: "",
            status: "ACTIVE",
            order: 0,
            ctas: [],
        },
    })

    useEffect(() => {
        fetchOrganizationId()
    }, [slug])

    useEffect(() => {
        if (organizationId) {
            fetchServices()
        }
    }, [organizationId])

    async function fetchOrganizationId() {
        try {
            const res = await fetch(`/api/console/organization/list`)
            if (!res.ok) throw new Error("Failed to fetch organizations")
            
            const data = await res.json()
            const org = data.organizations?.find((o: any) => o.slug === slug)
            
            if (org) {
                setOrganizationId(org.id)
            }
        } catch (error) {
            console.error("Failed to fetch organization:", error)
        }
    }

    async function fetchServices() {
        if (!organizationId) return

        try {
            setLoading(true)
            const res = await fetch(`/api/console/organization/service?organizationId=${organizationId}`)
            if (!res.ok) throw new Error("Failed to fetch services")
            
            const data = await res.json()
            setServices(data.services || [])
        } catch (error) {
            console.error("Failed to fetch services:", error)
            toast.error("Failed to load services")
        } finally {
            setLoading(false)
        }
    }

    async function handleAdd(values: ServiceFormValues) {
        if (!organizationId) return

        try {
            const res = await fetch("/api/console/organization/service", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organizationId,
                    ...values,
                }),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Service added successfully")
            setIsAdding(false)
            addForm.reset()
            fetchServices()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add service")
        }
    }

    async function handleEdit(serviceId: string, values: ServiceFormValues) {
        if (!organizationId) return

        try {
            const res = await fetch("/api/console/organization/service", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: serviceId,
                    organizationId,
                    ...values,
                }),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Service updated successfully")
            setEditingId(null)
            fetchServices()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update service")
        }
    }

    async function handleReorder(serviceId: string, direction: "up" | "down") {
        if (!organizationId) return

        try {
            const res = await fetch("/api/console/organization/service/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organizationId,
                    serviceId,
                    direction,
                }),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Service reordered successfully")
            fetchServices()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to reorder service")
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Services</h1>
                    <p className="text-muted-foreground">
                        Manage services offered by this organization
                    </p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Service
                    </Button>
                )}
            </div>

            {/* Add Form */}
            {isAdding && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Service</CardTitle>
                        <CardDescription>
                            Fill in the details below to create a new service
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ServiceForm
                            form={addForm}
                            onSubmit={handleAdd}
                            onCancel={() => {
                                setIsAdding(false)
                                addForm.reset()
                            }}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Services List */}
            {services.length === 0 && !isAdding ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Services</CardTitle>
                        <CardDescription>
                            Get started by creating your first service.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Services ({services.length})</CardTitle>
                        <CardDescription>
                            List of all services offered by this organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {services.map((service, index) => (
                                <ServiceRow
                                    key={service.id}
                                    service={service}
                                    organizationId={organizationId!}
                                    isEditing={editingId === service.id}
                                    isFirst={index === 0}
                                    isLast={index === services.length - 1}
                                    onEdit={() => setEditingId(service.id)}
                                    onCancel={() => setEditingId(null)}
                                    onSave={handleEdit}
                                    onReorder={handleReorder}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function ServiceForm({
    form,
    onSubmit,
    onCancel,
}: {
    form: ReturnType<typeof useForm<ServiceFormValues>>
    onSubmit: (values: ServiceFormValues) => Promise<void>
    onCancel: () => void
}) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "ctas",
    })

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                        id="slug"
                        {...form.register("slug")}
                        placeholder="service-name"
                    />
                    {form.formState.errors.slug && (
                        <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.slug.message}
                        </p>
                    )}
                </div>
                <div>
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                        id="order"
                        type="number"
                        {...form.register("order", { valueAsNumber: true })}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label htmlFor="nameEn">Name (English) *</Label>
                    <Input
                        id="nameEn"
                        {...form.register("nameEn")}
                        placeholder="Service Name"
                    />
                    {form.formState.errors.nameEn && (
                        <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.nameEn.message}
                        </p>
                    )}
                </div>
                <div>
                    <Label htmlFor="nameSi">Name (Sinhala)</Label>
                    <Input
                        id="nameSi"
                        {...form.register("nameSi")}
                    />
                </div>
                <div>
                    <Label htmlFor="nameTa">Name (Tamil)</Label>
                    <Input
                        id="nameTa"
                        {...form.register("nameTa")}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="serviceUrl">Service URL</Label>
                    <Input
                        id="serviceUrl"
                        type="url"
                        {...form.register("serviceUrl")}
                        placeholder="https://example.com/service"
                    />
                </div>
                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                        {...form.register("status")}
                        value={form.watch("status")}
                        onValueChange={(value) => form.setValue("status", value as "ACTIVE" | "HIDDEN")}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="HIDDEN">Hidden</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label htmlFor="descriptionEn">Description (English)</Label>
                    <Textarea
                        id="descriptionEn"
                        {...form.register("descriptionEn")}
                        rows={3}
                        placeholder="Service description..."
                    />
                </div>
                <div>
                    <Label htmlFor="descriptionSi">Description (Sinhala)</Label>
                    <Textarea
                        id="descriptionSi"
                        {...form.register("descriptionSi")}
                        rows={3}
                    />
                </div>
                <div>
                    <Label htmlFor="descriptionTa">Description (Tamil)</Label>
                    <Textarea
                        id="descriptionTa"
                        {...form.register("descriptionTa")}
                        rows={3}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label htmlFor="requiredDocsEn">Required Documents (English)</Label>
                    <Textarea
                        id="requiredDocsEn"
                        {...form.register("requiredDocsEn")}
                        rows={3}
                        placeholder="List required documents..."
                    />
                </div>
                <div>
                    <Label htmlFor="requiredDocsSi">Required Documents (Sinhala)</Label>
                    <Textarea
                        id="requiredDocsSi"
                        {...form.register("requiredDocsSi")}
                        rows={3}
                    />
                </div>
                <div>
                    <Label htmlFor="requiredDocsTa">Required Documents (Tamil)</Label>
                    <Textarea
                        id="requiredDocsTa"
                        {...form.register("requiredDocsTa")}
                        rows={3}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label htmlFor="paymentDetailsEn">Payment Details (English)</Label>
                    <Textarea
                        id="paymentDetailsEn"
                        {...form.register("paymentDetailsEn")}
                        rows={3}
                        placeholder="Payment information..."
                    />
                </div>
                <div>
                    <Label htmlFor="paymentDetailsSi">Payment Details (Sinhala)</Label>
                    <Textarea
                        id="paymentDetailsSi"
                        {...form.register("paymentDetailsSi")}
                        rows={3}
                    />
                </div>
                <div>
                    <Label htmlFor="paymentDetailsTa">Payment Details (Tamil)</Label>
                    <Textarea
                        id="paymentDetailsTa"
                        {...form.register("paymentDetailsTa")}
                        rows={3}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label htmlFor="processingTimeEn">Processing Time (English)</Label>
                    <Input
                        id="processingTimeEn"
                        {...form.register("processingTimeEn")}
                        placeholder="e.g., 5-7 business days"
                    />
                </div>
                <div>
                    <Label htmlFor="processingTimeSi">Processing Time (Sinhala)</Label>
                    <Input
                        id="processingTimeSi"
                        {...form.register("processingTimeSi")}
                    />
                </div>
                <div>
                    <Label htmlFor="processingTimeTa">Processing Time (Tamil)</Label>
                    <Input
                        id="processingTimeTa"
                        {...form.register("processingTimeTa")}
                    />
                </div>
            </div>

            {/* CTAs */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <Label>Call-to-Action Buttons</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ label: "", url: "" })}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add CTA
                    </Button>
                </div>
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 mb-2">
                        <Input
                            placeholder="Button Label"
                            {...form.register(`ctas.${index}.label`)}
                        />
                        <Input
                            placeholder="URL"
                            type="url"
                            {...form.register(`ctas.${index}.url`)}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => remove(index)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={form.formState.isSubmitting}
                >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {!form.formState.isSubmitting && (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                </Button>
            </div>
        </form>
    )
}

function ServiceRow({
    service,
    organizationId,
    isEditing,
    isFirst,
    isLast,
    onEdit,
    onCancel,
    onSave,
    onReorder,
}: {
    service: Service
    organizationId: string
    isEditing: boolean
    isFirst: boolean
    isLast: boolean
    onEdit: () => void
    onCancel: () => void
    onSave: (id: string, values: ServiceFormValues) => Promise<void>
    onReorder: (id: string, direction: "up" | "down") => Promise<void>
}) {
    const editForm = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            slug: service.slug,
            nameEn: service.nameEn,
            nameSi: service.nameSi || "",
            nameTa: service.nameTa || "",
            descriptionEn: "",
            descriptionSi: "",
            descriptionTa: "",
            requiredDocsEn: "",
            requiredDocsSi: "",
            requiredDocsTa: "",
            paymentDetailsEn: "",
            paymentDetailsSi: "",
            paymentDetailsTa: "",
            processingTimeEn: "",
            processingTimeSi: "",
            processingTimeTa: "",
            serviceUrl: service.serviceUrl || "",
            status: service.status as "ACTIVE" | "HIDDEN",
            order: service.order,
            ctas: service.ctas.map(cta => ({ label: cta.label, url: cta.url })),
        },
    })

    if (isEditing) {
        return (
            <div className="border rounded-lg p-4 bg-muted/50">
                <ServiceForm
                    form={editForm}
                    onSubmit={(values) => onSave(service.id, values)}
                    onCancel={onCancel}
                />
            </div>
        )
    }

    return (
        <div className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4 flex-1">
                <div className="flex flex-col gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onReorder(service.id, "up")}
                        disabled={isFirst}
                        title="Move up"
                    >
                        <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onReorder(service.id, "down")}
                        disabled={isLast}
                        title="Move down"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <div className="font-medium text-lg">{service.nameEn}</div>
                        <Badge variant={service.status === "ACTIVE" ? "default" : "secondary"}>
                            {service.status}
                        </Badge>
                    </div>
                    {service.nameSi && (
                        <div className="text-sm text-muted-foreground">{service.nameSi}</div>
                    )}
                    {service.descriptionEn && (
                        <div className="text-sm text-muted-foreground mt-1">
                            {service.descriptionEn}
                        </div>
                    )}
                    {service.serviceUrl && (
                        <a
                            href={service.serviceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                            {service.serviceUrl}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    )}
                    {service.ctas.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                            {service.ctas.length} CTA button(s)
                        </div>
                    )}
                </div>
                <div className="text-sm text-muted-foreground">
                    Order: {service.order}
                </div>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
            </Button>
        </div>
    )
}
