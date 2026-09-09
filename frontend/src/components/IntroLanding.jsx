import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import LangSelector from "@/components/LangSelector";
import InstallApp from "@/components/InstallApp";

const PUB = process.env.PUBLIC_URL;

// Schermata 1 — SOLO home: logo, frase del sito, pulsante "Inizia".
export default function IntroLanding({ onStart, onRegister }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);

  return (
    <div data-testid="intro-landing" className="relative min-h-screen overflow-hidden bg-[#030712] text-white flex flex-col">
      {/* sfondo futuristico */}
      <div className="absolute inset-0 z-0">
        <img src={`${PUB}/intro-team.jpg`} alt="" className="w-full h-full object-cover opacity-60" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/75 via-[#030712]/40 to-[#030712]/95" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[520px] h-[280px] bg-[#D95200]/15 blur-[130px] rounded-full" />
      </div>

      {/* lingua in alto a destra */}
      <div className="relative z-30 flex justify-end p-4">
        <LangSelector testid="intro-lang" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pointer-events-none">
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
          className="flex items-end justify-center gap-3 mb-5">
          {[{ img: "avatar_miki.jpg", c: "#D95200", n: "MikiLab" }, { img: "avatar_mikemix.jpg", c: "#f59e0b", n: "Mike Mix" }, { img: "avatar_bigmix.jpg", c: "#06b6d4", n: "Mike Mix AI" }].map((a, i) => (
            <div key={a.n} className="flex flex-col items-center gap-1.5">
              <div className={`rounded-full overflow-hidden bg-[#030712] shadow-xl ${i === 0 ? "w-24 h-24" : "w-18 h-18"}`} style={{ width: i === 0 ? 92 : 72, height: i === 0 ? 92 : 72, border: `3px solid ${a.c}`, boxShadow: `0 0 22px ${a.c}66` }}>
                <img src={`${PUB}/${a.img}`} alt={a.n} className="w-full h-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              </div>
              <span className="text-[10px] font-bold" style={{ color: a.c }}>{a.n}</span>
            </div>
          ))}
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
          className="font-black tracking-[0.2em] text-4xl sm:text-5xl uppercase text-white">MIKILAB</motion.h1>

        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }}
          className="mt-4 max-w-md text-base sm:text-lg text-[#D95200] font-semibold leading-snug">
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

        <div className="pointer-events-auto mt-8 flex flex-col items-center gap-3 w-full max-w-[260px]">
          <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
            data-testid="intro-register-btn" onClick={onRegister}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D95200] to-[#0d9488] text-[#030712] font-black text-base shadow-xl shadow-[#D95200]/30 active:scale-95 transition-all">
            {tri("Registrati", "Registrieren", "Sign up", "Regístrate", "S'inscrire", "ثبت‌نام")}
          </motion.button>
          <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58, duration: 0.5 }}
            data-testid="intro-start-btn" onClick={onStart}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#0b0f19] border border-[#D95200]/40 text-[#D95200] font-bold text-base hover:border-[#D95200] active:scale-95 transition-all">
            {tri("Inizia", "Los geht's", "Start", "Empezar", "Commencer", "شروع")} <ArrowRight className="w-5 h-5" />
          </motion.button>
          <InstallApp variant="hero" />
        </div>

        <p className="mt-6 text-[11px] text-[#64748B]">{tri("100% offline · pronto in laboratorio", "100% offline · einsatzbereit", "100% offline · lab-ready", "100% sin conexión · listo", "100% hors ligne · prêt", "۱۰۰٪ آفلاین · آماده")}</p>
      </div>
    </div>
  );
}
