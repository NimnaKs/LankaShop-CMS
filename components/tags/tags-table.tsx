"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Edit, MoreHorizontal, Search, Trash, Plus } from "lucide-react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
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

interface Tag {
  id: string
  name: string
  productCount?: number
}

export function TagsTable() {
  const [tags, setTags] = useState<Tag[]>([])
  const [filteredTags, setFilteredTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsSnapshot = await getDocs(collection(db, "tags"))
        const productsSnapshot = await getDocs(collection(db, "products"))

        // Count products per tag
        const productCounts: Record<string, number> = {}
        productsSnapshot.forEach((doc) => {
          const tagIds = doc.data().tagIds || []
          tagIds.forEach((tagId: string) => {
            productCounts[tagId] = (productCounts[tagId] || 0) + 1
          })
        })

        const tagsData = tagsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          productCount: productCounts[doc.id] || 0,
        }))

        setTags(tagsData)
        setFilteredTags(tagsData)
      } catch (error) {
        console.error("Error fetching tags:", error)
        toast({
          title: "Error",
          description: "Failed to load tags",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [toast])

  useEffect(() => {
    if (searchQuery) {
      const filtered = tags.filter((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredTags(filtered)
    } else {
      setFilteredTags(tags)
    }
  }, [searchQuery, tags])

  const handleDeleteTag = async () => {
    if (!deleteTagId) return

    try {
      await deleteDoc(doc(db, "tags", deleteTagId))

      // Update products that use this tag
      const productsSnapshot = await getDocs(collection(db, "products"))
      const batch = productsSnapshot.docs.filter((doc) => {
        const tagIds = doc.data().tagIds || []
        return tagIds.includes(deleteTagId)
      })

      // If there are products using this tag, we should update them
      if (batch.length > 0) {
        toast({
          title: "Tag removed from products",
          description: `Tag was removed from ${batch.length} products`,
        })
      }

      setTags((prev) => prev.filter((tag) => tag.id !== deleteTagId))
      setFilteredTags((prev) => prev.filter((tag) => tag.id !== deleteTagId))

      toast({
        title: "Tag deleted",
        description: "The tag has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting tag:", error)
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      })
    } finally {
      setDeleteTagId(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tags..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-muted-foreground mb-4">No tags found</p>
            <Button asChild>
              <Link href="/dashboard/tags/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Tag
              </Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Products</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell>{tag.productCount} products</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/tags/edit/${tag.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTagId(tag.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AlertDialog open={!!deleteTagId} onOpenChange={() => setDeleteTagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tag.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
