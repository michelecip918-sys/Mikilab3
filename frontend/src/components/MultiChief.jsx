import { useState } from "react";
import { Crown, UserCog, Radio, Volume2, ArrowRightLeft } from "lucide-react";
import { useMachines } from "@/audio/MachinesContext";
import { playTTS } from "@/lib/tts";
import { playSuccessChime } from "@/lib/successSound";
import { toast } from "sonner";

// Modulo 64 — MULTI-CHIEF EXECUTIVE ARCHITECTURE: profilo Capo dinamico + briefing passaggio consegne.
const TONES = { diretto: "diretto e sintetico", calmo: "calmo e rassicurante", motivante: "motivante ed energico" };
const PRIORITIES = ["Qualità", "Velocità", "Risparmio", "Team"];
const load = () => { try { return JSON.parse(localStorage.getItem("mikilab_chief") || "null"); } catch { return null; } };

export default function MultiChief() {
  const { thermal, history } = useMachines();
  const [chief, setChief] = useState(load() || { name: "Michele", tone: "diretto", priorities: ["Qualità", "Team"] });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chief);
  const [briefing, setBriefing] = useState("");

  const persist = (c) => { setChief(c); try { localStorage.setItem("mikilab_chief", JSON.stringify(c)); } catch { /* */ } };

  const makeBriefing = (incoming) => {
    const alarms = history.length;
    const cells = thermal.filter((t) => t.source !== "demo").length;
    const txt = `Passaggio di consegne. Turno affidato a ${incoming.name}. `
      + `Tono di guida ${TONES[incoming.tone]}. Priorità: ${incoming.priorities.join(", ") || "nessuna"}. `
      + `Situazione laboratorio: ${alarms} allarmi termici registrati, ${cells} celle su sensore reale. `
      + `${incoming.name}, la plancia è tua. Buon turno.`;
    setBriefing(txt);
    playTTS(txt, { voice: "michele" });
    playSuccessChime();
  };

  const applyNew = () => {
    if (!draft.name.trim()) return;
    persist(draft); setEditing(false);
    toast.success(`Capo in carica: ${draft.name}`);
    makeBriefing(draft);
  };

  const togglePrio = (p) => setDraft((d) => ({ ...d, priorities: d.priorities.includes(p) ? d.priorities.filter((x) => x !== p) : [...d.priorities, p] }));

  return (
    <div data-testid="multi-chief" className="rounded-2xl border border-[#E0A106]/35 bg-gradient-to-br from-slate-900 to-slate-950 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4 text-[#E0A106]" />
        <h4 className="font-cyber text-[12px] font-bold uppercase tracking-wide text-[#E0A106]">Multi-Chief · Modulo 64</h4>
        <span className="ms-auto flex items-center gap-1 text-[9px] font-bold text-emerald-300"><Radio className="w-3 h-3" /> INTERCOM LIVE</span>
      </div>

      {!editing ? (
        <>
          <div data-testid="chief-current" className="flex items-center gap-3 rounded-xl bg-slate-950 border border-slate-800 p-3">
            <span className="w-10 h-10 rounded-xl bg-[#E0A106]/15 border border-[#E0A106]/40 flex items-center justify-center shrink-0"><Crown className="w-5 h-5 text-[#E0A106]" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white leading-tight">{chief.name} <span className="text-[10px] font-semibold text-[#E0A106]">· Capo in carica</span></p>
              <p className="text-[11px] text-slate-400">Tono {TONES[chief.tone]} · {chief.priorities.join(", ") || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button data-testid="chief-switch" onClick={() => { setDraft(chief); setEditing(true); }} className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-200 text-xs font-bold px-3 py-2 rounded-lg"><UserCog className="w-4 h-4" /> Cambia Capo</button>
            <button data-testid="chief-briefing" onClick={() => makeBriefing(chief)} className="inline-flex items-center gap-1.5 bg-[#E0A106]/15 border border-[#E0A106]/40 text-[#E0A106] text-xs font-bold px-3 py-2 rounded-lg"><ArrowRightLeft className="w-4 h-4" /> Briefing passaggio consegne</button>
          </div>
        </>
      ) : (
        <div className="space-y-2.5">
          <input data-testid="chief-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Nome del Capo…" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-[#E0A106]" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase">Tono</span>
            {Object.keys(TONES).map((t) => (
              <button key={t} data-testid={`chief-tone-${t}`} onClick={() => setDraft((d) => ({ ...d, tone: t }))} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${draft.tone === t ? "bg-[#E0A106] text-slate-900 border-[#E0A106]" : "text-slate-300 border-slate-700"}`}>{t}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase">Priorità</span>
            {PRIORITIES.map((p) => (
              <button key={p} data-testid={`chief-prio-${p}`} onClick={() => togglePrio(p)} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${draft.priorities.includes(p) ? "bg-[#3E9C93] text-slate-900 border-[#3E9C93]" : "text-slate-300 border-slate-700"}`}>{p}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button data-testid="chief-apply" onClick={applyNew} className="inline-flex items-center gap-1.5 bg-[#E0A106] text-slate-900 text-xs font-bold px-3 py-2 rounded-lg">Prendi il turno</button>
            <button data-testid="chief-cancel" onClick={() => setEditing(false)} className="bg-slate-800 text-slate-300 text-xs px-3 py-2 rounded-lg">Annulla</button>
          </div>
        </div>
      )}

      {briefing && (
        <div data-testid="chief-briefing-card" className="mt-3 rounded-xl bg-slate-950 border border-[#3E9C93]/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#3E9C93] flex items-center gap-1.5 mb-1"><Volume2 className="w-3.5 h-3.5" /> Briefing vocale generato</p>
          <p className="text-[12.5px] text-slate-300 leading-relaxed">{briefing}</p>
        </div>
      )}
    </div>
  );
}
