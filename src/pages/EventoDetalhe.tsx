import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, ChevronLeft, ChevronRight, Award, CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventDetailCard } from '@/components/events/EventDetailCard';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { generateCertificatePDF, generateCertificatesBulk } from '@/lib/exportUtils';

const EventoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, canManageEvents, isAdmin, isProfessor } = useAuth();
  const { events, updateEvent, registerParticipant, unregisterParticipant, isRegistered, toggleEventStatus, completeEvent, getEventParticipants, incrementViews, approveEvent } = useEvents();
  const { addNotification } = useNotifications();
  const [galleryIndex, setGalleryIndex] = useState(0);

  const event = events.find((e) => e.id === id);

  useEffect(() => {
    if (id) incrementViews(id);
  }, [id]);

  useEffect(() => {
    if (id) getEventParticipants(id);
  }, [id, getEventParticipants]);

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Evento não encontrado</h1>
          <Link to="/eventos"><Button>Voltar à lista de eventos</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const userIsRegistered = user ? isRegistered(event.id, user.email) : false;
  const eventParticipants = getEventParticipants(event.id);
  const gallery = event.galleryImages || [];
  const isOpenEvent = event.registrationType === 'open';
  const isCompleted = event.status === 'completed';

  const handleRegister = () => {
    if (!user) { toast.error('Precisa de fazer login para se inscrever.'); navigate('/login'); return; }
    if (userIsRegistered) {
      unregisterParticipant(event.id, user.email);
      toast.info('Inscrição cancelada.');
    } else {
      const role = user.role === 'professor' ? 'teacher' : 'student';
      const ok = registerParticipant(event.id, user.name, user.email, role);
      if (ok) {
        toast.success('Inscrição realizada!');
        addNotification({
          userId: user.email,
          title: 'Inscrição confirmada ✅',
          message: `A sua inscrição no evento "${event.title}" foi confirmada.`,
          type: 'registration',
          eventId: event.id,
        });
      } else {
        toast.error('Não foi possível inscrever.', { description: 'O evento pode estar esgotado.' });
      }
    }
  };

  const handleToggleStatus = () => {
    toggleEventStatus(event.id);
    const action = event.status === 'cancelled' ? 'reaberto' : 'encerrado';
    toast.success(`Evento ${action}.`);
    if (action === 'encerrado') {
      eventParticipants.forEach((p) => {
        addNotification({
          userId: p.email,
          title: 'Evento cancelado',
          message: `O evento "${event.title}" foi cancelado.`,
          type: 'event_cancel',
          eventId: event.id,
        });
      });
    }
  };

  const handleComplete = () => {
    completeEvent(event.id);
    toast.success('Evento marcado como concluído!');
  };

  const handleGenerateCertificate = (participantName: string) => {
    generateCertificatePDF(participantName, event.title, event.date);
    toast.success('Certificado gerado!');
  };

  const handleBulkCertificates = () => {
    generateCertificatesBulk(eventParticipants, event.title, event.date);
    toast.success('Certificados em massa gerados!', { description: `${eventParticipants.filter(p => p.attendance === 'present').length} certificados.` });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {event.coverImage && (
        <div className="container pt-6">
          <div className="paper-frame mx-auto max-w-5xl rotate-[-1deg]">
            <img src={event.coverImage} alt="" className="h-[18rem] w-full object-cover md:h-[24rem]" />
          </div>
        </div>
      )}

      <main className="flex-1 container max-w-4xl py-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26 }}>
          <Button variant="outline" className="mb-6 gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>

          {!event.approved && event.rejectionReason && (
            <div className="mb-4 rounded-[1.25rem] border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              ❌ Este evento foi rejeitado. Motivo: {event.rejectionReason}
            </div>
          )}

          {!event.approved && !event.rejectionReason && (
            <div className="mb-4 rounded-[1.25rem] border border-secondary/20 bg-secondary/10 p-4 text-sm text-foreground">
              ⏳ Este evento está pendente de aprovação pelo administrador.
            </div>
          )}

          {isOpenEvent && (
            <div className="mb-4 rounded-[1.25rem] border border-primary/20 bg-primary/10 p-4 text-sm text-foreground">
              🎉 Este é um evento aberto — não é necessária inscrição.
            </div>
          )}

          <EventDetailCard
            event={event}
            onRegister={event.approved && !isOpenEvent ? handleRegister : undefined}
            onEdit={
              isAdmin
                ? () => navigate(`/eventos/${event.id}/editar`)
                : (isProfessor && event.organizerId === user?.id)
                  ? () => navigate(`/eventos/${event.id}/editar`)
                  : undefined
            }
            onCancel={
              isAdmin || (isProfessor && event.organizerId === user?.id)
                ? handleToggleStatus
                : undefined
            }
            onApprove={
              isAdmin && !event.approved && !event.rejectionReason
                ? () => {
                    approveEvent(event.id);
                    toast.success(`"${event.title}" aprovado!`);
                    if (event.organizerEmail) {
                      addNotification({
                        userId: event.organizerEmail,
                        title: 'Evento aprovado! ✅',
                        message: `O seu evento "${event.title}" foi aprovado e já está público.`,
                        type: 'approval',
                        eventId: event.id,
                      });
                    }
                  }
                : undefined
            }
            isRegistered={userIsRegistered}
          />

          {/* Complete event + Certificates */}
          {(isAdmin || (isProfessor && event.organizerId === user?.id)) && event.approved && event.status === 'upcoming' && (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="gap-2" onClick={handleComplete}>
                <CheckCircle2 className="h-4 w-4" /> Marcar como Concluído
              </Button>
            </div>
          )}

          {(isAdmin || (isProfessor && event.organizerId === user?.id)) && event.status === 'completed' && (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => {
                toggleEventStatus(event.id);
                // revert completed → upcoming
                updateEvent(event.id, { status: 'upcoming' });
                toast.info('Evento revertido para "Próximo".');
              }}>
                <RotateCcw className="h-4 w-4" /> Reverter Conclusão
              </Button>
            </div>
          )}

          {isCompleted && !isOpenEvent && canManageEvents && (
            <div className="mt-4 glass-card rounded-[1.6rem] p-5">
              <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-3">
                <Award className="h-5 w-5 text-primary" /> Certificados
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Gere certificados para os {eventParticipants.filter(p => p.attendance === 'present').length} participantes presentes.
              </p>
              <Button className="gap-2" onClick={handleBulkCertificates}>
                <Award className="h-4 w-4" /> Gerar Certificados em Massa
              </Button>
            </div>
          )}

          {/* Gallery Carousel */}
          {gallery.length > 0 && (
            <div className="mt-8 glass-card rounded-[1.8rem] p-6">
              <h2 className="font-display text-xl font-bold text-foreground mb-4">Galeria</h2>
              <div className="relative">
                <div className="overflow-hidden rounded-lg aspect-video">
                  <img src={gallery[galleryIndex]} alt={`Foto ${galleryIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300" />
                </div>
                {gallery.length > 1 && (
                  <>
                    <Button variant="secondary" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                      onClick={() => setGalleryIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
                      onClick={() => setGalleryIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              {gallery.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {gallery.map((_, i) => (
                    <button key={i} onClick={() => setGalleryIndex(i)}
                      className={`h-2 w-2 rounded-full transition-colors ${i === galleryIndex ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Participants section */}
          {!isOpenEvent && (
            <div className="mt-8 glass-card rounded-[1.8rem] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Inscritos
                </h2>
                {canManageEvents && (
                  <Link to={`/eventos/${event.id}/participantes`}>
                    <Button variant="outline" size="sm">Ver lista completa</Button>
                  </Link>
                )}
              </div>
              {canManageEvents ? (
                eventParticipants.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum inscrito ainda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left py-2 px-4 font-medium text-muted-foreground">Nome</th>
                          <th className="text-left py-2 px-4 font-medium text-muted-foreground">Email</th>
                          {isCompleted && <th className="text-right py-2 px-4 font-medium text-muted-foreground">Certificado</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {eventParticipants.slice(0, 5).map((p) => (
                          <tr key={p.id}>
                            <td className="py-2 px-4 text-foreground">{p.name}</td>
                            <td className="py-2 px-4 text-muted-foreground">{p.email}</td>
                            {isCompleted && (
                              <td className="py-2 px-4 text-right">
                                {p.attendance === 'present' && (
                                  <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleGenerateCertificate(p.name)}>
                                    <Award className="h-3.5 w-3.5" /> PDF
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {eventParticipants.length > 5 && (
                      <p className="text-sm text-muted-foreground mt-2">e mais {eventParticipants.length - 5} inscritos...</p>
                    )}
                  </div>
                )
              ) : (
                <p className="text-muted-foreground">
                  {eventParticipants.length} {eventParticipants.length === 1 ? 'inscrito' : 'inscritos'} neste evento.
                </p>
              )}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default EventoDetalhe;
