import { useState } from "react";
import { ClipboardList, Flame, ShieldAlert, Package, Share2, BookOpen, ChevronDown } from "lucide-react";
import { useMixers } from "@/audio/MixerTimersContext";
import { useMachines } from "@/audio/MachinesContext";
import { toast } from "sonner";

const fmtClock = (ts) => new Date(ts).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
const weekTotal = () => { try { const w = JSON.parse(localStorage.getItem("mikilab_planner_week") || "[]"); return Array.isArray(w) ? w.reduce((a, b) => a + (Number(b) || 0), 0) : 0; } catch { return 0; } };

const MANUALE = [
  { t: "Modalità PRO", d: "Interruttore in alto nel Voice Core: ingrandisce i tasti touch per lavorare con le mani in pasta." },
  { t: "Parco Macchine & Timer", d: "Impastatrice 50kg, Forno rotativo, Armadio fermo-lievitazione con timer persistenti che continuano anche cambiando schermata." },
  { t: "Zero-Night Production", d: "Chiusura serale in cella, blocco termico notturno, infornata autonoma alle 05:00/06:00. Calcolo a ritroso dai tempi di lievitazione." },
  { t: "IoT Thermal Guard", d: "Sonde reali (Milesight EM300-TH, Efento, PT100/DS18B20) via endpoint /api/sensors/reading. Allarme acustico in cuffia + notifica push al Capo." },
  { t: "Voice Core hands-free", d: "Comandi vocali con cuffie wireless (Jabra/Plantronics a cancellazione rumore): 'avvia impastatrice due', 'quanto manca', 'ferma'." },
  { t: "Brot Sommelier", d: "Analisi sensoriale (crosta, mollica, aroma) e matrice di food pairing professionale." },
];

export default function ReportGiornata() {
  const { list: mixers } = useMixers();
  const { history } = useMachines();
  const [openManual, setOpenManual] = useState(false);

  const active = mixers.filter((m) => m.running).length;
  const alarmsToday = history.length;
  const carico = weekTotal();

  const share = async () => {
    const txt = `📋 Report MikiLab — ${new Date().toLocaleDateString("it-IT")}\n• Impasti attivi: ${active}\n• Allarmi termici: ${alarmsToday}\n• Carico settimana: ${carico} pezzi\n${history.slice(0, 5).map((h) => `  - ${h.name} ${fmtClock(h.start)} (picco ${Math.round(h.peak)}°)`).join("\n")}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Report MikiLab", text: txt }); }
      else { await navigator.clipboard.writeText(txt); toast.success("Report copiato negli appunti"); }
    } catch { try { await navigator.clipboard.writeText(txt); toast.success("Report copiato"); } catch { toast.error("Condivisione non disponibile"); } }
  };

  return (
    <div data-testid="report-giornata" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-teal-400 flex items-center gap-2"><ClipboardList className="w-6 h-6" /> Report Fine Giornata</h3>
        <button data-testid="report-share" onClick={share} className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg active:scale-95 transition-all"><Share2 className="w-4 h-4" /> Condividi</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
          <Flame className="w-5 h-5 mx-auto text-amber-400" /><p data-testid="report-mixers" className="text-3xl font-black font-mono text-amber-300 mt-1">{active}</p><span className="text-[10px] text-slate-400 uppercase">Impasti attivi</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
          <ShieldAlert className="w-5 h-5 mx-auto text-rose-400" /><p data-testid="report-alarms" className="text-3xl font-black font-mono text-rose-300 mt-1">{alarmsToday}</p><span className="text-[10px] text-slate-400 uppercase">Allarmi termici</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
          <Package className="w-5 h-5 mx-auto text-teal-400" /><p data-testid="report-load" className="text-3xl font-black font-mono text-teal-300 mt-1">{carico}</p><span className="text-[10px] text-slate-400 uppercase">Carico settimana</span>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-teal-400 uppercase tracking-wide">Allarmi termici registrati</h4>
        {history.length === 0 ? <p className="text-xs text-slate-500">Nessun allarme oggi. Giornata sotto controllo.</p> : (
          <div className="space-y-2">
            {history.slice(0, 10).map((h, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <span className="font-bold text-slate-200">{h.name}</span>
                <span className="font-mono text-slate-400">{fmtClock(h.start)} · picco <b className="text-rose-300">{Math.round(h.peak)}°</b></span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <button data-testid="report-manual-toggle" onClick={() => setOpenManual((o) => !o)} className="w-full flex items-center justify-between">
          <span className="text-sm font-bold text-teal-400 flex items-center gap-2 uppercase tracking-wide"><BookOpen className="w-4 h-4" /> Manuale d'Uso</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openManual ? "rotate-180" : ""}`} />
        </button>
        {openManual && (
          <div data-testid="report-manual" className="mt-3 space-y-2">
            {MANUALE.map((m) => (
              <div key={m.t} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <p className="text-xs font-bold text-slate-100">{m.t}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{m.d}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
