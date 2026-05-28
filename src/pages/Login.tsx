import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import escolaBg from '@/assets/escola-bg.jpg';
import loginLogoDark from '@/assets/login-logo-dark.png';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const authBusy = submitting || googleLoading;

  useEffect(() => {
    const oauthError = (location.state as { oauthError?: string } | null)?.oauthError;
    if (!oauthError) return;
    toast.error('Erro no login com Google.', { description: oauthError });
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const handleClearSession = () => {
    try {
      localStorage.removeItem('eventostc-auth');

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });

      sessionStorage.clear();

      toast.success('Sessão local limpa!', {
        description: 'A página vai recarregar para permitir um novo login.',
      });

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      toast.error('Não foi possível limpar a sessão.', {
        description: 'Tente novamente ou use uma janela anónima.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authBusy) return;

    if (!email.trim() || !password.trim()) {
      toast.error('Preencha todos os campos.');
      return;
    }

    try {
      setSubmitting(true);
      const ok = await login(email.trim(), password);

      if (ok) {
        toast.success('Login efetuado com sucesso!');
        navigate('/eventos');
      } else {
        toast.error('Não foi possível entrar.', {
          description: 'Verifique o email e a palavra-passe.',
        });
      }
    } catch (err) {
      toast.error('Erro ao entrar.', {
        description: err instanceof Error ? err.message : 'Tente novamente.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (authBusy) return;

    try {
      setGoogleLoading(true);
      const { ok, error } = await loginWithGoogle();

      if (!ok) {
        toast.error('Não foi possível iniciar o login com Google.', {
          description: error ?? 'Verifique se o Google OAuth está ativo no Supabase.',
        });
        setGoogleLoading(false);
      }
    } catch (err) {
      toast.error('Erro ao iniciar login com Google.', {
        description: err instanceof Error ? err.message : 'Tente novamente.',
      });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <main className="relative z-10 container flex min-h-screen items-center justify-center py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-5xl"
        >
          <div className="glass-panel rounded-[2.6rem] p-3 md:p-4">
            <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <aside className="relative hidden overflow-hidden rounded-[2.1rem] bg-primary p-8 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
                <div className="absolute inset-0 poster-grid-bg opacity-[0.18]" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-3 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground">
                    <img src={logo} alt="" aria-hidden="true" className="h-5 w-auto" />
                    Eventos TC
                  </div>
                  <h2 className="editorial-title mt-6 max-w-sm text-[clamp(2.4rem,5vw,4.1rem)] text-primary-foreground">
                    Entrar
                  </h2>
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="paper-frame mx-auto max-w-[25rem] rotate-[-3deg] bg-white">
                    <img src={escolaBg} alt="Alunos na escola" className="h-64 w-full object-[40%_50%]" />
                  </div>
                  <div className="paper-note ml-auto max-w-[14rem] rotate-[3deg] px-4 py-3 text-left text-foreground">
                    <p className="font-display text-sm font-black uppercase tracking-[-0.03em]">Entre na sua conta</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-foreground/70">Pra continuar.</p>
                  </div>
                </div>
              </aside>

              <div className="glass-card rounded-[2.1rem] p-6 md:p-8">
                <div className="mb-8 flex items-center">
                  <img src={loginLogoDark} alt="Eventos TC" className="h-16 w-auto shrink-0 object-contain" />
                </div>


                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu.email@escola.pt"
                        className="pl-11"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={authBusy}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Palavra-passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-11 pr-11"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={authBusy}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        disabled={authBusy}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="group w-full" size="lg" disabled={authBusy}>
                    {submitting ? 'A entrar...' : 'Entrar'}
                    <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <span className="w-full border-t border-foreground/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-[0.14em]">
                    <span className="bg-[hsl(var(--paper-strong))] px-3 text-muted-foreground">ou</span>
                  </div>
                </div>

                <GoogleSignInButton
                  onClick={handleGoogleLogin}
                  loading={googleLoading}
                  disabled={authBusy}
                />

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Não tem conta?{' '}
                    <Link to="/registar" className="font-medium text-primary hover:underline">
                      Criar conta de aluno
                    </Link>
                  </p>
                </div>

                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={handleClearSession}
                    className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    Problemas a entrar? Limpar sessão
                  </button>
                </div>

                <div className="glass-muted mt-6 rounded-[1.5rem] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Credenciais de demonstração (para avaliação/testes)
                  </p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      <strong>Administrador:</strong> admin@eventostc.test · Admin123!
                    </p>
                    <p>
                      <strong>Professor:</strong> professor@eventostc.test · Prof123!
                    </p>
                    <p className="opacity-80">
                      <strong>Aluno:</strong> pode criar uma conta em “Criar conta de aluno”
                    </p>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    ← Voltar à página inicial
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Login;
