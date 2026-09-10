import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { masterApi, mikeApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const API = process.env.REACT_APP_BACKEND_URL;
const SR_LOCALE = { it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR", ar: "ar-SA", tr: "tr-TR" };

// Umore → colore reattivo dell'orb (industriale: acciaio/blu/ambra, niente viola).
const MOOD_COLOR = { calm: "#22d3ee", busy: "#64748B", proud: "#FF9D42", alert: "#FFB800" };

// Miki-Nexus ambientale: presenza olografica fusa nel flusso. Streaming vocale,
// reattività cognitiva (colore in base all'umore) e avvisi PROATTIVI a voce.
export default function AmbientMike() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("");
  const [mood, setMood] = useState("calm");
  const recRef = useRef(null);
  const activeRef = useRef(false);
  const spokenRef = useRef(new Set());
  const supported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const accent = listening ? "#f43f5e" : (MOOD_COLOR[mood] || "#22d3ee");
  const active = listening || busy || !!reply;

  const clearSoon = (ms = 9000) => setTimeout(() => { setReply(""); setMood("calm"); activeRef.current = false; }, ms);

  const run = async (text) => {
    if (!text) return;
    activeRef.current = true; setBusy(true); setReply("");
    try {
      const res = await fetch(`${API}/api/master/govern/stream`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command_text: text, lang }),
      });
      if (!res.ok || !res.body) throw new Error("nostream");
      const reader = res.body.getReader(); const dec = new TextDecoder();
      let buf = "", finalText = "", finalMood = "calm", executed = false;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n"); buf = parts.pop() || "";
        for (const p of parts) {
          const line = p.trim(); if (!line.startsWith("data:")) continue;
          let obj; try { obj = JSON.parse(line.slice(5).trim()); } catch { continue; }
          if (obj.meta) { finalMood = obj.meta.mood || finalMood; executed = !!obj.meta.executed; setMood(finalMood); setBusy(false); }
          if (obj.text != null) setReply(obj.text);
          if (obj.done) { finalText = obj.reply || obj.text || finalText; finalMood = obj.mood || finalMood; setMood(finalMood); }
        }
      }
      if (finalText) { try { playTTS(finalText, { lang, voice: "bakemix" }); } catch { /* */ } }
      if (executed) { try { window.dispatchEvent(new Event("mikilab-govern-executed")); } catch { /* */ } }
      clearSoon();
    } catch {
      try {
        const r = await masterApi.govern(text, lang);
        setReply(r.reply || ""); setMood(r.mood || "calm");
        if (r.reply) { try { playTTS(r.reply, { lang, voice: "bakemix" }); } catch { /* */ } }
        if (r.executed) { try { window.dispatchEvent(new Event("mikilab-govern-executed")); } catch { /* */ } }
        clearSoon();
      } catch { setReply(""); activeRef.current = false; }
    } finally { setBusy(false); }
  };

  // Avvisi PROATTIVI (solo per il Capo loggato: l'endpoint è gated → altrimenti 401 ignorato).
  useEffect(() => {
    const poll = async () => {
      if (activeRef.current || listening || busy) return;
      try {
        const r = await mikeApi.proactive(lang);
        const a = (r.alerts || [])[0];
        if (a && !spokenRef.current.has(a.id)) {
          spokenRef.current.add(a.id);
          activeRef.current = true;
          setMood(a.severity === "alert" ? "alert" : "busy");
          setReply(a.text);
          try { playTTS(a.text, { lang, voice: "bakemix" }); } catch { /* */ }
          clearSoon(11000);
        }
      } catch { /* non-admin / offline */ }
    };
    const t0 = setTimeout(poll, 9000);
    const iv = setInterval(poll, 240000);
    return () => { clearTimeout(t0); clearInterval(iv); };
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const engage = () => {
    if (!supported) { setReply(tri("Riconoscimento vocale non disponibile qui.", "Spracherkennung nicht verfügbar.", "Voice not available here.", "Voz no disponible.", "Voix indisponible.", "صدا در دسترس نیست.")); clearSoon(5000); return; }
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
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center pointer-events-none">
      <AnimatePresence>
        {(reply || busy) && (
          <motion.div data-testid="ambient-mike-reply" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto mb-2 max-w-[86vw] sm:max-w-md rounded-2xl px-4 py-2.5 text-sm backdrop-blur-xl"
            style={{ background: "rgba(6,14,22,0.6)", border: `1px solid ${accent}55`, color: "#d6fbff", boxShadow: `0 0 30px ${accent}33` }}>
            {busy && !reply ? tri("Miki-Nexus elabora…", "Miki-Nexus denkt…", "Miki-Nexus is thinking…", "Miki-Nexus procesa…", "Miki-Nexus réfléchit…", "باکومیکس در حال پردازش…") : reply}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aura ambientale: si dissolve nel dark-mode (nessun blocco/pillola) */}
      <div aria-hidden className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[240px] h-[150px] pointer-events-none"
        style={{ background: `radial-gradient(60% 80% at 50% 100%, ${accent}${active ? "2e" : "14"}, transparent 70%)`, transition: "background 600ms ease" }} />

      <button data-testid="ambient-mike-orb" onClick={engage} aria-label="Miki-Nexus"
        className="pointer-events-auto relative w-16 h-16 mb-1 rounded-full flex items-center justify-center active:scale-95 transition-transform"
        style={{ opacity: active ? 1 : 0.62, transition: "opacity 500ms ease" }}>
        <motion.span aria-hidden className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle at 50% 45%, ${accent}66, ${accent}1a 58%, transparent 74%)` }}
          animate={{ scale: listening ? [1, 1.18, 1] : [1, 1.05, 1], opacity: [0.6, 0.95, 0.6] }}
          transition={{ duration: listening ? 0.9 : 3.2, repeat: Infinity, ease: "easeInOut" }} />
        <motion.span aria-hidden className="absolute rounded-full border"
          style={{ width: 58, height: 58, borderColor: `${accent}55` }}
          animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
        <span className="relative z-10 flex items-end gap-[3px] h-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span key={i} className="w-[2.5px] rounded-full" style={{ background: accent, boxShadow: `0 0 5px ${accent}`, opacity: active ? 1 : 0.55 }}
              animate={{ height: listening ? [5, 22, 8, 18, 6][i % 5] : [4, 9, 6, 11, 5][i % 5] }}
              transition={{ duration: listening ? 0.5 : 1.6, repeat: Infinity, repeatType: "mirror", delay: i * 0.08 }} />
          ))}
        </span>
      </button>
      <span className="pointer-events-none pb-2 text-[9px] font-bold uppercase tracking-[0.25em] transition-all duration-500"
        style={{ color: active ? accent : "rgba(148,163,184,0.45)", textShadow: active ? `0 0 8px ${accent}` : "none" }}>
        {listening ? tri("in ascolto", "hört zu", "listening", "escuchando", "à l'écoute", "در حال شنیدن") : "Miki-Nexus"}
      </span>
    </div>
  );
}
