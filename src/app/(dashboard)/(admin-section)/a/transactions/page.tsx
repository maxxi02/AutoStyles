"use client";

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
  {
    id: "TXN-006",
    customer: "Lisa Garcia",
    carType: "Sports Car",
    color: "Racing Red",
    amount: "$720",
    status: "pending",
    date: "2024-01-08",
  },
  {
    id: "TXN-007",
    customer: "Robert Lee",
    carType: "SUV",
    color: "Ocean Blue",
    amount: "$510",
    status: "completed",
    date: "2024-01-07",
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
        title="Total Transactions"
        value="47"
        change="+15%"
        trend="up"
        icon={<FileText className="h-6 w-6" />}
      />
      <StatCard
        title="Pending"
        value="5"
        change="-2%"
        trend="down"
        icon={<Clock className="h-6 w-6" />}
      />
      <StatCard
        title="Completed"
        value="32"
        change="+22%"
        trend="up"
        icon={<CheckCircle2 className="h-6 w-6" />}
      />
      <StatCard
        title="Total Revenue"
        value="$18,450"
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
            <CardTitle className="text-foreground">All Transactions</CardTitle>
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

const TransactionPage = () => {
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

export default TransactionPage;
