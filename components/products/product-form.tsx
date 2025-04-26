"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload } from "lucide-react"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"
import { MultiSelect } from "@/components/ui/multi-select"

interface ProductFormProps {
  productId?: string
}

interface Category {
  id: string
  name: string
}

interface Tag {
  id: string
  name: string
}

export function ProductForm({ productId }: ProductFormProps = {}) {
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    price: "",
    stock: "",
    rating: "0",
    date: new Date().toISOString(),
    categoryId: "",
    tagIds: [] as string[],
  })
  const [isEdit, setIsEdit] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesSnapshot = await getDocs(collection(db, "categories"))
        const categoriesData = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }))
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    const fetchTags = async () => {
      try {
        const tagsSnapshot = await getDocs(collection(db, "tags"))
        const tagsData = tagsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }))
        setTags(tagsData)
      } catch (error) {
        console.error("Error fetching tags:", error)
      }
    }

    fetchCategories()
    fetchTags()
  }, [])

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setIsEdit(false)
        return
      }

      setIsEdit(true)
      setLoading(true)

      try {
        const productDoc = await getDoc(doc(db, "products", productId))

        if (productDoc.exists()) {
          const productData = productDoc.data()
          setFormData({
            name: productData.name || "",
            description: productData.description || "",
            image: productData.image || "",
            price: productData.price || "",
            stock: productData.stock || "",
            rating: productData.rating || "0",
            date: productData.date || new Date().toISOString(),
            categoryId: productData.categoryId || "",
            tagIds: productData.tagIds || [],
          })

          if (productData.image) {
            setImagePreview(productData.image)
          }
        } else {
          toast({
            title: "Product not found",
            description: "The product you're trying to edit doesn't exist",
            variant: "destructive",
          })
          router.push("/dashboard/products")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        toast({
          title: "Error",
          description: "Failed to load product data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId, router, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTagsChange = (selectedTags: string[]) => {
    setFormData((prev) => ({ ...prev, tagIds: selectedTags }))
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size - limit to 800KB to stay under Firestore's 1MB limit after base64 conversion
    if (file.size > 800 * 1024) {
      toast({
        title: "Image too large",
        description: "Please select an image smaller than 800KB",
        variant: "destructive",
      })
      return
    }

    setImageFile(file)

    // Create a preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Convert image to base64 if there's a new one
      let imageBase64 = formData.image
      if (imageFile) {
        setImageUploading(true)
        try {
          imageBase64 = await convertToBase64(imageFile)
        } catch (error) {
          console.error("Error converting image to base64:", error)
          throw new Error("Failed to convert image")
        } finally {
          setImageUploading(false)
        }
      }

      const productData = {
        ...formData,
        image: imageBase64,
        date: formData.date || new Date().toISOString(),
      }

      if (isEdit && productId) {
        // Update existing product
        await updateDoc(doc(db, "products", productId), productData)
        toast({
          title: "Product updated",
          description: "The product has been updated successfully",
        })
      } else {
        // Create new product with a generated ID
        const newProductId = uuidv4()
        await setDoc(doc(db, "products", newProductId), productData)
        toast({
          title: "Product created",
          description: "The product has been created successfully",
        })
      }

      router.push("/dashboard/products")
    } catch (error) {
      console.error("Error saving product:", error)
      toast({
        title: "Error",
        description: "Failed to save product",
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
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="image">Product Image</Label>
            <div className="flex items-center gap-4">
              {(imagePreview || formData.image) && (
                <div className="relative h-20 w-20 overflow-hidden rounded-md border">
                  <Image src={imagePreview || formData.image} alt="Product preview" fill className="object-cover" />
                </div>
              )}
              <div className="flex-1">
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("image")?.click()}
                  disabled={imageUploading}
                  className="w-full"
                >
                  {imageUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {formData.image ? "Change Image" : "Upload Image"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="grid gap-3">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="grid gap-3">
              <Label htmlFor="rating">Rating (0-5)</Label>
              <Input
                id="rating"
                name="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.categoryId} onValueChange={(value) => handleSelectChange("categoryId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="tags">Tags</Label>
            <MultiSelect
              options={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
              selected={formData.tagIds}
              onChange={handleTagsChange}
              placeholder="Select tags"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/products")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || imageUploading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Update Product"
            ) : (
              "Create Product"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
