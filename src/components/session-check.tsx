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
 * Real-time monitoring for session invalidation using SSE + aggressive polling
 * Ensures instant logout without refresh when another device logs in
 */
export function SessionCheck({
  checkInterval = 1000, // Very aggressive 1-second polling
}: SessionCheckProps) {
  const router = useRouter();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const hasLoggedOutRef = useRef<boolean>(false);
  const lastCheckRef = useRef<number>(0);

  const handleLogout = useCallback(async () => {
    if (hasLoggedOutRef.current) return;

    hasLoggedOutRef.current = true;

    // Clear all timers and connections
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
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
      console.debug("[SessionCheck] Error signing out:", signOutError);
    }

    // Redirect immediately
    router.push("/login?message=logged_out_from_another_device");
  }, [router]);

  // Aggressive polling check - runs every 1 second
  const checkSessionImmediately = useCallback(async () => {
    if (hasLoggedOutRef.current) return;

    // Throttle to prevent duplicate checks within 500ms
    const now = Date.now();
    if (now - lastCheckRef.current < 500) return;
    lastCheckRef.current = now;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken(false);
      const cookies = document.cookie.split("; ");
      const deviceIdCookie = cookies.find((row) => row.startsWith("deviceId="));
      const deviceId = deviceIdCookie?.split("=")[1];

      if (!deviceId) return;

      const response = await fetch("/api/device-session", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-device-id": deviceId,
        },
        // Don't cache this request
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      // Immediate logout if session invalid
      if (data.reason === "SESSION_INVALIDATED" || !data.isValid) {
        console.warn("[SessionCheck] Session invalid - logging out immediately");
        await handleLogout();
      }
    } catch (error) {
      console.debug("[SessionCheck] Check error:", error);
    }
  }, [handleLogout]);

  // Setup SSE for real-time notifications
  const setupSSE = useCallback(() => {
    if (sseRef.current) return;
    if (hasLoggedOutRef.current) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get token synchronously from cache
      user.getIdToken(false).then((token) => {
        const cookies = document.cookie.split("; ");
        const deviceIdCookie = cookies.find((row) => row.startsWith("deviceId="));
        const deviceId = deviceIdCookie?.split("=")[1];

        if (!deviceId) return;

        console.log("[SessionCheck] Opening SSE connection...");

        const sse = new EventSource(
          `/api/device-session-notify?deviceId=${deviceId}&token=${encodeURIComponent(token)}`
        );

        // Immediate logout on SSE invalidation event
        sse.addEventListener("SESSION_INVALIDATED", () => {
          console.log("[SessionCheck] 🔴 Received SESSION_INVALIDATED via SSE - instant logout");
          handleLogout();
        });

        sse.addEventListener("CONNECTED", () => {
          console.log("[SessionCheck] ✅ SSE connected");
        });

        sse.onerror = () => {
          console.error("[SessionCheck] SSE error - falling back to polling");
          sse.close();
          sseRef.current = null;
        };

        sseRef.current = sse;
      });
    } catch (error) {
      console.error("[SessionCheck] SSE setup error:", error);
    }
  }, [handleLogout]);

  useEffect(() => {
    // Delay initial check by 3 seconds to let new device fully register after refresh
    const initialDelay = setTimeout(() => {
      // Setup SSE immediately
      setupSSE();

      // Start aggressive polling (1 second) but NOT immediate check on mount
      console.log("[SessionCheck] Starting 1-second polling...");
      pollingIntervalRef.current = setInterval(() => {
        checkSessionImmediately();
      }, checkInterval);

      // Don't do immediate check on mount - wait for first polling interval
    }, 3000);

    return () => {
      clearTimeout(initialDelay);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [setupSSE, checkSessionImmediately, checkInterval]);

  return null;
}
