import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Volume2, Sparkles } from "lucide-react";
import { deusApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;

// Scena INTERATTIVA "MikiLab + Sitor alla scrivania": parallax al movimento (giroscopio/mouse),
// Sitor pulsa quando parla, e su richiesta "apre" il calendario del piano con animazione.
export default function DeskScene() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [speaking, setSpeaking] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [plan, setPlan] = useState(null);

  const onMove = useCallback((e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    setTilt({ x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) });
  }, []);

  useEffect(() => {
    const onO = (e) => { if (e.gamma == null && e.beta == null) return; setTilt({ x: Math.max(-1, Math.min(1, (e.gamma || 0) / 35)), y: Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 35)) }); };
    window.addEventListener("deviceorientation", onO);
    return () => window.removeEventListener("deviceorientation", onO);
  }, []);

  useEffect(() => {
    const on = () => setSpeaking(true); const off = () => setSpeaking(false);
    window.addEventListener("mikilab-tts-start", on); window.addEventListener("mikilab-tts-end", off);
    return () => { window.removeEventListener("mikilab-tts-start", on); window.removeEventListener("mikilab-tts-end", off); };
  }, []);

  const presentPlan = async () => {
    setCalOpen(true);
    let d = plan;
    if (!d) { try { d = await deusApi.capoPlan(); setPlan(d); } catch { /* */ } }
    const head = (d && (d.headline || d.plan_markdown)) ? (d.headline || String(d.plan_markdown).split("\n")[0]) : "";
    const msg = head
      ? tri(`Ecco il piano della settimana, Capo. ${head}`, `Hier der Wochenplan, Chef. ${head}`, `Here's the week's plan, boss. ${head}`, `Aquí el plan, jefe. ${head}`, `Voici le plan, chef. ${head}`, `این برنامه هفته است، رئیس. ${head}`)
      : tri("Capo, non c'è ancora un piano generato. Vuoi che lo prepari io adesso?", "Chef, noch kein Plan. Soll ich ihn erstellen?", "Boss, no plan yet. Want me to prepare it now?", "Jefe, aún no hay plan. ¿Lo preparo?", "Chef, pas encore de plan. Je le prépare ?", "رئیس، هنوز برنامه‌ای نیست. آماده‌اش کنم؟");
    try { playTTS(msg, { lang, voice: "nexus" }); } catch { /* */ }
  };

  return (
    <div ref={ref} data-testid="desk-scene" onMouseMove={onMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className="relative w-full rounded-2xl overflow-hidden border border-[#8a97a6]/35 mb-4"
      style={{ height: 300, boxShadow: "0 0 30px rgba(138,151,166,0.18)", background: "#04070d", perspective: 1000 }}>
      <motion.img
        src={`${PUB}/desk_scene.jpg`} alt={tri("MikiLab e Sitor alla scrivania", "MikiLab und Sitor", "MikiLab and Sitor at the desk", "MikiLab y Sitor", "MikiLab et Sitor", "میکی‌لب و سیتور")}
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ filter: "saturate(0.32) brightness(0.8) contrast(1.03)" }}
        animate={{ x: tilt.x * -18, y: tilt.y * -12, scale: 1.08 }}
        transition={{ type: "spring", stiffness: 50, damping: 14 }}
        onError={(e) => { e.currentTarget.style.display = "none"; }} />

      <motion.span aria-hidden data-testid="desk-sitor-glow" className="absolute rounded-full pointer-events-none"
        style={{ right: "22%", top: "30%", width: 150, height: 150, background: "radial-gradient(circle, rgba(138,151,166,0.55), transparent 70%)" }}
        animate={{ scale: speaking ? [1, 1.35, 1] : [1, 1.08, 1], opacity: speaking ? [0.7, 1, 0.7] : [0.35, 0.5, 0.35] }}
        transition={{ duration: speaking ? 0.8 : 3.5, repeat: Infinity, ease: "easeInOut" }} />

      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(4,7,13,0.6) 0%, transparent 28%, transparent 52%, #04070d 100%)" }} />

      <div className="absolute top-0 left-0 right-0 p-3 sm:p-4">
        <span className="font-mono-data text-[9px] tracking-[0.28em] uppercase text-[#9aa6b2]">MikiLab · Sitor</span>
        <h2 className="font-cyber text-lg sm:text-xl font-black text-white uppercase tracking-wide" style={{ textShadow: "0 0 14px rgba(138,151,166,0.5)" }}>{tri("Console del Capo", "Chef-Konsole", "Boss Console", "Consola del Jefe", "Console du Chef", "کنسول رئیس")}</h2>
      </div>

      <AnimatePresence>
        {calOpen && (
          <motion.div data-testid="desk-calendar" initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[3] w-[78%] max-w-sm rounded-xl border border-[#8a97a6]/50 bg-[#0b0f19]/92 backdrop-blur-md p-3"
            style={{ boxShadow: "0 0 26px rgba(138,151,166,0.4)" }}>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#9aa6b2] mb-2"><CalendarDays className="w-3.5 h-3.5" /> {tri("Piano della settimana", "Wochenplan", "Week plan", "Plan semanal", "Plan de la semaine", "برنامه هفته")}</p>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {[tri("Lun","Mo","Mon","Lun","Lun","دو"),tri("Mar","Di","Tue","Mar","Mar","سه"),tri("Mer","Mi","Wed","Mié","Mer","چ"),tri("Gio","Do","Thu","Jue","Jeu","پ"),tri("Ven","Fr","Fri","Vie","Ven","ج"),tri("Sab","Sa","Sat","Sáb","Sam","ش"),tri("Dom","So","Sun","Dom","Dim","ی")].map((d,i)=>(
                <div key={i} className="text-center text-[9px] font-bold text-[#94A3B8] rounded bg-[#0C1019] border border-[#1e293b] py-1.5">{d}</div>
              ))}
            </div>
            <p className="text-[12px] text-[#cbd5e1] leading-snug">{plan && (plan.headline || plan.plan_markdown) ? (plan.headline || String(plan.plan_markdown).split("\n").slice(0,2).join(" ")) : tri("Nessun piano generato: usa 'Sitor · Piano del Giorno' qui sotto.", "Kein Plan: nutze unten den Tagesplan.", "No plan yet: use 'Sitor · Day Plan' below.", "Sin plan: usa 'Plan del día' abajo.", "Pas de plan : utilise le plan du jour ci-dessous.", "برنامه‌ای نیست: از پایین استفاده کن.")}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-[4]">
        <p className="text-[11px] sm:text-[12px] text-[#CBD5E1] max-w-xl leading-snug mb-2">{tri(
          "Io e Sitor sediamo alla stessa scrivania: tu decidi, lui esegue.",
          "Sitor und ich am selben Schreibtisch: du entscheidest, er führt aus.",
          "Sitor and I sit at the same desk: you decide, he executes.",
          "Sitor y yo en el mismo escritorio: tú decides, él ejecuta.",
          "Sitor et moi au même bureau : tu décides, il exécute.",
          "من و سیتور پشت یک میز: تو تصمیم می‌گیری، او اجرا می‌کند.")}</p>
        <button data-testid="desk-present-plan" onClick={presentPlan}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-cyber font-black text-xs text-[#04070d] active:scale-95 transition-all"
          style={{ background: "linear-gradient(90deg,#8a97a6,#9aa6b2)", boxShadow: "0 0 18px rgba(138,151,166,0.4)" }}>
          <Sparkles className="w-4 h-4" /> {calOpen ? tri("Sitor ripeti il piano", "Plan wiederholen", "Repeat the plan", "Repetir el plan", "Répéter le plan", "برنامه را تکرار کن") : tri("Sitor, presenta il piano", "Sitor, zeig den Plan", "Sitor, present the plan", "Sitor, presenta el plan", "Sitor, présente le plan", "سیتور، برنامه را نشان بده")}
          {speaking ? <Volume2 className="w-4 h-4 animate-pulse" /> : null}
        </button>
      </div>
    </div>
  );
}
