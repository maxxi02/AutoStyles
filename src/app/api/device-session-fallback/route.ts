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
    
    // Check if device is ALREADY registered (this is just a refresh, not a new login)
    // IMPORTANT: Only check isActive, ignore pendingInvalidation flag
    const existingSession = userSessions.get(deviceId);
    const isRefresh = existingSession && existingSession.isActive;

    // Use composite key for session tracking
    const sessionKey = `${userId}:${deviceId}`;
    const invalidatedSessions: string[] = [];

    if (isRefresh) {
      // Device already registered - just update timestamp and clear pending flag
      existingSession.timestamp = Date.now();
      existingSession.pendingInvalidation = false; // Clear pending invalidation on refresh
      console.log("[Fallback] Device", deviceId, "is refreshing for user", userId, "- NOT invalidating others (already registered)");
    } else {
      // New device - mark all OTHER ACTIVE sessions for THIS user as PENDING invalidation
      // IMPORTANT: Different users have separate session maps, so different accounts never interfere
      userSessions.forEach((session, dId) => {
        if (session.isActive && dId !== deviceId) {
          const otherSessionKey = `${userId}:${dId}`;
          session.pendingInvalidation = true;
          session.invalidatedAt = Date.now();
          invalidatedSessions.push(otherSessionKey);
        }
      });

      // Add new session for this user
      userSessions.set(deviceId, {
        timestamp: Date.now(),
        isActive: true,
      });

      console.log("[Fallback] NEW device", deviceId, "registered for user", userId, "- Marked", invalidatedSessions.length, "other devices for delayed invalidation");
    }

    deviceSessions.set(userId, userSessions);

    // Send delayed invalidation notifications for new device
    // This gives the new device time to establish connection before old devices are kicked out
    if (invalidatedSessions.length > 0) {
      setTimeout(() => {
        // Verify devices are still pending invalidation before notifying
        const userSessNow = deviceSessions.get(userId) || new Map();
        const sessionsToInvalidate = invalidatedSessions.filter(sKey => {
          const dId = sKey.split(":")[1];
          const sess = userSessNow.get(dId);
          return sess && sess.pendingInvalidation;
        });

        if (sessionsToInvalidate.length > 0) {
          // Mark as inactive now
          sessionsToInvalidate.forEach(sKey => {
            const dId = sKey.split(":")[1];
            const sess = userSessNow.get(dId);
            if (sess) {
              sess.isActive = false;
              sess.pendingInvalidation = false;
            }
          });

          fetch(new URL("/api/device-session-notify", request.url), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userId,
              sessionKey: sessionKey,
              targetSessions: sessionsToInvalidate,
            }),
          }).then((res) => {
            res.json().then((data) => {
              console.log("[Fallback] Invalidated and notified", data.notifiedCount, "sessions after 30s delay for user", userId);
            });
          }).catch((error) => {
            console.error("[Fallback] Error sending notifications:", error);
          });
        }
      }, 30000);
    }

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
