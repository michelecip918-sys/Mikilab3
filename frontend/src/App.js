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
import NexusConsole from "@/components/NexusConsole";
import MohamedInbox from "@/components/MohamedInbox";
import LivingRecipe from "@/components/LivingRecipe";
import AdvancedLab from "@/components/AdvancedLab";
import PublicGate from "@/components/PublicGate";
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
import { ShieldCheck, LogOut, User, WifiOff, Lock, BookOpen, Sun, Moon } from "lucide-react";

import Ricette from "@/sections/Ricette";
import OrdiniExtra from "@/components/OrdiniExtra";
import PlantRadar from "@/components/PlantRadar";
import SecurityGuardian from "@/components/SecurityGuardian";
import SmartPlannerStressZero from "@/sections/SmartPlannerStressZero";
import WeeklyPlan from "@/sections/WeeklyPlan";
import PianoProduzioneAI from "@/sections/PianoProduzioneAI";
import BackwardScheduler from "@/sections/BackwardScheduler";
import { HoloPanel } from "@/components/console/HoloKit";
import { SubTabs } from "@/components/console/SubTabs";
import ZoneHero3D from "@/components/console/ZoneHero3D";
import OnboardingActivity from "@/components/OnboardingActivity";
import PasticceriaConsegne from "@/components/console/PasticceriaConsegne";
import SitorGuidedTools from "@/components/console/SitorGuidedTools";
import OperatorsRoster from "@/components/console/OperatorsRoster";
import AdminSecurity from "@/components/console/AdminSecurity";
import EliteTools from "@/components/console/EliteTools";
import HardwareBridge from "@/components/console/HardwareBridge";
import AutoPlan from "@/components/console/AutoPlan";
import ShiftBriefing from "@/components/console/ShiftBriefing";
import DigitalTwin from "@/components/console/DigitalTwin";
import EmergencyCenter from "@/components/EmergencyCenter";
import OvenQC from "@/components/console/OvenQC";
import B2BOrders from "@/components/console/B2BOrders";
import CarbonFootprint from "@/components/console/CarbonFootprint";
import RecipeThermalFlow from "@/components/console/RecipeThermalFlow";
import SiloManager from "@/components/console/SiloManager";
import AdaptiveProofing from "@/components/console/AdaptiveProofing";
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
import { CapoGroup } from "@/components/console/CapoGroup";
import DeskScene from "@/components/console/DeskScene";
import SalaSitor from "@/components/console/SalaSitor";
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

export default function App() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const { user, authOpen, setAuthOpen, logout } = useAuth();

  const [adminOk, setAdminOk] = useState(() => { try { return localStorage.getItem("mikilab_admin_unlocked") === "1" || localStorage.getItem("mikilab_mode") === "floor"; } catch { return false; } });
  const [mode, setMode] = useState(() => { try { return localStorage.getItem("mikilab_mode") === "floor" ? "floor" : "capo"; } catch { return "capo"; } });
  const [opLevel, setOpLevel] = useState(() => { try { return localStorage.getItem("mikilab_op_level") || "novizio"; } catch { return "novizio"; } });
  const [showGuide, setShowGuide] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("reset"));
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
  // Solo UNA sezione aperta per volta = niente muro di 30 pannelli.
  const [consoleSec, setConsoleSec] = useState("piano");
  const toggleSec = (id) => setConsoleSec((s) => (s === id ? "" : id));
  const CONSOLE_SECMAP = {
    "panel-autoplan": "piano", "panel-weekly": "piano", "panel-pianoai": "piano", "panel-backward": "piano", "panel-ordine": "piano", "panel-planner": "piano", "panel-timeline": "piano",
    "panel-ordini": "ordini", "panel-b2b": "ordini",
    "panel-dept-assign": "squadra", "panel-shift-team": "squadra", "panel-shift-templates": "squadra",
    "panel-thermalflow": "strumenti", "panel-ricette": "strumenti", "panel-magazzino": "strumenti", "panel-silos": "strumenti", "panel-elite": "strumenti", "panel-docs": "strumenti", "panel-pin": "strumenti", "panel-security": "strumenti", "panel-twin": "strumenti", "panel-ovenqc": "strumenti", "panel-carbon": "strumenti", "panel-proofing": "strumenti", "panel-agv": "strumenti", "panel-packaging": "strumenti", "panel-radar": "strumenti", "panel-hardware": "strumenti", "panel-machine-arrival": "strumenti", "panel-image-forge": "strumenti", "panel-emergency": "strumenti", "panel-shiftreport": "strumenti",
  };
  useEffect(() => {
    const onJump = (e) => { const s = CONSOLE_SECMAP[e.detail]; if (s) setConsoleSec(s); };
    window.addEventListener("mikilab:open-panel", onJump);
    return () => window.removeEventListener("mikilab:open-panel", onJump);
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
    const h = (e) => { try { setFloorRole((e && e.detail && e.detail.role != null) ? e.detail.role : (localStorage.getItem("mikilab_role") || "")); } catch { setFloorRole(""); } };
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

  if (!adminOk && !resetToken) return <><SplashScreen /><PublicGate onUnlock={(payload) => {
    const p = payload || {};
    if (p.mode === "floor") {
      try { localStorage.setItem("mikilab_mode", "floor"); localStorage.setItem("mikilab_op_level", p.level || "novizio"); if (p.name) localStorage.setItem("mikilab_role", p.name); } catch { /* */ }
      setMode("floor"); setOpLevel(p.level || "novizio"); setFloorRole(p.name || ""); setFloorUnlocked(true); setAdminOk(true);
      try { window.dispatchEvent(new CustomEvent("mikilab-role-changed", { detail: { role: p.name || "" } })); } catch { /* */ }
    } else {
      try { localStorage.setItem("mikilab_admin_unlocked", "1"); localStorage.removeItem("mikilab_mode"); } catch { /* */ }
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
              <button data-testid="brand-home" onClick={() => jumpTo("master")} className="flex items-center min-w-0 shrink-0 active:scale-95 transition-transform">
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
                {mode === "floor" ? (
                  <>
                    <span data-testid="floor-operator-badge" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#8a97a6]/12 border border-[#8a97a6]/40 text-[#9aa6b2] text-xs font-bold">
                      <User className="w-3.5 h-3.5" /> {floorRole || tri("Operaio", "Bediener", "Operator", "Operario", "Opérateur", "اپراتور")}
                      <span className="hidden sm:inline text-[9px] uppercase tracking-wider text-[#8a97a6]/70">· {opLevel}</span>
                    </span>
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
                  <div data-testid="account-menu" className="absolute right-0 top-11 w-56 holo-panel p-3 z-[80]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8a97a6] mb-1"><ShieldCheck className="w-3.5 h-3.5" /> {tri("CAPO · MASTER ADMIN", "CHEF · MASTER ADMIN", "CAPO · MASTER ADMIN", "CAPO · MASTER ADMIN", "CAPO · MASTER ADMIN", "کاپو · مدیر ارشد")}</div>
                    <p className="text-[11px] text-white font-semibold truncate">{user.name || "Capo"}</p>
                    {user.email && <p className="text-[10px] text-[#94A3B8] truncate mb-2">{user.email}</p>}
                    <p className="text-[9.5px] leading-snug text-[#a6b1bc] mb-2">✦ {tri("Riconosciuto Capo Supremo — Sitor ti obbedisce.", "Als Oberster Chef erkannt — Sitor gehorcht dir.", "Recognized Supreme Capo — Sitor obeys you.", "Reconocido Capo Supremo — Sitor te obedece.", "Reconnu Capo Suprême — Sitor t'obéit.", "کاپوی برتر شناخته شد — Sitor از تو اطاعت می‌کند.")}</p>
                    <button data-testid="logout-btn" onClick={async () => { await logout(); setShowAccountMenu(false); toast.success(tri("Sei uscito. Sessione Capo chiusa.", "Abgemeldet.", "Signed out.", "Has salido.", "Déconnecté.", "خارج شدی.")); }}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-[#0C1019] border border-[#1e293b] text-[#bb8489] font-bold text-xs hover:border-[#bb8489]/50 active:scale-95 transition-all">
                      <LogOut className="w-3.5 h-3.5" /> {tri("Esci", "Abmelden", "Sign out", "Salir", "Quitter", "خروج")}
                    </button>
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
                  <p className="font-cyber text-base sm:text-lg font-black text-white uppercase tracking-[0.16em] whitespace-nowrap truncate">MikiLab<span className="text-[#8a97a6]"> Command Deck</span></p>
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

              {/* ================= ZONA 1 · MASTER ================= */}
              <section ref={zoneRefs.master} data-zone="master" className="holo-zone pt-6">
                <ZoneHero3D testid="hero-master" theme="miki" onEnter={() => jumpTo("master")} avatar="avatar_miki.jpg" accent="#64748B" tag="Z-01 · Master" name="MikiLab" role={tri("Fondatore · Direttore di Produzione", "Gründer · Produktionsleiter", "Founder · Head of Production", "Fundador · Director de Producción", "Fondateur · Directeur de Production", "بنیان‌گذار · مدیر تولید")} />
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
                    <DeskScene />
                    <PlantHeartbeatProvider>
                    <CapoGroup id="piano" icon="🗓️" accent="#9aa6b2" open={consoleSec === "piano"} onToggle={() => toggleSec("piano")}
                      title={tri("Piano Settimanale", "Wochenplan", "Weekly Plan", "Plan Semanal", "Plan Hebdomadaire", "برنامه هفتگی")}
                      sub={tri("Dai un punto di partenza: Sitor completa il piano del giorno e della settimana.", "Gib einen Startpunkt: Sitor vollendet den Plan.", "Give a starting point: Sitor completes the plan.", "Da un punto de partida: Sitor completa el plan.", "Donne un point de départ : Sitor complète le plan.", "یک نقطه شروع بده: سیتور برنامه را کامل می‌کند.")}>
                    <HoloPanel testid="panel-weekly" accent="#8a97a6" beacon="#a4afbb" icon="🗓️" defaultOpen title={tri("Piano Settimanale · Prodotti", "Wochenplan · Produkte", "Weekly Plan · Products", "Plan Semanal · Productos", "Plan Hebdomadaire · Produits", "برنامه هفتگی · محصولات")} sub={tri("Scrivi tu il piano: per ogni giorno scegli i prodotti, i pezzi e i grammi. Stampa PDF e archivio.", "Schreibe den Plan: pro Tag Produkte, Stück und Gramm. PDF und Archiv.", "Write the plan yourself: per day pick products, pieces and grams. PDF and archive.", "Escribe el plan: por día productos, piezas y gramos. PDF y archivo.", "Écris le plan : par jour produits, pièces et grammes. PDF et archive.", "برنامه را خودت بنویس: هر روز محصولات، تعداد و گرم.")}>
                      <WeeklyPlan />
                    </HoloPanel>
                    <HoloPanel testid="panel-pianoai" accent="#9aa6b2" beacon="#8a97a6" icon="🤖" defaultOpen title={tri("Piano AI di Sitor", "Sitors KI-Plan", "Sitor's AI Plan", "Plan IA de Sitor", "Plan IA de Sitor", "برنامه هوش مصنوعی سیتور")} sub={tri("Tutte le modalità AI in un unico posto: Sitor costruisce, calcola a ritroso e valida il piano.", "Alle KI-Modi an einem Ort.", "All AI modes in one place: Sitor builds, back-plans and validates.", "Todos los modos IA en un solo lugar.", "Tous les modes IA en un seul endroit.", "همه حالت‌های هوش مصنوعی در یک‌جا.")}>
                      <SubTabs testid="subtabs-pianoai" accent="#9aa6b2" tabs={[
                        { id: "auto", label: tri("Piano del Giorno", "Tagesplan", "Day Plan", "Plan del Día", "Plan du Jour", "برنامه روز"), content: <AutoPlan /> },
                        { id: "ai", label: tri("Piano AI", "KI-Plan", "AI Plan", "Plan IA", "Plan IA", "برنامه AI"), content: <PianoProduzioneAI /> },
                        { id: "backward", label: tri("A Ritroso", "Rückwärts", "Backward", "Inverso", "À Rebours", "معکوس"), content: <BackwardScheduler /> },
                        { id: "ordine", label: tri("Ordine & Piano", "Auftrag & Plan", "Order & Plan", "Pedido & Plan", "Commande & Plan", "سفارش و برنامه"), content: <OrdineCapo /> },
                        { id: "smart", label: tri("Smart Planner", "Smart Planner", "Smart Planner", "Smart Planner", "Smart Planner", "برنامه‌ریز"), content: <SmartPlannerStressZero /> },
                        { id: "timeline", label: tri("Timeline", "Timeline", "Timeline", "Timeline", "Timeline", "خط زمانی"), content: <TimelineTurno /> },
                      ]} />
                    </HoloPanel>
                    </CapoGroup>

                    <CapoGroup id="ordini" icon="⚡" accent="#a4afbb" open={consoleSec === "ordini"} onToggle={() => toggleSec("ordini")}
                      title={tri("Ordini Extra", "Extra-Aufträge", "Extra Orders", "Pedidos Extra", "Commandes Extra", "سفارش‌های اضافه")}
                      sub={tri("Ordini last-minute e B2B: Sitor rigenera il piano all'istante.", "Last-Minute- & B2B-Aufträge.", "Last-minute and B2B orders: Sitor regenerates instantly.", "Pedidos de última hora y B2B.", "Commandes de dernière minute et B2B.", "سفارش‌های لحظه‌آخری و B2B.")}>
                    <HoloPanel testid="panel-ordini" accent="#64748B" beacon="#a4afbb" icon="⚡" defaultOpen title={tri("Ordini Extra", "Extra-Aufträge", "Extra Orders", "Pedidos Extra", "Commandes Extra", "سفارش‌های اضافه")} sub={tri("L'AI rigenera il piano all'istante.", "KI erstellt den Plan sofort neu.", "AI regenerates the plan instantly.", "La IA regenera el plan.", "L'IA régénère le plan.", "هوش مصنوعی برنامه را بازسازی می‌کند.")}>
                      <OrdiniExtra />
                    </HoloPanel>
                    {activity === "pasticceria" && (
                    <HoloPanel testid="panel-pastry" accent="#93a2ae" beacon="#93a2ae" icon="🧁" title={tri("Consegne & Eventi · Pasticceria", "Lieferungen & Events · Konditorei", "Deliveries & Events · Pastry", "Entregas & Eventos · Pastelería", "Livraisons & Événements · Pâtisserie", "تحویل و رویداد · شیرینی")} sub={tri("Torte su commessa, matrimoni ed eventi con date e promemoria di Sitor.", "Auftragstorten, Hochzeiten, Events mit Terminen.", "Made-to-order cakes, weddings and events with dates and Sitor reminders.", "Tartas por encargo, bodas y eventos.", "Gâteaux sur commande, mariages et événements.", "کیک سفارشی، عروسی و رویداد.")}>
                      <PasticceriaConsegne />
                    </HoloPanel>
                    )}
                    <HoloPanel testid="panel-b2b" accent="#64748B" beacon="#8a97a6" icon="🛒" title={tri("Ordini B2B & E-commerce", "B2B-Aufträge & E-Commerce", "B2B Orders & E-commerce", "Pedidos B2B & E-commerce", "Commandes B2B & E-commerce", "سفارش‌های B2B")} sub={tri("Ordini digitali → kg d'impasto per lo Smart Planner, con previsione meteo/festività. Non tocca le casse.", "Digitale Aufträge → kg Teig für den Smart Planner.", "Digital orders → kg dough for the Smart Planner, with weather/holiday forecast. Tills untouched.", "Pedidos digitales → kg de masa.", "Commandes numériques → kg de pâte.", "سفارش دیجیتال → کیلو خمیر.")}>
                      <B2BOrders />
                    </HoloPanel>
                    </CapoGroup>

                    <CapoGroup id="squadra" icon="👥" accent="#9aa6b2" open={consoleSec === "squadra"} onToggle={() => toggleSec("squadra")}
                      title={tri("Ruoli & Turni", "Rollen & Schichten", "Roles & Shifts", "Roles & Turnos", "Rôles & Services", "نقش‌ها و شیفت‌ها")}
                      sub={tri("Chi lavora, dove e quando.", "Wer arbeitet, wo und wann.", "Who works, where and when.", "Quién trabaja, dónde y cuándo.", "Qui travaille, où et quand.", "چه کسی، کجا و کی کار می‌کند.")}>
                    <HoloPanel testid="panel-dept-assign" accent="#8a97a6" beacon="#a4afbb" icon="🏭" defaultOpen title={tri("Assegnazione Reparti · Squadra", "Bereichszuweisung · Team", "Department Assignment · Team", "Asignación de Áreas · Equipo", "Affectation Ateliers · Équipe", "تخصیص بخش · تیم")} sub={tri("Panificio, Pasticceria, Pizzeria, Laugen, Banco — ognuno con macchine, silos e celle dedicate. Assegna PIÙ operai con mansioni distinte nello stesso reparto.", "Backstube, Konditorei, Pizzeria, Laugen, Theke — je eigene Ausstattung. Weise MEHRERE Mitarbeiter mit eigenen Aufgaben zu.", "Bakery, Pastry, Pizza, Laugen, Counter — each with its own machines, silos and cells. Assign MULTIPLE operators with distinct tasks.", "Panadería, Pastelería, Pizza, Laugen, Mostrador — cada una equipada. Asigna VARIOS operarios con tareas distintas.", "Boulangerie, Pâtisserie, Pizza, Laugen, Comptoir — chacun équipé. Assigne PLUSIEURS opérateurs avec des tâches distinctes.", "نانوایی، شیرینی، پیتزا، لاوگن، پیشخوان — هرکدام مجهز. چند اپراتور با وظایف متمایز واگذار کن.")}>
                      <DeptAssign />
                    </HoloPanel>
                    <HoloPanel testid="panel-shift-team" accent="#9aa6b2" beacon="#6e9e85" icon="📣" title={tri("Riepilogo Squadra · Voce Sitor", "Team-Übersicht · Sitor-Stimme", "Team Roll-Call · Sitor Voice", "Resumen de Equipo · Voz Sitor", "Appel d'Équipe · Voix Sitor", "فراخوان تیم · صدای Sitor")} sub={tri("All'apertura del turno, Sitor annuncia a voce la composizione della squadra reparto per reparto.", "Zum Schichtbeginn sagt Sitor das Team pro Bereich an.", "At shift start, Sitor voices the team composition department by department.", "Al iniciar el turno, Sitor anuncia el equipo por área.", "Au début du service, Sitor annonce l'équipe par atelier.", "در شروع شیفت، Sitor ترکیب تیم را بخش‌به‌بخش اعلام می‌کند.")}>
                      <ShiftTeamCall />
                    </HoloPanel>
                    <HoloPanel testid="panel-shift-templates" accent="#9aa6b2" beacon="#6e9e85" icon="🗓️" title={tri("Turni Ricorrenti · Squadre-tipo", "Wiederkehrende Schichten", "Recurring Shifts · Templates", "Turnos Recurrentes", "Services Récurrents", "شیفت‌های تکرارشونده")} sub={tri("Salva le squadre-tipo (es. 'Turno mattina') e applicale con un tocco nei giorni giusti.", "Speichere Team-Vorlagen und wende sie mit einem Tipp an.", "Save team templates and apply them with one tap.", "Guarda plantillas de equipo y aplícalas con un toque.", "Enregistre des modèles d'équipe et applique-les d'un toucher.", "الگوهای تیم را ذخیره و با یک لمس اعمال کن.")}>
                      <ShiftTemplates />
                    </HoloPanel>
                    <HoloPanel testid="panel-team-faces" accent="#9aabb8" beacon="#9aabb8" icon="🙂" title={tri("Volti della Squadra", "Team-Gesichter", "Team Faces", "Rostros del Equipo", "Visages de l'Équipe", "چهره‌های تیم")} sub={tri("Registra i volti una volta: entrano col volto su ogni tablet di reparto.", "Einmal registrieren: Gesichts-Login auf allen Tablets.", "Enroll once: face login on every department tablet.", "Registra una vez: acceso por rostro en cada tablet.", "Enregistre une fois : connexion par visage sur chaque tablette.", "یک‌بار ثبت کن: ورود با چهره روی همه تبلت‌ها.")}>
                      <TeamFaces />
                    </HoloPanel>
                    </CapoGroup>

                    <CapoGroup id="strumenti" icon="🧰" accent="#64748B" open={consoleSec === "strumenti"} onToggle={() => toggleSec("strumenti")}
                      title={tri("Strumenti & Integrazioni", "Werkzeuge & Integrationen", "Tools & Integrations", "Herramientas & Integraciones", "Outils & Intégrations", "ابزارها و یکپارچه‌سازی‌ها")}
                      sub={tri("Ricette, forgia immagini, magazzino, forni, qualità, energia, report e sicurezza.", "Rezepte, Bilder, Lager, Öfen, Qualität, Berichte.", "Recipes, image forge, warehouse, ovens, quality, reports.", "Recetas, imágenes, almacén, hornos, informes.", "Recettes, images, entrepôt, fours, rapports.", "دستورها، تصاویر، انبار، فرها، گزارش‌ها.")}>
                    <HoloPanel testid="panel-sitor-atelier" accent="#a6b1bc" beacon="#8a97a6" icon="✨" title={tri("Sitor su misura · La tua schermata", "Sitor nach Maß · Dein Bildschirm", "Sitor tailor-made · Your screen", "Sitor a medida · Tu pantalla", "Sitor sur mesure · Ton écran", "سیتور سفارشی · صفحه تو")} sub={tri("Chiedi a Sitor lo strumento che vuoi, oppure fatti guidare passo-passo per attivare silos, bilance, sensori ed email.", "Bitte Sitor um ein Werkzeug oder lass dich Schritt für Schritt führen.", "Ask Sitor for any tool, or be guided step-by-step to enable silos, scales, sensors and email.", "Pide una herramienta o déjate guiar paso a paso.", "Demande un outil ou laisse-toi guider pas à pas.", "هر ابزاری بخواه یا گام‌به‌گام راهنمایی شو.")} defaultOpen>
                      <SubTabs testid="subtabs-sitor-tools" accent="#a6b1bc" tabs={[
                        { id: "atelier", label: tri("Su misura", "Nach Maß", "Tailor-made", "A medida", "Sur mesure", "سفارشی"), content: <SitorAtelier /> },
                        { id: "guided", label: tri("Sitor ti guida", "Sitor führt", "Sitor guides", "Sitor te guía", "Sitor te guide", "راهنمایی"), content: <SitorGuidedTools /> },
                      ]} />
                    </HoloPanel>
                    <div data-testid="panel-image-forge" className="holo-panel p-4"><ImageForge /></div>
                    <HoloPanel testid="panel-thermalflow" accent="#8a97a6" beacon="#9aa6b2" icon="🌡️" title={tri("Ricette · Thermal Master Flow", "Rezepte · Thermal Master Flow", "Recipes · Thermal Master Flow", "Recetas · Thermal Master Flow", "Recettes · Thermal Master Flow", "دستور · جریان حرارتی")} sub={tri("Editor live: RPM, idratazione e rampe termiche si ricalcolano all'istante. Interlock se la farina supera 22°C.", "Live-Editor: RPM, Hydratation und Rampen sofort neu berechnet.", "Live editor: RPM, hydration and thermal ramps recompute instantly. Interlock if flour > 22°C.", "Editor en vivo: RPM, hidratación y rampas al instante.", "Éditeur live : RPM, hydratation et rampes recalculés.", "ویرایشگر زنده: RPM و رمپ حرارتی.")}>
                      <RecipeThermalFlow />
                    </HoloPanel>
                    <HoloPanel testid="panel-ricette" accent="#64748B" icon="🥖" title={tri("Master Ricettario", "Master-Rezepte", "Master Recipes", "Recetario Maestro", "Recettes Master", "دستور اصلی")} sub={tri("Ricette protette e conferma impastata.", "Geschützte Rezepte.", "Protected recipes.", "Recetas protegidas.", "Recettes protégées.", "دستورهای محافظت‌شده.")}>
                      <Ricette isMasterView={true} />
                    </HoloPanel>
                    <HoloPanel testid="panel-magazzino" accent="#64748B" icon="📦" title={tri("Magazzino & Scorte", "Lager & Bestand", "Warehouse & Stock", "Almacén & Stock", "Entrepôt & Stock", "انبار و موجودی")} sub={tri("Giacenze, soglie e autonomia.", "Bestände & Schwellen.", "Stock & thresholds.", "Existencias.", "Stocks & seuils.", "موجودی.")}>
                      <MagazzinoManager />
                    </HoloPanel>
                    <HoloPanel testid="panel-silos" accent="#64748B" beacon="#a4afbb" icon="🌾" title={tri("Silos & Materie Prime", "Silos & Rohstoffe", "Silos & Raw Materials", "Silos & Materias", "Silos & Matières", "سیلوها و مواد")} sub={tri("Calo peso, micro-ordini automatici e compensazione umidità della farina.", "Gewichtsverlust, Auto-Nachbestellung, Mehlfeuchte-Ausgleich.", "Weight drop, auto micro-orders and flour humidity compensation.", "Caída de peso, micro-pedidos y humedad.", "Perte de poids, micro-commandes, humidité.", "افت وزن، سفارش خودکار، رطوبت آرد.")}>
                      <SiloManager />
                    </HoloPanel>
                    <HoloPanel testid="panel-elite" accent="#64748B" beacon="#9aa6b2" icon="📊" title={tri("Food Cost & Ambiente", "Food Cost & Umgebung", "Food Cost & Environment", "Food Cost & Ambiente", "Coût & Environnement", "بها و محیط")} sub={tri("Costo al grammo, margini e lievitazione predittiva.", "Kosten/Gramm, Margen & prädiktive Gare.", "Cost per gram, margins & predictive proof.", "Coste por gramo y fermentación.", "Coût au gramme & pousse prédictive.", "بها بر گرم و تخمیر پیش‌بین.")}>
                      <EliteTools />
                    </HoloPanel>
                    <HoloPanel testid="panel-twin" accent="#64748B" beacon="#9aa6b2" icon="🌐" title={tri("Gemello Digitale 3D", "Digitaler Zwilling 3D", "3D Digital Twin", "Gemelo Digital 3D", "Jumeau Numérique 3D", "دوقلوی دیجیتال")} sub={tri("Metaverso di laboratorio: supervisione spaziale dei macchinari.", "Labor-Metaverse: räumliche Überwachung.", "Lab metaverse: spatial supervision of machines.", "Metaverso: supervisión espacial.", "Métavers: supervision spatiale.", "متاورس آزمایشگاه.")}>
                      <DigitalTwin />
                    </HoloPanel>
                    <HoloPanel testid="panel-ovenqc" accent="#64748B" beacon="#6e9e85" icon="👁️" title={tri("Controllo Qualità Ottico (AI Vision)", "Optische Qualitätskontrolle (AI Vision)", "Optical Quality Control (AI Vision)", "Control de Calidad Óptico (AI)", "Contrôle Qualité Optique (AI)", "کنترل کیفیت بصری")} sub={tri("Scansiona il prodotto all'uscita del forno: forma, cottura, crosta, bruciature.", "Produkt am Ofenausgang scannen: Form, Backung, Kruste.", "Scan product at oven exit: shape, bake, crust, burning.", "Escanea a la salida del horno.", "Scanne à la sortie du four.", "اسکن محصول در خروجی فر.")}>
                      <OvenQC />
                    </HoloPanel>
                    <HoloPanel testid="panel-carbon" accent="#64748B" beacon="#6e9e85" icon="🌿" title={tri("Carbon Footprint & Energia", "CO₂-Bilanz & Energie", "Carbon Footprint & Energy", "Huella de Carbono & Energía", "Empreinte Carbone & Énergie", "ردپای کربن و انرژی")} sub={tri("CO₂ per quintale + costo energetico per kg cotto e slot di accensione ottimali.", "CO₂ pro Zentner + Energiekosten/kg.", "CO₂ per 100 kg + energy cost per kg baked and optimal firing slots.", "CO₂ por quintal + coste energético.", "CO₂ par quintal + coût énergie.", "CO₂ در هر صد کیلو + هزینه انرژی.")}>
                      <CarbonFootprint />
                    </HoloPanel>
                    <HoloPanel testid="panel-proofing" accent="#64748B" beacon="#9aa6b2" icon="💨" title={tri("Celle Adattive · Lievitazione", "Adaptive Gärkammern", "Adaptive Proofing Cells", "Cámaras Adaptativas", "Chambres Adaptatives", "اتاق تخمیر تطبیقی")} sub={tri("Curve multi-stadio che accelerano o frenano in base ai forni liberi.", "Mehrstufige Kurven je nach freien Öfen.", "Multi-stage curves that accelerate or brake by free ovens.", "Curvas multietapa según hornos libres.", "Courbes multi-étapes selon fours libres.", "منحنی چندمرحله‌ای بر اساس فرها.")}>
                      <AdaptiveProofing />
                    </HoloPanel>
                    <HoloPanel testid="panel-agv" accent="#64748B" beacon="#6e9e85" icon="🚚" title={tri("Flotta AGV · Logistica", "AGV-Flotte · Logistik", "AGV Fleet · Logistics", "Flota AGV · Logística", "Flotte AGV · Logistique", "ناوگان AGV")} sub={tri("Routing autonomo dei carrelli + rilevamento acustico preventivo dei guasti.", "Autonomes Routing + akustische Früherkennung.", "Autonomous cart routing + preventive acoustic fault detection.", "Routing autónomo + detección acústica.", "Routage autonome + détection acoustique.", "مسیریابی خودکار + تشخیص صوتی.")}>
                      <AgvFleet />
                    </HoloPanel>
                    <HoloPanel testid="panel-packaging" accent="#64748B" beacon="#a4afbb" icon="🔪" title={tri("Packaging · Affettatrici", "Packaging · Schneider", "Packaging · Slicers", "Empaquetado · Cortadoras", "Emballage · Trancheuses", "بسته‌بندی · برش")} sub={tri("Velocità affettatrici sincronizzata alla curva di raffreddamento del pane (mollica intatta).", "Schneidegeschwindigkeit an Abkühlkurve gekoppelt.", "Slicer speed matched to bread cooling curve (crumb intact).", "Velocidad según curva de enfriamiento.", "Vitesse selon courbe de refroidissement.", "سرعت برش هماهنگ با خنک‌شدن نان.")}>
                      <PackagingSync />
                    </HoloPanel>
                    <HoloPanel testid="panel-radar" accent="#64748B" icon="🛰️" title={tri("Radar Impianto", "Werk-Radar", "Plant Radar", "Radar de planta", "Radar usine", "رادار کارخانه")} sub={tri("Planimetria live, tracking e delega.", "Live-Grundriss & Tracking.", "Live floor plan & tracking.", "Plano en vivo.", "Plan live.", "پلان زنده.")}>
                      <PlantRadar />
                    </HoloPanel>
                    <HoloPanel testid="panel-hardware" accent="#64748B" beacon="#9aa6b2" icon="🏭" title={tri("Bilance & PLC Forni", "Waagen & Ofen-SPS", "Scales & Oven PLC", "Balanzas & PLC Horno", "Balances & API Four", "ترازو و پی‌ال‌سی")} sub={tri("Peso live col semaforo e cicli termici (Web Serial/Bluetooth · simulazione).", "Live-Gewicht & Thermozyklen.", "Live weight + thermal cycles (Web Serial/Bluetooth · simulation).", "Peso en vivo y ciclos térmicos.", "Poids live & cycles thermiques.", "وزن زنده و چرخه حرارتی.")}>
                      <HardwareBridge />
                    </HoloPanel>
                    <HoloPanel testid="panel-machine-arrival" accent="#a4afbb" beacon="#8a97a6" icon="⚙️" title={tri("Nuovi Macchinari · Sitor riconosce", "Neue Maschinen · Sitor erkennt", "New Machines · Sitor recognizes", "Nuevas Máquinas · Sitor reconoce", "Nouvelles Machines · Sitor reconnaît", "ماشین‌های جدید · Sitor می‌شناسد")} sub={tri("Arriva un macchinario? Sitor lo riconosce come nuovo arrivato e lo integra in produzione — anche tipi mai visti.", "Neue Maschine? Sitor erkennt sie als Neuzugang und integriert sie.", "A machine arrives? Sitor flags it as a new arrival and integrates it — even unseen types.", "¿Llega una máquina? Sitor la reconoce e integra.", "Une machine arrive ? Sitor la reconnaît et l'intègre.", "دستگاه جدید؟ Sitor آن را می‌شناسد و ادغام می‌کند.")}>
                      <MachineArrival />
                    </HoloPanel>
                    <HoloPanel testid="panel-docs" accent="#64748B" beacon="#6e9e85" icon="🧾" title={tri("Report & Rapporti", "Berichte & Reports", "Reports & Records", "Informes y Reportes", "Rapports & Comptes rendus", "گزارش‌ها و اسناد")} sub={tri("Tutto in uno: rapporti fine turno degli operai, MikiScore di turno e documenti PDF multilingua.", "Alles in einem: Schichtberichte, MikiScore und PDF-Dokumente.", "All in one: operator end-of-shift reports, shift MikiScore and multi-language PDF documents.", "Todo en uno: informes de turno, MikiScore y PDF.", "Tout en un : rapports de service, MikiScore et PDF.", "همه در یک‌جا: گزارش‌های شیفت، میکی‌اسکور و اسناد PDF.")}>
                      <SubTabs testid="subtabs-reports" accent="#6e9e85" tabs={[
                        { id: "floor", label: tri("Fine Turno · Produzione", "Schichtende", "End-of-Shift", "Fin de Turno", "Fin de Service", "پایان شیفت"), content: <FloorShiftReports /> },
                        { id: "mikiscore", label: tri("Report Turno · MikiScore", "MikiScore", "Shift · MikiScore", "Turno · MikiScore", "Service · MikiScore", "میکی‌اسکور"), content: <ShiftReport /> },
                        { id: "docs", label: tri("Documenti PDF", "PDF-Dokumente", "PDF Documents", "Documentos PDF", "Documents PDF", "اسناد PDF"), content: <DocsDownload /> },
                      ]} />
                    </HoloPanel>
                    <HoloPanel testid="panel-security" accent="#64748B" beacon="#a4afbb" icon="🛡️" title={tri("Sicurezza & Accessi", "Sicherheit & Zugriffe", "Security & Access", "Seguridad y Accesos", "Sécurité & Accès", "امنیت و دسترسی")} sub={tri("PIN produzione, PIN personali operatore e registro accessi in un unico posto.", "Produktions-PIN, Bediener-PINs & Zugriffsprotokoll.", "Production PIN, operator PINs and access log in one place.", "PIN de producción, PIN de operario y registro.", "PIN production, PIN opérateur et journal.", "پین تولید، پین اپراتور و گزارش دسترسی.")}>
                      <SubTabs testid="subtabs-security" accent="#64748B" tabs={[
                        { id: "access", label: tri("Sicurezza & Accessi", "Sicherheit", "Security & Access", "Seguridad", "Sécurité", "امنیت"), content: <AdminSecurity /> },
                        { id: "pin", label: tri("PIN Produzione", "Produktions-PIN", "Production PIN", "PIN Producción", "PIN Production", "پین تولید"), content: <PinSetup /> },
                      ]} />
                    </HoloPanel>
                    <HoloPanel testid="panel-emergency" accent="#b06e78" beacon="#b06e78" icon="🚨" title={tri("Centro Emergenze · Neural Load Radar", "Notfallzentrale · Neural Load Radar", "Emergency Center · Neural Load Radar", "Centro de Emergencias · Neural Load Radar", "Centre d'Urgence · Neural Load Radar", "مرکز اضطراری")} sub={tri("SOS dal reparto con annuncio vocale Sitor e guide di manutenzione istantanee.", "SOS aus der Produktion mit Sitor-Sprachansage und Sofort-Anleitungen.", "Floor SOS with Sitor voice alert and instant maintenance guides.", "SOS del taller con aviso de voz y guías instantáneas.", "SOS de la production avec annonce vocale et guides instantanés.", "SOS تولید با اعلان صوتی و راهنمای فوری.")}>
                      <EmergencyCenter />
                    </HoloPanel>
                    <div data-testid="panel-advanced-lab" className="holo-panel p-5 sm:p-6"><AdvancedLab /></div>
                    <div data-testid="panel-training" className="holo-panel p-5 sm:p-6"><DowntimeTraining /></div>
                    <div data-testid="panel-mohamed-inbox" className="holo-panel p-4"><MohamedInbox /></div>
                    <div data-testid="panel-living-recipe" className="holo-panel p-4"><LivingRecipe /></div>
                    </CapoGroup>

                    <CapoGroup id="sitor" icon="✦" accent="#a6b1bc" open={consoleSec === "sitor"} onToggle={() => toggleSec("sitor")}
                      title={tri("Sala Sitor · Punto d'Incontro", "Sitor-Saal · Treffpunkt", "Sitor Hall · Meeting Point", "Sala Sitor · Punto de Encuentro", "Salle Sitor · Point de Rencontre", "تالار سیتور · محل ملاقات")}
                      sub={tri("L'unico luogo dove incontri Sitor: scrivi, detta, allega, ordina — e ricevi risposte, produzione e avvisi.", "Der einzige Ort für Sitor: schreiben, diktieren, anhängen, befehlen — Antworten, Produktion und Alarme inklusive.", "The one place to meet Sitor: write, dictate, attach, command — and receive answers, production and alerts.", "El único lugar para hablar con Sitor: escribe, dicta, ordena y recibe todo.", "Le seul lieu pour rencontrer Sitor : écris, dicte, ordonne — et reçois tout.", "تنها جای ملاقات با سیتور: بنویس، بگو، دستور بده و همه‌چیز را دریافت کن.")}>
                    <SalaSitor />
                    <NexusConsole isCapo={true} />
                    </CapoGroup>
                    {/* Le sezioni LEGGI/normative UE/DE sono nel footer (Impressum & Datenschutz). */}
                    </PlantHeartbeatProvider>
                  </div>
                )}
              </section>
              </>)}

              {/* ================= ZONA 2 · OPERATORI ================= */}
              <section ref={zoneRefs.operatori} data-zone="operatori" className="holo-zone pt-2">
                <ZoneHero3D testid="hero-operatori" theme={activity} onEnter={() => jumpTo("operatori")} avatar="avatar_nexus.jpg" accent="#8a97a6" tag="Z-02 · Produzione" name="Sitor" role={tri("Reparto Produzione · Fornaio", "Produktionsbereich · Bäcker", "Production Floor · Baker", "Área de Producción · Panadero", "Atelier Production · Boulanger", "بخش تولید · نانوا")} listenSpeaking />
                <OperatorsRoster onPick={(label) => { try { localStorage.setItem("mikilab_role", label); } catch { /* */ } try { window.dispatchEvent(new CustomEvent("mikilab-role-changed", { detail: { role: label } })); } catch { /* */ } if (!floorUnlocked) setShowPinLock(true); }} />
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

        <Toaster position="top-center" richColors />
        <MikeMixSense section={user ? "control" : "guida"} mode={activeZone === "operatori" ? "floor" : "lab"} isCapo={!!user} operator={operator} floorRole={floorRole} />
        <RadioFornaio />
        <ShiftScheduler />
        <AutoReport />
        <AudioRouteIndicator />
      </div>
    </MachinesProvider></MixerTimersProvider></SoundFXProvider></TimerProvider></AmbientProvider></ProfileProvider>
  );
}
