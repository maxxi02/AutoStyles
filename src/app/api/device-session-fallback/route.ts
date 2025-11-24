import { NextRequest, NextResponse } from "next/server";

/**
 * Simple device session manager using a Map (in-memory on this server instance)
 * This is a fallback for when Firestore is not available
 * Note: In production with multiple servers, this won't sync across instances
 */
const deviceSessions = new Map<string, Map<string, { timestamp: number; isActive: boolean }>>();

/**
 * GET /api/device-session-fallback
 * Fallback endpoint when Firebase Admin SDK is not initialized
 * Uses in-memory storage on the server
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split("Bearer ")[1];
    const deviceId = request.headers.get("x-device-id") || request.cookies.get("deviceId")?.value;

    if (!token || !deviceId) {
      return NextResponse.json(
        { error: "Missing token or device ID", isValid: false },
        { status: 401 }
      );
    }

    // Extract user ID from token (this is a simple check, not a real verification)
    // In production, you'd verify this properly
    const userDeviceSessions = deviceSessions.get("fallback") || new Map();
    const session = userDeviceSessions.get(deviceId);

    if (!session || !session.isActive) {
      console.log("[Fallback] Session invalidated for device:", deviceId);
      return NextResponse.json(
        {
          error: "Session is not active",
          isValid: false,
          reason: "SESSION_INVALIDATED",
        },
        { status: 401 }
      );
    }

    // Update last activity
    session.timestamp = Date.now();

    return NextResponse.json(
      {
        success: true,
        isValid: true,
        uid: "fallback-user",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fallback session error:", error);
    return NextResponse.json(
      { error: "Session check failed", isValid: false },
      { status: 500 }
    );
  }
}

/**
 * POST /api/device-session-fallback
 * Register a new device session (fallback)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, token } = body;

    if (!deviceId || !token) {
      return NextResponse.json(
        { error: "Missing deviceId or token" },
        { status: 400 }
      );
    }

    // Invalidate all other devices for this user (using a fixed key for fallback)
    const userKey = "fallback";
    const userSessions = deviceSessions.get(userKey) || new Map();

    // Mark all other sessions as inactive
    userSessions.forEach((session) => {
      session.isActive = false;
    });

    // Add new session
    userSessions.set(deviceId, {
      timestamp: Date.now(),
      isActive: true,
    });

    deviceSessions.set(userKey, userSessions);

    console.log("[Fallback] Registered device session:", deviceId, "- Invalidated others");

    return NextResponse.json(
      {
        success: true,
        message: "Device session registered (fallback)",
        sessionId: deviceId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fallback registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/device-session-fallback
 * Logout a device session (fallback)
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: "Missing deviceId" },
        { status: 400 }
      );
    }

    const userKey = "fallback";
    const userSessions = deviceSessions.get(userKey) || new Map();
    const session = userSessions.get(deviceId);

    if (session) {
      session.isActive = false;
      console.log("[Fallback] Logged out device:", deviceId);
    }

    return NextResponse.json(
      { success: true, message: "Logged out" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fallback logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
