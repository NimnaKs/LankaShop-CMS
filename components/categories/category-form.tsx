"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { uploadToS3 } from "@/lib/s3-upload";

interface CategoryFormProps {
  categoryId?: string;
}

export function CategoryForm({ categoryId }: CategoryFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    image: "",
    description: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function loadCategory() {
      if (!categoryId) {
        setIsEdit(false);
        return;
      }
      setIsEdit(true);
      setLoading(true);

      try {
        const snap = await getDoc(doc(db, "categories", categoryId));
        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            name: data.name || "",
            image: data.image || "",
            description: data.description || "",
          });
          if (data.image) setImagePreview(data.image);
        } else {
          toast({
            title: "Not found",
            description: "Category does not exist",
            variant: "destructive",
          });
          router.push("/dashboard/categories");
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Load failed",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    loadCategory();
  }, [categoryId, router, toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const url = await uploadToS3(file);
      setFormData((prev) => ({ ...prev, image: url }));
      setImagePreview(url);
      toast({ title: "Uploaded", description: "Image uploaded to S3" });
    } catch {
      toast({
        title: "Upload error",
        description: "Image upload failed",
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && categoryId) {
        await updateDoc(doc(db, "categories", categoryId), formData);
        toast({ title: "Updated", description: "Category updated" });
      } else {
        const id = uuidv4();
        await setDoc(doc(db, "categories", id), formData);
        toast({ title: "Created", description: "Category created" });
      }
      router.push("/dashboard/categories");
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Save failed",
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
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="file">Image</Label>
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
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file")?.click()}
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
                  Image will be stored in S3
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/categories")}
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
              "Update Category"
            ) : (
              "Create Category"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
