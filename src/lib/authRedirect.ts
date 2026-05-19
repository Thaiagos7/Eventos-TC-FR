/** Destino após login OAuth (email ou Google). Deve estar na allowlist do Supabase. */
export function getPostLoginRedirectUrl(): string {
  return `${window.location.origin}/eventos`;
}
