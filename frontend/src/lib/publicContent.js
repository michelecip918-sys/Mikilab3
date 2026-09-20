import { useState, useEffect } from "react";
import { api } from "@/lib/api";

// Contenuti pubblici disponibili: mostra i pulsanti solo se c'è qualcosa di pubblicato.
// Cache a livello di modulo: una sola serie di richieste per sessione.
let cache = null;
let inflight = null;

async function loadFlags() {
  const flags = { hasCalendario: false, hasFarine: false, hasTestMese: false, hasLive: false, hasPerche: false };
  try {
    const r = await api.get("/bread-calendar");
    flags.hasCalendario = Array.isArray(r.data?.events) && r.data.events.length > 0;
  } catch { /* */ }
  try {
    const r = await api.get("/flour-types");
    flags.hasFarine = r.data?.published === true;
  } catch { /* */ }
  try {
    const r = await api.get("/experiments");
    flags.hasTestMese = !!r.data?.open || (Array.isArray(r.data?.archive) && r.data.archive.some((a) => a && a.results));
  } catch { /* */ }
  try {
    const r = await api.get("/live");
    flags.hasLive = !!(r.data?.current || r.data?.next);
  } catch { /* */ }
  try {
    const r = await api.get("/site-pages/perche");
    flags.hasPerche = !!(r.data && (r.data.published !== false) && (r.data.title || r.data.body || r.data.slug));
  } catch { /* */ }
  return flags;
}

export function usePublicContent() {
  const [flags, setFlags] = useState(cache);
  useEffect(() => {
    if (cache) { setFlags(cache); return; }
    if (!inflight) inflight = loadFlags().then((f) => { cache = f; return f; });
    let stop = false;
    inflight.then((f) => { if (!stop) setFlags(f); });
    return () => { stop = true; };
  }, []);
  return flags; // null finché non caricato
}
