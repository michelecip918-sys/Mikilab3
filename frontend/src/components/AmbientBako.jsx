import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { masterApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const SR_LOCALE = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR", ar: "ar-SA", tr: "tr-TR" };

// Entità BakoMix AMBIENTALE: presenza olografica sempre attiva nel flusso (non un widget/bottone).
// Un'orbita di energia che "ascolta"; parlandole esegue delega/query in tempo reale.
export default function AmbientBako() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");
  const recRef = useRef(null);
  const supported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const run = async (text) => {
    if (!text) return;
    setBusy(true); setReply("");
    try {
      const r = await masterApi.govern(text, lang);
      setReply(r.reply || "");
      try { playTTS(r.reply || "", { lang, voice: "bakemix" }); } catch { /* */ }
      if (r.executed) { try { window.dispatchEvent(new Event("mikilab-govern-executed")); } catch { /* */ } }
      setTimeout(() => setReply(""), 9000);
    } catch { setReply(""); } finally { setBusy(false); }
  };

  const engage = () => {
    if (!supported) { setReply(tri("Riconoscimento vocale non disponibile qui.", "Spracherkennung nicht verfügbar.", "Voice not available here.", "Voz no disponible.", "Voix indisponible.", "صدا در دسترس نیست.")); setTimeout(() => setReply(""), 5000); return; }
    if (listening && recRef.current) { try { recRef.current.stop(); } catch { /* */ } return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = SR_LOCALE[lang] || "it-IT"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.onresult = (ev) => { const t = ev.results?.[0]?.[0]?.transcript || ""; if (t) run(t); };
    recRef.current = rec;
    try { rec.start(); } catch { setListening(false); }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {(reply || busy) && (
          <motion.div data-testid="ambient-bako-reply" initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto max-w-[86vw] sm:max-w-md rounded-2xl px-4 py-2.5 text-sm text-[#d6fbff] backdrop-blur-xl"
            style={{ background: "rgba(6,20,26,0.72)", border: "1px solid rgba(34,211,238,0.4)", boxShadow: "0 0 24px rgba(34,211,238,0.25)" }}>
            {busy ? tri("BakoMix elabora…", "BakoMix denkt…", "BakoMix is thinking…", "BakoMix procesa…", "BakoMix réfléchit…", "باکومیکس در حال پردازش…") : reply}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orbita olografica sempre presente */}
      <button data-testid="ambient-bako-orb" onClick={engage} aria-label="BakoMix"
        className="pointer-events-auto relative w-16 h-16 rounded-full flex items-center justify-center active:scale-95 transition-transform">
        <motion.span aria-hidden className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle at 50% 40%, rgba(34,211,238,0.55), rgba(20,184,166,0.15) 60%, transparent 72%)" }}
          animate={{ scale: listening ? [1, 1.18, 1] : [1, 1.06, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: listening ? 0.9 : 2.6, repeat: Infinity, ease: "easeInOut" }} />
        <motion.span aria-hidden className="absolute rounded-full border"
          style={{ width: 58, height: 58, borderColor: listening ? "rgba(244,63,94,0.7)" : "rgba(34,211,238,0.6)" }}
          animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
        {/* equalizer olografico */}
        <span className="relative z-10 flex items-end gap-[3px] h-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span key={i} className="w-[3px] rounded-full" style={{ background: listening ? "#f43f5e" : "#22d3ee", boxShadow: "0 0 6px currentColor" }}
              animate={{ height: listening ? [5, 22, 8, 18, 6][i % 5] : [4, 10, 6, 12, 5][i % 5] }}
              transition={{ duration: listening ? 0.5 : 1.4, repeat: Infinity, repeatType: "mirror", delay: i * 0.08 }} />
          ))}
        </span>
      </button>
      <span className="pointer-events-none text-[9px] font-bold uppercase tracking-[0.25em] text-[#22d3ee]/80" style={{ textShadow: "0 0 8px rgba(34,211,238,0.6)" }}>
        {listening ? tri("in ascolto", "hört zu", "listening", "escuchando", "à l'écoute", "در حال شنیدن") : "BakoMix"}
      </span>
    </div>
  );
}
