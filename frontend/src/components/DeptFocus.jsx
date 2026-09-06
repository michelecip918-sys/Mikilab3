import { useState, useEffect } from "react";
import { Factory, Volume2, Box, Snowflake, Warehouse } from "lucide-react";
import { deptApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Interfaccia dinamica produzione: mostra SOLO il reparto assegnato oggi dal Capo.
export default function DeptFocus({ tri, lang }) {
  const [assign, setAssign] = useState(null);
  const [dept, setDept] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => Promise.all([deptApi.assignment(), deptApi.catalog()]).then(([a, c]) => {
      if (!alive) return;
      const last = (a.assignments || [])[0] || null;
      setAssign(last);
      setDept(last ? (c.departments || []).find((d) => d.key === last.dept) : null);
    }).catch(() => {});
    load(); const id = setInterval(load, 20000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  if (!assign || !dept) return null;
  const speak = () => { try { playTTS(`${tri("Oggi", "Heute", "Today", "Hoy", "Aujourd'hui", "امروز")}: ${dept.name}. ${assign.task || ""}`, { lang, voice: "mohamed" }); } catch { /* */ } };

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
      <div className="flex flex-wrap gap-2 text-[10px] text-[#8aa0b4]">
        <span className="inline-flex items-center gap-1"><Box className="w-3 h-3" /> {dept.silos.join(", ")}</span>
        <span className="inline-flex items-center gap-1"><Snowflake className="w-3 h-3" /> {dept.cells.join(", ")}</span>
        <span className="inline-flex items-center gap-1"><Warehouse className="w-3 h-3" /> {dept.warehouse}</span>
      </div>
    </div>
  );
}
