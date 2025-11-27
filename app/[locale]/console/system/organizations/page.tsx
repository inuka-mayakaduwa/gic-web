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
import { OrganizationTable } from "@/components/console/system/OrganizationTable"
import { OrganizationForm } from "@/components/console/system/OrganizationForm"
import { CategoryTable } from "@/components/console/system/CategoryTable"
import { CategoryForm } from "@/components/console/system/CategoryForm"
import { UserManagementDialog } from "@/components/console/system/UserManagementDialog"

interface Organization {
    id: string
    nameEn: string
    nameSi: string | null
    nameTa: string | null
    slug: string
    description: string | null
    website: string | null
    email: string | null
    phone: string | null
    address: string | null
    _count?: {
        userGroupAssignments: number
        customGroups: number
    }
}

interface Category {
    id: string
    nameEn: string
    nameSi: string | null
    nameTa: string | null
    description: string | null
    _count?: {
        organizations: number
    }
}

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("organizations")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

    const [permissions, setPermissions] = useState({
        canView: false,
        canManage: false,
    })

    useEffect(() => {
        checkPermissions()
        fetchOrganizations()
        fetchCategories()
    }, [])

    async function checkPermissions() {
        try {
            const [viewRes, manageRes] = await Promise.all([
                fetch("/api/system/permissions/check", {
                    method: "POST",
                    body: JSON.stringify({ permission: "system.organizations.view" }),
                }),
                fetch("/api/system/permissions/check", {
                    method: "POST",
                    body: JSON.stringify({ permission: "system.organizations.manage" }),
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

    async function fetchOrganizations() {
        try {
            const res = await fetch("/api/system/organizations")
            if (!res.ok) throw new Error("Failed to fetch organizations")
            const data = await res.json()
            setOrganizations(data)
        } catch (error) {
            toast.error("Failed to load organizations")
        } finally {
            setLoading(false)
        }
    }

    async function fetchCategories() {
        try {
            const res = await fetch("/api/system/categories")
            if (!res.ok) throw new Error("Failed to fetch categories")
            const data = await res.json()
            setCategories(data)
        } catch (error) {
            toast.error("Failed to load categories")
        }
    }

    async function handleCreate(values: any) {
        try {
            const res = await fetch("/api/system/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Organization created")
            setIsCreateOpen(false)
            fetchOrganizations()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create organization")
        }
    }

    async function handleUpdate(values: any) {
        if (!editingOrg) return

        try {
            const res = await fetch(`/api/system/organizations/${editingOrg.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Organization updated")
            setEditingOrg(null)
            fetchOrganizations()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update organization")
        }
    }

    async function handleDelete(orgId: string) {
        try {
            const res = await fetch(`/api/system/organizations/${orgId}`, {
                method: "DELETE",
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Organization deleted")
            fetchOrganizations()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete organization")
        }
    }

    async function handleCreateCategory(values: any) {
        try {
            const res = await fetch("/api/system/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Category created")
            setIsCreateOpen(false)
            fetchCategories()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create category")
        }
    }

    async function handleUpdateCategory(values: any) {
        if (!editingCategory) return

        try {
            const res = await fetch(`/api/system/categories/${editingCategory.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Category updated")
            setEditingCategory(null)
            fetchCategories()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update category")
        }
    }

    async function handleDeleteCategory(categoryId: string) {
        try {
            const res = await fetch(`/api/system/categories/${categoryId}`, {
                method: "DELETE",
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error)
            }

            toast.success("Category deleted")
            fetchCategories()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete category")
        }
    }

    async function openEdit(org: { id: string }) {
        try {
            const res = await fetch(`/api/system/organizations/${org.id}`)
            if (!res.ok) throw new Error("Failed to fetch organization details")
            const data = await res.json()
            setEditingOrg(data)
        } catch (error) {
            toast.error("Failed to load organization details")
        }
    }

    const [userManagementOrg, setUserManagementOrg] = useState<{ id: string; nameEn: string } | null>(null)

    function handleManageUsers(org: { id: string; nameEn: string }) {
        setUserManagementOrg(org)
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
                    <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                    <p className="text-muted-foreground">
                        Manage government organizations, departments, and categories.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="organizations">Organizations</TabsTrigger>
                        <TabsTrigger value="categories">Categories</TabsTrigger>
                    </TabsList>
                    {permissions.canManage && (
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            {activeTab === "organizations" ? "New Organization" : "New Category"}
                        </Button>
                    )}
                </div>

                <TabsContent value="organizations" className="space-y-4">
                    <OrganizationTable
                        organizations={organizations}
                        onEdit={(org) => {
                            openEdit(org).catch((error) => {
                                console.error("Failed to open edit:", error)
                            })
                        }}
                        onDelete={handleDelete}
                        onManageUsers={handleManageUsers}
                    />
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                    <CategoryTable
                        categories={categories}
                        onEdit={setEditingCategory}
                        onDelete={handleDeleteCategory}
                    />
                </TabsContent>
            </Tabs>

            {/* Create/Edit Organization Dialog */}
            <Dialog open={isCreateOpen && activeTab === "organizations"} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Organization</DialogTitle>
                        <DialogDescription>
                            Add a new government organization or department.
                        </DialogDescription>
                    </DialogHeader>
                    <OrganizationForm
                        onSubmit={handleCreate}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingOrg} onOpenChange={(open) => !open && setEditingOrg(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Organization</DialogTitle>
                        <DialogDescription>
                            Update organization information.
                        </DialogDescription>
                    </DialogHeader>
                    {editingOrg && (
                        <OrganizationForm
                            initialData={editingOrg}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditingOrg(null)}
                            isEditing
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Create/Edit Category Dialog */}
            <Dialog open={isCreateOpen && activeTab === "categories"} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create Category</DialogTitle>
                        <DialogDescription>
                            Add a new organizational category.
                        </DialogDescription>
                    </DialogHeader>
                    <CategoryForm
                        onSubmit={handleCreateCategory}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                        <DialogDescription>
                            Update category information.
                        </DialogDescription>
                    </DialogHeader>
                    {editingCategory && (
                        <CategoryForm
                            initialData={{
                                nameEn: editingCategory.nameEn,
                                nameSi: editingCategory.nameSi ?? undefined,
                                nameTa: editingCategory.nameTa ?? undefined,
                                description: editingCategory.description ?? undefined,
                            }}
                            onSubmit={handleUpdateCategory}
                            onCancel={() => setEditingCategory(null)}
                            isEditing
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* User Management Dialog */}
            {userManagementOrg && (
                <UserManagementDialog
                    organizationId={userManagementOrg.id}
                    organizationName={userManagementOrg.nameEn}
                    open={!!userManagementOrg}
                    onOpenChange={(open) => !open && setUserManagementOrg(null)}
                />
            )}
        </div>
    )
}
