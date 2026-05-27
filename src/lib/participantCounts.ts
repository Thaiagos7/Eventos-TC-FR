import type { Event, Participant } from '@/data/mockData';

export function getVisibleParticipantCount(
  event: Pick<Event, 'currentParticipants'>,
  participants: Participant[],
  canManageEvents: boolean,
): number {
  return canManageEvents ? participants.length : event.currentParticipants;
}
