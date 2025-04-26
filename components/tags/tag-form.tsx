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

interface TagFormProps {
  tagId?: string
}

export function TagForm({ tagId }: TagFormProps = {}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
  })
  const [isEdit, setIsEdit] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchTag = async () => {
      if (!tagId) {
        setIsEdit(false)
        return
      }

      setIsEdit(true)
      setLoading(true)

      try {
        const tagDoc = await getDoc(doc(db, "tags", tagId))

        if (tagDoc.exists()) {
          const tagData = tagDoc.data()
          setFormData({
            name: tagData.name || "",
          })
        } else {
          toast({
            title: "Tag not found",
            description: "The tag you're trying to edit doesn't exist",
            variant: "destructive",
          })
          router.push("/dashboard/tags")
        }
      } catch (error) {
        console.error("Error fetching tag:", error)
        toast({
          title: "Error",
          description: "Failed to load tag data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTag()
  }, [tagId, router, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEdit && tagId) {
        // Update existing tag
        await updateDoc(doc(db, "tags", tagId), formData)
        toast({
          title: "Tag updated",
          description: "The tag has been updated successfully",
        })
      } else {
        // Create new tag with a generated ID
        const newTagId = uuidv4()
        await setDoc(doc(db, "tags", newTagId), formData)
        toast({
          title: "Tag created",
          description: "The tag has been created successfully",
        })
      }

      router.push("/dashboard/tags")
    } catch (error) {
      console.error("Error saving tag:", error)
      toast({
        title: "Error",
        description: "Failed to save tag",
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
            <Label htmlFor="name">Tag Name</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/tags")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Update Tag"
            ) : (
              "Create Tag"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
