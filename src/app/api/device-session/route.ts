import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface DeviceSession {
  uid: string;
  deviceId: string;
  fingerprint: string;
  userAgent: string;
  loginTime: number;
  lastActivityTime: number;
  isActive: boolean;
}

/**
 * POST /api/device-session/register
 * Registers a new device session and invalidates other active sessions for the user
 */
export async function POST(request: NextRequest) {
  try {
    const { token, deviceId, fingerprint, userAgent } = await request.json();

    if (!token || !deviceId || !fingerprint) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if Firebase Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      console.warn("Firebase Admin SDK not initialized. Using fallback endpoint.");
      // Forward to fallback endpoint
      const fallbackResponse = await fetch(
        new URL("/api/device-session-fallback", request.url),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, deviceId, fingerprint, userAgent }),
        }
      );
      const fallbackData = await fallbackResponse.json();
      return NextResponse.json(fallbackData, { status: fallbackResponse.status });
    }

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const uid = decodedToken.uid;
    // IMPORTANT: Each user has their own Firestore document (keyed by uid)
    // Sessions within that document are keyed by uid:deviceId (composite key)
    // This ensures different accounts NEVER interfere with each other
    const sessionKey = `${uid}:${deviceId}`;
    const userSessionsRef = adminDb.collection("userSessions").doc(uid);

    // Get current active sessions for this user
    const userSessionsDoc = await userSessionsRef.get();
    const existingSessions: { [key: string]: DeviceSession } =
      userSessionsDoc.exists ? userSessionsDoc.data() || {} : {};

    // Check if THIS USER+DEVICE combo is ALREADY registered (this is just a refresh, not a new login)
    const existingDeviceSession = existingSessions[sessionKey];
    const isRefresh = existingDeviceSession && existingDeviceSession.isActive;

    // Create new session entry
    const newSession: DeviceSession = {
      uid,
      deviceId,
      fingerprint,
      userAgent,
      loginTime: isRefresh ? existingDeviceSession.loginTime : Date.now(), // Keep original login time if refresh
      lastActivityTime: Date.now(),
      isActive: true,
    };

    // ONLY invalidate other sessions if this is a NEW device (not a refresh)
    // For the same user, only invalidate OTHER devices, not this one
    const updatedSessions: { [key: string]: DeviceSession } = {};
    
    if (isRefresh) {
      // Same user+device refreshing - just update activity time, don't invalidate others
      Object.entries(existingSessions).forEach(([key, session]) => {
        updatedSessions[key] = session;
      });
      updatedSessions[sessionKey] = newSession;
      console.log("[Device Session] User", uid, "refreshing device", deviceId, "- NOT invalidating others");
    } else {
      // New device for this user - just register it without invalidating other devices
      // AUTOMATIC LOGOUT DISABLED - all devices of same user can stay active simultaneously
      Object.entries(existingSessions).forEach(([key, session]) => {
        updatedSessions[key] = session;
      });
      updatedSessions[sessionKey] = newSession;
      console.log("[Device Session] NEW device", deviceId, "for user", uid, "- All other devices remain active (auto-logout disabled)");
    }

    // Update Firestore immediately
    await userSessionsRef.set(updatedSessions);

    console.log("[Device Session] Registered device", deviceId, "for user", uid);

    // AUTOMATIC LOGOUT DISABLED - no invalidation notifications sent

    return NextResponse.json(
      {
        success: true,
        message: "Device session registered successfully",
        sessionId: deviceId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error registering device session:", error);
    return NextResponse.json(
      { error: "Failed to register device session", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/device-session/verify
 * Verifies if the current device session is still active
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get token from Authorization header first, then from cookies
    let token: string | null = request.headers.get("authorization")?.split("Bearer ")[1] || null;
    if (!token) {
      token = request.cookies.get("authToken")?.value || null;
    }
    
    // Try to get deviceId from header first, then from cookies
    let deviceId: string | null = request.headers.get("x-device-id") || null;
    if (!deviceId) {
      deviceId = request.cookies.get("deviceId")?.value || null;
    }

    if (!token || !deviceId) {
      console.warn("Missing token or device ID - token:", token ? "exists" : "missing", "deviceId:", deviceId ? "exists" : "missing");
      return NextResponse.json(
        { error: "Missing token or device ID", isValid: false },
        { status: 401 }
      );
    }

    // Check if Firebase Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      console.warn("Firebase Admin SDK not initialized. Using fallback endpoint.");
      // Forward to fallback endpoint
      const fallbackResponse = await fetch(
        new URL("/api/device-session-fallback", request.url),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "x-device-id": deviceId,
          },
        }
      );
      const fallbackData = await fallbackResponse.json();
      return NextResponse.json(fallbackData, { status: fallbackResponse.status });
    }

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json(
        { error: "Invalid token", isValid: false },
        { status: 401 }
      );
    }

    const uid = decodedToken.uid;
    // CRITICAL: Each user has separate Firestore document (doc(uid))
    // Sessions keyed by uid:deviceId ensure account isolation
    // Only THIS user's sessions are checked, never other users' sessions
    const sessionKey = `${uid}:${deviceId}`;
    const userSessionsRef = adminDb.collection("userSessions").doc(uid);
    const userSessionsDoc = await userSessionsRef.get();

    if (!userSessionsDoc.exists) {
      return NextResponse.json(
        { error: "No sessions found", isValid: false },
        { status: 404 }
      );
    }

    const sessions: { [key: string]: DeviceSession } =
      userSessionsDoc.data() || {};
    const currentSession = sessions[sessionKey];

    // Check if session is active
    if (!currentSession || !currentSession.isActive) {
      console.log("[Device Session] Session not found or inactive for device", deviceId, "user", uid);
      return NextResponse.json(
        {
          error: "Session is not active.",
          isValid: false,
          reason: "SESSION_INVALIDATED",
        },
        { status: 401 }
      );
    }

    // Session is valid
    console.log("[Device Session] Session valid for device", deviceId, "user", uid);

    // Update last activity time
    await userSessionsRef.update({
      [`${sessionKey}.lastActivityTime`]: Date.now(),
    });

    return NextResponse.json(
      {
        success: true,
        isValid: true,
        uid,
        email: decodedToken.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying device session:", error);
    return NextResponse.json(
      { error: "Failed to verify device session", isValid: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/device-session/logout
 * Marks the current device session as inactive
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get from request body (client sends these)
    const body = await request.json();
    let token = body.token;
    let deviceId = body.deviceId;
    
    // Fallback to cookies if not in body
    if (!token) {
      token = request.cookies.get("authToken")?.value;
    }
    if (!deviceId) {
      deviceId = request.cookies.get("deviceId")?.value;
    }

    if (!token || !deviceId) {
      return NextResponse.json(
        { error: "Missing token or device ID" },
        { status: 400 }
      );
    }

    // Check if Firebase Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      console.warn("Firebase Admin SDK not initialized. Using fallback endpoint.");
      // Forward to fallback endpoint
      const fallbackResponse = await fetch(
        new URL("/api/device-session-fallback", request.url),
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, deviceId }),
        }
      );
      const fallbackData = await fallbackResponse.json();
      return NextResponse.json(fallbackData, { status: fallbackResponse.status });
    }

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const uid = decodedToken.uid;
    // Use composite key to isolate each user's sessions
    const sessionKey = `${uid}:${deviceId}`;
    const userSessionsRef = adminDb.collection("userSessions").doc(uid);

    // Mark the session as inactive
    await userSessionsRef.update({
      [`${sessionKey}.isActive`]: false,
      [`${sessionKey}.logoutTime`]: Date.now(),
    });

    console.log("[Device Session] Logged out device", deviceId, "for user", uid);

    return NextResponse.json(
      { success: true, message: "Device session logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error logging out device session:", error);
    return NextResponse.json(
      { error: "Failed to logout device session" },
      { status: 500 }
    );
  }
}
