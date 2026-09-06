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

  const active = listening || busy;
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center pointer-events-none">
      <AnimatePresence>
        {(reply || busy) && (
          <motion.div data-testid="ambient-bako-reply" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto mb-2 max-w-[86vw] sm:max-w-md rounded-2xl px-4 py-2.5 text-sm text-[#d6fbff] backdrop-blur-xl"
            style={{ background: "rgba(6,20,26,0.55)", border: "1px solid rgba(34,211,238,0.28)", boxShadow: "0 0 30px rgba(34,211,238,0.18)" }}>
            {busy ? tri("BakoMix elabora…", "BakoMix denkt…", "BakoMix is thinking…", "BakoMix procesa…", "BakoMix réfléchit…", "باکومیکس در حال پردازش…") : reply}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aura ambientale: si dissolve nel dark-mode e nel flusso verticale (nessun blocco/pillola) */}
      <div aria-hidden className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[240px] h-[150px] pointer-events-none"
        style={{ background: `radial-gradient(60% 80% at 50% 100%, rgba(34,211,238,${active ? 0.18 : 0.08}), transparent 70%)`, transition: "background 600ms ease" }} />

      {/* Presenza olografica BakoMix — sempre attiva, fusa nello sfondo */}
      <button data-testid="ambient-bako-orb" onClick={engage} aria-label="BakoMix AI"
        className="pointer-events-auto relative w-16 h-16 mb-1 rounded-full flex items-center justify-center active:scale-95 transition-transform"
        style={{ opacity: active ? 1 : 0.62, transition: "opacity 500ms ease" }}>
        <motion.span aria-hidden className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle at 50% 45%, rgba(34,211,238,0.4), rgba(20,184,166,0.1) 58%, transparent 74%)" }}
          animate={{ scale: listening ? [1, 1.18, 1] : [1, 1.05, 1], opacity: [0.6, 0.95, 0.6] }}
          transition={{ duration: listening ? 0.9 : 3.2, repeat: Infinity, ease: "easeInOut" }} />
        <motion.span aria-hidden className="absolute rounded-full border"
          style={{ width: 58, height: 58, borderColor: listening ? "rgba(244,63,94,0.6)" : "rgba(34,211,238,0.32)" }}
          animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
        {/* equalizer olografico */}
        <span className="relative z-10 flex items-end gap-[3px] h-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span key={i} className="w-[2.5px] rounded-full" style={{ background: listening ? "#f43f5e" : "#22d3ee", boxShadow: `0 0 5px currentColor`, opacity: active ? 1 : 0.55 }}
              animate={{ height: listening ? [5, 22, 8, 18, 6][i % 5] : [4, 9, 6, 11, 5][i % 5] }}
              transition={{ duration: listening ? 0.5 : 1.6, repeat: Infinity, repeatType: "mirror", delay: i * 0.08 }} />
          ))}
        </span>
      </button>
      <span className="pointer-events-none pb-2 text-[9px] font-bold uppercase tracking-[0.25em] transition-all duration-500"
        style={{ color: active ? "rgba(34,211,238,0.9)" : "rgba(148,163,184,0.45)", textShadow: active ? "0 0 8px rgba(34,211,238,0.6)" : "none" }}>
        {listening ? tri("in ascolto", "hört zu", "listening", "escuchando", "à l'écoute", "در حال شنیدن") : "BakoMix AI"}
      </span>
    </div>
  );
}
