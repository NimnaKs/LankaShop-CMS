"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

interface CategoryFormProps {
  categoryId?: string
}

export function CategoryForm({ categoryId }: CategoryFormProps = {}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
  })
  const [isEdit, setIsEdit] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchCategory = async () => {
      if (!categoryId) {
        setIsEdit(false)
        return
      }

      setIsEdit(true)
      setLoading(true)

      try {
        const categoryDoc = await getDoc(doc(db, "categories", categoryId))

        if (categoryDoc.exists()) {
          const categoryData = categoryDoc.data()
          setFormData({
            name: categoryData.name || "",
          })
        } else {
          toast({
            title: "Category not found",
            description: "The category you're trying to edit doesn't exist",
            variant: "destructive",
          })
          router.push("/dashboard/categories")
        }
      } catch (error) {
        console.error("Error fetching category:", error)
        toast({
          title: "Error",
          description: "Failed to load category data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCategory()
  }, [categoryId, router, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEdit && categoryId) {
        // Update existing category
        await updateDoc(doc(db, "categories", categoryId), formData)
        toast({
          title: "Category updated",
          description: "The category has been updated successfully",
        })
      } else {
        // Create new category with a generated ID
        const newCategoryId = uuidv4()
        await setDoc(doc(db, "categories", newCategoryId), formData)
        toast({
          title: "Category created",
          description: "The category has been created successfully",
        })
      }

      router.push("/dashboard/categories")
    } catch (error) {
      console.error("Error saving category:", error)
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEdit) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="grid gap-6 pt-6">
          <div className="grid gap-3">
            <Label htmlFor="name">Category Name</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/categories")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Update Category"
            ) : (
              "Create Category"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
