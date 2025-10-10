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
  Download,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  DollarSign,
  FileText,
  BarChart3,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
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

const salesData = [
  { month: "Jan", revenue: 4000, orders: 240 },
  { month: "Feb", revenue: 3000, orders: 139 },
  { month: "Mar", revenue: 2000, orders: 380 },
  { month: "Apr", revenue: 2780, orders: 568 },
  { month: "May", revenue: 1890, orders: 108 },
  { month: "Jun", revenue: 2390, orders: 365 },
  { month: "Jul", revenue: 3490, orders: 530 },
];

interface PerformanceReport {
  id: string;
  period: string;
  totalSales: number;
  avgOrderValue: number;
  conversionRate: number;
  topColor: string;
}

const performanceReports: PerformanceReport[] = [
  {
    id: "REP-001",
    period: "Q1 2025",
    totalSales: 15000,
    avgOrderValue: 550,
    conversionRate: 85,
    topColor: "Midnight Black",
  },
  {
    id: "REP-002",
    period: "Q2 2025",
    totalSales: 22000,
    avgOrderValue: 620,
    conversionRate: 92,
    topColor: "Pearl White",
  },
  {
    id: "REP-003",
    period: "Q3 2025",
    totalSales: 18000,
    avgOrderValue: 580,
    conversionRate: 88,
    topColor: "Racing Red",
  },
  {
    id: "REP-004",
    period: "Aug 2025",
    totalSales: 8500,
    avgOrderValue: 510,
    conversionRate: 90,
    topColor: "Ocean Blue",
  },
];

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
        title="Total Revenue"
        value="$65,000"
        change="+24%"
        trend="up"
        icon={<DollarSign className="h-6 w-6" />}
      />
      <StatCard
        title="Total Orders"
        value="120"
        change="+15%"
        trend="up"
        icon={<FileText className="h-6 w-6" />}
      />
      <StatCard
        title="Avg Order Value"
        value="$542"
        change="+8%"
        trend="up"
        icon={<BarChart3 className="h-6 w-6" />}
      />
      <StatCard
        title="Conversion Rate"
        value="89%"
        change="+5%"
        trend="up"
        icon={<CheckCircle2 className="h-6 w-6" />}
      />
    </div>
  );
}

function PopularColors() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Popular Colors</CardTitle>
        <CardDescription className="text-muted-foreground">
          Most requested paint colors this quarter
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

function SalesTrendsChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Sales Trends</CardTitle>
        <CardDescription className="text-muted-foreground">
          Monthly revenue and orders overview
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" className="text-muted-foreground" />
            <YAxis className="text-muted-foreground" />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
            <Bar dataKey="orders" fill="#10b981" name="Orders" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function PerformanceReportsTable() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Performance Reports</CardTitle>
        <CardDescription className="text-muted-foreground">
          Key metrics by period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Report ID</TableHead>
              <TableHead className="text-muted-foreground">Period</TableHead>
              <TableHead className="text-muted-foreground">
                Total Sales
              </TableHead>
              <TableHead className="text-muted-foreground">
                Avg Order Value
              </TableHead>
              <TableHead className="text-muted-foreground">
                Conversion Rate
              </TableHead>
              <TableHead className="text-muted-foreground">Top Color</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performanceReports.map((report) => (
              <TableRow key={report.id} className="border-border">
                <TableCell className="font-mono text-sm text-foreground">
                  {report.id}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {report.period}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  ${report.totalSales}
                </TableCell>
                <TableCell className="text-foreground">
                  ${report.avgOrderValue}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {report.conversionRate}%
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {report.topColor}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const AnalyticsPage = () => {
  const handleExport = () => {
    // Simulate export
    const data = JSON.stringify(
      { salesData, colorData, performanceReports },
      null,
      2
    );
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics-report.json";
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Insights into sales, trends, and performance
            </p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <StatsCards />

        <div className="grid gap-6 lg:grid-cols-2">
          <SalesTrendsChart />
          <PopularColors />
        </div>

        <PerformanceReportsTable />
      </main>
    </div>
  );
};

export default AnalyticsPage;
