"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  DollarSign,
  Calendar,
  CheckCircle2,
  Trash2,
  Search,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface Transaction {
  id: string;
  userId?: string;
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
  customerDetails?: {
    fullName: string;
    email: string;
    contactNumber: string;
    address: string;
  };
  customizationProgress?: {
    paintCompleted: boolean;
    paintCompletedAt: Date | null;
    wheelsCompleted: boolean;
    wheelsCompletedAt: Date | null;
    interiorCompleted: boolean;
    interiorCompletedAt: Date | null;
    overallStatus: "pending" | "in-progress" | "completed";
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

const StarRating: React.FC<{
  rating: number;
  onRatingChange: (rating: number) => void;
  readonly?: boolean;
}> = ({ rating, onRatingChange, readonly = false }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRatingChange(star)}
          disabled={readonly}
          className={`text-2xl transition-colors ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          } ${!readonly && "hover:text-yellow-300 cursor-pointer"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const ClientsTransactionPage: React.FC = () => {
  // feedback functions
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackTransactionId, setFeedbackTransactionId] = useState<
    string | null
  >(null);
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [interiors, setInteriors] = useState<Interior[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [showModal, setShowModal] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [verifyingTransactionId, setVerifyingTransactionId] = useState<
    string | null
  >(null);
  const searchParams = useSearchParams();
  const verificationAttempted = useRef<Set<string>>(new Set());

  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [appointmentToRefund, setAppointmentToRefund] =
    useState<Appointment | null>(null);

  // Load data from Firestore
  useEffect(() => {
    const expectedSnapshots = 7; // transactions + appointments + 5 others

    // Load transactions
    const q = query(
      collection(db, "transactions"),
      orderBy("timestamp", "desc")
    );
    const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          timestamp: docData.timestamp.toDate(),
          paymentVerifiedAt: docData.paymentVerifiedAt?.toDate(),
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
      console.log("Transactions updated, count:", data.length);

      setSnapshotCount((prev) => {
        const next = prev + 1;
        if (next === expectedSnapshots) {
          setIsDataLoading(false);
        }
        return next;
      });
    });

    // Load appointments
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
            setIsDataLoading(false);
          }
          return next;
        });
      }
    );

    // Load supporting data (same as CustomizationPage)
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
          if (next === expectedSnapshots) {
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
          if (next === expectedSnapshots) {
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
          if (next === expectedSnapshots) {
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
          if (next === expectedSnapshots) {
            setIsDataLoading(false);
          }
          return next;
        });
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
    };
  }, []);

  useEffect(() => {
    const success = searchParams.get("success");
    const cancelled = searchParams.get("cancelled");
    const tid = searchParams.get("tid");

    // Only process if we have valid params and haven't attempted verification
    if (!tid || verificationAttempted.current.has(tid)) {
      return;
    }

    if (cancelled === "true") {
      verificationAttempted.current.add(tid);
      toast.error("Payment was cancelled. Please try again.");
      setTimeout(() => {
        window.history.replaceState({}, "", "/c/transactions");
      }, 3000);
      return;
    }

    if (success === "true") {
      console.log("Payment success detected for transaction:", tid);

      // Wait for transactions to be loaded before attempting verification
      if (!isDataLoading && transactions.length > 0) {
        const transaction = transactions.find((t) => t.id === tid);

        if (transaction) {
          verificationAttempted.current.add(tid);

          // Check if already verified
          if (transaction.status === "purchased") {
            console.log("Transaction already verified");
            toast.success("Payment already verified!");
            setSelectedTransactionId(tid);
            setShowModal(true);
          } else {
            console.log("Starting verification process");
            handleVerifyPayment(tid);
          }
        } else {
          console.log("Transaction not found yet, waiting...");
        }
      } else {
        console.log("Still loading data, waiting...");
      }
    }
  }, [searchParams, transactions, isDataLoading]);

  const handleVerifyPayment = async (tid: string) => {
    // Prevent duplicate calls
    if (verifyingTransactionId === tid) {
      console.log("Already verifying this transaction, skipping...");
      return;
    }

    const transaction = transactions.find((t) => t.id === tid);
    if (!transaction) {
      console.error("Transaction not found:", tid);
      toast.error("Transaction not found. Please refresh the page.");
      return;
    }

    if (transaction.status === "purchased") {
      console.log("Transaction already purchased, skipping verification");
      toast.success("Payment already verified!");
      setSelectedTransactionId(tid);
      setShowModal(true);
      // Clean URL after processing
      setTimeout(() => {
        window.history.replaceState({}, "", "/c/transactions");
      }, 2000);
      return;
    }

    console.log("Starting verification for transaction:", tid);
    setVerifyingTransactionId(tid);
    const loadingToast = toast.loading("Verifying payment...");

    try {
      const response = await fetch("/api/transactions/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: tid }),
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (response.ok) {
        console.log("Verification successful:", data);

        if (data.alreadyPaid) {
          toast.success("Payment already verified!");
        } else {
          toast.success("Payment verified! Your appointment is now confirmed.");
        }

        // Show modal with details
        setSelectedTransactionId(tid);
        setShowModal(true);

        // Clean URL after showing success
        setTimeout(() => {
          window.history.replaceState({}, "", "/c/transactions");
        }, 2000);
      } else {
        console.error("Verification API error:", data);
        toast.error(
          data.error || "Verification failed. Please contact support."
        );
      }
    } catch (error) {
      console.error("Verification network error:", error);
      toast.dismiss(loadingToast);
      toast.error("Network error during verification. Please try again.");
    } finally {
      setVerifyingTransactionId(null);
    }
  };

  const getFilteredAndSortedAppointments = (transactionId: string) => {
    const filtered = appointments.filter(
      (apt) => apt.transactionId === transactionId
    );

    // Sort by date and time (nearest first), but keep cancelled at the end
    return filtered.sort((a, b) => {
      // Put cancelled appointments at the end
      if (a.status === "cancelled" && b.status !== "cancelled") return 1;
      if (b.status === "cancelled" && a.status !== "cancelled") return -1;

      // Sort by date and time (ascending - nearest first)
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  };

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

  if (isDataLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  const getFilteredTransactions = () => {
    if (!searchQuery) return transactions;

    return transactions.filter((transaction) => {
      const searchLower = searchQuery.toLowerCase();
      const { type, model, color, wheel, interior } =
        getTransactionDetails(transaction);

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

  const getLatestTransaction = () => {
    return selectedTransactionId
      ? transactions.find((t) => t.id === selectedTransactionId)
      : null;
  };

  const getTransactionDetails = (transaction: Transaction) => {
    const type = carTypes.find((t) => t.id === transaction.typeId);
    const model = carModels.find((m) => m.id === transaction.modelId);
    const color = paintColors.find((c) => c.id === transaction.colorId);
    const wheel = wheels.find((w) => w.id === transaction.wheelId);
    const interior = interiors.find((i) => i.id === transaction.interiorId);

    return { type, model, color, wheel, interior };
  };

  const getTransactionAppointments = (transactionId: string) => {
    return appointments.filter((apt) => apt.transactionId === transactionId);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackTransactionId || rating === 0) {
      toast.error("Please provide a rating");
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await updateDoc(doc(db, "transactions", feedbackTransactionId), {
        feedback: {
          rating,
          comment: feedbackComment,
          submittedAt: new Date(),
        },
      });
      toast.success("Thank you for your feedback!");
      setShowFeedbackModal(false);
      setFeedbackTransactionId(null);
      setRating(0);
      setFeedbackComment("");
    } catch (error) {
      toast.error("Failed to submit feedback");
      console.error(error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransactionId(transaction.id);
    setShowModal(true);
  };

  const handlePay = async () => {
    const latestTransaction = getLatestTransaction();
    if (!latestTransaction) return;

    const hasActiveAppointment = getTransactionAppointments(
      latestTransaction.id
    ).some((apt) => apt.status !== "cancelled");

    if (!hasActiveAppointment) {
      toast.error("Please book an appointment first.");
      return;
    }

    const color = paintColors.find((c) => c.id === latestTransaction.colorId);
    const wheel = wheels.find((w) => w.id === latestTransaction.wheelId);
    const interior = interiors.find(
      (i) => i.id === latestTransaction.interiorId
    );

    if (!color || color.inventory < 1) {
      toast.error("Sorry, the selected paint color is out of stock.");
      return;
    }
    if (!wheel || wheel.inventory < 1) {
      toast.error("Sorry, the selected wheels are out of stock.");
      return;
    }
    if (!interior || interior.inventory < 1) {
      toast.error("Sorry, the selected interior is out of stock.");
      return;
    }
    const { model } = getTransactionDetails(latestTransaction);

    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: latestTransaction.id,
          amount: Math.round(latestTransaction.price * 100), // Ensure integer centavos
          description: `Payment for ${model?.name || "Custom Design"} customization`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        // Improved error handling
        const errorMsg = data.error
          ? Array.isArray(data.error)
            ? data.error
                .map(
                  (e: { code: string; detail: string }) =>
                    `${e.code}: ${e.detail}`
                )
                .join("; ")
            : typeof data.error === "string"
              ? data.error
              : JSON.stringify(data.error)
          : "Unknown error occurred";
        toast.error(`Payment initiation failed: ${errorMsg}`);
        console.error("PayMongo error:", data);
      }
    } catch (error) {
      toast.error("Failed to initiate payment. Check console for details.");
      console.error(error);
    }
  };

  const handleBookAppointment = async () => {
    const latestTransaction = getLatestTransaction();
    if (!latestTransaction || !appointmentDate || !appointmentTime) {
      toast.error("Please select date and time.");
      return;
    }

    // Check if there's already an active appointment
    const existingAppointments = getTransactionAppointments(
      latestTransaction.id
    );
    const hasActiveAppointment = existingAppointments.some(
      (apt) => apt.status !== "cancelled"
    );

    if (hasActiveAppointment) {
      toast.error(
        "You already have an active appointment for this customization. Please cancel or edit the existing one."
      );
      return;
    }

    try {
      await addDoc(collection(db, "appointments"), {
        transactionId: latestTransaction.id,
        date: appointmentDate,
        time: appointmentTime,
        status: "booked",
        paymentStatus:
          latestTransaction.status === "purchased" ? "paid" : "pending",
        timestamp: new Date(),
      });
      toast.success("Appointment booked successfully!");
      setAppointmentDate("");
      setAppointmentTime("");
    } catch (error) {
      toast.error("Failed to book appointment");
      console.error(error);
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

    // Check if it's a paid appointment
    if (appointment.paymentStatus === "paid") {
      // Check 24-hour restriction
      const appointmentDateTime = new Date(
        `${appointment.date}T${appointment.time}`
      );
      const now = new Date();
      const hoursDifference =
        (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDifference < 24 && appointmentDateTime > now) {
        toast.error("Cannot cancel within 24 hours of appointment time");
        return;
      }

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
      // Unpaid appointment - simple cancellation
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
    setShowModal(false);
    setSelectedTransactionId(null);
    setAppointmentDate("");
    setAppointmentTime("");
    setSearchQuery("");
    setEditingAppointmentId(null);
    setEditDate("");
    setEditTime("");
  };

  const latestTransaction = getLatestTransaction();

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Badge variant={transactions.length > 0 ? "default" : "secondary"}>
          {transactions.length} Transaction
          {transactions.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Global Search Bar */}
      {transactions.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search transactions by model, type, color, wheels, interior, status, date, or price..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {transactions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">
              No transactions yet. Start by saving a design!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredTransactions().map((transaction) => {
            const { type, model, color, wheel, interior } =
              getTransactionDetails(transaction);
            const previewImage =
              color?.imageUrl || model?.imageUrl || "/placeholder-car.png";

            return (
              <Card key={transaction.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {model?.name || "Custom Design"}
                    </CardTitle>
                    <Badge variant="outline">
                      {type?.name || "Unknown Type"}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(transaction.timestamp, "MMM dd, yyyy HH:mm")}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preview Image */}
                  <div className="w-full">
                    <Image
                      src={previewImage}
                      alt={`${model?.name} Preview`}
                      className="w-full h-48 object-cover rounded-lg"
                      width={400}
                      height={300}
                    />
                  </div>

                  {/* Quick Details */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: color?.hex || "#000000" }}
                      />
                      <span className="text-sm font-medium">
                        Exterior: {color?.name} ({color?.finish})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        Wheels: {wheel?.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        Interior: {interior?.name}
                      </span>
                      {interior?.hex && (
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: interior.hex }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-lg font-bold">
                      ₱{transaction.price.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Badge
                    variant={
                      transaction.status === "purchased"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {transaction.status === "purchased"
                      ? "BOOKED"
                      : transaction.status.toUpperCase()}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(transaction)}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Design Details</DialogTitle>
            <DialogDescription>Manage your saved design</DialogDescription>
          </DialogHeader>
          {latestTransaction && (
            <>
              {(() => {
                const hasActiveAppointment = getTransactionAppointments(
                  latestTransaction.id
                ).some((apt) => apt.status !== "cancelled");
                const progress = calculateProgress(latestTransaction);
                const customizationProgress =
                  latestTransaction.customizationProgress || {
                    paintCompleted: false,
                    paintCompletedAt: null,
                    wheelsCompleted: false,
                    wheelsCompletedAt: null,
                    interiorCompleted: false,
                    interiorCompletedAt: null,
                    overallStatus: "pending" as const,
                  };
                const { type, model, color, wheel, interior } =
                  getTransactionDetails(latestTransaction);
                return (
                  <>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium">Model: {model?.name}</h3>
                      </div>
                      <div>
                        <h3 className="font-medium">
                          Exterior: {color?.name} ({color?.finish})
                        </h3>
                      </div>
                      <div>
                        <h3 className="font-medium">Wheels: {wheel?.name}</h3>
                      </div>
                      <div>
                        <h3 className="font-medium">
                          Interior: {interior?.name}
                        </h3>
                      </div>
                      <div className="text-2xl font-bold">
                        Total: ₱{latestTransaction.price.toLocaleString()}
                      </div>

                      {/* Payment Status */}
                      {latestTransaction.status === "purchased" && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">
                              Payment Verified
                            </p>
                            {latestTransaction.paymentVerifiedAt && (
                              <p className="text-sm text-green-700">
                                {format(
                                  latestTransaction.paymentVerifiedAt,
                                  "MMM dd, yyyy HH:mm"
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Feedback Section - Show when customization is complete */}
                      {customizationProgress.overallStatus === "completed" && (
                        <div className="space-y-3 pt-4 border-t">
                          {!latestTransaction.feedback ? (
                            <>
                              <h4 className="font-medium">
                                Share Your Experience
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Your customization is complete! Please share
                                your feedback.
                              </p>
                              <Button
                                onClick={() => {
                                  setFeedbackTransactionId(
                                    latestTransaction.id
                                  );
                                  setShowFeedbackModal(true);
                                }}
                                variant="outline"
                                className="w-full"
                              >
                                Provide Feedback
                              </Button>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <h4 className="font-medium flex items-center gap-2">
                                Your Feedback
                                <Badge variant="default">Submitted</Badge>
                              </h4>
                              <div className="p-3 bg-muted rounded-md space-y-2">
                                <StarRating
                                  rating={latestTransaction.feedback.rating}
                                  onRatingChange={() => {}}
                                  readonly
                                />
                                {latestTransaction.feedback.comment && (
                                  <p className="text-sm">
                                    {latestTransaction.feedback.comment}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Submitted:{" "}
                                  {format(
                                    latestTransaction.feedback.submittedAt,
                                    "MMM dd, yyyy HH:mm"
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Customization Progress Timeline */}
                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            Customization Progress
                          </h4>
                          <Badge
                            variant={
                              customizationProgress.overallStatus ===
                              "completed"
                                ? "default"
                                : customizationProgress.overallStatus ===
                                    "in-progress"
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
                        <div className="space-y-3">
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
                        </div>
                      </div>
                    </div>

                    {/* Payment Button */}
                    {latestTransaction.status !== "purchased" && (
                      <div className="space-y-2 pt-4">
                        <Button
                          onClick={handlePay}
                          className="w-full"
                          disabled={!hasActiveAppointment}
                        >
                          Pay Now with PayMongo
                        </Button>
                        {!hasActiveAppointment && (
                          <p className="text-sm text-muted-foreground text-center">
                            Please book an appointment before proceeding to
                            payment.
                          </p>
                        )}
                      </div>
                    )}
                    {/* Existing Appointments */}
                    {getTransactionAppointments(latestTransaction.id).length >
                      0 && (
                      <div className="space-y-2 pt-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Booked Appointments</h4>
                          <Badge variant="outline">
                            {
                              getTransactionAppointments(latestTransaction.id)
                                .length
                            }{" "}
                            Total
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {getFilteredAndSortedAppointments(
                            latestTransaction.id
                          ).map((apt) => {
                            const appointmentDateTime = new Date(
                              `${apt.date}T${apt.time}`
                            );
                            const isUpcoming =
                              appointmentDateTime > new Date() &&
                              apt.status !== "cancelled";
                            const isPast =
                              appointmentDateTime < new Date() &&
                              apt.status !== "cancelled";

                            return (
                              <div
                                key={apt.id}
                                className={`p-3 border rounded-md space-y-3 ${
                                  isUpcoming
                                    ? "border-primary/50 bg-primary/5"
                                    : ""
                                } ${isPast ? "opacity-60" : ""}`}
                              >
                                {editingAppointmentId === apt.id ? (
                                  // Edit Mode
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="edit-date">Date</Label>
                                        <Input
                                          id="edit-date"
                                          type="date"
                                          value={editDate}
                                          onChange={(e) =>
                                            setEditDate(e.target.value)
                                          }
                                          min={
                                            new Date()
                                              .toISOString()
                                              .split("T")[0]
                                          }
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="edit-time">Time</Label>
                                        <Input
                                          id="edit-time"
                                          type="time"
                                          value={editTime}
                                          onChange={(e) =>
                                            setEditTime(e.target.value)
                                          }
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
                                  // View Mode
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
                                        {apt.paymentStatus !== "paid" && (
                                          <>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                handleEditAppointment(apt)
                                              }
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
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => {
                                            if (apt.paymentStatus === "paid") {
                                              // Check 24-hour restriction before opening modal
                                              const appointmentDateTime =
                                                new Date(
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
                                          disabled={
                                            apt.paymentStatus === "paid" &&
                                            (() => {
                                              const appointmentDateTime =
                                                new Date(
                                                  `${apt.date}T${apt.time}`
                                                );
                                              const now = new Date();
                                              const hoursDifference =
                                                (appointmentDateTime.getTime() -
                                                  now.getTime()) /
                                                (1000 * 60 * 60);
                                              return (
                                                hoursDifference < 24 &&
                                                appointmentDateTime > now
                                              );
                                            })()
                                          }
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

                                    {apt.paymentStatus === "paid" &&
                                      apt.status !== "cancelled" && (
                                        <p className="text-xs text-muted-foreground text-center">
                                          Paid appointments cannot be edited.
                                          Cancelling will process a refund with
                                          2% fee.
                                        </p>
                                      )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Book New Appointment */}
                    {latestTransaction.status !== "purchased" &&
                      !getTransactionAppointments(latestTransaction.id).some(
                        (apt) => apt.status !== "cancelled"
                      ) && (
                        <div className="space-y-2 pt-4 border-t">
                          <h4 className="font-medium">Book Appointment</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="date">Date</Label>
                              <Input
                                id="date"
                                type="date"
                                value={appointmentDate}
                                onChange={(e) =>
                                  setAppointmentDate(e.target.value)
                                }
                                min={new Date().toISOString().split("T")[0]}
                              />
                            </div>
                            <div>
                              <Label htmlFor="time">Time</Label>
                              <Input
                                id="time"
                                type="time"
                                value={appointmentTime}
                                onChange={(e) =>
                                  setAppointmentTime(e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <Button
                            onClick={handleBookAppointment}
                            className="w-full"
                            variant="outline"
                          >
                            Book Appointment
                          </Button>
                        </div>
                      )}
                  </>
                );
              })()}
            </>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                      <p>Cannot cancel within 24 hours of appointment time.</p>
                    );
                  }
                  return (
                    <>
                      <p>
                        This appointment is paid. Cancelling will process a
                        refund of {refundAmount.toLocaleString()} (98% of the
                        payment) with a 2% processing fee (
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

      {/* Feedback Modal */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Feedback</DialogTitle>
            <DialogDescription>
              How satisfied are you with your customization experience?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rating *</Label>
              <StarRating rating={rating} onRatingChange={setRating} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-comment">Comments (Optional)</Label>
              <textarea
                id="feedback-comment"
                className="w-full min-h-[100px] p-2 border rounded-md"
                placeholder="Tell us about your experience..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFeedbackModal(false);
                setFeedbackTransactionId(null);
                setRating(0);
                setFeedbackComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitFeedback}
              disabled={rating === 0 || isSubmittingFeedback}
            >
              {isSubmittingFeedback ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TransactionsPageWrapper: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>Loading transactions...</p>
          </div>
        </div>
      }
    >
      <ClientsTransactionPage />
    </Suspense>
  );
};

export default TransactionsPageWrapper;
