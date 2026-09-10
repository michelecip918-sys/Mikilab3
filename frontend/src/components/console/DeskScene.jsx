import { motion } from "framer-motion";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;

// Scena "MikiLab + Sitor alla scrivania" che dialogano davanti al piano/calendario (stile cartone).
export default function DeskScene() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  return (
    <div data-testid="desk-scene" className="relative w-full rounded-2xl overflow-hidden border border-[#FF6B00]/35 mb-4" style={{ boxShadow: "0 0 30px rgba(255,107,0,0.18)" }}>
      <motion.img
        src={`${PUB}/desk_scene.jpg`} alt={tri("MikiLab e Sitor alla scrivania", "MikiLab und Sitor am Schreibtisch", "MikiLab and Sitor at the desk", "MikiLab y Sitor en el escritorio", "MikiLab et Sitor au bureau", "میکی‌لب و سیتور پشت میز")}
        className="w-full h-auto max-h-[260px] object-cover object-center"
        initial={{ scale: 1.06, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut" }}
        onError={(e) => { e.currentTarget.parentElement.style.display = "none"; }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(4,7,13,0.55) 0%, transparent 30%, transparent 55%, #04070d 100%)" }} />
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-4">
        <span className="font-mono-data text-[9px] tracking-[0.28em] uppercase text-[#FF9D42]">MikiLab · Sitor</span>
        <h2 className="font-cyber text-lg sm:text-xl font-black text-white uppercase tracking-wide" style={{ textShadow: "0 0 14px rgba(255,107,0,0.5)" }}>{tri("Console del Capo", "Chef-Konsole", "Boss Console", "Consola del Jefe", "Console du Chef", "کنسول رئیس")}</h2>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
        <p className="text-[11px] sm:text-[12px] text-[#CBD5E1] max-w-xl leading-snug">{tri(
          "Io e Sitor sediamo alla stessa scrivania: tu decidi, lui esegue. Qui sotto il piano della settimana.",
          "Sitor und ich sitzen am selben Schreibtisch: du entscheidest, er führt aus.",
          "Sitor and I sit at the same desk: you decide, he executes. Below, the week's plan.",
          "Sitor y yo en el mismo escritorio: tú decides, él ejecuta.",
          "Sitor et moi au même bureau : tu décides, il exécute.",
          "من و سیتور پشت یک میز: تو تصمیم می‌گیری، او اجرا می‌کند.")}</p>
      </div>
    </div>
  );
}
