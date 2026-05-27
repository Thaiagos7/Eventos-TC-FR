import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import type { Event, Participant } from '@/data/mockData';
import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  eventToInsertPayload,
  rowToEvent,
  rowToParticipant,
  updatePayloadFromPartial,
  type EventRow,
  type ParticipantRow,
} from '@/lib/eventMappers';

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
type EventInsertPayload = ReturnType<typeof eventToInsertPayload>;

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
        const payload: EventInsertPayload = eventToInsertPayload({ ...newEvent, id });

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
      const { error } = await supabase.from('events').update(payload).eq('id', id);
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
