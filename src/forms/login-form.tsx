"use client";

import { cn } from "@/lib/utils";
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
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  MultiFactorResolver,
  MultiFactorError,
  User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

interface LoginAttempt {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loading, setLoading] = useState<boolean>(false);
  const [emailValue, setEmailValue] = useState<string>("");
  const [resetEmailValue, setResetEmailValue] = useState<string>("");
  const [showForgotDialog, setShowForgotDialog] = useState<boolean>(false);
  const [showTotpDialog, setShowTotpDialog] = useState<boolean>(false);
  const [multiFactorResolver, setMultiFactorResolver] =
    useState<MultiFactorResolver | null>(null);
  const [totpCode, setTotpCode] = useState<string>("");
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockoutTime, setLockoutTime] = useState<number>(0);
  const [countdown, setCountdown] = useState<string>("");
  const router = useRouter();

  // Countdown timer effect
  useEffect(() => {
    if (!isLocked || lockoutTime <= Date.now()) {
      setIsLocked(false);
      setCountdown("");
      return;
    }

    const interval = setInterval(() => {
      const remaining = lockoutTime - Date.now();
      if (remaining <= 0) {
        setIsLocked(false);
        setCountdown("");
        clearInterval(interval);
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setCountdown(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, lockoutTime]);

  const getAttemptDocRef = (email: string) => {
    // Create a safe document ID from email
    const sanitizedEmail = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
    return doc(db, "loginAttempts", sanitizedEmail);
  };

  const checkLoginAttempts = async (email: string): Promise<boolean> => {
    try {
      const attemptRef = getAttemptDocRef(email);
      const attemptDoc = await getDoc(attemptRef);

      if (!attemptDoc.exists()) {
        return true; // No attempts yet, allow login
      }

      const data = attemptDoc.data() as LoginAttempt;

      // Check if locked
      if (data.lockedUntil && data.lockedUntil > Date.now()) {
        setIsLocked(true);
        setLockoutTime(data.lockedUntil);
        return false;
      }

      // Reset if lockout has expired
      if (data.lockedUntil && data.lockedUntil <= Date.now()) {
        await updateDoc(attemptRef, {
          attempts: 0,
          lockedUntil: null,
        });
      }

      return true;
    } catch (error) {
      console.error("Error checking login attempts:", error);
      return true; // Allow login on error to not block legitimate users
    }
  };

  const recordFailedAttempt = async (email: string) => {
    try {
      const attemptRef = getAttemptDocRef(email);
      const attemptDoc = await getDoc(attemptRef);

      if (!attemptDoc.exists()) {
        await setDoc(attemptRef, {
          attempts: 1,
          lockedUntil: null,
          lastAttempt: Date.now(),
        });
        return;
      }

      const data = attemptDoc.data() as LoginAttempt;
      const newAttempts = data.attempts + 1;

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCKOUT_DURATION;
        await updateDoc(attemptRef, {
          attempts: newAttempts,
          lockedUntil,
          lastAttempt: Date.now(),
        });
        setIsLocked(true);
        setLockoutTime(lockedUntil);
        toast.error("Account Locked", {
          description: `Too many failed attempts. Account locked for 10 minutes.`,
        });
      } else {
        await updateDoc(attemptRef, {
          attempts: newAttempts,
          lastAttempt: Date.now(),
        });
        const remaining = MAX_ATTEMPTS - newAttempts;
        toast.warning("Login Failed", {
          description: `${remaining} attempt${remaining !== 1 ? "s" : ""} remaining before lockout.`,
        });
      }
    } catch (error) {
      console.error("Error recording failed attempt:", error);
    }
  };

  const clearLoginAttempts = async (email: string) => {
    try {
      const attemptRef = getAttemptDocRef(email);
      await setDoc(attemptRef, {
        attempts: 0,
        lockedUntil: null,
        lastAttempt: Date.now(),
      });
    } catch (error) {
      console.error("Error clearing login attempts:", error);
    }
  };

  const fetchUserRole = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return data?.role || "user";
      }
      return "user";
    } catch (error) {
      console.error("Error fetching user role:", error);
      return "user";
    }
  };

  const setCookie = (name: string, value: string) => {
    const expires = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toUTCString();
    document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Strict; Secure`;
  };

  const handleSuccessLogin = async (user: User) => {
    const role = await fetchUserRole(user.uid);
    const token = await user.getIdToken();

    setCookie("authToken", token);
    setCookie("userRole", role);

    // Clear login attempts on successful login
    await clearLoginAttempts(emailValue);

    if (role === "admin") {
      router.push("/a/dashboard");
    } else if (role === "autoworker") {
      router.push("/w/dashboard");
    } else {
      router.push("/c/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      toast.error("Error", {
        description: "Please fill in all fields.",
      });
      setLoading(false);
      return;
    }

    // Check if account is locked
    const canAttempt = await checkLoginAttempts(email);
    if (!canAttempt) {
      setLoading(false);
      return;
    }

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      if (!user.emailVerified) {
        await signOut(auth);
        toast.error("Verification Required", {
          description:
            "Please verify your email before logging in. Check your inbox (including spam) for the verification link.",
        });
        return;
      }

      await handleSuccessLogin(user);
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      
      if (firebaseError.code === "auth/multi-factor-auth-required") {
        const multiFactorError = error as MultiFactorError;
        setMultiFactorResolver(getMultiFactorResolver(auth, multiFactorError));
        setShowTotpDialog(true);
        return;
      }

      // Record failed attempt
      await recordFailedAttempt(email);

      let description = "An unexpected error occurred.";
      switch (firebaseError.code) {
        case "auth/user-not-found":
          description = "No account with this email exists.";
          break;
        case "auth/wrong-password":
          description = "Incorrect password.";
          break;
        case "auth/invalid-email":
          description = "Invalid email address.";
          break;
        case "auth/too-many-requests":
          description = "Too many failed attempts. Please try again later.";
          break;
        case "auth/invalid-credential":
          description = "Invalid email or password.";
          break;
        default:
          description =
            firebaseError.message ?? "An unexpected error occurred.";
      }

      // Only show the basic error if not already showing lockout warning
      if (!isLocked) {
        toast.error("Login Failed", {
          description,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTotpSubmit = async () => {
    if (!multiFactorResolver || !totpCode.trim()) return;
    try {
      const hint = multiFactorResolver.hints[0];
      if (hint.factorId === TotpMultiFactorGenerator.FACTOR_ID) {
        const multiFactorAssertion =
          TotpMultiFactorGenerator.assertionForSignIn(
            hint.uid,
            totpCode.trim()
          );
        const userCredential =
          await multiFactorResolver.resolveSignIn(multiFactorAssertion);
        await handleSuccessLogin(userCredential.user);
      }
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      toast.error("TOTP Verification Failed", {
        description: firebaseError.message ?? "Invalid code. Please try again.",
      });
    } finally {
      setShowTotpDialog(false);
      setTotpCode("");
      setMultiFactorResolver(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmailValue.trim()) {
      toast.error("Error", {
        description: "Please enter your email address.",
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmailValue.trim());
      toast.success("Success", {
        description:
          "Password reset email sent! Check your inbox (including spam).",
      });
      setShowForgotDialog(false);
      setResetEmailValue("");
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      let description = "An unexpected error occurred.";
      switch (firebaseError.code) {
        case "auth/user-not-found":
          description = "No account with this email exists.";
          break;
        case "auth/invalid-email":
          description = "Invalid email address.";
          break;
        default:
          description =
            firebaseError.message ?? "An unexpected error occurred.";
      }
      toast.error("Reset Failed", {
        description,
      });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLocked && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Account locked due to multiple failed login attempts. Please try
                again in <strong>{countdown}</strong>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  name="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  disabled={isLocked}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Dialog
                    open={showForgotDialog}
                    onOpenChange={setShowForgotDialog}
                  >
                    <DialogTrigger asChild>
                      <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline cursor-pointer"
                      >
                        Forgot your password?
                      </a>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                          Enter your email address and we&#39;ll send you a link
                          to reset your password.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Field>
                          <FieldLabel htmlFor="reset-email">Email</FieldLabel>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="m@example.com"
                            value={resetEmailValue}
                            onChange={(e) => setResetEmailValue(e.target.value)}
                          />
                        </Field>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowForgotDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={loading}
                        >
                          Send Reset Link
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  disabled={isLocked}
                  required
                />
              </Field>

              <Field>
                <Button
                  type="submit"
                  disabled={loading || isLocked}
                  className="w-full"
                >
                  {loading ? "Logging In..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Do not have an account?{" "}
                  <Link href="/register" className="underline">
                    Sign up
                  </Link>{" "}
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/* TOTP MFA Dialog */}
      <Dialog open={showTotpDialog} onOpenChange={setShowTotpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter TOTP Code</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your authenticator app to complete
              login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field>
              <FieldLabel>TOTP Code</FieldLabel>
              <Input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="6 Digit Authenticator Code"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowTotpDialog(false);
                setMultiFactorResolver(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleTotpSubmit}
              disabled={totpCode.length !== 6 || loading}
            >
              Verify Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}