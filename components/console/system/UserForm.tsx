
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
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().optional(),
    isActive: z.boolean().default(true),
    permissionGroupIds: z.array(z.string()).optional(),
})

type UserFormValues = z.infer<typeof formSchema>

interface UserFormProps {
    initialData?: UserFormValues & { systemPermissionGroups?: { id: string; name: string }[] }
    onSubmit: (data: UserFormValues) => Promise<void>
    isEditing?: boolean
    onCancel: () => void
}

export function UserForm({ initialData, onSubmit, isEditing = false, onCancel }: UserFormProps) {
    const [groups, setGroups] = useState<{ id: string; name: string }[]>([])

    useEffect(() => {
        async function fetchGroups() {
            try {
                const res = await fetch("/api/system/permissions/groups")
                if (res.ok) {
                    const data = await res.json()
                    setGroups(data)
                }
            } catch (error) {
                console.error("Failed to fetch groups:", error)
            }
        }
        fetchGroups()
    }, [])

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            email: initialData?.email || "",
            mobile: initialData?.mobile || "",
            isActive: initialData?.isActive ?? true,
            permissionGroupIds: initialData?.systemPermissionGroups?.map((g: any) => g.id) || [],
        },
    })

    // Reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name || "",
                email: initialData.email || "",
                mobile: initialData.mobile || "",
                isActive: initialData.isActive ?? true,
                permissionGroupIds: initialData.systemPermissionGroups?.map((g: any) => g.id) || [],
            })
        }
    }, [initialData, form])

    const isSubmitting = form.formState.isSubmitting

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="john@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mobile (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="+94 77 123 4567" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="permissionGroupIds"
                    render={() => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">Permission Groups</FormLabel>
                                <FormDescription>
                                    Assign access roles to this user.
                                </FormDescription>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border rounded-md p-4">
                                {groups.map((group) => (
                                    <FormField
                                        key={group.id}
                                        control={form.control}
                                        name="permissionGroupIds"
                                        render={({ field }) => {
                                            return (
                                                <FormItem
                                                    key={group.id}
                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value?.includes(group.id)}
                                                            onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), group.id])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                            (value) => value !== group.id
                                                                        )
                                                                    )
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        {group.name}
                                                    </FormLabel>
                                                </FormItem>
                                            )
                                        }}
                                    />
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Active Status</FormLabel>
                                <FormDescription>
                                    Disable to prevent user login.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
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
                        {initialData ? "Update User" : "Create User"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
