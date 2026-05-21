import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getPostLoginRedirectUrl } from "@/lib/authRedirect";
import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "professor" | "aluno";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar?: string }) => Promise<void>;

  isAdmin: boolean;
  isProfessor: boolean;
  isAluno: boolean;
  canManageEvents: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

async function fetchProfile(user: User): Promise<AuthUser> {
  const { data } = await supabase
    .from("profiles")
    .select("id, email, name, role, avatar")
    .eq("id", user.id)
    .single();

  if (!data) {
    return {
      id: user.id,
      email: user.email ?? "",
      name: (user.user_metadata?.name as string) ?? "",
      role: "aluno",
    };
  }

  return {
    id: data.id,
    email: data.email ?? user.email ?? "",
    name: data.name ?? "",
    role: (data.role as UserRole) ?? "aluno",
    avatar: data.avatar ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {

        const { data } = await withTimeout(supabase.auth.getSession(), 6000);
        if (!mounted) return;

        setSession(data.session ?? null);

        const u = data.session?.user ?? null;
        if (u) setUser(await fetchProfile(u));
        else setUser(null);
      } catch {
        if (!mounted) return;
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      const u = newSession?.user ?? null;

      if (!u) {
        setUser(null);
        return;
      }

      // Evita deadlock: não chamar o client Supabase diretamente dentro deste callback.
      setTimeout(() => {
        void (async () => {
          try {
            setUser(await fetchProfile(u));
          } catch {
            setUser({
              id: u.id,
              email: u.email ?? "",
              name: (u.user_metadata?.name as string) ?? "",
              role: "aluno",
            });
          }
        })();
      }, 0);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15000,
      );
      return !error;
    } catch {
      return false;
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const redirectTo = getPostLoginRedirectUrl();
    sessionStorage.setItem("eventostc-oauth-redirect", redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error || !data.user) return false;

    await supabase.from("profiles").update({ name }).eq("id", data.user.id);
    return true;
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } finally {
      setSession(null);
      setUser(null);
      supabase.auth.signOut().catch(() => {});
    }
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string; avatar?: string }) => {
    const { data } = await supabase.auth.getSession();
    const u = data.session?.user;
    if (!u) return;

    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.avatar !== undefined) payload.avatar = updates.avatar;

    const { error } = await supabase.from("profiles").update(payload).eq("id", u.id);
    if (error) throw error;

    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const isAdmin = user?.role === "admin";
  const isProfessor = user?.role === "professor";
  const isAluno = user?.role === "aluno";
  const canManageEvents = isAdmin || isProfessor;

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      login,
      loginWithGoogle,
      register,
      logout,
      updateProfile,
      isAdmin,
      isProfessor,
      isAluno,
      canManageEvents,
    }),
    [user, session, loading, login, loginWithGoogle, register, logout, updateProfile, isAdmin, isProfessor, isAluno, canManageEvents]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}