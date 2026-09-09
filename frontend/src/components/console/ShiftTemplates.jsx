import { useState, useEffect, useCallback } from "react";
import { Save, Play, Trash2, CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deptApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Turni ricorrenti: salva squadre-tipo (es. "Turno mattina") e applicale con un tocco.
export default function ShiftTemplates() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [templates, setTemplates] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    deptApi.templatesList().then((d) => setTemplates(d.templates || [])).catch(() => {});
    deptApi.assignment().then((d) => setAssignments(d.assignments || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    const nm = name.trim();
    if (!nm) { toast.error(tri("Dai un nome al turno", "Namen vergeben", "Name the shift", "Nombra el turno", "Nomme le service", "نام شیفت را بده")); return; }
    if (!assignments.length) { toast.error(tri("Nessuna squadra assegnata oggi da salvare", "Kein Team zum Speichern", "No team to save today", "Sin equipo para guardar", "Aucune équipe à enregistrer", "تیمی برای ذخیره نیست")); return; }
    setBusy(true);
    try {
      const items = assignments.map((a) => ({ dept: a.dept, operator: a.operator, task: a.task || "" }));
      await deptApi.templateCreate({ name: nm, items });
      setName("");
      toast.success(tri(`Turno-tipo "${nm}" salvato ✓`, `Vorlage "${nm}" gespeichert ✓`, `Template "${nm}" saved ✓`, `Plantilla "${nm}" guardada ✓`, `Modèle "${nm}" enregistré ✓`, `الگوی "${nm}" ذخیره شد ✓`));
      load();
    } catch { toast.error("Error"); } finally { setBusy(false); }
  };

  const apply = async (t) => {
    setBusy(true);
    try {
      const r = await deptApi.templateApply(t.id);
      toast.success(tri(`Applicato "${t.name}" · ${r.assignments.length} operai ✓`, `"${t.name}" angewendet · ${r.assignments.length} ✓`, `Applied "${t.name}" · ${r.assignments.length} ✓`, `Aplicado "${t.name}" · ${r.assignments.length} ✓`, `Appliqué "${t.name}" · ${r.assignments.length} ✓`, `"${t.name}" اعمال شد · ${r.assignments.length} ✓`));
      load();
    } catch { toast.error("Error"); } finally { setBusy(false); }
  };

  const del = (t) => deptApi.templateDelete(t.id).then(load).catch(() => {});

  return (
    <div data-testid="shift-templates" className="space-y-3">
      <div className="flex items-center gap-2">
        <input data-testid="shift-template-name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); }}
          placeholder={tri("Nome turno (es. Turno mattina)", "Schichtname", "Shift name (e.g. Morning)", "Nombre del turno", "Nom du service", "نام شیفت")}
          className="flex-1 rounded-xl bg-[#030712] border border-[#1e293b] focus:border-[#FF9D42]/60 outline-none text-sm text-white px-3 py-2.5" />
        <button data-testid="shift-template-save" onClick={save} disabled={busy}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#FF9D42]/15 border border-[#FF9D42]/50 text-[#FF9D42] font-bold text-sm active:scale-95 disabled:opacity-40">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {tri("Salva", "Speichern", "Save", "Guardar", "Enreg.", "ذخیره")}
        </button>
      </div>
      <p className="text-[10px] text-[#64748B]">{tri("Salva la squadra assegnata oggi come turno-tipo, poi riapplicala con un tocco quando serve.", "Speichere das heutige Team als Vorlage.", "Save today's team as a template and reapply with one tap.", "Guarda el equipo de hoy como plantilla.", "Enregistre l'équipe du jour comme modèle.", "تیم امروز را به‌عنوان الگو ذخیره کن.")}</p>

      {templates.length === 0 ? (
        <p data-testid="shift-templates-empty" className="text-[11px] text-[#64748B] rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-2.5">{tri("Nessun turno-tipo salvato.", "Keine Vorlagen.", "No templates saved.", "Sin plantillas.", "Aucun modèle.", "الگویی نیست.")}</p>
      ) : (
        <div className="space-y-1.5">
          {templates.map((t) => (
            <div key={t.id} data-testid={`shift-template-${t.id}`} className="flex items-center gap-2 rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-2">
              <CalendarClock className="w-4 h-4 text-[#FF9D42] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{t.name}</p>
                <p className="text-[10px] text-[#64748B]">{(t.items || []).length} {tri("assegnazioni", "Zuweisungen", "assignments", "asignaciones", "affectations", "واگذاری")}</p>
              </div>
              <button data-testid={`shift-template-apply-${t.id}`} onClick={() => apply(t)} disabled={busy} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/50 text-[#22c55e] text-xs font-bold active:scale-95 disabled:opacity-40"><Play className="w-3.5 h-3.5" /> {tri("Applica", "Anwenden", "Apply", "Aplicar", "Appliquer", "اعمال")}</button>
              <button data-testid={`shift-template-del-${t.id}`} onClick={() => del(t)} className="text-[#64748B] hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
