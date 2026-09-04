import { useState } from "react";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import MamoAssistant from "@/components/MamoAssistant";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;

// Sezione di Mohamed: SOLO il suo avatar come grande pulsante microfono.
// Tocchi → parte la guida vocale di produzione (Assistente Mamo).
export default function MohamedFloor() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [active, setActive] = useState(false);

  if (active) return <div data-testid="mohamed-floor-active" className="space-y-4"><MamoAssistant /></div>;

  return (
    <div data-testid="mohamed-floor" className="flex flex-col items-center justify-center py-10 text-center">
      <button data-testid="mohamed-mic-btn" onClick={() => setActive(true)} className="relative group active:scale-95 transition-all">
        <span aria-hidden className="absolute inset-0 rounded-full bg-amber-500/40 blur-2xl group-hover:bg-amber-500/60 transition-all" />
        <span aria-hidden className="absolute -inset-3 rounded-full border-2 border-amber-500/40 animate-ping" />
        <span className="relative block w-52 h-52 sm:w-60 sm:h-60 rounded-full overflow-hidden border-4 border-amber-500 shadow-2xl shadow-amber-500/30">
          <img src={`${PUB}/avatar_mohamed.jpg`} alt="Mohamed" className="w-full h-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </span>
        <span className="absolute bottom-1 right-1 w-14 h-14 rounded-full bg-amber-500 border-4 border-[#030712] flex items-center justify-center shadow-lg">
          <Mic className="w-6 h-6 text-[#030712]" />
        </span>
      </button>

      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 font-black text-3xl uppercase tracking-wide text-white">Mohamed</motion.h2>
      <p className="mt-2 max-w-xs text-sm text-[#94A3B8] leading-relaxed">
        {tri(
          "Tocca Mohamed: ti legge la produzione del Capo passo-passo, a mani libere.",
          "Tippe Mohamed an: er liest dir die Produktion des Chefs Schritt für Schritt vor, freihändig.",
          "Tap Mohamed: he reads the Capo's production step-by-step, hands-free.",
          "Toca a Mohamed: te lee la producción del Capo paso a paso, manos libres.",
          "Touche Mohamed : il te lit la production du Capo pas à pas, mains libres.",
          "روی محمد بزن: تولید کاپو را قدم‌به‌قدم و بدون دست برایت می‌خواند."
        )}
      </p>
      <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-400">
        <Mic className="w-3.5 h-3.5" /> {tri("Tocca per iniziare", "Zum Starten tippen", "Tap to start", "Toca para empezar", "Touche pour démarrer", "برای شروع بزن")}
      </p>
    </div>
  );
}
