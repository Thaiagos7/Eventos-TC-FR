import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, ArrowRight, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import escolaBg from '@/assets/escola-bg.jpg';
import loginLogoDark from '@/assets/login-logo-dark.png';

const Registar = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      toast.error('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setSubmitting(true);
      const ok = await register(name.trim(), email.trim(), password);

      if (ok) {
        toast.success('Conta criada com sucesso!', {
          description: 'Se a confirmação por email estiver ativada, confirme o email para poder entrar.',
        });
        navigate('/login');
      } else {
        toast.error('Não foi possível criar a conta.', {
          description: 'Verifique o email e tente novamente.',
        });
      }
    } catch (err) {
      toast.error('Erro ao criar conta.', {
        description: err instanceof Error ? err.message : 'Tente novamente.',
      });
    } finally {
      setSubmitting(false);
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
                    Criar Conta
                  </h2>
                </div>

                <div className="relative z-10 mt-8 space-y-4 lg:mt-10">
                  <div className="paper-frame mx-auto max-w-[25rem] rotate-[3deg] bg-white">
                    <img src={escolaBg} alt="Escola" className="h-64 w-full object-[58%_50%]" />
                  </div>
                  <div className="paper-note max-w-[15rem] rotate-[-3deg] px-4 py-3 text-left text-foreground">
                    <p className="font-display text-sm font-black uppercase tracking-[-0.03em]">Registe-se como aluno</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-foreground/70">Para se inscrever.</p>
                  </div>
                </div>
              </aside>

              <div className="glass-card rounded-[2.1rem] p-6 md:p-8">
                <div className="mb-8 flex items-center">
                  <img src={loginLogoDark} alt="Eventos TC" className="h-16 w-auto shrink-0 object-contain" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <div className="relative">
                      <UserPlus className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="O seu nome"
                        className="pl-11"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                  </div>

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
                        disabled={submitting}
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
                        placeholder="Mínimo 6 caracteres"
                        className="pl-11 pr-11"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        disabled={submitting}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="group w-full" size="lg" disabled={submitting}>
                    {submitting ? 'A criar...' : 'Criar Conta'}
                    <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Já tem conta?{' '}
                    <Link to="/login" className="font-medium text-primary hover:underline">
                      Entrar
                    </Link>
                  </p>
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

export default Registar;
