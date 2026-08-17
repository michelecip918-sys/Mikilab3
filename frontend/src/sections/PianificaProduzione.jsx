import { useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";

const DEFAULT_PHASES = [
  { name: "Rinfresco lievito madre", hours: 4 },
  { name: "Autolisi (farina + acqua)", hours: 0.5 },
  { name: "Impasto finale + sale", hours: 0.25 },
  { name: "Pieghe di rinforzo", hours: 1 },
  { name: "Lievitazione (bulk)", hours: 4 },
  { name: "Formatura", hours: 0.25 },
  { name: "Appretto", hours: 2 },
];

function fmt(date) {
  return date.toLocaleString("it-IT", {
    weekday: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function PianificaProduzione() {
  const [bakeTime, setBakeTime] = useState(() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return toLocalInput(d);
  });
  const [phases, setPhases] = useState(DEFAULT_PHASES);
  const [plan, setPlan] = useState(null);

  const setHours = (i, v) => setPhases((p) => p.map((x, idx) => idx === i ? { ...x, hours: v } : x));
  const setName = (i, v) => setPhases((p) => p.map((x, idx) => idx === i ? { ...x, name: v } : x));
  const addPhase = () => setPhases((p) => [...p, { name: "Nuova fase", hours: 1 }]);
  const removePhase = (i) => setPhases((p) => p.filter((_, idx) => idx !== i));

  const compute = () => {
    const bake = new Date(bakeTime);
    const total = phases.reduce((s, p) => s + Number(p.hours || 0), 0);
    let cursor = new Date(bake.getTime() - total * 3600 * 1000);
    const timeline = phases.map((p) => {
      const start = new Date(cursor);
      cursor = new Date(cursor.getTime() + Number(p.hours || 0) * 3600 * 1000);
      return { name: p.name, hours: Number(p.hours || 0), start };
    });
    setPlan({ timeline, bake, total });
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-[#B34A26] flex items-center justify-center">
          <CalendarClock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">Pianifica la produzione</h1>
          <p className="text-sm text-[#8C7567]">Calcola quando iniziare, a ritroso dall'infornata</p>
        </div>
      </div>

      <div className="mt-5 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl px-4 py-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-[#8C7567]">Ora di infornata</label>
        <input
          data-testid="bake-time-input"
          type="datetime-local"
          value={bakeTime}
          onChange={(e) => setBakeTime(e.target.value)}
          className="mt-1 w-full font-mono-data bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-3 py-2 outline-none focus:border-[#B34A26]"
        />
      </div>

      <div className="space-y-2 mt-4">
        {phases.map((p, i) => (
          <div key={i} className="flex items-center gap-2 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl px-3 py-2.5">
            <input
              value={p.name}
              onChange={(e) => setName(i, e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#2C221E] dark:text-[#F5EFE6] outline-none"
            />
            <input
              data-testid={`phase-hours-${i}`}
              type="number"
              step="0.25"
              value={p.hours}
              onChange={(e) => setHours(i, e.target.value)}
              className="w-20 text-right font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A] bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] rounded-lg px-2 py-1 outline-none"
            />
            <span className="text-xs text-[#8C7567]">h</span>
            <button onClick={() => removePhase(i)} className="text-[#B4442A] p-1" aria-label="Rimuovi">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addPhase}
        className="w-full mt-2 bg-[#F5EFE6] dark:bg-[#332823] text-[#2C221E] dark:text-[#F5EFE6] font-medium px-4 py-2.5 rounded-xl border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Aggiungi fase
      </button>

      <button
        data-testid="btn-compute-plan"
        onClick={compute}
        className="w-full mt-3 bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all"
      >
        Calcola la tabella di marcia
      </button>

      {plan && (
        <div data-testid="plan-result" className="mt-5 space-y-2">
          <div className="text-xs text-[#8C7567] font-semibold uppercase tracking-wide">
            Durata totale: {plan.total} h
          </div>
          {plan.timeline.map((t, i) => (
            <div key={i} className="flex items-center gap-3 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-[#D99B26]/20 text-[#8C3A1D] dark:text-[#E5AC3A] font-mono-data font-bold text-sm flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2C221E] dark:text-[#F5EFE6] truncate">{t.name}</p>
                <p className="font-mono-data text-xs text-[#8C7567]">{fmt(t.start)} · {t.hours}h</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 bg-[#B34A26] rounded-2xl px-4 py-3 text-white">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">🔥</div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Infornata</p>
              <p className="font-mono-data text-xs text-white/85">{fmt(plan.bake)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toLocalInput(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
