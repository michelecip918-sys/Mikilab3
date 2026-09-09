import { useState, useRef, useEffect } from "react";
import { Users, Radio, CheckCircle2, AlertTriangle, UserX, Zap, Volume2 } from "lucide-react";
import { cleanForSpeech } from "@/lib/voice";

const PHASES = ["Impasto", "Spezzatura", "Lievitazione", "Infornata"];
const BASELINE = { Impasto: 20, Spezzatura: 15, Lievitazione: 120, Infornata: 18 }; // minuti medi storici

let _itVoice = null;
const pickVoice = () => {
  try {
    const vs = window.speechSynthesis.getVoices() || [];
    _itVoice = vs.find((v) => /it/i.test(v.lang) && /(male|uomo|luca|cosimo|diego|giorgio)/i.test(v.name)) || vs.find((v) => /it/i.test(v.lang)) || null;
  } catch { /* */ }
};
const speakSan = (msg) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(cleanForSpeech(msg));
  u.lang = "it-IT"; u.rate = 0.98; u.pitch = 0.9;
  if (_itVoice) u.voice = _itVoice;
  window.speechSynthesis.speak(u);
};
const beep = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
    const ac = new Ctx(); const o = ac.createOscillator(); const g = ac.createGain();
    o.connect(g); g.connect(ac.destination); o.frequency.value = 880; g.gain.value = 0.06;
    o.start(); setTimeout(() => { o.stop(); ac.close(); }, 160);
  } catch { /* */ }
};

const initOps = () => [
  { id: "roland", name: "Roland", present: true },
  { id: "marco", name: "Marco", present: true },
  { id: "aldo", name: "Aldo", present: true },
];
const ownerFor = (ops, phaseIdx) => { const present = ops.filter((o) => o.present); return present.length ? present[phaseIdx % present.length] : null; };
const initOrders = (ops) => [
  { id: "o1", name: "Impasto Barchette", phaseIdx: 0, startedAt: Date.now(), urgent: false },
  { id: "o2", name: "Ciabatta Lotto 2", phaseIdx: 1, startedAt: Date.now(), urgent: false },
];

export default function TeamWorkflow() {
  const [ops, setOps] = useState(initOps);
  const [orders, setOrders] = useState(() => initOrders(initOps()));
  const opsRef = useRef(ops); opsRef.current = ops;

  useEffect(() => { pickVoice(); if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = pickVoice; }, []);

  const assignee = (order) => ownerFor(opsRef.current, order.phaseIdx);
  const coach = (mins, phase) => {
    const base = BASELINE[phase] || 15; const diff = Math.round(base - mins);
    if (diff >= 2) return `Ottimo tempo, ${diff} minuti sotto la media!`;
    if (diff <= -2) return `Fase completata. Tempistiche infornata ricalcolate per il team.`;
    return "Fase completata nei tempi previsti.";
  };

  const completePhase = (id) => {
    setOrders((list) => list.map((o) => {
      if (o.id !== id) return o;
      const phase = PHASES[o.phaseIdx];
      const mins = Math.max(1, Math.round((Date.now() - o.startedAt) / 60000));
      const prevOp = ownerFor(opsRef.current, o.phaseIdx);
      beep();
      const nextIdx = o.phaseIdx + 1;
      if (nextIdx >= PHASES.length) {
        speakSan(`${coach(mins, phase)} ${o.name} completato e pronto per la consegna.`);
        return { ...o, phaseIdx: nextIdx, startedAt: Date.now() };
      }
      const nextOp = ownerFor(opsRef.current, nextIdx);
      speakSan(`${coach(mins, phase)} ${nextOp ? nextOp.name : "Squadra"}, ${o.name} di ${prevOp ? prevOp.name : "reparto"} è pronto. Avvia ${PHASES[nextIdx]}.`);
      return { ...o, phaseIdx: nextIdx, startedAt: Date.now() };
    }));
  };

  const toggleAbsent = (opId) => {
    setOps((list) => {
      const nx = list.map((o) => (o.id === opId ? { ...o, present: !o.present } : o));
      const target = nx.find((o) => o.id === opId);
      if (target && !target.present) { const rep = nx.find((o) => o.present); speakSan(`${target.name} assente. Carichi ridistribuiti${rep ? ` su ${rep.name}` : ""}. Sequenze in cuffia riallineate.`); }
      return nx;
    });
  };

  const addUrgent = () => {
    const name = (typeof window !== "undefined" && window.prompt("Nome ordine urgente:", "Ciabatta Lotto 2")) || "";
    if (!name.trim()) return;
    beep(); speakSan(`Attenzione: precedenza a ${name}.`);
    setOrders((list) => [{ id: `u${Date.now()}`, name: name.trim(), phaseIdx: 0, startedAt: Date.now(), urgent: true }, ...list]);
  };

  return (
    <div data-testid="team-workflow" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-teal-400 flex items-center gap-2"><Radio className="w-6 h-6" /> Team OS · Workflow Matrix</h3>
        <button data-testid="teamos-urgent" onClick={addUrgent} className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg active:scale-95 transition-all"><Zap className="w-4 h-4" /> Ordine urgente</button>
      </div>

      {/* Operatori (plancia Capo) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Squadra in cuffia</p>
        <div className="flex flex-wrap gap-2">
          {ops.map((o) => (
            <button key={o.id} data-testid={`teamos-op-${o.id}`} onClick={() => toggleAbsent(o.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${o.present ? "bg-teal-500/15 border-teal-500/40 text-teal-300" : "bg-slate-800 border-slate-700 text-slate-500 line-through"}`}>
              {o.present ? <Radio className="w-3 h-3" /> : <UserX className="w-3 h-3" />} {o.name}
            </button>
          ))}
        </div>
      </div>

      {/* Ordini / Workflow */}
      <div className="space-y-3" data-testid="teamos-orders">
        {orders.map((o) => {
          const done = o.phaseIdx >= PHASES.length;
          const op = assignee(o);
          return (
            <div key={o.id} data-testid={`teamos-order-${o.id}`} className={`p-4 rounded-2xl border bg-slate-950 ${o.urgent ? "border-amber-500/50" : "border-slate-800"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-100 flex items-center gap-2">{o.urgent && <AlertTriangle className="w-4 h-4 text-amber-400" />}{o.name}</span>
                <span data-testid={`teamos-phase-${o.id}`} className={`text-[11px] font-extrabold uppercase ${done ? "text-emerald-400" : "text-teal-300"}`}>{done ? "Completato" : `In ${PHASES[o.phaseIdx]}`}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {PHASES.map((p, i) => (
                  <span key={p} className="flex-1 h-1.5 rounded-full" style={{ background: i < o.phaseIdx ? "#10b981" : i === o.phaseIdx && !done ? "#64748B" : "#2A3B49" }} />
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-slate-400">{done ? "Consegnato" : op ? `Assegnato a ${op.name}` : "Nessun operatore presente"}</span>
                {!done && (
                  <button data-testid={`teamos-complete-${o.id}`} onClick={() => completePhase(o.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg active:scale-95 transition-all">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Fine {PHASES[o.phaseIdx]}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500 flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5" /> A ogni "Fine fase": bip di conferma + notifica vocale in cuffia al collega successivo (voce IT, testo sanitizzato).</p>
    </div>
  );
}
