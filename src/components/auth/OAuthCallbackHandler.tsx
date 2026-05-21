import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

function hasOAuthHash(): boolean {
  const hash = window.location.hash;
  return hash.includes("access_token") || hash.includes("error=");
}

/** Após OAuth (Google), limpa o hash da URL e envia o utilizador para /eventos. */
export function OAuthCallbackHandler() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!hasOAuthHash()) return;
    if (loading) return;

    if (session) {
      const path = window.location.pathname + window.location.search;
      window.history.replaceState(null, "", path);
      navigate("/eventos", { replace: true });
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const error = hashParams.get("error_description") ?? hashParams.get("error");
    if (error) {
      window.history.replaceState(null, "", window.location.pathname);
      navigate("/login", { replace: true, state: { oauthError: error } });
    }
  }, [session, loading, navigate]);

  return null;
}
