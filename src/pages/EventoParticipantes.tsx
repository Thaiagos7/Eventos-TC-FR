import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ParticipantTable } from '@/components/events/ParticipantTable';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventContext';
import { eventTypeLabels, eventTypeColors } from '@/data/mockData';
import { exportParticipantsCSV, exportParticipantsExcel, exportParticipantsPDF } from '@/lib/exportUtils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const EventoParticipantes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, canManageEvents, isAdmin, isProfessor } = useAuth();
  const { events, getEventParticipants, checkInParticipant, uncheckInParticipant, markAbsentParticipant, bulkPresentParticipants, bulkAbsentParticipants } = useEvents();

  const event = events.find((e) => e.id === id);

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

  // RBAC: admin pode sempre; professor só pode marcar presença nos eventos dele (aprovados, com enableAttendance)
  const canManageAttendance =
    event.enableAttendance &&
    (isAdmin || (isProfessor && event.organizerId === user?.id && event.approved));

  const participants = getEventParticipants(event.id);

  const handleCheckIn = (participantId: string) => {
    checkInParticipant(participantId);
    const p = participants.find((p) => p.id === participantId);
    toast.success('Presença marcada!', { description: `${p?.name} foi marcado como presente.` });
  };

  const handleUncheckIn = (participantId: string) => {
    uncheckInParticipant(participantId);
    const p = participants.find((p) => p.id === participantId);
    toast.info('Presença revertida.', { description: `${p?.name} voltou ao estado pendente.` });
  };

  const handleMarkAbsent = (participantId: string) => {
    markAbsentParticipant(participantId);
    const p = participants.find((p) => p.id === participantId);
    toast.info('Falta marcada.', { description: `${p?.name} foi marcado como ausente.` });
  };

  const handleBulkPresent = () => {
    bulkPresentParticipants(event.id);
    toast.success('Todos os pendentes foram marcados como presentes!');
  };

  const handleBulkAbsent = () => {
    bulkAbsentParticipants(event.id);
    toast.info('Todos os pendentes foram marcados como ausentes.');
  };

  const handleExportCSV = () => {
    exportParticipantsCSV(participants, event.title);
    toast.success('Lista exportada em CSV!');
  };

  const handleExportExcel = async () => {
    await exportParticipantsExcel(participants, event.title);
    toast.success('Lista exportada em Excel!');
  };

  const handleExportPDF = async () => {
    await exportParticipantsPDF(participants, event.title);
    toast.success('Lista exportada em PDF!');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26 }}>
          <Button variant="ghost" className="gap-2 mb-6" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
          </Button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={eventTypeColors[event.type]}>{eventTypeLabels[event.type]}</Badge>
                {event.enableAttendance ? (
                  <Badge variant="success">Presença ativa</Badge>
                ) : (
                  <Badge variant="secondary">Sem presença</Badge>
                )}
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground">Participantes</h1>
              <p className="text-muted-foreground mt-1">{event.title}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" /> Exportar Lista
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportCSV}>Exportar CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>Exportar Excel (.xlsx)</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>Exportar PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ParticipantTable
            participants={participants}
            onCheckIn={canManageAttendance ? handleCheckIn : undefined}
            onUncheckIn={canManageAttendance ? handleUncheckIn : undefined}
            onMarkAbsent={canManageAttendance ? handleMarkAbsent : undefined}
            onBulkPresent={canManageAttendance ? handleBulkPresent : undefined}
            onBulkAbsent={canManageAttendance ? handleBulkAbsent : undefined}
            enableAttendance={event.enableAttendance ?? false}
          />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default EventoParticipantes;
