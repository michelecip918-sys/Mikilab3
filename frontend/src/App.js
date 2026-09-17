/*
 * ============================================================================
 *  MIKILAB PRO & Sitor — PROPRIETARY & CONFIDENTIAL
 *  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
 *  Unico proprietario legale: il Master. Sole legal owner: the Master.
 *  Codice riservato: vietata copia, distribuzione, reverse engineering o
 *  cloning non autorizzati, tracciati dal Sitor Security Guardian.
 * ============================================================================
 *  PLANCIA OLOGRAFICA — Zero-Menu vertical command console (v40).
 *  Unica PWA continua a scorrimento verticale: Master · Operatori · Sala Sitor.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import "@/App.css";
import { Toaster, toast } from "sonner";
import { ProfileProvider } from "@/profile/ProfileContext";
import { useAuth } from "@/auth/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { AmbientProvider } from "@/audio/AmbientContext";
import { TimerProvider } from "@/audio/TimerContext";
import { SoundFXProvider } from "@/audio/SoundFXContext";
import { MixerTimersProvider } from "@/audio/MixerTimersContext";
import { MachinesProvider } from "@/audio/MachinesContext";

import PinLock from "@/components/PinLock";
import { isLocked as pinIsLocked } from "@/lib/pinLock";
import RadioFornaio from "@/components/RadioFornaio";
import ShiftScheduler from "@/components/ShiftScheduler";
import AudioRouteIndicator from "@/components/AudioRouteIndicator";
import LegalPage from "@/sections/LegalPage";
import MagazzinoManager from "@/components/MagazzinoManager";
import DocsDownload from "@/components/DocsDownload";
import AutoReport from "@/components/AutoReport";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthScreen from "@/components/AuthScreen";
import ResetPassword from "@/components/ResetPassword";
import OperatoreSelect from "@/components/OperatoreSelect";
import PinSetup from "@/components/PinSetup";
import OrdineCapo from "@/components/OrdineCapo";
import FloorOperatorDay from "@/components/FloorOperatorDay";
import MikeMixSense from "@/components/MikeMixSense";
import DowntimeTraining from "@/components/DowntimeTraining";
import MohamedInbox from "@/components/MohamedInbox";
import LivingRecipe from "@/components/LivingRecipe";
import AdvancedLab from "@/components/AdvancedLab";
import PublicGate from "@/components/PublicGate";
import FloorInviteLanding from "@/components/FloorInviteLanding";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { OrgBadge } from "@/components/OrgBadge";
import LangSelector from "@/components/LangSelector";
import { resetSessionBoards } from "@/lib/sessionState";
import { api, recipesApi, warehouseApi, planApi, weeklyApi, floorPlanApi } from "@/lib/api";
import InstallApp from "@/components/InstallApp";
import KioskMode from "@/components/KioskMode";
import SplashScreen from "@/components/SplashScreen";
import { mkTri } from "@/i18n/triMaps";
import { playDeckAlarm } from "@/lib/uiSounds";
import { playTTS } from "@/lib/tts";
import { DeckAlarmBar } from "@/components/DeckAlarmBar";
import LateNotifier from "@/components/LateNotifier";
import { ShieldCheck, LogOut, User, WifiOff, Lock, BookOpen, Sun, Moon, X } from "lucide-react";

import Ricette from "@/sections/Ricette";
import OrdiniExtra from "@/components/OrdiniExtra";
import PlantRadar from "@/components/PlantRadar";
import SecurityGuardian from "@/components/SecurityGuardian";
import PianoUnico from "@/components/console/PianoUnico";
import ChiusuraGiornata from "@/components/console/ChiusuraGiornata";
import ConsegneFurgoni from "@/components/console/ConsegneFurgoni";
import CapoMachinesOverview from "@/components/console/CapoMachinesOverview";
import { activityProfile } from "@/lib/activityProfile";
import { SubTabs } from "@/components/console/SubTabs";
import ZoneHero3D from "@/components/console/ZoneHero3D";
import OnboardingActivity from "@/components/OnboardingActivity";
import PasticceriaConsegne from "@/components/console/PasticceriaConsegne";
import PizzeriaServizio from "@/components/console/PizzeriaServizio";import SitorGuidedTools from "@/components/console/SitorGuidedTools";
import AdminSecurity from "@/components/console/AdminSecurity";
import EliteTools from "@/components/console/EliteTools";
import HardwareBridge from "@/components/console/HardwareBridge";
import ShiftBriefing from "@/components/console/ShiftBriefing";
import DigitalTwin from "@/components/console/DigitalTwin";
import EmergencyCenter from "@/components/EmergencyCenter";
import OvenQC from "@/components/console/OvenQC";
import B2BOrders from "@/components/console/B2BOrders";
import CarbonFootprint from "@/components/console/CarbonFootprint";
import RecipeThermalFlow from "@/components/console/RecipeThermalFlow";
import SiloManager from "@/components/console/SiloManager";
import ColdStorage from "@/components/console/ColdStorage";
import RecipeAuditButton from "@/components/console/RecipeAuditButton";
import { InventoryButton, BatchPhoenixButton } from "@/components/console/LegacyToolButton";
import TodayFeed from "@/components/console/TodayFeed";
import SitorTour from "@/components/console/SitorTour";
import AgvFleet from "@/components/console/AgvFleet";
import TimelineTurno from "@/components/console/TimelineTurno";
import PackagingSync from "@/components/console/PackagingSync";
import DeptAssign from "@/components/console/DeptAssign";
import ShiftTeamCall from "@/components/console/ShiftTeamCall";
import ShiftTemplates from "@/components/console/ShiftTemplates";
import FloorShiftReports from "@/components/console/FloorShiftReports";
import TeamFaces from "@/components/console/TeamFaces";
import MachineArrival from "@/components/console/MachineArrival";
import ShiftReport from "@/components/console/ShiftReport";
import MyMachines from "@/components/console/MyMachines";
import DeptManager from "@/components/console/DeptManager";
import SalaSitor from "@/components/console/SalaSitor";
import TeamCoordination from "@/components/console/TeamCoordination";
import GuidaMikiLab from "@/components/GuidaMikiLab";
import SitorAtelier from "@/components/console/SitorAtelier";
import ImageForge from "@/components/console/ImageForge";
import { PlantHeartbeatProvider } from "@/context/PlantHeartbeatContext";

const PUB = process.env.PUBLIC_URL;

const DECK_DEPTS = [
  { id: "panificio", accent: "#8a97a6", it: "Panificio", de: "Backstube", en: "Bakery", fr: "Boulangerie" },
  { id: "pizzeria", accent: "#a4afbb", it: "Pizzeria", de: "Pizzeria", en: "Pizzeria", fr: "Pizzeria" },
  { id: "pasticceria", accent: "#93a2ae", it: "Pasticceria", de: "Konditorei", en: "Pastry", fr: "Pâtisserie" },
  { id: "banco", accent: "#64748B", it: "Magazzino", de: "Lager", en: "Warehouse", fr: "Entrepôt" },
];
const DECK_PHOTOS = { panificio: "panificio.jpg", pizzeria: "pizzeria.jpg", pasticceria: "pasticceria.jpg", banco: "banco.jpg" };

// Sequenziale: una sezione della console del Capo sempre visibile (niente schede da cercare).
function SecBlock({ id, icon, title, sub, accent = "#8a97a6", children }) {
  return (
    <section id={`capo-sec-${id}`} data-testid={`capo-sec-${id}`} className="scroll-mt-24 rounded-2xl border border-[#1e293b] bg-[#0b0f19]/60 overflow-hidden">
      <header className="px-4 py-3.5 flex items-start gap-3 border-b border-[#1e293b]/70" style={{ background: `linear-gradient(90deg, ${accent}16, transparent 62%)` }}>
        <span className="text-2xl leading-none mt-0.5" aria-hidden>{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-cyber font-black text-white text-sm sm:text-base uppercase tracking-wide leading-tight">{title}</h2>
        </div>
      </header>
      <div className="px-3 sm:px-4 py-4 space-y-4">{children}</div>
    </section>
  );
}

// Schede interne di una macro-sezione della console (niente più stack di pannelli chiusi).
function SecTabs({ sec, tabs, active, onChange, accent = "#8a97a6" }) {
  const cur = tabs.some((t) => t.id === active) ? active : tabs[0].id;
  return (
    <div data-testid={`tabs-${sec}`} className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
      {tabs.map((t) => (
        <button key={t.id} type="button" data-testid={`tab-${sec}-${t.id}`} onClick={() => onChange(t.id)}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors active:scale-95 ${cur === t.id ? "text-[#050810]" : "text-[#9aa6b2] border-[#334155]/60 hover:text-white hover:border-[#8a97a6]"}`}
          style={cur === t.id ? { background: accent, borderColor: accent } : {}}>
          <span aria-hidden>{t.icon}</span>{t.label}
        </button>
      ))}
    </div>
  );
}

function TabPanel({ testid, children }) {
  return <div data-testid={testid} className="holo-panel p-4 sm:p-5 scroll-mt-24">{children}</div>;
}

const QUICK_CHIP = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-[#cbd5e1] border border-[#a6b1bc]/30 bg-[#0b0f19]/60 hover:border-[#a6b1bc] hover:text-white transition-colors active:scale-95";

// Pannello (testid storico) → [sezione, scheda]: i deep-link attivano la scheda giusta.
const PANEL_TAB = {
  "panel-ricette": ["ricettario", "ricette"], "panel-thermalflow": ["ricettario", "thermal"], "panel-magazzino": ["ricettario", "magazzino"], "panel-elite": ["ricettario", "foodcost"], "panel-living-recipe": ["ricettario", "ricette"],
  "panel-piano-unico": ["piano", "piano"], "panel-chiusura": ["piano", "chiusura"], "panel-consegne": ["piano", "consegne"], "panel-machines-overview": ["piano", "stato"],
  "panel-ordini": ["ordini", "extra"], "panel-b2b": ["ordini", "b2b"], "panel-pastry": ["ordini", "pastry"], "panel-pizzeria": ["ordini", "pizzeria"],
  "panel-team-coordination": ["team", "coordinamento"], "panel-dept-assign": ["team", "assegnazione"], "panel-shift-team": ["team", "riepilogo"], "panel-shift-templates": ["team", "turni"], "panel-team-faces": ["team", "volti"],
  "panel-departments": ["strumenti", "reparti"], "panel-my-machines": ["strumenti", "macchine"], "panel-silos": ["strumenti", "silos"], "panel-sitor-atelier": ["strumenti", "macchine"], "panel-machine-arrival": ["strumenti", "arrival"], "panel-coldstorage": ["strumenti", "celle"], "panel-hardware": ["strumenti", "macchine"], "panel-ovenqc": ["strumenti", "macchine"],
  "panel-docs": ["sicurezza", "report"], "panel-security": ["sicurezza", "accessi"], "panel-emergency": ["sicurezza", "emergenze"],
};


export default function App() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const { user, authOpen, setAuthOpen, logout } = useAuth();

  const [adminOk, setAdminOk] = useState(false); // PIN richiesto a OGNI apertura (nessun "ricorda accesso")
  const [mode, setMode] = useState("capo");
  const [opLevel, setOpLevel] = useState(() => { try { return localStorage.getItem("mikilab_op_level") || "novizio"; } catch { return "novizio"; } });
  const [showGuide, setShowGuide] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("reset"));
  const [floorInviteToken] = useState(() => new URLSearchParams(window.location.search).get("floor_invite"));
  const [operator, setOperatorState] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_operator") || "null"); } catch { return null; } });
  const [showOperator, setShowOperator] = useState(false);
  const [floorRole, setFloorRole] = useState(() => { try { return localStorage.getItem("mikilab_role") || ""; } catch { return ""; } });
  const [floorUnlocked, setFloorUnlocked] = useState(() => !pinIsLocked());
  const [showPinLock, setShowPinLock] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [activeZone, setActiveZone] = useState("master");
  const [deckDept, setDeckDept] = useState(DECK_DEPTS[0]);
  const [showBriefing, setShowBriefing] = useState(false);
  const [activity, setActivity] = useState(() => { try { return localStorage.getItem("mikilab_activity") || "panificio"; } catch { return "panificio"; } });
  const [showOnboarding, setShowOnboarding] = useState(() => { try { return !localStorage.getItem("mikilab_onboarded"); } catch { return false; } });
  const [themeLight, setThemeLight] = useState(() => { try { return localStorage.getItem("mikilab_theme") === "light"; } catch { return false; } });
  const [showAdvanced, setShowAdvanced] = useState(() => { try { return localStorage.getItem("mikilab_advanced") === "1"; } catch { return false; } });
  const [sitorOpen, setSitorOpen] = useState(false); // chat Sitor in pannello a comparsa (FAB)
  const [capoTab, setCapoTab] = useState({ ricettario: "ricette", piano: "piano", ordini: "extra", team: "coordinamento", strumenti: "macchine", sicurezza: "report" });
  const activateTab = (sec, tab) => setCapoTab((t) => ({ ...t, [sec]: tab }));
  const effTab = (sec, ids) => (ids.includes(capoTab[sec]) ? capoTab[sec] : ids[0]);
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (themeLight) root.classList.add("theme-light"); else root.classList.remove("theme-light");
      localStorage.setItem("mikilab_theme", themeLight ? "light" : "dark");
    } catch { /* */ }
  }, [themeLight]);
  const toggleTheme = () => setThemeLight((v) => !v);

  // Deck reattivo: stato live dei reparti (turni attivi + allarmi Sitor), polling 15s.
  const [deckStatus, setDeckStatus] = useState(null);
  const prevDeckMood = useRef("sereno");
  const lastDeckAlarm = useRef(0);
  useEffect(() => {
    if (!adminOk || mode === "floor") return;
    let stop = false;
    const load = () => api.get("/deck/status").then((r) => {
      if (stop) return;
      setDeckStatus(r.data);
      // Allarme sonoro + voce Sitor all'ingresso in critico; ripete ogni 30s finche' resta critico.
      const mood = (r.data && r.data.mood) || "sereno";
      if (mood === "critico" && (prevDeckMood.current !== "critico" || Date.now() - lastDeckAlarm.current > 30000)) {
        lastDeckAlarm.current = Date.now();
        playDeckAlarm();
        // Voce Sitor: annuncia il reparto in allarme (solo all'ingresso in critico, non a ogni ripetizione).
        if (prevDeckMood.current !== "critico") {
          const st = (r.data.critical_stations || []).slice(0, 3).join(", ");
          const msg = st
            ? tri(`Attenzione Capo, ${st} in allarme.`, `Achtung Chef, ${st} im Alarm.`, `Attention Capo, ${st} on alert.`, `Atención Capo, ${st} en alarma.`, `Attention Capo, ${st} en alerte.`, `توجه کاپو، ${st} در هشدار.`)
            : tri("Attenzione Capo, l'impianto è in stato critico.", "Achtung Chef, die Anlage ist kritisch.", "Attention Capo, the plant is critical.", "Atención Capo, la planta está crítica.", "Attention Capo, l'usine est critique.", "توجه کاپو، کارخانه بحرانی است.");
          try { playTTS(msg, { lang, voice: "mikemix" }); } catch { /* */ }
        }
      }
      prevDeckMood.current = mood;
      try { window.dispatchEvent(new CustomEvent("mikilab-mood", { detail: mood })); } catch { /* */ }
    }).catch(() => { /* */ });
    load();
    const t = setInterval(load, 15000);
    return () => { stop = true; clearInterval(t); };
  }, [adminOk]);
  const MOOD_COLORS = { sereno: "#0EA5E9", attivo: "#6e9e85", teso: "#a6b1bc", critico: "#b06e78" };
  const deckMood = (deckStatus && deckStatus.mood) || "sereno";
  const moodColor = MOOD_COLORS[deckMood] || "#0EA5E9";
  const moodLabel = { sereno: tri("Sereno", "Ruhig", "Calm", "Sereno", "Calme", "آرام"), attivo: tri("Attivo", "Aktiv", "Active", "Activo", "Actif", "فعال"), teso: tri("Teso", "Angespannt", "Tense", "Tenso", "Tendu", "پر تنش"), critico: tri("Critico", "Kritisch", "Critical", "Crítico", "Critique", "بحرانی") }[deckMood];
  const deptStatus = (id) => (deckStatus && deckStatus.depts && deckStatus.depts[id]) || null;

  // Briefing "Apertura Turno": NON si apre più da solo. Si apre solo dal pulsante dedicato,
  // così non ricompare a ogni accesso del Capo.

  // Plancia Capo a 6 sezioni a fisarmonica: ogni pannello appartiene a una sezione.
  // Le sezioni della console sono ora SEMPRE visibili (scroll, niente accordion).
  // Gli eventi "open-panel"/"open-group" non aprono più un gruppo ma portano lo scroll sul pannello/sezione.
  const GROUP_TO_SEC = { oggi: "oggi", produzione: "piano", squadra: "team", ricette: "ricettario", celle: "strumenti", sicurezza: "sicurezza" };
  useEffect(() => {
    const scrollToSel = (sel) => { const el = sel ? document.querySelector(sel) : null; if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
    const onJump = (e) => {
      const dest = e.detail ? PANEL_TAB[e.detail] : null;
      if (dest) { activateTab(dest[0], dest[1]); setTimeout(() => scrollToSel(`#capo-sec-${dest[0]}`), 60); }
      else if (e.detail) scrollToSel(`[data-testid="${e.detail}"]`);
    };
    const onGroup = (e) => {
      const sec = GROUP_TO_SEC[e.detail] || e.detail;
      if (sec === "oggi") scrollToSel('[data-testid="oggi-feed"]');
      else if (sec) scrollToSel(`#capo-sec-${sec}`);
    };
    window.addEventListener("mikilab:open-panel", onJump);
    window.addEventListener("mikilab:open-group", onGroup);
    return () => { window.removeEventListener("mikilab:open-panel", onJump); window.removeEventListener("mikilab:open-group", onGroup); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const zoneRefs = { master: useRef(null), operatori: useRef(null) };

  const jumpTo = useCallback((id) => {
    const el = zoneRefs[id]?.current;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Back-guard PWA: il tasto Indietro del browser NON deve mai uscire dall'app.
  // Arma una sentinella nella history una sola volta all'ingresso.
  const backArmed = useRef(false);
  useEffect(() => {
    if (!adminOk || backArmed.current) return;
    backArmed.current = true;
    try { window.history.pushState({ ml: 1 }, ""); } catch { /* */ }
  }, [adminOk]);
  // Intercetta Indietro e "srotola" lo stato interno invece di lasciare la PWA.
  useEffect(() => {
    if (!adminOk) return;
    const onPop = () => {
      if (showPinLock) setShowPinLock(false);
      else if (showOperator) setShowOperator(false);
      else if (showBriefing) setShowBriefing(false);
      else {
        let floorHandled = false;
        try { floorHandled = !window.dispatchEvent(new CustomEvent("mikilab-go-back", { cancelable: true })); } catch { /* */ }
        if (!floorHandled && activeZone !== "master") jumpTo("master");
      }
      try { window.history.pushState({ ml: 1 }, ""); } catch { /* */ } // ri-arma: mai uscire con Indietro
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [adminOk, showPinLock, showOperator, showBriefing, activeZone, jumpTo]);

  // Scroll-spy: evidenzia la zona attiva nel rail ambientale.
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActiveZone(e.target.dataset.zone); });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    Object.entries(zoneRefs).forEach(([, r]) => { if (r.current) obs.observe(r.current); });
    return () => obs.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const on = () => setOnline(true); const off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  useEffect(() => {
    const h = (e) => {
      try {
        const r = (e && e.detail && e.detail.role != null) ? e.detail.role : (localStorage.getItem("mikilab_role") || "");
        setFloorRole(r);
      } catch (_err) {
        setFloorRole("");
      }
    };
    window.addEventListener("mikilab-role-changed", h);
    return () => window.removeEventListener("mikilab-role-changed", h);
  }, []);
  useEffect(() => {
    const warm = () => { if (adminOk && navigator.onLine) { recipesApi.list("mikilab"); if (user) recipesApi.list("personal"); } };
    warm(); window.addEventListener("online", warm);
    return () => window.removeEventListener("online", warm);
  }, [user, adminOk]);
  useEffect(() => {
    const resync = () => {
      Promise.allSettled([recipesApi.list("mikilab"), warehouseApi.list(), planApi.get(), weeklyApi.get(), floorPlanApi.get()]).then(() => {
        try { window.dispatchEvent(new Event("mikilab-floor-plan-updated")); } catch { /* */ }
        try { window.dispatchEvent(new Event("mikilab-warehouse-changed")); } catch { /* */ }
        toast.success(tri("Riconnesso · dati aggiornati dal server.", "Wieder online · Daten aktualisiert.", "Back online · data synced.", "Reconectado · datos actualizados.", "Reconnecté · données synchronisées.", "دوباره آنلاین · داده‌ها همگام شد."));
      });
    };
    window.addEventListener("online", resync);
    return () => window.removeEventListener("online", resync);
  }, [tri]);

  useEffect(() => {
    const h = (e) => { setAuthMode((e && e.detail && e.detail.mode) || "login"); setAuthOpen(true); };
    window.addEventListener("mikilab-open-auth", h);
    return () => window.removeEventListener("mikilab-open-auth", h);
  }, [setAuthOpen]);
  useEffect(() => { if (user) { setAuthOpen(false); try { localStorage.setItem("mikilab_seen_intro", "1"); } catch { /* */ } } }, [user, setAuthOpen]);

  // Zero-state Capo: board puliti a ogni nuova sessione (cataloghi master intatti).
  const zeroStateFor = useRef(null);
  useEffect(() => {
    const id = user ? (user.email || user.user_id || "capo") : null;
    if (id && zeroStateFor.current !== id) { zeroStateFor.current = id; resetSessionBoards({ clearRole: false }); }
    if (!id) zeroStateFor.current = null;
  }, [user]);

  useEffect(() => {
    try { const inv = new URLSearchParams(window.location.search).get("invite"); if (inv && !user) { setAuthMode("register"); setAuthOpen(true); } } catch { /* */ }
  }, [user, setAuthOpen]);

  const setOperator = (op) => { try { localStorage.setItem("mikilab_operator", JSON.stringify(op)); } catch { /* */ } setOperatorState(op); setShowOperator(false); };
  const openAuth = () => { setAuthMode("login"); setAuthOpen(true); };

  if (floorInviteToken && !adminOk && !resetToken) return <><SplashScreen /><FloorInviteLanding token={floorInviteToken} onEnter={(p) => {
    try { localStorage.setItem("mikilab_mode", "floor"); localStorage.setItem("mikilab_op_level", p.level || "novizio"); if (p.name) localStorage.setItem("mikilab_role", p.name); } catch { /* */ }
    setMode("floor"); setOpLevel(p.level || "novizio"); setFloorRole(p.name || ""); setFloorUnlocked(true); setAdminOk(true);
    try { window.dispatchEvent(new CustomEvent("mikilab-role-changed", { detail: { role: p.name || "" } })); } catch { /* */ }
    try { const u = new URL(window.location.href); u.searchParams.delete("floor_invite"); window.history.replaceState({}, "", u.toString()); } catch { /* */ }
  }} /></>;
  if (!adminOk && !resetToken) return <><SplashScreen /><PublicGate onUnlock={(payload) => {
    const p = payload || {};
    if (p.mode === "floor") {
      try { localStorage.setItem("mikilab_op_level", p.level || "novizio"); if (p.name) localStorage.setItem("mikilab_role", p.name); } catch { /* */ }
      setMode("floor"); setOpLevel(p.level || "novizio"); setFloorRole(p.name || ""); setFloorUnlocked(true); setAdminOk(true);
      try { window.dispatchEvent(new CustomEvent("mikilab-role-changed", { detail: { role: p.name || "" } })); } catch { /* */ }
    } else {
      try { localStorage.removeItem("mikilab_mode"); localStorage.removeItem("mikilab_admin_unlocked"); } catch { /* */ }
      setMode("capo"); setAdminOk(true);
    }
  }} /></>;
  if (resetToken) return <ResetPassword token={resetToken} onDone={() => { setResetToken(null); setAuthOpen(true); }} />;
  if (authOpen && !user) return <div className="fixed inset-0 z-[70] bg-[#060A10] overflow-auto"><AuthScreen onClose={() => setAuthOpen(false)} initialMode={authMode} /></div>;

  return (
    <ProfileProvider><AmbientProvider><TimerProvider><SoundFXProvider><MixerTimersProvider><MachinesProvider>
      <SecurityGuardian />
      <SplashScreen />
      <div className="holo-root min-h-screen font-sans selection:bg-[#8a97a6] selection:text-[#060A10]">
        <div className="holo-canvas" aria-hidden />

        <div className="relative z-10 flex flex-col min-h-screen">
          {!online && (
            <div data-testid="offline-badge" className="fixed top-[76px] left-1/2 -translate-x-1/2 z-[60] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/50 text-amber-300 text-[11px] font-bold backdrop-blur-md">
              <WifiOff className="w-3.5 h-3.5" /> {tri("Offline · archivio locale", "Offline · lokales Archiv", "Offline · local archive", "Sin conexión · archivo local", "Hors ligne · archive locale", "آفلاین · بایگانی محلی")}
            </div>
          )}

          {/* STATUS BAR ambientale (nessun menu classico) */}
          <header data-testid="app-header" className="sticky top-0 z-50 border-b border-[#8a97a6]/15 bg-[#060A10]/85 backdrop-blur-xl px-3 sm:px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
              <button data-testid="brand-home" onClick={() => jumpTo("master")} className="flex items-center gap-2.5 min-w-0 shrink-0 active:scale-95 transition-transform">
                <img src={`${PUB}/logo-emblem.png`} alt="MikiLab Pro" data-keepcolor className="w-9 h-9 rounded-lg object-contain shrink-0" />
                <span className="text-left whitespace-nowrap">
                  <span className="block font-cyber text-lg sm:text-2xl font-black tracking-[0.18em] text-white uppercase whitespace-nowrap">MikiLab<span className="text-[#8a97a6]"> Pro</span></span>
                  <span className="hidden sm:block font-mono-data text-[9px] tracking-[0.3em] text-[#8a97a6]/70 uppercase">Holographic Command OS</span>
                </span>
              </button>

              <div className="flex items-center flex-wrap justify-end gap-1.5 sm:gap-2 relative">
                {user && user.role === "admin" && (
                  <button data-testid="briefing-open" onClick={() => setShowBriefing(true)} title="Cyber-Trio"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#9aa6b2]/10 border border-[#9aa6b2]/40 text-[#9aa6b2] font-bold text-xs active:scale-95 transition-all">
                    ◐ <span className="hidden sm:inline">{tri("Turno", "Schicht", "Shift", "Turno", "Turn", "شیفت")}</span>
                  </button>
                )}
                {user && user.role === "admin" && <OrgBadge />}
                <button data-testid="theme-toggle" onClick={toggleTheme} title={tri("Tema Chiaro/Scuro", "Hell/Dunkel", "Light/Dark", "Claro/Oscuro", "Clair/Sombre", "روشن/تیره")}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#9aa6b2]/10 border border-[#9aa6b2]/35 text-[#9aa6b2] active:scale-95 transition-all">
                  {themeLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>
                <LangSelector testid="header-lang" />
                <select data-testid="activity-selector" value={activity} onChange={(e) => { setActivity(e.target.value); try { localStorage.setItem("mikilab_activity", e.target.value); } catch { /* */ } }}
                  className="rounded-lg bg-[#0C1019] border border-[#8a97a6]/30 text-[#8a97a6] text-[11px] font-bold px-2 py-1.5 outline-none focus:border-[#8a97a6]">
                  <option value="panificio">{tri("Panificio", "Backstube", "Bakery", "Panadería", "Boulangerie", "نانوایی")}</option>
                  <option value="pizzeria">{tri("Pizzeria", "Pizzeria", "Pizzeria", "Pizzería", "Pizzeria", "پیتزا")}</option>
                  <option value="pasticceria">{tri("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "شیرینی")}</option>
                </select>
                <InstallApp variant="chip" />
                <button data-testid="guida-open-btn" onClick={() => setShowGuide(true)} title={tri("Guida", "Anleitung", "Guide", "Guía", "Guide", "راهنما")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#a6b1bc]/10 border border-[#a6b1bc]/35 text-[#a6b1bc] font-bold text-xs active:scale-95 transition-all">
                  <BookOpen className="w-3.5 h-3.5" /> <span className="hidden md:inline">{tri("Guida", "Anleitung", "Guide", "Guía", "Guide", "راهنما")}</span>
                </button>
                {user && user.role === "admin" && mode !== "floor" && (
                  <button data-testid="sitor-tour-open" onClick={() => { try { window.dispatchEvent(new Event("mikilab:start-tour")); } catch { /* */ } }} title={tri("Tour guidato di Sitor", "Sitor-Tour", "Sitor guided tour", "Tour de Sitor", "Visite guidée Sitor", "تور راهنمای سیتور")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#a6b1bc]/10 border border-[#a6b1bc]/35 text-[#a6b1bc] font-bold text-xs active:scale-95 transition-all">
                    ✦ <span className="hidden md:inline">{tri("Tour", "Tour", "Tour", "Tour", "Tour", "تور")}</span>
                  </button>
                )}
                {mode === "floor" ? (
                  <>
                    <span data-testid="floor-operator-badge" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#8a97a6]/12 border border-[#8a97a6]/40 text-[#9aa6b2] text-xs font-bold">
                      <User className="w-3.5 h-3.5" /> {floorRole || tri("Operaio", "Bediener", "Operator", "Operario", "Opérateur", "اپراتور")}
                      <span className="hidden sm:inline text-[9px] uppercase tracking-wider text-[#8a97a6]/70">· {opLevel}</span>
                    </span>
                    <button data-testid="floor-tour-open" onClick={() => { try { window.dispatchEvent(new Event("mikilab:start-floor-tour")); } catch { /* */ } }} title={tri("Tour della postazione", "Stations-Tour", "Station tour", "Tour del puesto", "Visite du poste", "تور ایستگاه")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#a6b1bc]/10 border border-[#a6b1bc]/35 text-[#a6b1bc] font-bold text-xs active:scale-95 transition-all">
                      ✦ <span className="hidden sm:inline">{tri("Tour", "Tour", "Tour", "Tour", "Tour", "تور")}</span>
                    </button>
                    <button data-testid="floor-exit-btn" onClick={() => { try { localStorage.removeItem("mikilab_mode"); localStorage.removeItem("mikilab_admin_unlocked"); localStorage.removeItem("mikilab_pin_unlocked"); } catch { /* */ } window.location.reload(); }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0C1019] border border-[#bb8489]/40 text-[#bb8489] font-bold text-xs active:scale-95 transition-all">
                      <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{tri("Esci", "Abmelden", "Exit", "Salir", "Quitter", "خروج")}</span>
                    </button>
                  </>
                ) : (
                  <>
                <KioskMode />
                <button data-testid="operatore-chip" onClick={() => setShowOperator(true)} title="Operatore"
                  className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-[#0C1019] border border-[#8a97a6]/20 text-white hover:border-[#8a97a6]/60 active:scale-95 transition-all">
                  {operator ? <img src={`${PUB}/${operator.img}`} alt={operator.name} className="w-6 h-6 rounded-full object-cover object-top border border-[#8a97a6]/50" /> : <User className="w-4 h-4 text-[#8a97a6]" />}
                  <span className="font-bold text-xs hidden md:inline">{operator ? operator.name : tri("Operatore", "Bediener", "Operator", "Operario", "Opérateur", "اپراتور")}</span>
                </button>
                <button data-testid="account-btn" onClick={() => { if (user) setShowAccountMenu((v) => !v); else openAuth(); }}
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-xs active:scale-95 transition-all border ${user ? "bg-[#8a97a6]/15 border-[#8a97a6]/50 text-[#8a97a6]" : "bg-[#8a97a6]/10 border-[#8a97a6]/30 text-[#8a97a6] hover:bg-[#8a97a6]/20"}`}>
                  {user ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{user ? (user.name || (user.email ? user.email.split("@")[0].slice(0, 10) : "Capo")) : tri("Accedi", "Anmelden", "Sign in", "Acceder", "Connexion", "ورود")}</span>
                </button>
                {user && showAccountMenu && (
                  <div data-testid="account-menu" className="absolute right-0 top-11 w-72 holo-panel p-3 z-[80] max-h-[80vh] overflow-auto">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8a97a6] mb-1"><ShieldCheck className="w-3.5 h-3.5" /> {tri("CAPO · MASTER ADMIN", "CHEF · MASTER ADMIN", "CAPO · MASTER ADMIN", "CAPO · MASTER ADMIN", "CAPO · MASTER ADMIN", "کاپو · مدیر ارشد")}</div>
                    <p className="text-[11px] text-white font-semibold truncate">{user.name || "Capo"}</p>
                    {user.email && <p className="text-[10px] text-[#94A3B8] truncate mb-2">{user.email}</p>}
                    <p className="text-[9.5px] leading-snug text-[#a6b1bc] mb-2">✦ {tri("Riconosciuto Capo Supremo — Sitor ti obbedisce.", "Als Oberster Chef erkannt — Sitor gehorcht dir.", "Recognized Supreme Capo — Sitor obeys you.", "Reconocido Capo Supremo — Sitor te obedece.", "Reconnu Capo Suprême — Sitor t'obéit.", "کاپوی برتر شناخته شد — Sitor از تو اطاعت می‌کند.")}</p>
                    <button data-testid="logout-btn" onClick={async () => { await logout(); setShowAccountMenu(false); toast.success(tri("Sei uscito. Sessione Capo chiusa.", "Abgemeldet.", "Signed out.", "Has salido.", "Déconnecté.", "خارج شدی.")); }}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-[#0C1019] border border-[#1e293b] text-[#bb8489] font-bold text-xs hover:border-[#bb8489]/50 active:scale-95 transition-all">
                      <LogOut className="w-3.5 h-3.5" /> {tri("Esci", "Abmelden", "Sign out", "Salir", "Quitter", "خروج")}
                    </button>
                    {user.role === "admin" && <OrgSwitcher />}
                  </div>
                )}
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-40">
            <ErrorBoundary resetKey={`${activeZone}-${user ? "u" : "a"}`}>

              {mode !== "floor" && (<>
              {/* MULTIVERSO · plancia snella: foto reale del forno + reparti cliccabili */}
              <div data-testid="deck-multiverse" className="relative mt-4 mb-6 rounded-2xl overflow-hidden border h-28 sm:h-36 transition-all duration-700" style={{ borderColor: `${moodColor}55`, boxShadow: `0 0 22px ${moodColor}2e`, background: "#050810" }}>
                {DECK_DEPTS.map((d) => (
                  <img key={d.id} src={`${PUB}/deck/${DECK_PHOTOS[d.id]}`} alt="" aria-hidden
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                    style={{ opacity: deckDept.id === d.id ? 0.6 : 0 }} />
                ))}
                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(5,8,16,0.94) 0%, rgba(5,8,16,0.55) 45%, rgba(5,8,16,0.25) 100%)" }} />
                {/* Alone reattivo dell'umore impianto (sereno/attivo/teso/critico) */}
                <div data-testid="deck-mood-glow" className={`absolute inset-0 pointer-events-none transition-all duration-700 ${deckMood === "critico" ? "animate-pulse" : ""}`} style={{ background: `radial-gradient(ellipse at 85% 110%, ${moodColor}30 0%, transparent 55%)` }} />
                <div className="absolute bottom-2 left-3.5 right-3.5 z-10 flex items-end justify-between gap-2">
                  <p className="font-cyber text-base sm:text-lg font-black text-white uppercase tracking-[0.16em] whitespace-nowrap truncate">MikiLab<span className="text-[#8a97a6]"> Console</span></p>
                  {deckStatus && (
                    <div data-testid="deck-heartbeat" className="shrink-0 flex items-center gap-1.5 font-mono-data text-[10px] tracking-[0.18em] uppercase rounded-md px-2 py-1 bg-[#050810]/70 backdrop-blur-sm" style={{ color: moodColor }}>
                      <span className={`inline-block w-2 h-2 rounded-full ${deckMood === "critico" ? "animate-ping" : "animate-pulse"}`} style={{ background: moodColor }} />
                      {deckStatus.heartbeat} BPM · {moodLabel}
                    </div>
                  )}
                </div>
                <div data-testid="deck-depts" className="absolute top-2 left-3 right-3 z-10 flex flex-wrap gap-1">
                  {DECK_DEPTS.map((d) => {
                    const st = deptStatus(d.id);
                    const lvlColor = st && st.level === "critical" ? "#b06e78" : st && st.level === "warn" ? "#a6b1bc" : d.accent;
                    const alarmed = st && st.level !== "ok";
                    return (
                      <button key={d.id} data-testid={`deck-dept-${d.id}`}
                        onClick={() => { setDeckDept(d); try { zoneRefs.operatori.current && zoneRefs.operatori.current.scrollIntoView({ behavior: "smooth", block: "start" }); } catch { /* */ } }}
                        title={st && st.people.length ? st.people.join(", ") : undefined}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all active:scale-95 ${st && st.level === "critical" ? "animate-pulse" : ""}`}
                        style={deckDept.id === d.id
                          ? { background: lvlColor, color: "#050810", borderColor: lvlColor, boxShadow: `0 0 16px ${lvlColor}88` }
                          : alarmed
                            ? { background: "rgba(6,10,18,0.6)", color: lvlColor, borderColor: `${lvlColor}99`, boxShadow: `0 0 14px ${lvlColor}55` }
                            : { background: "rgba(6,10,18,0.6)", color: "#CBD5E1", borderColor: "#1e293b" }}>
                        {st && st.active > 0 && <span data-testid={`deck-dot-${d.id}`} className="inline-block w-1.5 h-1.5 rounded-full bg-[#6e9e85] animate-pulse" />}
                        {tri(d.it, d.de, d.en, d.it, d.fr, d.it)}
                        {st && st.active > 0 && <span className="font-mono-data text-[9px] opacity-80">×{st.active}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <DeckAlarmBar tri={tri} refreshKey={deckMood} />
              {user && user.role === "admin" && <LateNotifier />}

              {/* ================= ZONA 1 · MASTER ================= */}
              <section ref={zoneRefs.master} data-zone="master" className="holo-zone pt-6">
                <ZoneHero3D testid="hero-master" theme="miki" onEnter={() => jumpTo("master")} avatar="avatar_miki.jpg" accent="#D97736" tag="Z-01 · Master" name="MikiLab" role={tri("Fondatore · Direttore di Produzione", "Gründer · Produktionsleiter", "Founder · Head of Production", "Fundador · Director de Producción", "Fondateur · Directeur de Production", "بنیان‌گذار · مدیر تولید")} />
                {!(user && user.role === "admin") ? (
                  <div data-testid="capo-gate" className="holo-panel p-6 sm:p-8 text-center">
                    <span className="holo-corner holo-corner-tl" style={{ color: "#64748B" }} />
                    <span className="holo-corner holo-corner-tr" style={{ color: "#64748B" }} />
                    <span className="holo-corner holo-corner-bl" style={{ color: "#64748B" }} />
                    <span className="holo-corner holo-corner-br" style={{ color: "#64748B" }} />
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#060A10] border border-[#64748B]/40 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(94,140,168,0.35)]">
                      <ShieldCheck className="w-8 h-8 text-[#64748B]" />
                    </div>
                    <h2 className="font-cyber text-lg font-black text-white uppercase tracking-wider">{tri("Accesso Capo riservato", "Chef-Zugang reserviert", "Capo access reserved", "Acceso Capo reservado", "Accès Capo réservé", "دسترسی کاپو محفوظ است")}</h2>
                    <p className="text-xs text-[#94A3B8] mt-2 max-w-md mx-auto">{tri("Ricettario, piano di produzione con Sitor, squadra e strumenti. Accedi per governare il laboratorio; gli operatori restano nella zona Produzione.", "Rezepte, Produktionsplan mit Sitor, Team und Werkzeuge. Melde dich an; das Team bleibt in der Produktionszone.", "Recipes, production plan with Sitor, team and tools. Sign in to run the lab; operators stay in the Production zone.", "Recetas, plan de producción con Sitor, equipo y herramientas. Accede para gestionar; el equipo usa la zona Producción.", "Recettes, plan de production avec Sitor, équipe et outils. Connecte-toi ; l'équipe reste en zone Production.", "دستورها، برنامه تولید با سیتور، تیم و ابزارها. وارد شو تا آزمایشگاه را مدیریت کنی.")}</p>
                    <button data-testid="capo-gate-login" onClick={openAuth} className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-cyber font-black text-sm text-[#060A10] active:scale-95 transition-all"
                      style={{ background: "linear-gradient(90deg,#64748B,#7DA3C0)", boxShadow: "0 0 22px rgba(94,140,168,0.45)" }}>
                      <ShieldCheck className="w-4 h-4" /> {tri("Accedi come Capo", "Als Chef anmelden", "Sign in as Capo", "Acceder como Capo", "Se connecter comme Capo", "ورود به‌عنوان کاپو")}
                    </button>
                    <button data-testid="capo-gate-floor" onClick={() => jumpTo("operatori")} className="mt-3 block mx-auto text-xs font-bold text-[#94A3B8] hover:text-[#8a97a6]">↓ {tri("Vai alla Produzione", "Zur Produktion", "Go to Production", "Ir a Producción", "Aller à la Production", "برو به تولید")}</button>
                  </div>
                ) : (
                  <div className="space-y-4" data-testid="master-console">
                    <PlantHeartbeatProvider>
                    {/* Navigazione rapida alle 6 macro-sezioni (scroll) */}
                    <nav data-testid="capo-secnav" className="sticky top-16 z-30 flex gap-1.5 overflow-x-auto no-scrollbar rounded-2xl border border-[#1e293b] bg-[#050810]/92 backdrop-blur-md px-2 py-2">
                      {[
                        { id: "ricettario", icon: "🥖", label: tri("Ricettario", "Rezepte", "Recipes", "Recetas", "Recettes", "دستورها") },
                        { id: "piano", icon: "🗓️", label: tri("Piano", "Plan", "Plan", "Plan", "Plan", "برنامه") },
                        { id: "ordini", icon: "⚡", label: tri("Ordini", "Aufträge", "Orders", "Pedidos", "Commandes", "سفارش") },
                        { id: "team", icon: "👥", label: tri("Team", "Team", "Team", "Equipo", "Équipe", "تیم") },
                        { id: "strumenti", icon: "🔌", label: tri("Strumenti", "Geräte", "Tools", "Herramientas", "Outils", "ابزار") },
                        { id: "sicurezza", icon: "🛡️", label: tri("Sicurezza", "Sicherheit", "Security", "Seguridad", "Sécurité", "امنیت") },
                      ].map((s) => (
                        <a key={s.id} href={`#capo-sec-${s.id}`} data-testid={`capo-secnav-${s.id}`}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-[#9aa6b2] border border-[#334155]/60 hover:border-[#8a97a6] hover:text-white transition-colors active:scale-95">
                          <span aria-hidden>{s.icon}</span>{s.label}
                        </a>
                      ))}
                    </nav>

                    {/* Feed del giorno: sempre in cima alla console */}
                    <div data-testid="oggi-feed" className="scroll-mt-24"><TodayFeed /></div>

                    {/* 1 · RICETTARIO */}
                    <SecBlock id="ricettario" icon="🥖" accent="#64748B"
                      title={tri("Ricettario", "Rezeptbuch", "Recipe Book", "Recetario", "Recettes", "دستورها")}>
                    <SecTabs sec="ricettario" accent="#64748B" active={capoTab.ricettario} onChange={(t) => activateTab("ricettario", t)}
                      tabs={[
                        { id: "ricette", icon: "🥖", label: tri("Ricette", "Rezepte", "Recipes", "Recetas", "Recettes", "دستورها") },
                        { id: "thermal", icon: "🌡️", label: "Thermal Flow" },
                        { id: "magazzino", icon: "📦", label: tri("Magazzino", "Lager", "Stock", "Almacén", "Stock", "انبار") },
                        { id: "foodcost", icon: "📊", label: "Food Cost" },
                      ]} />
                    {effTab("ricettario", ["ricette", "thermal", "magazzino", "foodcost"]) === "ricette" && (
                    <TabPanel testid="panel-ricette">
                      <RecipeAuditButton />
                      <Ricette isMasterView={true} />
                      {showAdvanced && <div data-testid="panel-living-recipe" className="mt-4 pt-4 border-t border-[#1e293b]"><LivingRecipe /></div>}
                    </TabPanel>
                    )}
                    {effTab("ricettario", ["ricette", "thermal", "magazzino", "foodcost"]) === "thermal" && (
                    <TabPanel testid="panel-thermalflow"><RecipeThermalFlow /></TabPanel>
                    )}
                    {effTab("ricettario", ["ricette", "thermal", "magazzino", "foodcost"]) === "magazzino" && (
                    <TabPanel testid="panel-magazzino">
                      <InventoryButton />
                      <MagazzinoManager />
                    </TabPanel>
                    )}
                    {effTab("ricettario", ["ricette", "thermal", "magazzino", "foodcost"]) === "foodcost" && (
                    <TabPanel testid="panel-elite"><EliteTools /></TabPanel>
                    )}
                    </SecBlock>

                    {/* 2 · PIANO SETTIMANALE */}
                    <SecBlock id="piano" icon="🗓️" accent="#9aa6b2"
                      title={tri("Piano Settimanale", "Wochenplan", "Weekly Plan", "Plan Semanal", "Plan Hebdomadaire", "برنامه هفتگی")}>
                    <div data-testid="piano-quick-actions" className="flex flex-wrap gap-1.5">
                      <button type="button" data-testid="piano-action-generate" onClick={() => activateTab("piano", "piano")} className={QUICK_CHIP}>🗓️ {tri("Genera il piano", "Plan erstellen", "Generate plan", "Generar plan", "Générer le plan", "ساخت برنامه")}</button>
                      <button type="button" data-testid="piano-action-close" onClick={() => activateTab("piano", "chiusura")} className={QUICK_CHIP}>✅ {tri("Chiudi la giornata", "Tag abschließen", "Close the day", "Cerrar el día", "Clôturer le jour", "بستن روز")}</button>
                      <button type="button" data-testid="piano-action-deliver" onClick={() => activateTab("piano", "consegne")} className={QUICK_CHIP}>🚚 {tri("Organizza consegne", "Lieferungen planen", "Organize deliveries", "Organizar entregas", "Organiser livraisons", "سازمان تحویل")}</button>
                    </div>
                    <SecTabs sec="piano" accent="#9aa6b2" active={capoTab.piano} onChange={(t) => activateTab("piano", t)}
                      tabs={[
                        { id: "piano", icon: "🗓️", label: tri("Piano", "Plan", "Plan", "Plan", "Plan", "برنامه") },
                        { id: "chiusura", icon: "✅", label: tri("Chiusura", "Abschluss", "Close", "Cierre", "Clôture", "بستن") },
                        { id: "consegne", icon: "🚚", label: tri("Consegne", "Lieferungen", "Deliveries", "Entregas", "Livraisons", "تحویل") },
                        { id: "stato", icon: "🖥️", label: tri("Stato Macchine", "Maschinen", "Machines", "Máquinas", "Machines", "ماشین‌ها") },
                      ]} />
                    {effTab("piano", ["piano", "chiusura", "consegne", "stato"]) === "piano" && (
                    <TabPanel testid="panel-piano-unico"><PianoUnico activity={activity} /></TabPanel>
                    )}
                    {effTab("piano", ["piano", "chiusura", "consegne", "stato"]) === "chiusura" && (
                    <TabPanel testid="panel-chiusura"><ChiusuraGiornata /></TabPanel>
                    )}
                    {effTab("piano", ["piano", "chiusura", "consegne", "stato"]) === "consegne" && (
                    <TabPanel testid="panel-consegne"><ConsegneFurgoni /></TabPanel>
                    )}
                    {effTab("piano", ["piano", "chiusura", "consegne", "stato"]) === "stato" && (
                    <TabPanel testid="panel-machines-overview"><CapoMachinesOverview /></TabPanel>
                    )}
                    </SecBlock>

                    {/* 3 · ORDINI EXTRA */}
                    <SecBlock id="ordini" icon="⚡" accent="#64748B"
                      title={tri("Ordini Extra", "Extra-Aufträge", "Extra Orders", "Pedidos Extra", "Commandes Extra", "سفارش‌های اضافه")}>
                    <SecTabs sec="ordini" accent="#64748B" active={capoTab.ordini} onChange={(t) => activateTab("ordini", t)}
                      tabs={[
                        { id: "extra", icon: "⚡", label: tri("Oggi/Domani", "Heute/Morgen", "Today/Tomorrow", "Hoy/Mañana", "Auj./Demain", "امروز/فردا") },
                        { id: "b2b", icon: "🛒", label: "B2B" },
                        ...(activity === "pasticceria" ? [{ id: "pastry", icon: "🧁", label: tri("Eventi", "Events", "Events", "Eventos", "Événements", "رویداد") }] : []),
                        ...(activity === "pizzeria" ? [{ id: "pizzeria", icon: "🍕", label: tri("Panetti", "Teiglinge", "Dough balls", "Bollos", "Pâtons", "چانه") }] : []),
                      ]} />
                    {effTab("ordini", ["extra", "b2b", "pastry", "pizzeria"]) === "extra" && (
                    <TabPanel testid="panel-ordini"><OrdiniExtra /></TabPanel>
                    )}
                    {effTab("ordini", ["extra", "b2b", "pastry", "pizzeria"]) === "b2b" && (
                    <TabPanel testid="panel-b2b"><B2BOrders /></TabPanel>
                    )}
                    {activity === "pasticceria" && effTab("ordini", ["extra", "b2b", "pastry", "pizzeria"]) === "pastry" && (
                    <TabPanel testid="panel-pastry"><PasticceriaConsegne /></TabPanel>
                    )}
                    {activity === "pizzeria" && effTab("ordini", ["extra", "b2b", "pastry", "pizzeria"]) === "pizzeria" && (
                    <TabPanel testid="panel-pizzeria"><PizzeriaServizio /></TabPanel>
                    )}
                    </SecBlock>

                    {/* 4 · TURNI E RUOLI DEL TEAM */}
                    <SecBlock id="team" icon="👥" accent="#9aa6b2"
                      title={tri("Turni e Ruoli del Team", "Schichten & Rollen", "Team Shifts & Roles", "Turnos y Roles del Equipo", "Services & Rôles", "شیفت‌ها و نقش‌های تیم")}>
                    <div data-testid="team-quick-actions" className="flex flex-wrap gap-1.5">
                      <button type="button" data-testid="team-action-coordinate" onClick={() => activateTab("team", "coordinamento")} className={QUICK_CHIP}>🎧 {tri("Coordina la squadra", "Team koordinieren", "Coordinate team", "Coordinar equipo", "Coordonner l'équipe", "هماهنگی تیم")}</button>
                    </div>
                    <SecTabs sec="team" accent="#9aa6b2" active={capoTab.team} onChange={(t) => activateTab("team", t)}
                      tabs={[
                        { id: "coordinamento", icon: "🎧", label: tri("Coordinamento", "Koordination", "Coordination", "Coordinación", "Coordination", "هماهنگی") },
                        { id: "assegnazione", icon: "🏭", label: tri("Assegnazione", "Zuweisung", "Assignment", "Asignación", "Affectation", "تخصیص") },
                        { id: "riepilogo", icon: "📣", label: tri("Riepilogo", "Überblick", "Roll-call", "Resumen", "Appel", "فراخوان") },
                        { id: "turni", icon: "🗓️", label: tri("Turni-tipo", "Vorlagen", "Templates", "Plantillas", "Modèles", "الگو") },
                        { id: "volti", icon: "🙂", label: tri("Volti", "Gesichter", "Faces", "Rostros", "Visages", "چهره") },
                      ]} />
                    {effTab("team", ["coordinamento", "assegnazione", "riepilogo", "turni", "volti"]) === "coordinamento" && (
                    <TabPanel testid="panel-team-coordination"><TeamCoordination /></TabPanel>
                    )}
                    {effTab("team", ["coordinamento", "assegnazione", "riepilogo", "turni", "volti"]) === "assegnazione" && (
                    <TabPanel testid="panel-dept-assign"><DeptAssign /></TabPanel>
                    )}
                    {effTab("team", ["coordinamento", "assegnazione", "riepilogo", "turni", "volti"]) === "riepilogo" && (
                    <TabPanel testid="panel-shift-team"><ShiftTeamCall /></TabPanel>
                    )}
                    {effTab("team", ["coordinamento", "assegnazione", "riepilogo", "turni", "volti"]) === "turni" && (
                    <TabPanel testid="panel-shift-templates"><ShiftTemplates /></TabPanel>
                    )}
                    {effTab("team", ["coordinamento", "assegnazione", "riepilogo", "turni", "volti"]) === "volti" && (
                    <TabPanel testid="panel-team-faces"><TeamFaces /></TabPanel>
                    )}
                    </SecBlock>

                    {/* 5 · STRUMENTI COLLEGABILI */}
                    <SecBlock id="strumenti" icon="🔌" accent="#64748B"
                      title={tri("Strumenti Collegabili", "Anschließbare Geräte", "Connectable Tools", "Herramientas Conectables", "Outils Connectables", "ابزارهای قابل اتصال")}>
                    <div data-testid="advanced-toggle-row" className="flex items-center justify-between gap-3 rounded-xl border border-[#64748B]/25 bg-[#0C1019]/60 px-3.5 py-2.5">
                      <span className="text-[12px] font-bold text-[#9aa6b2]">{tri("Strumenti avanzati", "Erweiterte Werkzeuge", "Advanced tools", "Herramientas avanzadas", "Outils avancés", "ابزار پیشرفته")}
                        <span className="ml-2 text-[10px] font-normal text-[#64748b]">{tri("PLC, AI Vision, gemello digitale…", "SPS, AI Vision, Digital Twin…", "PLC, AI Vision, digital twin…", "PLC, AI Vision, gemelo…", "API, AI Vision, jumeau…", "PLC، AI Vision…")}</span>
                      </span>
                      <button type="button" role="switch" aria-checked={showAdvanced} data-testid="advanced-toggle"
                        onClick={() => setShowAdvanced((v) => { const nv = !v; try { localStorage.setItem("mikilab_advanced", nv ? "1" : "0"); } catch { /* */ } return nv; })}
                        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${showAdvanced ? "bg-[#3E9C93]" : "bg-[#334155]"}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${showAdvanced ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                    {(() => { const ap = activityProfile(activity); return (
                    <div data-testid="strumenti-activity-banner" className="rounded-xl border p-3.5 mb-1" style={{ borderColor: `${ap.accent}44`, background: `${ap.accent}12` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl leading-none">{ap.icon}</span>
                        <span className="font-black text-[12.5px] uppercase tracking-wide" style={{ color: ap.accent }} data-testid="strumenti-activity-label">{ap.label(lang)}</span>
                        <span className="text-[11px] text-[#7c8794]">· {tri("strumenti prioritari per la tua attività", "Prioritäre Geräte", "priority tools for your activity", "herramientas prioritarias", "outils prioritaires", "ابزارهای اولویت‌دار")}</span>
                      </div>
                      <ul className="space-y-1">
                        {ap.toolsFocus(lang).map((t, i) => (
                          <li key={i} data-testid={`strumenti-focus-${i}`} className="flex items-start gap-2 text-[12px] text-[#94A3B8]">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ap.accent }} />{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    ); })()}
                    <SecTabs sec="strumenti" accent="#64748B" active={capoTab.strumenti} onChange={(t) => activateTab("strumenti", t)}
                      tabs={[
                        { id: "macchine", icon: "🏭", label: tri("Macchine", "Maschinen", "Machines", "Máquinas", "Machines", "دستگاه‌ها") },
                        { id: "reparti", icon: "🗂️", label: tri("Reparti", "Bereiche", "Departments", "Departamentos", "Rayons", "بخش‌ها") },
                        { id: "silos", icon: "🫙", label: "Silos" },
                        { id: "arrival", icon: "⚙️", label: tri("Nuovi Macchinari", "Neue Maschinen", "New Machines", "Nuevas Máquinas", "Nouvelles Machines", "ماشین‌های جدید") },
                        { id: "celle", icon: "❄️", label: tri("Celle & Freezer", "Kühlung", "Cold Chain", "Cadena de Frío", "Chaîne du Froid", "زنجیره سرد") },
                      ]} />
                    {effTab("strumenti", ["macchine", "reparti", "silos", "arrival", "celle"]) === "macchine" && (
                    <TabPanel testid="panel-my-machines">
                      <div data-testid="macchine-quick-actions" className="flex flex-wrap gap-1.5 mb-3">
                        <button type="button" data-testid="strumenti-action-recognize" onClick={() => activateTab("strumenti", "arrival")} className={QUICK_CHIP}>⚙️ {tri("Riconosci macchina", "Maschine erkennen", "Recognize machine", "Reconocer máquina", "Reconnaître machine", "شناسایی دستگاه")}</button>
                        <button type="button" data-testid="strumenti-action-atelier" onClick={() => { try { document.getElementById("sitor-atelier-embed")?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch { /* */ } }} className={QUICK_CHIP}>✨ {tri("Strumenti su misura", "Werkzeuge nach Maß", "Custom tools", "Herramientas a medida", "Outils sur mesure", "ابزار سفارشی")}</button>
                      </div>
                      <MyMachines />
                      <div id="sitor-atelier-embed" data-testid="sitor-atelier-embed" className="mt-5 pt-4 border-t border-[#1e293b] scroll-mt-24">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[#64748B] mb-2">✨ {tri("Strumenti su misura", "Werkzeuge nach Maß", "Custom tools", "Herramientas a medida", "Outils sur mesure", "ابزار سفارشی")}</p>
                        <SitorAtelier />
                      </div>
                      {showAdvanced && (
                      <div data-testid="macchine-advanced" className="mt-5 pt-4 border-t border-[#1e293b] space-y-4">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[#64748B]">{tri("Pannelli tecnici avanzati", "Technische Profi-Panels", "Advanced technical panels", "Paneles técnicos", "Panneaux techniques", "پنل‌های فنی")}</p>
                        <BatchPhoenixButton />
                        <div data-testid="panel-hardware">
                          <div className="mb-3 rounded-xl overflow-hidden border border-[#D97736]/30 bg-[#0b0f19]">
                            <img src={`${PUB}/sitor_official.jpg`} alt="Sitor al forno" data-testid="sitor-oven-img" className="w-full h-36 object-cover object-top" loading="lazy" />
                          </div>
                          <HardwareBridge />
                        </div>
                        <div data-testid="panel-ovenqc"><OvenQC /></div>
                      </div>
                      )}
                    </TabPanel>
                    )}
                    {effTab("strumenti", ["macchine", "reparti", "silos", "arrival", "celle"]) === "reparti" && (
                    <TabPanel testid="panel-departments"><DeptManager /></TabPanel>
                    )}
                    {effTab("strumenti", ["macchine", "reparti", "silos", "arrival", "celle"]) === "silos" && (
                    <TabPanel testid="panel-silos"><SiloManager /></TabPanel>
                    )}
                    {effTab("strumenti", ["macchine", "reparti", "silos", "arrival", "celle"]) === "arrival" && (
                    <TabPanel testid="panel-machine-arrival"><MachineArrival /></TabPanel>
                    )}
                    {effTab("strumenti", ["macchine", "reparti", "silos", "arrival", "celle"]) === "celle" && (
                    <TabPanel testid="panel-coldstorage"><ColdStorage /></TabPanel>
                    )}
                    </SecBlock>

                    {/* 6 · SICUREZZA, REPORT & EMERGENZE */}
                    <SecBlock id="sicurezza" icon="🛡️" accent="#64748B"
                      title={tri("Sicurezza, Report & Emergenze", "Sicherheit, Berichte & Notfälle", "Security, Reports & Emergencies", "Seguridad, Informes y Emergencias", "Sécurité, Rapports & Urgences", "امنیت، گزارش و اضطراری")}>
                    <SecTabs sec="sicurezza" accent="#64748B" active={capoTab.sicurezza} onChange={(t) => activateTab("sicurezza", t)}
                      tabs={[
                        { id: "report", icon: "🧾", label: "Report" },
                        { id: "accessi", icon: "🛡️", label: tri("Accessi", "Zugriffe", "Access", "Accesos", "Accès", "دسترسی") },
                        { id: "emergenze", icon: "🚨", label: tri("Emergenze", "Notfälle", "Emergencies", "Emergencias", "Urgences", "اضطراری") },
                      ]} />
                    {effTab("sicurezza", ["report", "accessi", "emergenze"]) === "report" && (
                    <TabPanel testid="panel-docs">
                      <FloorShiftReports />
                      <div className="mt-4 pt-4 border-t border-[#64748B]/15"><ShiftReport /></div>
                      <div className="mt-4 pt-4 border-t border-[#64748B]/15"><DocsDownload /></div>
                    </TabPanel>
                    )}
                    {effTab("sicurezza", ["report", "accessi", "emergenze"]) === "accessi" && (
                    <TabPanel testid="panel-security">
                      <AdminSecurity />
                      <div className="mt-4 pt-4 border-t border-[#64748B]/15"><PinSetup /></div>
                    </TabPanel>
                    )}
                    {effTab("sicurezza", ["report", "accessi", "emergenze"]) === "emergenze" && (
                    <TabPanel testid="panel-emergency"><EmergencyCenter /></TabPanel>
                    )}
                    </SecBlock>

                    {/* Pulsante fisso: apre la chat Sitor in un pannello a comparsa, raggiungibile ovunque */}
                    <button type="button" onClick={() => setSitorOpen(true)} data-testid="ask-sitor-fab" aria-label={tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor", "Pregunta a Sitor", "Demande à Sitor", "از سیتور بپرس")}
                      className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full font-cyber font-black text-sm text-[#04070d] active:scale-95 transition-transform"
                      style={{ background: "linear-gradient(90deg,#8a97a6,#a6b1bc)", boxShadow: "0 0 26px rgba(138,151,166,0.5)" }}>
                      💬 {tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor", "Pregunta a Sitor", "Demande à Sitor", "از سیتور بپرس")}
                    </button>
                    {sitorOpen && (
                    <div data-testid="sitor-drawer" className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
                      <button type="button" data-testid="sitor-drawer-backdrop" aria-label={tri("Chiudi", "Schließen", "Close", "Cerrar", "Fermer", "بستن")} onClick={() => setSitorOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default" />
                      <div className="relative w-full max-w-md h-full bg-[#050810] border-l border-[#1e293b] flex flex-col shadow-[0_0_40px_rgba(138,151,166,0.25)]">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b] shrink-0">
                          <span className="font-cyber font-black text-sm text-white uppercase tracking-wider">Sitor</span>
                          <button type="button" data-testid="sitor-drawer-close" onClick={() => setSitorOpen(false)} aria-label={tri("Chiudi", "Schließen", "Close", "Cerrar", "Fermer", "بستن")}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-[#334155]/60 text-[#9aa6b2] hover:text-white hover:border-[#8a97a6] transition-colors active:scale-95">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3">
                          <SalaSitor />
                        </div>
                        <div data-testid="oggi-radio" className="shrink-0 border-t border-[#1e293b] px-3 py-2">
                          <RadioFornaio inline />
                        </div>
                      </div>
                    </div>
                    )}
                    {/* Le sezioni LEGGI/normative UE/DE sono nel footer (Impressum & Datenschutz). */}
                    </PlantHeartbeatProvider>
                  </div>
                )}
              </section>
              </>)}

              {/* ================= ZONA 2 · OPERATORI ================= */}
              {mode === "floor" && (
              <section ref={zoneRefs.operatori} data-zone="operatori" className="holo-zone pt-2">
                <ZoneHero3D testid="hero-operatori" theme={activity} onEnter={() => jumpTo("operatori")} avatar="sitor_official.jpg" accent="#8a97a6" tag="Z-02 · Produzione" name="Sitor" role={tri("Reparto Produzione · Fornaio", "Produktionsbereich · Bäcker", "Production Floor · Baker", "Área de Producción · Panadero", "Atelier Production · Boulanger", "بخش تولید · نانوا")} listenSpeaking />
                {floorUnlocked ? (
                  <div data-testid="floor-zone"><FloorOperatorDay /></div>
                ) : (
                  <div data-testid="floor-lock" className="holo-panel p-6 sm:p-8 text-center">
                    <span className="holo-corner holo-corner-tl" style={{ color: "#8a97a6" }} />
                    <span className="holo-corner holo-corner-tr" style={{ color: "#8a97a6" }} />
                    <span className="holo-corner holo-corner-bl" style={{ color: "#8a97a6" }} />
                    <span className="holo-corner holo-corner-br" style={{ color: "#8a97a6" }} />
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#060A10] border border-[#8a97a6]/40 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(138,151,166,0.35)]"><Lock className="w-8 h-8 text-[#8a97a6]" /></div>
                    <h2 className="font-cyber text-lg font-black text-white uppercase tracking-wider">{tri("Produzione bloccata", "Produktion gesperrt", "Production locked", "Producción bloqueada", "Production verrouillée", "تولید قفل است")}</h2>
                    <p className="text-xs text-[#94A3B8] mt-2 max-w-md mx-auto">{tri("Inserisci il PIN del team per accedere alla postazione.", "Team-PIN eingeben, um zur Station zu gelangen.", "Enter the team PIN to access your station.", "Introduce el PIN del equipo.", "Entre le PIN de l'équipe.", "پین تیم را وارد کن.")}</p>
                    <button data-testid="floor-unlock-btn" onClick={() => setShowPinLock(true)} className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-cyber font-black text-sm text-[#060A10] active:scale-95 transition-all" style={{ background: "linear-gradient(90deg,#8a97a6,#00C8D6)", boxShadow: "0 0 22px rgba(138,151,166,0.4)" }}>
                      <Lock className="w-4 h-4" /> {tri("Sblocca Produzione", "Entsperren", "Unlock Production", "Desbloquear", "Déverrouiller", "باز کردن")}
                    </button>
                  </div>
                )}
              </section>
              )}

            </ErrorBoundary>
          </main>

          <footer data-testid="page-footer" className="mt-auto border-t border-[#8a97a6]/12 py-5 px-4 bg-[#060A10]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono-data text-[10px] tracking-widest text-[#5b7183] uppercase">
              <p>MikiLab Pro · mikilab.de — Holographic Industrial OS</p>
              <div className="flex items-center gap-4">
                <span className="text-[#9aa6b2]">● SYS ONLINE</span>
                <button data-testid="legal-btn" onClick={() => setLegalOpen(true)} className="hover:text-[#8a97a6] transition-colors uppercase tracking-widest">Impressum & Datenschutz</button>
              </div>
            </div>
          </footer>
        </div>

        {legalOpen && (
          <div className="fixed inset-0 z-50 bg-[#060A10] overflow-auto p-4"><div className="max-w-xl mx-auto py-5"><button onClick={() => setLegalOpen(false)} className="mb-4 text-sm font-semibold text-[#8a97a6]">← {tri("Chiudi", "Schließen", "Close", "Cerrar", "Fermer", "بستن")}</button><LegalPage /></div></div>
        )}
        {showOnboarding && <OnboardingActivity onChoose={(a) => setActivity(a)} onClose={() => setShowOnboarding(false)} />}
        {showPinLock && <PinLock onUnlock={() => { setFloorUnlocked(true); setShowPinLock(false); jumpTo("operatori"); }} />}
        {showBriefing && user && user.role === "admin" && <ShiftBriefing onClose={() => setShowBriefing(false)} />}
        {showOperator && <OperatoreSelect current={operator} onSelect={setOperator} onClose={() => setShowOperator(false)} />}
        <GuidaMikiLab open={showGuide} onClose={() => setShowGuide(false)} />
        {user && user.role === "admin" && mode !== "floor" && <SitorTour variant="capo" />}
        {mode === "floor" && floorUnlocked && <SitorTour variant="floor" />}

        <Toaster position="top-center" richColors />
        {!user && <MikeMixSense section="guida" mode={activeZone === "operatori" ? "floor" : "lab"} isCapo={false} operator={operator} floorRole={floorRole} />}
        <ShiftScheduler />
        <AutoReport />
        <AudioRouteIndicator />
      </div>
    </MachinesProvider></MixerTimersProvider></SoundFXProvider></TimerProvider></AmbientProvider></ProfileProvider>
  );
}
