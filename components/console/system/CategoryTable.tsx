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

interface CategoryTableProps {
    categories: Category[]
    onEdit: (category: Category) => void
    onDelete: (categoryId: string) => void
}

export function CategoryTable({
    categories,
    onEdit,
    onDelete,
}: CategoryTableProps) {
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
                        <TableHead>Name (Sinhala)</TableHead>
                        <TableHead>Name (Tamil)</TableHead>
                        <TableHead>Organizations</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No categories found
                            </TableCell>
                        </TableRow>
                    ) : (
                        categories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell className="font-medium">{category.nameEn}</TableCell>
                                <TableCell>{category.nameSi || "-"}</TableCell>
                                <TableCell>{category.nameTa || "-"}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {category._count?.organizations || 0} org{category._count?.organizations !== 1 ? 's' : ''}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(category)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeleteId(category.id)}
                                            disabled={(category._count?.organizations || 0) > 0}
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
                            This will permanently delete this category.
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
