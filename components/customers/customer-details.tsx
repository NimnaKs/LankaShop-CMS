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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: "active" | "deactive" | "suspend";
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

interface Order {
  id: string;
  orderId: string;
  createdAt: string;
  totalAmount: string;
  paymentStatus: string;
}

export function CustomerDetails({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const docSnap = await getDoc(doc(db, "customers", customerId));
        if (!docSnap.exists()) {
          toast({
            title: "Not found",
            description: "Customer does not exist",
            variant: "destructive",
          });
          router.push("/dashboard/customers");
          return;
        }
        const d = docSnap.data();
        setCustomer({
          id: docSnap.id,
          name: d.name,
          email: d.email,
          createdAt: d.createdAt,
          status: d.status,
        });

        // fetch addresses
        const addrQ = query(
          collection(db, "addresses"),
          where("userId", "==", d.userId)
        );
        const addrSnap = await getDocs(addrQ);
        setAddresses(
          addrSnap.docs.map((a) => ({ id: a.id, ...(a.data() as any) }))
        );

        // fetch orders
        const ordQ = query(
          collection(db, "orders"),
          where("userId", "==", d.userId)
        );
        const ordSnap = await getDocs(ordQ);
        setOrders(
          ordSnap.docs.map((o) => ({ id: o.id, ...(o.data() as any) }))
        );
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to load details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [customerId, router, toast]);

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (!customer)
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
    );

  // compute totals
  const totalSpent = orders.reduce(
    (sum, o) => sum + parseFloat(o.totalAmount),
    0
  );
  const orderCount = orders.length;

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
          <CardDescription>
            Status: <Badge className="capitalize">{customer.status}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p>{customer.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{customer.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Joined
              </p>
              <p>{formatDate(customer.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Orders
              </p>
              <p>{orderCount}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Spent
              </p>
              <p>${totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {addresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {addresses.map((a) => (
                <Card key={a.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{a.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p>{a.street}</p>
                    <p>
                      {a.city}, {a.state} {a.postalCode}
                    </p>
                    <p>{a.country}</p>
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
          <CardDescription>{orderCount} orders placed</CardDescription>
        </CardHeader>
        <CardContent>
          {orderCount === 0 ? (
            <p className="text-center py-6 text-muted-foreground">
              No orders found
            </p>
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
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.orderId}</TableCell>
                    <TableCell>{formatDate(o.createdAt)}</TableCell>
                    <TableCell>
                      ${parseFloat(o.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.paymentStatus === "paid"
                            ? "success"
                            : o.paymentStatus === "pending"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {o.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/orders/${o.id}`}>View</Link>
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
  );
}
