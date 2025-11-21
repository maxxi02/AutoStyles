"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

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
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [revenuePeriod, setRevenuePeriod] = useState<
    "weekly" | "monthly" | "yearly"
  >("monthly");

  // Create dynamic chart configs after data is loaded
  const paintColorsChartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "Sold",
      },
    };
    paintColors
      .filter((c) => (c.sold || 0) > 0)
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 5)
      .forEach((color) => {
        config[color.name] = {
          label: color.name,
          color: color.hex,
        };
      });
    return config;
  }, [paintColors]) satisfies ChartConfig;

  const wheelsChartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "Sold",
      },
    };
    const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];
    wheels
      .filter((w) => (w.sold || 0) > 0)
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 5)
      .forEach((wheel, i) => {
        config[wheel.name] = {
          label: wheel.name,
          color: colors[i],
        };
      });
    return config;
  }, [wheels]) satisfies ChartConfig;

  const interiorsChartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "Sold",
      },
    };
    const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];
    interiors
      .filter((i) => (i.sold || 0) > 0)
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 5)
      .forEach((interior, idx) => {
        config[interior.name] = {
          label: interior.name,
          color: interior.hex || colors[idx],
        };
      });
    return config;
  }, [interiors]) satisfies ChartConfig;

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
          if (next === 5) {
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
          if (next === 5) {
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
          if (next === 5) {
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
          if (next === 5) {
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

  // Precompute sales counts for efficiency
  const colorSales = React.useMemo(() => {
    const salesMap = new Map<string, number>();
    filteredTransactions.forEach((t) => {
      if (t.colorId) {
        salesMap.set(t.colorId, (salesMap.get(t.colorId) || 0) + 1);
      }
    });
    return salesMap;
  }, [filteredTransactions]);

  const wheelSales = React.useMemo(() => {
    const salesMap = new Map<string, number>();
    filteredTransactions.forEach((t) => {
      if (t.wheelId) {
        salesMap.set(t.wheelId, (salesMap.get(t.wheelId) || 0) + 1);
      }
    });
    return salesMap;
  }, [filteredTransactions]);

  const interiorSales = React.useMemo(() => {
    const salesMap = new Map<string, number>();
    filteredTransactions.forEach((t) => {
      if (t.interiorId) {
        salesMap.set(t.interiorId, (salesMap.get(t.interiorId) || 0) + 1);
      }
    });
    return salesMap;
  }, [filteredTransactions]);

  const totalRevenue =
    paintColors.reduce((sum, c) => {
      const sold = colorSales.get(c.id) || 0;
      return sum + sold * c.price;
    }, 0) +
    wheels.reduce((sum, w) => {
      const sold = wheelSales.get(w.id) || 0;
      return sum + sold * w.price;
    }, 0) +
    interiors.reduce((sum, i) => {
      const sold = interiorSales.get(i.id) || 0;
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
                      (sum, c) => sum + c.price * Number(c.inventory || 0),
                      0
                    ) +
                    wheels.reduce(
                      (sum, w) => sum + w.price * Number(w.inventory || 0),
                      0
                    ) +
                    interiors.reduce(
                      (sum, i) => sum + i.price * Number(i.inventory || 0),
                      0
                    )
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
                  {paintColors.filter((c) => Number(c.inventory || 0) < 50)
                    .length +
                    wheels.filter((w) => Number(w.inventory || 0) < 50).length +
                    interiors.filter((i) => Number(i.inventory || 0) < 50).length}
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
              <CardContent className="flex flex-col items-center">
                <ChartContainer
                  config={paintColorsChartConfig}
                  className="mx-auto aspect-square max-h-[320px] w-full"
                >
                  <PieChart margin={{ bottom: 60 }}>
                    <Pie
                      data={[...paintColors]
                        .filter((c) => (c.sold || 0) > 0)
                        .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                        .slice(0, 5)
                        .map((c) => ({
                          name: c.name,
                          value: c.sold || 0,
                          fill: c.hex,
                        }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      radius={90}
                    />
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" />}
                      className="flex-wrap gap-2 justify-center text-xs mt-4"
                      verticalAlign="bottom"
                      height={40}
                    />
                  </PieChart>
                </ChartContainer>
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
              <CardContent className="flex flex-col items-center">
                <ChartContainer
                  config={wheelsChartConfig}
                  className="mx-auto aspect-square max-h-[320px] w-full"
                >
                  <PieChart margin={{ bottom: 60 }}>
                    <Pie
                      data={[...wheels]
                        .filter((w) => (w.sold || 0) > 0)
                        .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                        .slice(0, 5)
                        .map((w, i) => ({
                          name: w.name,
                          value: w.sold || 0,
                          fill: [
                            "#0088FE",
                            "#00C49F",
                            "#FFBB28",
                            "#FF8042",
                            "#8884d8",
                          ][i],
                        }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      radius={90}
                    />
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" />}
                      className="flex-wrap gap-2 justify-center text-xs mt-4"
                      verticalAlign="bottom"
                      height={40}
                    />
                  </PieChart>
                </ChartContainer>
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
              <CardContent className="flex flex-col items-center">
                <ChartContainer
                  config={interiorsChartConfig}
                  className="mx-auto aspect-square max-h-[320px] w-full"
                >
                  <PieChart margin={{ bottom: 60 }}>
                    <Pie
                      data={[...interiors]
                        .filter((i) => (i.sold || 0) > 0)
                        .sort((a, b) => (b.sold || 0) - (a.sold || 0))
                        .slice(0, 5)
                        .map((i, idx) => ({
                          name: i.name,
                          value: i.sold || 0,
                          fill:
                            i.hex ||
                            [
                              "#0088FE",
                              "#00C49F",
                              "#FFBB28",
                              "#FF8042",
                              "#8884d8",
                            ][idx],
                        }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      radius={90}
                    />
                    <ChartLegend
                      content={<ChartLegendContent nameKey="name" />}
                      className="flex-wrap gap-2 justify-center text-xs mt-4"
                      verticalAlign="bottom"
                      height={40}
                    />
                  </PieChart>
                </ChartContainer>
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
                      stock: Number(c.inventory || 0),
                      type: "Color",
                    })),
                    ...wheels.map((w) => ({
                      name: w.name,
                      stock: Number(w.inventory || 0),
                      type: "Wheel",
                    })),
                    ...interiors.map((i) => ({
                      name: i.name,
                      stock: Number(i.inventory || 0),
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
                  {paintColors.filter((c) => Number(c.inventory || 0) < 50).length}
                )
                </TabsTrigger>
                <TabsTrigger value="wheels">
                  Wheels ({wheels.filter((w) => Number(w.inventory || 0) < 50).length}
                )
                </TabsTrigger>
                <TabsTrigger value="interiors">
                  Interiors (
                  {interiors.filter((i) => Number(i.inventory || 0) < 50).length}
                )
                </TabsTrigger>
              </TabsList>
              <TabsContent value="colors">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paintColors
                    .filter((c) => Number(c.inventory || 0) < 50)
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
                              className="w-8 h-8 rounded border-2 border-black"
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
                                {Number(color.inventory || 0)}
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
                            asChild
                          >
                            <Link href={`/a/inventory?tab=customize&subTab=paint-colors&itemId=${color.id}`}>View in Inventory</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  {paintColors.filter((c) => Number(c.inventory || 0) < 50)
                    .length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-8">
                      All paint colors are well-stocked ✓
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="wheels">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wheels
                    .filter((w) => Number(w.inventory || 0) < 50)
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
                                {Number(wheel.inventory || 0)}
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
                            asChild
                          >
                            <Link href={`/a/inventory?tab=customize&subTab=wheels&itemId=${wheel.id}`}>View in Inventory</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  {wheels.filter((w) => Number(w.inventory || 0) < 50)
                    .length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-8">
                      All wheels are well-stocked ✓
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="interiors">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {interiors
                    .filter((i) => Number(i.inventory || 0) < 50)
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
                                {Number(interior.inventory || 0)}
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
                            asChild
                          >
                            <Link href={`/a/inventory?tab=customize&subTab=interiors&itemId=${interior.id}`}>View in Inventory</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  {interiors.filter((i) => Number(i.inventory || 0) < 50)
                    .length === 0 && (
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