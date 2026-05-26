import { motion } from 'framer-motion';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { EventForm, type EventFormValues, type EventFormExtras } from '@/components/events/EventForm';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventContext';
import { useNotifications } from '@/contexts/NotificationContext';

type EditLocationState = {
  from?: string;
};

const EventoEditar = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isProfessor, canManageEvents } = useAuth();
  const { events, updateEvent, getEventParticipants } = useEvents();
  const { addNotification } = useNotifications();

  const returnTo = (location.state as EditLocationState | null)?.from || '/dashboard';
  const event = events.find((e) => e.id === id);

  const canEdit =
    isAdmin ||
    (isProfessor && event?.organizerId === user?.id);

  if (!canManageEvents) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Acesso restrito</h1>
          <Link to="/eventos"><Button>Voltar aos eventos</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Evento não encontrado</h1>
          <Link to="/eventos"><Button>Voltar aos eventos</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Sem permissão</h1>
          <p className="text-muted-foreground mb-6">
            Apenas pode editar eventos que criou.
          </p>
          <Button onClick={() => navigate(returnTo)}>Voltar</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = (values: EventFormValues, extras: EventFormExtras) => {
    updateEvent(event.id, {
      ...values,
      date: extras.dates[0] || values.date || event.date,
      maxParticipants: values.maxParticipants || event.maxParticipants,
      coverImage: extras.coverImage,
      galleryImages: extras.galleryImages,
      enableAttendance: extras.enableAttendance,
      dateMode: extras.dateMode,
      dates: extras.dates,
      timeExceptions: extras.timeExceptions,
      editedAt: new Date(),
    });
    toast.success('Evento atualizado!', { description: `"${values.title}" foi atualizado com sucesso.` });

    const participants = getEventParticipants(event.id);
    participants.forEach((p) => {
      addNotification({
        userId: p.email,
        title: 'Evento alterado',
        message: `O evento "${values.title}" foi atualizado.`,
        type: 'event_update',
        eventId: event.id,
      });
    });

    navigate(returnTo, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26 }}>
          <Button variant="ghost" className="gap-2 mb-6" onClick={() => navigate(returnTo, { replace: true })}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Editar Evento</h1>
            <p className="text-muted-foreground mt-1">Atualize os detalhes de "{event.title}".</p>
          </div>
          <div className="glass-card rounded-xl p-6 md:p-8">
            <EventForm
              defaultValues={{
                title: event.title, description: event.description, type: event.type, customType: event.customType,
                registrationType: event.registrationType || 'registration',
                date: event.date, time: event.time, duration: event.duration,
                location: event.location, maxParticipants: event.maxParticipants,
              }}
              defaultCoverImage={event.coverImage}
              defaultGalleryImages={event.galleryImages}
              defaultEnableAttendance={event.enableAttendance}
              defaultDateMode={event.dateMode}
              defaultDates={event.dates}
              defaultTimeExceptions={event.timeExceptions}
              onSubmit={handleSubmit}
              onCancel={() => navigate(returnTo, { replace: true })}
              isEditing
            />
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default EventoEditar;
