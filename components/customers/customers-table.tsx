"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Eye, MoreHorizontal, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  status: "active" | "deactive" | "suspend";
}

export function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // fetch customers
        const custSnap = await getDocs(
          query(collection(db, "customers"), orderBy("createdAt", "desc"))
        );
        const custs: Customer[] = custSnap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name,
            email: d.email,
            createdAt: d.createdAt,
            status: d.status,
          };
        });

        // fetch orders to build metrics
        const orderSnap = await getDocs(collection(db, "orders"));
        const metrics: Record<string, { total: number; count: number }> = {};
        orderSnap.forEach((o) => {
          const od = o.data();
          const uid = od.userId;
          if (!metrics[uid]) metrics[uid] = { total: 0, count: 0 };
          metrics[uid].total += parseFloat(od.totalAmount) || 0;
          metrics[uid].count += 1;
        });

        // attach metrics
        setCustomers(custs);
        setFiltered(custs);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to load customers",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [toast]);

  useEffect(() => {
    setFiltered(
      search
        ? customers.filter((c) =>
            c.name.toLowerCase().includes(search.toLowerCase())
          )
        : customers
    );
  }, [search, customers]);

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-muted-foreground">No customers found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cust, i) => {
                // metrics lookup
                // assume you re-fetch metrics here same way or lift metrics to state
                const { total = 0, count = 0 } = (() => {
                  // placeholder, in real code lift metrics out
                  return { total: 0, count: 0 };
                })();
                return (
                  <TableRow key={cust.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{cust.name}</TableCell>
                    <TableCell>{cust.email}</TableCell>
                    <TableCell>{formatDate(cust.createdAt)}</TableCell>
                    <TableCell>{count}</TableCell>
                    <TableCell>${total.toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{cust.status}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/customers/${cust.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
