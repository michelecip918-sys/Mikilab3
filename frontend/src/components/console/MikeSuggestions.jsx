import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Flame, AlertOctagon, Waves, Truck, Container, ShoppingCart, ChevronRight, CheckCircle2, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { mikeApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const ICON = { flame: Flame, alert: AlertOctagon, waves: Waves, truck: Truck, container: Container, cart: ShoppingCart };
const SEV = { alto: "#f43f5e", medio: "#FFB800", info: "#FF9D42" };
// Azioni eseguibili in UN CLIC direttamente dalla card (pilota automatico assistito).
const EXEC = {
  silos: async () => { const r = await mikeApi.siloMicroorder(); return { kind: "silos", ...r }; },
  b2b: async () => { const r = await mikeApi.b2bToPlan(); try { window.dispatchEvent(new CustomEvent("mikilab-prefill-orders", { detail: { text: r.orders_text } })); } catch { /* */ } return { kind: "b2b", ...r }; },
};

// Mike Mix · Suggerimenti predittivi: il "cervello" unico dell'impianto propone azioni concrete.
export default function MikeSuggestions() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [sug, setSug] = useState([]);
  const [busy, setBusy] = useState(null);
  const [autopilot, setAutopilot] = useState(false);
  const [autoActions, setAutoActions] = useState([]);
  const spokenRef = useRef("");

  const load = useCallback(async () => {
    try {
      const d = await mikeApi.suggestions(lang);
      setSug(d.suggestions || []);
      setAutopilot(!!d.autopilot);
      setAutoActions(d.autopilot_actions || []);
      const key = (d.suggestions || []).map((s) => s.id).join(",");
      if (key && spokenRef.current !== key) { spokenRef.current = key; try { playTTS(d.spoken, { lang, voice: "bakemix" }); } catch { /* */ } }
      if (!key) spokenRef.current = "";
    } catch { /* */ }
  }, [lang]);
  useEffect(() => { load(); const iv = setInterval(load, 10000); return () => clearInterval(iv); }, [load]);

  const toggleAuto = async (e) => {
    e.stopPropagation();
    const next = !autopilot; setAutopilot(next);
    try { await mikeApi.autopilotSet(next); toast.success(next ? tri("Auto-pilota Mike Mix attivo", "Autopilot aktiv", "Mike Mix autopilot on", "Piloto automático activo", "Pilote auto activé", "خلبان خودکار فعال") : tri("Auto-pilota disattivato", "Autopilot aus", "Autopilot off", "Piloto desactivado", "Pilote désactivé", "خلبان خاموش")); load(); } catch { setAutopilot(!next); }
  };

  const goTo = (target) => {
    const el = document.querySelector(`[data-testid="${target}"]`);
    if (!el) return;
    el.style.display = "";
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => { try { el.click(); } catch { /* */ } }, 400); // espande il pannello
  };

  const exec = async (s, e) => {
    e.stopPropagation();
    const fn = EXEC[s.id];
    if (!fn) return;
    setBusy(s.id);
    try {
      const r = await fn();
      let msg;
      if (r.kind === "silos") msg = r.emailed ? tri(`Micro-ordini inviati a ${r.supplier}`, `Micro-Aufträge an ${r.supplier}`, `Micro-orders emailed to ${r.supplier}`, `Micro-pedidos a ${r.supplier}`, `Micro-commandes à ${r.supplier}`, `میکرو سفارش به ${r.supplier}`) : tri(`Micro-ordini generati: ${r.count}`, `Micro-Aufträge: ${r.count}`, `Micro-orders: ${r.count}`, `Micro-pedidos: ${r.count}`, `Micro-commandes: ${r.count}`, `میکرو سفارش: ${r.count}`);
      else msg = tri(`Piano aggiornato: ${r.total_dough_kg} kg d'impasto`, `Plan aktualisiert: ${r.total_dough_kg} kg Teig`, `Plan updated: ${r.total_dough_kg} kg dough`, `Plan: ${r.total_dough_kg} kg masa`, `Plan: ${r.total_dough_kg} kg pâte`, `برنامه: ${r.total_dough_kg} کیلو خمیر`);
      toast.success(msg); load();
    } catch { toast.error(tri("Azione non riuscita", "Aktion fehlgeschlagen", "Action failed", "Acción fallida", "Échec", "ناموفق")); }
    setBusy(null);
  };

  return (
    <div data-testid="mike-suggestions" className="rounded-2xl border border-[#FF6B00]/40 bg-gradient-to-br from-[#FF6B00]/8 to-transparent p-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#FF6B00] flex items-center gap-1.5 mb-2"><Brain className="w-3.5 h-3.5" /> {tri("Mike Mix · Suggerimenti", "Mike Mix · Vorschläge", "Mike Mix · Suggestions", "Mike Mix · Sugerencias", "Mike Mix · Suggestions", "بوکومیکس · پیشنهادها")}
        <button data-testid="autopilot-toggle" onClick={toggleAuto} className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${autopilot ? "bg-[#22c55e]/20 border-[#22c55e]/60 text-[#22c55e]" : "bg-[#030712] border-[#1e293b] text-[#64748b]"}`}>
          <Zap className="w-3 h-3" /> {tri("Auto-pilota", "Autopilot", "Autopilot", "Auto", "Auto", "خودکار")} {autopilot ? "ON" : "OFF"}
        </button>
      </p>
      {autoActions.map((a, i) => (
        <p key={i} data-testid={`autopilot-action-${i}`} className="mb-2 text-[12px] text-[#22c55e] font-semibold flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> {a}</p>
      ))}
      {sug.length === 0 ? (
        <p data-testid="suggestions-clear" className="flex items-center gap-2 text-sm text-emerald-300/90"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> {tri("Tutto sotto controllo. Impianto fluido.", "Alles im Griff.", "All under control. Plant nominal.", "Todo bajo control.", "Tout sous contrôle.", "همه‌چیز تحت کنترل.")}</p>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {sug.map((s) => {
              const Icon = ICON[s.icon] || Brain;
              const col = SEV[s.severity] || "#FF9D42";
              return (
                <motion.button key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  data-testid={`suggestion-${s.id}`} onClick={() => goTo(s.target)}
                  className="w-full flex items-center gap-2.5 text-left rounded-xl border p-2.5 active:scale-98 transition-all" style={{ borderColor: `${col}44`, background: `${col}0a` }}>
                  <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${col}1a`, border: `1px solid ${col}55` }}><Icon className="w-4 h-4" style={{ color: col }} /></span>
                  <span className="flex-1 min-w-0 text-[13px] text-white leading-snug">{s.text}</span>
                  {EXEC[s.id] ? (
                    <span data-testid={`suggestion-exec-${s.id}`} onClick={(e) => exec(s, e)} className="shrink-0 inline-flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg" style={{ color: "#060A10", background: col }}>
                      {busy === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} {tri("Esegui", "Ausführen", "Run", "Ejecutar", "Exécuter", "اجرا")}
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-bold" style={{ color: col }}>{s.action} <ChevronRight className="w-3.5 h-3.5" /></span>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
