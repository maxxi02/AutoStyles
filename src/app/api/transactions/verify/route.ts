import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

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

    // START: INVENTORY DEDUCTION
    const batch = adminDb.batch();

    // Check inventory availability first
    const colorRef = adminDb
      .collection("paintColors")
      .doc(transaction?.colorId);
    const wheelRef = adminDb.collection("wheels").doc(transaction?.wheelId);
    const interiorRef = adminDb
      .collection("interiors")
      .doc(transaction?.interiorId);

    const [colorSnap, wheelSnap, interiorSnap] = await Promise.all([
      colorRef.get(),
      wheelRef.get(),
      interiorRef.get(),
    ]);

    const colorData = colorSnap.data();
    const wheelData = wheelSnap.data();
    const interiorData = interiorSnap.data();

    // Validate inventory
    if (!colorData || colorData.inventory < 1) {
      return NextResponse.json(
        { error: "Selected paint color is out of stock" },
        { status: 400 }
      );
    }
    if (!wheelData || wheelData.inventory < 1) {
      return NextResponse.json(
        { error: "Selected wheels are out of stock" },
        { status: 400 }
      );
    }
    if (!interiorData || interiorData.inventory < 1) {
      return NextResponse.json(
        { error: "Selected interior is out of stock" },
        { status: 400 }
      );
    }

    // Deduct inventory and increment sold count
    batch.update(colorRef, {
      inventory: FieldValue.increment(-1),
      sold: FieldValue.increment(1),
    });
    batch.update(wheelRef, {
      inventory: FieldValue.increment(-1),
      sold: FieldValue.increment(1),
    });
    batch.update(interiorRef, {
      inventory: FieldValue.increment(-1),
      sold: FieldValue.increment(1),
    });
    // END: INVENTORY DEDUCTION

    // Update transaction
    batch.update(transactionRef, {
      status: "purchased",
      paymentVerifiedAt: new Date(),
    });

    // Update all appointments for this transaction
    const appointmentsSnapshot = await adminDb
      .collection("appointments")
      .where("transactionId", "==", transactionId)
      .get();

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
