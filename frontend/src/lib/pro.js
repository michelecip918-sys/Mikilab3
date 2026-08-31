import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/auth/AuthContext";

// MikiLab è 100% gratuito: ogni utente loggato ha accesso completo (nessun contenuto a pagamento).
export function useProStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setStatus(user?.email ? { pro: true } : { pro: false });
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);
  return { status, loading, reload };
}
