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
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  DollarSign,
  FileText,
  Loader2,
  Search,
  Trash2,
  Calendar,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  deleteDoc,
} from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
interface Transaction {
  id: string;
  typeId: string;
  modelId: string;
  colorId?: string;
  wheelId?: string;
  interiorId?: string;
  timestamp: Date;
  price: number;
  status: "saved" | "purchased" | "cancelled";
  paymentVerifiedAt?: Date;
  paymentId?: string;
  assignedAutoworkerId?: string;
  estimatedCompletionDate?: Date;
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
interface Appointment {
  id: string;
  transactionId: string;
  date: string;
  time: string;
  status: string;
  timestamp: Date;
  paymentStatus?: "pending" | "paid";
  paidAt?: Date;
  paymentId?: string;
  cancelledAt?: Date;
  refundStatus?: "processed" | "failed";
  refundAmount?: number;
  refundId?: string;
  deductionAmount?: number;
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [appointmentToRefund, setAppointmentToRefund] =
    useState<Appointment | null>(null);
  useEffect(() => {
    const expectedSnapshots = 7;
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
    const unsubscribeAppointments = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp.toDate(),
              paidAt: doc.data().paidAt?.toDate(),
            }) as Appointment
        );
        setAppointments(data);
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
      unsubscribeAppointments();
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
  const getFilteredTransactions = () => {
    if (!searchQuery) return transactions;
    const searchLower = searchQuery.toLowerCase();
    return transactions.filter((transaction) => {
      const { type, model, color, wheel, interior } =
        getTransactionDetails(transaction);
      const fullName =
        transaction.customerDetails?.fullName?.toLowerCase() || "";
      const modelName = model?.name?.toLowerCase() || "";
      const typeName = type?.name?.toLowerCase() || "";
      const colorName = color?.name?.toLowerCase() || "";
      const wheelName = wheel?.name?.toLowerCase() || "";
      const interiorName = interior?.name?.toLowerCase() || "";
      const status = transaction.status.toLowerCase();
      const dateStr = format(
        transaction.timestamp,
        "MMM dd, yyyy HH:mm"
      ).toLowerCase();
      const priceStr = transaction.price.toString();
      return (
        fullName.includes(searchLower) ||
        modelName.includes(searchLower) ||
        typeName.includes(searchLower) ||
        colorName.includes(searchLower) ||
        wheelName.includes(searchLower) ||
        interiorName.includes(searchLower) ||
        status.includes(searchLower) ||
        dateStr.includes(searchLower) ||
        priceStr.includes(searchLower)
      );
    });
  };
  const getTransactionDetails = (transaction: Transaction) => {
    const type = carTypes.find((t) => t.id === transaction.typeId);
    const model = carModels.find((m) => m.id === transaction.modelId);
    const color = paintColors.find((c) => c.id === transaction.colorId || "");
    const wheel = wheels.find((w) => w.id === transaction.wheelId || "");
    const interior = interiors.find(
      (i) => i.id === transaction.interiorId || ""
    );
    return { type, model, color, wheel, interior };
  };
  const getTransactionAppointments = (transactionId: string) => {
    return appointments.filter((apt) => apt.transactionId === transactionId);
  };
  const getFilteredAndSortedAppointments = (transactionId: string) => {
    const filtered = getTransactionAppointments(transactionId);
    return filtered.sort((a, b) => {
      if (a.status === "cancelled" && b.status !== "cancelled") return 1;
      if (b.status === "cancelled" && a.status !== "cancelled") return -1;
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  };
  const calculateProgress = (transaction: Transaction): number => {
    if (!transaction.customizationProgress) return 0;
    const progress = transaction.customizationProgress;
    let completedStages = 0;
    let totalStages = 0;
    if (transaction.colorId) {
      totalStages++;
      if (progress.paintCompleted) completedStages++;
    }
    if (transaction.wheelId) {
      totalStages++;
      if (progress.wheelsCompleted) completedStages++;
    }
    if (transaction.interiorId) {
      totalStages++;
      if (progress.interiorCompleted) completedStages++;
    }
    return totalStages > 0
      ? Math.round((completedStages / totalStages) * 100)
      : 0;
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
      const updatedProgress = {
        ...currentProgress,
        [field]: value,
        [`${field}At`]: timestamp,
      };
      const completedCount = [
        updatedProgress.paintCompleted && transaction?.colorId,
        updatedProgress.wheelsCompleted && transaction?.wheelId,
        updatedProgress.interiorCompleted && transaction?.interiorId,
      ].filter(Boolean).length;
      const totalStages = [
        transaction?.colorId,
        transaction?.wheelId,
        transaction?.interiorId,
      ].filter(Boolean).length;
      let overallStatus: "pending" | "in-progress" | "completed" = "pending";
      if (totalStages > 0 && completedCount === totalStages) {
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
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointmentId(appointment.id);
    setEditDate(appointment.date);
    setEditTime(appointment.time);
  };
  const handleSaveEdit = async () => {
    if (!editingAppointmentId || !editDate || !editTime) {
      toast.error("Please select date and time.");
      return;
    }
    try {
      await updateDoc(doc(db, "appointments", editingAppointmentId), {
        date: editDate,
        time: editTime,
      });
      toast.success("Appointment updated successfully!");
      setEditingAppointmentId(null);
      setEditDate("");
      setEditTime("");
    } catch (error) {
      toast.error("Failed to update appointment");
      console.error(error);
    }
  };
  const handleCancelEdit = () => {
    setEditingAppointmentId(null);
    setEditDate("");
    setEditTime("");
  };
  const handleCancelAppointment = async (appointmentId: string) => {
    const appointment = appointments.find((apt) => apt.id === appointmentId);
    if (!appointment) return;
    if (appointment.paymentStatus === "paid") {
      const loadingToast = toast.loading("Processing refund...");
      try {
        const response = await fetch("/api/appointments/cancel-with-refund", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId,
            transactionId: appointment.transactionId,
          }),
        });
        const data = await response.json();
        toast.dismiss(loadingToast);
        if (response.ok) {
          toast.success(
            `Appointment cancelled. Refund of ₱${data.refundAmount.toLocaleString()} processed (₱${data.deductionAmount.toLocaleString()} processing fee deducted).`
          );
        } else {
          toast.error(data.error || "Failed to process refund");
        }
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error("Network error during refund processing");
        console.error(error);
      }
    } else {
      try {
        await updateDoc(doc(db, "appointments", appointmentId), {
          status: "cancelled",
          cancelledAt: new Date(),
        });
        toast.success("Appointment cancelled successfully!");
      } catch (error) {
        toast.error("Failed to cancel appointment");
        console.error(error);
      }
    }
  };
  const handleRefundConfirm = async () => {
    if (!appointmentToRefund) return;
    await handleCancelAppointment(appointmentToRefund.id);
    setShowRefundModal(false);
    setAppointmentToRefund(null);
  };
  const handleRefundCancel = () => {
    setShowRefundModal(false);
    setAppointmentToRefund(null);
  };
  const handleDeleteAppointment = async (
    appointmentId: string,
    paymentStatus: string | undefined
  ) => {
    if (paymentStatus === "paid") {
      toast.error("Cannot delete a paid appointment.");
      return;
    }
    try {
      await deleteDoc(doc(db, "appointments", appointmentId));
      toast.success("Appointment deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete appointment");
      console.error(error);
    }
  };
  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedTransaction(null);
    setEditingAppointmentId(null);
    setEditDate("");
    setEditTime("");
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
  const totalRevenue = paidTransactions.reduce(
    (sum, transaction) => sum + transaction.price,
    0
  );
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
    const totalTransactions = transactions.length;
    const pendingCount = transactions.filter(
      (t) => t.status === "saved"
    ).length;
    const completedCount = paidTransactions.filter(
      (t) => t.customizationProgress?.overallStatus === "completed"
    ).length;
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
    const hasActiveAppointment = getTransactionAppointments(
      selectedTransaction.id
    ).some((apt) => apt.status !== "cancelled");
    const hasAssignedWorker = !!selectedTransaction.assignedAutoworkerId;
    return (
      <Dialog open={showDetailsModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Manage transaction, appointments, and progress
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
            {/* Work Assignment */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg">Work Assignment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground block mb-2">
                    Assigned Autoworker
                  </Label>
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
                  <Label className="text-sm text-muted-foreground block mb-2">
                    Estimated Completion
                  </Label>
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
              {!hasAssignedWorker && (
                <p className="text-sm text-destructive mt-2">
                  Please assign an autoworker to update progress.
                </p>
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
              <div className="space-y-3">
                {selectedTransaction.colorId && color ? (
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
                          disabled={
                            isUpdatingProgress ||
                            (!hasAssignedWorker &&
                              !customizationProgress.paintCompleted)
                          }
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
                ) : (
                  <div className="flex items-start gap-3 p-3 border rounded-md bg-muted/30">
                    <div className="flex-1">
                      <label className="font-medium">
                        Exterior Paint/Color
                      </label>
                      <p className="text-sm text-muted-foreground mt-1">
                        N/A - Not selected
                      </p>
                    </div>
                  </div>
                )}
                {selectedTransaction.wheelId && wheel ? (
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
                          disabled={
                            isUpdatingProgress ||
                            (!hasAssignedWorker &&
                              !customizationProgress.wheelsCompleted)
                          }
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
                              customizationProgress.wheelsCompletedAt,
                              "MMM dd, yyyy HH:mm"
                            )}
                          </p>
                        )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {wheel?.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 border rounded-md bg-muted/30">
                    <div className="flex-1">
                      <label className="font-medium">Wheels Installation</label>
                      <p className="text-sm text-muted-foreground mt-1">
                        N/A - Not selected
                      </p>
                    </div>
                  </div>
                )}
                {selectedTransaction.interiorId && interior ? (
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
                          disabled={
                            isUpdatingProgress ||
                            (!hasAssignedWorker &&
                              !customizationProgress.interiorCompleted)
                          }
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
                              customizationProgress.interiorCompletedAt,
                              "MMM dd, yyyy HH:mm"
                            )}
                          </p>
                        )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {interior?.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 border rounded-md bg-muted/30">
                    <div className="flex-1">
                      <label className="font-medium">
                        Interior Customization
                      </label>
                      <p className="text-sm text-muted-foreground mt-1">
                        N/A - Not selected
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Appointments */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Appointments</h4>
                <Badge variant="outline">
                  {getTransactionAppointments(selectedTransaction.id).length}{" "}
                  Total
                </Badge>
              </div>
              <div className="space-y-2">
                {getFilteredAndSortedAppointments(selectedTransaction.id).map(
                  (apt) => {
                    const appointmentDateTime = new Date(
                      `${apt.date}T${apt.time}`
                    );
                    const isUpcoming =
                      appointmentDateTime > new Date() &&
                      apt.status !== "cancelled";
                    const isPast =
                      appointmentDateTime < new Date() &&
                      apt.status !== "cancelled";
                    const isCompleted = isPast;
                    return (
                      <div
                        key={apt.id}
                        className={`p-3 border rounded-md space-y-3 ${
                          isUpcoming ? "border-primary/50 bg-primary/5" : ""
                        } ${isPast ? "opacity-60" : ""}`}
                      >
                        {editingAppointmentId === apt.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="edit-date">Date</Label>
                                <Input
                                  id="edit-date"
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                  min={new Date().toISOString().split("T")[0]}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-time">Time</Label>
                                <Input
                                  id="edit-time"
                                  type="time"
                                  value={editTime}
                                  onChange={(e) => setEditTime(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveEdit}
                                size="sm"
                                className="flex-1"
                              >
                                Save Changes
                              </Button>
                              <Button
                                onClick={handleCancelEdit}
                                size="sm"
                                variant="outline"
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 mt-1" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">
                                      {format(
                                        new Date(apt.date),
                                        "MMM dd, yyyy"
                                      )}{" "}
                                      at {apt.time}
                                    </p>
                                    {isUpcoming && (
                                      <Badge
                                        variant="default"
                                        className="text-xs"
                                      >
                                        Upcoming
                                      </Badge>
                                    )}
                                    {isPast && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        Past
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Status: {apt.status}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant={
                                  apt.paymentStatus === "paid"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {apt.paymentStatus === "paid" ? (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Paid
                                  </span>
                                ) : (
                                  "Pending Payment"
                                )}
                              </Badge>
                            </div>
                            {apt.status !== "cancelled" && (
                              <div className="flex gap-2">
                                {apt.paymentStatus !== "paid" && !isCompleted && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditAppointment(apt)}
                                      className="flex-1"
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteAppointment(
                                          apt.id,
                                          apt.paymentStatus
                                        )
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                                {!isCompleted && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      if (apt.paymentStatus === "paid") {
                                        const appointmentDateTime = new Date(
                                          `${apt.date}T${apt.time}`
                                        );
                                        const now = new Date();
                                        const hoursDifference =
                                          (appointmentDateTime.getTime() -
                                            now.getTime()) /
                                          (1000 * 60 * 60);
                                        if (
                                          hoursDifference < 24 &&
                                          appointmentDateTime > now
                                        ) {
                                          toast.error(
                                            "Cannot cancel within 24 hours of appointment time"
                                          );
                                          return;
                                        }
                                        setAppointmentToRefund(apt);
                                        setShowRefundModal(true);
                                      } else {
                                        handleCancelAppointment(apt.id);
                                      }
                                    }}
                                    className={
                                      apt.paymentStatus === "paid"
                                        ? "w-full"
                                        : "flex-1"
                                    }
                                  >
                                    Cancel{" "}
                                    {apt.paymentStatus === "paid" &&
                                      "(with Refund)"}
                                  </Button>
                                )}
                              </div>
                            )}
                            {apt.status === "cancelled" && (
                              <div className="space-y-2">
                                <Badge
                                  variant="secondary"
                                  className="w-full justify-center"
                                >
                                  Cancelled
                                </Badge>
                                {apt.refundAmount && (
                                  <div className="text-xs text-center space-y-1 p-2 bg-muted rounded">
                                    <p className="text-green-600 font-medium">
                                      Refunded: ₱
                                      {apt.refundAmount.toLocaleString()}
                                    </p>
                                    {apt.deductionAmount && (
                                      <p className="text-muted-foreground">
                                        Processing Fee: ₱
                                        {apt.deductionAmount.toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            {isCompleted && (
                              <div className="text-xs text-muted-foreground text-center">
                                Appointment completed.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
            {/* Client Feedback */}
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
            <Button variant="outline" onClick={handleCloseModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  function TransactionsTable() {
    const filteredTransactions = getFilteredTransactions();
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
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by customer, model, status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
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
                <TableHead className="text-muted-foreground">Status</TableHead>
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
              {filteredTransactions.map((transaction) => {
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
                      <Badge
                        variant={
                          transaction.status === "purchased"
                            ? "default"
                            : transaction.status === "saved"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {transaction.status.toUpperCase()}
                      </Badge>
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
        <StatsCards />
        <TransactionsTable />
        <DetailsModal />
        {/* Refund Confirmation Modal */}
        <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Cancellation with Refund</DialogTitle>
              <DialogDescription>
                {appointmentToRefund &&
                  (() => {
                    const transaction = transactions.find(
                      (t) => t.id === appointmentToRefund.transactionId
                    );
                    if (!transaction) return <p>Transaction not found.</p>;
                    const refundAmount = transaction.price * 0.98;
                    const deductionAmount = transaction.price * 0.02;
                    const appointmentDateTime = new Date(
                      `${appointmentToRefund.date}T${appointmentToRefund.time}`
                    );
                    const now = new Date();
                    const hoursDifference =
                      (appointmentDateTime.getTime() - now.getTime()) /
                      (1000 * 60 * 60);
                    if (hoursDifference < 24 && appointmentDateTime > now) {
                      return (
                        <p>
                          Cannot cancel within 24 hours of appointment time.
                        </p>
                      );
                    }
                    return (
                      <>
                        <p>
                          This appointment is paid. Cancelling will process a
                          refund of ₱{refundAmount.toLocaleString()} (98% of the
                          payment) with a 2% processing fee ( ₱
                          {deductionAmount.toLocaleString()}).
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Do you want to proceed?
                        </p>
                      </>
                    );
                  })()}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleRefundCancel}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRefundConfirm}>
                Proceed with Refund
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
export default AdminTransactionPage;