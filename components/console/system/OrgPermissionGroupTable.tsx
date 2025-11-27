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
import { Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface OrgPermissionGroup {
    id: string
    name: string
    permissions: { id: string; code: string }[]
    _count: {
        assignments: number
    }
}

interface OrgPermissionGroupTableProps {
    groups: OrgPermissionGroup[]
    onEdit: (group: OrgPermissionGroup) => void
    onDelete: (groupId: string) => void
}

export function OrgPermissionGroupTable({
    groups,
    onEdit,
    onDelete,
}: OrgPermissionGroupTableProps) {
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
                        <TableHead>Name</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groups.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                No organizational permission groups found
                            </TableCell>
                        </TableRow>
                    ) : (
                        groups.map((group) => (
                            <TableRow key={group.id}>
                                <TableCell className="font-medium">{group.name}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">
                                        {group.permissions.length} permission{group.permissions.length !== 1 ? 's' : ''}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {group._count.assignments} user{group._count.assignments !== 1 ? 's' : ''}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(group)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeleteId(group.id)}
                                            disabled={group._count.assignments > 0}
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
                            This will permanently delete this organizational permission group.
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
