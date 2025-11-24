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
  pendingInvalidation?: boolean; // Flag for devices waiting to be invalidated
  invalidationScheduledAt?: number; // When the invalidation was scheduled
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
      // IMPORTANT: Clear pending invalidation on refresh - this session is staying active
      pendingInvalidation: false,
    };

    // ONLY invalidate other sessions if this is a NEW device (not a refresh)
    // For the same user, only invalidate OTHER devices, not this one
    const updatedSessions: { [key: string]: DeviceSession } = {};
    const invalidatedSessions: string[] = [];
    
    if (isRefresh) {
      // Same user+device refreshing - just update activity time, don't invalidate others
      Object.entries(existingSessions).forEach(([key, session]) => {
        updatedSessions[key] = session;
      });
      updatedSessions[sessionKey] = newSession;
      console.log("[Device Session] User", uid, "refreshing device", deviceId, "- NOT invalidating others");
    } else {
      // New device for this user - mark all other devices of THIS USER as PENDING invalidation
      // IMPORTANT: Different accounts are never affected because each user has their own Firestore document
      Object.entries(existingSessions).forEach(([key, session]) => {
        // Extract deviceId from composite key (format: uid:deviceId)
        const existingDeviceId = key.split(":")[1];
        if (existingDeviceId !== deviceId && session.isActive) {
          // Mark as pending invalidation but keep active for 30 seconds
          invalidatedSessions.push(key);
          updatedSessions[key] = { 
            ...session, 
            pendingInvalidation: true,
            invalidationScheduledAt: Date.now(),
          };
        } else {
          updatedSessions[key] = session;
        }
      });
      updatedSessions[sessionKey] = newSession;
      console.log("[Device Session] NEW device", deviceId, "for user", uid, "- Marked", invalidatedSessions.length, "other devices for delayed invalidation");
    }

    // Update Firestore immediately
    await userSessionsRef.set(updatedSessions);

    console.log("[Device Session] Registered device", deviceId, "for user", uid);

    // Send real-time notifications to invalidated sessions AFTER a delay
    // ONLY if we actually invalidated sessions (not a refresh)
    if (invalidatedSessions.length > 0) {
      // Send notifications after 30 seconds - avoid aggressive logouts
      // Only the newly logged-in device (this one) stays active
      setTimeout(() => {
        // Re-fetch to get latest state and only invalidate if still pending
        userSessionsRef.get().then((doc) => {
          if (!doc.exists) return;
          const currentSessions = doc.data() || {};
          
          // Only invalidate sessions that are still marked as pending
          const sessionsToInvalidate = invalidatedSessions.filter(sKey => {
            const session = currentSessions[sKey];
            return session && session.pendingInvalidation;
          });

          if (sessionsToInvalidate.length === 0) {
            console.log("[Device Session] No sessions to invalidate after 5s delay for user", uid);
            return;
          }

          // Mark sessions as inactive in Firestore
          const updates: Record<string, boolean | number> = {};
          sessionsToInvalidate.forEach(sKey => {
            updates[`${sKey}.isActive`] = false;
            updates[`${sKey}.pendingInvalidation`] = false;
          });
          
          userSessionsRef.update(updates).then(() => {
            // Now send notifications
            fetch(
              new URL("/api/device-session-notify", request.url),
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: uid,
                  sessionKey: sessionKey, // Use composite key to exclude current session
                  targetSessions: sessionsToInvalidate, // Only target these specific sessions
                }),
              }
            ).then((res) => {
              res.json().then((data) => {
                console.log("[Device Session] Invalidated and notified", data.notifiedCount, "sessions after 5s delay for user", uid);
              });
            }).catch((error) => {
              console.error("[Device Session] Error sending notifications:", error);
            });
          });
        });
      }, 30000);
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
    // Note: pendingInvalidation does NOT make session invalid yet - it's still active!
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

    // Session is still valid even if pending invalidation (grace period)
    if (currentSession.pendingInvalidation) {
      console.log("[Device Session] Device", deviceId, "user", uid, "is in grace period (pending invalidation)");
    }

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
