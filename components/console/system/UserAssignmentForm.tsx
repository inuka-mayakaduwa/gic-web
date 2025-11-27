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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const formSchema = z.object({
    userId: z.string().min(1, "User is required").optional(),
    orgGroupIds: z.array(z.string()).optional(),
    customGroupIds: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface SystemUser {
    id: string
    name: string
    email: string
    isActive: boolean
}

interface OrgUserGroup {
    id: string
    name: string
    permissions: Array<{
        id: string
        code: string
        description: string | null
    }>
}

interface OrgCustomGroup {
    id: string
    name: string
    permissions: Array<{
        id: string
        code: string
        description: string | null
    }>
}

interface UserAssignmentFormProps {
    organizationId: string
    availableGroups: {
        orgUserGroups: OrgUserGroup[]
        customGroups: OrgCustomGroup[]
    }
    initialUserId?: string
    initialOrgGroupIds?: string[]
    initialCustomGroupIds?: string[]
    onSubmit: (userId: string, orgGroupIds: string[], customGroupIds: string[]) => Promise<void>
    onCancel: () => void
    isEditing?: boolean
}

export function UserAssignmentForm({
    organizationId,
    availableGroups,
    initialUserId,
    initialOrgGroupIds = [],
    initialCustomGroupIds = [],
    onSubmit,
    onCancel,
    isEditing = false,
}: UserAssignmentFormProps) {
    const [users, setUsers] = useState<SystemUser[]>([])
    const [loadingUsers, setLoadingUsers] = useState(!isEditing)

    useEffect(() => {
        if (!isEditing) {
            fetchUsers()
        }
    }, [isEditing])

    async function fetchUsers() {
        try {
            setLoadingUsers(true)
            const res = await fetch("/api/system/users")
            if (res.ok) {
                const data = await res.json()
                // Handle both array and paginated response
                const userList = Array.isArray(data) ? data : (data.users || [])
                setUsers(userList.filter((u: SystemUser) => u.isActive))
            }
        } catch (error) {
            console.error("Failed to fetch users:", error)
        } finally {
            setLoadingUsers(false)
        }
    }

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            userId: initialUserId || "",
            orgGroupIds: initialOrgGroupIds,
            customGroupIds: initialCustomGroupIds,
        },
    })

    const isSubmitting = form.formState.isSubmitting
    const selectedUserId = form.watch("userId")

    async function handleSubmit(values: FormValues) {
        if (!isEditing && !values.userId) {
            form.setError("userId", { message: "User is required" })
            return
        }

        const userId = values.userId || initialUserId!
        await onSubmit(
            userId,
            values.orgGroupIds || [],
            values.customGroupIds || []
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {!isEditing && (
                    <FormField
                        control={form.control}
                        name="userId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>User *</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={loadingUsers}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a user" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {loadingUsers ? (
                                            <div className="flex items-center justify-center p-4">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : users.length === 0 ? (
                                            <div className="p-4 text-sm text-muted-foreground text-center">
                                                No active users available
                                            </div>
                                        ) : (
                                            users.map((user) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    <div className="flex flex-col">
                                                        <span>{user.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {user.email}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Select the user to add to this organization.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {/* Organization User Groups */}
                <FormField
                    control={form.control}
                    name="orgGroupIds"
                    render={() => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">Organization User Groups</FormLabel>
                                <FormDescription>
                                    Assign template permission groups. These groups are shared across all organizations.
                                </FormDescription>
                            </div>
                            {availableGroups.orgUserGroups.length === 0 ? (
                                <div className="text-sm text-muted-foreground border rounded-md p-4">
                                    No organization user groups available.
                                </div>
                            ) : (
                                <ScrollArea className="h-[200px] border rounded-md p-4">
                                    <div className="space-y-4">
                                        {availableGroups.orgUserGroups.map((group) => (
                                            <FormField
                                                key={group.id}
                                                control={form.control}
                                                name="orgGroupIds"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
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
                                                            <div className="flex-1">
                                                                <FormLabel className="font-normal cursor-pointer">
                                                                    {group.name}
                                                                </FormLabel>
                                                                {group.permissions.length > 0 && (
                                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                                        {group.permissions.map((perm) => (
                                                                            <Badge
                                                                                key={perm.id}
                                                                                variant="outline"
                                                                                className="text-xs"
                                                                            >
                                                                                {perm.code}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
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

                {/* Custom Groups */}
                {availableGroups.customGroups.length > 0 && (
                    <>
                        <Separator />
                        <FormField
                            control={form.control}
                            name="customGroupIds"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Custom Groups</FormLabel>
                                        <FormDescription>
                                            Assign organization-specific permission groups.
                                        </FormDescription>
                                    </div>
                                    <ScrollArea className="h-[200px] border rounded-md p-4">
                                        <div className="space-y-4">
                                            {availableGroups.customGroups.map((group) => (
                                                <FormField
                                                    key={group.id}
                                                    control={form.control}
                                                    name="customGroupIds"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
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
                                                                <div className="flex-1">
                                                                    <FormLabel className="font-normal cursor-pointer">
                                                                        {group.name}
                                                                    </FormLabel>
                                                                    {group.permissions.length > 0 && (
                                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                                            {group.permissions.map((perm) => (
                                                                                <Badge
                                                                                    key={perm.id}
                                                                                    variant="secondary"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {perm.code}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </ScrollArea>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}

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
                        {isEditing ? "Update Assignments" : "Add User"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}

