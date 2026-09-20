import { useState, useEffect, useCallback } from "react";
import { Inbox, RefreshCw, Check, X, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;

// FASE 2 · Inbox delle richieste d'accesso smistate da MOHAMED (assistente subordinato).
export default function MohamedInbox() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [reqs, setReqs] = useState([]);
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pins, setPins] = useState({});

  const load = useCallback(async () => {
    setBusy(true);
    try { const { data } = await api.get("/mike/access-requests"); setReqs(data.requests || []); setPending(data.pending || 0); } catch { /* */ }
    setBusy(false);
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const act = async (id, status) => {
    try { const { data } = await api.post("/mike/access-requests/act", { id, status }); if (data && data.guest_pin) setPins((p) => ({ ...p, [id]: data.guest_pin })); } catch { /* */ }
    load();
  };

  const catColor = { formazione: "hsl(var(--muted-foreground))", logistica: "hsl(var(--muted-foreground))", partner: "hsl(var(--accent))", generico: "hsl(var(--muted-foreground))" };

  return (
    <div data-testid="mohamed-inbox" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={`${PUB}/sitor_official.webp`} alt="Sitor" className="w-9 h-9 rounded-full object-cover border border-border/50 grayscale-[0.2]" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div>
            <h4 className="font-display text-sm font-black text-foreground uppercase tracking-wide">{tri("Inbox Accessi", "Zugangs-Postfach", "Access Inbox", "Bandeja de Accesos", "Boîte d'accès", "صندوق دسترسی")}</h4>
            <p className="text-[10px] text-muted-foreground">{tri("Smistate da Sitor · assistente subordinato", "Sortiert von Sitor · untergeordnet", "Routed by Sitor · subordinate assistant", "Clasificadas por Sitor", "Triées par Sitor", "توسط محمد")}</p>
          </div>
        </div>
        <button data-testid="inbox-refresh" onClick={load} className="text-muted-foreground active:scale-90"><RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /></button>
      </div>
      {reqs.length === 0 ? (
        <p data-testid="inbox-empty" className="text-[12px] text-muted-foreground">{tri("Nessuna richiesta in arrivo.", "Keine Anfragen.", "No incoming requests.", "Sin solicitudes.", "Aucune demande.", "درخواستی نیست.")}</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {reqs.map((r) => (
            <div key={r.id} data-testid={`inbox-req-${r.id}`} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-bold text-foreground truncate">{r.email}</span>
                <span className="shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded" style={{ color: catColor[r.category] || "hsl(var(--muted-foreground))", background: `${catColor[r.category] || "hsl(var(--muted-foreground))"}18` }}>{r.category}</span>
              </div>
              {r.note && <p className="mt-1 text-[11.5px] text-foreground leading-snug">{r.note}</p>}
              {pins[r.id] && (
                <div data-testid={`inbox-pin-${r.id}`} className="mt-2 flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/40 px-2.5 py-1.5">
                  <span className="text-[10px] text-foreground font-bold uppercase tracking-wide">{tri("PIN ospite", "Gast-PIN", "Guest PIN", "PIN invitado", "PIN invité", "پین مهمان")}:</span>
                  <span className="font-display text-base font-black text-foreground tracking-[0.25em]">{pins[r.id]}</span>
                  <button onClick={() => { try { navigator.clipboard.writeText(pins[r.id]); } catch { /* */ } }} className="ml-auto text-[10px] font-bold text-muted-foreground active:scale-95">{tri("Copia", "Kopieren", "Copy", "Copiar", "Copier", "کپی")}</button>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: r.status === "approvata" ? "hsl(var(--accent))" : r.status === "rifiutata" ? "hsl(var(--mattone))" : "hsl(var(--muted-foreground))" }}>{r.status}{r.priority === "alta" ? " · ⚡" : ""}</span>
                {r.status === "nuova" && (
                  <div className="flex gap-1.5">
                    <button data-testid={`inbox-approve-${r.id}`} onClick={() => act(r.id, "approvata")} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-accent/15 border border-accent/40 text-accent text-[10px] font-bold active:scale-95"><Check className="w-3 h-3" /> {tri("Approva", "OK", "Approve", "Aprobar", "Approuver", "تأیید")}</button>
                    <button data-testid={`inbox-reject-${r.id}`} onClick={() => act(r.id, "rifiutata")} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-mattone/15 border border-mattone/40 text-mattone text-[10px] font-bold active:scale-95"><X className="w-3 h-3" /> {tri("Rifiuta", "Ablehnen", "Reject", "Rechazar", "Refuser", "رد")}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {pending > 0 && <p className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" /> {pending} {tri("in attesa della Direzione", "warten auf den Chef", "awaiting the Capo", "esperando al Capo", "en attente du Capo", "منتظر کاپو")}</p>}
    </div>
  );
}
