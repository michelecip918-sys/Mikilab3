import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Flame, ShieldAlert, Package, Share2, Save, History, Loader2 } from "lucide-react";
import { useMixers } from "@/audio/MixerTimersContext";
import { useMachines } from "@/audio/MachinesContext";
import { reportsApi } from "@/lib/api";
import { toast } from "sonner";

const fmtClock = (ts) => new Date(ts).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
const fmtDay = (d) => { try { return new Date(d).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" }); } catch { return d; } };
const weekTotal = () => { try { const w = JSON.parse(localStorage.getItem("mikilab_planner_week") || "[]"); return Array.isArray(w) ? w.reduce((a, b) => a + (Number(b) || 0), 0) : 0; } catch { return 0; } };

export default function ReportGiornata() {
  const { list: mixers } = useMixers();
  const { history } = useMachines();
  const [saving, setSaving] = useState(false);
  const [pastReports, setPastReports] = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);

  const active = mixers.filter((m) => m.running).length;
  const alarmsToday = history.length;
  const carico = weekTotal();

  const loadHistory = useCallback(async () => {
    setLoadingHist(true);
    const items = await reportsApi.list();
    setPastReports(items);
    setLoadingHist(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const saveToServer = async () => {
    setSaving(true);
    try {
      const alarms = history.slice(0, 20).map((h) => ({ name: h.name, start: h.start, peak: Math.round(h.peak) }));
      await reportsApi.save({
        date: new Date().toISOString().slice(0, 10),
        mixers_active: active, alarms_count: alarmsToday, week_load: carico, alarms,
      });
      toast.success("Report salvato sul server. Ora puoi confrontarlo con gli altri giorni.");
      await loadHistory();
    } catch (e) {
      if (e?.response?.status === 401) toast.error("Accedi per salvare i report sul server.");
      else toast.error("Salvataggio non riuscito. Riprova.");
    } finally { setSaving(false); }
  };

  const share = async () => {
    const txt = `📋 Report MikiLab — ${new Date().toLocaleDateString("it-IT")}\n• Impasti attivi: ${active}\n• Allarmi termici: ${alarmsToday}\n• Carico settimana: ${carico} pezzi\n${history.slice(0, 5).map((h) => `  - ${h.name} ${fmtClock(h.start)} (picco ${Math.round(h.peak)}°)`).join("\n")}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Report MikiLab", text: txt }); }
      else { await navigator.clipboard.writeText(txt); toast.success("Report copiato negli appunti"); }
    } catch { try { await navigator.clipboard.writeText(txt); toast.success("Report copiato"); } catch { toast.error("Condivisione non disponibile"); } }
  };

  return (
    <div data-testid="report-giornata" className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xl font-bold text-teal-400 flex items-center gap-2"><ClipboardList className="w-6 h-6" /> Report Fine Giornata</h3>
        <div className="flex items-center gap-2">
          <button data-testid="report-save" onClick={saveToServer} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 text-xs font-bold rounded-lg active:scale-95 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salva
          </button>
          <button data-testid="report-share" onClick={share} className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg active:scale-95 transition-all"><Share2 className="w-4 h-4" /> Condividi</button>
        </div>
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

      {/* Storico giorni salvati sul server: confronto rapido */}
      <div data-testid="report-history" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-teal-400 uppercase tracking-wide flex items-center gap-2"><History className="w-4 h-4" /> Storico giornate</h4>
        {loadingHist ? (
          <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Carico lo storico…</div>
        ) : pastReports.length === 0 ? (
          <p className="text-xs text-slate-500">Nessun report salvato. Tocca «Salva» per archiviare la giornata e confrontarla nei giorni successivi.</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 px-3">
              <span>Giorno</span><span className="text-center">Impasti</span><span className="text-center">Allarmi</span><span className="text-center">Carico</span>
            </div>
            {pastReports.map((r) => (
              <div key={r.id || r.date} data-testid={`report-hist-${r.date}`} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs">
                <span className="font-bold text-slate-200">{fmtDay(r.date)}</span>
                <span className="text-center font-mono text-amber-300 w-14">{r.mixers_active}</span>
                <span className="text-center font-mono text-rose-300 w-14">{r.alarms_count}</span>
                <span className="text-center font-mono text-teal-300 w-14">{r.week_load}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
