import { NextRequest, NextResponse } from "next/server";

/**
 * Device session manager using a Map (in-memory on this server instance)
 * Fallback for when Firestore is not available
 * Structure: userId -> deviceId -> session data
 */
const deviceSessions = new Map<string, Map<string, { timestamp: number; isActive: boolean; invalidatedAt?: number }>>();

/**
 * Simple JWT decoder - extracts basic info without verification
 * Note: This is fallback only - real Firebase Admin verification preferred
 */
function extractUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return decoded.sub || decoded.uid || null;
  } catch (error) {
    console.error("[Fallback] Error decoding token:", error);
    return null;
  }
}

/**
 * GET /api/device-session-fallback
 * Fallback endpoint when Firebase Admin SDK is not initialized
 * Uses in-memory storage with proper user separation
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

    // Extract user ID from token
    const userId = extractUserIdFromToken(token);
    if (!userId) {
      console.warn("[Fallback] Could not extract user ID from token");
      return NextResponse.json(
        { error: "Invalid token", isValid: false },
        { status: 401 }
      );
    }

    // Get sessions for this specific user
    const userDeviceSessions = deviceSessions.get(userId) || new Map();
    const session = userDeviceSessions.get(deviceId);

    if (!session || !session.isActive) {
      console.log("[Fallback] Session invalidated for device:", deviceId, "user:", userId);
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
        uid: userId,
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

    // Extract user ID from token
    const userId = extractUserIdFromToken(token);
    if (!userId) {
      console.warn("[Fallback] Could not extract user ID from token");
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Get sessions for THIS user only
    const userSessions = deviceSessions.get(userId) || new Map();
    let invalidatedCount = 0;

    // Mark all OTHER sessions for THIS user as inactive
    userSessions.forEach((session) => {
      if (session.isActive) {
        session.isActive = false;
        session.invalidatedAt = Date.now();
        invalidatedCount++;
      }
    });

    // Add new session for this user
    userSessions.set(deviceId, {
      timestamp: Date.now(),
      isActive: true,
    });

    deviceSessions.set(userId, userSessions);

    console.log("[Fallback] Registered device session:", deviceId, "for user:", userId, "- Invalidated", invalidatedCount, "others");

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
    const { deviceId, token } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: "Missing deviceId" },
        { status: 400 }
      );
    }

    // Extract user ID from token
    const userId = token ? extractUserIdFromToken(token) : null;
    if (!userId) {
      console.warn("[Fallback] Could not extract user ID for logout");
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const userSessions = deviceSessions.get(userId) || new Map();
    const session = userSessions.get(deviceId);

    if (session) {
      session.isActive = false;
      console.log("[Fallback] Logged out device:", deviceId, "for user:", userId);
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
