import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function hasOAuthHash(): boolean {
  const hash = window.location.hash;
  return hash.includes("access_token") || hash.includes("error=");
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return JSON.parse(window.atob(padded));
}

function persistOAuthSession(hashParams: URLSearchParams): boolean {
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  if (!accessToken || !refreshToken) return false;

  const payload = decodeJwtPayload(accessToken);
  const expiresIn = Number(hashParams.get("expires_in") ?? 3600);
  const expiresAt = Number(hashParams.get("expires_at") ?? Math.floor(Date.now() / 1000) + expiresIn);

  window.localStorage.setItem(
    "eventostc-auth",
    JSON.stringify({
      access_token: accessToken,
      token_type: hashParams.get("token_type") ?? "bearer",
      expires_in: expiresIn,
      expires_at: expiresAt,
      refresh_token: refreshToken,
      provider_token: hashParams.get("provider_token") ?? undefined,
      user: {
        id: payload.sub,
        aud: payload.aud,
        role: payload.role,
        email: payload.email,
        phone: payload.phone ?? "",
        app_metadata: payload.app_metadata ?? {},
        user_metadata: payload.user_metadata ?? {},
      },
    }),
  );

  return true;
}

/** Após OAuth (Google), limpa o hash da URL e envia o utilizador para /eventos. */
export function OAuthCallbackHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasOAuthHash()) return;

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const error = hashParams.get("error_description") ?? hashParams.get("error");
    if (error) {
      window.history.replaceState(null, "", window.location.pathname);
      navigate("/login", { replace: true, state: { oauthError: error } });
      return;
    }

    const path = window.location.pathname + window.location.search;
    const persisted = persistOAuthSession(hashParams);

    window.history.replaceState(null, "", path);

    if (persisted) {
      window.location.replace(path || "/eventos");
      return;
    }

    navigate("/eventos", { replace: true });
  }, [navigate]);

  return null;
}
