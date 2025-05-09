import { TagForm } from "@/components/tags/tag-form"

export default function NewTagPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Tag</h1>
        <p className="text-muted-foreground">Create a new product tag</p>
      </div>
      <TagForm />
    </div>
  )
}
