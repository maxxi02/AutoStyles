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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
  onAuthStateChanged,
  User,
  MultiFactorInfo,
  signOut,
  updatePassword,
  updateProfile,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  multiFactor,
  TotpMultiFactorGenerator,
  TotpSecret,
  EmailAuthProvider,
} from "firebase/auth";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";

interface UserData {
  name?: string;
  phone?: string;
  address?: string;
  username?: string;
  role?: string;
}

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [userData, setUserData] = useState<UserData>({});
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
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
  const [reauthEmail, setReauthEmail] = useState<string>("");
  const [reauthPassword, setReauthPassword] = useState<string>("");
  const [reauthFor, setReauthFor] = useState<"unenroll" | "password" | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserRole(data?.role || "user");
            setUserData(data);
            setEditForm({
              name: data.name || currentUser.displayName || "",
              phone: data.phone || "",
              address: data.address || "",
              username: data.username || currentUser.email || "",
            });
          } else {
            setUserRole("user");
            setUserData({});
            setEditForm({
              name: currentUser.displayName || "",
              phone: "",
              address: "",
              username: currentUser.email || "",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserRole("user");
          setUserData({});
          setEditForm({
            name: currentUser.displayName || "",
            phone: "",
            address: "",
            username: currentUser.email || "",
          });
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
        setMfaEnrolledFactors([]);
        setUserRole("user");
        setUserData({});
      }
    });
    return unsubscribe;
  }, []);

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
  };

  const handleEditProfile = async () => {
    if (!user) return;
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: editForm.name });
      // Update Firestore
      await updateDoc(doc(db, "users", user.uid), {
        name: editForm.name,
        phone: editForm.phone,
        address: editForm.address,
        username: editForm.username,
      });
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

  const handleChangePassword = async () => {
    if (!user || !currentPassword || !newPassword || !confirmNewPassword)
      return;
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
    try {
      // Reauthenticate first
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setShowChangePasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Success", {
        description: "Password changed successfully!",
      });
    } catch (error: unknown) {
      const err = error as Error;
      if (
        err.message.includes("auth/wrong-password") ||
        err.message.includes("auth/user-mismatch")
      ) {
        toast.error("Error", { description: "Incorrect current password." });
      } else {
        toast.error("Change Failed", { description: err.message });
      }
    }
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
        setShowReauthDialog(true);
        toast.error("Reauthentication Required", {
          description: "Please re-enter your credentials to unenroll.",
        });
      } else {
        toast.error("Unenroll Failed", { description: err.message });
      }
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

  const handleReauthAndChangePassword = async () => {
    if (!user || !reauthEmail || !reauthPassword) return;
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
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: unknown) {
      const err = error as Error;
      toast.error("Reauthentication Failed", { description: err.message });
    }
  };

  const handleReauthSubmit = () => {
    if (reauthFor === "password") {
      handleReauthAndChangePassword();
    } else {
      handleReauthAndUnenroll();
    }
  };

  if (!user) {
    return <div>Please log in to access settings.</div>;
  }

  const isTotpEnrolled = mfaEnrolledFactors.some(
    (f: MultiFactorInfo) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID
  );

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold">Account Settings</h1>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input value={userData.name || ""} disabled />
            </Field>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={user.email || ""} disabled />
            </Field>
            <Field>
              <FieldLabel>Phone</FieldLabel>
              <Input value={userData.phone || ""} disabled />
            </Field>
            <Field>
              <FieldLabel>Address</FieldLabel>
              <Input value={userData.address || ""} disabled />
            </Field>
            <Field>
              <FieldLabel>Username</FieldLabel>
              <Input value={userData.username || ""} disabled />
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <Input value={userRole} disabled />
            </Field>
          </FieldGroup>
          <div className="pt-4">
            <Dialog
              open={showEditProfileDialog}
              onOpenChange={setShowEditProfileDialog}
            >
              <DialogTrigger asChild>
                <Button className="w-full">Edit Profile</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update your profile details.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Phone</FieldLabel>
                    <Input
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Address</FieldLabel>
                    <Input
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Username</FieldLabel>
                    <Input
                      value={editForm.username}
                      onChange={(e) =>
                        setEditForm({ ...editForm, username: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditProfileDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEditProfile}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full mt-2"
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password securely.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog
            open={showChangePasswordDialog}
            onOpenChange={setShowChangePasswordDialog}
          >
            <DialogTrigger asChild>
              <Button>Change Password</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter your current password and new password.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Field>
                  <FieldLabel>Current Password</FieldLabel>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                  />
                </Field>
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
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
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
                  onClick={handleChangePassword}
                  disabled={
                    !currentPassword || !newPassword || !confirmNewPassword
                  }
                >
                  Change Password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* MFA Section */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Factor Authentication (MFA)</CardTitle>
          <CardDescription>
            Secure your account with TOTP via an authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTotpEnrolled ? (
            <div>
              <p className="text-sm text-muted-foreground">
                TOTP MFA is enabled.
              </p>
              <Button variant="destructive" onClick={handleUnenroll}>
                Disable TOTP MFA
              </Button>
            </div>
          ) : (
            <Dialog
              open={enrollmentStep !== "idle"}
              onOpenChange={() => setEnrollmentStep("idle")}
            >
              <DialogTrigger asChild>
                <Button onClick={handleEnroll}>Enable TOTP MFA</Button>
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
                    <div className="text-center bg-white p-5">
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
                          setVerificationCode(e.target.value.replace(/\D/g, ""))
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
    </div>
  );
};

export default Settings;
