import { useState } from "react";
import { Volume2, Loader2, Square } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { playTTS, stopTTS } from "@/lib/tts";

// Pulsante "Ascolta" — legge un testo con la voce scelta (Momy di default).
export default function ListenButton({ text, who = "momy", className = "", testid = "listen-btn" }) {
  const { lang } = useLang();
  const [state, setState] = useState("idle"); // idle | loading | playing

  const go = async () => {
    if (state === "playing" || state === "loading") { stopTTS(); setState("idle"); return; }
    setState("loading");
    try {
      await playTTS(text, { who, lang, onEnded: () => setState("idle") });
      setState("playing");
    } catch { setState("idle"); }
  };

  const listen = lang === "de" ? "Anhören" : lang === "en" ? "Listen" : "Ascolta";
  const stop = lang === "de" ? "Stopp" : lang === "en" ? "Stop" : "Ferma";

  return (
    <button data-testid={testid} onClick={go}
      className={className || "w-full bg-[#5E8B7E] hover:bg-[#4C7368] text-white font-medium px-4 py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-98 transition-all"}>
      {state === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : state === "playing" ? <Square className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      {state === "playing" ? stop : listen}
    </button>
  );
}
