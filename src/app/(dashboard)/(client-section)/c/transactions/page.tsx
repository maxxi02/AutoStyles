"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface Transaction {
  id: string;
  typeId: string;
  modelId: string;
  colorId: string;
  wheelId: string;
  interiorId: string;
  timestamp: Date;
  price: number;
  status: "saved" | "booked" | "paid" | "cancelled";
}

const CustomEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
  onSave: () => void;
}> = ({ isOpen, onClose, title, description, children, onSave }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-transparent bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />
        <div className="relative transform rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
          <div className="dark:bg-accent px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-accent-foreground">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-accent-foreground">{description}</p>
                </div>
                <div className="mt-4 max-h-[60vh] overflow-y-auto">{children}</div>
              </div>
            </div>
          </div>
          <div className="bg-accent px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <Button type="button" className="sm:ml-3" onClick={onSave}>
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              className="mt-3 sm:mt-0"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientTransaction: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [interiors, setInteriors] = useState<Interior[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [editTypeId, setEditTypeId] = useState<string>("");
  const [editModelId, setEditModelId] = useState<string>("");
  const [editColorId, setEditColorId] = useState<string>("");
  const [editWheelId, setEditWheelId] = useState<string>("");
  const [editInteriorId, setEditInteriorId] = useState<string>("");

  useEffect(() => {
    const unsubscribeTransactions = onSnapshot(
      collection(db, "transactions"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate(),
            }) as Transaction
        );
        setTransactions(data);
      }
    );

    const unsubscribeCarTypes = onSnapshot(
      collection(db, "carTypes"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as CarType
        );
        setCarTypes(data);
      }
    );

    const unsubscribeCarModels = onSnapshot(
      collection(db, "carModels"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as CarModel
        );
        setCarModels(data);
      }
    );

    const unsubscribePaintColors = onSnapshot(
      collection(db, "paintColors"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as PaintColor
        );
        setPaintColors(data);
      }
    );

    const unsubscribeWheels = onSnapshot(
      collection(db, "wheels"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Wheel
        );
        setWheels(data);
      }
    );

    const unsubscribeInteriors = onSnapshot(
      collection(db, "interiors"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Interior
        );
        setInteriors(data);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeCarTypes();
      unsubscribeCarModels();
      unsubscribePaintColors();
      unsubscribeWheels();
      unsubscribeInteriors();
    };
  }, []);

  // Edit modal filtered data
  const filteredEditModels = carModels.filter(
    (model) => model.carTypeId === editTypeId
  );
  const filteredEditColors = paintColors.filter(
    (color) => color.carModelId === editModelId
  );
  const filteredEditWheels = wheels.filter(
    (wheel) => wheel.carModelId === editModelId
  );
  const filteredEditInteriors = interiors.filter(
    (interior) => interior.carModelId === editModelId
  );

  // Reset dependents on type change
  useEffect(() => {
    setEditModelId("");
    if (filteredEditModels.length > 0) {
      setEditModelId(filteredEditModels[0].id);
    }
  }, [editTypeId]);

  // Reset on model change
  useEffect(() => {
    setEditColorId("");
    setEditWheelId("");
    setEditInteriorId("");
    if (filteredEditColors.length > 0) {
      setEditColorId(filteredEditColors[0].id);
    }
    if (filteredEditWheels.length > 0) {
      setEditWheelId(filteredEditWheels[0].id);
    }
    if (filteredEditInteriors.length > 0) {
      setEditInteriorId(filteredEditInteriors[0].id);
    }
  }, [editModelId]);

  const getTransactionDetails = (transaction: Transaction) => {
    const type = carTypes.find((t) => t.id === transaction.typeId);
    const model = carModels.find((m) => m.id === transaction.modelId);
    const color = paintColors.find((c) => c.id === transaction.colorId);
    const wheel = wheels.find((w) => w.id === transaction.wheelId);
    const interior = interiors.find((i) => i.id === transaction.interiorId);

    return { type, model, color, wheel, interior };
  };

  const handleBookAppointment = async () => {
    if (!selectedTransaction || !appointmentDate) {
      toast.error("Please select a date.");
      return;
    }
    try {
      // Save appointment
      await addDoc(collection(db, "appointments"), {
        transactionId: selectedTransaction.id,
        appointmentDate: new Date(appointmentDate),
        status: "scheduled" as const,
        timestamp: new Date(),
      });

      // Update transaction status
      await updateDoc(doc(db, "transactions", selectedTransaction.id), {
        status: "booked" as const,
      });

      toast.success("Appointment booked successfully!");
      setIsDialogOpen(false);
      setAppointmentDate("");
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Failed to book appointment");
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditTypeId(transaction.typeId);
    setEditModelId(transaction.modelId);
    setEditColorId(transaction.colorId);
    setEditWheelId(transaction.wheelId);
    setEditInteriorId(transaction.interiorId);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (
      !editTypeId ||
      !editModelId ||
      !editColorId ||
      !editWheelId ||
      !editInteriorId
    ) {
      toast.error("Please select all customizations.");
      return;
    }
    try {
      const editModel = carModels.find((m) => m.id === editModelId);
      const editColor = paintColors.find((c) => c.id === editColorId);
      const editWheel = wheels.find((w) => w.id === editWheelId);
      const editInterior = interiors.find((i) => i.id === editInteriorId);
      const newPrice =
        (editModel?.basePrice ?? 0) +
        (editColor?.price ?? 0) +
        (editWheel?.price ?? 0) +
        (editInterior?.price ?? 0);

      await updateDoc(doc(db, "transactions", selectedTransaction!.id), {
        typeId: editTypeId,
        modelId: editModelId,
        colorId: editColorId,
        wheelId: editWheelId,
        interiorId: editInteriorId,
        price: newPrice,
      });

      // Update local state for immediate UI update
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === selectedTransaction!.id
            ? {
                ...t,
                typeId: editTypeId,
                modelId: editModelId,
                colorId: editColorId,
                wheelId: editWheelId,
                interiorId: editInteriorId,
                price: newPrice,
              }
            : t
        )
      );

      toast.success("Transaction updated successfully!");
      setIsEditOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
    }
  };

  const handleCancel = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsCancelOpen(true);
  };

  const confirmCancel = async () => {
    if (!selectedTransaction) return;
    try {
      await updateDoc(doc(db, "transactions", selectedTransaction.id), {
        status: "cancelled" as const,
      });

      // Update local state for immediate UI update
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === selectedTransaction.id ? { ...t, status: "cancelled" } : t
        )
      );

      toast.success("Transaction cancelled!");
      setIsCancelOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Error cancelling transaction:", error);
      toast.error("Failed to cancel transaction");
    }
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setSelectedTransaction(null);
  };

  // Calculate edit price
  const editModel = carModels.find((m) => m.id === editModelId);
  const editColor = paintColors.find((c) => c.id === editColorId);
  const editWheel = wheels.find((w) => w.id === editWheelId);
  const editInterior = interiors.find((i) => i.id === editInteriorId);
  const editPrice =
    (editModel?.basePrice ?? 0) +
    (editColor?.price ?? 0) +
    (editWheel?.price ?? 0) +
    (editInterior?.price ?? 0);

  const editModalContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Car Type</Label>
        <Select value={editTypeId} onValueChange={setEditTypeId}>
          <SelectTrigger className="w-full">
            <SelectValue className="truncate" />
          </SelectTrigger>
          <SelectContent>
            {carTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                <div className="flex justify-between items-center w-full">
                  <span className="truncate flex-1">{type.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Model</Label>
        <Select
          value={editModelId}
          onValueChange={setEditModelId}
          disabled={filteredEditModels.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue className="truncate" />
          </SelectTrigger>
          <SelectContent>
            {filteredEditModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex justify-between items-center w-full">
                  <span className="truncate flex-1">{model.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    ₱{(model.basePrice || 0).toLocaleString()}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Exterior Color</Label>
        <Select
          value={editColorId}
          onValueChange={setEditColorId}
          disabled={filteredEditColors.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue className="truncate" />
          </SelectTrigger>
          <SelectContent>
            {filteredEditColors.map((color) => (
              <SelectItem key={color.id} value={color.id}>
                <div className="flex justify-between items-center w-full">
                  <span className="truncate flex-1">
                    {color.name} ({color.finish})
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    ₱{color.price.toLocaleString()}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Wheels</Label>
        <Select
          value={editWheelId}
          onValueChange={setEditWheelId}
          disabled={filteredEditWheels.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue className="truncate" />
          </SelectTrigger>
          <SelectContent>
            {filteredEditWheels.map((wheel) => (
              <SelectItem key={wheel.id} value={wheel.id}>
                <div className="flex justify-between items-center w-full">
                  <span className="truncate flex-1">{wheel.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    ₱{wheel.price.toLocaleString()}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Interior</Label>
        <Select
          value={editInteriorId}
          onValueChange={setEditInteriorId}
          disabled={filteredEditInteriors.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue className="truncate" />
          </SelectTrigger>
          <SelectContent>
            {filteredEditInteriors.map((interior) => (
              <SelectItem key={interior.id} value={interior.id}>
                <div className="flex justify-between items-center w-full">
                  <span className="truncate flex-1">{interior.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    ₱{interior.price.toLocaleString()}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {editPrice > 0 && (
        <div className="p-3 bg-muted rounded-md">
          <p className="text-lg font-bold">
            Total Price: ₱{editPrice.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Transactions</h1>
      <div className="space-y-6">
        {transactions
          .filter((t) => t.status === "saved")
          .map((transaction) => {
            const { type, model, color, wheel, interior } =
              getTransactionDetails(transaction);
            return (
              <Card key={transaction.id}>
                <CardHeader>
                  <CardTitle>{model?.name || "Custom Design"}</CardTitle>
                  <CardDescription>
                    {type?.name} | Saved on{" "}
                    {transaction.timestamp?.toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p>
                      <strong>Car Type:</strong> {type?.name}
                    </p>
                    <p>
                      <strong>Model:</strong> {model?.name}
                    </p>
                    <p>
                      <strong>Exterior Color:</strong> {color?.name} (
                      {color?.finish})
                    </p>
                    <p>
                      <strong>Wheels:</strong> {wheel?.name}
                    </p>
                    <p>
                      <strong>Interior:</strong> {interior?.name}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <h3 className="font-medium mb-2">Receipt</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        Base Price: ₱{(model?.basePrice || 0).toLocaleString()}
                      </p>
                      <p>Color: ₱{(color?.price || 0).toLocaleString()}</p>
                      <p>Wheels: ₱{(wheel?.price || 0).toLocaleString()}</p>
                      <p>
                        Interior: ₱{(interior?.price || 0).toLocaleString()}
                      </p>
                      <p className="font-bold border-t pt-1">
                        Total: ₱{transaction.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-start space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(transaction)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancel(transaction)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setIsDialogOpen(true);
                    }}
                  >
                    Pay & Book Appointment
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
      </div>

      {/* Appointment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Select a date for your appointment to finalize the payment and
              customization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="appointmentDate">Appointment Date</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookAppointment}>Confirm & Pay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Edit Modal */}
      <CustomEditModal
        isOpen={isEditOpen}
        onClose={closeEditModal}
        title="Edit Customization"
        description="Modify your selected options."
        onSave={handleSaveEdit}
      >
        {editModalContent}
      </CustomEditModal>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              No, Keep It
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {transactions.filter((t) => t.status === "saved").length === 0 && (
        <p className="text-center text-muted-foreground mt-8">
          No active transactions.
        </p>
      )}
    </div>
  );
};

export default ClientTransaction;