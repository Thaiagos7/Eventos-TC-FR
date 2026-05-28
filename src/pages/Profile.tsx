import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Mail, Shield, Calendar, CheckCircle2, Camera, Pencil, Sun, Moon, KeyRound } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getProfileEventGroups } from '@/lib/profileEvents';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  professor: 'Professor',
  aluno: 'Aluno',
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, session, updateProfile, updateCredentials } = useAuth();
  const { events, participants, loadParticipantsForUser } = useEvents();
  const { theme, toggleTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name ?? '');
  const [credentialEmail, setCredentialEmail] = useState(user?.email ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingCredentials, setUpdatingCredentials] = useState(false);

  useEffect(() => {
    if (user?.email) void loadParticipantsForUser(user.email);
  }, [user?.email, loadParticipantsForUser]);

  useEffect(() => {
    setCredentialEmail(user?.email ?? '');
  }, [user?.email]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">Faça login</h1>
          <p className="text-muted-foreground mb-6">Precisa de estar autenticado para ver o seu perfil.</p>
          <Link to="/login"><Button>Entrar</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const { myRegistrations, enrolledEvents, upcomingEvents, completedEvents, presentCount } = getProfileEventGroups(
    events,
    participants,
    user.email,
  );

  const handleSaveName = () => {
    if (nameValue.trim() && nameValue.trim() !== user.name) {
      updateProfile({ name: nameValue.trim() });
      toast.success('Nome atualizado com sucesso!');
    }
    setEditingName(false);
  };

  const handleSaveCredentials = async () => {
    if (!user || updatingCredentials) return;

    if (usesGoogleLogin) {
      toast.info('Esta conta usa login Google. As credenciais são geridas pela Google.');
      return;
    }

    const nextEmail = credentialEmail.trim();
    const emailChanged = Boolean(nextEmail && nextEmail.toLowerCase() !== user.email.toLowerCase());
    const password = newPassword.trim();

    if (!emailChanged && !password) {
      toast.info('Altere o email ou indique uma nova palavra-passe.');
      return;
    }

    if (password && password.length < 6) {
      toast.error('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password && password !== confirmPassword) {
      toast.error('As palavras-passe não coincidem.');
      return;
    }

    try {
      setUpdatingCredentials(true);
      const result = await updateCredentials({
        email: emailChanged ? nextEmail : undefined,
        password: password || undefined,
      });

      setNewPassword('');
      setConfirmPassword('');

      if (emailChanged && !result.emailChanged) {
        toast.info('Confirme o novo email para concluir a alteração.');
      } else {
        toast.success('Credenciais atualizadas com sucesso!');
      }
    } catch (err) {
      toast.error('Não foi possível atualizar as credenciais.', {
        description: err instanceof Error ? err.message : 'Tente novamente.',
      });
    } finally {
      setUpdatingCredentials(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecione uma imagem válida.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      updateProfile({ avatar: url });
      toast.success('Foto de perfil atualizada!');
    };
    reader.readAsDataURL(file);
  };

  const provider = session?.user?.app_metadata?.provider as string | undefined;
  const identityProviders = session?.user?.identities?.map((identity) => identity.provider) ?? [];
  const usesGoogleLogin = provider === 'google' || identityProviders.includes('google');

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26 }}>
          {/* Profile card */}
          <div className="glass-card rounded-xl p-6 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 text-2xl">
                  {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <button onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-primary-foreground" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} className="max-w-[240px]"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} autoFocus />
                      <Button size="sm" onClick={handleSaveName}>Guardar</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingName(false); setNameValue(user.name); }}>Cancelar</Button>
                    </div>
                  ) : (
                    <>
                      <h1 className="font-display text-3xl font-bold text-foreground text-safe">{user.name}</h1>
                      <button onClick={() => { setNameValue(user.name); setEditingName(true); }} className="text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-4 w-4" /> {user.email}</span>
                  <Badge variant="default" className="gap-1"><Shield className="h-3 w-3" /> {roleLabels[user.role]}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Stats + preferences */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-card rounded-xl p-5 text-center">
              <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{enrolledEvents.length}</p>
              <p className="text-sm text-muted-foreground">Inscrições</p>
            </div>
            <div className="glass-card rounded-xl p-5 text-center">
              <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{presentCount}</p>
              <p className="text-sm text-muted-foreground">Presenças</p>
            </div>
            <div className="glass-card rounded-xl p-5 col-span-2 md:col-span-1 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-3">
                <Sun className="h-5 w-5 text-muted-foreground" />
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} id="theme-toggle" />
                <Moon className="h-5 w-5 text-muted-foreground" />
              </div>
              <Label htmlFor="theme-toggle" className="block text-sm text-muted-foreground text-center mt-2">
                {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
              </Label>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 md:p-8 mb-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--paper-strong))] text-foreground shadow-sm">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">Credenciais</h2>
                <p className="text-sm text-muted-foreground">Atualize o email de acesso ou defina uma nova palavra-passe.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="credential-email">Email</Label>
                <Input
                  id="credential-email"
                  type="email"
                  value={credentialEmail}
                  onChange={(e) => setCredentialEmail(e.target.value)}
                  disabled={updatingCredentials}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova palavra-passe</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={updatingCredentials}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar palavra-passe</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={updatingCredentials}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button className="gap-2" onClick={handleSaveCredentials} disabled={updatingCredentials}>
                <KeyRound className="h-4 w-4" />
                {updatingCredentials ? 'A guardar...' : 'Guardar credenciais'}
              </Button>
            </div>
          </div>

          {/* Events tabs */}
          <Tabs defaultValue="enrolled" className="space-y-4">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="enrolled">Eventos Inscritos ({upcomingEvents.length})</TabsTrigger>
              <TabsTrigger value="completed">Eventos Concluídos ({completedEvents.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="enrolled">
              <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                {upcomingEvents.length === 0 ? (
                  <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Não está inscrito em nenhum evento próximo.</div>
                ) : (
                  upcomingEvents.map((event) => (
                    <div key={event.id} className="glass-card rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer card-hover"
                      onClick={() => navigate(`/eventos/${event.id}`)}>
                      <div>
                        <h3 className="font-medium text-foreground">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">{format(event.date, "d 'de' MMMM 'de' yyyy", { locale: pt })} às {event.time}</p>
                      </div>
                      <Badge variant="success">Próximo</Badge>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value="completed">
              <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                {completedEvents.length === 0 ? (
                  <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Nenhum evento concluído no histórico.</div>
                ) : (
                  completedEvents.map((event) => (
                    <div key={event.id} className="glass-card rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer card-hover"
                      onClick={() => navigate(`/eventos/${event.id}`)}>
                      <div>
                        <h3 className="font-medium text-foreground">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">{format(event.date, "d 'de' MMMM 'de' yyyy", { locale: pt })} às {event.time}</p>
                      </div>
                      <Badge variant="secondary">Concluído</Badge>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
