import { describe, expect, it } from 'vitest';
import type { Participant } from '@/data/mockData';
import { getVisibleParticipantCount } from './participantCounts';

const ownParticipant: Participant = {
  id: 'participant-1',
  name: 'Aluno',
  email: 'aluno@eventostc.test',
  eventId: 'event-1',
  registeredAt: new Date('2026-05-27T10:00:00.000Z'),
  attendance: 'pending',
  role: 'student',
};

describe('participant counts', () => {
  it('uses the event counter for students when the participant list is partial', () => {
    expect(
      getVisibleParticipantCount(
        { currentParticipants: 6 },
        [ownParticipant],
        false,
      ),
    ).toBe(6);
  });

  it('uses the loaded participant list for managers', () => {
    expect(
      getVisibleParticipantCount(
        { currentParticipants: 6 },
        [ownParticipant],
        true,
      ),
    ).toBe(1);
  });
});
