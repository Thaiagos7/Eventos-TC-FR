import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "professor" | "aluno";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface ProfileRow {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  avatar?: string | null;
}

export function formatProfessorName(name: string): string {
  const cleaned = name.trim();
  if (!cleaned || cleaned.toLowerCase() === "professor") return "Professor";
  if (/^(prof\.?|professor)\b/i.test(cleaned)) return cleaned;
  return `Prof. ${cleaned}`;
}

export function fallbackAuthUser(user: User): AuthUser {
  const email = user.email ?? "";
  const role: UserRole =
    email === "admin@eventostc.test"
      ? "admin"
      : email === "professor@eventostc.test"
        ? "professor"
        : "aluno";
  const metadataName =
    (user.user_metadata?.name as string) ??
    (user.user_metadata?.full_name as string) ??
    "";
  const emailName = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() ?? "";
  const displayName =
    role === "admin"
      ? "Administrador"
      : role === "professor"
        ? formatProfessorName(metadataName || emailName)
        : metadataName || email || "";

  return {
    id: user.id,
    email,
    name: displayName,
    avatar:
      (user.user_metadata?.avatar_url as string) ??
      (user.user_metadata?.picture as string) ??
      undefined,
    role,
  };
}

export function profileRowToAuthUser(data: ProfileRow, fallbackEmail = ""): AuthUser {
  return {
    id: data.id,
    email: data.email ?? fallbackEmail,
    name:
      data.role === "admin"
        ? "Administrador"
        : data.role === "professor"
          ? formatProfessorName(data.name || data.email || "")
          : data.name ?? "",
    role: (data.role as UserRole) ?? "aluno",
    avatar: data.avatar ?? undefined,
  };
}
