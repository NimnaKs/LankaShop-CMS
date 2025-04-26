import { CategoryForm } from "@/components/categories/category-form"

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
        <p className="text-muted-foreground">Update category information</p>
      </div>
      <CategoryForm categoryId={params.id} />
    </div>
  )
}
