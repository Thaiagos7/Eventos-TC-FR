import { describe, expect, it } from 'vitest';
import { notificationToInsert, rowToNotification, type NotificationRow } from './notificationRepository';
import type { Notification } from './notificationStore';

describe('notification repository mappers', () => {
  it('maps database rows to app notifications', () => {
    const row: NotificationRow = {
      id: '7b5c7d68-b8a3-4bb2-8b83-88b53647d709',
      user_id: 'aluno@eventostc.test',
      title: 'Inscricao confirmada',
      message: 'A inscricao ficou guardada.',
      type: 'registration',
      read: false,
      created_at: '2026-05-27T10:00:00.000Z',
      event_id: null,
    };

    const notification = rowToNotification(row);

    expect(notification.userId).toBe('aluno@eventostc.test');
    expect(notification.createdAt).toBeInstanceOf(Date);
    expect(notification.eventId).toBeUndefined();
  });

  it('maps app notifications to database inserts', () => {
    const notification: Notification = {
      id: '7b5c7d68-b8a3-4bb2-8b83-88b53647d709',
      userId: 'aluno@eventostc.test',
      title: 'Inscricao confirmada',
      message: 'A inscricao ficou guardada.',
      type: 'registration',
      read: true,
      createdAt: new Date('2026-05-27T10:00:00.000Z'),
      eventId: '458de50c-1370-4f72-8849-916cf626a390',
    };

    expect(notificationToInsert(notification)).toEqual({
      id: '7b5c7d68-b8a3-4bb2-8b83-88b53647d709',
      user_id: 'aluno@eventostc.test',
      title: 'Inscricao confirmada',
      message: 'A inscricao ficou guardada.',
      type: 'registration',
      read: true,
      created_at: '2026-05-27T10:00:00.000Z',
      event_id: '458de50c-1370-4f72-8849-916cf626a390',
    });
  });
});
