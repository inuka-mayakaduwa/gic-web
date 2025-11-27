"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Edit2, X, Save, Trash2, Eye, Calendar, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const newsSchema = z.object({
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    titleEn: z.string().min(1, "English title is required"),
    titleSi: z.string().optional(),
    titleTa: z.string().optional(),
    summaryEn: z.string().optional(),
    summarySi: z.string().optional(),
    summaryTa: z.string().optional(),
    contentEn: z.string().min(1, "English content is required"),
    contentSi: z.string().optional(),
    contentTa: z.string().optional(),
    banner: z.string().optional(),
    publishedDate: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    organizationIds: z.array(z.string()).min(1, "At least one organization is required"),
})

type NewsFormValues = z.infer<typeof newsSchema>

interface News {
    id: string
    slug: string
    titleEn: string
    titleSi: string | null
    titleTa: string | null
    summaryEn: string | null
    summaryTa: string | null
    contentEn: string
    contentSi: string | null
    contentTa: string | null
    banner: string | null
    publishedDate: string | null
    status: string
    major: boolean
    featuredPriority: number | null
    views: number
    organizations: Array<{
        id: string
        nameEn: string
        slug: string
        logo: string | null
    }>
}

export default function NewsPage() {
    const params = useParams()
    const slug = params.slug as string
    const [news, setNews] = useState<News[]>([])
    const [loading, setLoading] = useState(true)
    const [organizationId, setOrganizationId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    const addForm = useForm<NewsFormValues>({
        resolver: zodResolver(newsSchema),
        defaultValues: {
            slug: "",
            titleEn: "",
            titleSi: "",
            titleTa: "",
            summaryEn: "",
            summarySi: "",
            summaryTa: "",
            contentEn: "",
            contentSi: "",
            contentTa: "",
            banner: "",
            publishedDate: "",
            status: "DRAFT",
            organizationIds: [],
        },
    })

    useEffect(() => {
        fetchOrganizationId()
    }, [slug])

    useEffect(() => {
        if (organizationId) {
            fetchNews()
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
                addForm.setValue("organizationIds", [org.id])
            }
        } catch (error) {
            console.error("Failed to fetch organization:", error)
        }
    }


    async function fetchNews() {
        if (!organizationId) return

        try {
            setLoading(true)
            const res = await fetch(`/api/console/organization/news?organizationId=${organizationId}`)
            if (!res.ok) throw new Error("Failed to fetch news")
            
            const data = await res.json()
            setNews(data.news || [])
        } catch (error) {
            console.error("Failed to fetch news:", error)
            toast.error("Failed to load news")
        } finally {
            setLoading(false)
        }
    }

    async function handleImageUpload(file: File, isPublic: boolean) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("path", "news")
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

    async function handleAdd(values: NewsFormValues) {
        if (!organizationId) return

        try {
            const res = await fetch("/api/console/organization/news", {
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

            toast.success("News article added successfully")
            setIsAdding(false)
            addForm.reset()
            addForm.setValue("organizationIds", [organizationId])
            fetchNews()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add news article")
        }
    }

    async function handleEdit(newsId: string, values: NewsFormValues) {
        if (!organizationId) return

        try {
            const res = await fetch("/api/console/organization/news", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: newsId,
                    organizationId,
                    ...values,
                }),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("News article updated successfully")
            setEditingId(null)
            fetchNews()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update news article")
        }
    }

    async function handleDelete(newsId: string) {
        if (!organizationId) return

        try {
            const res = await fetch(`/api/console/organization/news?id=${newsId}&organizationId=${organizationId}`, {
                method: "DELETE",
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("News article deleted successfully")
            fetchNews()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete news article")
        }
    }

    function formatDate(dateString: string | null) {
        if (!dateString) return "Not published"
        return new Date(dateString).toLocaleDateString()
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
                    <h1 className="text-3xl font-bold tracking-tight">News</h1>
                    <p className="text-muted-foreground">
                        Manage news articles for this organization
                    </p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add News Article
                    </Button>
                )}
            </div>

            {/* Add Form */}
            {isAdding && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add New News Article</CardTitle>
                        <CardDescription>
                            Fill in the details below to create a new news article
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <NewsForm
                            form={addForm}
                            onSubmit={handleAdd}
                            onCancel={() => {
                                setIsAdding(false)
                                addForm.reset()
                                addForm.setValue("organizationIds", [organizationId!])
                            }}
                            onImageUpload={handleImageUpload}
                            organizationId={organizationId!}
                        />
                    </CardContent>
                </Card>
            )}

            {/* News List */}
            {news.length === 0 && !isAdding ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No News Articles</CardTitle>
                        <CardDescription>
                            Get started by creating your first news article.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>News Articles ({news.length})</CardTitle>
                        <CardDescription>
                            List of all news articles
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {news.map((article) => (
                                <NewsRow
                                    key={article.id}
                                    article={article}
                                    organizationId={organizationId!}
                                    isEditing={editingId === article.id}
                                    onEdit={() => setEditingId(article.id)}
                                    onCancel={() => setEditingId(null)}
                                    onSave={handleEdit}
                                    onDelete={handleDelete}
                                    onImageUpload={handleImageUpload}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function NewsForm({
    form,
    onSubmit,
    onCancel,
    onImageUpload,
    organizationId,
}: {
    form: ReturnType<typeof useForm<NewsFormValues>>
    onSubmit: (values: NewsFormValues) => Promise<void>
    onCancel: () => void
    onImageUpload: (file: File, isPublic: boolean) => Promise<string>
    organizationId: string
}) {
    const [uploadingImage, setUploadingImage] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(form.watch("banner") || null)

    useEffect(() => {
        form.setValue("organizationIds", [organizationId])
    }, [organizationId, form])

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }

        try {
            setUploadingImage(true)
            // Banner images are always public
            const url = await onImageUpload(file, true)
            form.setValue("banner", url)
            setImagePreview(url)
            toast.success("Banner image uploaded successfully")
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
                        placeholder="news-article-slug"
                    />
                    {form.formState.errors.slug && (
                        <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.slug.message}
                        </p>
                    )}
                </div>
                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                        {...form.register("status")}
                        value={form.watch("status")}
                        onValueChange={(value) => form.setValue("status", value as "DRAFT" | "PUBLISHED" | "ARCHIVED")}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="PUBLISHED">Published</SelectItem>
                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label htmlFor="titleEn">Title (English) *</Label>
                    <Input
                        id="titleEn"
                        {...form.register("titleEn")}
                        placeholder="News Title"
                    />
                    {form.formState.errors.titleEn && (
                        <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.titleEn.message}
                        </p>
                    )}
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
                    <Label htmlFor="summaryEn">Summary (English)</Label>
                    <Textarea
                        id="summaryEn"
                        {...form.register("summaryEn")}
                        rows={3}
                        placeholder="Brief summary..."
                    />
                </div>
                <div>
                    <Label htmlFor="summarySi">Summary (Sinhala)</Label>
                    <Textarea
                        id="summarySi"
                        {...form.register("summarySi")}
                        rows={3}
                    />
                </div>
                <div>
                    <Label htmlFor="summaryTa">Summary (Tamil)</Label>
                    <Textarea
                        id="summaryTa"
                        {...form.register("summaryTa")}
                        rows={3}
                    />
                </div>
            </div>

            {/* Banner Image */}
            <div>
                <Label>Banner Image</Label>
                <div className="flex items-center gap-4 mt-2">
                    {imagePreview && (
                        <div className="relative w-32 h-32 border rounded overflow-hidden">
                            <img src={imagePreview} alt="Banner preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="flex-1">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={uploadingImage}
                            className="cursor-pointer"
                        />
                        {uploadingImage && (
                            <p className="text-sm text-muted-foreground mt-1">Uploading...</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <Label htmlFor="contentEn">Content (English) *</Label>
                    <Textarea
                        id="contentEn"
                        {...form.register("contentEn")}
                        rows={10}
                        placeholder="News content (Markdown supported)..."
                        className="font-mono text-sm"
                    />
                    {form.formState.errors.contentEn && (
                        <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.contentEn.message}
                        </p>
                    )}
                </div>
                <div>
                    <Label htmlFor="contentSi">Content (Sinhala)</Label>
                    <Textarea
                        id="contentSi"
                        {...form.register("contentSi")}
                        rows={10}
                        className="font-mono text-sm"
                    />
                </div>
                <div>
                    <Label htmlFor="contentTa">Content (Tamil)</Label>
                    <Textarea
                        id="contentTa"
                        {...form.register("contentTa")}
                        rows={10}
                        className="font-mono text-sm"
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="publishedDate">Published Date</Label>
                <Input
                    id="publishedDate"
                    type="datetime-local"
                    {...form.register("publishedDate")}
                />
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

function NewsRow({
    article,
    organizationId,
    isEditing,
    onEdit,
    onCancel,
    onSave,
    onDelete,
    onImageUpload,
}: {
    article: News
    organizationId: string
    isEditing: boolean
    onEdit: () => void
    onCancel: () => void
    onSave: (id: string, values: NewsFormValues) => Promise<void>
    onDelete: (id: string) => Promise<void>
    onImageUpload: (file: File, isPublic: boolean) => Promise<string>
}) {
    const editForm = useForm<NewsFormValues>({
        resolver: zodResolver(newsSchema),
        defaultValues: {
            slug: article.slug,
            titleEn: article.titleEn,
            titleSi: article.titleSi || "",
            titleTa: article.titleTa || "",
            summaryEn: article.summaryEn || "",
            summarySi: "",
            summaryTa: "",
            contentEn: article.contentEn,
            contentSi: article.contentSi || "",
            contentTa: article.contentTa || "",
            banner: article.banner || "",
            publishedDate: article.publishedDate ? new Date(article.publishedDate).toISOString().slice(0, 16) : "",
            status: article.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
            organizationIds: [organizationId],
        },
    })

    if (isEditing) {
        return (
            <div className="border rounded-lg p-4 bg-muted/50">
                <NewsForm
                    form={editForm}
                    onSubmit={(values) => onSave(article.id, values)}
                    onCancel={onCancel}
                    onImageUpload={onImageUpload}
                    organizationId={organizationId}
                />
            </div>
        )
    }

    return (
        <div className="border rounded-lg p-4 flex items-start justify-between hover:bg-muted/50 transition-colors">
            <div className="flex-1">
                <div className="flex items-start gap-4">
                    {article.banner && (
                        <div className="w-32 h-32 rounded overflow-hidden flex-shrink-0">
                            <img src={article.banner} alt={article.titleEn} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-lg">{article.titleEn}</h3>
                            <Badge variant={article.status === "PUBLISHED" ? "default" : "secondary"}>
                                {article.status}
                            </Badge>
                        </div>
                        {article.summaryEn && (
                            <p className="text-sm text-muted-foreground mb-2">{article.summaryEn}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {article.publishedDate ? new Date(article.publishedDate).toLocaleDateString() : "Not published"}
                            </span>
                            <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {article.views} views
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {article.organizations.map(org => (
                                <Badge key={org.id} variant="outline" className="text-xs">
                                    {org.nameEn}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete this news article. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(article.id)}>
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}

