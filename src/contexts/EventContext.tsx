import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import type { Event, Participant } from '@/data/mockData';
import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface EventContextType {
  events: Event[];
  participants: Participant[];

  addEvent: (event: Omit<Event, 'id' | 'currentParticipants' | 'status'>) => Event;
  updateEvent: (id: string, data: Partial<Event>) => void;
  toggleEventStatus: (id: string) => void;
  removeEvent: (id: string) => void;

  approveEvent: (id: string) => void;
  rejectEvent: (id: string, reason?: string) => void;
  completeEvent: (id: string) => void;

  incrementViews: (id: string) => void;

  registerParticipant: (eventId: string, name: string, email: string, role: Participant['role']) => boolean;
  unregisterParticipant: (eventId: string, email: string) => void;

  checkInParticipant: (participantId: string) => void;
  uncheckInParticipant: (participantId: string) => void;
  markAbsentParticipant: (participantId: string) => void;

  bulkPresentParticipants: (eventId: string) => void;
  bulkAbsentParticipants: (eventId: string) => void;

  isRegistered: (eventId: string, email: string) => boolean;
  getEventParticipants: (eventId: string) => Participant[];
}

const EventContext = createContext<EventContextType | undefined>(undefined);

// Tipos mínimos das rows vindas do Supabase (evita `any`)
type EventRow = Record<string, unknown>;
type ParticipantRow = Record<string, unknown>;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('timeout')), ms);
    promise
      .then((value) => {
        window.clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeout);
        reject(error);
      });
  });
}

function getStoredAccessToken(): string | null {
  try {
    const raw = window.localStorage.getItem('eventostc-auth');
    if (!raw) return null;

    const session = JSON.parse(raw) as { access_token?: string; expires_at?: number };
    if (session.expires_at && session.expires_at * 1000 <= Date.now()) return null;

    return session.access_token ?? null;
  } catch {
    return null;
  }
}

function getStoredUserId(): string | null {
  try {
    const raw = window.localStorage.getItem('eventostc-auth');
    if (!raw) return null;

    const session = JSON.parse(raw) as { user?: { id?: string } };
    return session.user?.id ?? null;
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = getStoredAccessToken();
  return {
    apikey: supabaseAnonKey,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchEventsViaRest(): Promise<EventRow[]> {
  const token = getStoredAccessToken();
  const response = await fetch(`${supabaseUrl}/rest/v1/events?select=*&order=created_at.desc`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load events: ${response.status}`);
  }

  return (await response.json()) as EventRow[];
}

async function fetchParticipantsViaRest(eventId: string): Promise<ParticipantRow[]> {
  const response = await fetch(`${supabaseUrl}/rest/v1/participants?event_id=eq.${eventId}&select=*`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load participants: ${response.status}`);
  }

  return (await response.json()) as ParticipantRow[];
}

async function insertParticipantViaRest(participant: {
  id: string;
  event_id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: Participant['role'];
  attendance: Participant['attendance'];
}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/participants`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(participant),
  });

  if (!response.ok) {
    throw new Error(`Failed to register participant: ${response.status}`);
  }
}

// ---------- helpers: mapping DB <-> app types ----------
function rowToEvent(r: EventRow): Event {
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

    dateMode: (typeof r['date_mode'] === 'string' ? (r['date_mode'] as any) : 'single'),
    dates: Array.isArray(r['dates']) ? (r['dates'] as string[]).map((d) => new Date(d)) : undefined,
    timeExceptions: Array.isArray(r['time_exceptions']) ? (r['time_exceptions'] as any[]) : undefined,

    hasMaxParticipants: typeof r['has_max_participants'] === 'boolean' ? (r['has_max_participants'] as boolean) : true,
    createdAt: typeof r['created_at'] === 'string' ? new Date(r['created_at'] as string) : undefined,
    editedAt: typeof r['edited_at'] === 'string' ? new Date(r['edited_at'] as string) : undefined,
  };
}

function rowToParticipant(r: ParticipantRow): Participant {
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

function eventToInsertPayload(e: Omit<Event, 'id' | 'currentParticipants' | 'status'> & { id: string }) {
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

function updatePayloadFromPartial(data: Partial<Event>) {
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

function getOrCreateViewerKey() {
  const key = 'eventos_tc_viewer_key';
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(key, v);
  }
  return v;
}

export function EventProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, isProfessor, loading } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadedParticipantsFor, setLoadedParticipantsFor] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    (async () => {
      let data: unknown[] | null = null;
      let error: unknown = null;

      try {
        data = await fetchEventsViaRest();
      } catch (err) {
        error = err;
      }

      if (error) {
        try {
        const result = await withTimeout(
          supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false }),
          6000,
        );

        data = result.data;
        error = result.error;
      } catch (err) {
        error = err;
      }
      }

      if (cancelled) return;

      if (error) {
        console.error('Failed to load events:', error);
        setEvents([]); // garante consistência
        return;
      }

      setEvents((data ?? []).map((row) => rowToEvent(row as EventRow)));
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user?.id, isAdmin, isProfessor]);

  const addEvent = useCallback(
    (data: Omit<Event, 'id' | 'currentParticipants' | 'status'>): Event => {
      const id = crypto.randomUUID();

      const newEvent: Event = {
        ...data,
        id,
        currentParticipants: 0,
        status: 'upcoming',
        views: 0,
        createdAt: new Date(),
        editedAt: undefined,
      };

      setEvents((prev) => [newEvent, ...prev]);

      (async () => {
        const payload: any = eventToInsertPayload({ ...newEvent, id });

        if (user?.id) {
          payload.organizer_id = user.id;
          payload.created_by_role = isAdmin ? 'admin' : (isProfessor ? 'professor' : null);

          payload.approved = isAdmin ? true : false;
          if (payload.approved) payload.rejection_reason = null;
        }

        const { error } = await supabase.from('events').insert(payload);
        if (error) {
          console.error('Failed to add event:', error);
          setEvents((prev) => prev.filter((e) => e.id !== id));
        }
      })();

      return newEvent;
    },
    [user?.id, isAdmin, isProfessor]
  );

  const updateEvent = useCallback((id: string, data: Partial<Event>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...data, editedAt: new Date() } : e)));

    (async () => {
      const payload = updatePayloadFromPartial(data);
      const { error } = await supabase.from('events').update(payload as any).eq('id', id);
      if (error) {
        console.error('Failed to update event:', error);
        const { data: fresh } = await supabase.from('events').select('*').eq('id', id).single();
        if (fresh) setEvents((prev) => prev.map((e) => (e.id === id ? rowToEvent(fresh as EventRow) : e)));
      }
    })();
  }, []);

  const toggleEventStatus = useCallback((id: string) => {
    const e = events.find((x) => x.id === id);
    if (!e) return;

    const newStatus = e.status === 'cancelled' ? 'upcoming' : 'cancelled';
    updateEvent(id, { status: newStatus });
  }, [events, updateEvent]);

  const removeEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setParticipants((prev) => prev.filter((p) => p.eventId !== id));

    (async () => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) {
        console.error('Failed to remove event:', error);
        const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
        if (data) setEvents(data.map((row) => rowToEvent(row as EventRow)));
      }
    })();
  }, []);

  const approveEvent = useCallback((id: string) => {
    updateEvent(id, { approved: true, rejectionReason: undefined });
  }, [updateEvent]);

  const rejectEvent = useCallback((id: string, reason?: string) => {
    updateEvent(id, { approved: false, rejectionReason: reason || 'Evento rejeitado pelo administrador.' });
  }, [updateEvent]);

  const completeEvent = useCallback((id: string) => {
    updateEvent(id, { status: 'completed' });

    (async () => {
      const { data: rows } = await supabase.from('participants').select('*').eq('event_id', id);
      const ps = (rows ?? []).map((row) => rowToParticipant(row as ParticipantRow));

      setParticipants((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        for (const p of ps) map.set(p.id, p);
        return Array.from(map.values()).map((p) =>
          p.eventId === id && p.attendance === 'pending' ? { ...p, attendance: 'absent' as const } : p
        );
      });

      await supabase
        .from('participants')
        .update({ attendance: 'absent' })
        .eq('event_id', id)
        .eq('attendance', 'pending');
    })();
  }, [updateEvent]);

  const incrementViews = useCallback((id: string) => {
    const viewerKey = getOrCreateViewerKey();
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, views: (e.views || 0) + 1 } : e)));

    (async () => {
      const { error } = await supabase.rpc('increment_event_view', { p_event_id: id, p_viewer_key: viewerKey });
      const { data: fresh } = await supabase.from('events').select('*').eq('id', id).single();
      if (fresh) setEvents((prev) => prev.map((e) => (e.id === id ? rowToEvent(fresh as EventRow) : e)));
      if (error) console.error('Failed to increment views:', error);
    })();
  }, []);

  const loadParticipantsForEvent = useCallback(async (eventId: string) => {
    if (loadedParticipantsFor.has(eventId)) return;

    let data: unknown[] | null = null;
    let error: unknown = null;

    try {
      data = await fetchParticipantsViaRest(eventId);
    } catch (err) {
      error = err;
    }

    if (error) {
      try {
        const result = await withTimeout(supabase.from('participants').select('*').eq('event_id', eventId), 5000);
        data = result.data;
        error = result.error;
      } catch (err) {
        error = err;
      }
    }

    if (error) {
      console.error('Failed to load participants:', error);
      return;
    }

    const ps = (data ?? []).map((row) => rowToParticipant(row as ParticipantRow));

    setParticipants((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      for (const p of ps) map.set(p.id, p);
      return Array.from(map.values());
    });

    setLoadedParticipantsFor((prev) => new Set([...prev, eventId]));
  }, [loadedParticipantsFor]);

  const registerParticipant = useCallback(
    (eventId: string, name: string, email: string, role: Participant['role']): boolean => {
      const event = events.find((e) => e.id === eventId);
      if (!event || event.registrationType === 'open') return false;

      const hasMax = event.hasMaxParticipants ?? true;
      if (hasMax && event.currentParticipants >= event.maxParticipants) return false;

      if (participants.some((p) => p.eventId === eventId && p.email.toLowerCase() === email.toLowerCase())) return false;

      const optimisticId = crypto.randomUUID();

      const newP: Participant = {
        id: optimisticId,
        name,
        email,
        eventId,
        registeredAt: new Date(),
        attendance: 'pending',
        role,
      };

      setParticipants((prev) => [...prev, newP]);
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, currentParticipants: e.currentParticipants + 1 } : e)));

      (async () => {
        const uid = getStoredUserId();

        const payload = {
          id: optimisticId,
          event_id: eventId,
          user_id: uid,
          name,
          email,
          role,
          attendance: 'pending',
        };

        let error: unknown = null;

        try {
          await insertParticipantViaRest(payload);
        } catch (err) {
          error = err;
        }

        if (error) {
          try {
            const result = await withTimeout(supabase.from('participants').insert(payload), 5000);
            error = result.error;
          } catch (err) {
            error = err;
          }
        }

        if (error) {
          console.error('Failed to register participant:', error);
          setParticipants((prev) => prev.filter((p) => p.id !== optimisticId));
          setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, currentParticipants: Math.max(0, e.currentParticipants - 1) } : e)));
        } else {
          const { data: fresh } = await supabase.from('events').select('*').eq('id', eventId).single();
          if (fresh) setEvents((prev) => prev.map((e) => (e.id === eventId ? rowToEvent(fresh as EventRow) : e)));
        }
      })();

      return true;
    },
    [events, participants]
  );

  const unregisterParticipant = useCallback((eventId: string, email: string) => {
    const toRemove = participants.find((p) => p.eventId === eventId && p.email.toLowerCase() === email.toLowerCase());
    if (!toRemove) return;

    setParticipants((prev) => prev.filter((p) => p.id !== toRemove.id));
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, currentParticipants: Math.max(0, e.currentParticipants - 1) } : e)));

    (async () => {
      const { error } = await supabase.from('participants').delete().eq('id', toRemove.id);
      if (error) {
        console.error('Failed to unregister participant:', error);
        setLoadedParticipantsFor((prev) => {
          const n = new Set(prev);
          n.delete(eventId);
          return n;
        });
        await loadParticipantsForEvent(eventId);
        const { data: fresh } = await supabase.from('events').select('*').eq('id', eventId).single();
        if (fresh) setEvents((prev) => prev.map((e) => (e.id === eventId ? rowToEvent(fresh as EventRow) : e)));
      }
    })();
  }, [participants, loadParticipantsForEvent]);

  const setAttendance = useCallback((participantId: string, attendance: Participant['attendance']) => {
    setParticipants((prev) => prev.map((p) => (p.id === participantId ? { ...p, attendance } : p)));

    (async () => {
      const { error } = await supabase.from('participants').update({ attendance }).eq('id', participantId);
      if (error) {
        console.error('Failed to update attendance:', error);
        const { data } = await supabase.from('participants').select('*').eq('id', participantId).single();
        if (data) setParticipants((prev) => prev.map((p) => (p.id === participantId ? rowToParticipant(data as ParticipantRow) : p)));
      }
    })();
  }, []);

  const checkInParticipant = useCallback((participantId: string) => setAttendance(participantId, 'present'), [setAttendance]);
  const uncheckInParticipant = useCallback((participantId: string) => setAttendance(participantId, 'pending'), [setAttendance]);
  const markAbsentParticipant = useCallback((participantId: string) => setAttendance(participantId, 'absent'), [setAttendance]);

  const bulkPresentParticipants = useCallback((eventId: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.eventId === eventId && p.attendance === 'pending' ? { ...p, attendance: 'present' as const } : p))
    );

    (async () => {
      const { error } = await supabase
        .from('participants')
        .update({ attendance: 'present' })
        .eq('event_id', eventId)
        .eq('attendance', 'pending');

      if (error) {
        console.error('Failed bulk present:', error);
        setLoadedParticipantsFor((prev) => {
          const n = new Set(prev);
          n.delete(eventId);
          return n;
        });
        await loadParticipantsForEvent(eventId);
      }
    })();
  }, [loadParticipantsForEvent]);

  const bulkAbsentParticipants = useCallback((eventId: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.eventId === eventId && p.attendance === 'pending' ? { ...p, attendance: 'absent' as const } : p))
    );

    (async () => {
      const { error } = await supabase
        .from('participants')
        .update({ attendance: 'absent' })
        .eq('event_id', eventId)
        .eq('attendance', 'pending');

      if (error) {
        console.error('Failed bulk absent:', error);
        setLoadedParticipantsFor((prev) => {
          const n = new Set(prev);
          n.delete(eventId);
          return n;
        });
        await loadParticipantsForEvent(eventId);
      }
    })();
  }, [loadParticipantsForEvent]);

  const isRegistered = useCallback(
    (eventId: string, email: string) =>
      participants.some((p) => p.eventId === eventId && p.email.toLowerCase() === email.toLowerCase()),
    [participants]
  );

  const getEventParticipants = useCallback(
    (eventId: string) => {
      void loadParticipantsForEvent(eventId);
      return participants.filter((p) => p.eventId === eventId);
    },
    [participants, loadParticipantsForEvent]
  );

  return (
    <EventContext.Provider
      value={{
        events,
        participants,
        addEvent,
        updateEvent,
        toggleEventStatus,
        removeEvent,
        approveEvent,
        rejectEvent,
        completeEvent,
        incrementViews,
        registerParticipant,
        unregisterParticipant,
        checkInParticipant,
        uncheckInParticipant,
        markAbsentParticipant,
        bulkPresentParticipants,
        bulkAbsentParticipants,
        isRegistered,
        getEventParticipants,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used within EventProvider');
  return ctx;
}
