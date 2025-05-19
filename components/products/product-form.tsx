"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload, X } from "lucide-react"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"
import { MultiSelect } from "@/components/ui/multi-select"
import { uploadToS3 } from "@/lib/s3-upload"

interface ProductFormProps {
  productId?: string
}

interface Category {
  id: string
  name: string
}
interface SubCategory {
  id: string
  name: string
}
interface Tag {
  id: string
  name: string
}

export function ProductForm({ productId }: ProductFormProps = {}) {
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null])
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null])
  const [imageUploading, setImageUploading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<SubCategory[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    image2: "",
    image3: "",
    price: "",
    stock: "",
    rating: "0",
    date: new Date().toISOString(),
    categoryId: "",
    subcategoryId: "",
    tagIds: [] as string[],
    productDetails: [] as string[],
    weight: "",
    weightUnit: "g",
  })
  const [isEdit, setIsEdit] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Load categories and tags
  useEffect(() => {
    async function loadLookups() {
      const [catSnap, tagSnap] = await Promise.all([
        getDocs(collection(db, "categories")),
        getDocs(collection(db, "tags")),
      ])
      setCategories(catSnap.docs.map((d) => ({ id: d.id, name: d.data().name })))
      setTags(tagSnap.docs.map((d) => ({ id: d.id, name: d.data().name })))
    }
    loadLookups()
  }, [])

  // Fetch subcategories when category changes
  const fetchSubcategories = async (categoryId: string) => {
    if (!categoryId) return setSubcategories([])
    const q = query(collection(db, "subcategories"), where("categoryId", "==", categoryId))
    const snap = await getDocs(q)
    setSubcategories(snap.docs.map((d) => ({ id: d.id, name: d.data().name })))
  }

  // Load existing product for edit
  useEffect(() => {
    async function loadProduct() {
      if (!productId) return
      setIsEdit(true)
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, "products", productId))
        if (!snap.exists()) throw new Error("Not found")
        const data = snap.data() as any
        setFormData({
          name: data.name || "",
          description: data.description || "",
          image: data.image || "",
          image2: data.image2 || "",
          image3: data.image3 || "",
          price: data.price || "",
          stock: data.stock || "",
          rating: data.rating || "0",
          date: data.date || new Date().toISOString(),
          categoryId: data.categoryId || "",
          subcategoryId: data.subcategoryId || "",
          tagIds: data.tagIds || [],
          productDetails: data.productDetails || [],
          weight: data.weight || "",
          weightUnit: data.weightUnit || "g",
        })
        if (data.image) {
          setImagePreviews((prev) => {
            const newPreviews = [...prev]
            newPreviews[0] = data.image
            return newPreviews
          })
        }
        if (data.image2) {
          setImagePreviews((prev) => {
            const newPreviews = [...prev]
            newPreviews[1] = data.image2
            return newPreviews
          })
        }
        if (data.image3) {
          setImagePreviews((prev) => {
            const newPreviews = [...prev]
            newPreviews[2] = data.image3
            return newPreviews
          })
        }
        if (data.categoryId) await fetchSubcategories(data.categoryId)
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "Failed to load product",
          variant: "destructive",
        })
        router.push("/dashboard/products")
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [productId, router, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = async (value: string) => {
    setFormData((prev) => ({ ...prev, categoryId: value, subcategoryId: "" }))
    await fetchSubcategories(value)
  }

  const handleTagsChange = (values: string[]) => {
    setFormData((prev) => ({ ...prev, tagIds: values }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFiles((prev) => {
      const newFiles = [...prev]
      newFiles[index] = file
      return newFiles
    })

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreviews((prev) => {
        const newPreviews = [...prev]
        newPreviews[index] = reader.result as string
        return newPreviews
      })
    }
    reader.readAsDataURL(file)
  }

  const handleAddDetail = () => {
    setFormData((prev) => ({
      ...prev,
      productDetails: [...prev.productDetails, ""],
    }))
  }

  const handleDetailChange = (index: number, value: string) => {
    const details = [...formData.productDetails]
    details[index] = value
    setFormData((prev) => ({ ...prev, productDetails: details }))
  }

  const handleRemoveDetail = (index: number) => {
    const details = formData.productDetails.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, productDetails: details }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const imageUrls = {
        image: formData.image,
        image2: formData.image2,
        image3: formData.image3,
      }

      if (imageFiles.some((file) => file !== null)) {
        setImageUploading(true)

        // Upload each file that exists
        const uploadPromises = imageFiles.map(async (file, index) => {
          if (file) {
            const imageUrl = await uploadToS3(file)
            return { index, url: imageUrl }
          }
          return null
        })

        const results = await Promise.all(uploadPromises.filter(Boolean))

        // Update imageUrls with the new URLs
        results.forEach((result) => {
          if (result) {
            const { index, url } = result
            if (index === 0) imageUrls.image = url
            if (index === 1) imageUrls.image2 = url
            if (index === 2) imageUrls.image3 = url
          }
        })

        setImageUploading(false)
      }

      const payload = {
        ...formData,
        image: imageUrls.image,
        image2: imageUrls.image2,
        image3: imageUrls.image3,
      }

      if (isEdit && productId) {
        await updateDoc(doc(db, "products", productId), payload)
        toast({ title: "Updated", description: "Product updated" })
      } else {
        const id = uuidv4()
        await setDoc(doc(db, "products", id), payload)
        toast({ title: "Created", description: "Product created" })
      }
      router.push("/dashboard/products")
    } catch (error) {
      console.error(error)
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="grid gap-6 pt-6">
            {/* Name */}
            <div className="grid gap-3">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>

            {/* Description */}
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

            {/* Image Upload */}
            <div className="grid gap-3">
              <Label>Product Images (Up to 3)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                    <div
                        key={index}
                        className={`border-2 border-dashed rounded-md p-4 transition-colors ${
                            imagePreviews[index]
                                ? "border-muted"
                                : "border-muted-foreground/25 hover:border-muted-foreground/50"
                        } flex flex-col items-center justify-center cursor-pointer relative h-48`}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const file = e.dataTransfer.files?.[0]
                          if (file && file.type.startsWith("image/")) {
                            setImageFiles((prev) => {
                              const newFiles = [...prev]
                              newFiles[index] = file
                              return newFiles
                            })

                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setImagePreviews((prev) => {
                                const newPreviews = [...prev]
                                newPreviews[index] = reader.result as string
                                return newPreviews
                              })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        onClick={() => document.getElementById(`image-${index}`)?.click()}
                    >
                      {imagePreviews[index] ? (
                          <div className="relative w-full h-full">
                            <Image
                                src={imagePreviews[index] || "/placeholder.svg"}
                                alt={`preview ${index + 1}`}
                                fill
                                className="object-contain"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setImageFiles((prev) => {
                                    const newFiles = [...prev]
                                    newFiles[index] = null
                                    return newFiles
                                  })
                                  setImagePreviews((prev) => {
                                    const newPreviews = [...prev]
                                    newPreviews[index] = null
                                    return newPreviews
                                  })
                                  setFormData((prev) => ({
                                    ...prev,
                                    [`image${index === 0 ? "" : index + 1}`]: "",
                                  }))
                                }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                      ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground text-center">Image {index + 1}</p>
                          </>
                      )}
                      <Input
                          id={`image-${index}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageChange(e, index)}
                      />
                    </div>
                ))}
              </div>
              {imageUploading && (
                  <div className="mt-2 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Uploading images...</span>
                  </div>
              )}
            </div>

            {/* Price, Stock & Weight */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="grid gap-3">
                <Label htmlFor="price">Price (£)</Label>
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
              <div className="grid gap-3">
                <Label htmlFor="weight">Weight</Label>
                <div className="flex gap-2">
                  <Input
                      id="weight"
                      name="weight"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="flex-1"
                      placeholder="0.00"
                  />
                  <Select
                      value={formData.weightUnit}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, weightUnit: value }))}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mg">mg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="l">l</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="grid gap-3">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="subcategory">Sub Category</Label>
                <Select
                    value={formData.subcategoryId}
                    onValueChange={(val) => setFormData((prev) => ({ ...prev, subcategoryId: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Tags */}
              <div className="grid gap-3">
                <Label htmlFor="tags">Tags</Label>
                <MultiSelect
                    options={tags.map((tag) => ({
                      label: tag.name,
                      value: tag.id,
                    }))}
                    selected={formData.tagIds}
                    onChange={handleTagsChange}
                    placeholder="Select tags"
                />
              </div>

              {/* Product Details Array */}
              <div className="grid gap-3">
                <Label>Product Details</Label>
                {formData.productDetails.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                          value={detail}
                          onChange={(e) => handleDetailChange(idx, e.target.value)}
                          placeholder={`Detail ${idx + 1}`}
                          required
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveDetail(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                ))}
                <Button type="button" onClick={handleAddDetail} className="mt-2">
                  + Add Detail
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/products")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || imageUploading}>
              {loading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
            </Button>
          </CardFooter>
        </Card>
      </form>
  )
}
