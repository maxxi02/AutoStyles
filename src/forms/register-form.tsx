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
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { auth, db } from "@/lib/firebase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [formState, setFormState] = useState({
    name: "",
    phone: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [showVerificationModal, setShowVerificationModal] =
    useState<boolean>(false);
  const router = useRouter();

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    if (!name || !email || !phone || !password || !confirmPassword) {
      toast.error("Error", {
        description: "Please fill in all fields.",
      });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Error", {
        description: "Passwords do not match.",
      });
      setLoading(false);
      return;
    }

    if (name.length < 2) {
      toast.error("Error", {
        description: "Name must be at least 2 characters.",
      });
      setLoading(false);
      return;
    }

    if (phone.length < 11) {
      toast.error("Error", {
        description: "Phone number must be at least 11 characters.",
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Error", {
        description: "Password must be at least 6 characters.",
      });
      setLoading(false);
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(user, { displayName: name });

      // Store additional user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email: user.email,
        phone,
        role: email === adminEmail ? "admin" : "user",
        createdAt: new Date(),
      });

      // Send email verification
      await sendEmailVerification(user);

      setShowVerificationModal(true);
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      let description = "An unexpected error occurred.";
      switch (firebaseError.code) {
        case "auth/email-already-in-use":
          description = "An account with this email already exists.";
          break;
        case "auth/weak-password":
          description = "Password should be at least 6 characters.";
          break;
        case "auth/invalid-email":
          description = "Invalid email address.";
          break;
        default:
          description =
            firebaseError.message ?? "An unexpected error occurred.";
      }
      toast.error("Registration Failed", {
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModalConfirm = () => {
    setShowVerificationModal(false);
    router.push("/login");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Enter your details below to sign up for AutoStyles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  name="name"
                  value={formState.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[a-zA-Z\s\-']*$/.test(val)) {
                      setFormState({ ...formState, name: val });
                    }
                  }}
                  onKeyPress={(e) => {
                    const charCode = e.charCode;
                    if (
                      (charCode < 65 || charCode > 90) &&
                      (charCode < 97 || charCode > 122) &&
                      charCode !== 32 &&
                      charCode !== 45 &&
                      charCode !== 39
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
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formState.name.length}/50 characters
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  name="email"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+63 912 345 6789"
                  name="phone"
                  value={formState.phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9\s\-\(\)\+]*$/.test(val)) {
                      setFormState({ ...formState, phone: val });
                    }
                  }}
                  onKeyPress={(e) => {
                    const charCode = e.charCode;
                    if (
                      (charCode < 48 || charCode > 57) &&
                      charCode !== 32 &&
                      charCode !== 45 &&
                      charCode !== 40 &&
                      charCode !== 41 &&
                      charCode !== 43
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
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formState.phone.length}/11 characters
                </p>
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" type="password" name="password" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm Password
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  required
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating Account..." : "Sign Up"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{" "}
                  <Link href="/login" className="underline">
                    Login
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <AlertDialog
        open={showVerificationModal}
        onOpenChange={setShowVerificationModal}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account Created Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              Please check your email (including spam/junk folder) for a
              verification link. You&#39;ll need to verify your account before
              accessing full features. Once verified, you can log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleModalConfirm}>
            Got it, I&#39;ll check my email
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
