"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth, db } from "@/lib/firebase";
import type { User as UserType } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast } from "sonner"; // Optional: For notifications

import { format } from "date-fns";
import {
  Calendar,
  Clock,
  DollarSign,
  Loader2,
  Plus,
  Search
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

interface ProfileData {
  fullName: string;
  email: string;
  contactNumber: string;
  address: string;
  username: string;
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

const ClientDashboard = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    email: "",
    contactNumber: "",
    address: "",
    username: "",
  });
  const [carTypes, setCarTypes] = useState<CarType[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [interiors, setInteriors] = useState<Interior[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    contactNumber: "",
    address: "",
    username: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"transactions" | "appointments">(
    "transactions"
  );

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const expectedSnapshots = 7;
    let loadedSnapshots = 0;

    const checkAllLoaded = () => {
      loadedSnapshots++;
      if (loadedSnapshots === expectedSnapshots) {
        setIsLoading(false);
      }
    };

    // Fetch profile
    const unsubscribeProfile = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            fullName: data.fullName || "",
            email: data.email || "",
            contactNumber: data.contactNumber || "",
            address: data.address || "",
            username: data.username || "",
          });
          setEditForm({
            fullName: data.fullName || "",
            contactNumber: data.contactNumber || "",
            address: data.address || "",
            username: data.username || "",
          });
        }
        checkAllLoaded();
      },
      (error) => {
        console.error("Profile snapshot error:", error);
        toast?.error("Failed to load profile.");
        checkAllLoaded();
      }
    );

    // Fetch user's transactions - read all and filter client-side
    // WORKAROUND: Removed where clause due to Firebase internal assertion errors
    // Now reading all transactions and filtering by userId client-side
    const transactionsQuery = query(
      collection(db, "transactions")
      // Removed: where("userId", "==", user.uid)
      // , orderBy("timestamp", "desc")  // Re-enable after fixing index/data
    );
    const unsubscribeTransactions = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        try {
          let data = snapshot.docs
            .map((doc) => {
              try {
                const docData = doc.data();
                return {
                  id: doc.id,
                  ...docData,
                  timestamp: docData.timestamp?.toDate?.() || new Date(),
                  paymentVerifiedAt: docData.paymentVerifiedAt?.toDate?.(),
                  customizationProgress: docData.customizationProgress
                    ? {
                        ...docData.customizationProgress,
                        paintCompletedAt:
                          docData.customizationProgress.paintCompletedAt?.toDate?.() ||
                          null,
                        wheelsCompletedAt:
                          docData.customizationProgress.wheelsCompletedAt?.toDate?.() ||
                          null,
                        interiorCompletedAt:
                          docData.customizationProgress.interiorCompletedAt?.toDate?.() ||
                          null,
                      }
                    : undefined,
                } as Transaction;
              } catch (docError) {
                console.warn("Error processing transaction doc:", doc.id);
                return null;
              }
            })
            .filter((item): item is Transaction => item !== null)
            // Filter only transactions belonging to current user
            .filter((txn) => txn.userId === user.uid);
          
          // Client-side sort (descending timestamp) as fallback
          data = data.sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
          );
          setTransactions(data);
          checkAllLoaded();
        } catch (snapshotError) {
          console.error("Error processing transactions snapshot:", snapshotError);
          setTransactions([]);
          checkAllLoaded();
        }
      },
      (error) => {
        console.error("Transactions snapshot error:", error);
        if (
          error.code === "failed-precondition" ||
          error.message.includes("array_config")
        ) {
          toast?.error(
            "Timestamp field issue detected. Sorting client-side; fix data/index for full performance."
          );
        } else {
          toast?.error("Failed to load transactions.");
        }
        checkAllLoaded();
      }
    );

    // Fetch user's appointments (filter by userId for security)
    // Fetch appointments - read all and filter client-side to avoid where clause issues
    const unsubscribeAppointments = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        try {
          const allAppointments = snapshot.docs.map((doc) => {
            try {
              const docData = doc.data();
              return {
                id: doc.id,
                ...docData,
                timestamp: docData.timestamp?.toDate?.() || new Date(),
                paidAt: docData.paidAt?.toDate?.(),
              } as Appointment;
            } catch (e) {
              console.warn("Error processing appointment:", doc.id);
              return null;
            }
          }).filter((apt): apt is Appointment => apt !== null);
          
          setAppointments(allAppointments);
          checkAllLoaded();
        } catch (error) {
          console.error("Error processing appointments:", error);
          setAppointments([]);
          checkAllLoaded();
        }
      },
      (error) => {
        console.error("Appointments snapshot error:", error);
        if (error.code === "permission-denied") {
          toast?.error("Permission denied accessing appointments.");
        }
        checkAllLoaded();
      }
    );

    // Fetch supporting data
    const unsubscribeCarTypes = onSnapshot(
      collection(db, "carTypes"),
      (snapshot) => {
        try {
          const data = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as CarType
          );
          setCarTypes(data);
        } catch (err) {
          console.error("Error processing carTypes:", err);
        }
        checkAllLoaded();
      },
      (error) => {
        console.error("CarTypes snapshot error:", error);
        if (error.code === "permission-denied") {
          console.warn("Permission denied for carTypes. Check Firestore rules.");
        }
        checkAllLoaded();
      }
    );

    const unsubscribeCarModels = onSnapshot(
      collection(db, "carModels"),
      (snapshot) => {
        try {
          const data = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as CarModel
          );
          setCarModels(data);
        } catch (err) {
          console.error("Error processing carModels:", err);
        }
        checkAllLoaded();
      },
      (error) => {
        console.error("CarModels snapshot error:", error);
        if (error.code === "permission-denied") {
          console.warn("Permission denied for carModels. Check Firestore rules.");
        }
        checkAllLoaded();
      }
    );

    const unsubscribePaintColors = onSnapshot(
      collection(db, "paintColors"),
      (snapshot) => {
        try {
          const data = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as PaintColor
          );
          setPaintColors(data);
        } catch (err) {
          console.error("Error processing paintColors:", err);
        }
        checkAllLoaded();
      },
      (error) => {
        console.error("PaintColors snapshot error:", error);
        if (error.code === "permission-denied") {
          console.warn("Permission denied for paintColors. Check Firestore rules.");
        }
        checkAllLoaded();
      }
    );

    const unsubscribeWheels = onSnapshot(
      collection(db, "wheels"),
      (snapshot) => {
        try {
          const data = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Wheel
          );
          setWheels(data);
        } catch (err) {
          console.error("Error processing wheels:", err);
        }
        checkAllLoaded();
      },
      (error) => {
        console.error("Wheels snapshot error:", error);
        if (error.code === "permission-denied") {
          console.warn("Permission denied for wheels. Check Firestore rules.");
        }
        checkAllLoaded();
      }
    );

    const unsubscribeInteriors = onSnapshot(
      collection(db, "interiors"),
      (snapshot) => {
        try {
          const data = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Interior
          );
          setInteriors(data);
        } catch (err) {
          console.error("Error processing interiors:", err);
        }
        checkAllLoaded();
      },
      (error) => {
        console.error("Interiors snapshot error:", error);
        if (error.code === "permission-denied") {
          console.warn("Permission denied for interiors. Check Firestore rules.");
        }
        checkAllLoaded();
      }
    );

    return () => {
      unsubscribeProfile();
      unsubscribeTransactions();
      unsubscribeAppointments();
      unsubscribeCarTypes();
      unsubscribeCarModels();
      unsubscribePaintColors();
      unsubscribeWheels();
      unsubscribeInteriors();
    };
  }, [user]);

  const getTransactionDetails = (transaction: Transaction) => {
    const type = carTypes.find((t) => t.id === transaction.typeId);
    const model = carModels.find((m) => m.id === transaction.modelId);
    const color = paintColors.find((c) => c.id === transaction.colorId); // Fixed: was transaction.colorId
    const wheel = wheels.find((w) => w.id === transaction.wheelId);
    const interior = interiors.find((i) => i.id === transaction.interiorId);
    return { type, model, color, wheel, interior };
  };

  const getTransactionAppointments = (transactionId: string) => {
    return appointments.filter((apt) => apt.transactionId === transactionId);
  };

  const getActiveAppointments = () => {
    return appointments.filter(
      (apt) =>
        apt.status !== "cancelled" &&
        transactions.some(
          (t) => t.id === apt.transactionId && t.userId === user?.uid
        )
    );
  };

  function getStatusBadge(status: Transaction["status"]) {
    const variants = {
      saved: "secondary",
      purchased: "default",
      cancelled: "destructive",
    } as const;

    const labels = {
      saved: "Saved",
      purchased: "Purchased",
      cancelled: "Cancelled",
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {labels[status]}
      </Badge>
    );
  }

  const calculateProgress = (transaction: Transaction): number => {
    if (!transaction.customizationProgress) return 0;

    const progressObj = transaction.customizationProgress; // Renamed for clarity
    let completedStages = 0;

    if (progressObj.paintCompleted) completedStages++;
    if (progressObj.wheelsCompleted) completedStages++;
    if (progressObj.interiorCompleted) completedStages++;

    return Math.round((completedStages / 3) * 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage === 0) return "text-gray-500";
    if (percentage < 100) return "text-orange-500";
    return "text-green-600";
  };

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

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const filteredTransactions = getFilteredTransactions();
  const activeAppointments = getActiveAppointments();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <Button asChild>
            <Link href="/c/customization">
              <Plus className="h-4 w-4 mr-2" />
              Start Customization
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-100 dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Transactions
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <p className="text-xs text-muted-foreground">
                All your designs and purchases
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-100 dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Appointments
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeAppointments.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Upcoming scheduled visits
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-100 dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  transactions.filter(
                    (t) =>
                      t.customizationProgress?.overallStatus === "in-progress"
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Active customizations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions & Appointments Section */}
        <Card className="bg-slate-100 dark:bg-slate-800 border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">
                  {activeTab === "transactions"
                    ? "Recent Transactions"
                    : "Active Appointments"}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {activeTab === "transactions"
                    ? "Manage your orders and designs"
                    : "View and manage your scheduled appointments"}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Bar */}
                {activeTab === "transactions" && transactions.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-48"
                    />
                  </div>
                )}

                {/* Tab Switcher */}
                <div className="flex border rounded-md p-1">
                  <Button
                    variant={activeTab === "transactions" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("transactions")}
                    className="text-xs"
                  >
                    Transactions
                  </Button>
                  <Button
                    variant={activeTab === "appointments" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("appointments")}
                    className="text-xs"
                  >
                    Appointments
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "transactions" ? (
              <div className="space-y-4">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {transactions.length === 0
                        ? "No transactions yet. Start by saving a design!"
                        : "No transactions match your search."}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">
                          Design
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Car Type
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Color
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Status
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Progress
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Price
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Date
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((txn) => {
                        const details = getTransactionDetails(txn);
                        const progress = calculateProgress(txn);
                        const formattedDate = format(
                          txn.timestamp,
                          "MMM dd, yyyy"
                        );
                        const transactionAppointments =
                          getTransactionAppointments(txn.id);
                        const hasActiveAppointment =
                          transactionAppointments.some(
                            (apt) => apt.status !== "cancelled"
                          );

                        return (
                          <TableRow key={txn.id} className="border-border">
                            <TableCell className="font-medium text-foreground">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 relative rounded-md overflow-hidden">
                                  <Image
                                    src={
                                      details.color?.imageUrl ||
                                      details.model?.imageUrl ||
                                      "/placeholder-car.png"
                                    }
                                    alt={details.model?.name || "Car"}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {details.model?.name || "Custom Design"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {hasActiveAppointment
                                      ? "Appointment booked"
                                      : "No appointment"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground">
                              {details.type?.name || "N/A"}
                            </TableCell>
                            <TableCell className="text-foreground">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full border"
                                  style={{
                                    backgroundColor:
                                      details.color?.hex || "#000000",
                                  }}
                                />
                                {details.color?.name || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(txn.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
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
                                {txn.customizationProgress && (
                                  <Badge
                                    variant={
                                      txn.customizationProgress
                                        .overallStatus === "completed"
                                        ? "default"
                                        : txn.customizationProgress
                                              .overallStatus === "in-progress"
                                          ? "secondary"
                                          : "outline"
                                    }
                                    className="text-xs w-fit"
                                  >
                                    {txn.customizationProgress.overallStatus}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-foreground">
                              ₱{txn.price.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formattedDate}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            ) : (
              // Appointments Tab
              <div className="space-y-4">
                {activeAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No active appointments. Book an appointment for your
                      designs!
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">
                          Design
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Date & Time
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Status
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Payment
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeAppointments.map((apt) => {
                        const transaction = transactions.find(
                          (t) => t.id === apt.transactionId
                        );
                        const details = transaction
                          ? getTransactionDetails(transaction)
                          : null;
                        const appointmentDateTime = new Date(
                          `${apt.date}T${apt.time}`
                        );
                        const isUpcoming = appointmentDateTime > new Date();

                        return (
                          <TableRow key={apt.id} className="border-border">
                            <TableCell className="font-medium text-foreground">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 relative rounded-md overflow-hidden">
                                  <Image
                                    src={
                                      details?.color?.imageUrl ||
                                      details?.model?.imageUrl ||
                                      "/placeholder-car.png"
                                    }
                                    alt={details?.model?.name || "Car"}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {details?.model?.name || "Custom Design"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {details?.type?.name || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground">
                              <div>
                                <div className="font-medium">
                                  {format(new Date(apt.date), "MMM dd, yyyy")}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  at {apt.time}
                                </div>
                                {isUpcoming && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs mt-1"
                                  >
                                    Upcoming
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  apt.status === "booked"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {apt.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  apt.paymentStatus === "paid"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {apt.paymentStatus === "paid"
                                  ? "Paid"
                                  : "Pending"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default ClientDashboard;