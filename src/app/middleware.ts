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

  // Optionally verify token and device session with your API
  try {
    const response = await fetch(new URL("/api/device-session", request.url), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-device-id": deviceId || "unknown",
      },
    });

    if (!response.ok) {
      const data = await response.json();
      
      // If session is invalid, redirect to login
      if (data.reason === "SESSION_INVALIDATED") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error verifying device session:", error);
    // Allow request on error to not block legitimate users
    return NextResponse.next();
  }
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
