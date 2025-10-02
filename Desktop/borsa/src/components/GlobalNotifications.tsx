'use client';

import { useNotifications } from '@/contexts/NotificationContext';
import { useEffect, useState } from 'react';

export default function GlobalNotifications() {
  const { notifications, removeNotification, markAsRead } = useNotifications();
  const [visible, setVisible] = useState<string[]>([]);

  // Show notifications with animation
  useEffect(() => {
    notifications.forEach(notification => {
      if (!visible.includes(notification.id)) {
        setTimeout(() => {
          setVisible(prev => [...prev, notification.id]);
        }, 100);
      }
    });
  }, [notifications]);

  // Display only the latest 3 notifications
  const displayNotifications = notifications.slice(0, 3);

  const getIcon = (type: string) => {
    switch (type) {
      case 'signal':
        return '🚀';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'signal':
        return 'from-emerald-500/10 to-cyan-500/10 border-emerald-500/50';
      case 'success':
        return 'from-emerald-500/10 to-emerald-500/10 border-emerald-500/50';
      case 'warning':
        return 'from-yellow-500/10 to-orange-500/10 border-yellow-500/50';
      case 'error':
        return 'from-red-500/10 to-red-500/10 border-red-500/50';
      case 'info':
        return 'from-blue-500/10 to-cyan-500/10 border-blue-500/50';
      default:
        return 'from-slate-500/10 to-slate-500/10 border-slate-500/50';
    }
  };

  const getActionColor = (action?: string) => {
    if (action === 'BUY') return 'text-emerald-400 bg-emerald-500/20';
    if (action === 'SELL') return 'text-red-400 bg-red-500/20';
    return 'text-yellow-400 bg-yellow-500/20';
  };

  const formatTimeLeft = (expiresAt?: number) => {
    if (!expiresAt) return null;
    const now = Date.now();
    const timeLeft = expiresAt - now;

    if (timeLeft <= 0) return 'Süresi doldu';

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}dk ${seconds}sn kaldı`;
    }
    return `${seconds}sn kaldı`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] space-y-3 max-w-md">
      {displayNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-gradient-to-br ${getColors(notification.type)} backdrop-blur-xl border-2 rounded-xl p-4 shadow-2xl transform transition-all duration-300 ${
            visible.includes(notification.id)
              ? 'translate-x-0 opacity-100'
              : 'translate-x-full opacity-0'
          }`}
          onClick={() => markAsRead(notification.id)}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="text-3xl animate-bounce">{getIcon(notification.type)}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-bold text-white text-sm">{notification.title}</h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  className="text-slate-400 hover:text-white transition-colors text-xs"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 mb-2">{notification.message}</p>

              {/* Signal Details */}
              {notification.type === 'signal' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {notification.coin && (
                      <span className="text-xs font-bold text-white bg-slate-700/50 px-2 py-1 rounded">
                        {notification.coin}
                      </span>
                    )}
                    {notification.action && (
                      <span className={`text-xs font-bold px-2 py-1 rounded ${getActionColor(notification.action)}`}>
                        {notification.action}
                      </span>
                    )}
                    {notification.confidence && (
                      <span className="text-xs text-cyan-400 font-semibold">
                        {(notification.confidence * 100).toFixed(0)}% Güven
                      </span>
                    )}
                  </div>

                  {notification.price && (
                    <div className="text-xs text-slate-300">
                      Fiyat: <span className="font-mono text-white">${notification.price.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Time Left */}
                  {notification.expiresAt && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-yellow-400">⏱️</span>
                      <span className="text-yellow-300 font-semibold">
                        {formatTimeLeft(notification.expiresAt)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs text-slate-500 mt-2">
                {new Date(notification.createdAt).toLocaleTimeString('tr-TR')}
              </div>
            </div>
          </div>

          {/* Progress bar for expiring signals */}
          {notification.type === 'signal' && notification.expiresAt && (
            <SignalProgressBar expiresAt={notification.expiresAt} createdAt={notification.createdAt} />
          )}
        </div>
      ))}
    </div>
  );
}

// Progress bar component for signal expiration
function SignalProgressBar({ expiresAt, createdAt }: { expiresAt: number; createdAt: number }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const totalDuration = expiresAt - createdAt;
    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = expiresAt - now;
      const percentage = Math.max(0, (timeLeft / totalDuration) * 100);
      setProgress(percentage);

      if (percentage <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [expiresAt, createdAt]);

  return (
    <div className="mt-3 w-full bg-slate-700/30 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full transition-all duration-100 rounded-full ${
          progress > 50
            ? 'bg-emerald-500'
            : progress > 20
            ? 'bg-yellow-500'
            : 'bg-red-500'
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
