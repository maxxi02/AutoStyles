"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, MessageCircleWarning } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
interface CarType {
  id: string;
  name: string;
}
interface CarModel {
  id: string;
  name: string;
  carTypeId: string;
  imageUrl?: string;
  basePrice?: number;
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
}
interface Wheel {
  id: string;
  carModelId: string;
  name: string;
  description: string;
  price: number;
  inventory: number;
  imageUrl?: string;
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
}
interface CustomizationState {
  typeId: string;
  modelId: string;
  colorId: string;
  wheelId: string;
  interiorId: string;
}
interface PricingRule {
  id: string;
  description: string;
  discountPercentage: number;
  isActive: boolean;
}
interface TransactionData {
  userId: string;
  typeId: string;
  modelId: string;
  colorId: string;
  wheelId: string;
  interiorId: string;
  timestamp: Date;
  subtotal: number;
  price: number;
  status: "saved";
  customerDetails: {
    fullName: string;
    email: string;
    contactNumber: string;
    address: string;
  };
  customizationProgress: {
    paintCompleted: boolean;
    paintCompletedAt: null;
    wheelsCompleted: boolean;
    wheelsCompletedAt: null;
    interiorCompleted: boolean;
    interiorCompletedAt: null;
    overallStatus: "pending";
  };
  pricingRule?: {
    id: string;
    description: string;
    discountPercentage: number;
    discountAmount: number;
  };
}
const CustomizationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"customize" | "models">(
    "customize"
  );
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [interiors, setInteriors] = useState<Interior[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [selectedColorId, setSelectedColorId] = useState<string>("");
  const [selectedWheelId, setSelectedWheelId] = useState<string>("");
  const [selectedInteriorId, setSelectedInteriorId] = useState<string>("");
  const [history, setHistory] = useState<CustomizationState[]>([]);
  const [currentState, setCurrentState] = useState<CustomizationState | null>(
    null
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Loading state
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // pricing rules
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [selectedPricingRuleId, setSelectedPricingRuleId] =
    useState<string>("");
  //to track authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);
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
          if (next === 5) {
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
    const unsubscribePricingRules = onSnapshot(
      collection(db, "pricingRules"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as PricingRule
        );
        // Only show active rules to customers
        setPricingRules(data.filter((rule) => rule.isActive));
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
  const getUserDetails = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          fullName: data.name || currentUser?.displayName || "N/A",
          email: data.email || currentUser?.email || "N/A",
          contactNumber: data.phone || "N/A",
          address: data.address || "N/A",
        };
      }
      // Fallback to auth data if Firestore doc doesn't exist
      return {
        fullName: currentUser?.displayName || "N/A",
        email: currentUser?.email || "N/A",
        contactNumber: "N/A",
        address: "N/A",
      };
    } catch (error) {
      console.error("Error fetching user details:", error);
      return {
        fullName: currentUser?.displayName || "N/A",
        email: currentUser?.email || "N/A",
        contactNumber: "N/A",
        address: "N/A",
      };
    }
  };
  // Filtered models by type
  const filteredModels = carModels.filter(
    (model) => model.carTypeId === selectedTypeId
  );
  // Auto-select first type if none selected and available
  useEffect(() => {
    if (carTypes.length > 0 && !selectedTypeId) {
      setSelectedTypeId(carTypes[0].id);
    }
  }, [carTypes, selectedTypeId]);
  // Auto-select first model if none selected and available
  useEffect(() => {
    if (filteredModels.length > 0 && !selectedModelId) {
      setSelectedModelId(filteredModels[0].id);
    }
  }, [selectedTypeId, filteredModels, selectedModelId]);
  // Filtered colors by selected model
  const filteredColors = paintColors.filter(
    (color) => color.carModelId === selectedModelId
  );
  const filteredWheels = wheels.filter(
    (wheel) => wheel.carModelId === selectedModelId
  );
  const filteredInteriors = interiors.filter(
    (interior) => interior.carModelId === selectedModelId
  );
  const selectedModel = carModels.find((m) => m.id === selectedModelId);
  const selectedColor = paintColors.find((c) => c.id === selectedColorId);
  const selectedWheel = wheels.find((w) => w.id === selectedWheelId);
  const selectedInterior = interiors.find((i) => i.id === selectedInteriorId);
  useEffect(() => {
    if (selectedTypeId && selectedModelId) {
      const newState: CustomizationState = {
        typeId: selectedTypeId,
        modelId: selectedModelId,
        colorId: selectedColorId,
        wheelId: selectedWheelId,
        interiorId: selectedInteriorId,
      };
      setHistory((prev) => {
        if (
          currentState &&
          (currentState.typeId !== newState.typeId ||
            currentState.modelId !== newState.modelId ||
            currentState.colorId !== newState.colorId ||
            currentState.wheelId !== newState.wheelId ||
            currentState.interiorId !== newState.interiorId)
        ) {
          return [...prev, currentState];
        }
        return prev;
      });
      setCurrentState(newState);
    }
  }, [
    selectedTypeId,
    selectedModelId,
    selectedColorId,
    selectedWheelId,
    selectedInteriorId,
  ]);
  // Reset image index when color changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedColorId, selectedColor?.images?.length]);
  // Calculate price - only add prices for selected items
  const basePrice = selectedModel?.basePrice ?? 0;
  const colorPrice =
    selectedColorId && selectedColor ? (selectedColor.price ?? 0) : 0;
  const wheelPrice =
    selectedWheelId && selectedWheel ? (selectedWheel.price ?? 0) : 0;
  const interiorPrice =
    selectedInteriorId && selectedInterior ? (selectedInterior.price ?? 0) : 0;
  const subtotal = basePrice + colorPrice + wheelPrice + interiorPrice;
  // Apply pricing rule if selected
  const selectedPricingRule = pricingRules.find(
    (rule) => rule.id === selectedPricingRuleId
  );
  let discountAmount = 0;
  let calculatedPrice = subtotal;
  if (selectedPricingRule) {
    discountAmount = (subtotal * selectedPricingRule.discountPercentage) / 100;
    calculatedPrice = subtotal - discountAmount;
  }
  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setCurrentState(previousState);
      setSelectedTypeId(previousState.typeId);
      setSelectedModelId(previousState.modelId);
      setSelectedColorId(previousState.colorId);
      setSelectedWheelId(previousState.wheelId);
      setSelectedInteriorId(previousState.interiorId);
    }
  };
  const handleSaveDesign = async () => {
    if (!selectedModelId) {
      toast.error("Please select a model first.");
      return;
    }
    // Check if at least one customization option is selected
    if (!selectedColorId && !selectedWheelId && !selectedInteriorId) {
      toast.error(
        "Please select at least one customization option (color, wheels, or interior) before saving."
      );
      return;
    }
    if (!currentUser) {
      toast.error("You must be logged in to save a design.");
      return;
    }
    setIsSaving(true);
    try {
      // Check for existing transaction with same customization
      const existingQuery = query(
        collection(db, "transactions"),
        where("userId", "==", currentUser.uid),
        where("modelId", "==", selectedModelId),
        where("colorId", "==", selectedColorId),
        where("wheelId", "==", selectedWheelId),
        where("interiorId", "==", selectedInteriorId),
        where("status", "==", "saved")
      );
      const existingSnap = await getDocs(existingQuery);
      if (existingSnap.size > 0) {
        toast.warning(
          "This exact design is already saved. You can view or update it in your transactions."
        );
        setIsSaving(false);
        return;
      }
      // Fetch customer details
      const customerDetails = await getUserDetails(currentUser.uid);
      // Warn user if address is missing
      if (customerDetails.address === "N/A" || !customerDetails.address) {
        toast.warning("Please update your address in your profile.");
      }
      const transactionData: TransactionData = {
        userId: currentUser.uid,
        typeId: selectedTypeId,
        modelId: selectedModelId,
        colorId: selectedColorId, // ✅ FIXED - now using the ID string
        wheelId: selectedWheelId,
        interiorId: selectedInteriorId,
        timestamp: new Date(),
        subtotal: subtotal,
        price: calculatedPrice,
        status: "saved" as const,
        customerDetails: customerDetails,
        customizationProgress: {
          paintCompleted: false,
          paintCompletedAt: null,
          wheelsCompleted: false,
          wheelsCompletedAt: null,
          interiorCompleted: false,
          interiorCompletedAt: null,
          overallStatus: "pending" as const,
        },
      };
      // Add pricing rule info if applied
      if (selectedPricingRuleId && selectedPricingRule) {
        transactionData.pricingRule = {
          id: selectedPricingRuleId,
          description: selectedPricingRule.description,
          discountPercentage: selectedPricingRule.discountPercentage, // Changed
          discountAmount: discountAmount,
        };
      }
      const transactionRef = await addDoc(
        collection(db, "transactions"),
        transactionData
      );
      toast.success(`Design saved to transaction! ID: ${transactionRef.id}`);
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("Failed to save transaction");
    } finally {
      setIsSaving(false);
    }
  };
  // Get image for preview fallback
  const getPreviewImage = () =>
    selectedModel?.imageUrl || "/placeholder-car.png";
  const handleCustomizeModel = (modelId: string, carTypeId: string) => {
    setActiveTab("customize");
    setSelectedTypeId(carTypeId);
    setSelectedModelId(modelId);
  };
  const handlePricingRuleChange = (value: string) => {
    setSelectedPricingRuleId(value === "none" ? "" : value);
  };
  if (isDataLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Loading customization options...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto p-4">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
      >
        <TabsList>
          <TabsTrigger value="customize">Customize</TabsTrigger>
          <TabsTrigger value="models">All Models</TabsTrigger>
        </TabsList>
        <TabsContent value="customize">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Selections Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Customize Your Car</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Car Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Car Type</label>
                  <Select
                    value={selectedTypeId}
                    onValueChange={setSelectedTypeId}
                    disabled={carTypes.length === 0}
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
                    <p className="text-sm text-muted-foreground mt-1">
                      No car types available.
                    </p>
                  )}
                </div>
                {/* Model Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Model</label>
                  <Select
                    value={selectedModelId}
                    onValueChange={setSelectedModelId}
                    disabled={filteredModels.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filteredModels.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      No models available for this type.
                    </p>
                  )}
                </div>
                {/* Color Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Exterior Color & Finish
                  </label>
                  {filteredColors.length > 0 ? (
                    <RadioGroup
                      value={selectedColorId || "none"}
                      onValueChange={(value) =>
                        setSelectedColorId(value === "none" ? "" : value)
                      }
                    >
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        <div className="flex items-center p-2 border rounded-md hover:bg-muted">
                          <RadioGroupItem value="none" id="color-none" />
                          <label
                            htmlFor="color-none"
                            className="flex items-center space-x-3 cursor-pointer flex-1 ml-2"
                          >
                            <div className="w-8 h-8 rounded border bg-muted" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                No selection
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Default color
                              </span>
                            </div>
                          </label>
                        </div>
                        {filteredColors.map((color) => (
                          <div
                            key={color.id}
                            className="flex items-center p-2 border rounded-md hover:bg-muted"
                          >
                            <RadioGroupItem
                              value={color.id}
                              id={`color-${color.id}`}
                              disabled={color.inventory === 0}
                            />
                            <label
                              htmlFor={`color-${color.id}`}
                              className="flex items-center space-x-3 cursor-pointer flex-1 ml-2"
                            >
                              <div
                                className="w-8 h-8 rounded border"
                                style={{ backgroundColor: color.hex }}
                              />
                              <div className="flex flex-col flex-1">
                                <span className="text-sm font-medium">
                                  {color.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {color.finish}
                                </span>
                                <span
                                  className={`text-xs ${color.inventory === 0 ? "text-red-600" : color.inventory <= 10 ? "text-orange-600" : "text-green-600"}`}
                                >
                                  {color.inventory === 0
                                    ? "Out of Stock"
                                    : `Stock: ${color.inventory}`}
                                </span>
                              </div>
                              {color.images?.[0] && (
                                <Image
                                  src={color.images[0]}
                                  alt={color.name}
                                  className="w-12 h-12 rounded object-cover ml-auto"
                                  width={48}
                                  height={48}
                                />
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      No colors available for this model.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {selectedColorId
                      ? `Selected: ${selectedColor?.name || "Unknown"}`
                      : "No color selected"}
                  </p>
                  {selectedColor && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: selectedColor.hex }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedColor.hex}
                      </span>
                    </div>
                  )}
                </div>
                {/* Wheel Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Wheels</label>
                  {filteredWheels.length > 0 ? (
                    <RadioGroup
                      value={selectedWheelId || "none"}
                      onValueChange={(value) =>
                        setSelectedWheelId(value === "none" ? "" : value)
                      }
                    >
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        <div className="flex items-center p-2 border rounded-md hover:bg-muted">
                          <RadioGroupItem value="none" id="wheel-none" />
                          <label
                            htmlFor="wheel-none"
                            className="flex items-center space-x-3 cursor-pointer flex-1 ml-2"
                          >
                            <div className="w-12 h-12 rounded bg-muted" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                No selection
                              </span>
                            </div>
                          </label>
                        </div>
                        {filteredWheels.map((wheel) => (
                          <div
                            key={wheel.id}
                            className="flex items-center p-2 border rounded-md hover:bg-muted"
                          >
                            <RadioGroupItem
                              value={wheel.id}
                              id={`wheel-${wheel.id}`}
                            />
                            <label
                              htmlFor={`wheel-${wheel.id}`}
                              className="flex items-center space-x-3 cursor-pointer flex-1 ml-2"
                            >
                              {wheel.imageUrl ? (
                                <Image
                                  src={wheel.imageUrl}
                                  alt={wheel.name}
                                  className="w-12 h-12 rounded object-cover"
                                  width={48}
                                  height={48}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded bg-muted" />
                              )}
                              <div className="flex flex-col flex-1">
                                <span className="text-sm font-medium">
                                  {wheel.name}
                                </span>
                                <span
                                  className={`text-xs ${wheel.inventory === 0 ? "text-red-600" : wheel.inventory <= 10 ? "text-orange-600" : "text-green-600"}`}
                                >
                                  {wheel.inventory === 0
                                    ? "Out of Stock"
                                    : `Stock: ${wheel.inventory}`}
                                </span>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      No wheels available for this model.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {selectedWheelId
                      ? `Selected: ${selectedWheel?.name || "Unknown"}`
                      : "No wheels selected"}
                  </p>
                </div>
                {/* Interior Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Interior</label>
                  {filteredInteriors.length > 0 ? (
                    <RadioGroup
                      value={selectedInteriorId || "none"}
                      onValueChange={(value) =>
                        setSelectedInteriorId(value === "none" ? "" : value)
                      }
                    >
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        <div className="flex items-center p-2 border rounded-md hover:bg-muted">
                          <RadioGroupItem value="none" id="interior-none" />
                          <label
                            htmlFor="interior-none"
                            className="flex items-center space-x-3 cursor-pointer flex-1 ml-2"
                          >
                            <div className="w-8 h-8 rounded border bg-muted" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                No selection
                              </span>
                            </div>
                          </label>
                        </div>
                        {filteredInteriors.map((interior) => (
                          <div
                            key={interior.id}
                            className="flex items-center p-2 border rounded-md hover:bg-muted"
                          >
                            <RadioGroupItem
                              value={interior.id}
                              id={`interior-${interior.id}`}
                            />
                            <label
                              htmlFor={`interior-${interior.id}`}
                              className="flex items-center space-x-3 cursor-pointer flex-1 ml-2"
                            >
                              {interior.imageUrl ? (
                                <Image
                                  src={interior.imageUrl}
                                  alt={interior.name}
                                  className="w-12 h-12 rounded object-cover"
                                  width={48}
                                  height={48}
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded border"
                                  style={{
                                    backgroundColor: interior.hex || "#000000",
                                  }}
                                />
                              )}
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {interior.name}
                                </span>
                              </div>
                              {interior.hex && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {interior.hex}
                                </span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      No interiors available for this model.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {selectedInteriorId
                      ? `Selected: ${selectedInterior?.name || "Unknown"}`
                      : "No interior selected"}
                  </p>
                  {selectedInterior?.hex && selectedInteriorId && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: selectedInterior.hex }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedInterior.hex}
                      </span>
                    </div>
                  )}
                </div>
                {/* Pricing Rule Selection */}
                {pricingRules.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Apply Discount/Offer
                    </label>
                    <Select
                      value={selectedPricingRuleId}
                      onValueChange={handlePricingRuleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No discount applied" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No discount</SelectItem>
                        {pricingRules.map((rule) => (
                          <SelectItem key={rule.id} value={rule.id}>
                            <span className="block truncate max-w-[250px]">
                              {rule.description} (-{rule.discountPercentage}%)
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Price */}
                {(selectedColorId || selectedWheelId || selectedInteriorId) &&
                  subtotal > 0 && (
                    <div className="p-3 bg-muted rounded-md">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Price Breakdown:
                        </p>
                        {basePrice > 0 && (
                          <p className="text-xs">
                            Base: ₱{basePrice.toLocaleString()}
                          </p>
                        )}
                        {colorPrice > 0 && selectedColor && (
                          <p className="text-xs">
                            Color: ₱{colorPrice.toLocaleString()}
                          </p>
                        )}
                        {wheelPrice > 0 && selectedWheel && (
                          <p className="text-xs">
                            Wheels: ₱{wheelPrice.toLocaleString()}
                          </p>
                        )}
                        {interiorPrice > 0 && selectedInterior && (
                          <p className="text-xs">
                            Interior: ₱{interiorPrice.toLocaleString()}
                          </p>
                        )}
                        <hr className="my-2" />
                        <p className="text-sm font-medium">
                          Subtotal: ₱{subtotal.toLocaleString()}
                        </p>
                        {selectedPricingRule && (
                          <>
                            <p className="text-xs text-green-600">
                              {selectedPricingRule.description}: -₱
                              {Math.round(discountAmount).toLocaleString()}
                            </p>
                            <hr className="my-2" />
                          </>
                        )}
                        <p className="text-lg font-bold">
                          Total: ₱{Math.round(calculatedPrice).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
              </CardContent>
              <CardFooter className="flex flex-col items-start space-y-2">
                <Button
                  onClick={handleUndo}
                  variant="outline"
                  disabled={history.length === 0}
                >
                  Undo
                </Button>
                <Button
                  onClick={handleSaveDesign}
                  disabled={
                    isSaving ||
                    !selectedModelId ||
                    (!selectedColorId &&
                      !selectedWheelId &&
                      !selectedInteriorId)
                  }
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Design"
                  )}
                </Button>
              </CardFooter>
            </Card>
            {/* Preview Area */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>2D Preview</CardTitle>
                <CardDescription>Preview your customized car</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-start p-4 space-y-6">
                {/* Show message if no model is selected */}
                {!selectedModelId ? (
                  <div className="w-full flex items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground text-center">
                      Please select a car model to preview customizations
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Main Car Preview */}
                    <div className="w-full">
                      <h3 className="text-sm font-medium mb-2">Exterior</h3>
                      <div className="relative">
                        {selectedColorId &&
                        selectedColor?.images &&
                        selectedColor.images.length > 0 ? (
                          <>
                            <Image
                              key={`${selectedColorId}-${currentImageIndex}`}
                              src={
                                selectedColor.images[
                                  Math.min(
                                    currentImageIndex,
                                    selectedColor.images.length - 1
                                  )
                                ] || "/placeholder-car.png"
                              }
                              alt={`${selectedColor.name} - ${["Front", "Back", "Left", "Right"][currentImageIndex]} view`}
                              className="w-full h-auto rounded-lg"
                              width={800}
                              height={600}
                            />
                            {/* Carousel Controls */}
                            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4">
                              <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full shadow-lg"
                                onClick={() =>
                                  setCurrentImageIndex((prev) =>
                                    prev > 0
                                      ? prev - 1
                                      : selectedColor.images!.length - 1
                                  )
                                }
                              >
                                ←
                              </Button>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full shadow-lg"
                                onClick={() =>
                                  setCurrentImageIndex((prev) =>
                                    prev < selectedColor.images!.length - 1
                                      ? prev + 1
                                      : 0
                                  )
                                }
                              >
                                →
                              </Button>
                            </div>
                            {/* Indicators */}
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-2">
                              {selectedColor.images.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentImageIndex(index)}
                                  className={`w-2 h-2 rounded-full transition-all ${
                                    index === currentImageIndex
                                      ? "bg-white w-8"
                                      : "bg-white/50 hover:bg-white/75"
                                  }`}
                                  aria-label={`View ${["Front", "Back", "Left", "Right"][index]}`}
                                />
                              ))}
                            </div>
                            {/* Image Label */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                              {
                                ["Front", "Back", "Left", "Right"][
                                  currentImageIndex
                                ]
                              }{" "}
                              View
                            </div>
                          </>
                        ) : (
                          <Image
                            src={getPreviewImage()}
                            alt={`${selectedModel?.name || "Car"} Preview`}
                            className="w-full h-auto rounded-lg"
                            width={800}
                            height={600}
                          />
                        )}
                      </div>
                      {selectedColorId ? (
                        selectedColor &&
                        selectedColor.description && (
                          <div className="text-start mt-4">
                            <p className="text-sm text-muted-foreground mt-2 max-w-md">
                              {selectedColor.description}
                            </p>
                          </div>
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">
                          No color selected - using default exterior
                        </p>
                      )}
                    </div>
                    {/* Wheels Preview */}
                    {selectedWheelId && selectedWheel?.imageUrl && (
                      <div className="w-full">
                        <h3 className="text-sm font-medium mb-2">Wheels</h3>
                        <Image
                          src={selectedWheel.imageUrl}
                          alt="Wheel Preview"
                          className="w-full h-auto rounded-lg"
                          width={800}
                          height={600}
                        />
                        {selectedWheel && selectedWheel.description && (
                          <div className="text-start mt-4">
                            <p className="text-sm text-muted-foreground mt-2 max-w-md">
                              {selectedWheel.description}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {!selectedWheelId && (
                      <div className="w-full">
                        <h3 className="text-sm font-medium mb-2">Wheels</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          No wheels selected - using default wheels
                        </p>
                      </div>
                    )}
                    {/* Interior Preview */}
                    {selectedInteriorId && selectedInterior && (
                      <div className="w-full">
                        <h3 className="text-sm font-medium mb-2">Interior</h3>
                        <Image
                          src={
                            selectedInterior.imageUrl ||
                            "/placeholder-interior.png"
                          }
                          alt="Interior Preview"
                          className="w-full h-auto rounded-lg"
                          width={800}
                          height={600}
                        />
                        {selectedInterior && selectedInterior.description && (
                          <div className="text-start mt-4">
                            <p className="text-sm text-muted-foreground mt-2 max-w-md">
                              {selectedInterior.description}
                            </p>
                          </div>
                        )}
                        {selectedInterior?.hex && (
                          <div className="flex items-center space-x-2 mt-2">
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: selectedInterior.hex }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {selectedInterior.hex}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {!selectedInteriorId && (
                      <div className="w-full">
                        <h3 className="text-sm font-medium mb-2">Interior</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          No interior selected - using default interior
                        </p>
                      </div>
                    )}
                    {!selectedColorId &&
                      !selectedWheelId &&
                      !selectedInteriorId && (
                        <p className="text-xs mt-2 text-red-500 flex items-center gap-2">
                          <MessageCircleWarning />
                          Please select at least one customization option to
                          save your design
                        </p>
                      )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>All Car Models</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {carModels.length > 0 ? (
                  carModels.map((model) => {
                    const modelColors = paintColors.filter(
                      (color) => color.carModelId === model.id
                    );
                    const modelWheels = wheels.filter(
                      (wheel) => wheel.carModelId === model.id
                    );
                    const modelInteriors = interiors.filter(
                      (interior) => interior.carModelId === model.id
                    );
                    const modelType = carTypes.find(
                      (t) => t.id === model.carTypeId
                    );
                    return (
                      <Card key={model.id}>
                        <CardHeader>
                          <CardTitle>{model.name}</CardTitle>
                          <CardDescription>
                            {modelType?.name || "Unknown"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1 md:w-1/2">
                            <p className="font-medium mb-2">
                              Available Colors:
                            </p>
                            {modelColors.length > 0 ? (
                              <ul className="space-y-1">
                                {modelColors.map((color) => (
                                  <li
                                    key={color.id}
                                    className="flex items-start space-x-2"
                                  >
                                    {color.images?.[0] ? (
                                      <Image
                                        src={color.images[0]}
                                        alt={color.name}
                                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                                        width={500}
                                        height={500}
                                      />
                                    ) : (
                                      <div
                                        className="w-8 h-8 rounded flex-shrink-0"
                                        style={{ backgroundColor: color.hex }}
                                      ></div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium block">
                                        {color.name} ({color.finish})
                                      </span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No colors assigned.
                              </p>
                            )}
                            <p className="font-medium mb-2 mt-4">
                              Available Wheels:
                            </p>
                            {modelWheels.length > 0 ? (
                              <ul className="space-y-1">
                                {modelWheels.map((wheel) => (
                                  <li
                                    key={wheel.id}
                                    className="flex items-start space-x-2"
                                  >
                                    {wheel.imageUrl ? (
                                      <Image
                                        src={wheel.imageUrl}
                                        alt={wheel.name}
                                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                                        width={500}
                                        height={500}
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded bg-muted flex-shrink-0"></div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium block">
                                        {wheel.name}
                                      </span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No wheels assigned.
                              </p>
                            )}
                            <p className="font-medium mb-2 mt-4">
                              Available Interiors:
                            </p>
                            {modelInteriors.length > 0 ? (
                              <ul className="space-y-1">
                                {modelInteriors.map((interior) => (
                                  <li
                                    key={interior.id}
                                    className="flex items-start space-x-2"
                                  >
                                    {interior.imageUrl ? (
                                      <Image
                                        src={interior.imageUrl}
                                        alt={interior.name}
                                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                                        width={500}
                                        height={500}
                                      />
                                    ) : (
                                      <div
                                        className="w-8 h-8 rounded flex-shrink-0"
                                        style={{
                                          backgroundColor:
                                            interior.hex || "#000000",
                                        }}
                                      ></div>
                                    )}
                                    <div className="flex flex-col flex-1">
                                      <span className="text-sm font-medium">
                                        {interior.name}
                                      </span>
                                      <span
                                        className={`text-xs ${interior.inventory === 0 ? "text-red-600" : interior.inventory <= 10 ? "text-orange-600" : "text-green-600"}`}
                                      >
                                        {interior.inventory === 0
                                          ? "Out of Stock"
                                          : `Stock: ${interior.inventory}`}
                                      </span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No interiors assigned.
                              </p>
                            )}
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
                        <CardFooter className="flex justify-start">
                          <Button
                            onClick={() =>
                              handleCustomizeModel(model.id, model.carTypeId)
                            }
                          >
                            Customize
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground col-span-full">
                    No car models available.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default CustomizationPage;
