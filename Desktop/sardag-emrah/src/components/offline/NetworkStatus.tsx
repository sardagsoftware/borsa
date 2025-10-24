'use client';

/**
 * NETWORK STATUS INDICATOR
 *
 * Shows real-time network connectivity status
 * - Online/Offline detection
 * - Visual indicator
 * - Reconnection notifications
 * - Background sync status
 *
 * WHITE-HAT:
 * - Non-intrusive UI
 * - Helpful for user awareness
 * - No tracking
 */

import { useEffect, useState } from 'react';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    // Initial status
    setIsOnline(navigator.onLine);

    // Online event handler
    const handleOnline = () => {
      console.log('[NetworkStatus] 🟢 Online');
      setIsOnline(true);
      setJustReconnected(true);
      setShowNotification(true);

      // Hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
        setJustReconnected(false);
      }, 5000);
    };

    // Offline event handler
    const handleOffline = () => {
      console.log('[NetworkStatus] 🔴 Offline');
      setIsOnline(false);
      setJustReconnected(false);
      setShowNotification(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and not just reconnected
  if (isOnline && !showNotification) {
    return null;
  }

  return (
    <>
      {/* Sticky indicator at top */}
      {showNotification && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center text-sm font-medium transition-all duration-300 ${
            isOnline
              ? 'bg-green-500 text-white'
              : 'bg-orange-500 text-white'
          }`}
        >
          {isOnline ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              🟢 İnternet bağlantısı geri geldi! Veriler güncelleniyor...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
              🔴 Çevrimdışısınız - Önbellekteki veriler kullanılıyor
            </span>
          )}
        </div>
      )}

      {/* Floating indicator (always visible when offline) */}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full shadow-lg text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Çevrimdışı
          </div>
        </div>
      )}
    </>
  );
}
