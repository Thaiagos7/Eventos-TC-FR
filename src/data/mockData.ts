export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'theater' | 'presentation' | 'lecture' | 'fair' | 'workshop' | 'exhibition' | 'sports' | 'other';
  customType?: string;
  registrationType: 'registration' | 'open';
  date: Date;
  time: string;
  duration: number;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  coverImage?: string;
  galleryImages?: string[];
  organizerName: string;
  organizerEmail?: string;
  organizerId?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  approved: boolean;
  rejectionReason?: string;
  createdByRole?: 'admin' | 'professor';
  views?: number;
  enableAttendance?: boolean;
  dateMode?: 'single' | 'interval' | 'scattered';
  dates?: Date[];
  timeExceptions?: { date: string; time: string; duration: number }[];
  hasMaxParticipants?: boolean;
  createdAt?: Date;
  editedAt?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  avatarUrl?: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  eventId: string;
  registeredAt: Date;
  attendance: 'present' | 'absent' | 'pending';
  role: 'student' | 'teacher';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  avatarUrl?: string;
  enrolledEvents: string[];
  completedEvents: string[];
  certificates: { eventId: string; eventTitle: string; date: Date }[];
}

export const mockEvents: Event[] = [];

export const mockParticipants: Participant[] = [];

export const mockUserProfile: UserProfile = {
  id: 'u1',
  name: '',
  email: '',
  role: 'student',
  enrolledEvents: [],
  completedEvents: [],
  certificates: [],
};

export const eventTypeLabels: Record<Event['type'], string> = {
  theater: 'Teatro',
  presentation: 'Apresentação',
  lecture: 'Palestra',
  fair: 'Feira',
  workshop: 'Workshop',
  exhibition: 'Exposição',
  sports: 'Torneio Desportivo',
  other: 'Outro',
};

type EventTypeColor =
  | 'theater'
  | 'presentation'
  | 'lecture'
  | 'fair'
  | 'default'
  | 'secondary'
  | 'success'
  | 'outline';

export const eventTypeColors = {
  theater: 'theater',
  presentation: 'presentation',
  lecture: 'lecture',
  fair: 'fair',
  workshop: 'default',
  exhibition: 'secondary',
  sports: 'success',
  other: 'outline',
} satisfies Record<Event['type'], EventTypeColor>;
