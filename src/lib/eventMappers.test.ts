import { describe, expect, it } from 'vitest';
import { eventToInsertPayload, rowToEvent, rowToParticipant, updatePayloadFromPartial } from './eventMappers';

describe('event mappers', () => {
  it('maps Supabase event rows to app events', () => {
    const event = rowToEvent({
      id: 'event-1',
      title: 'Torneio',
      description: 'Final',
      type: 'sports',
      registration_type: 'registration',
      date: '2026-05-27',
      time: '14:30',
      duration: 90,
      location: 'Pavilhao',
      max_participants: 20,
      current_participants: 7,
      organizer_name: 'Prof. Sonia',
      organizer_email: 'professor@eventostc.test',
      organizer_id: 'user-1',
      status: 'upcoming',
      approved: true,
      views: 12,
      enable_attendance: true,
      date_mode: 'scattered',
      dates: ['2026-05-27', '2026-05-28'],
      time_exceptions: [{ date: '2026-05-28', time: '15:00', duration: 60 }],
      has_max_participants: true,
    });

    expect(event).toMatchObject({
      id: 'event-1',
      title: 'Torneio',
      type: 'sports',
      registrationType: 'registration',
      time: '14:30',
      duration: 90,
      maxParticipants: 20,
      currentParticipants: 7,
      approved: true,
      dateMode: 'scattered',
      hasMaxParticipants: true,
    });
    expect(event.date.toISOString()).toContain('2026-05-27');
    expect(event.dates).toHaveLength(2);
    expect(event.timeExceptions).toEqual([{ date: '2026-05-28', time: '15:00', duration: 60 }]);
  });

  it('maps participants from Supabase column names', () => {
    const participant = rowToParticipant({
      id: 'participant-1',
      event_id: 'event-1',
      name: 'Thiago Aluno',
      email: 'aluno@eventostc.test',
      role: 'student',
      attendance: 'pending',
      registered_at: '2026-05-27T10:00:00.000Z',
    });

    expect(participant).toMatchObject({
      id: 'participant-1',
      eventId: 'event-1',
      name: 'Thiago Aluno',
      email: 'aluno@eventostc.test',
      role: 'student',
      attendance: 'pending',
    });
    expect(participant.registeredAt.toISOString()).toBe('2026-05-27T10:00:00.000Z');
  });

  it('creates insert payloads using database column names', () => {
    const payload = eventToInsertPayload({
      id: 'event-1',
      title: 'Workshop',
      description: 'Descricao',
      type: 'workshop',
      registrationType: 'registration',
      date: new Date('2026-05-27T12:00:00.000Z'),
      time: '11:00',
      duration: 45,
      location: 'Sala 1',
      maxParticipants: 15,
      organizerName: 'Professor',
      organizerEmail: 'professor@eventostc.test',
      organizerId: 'user-1',
      approved: false,
      createdByRole: 'professor',
      enableAttendance: true,
      dateMode: 'scattered',
      dates: [new Date('2026-05-27T12:00:00.000Z')],
      hasMaxParticipants: true,
    });

    expect(payload).toMatchObject({
      id: 'event-1',
      title: 'Workshop',
      registration_type: 'registration',
      date: '2026-05-27',
      date_mode: 'scattered',
      dates: ['2026-05-27'],
      max_participants: 15,
      organizer_id: 'user-1',
      created_by_role: 'professor',
      enable_attendance: true,
    });
  });

  it('only includes changed fields in update payloads', () => {
    const payload = updatePayloadFromPartial({
      title: 'Novo titulo',
      approved: true,
      date: new Date('2026-06-01T12:00:00.000Z'),
      dates: [new Date('2026-06-01T12:00:00.000Z')],
    });

    expect(payload).toMatchObject({
      title: 'Novo titulo',
      approved: true,
      date: '2026-06-01',
      dates: ['2026-06-01'],
    });
    expect(payload).toHaveProperty('edited_at');
    expect(payload).not.toHaveProperty('description');
  });
});
