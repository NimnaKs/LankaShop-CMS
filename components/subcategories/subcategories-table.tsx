"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Edit, MoreHorizontal, Search, Trash, Plus } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  parentName?: string;
}

export function SubCategoriesTable() {
  const [subcats, setSubcats] = useState<SubCategory[]>([]);
  const [filtered, setFiltered] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const [subSnap, catSnap] = await Promise.all([
          getDocs(collection(db, "subcategories")),
          getDocs(collection(db, "categories")),
        ]);
        const catsMap: Record<string, string> = {};
        catSnap.docs.forEach((doc) => {
          const d = doc.data();
          catsMap[doc.id] = d.name;
        });
        const subs: SubCategory[] = subSnap.docs.map((doc) => {
          const d = doc.data() as any;
          return {
            id: doc.id,
            name: d.name,
            categoryId: d.categoryId,
            parentName: catsMap[d.categoryId] || "",
          };
        });
        setSubcats(subs);
        setFiltered(subs);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load subcategories",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  useEffect(() => {
    setFiltered(
      search
        ? subcats.filter((s) =>
            s.name.toLowerCase().includes(search.toLowerCase())
          )
        : subcats
    );
  }, [search, subcats]);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteDoc(doc(db, "subcategories", toDelete));
      setSubcats((prev) => prev.filter((s) => s.id !== toDelete));
      setFiltered((prev) => prev.filter((s) => s.id !== toDelete));
      toast({ title: "Deleted", description: "Subcategory removed" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setToDelete(null);
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search subcategories..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-muted-foreground mb-4">No subcategories found</p>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.name}</TableCell>
                  <TableCell>{sub.parentName}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/subcategories/edit/${sub.id}`}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setToDelete(sub.id)}
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
      )}

      <AlertDialog open={!!toDelete} onOpenChange={() => setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subcategory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
