import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { EventForm, type EventFormValues, type EventFormExtras } from '@/components/events/EventForm';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { fetchAdminNotificationRecipients } from '@/lib/notificationRepository';

const EventoNovo = () => {
  const navigate = useNavigate();
  const { user, canManageEvents, isAdmin, isProfessor } = useAuth();
  const { addEvent } = useEvents();
  const { addNotification } = useNotifications();

  const notifyAdminsAboutPendingEvent = (eventTitle: string) => {
    void (async () => {
      let recipients: string[] = [];

      try {
        recipients = await fetchAdminNotificationRecipients();
      } catch (error) {
        console.error('Failed to load admin notification recipients:', error);
      }

      const uniqueRecipients = recipients.length > 0 ? recipients : ['admin@eventostc.test'];
      uniqueRecipients.forEach((recipient) => {
        addNotification({
          userId: recipient,
          title: 'Novo evento pendente',
          message: `${user?.name} submeteu "${eventTitle}" para aprovação.`,
          type: 'event_update',
        });
      });
    })();
  };

  if (!canManageEvents) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Acesso restrito</h1>
          <p className="text-muted-foreground mb-6">Apenas administradores e professores podem criar eventos.</p>
          <Link to="/eventos"><Button>Voltar aos eventos</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = (values: EventFormValues, extras: EventFormExtras) => {
    const approved = isAdmin;
    addEvent({
      title: values.title,
      description: values.description,
      type: values.type,
      customType: values.customType,
      registrationType: values.registrationType,
      date: extras.dates[0] || values.date || new Date(),
      time: values.time,
      duration: values.duration,
      location: values.location,
      maxParticipants: values.maxParticipants || 50,
      organizerName: user?.name || 'Organizador',
      organizerEmail: user?.email,
      organizerId: user?.id,
      approved,
      createdByRole: isAdmin ? 'admin' : 'professor',
      coverImage: extras.coverImage,
      galleryImages: extras.galleryImages,
      views: 0,
      enableAttendance: extras.enableAttendance,
      dateMode: extras.dateMode,
      dates: extras.dates,
      timeExceptions: extras.timeExceptions,
      createdAt: new Date(),
    });
    if (approved) {
      toast.success('Evento criado com sucesso!', { description: `"${values.title}" foi adicionado.` });
    } else {
      toast.success('Evento enviado para aprovação!', { description: 'O administrador irá analisar o seu evento.' });
      notifyAdminsAboutPendingEvent(values.title);
    }
    navigate('/eventos');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26 }}>
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground">Criar Novo Evento</h1>
            <p className="text-muted-foreground mt-1">
              {isProfessor
                ? 'O evento será enviado para aprovação do administrador antes de ficar público.'
                : 'Preencha os detalhes para criar um novo evento escolar.'}
            </p>
          </div>
          <div className="glass-card rounded-xl p-6 md:p-8">
            <EventForm onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default EventoNovo;
