import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, LogIn } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import LangSelector from "@/components/LangSelector";

const PUB = process.env.PUBLIC_URL;

// Schermata 2 — HUB: i 3 avatar a tutta pagina, scorrevoli con un dito (senza bordi, come carte).
export default function AvatarHub({ onSelect, onLogin, isLoggedIn = false }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const scroller = useRef(null);
  const [idx, setIdx] = useState(0);

  const CARDS = [
    { kind: "lab", img: "avatar_miki.jpg", name: "MikiLab", role: tri("Il Capo · Controllo Produzione", "Der Chef · Produktionssteuerung", "The Capo · Production Control", "El Capo · Control de Producción", "Le Capo · Contrôle Production", "کاپو · کنترل تولید"), accent: "#D95200" },
    { kind: "floor", img: "avatar_nexus.jpg", name: "Miki-Nexus", role: tri("Produzione · A mani libere", "Produktion · Freihändig", "Production · Hands-free", "Producción · Manos libres", "Production · Mains libres", "تولید · بدون دست"), accent: "#f59e0b" },
    { kind: "guida", img: "avatar_nexus.jpg", name: "Miki-Nexus", role: tri("Assistente AI · Ti spiega tutto", "KI-Assistent · Erklärt alles", "AI Assistant · Explains everything", "Asistente IA · Te explica todo", "Assistant IA · Explique tout", "دستیار هوش مصنوعی · همه‌چیز را توضیح می‌دهد"), accent: "#06b6d4" },
  ];

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) setIdx(i);
  };
  const scrollTo = (i) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div data-testid="avatar-hub" className="relative min-h-screen bg-[#030712] text-white overflow-hidden">
      {/* header lingua */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
        <span className="font-black tracking-[0.2em] text-sm uppercase text-white/90">MIKILAB</span>
        <div className="flex items-center gap-2">
          {!isLoggedIn && onLogin && (
            <button data-testid="hub-login-btn" onClick={onLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D95200]/15 border border-[#D95200]/50 text-[#D95200] font-bold text-xs active:scale-95 transition-all">
              <LogIn className="w-3.5 h-3.5" /> {tri("Accedi", "Anmelden", "Sign in", "Acceder", "Connexion", "ورود")}
            </button>
          )}
          <LangSelector testid="hub-lang" />
        </div>
      </div>

      {/* carte scorrevoli a tutta pagina */}
      <div ref={scroller} onScroll={onScroll}
        className="flex h-screen overflow-x-auto snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: "none" }}>
        {CARDS.map((c) => (
          <button key={c.kind} data-testid={`hub-card-${c.kind}`} onClick={() => onSelect(c.kind)}
            className="relative shrink-0 w-screen h-screen snap-center overflow-hidden text-left">
            <img src={`${PUB}/${c.img}`} alt={c.name} className="absolute inset-0 w-full h-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            {/* velatura per leggibilità + accento */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/35 to-[#030712]/20" />
            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 78%, ${c.accent}22 0%, transparent 60%)` }} />
            {/* testo in basso */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="absolute bottom-24 left-0 right-0 px-8 text-center">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: "#030712", background: c.accent }}>{c.role}</span>
              <h2 className="font-black text-4xl sm:text-5xl uppercase tracking-wide" style={{ textShadow: `0 0 24px ${c.accent}80` }}>{c.name}</h2>
              <span className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm border-2 active:scale-95 transition-all"
                style={{ borderColor: c.accent, color: c.accent, background: "#03071288" }}>
                {tri("Apri", "Öffnen", "Open", "Abrir", "Ouvrir", "باز کن")} <ChevronRight className="w-4 h-4" />
              </span>
            </motion.div>
          </button>
        ))}
      </div>

      {/* frecce desktop */}
      <button aria-label="prev" onClick={() => scrollTo(Math.max(0, idx - 1))} className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0b0f19]/80 border border-[#1e293b] items-center justify-center text-white hover:border-[#D95200] active:scale-95 transition-all"><ChevronLeft className="w-5 h-5" /></button>
      <button aria-label="next" onClick={() => scrollTo(Math.min(CARDS.length - 1, idx + 1))} className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0b0f19]/80 border border-[#1e293b] items-center justify-center text-white hover:border-[#D95200] active:scale-95 transition-all"><ChevronRight className="w-5 h-5" /></button>

      {/* indicatori + hint swipe */}
      <div className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center gap-3">
        <div className="flex gap-2">
          {CARDS.map((c, i) => (
            <button key={i} aria-label={`go ${i}`} onClick={() => scrollTo(i)}
              className="h-2 rounded-full transition-all" style={{ width: i === idx ? 28 : 8, background: i === idx ? CARDS[idx].accent : "#334155" }} />
          ))}
        </div>
        <p className="text-[11px] text-[#64748B]">{tri("Scorri con il dito · tocca l'avatar per entrare", "Wische · tippe den Avatar zum Öffnen", "Swipe · tap an avatar to enter", "Desliza · toca el avatar para entrar", "Glisse · touche l'avatar pour entrer", "بکش · روی آواتار بزن")}</p>
      </div>
    </div>
  );
}
