"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Firebase imports
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Dialog imports
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Interfaces
interface Transaction {
  id: string;
  price: number;
  status: "saved" | "purchased" | "cancelled";
  timestamp: Date;
  colorId: string;
  customizationProgress?: {
    overallStatus: string;
  };
  customerDetails?: {
    fullName: string;
    email: string;
    contactNumber: string;
    address: string;
  };
}

interface PaintColor {
  id: string;
  name: string;
  hex: string;
}

interface ColorData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

// StatCard Component
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
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <div className="flex items-center gap-1 text-sm">
              {trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-accent" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
              <span
                className={trend === "up" ? "text-accent" : "text-destructive"}
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

// StatsCards Component with real data
function StatsCards({
  pendingCount,
  ongoingCount,
  completedToday,
  revenueToday,
}: {
  pendingCount: number;
  ongoingCount: number;
  completedToday: number;
  revenueToday: number;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Pending Orders"
        value={pendingCount.toString()}
        change="+8%"
        trend="up"
        icon={<Clock className="h-6 w-6" />}
      />
      <StatCard
        title="Ongoing Jobs"
        value={ongoingCount.toString()}
        change="+12%"
        trend="up"
        icon={<AlertCircle className="h-6 w-6" />}
      />
      <StatCard
        title="Completed Today"
        value={completedToday.toString()}
        change="+18%"
        trend="up"
        icon={<CheckCircle2 className="h-6 w-6" />}
      />
      <StatCard
        title="Revenue Today"
        value={`₱${revenueToday.toLocaleString()}`}
        change="+24%"
        trend="up"
        icon={<ArrowUpRight className="h-6 w-6" />}
      />
    </div>
  );
}

// PopularColors Component with real data
function PopularColors({
  popularColors,
  total,
}: {
  popularColors: (ColorData | null)[];
  total: number;
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Popular Colors</CardTitle>
        <CardDescription className="text-muted-foreground">
          Most requested paint colors this week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {popularColors.map(
          (item, index) =>
            item && (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.count}
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            )
        )}
      </CardContent>
    </Card>
  );
}

// RecentTransactions Component with real data
interface RecentTransactionsProps {
  transactions: Transaction[];
  paintColors: PaintColor[];
  onViewDetails?: (transaction: Transaction) => void;
}

function RecentTransactions({
  transactions,
  paintColors,
  onViewDetails,
}: RecentTransactionsProps) {
  const router = useRouter();

  const getStatusBadge = (status: Transaction["status"]) => {
    const variants = {
      saved: "secondary",
      purchased: "default",
      cancelled: "destructive",
    } as const;

    const labels = {
      saved: "Pending",
      purchased: "Completed",
      cancelled: "Cancelled",
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {labels[status]}
      </Badge>
    );
  };

  const getColorName = (colorId: string) => {
    const color = paintColors.find((c) => c.id === colorId);
    return color ? color.name : "Unknown Color";
  };

  const getCustomerName = (transaction: Transaction) => {
    return transaction.customerDetails?.fullName || "Anonymous Customer";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Sort by timestamp descending and take last 5
  const recentTransactions = [...transactions]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">
              Recent Transactions
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Latest customer orders and walk-ins
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/a/transactions")}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Customer</TableHead>
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
            {recentTransactions.map((transaction) => (
              <TableRow key={transaction.id} className="border-border">
                <TableCell className="font-medium text-sm text-foreground">
                  {getCustomerName(transaction)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getColorName(transaction.colorId)}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  ₱{transaction.price.toLocaleString()}
                </TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(transaction.timestamp)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onViewDetails?.(transaction)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// SalesChart Component with real data
function SalesChart({
  chartData,
}: {
  chartData: Array<{ date: string; revenue: number; orders: number }>;
}) {
  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Sales Overview</CardTitle>
        <CardDescription className="text-muted-foreground">
          Weekly revenue and order trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
              tickFormatter={(value) => `₱${value}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              fill="url(#fillRevenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// DetailsModal Component
interface DetailsModalProps {
  transaction: Transaction | null;
  paintColors: PaintColor[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailsModal({
  transaction,
  paintColors,
  open,
  onOpenChange,
}: DetailsModalProps) {
  if (!transaction) return null;

  const getColorName = (colorId: string) => {
    const color = paintColors.find((c) => c.id === colorId);
    return color ? color.name : "Unknown Color";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    const variants = {
      saved: "secondary",
      purchased: "default",
      cancelled: "destructive",
    } as const;

    const labels = {
      saved: "Pending",
      purchased: "Completed",
      cancelled: "Cancelled",
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {labels[status]}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            View customer and transaction information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Customer Information</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Name:</span>{" "}
                {transaction.customerDetails?.fullName || "N/A"}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {transaction.customerDetails?.email || "N/A"}
              </p>
              <p>
                <span className="font-medium">Contact:</span>{" "}
                {transaction.customerDetails?.contactNumber || "N/A"}
              </p>
              <p>
                <span className="font-medium">Address:</span>{" "}
                {transaction.customerDetails?.address || "N/A"}
              </p>
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Transaction Summary</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Color:</span>{" "}
                {getColorName(transaction.colorId)}
              </p>
              <p>
                <span className="font-medium">Amount:</span> ₱
                {transaction.price.toLocaleString()}
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                {getStatusBadge(transaction.status)}
              </p>
              <p>
                <span className="font-medium">Date:</span>{" "}
                {formatDate(transaction.timestamp)}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">ID:</span>{" "}
                {transaction.id.slice(0, 8)}...
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main DashboardPage Component
export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  useEffect(() => {
    const unsubTransactions = onSnapshot(
      collection(db, "transactions"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
        })) as Transaction[];
        setTransactions(data);
      }
    );

    const unsubColors = onSnapshot(
      collection(db, "paintColors"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PaintColor[];
        setPaintColors(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubTransactions();
      unsubColors();
    };
  }, []);

  // Calculate real stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const paidTransactions = transactions.filter((t) => t.status === "purchased");
  const todayTransactions = paidTransactions.filter(
    (t) => t.timestamp >= today
  );

  const pendingCount = transactions.filter((t) => t.status === "saved").length;
  const ongoingCount = transactions.filter(
    (t) =>
      t.status === "purchased" &&
      t.customizationProgress?.overallStatus !== "completed"
  ).length;
  const completedToday = todayTransactions.length;
  const revenueToday = todayTransactions.reduce((sum, t) => sum + t.price, 0);

  // Calculate popular colors
  const colorCounts = paidTransactions.reduce(
    (acc, t) => {
      acc[t.colorId] = (acc[t.colorId] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const popularColorData = Object.entries(colorCounts)
    .map(([colorId, count]) => {
      const color = paintColors.find((c) => c.id === colorId);
      return color
        ? {
            name: color.name,
            count,
            percentage: 0, // Will calculate below
            color: color.hex,
          }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b!.count - a!.count)
    .slice(0, 4);

  const total = popularColorData.reduce((sum, c) => sum + c!.count, 0);

  // Calculate percentages
  const popularColorsWithPercentage = popularColorData.map((item) =>
    item ? { ...item, percentage: (item.count / total) * 100 } : null
  );

  // Calculate chart data - last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayTransactions = paidTransactions.filter(
      (t) => t.timestamp >= date && t.timestamp < nextDay
    );

    return {
      date: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()],
      revenue: dayTransactions.reduce((sum, t) => sum + t.price, 0),
      orders: dayTransactions.length,
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <StatsCards
          pendingCount={pendingCount}
          ongoingCount={ongoingCount}
          completedToday={completedToday}
          revenueToday={revenueToday}
        />

        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <SalesChart chartData={chartData} />
          </div>
          <div className="lg:col-span-3">
            <PopularColors
              popularColors={popularColorsWithPercentage}
              total={total}
            />
          </div>
        </div>

        <RecentTransactions
          transactions={transactions}
          paintColors={paintColors}
          onViewDetails={handleViewDetails}
        />

        <DetailsModal
          transaction={selectedTransaction}
          paintColors={paintColors}
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
        />
      </main>
    </div>
  );
}
