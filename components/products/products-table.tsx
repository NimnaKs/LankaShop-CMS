"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Edit, Search, Trash, Plus, ImageIcon, ChevronLeft, ChevronRight, Scale } from "lucide-react"
import Image from "next/image"
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

interface Product {
  id: string
  name: string
  description: string
  image?: string
  image2?: string
  image3?: string
  price: string
  stock: string
  rating: string
  date: string
  categoryId: string
  categoryName?: string
  subcategoryId?: string
  subcategoryName?: string
  weight?: string
  weightUnit?: string
}

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({})
  const { toast } = useToast()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, "products"))
        const categoriesSnapshot = await getDocs(collection(db, "categories"))
        const subcategoriesSnapshot = await getDocs(collection(db, "subcategories"))

        // Create a map of category IDs to names
        const categoriesMap = new Map()
        categoriesSnapshot.forEach((doc) => {
          categoriesMap.set(doc.id, doc.data().name)
        })

        // Create a map of subcategory IDs to names
        const subcategoriesMap = new Map()
        subcategoriesSnapshot.forEach((doc) => {
          subcategoriesMap.set(doc.id, doc.data().name)
        })

        const productsData = productsSnapshot.docs.map((doc) => {
          const data = doc.data() as Product
          return {
            id: doc.id,
            ...data,
            categoryName: data.categoryId ? categoriesMap.get(data.categoryId) : "Uncategorized",
            subcategoryName: data.subcategoryId ? subcategoriesMap.get(data.subcategoryId) : "Uncategorized",
          }
        })

        // Initialize active image index for each product
        const initialActiveImageIndex: Record<string, number> = {}
        productsData.forEach((product) => {
          initialActiveImageIndex[product.id] = 0
        })
        setActiveImageIndex(initialActiveImageIndex)

        setProducts(productsData)
        setFilteredProducts(productsData)
      } catch (error) {
        console.error("Error fetching products:", error)
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [toast])

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter(
          (product) =>
              product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.subcategoryName?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [searchQuery, products])

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return

    try {
      await deleteDoc(doc(db, "products", deleteProductId))

      setProducts((prev) => prev.filter((product) => product.id !== deleteProductId))
      setFilteredProducts((prev) => prev.filter((product) => product.id !== deleteProductId))

      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      })
    } finally {
      setDeleteProductId(null)
    }
  }

  // Get product images as an array
  const getProductImages = (product: Product) => {
    const images = []
    if (product.image) images.push(product.image)
    if (product.image2) images.push(product.image2)
    if (product.image3) images.push(product.image3)
    return images
  }

  // Format weight with unit
  const formatWeight = (weight?: string, unit?: string) => {
    if (!weight) return "N/A"
    return `${weight} ${unit || "g"}`
  }

  // Navigate to next image
  const nextImage = (productId: string, imagesCount: number) => {
    setActiveImageIndex((prev) => ({
      ...prev,
      [productId]: (prev[productId] + 1) % imagesCount,
    }))
  }

  // Navigate to previous image
  const prevImage = (productId: string, imagesCount: number) => {
    setActiveImageIndex((prev) => ({
      ...prev,
      [productId]: (prev[productId] - 1 + imagesCount) % imagesCount,
    }))
  }

  return (
      <>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-muted-foreground mb-4">No products found</p>
              <Button asChild>
                <Link href="/dashboard/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Link>
              </Button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const images = getProductImages(product)
                const currentImageIndex = activeImageIndex[product.id] || 0

                return (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="relative aspect-video bg-muted">
                        {images.length > 0 ? (
                            <>
                              <Image
                                  src={images[currentImageIndex] || "/placeholder.svg"}
                                  alt={product.name}
                                  width={600}
                                  height={600}
                                  className="object-cover bg-white"
                              />
                              {images.length > 1 && (
                                  <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 h-8 w-8 rounded-full"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          prevImage(product.id, images.length)
                                        }}
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90 h-8 w-8 rounded-full"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          nextImage(product.id, images.length)
                                        }}
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                                      {images.map((_, idx) => (
                                          <button
                                              key={idx}
                                              className={`h-1.5 rounded-full ${
                                                  idx === currentImageIndex ? "w-6 bg-primary" : "w-1.5 bg-primary/50"
                                              }`}
                                              onClick={(e) => {
                                                e.preventDefault()
                                                setActiveImageIndex((prev) => ({
                                                  ...prev,
                                                  [product.id]: idx,
                                                }))
                                              }}
                                          />
                                      ))}
                                    </div>
                                  </>
                              )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                            </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                          <Badge variant="outline" className="ml-2 whitespace-nowrap">
                            £{product.price}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Category</p>
                            <p className="text-sm font-medium truncate">{product.categoryName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Subcategory</p>
                            <p className="text-sm font-medium truncate">{product.subcategoryName}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Stock</p>
                            <Badge variant={Number.parseInt(product.stock) > 0 ? "outline" : "destructive"} className="mt-1">
                              {Number.parseInt(product.stock) > 0 ? `${product.stock} in stock` : "Out of stock"}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Rating</p>
                            <div className="flex items-center mt-1">
                              <span className="text-sm font-medium mr-1">{product.rating}/5</span>
                              <span className="text-yellow-500">★</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Weight</p>
                            <div className="flex items-center mt-1">
                              <Scale className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span className="text-sm">{formatWeight(product.weight, product.weightUnit)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/products/edit/${product.id}`}>
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteProductId(product.id)}
                        >
                          <Trash className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                )
              })}
            </div>
        )}

        <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product from your store.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
  )
}
