"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Edit2, X, Save, ChevronUp, ChevronDown, Phone, Mail, Trash2, User } from "lucide-react"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const departmentSchema = z.object({
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    nameEn: z.string().min(1, "English name is required"),
    nameSi: z.string().optional(),
    nameTa: z.string().optional(),
    descriptionEn: z.string().optional(),
    descriptionSi: z.string().optional(),
    descriptionTa: z.string().optional(),
    order: z.number().int(),
})

type DepartmentFormValues = z.infer<typeof departmentSchema>

interface Department {
    id: string
    slug: string
    nameEn: string
    nameSi: string | null
    nameTa: string | null
    descriptionEn: string | null
    order: number
    _count: {
        people: number
        contactInfos: number
    }
    people?: Array<{
        id: string
        fullNameEn: string
        image: string | null
    }>
    contactInfos?: Array<{
        id: string
        type: string
        value: string
        descriptionEn: string | null
    }>
}

export default function DepartmentsPage() {
    const params = useParams()
    const slug = params.slug as string
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [organizationId, setOrganizationId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const addForm = useForm<DepartmentFormValues>({
        resolver: zodResolver(departmentSchema),
        defaultValues: {
            slug: "",
            nameEn: "",
            nameSi: "",
            nameTa: "",
            descriptionEn: "",
            descriptionSi: "",
            descriptionTa: "",
            order: 0,
        },
    })

    useEffect(() => {
        fetchOrganizationId()
    }, [slug])

    const [availablePeople, setAvailablePeople] = useState<Array<{ id: string; fullNameEn: string }>>([])

    useEffect(() => {
        if (organizationId) {
            fetchDepartments()
            fetchAvailablePeople()
        }
    }, [organizationId])

    async function fetchAvailablePeople() {
        if (!organizationId) return

        try {
            const res = await fetch(`/api/console/organization/people?organizationId=${organizationId}`)
            if (res.ok) {
                const data = await res.json()
                setAvailablePeople(data.people || [])
            }
        } catch (error) {
            console.error("Failed to fetch people:", error)
        }
    }

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

    async function fetchDepartments() {
        if (!organizationId) return

        try {
            setLoading(true)
            const res = await fetch(`/api/console/organization/department?organizationId=${organizationId}`)
            if (!res.ok) throw new Error("Failed to fetch departments")
            
            const data = await res.json()
            setDepartments(data.departments || [])
        } catch (error) {
            console.error("Failed to fetch departments:", error)
            toast.error("Failed to load departments")
        } finally {
            setLoading(false)
        }
    }

    async function handleAdd(values: DepartmentFormValues) {
        if (!organizationId) return

        try {
            const res = await fetch("/api/console/organization/department", {
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

            toast.success("Department added successfully")
            setIsAdding(false)
            addForm.reset()
            fetchDepartments()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add department")
        }
    }

    async function handleEdit(departmentId: string, values: DepartmentFormValues) {
        if (!organizationId) return

        try {
            const res = await fetch("/api/console/organization/department", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: departmentId,
                    organizationId,
                    ...values,
                }),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Department updated successfully")
            setEditingId(null)
            fetchDepartments()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update department")
        }
    }

    async function handleReorder(departmentId: string, direction: "up" | "down") {
        if (!organizationId) return

        try {
            const res = await fetch("/api/console/organization/department/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organizationId,
                    departmentId,
                    direction,
                }),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Department reordered successfully")
            fetchDepartments()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to reorder department")
        }
    }

    async function handleAssignPerson(departmentId: string, personId: string) {
        if (!organizationId) return

        try {
            const res = await fetch("/api/console/organization/person-department", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organizationId,
                    personId,
                    departmentId,
                }),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Person assigned to department successfully")
            fetchDepartments()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to assign person")
        }
    }

    async function handleRemovePerson(departmentId: string, personId: string) {
        if (!organizationId) return

        try {
            const res = await fetch(
                `/api/console/organization/person-department?personId=${personId}&departmentId=${departmentId}&organizationId=${organizationId}`,
                { method: "DELETE" }
            )

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Person removed from department successfully")
            fetchDepartments()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to remove person")
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
                    <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
                    <p className="text-muted-foreground">
                        Manage departments within this organization
                    </p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Department
                    </Button>
                )}
            </div>

            {/* Add Form */}
            {isAdding && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Department</CardTitle>
                        <CardDescription>
                            Fill in the details below to create a new department
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="slug">Slug *</Label>
                                    <Input
                                        id="slug"
                                        {...addForm.register("slug")}
                                        placeholder="department-name"
                                    />
                                    {addForm.formState.errors.slug && (
                                        <p className="text-sm text-destructive mt-1">
                                            {addForm.formState.errors.slug.message}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="order">Display Order</Label>
                                    <Input
                                        id="order"
                                        type="number"
                                        {...addForm.register("order", { valueAsNumber: true })}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label htmlFor="nameEn">Name (English) *</Label>
                                    <Input
                                        id="nameEn"
                                        {...addForm.register("nameEn")}
                                        placeholder="Department Name"
                                    />
                                    {addForm.formState.errors.nameEn && (
                                        <p className="text-sm text-destructive mt-1">
                                            {addForm.formState.errors.nameEn.message}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="nameSi">Name (Sinhala)</Label>
                                    <Input
                                        id="nameSi"
                                        {...addForm.register("nameSi")}
                                        placeholder="විධාගම"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="nameTa">Name (Tamil)</Label>
                                    <Input
                                        id="nameTa"
                                        {...addForm.register("nameTa")}
                                        placeholder="துறை"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label htmlFor="descriptionEn">Description (English)</Label>
                                    <Textarea
                                        id="descriptionEn"
                                        {...addForm.register("descriptionEn")}
                                        rows={3}
                                        placeholder="Department description..."
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="descriptionSi">Description (Sinhala)</Label>
                                    <Textarea
                                        id="descriptionSi"
                                        {...addForm.register("descriptionSi")}
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="descriptionTa">Description (Tamil)</Label>
                                    <Textarea
                                        id="descriptionTa"
                                        {...addForm.register("descriptionTa")}
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAdding(false)
                                        addForm.reset()
                                    }}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={addForm.formState.isSubmitting}>
                                    {addForm.formState.isSubmitting && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {!addForm.formState.isSubmitting && (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Add Department
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Departments List */}
            {departments.length === 0 && !isAdding ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Departments</CardTitle>
                        <CardDescription>
                            Get started by creating your first department.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Departments ({departments.length})</CardTitle>
                        <CardDescription>
                            List of all departments in this organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {departments.map((dept) => (
                                <DepartmentRow
                                    key={dept.id}
                                    department={dept}
                                    organizationId={organizationId!}
                                    isEditing={editingId === dept.id}
                                    isFirst={departments.indexOf(dept) === 0}
                                    isLast={departments.indexOf(dept) === departments.length - 1}
                                    onEdit={() => setEditingId(dept.id)}
                                    onCancel={() => setEditingId(null)}
                                    onSave={handleEdit}
                                    onReorder={handleReorder}
                                    onRefresh={fetchDepartments}
                                    availablePeople={availablePeople}
                                    onAssignPerson={handleAssignPerson}
                                    onRemovePerson={handleRemovePerson}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function DepartmentRow({
    department,
    organizationId,
    isEditing,
    isFirst,
    isLast,
    onEdit,
    onCancel,
    onSave,
    onReorder,
    onRefresh,
    availablePeople,
    onAssignPerson,
    onRemovePerson,
}: {
    department: Department
    organizationId: string
    isEditing: boolean
    isFirst: boolean
    isLast: boolean
    onEdit: () => void
    onCancel: () => void
    onSave: (id: string, values: DepartmentFormValues) => Promise<void>
    onReorder: (id: string, direction: "up" | "down") => Promise<void>
    onRefresh: () => void
    availablePeople: Array<{ id: string; fullNameEn: string }>
    onAssignPerson: (departmentId: string, personId: string) => Promise<void>
    onRemovePerson: (departmentId: string, personId: string) => Promise<void>
}) {
    const editForm = useForm<DepartmentFormValues>({
        resolver: zodResolver(departmentSchema),
        defaultValues: {
            slug: department.slug,
            nameEn: department.nameEn,
            nameSi: department.nameSi || "",
            nameTa: department.nameTa || "",
            descriptionEn: department.descriptionEn || "",
            descriptionSi: "",
            descriptionTa: "",
            order: department.order,
        },
    })

    if (isEditing) {
        return (
            <div className="border rounded-lg p-4 bg-muted/50">
                <form
                    onSubmit={editForm.handleSubmit((values) => onSave(department.id, values))}
                    className="space-y-4"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor={`edit-slug-${department.id}`}>Slug *</Label>
                            <Input
                                id={`edit-slug-${department.id}`}
                                {...editForm.register("slug")}
                            />
                        </div>
                        <div>
                            <Label htmlFor={`edit-order-${department.id}`}>Display Order</Label>
                            <Input
                                id={`edit-order-${department.id}`}
                                type="number"
                                {...editForm.register("order", { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <Label htmlFor={`edit-nameEn-${department.id}`}>Name (English) *</Label>
                            <Input
                                id={`edit-nameEn-${department.id}`}
                                {...editForm.register("nameEn")}
                            />
                        </div>
                        <div>
                            <Label htmlFor={`edit-nameSi-${department.id}`}>Name (Sinhala)</Label>
                            <Input
                                id={`edit-nameSi-${department.id}`}
                                {...editForm.register("nameSi")}
                            />
                        </div>
                        <div>
                            <Label htmlFor={`edit-nameTa-${department.id}`}>Name (Tamil)</Label>
                            <Input
                                id={`edit-nameTa-${department.id}`}
                                {...editForm.register("nameTa")}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={editForm.formState.isSubmitting}>
                            {editForm.formState.isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {!editForm.formState.isSubmitting && (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </form>
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
                        onClick={() => onReorder(department.id, "up")}
                        disabled={isFirst}
                        title="Move up"
                    >
                        <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onReorder(department.id, "down")}
                        disabled={isLast}
                        title="Move down"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="font-medium text-lg">{department.nameEn}</div>
                            {department.nameSi && (
                                <div className="text-sm text-muted-foreground">{department.nameSi}</div>
                            )}
                            {department.descriptionEn && (
                                <div className="text-sm text-muted-foreground mt-1">
                                    {department.descriptionEn}
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Order: {department.order} | People: {department._count.people} | Contacts: {department._count.contactInfos}
                        </div>
                    </div>
                </div>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
            </Button>
        </div>
    )
}
