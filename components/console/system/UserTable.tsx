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
import { Edit, Trash2, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

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

interface UserTableProps {
    users: SystemUser[]
    onEdit: (user: SystemUser) => void
    onRemove: (userId: string) => void
}

export function UserTable({ users, onEdit, onRemove }: UserTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const handleDelete = () => {
        if (deleteId) {
            onRemove(deleteId)
            setDeleteId(null)
        }
    }

    function getInitials(name: string): string {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Org Groups</TableHead>
                        <TableHead>Custom Groups</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                No users assigned to this organization
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            {user.profilePic && (
                                                <AvatarImage src={user.profilePic} alt={user.name} />
                                            )}
                                            <AvatarFallback>
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            {user.mobile && (
                                                <div className="text-sm text-muted-foreground">
                                                    {user.mobile}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">{user.email}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {user.orgUserGroups && user.orgUserGroups.length > 0 ? (
                                            user.orgUserGroups.map((assignment) => (
                                                <Badge key={assignment.id} variant="outline">
                                                    {assignment.orgGroup.name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground">None</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {user.orgCustomGroups && user.orgCustomGroups.length > 0 ? (
                                            user.orgCustomGroups.map((assignment) => (
                                                <Badge key={assignment.id} variant="secondary">
                                                    {assignment.orgCustomGroup.name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm text-muted-foreground">None</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.isActive ? "default" : "destructive"}>
                                        {user.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(user)}
                                            title="Edit Assignments"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeleteId(user.id)}
                                            title="Remove from Organization"
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
                        <AlertDialogTitle>
                            Remove User from Organization?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove all group assignments for this user in this organization.
                            The user will no longer have access to this organization&apos;s resources.
                            This action can be undone by re-adding the user.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
