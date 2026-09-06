import { useState, useEffect, useCallback } from "react";
import { Loader2, Send, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { deptApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

export default function DeptAssign() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [depts, setDepts] = useState([]);
  const [dept, setDept] = useState("");
  const [task, setTask] = useState("");
  const [busy, setBusy] = useState(false);
  const [assignments, setAssignments] = useState([]);

  const load = useCallback(() => {
    deptApi.catalog().then((d) => setDepts(d.departments || [])).catch(() => {});
    deptApi.assignment().then((d) => setAssignments(d.assignments || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const assign = async () => {
    if (!dept) { toast.error(tri("Scegli un reparto", "Bereich wählen", "Pick a department", "Elige un área", "Choisis un atelier", "بخش را انتخاب کن")); return; }
    setBusy(true);
    try {
      await deptApi.assign({ dept, task, operator: "MohaLab" });
      setTask("");
      toast.success(tri("Assegnato a MohaLab ✓", "MohaLab zugewiesen ✓", "Assigned to MohaLab ✓", "Asignado a MohaLab ✓", "Assigné à MohaLab ✓", "به MohaLab واگذار شد ✓"));
      load();
    } catch { toast.error("Error"); } finally { setBusy(false); }
  };
  const del = (a) => deptApi.unassign(a.id).then(load).catch(() => {});
  const cur = depts.find((x) => x.key === dept);

  return (
    <div data-testid="dept-assign" className="space-y-4">
      <p className="text-[11px] text-[#94A3B8]">{tri("Assegna a MohaLab il reparto e la mansione del giorno. In produzione vedrà solo ciò che gli assegni.", "Weise MohaLab Bereich und Aufgabe zu.", "Assign MohaLab the department and task for the day. On the floor they'll see only what you assign.", "Asigna a MohaLab el área y la tarea.", "Assigne à MohaLab l'atelier et la tâche.", "بخش و وظیفه را به MohaLab بده.")}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {depts.map((d) => (
          <button key={d.key} data-testid={`dept-pick-${d.key}`} onClick={() => setDept(d.key)}
            className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-bold transition-all active:scale-95 ${dept === d.key ? "text-white" : "bg-[#0C1019] border-[#1e293b] text-[#94A3B8]"}`}
            style={dept === d.key ? { background: `${d.accent}22`, borderColor: `${d.accent}99`, color: d.accent } : {}}>
            <span className="text-lg">{d.icon}</span> {d.name}
          </button>
        ))}
      </div>
      {cur && (
        <div className="rounded-xl bg-[#0C1019] border border-[#1e293b] p-3 text-[11px] text-[#8aa0b4]">
          <span className="text-white font-bold">{cur.name}</span> · {cur.machines.length} {tri("macchine", "Maschinen", "machines", "máquinas", "machines", "دستگاه")} · {cur.silos.length} silos · {cur.cells.length} {tri("celle", "Zellen", "cells", "celdas", "cellules", "سلول")}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input data-testid="dept-task-input" value={task} onChange={(e) => setTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") assign(); }}
          placeholder={tri("Mansione (es. impasti, forni, sfoglia…)", "Aufgabe…", "Task (e.g. mixing, ovens…)", "Tarea…", "Tâche…", "وظیفه…")}
          className="flex-1 rounded-xl bg-[#030712] border border-[#1e293b] focus:border-[#00F0FF]/60 outline-none text-sm text-white px-3 py-2.5" />
        <button data-testid="dept-assign-btn" onClick={assign} disabled={busy}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/50 text-[#00F0FF] font-bold text-sm active:scale-95 disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {tri("Assegna", "Zuweisen", "Assign", "Asignar", "Assigner", "واگذار")}
        </button>
      </div>
      {assignments.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-[#64748B]">{tri("Assegnazioni di oggi", "Heutige Zuweisungen", "Today's assignments", "Asignaciones de hoy", "Aujourd'hui", "امروز")}</p>
          {assignments.map((a) => (
            <div key={a.id} data-testid={`dept-assignment-${a.id}`} className="flex items-center gap-2 rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-2">
              <UserCog className="w-4 h-4 text-[#00F0FF] shrink-0" />
              <p className="text-xs text-white flex-1 min-w-0 truncate"><b>{a.operator}</b> → {a.dept_name}{a.task ? ` · ${a.task}` : ""}</p>
              <button data-testid={`dept-unassign-${a.id}`} onClick={() => del(a)} className="text-[#64748B] hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
