// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Get token and device ID from cookies
  const token = request.cookies.get("token")?.value || request.cookies.get("authToken")?.value;
  const deviceId = request.cookies.get("deviceId")?.value;

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Session validation disabled - allow all authenticated users
  // No automatic logout based on session status
  // Users can only be logged out by middleware when token is missing
  return NextResponse.next();
}

// Specify which routes to protect
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/a/:path*",
    "/w/:path*",
    "/c/:path*",
    // Add other protected routes
  ],
};
