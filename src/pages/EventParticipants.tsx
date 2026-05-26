import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ParticipantTable } from '@/components/events/ParticipantTable';
import { mockEvents, mockParticipants, eventTypeLabels, eventTypeColors } from '@/data/mockData';
import { useState } from 'react';

const EventParticipants = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const event = mockEvents.find((e) => e.id === id);
  const [participants, setParticipants] = useState(
    mockParticipants.filter((p) => p.eventId === id)
  );

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            Evento não encontrado
          </h1>
          <Link to="/dashboard">
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleCheckIn = (participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId ? { ...p, attendance: 'present' as const } : p
      )
    );
    const participant = participants.find((p) => p.id === participantId);
    toast.success('Check-in realizado!', {
      description: `${participant?.name} foi marcado como presente.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26 }}
        >
          <Button
            variant="ghost"
            className="gap-2 mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={eventTypeColors[event.type]}>
                  {eventTypeLabels[event.type]}
                </Badge>
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Participantes
              </h1>
              <p className="text-muted-foreground mt-1">{event.title}</p>
            </div>
          </div>

          <ParticipantTable
            participants={participants}
            onCheckIn={handleCheckIn}
          />
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default EventParticipants;
