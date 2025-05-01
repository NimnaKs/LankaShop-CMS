import { CustomersTable } from "@/components/customers/customers-table";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          View and manage customer information
        </p>
      </div>
      <CustomersTable />
    </div>
  );
}
