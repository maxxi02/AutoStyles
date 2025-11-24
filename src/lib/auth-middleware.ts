// lib/auth-middleware.ts
import { adminAuth } from "@/lib/firebase-admin";
import { NextRequest } from "next/server";

export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No token provided");
  }

  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth!.verifyIdToken(token);

  return decodedToken;
}
