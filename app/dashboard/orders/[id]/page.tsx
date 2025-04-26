import { OrderDetails } from "@/components/orders/order-details"

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
        <p className="text-muted-foreground">View detailed information about this order</p>
      </div>
      <OrderDetails orderId={params.id} />
    </div>
  )
}
