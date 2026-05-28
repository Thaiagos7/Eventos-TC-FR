import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  deleteUserNotifications,
  fetchNotifications,
  insertNotification,
  markNotificationAsRead,
  markUserNotificationsAsRead,
} from '@/lib/notificationRepository';
import {
  createNotification,
  readStoredNotifications,
  writeStoredNotifications,
  type NewNotification,
  type Notification,
} from '@/lib/notificationStore';

export type { Notification } from '@/lib/notificationStore';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (n: NewNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (userId: string) => void;
  clearNotifications: (userIds: string[]) => void;
  getUnreadCount: (userId: string) => number;
  getUserNotifications: (userId: string) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(() => readStoredNotifications());

  useEffect(() => {
    writeStoredNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const userIds = [user.email, user.id];

    (async () => {
      try {
        const remoteNotifications = await fetchNotifications(userIds);
        if (cancelled) return;

        setNotifications((prev) => {
          const map = new Map(prev.map((notification) => [notification.id, notification]));
          for (const notification of remoteNotifications) map.set(notification.id, notification);
          return Array.from(map.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        });
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const addNotification = useCallback((n: NewNotification) => {
    const notification = createNotification(n);
    setNotifications((prev) => [notification, ...prev]);

    void insertNotification(notification).catch((error) => {
      console.error('Failed to save notification:', error);
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

    void markNotificationAsRead(id).catch((error) => {
      console.error('Failed to mark notification as read:', error);
    });
  }, []);

  const markAllAsRead = useCallback((userId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.userId === userId ? { ...n, read: true } : n))
    );

    void markUserNotificationsAsRead(userId).catch((error) => {
      console.error('Failed to mark notifications as read:', error);
    });
  }, []);

  const clearNotifications = useCallback((userIds: string[]) => {
    const ids = new Set(userIds.filter(Boolean));
    if (ids.size === 0) return;

    setNotifications((prev) => prev.filter((n) => !ids.has(n.userId)));

    void deleteUserNotifications(Array.from(ids)).catch((error) => {
      console.error('Failed to clear notifications:', error);
    });
  }, []);

  const getUnreadCount = useCallback(
    (userId: string) => notifications.filter((n) => n.userId === userId && !n.read).length,
    [notifications]
  );

  const getUserNotifications = useCallback(
    (userId: string) => notifications.filter((n) => n.userId === userId),
    [notifications]
  );

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, clearNotifications, getUnreadCount, getUserNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
