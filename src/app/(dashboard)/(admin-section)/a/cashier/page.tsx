"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PayMongoPayment {
  id: string;
  type: string;
  attributes: {
    amount: number;
    currency: string;
    status: string;
    description: string;
    created_at: number;
    updated_at: number;
    paid_at: number;
    payment_intent_id: string;
    billing?: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

interface PricingRule {
  id: string;
  description: string;
  type: "discount" | "markup";
  percentage: number;
  isActive: boolean;
}

type PricingRuleData = Omit<PricingRule, "id">;

const CashierPage: React.FC = () => {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [payments, setPayments] = useState<PayMongoPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [activeTab, setActiveTab] = useState("pricing-rules");

  // State for modals
  const [isPricingRuleDialogOpen, setIsPricingRuleDialogOpen] = useState(false);
  const [editingPricingRule, setEditingPricingRule] = useState<PricingRule | null>(null);

  // Loading states for operations
  const [pricingRulePending, setPricingRulePending] = useState(false);

  // Form states
  const [newPricingRule, setNewPricingRule] = useState<Partial<PricingRuleData>>({});

  // Initial data loading state
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [snapshotCount, setSnapshotCount] = useState(0);

  // Load pricing rules from Firestore
  useEffect(() => {
    const unsubscribePricingRules = onSnapshot(
      collection(db, "pricingRules"),
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as PricingRule
        );
        setPricingRules(data);
        setSnapshotCount((prev) => {
          const next = prev + 1;
          if (next === 1) {
            setIsDataLoading(false);
          }
          return next;
        });
      }
    );

    return () => {
      unsubscribePricingRules();
    };
  }, []);

  const fetchPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const response = await fetch("/api/paymongo/payments");
      const data = await response.json();

      if (response.ok) {
        setPayments(data.data || []);
        toast.success("Payments loaded successfully");
      } else {
        toast.error(data.error || "Failed to load payments");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPayments();
    }
  }, [activeTab]);

  const handleAddOrUpdatePricingRule = async () => {
    setPricingRulePending(true);
    try {
      const pricingRuleData: PricingRuleData = {
        description: newPricingRule.description || "",
        type: newPricingRule.type || "discount",
        percentage: newPricingRule.percentage ?? 0,
        isActive: newPricingRule.isActive ?? true,
      };
      if (editingPricingRule) {
        const pricingRuleRef = doc(db, "pricingRules", editingPricingRule.id);
        await updateDoc(pricingRuleRef, pricingRuleData);
        toast.success("Pricing rule updated successfully");
      } else {
        await addDoc(collection(db, "pricingRules"), pricingRuleData);
        toast.success("Pricing rule added successfully");
      }
      setIsPricingRuleDialogOpen(false);
      setNewPricingRule({ type: "discount", isActive: true });
      setEditingPricingRule(null);
    } catch (error) {
      console.error("Error adding/updating pricing rule:", error);
      toast.error("Failed to add/update pricing rule");
    } finally {
      setPricingRulePending(false);
    }
  };

  const handleDeletePricingRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pricing rule?")) return;
    try {
      await deleteDoc(doc(db, "pricingRules", id));
      toast.success("Pricing rule deleted successfully");
    } catch (error) {
      console.error("Error deleting pricing rule:", error);
      toast.error("Failed to delete pricing rule");
    }
  };

  const openPricingRuleEdit = (rule: PricingRule) => {
    setEditingPricingRule(rule);
    setNewPricingRule({
      description: rule.description,
      type: rule.type,
      percentage: rule.percentage,
      isActive: rule.isActive,
    });
    setIsPricingRuleDialogOpen(true);
  };

  if (isDataLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pricing-rules">Pricing Rules</TabsTrigger>
          <TabsTrigger value="payments">Payments History</TabsTrigger>
        </TabsList>

        {/* Pricing Rules Tab */}
        <TabsContent value="pricing-rules">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog
                open={isPricingRuleDialogOpen}
                onOpenChange={setIsPricingRuleDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingPricingRule(null);
                      setNewPricingRule({ type: "discount", isActive: true });
                    }}
                    disabled={isDataLoading}
                  >
                    Add Pricing Rule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPricingRule
                        ? "Edit Pricing Rule"
                        : "Add Pricing Rule"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="e.g., Senior Citizen Discount, Student Discount"
                        value={newPricingRule.description ?? ""}
                        onChange={(e) =>
                          setNewPricingRule({
                            ...newPricingRule,
                            description: e.target.value,
                          })
                        }
                        disabled={pricingRulePending}
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={newPricingRule.type}
                        onValueChange={(value) =>
                          setNewPricingRule({
                            ...newPricingRule,
                            type: value as "discount" | "markup",
                          })
                        }
                        disabled={pricingRulePending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="markup">Markup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="percentage">Percentage (%)</Label>
                      <Input
                        id="percentage"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="e.g., 20 for 20% off"
                        value={newPricingRule.percentage ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewPricingRule({
                            ...newPricingRule,
                            percentage: val === "" ? undefined : parseFloat(val),
                          });
                        }}
                        disabled={pricingRulePending}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {newPricingRule.type === "discount"
                          ? "Customer will receive this percentage off the total price"
                          : "This percentage will be added to the total price"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={newPricingRule.isActive ?? true}
                        onChange={(e) =>
                          setNewPricingRule({
                            ...newPricingRule,
                            isActive: e.target.checked,
                          })
                        }
                        disabled={pricingRulePending}
                        className="rounded"
                      />
                      <Label htmlFor="isActive" className="cursor-pointer">
                        Active (rule is currently in effect)
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleAddOrUpdatePricingRule}
                      disabled={
                        pricingRulePending ||
                        !newPricingRule.description ||
                        !newPricingRule.percentage
                      }
                    >
                      {pricingRulePending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {pricingRules.map((rule) => (
                  <Card
                    key={rule.id}
                    className={!rule.isActive ? "opacity-50" : ""}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="flex-1">{rule.description}</CardTitle>
                        {rule.isActive && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-2xl font-bold">
                          {rule.type === "discount" ? "-" : "+"}
                          {rule.percentage}%
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {rule.type}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          {rule.type === "discount"
                            ? `Customers get ${rule.percentage}% off their total`
                            : `${rule.percentage}% added to total price`}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => openPricingRuleEdit(rule)}
                        disabled={isDataLoading}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeletePricingRule(rule.id)}
                        disabled={isDataLoading}
                      >
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    All payments processed through PayMongo
                  </p>
                </div>
                <Button
                  onClick={fetchPayments}
                  disabled={isLoadingPayments}
                  variant="outline"
                  size="sm"
                >
                  {isLoadingPayments ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPayments && payments.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Loading payments...</p>
                  </div>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No payments found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">
                            {payment.id.substring(0, 20)}...
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {payment.attributes.billing?.name || "N/A"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {payment.attributes.billing?.email || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.attributes.description || "N/A"}
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₱{(payment.attributes.amount / 100).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                payment.attributes.status === "paid"
                                  ? "default"
                                  : payment.attributes.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {payment.attributes.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(
                              payment.attributes.paid_at * 1000
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Total Payments: {payments.length} | Total Amount: ₱
              {payments
                .reduce((sum, p) => sum + p.attributes.amount / 100, 0)
                .toLocaleString()}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashierPage;