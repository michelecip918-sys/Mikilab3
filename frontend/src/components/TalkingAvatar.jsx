import { useRef, useEffect } from "react";
import { Volume2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Avatar parlante di Michele. Player NATIVO (controlli standard) per la massima
// compatibilità su iOS/Android/desktop. Il video cambia lingua con l'app (IT/DE/EN).
const BASE = process.env.PUBLIC_URL || "";

const TRANSCRIPT = {
  it: "Ciao! Sono Michele. MikiLab ti aiuta a panificare come un pro: Ricette con dosi precise, il Tuo Laboratorio per pianificare e calcolare, la Diagnosi con foto, la sezione Impara e la Community.",
  de: "Hallo! Ich bin Michele. MikiLab hilft dir, wie ein Profi zu backen: Rezepte mit genauen Mengen, dein Labor zum Planen und Berechnen, die Foto-Diagnose, der Bereich Lernen und die Community.",
  en: "Hi! I'm Michele. MikiLab helps you bake like a pro: Recipes with precise doses, Your Lab to plan and calculate, photo Diagnosis, the Learn section and the Community.",
};

export default function TalkingAvatar({ className = "", testid = "talking-avatar", showTranscript = true, transcript = null }) {
  const { lang } = useLang();
  const videoRef = useRef(null);

  // Cambio lingua → ricarica la sorgente corretta
  useEffect(() => {
    const v = videoRef.current;
    if (v) { try { v.pause(); v.load(); } catch (e) { /* noop */ } }
  }, [lang]);

  return (
    <div>
      <div data-testid={testid} className={`relative overflow-hidden rounded-2xl bg-black ${className}`}>
        <video
          key={lang}
          ref={videoRef}
          controls
          controlsList="nodownload"
          playsInline
          preload="metadata"
          poster={BASE + "/michele-avatar-talk.jpg"}
          className="w-full h-full object-contain bg-black"
        >
          <source src={`${BASE}/michele-explainer-${lang}.mp4`} type="video/mp4" />
          <source src={`${BASE}/michele-explainer-${lang}.webm`} type="video/webm" />
        </video>
        <span className="absolute top-2 left-2 z-10 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded-full uppercase pointer-events-none">
          {lang}
        </span>
      </div>

      {showTranscript && (
        <p data-testid={`${testid}-transcript`} className="mt-2 text-xs text-[#7E8A93] flex items-start gap-1.5 leading-snug">
          <Volume2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {transcript || TRANSCRIPT[lang] || TRANSCRIPT.it}
        </p>
      )}
    </div>
  );
}
