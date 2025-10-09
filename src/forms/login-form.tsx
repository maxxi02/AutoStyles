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
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
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
  const router = useRouter();

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

      toast.success("Success", {
        description: "Logged in successfully!",
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
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

      toast.success("Success", {
        description: "Logged in with Google successfully!",
      });
      router.push("/dashboard");
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
                  Don&#39;t have an account?{" "}
                  <Link href="/register" className="underline">
                    Sign up
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
