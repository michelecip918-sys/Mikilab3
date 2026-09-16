import { useEffect, useRef, useState, useCallback } from "react";
import { Headphones, X, Mic, Loader2, Volume2, PhoneCall, Check, XCircle } from "lucide-react";
import { playTTS, stopTTS } from "@/lib/tts";
import { labAskApi, productionApi, coordinationApi } from "@/lib/api";

const WAKE = /\b(sitor|sìtor|sitore)\b/i;
const YES = /\b(s[iì]|sì|yes|ok|okay|va bene|certo|accetto|ja|oui|d'accordo|arrivo)\b/i;
const NO = /\b(no|nein|non|niente|non posso|occupato|impossibile)\b/i;
const DAYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

// Modalità Cuffie: ascolto continuo a mani libere. Dici "Sitor, ..." e Sitor risponde a voce.
// Riceve anche le CHIAMATE DI COORDINAMENTO (assegnazione task) con risposta a voce sì/no.
export default function HeadphonesMode({ lang = "it", tri, operator = "", onClose }) {
  const [status, setStatus] = useState("idle"); // idle | listening | thinking | speaking
  const [last, setLast] = useState("");
  const [reply, setReply] = useState("");
  const [supported, setSupported] = useState(true);
  const [call, setCall] = useState(null); // chiamata di coordinamento in attesa di risposta
  const recRef = useRef(null);
  const activeRef = useRef(true);
  const busyRef = useRef(false);
  const callRef = useRef(null);
  useEffect(() => { callRef.current = call; }, [call]);

  const voiceLang = ({ it: "it-IT", de: "de-DE", en: "en-US", es: "es-ES", fr: "fr-FR", fa: "fa-IR" }[lang] || "it-IT");

  // Risposta a una chiamata di coordinamento (sì/no), a voce o con tocco.
  const answerCall = useCallback(async (yes) => {
    const c = callRef.current;
    if (!c) return;
    setCall(null); callRef.current = null;
    try {
      const r = await coordinationApi.respond(c.id, yes ? "si" : "no", operator);
      const ok = yes && r.status === "accepted";
      const msg = ok
        ? tri("Perfetto, ci pensi tu. Buon lavoro.", "Perfekt, du übernimmst. Gute Arbeit.", "Great, you've got it. Good work.", "Perfecto, te encargas tú.", "Parfait, tu t'en occupes.", "عالی، تو انجامش می‌دهی.")
        : tri("Va bene, passo al prossimo.", "Okay, ich frage den nächsten.", "Okay, moving to the next.", "Vale, paso al siguiente.", "D'accord, je passe au suivant.", "باشه، به نفر بعدی می‌روم.");
      setReply(msg); setStatus("speaking");
      playTTS(msg, { lang, onEnded: () => { setStatus("listening"); busyRef.current = false; } });
    } catch { busyRef.current = false; setStatus("listening"); }
  }, [lang, operator, tri]);

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

  const onPhrase = useCallback((t) => {
    // Se c'è una chiamata di coordinamento in attesa: sì/no risponde SENZA wake-word.
    if (callRef.current) {
      if (YES.test(t)) { answerCall(true); return; }
      if (NO.test(t)) { answerCall(false); return; }
    }
    if (WAKE.test(t)) handle(t);
  }, [answerCall, handle]);

  // Polling delle chiamate di coordinamento indirizzate a questo operatore.
  useEffect(() => {
    if (!operator) return;
    let alive = true;
    const poll = async () => {
      if (!alive || callRef.current || busyRef.current) return;
      try {
        const d = await coordinationApi.pendingCall(operator);
        if (alive && d && d.has_call && d.call) {
          setCall(d.call); callRef.current = d.call;
          setStatus("speaking");
          const spoken = d.spoken + " " + tri("Rispondi sì o no.", "Antworte ja oder nein.", "Answer yes or no.", "Responde sí o no.", "Réponds oui ou non.", "بله یا خیر بگو.");
          setReply(spoken);
          playTTS(spoken, { lang, onEnded: () => setStatus("listening") });
        }
      } catch { /* */ }
    };
    const t = setInterval(poll, 6000);
    poll();
    return () => { alive = false; clearInterval(t); };
  }, [operator, lang, tri]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = voiceLang; rec.continuous = true; rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = (e.results[i][0].transcript || "").trim();
        onPhrase(t);
      }
    };
    rec.onend = () => { if (activeRef.current) { try { rec.start(); } catch { /* */ } } };
    rec.onerror = () => { /* ignora, onend rilancia */ };
    recRef.current = rec;
    activeRef.current = true;
    try { rec.start(); setStatus("listening"); } catch { /* */ }
    return () => { activeRef.current = false; try { rec.stop(); } catch { /* */ } stopTTS(); };
  }, [voiceLang, onPhrase]);

  const close = () => { activeRef.current = false; try { recRef.current?.stop(); } catch { /* */ } stopTTS(); onClose(); };

  const ring = status === "speaking" ? "#7E9A82" : status === "thinking" ? "#c9a24a" : status === "listening" ? "#7E9A82" : "#64748B";
  const label = status === "speaking" ? tri("Sitor parla…", "Sitor spricht…", "Sitor speaking…", "Sitor habla…", "Sitor parle…", "سیتور صحبت می‌کند…")
    : status === "thinking" ? tri("Sitor pensa…", "Sitor denkt…", "Sitor thinking…", "Sitor piensa…", "Sitor réfléchit…", "سیتور فکر می‌کند…")
    : tri("In ascolto… di' \"Sitor, …\"", "Höre zu… sag \"Sitor, …\"", "Listening… say \"Sitor, …\"", "Escuchando… di \"Sitor, …\"", "À l'écoute… dis \"Sitor, …\"", "در حال شنیدن… بگو «سیتور…»");

  return (
    <div data-testid="headphones-overlay" className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#18181A]/95 backdrop-blur-md p-6">
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

          {call && (
            <div data-testid="headphones-call" className="mt-6 w-full max-w-sm rounded-2xl bg-[#242427] border border-[#D97736]/50 p-4">
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#D97736] mb-1"><PhoneCall className="w-3.5 h-3.5" /> {tri("Chiamata di coordinamento", "Koordinationsruf", "Coordination call", "Llamada de coordinación", "Appel de coordination", "تماس هماهنگی")}</p>
              <p className="text-sm text-white font-bold mb-3">{call.task_desc}</p>
              <div className="grid grid-cols-2 gap-2">
                <button data-testid="headphones-call-yes" onClick={() => answerCall(true)} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#7E9A82] text-white font-bold active:scale-95"><Check className="w-4 h-4" /> {tri("Sì", "Ja", "Yes", "Sí", "Oui", "بله")}</button>
                <button data-testid="headphones-call-no" onClick={() => answerCall(false)} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#3a2a2a] text-[#e0a878] border border-[#D97736]/40 font-bold active:scale-95"><XCircle className="w-4 h-4" /> {tri("No", "Nein", "No", "No", "Non", "خیر")}</button>
              </div>
              <p className="text-[11px] text-[#94A3B8] text-center mt-2">{tri("Puoi rispondere anche a voce: «sì» o «no»", "Du kannst auch per Stimme antworten.", "You can also answer by voice.", "También puedes responder por voz.", "Tu peux aussi répondre à la voix.", "می‌توانی با صدا هم پاسخ دهی.")}</p>
            </div>
          )}
          <p className="mt-8 text-xs text-[#64748B] text-center max-w-xs">{tri("Esempi: \"Sitor, quanto impasto per le baguette?\" · \"Sitor, segna 40 pezzi di baguette\"", "Beispiele…", "Examples: \"Sitor, how much dough for baguettes?\" · \"Sitor, log 40 baguettes\"", "Ejemplos…", "Exemples…", "مثال‌ها…")}</p>
        </>
      )}
    </div>
  );
}
