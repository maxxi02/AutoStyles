"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  carType: string;
  color: string;
  finish: string;
  amount: string;
  status: "pending" | "ongoing" | "completed" | "canceled";
  date: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "TXN-001",
    carType: "Sedan",
    color: "Midnight Black",
    finish: "Matte",
    amount: "$550",
    status: "ongoing",
    date: "2024-10-10",
  },
  {
    id: "TXN-002",
    carType: "SUV",
    color: "Pearl White",
    finish: "Glossy",
    amount: "$715",
    status: "pending",
    date: "2024-10-09",
  },
  {
    id: "TXN-003",
    carType: "Pickup",
    color: "Racing Red",
    finish: "Metallic",
    amount: "$840",
    status: "completed",
    date: "2024-10-08",
  },
  {
    id: "TXN-004",
    carType: "Hatchback",
    color: "Ocean Blue",
    finish: "Matte",
    amount: "$495",
    status: "canceled",
    date: "2024-10-07",
  },
  {
    id: "TXN-005",
    carType: "Sedan",
    color: "Silver Metallic",
    finish: "Glossy",
    amount: "$605",
    status: "pending",
    date: "2024-10-06",
  },
];

function getStatusBadge(status: Transaction["status"]) {
  const variants = {
    pending: "secondary",
    ongoing: "default",
    completed: "outline",
    canceled: "destructive",
  } as const;

  const labels = {
    pending: "Pending",
    ongoing: "Ongoing",
    completed: "Completed",
    canceled: "Canceled",
  };

  const icons = {
    pending: <Clock className="h-3 w-3" />,
    ongoing: <Clock className="h-3 w-3" />,
    completed: <CheckCircle2 className="h-3 w-3" />,
    canceled: <XCircle className="h-3 w-3" />,
  };

  return (
    <Badge
      variant={variants[status]}
      className="capitalize flex items-center gap-1"
    >
      {icons[status]}
      {labels[status]}
    </Badge>
  );
}

function TransactionDetailsDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>Review your order details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span>ID:</span>
            <span className="font-mono">{transaction.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Car Type:</span>
            <span>{transaction.carType}</span>
          </div>
          <div className="flex justify-between">
            <span>Color:</span>
            <span>{transaction.color}</span>
          </div>
          <div className="flex justify-between">
            <span>Finish:</span>
            <span>{transaction.finish}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-bold">{transaction.amount}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span>{getStatusBadge(transaction.status)}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{transaction.date}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Download Receipt</Button>
          <Button>Send Feedback</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const TransactionsPage = () => {
  const router = useRouter();
  const [transactions, setTransactions] =
    useState<Transaction[]>(mockTransactions);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");

  const filteredTransactions = transactions.filter((txn) => {
    if (activeTab === "orders") {
      return txn.status === "pending" || txn.status === "ongoing";
    } else if (activeTab === "completed") {
      return txn.status === "completed";
    }
    return true;
  });

  const handleCancel = (id: string) => {
    if (confirm("Are you sure you want to cancel this transaction?")) {
      setTransactions(
        transactions.map((txn) =>
          txn.id === id ? { ...txn, status: "canceled" as const } : txn
        )
      );
    }
  };

  const handleView = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  const handleEdit = (id: string) => {
    // Redirect to edit or customization with prefill
    router.push(`/c/customization?edit=${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/c/customization")}>
              <CreditCard className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">My Transactions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your orders and designs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders">Active Orders</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="orders" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        ID
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Car Type
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Color
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Finish
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Amount
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Date
                      </TableHead>
                      <TableHead className="text-right text-muted-foreground">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-border">
                        <TableCell className="font-mono text-sm text-foreground">
                          {transaction.id}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {transaction.carType}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {transaction.color}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {transaction.finish}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {transaction.amount}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {transaction.date}
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(transaction.id)}
                            disabled={
                              transaction.status === "completed" ||
                              transaction.status === "canceled"
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancel(transaction.id)}
                            disabled={
                              transaction.status === "completed" ||
                              transaction.status === "canceled"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="completed" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        ID
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Car Type
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Color
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Finish
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Amount
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Date
                      </TableHead>
                      <TableHead className="text-right text-muted-foreground">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-border">
                        <TableCell className="font-mono text-sm text-foreground">
                          {transaction.id}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {transaction.carType}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {transaction.color}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {transaction.finish}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {transaction.amount}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {transaction.date}
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <Button variant="ghost" size="icon" disabled>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" disabled>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {selectedTransaction && (
          <TransactionDetailsDialog
            transaction={selectedTransaction}
            open={showDetails}
            onOpenChange={setShowDetails}
          />
        )}
      </main>
    </div>
  );
};

export default TransactionsPage;
