"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderDetailsProps {
  orderId: string;
}

interface OrderProduct {
  productId: string;
  name: string;
  quantity: number;
  price: string;
}

interface Order {
  id: string;
  orderId: string;
  userId: string; // this is the lookup key
  createdAt: string;
  products: OrderProduct[];
  subtotal: string;
  totalAmount: string;
  shippingAddressId?: string;
  paymentStatus: string;
  paymentProvider: string;
  stripeSessionId?: string;
}

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CustomerInfo {
  id: string;
  userId: string; // same field we query on
  name: string;
  email: string;
  status: "active" | "deactive" | "suspend";
}

export function OrderDetails({ orderId }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // 1) Load the order
        const orderSnap = await getDoc(doc(db, "orders", orderId));
        if (!orderSnap.exists()) {
          toast({
            title: "Order not found",
            description: "The order you're looking for doesn't exist",
            variant: "destructive",
          });
          router.push("/dashboard/orders");
          return;
        }
        const orderData = { id: orderSnap.id, ...(orderSnap.data() as Order) };
        setOrder(orderData);

        // 2) Lookup customer by userId field
        const custQ = query(
          collection(db, "customers"),
          where("userId", "==", orderData.userId)
        );
        const custSnap = await getDocs(custQ);
        if (!custSnap.empty) {
          const c = custSnap.docs[0];
          setCustomerInfo(c.data() as CustomerInfo);
        }

        // 3) Load shipping address if present
        if (orderData.shippingAddressId) {
          const addrSnap = await getDoc(
            doc(db, "addresses", orderData.shippingAddressId)
          );
          if (addrSnap.exists()) {
            setAddress(addrSnap.data() as Address);
          }
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to load order details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [orderId, router, toast]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/dashboard/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      {/* Order & Customer Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>
              Order #{order.orderId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Customer ID
                </p>
                <p>{order.userId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Customer Name
                </p>
                <p>{customerInfo?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Customer Email
                </p>
                <p>{customerInfo?.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Payment Status
                </p>
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
                <p className="text-sm font-medium text-muted-foreground">
                  Payment Provider
                </p>
                <p>{order.paymentProvider}</p>
              </div>
              {order.stripeSessionId && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Stripe Session ID
                  </p>
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
              <CardDescription>
                Delivery location for this order
              </CardDescription>
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

      {/* Order Items */}
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
              {order.products.map((p) => (
                <TableRow key={p.productId}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">{p.quantity}</TableCell>
                  <TableCell className="text-right">£{p.price}</TableCell>
                  <TableCell className="text-right">
                    £{(parseFloat(p.price) * p.quantity).toFixed(2)}
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
              <span>£{order.subtotal}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>£{order.totalAmount}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
