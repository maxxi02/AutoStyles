// app/api/protected-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-middleware";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);

    // Now you can safely access Firestore with admin privileges
    const userDoc = await adminDb
      .collection("users")
      .doc(decodedToken.uid)
      .get();

    return NextResponse.json({ data: userDoc.data() });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
