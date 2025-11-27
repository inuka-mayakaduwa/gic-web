"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Edit2, X, Save, ChevronUp, ChevronDown, Upload, Phone, Mail, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const personSchema = z.object({
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    titleEn: z.string().optional(),
    titleSi: z.string().optional(),
    titleTa: z.string().optional(),
    fullNameEn: z.string().min(1, "English full name is required"),
    fullNameSi: z.string().optional(),
    fullNameTa: z.string().optional(),
    designationEn: z.string().optional(),
    designationSi: z.string().optional(),
    designationTa: z.string().optional(),
    bioEn: z.string().optional(),
    bioSi: z.string().optional(),
    bioTa: z.string().optional(),
    image: z.string().optional(),
    order: z.number().int(),
})

type PersonFormValues = z.infer<typeof personSchema>

interface Person {
    id: string
    slug: string
    titleEn: string | null
    titleSi: string | null
    titleTa: string | null
    fullNameEn: string
    fullNameSi: string | null
    fullNameTa: string | null
    designationEn: string | null
    designationSi: string | null
    designationTa: string | null
    bioEn: string | null
    bioSi: string | null
    bioTa: string | null
    image: string | null
    order: number
    _count: {
        contactInfos: number
    }
    departments: Array<{
        id: string
        nameEn: string
    }>
    contactInfos?: Array<{
        id: string
        type: string
        value: string
        descriptionEn: string | null
    }>
}

export default function PeoplePage() {
    const params = useParams()
    const slug = params.slug as string
    const [people, setPeople] = useState<Person[]>([])
    const [loading, setLoading] = useState(true)
    const [organizationId, setOrganizationId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [availableDepartments, setAvailableDepartments] = useState<Array<{ id: string; nameEn: string }>>([])

    const addForm = useForm<PersonFormValues>({
        resolver: zodResolver(personSchema),
        defaultValues: {
            slug: "",
            titleEn: "",
            titleSi: "",
            titleTa: "",
            fullNameEn: "",
            fullNameSi: "",
            fullNameTa: "",
            designationEn: "",
            designationSi: "",
            designationTa: "",
            bioEn: "",
            bioSi: "",
            bioTa: "",
            image: "",
            order: 0,
        },
    })

    useEffect(() => {
        fetchOrganizationId()
    }, [slug])

    useEffect(() => {
        if (organizationId) {
            fetchPeople()
            fetchDepartments()
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

    async function fetchDepartments() {
        if (!organizationId) return

        try {
            const res = await fetch(`/api/console/organization/department?organizationId=${organizationId}`)
            if (!res.ok) throw new Error("Failed to fetch departments")
            
            const data = await res.json()
            setAvailableDepartments(data.departments || [])
        } catch (error) {
            console.error("Failed to fetch departments:", error)
        }
    }

    async function fetchPeople() {
        if (!organizationId) return

        try {
            setLoading(true)
            const res = await fetch(`/api/console/organization/people?organizationId=${organizationId}`)
            if (!res.ok) throw new Error("Failed to fetch people")
            
            const data = await res.json()
            setPeople(data.people || [])
        } catch (error) {
            console.error("Failed to fetch people:", error)
            toast.error("Failed to load people")
        } finally {
            setLoading(false)
        }
    }

    async function handleImageUpload(file: File, isPublic: boolean) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("path", "people")
        formData.append("isPublic", isPublic.toString())

        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        })

        if (!res.ok) {
            const error = await res.text()
            throw new Error(error)
        }

        const data = await res.json()
        return data.filePath
    }

    async function handleAdd(values: PersonFormValues) {
        if (!organizationId) return

        try {
            const res = await fetch("/api/console/organization/people", {
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

            toast.success("Person added successfully")
            setIsAdding(false)
            addForm.reset()
            fetchPeople()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add person")
        }
    }

    async function handleEdit(personId: string, values: PersonFormValues) {
        if (!organizationId) return

        try {
            const res = await fetch("/api/console/organization/people", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: personId,
                    organizationId,
                    ...values,
                }),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Person updated successfully")
            setEditingId(null)
            fetchPeople()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update person")
        }
    }

    async function handleReorder(personId: string, direction: "up" | "down") {
        if (!organizationId) return

        try {
            const res = await fetch("/api/console/organization/people/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organizationId,
                    personId,
                    direction,
                }),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Person reordered successfully")
            fetchPeople()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to reorder person")
        }
    }

    async function handleAssignDepartment(personId: string, departmentId: string) {
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
            fetchPeople()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to assign person")
        }
    }

    async function handleRemoveDepartment(personId: string, departmentId: string) {
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
            fetchPeople()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to remove person")
        }
    }

    function getInitials(name: string) {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
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
                    <h1 className="text-3xl font-bold tracking-tight">People</h1>
                    <p className="text-muted-foreground">
                        Manage organizational people (not system users)
                    </p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Person
                    </Button>
                )}
            </div>

            {/* Add Form */}
            {isAdding && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Person</CardTitle>
                        <CardDescription>
                            Fill in the details below to add a new person
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PersonForm
                            form={addForm}
                            onSubmit={handleAdd}
                            onCancel={() => {
                                setIsAdding(false)
                                addForm.reset()
                            }}
                            onImageUpload={handleImageUpload}
                            availableDepartments={availableDepartments}
                            organizationId={organizationId!}
                        />
                    </CardContent>
                </Card>
            )}

            {/* People List */}
            {people.length === 0 && !isAdding ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No People</CardTitle>
                        <CardDescription>
                            Get started by adding your first person.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>People ({people.length})</CardTitle>
                        <CardDescription>
                            List of all people in this organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {people.map((person, index) => (
                                <PersonRow
                                    key={person.id}
                                    person={person}
                                    organizationId={organizationId!}
                                    isEditing={editingId === person.id}
                                    isFirst={index === 0}
                                    isLast={index === people.length - 1}
                                    onEdit={() => setEditingId(person.id)}
                                    onCancel={() => setEditingId(null)}
                                    onSave={handleEdit}
                                    onReorder={handleReorder}
                                    onImageUpload={handleImageUpload}
                                    availableDepartments={availableDepartments}
                                    onAssignDepartment={handleAssignDepartment}
                                    onRemoveDepartment={handleRemoveDepartment}
                                    onRefresh={fetchPeople}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function PersonForm({
    form,
    onSubmit,
    onCancel,
    onImageUpload,
    availableDepartments,
    organizationId,
    initialImage,
}: {
    form: ReturnType<typeof useForm<PersonFormValues>>
    onSubmit: (values: PersonFormValues) => Promise<void>
    onCancel: () => void
    onImageUpload: (file: File, isPublic: boolean) => Promise<string>
    availableDepartments: Array<{ id: string; nameEn: string }>
    organizationId: string
    initialImage?: string | null
}) {
    const [uploadingImage, setUploadingImage] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(initialImage || null)
    const [isImagePublic, setIsImagePublic] = useState(true)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }

        try {
            setUploadingImage(true)
            const url = await onImageUpload(file, isImagePublic)
            form.setValue("image", url)
            setImagePreview(url)
            toast.success("Image uploaded successfully")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to upload image")
        } finally {
            setUploadingImage(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                        id="slug"
                        {...form.register("slug")}
                        placeholder="person-name"
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

            {/* Image Upload */}
            <div>
                <Label>Profile Image</Label>
                <div className="flex items-center gap-4 mt-2">
                    {imagePreview && (
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={imagePreview} alt="Preview" />
                            <AvatarFallback>IMG</AvatarFallback>
                        </Avatar>
                    )}
                    <div className="flex-1">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={uploadingImage}
                            className="cursor-pointer"
                        />
                        <div className="flex items-center space-x-2 mt-2">
                            <Checkbox
                                id="isPublic"
                                checked={isImagePublic}
                                onCheckedChange={(checked) => setIsImagePublic(checked === true)}
                            />
                            <Label htmlFor="isPublic" className="text-sm font-normal cursor-pointer">
                                Make image publicly accessible
                            </Label>
                        </div>
                        {uploadingImage && (
                            <p className="text-sm text-muted-foreground mt-1">Uploading...</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label htmlFor="titleEn">Title (English)</Label>
                    <Input
                        id="titleEn"
                        {...form.register("titleEn")}
                        placeholder="Mr., Mrs., Dr., etc."
                    />
                </div>
                <div>
                    <Label htmlFor="titleSi">Title (Sinhala)</Label>
                    <Input
                        id="titleSi"
                        {...form.register("titleSi")}
                    />
                </div>
                <div>
                    <Label htmlFor="titleTa">Title (Tamil)</Label>
                    <Input
                        id="titleTa"
                        {...form.register("titleTa")}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label htmlFor="fullNameEn">Full Name (English) *</Label>
                    <Input
                        id="fullNameEn"
                        {...form.register("fullNameEn")}
                        placeholder="John Doe"
                    />
                    {form.formState.errors.fullNameEn && (
                        <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.fullNameEn.message}
                        </p>
                    )}
                </div>
                <div>
                    <Label htmlFor="fullNameSi">Full Name (Sinhala)</Label>
                    <Input
                        id="fullNameSi"
                        {...form.register("fullNameSi")}
                    />
                </div>
                <div>
                    <Label htmlFor="fullNameTa">Full Name (Tamil)</Label>
                    <Input
                        id="fullNameTa"
                        {...form.register("fullNameTa")}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label htmlFor="designationEn">Designation (English)</Label>
                    <Input
                        id="designationEn"
                        {...form.register("designationEn")}
                        placeholder="Director, Manager, etc."
                    />
                </div>
                <div>
                    <Label htmlFor="designationSi">Designation (Sinhala)</Label>
                    <Input
                        id="designationSi"
                        {...form.register("designationSi")}
                    />
                </div>
                <div>
                    <Label htmlFor="designationTa">Designation (Tamil)</Label>
                    <Input
                        id="designationTa"
                        {...form.register("designationTa")}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label htmlFor="bioEn">Bio (English)</Label>
                    <Textarea
                        id="bioEn"
                        {...form.register("bioEn")}
                        rows={4}
                        placeholder="Brief biography..."
                    />
                </div>
                <div>
                    <Label htmlFor="bioSi">Bio (Sinhala)</Label>
                    <Textarea
                        id="bioSi"
                        {...form.register("bioSi")}
                        rows={4}
                    />
                </div>
                <div>
                    <Label htmlFor="bioTa">Bio (Tamil)</Label>
                    <Textarea
                        id="bioTa"
                        {...form.register("bioTa")}
                        rows={4}
                    />
                </div>
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

function PersonRow({
    person,
    organizationId,
    isEditing,
    isFirst,
    isLast,
    onEdit,
    onCancel,
    onSave,
    onReorder,
    onImageUpload,
    availableDepartments,
    onAssignDepartment,
    onRemoveDepartment,
    onRefresh,
}: {
    person: Person
    organizationId: string
    isEditing: boolean
    isFirst: boolean
    isLast: boolean
    onEdit: () => void
    onCancel: () => void
    onSave: (id: string, values: PersonFormValues) => Promise<void>
    onReorder: (id: string, direction: "up" | "down") => Promise<void>
    onImageUpload: (file: File, isPublic: boolean) => Promise<string>
    availableDepartments: Array<{ id: string; nameEn: string }>
    onAssignDepartment: (personId: string, departmentId: string) => Promise<void>
    onRemoveDepartment: (personId: string, departmentId: string) => Promise<void>
    onRefresh: () => void
}) {
    const editForm = useForm<PersonFormValues>({
        resolver: zodResolver(personSchema),
        defaultValues: {
            slug: person.slug,
            titleEn: person.titleEn || "",
            titleSi: person.titleSi || "",
            titleTa: person.titleTa || "",
            fullNameEn: person.fullNameEn,
            fullNameSi: person.fullNameSi || "",
            fullNameTa: person.fullNameTa || "",
            designationEn: person.designationEn || "",
            designationSi: person.designationSi || "",
            designationTa: person.designationTa || "",
            bioEn: person.bioEn || "",
            bioSi: person.bioSi || "",
            bioTa: person.bioTa || "",
            image: person.image || "",
            order: person.order,
        },
    })

    function getInitials(name: string) {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    if (isEditing) {
        return (
            <div className="border rounded-lg p-4 bg-muted/50">
                <PersonForm
                    form={editForm}
                    onSubmit={(values) => onSave(person.id, values)}
                    onCancel={onCancel}
                    onImageUpload={onImageUpload}
                    availableDepartments={availableDepartments}
                    organizationId={organizationId}
                    initialImage={person.image}
                />
            </div>
        )
    }

    const [expanded, setExpanded] = useState(false)
    const [contactInfos, setContactInfos] = useState(person.contactInfos || [])
    const [isAddingContact, setIsAddingContact] = useState(false)
    const [selectedDepartment, setSelectedDepartment] = useState<string>("")

    useEffect(() => {
        if (expanded) {
            fetchContactInfos()
        }
    }, [expanded])

    async function fetchContactInfos() {
        try {
            const res = await fetch(
                `/api/console/organization/contact-info?organizationId=${organizationId}&personId=${person.id}`
            )
            if (res.ok) {
                const data = await res.json()
                setContactInfos(data.contactInfos || [])
            }
        } catch (error) {
            console.error("Failed to fetch contact info:", error)
        }
    }

    async function handleAddContact(values: any) {
        try {
            const res = await fetch("/api/console/organization/contact-info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organizationId,
                    personId: person.id,
                    ...values,
                }),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Contact info added successfully")
            setIsAddingContact(false)
            fetchContactInfos()
            onRefresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add contact info")
        }
    }

    async function handleDeleteContact(contactId: string) {
        try {
            const res = await fetch(
                `/api/console/organization/contact-info?id=${contactId}&organizationId=${organizationId}`,
                { method: "DELETE" }
            )

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Contact info deleted successfully")
            fetchContactInfos()
            onRefresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete contact info")
        }
    }

    const assignedDepartmentIds = person.departments.map(d => d.id)
    const unassignedDepartments = availableDepartments.filter(d => !assignedDepartmentIds.includes(d.id))

    return (
        <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onReorder(person.id, "up")}
                            disabled={isFirst}
                            title="Move up"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onReorder(person.id, "down")}
                            disabled={isLast}
                            title="Move down"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </div>
                    <Avatar className="h-12 w-12">
                        {person.image && (
                            <AvatarImage src={person.image} alt={person.fullNameEn} />
                        )}
                        <AvatarFallback>
                            {getInitials(person.fullNameEn)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="font-medium text-lg">{person.fullNameEn}</div>
                        {person.fullNameSi && (
                            <div className="text-sm text-muted-foreground">{person.fullNameSi}</div>
                        )}
                        {person.designationEn && (
                            <div className="text-sm text-muted-foreground mt-1">
                                {person.designationEn}
                            </div>
                        )}
                        {person.departments.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {person.departments.map(d => (
                                    <Badge key={d.id} variant="secondary" className="text-xs">
                                        {d.nameEn}
                                        <button
                                            onClick={() => onRemoveDepartment(person.id, d.id)}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Order: {person.order} | Contacts: {contactInfos.length}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
                        {expanded ? "Collapse" : "Expand"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={onEdit}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                </div>
            </div>

            {expanded && (
                <div className="space-y-4 pt-4 border-t">
                    {/* Department Assignment */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>Assign to Department</Label>
                            {unassignedDepartments.length > 0 && (
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unassignedDepartments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.nameEn}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        {selectedDepartment && (
                            <Button
                                size="sm"
                                onClick={() => {
                                    onAssignDepartment(person.id, selectedDepartment)
                                    setSelectedDepartment("")
                                }}
                            >
                                Assign
                            </Button>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label>Contact Information</Label>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsAddingContact(!isAddingContact)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Contact
                            </Button>
                        </div>

                        {isAddingContact && (
                            <ContactInfoForm
                                onSubmit={handleAddContact}
                                onCancel={() => setIsAddingContact(false)}
                            />
                        )}

                        <div className="space-y-2 mt-2">
                            {contactInfos.map(contact => (
                                <div key={contact.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                    <div className="flex items-center gap-2">
                                        {contact.type === "Email" && <Mail className="h-4 w-4" />}
                                        {contact.type === "Mobile" && <Phone className="h-4 w-4" />}
                                        <span className="font-medium">{contact.type}:</span>
                                        <span>{contact.value}</span>
                                        {contact.descriptionEn && (
                                            <span className="text-sm text-muted-foreground">
                                                ({contact.descriptionEn})
                                            </span>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleDeleteContact(contact.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                            {contactInfos.length === 0 && !isAddingContact && (
                                <p className="text-sm text-muted-foreground">No contact information</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function ContactInfoForm({
    onSubmit,
    onCancel,
}: {
    onSubmit: (values: any) => Promise<void>
    onCancel: () => void
}) {
    const [type, setType] = useState<string>("")
    const [value, setValue] = useState<string>("")
    const [descriptionEn, setDescriptionEn] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!type || !value) {
            toast.error("Type and value are required")
            return
        }

        setIsSubmitting(true)
        try {
            await onSubmit({
                type,
                value,
                descriptionEn: descriptionEn || undefined,
            })
            setType("")
            setValue("")
            setDescriptionEn("")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-2 p-3 bg-muted/50 rounded">
            <div className="grid gap-2 md:grid-cols-3">
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Mobile">Mobile</SelectItem>
                        <SelectItem value="Landline">Landline</SelectItem>
                        <SelectItem value="Fax">Fax</SelectItem>
                        <SelectItem value="Hotline">Hotline</SelectItem>
                    </SelectContent>
                </Select>
                <Input
                    placeholder="Value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <Input
                    placeholder="Description (English)"
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add
                </Button>
            </div>
        </form>
    )
}
