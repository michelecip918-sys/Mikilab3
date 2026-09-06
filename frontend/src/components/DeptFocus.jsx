import { useState, useEffect } from "react";
import { Factory, Volume2, Box, Snowflake, Warehouse, Plus, Users } from "lucide-react";
import { deptApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Interfaccia dinamica produzione: mostra SOLO il reparto assegnato oggi dal Capo.
export default function DeptFocus({ tri, lang }) {
  const [assign, setAssign] = useState(null);
  const [dept, setDept] = useState(null);
  const [obj, setObj] = useState(null);

  const refreshObj = (key) => deptApi.board().then((b) => setObj((b.objectives || []).find((o) => o.dept === key) || null)).catch(() => {});
  useEffect(() => {
    let alive = true;
    const load = () => Promise.all([deptApi.assignment(), deptApi.catalog(), deptApi.board()]).then(([a, c, b]) => {
      if (!alive) return;
      const last = (a.assignments || [])[0] || null;
      setAssign(last);
      const dd = last ? (c.departments || []).find((d) => d.key === last.dept) : null;
      setDept(dd);
      setObj(dd ? (b.objectives || []).find((o) => o.dept === dd.key) || null : null);
    }).catch(() => {});
    load(); const id = setInterval(load, 15000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!assign || !dept) return null;
  const speak = () => { try { playTTS(`${tri("Oggi", "Heute", "Today", "Hoy", "Aujourd'hui", "امروز")}: ${dept.name}. ${assign.task || ""}`, { lang, voice: "mohamed" }); } catch { /* */ } };
  const addProgress = async (n) => {
    let op = "Operaio", pin = "";
    try { op = localStorage.getItem("mikilab_role") || op; pin = localStorage.getItem("mikilab_operator_pin") || ""; } catch { /* */ }
    try { const r = await deptApi.progress({ dept: dept.key, qty: n, pin, operator: op }); setObj(r.objective); playTTS(`+${n}. ${tri("registrato", "erfasst", "recorded", "registrado", "enregistré", "ثبت شد")}`, { lang, voice: "mohamed" }); } catch { /* */ }
  };
  const pct = obj && obj.target > 0 ? Math.min(100, Math.round((obj.done / obj.target) * 100)) : 0;

  return (
    <div data-testid="dept-focus" className="w-full mb-3 rounded-2xl border p-4 text-left" style={{ borderColor: `${dept.accent}66`, background: `${dept.accent}0d` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{dept.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: dept.accent }}>{tri("Reparto di oggi", "Heutiger Bereich", "Today's department", "Área de hoy", "Atelier du jour", "بخش امروز")}</p>
          <p className="text-base font-black text-white truncate">{dept.name}{assign.task ? ` · ${assign.task}` : ""}</p>
        </div>
        <button data-testid="dept-focus-speak" onClick={speak} className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ borderColor: `${dept.accent}66`, color: dept.accent }}><Volume2 className="w-4 h-4" /></button>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-[#64748B] mb-1 flex items-center gap-1"><Factory className="w-3 h-3" /> {tri("Le TUE macchine", "Deine Maschinen", "Your machines", "Tus máquinas", "Tes machines", "دستگاه‌های تو")}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {dept.machines.map((m) => (
          <button key={m.id} data-testid={`dept-machine-${m.id}`} onClick={() => { try { playTTS(`${m.name}. ${tri("Modulo vocale pronto.", "Sprachmodul bereit.", "Voice module ready.", "Módulo de voz listo.", "Module vocal prêt.", "ماژول صوتی آماده.")}`, { lang, voice: "mohamed" }); } catch { /* */ } }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0C1019] border border-[#1e293b] text-[11px] font-bold text-[#e6f6fa] active:scale-95">
            <Volume2 className="w-3 h-3 text-[#00F0FF]" /> {m.name}
          </button>
        ))}
      </div>
      {obj && (
        <div data-testid="dept-objective" className="mb-2 rounded-xl bg-[#0C1019] border border-[#1e293b] p-2.5">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="inline-flex items-center gap-1 font-bold text-white"><Users className="w-3.5 h-3.5" style={{ color: dept.accent }} /> {tri("Obiettivo squadra", "Team-Ziel", "Team goal", "Meta equipo", "Objectif équipe", "هدف تیم")}</span>
            <span className="font-black" style={{ color: dept.accent }}>{obj.done}/{obj.target || "∞"} {obj.unit}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#030712] overflow-hidden mb-2"><div className="h-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${dept.accent},#22c55e)` }} /></div>
          <div className="flex items-center gap-1.5">
            {[1, 5, 10].map((n) => (
              <button key={n} data-testid={`dept-progress-${n}`} onClick={() => addProgress(n)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold active:scale-95" style={{ background: `${dept.accent}22`, border: `1px solid ${dept.accent}66`, color: dept.accent }}>
                <Plus className="w-3 h-3" />{n}
              </button>
            ))}
            {(obj.entries || []).slice(-1).map((e, k) => <span key={k} className="text-[10px] text-[#64748B] ml-auto">{tri("ultimo", "letzter", "last", "último", "dernier", "آخرین")}: +{e.qty} · {e.operator} ({e.pin})</span>)}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2 text-[10px] text-[#8aa0b4]">
        <span className="inline-flex items-center gap-1"><Box className="w-3 h-3" /> {dept.silos.join(", ")}</span>
        <span className="inline-flex items-center gap-1"><Snowflake className="w-3 h-3" /> {dept.cells.join(", ")}</span>
        <span className="inline-flex items-center gap-1"><Warehouse className="w-3 h-3" /> {dept.warehouse}</span>
      </div>
    </div>
  );
}
