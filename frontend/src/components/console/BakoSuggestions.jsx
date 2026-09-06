import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Flame, AlertOctagon, Waves, Truck, Container, ShoppingCart, ChevronRight, CheckCircle2 } from "lucide-react";
import { bakoApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const ICON = { flame: Flame, alert: AlertOctagon, waves: Waves, truck: Truck, container: Container, cart: ShoppingCart };
const SEV = { alto: "#f43f5e", medio: "#FFB800", info: "#7DD3FC" };

// BakoMix · Suggerimenti predittivi: il "cervello" unico dell'impianto propone azioni concrete.
export default function BakoSuggestions() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [sug, setSug] = useState([]);
  const spokenRef = useRef("");

  const load = useCallback(async () => {
    try {
      const d = await bakoApi.suggestions(lang);
      setSug(d.suggestions || []);
      const key = (d.suggestions || []).map((s) => s.id).join(",");
      if (key && spokenRef.current !== key) { spokenRef.current = key; try { playTTS(d.spoken, { lang, voice: "bakemix" }); } catch { /* */ } }
      if (!key) spokenRef.current = "";
    } catch { /* */ }
  }, [lang]);
  useEffect(() => { load(); const iv = setInterval(load, 10000); return () => clearInterval(iv); }, [load]);

  const goTo = (target) => {
    const el = document.querySelector(`[data-testid="${target}"]`);
    if (!el) return;
    el.style.display = "";
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => { try { el.click(); } catch { /* */ } }, 400); // espande il pannello
  };

  return (
    <div data-testid="bako-suggestions" className="rounded-2xl border border-[#00F0FF]/40 bg-gradient-to-br from-[#00F0FF]/8 to-transparent p-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#00F0FF] flex items-center gap-1.5 mb-2"><Brain className="w-3.5 h-3.5" /> {tri("BakoMix · Suggerimenti", "BakoMix · Vorschläge", "BakoMix · Suggestions", "BakoMix · Sugerencias", "BakoMix · Suggestions", "بوکومیکس · پیشنهادها")}</p>
      {sug.length === 0 ? (
        <p data-testid="suggestions-clear" className="flex items-center gap-2 text-sm text-emerald-300/90"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> {tri("Tutto sotto controllo. Impianto fluido.", "Alles im Griff.", "All under control. Plant nominal.", "Todo bajo control.", "Tout sous contrôle.", "همه‌چیز تحت کنترل.")}</p>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {sug.map((s) => {
              const Icon = ICON[s.icon] || Brain;
              const col = SEV[s.severity] || "#7DD3FC";
              return (
                <motion.button key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  data-testid={`suggestion-${s.id}`} onClick={() => goTo(s.target)}
                  className="w-full flex items-center gap-2.5 text-left rounded-xl border p-2.5 active:scale-98 transition-all" style={{ borderColor: `${col}44`, background: `${col}0a` }}>
                  <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${col}1a`, border: `1px solid ${col}55` }}><Icon className="w-4 h-4" style={{ color: col }} /></span>
                  <span className="flex-1 min-w-0 text-[13px] text-white leading-snug">{s.text}</span>
                  <span className="shrink-0 inline-flex items-center gap-0.5 text-[11px] font-bold" style={{ color: col }}>{s.action} <ChevronRight className="w-3.5 h-3.5" /></span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
