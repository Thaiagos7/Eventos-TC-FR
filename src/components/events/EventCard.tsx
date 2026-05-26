import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event, eventTypeLabels, eventTypeColors } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  index?: number;
}

export function EventCard({ event, index = 0 }: EventCardProps) {
  const spotsLeft = event.maxParticipants - event.currentParticipants;
  const isAlmostFull = spotsLeft <= 10;
  const isFull = spotsLeft === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.03 }}
      className="group glass-card flex h-full flex-col rounded-[1.9rem] p-4 card-hover"
    >
      <div className="mb-4 rounded-[1.5rem] border border-foreground/10 bg-[hsl(var(--paper-strong))] p-4 poster-grid-bg">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant={eventTypeColors[event.type]}>{eventTypeLabels[event.type]}</Badge>
          {isFull && <Badge variant="destructive">Esgotado</Badge>}
          {isAlmostFull && !isFull && <Badge variant="secondary">Últimas vagas</Badge>}
        </div>

        {event.coverImage ? (
          <div className="paper-frame mx-auto w-[92%] rotate-[-2deg]">
            <img src={event.coverImage} alt="" className="h-40 w-full" />
          </div>
        ) : (
          <div className="flex min-h-[10rem] items-center justify-center rounded-[1.3rem] border border-foreground/10 bg-[hsl(var(--paper-strong))] p-5 text-center">
            <h3 className="editorial-title text-3xl text-foreground">{event.title}</h3>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-1 pb-1">
        <h3 className="font-display text-2xl font-black tracking-[-0.04em] text-foreground line-clamp-2 text-safe">
          {event.title}
        </h3>

        <p className="text-sm leading-6 text-muted-foreground line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2.5 rounded-[1.3rem] border border-foreground/10 bg-[hsl(var(--paper-strong))] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="capitalize">{format(event.date, "EEEE, d 'de' MMMM", { locale: pt })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>{event.time} · {event.duration} min</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{event.location}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{event.currentParticipants} / {event.maxParticipants} inscritos</span>
              </div>
              <span
                className={cn(
                  'font-semibold uppercase tracking-[0.08em]',
                  isFull ? 'text-destructive' : isAlmostFull ? 'text-secondary-foreground' : 'text-success',
                )}
              >
                {isFull ? 'Esgotado' : `${spotsLeft} vagas`}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-foreground/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(event.currentParticipants / event.maxParticipants) * 100}%` }}
                transition={{ duration: 0.34, delay: index * 0.03 + 0.08 }}
                className={cn(
                  'h-full rounded-full transition-colors',
                  isFull ? 'bg-destructive' : isAlmostFull ? 'bg-secondary' : 'bg-success',
                )}
              />
            </div>
          </div>
        </div>

        <Button className="w-full group/btn" variant={isFull ? 'outline' : 'default'} disabled={isFull}>
          {isFull ? 'Lista de espera' : 'Inscrever-me'}
          <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover/btn:translate-x-1" />
        </Button>
      </div>
    </motion.article>
  );
}
