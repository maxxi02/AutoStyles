"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Loader2, CheckCircle2, Eye } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import { format } from "date-fns";
import Image from "next/image";

interface Transaction {
  id: string;
  typeId: string;
  modelId: string;
  colorId: string;
  wheelId: string;
  interiorId: string;
  assignedAutoworkerId?: string;
  estimatedCompletionDate?: Date;
  price: number;
  customizationProgress?: {
    paintCompleted: boolean;
    paintCompletedAt: Date | null;
    wheelsCompleted: boolean;
    wheelsCompletedAt: Date | null;
    interiorCompleted: boolean;
    interiorCompletedAt: Date | null;
    overallStatus: "pending" | "in-progress" | "completed";
  };
  customerDetails?: {
    fullName: string;
    email: string;
    contactNumber: string;
    address: string;
  };
}

interface CarModel {
  id: string;
  name: string;
  imageUrl?: string;
}

interface PaintColor {
  id: string;
  name: string;
  hex: string;
  finish: string;
  imageUrl?: string;
}

interface Wheel {
  id: string;
  name: string;
}

interface Interior {
  id: string;
  name: string;
  hex?: string;
}

const ActiveAssignments = () => {
  const [assignments, setAssignments] = useState<Transaction[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [paintColors, setPaintColors] = useState<PaintColor[]>([]);
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [interiors, setInteriors] = useState<Interior[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribeModels = onSnapshot(
      collection(db, "carModels"),
      (snapshot) => {
        setCarModels(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as CarModel)
        );
      }
    );

    const unsubscribeColors = onSnapshot(
      collection(db, "paintColors"),
      (snapshot) => {
        setPaintColors(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as PaintColor)
        );
      }
    );

    const unsubscribeWheels = onSnapshot(
      collection(db, "wheels"),
      (snapshot) => {
        setWheels(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Wheel)
        );
      }
    );

    const unsubscribeInteriors = onSnapshot(
      collection(db, "interiors"),
      (snapshot) => {
        setInteriors(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Interior)
        );
      }
    );

    const q = query(
      collection(db, "transactions"),
      where("assignedAutoworkerId", "==", currentUserId),
      where("status", "==", "purchased")
    );

    const unsubscribeAssignments = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          estimatedCompletionDate: docData.estimatedCompletionDate?.toDate(),
          customizationProgress: docData.customizationProgress
            ? {
                ...docData.customizationProgress,
                paintCompletedAt:
                  docData.customizationProgress.paintCompletedAt?.toDate() || null,
                wheelsCompletedAt:
                  docData.customizationProgress.wheelsCompletedAt?.toDate() || null,
                interiorCompletedAt:
                  docData.customizationProgress.interiorCompletedAt?.toDate() || null,
              }
            : undefined,
        } as Transaction;
      });
      setAssignments(
        data.filter((a) => a.customizationProgress?.overallStatus !== "completed")
      );
      setLoading(false);
    });

    return () => {
      unsubscribeModels();
      unsubscribeColors();
      unsubscribeWheels();
      unsubscribeInteriors();
      unsubscribeAssignments();
    };
  }, [currentUserId]);

  useEffect(() => {
    if (selectedJob && showModal) {
      const updatedJob = assignments.find((a) => a.id === selectedJob.id);
      if (updatedJob) {
        setSelectedJob(updatedJob);
      }
    }
  }, [assignments, selectedJob, showModal]);

  const handleUpdateProgress = async (
    transactionId: string,
    field: "paintCompleted" | "wheelsCompleted" | "interiorCompleted",
    value: boolean
  ) => {
    setIsUpdating(true);
    try {
      const transaction = assignments.find((t) => t.id === transactionId);
      const currentProgress = transaction?.customizationProgress || {
        paintCompleted: false,
        paintCompletedAt: null,
        wheelsCompleted: false,
        wheelsCompletedAt: null,
        interiorCompleted: false,
        interiorCompletedAt: null,
        overallStatus: "pending" as const,
      };

      const timestamp = value ? Timestamp.now() : null;
      const updatedProgress = {
        ...currentProgress,
        [field]: value,
        [`${field.replace("Completed", "CompletedAt")}`]: timestamp,
      };

      const completedCount = [
        updatedProgress.paintCompleted,
        updatedProgress.wheelsCompleted,
        updatedProgress.interiorCompleted,
      ].filter(Boolean).length;

      let overallStatus: "pending" | "in-progress" | "completed" = "pending";
      if (completedCount === 3) {
        overallStatus = "completed";
      } else if (completedCount > 0) {
        overallStatus = "in-progress";
      }

      updatedProgress.overallStatus = overallStatus;

      await updateDoc(doc(db, "transactions", transactionId), {
        customizationProgress: updatedProgress,
      });

      toast.success("Progress updated successfully!");
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateEstimatedTime = async (
    transactionId: string,
    date: Date
  ) => {
    try {
      await updateDoc(doc(db, "transactions", transactionId), {
        estimatedCompletionDate: Timestamp.fromDate(date),
      });
      toast.success("Estimated completion date updated!");
    } catch (error) {
      console.error("Error updating date:", error);
      toast.error("Failed to update date");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const JobDetailsModal = () => {
    if (!selectedJob) return null;

    const model = carModels.find((m) => m.id === selectedJob.modelId);
    const color = paintColors.find((c) => c.id === selectedJob.colorId);
    const wheel = wheels.find((w) => w.id === selectedJob.wheelId);
    const interior = interiors.find((i) => i.id === selectedJob.interiorId);
    const previewImage = color?.imageUrl || model?.imageUrl || "/placeholder-car.png";

    const customizationProgress = selectedJob.customizationProgress || {
      paintCompleted: false,
      paintCompletedAt: null,
      wheelsCompleted: false,
      wheelsCompletedAt: null,
      interiorCompleted: false,
      interiorCompletedAt: null,
      overallStatus: "pending" as const,
    };

    return (
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Info */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Customer Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {selectedJob.customerDetails?.fullName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p className="font-medium">
                    {selectedJob.customerDetails?.contactNumber || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="border rounded-lg p-4">
              <label className="text-sm font-medium block mb-2">
                Estimated Completion Time
              </label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border rounded-md"
                value={
                  selectedJob.estimatedCompletionDate
                    ? format(selectedJob.estimatedCompletionDate, "yyyy-MM-dd'T'HH:mm")
                    : ""
                }
                onChange={(e) =>
                  handleUpdateEstimatedTime(
                    selectedJob.id,
                    new Date(e.target.value)
                  )
                }
              />
            </div>

            {/* Preview */}
            <div className="border rounded-lg overflow-hidden">
              <Image
                src={previewImage}
                alt="Vehicle"
                width={800}
                height={400}
                className="w-full h-64 object-cover"
              />
            </div>

            {/* Customization Details */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Customization Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{model?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Color:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color?.hex }}
                    />
                    <span className="font-medium">
                      {color?.name} ({color?.finish})
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wheels:</span>
                  <span className="font-medium">{wheel?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interior:</span>
                  <span className="font-medium">{interior?.name || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Progress Tracking */}
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">Progress Tracking</h3>

              {/* Paint */}
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium flex items-center gap-2">
                    Exterior Paint
                    {customizationProgress.paintCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </label>
                  <Button
                    size="sm"
                    variant={customizationProgress.paintCompleted ? "outline" : "default"}
                    onClick={() =>
                      handleUpdateProgress(
                        selectedJob.id,
                        "paintCompleted",
                        !customizationProgress.paintCompleted
                      )
                    }
                    disabled={isUpdating}
                  >
                    {customizationProgress.paintCompleted ? "Undo" : "Complete"}
                  </Button>
                </div>
                {customizationProgress.paintCompletedAt && (
                  <p className="text-xs text-muted-foreground">
                    Completed: {format(customizationProgress.paintCompletedAt, "MMM dd, yyyy HH:mm")}
                  </p>
                )}
              </div>

              {/* Wheels */}
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium flex items-center gap-2">
                    Wheels Installation
                    {customizationProgress.wheelsCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </label>
                  <Button
                    size="sm"
                    variant={customizationProgress.wheelsCompleted ? "outline" : "default"}
                    onClick={() =>
                      handleUpdateProgress(
                        selectedJob.id,
                        "wheelsCompleted",
                        !customizationProgress.wheelsCompleted
                      )
                    }
                    disabled={isUpdating}
                  >
                    {customizationProgress.wheelsCompleted ? "Undo" : "Complete"}
                  </Button>
                </div>
                {customizationProgress.wheelsCompletedAt && (
                  <p className="text-xs text-muted-foreground">
                    Completed: {format(new Date(customizationProgress.wheelsCompletedAt), "MMM dd, yyyy HH:mm")}
                  </p>
                )}
              </div>

              {/* Interior */}
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium flex items-center gap-2">
                    Interior Customization
                    {customizationProgress.interiorCompleted && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </label>
                  <Button
                    size="sm"
                    variant={customizationProgress.interiorCompleted ? "outline" : "default"}
                    onClick={() =>
                      handleUpdateProgress(
                        selectedJob.id,
                        "interiorCompleted",
                        !customizationProgress.interiorCompleted
                      )
                    }
                    disabled={isUpdating}
                  >
                    {customizationProgress.interiorCompleted ? "Undo" : "Complete"}
                  </Button>
                </div>
                {customizationProgress.interiorCompletedAt && (
                  <p className="text-xs text-muted-foreground">
                    Completed: {format(new Date(customizationProgress.interiorCompletedAt), "MMM dd, yyyy HH:mm")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No active assignments
            </p>
          ) : (
            <div className="space-y-4">
              {assignments.map((job) => {
                const model = carModels.find((m) => m.id === job.modelId);
                const progress =
                  job.customizationProgress
                    ? Math.round(
                        ([
                          job.customizationProgress.paintCompleted,
                          job.customizationProgress.wheelsCompleted,
                          job.customizationProgress.interiorCompleted,
                        ].filter(Boolean).length /
                          3) *
                          100
                      )
                    : 0;

                return (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{model?.name || "N/A"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {job.customerDetails?.fullName || "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            job.customizationProgress?.overallStatus === "in-progress"
                              ? "default"
                              : "outline"
                          }
                        >
                          {job.customizationProgress?.overallStatus || "pending"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedJob(job);
                            setShowModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{progress}%</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {job.estimatedCompletionDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Due: {format(job.estimatedCompletionDate, "MMM dd, yyyy HH:mm")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <JobDetailsModal />
    </div>
  );
};

export default ActiveAssignments;