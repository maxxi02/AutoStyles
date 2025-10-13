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

interface CarType {
  id: string;
  name: string;
}

type CarTypeData = Omit<CarType, "id">;

interface CarModel {
  id: string;
  name: string;
  carTypeId: string;
  imageUrl?: string;
  basePrice?: number;
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

interface Wheel {
  id: string;
  carModelId: string;
  name: string;
  description: string;
  price: number;
  inventory: number;
  imageUrl?: string;
}

type WheelData = Omit<Wheel, "id">;

interface Interior {
  id: string;
  carModelId: string;
  name: string;
  description: string;
  price: number;
  inventory: number;
  imageUrl?: string;
  hex?: string;
}

type InteriorData = Omit<Interior, "id">;

interface PricingRule {
  id: string;
  description: string;
  multiplier: number;
}

type PricingRuleData = Omit<PricingRule, "id">;

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET || "ml_default");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  const data = await response.json();
  return data.secure_url;
};

const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("car-models");
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [interiors, setInteriors] = useState<Interior[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);

  // State for modals
  const [isCarTypeDialogOpen, setIsCarTypeDialogOpen] = useState(false);
  const [isCarModelDialogOpen, setIsCarModelDialogOpen] = useState(false);
  const [isPaintColorDialogOpen, setIsPaintColorDialogOpen] = useState(false);
  const [isWheelDialogOpen, setIsWheelDialogOpen] = useState(false);
  const [isInteriorDialogOpen, setIsInteriorDialogOpen] = useState(false);
  const [isPricingRuleDialogOpen, setIsPricingRuleDialogOpen] = useState(false);

  const [editingCarType, setEditingCarType] = useState<CarType | null>(null);
  const [editingCarModel, setEditingCarModel] = useState<CarModel | null>(null);
  const [editingPaintColor, setEditingPaintColor] = useState<PaintColor | null>(
    null
  );
  const [editingWheel, setEditingWheel] = useState<Wheel | null>(null);
  const [editingInterior, setEditingInterior] = useState<Interior | null>(null);
  const [editingPricingRule, setEditingPricingRule] =
    useState<PricingRule | null>(null);

  // Loading states for operations
  const [carTypePending, setCarTypePending] = useState(false);
  const [carModelPending, setCarModelPending] = useState(false);
  const [paintColorPending, setPaintColorPending] = useState(false);
  const [wheelPending, setWheelPending] = useState(false);
  const [interiorPending, setInteriorPending] = useState(false);
  const [pricingRulePending, setPricingRulePending] = useState(false);

  // Form states
  const [newCarType, setNewCarType] = useState<Partial<CarTypeData>>({});
  const [newCarModel, setNewCarModel] = useState<Partial<CarModelData>>({});
  const [newPaintColor, setNewPaintColor] = useState<Partial<PaintColorData>>(
    {}
  );
  const [newWheel, setNewWheel] = useState<Partial<WheelData>>({});
  const [newInterior, setNewInterior] = useState<Partial<InteriorData>>({});
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
    const unsubscribeCarTypes = onSnapshot(
      collection(db, "carTypes"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as CarType
        );
        setCarTypes(data);
        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === 6) {
            setIsDataLoading(false);
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
          if (next === 6) {
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
          if (next === 6) {
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
          if (next === 6) {
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
          if (next === 6) {
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
          if (next === 6) {
            setIsDataLoading(false);
          }
          return next;
        });
      }
    );

    return () => {
      unsubscribeCarTypes();
      unsubscribeCarModels();
      unsubscribePaintColors();
      unsubscribeWheels();
      unsubscribeInteriors();
      unsubscribePricingRules();
    };
  }, []);

  const handleAddOrUpdateCarType = async () => {
    setCarTypePending(true);
    try {
      const carTypeData: CarTypeData = {
        name: newCarType.name || "",
      };
      if (editingCarType) {
        const carTypeRef = doc(db, "carTypes", editingCarType.id);
        await updateDoc(carTypeRef, carTypeData);
        toast.success("Car type updated successfully");
      } else {
        await addDoc(collection(db, "carTypes"), carTypeData);
        toast.success("Car type added successfully");
      }
      setIsCarTypeDialogOpen(false);
      setNewCarType({});
      setEditingCarType(null);
    } catch (error) {
      console.error("Error adding/updating car type:", error);
      toast.error("Failed to add/update car type");
    } finally {
      setCarTypePending(false);
    }
  };

  const openAddCarType = () => {
    setEditingCarType(null);
    setNewCarType({});
    setIsCarTypeDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
      try {
        const url = await uploadToCloudinary(file);
        setNewCarModel({ ...newCarModel, imageUrl: url });
        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image");
      }
    } else {
      toast.error("Cloudinary configuration missing");
    }
  };

  const handlePaintImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
      try {
        const url = await uploadToCloudinary(file);
        setNewPaintColor({
          ...newPaintColor,
          imageUrl: url,
        });
        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image");
      }
    } else {
      toast.error("Cloudinary configuration missing");
    }
  };

  const handleWheelImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
      try {
        const url = await uploadToCloudinary(file);
        setNewWheel({
          ...newWheel,
          imageUrl: url,
        });
        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image");
      }
    } else {
      toast.error("Cloudinary configuration missing");
    }
  };

  const handleInteriorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
      try {
        const url = await uploadToCloudinary(file);
        setNewInterior({
          ...newInterior,
          imageUrl: url,
        });
        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload image");
      }
    } else {
      toast.error("Cloudinary configuration missing");
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
        carTypeId: newCarModel.carTypeId || "",
        ...(newCarModel.imageUrl && { imageUrl: newCarModel.imageUrl }),
        ...(typeof newCarModel.basePrice === "number" && { basePrice: newCarModel.basePrice }),
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

  const handleAddOrUpdateWheel = async () => {
    setWheelPending(true);
    try {
      const wheelData: WheelData = {
        carModelId: newWheel.carModelId || "",
        name: newWheel.name || "",
        description: newWheel.description || "",
        price: newWheel.price ?? 0,
        inventory: newWheel.inventory ?? 0,
        ...(newWheel.imageUrl && { imageUrl: newWheel.imageUrl }),
      };
      if (editingWheel) {
        const wheelRef = doc(db, "wheels", editingWheel.id);
        await updateDoc(wheelRef, wheelData);
        toast.success("Wheel updated successfully");
      } else {
        await addDoc(collection(db, "wheels"), wheelData);
        toast.success("Wheel added successfully");
      }
      setIsWheelDialogOpen(false);
      setNewWheel({});
      setEditingWheel(null);
    } catch (error) {
      console.error("Error adding/updating wheel:", error);
      toast.error("Failed to add/update wheel");
    } finally {
      setWheelPending(false);
    }
  };

  const handleAddOrUpdateInterior = async () => {
    setInteriorPending(true);
    try {
      const interiorData: InteriorData = {
        carModelId: newInterior.carModelId || "",
        name: newInterior.name || "",
        description: newInterior.description || "",
        price: newInterior.price ?? 0,
        inventory: newInterior.inventory ?? 0,
        ...(newInterior.imageUrl && { imageUrl: newInterior.imageUrl }),
        ...(newInterior.hex && { hex: newInterior.hex }),
      };
      if (editingInterior) {
        const interiorRef = doc(db, "interiors", editingInterior.id);
        await updateDoc(interiorRef, interiorData);
        toast.success("Interior updated successfully");
      } else {
        await addDoc(collection(db, "interiors"), interiorData);
        toast.success("Interior added successfully");
      }
      setIsInteriorDialogOpen(false);
      setNewInterior({});
      setEditingInterior(null);
    } catch (error) {
      console.error("Error adding/updating interior:", error);
      toast.error("Failed to add/update interior");
    } finally {
      setInteriorPending(false);
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

  const handleDeleteWheel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wheel?")) return;
    try {
      await deleteDoc(doc(db, "wheels", id));
      toast.success("Wheel deleted successfully");
    } catch (error) {
      console.error("Error deleting wheel:", error);
      toast.error("Failed to delete wheel");
    }
  };

  const handleDeleteInterior = async (id: string) => {
    if (!confirm("Are you sure you want to delete this interior?")) return;
    try {
      await deleteDoc(doc(db, "interiors", id));
      toast.success("Interior deleted successfully");
    } catch (error) {
      console.error("Error deleting interior:", error);
      toast.error("Failed to delete interior");
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
      carTypeId: model.carTypeId,
      ...(model.imageUrl && { imageUrl: model.imageUrl }),
      ...(typeof model.basePrice === "number" && { basePrice: model.basePrice }),
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

  const openWheelEdit = (wheel: Wheel) => {
    setEditingWheel(wheel);
    setNewWheel({
      carModelId: wheel.carModelId,
      name: wheel.name,
      description: wheel.description,
      price: wheel.price,
      inventory: wheel.inventory,
      ...(wheel.imageUrl && { imageUrl: wheel.imageUrl }),
    });
    setIsWheelDialogOpen(true);
  };

  const openInteriorEdit = (interior: Interior) => {
    setEditingInterior(interior);
    setNewInterior({
      carModelId: interior.carModelId,
      name: interior.name,
      description: interior.description,
      price: interior.price,
      inventory: interior.inventory,
      ...(interior.imageUrl && { imageUrl: interior.imageUrl }),
      ...(interior.hex && { hex: interior.hex }),
    });
    setIsInteriorDialogOpen(true);
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

  const getCarTypeName = (carTypeId: string) => {
    return (
      carTypes.find((type) => type.id === carTypeId)?.name || "Unknown"
    );
  };

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

  // Analytics computations
  const totalColors = paintColors.length;
  const totalValue = paintColors.reduce(
    (sum, color) => sum + color.price * color.inventory,
    0
  );
  const totalSold = 0; // Assuming no sold data available; can be extended with a sold field
  const recentlyAdded = [...paintColors]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 5);
  const bestSellers = [...paintColors]
    .sort((a, b) => a.inventory - b.inventory)
    .slice(0, 5); // Lowest inventory as best sellers

  return (
    <div className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="car-models">Car Models</TabsTrigger>
          <TabsTrigger value="customize">Customize</TabsTrigger>
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
                    <div className="space-y-2">
                      <Label htmlFor="carTypeId">Car Type</Label>
                      <Select
                        value={newCarModel.carTypeId}
                        onValueChange={(value) =>
                          setNewCarModel({
                            ...newCarModel,
                            carTypeId: value,
                          })
                        }
                        disabled={carModelPending || carTypes.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select car type" />
                        </SelectTrigger>
                        <SelectContent>
                          {carTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {carTypes.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-1">No car types available.</p>
                      )}
                      <Dialog open={isCarTypeDialogOpen} onOpenChange={setIsCarTypeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="link" size="sm" onClick={openAddCarType}>
                            + Add New Type
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Car Type</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4">
                            <Label htmlFor="typeName">Name</Label>
                            <Input
                              id="typeName"
                              value={newCarType.name ?? ""}
                              onChange={(e) =>
                                setNewCarType({ ...newCarType, name: e.target.value })
                              }
                              disabled={carTypePending}
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleAddOrUpdateCarType}
                              disabled={carTypePending || !newCarType.name}
                            >
                              {carTypePending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Save
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Label htmlFor="basePrice">Base Price</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      value={newCarModel.basePrice ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewCarModel({
                          ...newCarModel,
                          basePrice: val === "" ? undefined : parseFloat(val),
                        });
                      }}
                      disabled={carModelPending}
                    />
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
                      disabled={carModelPending || !newCarModel.name || !newCarModel.carTypeId}
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
                        <CardDescription>{getCarTypeName(model.carTypeId)}</CardDescription>
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
                            onClick={() => setActiveTab("customize")}
                            className="p-0 h-auto text-blue-600 hover:text-blue-800 mt-2 text-sm"
                            disabled={isDataLoading}
                          >
                            Add customizations in Customize tab
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

        <TabsContent value="customize">
          <Tabs defaultValue="paint-colors">
            <TabsList>
              <TabsTrigger value="paint-colors">Paint Colors</TabsTrigger>
              <TabsTrigger value="wheels">Wheels</TabsTrigger>
              <TabsTrigger value="interiors">Interiors</TabsTrigger>
            </TabsList>
            <TabsContent value="paint-colors">
              <Card>
                <CardHeader>
                  <CardTitle>Paint Colors</CardTitle>
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
                      placeholder="Search paint colors by name..."
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
            <TabsContent value="wheels">
              <Card>
                <CardHeader>
                  <CardTitle>Wheels</CardTitle>
                </CardHeader>
                <CardContent>
                  <Dialog
                    open={isWheelDialogOpen}
                    onOpenChange={setIsWheelDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingWheel(null);
                          setNewWheel({});
                        }}
                        disabled={isDataLoading}
                      >
                        Add Wheel
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="flex flex-col max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingWheel ? "Edit Wheel" : "Add Wheel"}
                        </DialogTitle>
                      </DialogHeader>
                      <form className="grid grid-cols-2 gap-4 flex-1">
                        <div className="grid gap-2">
                          <Label htmlFor="carModel">Car Model</Label>
                          {editingWheel ? (
                            <div className="p-2 bg-muted rounded-md">
                              {getCarModelName(newWheel.carModelId as string)}
                            </div>
                          ) : (
                            <Select
                              value={newWheel.carModelId}
                              onValueChange={(value) =>
                                setNewWheel({
                                  ...newWheel,
                                  carModelId: value,
                                })
                              }
                              disabled={wheelPending}
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
                            value={newWheel.name ?? ""}
                            onChange={(e) =>
                              setNewWheel({ ...newWheel, name: e.target.value })
                            }
                            disabled={wheelPending}
                          />
                        </div>
                        <div className="grid gap-2 col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newWheel.description ?? ""}
                            onChange={(e) =>
                              setNewWheel({
                                ...newWheel,
                                description: e.target.value,
                              })
                            }
                            disabled={wheelPending}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="price">Price</Label>
                          <Input
                            id="price"
                            type="number"
                            value={newWheel.price ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewWheel({
                                ...newWheel,
                                price: val === "" ? undefined : parseFloat(val),
                              });
                            }}
                            disabled={wheelPending}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="inventory">Stock</Label>
                          <Input
                            id="inventory"
                            type="number"
                            value={newWheel.inventory ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewWheel({
                                ...newWheel,
                                inventory:
                                  val === "" ? undefined : parseInt(val, 10),
                              });
                            }}
                            disabled={wheelPending}
                          />
                        </div>
                        <div className="grid gap-2 col-span-2">
                          <Label htmlFor="image">Wheel Image</Label>
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleWheelImageUpload}
                            disabled={wheelPending}
                          />
                          {newWheel.imageUrl && (
                            <Image
                              src={newWheel.imageUrl}
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
                          onClick={handleAddOrUpdateWheel}
                          disabled={
                            wheelPending ||
                            !newWheel.name ||
                            !newWheel.carModelId
                          }
                        >
                          {wheelPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {wheels.map((wheel) => (
                      <Card key={wheel.id}>
                        <CardHeader>
                          <CardTitle>{wheel.name}</CardTitle>
                          <CardDescription>
                            {getCarModelName(wheel.carModelId)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {wheel.imageUrl ? (
                            <Image
                              src={wheel.imageUrl}
                              alt={wheel.name}
                              className="w-full h-auto object-cover rounded mb-2"
                              width={500}
                              height={500}
                            />
                          ) : (
                            <div
                              className="w-16 h-16 border border-gray-300 mb-2 mx-auto bg-muted"
                            ></div>
                          )}
                          <p className="mb-1">{wheel.description}</p>
                          <p>Price: ₱{wheel.price}</p>
                          <p>Stock: {wheel.inventory}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button
                            variant="outline"
                            onClick={() => openWheelEdit(wheel)}
                            disabled={isDataLoading}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteWheel(wheel.id)}
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
            <TabsContent value="interiors">
              <Card>
                <CardHeader>
                  <CardTitle>Interiors</CardTitle>
                </CardHeader>
                <CardContent>
                  <Dialog
                    open={isInteriorDialogOpen}
                    onOpenChange={setIsInteriorDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingInterior(null);
                          setNewInterior({});
                        }}
                        disabled={isDataLoading}
                      >
                        Add Interior
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="flex flex-col max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingInterior ? "Edit Interior" : "Add Interior"}
                        </DialogTitle>
                      </DialogHeader>
                      <form className="grid grid-cols-2 gap-4 flex-1">
                        <div className="grid gap-2">
                          <Label htmlFor="carModel">Car Model</Label>
                          {editingInterior ? (
                            <div className="p-2 bg-muted rounded-md">
                              {getCarModelName(newInterior.carModelId as string)}
                            </div>
                          ) : (
                            <Select
                              value={newInterior.carModelId}
                              onValueChange={(value) =>
                                setNewInterior({
                                  ...newInterior,
                                  carModelId: value,
                                })
                              }
                              disabled={interiorPending}
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
                            value={newInterior.name ?? ""}
                            onChange={(e) =>
                              setNewInterior({ ...newInterior, name: e.target.value })
                            }
                            disabled={interiorPending}
                          />
                        </div>
                        <div className="grid gap-2 col-span-2">
                          <Label>Hex Code</Label>
                          <Sketch
                            color={newInterior.hex || "#000000"}
                            onChange={(color) =>
                              setNewInterior({
                                ...newInterior,
                                hex: color.hex,
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2 col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newInterior.description ?? ""}
                            onChange={(e) =>
                              setNewInterior({
                                ...newInterior,
                                description: e.target.value,
                              })
                            }
                            disabled={interiorPending}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="price">Price</Label>
                          <Input
                            id="price"
                            type="number"
                            value={newInterior.price ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewInterior({
                                ...newInterior,
                                price: val === "" ? undefined : parseFloat(val),
                              });
                            }}
                            disabled={interiorPending}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="inventory">Stock</Label>
                          <Input
                            id="inventory"
                            type="number"
                            value={newInterior.inventory ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewInterior({
                                ...newInterior,
                                inventory:
                                  val === "" ? undefined : parseInt(val, 10),
                              });
                            }}
                            disabled={interiorPending}
                          />
                        </div>
                        <div className="grid gap-2 col-span-2">
                          <Label htmlFor="image">Interior Image</Label>
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleInteriorImageUpload}
                            disabled={interiorPending}
                          />
                          {newInterior.imageUrl && (
                            <Image
                              src={newInterior.imageUrl}
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
                          onClick={handleAddOrUpdateInterior}
                          disabled={
                            interiorPending ||
                            !newInterior.name ||
                            !newInterior.carModelId
                          }
                        >
                          {interiorPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {interiors.map((interior) => (
                      <Card key={interior.id}>
                        <CardHeader>
                          <CardTitle>{interior.name}</CardTitle>
                          <CardDescription>
                            {getCarModelName(interior.carModelId)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {interior.imageUrl ? (
                            <Image
                              src={interior.imageUrl}
                              alt={interior.name}
                              className="w-full h-auto object-cover rounded mb-2"
                              width={500}
                              height={500}
                            />
                          ) : (
                            <div
                              className="w-16 h-16 border border-gray-300 mb-2 mx-auto"
                              style={{ backgroundColor: interior.hex || '#000000' }}
                            ></div>
                          )}
                          <p className="mb-1">{interior.description}</p>
                          <p>Price: ₱{interior.price}</p>
                          <p>Stock: {interior.inventory}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button
                            variant="outline"
                            onClick={() => openInteriorEdit(interior)}
                            disabled={isDataLoading}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteInterior(interior.id)}
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
          </Tabs>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Colors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{totalColors}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Total Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      ₱{totalValue.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Total Sold</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      ₱{totalSold.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Low Inventory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {lowInventoryColors.length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recently Added</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentlyAdded.length > 0 ? (
                      <ul className="space-y-2">
                        {recentlyAdded.map((color) => (
                          <li
                            key={color.id}
                            className="flex items-center space-x-2"
                          >
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span>
                              {color.name} ({getCarModelName(color.carModelId)})
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No recently added colors.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Best Sellers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bestSellers.length > 0 ? (
                      <ul className="space-y-2">
                        {bestSellers.map((color) => (
                          <li
                            key={color.id}
                            className="flex items-center justify-between"
                          >
                            <span>{color.name}</span>
                            <span className="text-sm text-muted-foreground">
                              Stock: {color.inventory}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No best sellers identified.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryPage;