import { useRef, useState } from "react";
import { Mic, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { API } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { speak, primeVoice } from "@/lib/voice";

const NAV = [
  { tab: "home", key: "voice_nav_ricette", words: ["home", "bio", "biograf", "michele", "chied", "frag", "chat", "pre-impast", "preimpast", "lievito", "poolish"] },
  { tab: "ricette", key: "voice_nav_ricette", words: ["ricett", "rezept", "pane", "brot", "panettone", "panino"] },
  { tab: "maestro", key: "voice_nav_maestro", words: ["maestro", "strument", "piano", "lavoro", "impast", "knet", "arbeitsplan", "clima", "klima", "settiman", "wochen", "forno", "spesa", "turni", "check", "invers"] },
  { tab: "impara", key: "voice_nav_impara", words: ["principian", "impar", "lern", "quiz", "cors", "kurs", "video"] },
  { tab: "diagnosi", key: "voice_nav_foto", words: ["foto", "diagnos", "difett", "fehler", "bild", "ingredient", "zutat", "macchin", "störung", "guast"] },
  { tab: "news", key: "voice_nav_news", words: ["notizi", "news", "nachricht"] },
];

export default function VoiceAssistant({ onNavigate }) {
  const { t, lang } = useLang();
  const [state, setState] = useState("idle"); // idle | listening | thinking
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [open, setOpen] = useState(false);
  const recRef = useRef(null);
  const sessionRef = useRef(`voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const supported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const askMaestro = async (q) => {
    setState("thinking");
    setAnswer("");
    let full = "";
    try {
      const res = await fetch(`${API}/maestro/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionRef.current, message: q, lang }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: ?/, "").trim();
          if (!line) continue;
          let obj;
          try { obj = JSON.parse(line); } catch { continue; }
          if (obj.d) { full += obj.d; setAnswer(full); }
        }
      }
    } catch {
      full = t("chat_error");
      setAnswer(full);
    }
    setState("idle");
    speak(full.replace(/[#*`_>]/g, ""), lang);
  };

  const handle = (raw) => {
    const text = (raw || "").toLowerCase();
    setTranscript(raw);
    const match = NAV.find((n) => n.words.some((w) => text.includes(w)));
    // Se è una domanda vera (contiene "?", "come", "quanto", "calcola"...) preferisci l'AI
    const looksQuestion = /\?|come|quant|calcol|perch|warum|wie|wie viel|rezept für|ricetta/.test(text);
    if (match && !looksQuestion) {
      onNavigate(match.tab);
      speak(t(match.key), lang);
      setAnswer(t(match.key));
      return;
    }
    askMaestro(raw);
  };

  const start = () => {
    if (!supported) { toast.error(t("voice_unsupported")); return; }
    primeVoice();
    setOpen(true);
    setAnswer("");
    setTranscript("");
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Rec();
    rec.lang = lang === "de" ? "de-DE" : "it-IT";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    rec.onstart = () => setState("listening");
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      handle(text);
    };
    rec.onerror = () => setState("idle");
    rec.onend = () => { if (state === "listening") setState("idle"); };
    recRef.current = rec;
    try { rec.start(); } catch { /* already started */ }
  };

  const stop = () => {
    try { recRef.current?.stop(); } catch { /* ignore */ }
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    setState("idle");
    setOpen(false);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-x-0 bottom-24 z-40 px-4 flex justify-center pointer-events-none">
          <div data-testid="voice-panel" className="pointer-events-auto w-full max-w-xl bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl shadow-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wide text-[#B34A26] flex-1">
                {state === "listening" ? t("voice_listening") : state === "thinking" ? t("voice_thinking") : t("voice_tap")}
              </span>
              <button data-testid="voice-close" onClick={stop} className="text-[#8C7567] p-1"><X className="w-4 h-4" /></button>
            </div>
            {transcript && <p className="text-sm text-[#2C221E] dark:text-[#F5EFE6] font-medium">“{transcript}”</p>}
            {state === "thinking" && (
              <div className="flex items-center gap-2 mt-2 text-[#8C7567] text-sm"><Loader2 className="w-4 h-4 animate-spin" /> {t("voice_thinking")}</div>
            )}
            {answer && (
              <p data-testid="voice-answer" className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-2 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">{answer}</p>
            )}
          </div>
        </div>
      )}

      <div className="fixed z-50 right-4 bottom-24 flex flex-col items-center gap-1">
        <button
          data-testid="voice-assistant-btn"
          onClick={state === "listening" ? stop : start}
          aria-label={t("voice_tap")}
          className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 ${
            state === "listening" ? "bg-[#B4442A] animate-pulse" : "bg-[#B34A26] hover:bg-[#963B1C]"
          }`}
        >
          {state === "idle" && <span aria-hidden className="absolute inset-0 rounded-full bg-[#B34A26] opacity-60 animate-ping" />}
          {state === "thinking" ? <Loader2 className="w-6 h-6 text-white animate-spin relative" /> : <Mic className="w-6 h-6 text-white relative" />}
        </button>
        <span className="text-[9px] font-bold text-[#B34A26] bg-[#FDFBF7]/90 dark:bg-[#1A1412]/90 px-1.5 py-0.5 rounded-full shadow-sm">{t("voice_label")}</span>
      </div>
    </>
  );
}
