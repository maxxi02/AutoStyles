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
  Plus,
  Users,
  DollarSign,
  Eye,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface ColorData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

const colorData: ColorData[] = [
  { name: "Midnight Black", count: 45, percentage: 35, color: "#1a1a1a" },
  { name: "Pearl White", count: 38, percentage: 30, color: "#f8f8f8" },
  { name: "Racing Red", count: 25, percentage: 20, color: "#dc2626" },
  { name: "Ocean Blue", count: 19, percentage: 15, color: "#3b82f6" },
];

function PopularColors() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Popular Colors</CardTitle>
        <CardDescription className="text-muted-foreground">
          Most requested paint colors this week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {colorData.map((item) => (
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
        ))}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm">
        <Users className="h-4 w-4 mr-2" />
        Walk-in Customer
      </Button>

      <Button variant="outline" size="sm">
        <DollarSign className="h-4 w-4 mr-2" />
        Open Cashier
      </Button>

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

interface Transaction {
  id: string;
  customer: string;
  carType: string;
  color: string;
  amount: string;
  status: "pending" | "ongoing" | "completed";
  date: string;
}

const transactions: Transaction[] = [
  {
    id: "TXN-001",
    customer: "John Smith",
    carType: "Sedan",
    color: "Midnight Black",
    amount: "$450",
    status: "ongoing",
    date: "2024-01-10",
  },
  {
    id: "TXN-002",
    customer: "Sarah Johnson",
    carType: "SUV",
    color: "Pearl White",
    amount: "$580",
    status: "pending",
    date: "2024-01-10",
  },
  {
    id: "TXN-003",
    customer: "Mike Davis",
    carType: "Pickup",
    color: "Racing Red",
    amount: "$620",
    status: "completed",
    date: "2024-01-09",
  },
  {
    id: "TXN-004",
    customer: "Emily Brown",
    carType: "Hatchback",
    color: "Ocean Blue",
    amount: "$380",
    status: "ongoing",
    date: "2024-01-09",
  },
  {
    id: "TXN-005",
    customer: "David Wilson",
    carType: "Sedan",
    color: "Silver Metallic",
    amount: "$490",
    status: "completed",
    date: "2024-01-08",
  },
];

function getStatusBadge(status: Transaction["status"]) {
  const variants = {
    pending: "secondary",
    ongoing: "default",
    completed: "outline",
  } as const;

  const labels = {
    pending: "Pending",
    ongoing: "Ongoing",
    completed: "Completed",
  };

  return (
    <Badge variant={variants[status]} className="capitalize">
      {labels[status]}
    </Badge>
  );
}

function RecentTransactions() {
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
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">
                Transaction ID
              </TableHead>
              <TableHead className="text-muted-foreground">Customer</TableHead>
              <TableHead className="text-muted-foreground">Car Type</TableHead>
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
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="border-border">
                <TableCell className="font-mono text-sm text-foreground">
                  {transaction.id}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {transaction.customer}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {transaction.carType}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {transaction.color}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {transaction.amount}
                </TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {transaction.date}
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const chartData = [
  { date: "Mon", revenue: 2400, orders: 12 },
  { date: "Tue", revenue: 3200, orders: 16 },
  { date: "Wed", revenue: 2800, orders: 14 },
  { date: "Thu", revenue: 4100, orders: 20 },
  { date: "Fri", revenue: 3800, orders: 18 },
  { date: "Sat", revenue: 4500, orders: 22 },
  { date: "Sun", revenue: 3600, orders: 17 },
];

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

function SalesChart() {
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
              tickFormatter={(value) => `$${value}`}
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

function StatsCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Pending Orders"
        value="12"
        change="+8%"
        trend="up"
        icon={<Clock className="h-6 w-6" />}
      />
      <StatCard
        title="Ongoing Jobs"
        value="8"
        change="+12%"
        trend="up"
        icon={<AlertCircle className="h-6 w-6" />}
      />
      <StatCard
        title="Completed Today"
        value="24"
        change="+18%"
        trend="up"
        icon={<CheckCircle2 className="h-6 w-6" />}
      />
      <StatCard
        title="Revenue Today"
        value="$4,280"
        change="+24%"
        trend="up"
        icon={<ArrowUpRight className="h-6 w-6" />}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-1 space-y-6">
        <div className="flex items-center justify-between">
          <QuickActions />
        </div>

        <StatsCards />

        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <SalesChart />
          </div>
          <div className="lg:col-span-3">
            <PopularColors />
          </div>
        </div>

        <RecentTransactions />
      </main>
    </div>
  );
}
