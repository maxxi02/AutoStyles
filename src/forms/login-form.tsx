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
import { useState } from "react";
import { toast } from "sonner";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  MultiFactorResolver,
  MultiFactorError,
  User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { doc, getDoc } from "firebase/firestore";
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
  const router = useRouter();

  const fetchUserRole = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return data?.role || "user"; // Default to user if no role
      }
      return "user";
    } catch (error) {
      console.error("Error fetching user role:", error);
      return "user"; // Fallback
    }
  };

  const setRoleCookie = (role: string) => {
    // Set cookie with 7 days expiration (adjust as needed)
    const expires = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toUTCString();
    document.cookie = `user-role=${role}; path=/; expires=${expires}; SameSite=Strict; Secure`;
  };

  const handleSuccessLogin = async (user: User) => {
    const role = await fetchUserRole(user.uid);
    setRoleCookie(role);
    const dashboardPath = role === "admin" ? "/a/dashboard" : "/c/dashboard";
    toast.success("Success", {
      description: "Logged in successfully!",
    });
    router.push(dashboardPath);
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

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // Check if email is verified
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
      const hint = multiFactorResolver.hints[0]; // Assume first hint is TOTP
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

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // For Google login, email is typically verified by default, but check anyway
      if (!user.emailVerified) {
        await signOut(auth);
        toast.error("Verification Required", {
          description: "Please verify your email before logging in.",
        });
        return;
      }

      await handleSuccessLogin(user);
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      toast.error("Google Login Failed", {
        description: firebaseError.message ?? "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
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
                <Input id="password" type="password" name="password" required />
              </Field>
              <Field>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Logging In..." : "Login"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full mt-2"
                >
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Do not have an account?{" "}
                  <Link href="/register" className="underline">
                    Sign up
                  </Link>
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
                placeholder="123456"
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
