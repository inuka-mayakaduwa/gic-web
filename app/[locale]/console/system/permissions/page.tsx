"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { PermissionGroupTable } from "@/components/console/system/PermissionGroupTable"
import { PermissionGroupForm } from "@/components/console/system/PermissionGroupForm"
import { OrgPermissionGroupTable } from "@/components/console/system/OrgPermissionGroupTable"
import { OrgPermissionGroupForm } from "@/components/console/system/OrgPermissionGroupForm"

interface PermissionGroup {
    id: string
    name: string
    permissions?: { id: string; code: string; description: string | null }[]
    _count: {
        users: number
        permissions: number
    }
}

interface OrgPermissionGroup {
    id: string
    name: string
    permissions: { id: string; code: string; description: string | null }[]
    _count: {
        assignments: number
    }
}

export default function PermissionGroupsPage() {
    const [systemGroups, setSystemGroups] = useState<PermissionGroup[]>([])
    const [orgGroups, setOrgGroups] = useState<OrgPermissionGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("system")

    // System groups state
    const [isCreateSystemOpen, setIsCreateSystemOpen] = useState(false)
    const [editingSystemGroup, setEditingSystemGroup] = useState<PermissionGroup | null>(null)

    // Org groups state
    const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false)
    const [editingOrgGroup, setEditingOrgGroup] = useState<OrgPermissionGroup | null>(null)

    const [permissions, setPermissions] = useState({
        canView: false,
        canManage: false,
    })

    useEffect(() => {
        checkPermissions()
        fetchSystemGroups()
        fetchOrgGroups()
    }, [])

    async function checkPermissions() {
        try {
            const [viewRes, manageRes] = await Promise.all([
                fetch("/api/system/permissions/check", {
                    method: "POST",
                    body: JSON.stringify({ permission: "system.permissions.view" }),
                }),
                fetch("/api/system/permissions/check", {
                    method: "POST",
                    body: JSON.stringify({ permission: "system.permissions.manage" }),
                }),
            ])

            const viewData = await viewRes.json()
            const manageData = await manageRes.json()

            setPermissions({
                canView: viewData.hasPermission,
                canManage: manageData.hasPermission,
            })
        } catch (error) {
            console.error("Failed to check permissions:", error)
        }
    }

    async function fetchSystemGroups() {
        try {
            const res = await fetch("/api/system/permissions/groups")
            if (!res.ok) throw new Error("Failed to fetch groups")
            const data = await res.json()
            setSystemGroups(data)
        } catch (error) {
            toast.error("Failed to load system permission groups")
        } finally {
            setLoading(false)
        }
    }

    async function fetchOrgGroups() {
        try {
            const res = await fetch("/api/system/permissions/org-groups")
            if (!res.ok) throw new Error("Failed to fetch org groups")
            const data = await res.json()
            setOrgGroups(data)
        } catch (error) {
            toast.error("Failed to load organizational permission groups")
        }
    }

    // System group handlers
    async function handleCreateSystem(values: any) {
        try {
            const res = await fetch("/api/system/permissions/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("System permission group created")
            setIsCreateSystemOpen(false)
            fetchSystemGroups()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create group")
        }
    }

    async function handleUpdateSystem(values: any) {
        if (!editingSystemGroup) return

        try {
            const res = await fetch(`/api/system/permissions/groups/${editingSystemGroup.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("System permission group updated")
            setEditingSystemGroup(null)
            fetchSystemGroups()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update group")
        }
    }

    async function handleDeleteSystem(group: PermissionGroup) {
        try {
            const res = await fetch(`/api/system/permissions/groups/${group.id}`, {
                method: "DELETE",
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("System permission group deleted")
            fetchSystemGroups()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete group")
        }
    }

    async function openEditSystem(group: any) {
        try {
            const res = await fetch(`/api/system/permissions/groups/${group.id}`)
            if (!res.ok) throw new Error("Failed to fetch group details")
            const data = await res.json()
            setEditingSystemGroup(data)
        } catch (error) {
            toast.error("Failed to load group details")
        }
    }

    // Org group handlers
    async function handleCreateOrg(values: any) {
        try {
            const res = await fetch("/api/system/permissions/org-groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Organizational permission group created")
            setIsCreateOrgOpen(false)
            fetchOrgGroups()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create group")
        }
    }

    async function handleUpdateOrg(values: any) {
        if (!editingOrgGroup) return

        try {
            const res = await fetch(`/api/system/permissions/org-groups/${editingOrgGroup.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Organizational permission group updated")
            setEditingOrgGroup(null)
            fetchOrgGroups()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update group")
        }
    }

    async function handleDeleteOrg(groupId: string) {
        try {
            const res = await fetch(`/api/system/permissions/org-groups/${groupId}`, {
                method: "DELETE",
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Organizational permission group deleted")
            fetchOrgGroups()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete group")
        }
    }

    async function openEditOrg(group: any) {
        try {
            const res = await fetch(`/api/system/permissions/org-groups/${group.id}`)
            if (!res.ok) throw new Error("Failed to fetch group details")
            const data = await res.json()
            setEditingOrgGroup(data)
        } catch (error) {
            toast.error("Failed to load group details")
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>
    }

    if (!permissions.canView) {
        return <div className="flex items-center justify-center h-full">Access Denied</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Permission Groups</h1>
                    <p className="text-muted-foreground">
                        Manage system and organizational permission groups.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="system">System Groups</TabsTrigger>
                        <TabsTrigger value="organizational">Organizational Groups</TabsTrigger>
                    </TabsList>
                    {permissions.canManage && (
                        <Button
                            onClick={() =>
                                activeTab === "system"
                                    ? setIsCreateSystemOpen(true)
                                    : setIsCreateOrgOpen(true)
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Group
                        </Button>
                    )}
                </div>

                <TabsContent value="system" className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        System permission groups control platform-wide access and administrative capabilities.
                    </div>
                    <PermissionGroupTable
                        groups={systemGroups}
                        onEdit={openEditSystem}
                        onDelete={(group) => {
                            handleDeleteSystem(group).catch((error) => {
                                console.error("Failed to delete:", error)
                            })
                        }}
                        canEdit={permissions.canManage}
                        canDelete={permissions.canManage}
                    />
                </TabsContent>

                <TabsContent value="organizational" className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        Organizational permission groups are templates that can be assigned to users across different organizations.
                    </div>
                    <OrgPermissionGroupTable
                        groups={orgGroups}
                        onEdit={openEditOrg}
                        onDelete={handleDeleteOrg}
                    />
                </TabsContent>
            </Tabs>

            {/* System Group Dialogs */}
            <Dialog open={isCreateSystemOpen} onOpenChange={setIsCreateSystemOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create System Permission Group</DialogTitle>
                        <DialogDescription>
                            Create a new system-level permission group.
                        </DialogDescription>
                    </DialogHeader>
                    <PermissionGroupForm
                        onSubmit={handleCreateSystem}
                        onCancel={() => setIsCreateSystemOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingSystemGroup} onOpenChange={(open) => !open && setEditingSystemGroup(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit System Permission Group</DialogTitle>
                        <DialogDescription>
                            Modify group name and permissions.
                        </DialogDescription>
                    </DialogHeader>
                    {editingSystemGroup && (
                        <PermissionGroupForm
                            initialData={{
                                ...editingSystemGroup,
                                permissions: editingSystemGroup.permissions || [],
                            }}
                            onSubmit={handleUpdateSystem}
                            onCancel={() => setEditingSystemGroup(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Org Group Dialogs */}
            <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create Organizational Permission Group</DialogTitle>
                        <DialogDescription>
                            Create a new organizational permission template.
                        </DialogDescription>
                    </DialogHeader>
                    <OrgPermissionGroupForm
                        onSubmit={handleCreateOrg}
                        onCancel={() => setIsCreateOrgOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingOrgGroup} onOpenChange={(open) => !open && setEditingOrgGroup(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Organizational Permission Group</DialogTitle>
                        <DialogDescription>
                            Modify group name and permissions.
                        </DialogDescription>
                    </DialogHeader>
                    {editingOrgGroup && (
                        <OrgPermissionGroupForm
                            initialData={editingOrgGroup}
                            onSubmit={handleUpdateOrg}
                            onCancel={() => setEditingOrgGroup(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
