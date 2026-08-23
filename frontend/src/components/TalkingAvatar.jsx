import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Avatar parlante di Michele. Il video cambia lingua automaticamente (IT/DE/EN)
// in base alla lingua dell'app. Carica solo al tocco (preload="none").
const BASE = process.env.PUBLIC_URL || "";

const TRANSCRIPT = {
  it: "Ciao! Sono Michele. MikiLab ti aiuta a panificare come un pro: Ricette con dosi precise, il Tuo Laboratorio per pianificare e calcolare, la Diagnosi con foto, la sezione Impara (video mentore, ricettario, Enciclopedia) e la Community.",
  de: "Hallo! Ich bin Michele. MikiLab hilft dir, wie ein Profi zu backen: Rezepte mit genauen Mengen, dein Labor zum Planen und Berechnen, die Foto-Diagnose, der Bereich Lernen (Mentor-Videos, Rezeptbuch, Brot-Lexikon) und die Community.",
  en: "Hi! I'm Michele. MikiLab helps you bake like a pro: Recipes with precise doses, Your Lab to plan and calculate, photo Diagnosis, the Learn section (mentor videos, recipe book, Bread Encyclopedia) and the Community.",
};

export default function TalkingAvatar({ className = "", testid = "talking-avatar", showTranscript = true }) {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const videoRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  // Cambio lingua → ricarica la sorgente corretta
  useEffect(() => {
    const v = videoRef.current;
    if (v && started) { v.pause(); v.load(); setStarted(false); setPlaying(false); }
  }, [lang]); // eslint-disable-line

  const toggle = () => {
    const v = videoRef.current;
    if (!v || failed) return;
    if (!started) { setStarted(true); const p = v.play(); if (p && p.catch) p.catch(() => {}); return; }
    if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else { v.pause(); }
  };

  return (
    <div>
      <div data-testid={testid} className={`relative overflow-hidden rounded-2xl bg-black ${className}`}>
        <video
          key={lang}
          ref={videoRef}
          poster={BASE + "/michele-avatar-talk.jpg"}
          preload="none"
          playsInline
          className="w-full h-full object-cover object-top"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setStarted(false); }}
          onError={() => { setFailed(true); setPlaying(false); }}
        >
          <source src={`${BASE}/michele-explainer-${lang}.webm`} type="video/webm" />
          <source src={`${BASE}/michele-explainer-${lang}.mp4`} type="video/mp4" />
        </video>

        <button type="button" data-testid={`${testid}-play`} onClick={toggle} aria-label={playing ? "Pausa" : "Play"}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/25 hover:bg-black/15 transition-colors"
          style={{ opacity: playing ? 0 : 1, pointerEvents: playing ? "none" : "auto" }}>
          <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-7 h-7 text-[#33564E] ml-1" />
          </span>
          <span className="text-white font-semibold text-sm drop-shadow px-3 text-center">
            {tri("Guarda la presentazione", "Vorstellung ansehen", "Watch the intro")}
          </span>
        </button>

        {playing && (
          <button type="button" onClick={toggle} data-testid={`${testid}-pause`}
            className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
            <Pause className="w-4 h-4 text-white" />
          </button>
        )}

        <span className="absolute top-2 left-2 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded-full uppercase">
          {lang}
        </span>
      </div>

      {showTranscript && (
        <p data-testid={`${testid}-transcript`} className="mt-2 text-xs text-[#7E8A93] flex items-start gap-1.5 leading-snug">
          <Volume2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {TRANSCRIPT[lang] || TRANSCRIPT.it}
        </p>
      )}
    </div>
  );
}
