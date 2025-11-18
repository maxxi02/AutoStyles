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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  const [showTermsDialog, setShowTermsDialog] = useState<boolean>(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState<boolean>(false);


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

                  <p className="text-center text-[12px] p-0 m-0">
                    By signing up, you agree to our{" "}
                    <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
                      <DialogTrigger asChild>
                        <a href="#" className="underline cursor-pointer">
                          terms of service
                        </a>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Terms of Service — AutoStyles</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 text-sm">
                          <p><strong>Effective date:</strong> 2025-05-17</p>
                          <p><strong>Service provided for:</strong> Danny Auto Paint With Oven (Malinis, Lemery, Batangas)</p>
                          <p><strong>Developer/Contact:</strong> 0917 725 0985/autowerkesph@gmail.com</p>

                          <div className="space-y-3">
                            <h3 className="font-semibold">1. Acceptance</h3>
                            <p>By using AutoStyles (website) you agree to these Terms of Service (ToS). If you do not agree, do not use the service.</p>

                            <h3 className="font-semibold">2. Scope of Service</h3>
                            <p>AutoStyles is a web application that provides:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>Interactive 2D previews of supported car models.</li>
                              <li>Color selection from a predefined palette (50 colors) and finishes.</li>
                              <li>Transaction creation (online and face-to-face), price estimation, cashier features, and digital receipts.</li>
                              <li>Supported brands: Toyota, Honda, Mitsubishi, Isuzu (selected models). Desktop web access is the primary platform.</li>
                            </ul>

                            <h3 className="font-semibold">3. Accounts</h3>
                            <p>You may create an account using email/phone. You are responsible for maintaining account confidentiality. You agree to provide accurate information and keep it up-to-date. We may suspend or terminate accounts that violate these ToS.</p>

                            <h3 className="font-semibold">4. Acceptable Use</h3>
                            <p>You may use the service only for lawful purposes and in accordance with these ToS. Prohibited activities include:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>Reverse-engineering the service or extracting assets (2D models, color libraries).</li>
                              <li>Uploading unlawful or infringing content.</li>
                              <li>Attempting to breach security or impair service functionality.</li>
                              <li>Using the system for other shops (service is exclusively for Danny Auto Paint With Oven per the current deployment).</li>
                            </ul>

                            <h3 className="font-semibold">5. Transactions, Payments & Pricing</h3>
                            <p>AutoStyles provides price estimates and prepares digital receipts. Actual payment/fulfillment is subject to Danny Auto Paint With Oven&#39;s policies. Cancellation, refunds, and deposit terms are governed by the shop&#39;s policy; AutoStyles provides the digital record. Discounts supported: loyalty, senior citizen, student (as configured).</p>

                            <h3 className="font-semibold">6. Intellectual Property</h3>
                            <p>All content, code, 2D models, designs, and trademarks provided by AutoStyles or the developer are owned by the developer / licensed partners. You retain ownership of any content you upload, but by uploading you grant AutoStyles a license to use the content to provide the service (viewing, storing, rendering, and sharing with shop staff to fulfill orders).</p>

                            <h3 className="font-semibold">7. User Content</h3>
                            <p>You are responsible for the content you create or upload. You warrant that you have the rights to upload such content. We may remove content that violates rights or policies.</p>

                            <h3 className="font-semibold">8. Privacy</h3>
                            <p>Use of the service is subject to the AutoStyles Privacy Policy. By using the service you agree to the collection and use of your data as described.</p>

                            <h3 className="font-semibold">9. Disclaimers & Limitation of Liability</h3>
                            <p><strong>No warranty:</strong> AutoStyles is provided as is. We do not guarantee that the 3D preview precisely matches final paint results (metamerism and physical paint differences may occur). The preview is an approximation to assist planning.</p>
                            <p><strong>Limitation of liability:</strong> To the maximum extent permitted by law, neither AutoStyles nor its developers will be liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the service. Our aggregate liability for direct damages will not exceed fees actually paid by you for the related service (if any), or PHP 10,000, whichever is lower.</p>

                            <h3 className="font-semibold">10. Indemnification</h3>
                            <p>You agree to indemnify AutoStyles and its officers, employees and agents from any breach of these ToS or claims arising from your content or misuse of the service.</p>

                            <h3 className="font-semibold">11. Termination</h3>
                            <p>We reserve the right to suspend or terminate accounts for policy violations, illegal activity, or at our discretion. You may delete your account in accordance with the Privacy Policy; outstanding transactions may be completed or retained for legal/accounting reasons.</p>

                            <h3 className="font-semibold">12. Changes to Terms</h3>
                            <p>We may change these ToS. We will notify users of material changes; continued use after notice constitutes acceptance.</p>

                            <h3 className="font-semibold">13. Governing Law & Dispute Resolution</h3>
                            <p>These ToS are governed by the laws of the Philippines. Disputes shall be resolved by amicable negotiation and, if needed, under the jurisdiction of the Philippine courts.</p>

                            <h3 className="font-semibold">14. Contact</h3>
                            <p>For questions, data subject requests, disputes, or support:<br />
                              Email: autowerkesph@gmail.com<br />
                              Contact: 0917 725 0985</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => setShowTermsDialog(false)}>Close</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    {" "}and{" "}
                    <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
                      <DialogTrigger asChild>
                        <a href="#" className="underline cursor-pointer">
                          privacy policy
                        </a>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Privacy Policy — AutoStyles</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 text-sm">
                          <p><strong>Effective date:</strong> 2025-05-17</p>
                          <p><strong>Owner / Controller:</strong> AutoStyles</p>
                          <p><strong>Contact:</strong> 0917 725 0985/autowerkesph@gmail.com</p>

                          <div className="space-y-3">
                            <h3 className="font-semibold">1. Summary</h3>
                            <p>AutoStyles provides a web-based car paint visualization and customization service for Danny Auto Paint With Oven. This Privacy Policy explains what personal data we collect, why we collect it, how we use it, with whom we share it, and the rights you have over your data. The system is designed and operated in compliance with the Philippine Data Privacy Act of 2012 (RA 10173).</p>

                            <h3 className="font-semibold">2. Data We Collect</h3>

                            <h4 className="font-medium">Account & identity data</h4>
                            <p>Name, email address, phone number, profile picture (if provided), username, and hashed password.</p>

                            <h4 className="font-medium">Vehicle & customization data</h4>
                            <p>Car brand and model selection, selected paint colors (from the available palette), paint finish type, saved designs and 2D preview metadata.</p>

                            <h4 className="font-medium">Transaction data</h4>
                            <p>Order details, pricing, discounts applied (loyalty / senior / student), payment method (if stored), receipts and status of transactions.</p>

                            <h4 className="font-medium">Usage & device data</h4>
                            <p>IP address, browser type, device type, operating system, pages visited, interaction logs (e.g., color previews), timestamps, and performance logs.</p>

                            <h4 className="font-medium">Uploaded files</h4>
                            <p>Any images or files you upload (e.g., photos for visualization) — stored in Cloud Firestore.</p>

                            <h4 className="font-medium">Cookies & tracking</h4>
                            <p>Cookies and similar technologies for session management, preferences, and basic analytics.</p>

                            <h3 className="font-semibold">3. How We Use Your Data</h3>
                            <p>We use collected data to:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>Provide and maintain the AutoStyles service (2D preview, transactions, cashier features).</li>
                              <li>Process orders, compute prices, generate receipts, and notify shop staff.</li>
                              <li>Improve service functionality, analytics, and performance monitoring.</li>
                              <li>Communicate with you (order confirmations, status updates, password resets).</li>
                              <li>Comply with legal obligations and protect our rights.</li>
                            </ul>

                            <h3 className="font-semibold">4. Legal Basis & Compliance</h3>
                            <p>We process personal data under legal bases including consent, contractual necessity (processing orders), and legitimate interests (service improvement and fraud prevention). We comply with RA 10173.</p>

                            <h3 className="font-semibold">5. Data Sharing</h3>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>Service providers (cloud hosting/storage, email, analytics, payments) — e.g., Firebase services used for hosting, storage, functions, and authentication.</li>
                              <li>Legal authorities when required by law or to protect rights.</li>
                            </ul>
                            <p>We require providers to maintain appropriate security and confidentiality.</p>

                            <h3 className="font-semibold">6. Data Retention</h3>
                            <p>We retain personal and transaction data as long as needed to provide the service and to meet legal, tax, or operational requirements. Users may request deletion subject to legal/operational constraints.</p>

                            <h3 className="font-semibold">7. Security</h3>
                            <p>We implement reasonable technical and organizational measures: HTTPS encryption, access controls, hashed passwords, and secure cloud storage. Despite our efforts, no online system is 100% secure; if a breach occurs we will follow required notification procedures.</p>

                            <h3 className="font-semibold">8. Your Rights</h3>
                            <p>You have the right to:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>Access your personal data.</li>
                              <li>Request correction of inaccurate data.</li>
                              <li>Request deletion (subject to legal/transactional limits).</li>
                              <li>Object to certain processing or request restriction.</li>
                              <li>Portability of your data where technically feasible.</li>
                            </ul>
                            <p>To exercise rights, contact: autowerkesph@gmail.com</p>

                            <h3 className="font-semibold">9. Minors</h3>
                            <p>AutoStyles is not directed to children under 17. We do not knowingly collect personal data from children under the applicable age without parental consent.</p>

                            <h3 className="font-semibold">10. Changes to This Policy</h3>
                            <p>We may update this policy. Material changes will be posted with a new effective date.</p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => setShowPrivacyDialog(false)}>Close</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </p>
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
