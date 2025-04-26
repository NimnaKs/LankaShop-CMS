import { TagForm } from "@/components/tags/tag-form"

export default function EditTagPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Tag</h1>
        <p className="text-muted-foreground">Update tag information</p>
      </div>
      <TagForm tagId={params.id} />
    </div>
  )
}
