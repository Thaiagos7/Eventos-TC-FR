import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShieldCheck, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { eventTypeLabels, eventTypeColors } from '@/data/mockData';
import { toast } from 'sonner';

const EventosPendentes = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { events, approveEvent, rejectEvent } = useEvents();
  const { addNotification } = useNotifications();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingEvent, setRejectingEvent] = useState<{ id: string; title: string; organizerEmail?: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Acesso restrito</h1>
          <p className="text-muted-foreground mb-6">Apenas administradores podem gerir aprovações.</p>
          <Link to="/eventos"><Button>Ver eventos</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const pendingEvents = events.filter((e) => !e.approved && !e.rejectionReason);
  const rejectedEvents = events.filter((e) => !e.approved && e.rejectionReason);

  const handleApprove = (id: string, title: string, organizerEmail?: string) => {
    approveEvent(id);
    toast.success(`"${title}" aprovado!`);
    if (organizerEmail) {
      addNotification({
        userId: organizerEmail,
        title: 'Evento aprovado! ✅',
        message: `O seu evento "${title}" foi aprovado e já está público.`,
        type: 'approval',
        eventId: id,
      });
    }
  };

  const openRejectDialog = (id: string, title: string, organizerEmail?: string) => {
    setRejectingEvent({ id, title, organizerEmail });
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (!rejectingEvent) return;
    const reason = rejectionReason.trim() || 'Evento rejeitado pelo administrador.';
    rejectEvent(rejectingEvent.id, reason);
    toast.info(`"${rejectingEvent.title}" rejeitado.`);
    if (rejectingEvent.organizerEmail) {
      addNotification({
        userId: rejectingEvent.organizerEmail,
        title: 'Evento rejeitado ❌',
        message: `O seu evento "${rejectingEvent.title}" foi rejeitado. Motivo: ${reason}`,
        type: 'rejection',
        eventId: rejectingEvent.id,
      });
    }
    setRejectDialogOpen(false);
    setRejectingEvent(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-amber-500" />
                Eventos Pendentes
              </h1>
              <p className="text-muted-foreground mt-1">Aprovar ou rejeitar eventos submetidos por professores</p>
            </div>
            <Link to="/dashboard"><Button variant="outline">Voltar ao Dashboard</Button></Link>
          </div>

          {pendingEvents.length === 0 && rejectedEvents.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">Sem eventos pendentes</p>
              <p className="text-muted-foreground">Todos os eventos foram revistos.</p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-1">
              {pendingEvents.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground mb-4">
                    Pendentes ({pendingEvents.length})
                  </h2>
                  <div className="space-y-3">
                    {pendingEvents.map((event) => (
                      <div key={event.id} className="glass-card rounded-xl p-5 border-l-4 border-l-amber-500">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-foreground text-lg">{event.title}</h3>
                              <Badge variant={eventTypeColors[event.type]}>
                                {event.type === 'other' && event.customType ? event.customType : eventTypeLabels[event.type]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{event.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.organizerName} · {format(event.date, "d MMM yyyy", { locale: pt })} · {event.time} · {event.location}
                            </p>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                              {event.createdAt && (
                                <span>Criado em: {format(event.createdAt, "d MMM yyyy, HH:mm", { locale: pt })}</span>
                              )}
                              {event.editedAt && (
                                <span className="text-primary">Editado em: {format(event.editedAt, "d MMM yyyy, HH:mm", { locale: pt })}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/eventos/${event.id}`)}>
                              <Eye className="h-4 w-4 mr-1" /> Ver
                            </Button>
                            <Button size="sm" onClick={() => handleApprove(event.id, event.title, event.organizerEmail)}>
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => openRejectDialog(event.id, event.title, event.organizerEmail)}>
                              <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rejectedEvents.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground mb-4">
                    Rejeitados ({rejectedEvents.length})
                  </h2>
                  <div className="space-y-3">
                    {rejectedEvents.map((event) => (
                      <div key={event.id} className="glass-card rounded-xl p-5 border-l-4 border-l-destructive opacity-70">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">{event.title}</h3>
                            <p className="text-sm text-destructive mt-1">Motivo: {event.rejectionReason}</p>
                            <p className="text-sm text-muted-foreground mt-1">{event.organizerName}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleApprove(event.id, event.title, event.organizerEmail)}>
                            Aprovar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escreva o motivo da rejeição de "{rejectingEvent?.title}". O professor será notificado.
            </p>
            <Textarea placeholder="Motivo da rejeição..." value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)} className="min-h-[100px]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject}>Rejeitar Evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventosPendentes;
