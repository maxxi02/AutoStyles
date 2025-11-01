import { NextRequest, NextResponse } from "next/server";

const PAYMONGO_SECRET_KEY = process.env.NEXT_PUBLIC_PAYMONGO_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    const { paymentId, amount, reason } = await req.json();

    if (!paymentId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: paymentId, amount" },
        { status: 400 }
      );
    }

    if (!PAYMONGO_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    const amountInCentavos = Math.round(Number(amount));

    const response = await fetch("https://api.paymongo.com/v1/refunds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountInCentavos,
            payment_id: paymentId,
            reason: reason || "requested_by_customer",
            notes:
              "Appointment cancellation refund with 2% processing fee deduction",
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo Refund Error:", data);
      return NextResponse.json(
        {
          error: data.errors?.[0]?.detail || "Failed to process refund",
          details: data.errors,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      refund: data.data,
    });
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Refund failed" },
      { status: 500 }
    );
  }
}
