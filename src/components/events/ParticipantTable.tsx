import { useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CheckCircle2, XCircle, Clock, Search, RotateCcw, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Participant } from '@/data/mockData';

interface ParticipantTableProps {
  participants: Participant[];
  onCheckIn?: (participantId: string) => void;
  onUncheckIn?: (participantId: string) => void;
  onMarkAbsent?: (participantId: string) => void;
  onBulkPresent?: () => void;
  onBulkAbsent?: () => void;
  enableAttendance?: boolean;
}

const attendanceLabels: Record<Participant['attendance'], string> = {
  present: 'Presente',
  absent: 'Ausente',
  pending: 'Pendente',
};

const attendanceIcons: Record<Participant['attendance'], React.ReactNode> = {
  present: <CheckCircle2 className="h-4 w-4" />,
  absent: <XCircle className="h-4 w-4" />,
  pending: <Clock className="h-4 w-4" />,
};

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function ParticipantTable({ participants, onCheckIn, onUncheckIn, onMarkAbsent, onBulkPresent, onBulkAbsent, enableAttendance = true }: ParticipantTableProps) {
  const [filter, setFilter] = useState<'all' | Participant['attendance']>('all');
  const [search, setSearch] = useState('');

  const filtered = participants.filter((p) => {
    const matchesFilter = filter === 'all' || p.attendance === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    total: participants.length,
    present: participants.filter((p) => p.attendance === 'present').length,
    absent: participants.filter((p) => p.attendance === 'absent').length,
    pending: participants.filter((p) => p.attendance === 'pending').length,
  };

  const hasPending = counts.pending > 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{counts.total}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        {enableAttendance && (
          <>
            <div className="glass-card rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-success">{counts.present}</p>
              <p className="text-sm text-muted-foreground">Presentes</p>
            </div>
            <div className="glass-card rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{counts.absent}</p>
              <p className="text-sm text-muted-foreground">Ausentes</p>
            </div>
            <div className="glass-card rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{counts.pending}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </>
        )}
        {!enableAttendance && (
          <div className="glass-card rounded-lg p-4 text-center col-span-1 md:col-span-3 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Confirmação de presença não ativada para este evento.</p>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {enableAttendance && (onBulkPresent || onBulkAbsent) && (
        <div className="flex flex-wrap gap-2">
          {onBulkPresent && (
            <Button variant="success" size="sm" className="gap-1" onClick={onBulkPresent}>
              <UserCheck className="h-4 w-4" />
              Marcar todos como presente ({counts.pending})
            </Button>
          )}
          {onBulkAbsent && (
            <Button variant="destructive" size="sm" className="gap-1" onClick={onBulkAbsent}>
              <UserX className="h-4 w-4" />
              Marcar todos como ausente ({counts.pending})
            </Button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar participante..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {enableAttendance && (
          <div className="flex gap-2">
            {(['all', 'present', 'absent', 'pending'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Todos' : attendanceLabels[f]}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-5 text-sm font-medium text-muted-foreground">Nome</th>
                <th className="text-left py-3 px-5 text-sm font-medium text-muted-foreground">Email</th>
                <th className="text-left py-3 px-5 text-sm font-medium text-muted-foreground">Data Inscrição</th>
                {enableAttendance && (
                  <th className="text-left py-3 px-5 text-sm font-medium text-muted-foreground">Presença</th>
                )}
                {(onCheckIn || onUncheckIn || onMarkAbsent) && enableAttendance && (
                  <th className="text-right py-3 px-5 text-sm font-medium text-muted-foreground">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((participant) => (
                <tr key={participant.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {getInitials(participant.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{participant.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{participant.role === 'teacher' ? 'Professor' : 'Aluno'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-sm text-muted-foreground">{participant.email}</td>
                  <td className="py-3 px-5 text-sm text-muted-foreground">
                    {format(participant.registeredAt, "d MMM yyyy", { locale: pt })}
                  </td>
                  {enableAttendance && (
                    <td className="py-3 px-5">
                      <Badge
                        variant={
                          participant.attendance === 'present' ? 'success' :
                          participant.attendance === 'absent' ? 'destructive' : 'secondary'
                        }
                        className="gap-1"
                      >
                        {attendanceIcons[participant.attendance]}
                        {attendanceLabels[participant.attendance]}
                      </Badge>
                    </td>
                  )}
                  {(onCheckIn || onUncheckIn || onMarkAbsent) && enableAttendance && (
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {participant.attendance === 'pending' && onCheckIn && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => onCheckIn(participant.id)}
                            className="gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Presente
                          </Button>
                        )}
                        {participant.attendance === 'pending' && onMarkAbsent && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onMarkAbsent(participant.id)}
                            className="gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Ausente
                          </Button>
                        )}
                        {(participant.attendance === 'present' || participant.attendance === 'absent') && onUncheckIn && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUncheckIn(participant.id)}
                            className="gap-1 text-muted-foreground"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reverter
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={enableAttendance ? 5 : 3} className="py-8 text-center text-muted-foreground">
                    Nenhum participante encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
