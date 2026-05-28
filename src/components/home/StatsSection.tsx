import { motion } from 'framer-motion';
import { Calendar, Users, TrendingUp, Clock } from 'lucide-react';
import { useEvents } from '@/contexts/EventContext';
import { cn } from '@/lib/utils';

export function StatsSection() {
  const { events } = useEvents();

  const activeEvents = events.filter((e) => e.approved && e.status === 'upcoming').length;
  const totalParticipants = events.reduce((sum, e) => sum + e.currentParticipants, 0);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  const thisWeek = events.filter((e) => e.approved && e.date >= startOfWeek && e.date < endOfWeek).length;
  const totalMax = events
    .filter((e) => e.approved && e.registrationType === 'registration')
    .reduce((sum, e) => sum + e.maxParticipants, 0);
  const totalCurrent = events
    .filter((e) => e.approved && e.registrationType === 'registration')
    .reduce((sum, e) => sum + e.currentParticipants, 0);
  const occupancy = totalMax > 0 ? Math.round((totalCurrent / totalMax) * 100) : 0;

  const stats = [
    { label: 'Eventos Ativos', value: String(activeEvents), icon: Calendar },
    { label: 'Total Inscritos', value: String(totalParticipants), icon: Users, featured: true },
    { label: 'Esta Semana', value: String(thisWeek), icon: Clock },
    { label: 'Taxa de Ocupação', value: `${occupancy}%`, icon: TrendingUp },
  ];

  return (
    <section className="py-8 md:py-10">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: index * 0.04 }}
            className={cn(
              'glass-card rounded-[1.8rem] p-5 md:p-6',
              stat.featured && 'border-foreground/10 before:opacity-0',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className={cn(
                    'text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground',
                    stat.featured && 'text-muted-foreground',
                  )}
                >
                  {stat.label}
                </p>
                <p className={cn('mt-4 font-display text-4xl font-black tracking-[-0.05em] text-foreground', stat.featured && 'text-foreground')}>
                  {stat.value}
                </p>
              </div>
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-[1.3rem] border border-foreground/10 bg-[hsl(var(--paper-strong))] text-foreground shadow-sm',
                  stat.featured && 'border-foreground/10 bg-[hsl(var(--paper-strong))] text-foreground',
                )}
              >
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
