import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, RotateCcw, Play } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Timetable di lievitazione concatenata: fasi sequenziali con orari calcolati a catena.
const DEFAULTS = (tri) => [
  { name: tri("Autolisi", "Autolyse", "Autolyse"), min: 30 },
  { name: tri("Puntata (massa)", "Stockgare", "Bulk ferment"), min: 120 },
  { name: tri("Appretto (forma)", "Stückgare", "Final proof"), min: 60 },
  { name: tri("Infornata", "Backen", "Bake"), min: 20 },
];

const KEY = "mikilab_timetable_v1";
const pad = (n) => String(n).padStart(2, "0");
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const addMin = (hm, min) => {
  const [h, m] = hm.split(":").map(Number);
  const tot = h * 60 + m + min;
  const hh = Math.floor((tot % 1440 + 1440) % 1440 / 60);
  const mm = ((tot % 60) + 60) % 60;
  return `${pad(hh)}:${pad(mm)}`;
};

export default function TimetableLievitazione() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [start, setStart] = useState(nowHM());
  const [phases, setPhases] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s?.phases?.length) return s.phases; } catch { /* */ }
    return DEFAULTS(tri);
  });

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ phases })); } catch { /* */ } }, [phases]);

  const setPhase = (i, patch) => setPhases((l) => l.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const addPhase = () => setPhases((l) => [...l, { name: tri("Nuova fase", "Neue Phase", "New phase"), min: 30 }]);
  const del = (i) => setPhases((l) => l.filter((_, k) => k !== i));
  const reset = () => setPhases(DEFAULTS(tri));

  const totalMin = phases.reduce((a, p) => a + (Number(p.min) || 0), 0);
  const endTime = addMin(start, totalMin);
  let cursor = start;
  const rows = phases.map((p) => { const s = cursor; const e = addMin(cursor, Number(p.min) || 0); cursor = e; return { ...p, start: s, end: e }; });

  const fmtDur = (m) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? pad(m % 60) : ""}` : `${m}m`);

  return (
    <div data-testid="timetable-lievitazione" className="pb-8">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-6 h-6 text-[#c94f00]" />
        <h1 className="font-display text-2xl font-extrabold text-white leading-tight">{tri("Timetable Lievitazione", "Gär-Timetable", "Fermentation Timetable")}</h1>
      </div>
      <p className="text-[13px] text-[#AEB8BF] leading-snug mb-4">{tri("Fasi in sequenza: ogni fase parte quando finisce la precedente.", "Phasen nacheinander: jede Phase startet, wenn die vorige endet.", "Sequential phases: each starts when the previous ends.")}</p>

      <div className="rounded-2xl bg-[#1e1e1e] border border-[#2e2e2e] p-4 mb-4">
        <label className="text-[12px] font-bold uppercase tracking-wide text-[#c94f00]">{tri("Orario di inizio", "Startzeit", "Start time")}</label>
        <input data-testid="timetable-start" type="time" value={start} onChange={(e) => setStart(e.target.value || nowHM())}
          className="ml-3 font-mono-data text-lg font-extrabold text-white bg-[#121212] border border-[#2e2e2e] rounded-2xl shadow-md border border-amber-900/40 px-3 py-1.5 outline-none focus:border-[#c94f00]" />
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} data-testid={`timetable-row-${i}`} className="flex items-center gap-2 rounded-2xl bg-[#1e1e1e] border border-[#2e2e2e] p-3">
            <span className="w-7 h-7 rounded-full bg-[#c94f00] text-white text-[13px] font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <input data-testid={`timetable-name-${i}`} value={r.name} onChange={(e) => setPhase(i, { name: e.target.value })}
                className="w-full bg-transparent text-white font-semibold text-[15px] outline-none border-b border-transparent focus:border-[#c94f00]/50" />
              <p className="text-[12px] text-[#8FB0C2] font-mono-data mt-0.5">{r.start} → {r.end} <span className="text-[#7E8A93]">· {fmtDur(Number(r.min) || 0)}</span></p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <input data-testid={`timetable-min-${i}`} type="number" min="0" step="5" value={r.min} onChange={(e) => setPhase(i, { min: e.target.value })}
                className="w-16 text-right font-mono-data text-sm font-bold text-[#c94f00] bg-[#121212] border border-[#2e2e2e] rounded-lg px-2 py-1.5 outline-none" />
              <span className="text-[11px] text-[#7E8A93]">min</span>
              <button data-testid={`timetable-del-${i}`} onClick={() => del(i)} className="ml-1 w-8 h-8 rounded-lg bg-[#121212] border border-[#2e2e2e] flex items-center justify-center text-[#7E8A93] active:scale-90"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button data-testid="timetable-add" onClick={addPhase} className="flex items-center gap-1.5 text-sm font-semibold text-[#c94f00] border border-[#c94f00]/40 rounded-full px-3.5 py-2 active:scale-95"><Plus className="w-4 h-4" /> {tri("Aggiungi fase", "Phase hinzufügen", "Add phase")}</button>
        <button data-testid="timetable-reset" onClick={reset} className="flex items-center gap-1.5 text-sm font-semibold text-[#AEB8BF] border border-[#2e2e2e] rounded-full px-3.5 py-2 active:scale-95"><RotateCcw className="w-4 h-4" /> {tri("Reimposta", "Zurücksetzen", "Reset")}</button>
      </div>

      <div data-testid="timetable-summary" className="mt-4 rounded-2xl bg-gradient-to-br from-[#c94f00] to-[#c94f00] text-white p-4 flex items-center justify-between">
        <div>
          <p className="text-[12px] uppercase tracking-wide font-bold text-white/85">{tri("Durata totale", "Gesamtdauer", "Total time")}</p>
          <p className="font-display text-2xl font-extrabold">{fmtDur(totalMin)}</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] uppercase tracking-wide font-bold text-white/85 flex items-center gap-1 justify-end"><Play className="w-3.5 h-3.5" /> {tri("Pronto alle", "Fertig um", "Ready at")}</p>
          <p className="font-mono-data text-2xl font-extrabold">{endTime}</p>
        </div>
      </div>
    </div>
  );
}
