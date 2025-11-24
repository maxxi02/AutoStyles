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
  checkInterval = 5000, // Check every 5 seconds for faster responsiveness
}: SessionCheckProps) {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoggedOutRef = useRef<boolean>(false);

  const handleLogout = useCallback(async () => {
    if (hasLoggedOutRef.current) return;
    
    hasLoggedOutRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
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

    // Small delay to ensure logout is processed before redirect
    await new Promise(resolve => setTimeout(resolve, 100));
    router.push("/login?message=logged_out_from_another_device");
  }, [router]);

  const checkSession = useCallback(async () => {
    if (hasLoggedOutRef.current) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        console.debug("[SessionCheck] No current user");
        return;
      }

      const token = await user.getIdToken(false); // Get cached token first
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

      // Check if session was invalidated
      if (data.reason === "SESSION_INVALIDATED" || !data.isValid) {
        console.warn("[SessionCheck] Session invalidated");
        await handleLogout();
        return;
      }

      if (!response.ok) {
        console.debug("[SessionCheck] Response not OK:", response.status);
        return;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.debug("[SessionCheck] Error:", error.message);
      }
    }
  }, [handleLogout]);

  useEffect(() => {
    // Initial check after minimal delay
    const initialTimeout = setTimeout(() => {
      checkSession();
    }, 500);

    // Set up periodic checks with faster interval
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
