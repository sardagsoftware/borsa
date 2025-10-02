'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'signal' | 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  coin?: string;
  action?: 'BUY' | 'SELL' | 'HOLD';
  price?: number;
  confidence?: number;
  expiresAt?: number;
  createdAt: number;
  read: boolean;
  autoClose?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-close after 10 seconds if specified
    if (notification.autoClose !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, 10000);
    }

    // Play notification sound
    if (notification.type === 'signal') {
      playNotificationSound();
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    } catch (error) {
      // Silently fail
    }
  };

  // Check for expired signals
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      notifications.forEach(notification => {
        if (notification.expiresAt && notification.expiresAt < now && !notification.read) {
          addNotification({
            type: 'warning',
            title: 'Süre Doldu!',
            message: `${notification.coin} için alım fırsatı süresi doldu`,
            autoClose: true,
          });
          markAsRead(notification.id);
        }
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [notifications, addNotification, markAsRead]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        markAsRead,
        clearAll,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
