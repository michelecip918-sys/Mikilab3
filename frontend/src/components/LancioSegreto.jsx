import { useState, useEffect, useMemo } from "react";
import { X, CalendarPlus, Share2, Flame } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useBackClose } from "@/lib/backNav";
import { toast } from "sonner";

// V84 — "Il forno si accende": conto alla rovescia SEGRETO per il 16 ottobre 2026
// (Giornata mondiale del pane), giorno in cui MikiLab si accende ufficialmente.
//
// Come si apre (nessun link visibile nel sito):
//   1) tocca 8 volte di seguito il polpo nel footer (8 come i tentacoli);
//   2) oppure l'indirizzo segreto  mikilab.de/?forno=1  (da usare come teaser su TikTok).
// Chi lo trova vede da quel momento un piccolo punto ambra accanto al polpo, per riaprirlo.
//
// Privacy: tutto nel browser. Il promemoria è un file .ics creato in locale (Blob), la
// condivisione usa navigator.share o la clipboard. Nessuna chiamata al server, nessun contatore.

export const LAUNCH_KEY = "mikilab_forno_trovato";
// 16 ottobre 2026 alle 00:00 ora locale del dispositivo (Giornata mondiale del pane).
export const LAUNCH_DATE = new Date(2026, 9, 16, 0, 0, 0, 0);
// Da quando "l'impasto lievita": il giorno in cui è stato messo il segreto.
const START_DATE = new Date(2026, 8, 22, 0, 0, 0, 0);
const DAY_MS = 86400000;

export function launchPhase(now = Date.now()) {
  const t0 = LAUNCH_DATE.getTime();
  if (now < t0) return "before";
  if (now < t0 + DAY_MS) return "today";
  return "after";
}

function pad(n) { return String(n).padStart(2, "0"); }
function icsStamp(d) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

export default function LancioSegreto({ onClose }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  useBackClose(true, onClose);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try { localStorage.setItem(LAUNCH_KEY, "1"); } catch { /* */ }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const phase = launchPhase(now);
  const diff = Math.max(0, LAUNCH_DATE.getTime() - now);
  const days = Math.floor(diff / DAY_MS);
  const hours = Math.floor((diff % DAY_MS) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  // Quanto è "lievitato" l'impasto: 0 → 1 tra il giorno del segreto e il lancio.
  const progress = useMemo(() => {
    const a = START_DATE.getTime(), b = LAUNCH_DATE.getTime();
    return Math.min(1, Math.max(0, (now - a) / (b - a)));
  }, [now]);
  const daysSince = Math.floor((now - LAUNCH_DATE.getTime()) / DAY_MS);

  const dateLabel = tri("16 ottobre 2026", "16. Oktober 2026", "16 October 2026");
  const secretUrl = "https://mikilab.de/?forno=1";

  const remind = () => {
    try {
      const start = new Date(2026, 9, 16, 8, 0, 0, 0);
      const end = new Date(2026, 9, 16, 9, 0, 0, 0);
      const title = tri("MikiLab si accende — Giornata mondiale del pane", "MikiLab geht an — Welttag des Brotes", "MikiLab lights up — World Bread Day");
      const desc = tri("Il ricettario gratuito di Michele apre ufficialmente. Il pane di oggi lo facciamo insieme: mikilab.de", "Micheles kostenloses Rezeptbuch öffnet offiziell. Das Brot von heute backen wir zusammen: mikilab.de", "Michele's free recipe book officially opens. Today's bread we make together: mikilab.de");
      const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MikiLab//Forno//IT", "BEGIN:VEVENT",
        `UID:mikilab-forno-2026@mikilab.de`, `DTSTAMP:${icsStamp(new Date())}`, `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
        `SUMMARY:${title}`, `DESCRIPTION:${desc}`, "URL:https://mikilab.de", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "mikilab-16-ottobre.ics"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success(tri("Promemoria creato: aprilo per aggiungerlo al calendario.", "Erinnerung erstellt: öffnen, um sie in den Kalender zu legen.", "Reminder created: open it to add it to your calendar."));
    } catch { toast.error(tri("Non sono riuscito a creare il promemoria.", "Erinnerung konnte nicht erstellt werden.", "Couldn't create the reminder.")); }
  };

  const share = async () => {
    const text = tri("Psst… il 16 ottobre si accende un forno. Trova il segreto:", "Psst… am 16. Oktober geht ein Ofen an. Finde das Geheimnis:", "Psst… on 16 October an oven lights up. Find the secret:");
    try {
      if (navigator.share) { await navigator.share({ title: "MikiLab", text, url: secretUrl }); return; }
      await navigator.clipboard.writeText(`${text} ${secretUrl}`);
      toast.success(tri("Link segreto copiato.", "Geheimer Link kopiert.", "Secret link copied."));
    } catch { /* annullato dall'utente */ }
  };

  // Fiocchi di farina per il giorno del lancio (solo CSS, rispetta prefers-reduced-motion).
  const flakes = useMemo(() => Array.from({ length: 26 }, (_, i) => ({ l: (i * 37) % 100, d: (i % 7) * 0.45, s: 6 + (i % 5) * 2, t: 6 + (i % 4) })), []);

  return (
    <div data-testid="forno-segreto" role="dialog" aria-modal="true" className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#1F2124]/92 backdrop-blur-sm" onClick={onClose}>
      <style>{`
        @keyframes fs-glow{0%,100%{opacity:.55}50%{opacity:1}}
        @keyframes fs-rise{0%{transform:translateY(0)}50%{transform:translateY(-2px)}100%{transform:translateY(0)}}
        @keyframes fs-flake{0%{transform:translateY(-20px) rotate(0)}100%{transform:translateY(105vh) rotate(360deg)}}
        .fs-glow{animation:fs-glow 2.6s ease-in-out infinite}
        .fs-dough{animation:fs-rise 3.2s ease-in-out infinite}
        .fs-flake{position:absolute;top:-20px;border-radius:50%;background:#F6F1E7;opacity:.85;animation:fs-flake linear infinite}
        @media (prefers-reduced-motion:reduce){.fs-glow,.fs-dough,.fs-flake{animation:none}}
      `}</style>
      {phase === "today" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {flakes.map((f, i) => <span key={i} className="fs-flake" style={{ left: `${f.l}%`, width: f.s, height: f.s, animationDelay: `${f.d}s`, animationDuration: `${f.t}s` }} />)}
        </div>
      )}
      <div className="relative w-full max-w-md rounded-3xl border border-[#E9A23B]/40 bg-[#2A2D31] text-[#F6F1E7] shadow-2xl p-6 sm:p-7" onClick={(e) => e.stopPropagation()}>
        <button data-testid="forno-close" onClick={onClose} aria-label={tri("Chiudi", "Schließen", "Close")} className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 active:scale-95"><X className="w-5 h-5" /></button>

        <p className="font-mono-data text-[10px] tracking-[0.3em] uppercase text-[#E9A23B] mb-1">
          {phase === "before" ? tri("Hai trovato il segreto", "Du hast das Geheimnis gefunden", "You found the secret") : tri("Giornata mondiale del pane", "Welttag des Brotes", "World Bread Day")}
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-black leading-tight">
          {phase === "before" && tri("Il forno si accende il 16 ottobre.", "Der Ofen geht am 16. Oktober an.", "The oven lights up on 16 October.")}
          {phase === "today" && tri("Oggi il forno è acceso.", "Heute ist der Ofen an.", "Today the oven is on.")}
          {phase === "after" && tri("Il forno è acceso dal 16 ottobre 2026.", "Der Ofen ist seit dem 16. Oktober 2026 an.", "The oven has been on since 16 October 2026.")}
        </h2>
        <p className="text-sm text-[#F6F1E7]/80 mt-2">
          {phase === "before" && tri(`${dateLabel} è la Giornata mondiale del pane: quel giorno MikiLab si accende ufficialmente. Fino ad allora l'impasto lievita.`, `Der ${dateLabel} ist der Welttag des Brotes: an diesem Tag geht MikiLab offiziell an. Bis dahin geht der Teig.`, `${dateLabel} is World Bread Day: that day MikiLab officially lights up. Until then, the dough is rising.`)}
          {phase === "today" && tri("MikiLab, il ricettario gratuito di Michele, è ufficialmente aperto. Il pane di oggi lo facciamo insieme.", "MikiLab, Micheles kostenloses Rezeptbuch, ist offiziell eröffnet. Das Brot von heute backen wir zusammen.", "MikiLab, Michele's free recipe book, is officially open. Today's bread we make together.")}
          {phase === "after" && tri(`Giorni di forno acceso: ${daysSince}. Grazie di essere qui.`, `Tage mit brennendem Ofen: ${daysSince}. Danke, dass du hier bist.`, `Days with the oven on: ${daysSince}. Thank you for being here.`)}
        </p>

        {/* Il forno: il bagliore dentro cresce con l'avvicinarsi del 16 ottobre */}
        <div className="my-5 flex justify-center" aria-hidden>
          <svg viewBox="0 0 220 150" width="220" height="150">
            <rect x="10" y="10" width="200" height="130" rx="14" fill="#3A3D42" stroke="#D9CFBC" strokeWidth="2" />
            <rect x="30" y="30" width="160" height="80" rx="10" fill="#111214" />
            <rect x="30" y="30" width="160" height="80" rx="10" fill="#E9A23B" opacity={phase === "before" ? 0.12 + progress * 0.55 : 0.75} className="fs-glow" />
            <ellipse className="fs-dough" cx="110" cy={92 - (phase === "before" ? progress * 18 : 18)} rx={48 + (phase === "before" ? progress * 14 : 14)} ry={18 + (phase === "before" ? progress * 10 : 10)} fill="#D9A566" stroke="#A15621" strokeWidth="2" />
            <path d="M40 120 H180" stroke="#D9CFBC" strokeWidth="3" strokeLinecap="round" />
            <circle cx="60" cy="130" r="4" fill={phase === "before" ? "#5B5F66" : "#E9A23B"} />
            <circle cx="160" cy="130" r="4" fill={phase === "before" ? "#5B5F66" : "#E9A23B"} />
            {phase !== "before" && <Flame x="98" y="40" width="24" height="24" color="#E9A23B" />}
          </svg>
        </div>

        {phase === "before" && (
          <div data-testid="forno-countdown" className="grid grid-cols-4 gap-2 text-center" aria-live="polite">
            {[[days, tri("giorni", "Tage", "days")], [hours, tri("ore", "Std.", "hours")], [mins, tri("min", "Min.", "min")], [secs, tri("sec", "Sek.", "sec")]].map(([v, l], i) => (
              <div key={i} className="rounded-2xl bg-[#1F2124] border border-white/10 py-3">
                <p className="font-mono-data text-2xl sm:text-3xl font-black text-[#E9A23B] tabular-nums">{pad(v)}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#F6F1E7]/60">{l}</p>
              </div>
            ))}
          </div>
        )}
        {phase === "before" && (
          <p className="text-[11px] text-[#F6F1E7]/60 mt-2 text-center">{tri(`L'impasto è lievitato al ${Math.round(progress * 100)}%.`, `Der Teig ist zu ${Math.round(progress * 100)} % gegangen.`, `The dough has risen ${Math.round(progress * 100)}%.`)}</p>
        )}

        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          {phase === "before" && (
            <button data-testid="forno-remind" onClick={remind} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E9A23B] text-[#1F2124] font-bold text-sm active:scale-95 transition-all">
              <CalendarPlus className="w-4 h-4" /> {tri("Ricordamelo", "Erinnere mich", "Remind me")}
            </button>
          )}
          <button data-testid="forno-share" onClick={share} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E9A23B]/60 text-[#F6F1E7] font-bold text-sm active:scale-95 transition-all">
            <Share2 className="w-4 h-4" /> {phase === "before" ? tri("Passa il segreto", "Geheimnis weitergeben", "Pass the secret") : tri("Condividi", "Teilen", "Share")}
          </button>
        </div>

        <p className="text-[11px] text-[#F6F1E7]/55 mt-4 text-center">
          {tri("Un segreto di Sitor, l'avatar IA di Michele. Tutto resta nel tuo dispositivo.", "Ein Geheimnis von Sitor, Micheles KI-Avatar. Alles bleibt auf deinem Gerät.", "A secret from Sitor, Michele's AI avatar. Everything stays on your device.")}
        </p>
      </div>
    </div>
  );
}

// Piccola striscia in Home, SOLO il 16 ottobre (il giorno del lancio), chiudibile.
export function LancioBanner({ onOpen }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [hide, setHide] = useState(() => { try { return localStorage.getItem("mikilab_forno_banner_chiuso") === "1"; } catch { return false; } });
  if (launchPhase() !== "today" || hide) return null;
  return (
    <div data-testid="forno-banner" className="mb-4 rounded-2xl border border-ambra/50 bg-ambra/15 px-4 py-3 flex items-center gap-3">
      <Flame className="w-5 h-5 text-ambra shrink-0" />
      <button onClick={onOpen} className="flex-1 text-left text-sm font-bold text-foreground">
        {tri("Oggi è la Giornata mondiale del pane: MikiLab si accende ufficialmente.", "Heute ist Welttag des Brotes: MikiLab geht offiziell an.", "Today is World Bread Day: MikiLab officially lights up.")}
      </button>
      <button aria-label={tri("Chiudi", "Schließen", "Close")} onClick={() => { setHide(true); try { localStorage.setItem("mikilab_forno_banner_chiuso", "1"); } catch { /* */ } }} className="p-1 rounded-full hover:bg-background/60"><X className="w-4 h-4" /></button>
    </div>
  );
}
