import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, ChevronLeft, Scale, Radio, ChevronDown, CheckCircle2, Volume2, Factory } from "lucide-react";
import { playTTS } from "@/lib/tts";
import DeptFocus from "@/components/DeptFocus";
import MamoAssistant from "@/components/MamoAssistant";
import SmartScale from "@/components/SmartScale";
import TeamTasks from "@/components/TeamTasks";
import FloorRoleBriefing from "@/components/FloorRoleBriefing";
import SosButton from "@/components/SosButton";
import DoughTimer from "@/components/DoughTimer";
import SequenceGuard from "@/components/SequenceGuard";
import ShiftPowerBoard from "@/components/ShiftPowerBoard";
import OperatorAura from "@/components/OperatorAura";
import HeadsetChannel from "@/components/HeadsetChannel";
import LivenessGate from "@/components/LivenessGate";
import FloorCrossCheck from "@/components/FloorCrossCheck";
import ComplianceBeacon from "@/components/ComplianceBeacon";
import OperatorClock from "@/components/OperatorClock";
import { complianceApi } from "@/lib/api";
import { deusApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;
const API = process.env.REACT_APP_BACKEND_URL;
const ROLE_KEY = "mikilab_role";

// Banner "Piano del Capo": mostra alla Produzione il piano divino inviato da Sitor Deus.
function CapoPlanBanner({ tri }) {
  const [plan, setPlan] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = () => deusApi.capoPlan().then((d) => { if (alive && d && d.plan_markdown) setPlan(d); }).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  if (!plan) return null;
  return (
    <div data-testid="capo-plan-banner" className="w-full mb-3 rounded-2xl border border-[#FF6B00]/40 bg-[#0b0f19] overflow-hidden text-left">
      <button data-testid="capo-plan-toggle" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-4 py-3 active:scale-[0.99] transition-all">
        <span className="w-8 h-8 rounded-lg bg-[#FF6B00]/15 border border-[#FF6B00]/40 flex items-center justify-center shrink-0"><Radio className="w-4 h-4 text-[#FF6B00]" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-black uppercase tracking-wide text-[#FF6B00]">{tri("Piano del Capo · Sitor", "Plan des Capo · Sitor", "Capo's Plan · Sitor", "Plan del Capo · Sitor", "Plan du Capo · Sitor", "برنامه کاپو · Sitor")}</span>
          {plan.headline && <span className="block text-[11px] text-[#94A3B8] truncate">{plan.headline}</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 max-h-72 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-mono-data text-[11px] leading-relaxed text-[#cbd5e1]">{plan.plan_markdown}</pre>
        </div>
      )}
    </div>
  );
}

// Reparti/postazioni BASE. Vengono ARRICCHITI a runtime con i reparti e le postazioni
// (feature) che il Capo crea nell'Elite Engine → così le postazioni "aumentano" da sole.
const BASE_DEPTS = [
  { key: "panetteria", label: "🍞 Panetteria", color: "#64748B", roles: ["Impastatore", "Fornaio", "Laugen / Pretzel", "Fermentazione", "Centro Formule"] },
  { key: "pizzeria", label: "🍕 Pizzeria", color: "#3E9C93", roles: ["Pizzaiolo", "Forno Pizze", "Sfornate", "Consegne"] },
  { key: "pasticceria", label: "🥐 Pasticceria & Gelateria", color: "#7FB0A6", roles: ["Pasticcere", "Bilanciamento Formule", "Abbattitore", "Raffreddamento"] },
  { key: "generale", label: "👥 Generale", color: "#f59e0b", roles: ["Apprendista", "Banconista", "Aiuto Panettiere"] },
];

// Coda di produzione generata dal Capo, visibile in reparto: spunta + lettura vocale.
function FloorQueue({ tri, lang }) {
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    let alive = true;
    const load = () => deusApi.productionQueue().then((d) => { if (alive) setTasks((d.tasks || []).filter((t) => t.status === "pending")); }).catch(() => {});
    load(); const id = setInterval(load, 20000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  const done = (t) => deusApi.queueDone(t.id).then(() => setTasks((q) => q.filter((x) => x.id !== t.id))).catch(() => {});
  const read = (t) => { try { playTTS(`${t.title}. ${t.detail || ""}`, { lang, voice: "mikemix" }); } catch { /* */ } };
  if (!tasks.length) return null;
  return (
    <div data-testid="floor-queue" className="w-full mb-3 rounded-2xl border border-[#FFB800]/40 bg-[#0b0f19] p-3 text-left">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#FFB800] mb-2"><Factory className="w-4 h-4" /> {tri("Da produrre ora", "Jetzt produzieren", "To produce now", "A producir ahora", "À produire", "اکنون تولید")} · {tasks.length}</p>
      <div className="space-y-1.5 max-h-56 overflow-y-auto">
        {tasks.slice(0, 15).map((t) => (
          <div key={t.id} data-testid={`floor-task-${t.id}`} className="flex items-center gap-2 rounded-xl bg-[#0C1019] border border-[#1e293b] px-3 py-2">
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#FF6B00]/10 text-[#FF9D42] border border-[#FF6B00]/20 shrink-0">{t.dept}</span>
            <div className="min-w-0 flex-1"><p className="text-xs font-bold text-white truncate">{t.title}</p>{t.detail && <p className="text-[10px] text-[#64748B] truncate">{t.detail}</p>}</div>
            <button data-testid={`floor-task-read-${t.id}`} onClick={() => read(t)} className="shrink-0 w-7 h-7 rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/40 text-[#FF6B00] flex items-center justify-center active:scale-95"><Volume2 className="w-3.5 h-3.5" /></button>
            <button data-testid={`floor-task-done-${t.id}`} onClick={() => done(t)} className="shrink-0 w-7 h-7 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/40 text-[#22c55e] flex items-center justify-center active:scale-95"><CheckCircle2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function MikeMixFloor() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [role, setRole] = useState(() => { try { return localStorage.getItem(ROLE_KEY) || ""; } catch { return ""; } });
  const [active, setActive] = useState(false);
  const [tool, setTool] = useState(null); // null | "scale"
  const [depts, setDepts] = useState(BASE_DEPTS);
  const [gate, setGate] = useState(false);
  const [livenessOk, setLivenessOk] = useState(false);

  // Sincronizza le postazioni con i reparti/feature configurati dal Capo (Elite Engine).
  useEffect(() => {
    fetch(`${API}/api/lab/departments`).then((r) => (r.ok ? r.json() : {})).then((d) => {
      const extras = d.extras || {};
      const merged = BASE_DEPTS.map((b) => {
        const ex = (extras[b.key] || []).filter((f) => f && !b.roles.includes(f));
        return ex.length ? { ...b, roles: [...b.roles, ...ex] } : b;
      });
      (d.custom || []).forEach((c) => {
        const base = (c.features || []).filter(Boolean);
        const ex = (extras[c.id] || []).filter((f) => f && !base.includes(f));
        const roles = [...base, ...ex];
        merged.push({ key: c.id, label: `🏭 ${c.title}`, color: "#64748B", roles: roles.length ? roles : ["Postazione Universale"] });
      });
      setDepts(merged);
    }).catch(() => { /* offline → resta la lista base */ });
  }, []);

  const pick = (r) => { try { localStorage.setItem(ROLE_KEY, r); } catch { /* */ } setRole(r); try { window.dispatchEvent(new CustomEvent("mikilab-role-changed", { detail: { role: r } })); } catch { /* */ } };

  // Back-guard: il tasto Indietro srotola lo stato del laboratorio invece di uscire dall'app.
  useEffect(() => {
    const onBack = (e) => {
      if (tool) { setTool(null); e.preventDefault(); }
      else if (gate) { setGate(false); e.preventDefault(); }
      else if (active) { setActive(false); e.preventDefault(); }
      else if (role) { pick(""); e.preventDefault(); }
    };
    window.addEventListener("mikilab-go-back", onBack);
    return () => window.removeEventListener("mikilab-go-back", onBack);
  }, [tool, gate, active, role]);
  const changeRole = () => { setActive(false); setRole(""); try { localStorage.removeItem(ROLE_KEY); } catch { /* */ } try { window.dispatchEvent(new CustomEvent("mikilab-role-changed", { detail: { role: "" } })); } catch { /* */ } };

  // 1) Nessun ruolo → scelta postazione
  if (!role) {
    return (
      <div data-testid="mikemix-role-select" className="space-y-5">
        <SequenceGuard />
        <ShiftPowerBoard />
        <DeptFocus tri={tri} lang={lang} />
        <CapoPlanBanner tri={tri} />
        <FloorQueue tri={tri} lang={lang} />
        <div className="text-center">
          <img src={`${PUB}/avatar_nexus.jpg`} alt="Sitor" className="w-20 h-20 rounded-2xl object-cover object-top mx-auto border-2 border-amber-500/60" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <h2 className="mt-3 text-xl font-black text-white uppercase tracking-wide">Sitor</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">{tri("Ciao! Seleziona la tua postazione di forno per ricevere i task giusti.", "Hallo! Wähle deine Station, um die richtigen Aufgaben zu erhalten.", "Hi! Select your station to receive the right tasks.", "¡Hola! Selecciona tu puesto para recibir las tareas correctas.", "Salut ! Choisis ton poste pour recevoir les bonnes tâches.", "سلام! پست کاری‌ات را انتخاب کن تا وظایف درست را بگیری.")}</p>
        </div>
        {depts.map((d) => (
          <div key={d.key}>
            <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: d.color }}>{d.label}</p>
            <div className="grid grid-cols-2 gap-2">
              {d.roles.map((r) => (
                <button key={r} data-testid={`role-${r.replace(/[^a-zA-Z]/g, "").toLowerCase()}`} onClick={() => pick(r)}
                  className="py-3 px-3 rounded-xl bg-[#030712] border border-[#1e293b] text-sm font-bold text-white text-left hover:border-amber-500/60 active:scale-95 transition-all" style={{ borderLeft: `3px solid ${d.color}` }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2) Ruolo scelto → strumento bilancia guidata (Letz_Passive)
  if (tool === "scale") return (
    <div data-testid="mikemix-scale" className="space-y-4">
      <SmartScale onExit={() => setTool(null)} />
    </div>
  );

  // 2b) Ruolo scelto → avvia guida vocale
  if (active) return (
    <div data-testid="mikemix-floor-active" className="space-y-4">
      <button data-testid="mikemix-change-role" onClick={changeRole} className="inline-flex items-center gap-1 text-xs font-bold text-[#94A3B8] hover:text-white"><ChevronLeft className="w-4 h-4" /> {role} · {tri("cambia ruolo", "Rolle ändern", "change role", "cambiar rol", "changer de rôle", "تغییر نقش")}</button>
      <MamoAssistant />
    </div>
  );

  return (
    <div data-testid="mikemix-floor" className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-full mb-3"><CapoPlanBanner tri={tri} /></div>
      <div className="w-full"><DeptFocus tri={tri} lang={lang} /></div>
      <div className="w-full"><FloorQueue tri={tri} lang={lang} /></div>
      <div className="w-full mb-4"><SequenceGuard /></div>
      <div className="w-full mb-2"><ComplianceBeacon compact /></div>
      <div className="w-full mb-2"><FloorRoleBriefing role={role} /></div>
      <div className="w-full"><OperatorClock /></div>
      <div className="w-full"><TeamTasks operatorName={role} /></div>
      <div className="w-full"><DoughTimer /></div>
      <span data-testid="mikemix-role-badge" className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/40 text-xs font-black uppercase tracking-wider">{role}</span>
      <button data-testid="mikemix-mic-btn" onClick={() => { if (livenessOk) setActive(true); else setGate(true); }} className="relative group active:scale-95 transition-all">
        <OperatorAura name={role} size={184} showBadge={true} announce={true}>
          <img src={`${PUB}/avatar_nexus.jpg`} alt="Sitor" className="w-full h-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </OperatorAura>
        <span className="absolute bottom-1 right-1 z-20 w-14 h-14 rounded-full bg-amber-500 border-4 border-[#030712] flex items-center justify-center shadow-lg"><Mic className="w-6 h-6 text-[#030712]" /></span>
      </button>
      {gate && <LivenessGate onPass={() => { setLivenessOk(true); setGate(false); setActive(true); try { complianceApi.clock(role, "in"); } catch { /* */ } }} onCancel={() => setGate(false)} />}
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 font-black text-2xl uppercase tracking-wide text-white">Sitor</motion.h2>
      <p className="mt-2 max-w-xs text-sm text-[#94A3B8] leading-relaxed">{tri("Parla a Sitor: dì il tuo nome o \"pronti\" e ti leggo i task del tuo ruolo, passo-passo. Niente pulsanti — solo voce.", "Sprich mit Sitor: sag deinen Namen oder \"bereit\" und ich lese dir deine Aufgaben vor, Schritt für Schritt. Keine Tasten — nur Stimme.", "Speak to Sitor: say your name or \"ready\" and I'll read your role's tasks, step by step. No buttons — voice only.", "Habla con Sitor: di tu nombre o \"listo\" y te leo las tareas de tu rol, paso a paso. Sin botones — solo voz.", "Parle à Sitor : dis ton nom ou \"prêt\" et je te lis les tâches de ton rôle, étape par étape. Pas de boutons — voix seule.", "با Sitor حرف بزن: نامت یا «آماده» را بگو تا وظایف نقش‌ات را قدم‌به‌قدم بخوانم. بدون دکمه — فقط صدا.")}</p>
      <button data-testid="mikemix-open-scale" onClick={() => setTool("scale")}
        className="group relative overflow-hidden mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm text-[#22d3ee] active:scale-95 transition-all"
        style={{ background: "linear-gradient(155deg, rgba(11,20,32,0.9), rgba(6,12,22,0.9))", border: "1px solid rgba(34,211,238,0.45)", boxShadow: "0 0 20px rgba(34,211,238,0.18)" }}>
        <span aria-hidden className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: "linear-gradient(90deg,transparent,rgba(34,211,238,0.9),transparent)" }} />
        <Scale className="w-4 h-4" /> {tri("Bilancia Guidata", "Geführte Waage", "Guided Scale", "Báscula Guiada", "Balance Guidée", "ترازوی راهنما")}
      </button>
      <div className="w-full mt-5"><HeadsetChannel /></div>
      <div className="w-full mt-3"><SosButton role={role} operator={role} /></div>
      <div className="w-full mt-3"><FloorCrossCheck role={role} task={role || "Produzione"} /></div>
      <button data-testid="mikemix-change-role-2" onClick={changeRole} className="mt-4 text-[11px] font-bold text-[#64748B] hover:text-amber-400">{tri("Cambia postazione", "Station ändern", "Change station", "Cambiar puesto", "Changer de poste", "تغییر پست")}</button>
    </div>
  );
}
