/**
 * Origem da app para redirects OAuth.
 * Em produção (Vercel), define VITE_SITE_URL nas env vars do deploy.
 */
export function getAppOrigin(): string {
  if (typeof window === "undefined") return "";

  const { origin, hostname } = window.location;
  const siteUrl = import.meta.env.VITE_SITE_URL?.trim().replace(/\/$/, "");

  const isLocal =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";

  if (siteUrl && !isLocal) {
    return siteUrl;
  }

  return origin;
}

/** Destino após login OAuth. Deve estar na allowlist do Supabase (Authentication → URL Configuration). */
export function getPostLoginRedirectUrl(): string {
  return `${getAppOrigin()}/eventos`;
}
