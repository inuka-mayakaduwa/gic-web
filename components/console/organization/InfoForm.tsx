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
import { Loader2, X, Save } from "lucide-react"

const formSchema = z.object({
    nameEn: z.string().min(1, "English name is required"),
    nameSi: z.string().optional(),
    nameTa: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    addressEn: z.string().optional(),
    addressSi: z.string().optional(),
    addressTa: z.string().optional(),
    descriptionEn: z.string().optional(),
    descriptionSi: z.string().optional(),
    descriptionTa: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

interface OrganizationInfoFormProps {
    initialData: Partial<FormValues>
    onSubmit: (values: FormValues) => Promise<void>
    onCancel: () => void
    isSubmitting?: boolean
}

export function OrganizationInfoForm({
    initialData,
    onSubmit,
    onCancel,
    isSubmitting = false,
}: OrganizationInfoFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nameEn: initialData.nameEn || "",
            nameSi: initialData.nameSi || "",
            nameTa: initialData.nameTa || "",
            email: initialData.email || "",
            phone: initialData.phone || "",
            addressEn: initialData.addressEn || "",
            addressSi: initialData.addressSi || "",
            addressTa: initialData.addressTa || "",
            descriptionEn: initialData.descriptionEn || "",
            descriptionSi: initialData.descriptionSi || "",
            descriptionTa: initialData.descriptionTa || "",
            website: initialData.website || "",
        },
    })

    const isFormSubmitting = form.formState.isSubmitting || isSubmitting

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="nameEn"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name (English) *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ministry of Health" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="nameSi"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name (Sinhala)</FormLabel>
                                <FormControl>
                                    <Input placeholder="සෞඛ්‍ය අමාත්‍යාංශය" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="nameTa"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name (Tamil)</FormLabel>
                            <FormControl>
                                <Input placeholder="சுகாதார அமைச்சு" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="info@example.gov.lk" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input placeholder="+94 11 234 5678" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                                <Input type="url" placeholder="https://www.example.gov.lk" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Address</h3>
                    <FormField
                        control={form.control}
                        name="addressEn"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address (English)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="123 Main Street, Colombo 05"
                                        className="resize-none"
                                        rows={3}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="addressSi"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address (Sinhala)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="ප්‍රධාන වීදිය 123, කොළඹ 05"
                                        className="resize-none"
                                        rows={3}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="addressTa"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address (Tamil)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="முதன்மை தெரு 123, கொழும்பு 05"
                                        className="resize-none"
                                        rows={3}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Description</h3>
                    <FormField
                        control={form.control}
                        name="descriptionEn"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description (English)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Organization description..."
                                        className="resize-none"
                                        rows={4}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="descriptionSi"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description (Sinhala)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="සංවිධානයේ විස්තරය..."
                                        className="resize-none"
                                        rows={4}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="descriptionTa"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description (Tamil)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="அமைப்பின் விளக்கம்..."
                                        className="resize-none"
                                        rows={4}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isFormSubmitting}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isFormSubmitting}>
                        {isFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {!isFormSubmitting && <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
    )
}

