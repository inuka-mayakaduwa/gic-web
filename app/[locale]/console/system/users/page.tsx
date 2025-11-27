"use client"

import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { UserTable } from "@/components/console/system/UserTable"
import { UserForm } from "@/components/console/system/UserForm"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"

interface User {
    id: string
    name: string
    email: string
    mobile: string | null
    isActive: boolean
    lastLogin: string | null
    profilePic: string | null
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [permissions, setPermissions] = useState({
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
    })

    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        checkPermissions()
    }, [])

    useEffect(() => {
        if (permissions.canView) {
            fetchUsers()
        }
    }, [permissions.canView, search])

    async function checkPermissions() {
        try {
            const [view, create, edit, del] = await Promise.all([
                checkPermission("system.users.view"),
                checkPermission("system.users.create"),
                checkPermission("system.users.edit"),
                checkPermission("system.users.delete"),
            ])
            setPermissions({
                canView: view,
                canCreate: create,
                canEdit: edit,
                canDelete: del,
            })
        } catch (error) {
            console.error("Error checking permissions:", error)
        }
    }

    async function checkPermission(permission: string) {
        try {
            const res = await fetch("/api/system/permissions/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ permission }),
            })
            if (!res.ok) return false
            const data = await res.json()
            return data.hasPermission
        } catch {
            return false
        }
    }

    async function fetchUsers() {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (search) params.set("search", search)

            const res = await fetch(`/api/system/users?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch users")

            const data = await res.json()
            setUsers(data.users)
        } catch (error) {
            toast.error("Failed to load users")
        } finally {
            setLoading(false)
        }
    }

    async function handleCreate(data: any) {
        try {
            const res = await fetch("/api/system/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("User created successfully")
            setIsCreateOpen(false)
            fetchUsers()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create user")
        }
    }

    async function handleUpdate(data: any) {
        if (!editingUser) return

        try {
            const res = await fetch(`/api/system/users/${editingUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("User updated successfully")
            setEditingUser(null)
            fetchUsers()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update user")
        }
    }

    async function handleDelete(id: string) {
        try {
            const res = await fetch(`/api/system/users/${id}`, {
                method: "DELETE",
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("User deleted successfully")
            fetchUsers()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete user")
        }
    }

    if (!permissions.canView && !loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">
                        Manage system users and their access permissions.
                    </p>
                </div>
                {permissions.canCreate && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New User</DialogTitle>
                                <DialogDescription>
                                    Add a new user to the system. They will receive an email to set up their account.
                                </DialogDescription>
                            </DialogHeader>
                            <UserForm onSubmit={handleCreate} onCancel={() => setIsCreateOpen(false)} />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
                    ))}
                </div>
            ) : (
                <UserTable
                    users={users}
                    onEdit={(systemUser) => {
                        setEditingUser({
                            ...systemUser,
                            lastLogin: null,
                        })
                    }}
                    onRemove={handleDelete}
                />
            )}

            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user details and status.
                        </DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <UserForm
                            initialData={{
                                name: editingUser.name,
                                email: editingUser.email,
                                mobile: editingUser.mobile || "",
                                isActive: editingUser.isActive,
                            }}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditingUser(null)}
                            isEditing
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
