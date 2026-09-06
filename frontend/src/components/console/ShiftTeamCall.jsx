import { useState, useEffect, useCallback, useRef } from "react";
import { Volume2, Users, Megaphone, History, ChevronDown, RotateCcw, Download } from "lucide-react";
import { toast } from "sonner";
import { deptApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const AUTO_KEY = "mikilab_shift_autocall";

// Riepilogo Squadra Vocale: BakoMix annuncia, reparto per reparto, chi lavora oggi e la sua mansione.
export default function ShiftTeamCall() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [assignments, setAssignments] = useState([]);
  const [depts, setDepts] = useState([]);
  const [auto, setAuto] = useState(() => { try { return localStorage.getItem(AUTO_KEY) !== "0"; } catch { return true; } });
  const [history, setHistory] = useState([]);
  const [showHist, setShowHist] = useState(false);
  const [present, setPresent] = useState([]);
  const [busy, setBusy] = useState(false);
  const announcedRef = useRef(false);

  const load = useCallback(() => Promise.all([deptApi.assignment(), deptApi.catalog()]).then(([a, c]) => {
    setAssignments(a.assignments || []); setDepts(c.departments || []);
  }).catch(() => {}), []);
  useEffect(() => { load(); const id = setInterval(load, 20000); return () => clearInterval(id); }, [load]);
  useEffect(() => { deptApi.history(14).then((d) => setHistory(d.history || [])).catch(() => {}); }, [assignments.length]);
  useEffect(() => {
    const p = () => deptApi.presence().then((d) => setPresent((d.present || []).map((x) => x.toLowerCase()))).catch(() => {});
    p(); const id = setInterval(p, 20000); return () => clearInterval(id);
  }, []);
  const isPresent = (name) => present.includes((name || "").toLowerCase());

  // Raggruppa per reparto mantenendo l'ordine del catalogo.
  const groups = depts
    .map((d) => ({ dept: d, list: assignments.filter((a) => a.dept === d.key) }))
    .filter((g) => g.list.length > 0);

  const teamText = (g) => g.list.map((a) => (a.task ? `${a.operator}, ${a.task}` : a.operator)).join(". ");
  const fullText = () => {
    const intro = tri("Squadra del turno.", "Team der Schicht.", "Shift team.", "Equipo del turno.", "Équipe du service.", "تیم شیفت.");
    return `${intro} ${groups.map((g) => `${g.dept.name}: ${teamText(g)}.`).join(" ")}`;
  };
  const announceAll = () => { if (groups.length) { try { playTTS(fullText(), { lang, voice: "bakemix" }); } catch { /* */ } } };
  const announceDept = (g) => { try { playTTS(`${g.dept.name}: ${teamText(g)}.`, { lang, voice: "bakemix" }); } catch { /* */ } };

  // Annuncio automatico all'apertura del turno (una volta al giorno, best-effort per policy autoplay).
  useEffect(() => {
    if (!auto || announcedRef.current || !groups.length) return;
    const today = new Date().toISOString().slice(0, 10);
    let done = false;
    try { done = localStorage.getItem(`mikilab_shift_announced_${today}`) === "1"; } catch { /* */ }
    if (done) { announcedRef.current = true; return; }
    announcedRef.current = true;
    try { localStorage.setItem(`mikilab_shift_announced_${today}`, "1"); } catch { /* */ }
    const t = setTimeout(() => { try { playTTS(fullText(), { lang, voice: "bakemix" }); } catch { /* */ } }, 700);
    return () => clearTimeout(t);
  }, [groups.length, auto]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAuto = () => { const v = !auto; setAuto(v); try { localStorage.setItem(AUTO_KEY, v ? "1" : "0"); } catch { /* */ } };

  const recreateLast = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const past = history.find((h) => h.date < today && (h.depts || []).length);
    if (!past) { toast.error(tri("Nessun turno precedente da ricreare", "Keine frühere Schicht", "No previous shift to recreate", "Sin turno previo", "Aucun service précédent", "شیفت قبلی نیست")); return; }
    setBusy(true);
    try {
      for (const d of past.depts) {
        await deptApi.assignMulti({ dept: d.dept, items: (d.ops || []).map((o) => ({ operator: o.operator, task: o.task || "" })) });
      }
      toast.success(tri(`Turno del ${past.date} ricreato ✓`, `Schicht vom ${past.date} übernommen ✓`, `Shift from ${past.date} recreated ✓`, `Turno del ${past.date} recreado ✓`, `Service du ${past.date} recréé ✓`, `شیفت ${past.date} بازسازی شد ✓`));
      load();
    } catch { toast.error("Error"); } finally { setBusy(false); }
  };

  const exportCsv = () => {
    if (!history.length) { toast.error(tri("Storico vuoto", "Verlauf leer", "History empty", "Historial vacío", "Historique vide", "تاریخچه خالی")); return; }
    const rows = [["data", "reparto", "operatore", "mansione"]];
    history.forEach((day) => (day.depts || []).forEach((d) => (d.ops || []).forEach((o) => rows.push([day.date, d.dept_name, o.operator, o.task || ""]))));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `mikilab_storico_turni_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="shift-team-call" className="space-y-3">
      <div className="flex items-center gap-2">
        <button data-testid="shift-team-announce" onClick={announceAll} disabled={!groups.length}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#7DD3FC]/15 border border-[#7DD3FC]/50 text-[#7DD3FC] font-black text-sm active:scale-95 disabled:opacity-40 transition-all">
          <Megaphone className="w-4 h-4" /> {tri("Annuncia la squadra del turno", "Schichtteam ansagen", "Announce the shift team", "Anunciar el equipo del turno", "Annoncer l'équipe du service", "اعلام تیم شیفت")}
        </button>
      </div>

      <button data-testid="shift-team-auto-toggle" onClick={toggleAuto}
        className="w-full flex items-center gap-2 rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-2 text-left active:scale-[0.99]">
        <span className={`w-9 h-5 rounded-full relative transition-all shrink-0 ${auto ? "bg-[#22c55e]/70" : "bg-[#1e293b]"}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${auto ? "left-4" : "left-0.5"}`} />
        </span>
        <span className="text-[11px] text-[#cbd5e1] flex-1">{tri("Annuncia automaticamente all'apertura del turno", "Automatisch bei Schichtbeginn ansagen", "Auto-announce at shift start", "Anunciar automáticamente al abrir el turno", "Annonce automatique au début du service", "اعلام خودکار در شروع شیفت")}</span>
      </button>

      <div className="flex items-center gap-2">
        <button data-testid="shift-team-recreate" onClick={recreateLast} disabled={busy}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0C1019] border border-[#1e293b] text-[#cbd5e1] font-bold text-xs active:scale-95 disabled:opacity-40 hover:border-[#7DD3FC]/60 transition-all">
          <RotateCcw className="w-3.5 h-3.5" /> {tri("Ricrea ultimo turno", "Letzte Schicht übernehmen", "Recreate last shift", "Recrear último turno", "Recréer le dernier service", "بازسازی شیفت قبل")}
        </button>
        <button data-testid="shift-team-export" onClick={exportCsv}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0C1019] border border-[#1e293b] text-[#cbd5e1] font-bold text-xs active:scale-95 hover:border-[#7DD3FC]/60 transition-all">
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
      </div>

      {groups.length === 0 && (
        <p data-testid="shift-team-empty" className="text-[11px] text-[#64748B] rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-2.5">
          {tri("Nessuna squadra assegnata oggi. Assegna gli operai ai reparti per abilitare l'annuncio.", "Heute kein Team zugewiesen. Weise Mitarbeiter zu.", "No team assigned today. Assign operators to departments.", "Sin equipo hoy. Asigna operarios.", "Aucune équipe aujourd'hui. Assigne des opérateurs.", "امروز تیمی نیست. اپراتورها را واگذار کن.")}
        </p>
      )}

      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.dept.key} data-testid={`shift-team-dept-${g.dept.key}`} className="rounded-xl bg-[#0C1019] border px-3 py-2.5" style={{ borderColor: `${g.dept.accent}44` }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{g.dept.icon}</span>
              <span className="text-xs font-black uppercase tracking-wide flex-1 min-w-0 truncate" style={{ color: g.dept.accent }}>{g.dept.name}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#94A3B8]"><Users className="w-3 h-3" /> {g.list.length}</span>
              <button data-testid={`shift-team-speak-${g.dept.key}`} onClick={() => announceDept(g)} className="w-7 h-7 rounded-lg flex items-center justify-center border active:scale-95" style={{ borderColor: `${g.dept.accent}66`, color: g.dept.accent }}><Volume2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {g.list.map((a) => (
                <span key={a.id} data-testid={`shift-op-${a.operator}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#030712] border border-[#1e293b] text-[11px] text-white">
                  <span data-testid={`shift-presence-${a.operator}`} title={isPresent(a.operator) ? "presente" : "assente"} className={`w-1.5 h-1.5 rounded-full ${isPresent(a.operator) ? "bg-[#22c55e] shadow-[0_0_6px_#22c55e]" : "bg-[#475569]"}`} />
                  <b>{a.operator}</b>{a.task ? <span className="text-[#94A3B8]">· {a.task}</span> : null}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Storico turni */}
      <div className="rounded-xl bg-[#0C1019] border border-[#1e293b] overflow-hidden">
        <button data-testid="shift-team-history-toggle" onClick={() => setShowHist((v) => !v)} className="w-full flex items-center gap-2 px-3 py-2.5 active:scale-[0.99]">
          <History className="w-4 h-4 text-[#7DD3FC]" />
          <span className="text-xs font-black uppercase tracking-wide text-[#7DD3FC] flex-1 text-left">{tri("Storico turni", "Schicht-Verlauf", "Shift history", "Historial de turnos", "Historique des services", "تاریخچه شیفت‌ها")}</span>
          <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${showHist ? "rotate-180" : ""}`} />
        </button>
        {showHist && (
          <div className="px-3 pb-3 max-h-72 overflow-y-auto space-y-2" data-testid="shift-team-history">
            {history.length === 0 && <p className="text-[11px] text-[#64748B]">{tri("Nessuno storico ancora.", "Noch kein Verlauf.", "No history yet.", "Sin historial.", "Pas d'historique.", "هنوز تاریخچه‌ای نیست.")}</p>}
            {history.map((day) => (
              <div key={day.date} data-testid={`shift-history-${day.date}`} className="rounded-lg bg-[#030712] border border-[#1e293b] p-2">
                <p className="text-[10px] font-black text-[#94A3B8] mb-1">{day.date}</p>
                {day.depts.map((d) => (
                  <p key={d.dept} className="text-[11px] text-[#cbd5e1] leading-relaxed"><b style={{ color: "#7DD3FC" }}>{d.dept_name}:</b> {d.ops.map((o) => o.task ? `${o.operator} (${o.task})` : o.operator).join(", ")}</p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
