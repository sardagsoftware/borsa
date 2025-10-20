"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { notificationManager } from "@/lib/pwa/notifications";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30000,
          },
        },
      })
  );

  // Initialize PWA and notifications on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize notification manager (registers service worker + requests permission)
      notificationManager.initialize().then((granted) => {
        if (granted) {
          console.log('[PWA] Notifications enabled ✓');
        } else {
          console.log('[PWA] Notifications permission denied or not supported');
        }
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1a1f2e",
            color: "#fff",
            border: "1px solid #2d3748",
          },
        }}
      />
    </QueryClientProvider>
  );
}
