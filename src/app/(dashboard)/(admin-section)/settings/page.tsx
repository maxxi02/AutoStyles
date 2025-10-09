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
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
} from "firebase/auth";
import {
  multiFactor,
  TotpMultiFactorGenerator,
  TotpSecret,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [mfaEnrolledFactors, setMfaEnrolledFactors] = useState<
    MultiFactorInfo[]
  >([]);
  const [enrollmentStep, setEnrollmentStep] = useState<
    "idle" | "generating" | "verifying" | "enrolled"
  >("idle");
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [unenrollId, setUnenrollId] = useState<string | null>(null);
  const [reauthEmail, setReauthEmail] = useState<string>("");
  const [reauthPassword, setReauthPassword] = useState<string>("");
  const [showReauthDialog, setShowReauthDialog] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
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
              <Input value={user.displayName || ""} disabled />
            </Field>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={user.email || ""} disabled />
            </Field>
          </FieldGroup>
          <div className="pt-4">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              Logout
            </Button>
          </div>
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

      {/* Reauth Dialog for Unenroll */}
      <Dialog open={showReauthDialog} onOpenChange={setShowReauthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reauthenticate to Unenroll</DialogTitle>
            <DialogDescription>
              Enter your credentials to confirm.
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
              onClick={() => setShowReauthDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReauthAndUnenroll}
              disabled={!reauthEmail || !reauthPassword}
            >
              Confirm and Unenroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
