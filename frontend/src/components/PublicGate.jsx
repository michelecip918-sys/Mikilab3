import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import LangSelector from "@/components/LangSelector";
import AvatarWorld3D from "@/components/AvatarWorld3D";
import AdminGate from "@/components/AdminGate";

const PUB = process.env.PUBLIC_URL;

// Multiverso pubblico read-only: chi non ha il PIN puo GUARDARE i 4 mondi e gli avatar,
// ma OGNI interazione porta al Muro del PIN (198505 · richiesta accessi@mikilab.de).
export default function PublicGate({ onUnlock }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [showPin, setShowPin] = useState(false);
  const [world, setWorld] = useState("panificio");

  const WORLDS = [
    { id: "panificio", label: tri("Panificio", "Backstube", "Bakery", "Panadería", "Boulangerie", "نانوایی"), accent: "#00F0FF" },
    { id: "pizzeria", label: tri("Pizzeria", "Pizzeria", "Pizzeria", "Pizzería", "Pizzeria", "پیتزا"), accent: "#FFB800" },
    { id: "pasticceria", label: tri("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "شیرینی"), accent: "#7FD8C0" },
    { id: "banco", label: tri("Magazzino", "Lager", "Warehouse", "Almacén", "Entrepôt", "انبار"), accent: "#5E8CA8" },
  ];

  // Auto-tour dei mondi (viewing passivo, consentito)
  useEffect(() => {
    if (showPin) return;
    const t = setInterval(() => {
      setWorld((w) => { const idx = WORLDS.findIndex((x) => x.id === w); return WORLDS[(idx + 1) % WORLDS.length].id; });
    }, 8000);
    return () => clearInterval(t);
  }, [showPin]); // eslint-disable-line react-hooks/exhaustive-deps

  const AVATARS = [
    { img: "avatar_miki.jpg", c: "#5E8CA8", n: "MikiLab", r: tri("Capo Supremo", "Oberster Chef", "Supreme Capo", "Capo Supremo", "Capo Suprême", "کاپوی برتر") },
    { img: "avatar_nexus.jpg", c: "#F6D27A", n: "Miki-Nexus", r: tri("Coscienza Strategica", "Strategisches Bewusstsein", "Strategic Consciousness", "Conciencia Estratégica", "Conscience Stratégique", "آگاهی راهبردی"), nexus: true },
    { img: "avatar_mikemix.jpg", c: "#00F0FF", n: "Mike Mix", r: tri("IA Operativa", "Operative KI", "Operational AI", "IA Operativa", "IA Opérationnelle", "هوش عملیاتی") },
  ];

  if (showPin) return <AdminGate onUnlock={onUnlock} onBack={() => setShowPin(false)} />;

  const cur = WORLDS.find((w) => w.id === world) || WORLDS[0];

  return (
    <div data-testid="public-gate" className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
      {/* MULTIVERSO 3D di sfondo */}
      <div className="absolute inset-0 z-0 opacity-90">
        <AvatarWorld3D theme={world} accent={cur.accent} />
      </div>
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#030712]/70 via-[#030712]/35 to-[#030712]/95 pointer-events-none" />

      {/* HEADER */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl overflow-hidden border border-[#00F0FF]/40 shadow-[0_0_16px_rgba(0,240,255,0.25)] bg-[#070A10]">
            <img src={`${PUB}/logo-emblem.png`} alt="MikiLab Pro" className="w-full h-full object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block font-black tracking-[0.18em] text-lg sm:text-xl uppercase">MikiLab<span className="text-[#00F0FF]"> Pro</span></span>
            <span className="block font-mono text-[8.5px] tracking-[0.3em] text-[#00F0FF]/70 uppercase">Holographic Command OS</span>
          </span>
        </div>
        <LangSelector testid="public-lang" />
      </header>

      <div className="relative z-10 flex flex-col items-center justify-center px-5 pt-2 pb-28 text-center min-h-[calc(100vh-72px)]">
        {/* Selettore mondi (viewing passivo) */}
        <div data-testid="public-world-tabs" className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {WORLDS.map((w) => (
            <button key={`world-${w.id}`} data-testid={`public-world-${w.id}`} onClick={() => setWorld(w.id)}
              className="px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all active:scale-95"
              style={world === w.id
                ? { background: w.accent, color: "#030712", borderColor: w.accent, boxShadow: `0 0 18px ${w.accent}66` }
                : { background: "rgba(11,15,25,0.6)", color: "#94A3B8", borderColor: "#1e293b" }}>
              {w.label}
            </button>
          ))}
        </div>

        {/* TRIO avatar — Miki-Nexus centrale e speciale */}
        <div data-testid="public-avatars" className="flex items-end justify-center gap-4 sm:gap-8 mb-7">
          {AVATARS.map((a, i) => (
            <motion.button key={`av-${a.n}`} data-testid={`public-avatar-${a.n.toLowerCase().replace(/[^a-z]/g, "")}`}
              onClick={() => setShowPin(true)}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i, duration: 0.55 }}
              className="group flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="relative">
                {a.nexus && (
                  <>
                    <span className="nexus-ring nexus-ring-1" style={{ borderColor: "#F6D27A" }} />
                    <span className="nexus-ring nexus-ring-2" style={{ borderColor: "#00F0FF" }} />
                    <span className="absolute -inset-4 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(246,210,122,0.55), rgba(0,240,255,0.25) 55%, transparent 72%)" }} />
                  </>
                )}
                <div className="relative rounded-full overflow-hidden bg-[#030712]"
                  style={{
                    width: a.nexus ? 132 : 84, height: a.nexus ? 132 : 84,
                    border: `3px solid ${a.c}`,
                    boxShadow: a.nexus ? `0 0 46px ${a.c}, 0 0 90px rgba(0,240,255,0.35)` : `0 0 22px ${a.c}66`,
                  }}>
                  <img src={`${PUB}/${a.img}`} alt={a.n} className="w-full h-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                </div>
              </div>
              <span className="font-black text-xs sm:text-sm" style={{ color: a.c }}>{a.n}</span>
              <span className="text-[9.5px] uppercase tracking-wider text-[#8aa0b4] max-w-[92px] leading-tight">{a.r}</span>
            </motion.button>
          ))}
        </div>

        {/* Gerarchia */}
        <p data-testid="public-hierarchy" className="font-mono text-[10px] sm:text-[11px] tracking-[0.25em] text-[#64748B] uppercase mb-5">
          MikiLab <span className="text-[#F6D27A]">→</span> Miki-Nexus <span className="text-[#00F0FF]">→</span> Mike Mix
        </p>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="font-black tracking-[0.14em] text-2xl sm:text-4xl uppercase max-w-2xl">
          {tri("Il Multiverso della Panificazione", "Das Multiversum des Backens", "The Baking Multiverse", "El Multiverso de la Panificación", "Le Multivers de la Boulangerie", "چندجهانی نان‌پزی")}
        </motion.h1>
        <p className="mt-3 max-w-md text-sm text-[#9fb3c4] leading-relaxed">
          {tri(
            "Sei un ospite. Esplora liberamente i reparti e gli avatar. Ogni interazione richiede un PIN.",
            "Du bist Gast. Erkunde frei die Bereiche und Avatare. Jede Interaktion erfordert einen PIN.",
            "You are a guest. Explore the departments and avatars freely. Any interaction requires a PIN.",
            "Eres un invitado. Explora libremente las áreas y avatares. Toda interacción requiere un PIN.",
            "Tu es invité. Explore librement les ateliers et les avatars. Toute interaction requiert un PIN.",
            "تو مهمان هستی. بخش‌ها و آواتارها را آزادانه ببین. هر تعامل به پین نیاز دارد.")}
        </p>

        <button data-testid="public-enter-btn" onClick={() => setShowPin(true)}
          className="mt-7 inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-black text-base text-[#030712] active:scale-95 transition-all"
          style={{ background: "linear-gradient(90deg,#00F0FF,#7DD3FC)", boxShadow: "0 0 26px rgba(0,240,255,0.45)" }}>
          <Lock className="w-4 h-4" /> {tri("Entra con il PIN", "Mit PIN eintreten", "Enter with PIN", "Entrar con PIN", "Entrer avec le PIN", "ورود با پین")} <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <Sparkles className="w-3.5 h-3.5 text-[#F6D27A]" />
          {tri("Serve un accesso? Scrivi a", "Zugang nötig? Schreib an", "Need access? Write to", "¿Necesitas acceso? Escribe a", "Besoin d'accès ? Écris à", "دسترسی می‌خواهی؟ بنویس به")}
          <a href="mailto:accessi@mikilab.de?subject=Richiesta%20accesso%20MikiLab" data-testid="public-email" className="font-bold text-[#14b8a6] hover:text-[#2dd4bf]">accessi@mikilab.de</a>
        </div>
      </div>
    </div>
  );
}
