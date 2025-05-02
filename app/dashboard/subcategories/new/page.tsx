import { SubCategoryForm } from "@/components/subcategories/subcategory-form";

export default function NewSubcategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Add New Sub Category
        </h1>
        <p className="text-muted-foreground">
          Create a new product sub category
        </p>
      </div>
      <SubCategoryForm />
    </div>
  );
}
