import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.data;

    // Verify webhook signature (recommended)
    // const signature = req.headers.get("paymongo-signature");
    // Implement signature verification here

    if (event.attributes.type === "payment.paid") {
      const paymentIntent = event.attributes.data;
      const metadata = paymentIntent.attributes.metadata;
      const transactionId = metadata?.transactionId;

      if (!transactionId) {
        return NextResponse.json({ error: "No transaction ID in metadata" }, { status: 400 });
      }

      // Update transaction status
      const transactionRef = doc(db, "transactions", transactionId);
      await updateDoc(transactionRef, {
        status: "purchased",
        paymentVerifiedAt: new Date(),
        paymentId: paymentIntent.id,
      });

      // Update all appointments for this transaction
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("transactionId", "==", transactionId)
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      
      const updatePromises = appointmentsSnapshot.docs.map((doc) =>
        updateDoc(doc.ref, {
          paymentStatus: "paid",
          paidAt: new Date(),
          paymentId: paymentIntent.id,
        })
      );
      
      await Promise.all(updatePromises);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}