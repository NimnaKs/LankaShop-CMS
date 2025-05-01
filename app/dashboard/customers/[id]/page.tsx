import { CustomerDetails } from "@/components/customers/customer-details";

export default function CustomerDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Details</h1>
        <p className="text-muted-foreground">
          View detailed information about this customer
        </p>
      </div>
      <CustomerDetails customerId={params.id} />
    </div>
  );
}
