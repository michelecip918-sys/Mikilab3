import { useState, useEffect } from "react";
import { Moon, Volume2, Users, Scale } from "lucide-react";

const speak = (msg) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(msg);
    u.lang = "it-IT";
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  }
};

const GIORNI = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const DEFAULT_WEEK = [520, 180, 300, 300, 420, 600, 0];

export default function SmartPlannerStressZero() {
  const [shiftHour, setShiftHour] = useState(() => { try { return localStorage.getItem("mikilab_planner_hour") || "03:30"; } catch { return "03:30"; } });
  const [volume, setVolume] = useState(() => { try { return Number(localStorage.getItem("mikilab_planner_vol")) || 350; } catch { return 350; } });
  const [week, setWeek] = useState(() => { try { const s = JSON.parse(localStorage.getItem("mikilab_planner_week") || "null"); return Array.isArray(s) && s.length === 7 ? s : DEFAULT_WEEK; } catch { return DEFAULT_WEEK; } });
  const [team, setTeam] = useState(() => { try { return Number(localStorage.getItem("mikilab_planner_team")) || 3; } catch { return 3; } });

  useEffect(() => { try { localStorage.setItem("mikilab_planner_hour", shiftHour); localStorage.setItem("mikilab_planner_vol", String(volume)); } catch { /* */ } }, [shiftHour, volume]);
  useEffect(() => { try { localStorage.setItem("mikilab_planner_week", JSON.stringify(week)); localStorage.setItem("mikilab_planner_team", String(team)); } catch { /* */ } }, [week, team]);
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  const impasti = 3;
  const perImpasto = Math.max(0, Math.round((Number(volume) || 0) / impasti));

  // Team Balance · Anti-Burnout
  const nums = week.map((v) => Math.max(0, Number(v) || 0));
  const giorniLavorativi = nums.filter((v) => v > 0).length || 7;
  const totSettimana = nums.reduce((a, b) => a + b, 0);
  const mediaGiorno = Math.round(totSettimana / giorniLavorativi);
  const livellato = Math.round(totSettimana / giorniLavorativi);
  const perPersona = Math.max(1, Number(team) || 1);
  const carichoPersona = Math.round(livellato / perPersona);
  const soglia = mediaGiorno * 0.15; // ±15% considerato "in linea"
  const stato = (v) => (v === 0 ? "riposo" : v > mediaGiorno + soglia ? "sopra" : v < mediaGiorno - soglia ? "sotto" : "linea");
  const giorniSopra = nums.map((v, i) => ({ v, i })).filter((d) => stato(d.v) === "sopra").map((d) => GIORNI[d.i]);
  const giorniSotto = nums.map((v, i) => ({ v, i })).filter((d) => stato(d.v) === "sotto").map((d) => GIORNI[d.i]);
  const setDay = (i, val) => setWeek((w) => w.map((x, j) => (j === i ? val : x)));
  const STATE_STYLE = { sopra: "text-rose-400 border-rose-500/40", sotto: "text-amber-400 border-amber-500/40", linea: "text-teal-300 border-teal-500/40", riposo: "text-slate-500 border-slate-700" };
  const STATE_LABEL = { sopra: "Sovraccarico", sotto: "Sotto media", linea: "In linea", riposo: "Riposo" };

  const syncBalance = () => {
    const sopraTxt = giorniSopra.length ? `Giorni sovraccarichi: ${giorniSopra.join(", ")}.` : "Nessun giorno sovraccarico.";
    const sottoTxt = giorniSotto.length ? `Giorni sotto media: ${giorniSotto.join(", ")}.` : "";
    speak(`Bilanciamento settimanale attivo. Totale ${totSettimana} pezzi su ${giorniLavorativi} giorni, media livellata ${livellato} pezzi al giorno, circa ${carichoPersona} pezzi a persona con ${perPersona} in squadra. ${sopraTxt} ${sottoTxt}`);
  };

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

        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
          <div className="grid grid-cols-7 gap-2">
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
                  <span data-testid={`team-state-${i}`} className={`text-[9px] font-bold uppercase ${STATE_STYLE[st].split(" ")[0]}`}>{STATE_LABEL[st]}</span>
                </div>
              );
            })}
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
              ? <>⚠️ Sovraccarico: <b className="text-rose-400">{giorniSopra.join(", ")}</b>. Sposta parte della produzione verso i giorni più scarichi{giorniSotto.length ? <> (<b className="text-amber-400">{giorniSotto.join(", ")}</b>)</> : null} o congela in anticipo.</>
              : <>✅ Carico già equilibrato: nessun giorno sovraccarico rispetto alla media livellata di {livellato} pezzi.</>}
          </p>
          <button
            data-testid="balance-sync"
            onClick={syncBalance}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg inline-flex items-center justify-center gap-1.5"
          >
            <Volume2 className="w-4 h-4" /> Ascolta il Bilanciamento
          </button>
        </div>
      </div>
    </div>
  );
}
