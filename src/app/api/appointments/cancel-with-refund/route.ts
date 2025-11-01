import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { appointmentId, transactionId } = await req.json();

    if (!appointmentId || !transactionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get appointment and transaction details
    const appointmentRef = adminDb
      .collection("appointments")
      .doc(appointmentId);
    const appointmentSnap = await appointmentRef.get();

    if (!appointmentSnap.exists) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    const appointment = appointmentSnap.data();

    // Check if appointment is paid
    if (appointment?.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "Only paid appointments can be refunded" },
        { status: 400 }
      );
    }

    // Check 24-hour restriction
    const appointmentDateTime = new Date(
      `${appointment.date}T${appointment.time}`
    );
    const now = new Date();
    const hoursDifference =
      (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 24 && appointmentDateTime > now) {
      return NextResponse.json(
        { error: "Cannot cancel within 24 hours of appointment time" },
        { status: 400 }
      );
    }

    // Get transaction details
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

    if (!transaction?.paymentId) {
      return NextResponse.json(
        { error: "Payment ID not found in transaction" },
        { status: 400 }
      );
    }

    // Calculate refund amount (98% of original - 2% deduction)
    const originalAmount = transaction.price * 100; // Convert to centavos
    const refundAmount = Math.round(originalAmount * 0.98);
    const deductionAmount = originalAmount - refundAmount;

    // Process refund via PayMongo
    const refundResponse = await fetch(
      `${req.nextUrl.origin}/api/refunds/create`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: transaction.paymentId,
          amount: refundAmount,
          reason: "requested_by_customer",
        }),
      }
    );

    const refundData = await refundResponse.json();

    if (!refundResponse.ok) {
      return NextResponse.json(
        { error: refundData.error || "Refund processing failed" },
        { status: refundResponse.status }
      );
    }

    // Update records in batch
    const batch = adminDb.batch();

    // Restore inventory
    const colorRef = adminDb.collection("paintColors").doc(transaction.colorId);
    const wheelRef = adminDb.collection("wheels").doc(transaction.wheelId);
    const interiorRef = adminDb
      .collection("interiors")
      .doc(transaction.interiorId);

    batch.update(colorRef, {
      inventory: FieldValue.increment(1),
      sold: FieldValue.increment(-1),
    });
    batch.update(wheelRef, {
      inventory: FieldValue.increment(1),
      sold: FieldValue.increment(-1),
    });
    batch.update(interiorRef, {
      inventory: FieldValue.increment(1),
      sold: FieldValue.increment(-1),
    });

    // Update appointment
    batch.update(appointmentRef, {
      status: "cancelled",
      cancelledAt: new Date(),
      refundStatus: "processed",
      refundAmount: refundAmount / 100, // Store in pesos
      refundId: refundData.refund?.id,
      deductionAmount: deductionAmount / 100,
    });

    // Update transaction
    batch.update(transactionRef, {
      status: "refunded",
      refundedAt: new Date(),
      refundAmount: refundAmount / 100,
      refundId: refundData.refund?.id,
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      refundAmount: refundAmount / 100,
      deductionAmount: deductionAmount / 100,
      message:
        "Appointment cancelled and refund processed (2% processing fee applied)",
    });
  } catch (error) {
    console.error("Cancel with refund error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Operation failed" },
      { status: 500 }
    );
  }
}
