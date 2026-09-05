import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Check, Gauge, Brush, ShieldAlert, ListChecks } from "lucide-react";
import { delegationApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const KIND = {
  sanificazione: { icon: Brush, c: "#22c55e" },
  regola: { icon: ShieldAlert, c: "#5E8CA8" },
  crisis_override: { icon: Gauge, c: "#f59e0b" },
  generico: { icon: ListChecks, c: "#5EEAD4" },
};

export default function TeamTasks({ operatorName = "" }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [tasks, setTasks] = useState([]);

  const load = useCallback(async () => {
    try { const r = await delegationApi.tasks(); setTasks(r.tasks || []); } catch { /* Letz_Passive: nessun errore rumoroso */ }
  }, []);
  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  const markDone = async (taskId, order) => {
    // aggiornamento ottimistico e silenzioso
    setTasks((ts) => ts.map((t) => t.id === taskId ? { ...t, steps: t.steps.map((s) => s.order === order ? { ...s, done: true } : s) } : t));
    try { await delegationApi.stepDone(taskId, order, operatorName); await load(); } catch { /* */ }
  };

  if (!tasks.length) return null;

  return (
    <div data-testid="team-tasks" className="w-full space-y-2 mb-4">
      <p className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8] flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#14b8a6]" /> {tri("Task di squadra dal Capo", "Team-Aufgaben vom Chef", "Team tasks from the Boss", "Tareas de equipo del Jefe", "Tâches d'équipe du Chef", "وظایف تیمی از رئیس")}</p>
      <AnimatePresence>
        {tasks.map((t) => {
          const K = KIND[t.kind] || KIND.generico;
          const total = (t.steps || []).length;
          const doneN = (t.steps || []).filter((s) => s.done).length;
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} data-testid={`team-task-${t.id}`} className="rounded-2xl border p-3 text-left" style={{ borderColor: `${K.c}55`, background: `${K.c}0d` }}>
              <div className="flex items-center gap-2 mb-2">
                <K.icon className="w-4 h-4 shrink-0" style={{ color: K.c }} />
                <p className="text-sm font-black text-white flex-1 min-w-0 truncate">{t.title}</p>
                <span className="text-[10px] font-bold text-[#94A3B8]">{doneN}/{total}</span>
              </div>
              {t.kind === "crisis_override" && t.pacing && (
                <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg px-2.5 py-1"><Gauge className="w-3.5 h-3.5" /> {tri("Ritmo", "Tempo", "Pacing", "Ritmo", "Rythme", "ریتم")}: {t.pacing}{t.pacing_target ? ` · ${t.pacing_target}` : ""}</div>
              )}
              <div className="space-y-1.5">
                {(t.steps || []).map((s) => (
                  <button
                    key={s.order}
                    data-testid={`team-step-${t.id}-${s.order}`}
                    onClick={() => !s.done && markDone(t.id, s.order)}
                    disabled={s.done}
                    className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 border text-left transition-all active:scale-98 ${s.done ? "bg-emerald-500/10 border-emerald-500/40" : "bg-[#030712] border-[#1e293b]"}`}
                  >
                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${s.done ? "bg-emerald-500 border-emerald-500 text-[#030712]" : "border-[#334155] text-[#64748B]"}`}>
                      {s.done ? <Check className="w-3.5 h-3.5" /> : s.order}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] font-semibold leading-snug ${s.done ? "text-emerald-300 line-through" : "text-white"}`}>{s.instruction}</span>
                      {s.assignee && <span className="block text-[10px] text-[#64748B]">{s.assignee}{s.assignee_position ? ` · ${s.assignee_position}` : ""}</span>}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
