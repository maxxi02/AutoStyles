import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const PAYMONGO_SECRET_KEY = process.env.NEXT_PUBLIC_PAYMONGO_SECRET_KEY;

interface PayMongoPayment {
  id: string;
  attributes: {
    status: string;
    metadata?: {
      transactionId?: string;
    };
  };
}

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

    // Validate base requirement: At least a model must be selected
    if (!transaction?.modelId) {
      return NextResponse.json(
        { error: "No car model selected for this transaction" },
        { status: 400 }
      );
    }

    // Fetch payment details from PayMongo to get payment ID
    let paymentId = null;
    try {
      // Get all recent payments and find the one matching this transaction
      const paymentsResponse = await fetch(
        "https://api.paymongo.com/v1/payments?limit=100",
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY!).toString("base64")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        const payments = paymentsData.data || [];
        // Find payment matching this transaction
        const matchingPayment = payments.find(
          (payment: PayMongoPayment) =>
            payment.attributes.metadata?.transactionId === transactionId &&
            payment.attributes.status === "paid"
        );
        if (matchingPayment) {
          paymentId = matchingPayment.id;
          console.log("Found payment ID:", paymentId);
        } else {
          console.warn(
            "No matching payment found for transaction:",
            transactionId
          );
        }
      }
    } catch (error) {
      console.error("Error fetching payment details:", error);
      // Continue without payment ID - it's not critical for verification
    }

    // START: CONDITIONAL INVENTORY DEDUCTION
    const batch = adminDb.batch();

    // Color: Conditional check and update
    if (transaction.colorId) {
      const colorRef = adminDb
        .collection("paintColors")
        .doc(transaction.colorId);
      const colorSnap = await colorRef.get();
      const colorData = colorSnap.data();
      if (!colorSnap.exists || !colorData || colorData.inventory < 1) {
        return NextResponse.json(
          { error: "Selected paint color is out of stock or not found" },
          { status: 400 }
        );
      }
      batch.update(colorRef, {
        inventory: FieldValue.increment(-1),
        sold: FieldValue.increment(1),
      });
    }

    // Wheels: Conditional check and update
    if (transaction.wheelId) {
      const wheelRef = adminDb.collection("wheels").doc(transaction.wheelId);
      const wheelSnap = await wheelRef.get();
      const wheelData = wheelSnap.data();
      if (!wheelSnap.exists || !wheelData || wheelData.inventory < 1) {
        return NextResponse.json(
          { error: "Selected wheels are out of stock or not found" },
          { status: 400 }
        );
      }
      batch.update(wheelRef, {
        inventory: FieldValue.increment(-1),
        sold: FieldValue.increment(1),
      });
    }

    // Interior: Conditional check and update
    if (transaction.interiorId) {
      const interiorRef = adminDb
        .collection("interiors")
        .doc(transaction.interiorId);
      const interiorSnap = await interiorRef.get();
      const interiorData = interiorSnap.data();
      if (!interiorSnap.exists || !interiorData || interiorData.inventory < 1) {
        return NextResponse.json(
          { error: "Selected interior is out of stock or not found" },
          { status: 400 }
        );
      }
      batch.update(interiorRef, {
        inventory: FieldValue.increment(-1),
        sold: FieldValue.increment(1),
      });
    }

    // If no customizations at all, block payment
    if (
      !transaction.colorId &&
      !transaction.wheelId &&
      !transaction.interiorId
    ) {
      return NextResponse.json(
        {
          error:
            "No customizations (color, wheels, or interior) selected. Please complete your design.",
        },
        { status: 400 }
      );
    }

    // END: INVENTORY DEDUCTION

    // Update transaction with payment ID
    const transactionUpdate: Record<string, unknown> = {
      status: "purchased",
      paymentVerifiedAt: new Date(),
    };
    if (paymentId) {
      transactionUpdate.paymentId = paymentId;
    }
    batch.update(transactionRef, transactionUpdate);

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

    return NextResponse.json({
      success: true,
      paymentId: paymentId,
    });
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
