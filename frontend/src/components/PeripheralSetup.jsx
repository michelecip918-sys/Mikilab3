import { useState } from "react";
import { Mic, Camera, Bluetooth, Radio, Loader2, CheckCircle2, XCircle, AlertTriangle, Cpu } from "lucide-react";
import { toast } from "sonner";
import { autoSetupPeripherals, getPeripheralsCache } from "@/lib/peripherals";

const STATUS = {
  ok: { color: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10", Icon: CheckCircle2, label: "Attivo" },
  denied: { color: "text-rose-300 border-rose-500/40 bg-rose-500/10", Icon: XCircle, label: "Negato" },
  unavailable: { color: "text-slate-400 border-slate-600/50 bg-slate-700/20", Icon: AlertTriangle, label: "N/D" },
  error: { color: "text-amber-300 border-amber-500/40 bg-amber-500/10", Icon: AlertTriangle, label: "Errore" },
};

const DEVICES = [
  { key: "mic", name: "Microfono", Icon: Mic },
  { key: "camera", name: "Telecamera", Icon: Camera },
  { key: "bluetooth", name: "Bluetooth IoT", Icon: Bluetooth },
  { key: "iot", name: "Sensori IoT", Icon: Radio },
];

export default function PeripheralSetup() {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(() => getPeripheralsCache());

  const run = async () => {
    setBusy(true);
    try {
      const r = await autoSetupPeripherals();
      setRes(r);
      const okCount = DEVICES.filter((d) => r[d.key] && r[d.key].status === "ok").length;
      toast.success(`Periferiche configurate: ${okCount}/${DEVICES.length} attive`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="peripheral-setup" className="p-4 rounded-xl bg-[#0f172a]/80 border border-[#334155]">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#14b8a6] flex items-center gap-2">
          <Cpu className="w-4 h-4" /> Auto-Setup Periferiche
        </h3>
        <button
          data-testid="peripheral-setup-btn"
          onClick={run}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#14b8a6] text-[#0f172a] hover:bg-[#0d9488] disabled:opacity-50 active:scale-95 transition-all shrink-0"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
          {busy ? "Rilevamento…" : "Configura tutto"}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {DEVICES.map((d) => {
          const st = res && res[d.key] && res[d.key].status;
          const meta = STATUS[st] || { color: "text-slate-500 border-slate-700 bg-slate-800/40", Icon: d.Icon, label: "—" };
          const Icon = d.Icon;
          const StIcon = meta.Icon;
          return (
            <div key={d.key} data-testid={`peripheral-${d.key}`} className={`p-2.5 rounded-lg border ${meta.color} flex flex-col items-center gap-1 text-center`}>
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-bold text-slate-200 leading-tight">{d.name}</span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase">
                <StIcon className="w-3 h-3" /> {meta.label}{d.key === "iot" && res && res.iot && res.iot.count ? ` (${res.iot.count})` : ""}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-[#64748B] mt-2">
        Rileva e attiva microfono (voce hands-free), telecamera (diagnosi/scansione) e sensori IoT (Bluetooth + rete locale) in un tocco.
      </p>
    </div>
  );
}
