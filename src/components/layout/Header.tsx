import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, Menu, X, LogIn, LogOut, LayoutDashboard, UserCircle, Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import logo from '@/assets/logo.png';

const menuTransition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const };

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, canManageEvents } = useAuth();
  const { getUserNotifications, markAsRead, getUnreadCount } = useNotifications();

  const unreadCount = user ? getUnreadCount(user.email) + getUnreadCount(user.id) : 0;
  const userNotifications = user
    ? [...getUserNotifications(user.email), ...getUserNotifications(user.id)].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )
    : [];

  const navLinks = [
    { href: '/eventos', label: 'Eventos', icon: Calendar },
    ...(canManageEvents ? [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    ...(user ? [{ href: '/profile', label: 'Perfil', icon: UserCircle }] : []),
  ];

  const handleLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await logout();
      setMobileMenuOpen(false);
      navigate('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full pt-3 md:pt-4">
      <div className="container">
        <div className="glass-nav rounded-[1.9rem] p-3 md:p-3.5">
          <div className="relative flex items-center gap-3">
            <Link to="/" className="shrink-0 rounded-[1.45rem] bg-primary p-2.5 text-primary-foreground shadow-[0_22px_36px_-24px_hsl(var(--paper-shadow)/0.95)] transition-transform duration-150 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 rounded-[1.15rem] border border-white/14 bg-white/10 px-3 py-2.5">
                <img src={logo} alt="Eventos TC" className="h-11 w-11 shrink-0 object-contain" />
                <div className="hidden sm:block leading-none text-left">
                  <span className="block font-display text-lg font-black uppercase tracking-[-0.04em] text-white">
                    Eventos TC
                  </span>
                </div>
              </div>
            </Link>

            <nav className="hidden md:absolute md:left-1/2 md:flex md:-translate-x-1/2 md:flex-wrap md:items-center md:justify-center md:gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href || location.pathname.startsWith(link.href + '/');
                return (
                  <Link key={link.href} to={link.href}>
                    <Button
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      className="gap-2 px-4"
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto hidden items-center gap-2 md:flex">
              {user && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="relative h-10 w-10">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground shadow-sm">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[22rem] p-0" align="end">
                    <div className="border-b border-foreground/8 px-4 py-3">
                      <div className="text-center">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">Notificações</h3>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {userNotifications.length === 0 ? (
                        <p className="p-4 text-center text-sm text-muted-foreground">Sem notificações</p>
                      ) : (
                        userNotifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className={`cursor-pointer border-b border-foreground/8 px-4 py-3 transition-colors last:border-b-0 hover:bg-primary/6 ${
                              !n.read ? 'bg-primary/6' : ''
                            }`}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.type === 'event_update' && n.title?.includes('pendente')) {
                                navigate('/dashboard/pendentes');
                              } else if (n.eventId) {
                                navigate(`/eventos/${n.eventId}`);
                              }
                            }}
                          >
                            <p className="text-sm font-semibold text-foreground">{n.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t border-foreground/8 p-2">
                      <Button variant="ghost" size="sm" className="w-full text-[11px] uppercase tracking-[0.08em]" onClick={() => navigate('/notificacoes')}>
                        Ver todas as notificações
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {user ? (
                <>
                  <span className="glass-field max-w-[220px] rounded-full px-4 py-2 text-sm text-muted-foreground" title={user.name}>
                    {user.name}
                  </span>
                  <Button variant="hero" size="sm" className="gap-2 px-4" onClick={handleLogout} disabled={loggingOut}>
                    <LogOut className="h-4 w-4" />
                    {loggingOut ? 'A sair...' : 'Sair'}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="gap-2 px-4">
                      <LogIn className="h-4 w-4" />
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/registar">
                    <Button variant="accent" size="sm" className="gap-2 px-4">
                      Criar Conta
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2 md:hidden">
              {user && unreadCount > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="relative h-10 w-10">
                      <Bell className="h-5 w-5" />
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground shadow-sm">
                        {unreadCount}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="end">
                    <div className="max-h-56 overflow-y-auto">
                      {userNotifications.length === 0 ? (
                        <p className="p-4 text-center text-sm text-muted-foreground">Sem notificações</p>
                      ) : (
                        userNotifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className="border-b border-foreground/8 px-4 py-3 last:border-b-0"
                            onClick={() => markAsRead(n.id)}
                          >
                            <p className="text-sm font-semibold">{n.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setMobileMenuOpen((prev) => !prev)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={menuTransition}
              className="px-1 pt-2 md:hidden"
            >
              <div className="glass-card rounded-[1.65rem] p-4">
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.href || location.pathname.startsWith(link.href + '/');
                    return (
                      <Link key={link.href} to={link.href} onClick={() => setMobileMenuOpen(false)}>
                        <Button variant={isActive ? 'default' : 'outline'} className="w-full justify-start gap-3 px-4">
                          <link.icon className="h-4 w-4" />
                          {link.label}
                        </Button>
                      </Link>
                    );
                  })}

                  <div className="mt-2 border-t border-foreground/8 pt-3">
                    {user ? (
                      <div className="space-y-2">
                        <div className="glass-field rounded-[1.2rem] px-4 py-3 text-sm text-muted-foreground">{user.name}</div>
                        <Button variant="hero" className="w-full gap-2" onClick={handleLogout} disabled={loggingOut}>
                          <LogOut className="h-4 w-4" />
                          {loggingOut ? 'A sair...' : 'Sair'}
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full gap-2">
                            <LogIn className="h-4 w-4" />
                            Entrar
                          </Button>
                        </Link>
                        <Link to="/registar" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="accent" className="w-full gap-2">
                            Criar Conta
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
