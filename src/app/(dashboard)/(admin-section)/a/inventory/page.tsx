"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CarModel {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  status: string;
}

interface PaintColor {
  id: string;
  name: string;
  hex: string;
  availableFor: string[];
}

interface PricingRule {
  id: string;
  rule: string;
  discount: number;
  appliesTo: string;
}

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
}

const getHexFromName = (name: string): string => {
  const elem = document.createElement("div");
  elem.style.color = name.toLowerCase();
  document.body.appendChild(elem);
  const computed = window.getComputedStyle(elem).color;
  document.body.removeChild(elem);
  const match = computed.match(/\d+/g);
  if (match && computed !== "rgb(0, 0, 0)") {
    // Avoid default black for invalid
    const [r, g, b] = match.map(Number);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
  }
  return "";
};

const AdminInventory = () => {
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);

  // For models dialog
  const [modelsOpen, setModelsOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<CarModel | null>(null);
  const [modelName, setModelName] = useState("");
  const [modelType, setModelType] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [modelStatus, setModelStatus] = useState("Active");

  // For colors dialog
  const [colorsOpen, setColorsOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState<PaintColor | null>(null);
  const [colorName, setColorName] = useState("");
  const [hex, setHex] = useState("");
  const [availableFor, setAvailableFor] = useState<string[]>([]);

  // For pricing dialog
  const [pricingOpen, setPricingOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<PricingRule | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [discount, setDiscount] = useState("");
  const [appliesTo, setAppliesTo] = useState("");

  useEffect(() => {
    const modelsCollection = collection(db, "carModels");
    const unsubscribeModels = onSnapshot(modelsCollection, (snapshot) => {
      setCarModels(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CarModel[]
      );
    });

    const colorsCollection = collection(db, "paintColors");
    const unsubscribeColors = onSnapshot(colorsCollection, (snapshot) => {
      setPaintColors(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PaintColor[]
      );
    });

    const pricingCollection = collection(db, "pricingRules");
    const unsubscribePricing = onSnapshot(pricingCollection, (snapshot) => {
      setPricingRules(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PricingRule[]
      );
    });

    const inventoryCollection = collection(db, "inventory");
    const unsubscribeInventory = onSnapshot(inventoryCollection, (snapshot) => {
      setInventoryData(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as InventoryItem[]
      );
    });

    return () => {
      unsubscribeModels();
      unsubscribeColors();
      unsubscribePricing();
      unsubscribeInventory();
    };
  }, []);

  // Reset model form
  useEffect(() => {
    if (currentModel) {
      setModelName(currentModel.name);
      setModelType(currentModel.type);
      setBasePrice(currentModel.basePrice.toString());
      setModelStatus(currentModel.status);
    } else {
      setModelName("");
      setModelType("");
      setBasePrice("");
      setModelStatus("Active");
    }
  }, [currentModel]);

  // Reset color form
  useEffect(() => {
    if (currentColor) {
      setColorName(currentColor.name);
      setHex(currentColor.hex);
      setAvailableFor(currentColor.availableFor);
    } else {
      setColorName("");
      setHex("");
      setAvailableFor([]);
    }
  }, [currentColor]);

  // Reset pricing form
  useEffect(() => {
    if (currentRule) {
      setRuleName(currentRule.rule);
      setDiscount(currentRule.discount.toString());
      setAppliesTo(currentRule.appliesTo);
    } else {
      setRuleName("");
      setDiscount("");
      setAppliesTo("");
    }
  }, [currentRule]);

  const handleModelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModelName(e.target.value);
  };

  const handleModelSubmit = async () => {
    const modelsCollection = collection(db, "carModels");
    const priceNum = parseFloat(basePrice);
    if (currentModel) {
      await updateDoc(doc(db, "carModels", currentModel.id), {
        name: modelName,
        type: modelType,
        basePrice: priceNum,
        status: modelStatus,
      });
    } else {
      await addDoc(modelsCollection, {
        name: modelName,
        type: modelType,
        basePrice: priceNum,
        status: modelStatus,
      });
    }
    setModelsOpen(false);
    setCurrentModel(null);
  };

  const handleModelDelete = async (id: string) => {
    await deleteDoc(doc(db, "carModels", id));
  };

  const handleColorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setColorName(newName);
    if (!hex) {
      const newHex = getHexFromName(newName);
      if (newHex) setHex(newHex);
    }
  };

  const handleColorSubmit = async () => {
    const colorsCollection = collection(db, "paintColors");
    if (currentColor) {
      await updateDoc(doc(db, "paintColors", currentColor.id), {
        name: colorName,
        hex,
        availableFor,
      });
    } else {
      await addDoc(colorsCollection, { name: colorName, hex, availableFor });
    }
    setColorsOpen(false);
    setCurrentColor(null);
  };

  const handleColorDelete = async (id: string) => {
    await deleteDoc(doc(db, "paintColors", id));
  };

  const toggleAvailableFor = (modelName: string) => {
    setAvailableFor((prev) =>
      prev.includes(modelName)
        ? prev.filter((m) => m !== modelName)
        : [...prev, modelName]
    );
  };

  const handlePricingSubmit = async () => {
    const pricingCollection = collection(db, "pricingRules");
    const discountNum = parseFloat(discount);
    if (currentRule) {
      await updateDoc(doc(db, "pricingRules", currentRule.id), {
        rule: ruleName,
        discount: discountNum,
        appliesTo,
      });
    } else {
      await addDoc(pricingCollection, {
        rule: ruleName,
        discount: discountNum,
        appliesTo,
      });
    }
    setPricingOpen(false);
    setCurrentRule(null);
  };

  const handlePricingDelete = async (id: string) => {
    await deleteDoc(doc(db, "pricingRules", id));
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Admin Inventory Management</h1>
      <p className="text-muted-foreground">
        Manage car models, paint colors, pricing rules, and monitor inventory
        levels.
      </p>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">Car Models</TabsTrigger>
          <TabsTrigger value="colors">Paint Colors</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Rules</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Levels</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Car Models</CardTitle>
              <CardDescription>
                Update and manage Volvo car models.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>{model.name}</TableCell>
                      <TableCell>{model.type}</TableCell>
                      <TableCell>${model.basePrice.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            model.status === "Active"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {model.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCurrentModel(model);
                            setModelsOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleModelDelete(model.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Dialog open={modelsOpen} onOpenChange={setModelsOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setCurrentModel(null);
                    }}
                  >
                    Add New Model
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {currentModel ? "Edit Model" : "Add New Model"}
                    </DialogTitle>
                    <DialogDescription>
                      Enter the details for the car model.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="modelName" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="modelName"
                        value={modelName}
                        onChange={handleModelNameChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="modelType" className="text-right">
                        Type
                      </Label>
                      <Input
                        id="modelType"
                        value={modelType}
                        onChange={(e) => setModelType(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="basePrice" className="text-right">
                        Base Price
                      </Label>
                      <Input
                        id="basePrice"
                        type="number"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="modelStatus" className="text-right">
                        Status
                      </Label>
                      <Select
                        value={modelStatus}
                        onValueChange={setModelStatus}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleModelSubmit}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paint Colors</CardTitle>
              <CardDescription>
                Manage available paint colors for models.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Hex Code</TableHead>
                    <TableHead>Available For</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paintColors.map((color) => (
                    <TableRow key={color.id}>
                      <TableCell>{color.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 mr-2 rounded-full"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.hex}
                        </div>
                      </TableCell>
                      <TableCell>{color.availableFor.join(", ")}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCurrentColor(color);
                            setColorsOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleColorDelete(color.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Dialog open={colorsOpen} onOpenChange={setColorsOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setCurrentColor(null);
                    }}
                  >
                    Add New Color
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {currentColor ? "Edit Color" : "Add New Color"}
                    </DialogTitle>
                    <DialogDescription>
                      Enter the details for the paint color.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="colorName" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="colorName"
                        value={colorName}
                        onChange={handleColorNameChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="hex" className="text-right">
                        Hex Code
                      </Label>
                      <Input
                        id="hex"
                        value={hex}
                        onChange={(e) => setHex(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">Available For</Label>
                      <div className="col-span-3 space-y-2">
                        {carModels.map((model) => (
                          <div
                            key={model.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={model.name}
                              checked={availableFor.includes(model.name)}
                              onCheckedChange={() =>
                                toggleAvailableFor(model.name)
                              }
                            />
                            <label
                              htmlFor={model.name}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {model.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleColorSubmit}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Rules</CardTitle>
              <CardDescription>
                Set and update pricing rules and discounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Discount Amount</TableHead>
                    <TableHead>Applies To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>{rule.rule}</TableCell>
                      <TableCell>${rule.discount.toLocaleString()}</TableCell>
                      <TableCell>{rule.appliesTo}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCurrentRule(rule);
                            setPricingOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePricingDelete(rule.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setCurrentRule(null);
                    }}
                  >
                    Add New Rule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {currentRule ? "Edit Rule" : "Add New Rule"}
                    </DialogTitle>
                    <DialogDescription>
                      Enter the details for the pricing rule.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="ruleName" className="text-right">
                        Rule Name
                      </Label>
                      <Input
                        id="ruleName"
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="discount" className="text-right">
                        Discount Amount
                      </Label>
                      <Input
                        id="discount"
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="appliesTo" className="text-right">
                        Applies To
                      </Label>
                      <Input
                        id="appliesTo"
                        value={appliesTo}
                        onChange={(e) => setAppliesTo(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handlePricingSubmit}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Levels</CardTitle>
              <CardDescription>
                Monitor paint, parts, and car inventory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="stock"
                    fill="hsl(var(--primary))"
                    name="Current Stock"
                  />
                  <Bar
                    dataKey="threshold"
                    fill="hsl(var(--secondary))"
                    name="Threshold"
                  />
                </BarChart>
              </ResponsiveContainer>
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.stock}</TableCell>
                      <TableCell>{item.threshold}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.stock > item.threshold
                              ? "default"
                              : "destructive"
                          }
                        >
                          {item.stock > item.threshold ? "Healthy" : "Low"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminInventory;