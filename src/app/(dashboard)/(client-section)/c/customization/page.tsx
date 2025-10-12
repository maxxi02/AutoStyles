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
import { db } from "@/lib/firebase"; // Adjust the import path to your config file
import { Loader2 } from "lucide-react"; // Assuming lucide-react is available for spinner
import { toast } from "sonner";
import Image from "next/image";

interface CarModel {
  id: string;
  name: string;
  type: "Sedan" | "SUV" | "Pickup" | "Hatchback";
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

interface CustomizationState {
  modelId: string;
  colorId: string;
}

const CustomizationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"customize" | "models">(
    "customize"
  );
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [selectedType, setSelectedType] = useState<CarModel["type"]>("Sedan");
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [selectedColorId, setSelectedColorId] = useState<string>("");
  const [history, setHistory] = useState<CustomizationState[]>([]);
  const [currentState, setCurrentState] = useState<CustomizationState | null>(
    null
  );

  // Loading state
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
          if (next === 2) {
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
          if (next === 2) {
            setIsDataLoading(false);
          }
          return next;
        });
      }
    );

    return () => {
      unsubscribeCarModels();
      unsubscribePaintColors();
    };
  }, []);

  // Filtered models by type
  const filteredModels = carModels.filter(
    (model) => model.type === selectedType
  );

  // Auto-select first model if none selected and available
  useEffect(() => {
    if (filteredModels.length > 0 && !selectedModelId) {
      setSelectedModelId(filteredModels[0].id);
    }
  }, [selectedType, filteredModels, selectedModelId]);

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

  // Selected model and color
  const selectedModel = carModels.find((m) => m.id === selectedModelId);
  const selectedColor = paintColors.find((c) => c.id === selectedColorId);

  // Update history on selection change
  useEffect(() => {
    if (selectedModelId && selectedColorId) {
      const newState: CustomizationState = {
        modelId: selectedModelId,
        colorId: selectedColorId,
      };
      if (
        currentState &&
        (currentState.modelId !== newState.modelId ||
          currentState.colorId !== newState.colorId)
      ) {
        setHistory((prev) => [...prev, currentState]);
      }
      setCurrentState(newState);
    }
  }, [selectedModelId, selectedColorId]);

  // Calculate price
  const calculatedPrice =
    selectedModel?.basePrice && selectedColor?.price
      ? selectedModel.basePrice + selectedColor.price
      : 0;

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setCurrentState(previousState);
      setSelectedModelId(previousState.modelId);
      setSelectedColorId(previousState.colorId);
      // Trigger type update based on model
      const prevModel = carModels.find((m) => m.id === previousState.modelId);
      if (prevModel) {
        setSelectedType(prevModel.type);
      }
    }
  };

  const handleSaveDesign = async () => {
    if (!selectedModelId || !selectedColorId) {
      toast.error("Please select a model and color first.");
      return;
    }
    try {
      const designRef = await addDoc(collection(db, "designs"), {
        modelId: selectedModelId,
        colorId: selectedColorId,
        timestamp: new Date(),
        price: calculatedPrice,
      });
      toast.success(`Design saved! ID: ${designRef.id}`);
    } catch (error) {
      console.error("Error saving design:", error);
      toast.error("Failed to save design");
    }
  };

  const handleShareDesign = () => {
    if (!currentState) return;
    const shareUrl = `${window.location.origin}/customize?design=${btoa(JSON.stringify(currentState))}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard!");
  };

  // Get image for preview
  const getPreviewImage = () =>
    selectedColor?.imageUrl ||
    selectedModel?.imageUrl ||
    "/placeholder-car.png";

  const handleCustomizeModel = (modelId: string, type: CarModel["type"]) => {
    setActiveTab("customize");
    setSelectedType(type);
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
                    value={selectedType}
                    onValueChange={(value) =>
                      setSelectedType(value as CarModel["type"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sedan">Sedan</SelectItem>
                      <SelectItem value="SUV">SUV</SelectItem>
                      <SelectItem value="Pickup">Pickup</SelectItem>
                      <SelectItem value="Hatchback">Hatchback</SelectItem>
                    </SelectContent>
                  </Select>
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

                {/* Price */}
                {calculatedPrice > 0 && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-lg font-bold">
                      Total Price: ₱{calculatedPrice.toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button
                  onClick={handleUndo}
                  variant="outline"
                  disabled={history.length === 0}
                >
                  Undo
                </Button>
                <Button
                  onClick={handleSaveDesign}
                  disabled={!selectedModelId || !selectedColorId}
                >
                  Save Design
                </Button>
                <Button
                  onClick={handleShareDesign}
                  variant="outline"
                  disabled={!currentState}
                >
                  Share Design
                </Button>
              </CardFooter>
            </Card>

            {/* Preview Area */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>2D Preview</CardTitle>
                <CardDescription>Preview your customized car</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center p-4">
                <Image
                  src={getPreviewImage()}
                  alt={`${selectedModel?.name || "Car"} Preview`}
                  className="w-full max-w-2xl h-auto rounded-lg"
                  width={800}
                  height={600}
                />
                {selectedColor && (
                  <div className="text-center mt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Selected Color
                    </p>
                    <div
                      className="w-32 h-32 rounded-lg border mx-auto"
                      style={{ backgroundColor: selectedColor.hex }}
                    />
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
                    return (
                      <Card key={model.id}>
                        <CardHeader>
                          <CardTitle>{model.name}</CardTitle>
                          <CardDescription>{model.type}</CardDescription>
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
                        <CardFooter className="flex justify-center">
                          <Button
                            onClick={() =>
                              handleCustomizeModel(model.id, model.type)
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
