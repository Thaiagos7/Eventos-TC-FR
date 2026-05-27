import { describe, expect, it } from 'vitest';
import type { Event, Participant } from '@/data/mockData';
import { getProfileEventGroups } from './profileEvents';

const baseEvent: Event = {
  id: 'event-1',
  title: 'Evento',
  description: 'Descricao',
  category: 'Tecnologia',
  date: new Date('2026-05-27T10:00:00.000Z'),
  time: '10:00',
  location: 'Auditório',
  maxParticipants: 30,
  currentParticipants: 6,
  registrationType: 'internal',
  organizer: 'Eventos TC',
  image: '',
  status: 'upcoming',
  views: 0,
  approved: true,
  createdAt: new Date('2026-05-20T10:00:00.000Z'),
};

const participant: Participant = {
  id: 'participant-1',
  name: 'Aluno',
  email: 'aluno@eventostc.test',
  eventId: 'event-1',
  registeredAt: new Date('2026-05-27T10:00:00.000Z'),
  attendance: 'present',
  role: 'student',
};

describe('profile events', () => {
  it('builds profile lists from persisted participant rows', () => {
    const completedEvent: Event = { ...baseEvent, id: 'event-2', status: 'completed' };
    const completedParticipant: Participant = { ...participant, id: 'participant-2', eventId: 'event-2' };

    const groups = getProfileEventGroups(
      [baseEvent, completedEvent],
      [participant, completedParticipant],
      'Aluno@EventosTC.Test',
    );

    expect(groups.enrolledEvents).toHaveLength(2);
    expect(groups.upcomingEvents.map((event) => event.id)).toEqual(['event-1']);
    expect(groups.completedEvents.map((event) => event.id)).toEqual(['event-2']);
    expect(groups.presentCount).toBe(2);
  });
});
