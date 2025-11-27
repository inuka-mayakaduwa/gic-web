"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

const formSchema = z.object({
    nameEn: z.string().min(1, "English name is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    categoryIds: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Category {
    id: string
    nameEn: string
}

interface OrganizationFormProps {
    initialData?: Partial<FormValues & { categories?: Category[] }>
    onSubmit: (values: FormValues) => Promise<void>
    onCancel: () => void
    isEditing?: boolean
}

export function OrganizationForm({
    initialData,
    onSubmit,
    onCancel,
    isEditing = false,
}: OrganizationFormProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)

    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await fetch("/api/system/categories")
                if (res.ok) {
                    const data = await res.json()
                    setCategories(data)
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error)
            } finally {
                setLoadingCategories(false)
            }
        }
        fetchCategories()
    }, [])

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nameEn: initialData?.nameEn || "",
            slug: initialData?.slug || "",
            categoryIds: initialData?.categories?.map(c => c.id) || [],
        },
    })

    const isSubmitting = form.formState.isSubmitting

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="nameEn"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Organization Name *</FormLabel>
                            <FormControl>
                                <Input placeholder="Ministry of Health" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slug *</FormLabel>
                            <FormControl>
                                <Input placeholder="ministry-of-health" {...field} />
                            </FormControl>
                            <FormDescription>
                                URL-friendly identifier (lowercase, hyphens only)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="categoryIds"
                    render={() => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">Categories</FormLabel>
                                <FormDescription>
                                    Select the categories this organization belongs to.
                                </FormDescription>
                            </div>
                            {loadingCategories ? (
                                <div className="flex items-center justify-center h-40 border rounded-md bg-muted/50">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : categories.length === 0 ? (
                                <div className="text-sm text-muted-foreground border rounded-md p-4">
                                    No categories available. Create categories first.
                                </div>
                            ) : (
                                <ScrollArea className="h-[200px] border rounded-md p-4">
                                    <div className="space-y-4">
                                        {categories.map((category) => (
                                            <FormField
                                                key={category.id}
                                                control={form.control}
                                                name="categoryIds"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={category.id}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(category.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...(field.value || []), category.id])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== category.id
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                {category.nameEn}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end space-x-4 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Update Organization" : "Create Organization"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
