import type { Event, Participant } from '@/data/mockData';

export function getProfileEventGroups(events: Event[], participants: Participant[], email: string) {
  const normalizedEmail = email.toLowerCase();
  const myRegistrations = participants.filter((p) => p.email.toLowerCase() === normalizedEmail);
  const enrolledEventIds = new Set(myRegistrations.map((p) => p.eventId));
  const enrolledEvents = events.filter((e) => enrolledEventIds.has(e.id));

  return {
    myRegistrations,
    enrolledEvents,
    upcomingEvents: enrolledEvents.filter((e) => e.status === 'upcoming' || e.status === 'ongoing'),
    completedEvents: enrolledEvents.filter((e) => e.status === 'completed'),
    presentCount: myRegistrations.filter((r) => r.attendance === 'present').length,
  };
}
