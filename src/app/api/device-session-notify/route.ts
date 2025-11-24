import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Store active SSE connections: userId:deviceId -> ResponseWithContext
// Using composite key to prevent different users with same deviceId from colliding
const activeConnections = new Map<
  string,
  {
    respond: (data: string) => void;
    close: () => void;
    userId: string;
    deviceId: string;
  }
>();

/**
 * GET /api/device-session-notify
 * Opens a Server-Sent Events (SSE) connection for real-time session invalidation notifications
 * Sends immediate notification if device session has been invalidated
 */
export async function GET(request: NextRequest) {
  try {
    // Get token and deviceId from headers or query params (EventSource doesn't support custom headers)
    const authHeader = request.headers.get("authorization");
    let token = authHeader?.split("Bearer ")[1];
    const tokenParam = request.nextUrl.searchParams.get("token");
    if (!token && tokenParam) {
      token = tokenParam;
    }

    let deviceId = request.headers.get("x-device-id") || request.cookies.get("deviceId")?.value;
    const deviceIdParam = request.nextUrl.searchParams.get("deviceId");
    if (!deviceId && deviceIdParam) {
      deviceId = deviceIdParam;
    }

    if (!token || !deviceId) {
      console.warn("[SSE] Missing token or device ID");
      return NextResponse.json(
        { error: "Missing token or device ID" },
        { status: 401 }
      );
    }

    // Try Firebase Admin SDK first
    let userId: string | null = null;

    if (adminAuth && adminDb) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        userId = decodedToken.uid;

        // Check if session is already invalidated
        const userSessionsRef = adminDb.collection("userSessions").doc(userId);
        const userSessionsDoc = await userSessionsRef.get();

        if (userSessionsDoc.exists) {
          const sessions = userSessionsDoc.data() || {};
          const sessionKey = `${userId}:${deviceId}`;
          const currentSession = sessions[sessionKey];

          // If already invalidated, send immediate notification
          if (currentSession && !currentSession.isActive) {
            console.log("[SSE] Session already invalidated for user:", userId, "device:", deviceId);
            const encoder = new TextEncoder();
            const readableStream = new ReadableStream({
              start(controller) {
                const data = JSON.stringify({
                  type: "SESSION_INVALIDATED",
                  message: "Your session has been invalidated from another device",
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                controller.close();
              },
            });
            return new NextResponse(readableStream, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "X-Accel-Buffering": "no",
              },
            });
          }
        }
      } catch (error) {
        console.error("[SSE] Token verification failed:", error);
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        );
      }
    } else {
      // Fallback: use device ID as user identifier
      userId = `fallback-${deviceId}`;
    }

    // Set up SSE connection
    const encoder = new TextEncoder();
    let isConnected = true;

    const readableStream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const connectionMessage = JSON.stringify({
          type: "CONNECTED",
          deviceId,
          timestamp: Date.now(),
        });
        controller.enqueue(encoder.encode(`data: ${connectionMessage}\n\n`));

        // Store connection for later notifications
        const connection = {
          respond: (data: string) => {
            if (isConnected) {
              try {
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              } catch (error) {
                console.error("[SSE] Error sending data:", error);
                isConnected = false;
              }
            }
          },
          close: () => {
            if (isConnected) {
              isConnected = false;
              try {
                controller.close();
              } catch (error) {
                console.error("[SSE] Error closing connection:", error);
              }
            }
          },
        };

        const connectionKey = `${userId}:${deviceId}`;
        activeConnections.set(connectionKey, {
          ...connection,
          userId: userId!,
          deviceId: deviceId!,
        });

        console.log("[SSE] New connection established for user:", userId, "device:", deviceId, "key:", connectionKey);

        // Send heartbeat to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (isConnected) {
            try {
              controller.enqueue(encoder.encode(": heartbeat\n\n"));
            } catch (error) {
              console.error("[SSE] Heartbeat error:", error);
              isConnected = false;
              clearInterval(heartbeatInterval);
              activeConnections.delete(connectionKey);
            }
          } else {
            clearInterval(heartbeatInterval);
            activeConnections.delete(connectionKey);
          }
        }, 30000); // Heartbeat every 30 seconds

        // Handle client disconnect
        request.signal.addEventListener("abort", () => {
          console.log("[SSE] Client disconnected - user:", userId, "device:", deviceId, "key:", connectionKey);
          isConnected = false;
          clearInterval(heartbeatInterval);
          activeConnections.delete(connectionKey);
          try {
            controller.close();
          } catch (error) {
            console.error("[SSE] Error on disconnect:", error);
          }
        });
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[SSE] Error establishing connection:", error);
    return NextResponse.json(
      { error: "Failed to establish connection" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/device-session-notify
 * Notifies all other devices for a user that their session has been invalidated
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, sessionKey, targetSessions } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    console.log("[SSE] Broadcasting invalidation for user:", userId, "excluding session:", sessionKey, "targets:", targetSessions);

    // Notify only the target sessions (passed as composite keys userId:deviceId)
    let notifiedCount = 0;
    activeConnections.forEach((connection, connectionKey) => {
      // Only notify if:
      // 1. Same user
      // 2. NOT the session that triggered invalidation
      // 3. Session is in the targetSessions list
      const isTarget = targetSessions && targetSessions.includes(connectionKey);
      
      if (connection.userId === userId && connectionKey !== sessionKey && isTarget) {
        console.log("[SSE] Notifying session:", connectionKey, "for user:", userId);
        const data = JSON.stringify({
          type: "SESSION_INVALIDATED",
          message: "Your session has been invalidated from another device",
          timestamp: Date.now(),
        });
        connection.respond(data);
        notifiedCount++;
      } else if (connection.userId === userId && !isTarget) {
        console.log("[SSE] Skipping non-targeted session:", connectionKey);
      }
    });

    console.log("[SSE] Notified", notifiedCount, "connected sessions for user", userId);

    return NextResponse.json(
      {
        success: true,
        message: "Notifications sent",
        notifiedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SSE] Error sending notifications:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
