import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Store active SSE connections: deviceId -> ResponseWithContext
const activeConnections = new Map<
  string,
  {
    respond: (data: string) => void;
    close: () => void;
    userId: string;
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
          const currentSession = sessions[deviceId];

          // If already invalidated, send immediate notification
          if (currentSession && !currentSession.isActive) {
            console.log("[SSE] Session already invalidated for device:", deviceId);
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

        activeConnections.set(deviceId, {
          ...connection,
          userId: userId!,
        });

        console.log("[SSE] New connection established for device:", deviceId, "user:", userId);

        // Send heartbeat to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (isConnected) {
            try {
              controller.enqueue(encoder.encode(": heartbeat\n\n"));
            } catch (error) {
              console.error("[SSE] Heartbeat error:", error);
              isConnected = false;
              clearInterval(heartbeatInterval);
              activeConnections.delete(deviceId);
            }
          } else {
            clearInterval(heartbeatInterval);
            activeConnections.delete(deviceId);
          }
        }, 30000); // Heartbeat every 30 seconds

        // Handle client disconnect
        request.signal.addEventListener("abort", () => {
          console.log("[SSE] Client disconnected:", deviceId);
          isConnected = false;
          clearInterval(heartbeatInterval);
          activeConnections.delete(deviceId);
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
    const { userId, excludeDeviceId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    console.log("[SSE] Broadcasting invalidation for user:", userId, "excluding device:", excludeDeviceId);

    // Notify all connected devices for this user (except the one that triggered the invalidation)
    let notifiedCount = 0;
    activeConnections.forEach((connection, deviceId) => {
      if (connection.userId === userId && deviceId !== excludeDeviceId) {
        console.log("[SSE] Notifying device:", deviceId);
        const data = JSON.stringify({
          type: "SESSION_INVALIDATED",
          message: "Your session has been invalidated from another device",
          timestamp: Date.now(),
        });
        connection.respond(data);
        notifiedCount++;
      }
    });

    console.log("[SSE] Notified", notifiedCount, "connected devices");

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
