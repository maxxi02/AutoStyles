"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { User, Mail, Phone, MapPin, Lock, Bell, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type React from "react";
import Link from "next/link";
interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  username: string;
  role: "Admin" | "Cashier" | "Manager";
}

const currentProfile: ProfileData = {
  name: "John Doe",
  email: "john.doe@autostyles.com",
  phone: "+1 (555) 123-4567",
  address: "123 Auto Street, Car City, CC 12345",
  username: "johndoe",
  role: "Admin",
};

const AccountPage = () => {
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
    // Simulate password change
    setShowChangePassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    alert("Password changed successfully");
  };

  const handleLogout = () => {
    // Simulate logout
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Account Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your profile and preferences
            </p>
          </div>
        </div>

        {/* Profile Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Profile Information
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Update your personal details
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
              <div className="space-y-2">
                <Label className="text-sm font-medium">Role</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{profile.role}</Badge>
                </div>
              </div>
            </div>
            <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
              <DialogTrigger asChild>
                <Button>Edit Profile</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update your profile details.
                  </DialogDescription>
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
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Security</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your password and two-factor authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Dialog
              open={showChangePassword}
              onOpenChange={setShowChangePassword}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and new password.
                  </DialogDescription>
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
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
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
                    <Button type="submit">Change Password</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Enable 2FA for added security
                </p>
              </div>
              <Switch
                checked={false}
                onCheckedChange={() => {
                  /* Toggle 2FA */
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Preferences</CardTitle>
            <CardDescription className="text-muted-foreground">
              Customize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h3 className="font-medium">Dark Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Toggle dark theme
                </p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Legal Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Legal & Support</CardTitle>
            <CardDescription className="text-muted-foreground">
              Access important links and support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </div>
            <div className="flex justify-between">
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms of Service
              </Link>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Contact Support
              </span>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AccountPage;
