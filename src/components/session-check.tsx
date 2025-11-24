"use client";

import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

interface SessionCheckProps {
  checkInterval?: number; // milliseconds, default 30 seconds
}

/**
 * SessionCheck Component
 * Periodically verifies if the current device session is still active
 * Redirects to login if the session has been invalidated from another device
 */
export function SessionCheck({
  checkInterval = 30000, // Check every 30 seconds
}: SessionCheckProps) {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoggedOutRef = useRef<boolean>(false);

  const checkSession = useCallback(async () => {
    // Prevent multiple logout attempts
    if (hasLoggedOutRef.current) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        console.debug("No current user, skipping session check");
        return;
      }

      const token = await user.getIdToken();
      const cookies = document.cookie.split("; ");
      const deviceIdCookie = cookies.find((row) => row.startsWith("deviceId="));
      const deviceId = deviceIdCookie?.split("=")[1];

      if (!deviceId) {
        console.debug("No device ID found in cookies");
        return;
      }

      console.debug("[SessionCheck] Verifying session...");
      const response = await fetch("/api/device-session", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-device-id": deviceId,
        },
      });

      const data = await response.json().catch(() => ({}));
      console.debug("[SessionCheck] Response:", { status: response.status, data });

      // Check if session was invalidated
      if (data.reason === "SESSION_INVALIDATED") {
        console.warn("[SessionCheck] Session invalidated from another device");
        // Prevent multiple logout attempts
        hasLoggedOutRef.current = true;

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        toast.error("Session Invalidated", {
          description:
            "You were logged out because you logged in from another device.",
          duration: 5000,
        });

        // Logout and redirect
        try {
          await auth.signOut();
        } catch (signOutError) {
          console.debug("Error signing out:", signOutError);
        }

        router.push("/login?message=logged_out_from_another_device");
        return;
      }

      if (!response.ok) {
        console.debug("[SessionCheck] Response not OK:", response.status);
        return;
      }

      console.debug("[SessionCheck] Session valid");
    } catch (error) {
      // Log errors for debugging but don't interrupt user experience
      if (error instanceof Error) {
        console.debug("Session check error:", error.message);
      }
    }
  }, [router]);

  useEffect(() => {
    // Initial check after a short delay to let auth state settle
    const initialTimeout = setTimeout(() => {
      checkSession();
    }, 2000);

    // Set up periodic checks only if we haven't logged out yet
    if (!hasLoggedOutRef.current) {
      intervalRef.current = setInterval(() => {
        if (!hasLoggedOutRef.current) {
          checkSession();
        }
      }, checkInterval);
    }

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkSession, checkInterval]);

  return null; // This component doesn't render anything
}
