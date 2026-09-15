import { useEffect, useRef, useState, useCallback } from "react";
import { Headphones, X, Mic, Loader2, Volume2 } from "lucide-react";
import { playTTS, stopTTS } from "@/lib/tts";
import { labAskApi, productionApi } from "@/lib/api";

const WAKE = /\b(sitor|sìtor|sitore)\b/i;
const DAYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

// Modalità Cuffie: ascolto continuo a mani libere. Dici "Sitor, ..." e Sitor risponde a voce.
export default function HeadphonesMode({ lang = "it", tri, onClose }) {
  const [status, setStatus] = useState("idle"); // idle | listening | thinking | speaking
  const [last, setLast] = useState("");
  const [reply, setReply] = useState("");
  const [supported, setSupported] = useState(true);
  const recRef = useRef(null);
  const activeRef = useRef(true);
  const busyRef = useRef(false);

  const voiceLang = ({ it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR" }[lang] || "it-IT");

  const handle = useCallback(async (phrase) => {
    if (busyRef.current) return;
    const clean = phrase.replace(WAKE, "").trim();
    if (!clean) return;
    busyRef.current = true;
    setLast(clean);
    // Intento locale: "segna 40 pezzi [di baguette]" → registra produzione senza toccare lo schermo.
    const m = clean.match(/segna\s+(\d+)\s*pezzi(?:\s+di\s+(.+))?/i) || clean.match(/(\d+)\s*pezzi\s+(?:di\s+)?(.+)\s+fatt/i);
    try {
      if (m) {
        const qty = parseInt(m[1], 10);
        const prod = (m[2] || "").trim();
        setStatus("thinking");
        await productionApi.log({ day_key: DAYS[(new Date().getDay() + 6) % 7], recipe_name: prod || "Produzione", produced: qty, leftover: 0 });
        const r = tri(`Segnati ${qty} pezzi${prod ? " di " + prod : ""}.`, `${qty} Stück${prod ? " " + prod : ""} erfasst.`, `Logged ${qty} pieces${prod ? " of " + prod : ""}.`, `Anotados ${qty} piezas.`, `${qty} pièces notées.`, `${qty} عدد ثبت شد.`);
        setReply(r); setStatus("speaking");
        playTTS(r, { lang, onEnded: () => { setStatus("listening"); busyRef.current = false; } });
        return;
      }
      setStatus("thinking");
      const d = await labAskApi.ask(clean, lang);
      const ans = d.answer || "";
      setReply(ans); setStatus("speaking");
      playTTS(ans, { lang, onEnded: () => { setStatus("listening"); busyRef.current = false; } });
    } catch {
      setStatus("listening"); busyRef.current = false;
    }
  }, [lang, tri]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = voiceLang; rec.continuous = true; rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = (e.results[i][0].transcript || "").trim();
        if (WAKE.test(t)) handle(t);
      }
    };
    rec.onend = () => { if (activeRef.current) { try { rec.start(); } catch { /* */ } } };
    rec.onerror = () => { /* ignora, onend rilancia */ };
    recRef.current = rec;
    activeRef.current = true;
    try { rec.start(); setStatus("listening"); } catch { /* */ }
    return () => { activeRef.current = false; try { rec.stop(); } catch { /* */ } stopTTS(); };
  }, [voiceLang, handle]);

  const close = () => { activeRef.current = false; try { recRef.current?.stop(); } catch { /* */ } stopTTS(); onClose(); };

  const ring = status === "speaking" ? "#3E9C93" : status === "thinking" ? "#c9a24a" : status === "listening" ? "#3E9C93" : "#64748B";
  const label = status === "speaking" ? tri("Sitor parla…", "Sitor spricht…", "Sitor speaking…", "Sitor habla…", "Sitor parle…", "سیتور صحبت می‌کند…")
    : status === "thinking" ? tri("Sitor pensa…", "Sitor denkt…", "Sitor thinking…", "Sitor piensa…", "Sitor réfléchit…", "سیتور فکر می‌کند…")
    : tri("In ascolto… di' \"Sitor, …\"", "Höre zu… sag \"Sitor, …\"", "Listening… say \"Sitor, …\"", "Escuchando… di \"Sitor, …\"", "À l'écoute… dis \"Sitor, …\"", "در حال شنیدن… بگو «سیتور…»");

  return (
    <div data-testid="headphones-overlay" className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#060A10]/95 backdrop-blur-md p-6">
      <button data-testid="headphones-close" onClick={close} className="absolute top-5 right-5 p-2 rounded-xl text-[#94A3B8] hover:bg-white/10"><X className="w-6 h-6" /></button>
      {!supported ? (
        <p className="text-center text-[#b06e78] max-w-xs">{tri("Le cuffie vocali non sono supportate su questo dispositivo/browser.", "Sprachmodus wird hier nicht unterstützt.", "Voice headphones not supported on this device/browser.", "No soportado en este dispositivo.", "Non supporté sur cet appareil.", "پشتیبانی نمی‌شود.")}</p>
      ) : (
        <>
          <div className="relative flex items-center justify-center w-40 h-40 mb-8">
            <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: ring }} />
            <span className="relative flex items-center justify-center w-32 h-32 rounded-full" style={{ background: `${ring}22`, border: `2px solid ${ring}` }}>
              {status === "thinking" ? <Loader2 className="w-12 h-12 animate-spin" style={{ color: ring }} /> : status === "speaking" ? <Volume2 className="w-12 h-12" style={{ color: ring }} /> : <Mic className="w-12 h-12" style={{ color: ring }} />}
            </span>
          </div>
          <p data-testid="headphones-status" className="text-lg font-bold text-white mb-2">{label}</p>
          {last && <p className="text-sm text-[#94A3B8] mb-1 text-center max-w-md">“{last}”</p>}
          {reply && <p data-testid="headphones-reply" className="text-base text-[#7fd3c9] text-center max-w-md mt-2 leading-relaxed">{reply}</p>}
          <p className="mt-8 text-xs text-[#64748B] text-center max-w-xs">{tri("Esempi: \"Sitor, quanto impasto per le baguette?\" · \"Sitor, segna 40 pezzi di baguette\"", "Beispiele…", "Examples: \"Sitor, how much dough for baguettes?\" · \"Sitor, log 40 baguettes\"", "Ejemplos…", "Exemples…", "مثال‌ها…")}</p>
        </>
      )}
    </div>
  );
}
