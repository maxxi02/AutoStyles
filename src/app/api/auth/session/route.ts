import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { token, role } = await request.json();

  const response = NextResponse.json({ success: true });

  // Set HTTP-only cookies for better security
  response.cookies.set("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600, // 1 hour
    path: "/",
  });

  response.cookies.set("userRole", role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600,
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.delete("authToken");
  response.cookies.delete("userRole");

  return response;
}
