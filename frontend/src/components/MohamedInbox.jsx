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

  const catColor = { formazione: "#9aa6b2", logistica: "#a4afbb", partner: "#6e9e85", generico: "#94A3B8" };

  return (
    <div data-testid="mohamed-inbox" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={`${PUB}/avatar_nexus.jpg`} alt="Sitor" className="w-9 h-9 rounded-full object-cover border border-[#64748B]/50 grayscale-[0.2]" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div>
            <h4 className="font-cyber text-sm font-black text-white uppercase tracking-wide">{tri("Inbox Accessi", "Zugangs-Postfach", "Access Inbox", "Bandeja de Accesos", "Boîte d'accès", "صندوق دسترسی")}</h4>
            <p className="text-[10px] text-[#94A3B8]">{tri("Smistate da Sitor · assistente subordinato", "Sortiert von Sitor · untergeordnet", "Routed by Sitor · subordinate assistant", "Clasificadas por Sitor", "Triées par Sitor", "توسط محمد")}</p>
          </div>
        </div>
        <button data-testid="inbox-refresh" onClick={load} className="text-[#9aa6b2] active:scale-90"><RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /></button>
      </div>
      {reqs.length === 0 ? (
        <p data-testid="inbox-empty" className="text-[12px] text-[#94A3B8]">{tri("Nessuna richiesta in arrivo.", "Keine Anfragen.", "No incoming requests.", "Sin solicitudes.", "Aucune demande.", "درخواستی نیست.")}</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {reqs.map((r) => (
            <div key={r.id} data-testid={`inbox-req-${r.id}`} className="rounded-lg border border-[#1e293b] bg-[#060A10] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-bold text-white truncate">{r.email}</span>
                <span className="shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded" style={{ color: catColor[r.category] || "#94A3B8", background: `${catColor[r.category] || "#94A3B8"}18` }}>{r.category}</span>
              </div>
              {r.note && <p className="mt-1 text-[11.5px] text-[#CBD5E1] leading-snug">{r.note}</p>}
              {pins[r.id] && (
                <div data-testid={`inbox-pin-${r.id}`} className="mt-2 flex items-center gap-2 rounded-lg bg-[#6e9e85]/10 border border-[#6e9e85]/40 px-2.5 py-1.5">
                  <span className="text-[10px] text-[#86efac] font-bold uppercase tracking-wide">{tri("PIN ospite", "Gast-PIN", "Guest PIN", "PIN invitado", "PIN invité", "پین مهمان")}:</span>
                  <span className="font-cyber text-base font-black text-white tracking-[0.25em]">{pins[r.id]}</span>
                  <button onClick={() => { try { navigator.clipboard.writeText(pins[r.id]); } catch { /* */ } }} className="ml-auto text-[10px] font-bold text-[#9aa6b2] active:scale-95">{tri("Copia", "Kopieren", "Copy", "Copiar", "Copier", "کپی")}</button>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: r.status === "approvata" ? "#6e9e85" : r.status === "rifiutata" ? "#b06e78" : "#a6b1bc" }}>{r.status}{r.priority === "alta" ? " · ⚡" : ""}</span>
                {r.status === "nuova" && (
                  <div className="flex gap-1.5">
                    <button data-testid={`inbox-approve-${r.id}`} onClick={() => act(r.id, "approvata")} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#6e9e85]/15 border border-[#6e9e85]/40 text-[#6e9e85] text-[10px] font-bold active:scale-95"><Check className="w-3 h-3" /> {tri("Approva", "OK", "Approve", "Aprobar", "Approuver", "تأیید")}</button>
                    <button data-testid={`inbox-reject-${r.id}`} onClick={() => act(r.id, "rifiutata")} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#b06e78]/15 border border-[#b06e78]/40 text-[#b06e78] text-[10px] font-bold active:scale-95"><X className="w-3 h-3" /> {tri("Rifiuta", "Ablehnen", "Reject", "Rechazar", "Refuser", "رد")}</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {pending > 0 && <p className="flex items-center gap-1 text-[10px] text-[#a6b1bc]"><Clock className="w-3 h-3" /> {pending} {tri("in attesa del Capo", "warten auf den Chef", "awaiting the Capo", "esperando al Capo", "en attente du Capo", "منتظر کاپو")}</p>}
    </div>
  );
}
