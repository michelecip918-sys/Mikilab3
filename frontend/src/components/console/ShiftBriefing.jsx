import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bakoApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { X } from "lucide-react";

const PUB = process.env.PUBLIC_URL;
const STRESS = { calmo: "#7DD3FC", medio: "#FFB800", alto: "#f43f5e" };

// FASE 1 — Cyber-Trio: briefing d'apertura turno. Avatar olografici che REAGISCONO
// allo stress dell'impianto (colore/pulsazione) e parlano in sequenza (hands-free).
export default function ShiftBriefing({ onClose }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [data, setData] = useState(null);
  const [active, setActive] = useState(-1);
  const timers = useRef([]);

  useEffect(() => {
    bakoApi.briefing(lang).then((d) => {
      setData(d);
      (d.lines || []).forEach((ln, i) => {
        const t = setTimeout(() => { setActive(i); try { playTTS(ln.text, { lang, voice: i === 2 ? "bakemix" : "mohamed" }); } catch (e) { /* */ } }, i * 4800);
        timers.current.push(t);
      });
    }).catch(() => onClose && onClose());
    return () => timers.current.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stressColor = STRESS[data?.level] || "#7DD3FC";

  return (
    <div data-testid="shift-briefing" className="fixed inset-0 z-[90] bg-[#050810]/97 backdrop-blur-xl flex flex-col items-center justify-center p-5 overflow-auto">
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(70% 55% at 50% 40%, ${stressColor}22, transparent 70%)` }} />
      <button data-testid="briefing-close" aria-label={tri("Chiudi briefing", "Briefing schließen", "Close briefing", "Cerrar briefing", "Fermer", "بستن")} onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[#0C1019] border border-[#5E8CA8]/40 text-[#9fc3dc] flex items-center justify-center active:scale-90"><X className="w-5 h-5" /></button>

      <p className="relative font-cyber text-xs tracking-[0.35em] uppercase mb-1" style={{ color: stressColor }}>{tri("Apertura Turno", "Schichtbeginn", "Shift Open", "Apertura de Turno", "Ouverture", "شروع شیفت")}</p>
      <h2 className="relative font-cyber text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mb-1">Cyber-Trio</h2>
      {data && <p className="relative font-mono-data text-[11px] tracking-widest uppercase mb-8" style={{ color: stressColor }}>{tri("Stato impianto", "Anlagenstatus", "Plant status", "Estado planta", "État usine", "وضعیت")}: {data.level} · {data.stats.workers} op · {data.stats.leaders} {tri("linee","Linien","lines","líneas","lignes","خط")} · {data.stats.low_stock} {tri("scorte basse","niedrig","low stock","stock bajo","stock bas","کم")}</p>}

      <div className="relative flex items-end justify-center gap-4 sm:gap-8 mb-8">
        {(data?.lines || [{ avatar: "avatar_miki.jpg" }, { avatar: "avatar_mohamed.jpg" }, { avatar: "avatar_bigmix.jpg" }]).map((ln, i) => {
          const on = active === i;
          const c = ln.accent || "#5E8CA8";
          return (
            <div key={i} data-testid={`briefing-avatar-${i}`} className="flex flex-col items-center">
              <motion.div animate={{ scale: on ? 1.12 : 1, opacity: on ? 1 : 0.55 }} transition={{ duration: 0.5 }} className="relative">
                <motion.span aria-hidden className="absolute -inset-2 rounded-full" style={{ background: `radial-gradient(circle, ${on ? stressColor : c}66, transparent 70%)` }}
                  animate={{ scale: on ? [1, 1.15, 1] : 1, opacity: on ? [0.6, 1, 0.6] : 0.4 }} transition={{ duration: 1.4, repeat: on ? Infinity : 0 }} />
                <img src={`${PUB}/${ln.avatar}`} alt={ln.who || ""} className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover object-top" style={{ border: `2px solid ${on ? stressColor : c}`, boxShadow: `0 0 ${on ? 30 : 14}px ${on ? stressColor : c}88` }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                {on && (
                  <div data-testid={`briefing-mouth-${i}`} aria-hidden className="absolute left-1/2 -translate-x-1/2 bottom-2 flex items-end gap-[3px] h-4">
                    {[0, 1, 2, 3, 4].map((b) => (
                      <motion.span key={b} className="w-[3px] rounded-full" style={{ background: stressColor }}
                        animate={{ height: [4, 14, 6, 12, 4] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: b * 0.09, ease: "easeInOut" }} />
                    ))}
                  </div>
                )}
              </motion.div>
              <span className="mt-2 font-cyber text-[10px] sm:text-xs uppercase tracking-wider" style={{ color: on ? stressColor : "#7d97ac" }}>{ln.who || ""}</span>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {data && active >= 0 && (
          <motion.p key={active} data-testid="briefing-line" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="relative max-w-lg text-center text-base sm:text-lg text-[#e6f6fa] leading-relaxed min-h-[3.5rem]">
            {data.lines[active]?.text}
          </motion.p>
        )}
      </AnimatePresence>

      <button data-testid="briefing-start" onClick={onClose} className="relative mt-8 px-6 py-3 rounded-xl font-cyber font-black text-sm text-[#070A10] active:scale-95 transition-all" style={{ background: `linear-gradient(90deg,${stressColor},#00F0FF)` }}>
        {tri("Entra nella plancia", "Zur Konsole", "Enter the console", "Entrar a la consola", "Entrer", "ورود به کنسول")}
      </button>
    </div>
  );
}
