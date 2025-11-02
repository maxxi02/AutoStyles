"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  DollarSign,
  FileText,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
interface Transaction {
  id: string;
  typeId: string;
  modelId: string;
  colorId: string;
  wheelId: string;
  interiorId: string;
  timestamp: Date;
  price: number;
  status: "saved" | "purchased" | "cancelled";
  paymentVerifiedAt?: Date;
  paymentId?: string;
  assignedAutoworkerId?: string; // NEW
  estimatedCompletionDate?: Date; // NEW
  customizationProgress?: {
    paintCompleted: boolean;
    paintCompletedAt: Date | null;
    wheelsCompleted: boolean;
    wheelsCompletedAt: Date | null;
    interiorCompleted: boolean;
    interiorCompletedAt: Date | null;
    overallStatus: "pending" | "in-progress" | "completed";
  };
  customerDetails?: {
    fullName: string;
    email: string;
    contactNumber: string;
    address: string;
  };
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: Date;
  };
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
  name: string;
  carModelId: string;
  hex: string;
  finish: "Matte" | "Glossy" | "Metallic";
  description?: string;
  price: number;
  inventory?: number;
  imageUrl?: string;
}

interface UserData {
  id: string;
  name?: string;
  email?: string;
  username?: string;
  phone?: string;
  address?: string;
  role?: string;
  photoURL?: string;
}

const StarRating: React.FC<{
  rating: number;
  readonly?: boolean;
}> = ({ rating, readonly = true }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-xl ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const AdminTransactionPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [interiors, setInteriors] = useState<Interior[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [autoworkers, setAutoworkers] = useState<UserData[]>([]);

  useEffect(() => {
    const expectedSnapshots = 6;

    const unsubscribeTransactions = onSnapshot(
      collection(db, "transactions"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            timestamp: docData.timestamp.toDate(),
            paymentVerifiedAt: docData.paymentVerifiedAt?.toDate(),
            estimatedCompletionDate: docData.estimatedCompletionDate?.toDate(),
            customizationProgress: docData.customizationProgress
              ? {
                  ...docData.customizationProgress,
                  paintCompletedAt:
                    docData.customizationProgress.paintCompletedAt?.toDate() ||
                    null,
                  wheelsCompletedAt:
                    docData.customizationProgress.wheelsCompletedAt?.toDate() ||
                    null,
                  interiorCompletedAt:
                    docData.customizationProgress.interiorCompletedAt?.toDate() ||
                    null,
                }
              : undefined,
            feedback: docData.feedback
              ? {
                  ...docData.feedback,
                  submittedAt: docData.feedback.submittedAt?.toDate(),
                }
              : undefined,
          } as Transaction;
        });
        setTransactions(data);
        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === expectedSnapshots) {
            setIsLoading(false);
          }
          return next;
        });
      }
    );

    const unsubscribeCarTypes = onSnapshot(
      collection(db, "carTypes"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as CarType
        );
        setCarTypes(data);
        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === expectedSnapshots) {
            setIsLoading(false);
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
          if (next === expectedSnapshots) {
            setIsLoading(false);
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
          if (next === expectedSnapshots) {
            setIsLoading(false);
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
          if (next === expectedSnapshots) {
            setIsLoading(false);
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
          if (next === expectedSnapshots) {
            setIsLoading(false);
          }
          return next;
        });
      }
    );

    const unsubscribeAutoworkers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as UserData)
          .filter((user) => user.role === "autoworker");
        setAutoworkers(data);
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeCarTypes();
      unsubscribeCarModels();
      unsubscribePaintColors();
      unsubscribeWheels();
      unsubscribeInteriors();
      unsubscribeAutoworkers();
    };
  }, []);

  useEffect(() => {
    if (selectedTransaction && showDetailsModal) {
      const updatedTransaction = transactions.find(
        (t) => t.id === selectedTransaction.id
      );
      if (updatedTransaction) {
        setSelectedTransaction(updatedTransaction);
      }
    }
  }, [transactions, selectedTransaction, showDetailsModal]);

  const calculateProgress = (transaction: Transaction): number => {
    if (!transaction.customizationProgress) return 0;

    const progress = transaction.customizationProgress;
    let completedStages = 0;

    if (progress.paintCompleted) completedStages++;
    if (progress.wheelsCompleted) completedStages++;
    if (progress.interiorCompleted) completedStages++;

    return Math.round((completedStages / 3) * 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage === 0) return "text-gray-500";
    if (percentage < 100) return "text-orange-500";
    return "text-green-600";
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };
  const handleUpdateProgress = async (
    transactionId: string,
    field: "paintCompleted" | "wheelsCompleted" | "interiorCompleted",
    value: boolean
  ) => {
    setIsUpdatingProgress(true);
    try {
      const transactionRef = doc(db, "transactions", transactionId);
      const timestamp = value ? Timestamp.now() : null;

      // Get current progress
      const transaction = transactions.find((t) => t.id === transactionId);
      const currentProgress = transaction?.customizationProgress || {
        paintCompleted: false,
        paintCompletedAt: null,
        wheelsCompleted: false,
        wheelsCompletedAt: null,
        interiorCompleted: false,
        interiorCompletedAt: null,
        overallStatus: "pending" as const,
      };

      // Update the specific field
      const updatedProgress = {
        ...currentProgress,
        [field]: value,
        [`${field.replace("Completed", "CompletedAt")}`]: timestamp,
      };

      // Calculate overall status
      const completedCount = [
        updatedProgress.paintCompleted,
        updatedProgress.wheelsCompleted,
        updatedProgress.interiorCompleted,
      ].filter(Boolean).length;

      let overallStatus: "pending" | "in-progress" | "completed" = "pending";
      if (completedCount === 3) {
        overallStatus = "completed";
      } else if (completedCount > 0) {
        overallStatus = "in-progress";
      }

      updatedProgress.overallStatus = overallStatus;

      await updateDoc(transactionRef, {
        customizationProgress: updatedProgress,
      });

      toast.success("Progress updated successfully!");
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    } finally {
      setIsUpdatingProgress(false);
    }
  };
  const handleAssignAutoworker = async (
    transactionId: string,
    autoworkerId: string
  ) => {
    try {
      await updateDoc(doc(db, "transactions", transactionId), {
        assignedAutoworkerId: autoworkerId,
      });
      toast.success("Autoworker assigned successfully!");
    } catch (error) {
      console.error("Error assigning autoworker:", error);
      toast.error("Failed to assign autoworker");
    }
  };

  const handleSetEstimatedCompletion = async (
    transactionId: string,
    date: Date
  ) => {
    try {
      await updateDoc(doc(db, "transactions", transactionId), {
        estimatedCompletionDate: Timestamp.fromDate(date),
      });
      toast.success("Estimated completion date set!");
    } catch (error) {
      console.error("Error setting completion date:", error);
      toast.error("Failed to set completion date");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  const paidTransactions = transactions.filter(
    (transaction) => transaction.status === "purchased"
  );

  const getAverageFeedbackRating = () => {
    const feedbacks = paidTransactions.filter((t) => t.feedback);
    if (feedbacks.length === 0) return 0;

    const sum = feedbacks.reduce(
      (acc, t) => acc + (t.feedback?.rating || 0),
      0
    );
    return (sum / feedbacks.length).toFixed(1);
  };

  const getTransactionDetails = (transaction: Transaction) => {
    const type = carTypes.find((t) => t.id === transaction.typeId);
    const model = carModels.find((m) => m.id === transaction.modelId);
    const color = paintColors.find((c) => c.id === transaction.colorId);
    const wheel = wheels.find((w) => w.id === transaction.wheelId);
    const interior = interiors.find((i) => i.id === transaction.interiorId);

    return { type, model, color, wheel, interior };
  };

  const totalRevenue = paidTransactions.reduce(
    (sum, transaction) => sum + transaction.price,
    0
  );

  function QuickActions() {
    return (
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Create Transaction</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Online Order</DropdownMenuItem>
            <DropdownMenuItem>Walk-in Customer</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Quick Quote</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  interface StatCardProps {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down";
    icon: React.ReactNode;
  }

  function StatCard({ title, value, change, trend, icon }: StatCardProps) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="text-3xl font-bold text-foreground">{value}</p>
              <div className="flex items-center gap-1 text-sm">
                {trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4 text-accent" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={
                    trend === "up" ? "text-accent" : "text-destructive"
                  }
                >
                  {change}
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function StatsCards() {
    const totalTransactions = paidTransactions.length;
    const pendingCount = transactions.filter(
      (t) => t.status === "saved"
    ).length;
    const completedCount = paidTransactions.length;

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Transactions"
          value={totalTransactions.toString()}
          change="+15%"
          trend="up"
          icon={<FileText className="h-6 w-6" />}
        />
        <StatCard
          title="Pending"
          value={pendingCount.toString()}
          change="-2%"
          trend="down"
          icon={<Clock className="h-6 w-6" />}
        />
        <StatCard
          title="Completed"
          value={completedCount.toString()}
          change="+22%"
          trend="up"
          icon={<CheckCircle2 className="h-6 w-6" />}
        />
        <StatCard
          title="Total Revenue"
          value={`₱${totalRevenue.toLocaleString()}`}
          change="+28%"
          trend="up"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatCard
          title="Avg. Customer Rating"
          value={`${getAverageFeedbackRating()} ★`}
          change={`${paidTransactions.filter((t) => t.feedback).length} reviews`}
          trend="up"
          icon={<CheckCircle2 className="h-6 w-6" />}
        />
      </div>
    );
  }

  const DetailsModal = () => {
    if (!selectedTransaction) return null;

    const { type, model, color, wheel, interior } =
      getTransactionDetails(selectedTransaction);
    const progress = calculateProgress(selectedTransaction);
    const previewImage =
      color?.imageUrl || model?.imageUrl || "/placeholder-car.png";

    const customizationProgress = selectedTransaction.customizationProgress || {
      paintCompleted: false,
      paintCompletedAt: null,
      wheelsCompleted: false,
      wheelsCompletedAt: null,
      interiorCompleted: false,
      interiorCompletedAt: null,
      overallStatus: "pending" as const,
    };

    return (
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              View complete customization and customer information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Information */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">
                    {selectedTransaction.customerDetails?.fullName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {selectedTransaction.customerDetails?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Contact Number
                  </p>
                  <p className="font-medium">
                    {selectedTransaction.customerDetails?.contactNumber ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {selectedTransaction.customerDetails?.address || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Autoworker Assignment - NEW */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg">Work Assignment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">
                    Assigned Autoworker
                  </label>
                  <Select
                    value={selectedTransaction.assignedAutoworkerId || ""}
                    onValueChange={(value) =>
                      handleAssignAutoworker(selectedTransaction.id, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select autoworker" />
                    </SelectTrigger>
                    <SelectContent>
                      {autoworkers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name || worker.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">
                    Estimated Completion
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border rounded-md"
                    value={
                      selectedTransaction.estimatedCompletionDate
                        ? format(
                            selectedTransaction.estimatedCompletionDate,
                            "yyyy-MM-dd'T'HH:mm"
                          )
                        : ""
                    }
                    onChange={(e) =>
                      handleSetEstimatedCompletion(
                        selectedTransaction.id,
                        new Date(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
              {selectedTransaction.assignedAutoworkerId && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="text-sm">
                    <span className="font-medium">Assigned to:</span>{" "}
                    {autoworkers.find(
                      (w) => w.id === selectedTransaction.assignedAutoworkerId
                    )?.name || "Unknown"}
                  </p>
                  {selectedTransaction.estimatedCompletionDate && (
                    <p className="text-sm text-muted-foreground">
                      Expected by:{" "}
                      {format(
                        selectedTransaction.estimatedCompletionDate,
                        "MMM dd, yyyy HH:mm"
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Vehicle Preview */}
            <div className="border rounded-lg overflow-hidden">
              <Image
                src={previewImage}
                alt={`${model?.name} Preview`}
                className="w-full h-64 object-cover"
                width={800}
                height={400}
              />
            </div>

            {/* Customization Details */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg">Customization Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{type?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{model?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Exterior Color:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color?.hex || "#000000" }}
                    />
                    <span className="font-medium">
                      {color?.name} ({color?.finish})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wheels:</span>
                  <span className="font-medium">{wheel?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Interior:</span>
                  <div className="flex items-center gap-2">
                    {interior?.hex && (
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: interior.hex }}
                      />
                    )}
                    <span className="font-medium">
                      {interior?.name || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Tracking */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  Customization Progress
                </h3>
                <Badge
                  variant={
                    customizationProgress.overallStatus === "completed"
                      ? "default"
                      : customizationProgress.overallStatus === "in-progress"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {customizationProgress.overallStatus.toUpperCase()}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3">
                <span
                  className={`text-2xl font-bold ${getProgressColor(progress)}`}
                >
                  {progress}%
                </span>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      progress === 0
                        ? "bg-gray-400"
                        : progress < 100
                          ? "bg-orange-500"
                          : "bg-green-600"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              {/* Timeline */}
              <div className="space-y-3 mt-4">
                {/* Paint Progress */}
                <div className="flex items-start gap-3 p-3 border rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium flex items-center gap-2">
                        Exterior Paint/Color
                        {customizationProgress.paintCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </label>
                      <Button
                        size="sm"
                        variant={
                          customizationProgress.paintCompleted
                            ? "outline"
                            : "default"
                        }
                        onClick={() =>
                          handleUpdateProgress(
                            selectedTransaction.id,
                            "paintCompleted",
                            !customizationProgress.paintCompleted
                          )
                        }
                        disabled={isUpdatingProgress}
                      >
                        {customizationProgress.paintCompleted
                          ? "Mark Incomplete"
                          : "Mark Complete"}
                      </Button>
                    </div>
                    {customizationProgress.paintCompleted &&
                      customizationProgress.paintCompletedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed:{" "}
                          {format(
                            customizationProgress.paintCompletedAt,
                            "MMM dd, yyyy HH:mm"
                          )}
                        </p>
                      )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {color?.name} ({color?.finish})
                    </p>
                  </div>
                </div>

                {/* Wheels Progress */}
                <div className="flex items-start gap-3 p-3 border rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium flex items-center gap-2">
                        Wheels Installation
                        {customizationProgress.wheelsCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </label>
                      <Button
                        size="sm"
                        variant={
                          customizationProgress.wheelsCompleted
                            ? "outline"
                            : "default"
                        }
                        onClick={() =>
                          handleUpdateProgress(
                            selectedTransaction.id,
                            "wheelsCompleted",
                            !customizationProgress.wheelsCompleted
                          )
                        }
                        disabled={isUpdatingProgress}
                      >
                        {customizationProgress.wheelsCompleted
                          ? "Mark Incomplete"
                          : "Mark Complete"}
                      </Button>
                    </div>
                    {customizationProgress.wheelsCompleted &&
                      customizationProgress.wheelsCompletedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed:{" "}
                          {format(
                            new Date(customizationProgress.wheelsCompletedAt),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </p>
                      )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {wheel?.name}
                    </p>
                  </div>
                </div>

                {/* Interior Progress */}
                <div className="flex items-start gap-3 p-3 border rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium flex items-center gap-2">
                        Interior Customization
                        {customizationProgress.interiorCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </label>
                      <Button
                        size="sm"
                        variant={
                          customizationProgress.interiorCompleted
                            ? "outline"
                            : "default"
                        }
                        onClick={() =>
                          handleUpdateProgress(
                            selectedTransaction.id,
                            "interiorCompleted",
                            !customizationProgress.interiorCompleted
                          )
                        }
                        disabled={isUpdatingProgress}
                      >
                        {customizationProgress.interiorCompleted
                          ? "Mark Incomplete"
                          : "Mark Complete"}
                      </Button>
                    </div>
                    {customizationProgress.interiorCompleted &&
                      customizationProgress.interiorCompletedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed:{" "}
                          {format(
                            new Date(customizationProgress.interiorCompletedAt),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </p>
                      )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {interior?.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Feedback Section - NEW */}
            {selectedTransaction.feedback && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Client Feedback</h3>
                  <Badge variant="default">Received</Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Rating</p>
                    <StarRating rating={selectedTransaction.feedback.rating} />
                  </div>

                  {selectedTransaction.feedback.comment && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Comment
                      </p>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm">
                          {selectedTransaction.feedback.comment}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Submitted:{" "}
                      {format(
                        selectedTransaction.feedback.submittedAt,
                        "MMM dd, yyyy HH:mm"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Total Amount</h3>
              <p className="text-2xl font-bold">
                ₱{selectedTransaction.price.toLocaleString()}
              </p>
              {selectedTransaction.paymentVerifiedAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  Paid:{" "}
                  {format(
                    selectedTransaction.paymentVerifiedAt,
                    "MMM dd, yyyy"
                  )}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  function TransactionsTable() {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">
                All Transactions
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage and track customer orders
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  Customer
                </TableHead>
                <TableHead className="text-muted-foreground">Contact</TableHead>
                <TableHead className="text-muted-foreground">Model</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">
                  Progress
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Feedback
                </TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-right text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paidTransactions.map((transaction) => {
                const details = getTransactionDetails(transaction);
                const progress = calculateProgress(transaction);

                return (
                  <TableRow key={transaction.id} className="border-border">
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {transaction.customerDetails?.fullName || "N/A"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.customerDetails?.email || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      <div className="text-sm text-muted-foreground">
                        {transaction.customerDetails?.contactNumber || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-normal">
                        {transaction.customerDetails?.address || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {details.model?.name || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      ₱{transaction.price.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${getProgressColor(progress)}`}
                        >
                          {progress}%
                        </span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              progress === 0
                                ? "bg-gray-400"
                                : progress < 100
                                  ? "bg-orange-500"
                                  : "bg-green-600"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(transaction.timestamp, "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewDetails(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.feedback ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">
                            {transaction.feedback.rating}/5
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <QuickActions />
        </div>

        <StatsCards />

        <TransactionsTable />

        <DetailsModal />
      </main>
    </div>
  );
};

export default AdminTransactionPage;
