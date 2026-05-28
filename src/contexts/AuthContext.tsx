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
import { fallbackAuthUser, profileRowToAuthUser, type AuthUser, type ProfileRow, type UserRole } from "@/lib/authProfile";
import { supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";

export type { AuthUser, UserRole } from "@/lib/authProfile";

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  refreshSession: () => Promise<Session | null>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar?: string }) => Promise<void>;
  updateCredentials: (updates: { email?: string; password?: string }) => Promise<{ emailChanged: boolean }>;

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

function getStoredAccessToken(): string | null {
  const session = getStoredSession();
  return session?.access_token ?? null;
}

function getStoredSession(): Session | null {
  try {
    const raw = window.localStorage.getItem("eventostc-auth");
    if (!raw) return null;

    const session = JSON.parse(raw) as Session;
    const expiresAt = session.expires_at ?? 0;
    if (expiresAt && expiresAt * 1000 <= Date.now()) return null;

    return session.access_token && session.refresh_token && session.user ? session : null;
  } catch {
    return null;
  }
}

async function fetchProfile(user: User): Promise<AuthUser> {
  let data: ProfileRow | null = null;

  try {
    const result = await withTimeout(
      supabase
        .from("profiles")
        .select("id, email, name, role, avatar")
        .eq("id", user.id)
        .single(),
      2500,
    );
    data = result.data;
  } catch {
    const token = getStoredAccessToken();
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=id,email,name,role,avatar`, {
      headers: {
        apikey: supabaseAnonKey,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.ok) {
      const rows = (await response.json()) as ProfileRow[];
      data = rows[0] ?? null;
    }
  }

  if (!data) {
    return fallbackAuthUser(user);
  }

  return profileRowToAuthUser(data, user.email ?? "");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);

    const u = nextSession?.user ?? null;
    if (!u) {
      setUser(null);
      return;
    }

    setUser(fallbackAuthUser(u));

    void withTimeout(fetchProfile(u), 2500)
      .then((profile) => setUser(profile))
      .catch(() => {});
  }, []);

  const refreshSession = useCallback(async () => {
    const storedSession = getStoredSession();
    if (storedSession) {
      await applySession(storedSession);
      return storedSession;
    }

    try {
      const { data } = await withTimeout(supabase.auth.getSession(), 6000);
      const nextSession = data.session ?? null;
      await applySession(nextSession);
      return nextSession;
    } catch {
      await applySession(null);
      return null;
    }
  }, [applySession]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!mounted) return;
        await refreshSession();
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
      setUser(fallbackAuthUser(u));

      setTimeout(() => {
        void (async () => {
          try {
            setUser(await withTimeout(fetchProfile(u), 5000));
          } catch {
            setUser(fallbackAuthUser(u));
          }
        })();
      }, 0);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15000,
      );
      if (error || !data.session) return false;

      window.localStorage.setItem("eventostc-auth", JSON.stringify(data.session));
      await applySession(data.session);
      return true;
    } catch {
      return false;
    }
  }, [applySession]);

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
    window.localStorage.removeItem("eventostc-auth");
    window.sessionStorage.removeItem("eventostc-oauth-redirect");
    setSession(null);
    setUser(null);

    withTimeout(supabase.auth.signOut({ scope: "local" }), 3000).catch(() => {});
    withTimeout(supabase.auth.signOut(), 3000).catch(() => {});
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string; avatar?: string }) => {
    const { data } = await supabase.auth.getSession();
    const u = data.session?.user;
    if (!u) return;

    const payload: Record<string, string> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.avatar !== undefined) payload.avatar = updates.avatar;

    const { error } = await supabase.from("profiles").update(payload).eq("id", u.id);
    if (error) throw error;

    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const updateCredentials = useCallback(async (updates: { email?: string; password?: string }) => {
    const payload: { email?: string; password?: string } = {};
    if (updates.email) payload.email = updates.email;
    if (updates.password) payload.password = updates.password;
    if (!payload.email && !payload.password) return { emailChanged: false };

    const { data, error } = await supabase.auth.updateUser(payload);
    if (error) throw error;

    const updatedUser = data.user;
    const nextEmail = updatedUser?.email ?? "";
    const emailChanged = Boolean(payload.email && nextEmail.toLowerCase() === payload.email.toLowerCase());

    if (emailChanged && updatedUser) {
      await supabase.from("profiles").update({ email: nextEmail }).eq("id", updatedUser.id);
      setUser((prev) => (prev ? { ...prev, email: nextEmail } : prev));
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      window.localStorage.setItem("eventostc-auth", JSON.stringify(sessionData.session));
      setSession(sessionData.session);
    }

    return { emailChanged };
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
      refreshSession,
      register,
      logout,
      updateProfile,
      updateCredentials,
      isAdmin,
      isProfessor,
      isAluno,
      canManageEvents,
    }),
    [user, session, loading, login, loginWithGoogle, refreshSession, register, logout, updateProfile, updateCredentials, isAdmin, isProfessor, isAluno, canManageEvents]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
