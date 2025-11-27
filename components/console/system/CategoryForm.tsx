"use client"

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
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    nameEn: z.string().min(1, "English name is required"),
    nameSi: z.string().optional(),
    nameTa: z.string().optional(),
    description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CategoryFormProps {
    initialData?: Partial<FormValues>
    onSubmit: (values: FormValues) => Promise<void>
    onCancel: () => void
    isEditing?: boolean
}

export function CategoryForm({
    initialData,
    onSubmit,
    onCancel,
    isEditing = false,
}: CategoryFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nameEn: initialData?.nameEn || "",
            nameSi: initialData?.nameSi || "",
            nameTa: initialData?.nameTa || "",
            description: initialData?.description || "",
        },
    })

    const isSubmitting = form.formState.isSubmitting

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="nameEn"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category Name (English) *</FormLabel>
                            <FormControl>
                                <Input placeholder="Health Services" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="nameSi"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name (Sinhala)</FormLabel>
                                <FormControl>
                                    <Input placeholder="සෞඛ්‍ය සේවා" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="nameTa"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name (Tamil)</FormLabel>
                                <FormControl>
                                    <Input placeholder="சுகாதார சேவைகள்" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Brief description of this category"
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Optional description for this category
                            </FormDescription>
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
                        {isEditing ? "Update Category" : "Create Category"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
