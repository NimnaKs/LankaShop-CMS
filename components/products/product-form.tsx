"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { MultiSelect } from "@/components/ui/multi-select";
import { uploadToS3 } from "@/lib/s3-upload";

interface ProductFormProps {
  productId?: string;
}

interface Category {
  id: string;
  name: string;
}
interface SubCategory {
  id: string;
  name: string;
}
interface Tag {
  id: string;
  name: string;
}

export function ProductForm({ productId }: ProductFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    price: "",
    stock: "",
    rating: "0",
    date: new Date().toISOString(),
    categoryId: "",
    subcategoryId: "",
    tagIds: [] as string[],
  });
  const [isEdit, setIsEdit] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Load categories and tags
  useEffect(() => {
    async function loadLookups() {
      const [catSnap, tagSnap] = await Promise.all([
        getDocs(collection(db, "categories")),
        getDocs(collection(db, "tags")),
      ]);
      setCategories(
        catSnap.docs.map((d) => ({ id: d.id, name: d.data().name }))
      );
      setTags(tagSnap.docs.map((d) => ({ id: d.id, name: d.data().name })));
    }
    loadLookups();
  }, []);

  // Fetch subcategories when category changes
  const fetchSubcategories = async (categoryId: string) => {
    if (!categoryId) return setSubcategories([]);
    const q = query(
      collection(db, "subcategories"),
      where("categoryId", "==", categoryId)
    );
    const snap = await getDocs(q);
    setSubcategories(snap.docs.map((d) => ({ id: d.id, name: d.data().name })));
  };

  // Load existing product for edit
  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      setIsEdit(true);
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "products", productId));
        if (!snap.exists()) throw new Error("Not found");
        const data = snap.data() as any;
        setFormData({
          name: data.name || "",
          description: data.description || "",
          image: data.image || "",
          price: data.price || "",
          stock: data.stock || "",
          rating: data.rating || "0",
          date: data.date || new Date().toISOString(),
          categoryId: data.categoryId || "",
          subcategoryId: data.subcategoryId || "",
          tagIds: data.tagIds || [],
        });
        if (data.image) setImagePreview(data.image);
        if (data.categoryId) {
          await fetchSubcategories(data.categoryId);
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to load product",
          variant: "destructive",
        });
        router.push("/dashboard/products");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId, router, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = async (value: string) => {
    setFormData((prev) => ({ ...prev, categoryId: value, subcategoryId: "" }));
    await fetchSubcategories(value);
  };

  const handleTagsChange = (values: string[]) => {
    setFormData((prev) => ({ ...prev, tagIds: values }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = formData.image;
      if (imageFile) {
        setImageUploading(true);
        imageUrl = await uploadToS3(imageFile);
        setImageUploading(false);
      }
      const payload = { ...formData, image: imageUrl };
      if (isEdit && productId) {
        await updateDoc(doc(db, "products", productId), payload);
        toast({ title: "Updated", description: "Product updated" });
      } else {
        const id = uuidv4();
        await setDoc(doc(db, "products", id), payload);
        toast({ title: "Created", description: "Product created" });
      }
      router.push("/dashboard/products");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="grid gap-6 pt-6">
          <div className="grid gap-3">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
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
              {imagePreview && (
                <div className="relative h-20 w-20 overflow-hidden rounded-md border">
                  <Image
                    src={imagePreview}
                    alt="preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
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
                <p className="mt-1 text-xs text-muted-foreground">
                  Image will be uploaded to S3
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="grid gap-3">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={handleCategoryChange}
              >
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
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, subcategoryId: value }))
                }
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

          <div className="grid gap-3">
            <Label htmlFor="tags">Tags</Label>
            <MultiSelect
              options={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
              selected={formData.tagIds}
              onChange={(values) =>
                setFormData((prev) => ({ ...prev, tagIds: values }))
              }
              placeholder="Select tags"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/products")}
          >
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
  );
}
