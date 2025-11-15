"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Bell, Image as ImageIcon, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  onAuthStateChanged,
  type User as FirebaseUser,
  MultiFactorInfo,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
  multiFactor,
  TotpMultiFactorGenerator,
  TotpSecret,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  username?: string;
  role?: string;
  photoURL?: string;
}

const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";

function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const AccountPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mfaEnrolledFactors, setMfaEnrolledFactors] = useState<
    MultiFactorInfo[]
  >([]);
  const [enrollmentStep, setEnrollmentStep] = useState<
    "idle" | "generating" | "verifying" | "enrolled"
  >("idle");
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [unenrollId, setUnenrollId] = useState<string | null>(null);
  const [showEditProfileDialog, setShowEditProfileDialog] =
    useState<boolean>(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] =
    useState<boolean>(false);
  const [showReauthDialog, setShowReauthDialog] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "",
    username: "",
  });
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
  const [reauthEmail, setReauthEmail] = useState<string>("");
  const [reauthPassword, setReauthPassword] = useState<string>("");
  const [reauthFor, setReauthFor] = useState<"unenroll" | "password" | null>(
    null
  );
  const [notifications, setNotifications] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData(data);
            setEditForm({
              name: data.name || currentUser.displayName || "",
              phone: data.phone || "",
              address: data.address || "",
              username: data.username || currentUser.email || "",
            });
          } else {
            setUserData({
              name: currentUser.displayName || "",
              email: currentUser.email || "",
              phone: "",
              address: "",
              username: currentUser.email || "",
              photoURL: currentUser.photoURL || "",
            });
            setEditForm({
              name: currentUser.displayName || "",
              phone: "",
              address: "",
              username: currentUser.email || "",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
        const mfa = multiFactor(currentUser);
        setMfaEnrolledFactors(mfa.enrolledFactors);
        const totpFactor = mfa.enrolledFactors.find(
          (f: MultiFactorInfo) =>
            f.factorId === TotpMultiFactorGenerator.FACTOR_ID
        );
        if (totpFactor) {
          setUnenrollId(totpFactor.uid);
        }
      } else {
        setUser(null);
        setUserData({});
        setMfaEnrolledFactors([]);
      }
    });
    return unsubscribe;
  }, []);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handlePhotoChange = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Error", {
          description: "File size must be less than 5MB.",
        });
        return;
      }

      const downloadURL = await uploadToCloudinary(file);

      await updateProfile(user, { photoURL: downloadURL });
      await setDoc(
        doc(db, "users", user.uid),
        { photoURL: downloadURL },
        { merge: true }
      );
      setUserData({ ...userData, photoURL: downloadURL });
      setPreview(downloadURL);
      toast.success("Success", {
        description: "Profile photo updated successfully!",
      });
    } catch (error: unknown) {
      console.error("Upload error:", error);
      toast.error("Upload Failed", {
        description: (error as Error).message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Error", { description: "Please select an image file." });
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      handlePhotoChange(file);
    }
    e.target.value = "";
  };

  const handleEditProfile = async () => {
    if (!user) return;
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: editForm.name });
      // Update Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: editForm.name,
          phone: editForm.phone,
          address: editForm.address,
          username: editForm.username,
        },
        { merge: true }
      );
      setUserData({
        ...userData,
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
        username: editForm.username,
      });
      setShowEditProfileDialog(false);
      toast.success("Success", {
        description: "Profile updated successfully!",
      });
    } catch (error: unknown) {
      toast.error("Update Failed", {
        description: (error as Error).message,
      });
    }
  };

  const handleInitiatePasswordChange = () => {
    if (!newPassword || !confirmNewPassword) return;
    if (newPassword !== confirmNewPassword) {
      toast.error("Error", { description: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Error", {
        description: "Password must be at least 6 characters.",
      });
      return;
    }
    setShowChangePasswordDialog(false);
    setReauthFor("password");
    setReauthEmail(user?.email || "");
    setShowReauthDialog(true);
  };

  const handleEnroll = async () => {
    if (!user) return;
    try {
      setEnrollmentStep("generating");
      const multiFactorSession = await multiFactor(user).getSession();
      const secret =
        await TotpMultiFactorGenerator.generateSecret(multiFactorSession);
      setTotpSecret(secret);
      setEnrollmentStep("verifying");
      toast.success("Secret Generated", {
        description:
          "Scan the QR code or use the secret key in your authenticator app.",
      });
    } catch (error: unknown) {
      toast.error("Enrollment Failed", {
        description: (error as Error).message,
      });
      setEnrollmentStep("idle");
    }
  };

  const handleVerifyEnrollment = async () => {
    if (!user || !totpSecret || !verificationCode.trim()) return;
    try {
      const multiFactorAssertion =
        TotpMultiFactorGenerator.assertionForEnrollment(
          totpSecret,
          verificationCode.trim()
        );
      await multiFactor(user).enroll(
        multiFactorAssertion,
        "TOTP Authenticator"
      );
      setEnrollmentStep("enrolled");
      setVerificationCode("");
      toast.success("Success", {
        description: "TOTP MFA enrolled successfully!",
      });
      // Refresh enrolled factors
      const mfa = multiFactor(user);
      setMfaEnrolledFactors(mfa.enrolledFactors);
      const totpFactor = mfa.enrolledFactors.find(
        (f: MultiFactorInfo) =>
          f.factorId === TotpMultiFactorGenerator.FACTOR_ID
      );
      if (totpFactor) setUnenrollId(totpFactor.uid);
    } catch (error: unknown) {
      toast.error("Verification Failed", {
        description: "Invalid code. Please try again.",
      });
    }
  };

  const handleUnenroll = async () => {
    if (!user || !unenrollId) return;
    try {
      await multiFactor(user).unenroll(unenrollId);
      toast.success("Success", {
        description: "TOTP MFA unenrolled successfully!",
      });
      setMfaEnrolledFactors([]);
      setUnenrollId(null);
    } catch (error: unknown) {
      const err = error as Error;
      if (err.message.includes("user-token-expired")) {
        setReauthFor("unenroll");
        setReauthEmail(user?.email || "");
        setShowReauthDialog(true);
        toast.error("Reauthentication Required", {
          description: "Please re-enter your credentials to unenroll.",
        });
      } else {
        toast.error("Unenroll Failed", { description: err.message });
      }
    }
  };

  const handleReauthSubmit = async () => {
    if (reauthFor === "password") {
      // Handle password change reauth
      if (!user || !reauthEmail || !reauthPassword || !newPassword) return;
      try {
        const credential = EmailAuthProvider.credential(
          reauthEmail,
          reauthPassword
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        toast.success("Success", {
          description: "Password changed successfully!",
        });
        setShowReauthDialog(false);
        setReauthEmail("");
        setReauthPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } catch (error: unknown) {
        const err = error as Error;
        toast.error("Reauthentication Failed", { description: err.message });
      }
    } else if (reauthFor === "unenroll") {
      await handleReauthAndUnenroll();
    }
  };

  const handleReauthAndUnenroll = async () => {
    if (!user || !reauthEmail || !reauthPassword) return;
    try {
      const credential = EmailAuthProvider.credential(
        reauthEmail,
        reauthPassword
      );
      await reauthenticateWithCredential(user, credential);
      await multiFactor(user).unenroll(unenrollId!);
      toast.success("Success", {
        description: "TOTP MFA unenrolled successfully!",
      });
      setShowReauthDialog(false);
      setReauthEmail("");
      setReauthPassword("");
      setMfaEnrolledFactors([]);
      setUnenrollId(null);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error("Reauthentication Failed", { description: err.message });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Success", {
        description: "Logged out successfully!",
      });
      router.push("/login");
    } catch (error: unknown) {
      toast.error("Logout Failed", {
        description: (error as Error).message,
      });
    }
    setShowLogoutDialog(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const isTotpEnrolled = mfaEnrolledFactors.some(
    (f: MultiFactorInfo) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6 space-y-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
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
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 object-fit">
                    <AvatarImage
                      className="object-fit"
                      src={preview || userData.photoURL}
                      alt={userData.name || ""}
                    />
                    <AvatarFallback className="h-20 w-20 text-lg">
                      {getInitials(userData.name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <Label
                      htmlFor="photo-upload"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Change Photo"}
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </div>
                </div>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Allow only letters, spaces, hyphens, and apostrophes
                          if (/^[a-zA-Z\s\-']*$/.test(val)) {
                            setEditForm({ ...editForm, name: val });
                          }
                        }}
                        onKeyPress={(e) => {
                          const charCode = e.charCode;
                          // Allow letters (a-z, A-Z), space, hyphen, apostrophe
                          if (
                            (charCode < 65 || charCode > 90) && // A-Z
                            (charCode < 97 || charCode > 122) && // a-z
                            charCode !== 32 && // space
                            charCode !== 45 && // hyphen
                            charCode !== 39 // apostrophe
                          ) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          const pastedText = e.clipboardData.getData("text");
                          if (!/^[a-zA-Z\s\-']*$/.test(pastedText)) {
                            e.preventDefault();
                            toast.error(
                              "Only letters, spaces, hyphens, and apostrophes are allowed"
                            );
                          }
                        }}
                        maxLength={50}
                        placeholder="Juan Dela Cruz"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {editForm.name.length}/50 characters
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={editForm.username}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Allow only alphanumeric, underscore, hyphen, and dot
                          if (/^[a-zA-Z0-9_.\-]*$/.test(val)) {
                            setEditForm({ ...editForm, username: val });
                          }
                        }}
                        onKeyPress={(e) => {
                          const charCode = e.charCode;
                          // Allow alphanumeric, underscore, hyphen, dot
                          if (
                            (charCode < 48 || charCode > 57) && // 0-9
                            (charCode < 65 || charCode > 90) && // A-Z
                            (charCode < 97 || charCode > 122) && // a-z
                            charCode !== 95 && // underscore
                            charCode !== 45 && // hyphen
                            charCode !== 46 // dot
                          ) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          const pastedText = e.clipboardData.getData("text");
                          if (!/^[a-zA-Z0-9_.\-]*$/.test(pastedText)) {
                            e.preventDefault();
                            toast.error(
                              "Only letters, numbers, underscores, hyphens, and dots are allowed"
                            );
                          }
                        }}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val.length > 0 && val.length < 3) {
                            toast.warning(
                              "Username should be at least 3 characters"
                            );
                          }
                        }}
                        minLength={3}
                        maxLength={30}
                        placeholder="juandelacruz"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {editForm.username.length}/30 characters (minimum 3)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Allow only numbers, spaces, hyphens, parentheses, and plus sign
                          if (/^[0-9\s\-\(\)\+]*$/.test(val)) {
                            setEditForm({ ...editForm, phone: val });
                          }
                        }}
                        onKeyPress={(e) => {
                          // Allow only numbers and phone formatting characters
                          const charCode = e.charCode;
                          if (
                            (charCode < 48 || charCode > 57) && // 0-9
                            charCode !== 32 && // space
                            charCode !== 45 && // hyphen
                            charCode !== 40 && // (
                            charCode !== 41 && // )
                            charCode !== 43 // +
                          ) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          const pastedText = e.clipboardData.getData("text");
                          if (!/^[0-9\s\-\(\)\+]*$/.test(pastedText)) {
                            e.preventDefault();
                            toast.error(
                              "Only numbers and phone formatting characters are allowed"
                            );
                          }
                        }}
                        maxLength={11}
                        placeholder="+63 912 345 6789"
                      />
                      <p className="text-xs text-muted-foreground">
                        {editForm.phone.length}/11 characters
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={userData.email || ""} disabled />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={editForm.address}
                        onChange={(e) => {
                          setEditForm({ ...editForm, address: e.target.value });
                        }}
                        maxLength={200}
                        placeholder="123 Main St, City, Province"
                      />
                      <p className="text-xs text-muted-foreground">
                        {editForm.address.length}/200 characters
                      </p>
                    </div>
                  </div>
                  <Dialog
                    open={showEditProfileDialog}
                    onOpenChange={setShowEditProfileDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        className="w-full"
                        disabled={
                          !editForm.name.trim() ||
                          editForm.name.length < 2 ||
                          !editForm.username.trim() ||
                          editForm.username.length < 3 ||
                          (editForm.phone.length > 0 &&
                            editForm.phone.length < 10)
                        }
                      >
                        Save Changes
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Changes</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to update your profile?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowEditProfileDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleEditProfile}>Confirm</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Update your password securely.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog
                    open={showChangePasswordDialog}
                    onOpenChange={setShowChangePasswordDialog}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full">Change Password</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your new password.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Field>
                          <FieldLabel>New Password</FieldLabel>
                          <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Confirm New Password</FieldLabel>
                          <Input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) =>
                              setConfirmNewPassword(e.target.value)
                            }
                            placeholder="Confirm new password"
                          />
                        </Field>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowChangePasswordDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleInitiatePasswordChange}
                          disabled={!newPassword || !confirmNewPassword}
                        >
                          Proceed to Confirm
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* MFA Section */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Multi-Factor Authentication (MFA)</CardTitle>
                  <CardDescription>
                    Secure your account with TOTP via an authenticator app.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 w-full">
                  {isTotpEnrolled ? (
                    <div className="w-full">
                      <p className="text-sm text-muted-foreground">
                        TOTP MFA is enabled.
                      </p>
                      <Button
                        variant="destructive"
                        onClick={handleUnenroll}
                        className="w-full"
                      >
                        Disable TOTP MFA
                      </Button>
                    </div>
                  ) : (
                    <Dialog
                      open={enrollmentStep !== "idle"}
                      onOpenChange={() => setEnrollmentStep("idle")}
                    >
                      <DialogTrigger asChild>
                        <Button onClick={handleEnroll} className="w-full">
                          Enable TOTP MFA
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            {enrollmentStep === "verifying"
                              ? "Verify Enrollment"
                              : "Enroll in TOTP MFA"}
                          </DialogTitle>
                          <DialogDescription>
                            {enrollmentStep === "verifying"
                              ? "Enter the 6-digit code from your authenticator app."
                              : "Follow the steps to set up TOTP."}
                          </DialogDescription>
                        </DialogHeader>
                        {enrollmentStep === "verifying" && totpSecret && (
                          <div className="space-y-4">
                            <div className="text-center bg-white p-5 rounded">
                              <QRCodeSVG
                                value={totpSecret.generateQrCodeUrl(
                                  user.email!,
                                  "AutoStyles"
                                )}
                                size={200}
                                className="m-auto"
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                Or use secret: {totpSecret.secretKey}
                              </p>
                            </div>
                            <Field>
                              <FieldLabel>Verification Code</FieldLabel>
                              <Input
                                type="text"
                                maxLength={6}
                                value={verificationCode}
                                onChange={(e) =>
                                  setVerificationCode(
                                    e.target.value.replace(/\D/g, "")
                                  )
                                }
                                placeholder="123456"
                              />
                            </Field>
                            <Button
                              onClick={handleVerifyEnrollment}
                              className="w-full"
                              disabled={verificationCode.length !== 6}
                            >
                              Verify and Enroll
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
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
                  <ModeToggle />
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

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Legal & Support
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Access important links
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <Link
                    href="/c/privacy"
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
                    href="/c/terms"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Terms of Service
                  </Link>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
                <div className="flex justify-between">
                  <Link
                    href="/c/contact"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Contact Support
                  </Link>
                  <Button variant="ghost" size="sm">
                    <Bell className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reauth Dialog for Unenroll or Change Password */}
        <Dialog open={showReauthDialog} onOpenChange={setShowReauthDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reauthenticate</DialogTitle>
              <DialogDescription>
                Enter your credentials to confirm the action.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={reauthEmail}
                  onChange={(e) => setReauthEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </Field>
              <Field>
                <FieldLabel>Password</FieldLabel>
                <Input
                  type="password"
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReauthDialog(false);
                  setReauthFor(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReauthSubmit}
                disabled={!reauthEmail || !reauthPassword}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Logout Confirmation Dialog */}
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Logout</DialogTitle>
              <DialogDescription>
                Are you sure you want to log out? You will need to sign in
                again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowLogoutDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AccountPage;
