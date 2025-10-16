import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { transactionId, amount, description } = await req.json();

    // Validate required fields
    if (!transactionId || !amount || !description) {
      return NextResponse.json(
        {
          error: "Missing required fields: transactionId, amount, description",
        },
        { status: 400 }
      );
    }

    // Ensure amount is a valid integer in centavos
    const amountInCentavos = Math.round(Number(amount));
    if (isNaN(amountInCentavos) || amountInCentavos < 10000) {
      return NextResponse.json(
        { error: "Amount must be at least ₱100.00 (10000 centavos)" },
        { status: 400 }
      );
    }

    const PAYMONGO_SECRET_KEY = process.env.NEXT_PUBLIC_PAYMONGO_SECRET_KEY;
    if (!PAYMONGO_SECRET_KEY) {
      console.error("PAYMONGO_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    // Use the correct base URL - remove trailing slash from NEXT_PUBLIC_BASE_URL
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";

    // Construct URLs without line breaks
    const success_url = `${baseUrl}/c/transactions?success=true&tid=${transactionId}`;
    const cancel_url = `${baseUrl}/c/transactions?cancelled=true&tid=${transactionId}`;

    // // Debug: Check the URLs
    // console.log("Success URL:", success_url);
    // console.log("Cancel URL:", cancel_url);

    // Create checkout session with PayMongo
    const response = await fetch(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString("base64")}`,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              send_email_receipt: true,
              show_description: true,
              show_line_items: true,
              description: description,
              line_items: [
                {
                  currency: "PHP",
                  amount: amountInCentavos,
                  name: description.substring(0, 100), // Limit name length
                  quantity: 1,
                },
              ],
              payment_method_types: [
                "gcash",
                "paymaya",
                "grab_pay",
                "card",
                "dob",
                "dob_ubp",
                "billease",
              ],
              success_url: success_url,
              cancel_url: cancel_url,
              metadata: {
                transactionId: transactionId,
              },
            },
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo API Error:", data);
      return NextResponse.json(
        {
          error:
            data.errors?.[0]?.detail || "Failed to create checkout session",
          details: data.errors,
        },
        { status: response.status }
      );
    }

    // Extract checkout URL
    const checkoutUrl = data.data?.attributes?.checkout_url;
    if (!checkoutUrl) {
      console.error("No checkout URL in response:", data);
      return NextResponse.json(
        { error: "Checkout URL not received from payment gateway" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkout_url: checkoutUrl,
      session_id: data.data?.id,
    });
  } catch (error) {
    console.error("Create checkout error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
