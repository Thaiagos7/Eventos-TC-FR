import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { Plus, Search, Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EventFilters } from '@/components/events/EventFilters';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventContext';
import { eventTypeLabels, eventTypeColors, type Event } from '@/data/mockData';
import { cn } from '@/lib/utils';

const pageTransition = { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const };

const Eventos = () => {
  const { user, canManageEvents, isAdmin } = useAuth();
  const { events } = useEvents();
  const navigate = useNavigate();

  const [selectedTypes, setSelectedTypes] = useState<Event['type'][]>([]);
  const [selectedDate, setSelectedDate] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [search, setSearch] = useState('');
  const [showOpen, setShowOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        if (!event.approved) return false;
        if (selectedTypes.length > 0 && !selectedTypes.includes(event.type)) return false;
        if (selectedDate === 'today' && !isToday(event.date)) return false;
        if (selectedDate === 'week' && !isThisWeek(event.date)) return false;
        if (selectedDate === 'month' && !isThisMonth(event.date)) return false;
        if (showOpen) {
          if (event.status === 'cancelled' || event.status === 'completed') return false;
          if (event.registrationType === 'registration' && event.currentParticipants >= event.maxParticipants) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          if (!event.title.toLowerCase().includes(q) && !event.description.toLowerCase().includes(q) && !event.location.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, selectedTypes, selectedDate, search, showOpen]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 md:py-10">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={pageTransition}
          className="glass-panel rounded-[2.2rem] px-6 py-6 md:px-8 md:py-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="editorial-title text-[clamp(2.9rem,7vw,4.8rem)] text-foreground">Eventos</h1>
            </div>

            {canManageEvents && (
              <Button size="lg" className="gap-2 self-start lg:self-auto" onClick={() => navigate('/eventos/novo')}>
                <Plus className="h-5 w-5" />
                Criar Evento
              </Button>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar eventos..."
                className="pl-11"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant={showOpen ? 'default' : 'outline'} onClick={() => setShowOpen(!showOpen)}>
              Apenas abertos
            </Button>
          </div>
        </motion.section>

        <div className="mt-6">
          <EventFilters
            selectedTypes={selectedTypes}
            onTypeChange={setSelectedTypes}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event, index) => {
            const isOpen = event.registrationType === 'open';
            const spotsLeft = isOpen ? Infinity : event.maxParticipants - event.currentParticipants;
            const isFull = !isOpen && spotsLeft <= 0;
            const isAlmostFull = !isOpen && spotsLeft <= 10 && !isFull;
            const isCancelled = event.status === 'cancelled';
            const isCompleted = event.status === 'completed';

            return (
              <motion.article
                key={event.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: index * 0.03 }}
                className={cn('group glass-card flex h-full flex-col rounded-[1.9rem] p-4 card-hover', (isCancelled || isCompleted) && 'opacity-70')}
              >
                <div className="mb-4 rounded-[1.5rem] border border-foreground/10 bg-[hsl(var(--paper-strong)/0.55)] p-4 poster-grid-bg">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge
                      variant={eventTypeColors[event.type]}
                      className="text-slate-950 dark:text-slate-950"
                    >
                      {event.type === 'other' && event.customType ? event.customType : eventTypeLabels[event.type]}
                    </Badge>
                    {isCompleted ? (
                      <Badge variant="secondary">Concluído</Badge>
                    ) : isCancelled ? (
                      <Badge variant="destructive">Encerrado</Badge>
                    ) : isFull ? (
                      <Badge variant="destructive">Esgotado</Badge>
                    ) : (
                      <Badge variant="success">Aberto</Badge>
                    )}

                    {isAlmostFull && !isFull && !isCancelled && !isCompleted && (
                      <Badge variant="secondary">Últimas vagas</Badge>
                    )}
                  </div>

                  {event.coverImage ? (
                    <div className="paper-frame mx-auto w-[92%] rotate-[-2.5deg]">
                      <img src={event.coverImage} alt="" className="h-40 w-full" />
                    </div>
                  ) : (
                    <div className="flex min-h-[10.5rem] items-center justify-center rounded-[1.3rem] border border-foreground/10 bg-[hsl(var(--paper-strong)/0.72)] p-5 text-center">
                      <h3 className="editorial-title text-3xl text-foreground">{event.title}</h3>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3 px-1 pb-1">
                  <h3 className="font-display text-2xl font-black tracking-[-0.04em] text-foreground line-clamp-2 text-safe">
                    {event.title}
                  </h3>
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{event.description}</p>

                  <div className="space-y-2.5 rounded-[1.35rem] border border-foreground/10 bg-[hsl(var(--paper-strong)/0.55)] p-4 text-sm shadow-sm">
                    <div className="flex items-center gap-2 text-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="capitalize text-safe">
                        {event.dates && event.dates.length > 1
                          ? `${format(event.dates[0], 'd MMM', { locale: pt })} - ${format(event.dates[event.dates.length - 1], 'd MMM yyyy', { locale: pt })} (${event.dates.length} datas)`
                          : format(event.date, 'd MMM yyyy', { locale: pt })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{event.time} · {event.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-safe">{event.location}</span>
                    </div>
                    {!isOpen && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{event.currentParticipants}/{event.maxParticipants} inscritos</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-center">
                    {!isOpen && (
                      <div className="mt-1">
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          <span>Ocupação</span>
                          <span>{Math.min(100, Math.round((event.currentParticipants / event.maxParticipants) * 100))}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-foreground/10">
                          <div
                            className={cn('h-full rounded-full transition-all duration-200', isFull ? 'bg-destructive' : isAlmostFull ? 'bg-secondary' : 'bg-primary')}
                            style={{ width: `${Math.min(100, (event.currentParticipants / event.maxParticipants) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3">
                    <div className="flex flex-col gap-2 border-t border-foreground/10 pt-3 sm:flex-row">
                      <Button
                        className="w-full flex-1 group/btn"
                        size="sm"
                        onClick={() => navigate(`/eventos/${event.id}`)}
                      >
                        Ver detalhes do evento
                        <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover/btn:translate-x-1" />
                      </Button>
                      {(isAdmin || (canManageEvents && event.organizerId === user?.id)) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => navigate(`/eventos/${event.id}/editar`, { state: { from: '/eventos' } })}
                        >
                          Editar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="py-16 text-center">
            <div className="glass-card mx-auto max-w-xl rounded-[1.8rem] p-8">
              <p className="text-lg text-muted-foreground">Nenhum evento encontrado com os filtros selecionados.</p>
            </div>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Eventos;
