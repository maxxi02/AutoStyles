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
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

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
  imageUrl?: string;
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

  // Loading state
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

    return () => {
      unsubscribeCarTypes();
      unsubscribeCarModels();
      unsubscribePaintColors();
      unsubscribeWheels();
      unsubscribeInteriors();
    };
  }, []);

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

  // Auto-select first color if none selected and available
  useEffect(() => {
    if (filteredColors.length > 0 && !selectedColorId) {
      setSelectedColorId(filteredColors[0].id);
    }
  }, [selectedModelId, filteredColors, selectedColorId]);

  // Filtered wheels by selected model
  const filteredWheels = wheels.filter(
    (wheel) => wheel.carModelId === selectedModelId
  );

  // Auto-select first wheel if none selected and available
  useEffect(() => {
    if (filteredWheels.length > 0 && !selectedWheelId) {
      setSelectedWheelId(filteredWheels[0].id);
    }
  }, [selectedModelId, filteredWheels, selectedWheelId]);

  // Filtered interiors by selected model
  const filteredInteriors = interiors.filter(
    (interior) => interior.carModelId === selectedModelId
  );

  // Auto-select first interior if none selected and available
  useEffect(() => {
    if (filteredInteriors.length > 0 && !selectedInteriorId) {
      setSelectedInteriorId(filteredInteriors[0].id);
    }
  }, [selectedModelId, filteredInteriors, selectedInteriorId]);

  // Selected model and color
  const selectedModel = carModels.find((m) => m.id === selectedModelId);
  const selectedColor = paintColors.find((c) => c.id === selectedColorId);
  const selectedWheel = wheels.find((w) => w.id === selectedWheelId);
  const selectedInterior = interiors.find((i) => i.id === selectedInteriorId);

  // Update history on selection change
  useEffect(() => {
    if (
      selectedTypeId &&
      selectedModelId &&
      selectedColorId &&
      selectedWheelId &&
      selectedInteriorId
    ) {
      const newState: CustomizationState = {
        typeId: selectedTypeId,
        modelId: selectedModelId,
        colorId: selectedColorId,
        wheelId: selectedWheelId,
        interiorId: selectedInteriorId,
      };
      if (
        currentState &&
        (currentState.typeId !== newState.typeId ||
          currentState.modelId !== newState.modelId ||
          currentState.colorId !== newState.colorId ||
          currentState.wheelId !== newState.wheelId ||
          currentState.interiorId !== newState.interiorId)
      ) {
        setHistory((prev) => [...prev, currentState]);
      }
      setCurrentState(newState);
    }
  }, [
    selectedTypeId,
    selectedModelId,
    selectedColorId,
    selectedWheelId,
    selectedInteriorId,
  ]);

  // Calculate price
  const basePrice = selectedModel?.basePrice ?? 0;
  const colorPrice = selectedColor?.price ?? 0;
  const wheelPrice = selectedWheel?.price ?? 0;
  const interiorPrice = selectedInterior?.price ?? 0;
  const calculatedPrice = basePrice + colorPrice + wheelPrice + interiorPrice;

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
    if (
      !selectedModelId ||
      !selectedColorId ||
      !selectedWheelId ||
      !selectedInteriorId
    ) {
      toast.error("Please select all customizations first.");
      return;
    }
    try {
      const transactionRef = await addDoc(collection(db, "transactions"), {
        typeId: selectedTypeId,
        modelId: selectedModelId,
        colorId: selectedColorId,
        wheelId: selectedWheelId,
        interiorId: selectedInteriorId,
        timestamp: new Date(),
        price: calculatedPrice,
        status: "saved" as const,
      });
      toast.success(`Design saved to transaction! ID: ${transactionRef.id}`);
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("Failed to save transaction");
    }
  };

  // Get image for preview
  const getPreviewImage = () =>
    selectedColor?.imageUrl ||
    selectedModel?.imageUrl ||
    "/placeholder-car.png";

  const handleCustomizeModel = (modelId: string, carTypeId: string) => {
    setActiveTab("customize");
    setSelectedTypeId(carTypeId);
    setSelectedModelId(modelId);
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
                      value={selectedColorId}
                      onValueChange={setSelectedColorId}
                    >
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {filteredColors.map((color) => (
                          <div
                            key={color.id}
                            className="flex items-center p-2 border rounded-md hover:bg-muted"
                          >
                            <RadioGroupItem
                              value={color.id}
                              id={`color-${color.id}`}
                            />
                            <label
                              htmlFor={`color-${color.id}`}
                              className="flex items-center space-x-3 cursor-pointer flex-1 ml-2"
                            >
                              <div
                                className="w-8 h-8 rounded border"
                                style={{ backgroundColor: color.hex }}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {color.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {color.finish}
                                </span>
                              </div>
                              {color.imageUrl && (
                                <Image
                                  src={color.imageUrl}
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
                      value={selectedWheelId}
                      onValueChange={setSelectedWheelId}
                    >
                      <div className="space-y-2 max-h-60 overflow-y-auto">
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
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {wheel.name}
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
                </div>

                {/* Interior Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Interior</label>
                  {filteredInteriors.length > 0 ? (
                    <RadioGroup
                      value={selectedInteriorId}
                      onValueChange={setSelectedInteriorId}
                    >
                      <div className="space-y-2 max-h-60 overflow-y-auto">
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
                </div>

                {/* Price */}
                {calculatedPrice > 0 && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-lg font-bold">
                      Total Price: ₱{calculatedPrice.toLocaleString()}
                    </p>
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
                    !selectedModelId ||
                    !selectedColorId ||
                    !selectedWheelId ||
                    !selectedInteriorId
                  }
                >
                  Save Design
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
                {/* Main Car Preview */}
                <div className="w-full">
                  <h3 className="text-sm font-medium mb-2">Exterior</h3>
                  <Image
                    src={getPreviewImage()}
                    alt={`${selectedModel?.name || "Car"} Preview`}
                    className="w-full h-auto rounded-lg"
                    width={800}
                    height={600}
                  />
                  {selectedColor && selectedColor.description && (
                    <div className="text-start mt-4">
                      <p className="text-sm text-muted-foreground mt-2 max-w-md">
                        {selectedColor.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Wheels Preview */}
                {selectedWheel?.imageUrl && (
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

                {/* Interior Preview */}
                {selectedInterior && (
                  <div className="w-full">
                    <h3 className="text-sm font-medium mb-2">Interior</h3>
                    <Image
                      src={
                        selectedInterior.imageUrl || "/placeholder-interior.png"
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
                                    {color.imageUrl ? (
                                      <Image
                                        src={color.imageUrl}
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
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium block">
                                        {interior.name}
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
