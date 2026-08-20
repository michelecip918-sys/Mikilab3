import { useEffect, useState, useCallback } from "react";
import { subscriptionApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";

// Stato PRO dell'utente (deriva dalla sessione lato server, non dall'email nel client).
export function useProStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      if (!user?.email) setStatus({ pro: false });
      else setStatus(await subscriptionApi.status());
    } catch {
      setStatus({ pro: false });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { reload(); }, [reload]);
  return { status, loading, reload };
}
