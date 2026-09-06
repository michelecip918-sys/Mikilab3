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

  const load = useCallback(async () => { try { const r = await bakoApi.timeline(lang); setEvents(r.events || []); } catch { /* */ } }, [lang]);
  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("mikilab-tasks-updated", h);
    const iv = setInterval(load, 15000);
    return () => { window.removeEventListener("mikilab-tasks-updated", h); clearInterval(iv); };
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

  return (
    <div data-testid="timeline-turno">
      <div className="flex items-center gap-3 mb-2 text-[11px]">
        {Object.entries(TYPE).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1 text-[#8aa0b4]"><v.icon className="w-3 h-3" style={{ color: v.c }} /> {k === "lotto" ? tri("Lotti", "Lose", "Batches", "Lotes", "Lots", "دسته") : k === "infornata" ? tri("Infornate", "Backen", "Bakes", "Horneado", "Cuisson", "پخت") : "SOS"}</span>
        ))}
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
          {/* eventi */}
          {events.map((e, i) => {
            const T = TYPE[e.type] || TYPE.lotto;
            const x = (toMin(e.time) - min) * PX;
            const above = e.type !== "sos";
            const top = above ? 70 - 18 - (i % 3) * 16 : 70 + 8 + (i % 2) * 16;
            return (
              <div key={i} data-testid={`timeline-ev-${i}`} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: x, top: above ? 0 : 74 }}>
                {above && <span className="text-[9px] font-bold whitespace-nowrap mb-0.5 max-w-[90px] truncate" style={{ color: T.c }}>{e.time} {e.label}</span>}
                <span className="w-3 h-3 rounded-full border-2" style={{ borderColor: T.c, background: e.resolved ? "transparent" : T.c }} />
                {!above && <span className="text-[9px] font-bold whitespace-nowrap mt-0.5 max-w-[90px] truncate" style={{ color: T.c }}>{e.time} {e.label}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
