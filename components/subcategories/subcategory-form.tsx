"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface SubCategoryFormProps {
  subcategoryId?: string;
}

interface Category {
  id: string;
  name: string;
}

export function SubCategoryForm({ subcategoryId }: SubCategoryFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({ name: "", categoryId: "" });
  const [isEdit, setIsEdit] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function loadCats() {
      const snap = await getDocs(collection(db, "categories"));
      setCategories(snap.docs.map((d) => ({ id: d.id, name: d.data().name })));
    }
    loadCats();
  }, []);

  useEffect(() => {
    async function loadSub() {
      if (!subcategoryId) return;
      setLoading(true);
      setIsEdit(true);
      try {
        const snap = await getDoc(doc(db, "subcategories", subcategoryId));
        if (!snap.exists()) throw new Error();
        const data = snap.data() as any;
        setFormData({
          name: data.name || "",
          categoryId: data.categoryId || "",
        });
      } catch {
        toast({
          title: "Error",
          description: "Failed to load",
          variant: "destructive",
        });
        router.push("/dashboard/subcategories");
      } finally {
        setLoading(false);
      }
    }
    loadSub();
  }, [subcategoryId, router, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (val: string) =>
    setFormData((prev) => ({ ...prev, categoryId: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const id = subcategoryId || uuidv4();
      if (isEdit) {
        await updateDoc(doc(db, "subcategories", id), formData);
        toast({ title: "Updated", description: "Subcategory updated" });
      } else {
        await setDoc(doc(db, "subcategories", id), formData);
        toast({ title: "Created", description: "Subcategory created" });
      }
      router.push("/dashboard/subcategories");
    } catch {
      toast({
        title: "Error",
        description: "Save failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

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
            <Label htmlFor="category">Category</Label>
            <Select value={formData.categoryId} onValueChange={handleSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
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
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/subcategories")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : isEdit ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
