import { useState, useEffect, useCallback } from "react";
import { Factory, Volume2, Box, Snowflake, Warehouse, Plus, Users, UserCheck, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deptApi, operatorPinsApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import AvatarWorld3D from "@/components/AvatarWorld3D";

const OP_KEY = "mikilab_operator_name";

// Interfaccia dinamica produzione: ogni operaio vede SOLO il reparto (e il modello 3D) a cui è assegnato.
export default function DeptFocus({ tri, lang }) {
  const [assignments, setAssignments] = useState([]);
  const [depts, setDepts] = useState([]);
  const [board, setBoard] = useState([]);
  const [opName, setOpName] = useState(() => { try { return localStorage.getItem(OP_KEY) || ""; } catch { return ""; } });
  const [idx, setIdx] = useState(0);
  const [pin, setPin] = useState("");
  const [pinBusy, setPinBusy] = useState(false);

  const load = useCallback(() => Promise.all([deptApi.assignment(), deptApi.catalog(), deptApi.board()]).then(([a, c, b]) => {
    setAssignments(a.assignments || []); setDepts(c.departments || []); setBoard(b.objectives || []);
  }).catch(() => {}), []);
  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, [load]);

  const setOp = (n) => { try { localStorage.setItem(OP_KEY, n); } catch { /* */ } setOpName(n); setIdx(0); };
  const resetOp = () => { try { localStorage.removeItem(OP_KEY); } catch { /* */ } setOpName(""); setIdx(0); };

  const verifyPin = async () => {
    if ((pin || "").length < 4) return;
    setPinBusy(true);
    try {
      const r = await operatorPinsApi.verify(pin);
      if (r && r.ok && r.name) {
        try { localStorage.setItem("mikilab_operator_pin", pin); } catch { /* */ }
        setOp(r.name);
      } else {
        toast.error(tri("PIN non riconosciuto", "PIN nicht erkannt", "PIN not recognized", "PIN no reconocido", "PIN non reconnu", "پین شناسایی نشد"));
      }
    } catch { toast.error("Error"); } finally { setPinBusy(false); setPin(""); }
  };

  if (!assignments.length) return null;

  const distinct = [...new Set(assignments.map((a) => a.operator))];
  const mine = opName ? assignments.filter((a) => (a.operator || "").toLowerCase() === opName.toLowerCase()) : [];

  // Selettore identità: l'operaio tocca il proprio nome → vede il suo reparto.
  if (!opName || mine.length === 0) {
    return (
      <div data-testid="dept-focus-picker" className="w-full mb-3 rounded-2xl border border-[#1e293b] bg-[#0b0f19] p-4 text-left">
        <p className="text-[10px] uppercase tracking-widest text-[#64748B] mb-1 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-[#00F0FF]" /> {tri("Chi sei?", "Wer bist du?", "Who are you?", "¿Quién eres?", "Qui es-tu ?", "تو کی هستی؟")}</p>
        <p className="text-xs text-white font-bold mb-2.5">{opName && mine.length === 0
          ? tri("Oggi non hai un reparto assegnato. Tocca il tuo nome.", "Heute kein Bereich zugewiesen. Tippe deinen Namen.", "No department assigned today. Tap your name.", "Hoy sin área asignada. Toca tu nombre.", "Aucun atelier aujourd'hui. Touche ton nom.", "امروز بخشی نداری. نامت را بزن.")
          : tri("Tocca il tuo nome per vedere il tuo reparto.", "Tippe deinen Namen für deinen Bereich.", "Tap your name to see your department.", "Toca tu nombre para ver tu área.", "Touche ton nom pour voir ton atelier.", "برای دیدن بخش‌ات نامت را بزن.")}</p>
        <div className="grid grid-cols-2 gap-2">
          {distinct.map((n) => (
            <button key={n} data-testid={`dept-focus-op-${n}`} onClick={() => setOp(n)}
              className="py-2.5 px-3 rounded-xl bg-[#030712] border border-[#1e293b] text-sm font-bold text-white active:scale-95 hover:border-[#00F0FF]/60 transition-all">{n}</button>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-[#1e293b]">
          <p className="text-[10px] uppercase tracking-widest text-[#64748B] mb-1.5 flex items-center gap-1"><KeyRound className="w-3.5 h-3.5 text-[#00F0FF]" /> {tri("…oppure entra col tuo PIN", "…oder mit deinem PIN", "…or enter with your PIN", "…o entra con tu PIN", "…ou entre avec ton PIN", "…یا با پین وارد شو")}</p>
          <div className="flex items-center gap-2">
            <input data-testid="dept-focus-pin-input" value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} onKeyDown={(e) => { if (e.key === "Enter") verifyPin(); }}
              inputMode="numeric" type="password" placeholder="••••"
              className="flex-1 rounded-xl bg-[#030712] border border-[#1e293b] focus:border-[#00F0FF]/60 outline-none text-center tracking-[0.4em] text-white px-3 py-2.5" />
            <button data-testid="dept-focus-pin-go" onClick={verifyPin} disabled={pinBusy || pin.length < 4}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/50 text-[#00F0FF] font-bold text-sm active:scale-95 disabled:opacity-40">
              {pinBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} {tri("Entra", "Los", "Enter", "Entrar", "Entrer", "ورود")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cur = mine[Math.min(idx, mine.length - 1)];
  const dept = depts.find((d) => d.key === cur.dept);
  if (!dept) return null;
  const obj = board.find((o) => o.dept === dept.key) || null;
  const pct = obj && obj.target > 0 ? Math.min(100, Math.round((obj.done / obj.target) * 100)) : 0;
  const speak = () => { try { playTTS(`${tri("Oggi", "Heute", "Today", "Hoy", "Aujourd'hui", "امروز")}: ${dept.name}. ${cur.task || ""}`, { lang, voice: "mohamed" }); } catch { /* */ } };
  const addProgress = async (n) => {
    let pin = ""; try { pin = localStorage.getItem("mikilab_operator_pin") || ""; } catch { /* */ }
    try { await deptApi.progress({ dept: dept.key, qty: n, pin, operator: opName }); load(); playTTS(`+${n}. ${tri("registrato", "erfasst", "recorded", "registrado", "enregistré", "ثبت شد")}`, { lang, voice: "mohamed" }); } catch { /* */ }
  };

  return (
    <div data-testid="dept-focus" className="w-full mb-3 rounded-2xl border p-4 text-left" style={{ borderColor: `${dept.accent}66`, background: `${dept.accent}0d` }}>
      <div className="relative h-28 -mx-4 -mt-4 mb-3 overflow-hidden rounded-t-2xl bg-[#050810]" data-testid="dept-3d-strip">
        <AvatarWorld3D theme={dept.key} accent={dept.accent} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-2xl font-cyber font-black uppercase tracking-widest" style={{ color: dept.accent, textShadow: `0 0 18px ${dept.accent}` }}>{dept.icon} {dept.name}</span>
        </div>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span data-testid="dept-focus-opname" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white"><UserCheck className="w-3.5 h-3.5" style={{ color: dept.accent }} /> {opName}</span>
        <button data-testid="dept-focus-reset-op" onClick={resetOp} className="text-[10px] font-bold text-[#64748B] hover:text-[#00F0FF]">{tri("non sei tu?", "nicht du?", "not you?", "¿no eres tú?", "pas toi ?", "تو نیستی؟")}</button>
      </div>
      {mine.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-2" data-testid="dept-focus-switch">
          {mine.map((m, i) => { const dd = depts.find((d) => d.key === m.dept); return (
            <button key={m.id} data-testid={`dept-focus-switch-${m.dept}`} onClick={() => setIdx(i)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold active:scale-95 ${i === idx ? "text-white" : "text-[#94A3B8]"}`}
              style={i === idx ? { background: `${dd?.accent || "#00F0FF"}22`, border: `1px solid ${dd?.accent || "#00F0FF"}66`, color: dd?.accent } : { border: "1px solid #1e293b" }}>
              {dd?.icon} {dd?.name}
            </button>
          ); })}
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{dept.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: dept.accent }}>{tri("Il TUO reparto oggi", "Dein Bereich heute", "Your department today", "Tu área hoy", "Ton atelier du jour", "بخش امروز تو")}</p>
          <p className="text-base font-black text-white truncate">{dept.name}{cur.task ? ` · ${cur.task}` : ""}</p>
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
