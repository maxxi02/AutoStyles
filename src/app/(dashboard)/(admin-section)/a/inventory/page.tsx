"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Sketch } from "@uiw/react-color";
import colorNameToHex from "@uiw/react-color-name";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // Adjust the import path to your config file
import { Loader2 } from "lucide-react"; // Assuming lucide-react is available for spinner
import { toast } from "sonner";
import Image from "next/image";

interface CarModel {
  id: string;
  name: string;
  type: "Sedan" | "SUV" | "Pickup" | "Hatchback";
  imageUrl?: string;
}

type CarModelData = Omit<CarModel, "id">;

interface PaintColor {
  id: string;
  carModelId: string;
  name: string;
  hex: string;
  finish: "Matte" | "Glossy" | "Metallic";
  description: string;
  price: number;
  inventory: number;
  imageUrl?: string;
}

type PaintColorData = Omit<PaintColor, "id">;

interface PricingRule {
  id: string;
  description: string;
  multiplier: number;
}

type PricingRuleData = Omit<PricingRule, "id">;

const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("car-models");
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);

  // State for modals
  const [isCarModelDialogOpen, setIsCarModelDialogOpen] = useState(false);
  const [isPaintColorDialogOpen, setIsPaintColorDialogOpen] = useState(false);
  const [isPricingRuleDialogOpen, setIsPricingRuleDialogOpen] = useState(false);

  const [editingCarModel, setEditingCarModel] = useState<CarModel | null>(null);
  const [editingPaintColor, setEditingPaintColor] = useState<PaintColor | null>(
    null
  );
  const [editingPricingRule, setEditingPricingRule] =
    useState<PricingRule | null>(null);

  // Loading states for operations
  const [carModelPending, setCarModelPending] = useState(false);
  const [paintColorPending, setPaintColorPending] = useState(false);
  const [pricingRulePending, setPricingRulePending] = useState(false);

  // Form states
  const [newCarModel, setNewCarModel] = useState<Partial<CarModelData>>({});
  const [newPaintColor, setNewPaintColor] = useState<Partial<PaintColorData>>(
    {}
  );
  const [newPricingRule, setNewPricingRule] = useState<
    Partial<PricingRuleData>
  >({});

  // Search state for colors
  const [searchTerm, setSearchTerm] = useState("");

  // Initial data loading state
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [snapshotCount, setSnapshotCount] = useState(0);

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
          if (next === 3) {
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
          if (next === 3) {
            setIsDataLoading(false);
          }
          return next;
        });
      }
    );

    const unsubscribePricingRules = onSnapshot(
      collection(db, "pricingRules"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as PricingRule
        );
        setPricingRules(data);
        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === 3) {
            setIsDataLoading(false);
          }
          return next;
        });
      }
    );

    return () => {
      unsubscribeCarModels();
      unsubscribePaintColors();
      unsubscribePricingRules();
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCarModel({ ...newCarModel, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaintImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPaintColor({
          ...newPaintColor,
          imageUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setNewPaintColor((prev) => ({
      ...prev,
      name,
    }));

    // Auto-set hex if name matches a predefined color
    const lowerName = name.toLowerCase().trim();
    const hex = colorNameToHex(lowerName as keyof typeof colorNameToHex);
    if (hex) {
      setNewPaintColor((prev) => ({
        ...prev,
        hex,
      }));
    }
  };

  const handleAddOrUpdateCarModel = async () => {
    setCarModelPending(true);
    try {
      const carModelData: CarModelData = {
        name: newCarModel.name || "",
        type: newCarModel.type || "Sedan",
        ...(newCarModel.imageUrl && { imageUrl: newCarModel.imageUrl }),
      };
      if (editingCarModel) {
        const carModelRef = doc(db, "carModels", editingCarModel.id);
        await updateDoc(carModelRef, carModelData);
        toast.success("Car model updated successfully");
      } else {
        await addDoc(collection(db, "carModels"), carModelData);
        toast.success("Car model added successfully");
      }
      setIsCarModelDialogOpen(false);
      setNewCarModel({});
      setEditingCarModel(null);
    } catch (error) {
      console.error("Error adding/updating car model:", error);
      toast.error("Failed to add/update car model");
    } finally {
      setCarModelPending(false);
    }
  };

  const handleAddOrUpdatePaintColor = async () => {
    setPaintColorPending(true);
    try {
      const paintColorData: PaintColorData = {
        carModelId: newPaintColor.carModelId || "",
        name: newPaintColor.name || "",
        hex: newPaintColor.hex || "#000000",
        finish: newPaintColor.finish || "Matte",
        description: newPaintColor.description || "",
        price: newPaintColor.price ?? 0,
        inventory: newPaintColor.inventory ?? 0,
        ...(newPaintColor.imageUrl && { imageUrl: newPaintColor.imageUrl }),
      };
      if (editingPaintColor) {
        const paintColorRef = doc(db, "paintColors", editingPaintColor.id);
        await updateDoc(paintColorRef, paintColorData);
        toast.success("Paint color updated successfully");
      } else {
        await addDoc(collection(db, "paintColors"), paintColorData);
        toast.success("Paint color added successfully");
      }
      setIsPaintColorDialogOpen(false);
      setNewPaintColor({});
      setEditingPaintColor(null);
    } catch (error) {
      console.error("Error adding/updating paint color:", error);
      toast.error("Failed to add/update paint color");
    } finally {
      setPaintColorPending(false);
    }
  };

  const handleAddOrUpdatePricingRule = async () => {
    setPricingRulePending(true);
    try {
      const pricingRuleData: PricingRuleData = {
        description: newPricingRule.description || "",
        multiplier: newPricingRule.multiplier ?? 1,
      };
      if (editingPricingRule) {
        const pricingRuleRef = doc(db, "pricingRules", editingPricingRule.id);
        await updateDoc(pricingRuleRef, pricingRuleData);
        toast.success("Pricing rule updated successfully");
      } else {
        await addDoc(collection(db, "pricingRules"), pricingRuleData);
        toast.success("Pricing rule added successfully");
      }
      setIsPricingRuleDialogOpen(false);
      setNewPricingRule({});
      setEditingPricingRule(null);
    } catch (error) {
      console.error("Error adding/updating pricing rule:", error);
      toast.error("Failed to add/update pricing rule");
    } finally {
      setPricingRulePending(false);
    }
  };

  const handleDeleteCarModel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this car model?")) return;
    try {
      await deleteDoc(doc(db, "carModels", id));
      toast.success("Car model deleted successfully");
    } catch (error) {
      console.error("Error deleting car model:", error);
      toast.error("Failed to delete car model");
    }
  };

  const handleDeletePaintColor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this paint color?")) return;
    try {
      await deleteDoc(doc(db, "paintColors", id));
      toast.success("Paint color deleted successfully");
    } catch (error) {
      console.error("Error deleting paint color:", error);
      toast.error("Failed to delete paint color");
    }
  };

  const handleDeletePricingRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pricing rule?")) return;
    try {
      await deleteDoc(doc(db, "pricingRules", id));
      toast.success("Pricing rule deleted successfully");
    } catch (error) {
      console.error("Error deleting pricing rule:", error);
      toast.error("Failed to delete pricing rule");
    }
  };

  const openCarModelEdit = (model: CarModel) => {
    setEditingCarModel(model);
    setNewCarModel({
      name: model.name,
      type: model.type,
      ...(model.imageUrl && { imageUrl: model.imageUrl }),
    });
    setIsCarModelDialogOpen(true);
  };

  const openPaintColorEdit = (color: PaintColor) => {
    setEditingPaintColor(color);
    setNewPaintColor({
      carModelId: color.carModelId,
      name: color.name,
      hex: color.hex,
      finish: color.finish,
      description: color.description,
      price: color.price,
      inventory: color.inventory,
      ...(color.imageUrl && { imageUrl: color.imageUrl }),
    });
    setIsPaintColorDialogOpen(true);
  };

  const openPricingRuleEdit = (rule: PricingRule) => {
    setEditingPricingRule(rule);
    setNewPricingRule({
      description: rule.description,
      multiplier: rule.multiplier,
    });
    setIsPricingRuleDialogOpen(true);
  };

  const lowInventoryColors = paintColors.filter(
    (color) => color.inventory < 50
  );

  const getCarModelName = (carModelId: string) => {
    return (
      carModels.find((model) => model.id === carModelId)?.name || "Unknown"
    );
  };

  const isEditingPaintColor = !!editingPaintColor;

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

  const filteredPaintColors = paintColors.filter((color) =>
    color.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="car-models">Car Models</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="pricing-rules">Pricing Rules</TabsTrigger>
          <TabsTrigger value="inventory-monitor">Inventory Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="car-models">
          <Card>
            <CardHeader>
              <CardTitle>Car Models</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog
                open={isCarModelDialogOpen}
                onOpenChange={setIsCarModelDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingCarModel(null);
                      setNewCarModel({});
                    }}
                    disabled={isDataLoading}
                  >
                    Add Car Model
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCarModel ? "Edit Car Model" : "Add Car Model"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newCarModel.name ?? ""}
                      onChange={(e) =>
                        setNewCarModel({ ...newCarModel, name: e.target.value })
                      }
                      disabled={carModelPending}
                    />
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newCarModel.type}
                      onValueChange={(value) =>
                        setNewCarModel({
                          ...newCarModel,
                          type: value as CarModel["type"],
                        })
                      }
                      disabled={carModelPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sedan">Sedan</SelectItem>
                        <SelectItem value="SUV">SUV</SelectItem>
                        <SelectItem value="Pickup">Pickup</SelectItem>
                        <SelectItem value="Hatchback">Hatchback</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label htmlFor="image">Default Car Image</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={carModelPending}
                    />
                    {newCarModel.imageUrl && (
                      <Image
                        src={newCarModel.imageUrl}
                        alt="Preview"
                        className="w-32 h-auto mt-2"
                        width={500}
                        height={500}
                      />
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleAddOrUpdateCarModel}
                      disabled={carModelPending || !newCarModel.name}
                    >
                      {carModelPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {carModels.map((model) => {
                  const modelColors = paintColors.filter(
                    (color) => color.carModelId === model.id
                  );
                  return (
                    <Card key={model.id}>
                      <CardHeader>
                        <CardTitle>{model.name}</CardTitle>
                        <CardDescription>{model.type}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 md:w-1/2">
                          <p className="font-medium mb-2">Available Colors:</p>
                          {modelColors.length > 0 ? (
                            <ul className="space-y-1">
                              {modelColors.map((color) => (
                                <li
                                  key={color.id}
                                  className="flex items-center space-x-2"
                                >
                                  {color.imageUrl ? (
                                    <Image
                                      src={color.imageUrl}
                                      alt={color.name}
                                      className="w-8 h-8 rounded object-cover"
                                      width={500}
                                      height={500}
                                    />
                                  ) : (
                                    <div
                                      className="w-8 h-8 rounded"
                                      style={{ backgroundColor: color.hex }}
                                    ></div>
                                  )}
                                  <span className="text-sm">
                                    {color.name} ({color.finish})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No colors assigned.
                            </p>
                          )}
                          <Button
                            variant="link"
                            onClick={() => setActiveTab("colors")}
                            className="p-0 h-auto text-blue-600 hover:text-blue-800 mt-2 text-sm"
                            disabled={isDataLoading}
                          >
                            Add colors in Colors tab
                          </Button>
                        </div>
                        <div className="flex-1 md:w-1/2 flex flex-col items-center">
                          {model.imageUrl ? (
                            <Image
                              src={model.imageUrl}
                              alt={model.name}
                              className="w-full h-auto max-w-sm rounded"
                              width={500}
                              height={500}
                            />
                          ) : (
                            <p className="text-muted-foreground">No image</p>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => openCarModelEdit(model)}
                          disabled={isDataLoading}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteCarModel(model.id)}
                          disabled={isDataLoading}
                        >
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog
                open={isPaintColorDialogOpen}
                onOpenChange={setIsPaintColorDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingPaintColor(null);
                      setNewPaintColor({});
                    }}
                    disabled={isDataLoading}
                  >
                    Add Paint Color
                  </Button>
                </DialogTrigger>
                <DialogContent className="flex flex-col max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPaintColor
                        ? "Edit Paint Color"
                        : "Add Paint Color"}
                    </DialogTitle>
                  </DialogHeader>
                  <form className="grid grid-cols-2 gap-4 flex-1">
                    <div className="grid gap-2">
                      <Label htmlFor="carModel">Car Model</Label>
                      {isEditingPaintColor ? (
                        <div className="p-2 bg-muted rounded-md">
                          {getCarModelName(newPaintColor.carModelId as string)}
                        </div>
                      ) : (
                        <Select
                          value={newPaintColor.carModelId}
                          onValueChange={(value) =>
                            setNewPaintColor({
                              ...newPaintColor,
                              carModelId: value,
                            })
                          }
                          disabled={paintColorPending}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select car model" />
                          </SelectTrigger>
                          <SelectContent>
                            {carModels.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newPaintColor.name ?? ""}
                        onChange={handleNameChange}
                        disabled={paintColorPending}
                      />
                    </div>
                    <div className="grid gap-2 col-span-2">
                      <Label>Hex Code</Label>
                      <Sketch
                        color={newPaintColor.hex || "#000000"}
                        onChange={(color) =>
                          setNewPaintColor({
                            ...newPaintColor,
                            hex: color.hex,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="finish">Finish</Label>
                      <Select
                        value={newPaintColor.finish}
                        onValueChange={(value) =>
                          setNewPaintColor({
                            ...newPaintColor,
                            finish: value as PaintColor["finish"],
                          })
                        }
                        disabled={paintColorPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select finish" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Matte">Matte</SelectItem>
                          <SelectItem value="Glossy">Glossy</SelectItem>
                          <SelectItem value="Metallic">Metallic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newPaintColor.description ?? ""}
                        onChange={(e) =>
                          setNewPaintColor({
                            ...newPaintColor,
                            description: e.target.value,
                          })
                        }
                        disabled={paintColorPending}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newPaintColor.price ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewPaintColor({
                            ...newPaintColor,
                            price: val === "" ? undefined : parseFloat(val),
                          });
                        }}
                        disabled={paintColorPending}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="inventory">Stock</Label>
                      <Input
                        id="inventory"
                        type="number"
                        value={newPaintColor.inventory ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewPaintColor({
                            ...newPaintColor,
                            inventory:
                              val === "" ? undefined : parseInt(val, 10),
                          });
                        }}
                        disabled={paintColorPending}
                      />
                    </div>
                    <div className="grid gap-2 col-span-2">
                      <Label htmlFor="image">Color Image</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handlePaintImageUpload}
                        disabled={paintColorPending}
                      />
                      {newPaintColor.imageUrl && (
                        <Image
                          src={newPaintColor.imageUrl}
                          alt="Preview"
                          className="w-32 h-auto mt-2"
                          width={500}
                          height={500}
                        />
                      )}
                    </div>
                  </form>
                  <DialogFooter>
                    <Button
                      onClick={handleAddOrUpdatePaintColor}
                      disabled={
                        paintColorPending ||
                        !newPaintColor.name ||
                        !newPaintColor.carModelId
                      }
                    >
                      {paintColorPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="my-4">
                <Input
                  placeholder="Search colors by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {filteredPaintColors.map((color) => (
                  <Card key={color.id}>
                    <CardHeader>
                      <CardTitle>{color.name}</CardTitle>
                      <CardDescription>
                        {getCarModelName(color.carModelId)} - {color.hex} -{" "}
                        {color.finish}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {color.imageUrl ? (
                        <Image
                          src={color.imageUrl}
                          alt={color.name}
                          className="w-full h-auto object-cover rounded mb-2"
                          width={500}
                          height={500}
                        />
                      ) : (
                        <div
                          className="w-16 h-16 border border-gray-300 mb-2"
                          style={{ backgroundColor: color.hex }}
                        ></div>
                      )}
                      <p className="mb-1">{color.description}</p>
                      <p>Price: ₱{color.price}</p>
                      <p>Stock: {color.inventory}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => openPaintColorEdit(color)}
                        disabled={isDataLoading}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeletePaintColor(color.id)}
                        disabled={isDataLoading}
                      >
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing-rules">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog
                open={isPricingRuleDialogOpen}
                onOpenChange={setIsPricingRuleDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingPricingRule(null);
                      setNewPricingRule({});
                    }}
                    disabled={isDataLoading}
                  >
                    Add Pricing Rule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPricingRule
                        ? "Edit Pricing Rule"
                        : "Add Pricing Rule"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newPricingRule.description ?? ""}
                      onChange={(e) =>
                        setNewPricingRule({
                          ...newPricingRule,
                          description: e.target.value,
                        })
                      }
                      disabled={pricingRulePending}
                    />
                    <Label htmlFor="multiplier">Multiplier</Label>
                    <Input
                      id="multiplier"
                      type="number"
                      step="0.1"
                      value={newPricingRule.multiplier ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewPricingRule({
                          ...newPricingRule,
                          multiplier: val === "" ? undefined : parseFloat(val),
                        });
                      }}
                      disabled={pricingRulePending}
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleAddOrUpdatePricingRule}
                      disabled={
                        pricingRulePending || !newPricingRule.description
                      }
                    >
                      {pricingRulePending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {pricingRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardHeader>
                      <CardTitle>{rule.description}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Multiplier: {rule.multiplier}x</p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => openPricingRuleEdit(rule)}
                        disabled={isDataLoading}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeletePricingRule(rule.id)}
                        disabled={isDataLoading}
                      >
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory-monitor">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Monitor</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">
                Low Inventory Paint Colors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowInventoryColors.map((color) => (
                  <Card key={color.id}>
                    <CardHeader>
                      <CardTitle>{color.name}</CardTitle>
                      <CardDescription>
                        {getCarModelName(color.carModelId)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {color.imageUrl ? (
                        <Image
                          src={color.imageUrl}
                          alt={color.name}
                          className="w-full h-32 object-cover rounded mb-2"
                          width={500}
                          height={500}
                        />
                      ) : (
                        <div
                          className="w-16 h-16 border border-gray-300 mb-2 mx-auto"
                          style={{ backgroundColor: color.hex }}
                        ></div>
                      )}
                      <p>Stock: {color.inventory} (Low)</p>
                    </CardContent>
                  </Card>
                ))}
                {lowInventoryColors.length === 0 && (
                  <p>No low inventory items.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryPage;
