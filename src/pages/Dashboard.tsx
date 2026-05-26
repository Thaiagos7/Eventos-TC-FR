import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Calendar, Users, Plus, CheckCircle2, Eye, MoreVertical,
  ShieldCheck, Search, EyeIcon, Award
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventContext';
import { eventTypeLabels, eventTypeColors, type Event } from '@/data/mockData';
import { EventFilters } from '@/components/events/EventFilters';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type StatusFilter = 'all' | 'approved' | 'pending' | 'rejected';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, canManageEvents, isAdmin, isProfessor } = useAuth();
  const { events } = useEvents();

  const [selectedTypes, setSelectedTypes] = useState<Event['type'][]>([]);
  const [selectedDate, setSelectedDate] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const allEvents = events;
  const approvedEvents = allEvents.filter((e) => e.approved);
  const pendingEvents = allEvents.filter((e) => !e.approved && !e.rejectionReason);
  const completedCount = approvedEvents.filter((e) => e.status === 'completed').length;
  const totalViews = allEvents.reduce((sum, e) => sum + (e.views || 0), 0);
  const totalParticipants = approvedEvents.reduce((sum, e) => sum + e.currentParticipants, 0);

  const stats = [
    { label: 'Total Eventos', value: String(allEvents.length), icon: Calendar, color: 'bg-primary/10 text-primary dark:bg-primary/16 dark:text-primary' },
    { label: 'Aprovados', value: String(approvedEvents.length), icon: CheckCircle2, color: 'bg-success/10 text-success' },
    { label: 'Pendentes', value: String(pendingEvents.length), icon: ShieldCheck, color: 'bg-secondary/12 text-secondary-foreground dark:bg-secondary/16 dark:text-secondary' },
    { label: 'Inscritos', value: String(totalParticipants), icon: Users, color: 'bg-primary/10 text-primary dark:bg-primary/16 dark:text-primary' },
    { label: 'Visualizações', value: String(totalViews), icon: EyeIcon, color: 'bg-muted text-muted-foreground' },
    { label: 'Concluídos', value: String(completedCount), icon: Award, color: 'bg-success/10 text-success' },
  ];

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return allEvents
      .filter((event) => {
        if (statusFilter === 'approved' && !event.approved) return false;
        if (statusFilter === 'pending' && (event.approved || event.rejectionReason)) return false;
        if (statusFilter === 'rejected' && !event.rejectionReason) return false;
        if (selectedTypes.length > 0 && !selectedTypes.includes(event.type)) return false;
        if (selectedDate === 'today') {
          const d = event.date;
          if (d.getDate() !== now.getDate() || d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        }
        if (selectedDate === 'week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0,0,0,0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          if (event.date < startOfWeek || event.date >= endOfWeek) return false;
        }
        if (selectedDate === 'month') {
          if (event.date.getMonth() !== now.getMonth() || event.date.getFullYear() !== now.getFullYear()) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          if (!event.title.toLowerCase().includes(q) && !event.organizerName.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [allEvents, selectedTypes, selectedDate, statusFilter, search]);

  if (!canManageEvents) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Acesso restrito</h1>
          <p className="text-muted-foreground mb-6">O dashboard está disponível apenas para administradores e professores.</p>
          <Link to="/eventos"><Button>Ver eventos</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Gerir eventos e acompanhar inscrições</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" className="gap-2" onClick={() => navigate('/dashboard/pendentes')}>
                <ShieldCheck className="h-4 w-4" />
                Pendentes
                {pendingEvents.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs">
                    {pendingEvents.length}
                  </Badge>
                )}
              </Button>
            )}
            <Button size="lg" className="gap-2" onClick={() => navigate('/eventos/novo')}>
              <Plus className="h-5 w-5" /> Criar Evento
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, delay: 0.05 }}
          className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card rounded-[1.5rem] p-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, delay: 0.055 }}
          className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar eventos..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <EventFilters selectedTypes={selectedTypes} onTypeChange={setSelectedTypes}
            selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, delay: 0.1 }}
          className="glass-card rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-display text-xl font-bold text-foreground">Eventos ({filteredEvents.length})</h2>
          </div>
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-5 text-sm font-medium text-muted-foreground">Evento</th>
                  <th className="text-left py-3 px-5 text-sm font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left py-3 px-5 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-left py-3 px-5 text-sm font-medium text-muted-foreground">Inscritos</th>
                  <th className="text-left py-3 px-5 text-sm font-medium text-muted-foreground">Views</th>
                  <th className="text-left py-3 px-5 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-right py-3 px-5 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-medium text-foreground line-clamp-1 text-safe">{event.title}</div>
                      <div className="text-sm text-muted-foreground">{event.organizerName}</div>
                    </td>
                    <td className="py-4 px-5"><Badge variant={eventTypeColors[event.type]}>{event.type === 'other' && event.customType ? event.customType : eventTypeLabels[event.type]}</Badge></td>
                    <td className="py-4 px-5 text-sm">
                      <div>{format(event.date, "d MMM yyyy", { locale: pt })}</div>
                      <div className="text-muted-foreground">{event.time}</div>
                    </td>
                    <td className="py-4 px-5">
                      {event.registrationType === 'open' ? (
                        <span className="text-sm text-muted-foreground">Aberto</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{event.currentParticipants}/{event.maxParticipants}</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-sm text-muted-foreground">{event.views || 0}</td>
                    <td className="py-4 px-5">
                      {event.rejectionReason ? (
                        <Badge variant="destructive">Rejeitado</Badge>
                      ) : !event.approved ? (
                        <Badge variant="secondary">Pendente</Badge>
                      ) : event.status === 'completed' ? (
                        <Badge variant="secondary">Concluído</Badge>
                      ) : event.status === 'cancelled' ? (
                        <Badge variant="destructive">Encerrado</Badge>
                      ) : (
                        <Badge variant="success">Aberto</Badge>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/eventos/${event.id}`)}><Eye className="h-4 w-4" /></Button>
                        {event.registrationType !== 'open' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/eventos/${event.id}/participantes`)}><CheckCircle2 className="h-4 w-4 text-success" /></Button>
                        )}
                        {/* Editar: admin sempre; professor só nos seus eventos aprovados */}
                        {(isAdmin || (isProfessor && event.organizerId === user?.id)) && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/eventos/${event.id}/editar`, { state: { from: '/dashboard' } })}><MoreVertical className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Nenhum evento encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
