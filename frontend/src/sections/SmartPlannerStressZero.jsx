import { useState, useEffect } from "react";
import { Moon, Volume2 } from "lucide-react";

const speak = (msg) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(msg);
    u.lang = "it-IT";
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  }
};

export default function SmartPlannerStressZero() {
  const [shiftHour, setShiftHour] = useState(() => { try { return localStorage.getItem("mikilab_planner_hour") || "03:30"; } catch { return "03:30"; } });
  const [volume, setVolume] = useState(() => { try { return Number(localStorage.getItem("mikilab_planner_vol")) || 350; } catch { return 350; } });

  useEffect(() => { try { localStorage.setItem("mikilab_planner_hour", shiftHour); localStorage.setItem("mikilab_planner_vol", String(volume)); } catch { /* */ } }, [shiftHour, volume]);
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  const impasti = 3;
  const perImpasto = Math.max(0, Math.round((Number(volume) || 0) / impasti));

  return (
    <div data-testid="smart-planner" className="bg-slate-900/80 p-6 rounded-2xl border border-indigo-500/30 space-y-6">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center shrink-0">
          <Moon className="w-6 h-6 text-indigo-400" />
        </span>
        <div>
          <h3 className="text-xl font-bold text-indigo-400">Smart Planner · Stress-Zero</h3>
          <p className="text-slate-400 text-sm mt-0.5">Ottimizzazione automatica del turno notturno e dei volumi di produzione.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Orario Inizio Turno Notturno</label>
            <input
              data-testid="planner-hour"
              type="time"
              value={shiftHour}
              onChange={(e) => setShiftHour(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-indigo-300 mt-1 font-mono text-center text-xl font-bold"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Volume Totale Giornaliero (Pezzi)</label>
            <input
              data-testid="planner-volume"
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-indigo-300 mt-1 font-mono text-center text-xl font-bold"
            />
          </div>
        </div>

        <div className="p-5 bg-indigo-950/20 border border-indigo-800/40 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest block mb-2">Report Organizzativo</span>
            <ul data-testid="planner-report" className="text-xs text-slate-300 space-y-2 font-mono">
              <li>• Turno ottimizzato alle ore {shiftHour} per il massimo riposo.</li>
              <li>• Carico suddiviso in {impasti} impasti da {perImpasto} pezzi l'uno.</li>
              <li>• Zero stress logistico: scorte frigorifero e sili pre-allertate.</li>
            </ul>
          </div>
          <button
            data-testid="planner-sync"
            onClick={() => speak(`Pianificazione Stress Zero attivata. Turno impostato alle ${shiftHour} per ${volume} pezzi totali, suddivisi in ${impasti} impasti da ${perImpasto} pezzi.`)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg inline-flex items-center justify-center gap-1.5"
          >
            <Volume2 className="w-4 h-4" /> Sincronizza Planner in Cuffia
          </button>
        </div>
      </div>
    </div>
  );
}
