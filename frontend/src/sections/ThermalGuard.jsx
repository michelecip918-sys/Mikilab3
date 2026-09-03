import { useState } from "react";
import { Moon, Thermometer, ShieldAlert, Snowflake, Flame, Activity, TriangleAlert, RotateCcw, CalendarClock, History, Trash2 } from "lucide-react";
import { useMachines } from "@/audio/MachinesContext";
import { useMixers } from "@/audio/MixerTimersContext";
import { weeklyApi, recipesApi } from "@/lib/api";
import { enablePush } from "@/lib/reminders";
import { toast } from "sonner";

const toMin = (hhmm) => { const [h, m] = (hhmm || "0:0").split(":").map(Number); return (h * 60 + (m || 0)); };
const toHHMM = (min) => { const x = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
const ICON = { forno: Flame, cella: Thermometer, freezer: Snowflake, frigo: Snowflake };
const DAY_KEYS = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
const COLLECTIONS = ["panetteria", "pizzeria", "pasticceria"];
const fmtClock = (ts) => new Date(ts).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
const fmtDur = (a, b) => { const s = Math.max(0, Math.round(((b || Date.now()) - a) / 1000)); const m = Math.floor(s / 60); return m > 0 ? `${m}m ${s % 60}s` : `${s}s`; };

export default function ThermalGuard() {
  const { thermal, faults, ranges, history, simulateFault, clearFault, setRange, clearHistory } = useMachines();
  const { list: mixers } = useMixers();
  const [close, setClose] = useState("20:00");
  const [finish, setFinish] = useState("06:00");
  const [proof, setProof] = useState(10);
  const [calcBusy, setCalcBusy] = useState(false);

  const startProof = toHHMM(toMin(finish) - proof * 60);
  const nightSpan = ((toMin(finish) - toMin(close) + 1440) % 1440) / 60;
  const activeMixers = mixers.filter((m) => m.running).length;
  const alarms = thermal.filter((t) => t.alarm);

  const calcFromRecipes = async () => {
    setCalcBusy(true);
    try {
      const plan = await weeklyApi.get();
      const dayKey = DAY_KEYS[new Date().getDay()];
      const items = (plan?.items || []).filter((i) => String(i.day || "").toLowerCase() === dayKey);
      if (!items.length) { toast.error("Nessuna ricetta pianificata per oggi"); return; }
      const lists = await Promise.all(COLLECTIONS.map((c) => recipesApi.list(c).catch(() => [])));
      const byId = {};
      lists.flat().forEach((r) => { byId[r.id] = (Number(r.bulk_fermentation_hours) || 0) + (Number(r.proofing_hours) || 0); });
      let maxH = 0, name = "";
      items.forEach((i) => { const h = byId[i.recipe_id] || 0; if (h > maxH) { maxH = h; name = i.recipe_name; } });
      if (maxH <= 0) { toast.error("Le ricette di oggi non hanno tempi di lievitazione impostati"); return; }
      setProof(Math.round(maxH * 10) / 10);
      toast.success(`Calcolato da "${name}": ${Math.round(maxH * 10) / 10}h di lievitazione`);
    } catch {
      toast.error("Piano/ricette non disponibili (accedi per salvarli)");
    } finally {
      setCalcBusy(false);
    }
  };

  return (
    <div data-testid="thermal-guard" className="space-y-6">
      {/* Panoramica Capo */}
      <div className="grid grid-cols-3 gap-3" data-testid="capo-overview">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black font-mono text-amber-300">{activeMixers}</p>
          <span className="text-[10px] text-slate-400 uppercase">Impasti attivi</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black font-mono text-emerald-300">{thermal.length - alarms.length}/{thermal.length}</p>
          <span className="text-[10px] text-slate-400 uppercase">Celle OK</span>
        </div>
        <div className={`bg-slate-900/80 border rounded-2xl p-4 text-center ${alarms.length ? "border-rose-500 animate-pulse" : "border-slate-800"}`}>
          <p className={`text-3xl font-black font-mono ${alarms.length ? "text-rose-400" : "text-slate-500"}`}>{alarms.length}</p>
          <span className="text-[10px] text-slate-400 uppercase">Allarmi</span>
        </div>
      </div>

      {/* Zero-Night Production */}
      <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center shrink-0"><Moon className="w-6 h-6 text-indigo-400" /></span>
          <div>
            <h3 className="text-xl font-bold text-indigo-400">Zero-Night Production</h3>
            <p className="text-slate-400 text-sm mt-0.5">Ciclo diurno/antinotte: calcolo a ritroso della lievitazione.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Chiusura serale</label><input data-testid="zn-close" type="time" value={close} onChange={(e) => setClose(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-center text-indigo-300 font-mono font-bold mt-1" /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Fine produzione</label><input data-testid="zn-finish" type="time" value={finish} onChange={(e) => setFinish(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-center text-indigo-300 font-mono font-bold mt-1" /></div>
          <div><label className="text-[10px] font-bold text-slate-400 uppercase">Ore lievitazione</label><input data-testid="zn-proof" type="number" min="0" value={proof} onChange={(e) => setProof(Math.max(0, Number(e.target.value) || 0))} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-center text-indigo-300 font-mono font-bold mt-1" /></div>
        </div>
        <button data-testid="zn-from-recipes" onClick={calcFromRecipes} disabled={calcBusy} className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg active:scale-95 transition-all">
          <CalendarClock className="w-3.5 h-3.5" /> {calcBusy ? "Calcolo…" : "Calcola dalle ricette di oggi"}
        </button>
        <div className="p-4 bg-indigo-950/20 border border-indigo-800/40 rounded-xl text-sm space-y-1" data-testid="zn-report">
          <p className="text-slate-300">🌙 Chiudi il laboratorio alle <b className="text-indigo-300">{close}</b>, produzione conclusa alle <b className="text-indigo-300">{finish}</b>.</p>
          <p className="text-slate-300">⏱️ Avvia la lievitazione entro le <b className="text-teal-300" data-testid="zn-start">{startProof}</b> per {proof}h di maturazione.</p>
          <p className="text-slate-400 text-xs">Finestra notte cella: circa {nightSpan.toFixed(1)}h di riposo controllato.</p>
        </div>
      </div>

      {/* IoT Thermal Guard */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2 uppercase tracking-wide"><ShieldAlert className="w-4 h-4" /> IoT Thermal Guard</h3>
          <button data-testid="push-enable" onClick={async () => { const ok = await enablePush(); toast[ok ? "success" : "error"](ok ? "Notifiche push attive sul dispositivo" : "Notifiche non attivate (permesso negato)"); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-300 hover:text-teal-200 border border-teal-500/30 rounded-lg px-2 py-1">
            <ShieldAlert className="w-3 h-3" /> Attiva notifiche push
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {thermal.map((t) => {
            const Icon = ICON[t.id] || Thermometer;
            return (
              <div key={t.id} data-testid={`sensor-${t.id}`} className={`p-4 rounded-xl border bg-slate-950 ${t.alarm ? "border-rose-500 animate-pulse shadow-[0_0_16px_rgba(230,57,70,.4)]" : "border-slate-800"}`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-100"><Icon className="w-4 h-4" style={{ color: t.color }} /> {t.name}</span>
                  {t.alarm && <TriangleAlert className="w-4 h-4 text-rose-400" />}
                </div>
                <div className="flex items-end justify-between mt-2">
                  <span data-testid={`sensor-temp-${t.id}`} className="font-mono text-3xl font-black" style={{ color: t.color }}>{t.temp}{t.unit}</span>
                  <span data-testid={`sensor-status-${t.id}`} className="text-xs font-extrabold uppercase" style={{ color: t.color }}>{t.status}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Range {t.min} / {t.max}{t.unit}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[9px] text-slate-500 uppercase">Soglie</span>
                  <input data-testid={`sensor-min-${t.id}`} type="number" value={t.min} onChange={(e) => setRange(t.id, e.target.value, t.max)} className="w-14 bg-slate-900 border border-slate-700 rounded p-1 text-center text-slate-300 font-mono text-[11px]" title="min" />
                  <span className="text-slate-600">/</span>
                  <input data-testid={`sensor-max-${t.id}`} type="number" value={t.max} onChange={(e) => setRange(t.id, t.min, e.target.value)} className="w-14 bg-slate-900 border border-slate-700 rounded p-1 text-center text-slate-300 font-mono text-[11px]" title="max" />
                  <span className="text-[9px] text-slate-500">{t.unit}</span>
                </div>
                {faults[t.id] ? (
                  <button data-testid={`sensor-clear-${t.id}`} onClick={() => clearFault(t.id)} className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-bold bg-teal-600 hover:bg-teal-500 text-white inline-flex items-center justify-center gap-1"><RotateCcw className="w-3 h-3" /> Ripristina sonda</button>
                ) : (
                  <button data-testid={`sensor-fault-${t.id}`} onClick={() => simulateFault(t.id)} className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">Simula guasto termico</button>
                )}
              </div>
            );
          })}
        </div>
        {alarms.length > 0 && (
          <div data-testid="thermal-alarm-banner" className="p-3 rounded-xl bg-rose-950/40 border-2 border-rose-500 text-rose-300 text-sm font-bold flex items-center gap-2 animate-pulse">
            <Activity className="w-4 h-4" /> Protocollo emergenza termica attivo: {alarms.map((a) => a.name).join(", ")}. Notifica in cuffia inviata.
          </div>
        )}
      </div>

      {/* Storico Allarmi */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3" data-testid="alarm-history">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2 uppercase tracking-wide"><History className="w-4 h-4" /> Storico Allarmi</h3>
          {history.length > 0 && (
            <button data-testid="alarm-history-clear" onClick={clearHistory} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /> Svuota</button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500">Nessun allarme registrato oggi. Tutto sotto controllo.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} data-testid="alarm-history-row" className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <span className="font-bold text-slate-200">{h.name}</span>
                <span className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400">{fmtClock(h.start)}</span>
                  <span className="text-rose-300">picco {Math.round(h.peak)}°</span>
                  <span className={h.end ? "text-emerald-400" : "text-rose-400"}>{h.end ? `durata ${fmtDur(h.start, h.end)}` : "in corso"}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
