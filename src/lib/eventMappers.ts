import type { Event, Participant } from '@/data/mockData';

export type EventRow = Record<string, unknown>;
export type ParticipantRow = Record<string, unknown>;

export function rowToEvent(r: EventRow): Event {
  const getStr = (k: string) => (typeof r[k] === 'string' ? (r[k] as string) : '');
  const getNum = (k: string, def = 0) => (typeof r[k] === 'number' ? (r[k] as number) : def);
  const getBool = (k: string) => !!r[k];

  const dateStr = typeof r['date'] === 'string' ? (r['date'] as string) : null;

  return {
    id: getStr('id'),
    title: getStr('title'),
    description: getStr('description'),
    type: getStr('type') as Event['type'],
    customType: (typeof r['custom_type'] === 'string' ? (r['custom_type'] as string) : undefined),
    registrationType: getStr('registration_type') as Event['registrationType'],
    date: dateStr ? new Date(dateStr) : new Date(),
    time: getStr('time'),
    duration: getNum('duration', 60),
    location: getStr('location'),
    maxParticipants: getNum('max_participants', 0),
    currentParticipants: getNum('current_participants', 0),
    coverImage: (typeof r['cover_image'] === 'string' ? (r['cover_image'] as string) : undefined),
    galleryImages: (Array.isArray(r['gallery_images']) ? (r['gallery_images'] as string[]) : undefined),
    organizerName: getStr('organizer_name'),
    organizerEmail: (typeof r['organizer_email'] === 'string' ? (r['organizer_email'] as string) : undefined),
    organizerId: (typeof r['organizer_id'] === 'string' ? (r['organizer_id'] as string) : undefined),
    status: getStr('status') as Event['status'],
    approved: getBool('approved'),
    rejectionReason: (typeof r['rejection_reason'] === 'string' ? (r['rejection_reason'] as string) : undefined),
    createdByRole: (typeof r['created_by_role'] === 'string' ? (r['created_by_role'] as string) : undefined),
    views: getNum('views', 0),
    enableAttendance: getBool('enable_attendance'),
    dateMode: (typeof r['date_mode'] === 'string' ? (r['date_mode'] as Event['dateMode']) : 'single'),
    dates: Array.isArray(r['dates']) ? (r['dates'] as string[]).map((d) => new Date(d)) : undefined,
    timeExceptions: Array.isArray(r['time_exceptions']) ? (r['time_exceptions'] as Event['timeExceptions']) : undefined,
    hasMaxParticipants: typeof r['has_max_participants'] === 'boolean' ? (r['has_max_participants'] as boolean) : true,
    createdAt: typeof r['created_at'] === 'string' ? new Date(r['created_at'] as string) : undefined,
    editedAt: typeof r['edited_at'] === 'string' ? new Date(r['edited_at'] as string) : undefined,
  };
}

export function rowToParticipant(r: ParticipantRow): Participant {
  const getStr = (k: string) => (typeof r[k] === 'string' ? (r[k] as string) : '');
  const dateStr = typeof r['registered_at'] === 'string' ? (r['registered_at'] as string) : null;

  return {
    id: getStr('id'),
    name: getStr('name'),
    email: getStr('email'),
    eventId: getStr('event_id'),
    registeredAt: dateStr ? new Date(dateStr) : new Date(),
    attendance: getStr('attendance') as Participant['attendance'],
    role: getStr('role') as Participant['role'],
  };
}

export function eventToInsertPayload(e: Omit<Event, 'id' | 'currentParticipants' | 'status'> & { id: string }) {
  const dateISO = e.date ? new Date(e.date).toISOString().slice(0, 10) : null;
  const datesISO = Array.isArray(e.dates) ? e.dates.map((d) => new Date(d).toISOString().slice(0, 10)) : null;

  return {
    id: e.id,
    title: e.title,
    description: e.description,
    type: e.type,
    custom_type: e.customType ?? null,
    registration_type: e.registrationType,
    date: dateISO,
    time: e.time,
    duration: e.duration,
    date_mode: e.dateMode ?? 'single',
    start_date: null,
    end_date: null,
    dates: e.dateMode === 'scattered' ? datesISO : null,
    time_exceptions: e.timeExceptions ?? null,
    location: e.location,
    has_max_participants: e.hasMaxParticipants ?? true,
    max_participants: e.maxParticipants,
    cover_image: e.coverImage ?? null,
    gallery_images: e.galleryImages ?? null,
    organizer_name: e.organizerName,
    organizer_email: e.organizerEmail ?? null,
    organizer_id: e.organizerId ?? null,
    status: e.status ?? 'upcoming',
    approved: e.approved ?? false,
    rejection_reason: e.rejectionReason ?? null,
    created_by_role: e.createdByRole ?? null,
    enable_attendance: e.enableAttendance ?? false,
    edited_at: null,
  };
}

export function updatePayloadFromPartial(data: Partial<Event>) {
  const payload: Record<string, unknown> = {};

  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.type !== undefined) payload.type = data.type;
  if (data.customType !== undefined) payload.custom_type = data.customType ?? null;
  if (data.registrationType !== undefined) payload.registration_type = data.registrationType;
  if (data.date !== undefined) payload.date = data.date ? new Date(data.date).toISOString().slice(0, 10) : null;
  if (data.time !== undefined) payload.time = data.time;
  if (data.duration !== undefined) payload.duration = data.duration;
  if (data.location !== undefined) payload.location = data.location;
  if (data.hasMaxParticipants !== undefined) payload.has_max_participants = data.hasMaxParticipants;
  if (data.maxParticipants !== undefined) payload.max_participants = data.maxParticipants;
  if (data.coverImage !== undefined) payload.cover_image = data.coverImage ?? null;
  if (data.galleryImages !== undefined) payload.gallery_images = data.galleryImages ?? null;
  if (data.organizerName !== undefined) payload.organizer_name = data.organizerName;
  if (data.organizerEmail !== undefined) payload.organizer_email = data.organizerEmail ?? null;
  if (data.organizerId !== undefined) payload.organizer_id = data.organizerId ?? null;
  if (data.status !== undefined) payload.status = data.status;
  if (data.approved !== undefined) payload.approved = data.approved;
  if (data.rejectionReason !== undefined) payload.rejection_reason = data.rejectionReason ?? null;
  if (data.createdByRole !== undefined) payload.created_by_role = data.createdByRole ?? null;
  if (data.enableAttendance !== undefined) payload.enable_attendance = data.enableAttendance ?? false;
  if (data.dateMode !== undefined) payload.date_mode = data.dateMode;
  if (data.dates !== undefined) payload.dates = Array.isArray(data.dates) ? data.dates.map((d) => new Date(d).toISOString().slice(0, 10)) : null;
  if (data.timeExceptions !== undefined) payload.time_exceptions = data.timeExceptions ?? null;

  payload.edited_at = new Date().toISOString();

  return payload;
}
