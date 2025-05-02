import { SubCategoriesTable } from "@/components/subcategories/subcategories-table";
import { Button } from "@/components/ui/button";
import { Plus, FolderTree } from "lucide-react";
import Link from "next/link";

export default function SubcategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Sub Categories
            </h1>
            <p className="text-muted-foreground">Manage sub categories</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/subcategories/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Sub Category
          </Link>
        </Button>
      </div>
      <SubCategoriesTable />
    </div>
  );
}
