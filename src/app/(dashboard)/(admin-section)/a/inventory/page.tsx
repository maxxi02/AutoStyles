"use client"

import  { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Package,  DollarSign, AlertTriangle, Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface InventoryItem {
  id: string
  name: string
  type: "Paint" | "Part" | "Car Model"
  stock: number
  minStock: number
  price: number
  status: "In Stock" | "Low Stock" | "Out of Stock"
}

const inventoryData: InventoryItem[] = [
  { id: "PNT-001", name: "Midnight Black", type: "Paint", stock: 45, minStock: 10, price: 75, status: "In Stock" },
  { id: "PNT-002", name: "Pearl White", type: "Paint", stock: 8, minStock: 10, price: 80, status: "Low Stock" },
  { id: "PNT-003", name: "Racing Red", type: "Paint", stock: 25, minStock: 10, price: 70, status: "In Stock" },
  { id: "PRT-001", name: "Brake Pads Set", type: "Part", stock: 12, minStock: 5, price: 150, status: "In Stock" },
  { id: "PRT-002", name: "Oil Filter", type: "Part", stock: 3, minStock: 5, price: 25, status: "Low Stock" },
  { id: "CAR-001", name: "Sedan Base Model", type: "Car Model", stock: 5, minStock: 2, price: 25000, status: "In Stock" },
  { id: "CAR-002", name: "SUV Premium", type: "Car Model", stock: 0, minStock: 2, price: 35000, status: "Out of Stock" },
]

interface StatCardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: React.ReactNode
}

function StatCard({ title, value, change, trend, icon }: StatCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <div className="flex items-center gap-1 text-sm">
              {trend === "up" ? (
                <Package className="h-4 w-4 text-accent" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
              <span className={trend === "up" ? "text-accent" : "text-destructive"}>{change}</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatsCards() {
  const lowStock = inventoryData.filter(item => item.status === "Low Stock").length
  const outOfStock = inventoryData.filter(item => item.status === "Out of Stock").length
  const totalValue = inventoryData.reduce((sum, item) => sum + (item.stock * item.price), 0)

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total Items" value={inventoryData.length.toString()} change="+2" trend="up" icon={<Package className="h-6 w-6" />} />
      <StatCard title="Low Stock" value={lowStock.toString()} change="+1" trend="up" icon={<AlertTriangle className="h-6 w-6" />} />
      <StatCard title="Out of Stock" value={outOfStock.toString()} change="0" trend="up" icon={<Package className="h-6 w-6 text-destructive" />} />
      <StatCard title="Inventory Value" value={`$${totalValue.toLocaleString()}`} change="+12%" trend="up" icon={<DollarSign className="h-6 w-6" />} />
    </div>
  )
}

interface AddItemForm {
  name: string
  type: "Paint" | "Part" | "Car Model"
  stock: number
  minStock: number
  price: number
}

function AddItemDialog({ onAdd }: { onAdd: (item: InventoryItem) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AddItemForm>({
    name: "",
    type: "Paint",
    stock: 0,
    minStock: 0,
    price: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newItem: InventoryItem = {
      id: `INV-${Date.now()}`,
      ...form,
      status: form.stock > form.minStock ? "In Stock" : form.stock === 0 ? "Out of Stock" : "Low Stock",
    }
    onAdd(newItem)
    setForm({ name: "", type: "Paint", stock: 0, minStock: 0, price: 0 })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
          <DialogDescription>Enter details for the new item.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as AddItemForm["type"] })}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Paint">Paint</SelectItem>
                <SelectItem value="Part">Part</SelectItem>
                <SelectItem value="Car Model">Car Model</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Min Stock</Label>
              <Input id="minStock" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: parseInt(e.target.value) || 0 })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input id="price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} required />
          </div>
          <DialogFooter>
            <Button type="submit">Add Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function InventoryTable({ data, onUpdate, onDelete }: { data: InventoryItem[], onUpdate: (item: InventoryItem) => void, onDelete: (id: string) => void }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Inventory Items</CardTitle>
            <CardDescription className="text-muted-foreground">Monitor and manage stock levels</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Stock</TableHead>
              <TableHead className="text-muted-foreground">Min Stock</TableHead>
              <TableHead className="text-muted-foreground">Price</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} className="border-border">
                <TableCell className="font-mono text-sm text-foreground">{item.id}</TableCell>
                <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">{item.type}</Badge>
                </TableCell>
                <TableCell className="text-foreground">{item.stock}</TableCell>
                <TableCell className="text-foreground">{item.minStock}</TableCell>
                <TableCell className="font-medium text-foreground">${item.price}</TableCell>
                <TableCell>
                  <Badge variant={item.status === "In Stock" ? "default" : item.status === "Low Stock" ? "secondary" : "destructive"}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => {/* Edit logic */}}>Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

const InventoryPage = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(inventoryData)

  const handleAddItem = (newItem: InventoryItem) => {
    setInventory([...inventory, newItem])
  }

  const handleDeleteItem = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id))
  }

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setInventory(inventory.map(item => item.id === updatedItem.id ? updatedItem : item))
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Inventory
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage paint colors, parts, and car models stock levels
            </p>
          </div>
          <AddItemDialog onAdd={handleAddItem} />
        </div>

        <StatsCards />

        <InventoryTable data={inventory} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} />
      </main>
    </div>
  )
}

export default InventoryPage