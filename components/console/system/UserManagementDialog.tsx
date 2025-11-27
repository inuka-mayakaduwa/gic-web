"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { UserTable } from "./UserTable"
import { UserAssignmentForm } from "./UserAssignmentForm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SystemUser {
    id: string
    name: string
    email: string
    mobile: string | null
    isActive: boolean
    profilePic: string | null
    orgUserGroups?: Array<{
        id: string
        orgGroup: {
            id: string
            name: string
            permissions?: Array<{
                id: string
                code: string
                description: string | null
            }>
        }
    }>
    orgCustomGroups?: Array<{
        id: string
        orgCustomGroup: {
            id: string
            name: string
            permissions?: Array<{
                id: string
                code: string
                description: string | null
            }>
        }
    }>
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
    organizationId: string
    permissions: Array<{
        id: string
        code: string
        description: string | null
    }>
}

interface UserManagementDialogProps {
    organizationId: string
    organizationName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function UserManagementDialog({
    organizationId,
    organizationName,
    open,
    onOpenChange,
}: UserManagementDialogProps) {
    const [users, setUsers] = useState<SystemUser[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
    const [availableGroups, setAvailableGroups] = useState<{
        orgUserGroups: OrgUserGroup[]
        customGroups: OrgCustomGroup[]
    }>({
        orgUserGroups: [],
        customGroups: [],
    })

    useEffect(() => {
        if (open) {
            fetchUsers()
            fetchAvailableGroups()
        }
    }, [open, organizationId])

    async function fetchUsers() {
        try {
            setLoading(true)
            const res = await fetch(`/api/system/organizations/${organizationId}/users`)
            if (!res.ok) throw new Error("Failed to fetch users")
            const data = await res.json()
            setUsers(data)
        } catch (error) {
            console.error("Failed to fetch users:", error)
            toast.error("Failed to load users")
        } finally {
            setLoading(false)
        }
    }

    async function fetchAvailableGroups() {
        try {
            const res = await fetch(`/api/system/organizations/${organizationId}/user-groups`)
            if (!res.ok) throw new Error("Failed to fetch groups")
            const data = await res.json()
            setAvailableGroups(data)
        } catch (error) {
            console.error("Failed to fetch groups:", error)
            toast.error("Failed to load available groups")
        }
    }

    async function handleAddUser(userId: string, orgGroupIds: string[], customGroupIds: string[]) {
        try {
            const res = await fetch(`/api/system/organizations/${organizationId}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    orgGroupIds: orgGroupIds.length > 0 ? orgGroupIds : undefined,
                    customGroupIds: customGroupIds.length > 0 ? customGroupIds : undefined,
                }),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("User added to organization")
            setIsAddUserOpen(false)
            fetchUsers()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to add user")
        }
    }

    async function handleUpdateUser(userId: string, orgGroupIds: string[], customGroupIds: string[]) {
        try {
            const res = await fetch(`/api/system/organizations/${organizationId}/users?userId=${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orgGroupIds: orgGroupIds.length > 0 ? orgGroupIds : undefined,
                    customGroupIds: customGroupIds.length > 0 ? customGroupIds : undefined,
                }),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("User assignments updated")
            setEditingUser(null)
            fetchUsers()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update user")
        }
    }

    async function handleRemoveUser(userId: string) {
        try {
            const res = await fetch(`/api/system/organizations/${organizationId}/users?userId=${userId}`, {
                method: "DELETE",
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("User removed from organization")
            fetchUsers()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to remove user")
        }
    }

    function handleEditUser(user: SystemUser) {
        setEditingUser(user)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Users - {organizationName}</DialogTitle>
                    <DialogDescription>
                        Add, remove, and manage user assignments for this organization.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-muted-foreground">
                            {users.length} user{users.length !== 1 ? "s" : ""} assigned
                        </div>
                        <Button onClick={() => setIsAddUserOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <UserTable
                                users={users}
                                onEdit={handleEditUser}
                                onRemove={handleRemoveUser}
                            />
                        </div>
                    )}
                </div>

                {/* Add User Dialog */}
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add User to Organization</DialogTitle>
                            <DialogDescription>
                                Select a user and assign permission groups.
                            </DialogDescription>
                        </DialogHeader>
                        <UserAssignmentForm
                            organizationId={organizationId}
                            availableGroups={availableGroups}
                            onSubmit={handleAddUser}
                            onCancel={() => setIsAddUserOpen(false)}
                        />
                    </DialogContent>
                </Dialog>

                {/* Edit User Dialog */}
                <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit User Assignments</DialogTitle>
                            <DialogDescription>
                                Update permission group assignments for {editingUser?.name}.
                            </DialogDescription>
                        </DialogHeader>
                        {editingUser && (
                            <UserAssignmentForm
                                organizationId={organizationId}
                                availableGroups={availableGroups}
                                initialUserId={editingUser.id}
                                initialOrgGroupIds={editingUser.orgUserGroups?.map(g => g.orgGroup.id) || []}
                                initialCustomGroupIds={editingUser.orgCustomGroups?.map(g => g.orgCustomGroup.id) || []}
                                onSubmit={(userId, orgGroupIds, customGroupIds) =>
                                    handleUpdateUser(userId, orgGroupIds, customGroupIds)
                                }
                                onCancel={() => setEditingUser(null)}
                                isEditing
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    )
}

