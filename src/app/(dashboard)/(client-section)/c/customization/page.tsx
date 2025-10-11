"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Undo, Save, Share2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const carTypes = [
  { value: "sedan", label: "Sedan", basePrice: 500 },
  { value: "suv", label: "SUV", basePrice: 650 },
  { value: "pickup", label: "Pickup", basePrice: 700 },
  { value: "hatchback", label: "Hatchback", basePrice: 450 },
];

const colors = [
  { value: "midnight-black", label: "Midnight Black", hex: "#1a1a1a" },
  { value: "pearl-white", label: "Pearl White", hex: "#f8f8f8" },
  { value: "racing-red", label: "Racing Red", hex: "#dc2626" },
  { value: "ocean-blue", label: "Ocean Blue", hex: "#3b82f6" },
  { value: "silver-metallic", label: "Silver Metallic", hex: "#c0c0c0" },
];

const finishes = [
  { value: "matte", label: "Matte", multiplier: 1.0 },
  { value: "glossy", label: "Glossy", multiplier: 1.1 },
  { value: "metallic", label: "Metallic", multiplier: 1.2 },
];

interface CustomizationState {
  carType: string;
  color: string;
  finish: string;
  price: number;
}

const CustomizationPage = () => {
  const router = useRouter();
  const [state, setState] = useState<CustomizationState>({
    carType: "sedan",
    color: "midnight-black",
    finish: "matte",
    price: 500,
  });
  const [history, setHistory] = useState<CustomizationState[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const selectedCar = carTypes.find((c) => c.value === state.carType);
  const selectedColor = colors.find((c) => c.value === state.color);
  const selectedFinish = finishes.find((f) => f.value === state.finish);

  const updatePrice = () => {
    const base = selectedCar?.basePrice || 500;
    const multiplier = selectedFinish?.multiplier || 1.0;
    return Math.round(base * multiplier);
  };

  const handleCarTypeChange = (value: string) => {
    const newState = { ...state, carType: value };
    setHistory([...history, state]);
    setState({ ...newState, price: updatePrice() });
  };

  const handleColorChange = (value: string) => {
    const newState = { ...state, color: value };
    setHistory([...history, state]);
    setState(newState);
  };

  const handleFinishChange = (value: string) => {
    const newState = { ...state, finish: value, price: updatePrice() };
    setHistory([...history, state]);
    setState(newState);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setState(previous);
      setHistory(history.slice(0, -1));
    }
  };

  const handleSave = () => {
    // Simulate save to localStorage or API
    localStorage.setItem("customDesign", JSON.stringify(state));
    alert("Design saved!");
  };

  const handleShare = () => {
    const shareText = `Check out my AutoStyles design: ${state.carType} in ${selectedColor?.label} with ${selectedFinish?.label} finish for $${state.price}`;
    navigator.clipboard.writeText(shareText);
    alert("Design link copied to clipboard!");
  };

  const getCarPreview = (view: "front" | "side" | "back" | "top") => {
    // Simple SVG car placeholder
    return (
      <svg
        viewBox="0 0 100 60"
        className="w-full h-auto"
        style={{ fill: selectedColor?.hex || "#1a1a1a" }}
      >
        <rect x="10" y="20" width="80" height="20" rx="5" />
        <circle cx="25" cy="45" r="8" fill="#333" />
        <circle cx="75" cy="45" r="8" fill="#333" />
        {view === "side" && (
          <rect x="40" y="10" width="20" height="10" rx="2" />
        )}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleUndo}
              disabled={history.length === 0}
            >
              <Undo className="h-4 w-4 mr-2" />
              Undo
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Design
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <Tabs
          value={currentStep.toString()}
          onValueChange={(v) => setCurrentStep(parseInt(v))}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="1">Car Type</TabsTrigger>
            <TabsTrigger value="2">Color & Finish</TabsTrigger>
            <TabsTrigger value="3">Preview</TabsTrigger>
            <TabsTrigger value="4">Review</TabsTrigger>
          </TabsList>

          <TabsContent value="1" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Car Type</CardTitle>
                <CardDescription>
                  Choose your vehicle type to start customizing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {carTypes.map((car) => (
                    <Button
                      key={car.value}
                      variant={
                        state.carType === car.value ? "default" : "outline"
                      }
                      className="flex flex-col gap-2 p-4 h-auto"
                      onClick={() => handleCarTypeChange(car.value)}
                    >
                      <Car className="h-8 w-8" />
                      <span>{car.label}</span>
                      <Badge variant="secondary">${car.basePrice}</Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="2" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Choose Color & Finish</CardTitle>
                <CardDescription>
                  Select exterior color and paint finish.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Exterior Color</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {colors.map((color) => (
                      <Button
                        key={color.value}
                        variant={
                          state.color === color.value ? "default" : "outline"
                        }
                        className="h-12"
                        style={{ backgroundColor: color.hex }}
                        onClick={() => handleColorChange(color.value)}
                      >
                        <span className="sr-only">{color.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Label>Paint Finish</Label>
                  <Select
                    value={state.finish}
                    onValueChange={handleFinishChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {finishes.map((finish) => (
                        <SelectItem key={finish.value} value={finish.value}>
                          {finish.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="3" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>2D Preview</CardTitle>
                <CardDescription>
                  View your design from multiple angles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Front View</p>
                    {getCarPreview("front")}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Side View</p>
                    {getCarPreview("side")}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Back View</p>
                    {getCarPreview("back")}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Top View</p>
                    {getCarPreview("top")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="4" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Review & Confirm</CardTitle>
                <CardDescription>
                  Summary of your customization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Car Type</Label>
                    <Badge variant="secondary">{selectedCar?.label}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Badge variant="secondary">{selectedColor?.label}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Finish</Label>
                    <Badge variant="secondary">{selectedFinish?.label}</Badge>
                  </div>
                </div>
                <div className="text-2xl font-bold text-center">
                  Total Price: ${state.price}
                </div>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep(3)}>
                    Edit Preview
                  </Button>
                  <Button onClick={handleSave}>Confirm & Send to Shop</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CustomizationPage;
