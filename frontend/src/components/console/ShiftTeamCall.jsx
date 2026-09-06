import { useState, useEffect, useCallback } from "react";
import { Volume2, Users, Megaphone } from "lucide-react";
import { deptApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Riepilogo Squadra Vocale: BakoMix annuncia, reparto per reparto, chi lavora oggi e la sua mansione.
export default function ShiftTeamCall() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [assignments, setAssignments] = useState([]);
  const [depts, setDepts] = useState([]);

  const load = useCallback(() => Promise.all([deptApi.assignment(), deptApi.catalog()]).then(([a, c]) => {
    setAssignments(a.assignments || []); setDepts(c.departments || []);
  }).catch(() => {}), []);
  useEffect(() => { load(); const id = setInterval(load, 20000); return () => clearInterval(id); }, [load]);

  // Raggruppa per reparto mantenendo l'ordine del catalogo.
  const groups = depts
    .map((d) => ({ dept: d, list: assignments.filter((a) => a.dept === d.key) }))
    .filter((g) => g.list.length > 0);

  const teamText = (g) => g.list.map((a) => (a.task ? `${a.operator}, ${a.task}` : a.operator)).join(". ");

  const announceAll = () => {
    if (!groups.length) return;
    const intro = tri("Squadra del turno.", "Team der Schicht.", "Shift team.", "Equipo del turno.", "Équipe du service.", "تیم شیفت.");
    const body = groups.map((g) => `${g.dept.name}: ${teamText(g)}.`).join(" ");
    try { playTTS(`${intro} ${body}`, { lang, voice: "bakemix" }); } catch { /* */ }
  };
  const announceDept = (g) => {
    try { playTTS(`${g.dept.name}: ${teamText(g)}.`, { lang, voice: "bakemix" }); } catch { /* */ }
  };

  return (
    <div data-testid="shift-team-call" className="space-y-3">
      <div className="flex items-center gap-2">
        <button data-testid="shift-team-announce" onClick={announceAll} disabled={!groups.length}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#7DD3FC]/15 border border-[#7DD3FC]/50 text-[#7DD3FC] font-black text-sm active:scale-95 disabled:opacity-40 transition-all">
          <Megaphone className="w-4 h-4" /> {tri("Annuncia la squadra del turno", "Schichtteam ansagen", "Announce the shift team", "Anunciar el equipo del turno", "Annoncer l'équipe du service", "اعلام تیم شیفت")}
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
                <span key={a.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#030712] border border-[#1e293b] text-[11px] text-white">
                  <b>{a.operator}</b>{a.task ? <span className="text-[#94A3B8]">· {a.task}</span> : null}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
