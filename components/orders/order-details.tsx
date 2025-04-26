"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface OrderDetailsProps {
  orderId: string
}

interface OrderProduct {
  productId: string
  name: string
  quantity: number
  price: string
}

interface Order {
  id: string
  orderId: string
  userId: string
  createdAt: string
  products: OrderProduct[]
  subtotal: string
  totalAmount: string
  shippingAddressId: string
  paymentStatus: string
  paymentProvider: string
  stripeSessionId?: string
}

interface Address {
  id: string
  userId: string
  label: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

export function OrderDetails({ orderId }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [address, setAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderDoc = await getDoc(doc(db, "orders", orderId))

        if (!orderDoc.exists()) {
          toast({
            title: "Order not found",
            description: "The order you're looking for doesn't exist",
            variant: "destructive",
          })
          router.push("/dashboard/orders")
          return
        }

        const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order
        setOrder(orderData)

        // Fetch shipping address if available
        if (orderData.shippingAddressId) {
          const addressDoc = await getDoc(doc(db, "addresses", orderData.shippingAddressId))
          if (addressDoc.exists()) {
            setAddress({ id: addressDoc.id, ...addressDoc.data() } as Address)
          }
        }
      } catch (error) {
        console.error("Error fetching order details:", error)
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId, router, toast])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-muted-foreground mb-4">Order not found</p>
        <Button asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/dashboard/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>
              Order #{order.orderId} - {formatDate(order.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
                <p>{order.userId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                <Badge
                  variant={
                    order.paymentStatus === "paid"
                      ? "success"
                      : order.paymentStatus === "pending"
                        ? "warning"
                        : "destructive"
                  }
                >
                  {order.paymentStatus}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Provider</p>
                <p>{order.paymentProvider}</p>
              </div>
              {order.stripeSessionId && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stripe Session ID</p>
                  <p className="truncate text-xs">{order.stripeSessionId}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {address && (
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
              <CardDescription>Delivery location for this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p>{address.street}</p>
                <p>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.country}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>Products included in this order</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.products.map((product) => (
                <TableRow key={product.productId}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">{product.quantity}</TableCell>
                  <TableCell className="text-right">${product.price}</TableCell>
                  <TableCell className="text-right">
                    ${(Number.parseFloat(product.price) * product.quantity).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-col items-end space-y-4">
          <div className="space-y-1 text-right w-full max-w-[200px]">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${order.subtotal}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>${order.totalAmount}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
