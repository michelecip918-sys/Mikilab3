import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, ChevronLeft, Scale } from "lucide-react";
import MamoAssistant from "@/components/MamoAssistant";
import SmartScale from "@/components/SmartScale";
import TeamTasks from "@/components/TeamTasks";
import DoughTimer from "@/components/DoughTimer";
import SequenceGuard from "@/components/SequenceGuard";
import ShiftPowerBoard from "@/components/ShiftPowerBoard";
import OperatorAura from "@/components/OperatorAura";
import HeadsetChannel from "@/components/HeadsetChannel";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;
const API = process.env.REACT_APP_BACKEND_URL;
const ROLE_KEY = "mikilab_role";

// Reparti/postazioni BASE. Vengono ARRICCHITI a runtime con i reparti e le postazioni
// (feature) che il Capo crea nell'Elite Engine → così le postazioni "aumentano" da sole.
const BASE_DEPTS = [
  { key: "panetteria", label: "🍞 Panetteria", color: "#5E8CA8", roles: ["Impastatore", "Fornaio", "Laugen / Pretzel", "Fermentazione", "Centro Formule"] },
  { key: "pizzeria", label: "🍕 Pizzeria", color: "#3E9C93", roles: ["Pizzaiolo", "Forno Pizze", "Sfornate", "Consegne"] },
  { key: "pasticceria", label: "🥐 Pasticceria & Gelateria", color: "#7FB0A6", roles: ["Pasticcere", "Bilanciamento Formule", "Abbattitore", "Raffreddamento"] },
  { key: "generale", label: "👥 Generale", color: "#f59e0b", roles: ["Apprendista", "Banconista", "Aiuto Panettiere"] },
];

export default function MohamedFloor() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [role, setRole] = useState(() => { try { return localStorage.getItem(ROLE_KEY) || ""; } catch { return ""; } });
  const [active, setActive] = useState(false);
  const [tool, setTool] = useState(null); // null | "scale"
  const [depts, setDepts] = useState(BASE_DEPTS);

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
        merged.push({ key: c.id, label: `🏭 ${c.title}`, color: "#8b5cf6", roles: roles.length ? roles : ["Postazione Universale"] });
      });
      setDepts(merged);
    }).catch(() => { /* offline → resta la lista base */ });
  }, []);

  const pick = (r) => { try { localStorage.setItem(ROLE_KEY, r); } catch { /* */ } setRole(r); try { window.dispatchEvent(new CustomEvent("mikilab-role-changed", { detail: { role: r } })); } catch { /* */ } };
  const changeRole = () => { setActive(false); setRole(""); try { localStorage.removeItem(ROLE_KEY); } catch { /* */ } try { window.dispatchEvent(new CustomEvent("mikilab-role-changed", { detail: { role: "" } })); } catch { /* */ } };

  // 1) Nessun ruolo → scelta postazione
  if (!role) {
    return (
      <div data-testid="mohamed-role-select" className="space-y-5">
        <SequenceGuard />
        <ShiftPowerBoard />
        <div className="text-center">
          <img src={`${PUB}/avatar_mohamed.jpg`} alt="Mohamed" className="w-20 h-20 rounded-2xl object-cover object-top mx-auto border-2 border-amber-500/60" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <h2 className="mt-3 text-xl font-black text-white uppercase tracking-wide">Mohamed</h2>
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
    <div data-testid="mohamed-scale" className="space-y-4">
      <SmartScale onExit={() => setTool(null)} />
    </div>
  );

  // 2b) Ruolo scelto → avvia guida vocale
  if (active) return (
    <div data-testid="mohamed-floor-active" className="space-y-4">
      <button data-testid="mohamed-change-role" onClick={changeRole} className="inline-flex items-center gap-1 text-xs font-bold text-[#94A3B8] hover:text-white"><ChevronLeft className="w-4 h-4" /> {role} · {tri("cambia ruolo", "Rolle ändern", "change role", "cambiar rol", "changer de rôle", "تغییر نقش")}</button>
      <MamoAssistant />
    </div>
  );

  return (
    <div data-testid="mohamed-floor" className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-full mb-4"><SequenceGuard /></div>
      <div className="w-full"><TeamTasks operatorName={role} /></div>
      <div className="w-full"><DoughTimer /></div>
      <span data-testid="mohamed-role-badge" className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/40 text-xs font-black uppercase tracking-wider">{role}</span>
      <button data-testid="mohamed-mic-btn" onClick={() => setActive(true)} className="relative group active:scale-95 transition-all">
        <OperatorAura name={role} size={184} showBadge={true}>
          <img src={`${PUB}/avatar_mohamed.jpg`} alt="Mohamed" className="w-full h-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </OperatorAura>
        <span className="absolute bottom-1 right-1 z-20 w-14 h-14 rounded-full bg-amber-500 border-4 border-[#030712] flex items-center justify-center shadow-lg"><Mic className="w-6 h-6 text-[#030712]" /></span>
      </button>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 font-black text-2xl uppercase tracking-wide text-white">Mohamed</motion.h2>
      <p className="mt-2 max-w-xs text-sm text-[#94A3B8] leading-relaxed">{tri("Tocca: ti leggo i task del tuo ruolo dalla coda del Capo, passo-passo.", "Tippe: ich lese dir die Aufgaben deiner Rolle aus der Warteschlange des Chefs vor.", "Tap: I read your role's tasks from the Capo's queue, step by step.", "Toca: te leo las tareas de tu rol desde la cola del Capo.", "Touche : je te lis les tâches de ton rôle depuis la file du Capo.", "بزن: وظایف نقش‌ات را از صف کاپو می‌خوانم.")}</p>
      <button data-testid="mohamed-open-scale" onClick={() => setTool("scale")} className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0b0f19] border border-[#3E9C93]/50 text-[#3E9C93] font-black text-sm active:scale-95 transition-all">
        <Scale className="w-4 h-4" /> {tri("Bilancia Guidata", "Geführte Waage", "Guided Scale", "Báscula Guiada", "Balance Guidée", "ترازوی راهنما")}
      </button>
      <div className="w-full mt-5"><HeadsetChannel /></div>
      <button data-testid="mohamed-change-role-2" onClick={changeRole} className="mt-4 text-[11px] font-bold text-[#64748B] hover:text-amber-400">{tri("Cambia postazione", "Station ändern", "Change station", "Cambiar puesto", "Changer de poste", "تغییر پست")}</button>
    </div>
  );
}
