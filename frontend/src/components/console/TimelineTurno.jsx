import { useEffect, useState, useCallback } from "react";
import { Croissant, Flame, AlertOctagon, GanttChartSquare } from "lucide-react";
import { bakoApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const TYPE = {
  lotto: { c: "#00F0FF", icon: Croissant },
  infornata: { c: "#FFB800", icon: Flame },
  sos: { c: "#f43f5e", icon: AlertOctagon },
};
const toMin = (t) => { const [h, m] = (t || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };

// v14 · Timeline di turno: lotti, infornate e SOS su un'unica linea del tempo scorrevole.
export default function TimelineTurno() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [events, setEvents] = useState([]);
  const [nowMin, setNowMin] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });

  const load = useCallback(async () => { try { const r = await bakoApi.timeline(lang); setEvents(r.events || []); } catch { /* */ } }, [lang]);
  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("mikilab-tasks-updated", h);
    const iv = setInterval(load, 15000);
    const nowIv = setInterval(() => { const d = new Date(); setNowMin(d.getHours() * 60 + d.getMinutes()); }, 20000);
    return () => { window.removeEventListener("mikilab-tasks-updated", h); clearInterval(iv); clearInterval(nowIv); };
  }, [load]);

  if (!events.length) {
    return <p data-testid="timeline-empty" className="text-sm text-[#7d97ac] py-3">{tri("Nessun evento di turno. Genera un piano o attendi gli SOS.", "Keine Schichtereignisse.", "No shift events yet. Generate a plan or wait for SOS.", "Sin eventos de turno.", "Aucun événement.", "هیچ رویدادی نیست.")}</p>;
  }

  const mins = events.map((e) => toMin(e.time));
  const min = Math.max(0, Math.min(...mins) - 30);
  const max = Math.max(...mins) + 60;
  const range = Math.max(60, max - min);
  const PX = 5; // px per minuto
  const width = range * PX;
  // Tacche orarie ogni 60'
  const startH = Math.ceil(min / 60);
  const ticks = [];
  for (let h = startH * 60; h <= max; h += 60) ticks.push(h);
  const nowInRange = nowMin >= min && nowMin <= max;
  const nextIdx = events.findIndex((e) => toMin(e.time) >= nowMin);

  return (
    <div data-testid="timeline-turno">
      <div className="flex items-center gap-3 mb-2 text-[11px]">
        {Object.entries(TYPE).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1 text-[#8aa0b4]"><v.icon className="w-3 h-3" style={{ color: v.c }} /> {k === "lotto" ? tri("Lotti", "Lose", "Batches", "Lotes", "Lots", "دسته") : k === "infornata" ? tri("Infornate", "Backen", "Bakes", "Horneado", "Cuisson", "پخت") : "SOS"}</span>
        ))}
        {nowInRange && <span className="inline-flex items-center gap-1 text-[#f43f5e] font-bold ml-auto"><span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse" /> {tri("ADESSO", "JETZT", "NOW", "AHORA", "MAINTENANT", "اکنون")}</span>}
      </div>
      <div className="overflow-x-auto pb-2" data-testid="timeline-scroll">
        <div className="relative" style={{ width, minWidth: "100%", height: 130 }}>
          {/* asse */}
          <div className="absolute left-0 right-0 top-[70px] h-px bg-[#1e293b]" />
          {ticks.map((tk) => (
            <div key={tk} className="absolute top-0 bottom-0" style={{ left: (tk - min) * PX }}>
              <div className="absolute top-[64px] w-px h-3 bg-[#334155]" />
              <span className="absolute top-[80px] -translate-x-1/2 text-[10px] font-mono-data text-[#64748b]">{String(Math.floor(tk / 60) % 24).padStart(2, "0")}:00</span>
            </div>
          ))}
          {/* linea ADESSO */}
          {nowInRange && (
            <div data-testid="timeline-now" className="absolute top-2 bottom-6 w-[2px] bg-[#f43f5e] z-10" style={{ left: (nowMin - min) * PX }}>
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#f43f5e] shadow-[0_0_8px_#f43f5e]" />
            </div>
          )}
          {/* eventi */}
          {events.map((e, i) => {
            const T = TYPE[e.type] || TYPE.lotto;
            const x = (toMin(e.time) - min) * PX;
            const above = e.type !== "sos";
            const isNext = i === nextIdx;
            return (
              <div key={i} data-testid={`timeline-ev-${i}`} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: x, top: above ? 0 : 74 }}>
                {above && <span className="text-[9px] font-bold whitespace-nowrap mb-0.5 max-w-[90px] truncate" style={{ color: T.c }}>{e.time} {e.label}</span>}
                <span className="rounded-full border-2" style={{ width: isNext ? 16 : 12, height: isNext ? 16 : 12, borderColor: T.c, background: e.resolved ? "transparent" : T.c, boxShadow: isNext ? `0 0 10px ${T.c}` : "none" }} />
                {!above && <span className="text-[9px] font-bold whitespace-nowrap mt-0.5 max-w-[90px] truncate" style={{ color: T.c }}>{e.time} {e.label}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
