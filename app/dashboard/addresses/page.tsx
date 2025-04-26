import { AddressesTable } from "@/components/addresses/addresses-table"

export default function AddressesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Addresses</h1>
        <p className="text-muted-foreground">View customer shipping and billing addresses</p>
      </div>
      <AddressesTable />
    </div>
  )
}
