"use client";

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
  LogOut,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  FileText,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import Link from "next/link";

interface Transaction {
  id: string;
  carType: string;
  color: string;
  status: "pending" | "ongoing" | "completed";
  date: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "TXN-001",
    carType: "Sedan",
    color: "Midnight Black",
    status: "ongoing",
    date: "2024-01-10",
  },
  {
    id: "TXN-002",
    carType: "SUV",
    color: "Pearl White",
    status: "pending",
    date: "2024-01-09",
  },
];

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  username: string;
}

const currentProfile: ProfileData = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  phone: "+1 (555) 987-6543",
  address: "456 Style Ave, Design City, DC 67890",
  username: "janedoe",
};

function getStatusBadge(status: Transaction["status"]) {
  const variants = {
    pending: "secondary",
    ongoing: "default",
    completed: "outline",
  } as const;

  const labels = {
    pending: "Pending",
    ongoing: "Ongoing",
    completed: "Completed",
  };

  return (
    <Badge variant={variants[status]} className="capitalize">
      {labels[status]}
    </Badge>
  );
}

const ClientDashboard = () => {
  const [transactions, setTransactions] =
    useState<Transaction[]>(mockTransactions);
  const [profile, setProfile] = useState<ProfileData>(currentProfile);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editForm, setEditForm] = useState({
    name: profile.name,
    phone: profile.phone,
    address: profile.address,
    username: profile.username,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({ ...profile, ...editForm });
    setShowEditProfile(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    setShowChangePassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    alert("Password changed successfully");
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter((txn) => txn.id !== id));
  };

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
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-right text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id} className="border-border">
                    <TableCell className="font-mono text-sm text-foreground">
                      {txn.id}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {txn.carType}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {txn.color}
                    </TableCell>
                    <TableCell>{getStatusBadge(txn.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {txn.date}
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
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
                ))}
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
                  <span className="text-foreground">{profile.name}</span>
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
                  <span className="text-foreground">{profile.phone}</span>
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
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
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
