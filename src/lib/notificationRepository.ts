import { supabase } from '@/lib/supabase';
import type { NewNotification, Notification } from '@/lib/notificationStore';

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: Notification['type'];
  read: boolean;
  created_at: string;
  event_id: string | null;
}

export function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    read: row.read,
    createdAt: new Date(row.created_at),
    eventId: row.event_id ?? undefined,
  };
}

export function notificationToInsert(notification: Notification | (NewNotification & { id: string; read: boolean; createdAt: Date })) {
  return {
    id: notification.id,
    user_id: notification.userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: notification.read,
    created_at: notification.createdAt.toISOString(),
    event_id: notification.eventId ?? null,
  };
}

export async function fetchNotifications(userIds: string[]): Promise<Notification[]> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueUserIds.length === 0) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .in('user_id', uniqueUserIds)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as NotificationRow[]).map(rowToNotification);
}

export async function insertNotification(notification: Notification): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert(notificationToInsert(notification));

  if (error) throw error;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function markUserNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteUserNotifications(userIds: string[]): Promise<void> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueUserIds.length === 0) return;

  const { error } = await supabase
    .from('notifications')
    .delete()
    .in('user_id', uniqueUserIds);

  if (error) throw error;
}
