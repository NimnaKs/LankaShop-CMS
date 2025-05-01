"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Tag, Users } from "lucide-react";

export function DashboardStats() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get product count
        const productsSnapshot = await getDocs(collection(db, "products"));
        const productsCount = productsSnapshot.size;

        // Get orders count and calculate revenue
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const ordersCount = ordersSnapshot.size;
        let totalRevenue = 0;

        ordersSnapshot.forEach((doc) => {
          const orderData = doc.data();
          if (orderData.paymentStatus === "paid") {
            totalRevenue += Number.parseFloat(orderData.totalAmount) || 0;
          }
        });

        // Get customers count
        const customersSnapshot = await getDocs(collection(db, "customers"));
        const customersCount = customersSnapshot.size;

        setStats({
          products: productsCount,
          orders: ordersCount,
          customers: customersCount,
          revenue: totalRevenue,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : stats.products}
          </div>
          <p className="text-xs text-muted-foreground">
            Items in your inventory
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : stats.orders}
          </div>
          <p className="text-xs text-muted-foreground">Orders processed</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : stats.customers}
          </div>
          <p className="text-xs text-muted-foreground">Registered customers</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : `£${stats.revenue.toFixed(2)}`}
          </div>
          <p className="text-xs text-muted-foreground">
            Total revenue from paid orders
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
