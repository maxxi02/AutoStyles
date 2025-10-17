"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Eye,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  DollarSign,
  FileText,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type React from "react";

interface Transaction {
  id: string;
  typeId: string;
  modelId: string;
  colorId: string;
  timestamp: Date;
  price: number;
  status: "saved" | "purchased" | "cancelled";
  paymentVerifiedAt?: Date;
  paymentId?: string;
}

interface CarType {
  id: string;
  name: string;
}

interface CarModel {
  id: string;
  name: string;
  carTypeId: string;
}

interface PaintColor {
  id: string;
  name: string;
  carModelId: string;
}

const AdminTransactionPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snapshotCount, setSnapshotCount] = useState(0);

  useEffect(() => {
    const expectedSnapshots = 4; // transactions + 3 others

    const unsubscribeTransactions = onSnapshot(
      collection(db, "transactions"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp.toDate(),
              paymentVerifiedAt: doc.data().paymentVerifiedAt?.toDate(),
            }) as Transaction
        );
        setTransactions(data);

        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === expectedSnapshots) {
            setIsLoading(false);
          }
          return next;
        });
      }
    );

    const unsubscribeCarTypes = onSnapshot(
      collection(db, "carTypes"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as CarType
        );
        setCarTypes(data);
        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === expectedSnapshots) {
            setIsLoading(false);
          }
          return next;
        });
      }
    );

    const unsubscribeCarModels = onSnapshot(
      collection(db, "carModels"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as CarModel
        );
        setCarModels(data);
        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === expectedSnapshots) {
            setIsLoading(false);
          }
          return next;
        });
      }
    );

    const unsubscribePaintColors = onSnapshot(
      collection(db, "paintColors"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as PaintColor
        );
        setPaintColors(data);
        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === expectedSnapshots) {
            setIsLoading(false);
          }
          return next;
        });
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeCarTypes();
      unsubscribeCarModels();
      unsubscribePaintColors();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  const paidTransactions = transactions.filter(
    (transaction) => transaction.status === "purchased"
  );

  const getTransactionDetails = (transaction: Transaction) => {
    const type = carTypes.find((t) => t.id === transaction.typeId);
    const model = carModels.find((m) => m.id === transaction.modelId);
    const color = paintColors.find((c) => c.id === transaction.colorId);

    return { type, model, color };
  };

  const totalRevenue = paidTransactions.reduce(
    (sum, transaction) => sum + transaction.price,
    0
  );

  function getStatusBadge(status: Transaction["status"]) {
    let displayStatus: string;
    let variant: "default" | "secondary" | "destructive" | "outline";
    switch (status) {
      case "saved":
        displayStatus = "Pending";
        variant = "secondary";
        break;
      case "purchased":
        displayStatus = "Completed";
        variant = "outline";
        break;
      case "cancelled":
        displayStatus = "Cancelled";
        variant = "destructive";
        break;
      default:
        displayStatus = "Unknown";
        variant = "secondary";
    }

    return (
      <Badge variant={variant} className="capitalize">
        {displayStatus}
      </Badge>
    );
  }

  function QuickActions() {
    return (
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Create Transaction</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Online Order</DropdownMenuItem>
            <DropdownMenuItem>Walk-in Customer</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Quick Quote</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  interface StatCardProps {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down";
    icon: React.ReactNode;
  }

  function StatCard({ title, value, change, trend, icon }: StatCardProps) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="text-3xl font-bold text-foreground">{value}</p>
              <div className="flex items-center gap-1 text-sm">
                {trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-accent" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={
                    trend === "up" ? "text-accent" : "text-destructive"
                  }
                >
                  {change}
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function StatsCards() {
    const totalTransactions = paidTransactions.length;
    const pendingCount = transactions.filter(
      (t) => t.status === "saved"
    ).length;
    const completedCount = paidTransactions.length;

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Transactions"
          value={totalTransactions.toString()}
          change="+15%"
          trend="up"
          icon={<FileText className="h-6 w-6" />}
        />
        <StatCard
          title="Pending"
          value={pendingCount.toString()}
          change="-2%"
          trend="down"
          icon={<Clock className="h-6 w-6" />}
        />
        <StatCard
          title="Completed"
          value={completedCount.toString()}
          change="+22%"
          trend="up"
          icon={<CheckCircle2 className="h-6 w-6" />}
        />
        <StatCard
          title="Total Revenue"
          value={`₱${totalRevenue.toLocaleString()}`}
          change="+28%"
          trend="up"
          icon={<DollarSign className="h-6 w-6" />}
        />
      </div>
    );
  }

  function TransactionsTable() {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">
                All Transactions
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage and track customer orders
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  Customer
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Car Type
                </TableHead>
                <TableHead className="text-muted-foreground">Color</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-right text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paidTransactions.map((transaction) => {
                const details = getTransactionDetails(transaction);
                return (
                  <TableRow key={transaction.id} className="border-border">
                    <TableCell className="font-medium text-foreground">
                      {details.model?.name || "N/A"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {details.type?.name || "Unknown Type"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {details.color?.name || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      ₱{transaction.price.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(transaction.timestamp, "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <QuickActions />
        </div>

        <StatsCards />

        <TransactionsTable />
      </main>
    </div>
  );
};

export default AdminTransactionPage;
