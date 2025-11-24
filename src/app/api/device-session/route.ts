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
    const userSessionsRef = adminDb.collection("userSessions").doc(uid);

    // Get current active sessions
    const userSessionsDoc = await userSessionsRef.get();
    const existingSessions: { [key: string]: DeviceSession } =
      userSessionsDoc.exists ? userSessionsDoc.data() || {} : {};

    // Create new session entry
    const newSession: DeviceSession = {
      uid,
      deviceId,
      fingerprint,
      userAgent,
      loginTime: Date.now(),
      lastActivityTime: Date.now(),
      isActive: true,
    };

    // Invalidate all other active sessions
    const updatedSessions: { [key: string]: DeviceSession } = {};
    let invalidatedCount = 0;
    Object.entries(existingSessions).forEach(([key, session]) => {
      if (key !== deviceId) {
        updatedSessions[key] = { ...session, isActive: false, loginTime: session.loginTime };
        invalidatedCount++;
      }
    });

    // Add the new session
    updatedSessions[deviceId] = newSession;

    // Update Firestore immediately without merge
    await userSessionsRef.set(updatedSessions);

    console.log("[Device Session] Registered device", deviceId, "for user", uid, "- Invalidated", invalidatedCount, "others");

    // Send real-time notifications to invalidated devices
    if (invalidatedCount > 0) {
      try {
        const notifyResponse = await fetch(
          new URL("/api/device-session-notify", request.url),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: uid,
              excludeDeviceId: deviceId,
            }),
          }
        );
        const notifyData = await notifyResponse.json();
        console.log("[Device Session] Notifications sent:", notifyData.notifiedCount, "devices");
      } catch (notifyError) {
        console.error("[Device Session] Error sending notifications:", notifyError);
        // Non-critical, continue anyway
      }
    }

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
    const currentSession = sessions[deviceId];

    if (!currentSession || !currentSession.isActive) {
      console.log("[Device Session] Session invalidated for device", deviceId, "user", uid);
      return NextResponse.json(
        {
          error: "Session is not active. You have been logged out from another device.",
          isValid: false,
          reason: "SESSION_INVALIDATED",
        },
        { status: 401 }
      );
    }

    // Update last activity time
    await userSessionsRef.update({
      [`${deviceId}.lastActivityTime`]: Date.now(),
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
    const userSessionsRef = adminDb.collection("userSessions").doc(uid);

    // Mark the session as inactive
    await userSessionsRef.update({
      [`${deviceId}.isActive`]: false,
      [`${deviceId}.logoutTime`]: Date.now(),
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
