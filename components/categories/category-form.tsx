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
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    image: "",
    heroImage: "",
    description: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function loadCategory() {
      if (!categoryId) return;
      setIsEdit(true);
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "categories", categoryId));
        if (!snap.exists()) throw new Error("Not found");
        const data = snap.data() as any;
        setFormData({
          name: data.name || "",
          image: data.image || "",
          heroImage: data.heroImage || "",
          description: data.description || "",
        });
        if (data.image) setImagePreview(data.image);
        if (data.heroImage) setHeroPreview(data.heroImage);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load",
          variant: "destructive",
        });
        router.push("/dashboard/categories");
      } finally {
        setLoading(false);
      }
    }
    loadCategory();
  }, [categoryId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    isHero = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      isHero
        ? setHeroPreview(reader.result as string)
        : setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    if (isHero) setHeroFile(file);
    else setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imgUrl = formData.image;
      let heroUrl = formData.heroImage;
      setImageUploading(true);
      if (imageFile) imgUrl = await uploadToS3(imageFile);
      if (heroFile) heroUrl = await uploadToS3(heroFile);
      setImageUploading(false);

      const payload = { ...formData, image: imgUrl, heroImage: heroUrl };
      if (isEdit && categoryId) {
        await updateDoc(doc(db, "categories", categoryId), payload);
        toast({ title: "Updated", description: "Category updated" });
      } else {
        const id = uuidv4();
        await setDoc(doc(db, "categories", id), payload);
        toast({ title: "Created", description: "Category created" });
      }
      router.push("/dashboard/categories");
    } catch (err) {
      toast({
        title: "Error",
        description: "Save failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) return <Loader2 className="animate-spin mt-10" />;

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
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid gap-3">
            <Label>Hero Image</Label>
            <div className="flex items-center gap-4">
              {heroPreview && (
                <Image
                  src={heroPreview}
                  alt="Hero preview"
                  width={120}
                  height={80}
                  className="object-cover rounded"
                />
              )}
              <Input
                type="file"
                className="hidden"
                id="heroFile"
                accept="image/*"
                onChange={(e) => handleFile(e, true)}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("heroFile")?.click()}
                disabled={imageUploading}
              >
                <Upload className="mr-2" />{" "}
                {formData.heroImage ? "Change Hero" : "Upload Hero"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <Label>Thumbnail Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview && (
                <Image
                  src={imagePreview}
                  alt="Thumb preview"
                  width={80}
                  height={80}
                  className="object-cover rounded"
                />
              )}
              <Input
                type="file"
                className="hidden"
                id="thumbFile"
                accept="image/*"
                onChange={(e) => handleFile(e, false)}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("thumbFile")?.click()}
                disabled={imageUploading}
              >
                <Upload className="mr-2" />{" "}
                {formData.image ? "Change Image" : "Upload Image"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/categories")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || imageUploading}>
            {loading ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
