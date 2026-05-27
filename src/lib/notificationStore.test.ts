import { describe, expect, it } from 'vitest';
import { parseStoredNotifications } from './notificationStore';

describe('notification store', () => {
  it('restores persisted notifications with dates', () => {
    const notifications = parseStoredNotifications(JSON.stringify([
      {
        id: 'notif-1',
        userId: 'aluno@eventostc.test',
        title: 'Inscricao confirmada',
        message: 'Esta inscricao ficou guardada.',
        type: 'registration',
        read: true,
        createdAt: '2026-05-27T10:00:00.000Z',
      },
    ]));

    expect(notifications).toHaveLength(1);
    expect(notifications[0].createdAt).toBeInstanceOf(Date);
    expect(notifications[0].read).toBe(true);
  });

  it('ignores invalid stored data', () => {
    expect(parseStoredNotifications('not-json')).toEqual([]);
    expect(parseStoredNotifications(JSON.stringify([{ id: 123 }]))).toEqual([]);
  });
});
