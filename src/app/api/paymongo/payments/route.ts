import { NextRequest, NextResponse } from "next/server";

const PAYMONGO_SECRET_KEY = process.env.NEXT_PUBLIC_PAYMONGO_SECRET_KEY;

export async function GET(req: NextRequest) {
  try {
    if (!PAYMONGO_SECRET_KEY) {
      return NextResponse.json(
        { error: "PayMongo configuration missing" },
        { status: 500 }
      );
    }

    // Get query parameters for pagination
    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "100";
    const before = searchParams.get("before");
    const after = searchParams.get("after");

    // Build query string
    let queryParams = `limit=${limit}`;
    if (before) queryParams += `&before=${before}`;
    if (after) queryParams += `&after=${after}`;

    const response = await fetch(
      `https://api.paymongo.com/v1/payments?${queryParams}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.errors || "Failed to fetch payments" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
