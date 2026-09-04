import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import LangSelector from "@/components/LangSelector";

const PUB = process.env.PUBLIC_URL;

// Schermata 1 — SOLO home: logo, frase del sito, pulsante "Inizia".
export default function IntroLanding({ onStart }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);

  return (
    <div data-testid="intro-landing" className="relative min-h-screen overflow-hidden bg-[#030712] text-white flex flex-col">
      {/* sfondo futuristico */}
      <div className="absolute inset-0 z-0">
        <img src={`${PUB}/intro-bg.png`} alt="" className="w-full h-full object-cover opacity-55" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/80 via-[#030712]/35 to-[#030712]/90" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[520px] h-[280px] bg-[#14b8a6]/15 blur-[130px] rounded-full" />
      </div>

      {/* lingua in alto a destra */}
      <div className="relative z-30 flex justify-end p-4">
        <LangSelector testid="intro-lang" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pointer-events-none">
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
          className="w-24 h-24 rounded-3xl overflow-hidden border border-[#14b8a6]/40 shadow-2xl shadow-[#14b8a6]/25 bg-[#030712] mb-5">
          <img src={`${PUB}/logo-emblem.png`} alt="MikiLab" className="w-full h-full object-contain" />
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
          className="font-black tracking-[0.2em] text-4xl sm:text-5xl uppercase text-white">MIKILAB</motion.h1>

        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }}
          className="mt-4 max-w-md text-base sm:text-lg text-[#14b8a6] font-semibold leading-snug">
          {tri(
            "Dove la farina incontra il futuro.",
            "Wo Mehl auf die Zukunft trifft.",
            "Where flour meets the future.",
            "Donde la harina se encuentra con el futuro.",
            "Où la farine rencontre le futur.",
            "جایی که آرد به آینده می‌رسد."
          )}
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.5 }}
          className="mt-2 max-w-sm text-sm text-[#94A3B8] leading-relaxed">
          {tri(
            "Il laboratorio digitale del panettiere professionista: ricette, produzione e assistente AI, a mani libere.",
            "Das digitale Labor für Profi-Bäcker: Rezepte, Produktion und KI-Assistent, freihändig.",
            "The professional baker's digital lab: recipes, production and an AI assistant, hands-free.",
            "El laboratorio digital del panadero profesional: recetas, producción y asistente IA, manos libres.",
            "Le laboratoire numérique du boulanger professionnel : recettes, production et assistant IA, mains libres.",
            "آزمایشگاه دیجیتال نانوای حرفه‌ای: دستورها، تولید و دستیار هوش مصنوعی، بدون دست."
          )}
        </motion.p>

        <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
          data-testid="intro-start-btn" onClick={onStart}
          className="pointer-events-auto mt-9 inline-flex items-center gap-2 px-9 py-4 rounded-full bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] font-black text-base shadow-xl shadow-[#14b8a6]/30 active:scale-95 hover:shadow-[#14b8a6]/50 transition-all">
          {tri("Inizia", "Los geht's", "Start", "Empezar", "Commencer", "شروع")} <ArrowRight className="w-5 h-5" />
        </motion.button>

        <p className="mt-6 text-[11px] text-[#64748B]">{tri("100% offline · pronto in laboratorio", "100% offline · einsatzbereit", "100% offline · lab-ready", "100% sin conexión · listo", "100% hors ligne · prêt", "۱۰۰٪ آفلاین · آماده")}</p>
      </div>
    </div>
  );
}
