"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
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
import { Clock, DollarSign, Calendar, CheckCircle2 } from "lucide-react";
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

const TransactionsPage: React.FC = () => {
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

  // Load data from Firestore
  useEffect(() => {
    const expectedSnapshots = 7; // transactions + appointments + 5 others

    // Load transactions
    const q = query(
      collection(db, "transactions"),
      orderBy("timestamp", "desc")
    );
    const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
            paymentVerifiedAt: doc.data().paymentVerifiedAt?.toDate(),
          }) as Transaction
      );
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

    // Double-check status before API call
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

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransactionId(transaction.id);
    setShowModal(true);
  };

  const handlePay = async () => {
    const latestTransaction = getLatestTransaction();
    if (!latestTransaction) return;

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
      setShowModal(false);
      setAppointmentDate("");
      setAppointmentTime("");
    } catch (error) {
      toast.error("Failed to book appointment");
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTransactionId(null);
    setAppointmentDate("");
    setAppointmentTime("");
  };

  const latestTransaction = getLatestTransaction();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Badge variant={transactions.length > 0 ? "default" : "secondary"}>
          {transactions.length} Transaction
          {transactions.length !== 1 ? "s" : ""}
        </Badge>
      </div>

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
          {transactions.map((transaction) => {
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
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">
                    Model:{" "}
                    {getTransactionDetails(latestTransaction).model?.name}
                  </h3>
                </div>
                <div>
                  <h3 className="font-medium">
                    Exterior:{" "}
                    {getTransactionDetails(latestTransaction).color?.name} (
                    {getTransactionDetails(latestTransaction).color?.finish})
                  </h3>
                </div>
                <div>
                  <h3 className="font-medium">
                    Wheels:{" "}
                    {getTransactionDetails(latestTransaction).wheel?.name}
                  </h3>
                </div>
                <div>
                  <h3 className="font-medium">
                    Interior:{" "}
                    {getTransactionDetails(latestTransaction).interior?.name}
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
              </div>

              {/* Payment Button */}
              {latestTransaction.status !== "purchased" && (
                <div className="space-y-2 pt-4">
                  <Button onClick={handlePay} className="w-full">
                    Pay Now with PayMongo
                  </Button>
                </div>
              )}

              {/* Existing Appointments */}
              {getTransactionAppointments(latestTransaction.id).length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium">Booked Appointments</h4>
                  <div className="space-y-2">
                    {getTransactionAppointments(latestTransaction.id).map(
                      (apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between p-3 border rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <div>
                              <p className="font-medium">
                                {format(new Date(apt.date), "MMM dd, yyyy")} at{" "}
                                {apt.time}
                              </p>
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
                                Booked
                              </span>
                            ) : (
                              "Pending Payment"
                            )}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Book New Appointment */}
              {latestTransaction.status !== "purchased" && (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium">Book New Appointment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Close
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
      <TransactionsPage />
    </Suspense>
  );
};

export default TransactionsPageWrapper;
