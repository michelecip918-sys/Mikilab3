import { useState, useEffect } from "react";
import { Moon, Users, Scale, CalendarDays, Wand2 } from "lucide-react";
import { weeklyApi } from "@/lib/api";
import { toast } from "sonner";

const GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const DAY_KEYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
const DEFAULT_WEEK = [520, 180, 300, 300, 420, 600, 0];

export default function SmartPlannerStressZero() {
  const [shiftHour, setShiftHour] = useState(() => { try { return localStorage.getItem("mikilab_planner_hour") || "03:30"; } catch { return "03:30"; } });
  const [volume, setVolume] = useState(() => { try { return Number(localStorage.getItem("mikilab_planner_vol")) || 350; } catch { return 350; } });
  const [week, setWeek] = useState(() => { try { const s = JSON.parse(localStorage.getItem("mikilab_planner_week") || "null"); return Array.isArray(s) && s.length === 7 ? s : DEFAULT_WEEK; } catch { return DEFAULT_WEEK; } });
  const [team, setTeam] = useState(() => { try { return Number(localStorage.getItem("mikilab_planner_team")) || 3; } catch { return 3; } });

  useEffect(() => { try { localStorage.setItem("mikilab_planner_hour", shiftHour); localStorage.setItem("mikilab_planner_vol", String(volume)); } catch { /* */ } }, [shiftHour, volume]);
  useEffect(() => { try { localStorage.setItem("mikilab_planner_week", JSON.stringify(week)); localStorage.setItem("mikilab_planner_team", String(team)); } catch { /* */ } }, [week, team]);

  const impasti = 3;
  const perImpasto = Math.max(0, Math.round((Number(volume) || 0) / impasti));

  // Team Balance · Anti-Burnout
  const nums = week.map((v) => Math.max(0, Number(v) || 0));
  const giorniLavorativi = nums.filter((v) => v > 0).length || 7;
  const totSettimana = nums.reduce((a, b) => a + b, 0);
  const mediaGiorno = Math.round(totSettimana / giorniLavorativi);
  const livellato = mediaGiorno;
  const perPersona = Math.max(1, Number(team) || 1);
  const carichoPersona = Math.round(livellato / perPersona);
  const soglia = mediaGiorno * 0.15; // ±15% considerato "in linea"
  const stato = (v) => (v === 0 ? "riposo" : v > mediaGiorno + soglia ? "sopra" : v < mediaGiorno - soglia ? "sotto" : "linea");
  const giorniSopra = nums.map((v, i) => ({ v, i })).filter((d) => stato(d.v) === "sopra").map((d) => GIORNI[d.i]);
  const giorniSotto = nums.map((v, i) => ({ v, i })).filter((d) => stato(d.v) === "sotto").map((d) => GIORNI[d.i]);
  const setDay = (i, val) => setWeek((w) => w.map((x, j) => (j === i ? val : x)));
  const levelLoads = () => {
    // Sposta l'eccesso dai giorni sovraccarichi verso quelli scarichi: livella i giorni lavorativi.
    setWeek((w) => w.map((v) => ((Number(v) || 0) > 0 ? livellato : 0)));
  };
  const STATE_STYLE = { sopra: "text-rose-400 border-rose-500/40", sotto: "text-amber-400 border-amber-500/40", linea: "text-teal-300 border-teal-500/40", riposo: "text-slate-500 border-slate-700" };
  const STATE_LABEL = { sopra: "Sovraccarico", sotto: "Sotto media", linea: "In linea", riposo: "Riposo" };

  const [importing, setImporting] = useState(false);
  const doImport = async (thenLevel) => {
    setImporting(true);
    try {
      const plan = await weeklyApi.get();
      const items = (plan && plan.items) || [];
      if (!items.length) { toast.error("Nessun piano settimana salvato da importare"); return; }
      const agg = [0, 0, 0, 0, 0, 0, 0];
      for (const it of items) {
        const idx = DAY_KEYS.indexOf(String(it.day || "").toLowerCase());
        if (idx >= 0) agg[idx] += Number(it.pieces) || 0;
      }
      if (thenLevel) {
        const rounded = agg.map((v) => Math.round(v));
        const work = rounded.filter((v) => v > 0).length || 7;
        const avg = Math.round(rounded.reduce((a, b) => a + b, 0) / work);
        setWeek(rounded.map((v) => (v > 0 ? avg : 0)));
        toast.success("Importato dal Piano e livellato");
      } else {
        setWeek(agg.map((v) => Math.round(v)));
        toast.success("Carichi importati dal Piano Settimana");
      }
    } catch {
      toast.error("Piano non disponibile (accedi per salvarlo)");
    } finally {
      setImporting(false);
    }
  };
  const importFromPlan = () => doImport(false);
  const importAndLevel = () => doImport(true);

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

        <div className="p-5 bg-indigo-950/20 border border-indigo-800/40 rounded-2xl">
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest block mb-2">Report Organizzativo</span>
          <ul data-testid="planner-report" className="text-xs text-slate-300 space-y-2 font-mono">
            <li>• Turno ottimizzato alle ore {shiftHour} per il massimo riposo.</li>
            <li>• Carico suddiviso in {impasti} impasti da {perImpasto} pezzi l'uno.</li>
            <li>• Zero stress logistico: scorte frigorifero e sili pre-allertate.</li>
          </ul>
        </div>
      </div>

      {/* Team Balance · Anti-Burnout */}
      <div data-testid="team-balance" className="pt-2 space-y-4">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 rounded-2xl bg-teal-500/15 border border-teal-500/40 flex items-center justify-center shrink-0">
            <Scale className="w-6 h-6 text-teal-400" />
          </span>
          <div>
            <h4 className="text-lg font-bold text-teal-400">Team Balance · Anti-Burnout</h4>
            <p className="text-slate-400 text-sm mt-0.5">Livella i carichi sui giorni della settimana per evitare picchi (es. lunedì pieno, martedì vuoto) e distribuire il lavoro sulla squadra.</p>
          </div>
        </div>

        <button
          data-testid="team-import-plan"
          onClick={importFromPlan}
          disabled={importing}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-teal-300 text-xs font-semibold rounded-lg border border-teal-500/30 active:scale-95 transition-all"
        >
          <CalendarDays className="w-3.5 h-3.5" /> {importing ? "Importazione…" : "Importa dal Piano Settimana"}
        </button>
        <button
          data-testid="team-import-level"
          onClick={importAndLevel}
          disabled={importing}
          className="inline-flex items-center gap-1.5 px-3 py-2 ml-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg active:scale-95 transition-all"
        >
          <Wand2 className="w-3.5 h-3.5" /> Importa e Livella (1 tap)
        </button>

        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
          <div className="overflow-x-auto -mx-1 px-1">
          <div className="grid grid-cols-7 gap-2 min-w-[430px]">
            {GIORNI.map((g, i) => {
              const st = stato(nums[i]);
              return (
                <div key={g} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{g}</span>
                  <input
                    data-testid={`team-day-${i}`}
                    type="number"
                    value={week[i]}
                    onChange={(e) => setDay(i, e.target.value)}
                    className={`w-full bg-slate-900 border rounded-lg p-2 text-center font-mono text-sm font-bold ${STATE_STYLE[st]}`}
                  />
                  <span data-testid={`team-state-${i}`} className={`text-[9px] font-bold uppercase whitespace-nowrap ${STATE_STYLE[st].split(" ")[0]}`}>{STATE_LABEL[st]}</span>
                </div>
              );
            })}
          </div>
          </div>

          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-teal-400 shrink-0" />
            <label className="text-xs font-bold text-slate-400 uppercase">Persone in squadra</label>
            <input
              data-testid="team-size"
              type="number"
              min="1"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2 text-center text-teal-300 font-mono font-bold"
            />
          </div>
        </div>

        <div className="p-5 bg-teal-950/20 border border-teal-800/40 rounded-2xl space-y-3">
          <span className="text-xs font-bold text-teal-300 uppercase tracking-widest block">Bilanciamento Settimanale</span>
          <div data-testid="balance-report" className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div><p className="text-2xl font-black text-slate-100 font-mono" data-testid="balance-total">{totSettimana}</p><span className="text-[10px] text-slate-400 uppercase">Pezzi/settimana</span></div>
            <div><p className="text-2xl font-black text-teal-300 font-mono" data-testid="balance-avg">{livellato}</p><span className="text-[10px] text-slate-400 uppercase">Media livellata/giorno</span></div>
            <div><p className="text-2xl font-black text-indigo-300 font-mono" data-testid="balance-perperson">{carichoPersona}</p><span className="text-[10px] text-slate-400 uppercase">Pezzi/persona</span></div>
            <div><p className="text-2xl font-black text-amber-300 font-mono">{giorniLavorativi}</p><span className="text-[10px] text-slate-400 uppercase">Giorni lavorativi</span></div>
          </div>
          <p className="text-xs text-slate-300">
            {giorniSopra.length > 0
              ? <>Sovraccarico: <b className="text-rose-400">{giorniSopra.join(", ")}</b>. Sposta parte della produzione verso i giorni più scarichi{giorniSotto.length ? <> (<b className="text-amber-400">{giorniSotto.join(", ")}</b>)</> : null} o congela in anticipo.</>
              : <>Carico già equilibrato: nessun giorno sovraccarico rispetto alla media livellata di {livellato} pezzi.</>}
          </p>
          <button
            data-testid="balance-level"
            onClick={levelLoads}
            disabled={giorniSopra.length === 0 && giorniSotto.length === 0}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg inline-flex items-center justify-center gap-1.5"
          >
            <Wand2 className="w-4 h-4" /> Livella carichi automaticamente ({livellato}/giorno)
          </button>
        </div>
      </div>
    </div>
  );
}
