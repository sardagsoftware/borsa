/**
 * NOTIFICATION PERMISSION PROMPT
 *
 * Mobile-friendly notification permission request
 * - Shows after 5 seconds of page load
 * - User gesture required (mobile-safe)
 * - Can be dismissed (stores in localStorage)
 * - Re-prompts after 7 days if dismissed
 */

'use client';

import { useState, useEffect } from 'react';
import { notificationManager } from '@/lib/pwa/notifications';

export function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if already prompted or permission already granted/denied
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    const permission = 'Notification' in window ? Notification.permission : 'denied';

    if (permission !== 'default') {
      // Already granted or denied, don't show
      return;
    }

    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      // Re-prompt after 7 days
      if (now - dismissedTime < sevenDays) {
        return;
      }
    }

    // Show prompt after 5 seconds (gives time for user to see the app)
    const timer = setTimeout(() => {
      setShow(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    const granted = await notificationManager.requestPermission();

    if (granted) {
      console.log('[Notification Prompt] ✅ Permission granted');
      setShow(false);
    } else {
      console.log('[Notification Prompt] ❌ Permission denied');
      localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
      setShow(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg shadow-2xl p-4 border border-blue-400/30">
        {/* Icon */}
        <div className="flex items-start gap-3">
          <div className="text-3xl">🔔</div>

          <div className="flex-1">
            <h3 className="font-bold text-white text-lg mb-1">
              Alım Sinyali Bildirimleri
            </h3>
            <p className="text-blue-100 text-sm mb-4">
              STRONG_BUY sinyalleri geldiğinde anında bildirim alın. Hiçbir fırsatı kaçırmayın!
            </p>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleEnable}
                className="flex-1 bg-white hover:bg-gray-100 text-blue-700 font-semibold py-2 px-4 rounded-lg transition-colors active:scale-95"
              >
                Etkinleştir 🚀
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-white/80 hover:text-white transition-colors"
              >
                Sonra
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
