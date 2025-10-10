"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Printer, Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React from "react";
import Image from "next/image";

const carTypes = ["Sedan", "SUV", "Pickup", "Hatchback", "Sports Car"];
const colors = [
  "Midnight Black",
  "Pearl White",
  "Racing Red",
  "Ocean Blue",
  "Silver Metallic",
];
const finishes = ["Matte", "Glossy", "Metallic"];
const discounts = [
  { id: "none", name: "No Discount", value: 0 },
  { id: "loyalty", name: "Loyalty (10%)", value: 0.1 },
  { id: "senior", name: "Senior (15%)", value: 0.15 },
  { id: "student", name: "Student (5%)", value: 0.05 },
];

interface TransactionForm {
  customerName: string;
  carType: string;
  color: string;
  finish: string;
  basePrice: number;
  discount: string;
  amountPaid: number;
}

const CashierPage = () => {
  const [form, setForm] = useState<TransactionForm>({
    customerName: "",
    carType: "",
    color: "",
    finish: "",
    basePrice: 500, // Default base price
    discount: "none",
    amountPaid: 0,
  });
  const [totalDue, setTotalDue] = useState(0);
  const [change, setChange] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSelectChange = (name: keyof TransactionForm, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const calculateTotal = () => {
    const discountValue =
      discounts.find((d) => d.id === form.discount)?.value || 0;
    const discountedPrice = form.basePrice * (1 - discountValue);
    setTotalDue(discountedPrice);
    if (form.amountPaid > 0) {
      setChange(form.amountPaid - discountedPrice);
    }
  };

  const handleFinalize = () => {
    calculateTotal();
    if (form.amountPaid < totalDue) {
      alert("Amount paid must cover the total due.");
      return;
    }
    setShowReceipt(true);
  };

  const handlePrintReceipt = () => {
    // Simulate printing
    window.print();
    setShowReceipt(false);
  };

  React.useEffect(() => {
    calculateTotal();
  }, [form.basePrice, form.discount, form.amountPaid]);

  const getPreviewImage = () => {
    // Simple placeholder based on car type
    const images = {
      Sedan:
        "https://images.unsplash.com/photo-1502877338535-766e3a6052c0?w=300&h=200&fit=crop",
      SUV: "https://images.unsplash.com/photo-1549317661-bd8e8e7b1d1f?w=300&h=200&fit=crop",
      Pickup:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=300&h=200&fit=crop",
      Hatchback:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=300&h=200&fit=crop",
      "Sports Car":
        "https://images.unsplash.com/photo-1571171638497-a3e3c5e0c1e?w=300&h=200&fit=crop",
    };
    return images[form.carType as keyof typeof images] || images.Sedan;
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Receipt</DialogTitle>
                <DialogDescription>
                  Transaction completed successfully.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{form.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Car Type:</span>
                  <span>{form.carType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Color:</span>
                  <span>{form.color}</span>
                </div>
                <div className="flex justify-between">
                  <span>Finish:</span>
                  <span>{form.finish}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>
                    {discounts.find((d) => d.id === form.discount)?.name}
                  </span>
                </div>
                <div className="text-lg font-bold">
                  Total Due: ${totalDue.toFixed(2)}
                </div>
                <div className="flex justify-between">
                  Amount Paid: <span>${form.amountPaid.toFixed(2)}</span>
                </div>
                <div className="text-lg font-bold text-green-600">
                  Change: ${change.toFixed(2)}
                </div>
                <div className="flex justify-between">
                  Date: <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handlePrintReceipt}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              New Walk-In Transaction
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Create and finalize customer order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carType">Car Type</Label>
                  <Select
                    value={form.carType}
                    onValueChange={(value) =>
                      handleSelectChange("carType", value)
                    }
                  >
                    <SelectTrigger id="carType">
                      <SelectValue placeholder="Select car type" />
                    </SelectTrigger>
                    <SelectContent>
                      {carTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Exterior Color</Label>
                  <Select
                    value={form.color}
                    onValueChange={(value) =>
                      handleSelectChange("color", value)
                    }
                  >
                    <SelectTrigger id="color">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finish">Paint Finish</Label>
                  <Select
                    value={form.finish}
                    onValueChange={(value) =>
                      handleSelectChange("finish", value)
                    }
                  >
                    <SelectTrigger id="finish">
                      <SelectValue placeholder="Select finish" />
                    </SelectTrigger>
                    <SelectContent>
                      {finishes.map((finish) => (
                        <SelectItem key={finish} value={finish}>
                          {finish}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <Select
                    value={form.discount}
                    onValueChange={(value) =>
                      handleSelectChange("discount", value)
                    }
                  >
                    <SelectTrigger id="discount">
                      <SelectValue placeholder="Select discount" />
                    </SelectTrigger>
                    <SelectContent>
                      {discounts.map((disc) => (
                        <SelectItem key={disc.id} value={disc.id}>
                          {disc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                  <Image
                    src={getPreviewImage()}
                    alt="Car Preview"
                    className="h-full w-full object-cover rounded-lg"
                    width={500}
                    height={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price ($)</Label>
                  <Input
                    id="basePrice"
                    name="basePrice"
                    type="number"
                    value={form.basePrice}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        basePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Enter base price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amountPaid">Amount Paid ($)</Label>
                  <Input
                    id="amountPaid"
                    name="amountPaid"
                    type="number"
                    value={form.amountPaid}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amountPaid: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Enter amount paid"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Due:</span>
                    <Badge variant="secondary">${totalDue.toFixed(2)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Change:</span>
                    <Badge variant={change >= 0 ? "default" : "destructive"}>
                      ${change.toFixed(2)}
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={handleFinalize}
                  className="w-full"
                  disabled={
                    !form.customerName ||
                    !form.carType ||
                    !form.color ||
                    !form.finish
                  }
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Finalize Transaction
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CashierPage;
