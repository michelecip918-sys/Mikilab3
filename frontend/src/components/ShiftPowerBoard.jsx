import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Zap, Plus, Trash2, Flame, Crown } from "lucide-react";
import { shiftBoardApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Turni & Power Level: ogni lavoratore ha un'AURA gamificata (stile Dragon Ball)
// proporzionale al rendimento. Il Capo assegna nomi/postazioni e regola lo score.
export default function ShiftPowerBoard({ editable = false }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [plan, setPlan] = useState([]);
  const [form, setForm] = useState({ day: "Oggi", position: "", worker_name: "", efficiency_score: 85 });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const d = await shiftBoardApi.list();
    setPlan(d.weekly_plan || []);
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, [load]);

  const add = async () => {
    if (!form.worker_name.trim() || !form.position.trim()) return;
    await shiftBoardApi.assign({ ...form, avatar_style: "default" }).catch(() => {});
    setForm({ day: "Oggi", position: "", worker_name: "", efficiency_score: 85 });
    setAdding(false);
    toast.success(tri("Assegnato al turno", "Zur Schicht zugewiesen", "Assigned to shift", "Asignado al turno", "Affecté au service", "به شیفت اضافه شد"));
    load();
  };
  const setScore = async (w, v) => { await shiftBoardApi.setScore(w.id, v).catch(() => {}); load(); };
  const remove = async (w) => { await shiftBoardApi.remove(w.id).catch(() => {}); load(); };

  if (!plan.length && !editable) return null;

  const topId = plan.length ? plan.reduce((a, b) => ((b.efficiency_score || 0) > (a.efficiency_score || 0) ? b : a)).id : null;

  return (
    <div data-testid="shift-power-board" className="rounded-2xl border border-[#1e293b] bg-[#030712] p-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#f59e0b] flex items-center gap-1.5">
          <Zap className="w-4 h-4" /> {tri("Turni & Power", "Schicht & Power", "Shifts & Power", "Turnos & Power", "Services & Power", "شیفت و پاور")}
        </p>
        {editable && (
          <button data-testid="shift-add-toggle" onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5EEAD4]">
            <Plus className="w-3.5 h-3.5" /> {tri("Assegna", "Zuweisen", "Assign", "Asignar", "Affecter", "افزودن")}
          </button>
        )}
      </div>

      {adding && editable && (
        <div className="mb-3 space-y-2 rounded-xl bg-[#0b0f19] border border-[#1e293b] p-3">
          <div className="grid grid-cols-2 gap-2">
            <input data-testid="shift-form-name" value={form.worker_name} onChange={(e) => setForm({ ...form, worker_name: e.target.value })} placeholder={tri("Nome", "Name", "Name", "Nombre", "Nom", "نام")} className="bg-[#030712] border border-[#1e293b] rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-[#5EEAD4]" />
            <input data-testid="shift-form-position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder={tri("Postazione", "Position", "Position", "Puesto", "Poste", "پست")} className="bg-[#030712] border border-[#1e293b] rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-[#5EEAD4]" />
          </div>
          <div className="flex items-center gap-2">
            <input value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="flex-1 bg-[#030712] border border-[#1e293b] rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-[#5EEAD4]" />
            <input type="range" min="0" max="100" value={form.efficiency_score} onChange={(e) => setForm({ ...form, efficiency_score: parseInt(e.target.value, 10) })} className="flex-1 accent-[#f59e0b]" />
            <span className="text-xs font-black text-[#f59e0b] w-8 text-right">{form.efficiency_score}</span>
          </div>
          <button data-testid="shift-form-save" onClick={add} className="w-full py-2 rounded-lg bg-[#5EEAD4] text-[#030712] font-black text-xs active:scale-95 transition-transform">{tri("Salva assegnazione", "Speichern", "Save", "Guardar", "Enregistrer", "ذخیره")}</button>
        </div>
      )}

      <div className="space-y-2">
        {plan.map((w) => {
          const a = w.aura || { color: "#94A3B8", stage: 1, aura_effect: "Aura", power_level: "" };
          return (
            <div key={w.id} data-testid={`shift-worker-${w.id}`} className="flex items-center gap-3 rounded-xl bg-[#0b0f19] border p-2.5" style={{ borderColor: `${a.color}44` }}>
              <div className="relative shrink-0">
                <style>{`@keyframes auraSpin${a.stage}{0%,100%{opacity:${0.3 + a.stage * 0.2};transform:scale(1)}50%{opacity:${0.6 + a.stage * 0.13};transform:scale(1.18)}}`}</style>
                <span aria-hidden className="absolute inset-0 rounded-full blur-md" style={{ background: a.color, animation: `auraSpin${a.stage} ${1.6 - a.stage * 0.3}s ease-in-out infinite` }} />
                <div className="relative w-11 h-11 rounded-full flex items-center justify-center border-2 font-black text-sm" style={{ borderColor: a.color, color: a.color, background: "#030712" }}>
                  {(w.worker_name || "?").slice(0, 1).toUpperCase()}
                </div>
                {a.stage === 3 && <Flame className="absolute -top-1 -right-1 w-4 h-4 text-[#f59e0b]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-white truncate flex items-center gap-1">
                  {w.worker_name} <span className="text-[11px] font-medium text-[#94A3B8]">· {w.position}</span>
                  {w.id === topId && <span data-testid="shift-crown" className="inline-flex items-center gap-0.5 text-[9px] font-black text-[#f59e0b]"><Crown className="w-3 h-3" /> {tri("Master", "Master", "Master", "Master", "Master", "استاد")}</span>}
                </p>
                <p className="text-[11px] font-bold" style={{ color: a.color }}>{a.power_level} · {(a.label && a.label[lang]) || a.aura_effect}
                  {w.streak_days > 1 && <span className="ml-1 text-[#f59e0b]">🔥{w.streak_days}</span>}
                </p>
                {editable && (
                  <input type="range" min="0" max="100" value={w.efficiency_score} onChange={(e) => setScore(w, parseInt(e.target.value, 10))} data-testid={`shift-score-${w.id}`} className="w-full mt-1 accent-[#f59e0b]" />
                )}
              </div>
              <span className="text-lg font-black shrink-0" style={{ color: a.color }}>{w.efficiency_score}</span>
              {editable && (
                <button data-testid={`shift-remove-${w.id}`} onClick={() => remove(w)} className="shrink-0 text-[#64748B] hover:text-[#f87171]"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          );
        })}
        {!plan.length && editable && (
          <p className="text-[11px] text-[#94A3B8] text-center py-2">{tri("Nessun turno. Assegna il primo lavoratore.", "Keine Schicht. Ersten Mitarbeiter zuweisen.", "No shifts. Assign the first worker.", "Sin turnos. Asigna el primero.", "Aucun service. Affecte le premier.", "بدون شیفت. اولین نفر را اضافه کن.")}</p>
        )}
      </div>
    </div>
  );
}
