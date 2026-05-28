import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Users, User, Timer, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { eventTypeLabels, eventTypeColors } from '@/data/mockData';
import type { Event } from '@/data/mockData';
import { buildEventOccurrences, dateFromDateKey } from '@/lib/eventSchedule';

interface EventDetailCardProps {
  event: Event;
  onRegister?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onApprove?: () => void;
  onComplete?: () => void;
  isRegistered?: boolean;
}

export function EventDetailCard({ event, onRegister, onEdit, onCancel, onApprove, onComplete, isRegistered }: EventDetailCardProps) {
  const isFull = event.registrationType !== 'open' && event.currentParticipants >= event.maxParticipants;
  const occupancyPercent = event.registrationType !== 'open' ? Math.round((event.currentParticipants / event.maxParticipants) * 100) : 0;

  const statusLabel: Record<Event['status'], string> = {
    upcoming: 'Próximo',
    ongoing: 'A Decorrer',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };

  const occurrences = buildEventOccurrences({
    dates: event.dates as Array<Date | string> | undefined,
    fallbackDate: event.date,
    defaultTime: event.time,
    defaultDuration: event.duration,
    exceptions: event.timeExceptions || [],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={eventTypeColors[event.type]}>
              {event.type === 'other' && event.customType ? event.customType : eventTypeLabels[event.type]}
            </Badge>
            <Badge variant={event.status === 'upcoming' ? 'success' : event.status === 'cancelled' ? 'destructive' : 'secondary'}>
              {statusLabel[event.status]}
            </Badge>
          </div>
          <h1 className="editorial-title text-[clamp(2.4rem,7vw,4.8rem)] text-foreground text-safe">
            {event.title}
          </h1>
        </div>
        {(onEdit || onCancel || onApprove || onComplete) && (
          <div className="flex flex-wrap gap-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>Editar</Button>
            )}
            {onComplete && event.approved && event.status === 'upcoming' && (
              <Button variant="success" className="gap-2" onClick={onComplete}>
                <CheckCircle2 className="h-4 w-4" /> Marcar como Concluído
              </Button>
            )}
            {onApprove && (
              <Button className="gap-2" onClick={onApprove}>
                <CheckCircle2 className="h-4 w-4" /> Aprovar Evento
              </Button>
            )}
            {onCancel && event.approved && (
              <Button variant={event.status === 'cancelled' ? 'default' : 'destructive'} onClick={onCancel}>
                {event.status === 'cancelled' ? 'Reabrir Evento' : 'Cancelar Evento'}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="glass-card rounded-[1.8rem] p-6 md:p-8">
        <h2 className="font-display text-xl font-black uppercase tracking-[-0.03em] text-foreground mb-3">Sobre o Evento</h2>
        <p className="text-muted-foreground leading-7 whitespace-pre-wrap text-safe">{event.description}</p>
      </div>

      <div className="glass-panel rounded-[1.8rem] p-6 md:p-8">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-black uppercase tracking-[-0.03em] text-foreground">
          <Calendar className="h-5 w-5 text-primary" /> Datas e Horários
        </h2>
        {occurrences.length === 1 ? (
          <div className="space-y-2">
            <p className="font-semibold text-foreground">
              {format(dateFromDateKey(occurrences[0].dateKey), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" /> {occurrences[0].time} · {occurrences[0].duration} min
            </p>
            {occurrences[0].hasException && (
              <Badge variant="secondary" className="text-[10px]">Exceção</Badge>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            <p className="mb-3 text-sm text-muted-foreground">
              Horário padrão: {event.time} · {event.duration} min
            </p>
            {occurrences.map((occurrence) => (
              <div key={occurrence.dateKey} className="glass-muted flex items-center gap-3 rounded-[1.25rem] p-3">
                <Badge variant="outline" className="shrink-0">
                  {format(dateFromDateKey(occurrence.dateKey), 'd MMM', { locale: pt })}
                </Badge>
                <span className="text-sm text-foreground">
                  {occurrence.hasException ? (
                    <span className="font-medium text-primary">{occurrence.time} · {occurrence.duration} min</span>
                  ) : (
                    <span>{occurrence.time} · {occurrence.duration} min</span>
                  )}
                </span>
                {occurrence.hasException && (
                  <Badge variant="secondary" className="text-[10px]">Exceção</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass-card rounded-[1.6rem] p-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-primary/10 text-primary">
            <Timer className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Duração (padrão)</p>
            <p className="mt-1 font-semibold text-foreground">{event.duration} minutos</p>
          </div>
        </div>

        <div className="glass-card rounded-[1.6rem] p-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-primary/10 text-primary">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Local</p>
            <p className="mt-1 font-semibold text-foreground text-safe">{event.location}</p>
          </div>
        </div>

        <div className="glass-card rounded-[1.6rem] p-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Organizador</p>
            <p className="mt-1 font-semibold text-foreground">{event.organizerName}</p>
          </div>
        </div>

        {event.registrationType !== 'open' && (
          <div className="glass-card rounded-[1.6rem] p-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Vagas</p>
              <p className="mt-1 font-semibold text-foreground">
                {event.currentParticipants} / {event.maxParticipants}
              </p>
            </div>
          </div>
        )}
      </div>

      {event.registrationType !== 'open' && (
        <div className="glass-card rounded-[1.8rem] p-6 md:p-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ocupação</span>
            <span className="text-sm text-muted-foreground">{occupancyPercent}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                isFull ? 'bg-destructive' : occupancyPercent > 80 ? 'bg-secondary' : 'bg-primary'
              }`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
          {isFull && (
            <p className="mt-2 text-sm font-medium text-destructive">Evento esgotado!</p>
          )}
        </div>
      )}

      {onRegister && event.status === 'upcoming' && (
        <Button
          size="xl"
          className="w-full"
          variant={isRegistered ? 'outline' : isFull ? 'secondary' : 'default'}
          disabled={isFull && !isRegistered}
          onClick={onRegister}
        >
          {isRegistered ? 'Cancelar Inscrição' : isFull ? 'Evento Esgotado' : 'Inscrever-se'}
        </Button>
      )}
    </div>
  );
}
