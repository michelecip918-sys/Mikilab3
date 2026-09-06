import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertOctagon, Check, Wrench, Loader2, ShieldAlert, History, Trophy } from "lucide-react";
import { toast } from "sonner";
import { bakoApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// CENTRO EMERGENZE del Capo (Neural Load Radar): raccoglie gli SOS del reparto con
// bagliore rosso pulsante, BakoMix li ANNUNCIA a voce, e genera una GUIDA RAPIDA di
// manutenzione in tempo reale (Claude) per la macchina in allarme.
export default function EmergencyCenter() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [events, setEvents] = useState([]);
  const [guides, setGuides] = useState({});
  const [loadingGuide, setLoadingGuide] = useState(null);
  const [hist, setHist] = useState(null);
  const [showHist, setShowHist] = useState(false);
  const seen = useRef(new Set());

  const loadHist = useCallback(async () => { try { setHist(await bakoApi.sosHistory(lang)); } catch { /* */ } }, [lang]);
  useEffect(() => { loadHist(); }, [loadHist]);

  const load = useCallback(async () => {
    try {
      const d = await bakoApi.sosList(lang);
      const evs = d.events || [];
      setEvents(evs);
      // Annuncio vocale SOLO per SOS nuovi (una volta).
      const fresh = evs.filter((e) => !seen.current.has(e.id));
      if (fresh.length) {
        fresh.forEach((e) => seen.current.add(e.id));
        toast.error(tri("SOS dal reparto!", "SOS aus der Produktion!", "SOS from the floor!", "¡SOS del taller!", "SOS de la production !", "SOS از تولید!"), { duration: 8000 });
        if (d.spoken) { try { playTTS(d.spoken, { lang, voice: "bakemix" }); } catch { /* */ } }
      }
    } catch { /* */ }
  }, [lang, tri]);

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, [load]);

  const ack = async (id) => {
    setEvents((es) => es.filter((e) => e.id !== id));
    try { await bakoApi.sosAck(id); } catch { /* */ } load(); loadHist();
  };

  const fmtDur = (s) => (s == null ? "—" : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`);

  const genGuide = async (ev) => {
    setLoadingGuide(ev.id);
    try {
      const r = await bakoApi.maintenanceGuide({ machine: ev.machine || ev.line, anomaly: ev.note || tri("SOS operatore", "Bediener-SOS", "operator SOS", "SOS operario", "SOS opérateur", "SOS اپراتور"), lang });
      setGuides((g) => ({ ...g, [ev.id]: r.guide }));
      if (r.guide?.spoken) { try { playTTS(r.guide.spoken, { lang, voice: "bakemix" }); } catch { /* */ } }
    } catch { toast.error(tri("Guida non disponibile", "Anleitung nicht verfügbar", "Guide unavailable", "Guía no disponible", "Guide indisponible", "راهنما در دسترس نیست")); }
    setLoadingGuide(null);
  };

  const active = events.length > 0;

  return (
    <div data-testid="emergency-center">
      {!active ? (
        <div data-testid="emergency-idle" className="flex items-center gap-3 py-2 text-sm text-[#7d97ac]">
          <ShieldAlert className="w-4 h-4 text-[#7DD3FC]" />
          {tri("Nessuna emergenza attiva. Il radar è in ascolto del reparto.", "Keine aktiven Notfälle. Der Radar hört mit.", "No active emergencies. The radar is listening to the floor.", "Sin emergencias activas. El radar escucha.", "Aucune urgence active. Le radar écoute.", "هیچ اضطراری فعالی نیست. رادار در حال گوش دادن است.")}
        </div>
      ) : (
        <motion.div
          data-testid="emergency-active"
          animate={{ boxShadow: ["0 0 0px rgba(244,63,94,0)", "0 0 26px rgba(244,63,94,0.55)", "0 0 0px rgba(244,63,94,0)"] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="rounded-2xl border border-[#f43f5e]/60 bg-[#f43f5e]/8 p-3 space-y-2"
        >
          <p className="text-[11px] font-black uppercase tracking-widest text-[#f43f5e] flex items-center gap-1.5"><AlertOctagon className="w-4 h-4" /> {events.length} {tri("SOS ATTIVI", "AKTIVE SOS", "ACTIVE SOS", "SOS ACTIVOS", "SOS ACTIFS", "SOS فعال")}</p>
          <AnimatePresence>
            {events.map((ev) => (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} data-testid={`sos-event-${ev.id}`} className="rounded-xl border border-[#f43f5e]/40 bg-[#030712] p-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex w-2.5 h-2.5"><span className="absolute inline-flex w-full h-full rounded-full bg-[#f43f5e] animate-ping opacity-60" /><span className="relative w-2.5 h-2.5 rounded-full bg-[#f43f5e]" /></span>
                  <p className="text-sm font-black text-white flex-1 min-w-0 truncate">{ev.operator}{ev.machine ? ` · ${ev.machine}` : ev.line ? ` · ${ev.line}` : ""}</p>
                  <span className="text-[10px] text-[#94A3B8]">{(ev.created_at || "").slice(11, 16)}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button data-testid={`sos-guide-${ev.id}`} onClick={() => genGuide(ev)} disabled={loadingGuide === ev.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#FFB800]/15 border border-[#FFB800]/50 text-[#FFB800] font-bold text-xs active:scale-95 disabled:opacity-50">
                    {loadingGuide === ev.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />} {tri("Guida Rapida", "Schnellanleitung", "Quick Guide", "Guía Rápida", "Guide Rapide", "راهنمای سریع")}
                  </button>
                  <button data-testid={`sos-ack-${ev.id}`} onClick={() => ack(ev.id)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/50 text-emerald-400 font-bold text-xs active:scale-95">
                    <Check className="w-3.5 h-3.5" /> {tri("Preso in carico", "Übernommen", "Handled", "Atendido", "Pris en charge", "رسیدگی شد")}
                  </button>
                </div>
                {guides[ev.id] && (
                  <div data-testid={`sos-guide-content-${ev.id}`} className="mt-2 rounded-lg border border-[#FFB800]/30 bg-[#FFB800]/5 p-2.5">
                    <p className="text-[12px] font-bold text-[#FFB800] mb-1">{guides[ev.id].summary}</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      {(guides[ev.id].steps || []).map((s, i) => (<li key={i} className="text-[12px] text-[#e6f6fa] leading-snug">{s}</li>))}
                    </ol>
                    {guides[ev.id].safety && <p className="mt-1.5 text-[11px] text-[#f43f5e] font-semibold">⚠ {guides[ev.id].safety}</p>}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {hist && hist.resolved_count > 0 && (
        <div className="mt-2">
          <button data-testid="sos-history-toggle" onClick={() => setShowHist((v) => !v)} className="w-full inline-flex items-center gap-1.5 text-[11px] font-bold text-[#7DD3FC] py-1.5">
            <History className="w-3.5 h-3.5" /> {tri("Storico & Reattività", "Verlauf & Reaktion", "History & Reactivity", "Historial & Reactividad", "Historique & Réactivité", "تاریخچه و واکنش")} ({hist.resolved_count}) {showHist ? "▲" : "▼"}
          </button>
          {showHist && (
            <div data-testid="sos-history" className="space-y-2 mt-1">
              {hist.leaderboard.length > 0 && (
                <div className="rounded-xl border border-[#FFB800]/30 bg-[#FFB800]/5 p-2.5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#FFB800] flex items-center gap-1.5 mb-1.5"><Trophy className="w-3.5 h-3.5" /> {tri("Reattività per turno", "Reaktion pro Schicht", "Reactivity per shift", "Reactividad por turno", "Réactivité par équipe", "واکنش هر شیفت")}</p>
                  {hist.leaderboard.map((b, i) => (
                    <div key={b.shift} data-testid={`sos-board-${b.shift}`} className="flex items-center justify-between text-[12px] text-white py-0.5">
                      <span className="capitalize">{i === 0 ? "🏆 " : ""}{b.shift} <span className="text-[#64748b]">({b.count})</span></span>
                      <span className="font-bold text-[#FFB800]">{fmtDur(b.avg_response_s)}</span>
                    </div>
                  ))}
                </div>
              )}
              {hist.history.slice(0, 8).map((h, i) => (
                <div key={i} data-testid={`sos-hist-${i}`} className="flex items-center gap-2 rounded-lg border border-[#1e293b] bg-[#030712] px-2.5 py-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[12px] text-white flex-1 min-w-0 truncate">{h.operator}{h.machine ? ` · ${h.machine}` : ""}</span>
                  <span className="text-[10px] text-[#64748b] capitalize">{h.shift}</span>
                  <span className="text-[11px] font-bold text-[#7DD3FC]">{fmtDur(h.response_seconds)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
