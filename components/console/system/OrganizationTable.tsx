"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit, Trash2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Organization {
    id: string
    nameEn: string
    nameSi: string | null
    nameTa: string | null
    slug: string
    _count?: {
        userGroupAssignments: number
        customGroups: number
    }
}

interface OrganizationTableProps {
    organizations: Organization[]
    onEdit: (org: Organization) => void
    onDelete: (orgId: string) => void
    onManageUsers: (org: Organization) => void
}

export function OrganizationTable({
    organizations,
    onEdit,
    onDelete,
    onManageUsers,
}: OrganizationTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const handleDelete = () => {
        if (deleteId) {
            onDelete(deleteId)
            setDeleteId(null)
        }
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name (English)</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Custom Groups</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {organizations.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No organizations found
                            </TableCell>
                        </TableRow>
                    ) : (
                        organizations.map((org) => (
                            <TableRow key={org.id}>
                                <TableCell className="font-medium">{org.nameEn}</TableCell>
                                <TableCell>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">{org.slug}</code>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {org._count?.userGroupAssignments || 0} user{org._count?.userGroupAssignments !== 1 ? 's' : ''}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">
                                        {org._count?.customGroups || 0} group{org._count?.customGroups !== 1 ? 's' : ''}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onManageUsers(org)}
                                            title="Manage Users"
                                        >
                                            <Users className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(org)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeleteId(org.id)}
                                            disabled={(org._count?.userGroupAssignments || 0) > 0 || (org._count?.customGroups || 0) > 0}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this organization.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
