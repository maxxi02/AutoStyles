"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface Transaction {
  id: string;
  colorId: string;
  wheelId: string;
  interiorId: string;
  timestamp: Date;
  price: number;
  status: "saved" | "purchased" | "cancelled";
}

interface CarModel {
  id: string;
  name: string;
  carTypeId: string;
  imageUrl?: string;
}

interface PaintColor {
  id: string;
  carModelId: string;
  name: string;
  hex: string;
  finish: "Matte" | "Glossy" | "Metallic";
  description: string;
  price: number;
  inventory: number;
  images?: string[];
  sold?: number;
}

interface Wheel {
  id: string;
  carModelId: string;
  name: string;
  description: string;
  price: number;
  inventory: number;
  imageUrl?: string;
  sold?: number;
}

interface Interior {
  id: string;
  carModelId: string;
  name: string;
  description: string;
  price: number;
  inventory: number;
  imageUrl?: string;
  hex?: string;
  sold?: number;
}

const AnalyticsPage: React.FC = () => {
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [interiors, setInteriors] = useState<Interior[]>([]);
  // Initial data loading state
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [revenuePeriod, setRevenuePeriod] = useState<
    "weekly" | "monthly" | "yearly"
  >("monthly");

  // Load data from Firestore
  useEffect(() => {
    const unsubscribeCarModels = onSnapshot(
      collection(db, "carModels"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as CarModel
        );
        setCarModels(data);
        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === 4) {
            setIsDataLoading(false);
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
          if (next === 4) {
            setIsDataLoading(false);
          }
          return next;
        });
      }
    );
    const unsubscribeWheels = onSnapshot(
      collection(db, "wheels"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Wheel
        );
        setWheels(data);
        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === 4) {
            setIsDataLoading(false);
          }
          return next;
        });
      }
    );
    const unsubscribeInteriors = onSnapshot(
      collection(db, "interiors"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Interior
        );
        setInteriors(data);
        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === 4) {
            setIsDataLoading(false);
          }
          return next;
        });
      }
    );
    const unsubscribeTransactions = onSnapshot(
      collection(db, "transactions"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            timestamp: docData.timestamp?.toDate(),
          } as Transaction;
        });
        setTransactions(data.filter((t) => t.status === "purchased"));
        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === 5) {
            // Update to 5 snapshots
            setIsDataLoading(false);
          }
          return next;
        });
      }
    );
    return () => {
      unsubscribeCarModels();
      unsubscribePaintColors();
      unsubscribeWheels();
      unsubscribeInteriors();
      unsubscribeTransactions();
    };
  }, []);

  const getCarModelName = (carModelId: string) => {
    return (
      carModels.find((model) => model.id === carModelId)?.name || "Unknown"
    );
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    let startDate: Date;
    switch (revenuePeriod) {
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    return transactions.filter((t) => t.timestamp >= startDate);
  };

  const filteredTransactions = getFilteredTransactions();

  const totalRevenue =
    paintColors.reduce((sum, c) => {
      const sold = filteredTransactions.filter(
        (t) => t.colorId === c.id
      ).length;
      return sum + sold * c.price;
    }, 0) +
    wheels.reduce((sum, w) => {
      const sold = filteredTransactions.filter(
        (t) => t.wheelId === w.id
      ).length;
      return sum + sold * w.price;
    }, 0) +
    interiors.reduce((sum, i) => {
      const sold = filteredTransactions.filter(
        (t) => t.interiorId === i.id
      ).length;
      return sum + sold * i.price;
    }, 0);

  if (isDataLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Monitor & Analytics</CardTitle>
          <CardDescription>
            Track inventory levels, sales, and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {paintColors.length + wheels.length + interiors.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Colors: {paintColors.length} | Wheels: {wheels.length} |
                  Interiors: {interiors.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Inventory Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  ₱
                  {(
                    paintColors.reduce(
                      (sum, c) => sum + c.price * c.inventory,
                      0
                    ) +
                    wheels.reduce((sum, w) => sum + w.price * w.inventory, 0) +
                    interiors.reduce((sum, i) => sum + i.price * i.inventory, 0)
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current stock value
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                  <Select
                    value={revenuePeriod}
                    onValueChange={(value) =>
                      setRevenuePeriod(value as "weekly" | "monthly" | "yearly")
                    }
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  ₱{totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {revenuePeriod} revenue
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Low Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">
                  {paintColors.filter((c) => c.inventory < 50).length +
                    wheels.filter((w) => w.inventory < 50).length +
                    interiors.filter((i) => i.inventory < 50).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Items below threshold
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sales Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Paint Colors Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Top Selling Paint Colors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[...paintColors]
                        .filter((c) => (c.sold || 0) > 0)
                        .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                        .slice(0, 5)
                        .map((c) => ({
                          name: c.name,
                          value: c.sold || 0,
                          color: c.hex,
                        }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#000"
                      strokeWidth={1}
                    >
                      {[...paintColors]
                        .filter((c) => (c.sold || 0) > 0)
                        .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                        .slice(0, 5)
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.hex} />
                        ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {paintColors.filter((c) => (c.sold || 0) > 0).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    No sales data yet
                  </p>
                )}
              </CardContent>
            </Card>
            {/* Wheels Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Selling Wheels</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[...wheels]
                        .filter((w) => (w.sold || 0) > 0)
                        .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                        .slice(0, 5)
                        .map((w, i) => ({
                          name: w.name,
                          value: w.sold || 0,
                          color: [
                            "#0088FE",
                            "#00C49F",
                            "#FFBB28",
                            "#FF8042",
                            "#8884d8",
                          ][i],
                        }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#000"
                      strokeWidth={1}
                    >
                      {[...wheels]
                        .filter((w) => (w.sold || 0) > 0)
                        .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                        .slice(0, 5)
                        .map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [
                                "#0088FE",
                                "#00C49F",
                                "#FFBB28",
                                "#FF8042",
                                "#8884d8",
                              ][index]
                            }
                          />
                        ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {wheels.filter((w) => (w.sold || 0) > 0).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    No sales data yet
                  </p>
                )}
              </CardContent>
            </Card>
            {/* Interiors Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Top Selling Interiors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[...interiors]
                        .filter((i) => (i.sold || 0) > 0)
                        .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                        .slice(0, 5)
                        .map((i, idx) => ({
                          name: i.name,
                          value: i.sold || 0,
                          color:
                            i.hex ||
                            [
                              "#0088FE",
                              "#00C49F",
                              "#FFBB28",
                              "#FF8042",
                              "#8884d8",
                            ][idx],
                        }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#000"
                      strokeWidth={1}
                    >
                      {[...interiors]
                        .filter((i) => (i.sold || 0) > 0)
                        .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                        .slice(0, 5)
                        .map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.hex ||
                              [
                                "#0088FE",
                                "#00C49F",
                                "#FFBB28",
                                "#FF8042",
                                "#8884d8",
                              ][index]
                            }
                          />
                        ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {interiors.filter((i) => (i.sold || 0) > 0).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    No sales data yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Inventory Levels Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory Levels</CardTitle>
              <CardDescription>Stock levels for all items</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    ...paintColors.map((c) => ({
                      name: c.name,
                      stock: c.inventory,
                      type: "Color",
                    })),
                    ...wheels.map((w) => ({
                      name: w.name,
                      stock: w.inventory,
                      type: "Wheel",
                    })),
                    ...interiors.map((i) => ({
                      name: i.name,
                      stock: i.inventory,
                      type: "Interior",
                    })),
                  ]
                    .sort((a, b) => a.stock - b.stock)
                    .slice(0, 15)}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    interval={0}
                    tick={({ x, y, payload }) => (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={0}
                          dy={16}
                          textAnchor="end"
                          fill="#666"
                          transform="rotate(-45)"
                          style={{
                            fontSize: "12px",
                            backgroundColor: "white",
                            padding: "2px",
                          }}
                        >
                          {payload.value}
                        </text>
                      </g>
                    )}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="stock" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Low Inventory Alerts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Low Inventory Alerts</h3>
              <span className="text-sm text-muted-foreground">
                Threshold: 50 units
              </span>
            </div>
            <Tabs defaultValue="colors">
              <TabsList>
                <TabsTrigger value="colors">
                  Paint Colors (
                  {paintColors.filter((c) => c.inventory < 50).length})
                </TabsTrigger>
                <TabsTrigger value="wheels">
                  Wheels ({wheels.filter((w) => w.inventory < 50).length})
                </TabsTrigger>
                <TabsTrigger value="interiors">
                  Interiors ({interiors.filter((i) => i.inventory < 50).length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="colors">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paintColors
                    .filter((c) => c.inventory < 50)
                    .map((color) => (
                      <Card key={color.id} className="border-red-200">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">
                                {color.name}
                              </CardTitle>
                              <CardDescription>
                                {getCarModelName(color.carModelId)}
                              </CardDescription>
                            </div>
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: color.hex }}
                            />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Stock:
                              </span>
                              <span className="font-bold text-red-600">
                                {color.inventory}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Sold:
                              </span>
                              <span>{color.sold || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Price:
                              </span>
                              <span>₱{color.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            size="sm"
                            className="w-full"
                            variant="outline"
                          >
                            <Link href={"/a/inventory"}>View in Inventory</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  {paintColors.filter((c) => c.inventory < 50).length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-8">
                      All paint colors are well-stocked ✓
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="wheels">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wheels
                    .filter((w) => w.inventory < 50)
                    .map((wheel) => (
                      <Card key={wheel.id} className="border-red-200">
                        <CardHeader>
                          <CardTitle className="text-base">
                            {wheel.name}
                          </CardTitle>
                          <CardDescription>
                            {getCarModelName(wheel.carModelId)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Stock:
                              </span>
                              <span className="font-bold text-red-600">
                                {wheel.inventory}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Sold:
                              </span>
                              <span>{wheel.sold || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Price:
                              </span>
                              <span>₱{wheel.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            size="sm"
                            className="w-full"
                            variant="outline"
                          >
                            <Link href={"/a/inventory"}>View in Inventory</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  {wheels.filter((w) => w.inventory < 50).length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-8">
                      All wheels are well-stocked ✓
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="interiors">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {interiors
                    .filter((i) => i.inventory < 50)
                    .map((interior) => (
                      <Card key={interior.id} className="border-red-200">
                        <CardHeader>
                          <CardTitle className="text-base">
                            {interior.name}
                          </CardTitle>
                          <CardDescription>
                            {getCarModelName(interior.carModelId)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Stock:
                              </span>
                              <span className="font-bold text-red-600">
                                {interior.inventory}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Sold:
                              </span>
                              <span>{interior.sold || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Price:
                              </span>
                              <span>₱{interior.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            size="sm"
                            className="w-full"
                            variant="outline"
                          >
                            <Link href={"/a/inventory"}>View in Inventory</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  {interiors.filter((i) => i.inventory < 50).length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-8">
                      All interiors are well-stocked ✓
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
