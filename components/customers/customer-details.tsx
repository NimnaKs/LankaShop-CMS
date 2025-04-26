"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CustomerDetailsProps {
  customerId: string
}

interface Customer {
  id: string
  userId: string
  createdAt: string
  billingAddressId?: string
  shippingAddressId?: string
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

interface Order {
  id: string
  orderId: string
  createdAt: string
  totalAmount: string
  paymentStatus: string
}

export function CustomerDetails({ customerId }: CustomerDetailsProps) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const customerDoc = await getDoc(doc(db, "customers", customerId))

        if (!customerDoc.exists()) {
          toast({
            title: "Customer not found",
            description: "The customer you're looking for doesn't exist",
            variant: "destructive",
          })
          router.push("/dashboard/customers")
          return
        }

        const customerData = { id: customerDoc.id, ...customerDoc.data() } as Customer
        setCustomer(customerData)

        // Fetch customer addresses
        const addressesQuery = query(collection(db, "addresses"), where("userId", "==", customerData.userId))
        const addressesSnapshot = await getDocs(addressesQuery)
        const addressesData = addressesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Address[]
        setAddresses(addressesData)

        // Fetch customer orders
        const ordersQuery = query(collection(db, "orders"), where("userId", "==", customerData.userId))
        const ordersSnapshot = await getDocs(ordersQuery)
        const ordersData = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[]
        setOrders(ordersData)
      } catch (error) {
        console.error("Error fetching customer details:", error)
        toast({
          title: "Error",
          description: "Failed to load customer details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerDetails()
  }, [customerId, router, toast])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-muted-foreground mb-4">Customer not found</p>
        <Button asChild>
          <Link href="/dashboard/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/dashboard/customers">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Customer ID: {customer.userId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer Since</p>
              <p>{formatDate(customer.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <p>{orders.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {addresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {addresses.map((address) => (
                <Card key={address.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      <Badge variant="outline" className="mr-2">
                        {address.label}
                      </Badge>
                      {address.id === customer.billingAddressId && (
                        <Badge variant="secondary" className="mr-1">
                          Billing
                        </Badge>
                      )}
                      {address.id === customer.shippingAddressId && <Badge variant="secondary">Shipping</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-1">
                      <p>{address.street}</p>
                      <p>
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p>{address.country}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>{orders.length} orders placed by this customer</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">No orders found for this customer</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderId}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>${order.totalAmount}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/orders/${order.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
