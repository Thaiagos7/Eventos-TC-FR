import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const Notificacoes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getUserNotifications, markAsRead, markAllAsRead, clearNotifications, getUnreadCount } = useNotifications();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <p className="text-muted-foreground">Precisa de fazer login para ver as notificações.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const notifications = [...getUserNotifications(user.email), ...getUserNotifications(user.id)].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  const unreadCount = getUnreadCount(user.email) + getUnreadCount(user.id);

  const handleClearNotifications = () => {
    const confirmed = window.confirm('Tem a certeza que pretende limpar todas as suas notificacoes?');
    if (!confirmed) return;

    clearNotifications([user.email, user.id]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
                <Bell className="h-7 w-7" /> Notificações
              </h1>
              <p className="text-muted-foreground mt-1">
                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
              </p>
            </div>
            {notifications.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" className="gap-2"
                    onClick={() => { markAllAsRead(user.email); markAllAsRead(user.id); }}>
                    <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
                  </Button>
                )}
                <Button variant="destructive" size="sm" className="gap-2" onClick={handleClearNotifications}>
                  <Trash2 className="h-4 w-4" /> Limpar notificacoes
                </Button>
              </div>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Sem notificações</p>
              <p className="text-sm text-muted-foreground mt-1">As suas notificações aparecerão aqui.</p>
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden max-h-[70vh] overflow-y-auto divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                  onClick={() => {
                    markAsRead(n.id);
                    if (n.type === 'event_update' && n.title?.includes('pendente')) {
                      navigate('/dashboard/pendentes');
                    } else if (n.eventId) {
                      navigate(`/eventos/${n.eventId}`);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(n.createdAt, "d MMM yyyy, HH:mm", { locale: pt })}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Notificacoes;
