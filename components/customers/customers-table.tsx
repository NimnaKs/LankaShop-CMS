"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Eye, MoreHorizontal, Search } from "lucide-react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Customer {
  id: string
  userId: string
  createdAt: string
  billingAddressId?: string
  shippingAddressId?: string
  totalAmount: string
  orderCount: number
}

export function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersSnapshot = await getDocs(query(collection(db, "customers"), orderBy("createdAt", "desc")))

        // Get all orders to calculate totals
        const ordersSnapshot = await getDocs(collection(db, "orders"))

        // Group orders by customer
        const customerOrders: Record<string, { total: number; count: number }> = {}
        ordersSnapshot.forEach((doc) => {
          const order = doc.data()
          if (order.userId) {
            if (!customerOrders[order.userId]) {
              customerOrders[order.userId] = { total: 0, count: 0 }
            }
            customerOrders[order.userId].total += Number.parseFloat(order.totalAmount) || 0
            customerOrders[order.userId].count += 1
          }
        })

        const customersData = customersSnapshot.docs.map((doc) => {
          const data = doc.data()
          const userId = data.userId
          return {
            id: doc.id,
            userId: userId,
            createdAt: data.createdAt,
            billingAddressId: data.billingAddressId,
            shippingAddressId: data.shippingAddressId,
            totalAmount: customerOrders[userId]?.total.toFixed(2) || "0.00",
            orderCount: customerOrders[userId]?.count || 0,
          }
        })

        setCustomers(customersData)
        setFilteredCustomers(customersData)
      } catch (error) {
        console.error("Error fetching customers:", error)
        toast({
          title: "Error",
          description: "Failed to load customers",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [toast])

  useEffect(() => {
    if (searchQuery) {
      const filtered = customers.filter((customer) => customer.userId.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }, [searchQuery, customers])

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-muted-foreground">No customers found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.userId}</TableCell>
                  <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  <TableCell>{customer.orderCount}</TableCell>
                  <TableCell>${customer.totalAmount}</TableCell>
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
                          <Link href={`/dashboard/customers/${customer.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  )
}
