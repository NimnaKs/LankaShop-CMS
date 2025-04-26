"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Search } from "lucide-react"
import { Loader2 } from "lucide-react"

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

export function AddressesTable() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [filteredAddresses, setFilteredAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const addressesSnapshot = await getDocs(query(collection(db, "addresses"), orderBy("userId")))

        const addressesData = addressesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Address[]

        setAddresses(addressesData)
        setFilteredAddresses(addressesData)
      } catch (error) {
        console.error("Error fetching addresses:", error)
        toast({
          title: "Error",
          description: "Failed to load addresses",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAddresses()
  }, [toast])

  useEffect(() => {
    if (searchQuery) {
      const filtered = addresses.filter(
        (address) =>
          address.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          address.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
          address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          address.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
          address.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          address.postalCode.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredAddresses(filtered)
    } else {
      setFilteredAddresses(addresses)
    }
  }, [searchQuery, addresses])

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search addresses..."
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
        ) : filteredAddresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-muted-foreground">No addresses found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Postal Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAddresses.map((address) => (
                <TableRow key={address.id}>
                  <TableCell className="font-medium">{address.userId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{address.label}</Badge>
                  </TableCell>
                  <TableCell>{address.street}</TableCell>
                  <TableCell>{address.city}</TableCell>
                  <TableCell>{address.state}</TableCell>
                  <TableCell>{address.country}</TableCell>
                  <TableCell>{address.postalCode}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  )
}
