"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User as UserType } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { updatePassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Mail,
  Phone,
  MapPin,
  Lock,
  FileText,
  User,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

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

const ClientDashboard = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
  const [isLoading, setIsLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    contactNumber: "",
    address: "",
    username: "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [snapshotCount, setSnapshotCount] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const expectedSnapshots = 5; // transactions + profile + 3 others

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
        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === expectedSnapshots) {
            setIsLoading(false);
          }
          return next;
        });
      }
    );

    // Fetch user's transactions
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
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
    });

    // Fetch supporting data
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

    return () => {
      unsubscribeProfile();
      unsubscribeTransactions();
      unsubscribeCarTypes();
      unsubscribeCarModels();
      unsubscribePaintColors();
    };
  }, [user]);

  const getTransactionDetails = (transaction: Transaction) => {
    const type = carTypes.find((t) => t.id === transaction.typeId);
    const model = carModels.find((m) => m.id === transaction.modelId);
    const color = paintColors.find((c) => c.id === transaction.colorId);
    return { type, model, color };
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

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        fullName: editForm.fullName,
        contactNumber: editForm.contactNumber,
        address: editForm.address,
        username: editForm.username,
      });
      setProfile({ ...profile, ...editForm });
      setShowEditProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    if (!user) return;

    try {
      await updatePassword(user, newPassword);
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Password changed successfully");
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    // In real app, confirm deletion or mark as cancelled
    try {
      await updateDoc(doc(db, "transactions", id), {
        status: "cancelled",
      });
    } catch (error) {
      console.error("Error cancelling transaction:", error);
    }
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

        {/* Transactions Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">My Transactions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your orders and designs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">ID</TableHead>
                  <TableHead className="text-muted-foreground">
                    Car Type
                  </TableHead>
                  <TableHead className="text-muted-foreground">Color</TableHead>
                  <TableHead className="text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Progress
                  </TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-right text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => {
                  const details = getTransactionDetails(txn);
                  const progress = calculateProgress(txn);
                  const formattedDate = format(txn.timestamp, "MMM dd, yyyy");
                  return (
                    <TableRow key={txn.id} className="border-border">
                      <TableCell className="font-mono text-sm text-foreground">
                        {txn.id}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {details.type?.name || "N/A"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {details.color?.name || "N/A"}
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
                                txn.customizationProgress.overallStatus ===
                                "completed"
                                  ? "default"
                                  : txn.customizationProgress.overallStatus ===
                                      "in-progress"
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
                      <TableCell className="text-muted-foreground">
                        {formattedDate}
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/c/transactions?id=${txn.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTransaction(txn.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Account Management Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Account Settings</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your profile and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profile.fullName}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profile.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Phone</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">
                    {profile.contactNumber}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Address</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profile.address}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Username</Label>
                <div className="flex items-center gap-2">
                  <span className="text-foreground">@{profile.username}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                <DialogTrigger asChild>
                  <Button>Edit Profile</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>Update your details.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleEditProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Name</Label>
                      <Input
                        id="fullName"
                        value={editForm.fullName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, fullName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Phone</Label>
                      <Input
                        id="contactNumber"
                        value={editForm.contactNumber}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            contactNumber: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={editForm.address}
                        onChange={(e) =>
                          setEditForm({ ...editForm, address: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={editForm.username}
                        onChange={(e) =>
                          setEditForm({ ...editForm, username: e.target.value })
                        }
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowEditProfile(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Save</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog
                open={showChangePassword}
                onOpenChange={setShowChangePassword}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>Enter your passwords.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowChangePassword(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Change</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">Dark Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Toggle dark theme
                  </p>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <div className="flex justify-between">
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Privacy Policy
                </Link>
              </div>
              <div className="flex justify-between">
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Terms of Service
                </Link>
              </div>
              <div className="flex justify-between">
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Feedback</CardTitle>
            <CardDescription className="text-muted-foreground">
              Review previous transactions and provide feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Submit Feedback
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ClientDashboard;
