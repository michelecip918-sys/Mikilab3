import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Celebrazione "batti il 5" globale (Michele + Mohammed) con coriandoli e suono.
// Attiva con: fireHighFive("messaggio opzionale")
export function fireHighFive(msg) {
  window.dispatchEvent(new CustomEvent("mikilab-highfive", { detail: { msg } }));
}

const COLORS = ["#242424", "#ff6b00", "#ff6b00", "#E7B24A", "#ff6b00", "#ff6b00"];

function playApplause() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // do-mi-sol-do
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = f;
      o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.start(t); o.stop(t + 0.4);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch { /* audio non disponibile */ }
}

export default function HighFive() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    const onFire = (ev) => {
      setMsg((ev.detail && ev.detail.msg) || "");
      setShow(true);
      playApplause();
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setShow(false), 3400);
    };
    window.addEventListener("mikilab-highfive", onFire);
    return () => { window.removeEventListener("mikilab-highfive", onFire); clearTimeout(timer.current); };
  }, []);

  const base = process.env.PUBLIC_URL || "";
  return (
    <AnimatePresence>
      {show && (
        <motion.div data-testid="highfive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setShow(false)}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1A1412]/85 backdrop-blur-sm px-6 cursor-pointer overflow-hidden">
          {/* coriandoli */}
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div key={i}
              initial={{ y: -60, x: (i - 9) * 22, opacity: 0, rotate: 0 }}
              animate={{ y: 500, opacity: [0, 1, 1, 0], rotate: 360 }}
              transition={{ duration: 2.2 + (i % 5) * 0.3, delay: (i % 6) * 0.08, ease: "easeIn" }}
              className="absolute top-0 w-2.5 h-3.5 rounded-sm"
              style={{ left: `${(i * 5.5) % 100}%`, background: COLORS[i % COLORS.length] }} />
          ))}
          <div className="relative flex items-center justify-center">
            <motion.img src={`${base}/michele-avatar-full.jpg`} alt="Michele"
              initial={{ x: -140, rotate: -10, opacity: 0 }} animate={{ x: -4, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 130, damping: 12, delay: 0.1 }}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-2xl" />
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.5, 1], opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }} className="mx-1 text-5xl drop-shadow-lg">🙌</motion.div>
            <motion.img src={`${base}/mohammed-avatar.jpg`} alt="Mohammed"
              initial={{ x: 140, rotate: 10, opacity: 0 }} animate={{ x: 4, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 130, damping: 12, delay: 0.1 }}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-2xl" />
          </div>
          <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
            className="mt-5 font-display text-xl font-bold text-white text-center">
            {msg || tri("Bravo, Maestro! 👏", "Bravo, Meister! 👏", "Well done, Master! 👏")}
          </motion.h2>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
