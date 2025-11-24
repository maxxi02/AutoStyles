"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
  const [showTermsCheckModal, setShowTermsCheckModal] = useState<boolean>(false);
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);
  const [pendingFormData, setPendingFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    password: string;
  } | null>(null);


  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

  // Validate if phone number is Philippine format
  const isValidPhilippineNumber = (phone: string): boolean => {
    // Remove spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    
    // Valid Philippine formats:
    // 09XXXXXXXXX (11 digits starting with 09)
    // +639XXXXXXXXX (with +63 country code)
    // 639XXXXXXXXX (with 63 country code)
    return /^(09\d{9}|\+639\d{9}|639\d{9})$/.test(cleaned);
  };

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

    if (!isValidPhilippineNumber(phone)) {
      toast.error("Error", {
        description: "Please enter a valid Philippine phone number (09XX XXX XXXX or +63 9XX XXX XXXX).",
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

    // Store form data and show terms modal
    setPendingFormData({ name, email, phone, password });
    setShowTermsCheckModal(true);
    setTermsAgreed(false);
    setLoading(false);
  };

  const handleCreateAccount = async () => {
    if (!pendingFormData) return;
    if (!termsAgreed) {
      toast.error("Error", {
        description: "You must agree to the Terms and Conditions to proceed.",
      });
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        pendingFormData.email,
        pendingFormData.password
      );

      await updateProfile(user, { displayName: pendingFormData.name });

      // Store additional user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: pendingFormData.name,
        email: user.email,
        phone: pendingFormData.phone,
        role: pendingFormData.email === adminEmail ? "admin" : "user",
        createdAt: new Date(),
      });

      // Send email verification
      await sendEmailVerification(user);

      setShowTermsCheckModal(false);
      setPendingFormData(null);
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
                  placeholder="09XX XXX XXXX or +63 9XX XXX XXXX"
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
                  maxLength={20}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Philippine numbers only (09XX XXX XXXX or +63 9XX XXX XXXX) - {formState.phone.length} characters
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

      {/* Terms and Conditions Check Modal */}
      <Dialog open={showTermsCheckModal} onOpenChange={setShowTermsCheckModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service & Privacy Policy</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-sm max-h-96 overflow-y-auto border rounded-md p-4 bg-muted/30">
            <div>
              <h3 className="font-semibold mb-2">Terms of Service — AutoStyles</h3>
              <p><strong>Effective date:</strong> 2025-05-17</p>
              <p><strong>Service provided for:</strong> AutoWerkes (Callejon St., Brgy. Sambat 4232 Tanauan, Philippines)</p>
              <p><strong>Developer/Contact:</strong> 0917 725 0985/autowerkesph@gmail.com</p>
              
              <div className="space-y-2 mt-3">
                <p><strong>1. Acceptance</strong> - By using AutoStyles you agree to these Terms of Service.</p>
                <p><strong>2. Scope of Service</strong> - AutoStyles provides interactive 2D previews, color selection, transaction creation, price estimation, cashier features, and digital receipts for supported car models (Toyota, Honda, Mitsubishi, Isuzu).</p>
                <p><strong>3. Accounts</strong> - You are responsible for maintaining account confidentiality and providing accurate information.</p>
                <p><strong>4. Acceptable Use</strong> - You may not reverse-engineer the service, upload unlawful content, breach security, or use the system for other shops.</p>
                <p><strong>5. Transactions, Payments & Pricing</strong> - AutoStyles provides price estimates and digital receipts. Payment and fulfillment are subject to AutoWerkes policies.</p>
                <p><strong>6. Intellectual Property</strong> - All content and 2D models are owned by the developer. Your uploaded content is licensed to AutoStyles for service provision.</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Privacy Policy — AutoStyles</h3>
              <p><strong>Effective date:</strong> 2025-05-17</p>
              <p><strong>Contact:</strong> 0917 725 0985/autowerkesph@gmail.com</p>
              
              <div className="space-y-2 mt-3">
                <p><strong>Data We Collect:</strong> Name, email, phone number, vehicle preferences, transaction data, usage data, and cookies.</p>
                <p><strong>How We Use Your Data:</strong> To provide the service, process orders, improve functionality, communicate with you, and comply with legal obligations.</p>
                <p><strong>Legal Basis:</strong> We process data under consent, contractual necessity, and legitimate interests in compliance with Philippine Data Privacy Act (RA 10173).</p>
                <p><strong>Data Sharing:</strong> We share data with service providers (Firebase, email, analytics, payments) and legal authorities when required.</p>
                <p><strong>Security:</strong> We implement HTTPS encryption, access controls, hashed passwords, and secure cloud storage.</p>
                <p><strong>Your Rights:</strong> You have rights to access, correct, delete, and port your data. Contact us to exercise these rights.</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 bg-blue-100 rounded-lg border-2 border-blue-400 shadow-md">
            <Checkbox
              id="terms-agree"
              checked={termsAgreed}
              onCheckedChange={(checked) => setTermsAgreed(checked as boolean)}
              className="w-6 h-6 cursor-pointer mt-1 accent-blue-600"
            />
            <label htmlFor="terms-agree" className="text-lg font-bold text-gray-900 cursor-pointer leading-relaxed flex-1">
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setShowTermsCheckModal(false);
              setPendingFormData(null);
              setTermsAgreed(false);
            }}>
              Decline & Cancel
            </Button>
            <Button 
              onClick={handleCreateAccount} 
              disabled={!termsAgreed || loading}
            >
              {loading ? "Creating Account..." : "Agree & Sign Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
