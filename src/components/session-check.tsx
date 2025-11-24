"use client";

import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

interface SessionCheckProps {
  checkInterval?: number; // milliseconds for fallback polling
}

/**
 * SessionCheck Component
 * Uses Server-Sent Events (SSE) for real-time session invalidation notifications
 * Falls back to polling if SSE connection fails
 */
export function SessionCheck({
  checkInterval = 5000, // Fallback poll interval
}: SessionCheckProps) {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const hasLoggedOutRef = useRef<boolean>(false);

  const handleLogout = useCallback(async () => {
    if (hasLoggedOutRef.current) return;
    
    hasLoggedOutRef.current = true;
    
    // Clear intervals and connections
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    toast.error("Session Invalidated", {
      description:
        "You were logged out because you logged in from another device.",
      duration: 5000,
    });

    try {
      await auth.signOut();
    } catch (signOutError) {
      console.debug("Error signing out:", signOutError);
    }

    // Redirect to login
    router.push("/login?message=logged_out_from_another_device");
  }, [router]);

  const checkSessionPoll = useCallback(async () => {
    if (hasLoggedOutRef.current) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        console.debug("[SessionCheck] No current user");
        return;
      }

      const token = await user.getIdToken(false);
      const cookies = document.cookie.split("; ");
      const deviceIdCookie = cookies.find((row) => row.startsWith("deviceId="));
      const deviceId = deviceIdCookie?.split("=")[1];

      if (!deviceId) {
        console.debug("[SessionCheck] No device ID");
        return;
      }

      const response = await fetch("/api/device-session", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-device-id": deviceId,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (data.reason === "SESSION_INVALIDATED" || !data.isValid) {
        console.warn("[SessionCheck] Session invalidated (polling)");
        await handleLogout();
        return;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.debug("[SessionCheck] Poll error:", error.message);
      }
    }
  }, [handleLogout]);

  const setupSSE = useCallback(async () => {
    if (sseRef.current) return; // Already connected
    if (hasLoggedOutRef.current) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        console.debug("[SessionCheck] No current user for SSE");
        return;
      }

      const token = await user.getIdToken(false);
      const cookies = document.cookie.split("; ");
      const deviceIdCookie = cookies.find((row) => row.startsWith("deviceId="));
      const deviceId = deviceIdCookie?.split("=")[1];

      if (!deviceId) {
        console.debug("[SessionCheck] No device ID for SSE");
        return;
      }

      // Create SSE connection
      const sse = new EventSource(
        `/api/device-session-notify?deviceId=${deviceId}&token=${encodeURIComponent(token)}`
      );

      sse.addEventListener("SESSION_INVALIDATED", () => {
        console.log("[SessionCheck] Received SESSION_INVALIDATED via SSE");
        handleLogout();
      });

      sse.addEventListener("CONNECTED", () => {
        console.log("[SessionCheck] SSE connection established");
      });

      sse.onerror = (error) => {
        console.error("[SessionCheck] SSE connection error:", error);
        sseRef.current = null;
        sse.close();
        
        // Fall back to polling on SSE failure
        if (!hasLoggedOutRef.current && !intervalRef.current) {
          console.log("[SessionCheck] Falling back to polling");
          intervalRef.current = setInterval(() => {
            if (!hasLoggedOutRef.current) {
              checkSessionPoll();
            }
          }, checkInterval);
        }
      };

      sseRef.current = sse;
      console.log("[SessionCheck] SSE connection initiated");
    } catch (error) {
      console.error("[SessionCheck] SSE setup error:", error);
      // Fall back to polling
      if (!hasLoggedOutRef.current && !intervalRef.current) {
        intervalRef.current = setInterval(() => {
          if (!hasLoggedOutRef.current) {
            checkSessionPoll();
          }
        }, checkInterval);
      }
    }
  }, [handleLogout, checkSessionPoll, checkInterval]);

  useEffect(() => {
    // Initial check
    const initialTimeout = setTimeout(() => {
      setupSSE();
      checkSessionPoll(); // Also do initial poll
    }, 500);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [setupSSE, checkSessionPoll]);

  return null;
}
