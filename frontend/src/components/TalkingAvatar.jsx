import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Video parlante di Michele (H.264 720p faststart, servito same-origin da /public).
export const MICHELE_VIDEO = (process.env.PUBLIC_URL || "") + "/michele-talking.mp4";

export default function TalkingAvatar({
  poster = "/michele-avatar.jpg",
  label,
  className = "",
  round = false,
  testid = "talking-avatar",
}) {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const videoRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const toggle = () => {
    const v = videoRef.current;
    if (!v || failed) return;
    if (!started) { setStarted(true); const p = v.play(); if (p && p.catch) p.catch(() => {}); setPlaying(true); return; }
    if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  return (
    <div data-testid={testid} className={`relative overflow-hidden ${round ? "rounded-full" : "rounded-2xl"} bg-black ${className}`}>
      <video
        ref={videoRef}
        poster={process.env.PUBLIC_URL + poster}
        preload="none"
        playsInline
        loop
        className="w-full h-full object-cover"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => { setFailed(true); setPlaying(false); }}
      >
        <source src={(process.env.PUBLIC_URL || "") + "/michele-talking.webm"} type="video/webm" />
        <source src={MICHELE_VIDEO} type="video/mp4" />
      </video>
      {/* Overlay comandi */}
      <button
        type="button"
        data-testid={`${testid}-play`}
        onClick={toggle}
        aria-label={playing ? "Pausa" : "Play"}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/25 hover:bg-black/15 transition-colors"
        style={{ opacity: playing ? 0 : 1 }}
      >
        <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          {playing ? <Pause className="w-7 h-7 text-[#33564E]" /> : <Play className="w-7 h-7 text-[#33564E] ml-1" />}
        </span>
        {label && <span className="text-white font-semibold text-sm drop-shadow px-3 text-center">{label || tri("Guarda il messaggio di Michele", "Michele's Nachricht ansehen", "Watch Michele's message")}</span>}
      </button>
      {/* Bottone pausa piccolo quando in play */}
      {playing && (
        <button type="button" onClick={toggle} data-testid={`${testid}-pause`}
          className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center">
          <Pause className="w-4 h-4 text-white" />
        </button>
      )}
    </div>
  );
}
