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
      console.warn("Firebase Admin SDK not initialized. Skipping device session registration.");
      return NextResponse.json(
        {
          success: true,
          message: "Device session registration skipped - Firebase Admin SDK not configured",
          sessionId: deviceId,
        },
        { status: 200 }
      );
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
    Object.entries(existingSessions).forEach(([key, session]) => {
      if (key !== deviceId) {
        updatedSessions[key] = { ...session, isActive: false };
      }
    });

    // Add the new session
    updatedSessions[deviceId] = newSession;

    // Update Firestore
    await userSessionsRef.set(updatedSessions, { merge: true });

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
    const token = request.headers.get("authorization")?.split("Bearer ")[1];
    const deviceId = request.headers.get("x-device-id");

    if (!token || !deviceId) {
      return NextResponse.json(
        { error: "Missing token or device ID", isValid: false },
        { status: 401 }
      );
    }

    // Check if Firebase Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      console.warn("Firebase Admin SDK not initialized. Allowing access.");
      return NextResponse.json(
        {
          success: true,
          isValid: true,
          uid: "unknown",
          email: "unknown",
        },
        { status: 200 }
      );
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
    const { token, deviceId } = await request.json();

    if (!token || !deviceId) {
      return NextResponse.json(
        { error: "Missing token or device ID" },
        { status: 400 }
      );
    }

    // Check if Firebase Admin SDK is initialized
    if (!adminAuth || !adminDb) {
      console.warn("Firebase Admin SDK not initialized. Skipping device session logout.");
      return NextResponse.json(
        { success: true, message: "Device session logged out successfully" },
        { status: 200 }
      );
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
