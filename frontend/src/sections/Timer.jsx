import { useState } from "react";
import { Timer as TimerIcon, Play, Pause, RotateCcw, Trash2, Plus, RefreshCw } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useTimers, remainingOf } from "@/audio/TimerContext";
import { mkTri } from "@/i18n/triMaps";

// Punto 14 — Timer da Laboratorio (UI). L'engine (conteggio + allarme globale)
// vive in TimerProvider così suona anche su altri strumenti/tab.

const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

export default function Timer() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const { timers, nowTs, addTimer, toggle, reset, remove } = useTimers();

  const PRESETS = [
    { key: "pieghe", label: tri("Pieghe (ogni 30′)", "Falten (alle 30′)", "Folds (every 30′)"), min: 30, repeat: true },
    { key: "puntata", label: tri("Puntata", "Stockgare", "Bulk rise"), min: 90 },
    { key: "massa", label: tri("Lievitazione", "Gare", "Leavening"), min: 120 },
    { key: "appretto", label: tri("Appretto", "Stückgare", "Final proof"), min: 60 },
    { key: "cottura", label: tri("Cottura", "Backen", "Bake"), min: 40 },
    { key: "autolisi", label: tri("Autolisi", "Autolyse", "Autolyse"), min: 30 },
    { key: "rinfresco", label: tri("Rinfresco", "Auffrischung", "Refresh"), min: 240 },
    { key: "raffredd", label: tri("Raffreddamento", "Abkühlen", "Cooling"), min: 20 },
  ];

  const [name, setName] = useState("");
  const [mins, setMins] = useState("30");
  const [repeat, setRepeat] = useState(false);
  void nowTs; // forza il re-render al tick del provider

  const inp = "w-full bg-[#FAF5EC] dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-3 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#8C4A27]";

  return (
    <div className="pb-40">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#E4572E] flex items-center justify-center"><TimerIcon className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Smart Timer Multi-Impasto", "Smart Timer Multi-Teig", "Smart Multi-Dough Timer")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Più timer insieme, con allarme sonoro anche su altri strumenti", "Mehrere Timer gleichzeitig, mit Alarm auch bei anderen Werkzeugen", "Multiple timers at once, alarm rings even on other tools")}</p>
        </div>
      </div>

      <p className="text-xs font-bold uppercase tracking-wide text-[#E4572E] mb-2">{tri("Preset di lavorazione", "Prozess-Presets", "Process presets")}</p>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {PRESETS.map((p) => (
          <button key={p.key} data-testid={`timer-preset-${p.key}`} onClick={() => addTimer(p.label, p.min, p.repeat)}
            className="relative flex flex-col items-center gap-0.5 bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-2xl py-3 active:scale-95 hover:border-[#E4572E]/50 transition-all">
            {p.repeat && <span className="absolute top-1.5 right-1.5"><RefreshCw className="w-3.5 h-3.5 text-[#B45309]" /></span>}
            <span className="font-display text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8]">{p.label}</span>
            <span className="font-mono-data text-xs text-[#7E8A93]">{p.min}′</span>
          </button>
        ))}
      </div>

      <div className="bg-[#B45309]/10 border border-[#B45309]/30 rounded-2xl p-4 mb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#8C4A27] mb-2">{tri("Timer personalizzato", "Eigener Timer", "Custom timer")}</p>
        <div className="grid grid-cols-[1fr_88px] gap-2">
          <input data-testid="timer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={tri("Nome (es. Baguette)", "Name (z.B. Baguette)", "Name (e.g. Baguette)")} className={inp} />
          <input data-testid="timer-mins" type="number" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value)} className={inp + " text-center font-mono-data"} />
        </div>
        <label data-testid="timer-repeat" className="flex items-center gap-2 mt-2 text-sm text-[#3F4A54] dark:text-[#AEB8BF] cursor-pointer select-none">
          <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} className="w-4 h-4 accent-[#8C4A27]" />
          <RefreshCw className="w-4 h-4 text-[#B45309]" /> {tri("Ripeti automaticamente (pieghe/rinfreschi)", "Automatisch wiederholen (Falten/Auffrischen)", "Auto-repeat (folds/refreshes)")}
        </label>
        <button data-testid="timer-add" onClick={() => { addTimer(name.trim(), mins, repeat); setName(""); }}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-[#8C4A27] hover:bg-[#6E371C] text-white font-semibold py-3 rounded-xl active:scale-98 transition-all">
          <Plus className="w-5 h-5" /> {tri("Avvia timer", "Timer starten", "Start timer")} <span className="opacity-80">({mins || 0}′)</span>
        </button>
      </div>

      <div className="space-y-3" data-testid="timer-list">
        {timers.length === 0 && (
          <p className="text-center text-sm text-[#7E8A93] py-6">{tri("Nessun timer attivo. Scegli un preset o crea il tuo.", "Kein aktiver Timer. Wähle ein Preset oder erstelle eigenes.", "No active timer. Pick a preset or create your own.")}</p>
        )}
        {timers.map((t) => {
          const rem = remainingOf(t);
          const done = rem <= 0;
          return (
            <div key={t.id} data-testid={`timer-card-${t.id}`}
              className={`rounded-3xl p-5 shadow-sm border ${done ? "bg-[#E4572E]/10 border-[#E4572E]/40" : "bg-white dark:bg-[#232A31] border-[#E6D8C3] dark:border-[#38424B]"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate flex items-center gap-1.5">{t.name || t.label}{t.repeat && <RefreshCw className="w-4 h-4 text-[#B45309] shrink-0" />}</span>
                <button data-testid={`timer-remove-${t.id}`} onClick={() => remove(t.id)} className="text-[#7E8A93] hover:text-[#E4572E] p-1"><Trash2 className="w-5 h-5" /></button>
              </div>
              <p className={`font-mono-data text-5xl font-bold text-center ${done ? "text-[#E4572E]" : "text-[#2B303B] dark:text-[#e4eff8]"}`} data-testid={`timer-time-${t.id}`}>{fmt(rem)}</p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button data-testid={`timer-toggle-${t.id}`} onClick={() => toggle(t.id)} disabled={done}
                  className="flex items-center justify-center gap-2 bg-[#8C4A27] hover:bg-[#336a94] disabled:opacity-40 text-white font-bold text-lg py-4 rounded-2xl active:scale-97 transition-all">
                  {t.running ? <><Pause className="w-6 h-6" /> {tri("Pausa", "Pause", "Pause")}</> : <><Play className="w-6 h-6" /> {tri("Vai", "Start", "Go")}</>}
                </button>
                <button data-testid={`timer-reset-${t.id}`} onClick={() => reset(t.id)}
                  className="flex items-center justify-center gap-2 bg-white dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] text-[#2B303B] dark:text-[#e4eff8] font-bold text-lg py-4 rounded-2xl active:scale-97 transition-all">
                  <RotateCcw className="w-6 h-6" /> {tri("Reset", "Reset", "Reset")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
