import { useEffect, useState } from 'react';
import { format, eachDayOfInterval } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { dateFromDateKey, toDateKey } from '@/lib/eventSchedule';

export type DateMode = 'single' | 'interval' | 'scattered';

export interface TimeException {
  date: string;
  time: string;
  duration: number;
}

interface Props {
  dateMode: DateMode;
  onDateModeChange: (mode: DateMode) => void;
  singleDate?: Date;
  onSingleDateChange: (date: Date | undefined) => void;
  dates: Date[];
  onDatesChange: (dates: Date[]) => void;
  defaultTime: string;
  defaultDuration: number;
  hasTimeExceptions: boolean;
  onHasTimeExceptionsChange: (v: boolean) => void;
  timeExceptions: TimeException[];
  onTimeExceptionsChange: (exceptions: TimeException[]) => void;
  onExceptionDraftChange?: (draft: TimeException | null) => void;
}

export function DateModeSelector({
  dateMode, onDateModeChange,
  singleDate, onSingleDateChange,
  dates, onDatesChange,
  defaultTime, defaultDuration,
  hasTimeExceptions, onHasTimeExceptionsChange,
  timeExceptions, onTimeExceptionsChange,
  onExceptionDraftChange,
}: Props) {
  const [intervalStart, setIntervalStart] = useState<Date | undefined>(
    dateMode === 'interval' && dates.length > 0 ? dates[0] : undefined
  );
  const [intervalEnd, setIntervalEnd] = useState<Date | undefined>(
    dateMode === 'interval' && dates.length > 1 ? dates[dates.length - 1] : undefined
  );
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [newExceptionTime, setNewExceptionTime] = useState(defaultTime || '09:00');
  const [newExceptionDuration, setNewExceptionDuration] = useState(defaultDuration || 60);

  useEffect(() => {
    if (!onExceptionDraftChange) return;

    if (!hasTimeExceptions || !newExceptionDate || !newExceptionTime) {
      onExceptionDraftChange(null);
      return;
    }

    onExceptionDraftChange({
      date: newExceptionDate,
      time: newExceptionTime,
      duration: newExceptionDuration,
    });
  }, [
    hasTimeExceptions,
    newExceptionDate,
    newExceptionTime,
    newExceptionDuration,
    onExceptionDraftChange,
  ]);

  const handleModeChange = (mode: DateMode) => {
    onDateModeChange(mode);
    onDatesChange([]);
    onTimeExceptionsChange([]);
    setIntervalStart(undefined);
    setIntervalEnd(undefined);
    setNewExceptionDate('');
  };

  const handleIntervalChange = (start?: Date, end?: Date) => {
    setIntervalStart(start);
    setIntervalEnd(end);
    if (start && end && end >= start) {
      const allDates = eachDayOfInterval({ start, end });
      if (allDates.length > 365) return;
      onDatesChange(allDates);
      const dateStrs = allDates.map((d) => toDateKey(d));
      onTimeExceptionsChange(timeExceptions.filter((e) => dateStrs.includes(toDateKey(e.date))));
    }
  };

  const handleScatteredSelect = (selectedDates: Date[] | undefined) => {
    const newDates = selectedDates || [];
    if (newDates.length > 200) return;
    onDatesChange(newDates);
    const dateStrs = newDates.map((d) => toDateKey(d)).filter(Boolean);
    onTimeExceptionsChange(timeExceptions.filter((e) => dateStrs.includes(toDateKey(e.date))));
  };

  const addException = () => {
    if (!newExceptionDate || !newExceptionTime) return;

    const normalizedDate = toDateKey(newExceptionDate);
    if (!normalizedDate) return;

    const nextExceptions = [
      ...timeExceptions.filter((e) => toDateKey(e.date) !== normalizedDate),
      {
        date: normalizedDate,
        time: newExceptionTime,
        duration: newExceptionDuration,
      },
    ].sort((a, b) => a.date.localeCompare(b.date));

    onTimeExceptionsChange(nextExceptions);
    setNewExceptionDate('');
    setNewExceptionTime(defaultTime || '09:00');
    setNewExceptionDuration(defaultDuration || 60);
  };

  const removeException = (date: string) => {
    onTimeExceptionsChange(timeExceptions.filter(e => toDateKey(e.date) !== toDateKey(date)));
  };

  const availableDatesForException = Array.from(
    new Set(dates.map((d) => toDateKey(d)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Modo de datas</Label>
        <div className="flex gap-2 flex-wrap">
          {([
            { value: 'single' as const, label: 'Data única' },
            { value: 'interval' as const, label: 'Intervalo' },
            { value: 'scattered' as const, label: 'Dias dispersos' },
          ]).map(m => (
            <Button
              key={m.value}
              type="button"
              variant={dateMode === m.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeChange(m.value)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Single mode */}
      {dateMode === 'single' && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !singleDate && 'text-muted-foreground')}>
                {singleDate ? format(singleDate, "d 'de' MMMM 'de' yyyy", { locale: pt }) : 'Selecione a data'}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={singleDate}
                onSelect={(d: Date | undefined) => {
                  onSingleDateChange(d);
                  if (d) onDatesChange([d]);
                  else onDatesChange([]);
                }}
                disabled={(date: Date) => date < new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Interval mode */}
      {dateMode === 'interval' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Data inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !intervalStart && 'text-muted-foreground')}>
                    {intervalStart ? format(intervalStart, "d MMM yyyy", { locale: pt }) : 'Início'}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={intervalStart}
                    onSelect={(d: Date | undefined) => handleIntervalChange(d, intervalEnd)}
                    disabled={(date: Date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Data final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !intervalEnd && 'text-muted-foreground')}>
                    {intervalEnd ? format(intervalEnd, "d MMM yyyy", { locale: pt }) : 'Fim'}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={intervalEnd}
                    onSelect={(d: Date | undefined) => handleIntervalChange(intervalStart, d)}
                    disabled={(date: Date) => date < new Date() || (intervalStart ? date < intervalStart : false)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {intervalStart && intervalEnd && intervalEnd < intervalStart && (
            <p className="text-sm text-destructive">A data final deve ser posterior à data inicial.</p>
          )}
        </div>
      )}

      {/* Scattered mode */}
      {dateMode === 'scattered' && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Selecione as datas (clique para marcar/desmarcar)</Label>
          <div className="glass-card inline-block rounded-2xl p-1">
            <Calendar
              mode="multiple"
              selected={dates}
              onSelect={handleScatteredSelect}
              disabled={(date: Date) => date < new Date()}
              className="p-3 pointer-events-auto"
            />
          </div>
          {dates.length > 200 && (
            <p className="text-sm text-destructive mt-1">Máximo de 200 datas por evento.</p>
          )}
        </div>
      )}

      {/* Summary */}
      {dates.length > 0 && (
        <div className="glass-muted rounded-2xl p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{dates.length} {dates.length === 1 ? 'data' : 'datas'}</Badge>
            <span className="text-sm text-muted-foreground">Horário padrão: {defaultTime || '--:--'} · {defaultDuration || 0} min</span>
            {timeExceptions.length > 0 && (
              <Badge variant="secondary">{timeExceptions.length} {timeExceptions.length === 1 ? 'exceção' : 'exceções'}</Badge>
            )}
          </div>
        </div>
      )}

      {/* Time exceptions toggle */}
      {dates.length > 1 && (
        <div className="glass-muted flex items-center justify-between rounded-2xl p-4">
          <div>
            <p className="text-sm font-medium">Alguns dias terão horário diferente</p>
            <p className="text-xs text-muted-foreground mt-0.5">Definir exceções de horário para datas específicas.</p>
          </div>
          <Switch checked={hasTimeExceptions} onCheckedChange={(v) => {
            onHasTimeExceptionsChange(v);
            if (!v) onTimeExceptionsChange([]);
          }} />
        </div>
      )}

      {/* Time exceptions list */}
      {hasTimeExceptions && dates.length > 1 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Exceções de horário</Label>
          {timeExceptions
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((ex) => (
            <div key={ex.date} className="glass-field flex items-center gap-2 rounded-2xl p-3">
              <Badge variant="outline">{format(dateFromDateKey(toDateKey(ex.date)), "d MMM", { locale: pt })}</Badge>
              <span className="text-sm">{ex.time} · {ex.duration} min</span>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => removeException(ex.date)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {availableDatesForException.length > 0 && (
            <div className="glass-muted flex flex-wrap items-end gap-2 rounded-2xl border-dashed p-3">
              <div className="flex-1 min-w-[120px]">
                <Label className="text-xs">Data</Label>
                <Select value={newExceptionDate} onValueChange={setNewExceptionDate}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {availableDatesForException.map(d => (
                      <SelectItem key={d} value={d}>
                        {format(dateFromDateKey(d), "d MMM yyyy", { locale: pt })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label className="text-xs">Hora</Label>
                <Input type="time" value={newExceptionTime} onChange={e => setNewExceptionTime(e.target.value)} />
              </div>
              <div className="w-24">
                <Label className="text-xs">Duração</Label>
                <Input type="number" min={15} max={480} value={newExceptionDuration} onChange={e => setNewExceptionDuration(Number(e.target.value))} />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addException} disabled={!newExceptionDate}>
                <Plus className="h-4 w-4 mr-1" /> Guardar exceção
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
