export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'approval' | 'rejection' | 'registration' | 'event_update' | 'event_cancel';
  read: boolean;
  createdAt: Date;
  eventId?: string;
}

export type NewNotification = Omit<Notification, 'id' | 'read' | 'createdAt'>;

const STORAGE_KEY = 'eventostc-notifications';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function isNotification(value: unknown): value is Omit<Notification, 'createdAt'> & { createdAt: string } {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.userId === 'string' &&
    typeof item.title === 'string' &&
    typeof item.message === 'string' &&
    typeof item.type === 'string' &&
    typeof item.read === 'boolean' &&
    typeof item.createdAt === 'string'
  );
}

export function parseStoredNotifications(raw: string | null): Notification[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isNotification)
      .map((notification) => ({ ...notification, createdAt: new Date(notification.createdAt) }))
      .filter((notification) => !Number.isNaN(notification.createdAt.getTime()));
  } catch {
    return [];
  }
}

export function readStoredNotifications(): Notification[] {
  try {
    return parseStoredNotifications(getStorage()?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return [];
  }
}

export function writeStoredNotifications(notifications: Notification[]) {
  try {
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // Storage can be unavailable in private browsing or blocked environments.
  }
}

export function createNotification(notification: NewNotification): Notification {
  return {
    ...notification,
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    read: false,
    createdAt: new Date(),
  };
}
