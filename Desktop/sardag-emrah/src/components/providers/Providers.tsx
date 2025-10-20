"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { notificationManager } from "@/lib/pwa/notifications";
import { setupGlobalErrorHandler } from "@/lib/monitoring/error-logger";
import { setupAnalytics } from "@/lib/monitoring/analytics";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationPrompt } from "@/components/notifications/NotificationPrompt";

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

  // Initialize PWA, notifications, error logger, analytics, and monitoring on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Setup global error handler
      setupGlobalErrorHandler();

      // Setup analytics
      setupAnalytics();

      // Initialize Web Vitals monitoring (privacy-first)
      import('@/lib/monitoring/web-vitals').then(({ webVitalsMonitor }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Monitoring] ✅ Web Vitals initialized');
        }
      });

      // Initialize Trading Metrics (privacy-first)
      import('@/lib/monitoring/trading-metrics').then(({ tradingMetrics }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Monitoring] ✅ Trading Metrics initialized');
        }
      });

      // Initialize notification manager (registers service worker + requests permission)
      notificationManager.initialize().then((granted) => {
        if (granted) {
          console.log('[PWA] Notifications enabled ✓');
        } else {
          console.log('[PWA] Notifications permission denied or not supported');
        }
      });

      console.log('[App] ✅ All systems initialized');
    }
  }, []);

  return (
    <ThemeProvider>
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
        <NotificationPrompt />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
