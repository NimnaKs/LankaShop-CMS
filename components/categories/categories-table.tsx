// CategoriesTable.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  getDocs,
  collection,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Edit, Loader2, MoreHorizontal, Search, Trash } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  heroImage: string;
  productCount?: number;
}

export function CategoriesTable() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filtered, setFiltered] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const [catsSnap, prodsSnap] = await Promise.all([
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "products")),
        ]);
        const counts: Record<string, number> = {};
        prodsSnap.forEach((d) => {
          const cid = (d.data() as any).categoryId;
          counts[cid] = (counts[cid] || 0) + 1;
        });
        const cats = catsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
          productCount: counts[d.id] || 0,
        }));
        setCategories(cats);
        setFiltered(cats);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    setFiltered(
      search
        ? categories.filter((c) =>
            c.name.toLowerCase().includes(search.toLowerCase())
          )
        : categories
    );
  }, [search, categories]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    const cat = categories.find((c) => c.id === toDelete);
    if (cat?.productCount! > 0) {
      toast({
        title: "Cannot delete",
        description: `Has ${cat.productCount} products.`,
        variant: "destructive",
      });
      setToDelete(null);
      return;
    }
    await deleteDoc(doc(db, "categories", toDelete));
    setCategories((prev) => prev.filter((c) => c.id !== toDelete));
    setFiltered((prev) => prev.filter((c) => c.id !== toDelete));
    setToDelete(null);
    toast({ title: "Deleted", description: "Category removed" });
  };

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <>
      {/* Search Input */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hero</TableHead>
              <TableHead>Thumb</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  {cat.heroImage ? (
                    <Image
                      src={cat.heroImage}
                      alt={cat.name}
                      width={60}
                      height={40}
                      className="object-cover rounded"
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      width={40}
                      height={40}
                      className="object-cover rounded"
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell>{cat.description}</TableCell>
                <TableCell>{cat.productCount}</TableCell>
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
                        <Link
                          href={`/dashboard/categories/edit/${cat.id}`}
                          className="flex items-center"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setToDelete(cat.id)}
                        className="text-destructive"
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
      </Card>

      {/* Delete Confirmation Dialog */}
      {toDelete && (
        <AlertDialog open onOpenChange={() => setToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={confirmDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
