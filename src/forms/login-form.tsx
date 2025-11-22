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
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const router = useRouter();

  // Timer effect for locked account countdown
  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1000) {
            setIsLocked(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  const getAttemptDocId = (email: string): string => {
    // Hash email for privacy (simple hash for demo, use crypto in production)
    return btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, "");
  };

  const checkLoginAttempts = async (
    email: string
  ): Promise<{ allowed: boolean; remainingTime?: number }> => {
    try {
      const attemptId = getAttemptDocId(email);
      const attemptRef = doc(db, "loginAttempts", attemptId);
      const attemptDoc = await getDoc(attemptRef);

      if (!attemptDoc.exists()) {
        return { allowed: true };
      }

      const data = attemptDoc.data() as LoginAttempt;
      const now = Date.now();

      // Check if account is locked
      if (data.lockedUntil && data.lockedUntil > now) {
        const remaining = data.lockedUntil - now;
        return { allowed: false, remainingTime: remaining };
      }

      // Reset if lockout has expired
      if (data.lockedUntil && data.lockedUntil <= now) {
        await setDoc(attemptRef, {
          attempts: 0,
          lockedUntil: null,
          lastAttempt: now,
        });
        return { allowed: true };
      }

      // Check if max attempts reached
      if (data.attempts >= MAX_ATTEMPTS) {
        const lockedUntil = now + LOCKOUT_DURATION;
        await setDoc(
          attemptRef,
          {
            lockedUntil,
            lastAttempt: now,
          },
          { merge: true }
        );
        return { allowed: false, remainingTime: LOCKOUT_DURATION };
      }

      return { allowed: true };
    } catch (error) {
      console.error("Error checking login attempts:", error);
      return { allowed: true }; // Fail open to avoid locking legitimate users
    }
  };

  const recordFailedAttempt = async (email: string): Promise<void> => {
    try {
      const attemptId = getAttemptDocId(email);
      const attemptRef = doc(db, "loginAttempts", attemptId);
      const attemptDoc = await getDoc(attemptRef);
      const now = Date.now();

      if (!attemptDoc.exists()) {
        await setDoc(attemptRef, {
          attempts: 1,
          lockedUntil: null,
          lastAttempt: now,
        });
        return;
      }

      const data = attemptDoc.data() as LoginAttempt;
      const newAttempts = data.attempts + 1;

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = now + LOCKOUT_DURATION;
        await setDoc(attemptRef, {
          attempts: newAttempts,
          lockedUntil,
          lastAttempt: now,
        });
        setIsLocked(true);
        setRemainingTime(LOCKOUT_DURATION);
      } else {
        await setDoc(attemptRef, {
          attempts: newAttempts,
          lockedUntil: null,
          lastAttempt: now,
        });
      }
    } catch (error) {
      console.error("Error recording failed attempt:", error);
    }
  };

  const clearLoginAttempts = async (email: string): Promise<void> => {
    try {
      const attemptId = getAttemptDocId(email);
      const attemptRef = doc(db, "loginAttempts", attemptId);
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

    if (role === "admin") {
      router.push("/a/dashboard");
    } else if (role === "autoworker") {
      router.push("/w/dashboard");
    } else {
      router.push("/c/dashboard");
    }
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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
    const { allowed, remainingTime: lockTime } = await checkLoginAttempts(
      email
    );
    if (!allowed && lockTime) {
      setIsLocked(true);
      setRemainingTime(lockTime);
      toast.error("Account Temporarily Locked", {
        description: `Too many failed login attempts. Please try again in ${formatTime(
          lockTime
        )}.`,
      });
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
        setLoading(false);
        return;
      }

      // Clear failed attempts on successful login
      await clearLoginAttempts(email);
      await handleSuccessLogin(user);
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;

      if (firebaseError.code === "auth/multi-factor-auth-required") {
        const multiFactorError = error as MultiFactorError;
        setMultiFactorResolver(getMultiFactorResolver(auth, multiFactorError));
        setShowTotpDialog(true);
        setLoading(false);
        return;
      }

      // Record failed attempt for auth errors
      if (
        firebaseError.code === "auth/wrong-password" ||
        firebaseError.code === "auth/user-not-found" ||
        firebaseError.code === "auth/invalid-credential"
      ) {
        await recordFailedAttempt(email);
      }

      let description = "An unexpected error occurred.";
      switch (firebaseError.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          description = "Invalid email or password.";
          break;
        case "auth/invalid-email":
          description = "Invalid email address.";
          break;
        case "auth/too-many-requests":
          description = "Too many failed attempts. Please try again later.";
          break;
        default:
          description =
            firebaseError.message ?? "An unexpected error occurred.";
      }
      toast.error("Login Failed", {
        description,
      });
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
          TotpMultiFactorGenerator.assertionForSignIn(hint.uid, totpCode.trim());
        const userCredential =
          await multiFactorResolver.resolveSignIn(multiFactorAssertion);
        
        // Clear failed attempts on successful MFA login
        if (emailValue) {
          await clearLoginAttempts(emailValue);
        }
        
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
                  required
                  disabled={isLocked}
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
                  required
                  disabled={isLocked}
                />
              </Field>

              {isLocked && remainingTime > 0 && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-red-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="text-sm font-medium text-red-800">
                      Account Temporarily Locked
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-2xl font-bold text-red-700 tabular-nums">
                      {formatTime(remainingTime)}
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Too many failed login attempts
                    </div>
                  </div>
                </div>
              )}

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