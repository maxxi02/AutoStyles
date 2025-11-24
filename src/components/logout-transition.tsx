"use client";

import { useEffect, useState } from "react";

export function LogoutTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin-animation {
        to {
          transform: rotate(360deg);
        }
      }
      .logout-spinner {
        animation: spin-animation 1s linear infinite;
      }
    `;
    document.head.appendChild(style);

    const handleLoginStart = () => {
      setIsTransitioning(true);
      setProgress(0);

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + (100 / 50);
        });
      }, 100);

      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setProgress(0);
        clearInterval(interval);
      }, 6000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    };

    window.addEventListener("logout-transition-start", handleLoginStart as EventListener);
    return () => {
      window.removeEventListener("logout-transition-start", handleLoginStart as EventListener);
      document.head.removeChild(style);
    };
  }, []);

  if (!isTransitioning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="logout-spinner absolute inset-0 rounded-full border-4 border-transparent border-t-white border-r-white"></div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">Syncing Login</h2>
          <p className="mt-1 text-sm text-gray-200">
            Automatically logging out from other devices...
          </p>
        </div>

        <div className="w-64 h-1 bg-gray-600 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all ease-linear" 
            style={{ width: `${progress}%` } as React.CSSProperties}
          ></div>
        </div>

        <p className="text-xs text-gray-300">
          {progress < 100
            ? `${Math.round(progress)}% - Keep this device open`
            : "Complete - You're all set!"}
        </p>
      </div>
    </div>
  );
}
