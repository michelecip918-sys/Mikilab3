import { useState } from "react";
import { Moon, Thermometer, ShieldAlert, Snowflake, Flame, Activity, TriangleAlert, RotateCcw } from "lucide-react";
import { useMachines } from "@/audio/MachinesContext";
import { useMixers } from "@/audio/MixerTimersContext";

const toMin = (hhmm) => { const [h, m] = (hhmm || "0:0").split(":").map(Number); return (h * 60 + (m || 0)); };
const toHHMM = (min) => { const x = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`; };
const ICON = { forno: Flame, cella: Thermometer, freezer: Snowflake, frigo: Snowflake };

export default function ThermalGuard() {
  const { thermal, faults, simulateFault, clearFault } = useMachines();
  const { list: mixers } = useMixers();
  const [close, setClose] = useState("20:00");
  const [finish, setFinish] = useState("06:00");
  const [proof, setProof] = useState(10);

  const startProof = toHHMM(toMin(finish) - proof * 60);
  const nightSpan = ((toMin(finish) - toMin(close) + 1440) % 1440) / 60;
  const activeMixers = mixers.filter((m) => m.running).length;
  const alarms = thermal.filter((t) => t.alarm);

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
          <span className="text-[10px] font-mono text-slate-500">Sonde PT100 · Milesight/Efento</span>
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
    </div>
  );
}
