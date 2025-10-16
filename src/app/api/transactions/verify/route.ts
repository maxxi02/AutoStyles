import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { transactionId } = await req.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID required" },
        { status: 400 }
      );
    }

    const transactionRef = adminDb
      .collection("transactions")
      .doc(transactionId);
    const transactionSnap = await transactionRef.get();

    if (!transactionSnap.exists) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const transaction = transactionSnap.data();

    // If already verified, return success immediately
    if (transaction?.status === "purchased") {
      return NextResponse.json({
        success: true,
        message: "Already verified",
        alreadyPaid: true,
      });
    }

    // Update transaction
    await transactionRef.update({
      status: "purchased",
      paymentVerifiedAt: new Date(),
    });

    // Update all appointments for this transaction
    const appointmentsSnapshot = await adminDb
      .collection("appointments")
      .where("transactionId", "==", transactionId)
      .get();

    const batch = adminDb.batch();
    appointmentsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        paymentStatus: "paid",
        paidAt: new Date(),
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Verification failed",
      },
      { status: 500 }
    );
  }
}
