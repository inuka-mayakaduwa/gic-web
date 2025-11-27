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
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    permissionIds: z.array(z.string()),
})

interface Permission {
    id: string
    code: string
    description: string | null
}

interface PermissionGroupFormProps {
    initialData?: {
        id: string
        name: string
        permissions: Permission[]
    } | null
    onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>
    onCancel: () => void
}

export function PermissionGroupForm({
    initialData,
    onSubmit,
    onCancel,
}: PermissionGroupFormProps) {
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [loadingPermissions, setLoadingPermissions] = useState(true)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            permissionIds: initialData?.permissions.map((p) => p.id) || [],
        },
    })

    useEffect(() => {
        async function fetchPermissions() {
            try {
                const res = await fetch("/api/system/permissions/list")
                if (res.ok) {
                    const data = await res.json()
                    setPermissions(data)
                }
            } catch (error) {
                console.error("Failed to fetch permissions:", error)
            } finally {
                setLoadingPermissions(false)
            }
        }
        fetchPermissions()
    }, [])

    const isSubmitting = form.formState.isSubmitting

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Group Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Content Editors" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="permissionIds"
                    render={() => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">Permissions</FormLabel>
                                <FormDescription>
                                    Select the permissions to assign to this group.
                                </FormDescription>
                            </div>
                            {loadingPermissions ? (
                                <div className="flex items-center justify-center h-40 border rounded-md bg-muted/50">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <ScrollArea className="h-[300px] border rounded-md p-4">
                                    <div className="space-y-4">
                                        {permissions.map((permission) => (
                                            <FormField
                                                key={permission.id}
                                                control={form.control}
                                                name="permissionIds"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={permission.id}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(permission.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, permission.id])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== permission.id
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel className="font-normal font-mono text-sm">
                                                                    {permission.code}
                                                                </FormLabel>
                                                                {permission.description && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {permission.description}
                                                                    </p>
                                                                )}
                                                            </div>
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

                <div className="flex justify-end space-x-4">
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
                        {initialData ? "Update Group" : "Create Group"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
