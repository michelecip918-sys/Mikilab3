import { useEffect, useState } from "react";
import { Cpu } from "lucide-react";
import { MODULES, SCREEN_MODULES } from "@/data/cyberModules";

// Pannello compatto "parametri moduli Cyber-Industrial" da innestare nelle schede esistenti.
// Nessuna pagina doppia: mostra n° modulo + nome + valore live (jitter leggero sui numerici).
export default function ModuleParams({ screen }) {
  const cfg = SCREEN_MODULES[screen];
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 4000); return () => clearInterval(id); }, []);
  if (!cfg) return null;

  const jitter = (m) => {
    if (!m.live || typeof m.v !== "number") return m.v;
    const d = m.v * 0.04 * (Math.random() - 0.5) * 2;
    const val = m.v + d;
    return Number.isInteger(m.v) ? Math.round(val) : Math.round(val * 10) / 10;
  };

  // Parametro critico (glow, mod. 55): sulla Plancia Capo evidenzia il modulo % col valore più alto.
  let criticalId = null;
  if (screen === "capo") {
    let max = -1;
    cfg.ids.forEach((n) => { const m = MODULES[n]; if (m && m.live && m.u === "%" && m.v > max) { max = m.v; criticalId = n; } });
  }

  return (
    <div data-testid={`module-params-${screen}`} className="rounded-2xl border p-4 mb-4" style={{ borderColor: `${cfg.accent}44`, background: "linear-gradient(180deg,#131f29,#0e1620)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="w-4 h-4" style={{ color: cfg.accent }} />
        <h4 className="font-cyber text-[12px] font-bold uppercase tracking-wide" style={{ color: cfg.accent }}>{cfg.title}</h4>
        <span className="ms-auto text-[10px] font-mono text-slate-500">{cfg.ids.length} moduli</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {cfg.ids.map((n) => {
          const m = MODULES[n];
          if (!m) return null;
          const v = jitter(m);
          const focus = n === criticalId;
          return (
            <div key={n} data-testid={`module-${n}`} className={`flex items-center gap-2 rounded-xl bg-slate-950/70 border border-slate-800 px-2.5 py-2 ${focus ? "module-focus" : ""}`}>
              <span className="font-cyber text-[9px] font-bold w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `${cfg.accent}22`, color: cfg.accent, border: `1px solid ${cfg.accent}55` }}>{n}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-semibold text-slate-300 leading-tight truncate" title={m.name}>{m.name}</p>
                <p className="font-cyber text-[12px] font-bold" style={{ color: cfg.accent }}>{v}{m.u && <span className="text-slate-500 text-[9px] ms-0.5">{m.u}</span>}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
