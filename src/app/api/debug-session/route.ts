import { NextRequest, NextResponse } from "next/server";

/**
 * Debug endpoint to check what cookies and tokens are being sent
 * Only available in development/staging - remove in production
 */
export async function GET(request: NextRequest) {
  try {
    // Get all cookies
    const allCookies: Record<string, string> = {};
    request.cookies.getAll().forEach((cookie) => {
      allCookies[cookie.name] = cookie.value.substring(0, 20) + "..."; // Truncate for security
    });

    // Get headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key.toLowerCase().includes("auth") || key.toLowerCase().includes("device")) {
        headers[key] = value.substring(0, 20) + "...";
      }
    });

    const debugInfo = {
      timestamp: new Date().toISOString(),
      cookies: allCookies,
      headers: headers,
      authorization: request.headers.get("authorization") ? "present" : "missing",
      xDeviceId: request.headers.get("x-device-id") ? "present" : "missing",
      userAgent: request.headers.get("user-agent"),
    };

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Debug endpoint error" },
      { status: 500 }
    );
  }
}
