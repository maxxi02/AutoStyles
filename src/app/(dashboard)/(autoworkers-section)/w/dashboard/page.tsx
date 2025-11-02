"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Loader2, CheckCircle2, Clock, Car } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { format, isValid } from "date-fns";

interface Transaction {
  id: string;
  modelId: string;
  assignedAutoworkerId?: string;
  estimatedCompletionDate?: Date;
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
  };
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: Date;
  };
}

interface CarModel {
  id: string;
  name: string;
}

const AutoworkerDashboard = () => {
  const [assignments, setAssignments] = useState<Transaction[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as CarModel
        );
        setCarModels(data);
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
                  docData.customizationProgress.paintCompletedAt?.toDate() ||
                  null,
                wheelsCompletedAt:
                  docData.customizationProgress.wheelsCompletedAt?.toDate() ||
                  null,
                interiorCompletedAt:
                  docData.customizationProgress.interiorCompletedAt?.toDate() ||
                  null,
              }
            : undefined,
          feedback: docData.feedback
            ? {
                ...docData.feedback,
                submittedAt: docData.feedback.submittedAt?.toDate(),
              }
            : undefined,
        } as Transaction;
      });
      setAssignments(data);
      setLoading(false);
    });

    return () => {
      unsubscribeModels();
      unsubscribeAssignments();
    };
  }, [currentUserId]);

  const activeJobs = assignments.filter(
    (a) => a.customizationProgress?.overallStatus !== "completed"
  );
  const completedJobs = assignments.filter(
    (a) => a.customizationProgress?.overallStatus === "completed"
  );

  const calculateProgress = (transaction: Transaction): number => {
    if (!transaction.customizationProgress) return 0;
    const progress = transaction.customizationProgress;
    let completedStages = 0;
    if (progress.paintCompleted) completedStages++;
    if (progress.wheelsCompleted) completedStages++;
    if (progress.interiorCompleted) completedStages++;
    return Math.round((completedStages / 3) * 100);
  };

  const JobCard = ({
    job,
    showCompletionDate = false,
  }: {
    job: Transaction;
    showCompletionDate?: boolean;
  }) => {
    const model = carModels.find((m) => m.id === job.modelId);
    const progress = calculateProgress(job);
    const latestCompletionDate = job.customizationProgress
      ? [
          job.customizationProgress.paintCompletedAt,
          job.customizationProgress.wheelsCompletedAt,
          job.customizationProgress.interiorCompletedAt,
        ]
          .filter((date): date is Date => date !== null && date instanceof Date)
          .sort((a, b) => b.getTime() - a.getTime())[0]
      : null;

    return (
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{model?.name || "N/A"}</h3>
            <p className="text-sm text-muted-foreground">
              Customer: {job.customerDetails?.fullName || "N/A"}
            </p>
          </div>
          <Badge
            variant={
              job.customizationProgress?.overallStatus === "completed"
                ? "default"
                : job.customizationProgress?.overallStatus === "in-progress"
                  ? "secondary"
                  : "outline"
            }
          >
            {job.customizationProgress?.overallStatus || "pending"}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{progress}%</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                progress === 100 ? "bg-green-600" : "bg-blue-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {showCompletionDate && latestCompletionDate ? (
          <p className="text-xs text-muted-foreground">
            Completed: {format(latestCompletionDate, "MMM dd, yyyy h:mm a")}
          </p>
        ) : (
          job.estimatedCompletionDate && (
            <p className="text-xs text-muted-foreground">
              Due: {format(job.estimatedCompletionDate, "MMM dd, yyyy HH:mm")}
            </p>
          )
        )}

        {showCompletionDate && job.feedback ? (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Customer Feedback
            </p>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-sm ${star <= job.feedback!.rating ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({job.feedback!.rating}/5)
              </span>
            </div>
            {job.feedback!.comment && (
              <p className="text-xs text-muted-foreground italic">
                {job.feedback!.comment}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {isValid(job.feedback!.submittedAt)
                ? format(job.feedback!.submittedAt, "MMM dd, yyyy h:mm a")
                : "N/A"}
            </p>
          </div>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Autoworker Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assigned
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>My Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Active Jobs ({activeJobs.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedJobs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              {activeJobs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No active assignments
                </p>
              ) : (
                <div className="space-y-4">
                  {activeJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              {completedJobs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No completed assignments yet
                </p>
              ) : (
                <div className="space-y-4">
                  {completedJobs.map((job) => (
                    <JobCard key={job.id} job={job} showCompletionDate />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoworkerDashboard;
