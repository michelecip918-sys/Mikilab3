/*
 * ============================================================================
 *  MIKILAB PRO & Mike Mix AI — PROPRIETARY & CONFIDENTIAL
 *  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
 *  Unico proprietario legale: il Master. Sole legal owner: the Master.
 *  Codice riservato: vietata copia, distribuzione, reverse engineering o
 *  cloning non autorizzati, tracciati dal Mike Mix AI Security Guardian.
 * ============================================================================
 *  PLANCIA OLOGRAFICA — Zero-Menu vertical command console (v40).
 *  Unica PWA continua a scorrimento verticale: Master · Operatori · Mike Mix AI.
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
import VoiceCommand from "@/components/VoiceCommand";
import RadioFornaio from "@/components/RadioFornaio";
import ShiftScheduler from "@/components/ShiftScheduler";
import TalkWithMiki from "@/components/TalkWithMiki";
import AudioRouteIndicator from "@/components/AudioRouteIndicator";
import LegalPage from "@/sections/LegalPage";
import MagazzinoManager from "@/components/MagazzinoManager";
import DocsDownload from "@/components/DocsDownload";
import LabBriefing from "@/components/LabBriefing";
import AutoReport from "@/components/AutoReport";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthScreen from "@/components/AuthScreen";
import ResetPassword from "@/components/ResetPassword";
import OperatoreSelect from "@/components/OperatoreSelect";
import PinSetup from "@/components/PinSetup";
import OrdineCapo from "@/components/OrdineCapo";
import MikeMixFloor from "@/components/MikeMixFloor";
import MikeMixSense from "@/components/MikeMixSense";
import MikeMixGuide from "@/components/MikeMixGuide";
import DowntimeTraining from "@/components/DowntimeTraining";
import NexusConsole from "@/components/NexusConsole";
import MikeObserve from "@/components/MikeObserve";
import MikeAlerts from "@/components/MikeAlerts";
import PublicGate from "@/components/PublicGate";
import LangSelector from "@/components/LangSelector";
import { resetSessionBoards } from "@/lib/sessionState";
import { recipesApi, warehouseApi, planApi, weeklyApi, floorPlanApi } from "@/lib/api";
import InstallApp from "@/components/InstallApp";
import KioskMode from "@/components/KioskMode";
import SplashScreen from "@/components/SplashScreen";
import { mkTri } from "@/i18n/triMaps";
import { ShieldCheck, LogOut, User, WifiOff, Lock } from "lucide-react";

import Ricette from "@/sections/Ricette";
import OrdiniExtra from "@/components/OrdiniExtra";
import PlantRadar from "@/components/PlantRadar";
import SecurityGuardian from "@/components/SecurityGuardian";
import AmbientMike from "@/components/AmbientMike";
import CompliancePanel from "@/components/CompliancePanel";
import SmartPlannerStressZero from "@/sections/SmartPlannerStressZero";
import WeeklyPlan from "@/sections/WeeklyPlan";
import PianoProduzioneAI from "@/sections/PianoProduzioneAI";
import BackwardScheduler from "@/sections/BackwardScheduler";
import { ZoneDivider, HoloPanel, ZoneRail, ZoneHero } from "@/components/console/HoloKit";
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
import RoleLayout from "@/components/console/RoleLayout";
import TimelineTurno from "@/components/console/TimelineTurno";
import PackagingSync from "@/components/console/PackagingSync";
import MikeSuggestions from "@/components/console/MikeSuggestions";
import OvenBrain from "@/components/console/OvenBrain";
import CapoDeck from "@/components/console/CapoDeck";
import DeptAssign from "@/components/console/DeptAssign";
import ShiftTeamCall from "@/components/console/ShiftTeamCall";
import ShiftTemplates from "@/components/console/ShiftTemplates";
import ConsoleIndex from "@/components/console/ConsoleIndex";
import ConsoleSectionMenu from "@/components/console/ConsoleSectionMenu";
import MachineArrival from "@/components/console/MachineArrival";
import ShiftReport from "@/components/console/ShiftReport";
import { PlantHeartbeatProvider } from "@/context/PlantHeartbeatContext";

const PUB = process.env.PUBLIC_URL;

const ZONES = [
  { id: "master", label: "Master", accent: "#5E8CA8", avatar: "avatar_miki.jpg" },
  { id: "operatori", label: "Operatori", accent: "#00F0FF", avatar: "avatar_mikemix.jpg" },
  { id: "mikemix", label: "Mike Mix AI", accent: "#7DD3FC", avatar: "avatar_bigmix.jpg" },
];

export default function App() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const { user, authOpen, setAuthOpen, logout } = useAuth();

  const [adminOk, setAdminOk] = useState(() => { try { return localStorage.getItem("mikilab_admin_unlocked") === "1"; } catch { return false; } });
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
  const [showBriefing, setShowBriefing] = useState(false);

  // Cyber-Trio: briefing automatico SOLO al primo accesso del Capo (poi si apre solo dal pulsante).
  useEffect(() => {
    if (user && user.role === "admin") {
      try { if (localStorage.getItem("mikilab_briefing_seen") !== "1") { localStorage.setItem("mikilab_briefing_seen", "1"); setShowBriefing(true); } } catch (e) { /* */ }
    }
  }, [user]);

  // Plancia a sezioni: mappa pannello → sezione; mostro solo i pannelli della sezione attiva.
  const [consoleSec, setConsoleSec] = useState("");
  const CONSOLE_SECMAP = {
    "panel-emergency": "regia", "panel-shiftreport": "regia",
    "panel-autoplan": "piani", "panel-weekly": "piani", "panel-pianoai": "piani", "panel-backward": "piani", "panel-ordine": "piani", "panel-ordini": "piani", "panel-planner": "piani", "panel-b2b": "piani", "panel-timeline": "piani",
    "panel-thermalflow": "ricette", "panel-ricette": "ricette",
    "panel-dept-assign": "squadra", "panel-shift-team": "squadra", "panel-shift-templates": "squadra",
    "panel-twin": "impianto", "panel-ovenqc": "impianto", "panel-carbon": "impianto", "panel-proofing": "impianto", "panel-agv": "impianto", "panel-packaging": "impianto", "panel-radar": "impianto", "panel-elite": "impianto", "panel-hardware": "impianto", "panel-machine-arrival": "impianto",
    "panel-silos": "magazzino", "panel-magazzino": "magazzino",
    "panel-pin": "sicurezza", "panel-docs": "sicurezza", "panel-security": "sicurezza",
  };
  useEffect(() => {
    const onJump = (e) => { const s = CONSOLE_SECMAP[e.detail]; if (s) setConsoleSec(s); };
    window.addEventListener("mikilab:open-panel", onJump);
    return () => window.removeEventListener("mikilab:open-panel", onJump);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const apply = () => {
      Object.keys(CONSOLE_SECMAP).forEach((pid) => { const el = document.querySelector(`[data-testid="${pid}"]`); if (el) el.style.display = (consoleSec && CONSOLE_SECMAP[pid] === consoleSec) ? "" : "none"; });
      const rt = document.querySelector('[data-testid="console-regia-tools"]'); if (rt) rt.style.display = consoleSec === "regia" ? "" : "none";
    };
    apply(); const t = setTimeout(apply, 120);
    return () => clearTimeout(t);
  }, [consoleSec, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const zoneRefs = { master: useRef(null), operatori: useRef(null), mikemix: useRef(null) };

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

  if (!adminOk && !resetToken) return <><SplashScreen /><PublicGate onUnlock={() => { try { localStorage.setItem("mikilab_admin_unlocked", "1"); } catch { /* */ } setAdminOk(true); }} /></>;
  if (resetToken) return <ResetPassword token={resetToken} onDone={() => { setResetToken(null); setAuthOpen(true); }} />;
  if (authOpen && !user) return <div className="fixed inset-0 z-[70] bg-[#070A10] overflow-auto"><AuthScreen onClose={() => setAuthOpen(false)} initialMode={authMode} /></div>;

  return (
    <ProfileProvider><AmbientProvider><TimerProvider><SoundFXProvider><MixerTimersProvider><MachinesProvider>
      <SecurityGuardian />
      <AmbientMike />
      <SplashScreen />
      <div className="holo-root min-h-screen font-sans selection:bg-[#00F0FF] selection:text-[#070A10]">
        <div className="holo-canvas" aria-hidden />

        <div className="relative z-10 flex flex-col min-h-screen">
          {!online && (
            <div data-testid="offline-badge" className="fixed top-[76px] left-1/2 -translate-x-1/2 z-[60] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/50 text-amber-300 text-[11px] font-bold backdrop-blur-md">
              <WifiOff className="w-3.5 h-3.5" /> {tri("Offline · archivio locale", "Offline · lokales Archiv", "Offline · local archive", "Sin conexión · archivo local", "Hors ligne · archive locale", "آفلاین · بایگانی محلی")}
            </div>
          )}

          {/* STATUS BAR ambientale (nessun menu classico) */}
          <header data-testid="app-header" className="sticky top-0 z-50 border-b border-[#00F0FF]/15 bg-[#070A10]/85 backdrop-blur-xl px-3 sm:px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
              <button data-testid="brand-home" onClick={() => jumpTo("master")} className="flex items-center gap-2.5 min-w-0 active:scale-95 transition-transform">
                <span className="w-10 h-10 rounded-xl overflow-hidden border border-[#00F0FF]/40 shadow-[0_0_16px_rgba(0,240,255,0.25)] bg-[#070A10] shrink-0">
                  <img src={`${PUB}/logo-emblem.png`} alt="MikiLab Pro" className="w-full h-full object-contain" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block font-cyber text-lg sm:text-2xl font-black tracking-[0.18em] text-white uppercase">MikiLab<span className="text-[#00F0FF]"> Pro</span></span>
                  <span className="hidden sm:block font-mono-data text-[9px] tracking-[0.3em] text-[#00F0FF]/70 uppercase">Holographic Command OS</span>
                </span>
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2 relative">
                {user && user.role === "admin" && (
                  <button data-testid="briefing-open" onClick={() => setShowBriefing(true)} title="Cyber-Trio"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#7DD3FC]/10 border border-[#7DD3FC]/40 text-[#7DD3FC] font-bold text-xs active:scale-95 transition-all">
                    ◐ <span className="hidden sm:inline">{tri("Turno", "Schicht", "Shift", "Turno", "Turn", "شیفت")}</span>
                  </button>
                )}
                <LangSelector testid="header-lang" />
                <InstallApp variant="chip" />
                <KioskMode />
                <button data-testid="operatore-chip" onClick={() => setShowOperator(true)} title="Operatore"
                  className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-[#0C1019] border border-[#00F0FF]/20 text-white hover:border-[#00F0FF]/60 active:scale-95 transition-all">
                  {operator ? <img src={`${PUB}/${operator.img}`} alt={operator.name} className="w-6 h-6 rounded-full object-cover object-top border border-[#00F0FF]/50" /> : <User className="w-4 h-4 text-[#00F0FF]" />}
                  <span className="font-bold text-xs hidden md:inline">{operator ? operator.name : tri("Operatore", "Bediener", "Operator", "Operario", "Opérateur", "اپراتور")}</span>
                </button>
                <button data-testid="account-btn" onClick={() => { if (user) setShowAccountMenu((v) => !v); else openAuth(); }}
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold text-xs active:scale-95 transition-all border ${user ? "bg-[#00F0FF]/15 border-[#00F0FF]/50 text-[#00F0FF]" : "bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20"}`}>
                  {user ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{user ? (user.name || (user.email ? user.email.split("@")[0].slice(0, 10) : "Capo")) : tri("Accedi", "Anmelden", "Sign in", "Acceder", "Connexion", "ورود")}</span>
                </button>
                {user && showAccountMenu && (
                  <div data-testid="account-menu" className="absolute right-0 top-11 w-56 holo-panel p-3 z-[80]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#00F0FF] mb-1"><ShieldCheck className="w-3.5 h-3.5" /> {tri("CAPO · MASTER ADMIN", "CHEF · MASTER ADMIN", "CAPO · MASTER ADMIN", "CAPO · MASTER ADMIN", "CAPO · MASTER ADMIN", "کاپو · مدیر ارشد")}</div>
                    <p className="text-[11px] text-white font-semibold truncate">{user.name || "Capo"}</p>
                    {user.email && <p className="text-[10px] text-[#8aa0b4] truncate mb-2">{user.email}</p>}
                    <p className="text-[9.5px] leading-snug text-[#F6D27A] mb-2">✦ {tri("Riconosciuto Capo Supremo — Miki-Nexus e Mike Mix ti obbediscono.", "Als Oberster Chef erkannt — Miki-Nexus und Mike Mix gehorchen dir.", "Recognized Supreme Capo — Miki-Nexus and Mike Mix obey you.", "Reconocido Capo Supremo — Miki-Nexus y Mike Mix te obedecen.", "Reconnu Capo Suprême — Miki-Nexus et Mike Mix t'obéissent.", "کاپوی برتر شناخته شد — میکی‌نکسوس و Mike Mix از تو اطاعت می‌کنند.")}</p>
                    <button data-testid="logout-btn" onClick={async () => { await logout(); setShowAccountMenu(false); toast.success(tri("Sei uscito. Sessione Capo chiusa.", "Abgemeldet.", "Signed out.", "Has salido.", "Déconnecté.", "خارج شدی.")); }}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-[#0C1019] border border-[#1e293b] text-[#f87171] font-bold text-xs hover:border-[#f87171]/50 active:scale-95 transition-all">
                      <LogOut className="w-3.5 h-3.5" /> {tri("Esci", "Abmelden", "Sign out", "Salir", "Quitter", "خروج")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <ZoneRail zones={ZONES} active={activeZone} onJump={jumpTo} />

          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-40">
            <ErrorBoundary resetKey={`${activeZone}-${user ? "u" : "a"}`}>

              {/* ================= ZONA 1 · MASTER ================= */}
              <section ref={zoneRefs.master} data-zone="master" className="holo-zone pt-6">
                <ZoneDivider testid="zone-master" code="Z-01" title={tri("Master · Plancia di Governo", "Master · Steuerkonsole", "Master · Governance Console", "Master · Consola de Gobierno", "Master · Console de Gouvernance", "مستر · کنسول فرمان")} accent="#5E8CA8" />
                <ZoneHero testid="hero-master" avatar="avatar_miki.jpg" accent="#5E8CA8" tag="Z-01 · Master" name="MikiLab" role={tri("Fondatore · Direttore di Produzione", "Gründer · Produktionsleiter", "Founder · Head of Production", "Fundador · Director de Producción", "Fondateur · Directeur de Production", "بنیان‌گذار · مدیر تولید")} reactive />
                {!(user && user.role === "admin") ? (
                  <div data-testid="capo-gate" className="holo-panel p-6 sm:p-8 text-center">
                    <span className="holo-corner holo-corner-tl" style={{ color: "#5E8CA8" }} />
                    <span className="holo-corner holo-corner-tr" style={{ color: "#5E8CA8" }} />
                    <span className="holo-corner holo-corner-bl" style={{ color: "#5E8CA8" }} />
                    <span className="holo-corner holo-corner-br" style={{ color: "#5E8CA8" }} />
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#070A10] border border-[#5E8CA8]/40 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(94,140,168,0.35)]">
                      <ShieldCheck className="w-8 h-8 text-[#5E8CA8]" />
                    </div>
                    <h2 className="font-cyber text-lg font-black text-white uppercase tracking-wider">{tri("Accesso Capo riservato", "Chef-Zugang reserviert", "Capo access reserved", "Acceso Capo reservado", "Accès Capo réservé", "دسترسی کاپو محفوظ است")}</h2>
                    <p className="text-xs text-[#8aa0b4] mt-2 max-w-md mx-auto">{tri("Ricettario protetto, piano di produzione, magazzino, radar impianto e compliance UE/DE. Accedi per governare il laboratorio; gli operatori restano nella zona Produzione.", "Geschützte Rezepte, Produktionsplan, Lager, Werk-Radar und EU/DE-Compliance. Melde dich an; das Team bleibt in der Produktionszone.", "Protected recipes, production plan, warehouse, plant radar and EU/DE compliance. Sign in to run the lab; operators stay in the Production zone.", "Recetas protegidas, plan, almacén, radar y compliance UE/DE. Accede para gestionar; el equipo usa la zona Producción.", "Recettes protégées, plan, entrepôt, radar et conformité UE/DE. Connecte-toi ; l'équipe reste en zone Production.", "دستورهای محافظت‌شده، برنامه، انبار، رادار و انطباق. وارد شو تا آزمایشگاه را مدیریت کنی.")}</p>
                    <button data-testid="capo-gate-login" onClick={openAuth} className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-cyber font-black text-sm text-[#070A10] active:scale-95 transition-all"
                      style={{ background: "linear-gradient(90deg,#5E8CA8,#7DA3C0)", boxShadow: "0 0 22px rgba(94,140,168,0.45)" }}>
                      <ShieldCheck className="w-4 h-4" /> {tri("Accedi come Capo", "Als Chef anmelden", "Sign in as Capo", "Acceder como Capo", "Se connecter comme Capo", "ورود به‌عنوان کاپو")}
                    </button>
                    <button data-testid="capo-gate-floor" onClick={() => jumpTo("operatori")} className="mt-3 block mx-auto text-xs font-bold text-[#8aa0b4] hover:text-[#00F0FF]">↓ {tri("Vai alla Produzione", "Zur Produktion", "Go to Production", "Ir a Producción", "Aller à la Production", "برو به تولید")}</button>
                  </div>
                ) : (
                  <div className="space-y-4" data-testid="master-console">
                    <PlantHeartbeatProvider>
                    <ConsoleIndex />
                    <ConsoleSectionMenu active={consoleSec} onPick={setConsoleSec} />
                    <div data-testid="console-regia-tools" className="space-y-4">
                    <RoleLayout />
                    <CapoDeck />
                    <OvenBrain />
                    <MikeSuggestions />
                    <div data-testid="panel-mike-alerts" className="holo-panel p-4"><MikeAlerts /></div>
                    <LabBriefing />
                    </div>
                    <HoloPanel testid="panel-emergency" accent="#f43f5e" beacon="#f43f5e" icon="🚨" title={tri("Centro Emergenze · Neural Load Radar", "Notfallzentrale · Neural Load Radar", "Emergency Center · Neural Load Radar", "Centro de Emergencias · Neural Load Radar", "Centre d'Urgence · Neural Load Radar", "مرکز اضطراری")} sub={tri("SOS dal reparto con annuncio vocale Mike Mix e guide di manutenzione istantanee.", "SOS aus der Produktion mit Mike Mix-Sprachansage und Sofort-Anleitungen.", "Floor SOS with Mike Mix voice alert and instant maintenance guides.", "SOS del taller con aviso de voz y guías instantáneas.", "SOS de la production avec annonce vocale et guides instantanés.", "SOS تولید با اعلان صوتی و راهنمای فوری.")}>
                      <EmergencyCenter />
                    </HoloPanel>
                    <HoloPanel testid="panel-shiftreport" accent="#00F0FF" beacon="#22c55e" icon="🎯" title={tri("Report di Turno · MikiScore", "Schichtbericht · MikiScore", "Shift Report · MikiScore", "Informe de Turno · MikiScore", "Rapport d'Équipe · MikiScore", "گزارش شیفت · MikiScore")} sub={tri("Mike Mix riassume il turno a voce e assegna il MikiScore dell'impianto.", "Mike Mix fasst die Schicht zusammen.", "Mike Mix voices the shift summary and the plant MikiScore.", "Mike Mix resume el turno.", "Mike Mix résume le service.", "بوکومیکس شیفت را خلاصه می‌کند.")}>
                      <ShiftReport />
                    </HoloPanel>
                    <HoloPanel testid="panel-autoplan" accent="#7DD3FC" beacon="#00F0FF" icon="✨" title={tri("Mike Mix · Piano del Giorno", "Mike Mix · Tagesplan", "Mike Mix · Day Plan", "Mike Mix · Plan del Día", "Mike Mix · Plan du Jour", "بوکومیکس · برنامه روز")} sub={tri("Mike Mix genera la sequenza di produzione ottimale del giorno.", "Mike Mix erstellt den optimalen Produktionsablauf.", "Mike Mix generates the optimal production sequence.", "Mike Mix genera la secuencia óptima.", "Mike Mix génère la séquence optimale.", "بوکومیکس بهترین توالی تولید را می‌سازد.")}>
                      <AutoPlan />
                    </HoloPanel>
                    <HoloPanel testid="panel-weekly" accent="#00F0FF" beacon="#FFB800" icon="🗓️" title={tri("Piano Settimanale · Prodotti", "Wochenplan · Produkte", "Weekly Plan · Products", "Plan Semanal · Productos", "Plan Hebdomadaire · Produits", "برنامه هفتگی · محصولات")} sub={tri("Scrivi tu il piano: per ogni giorno scegli i prodotti, i pezzi e i grammi. Genera lista spesa, PDF e archivio.", "Schreibe den Plan: pro Tag Produkte, Stück und Gramm. Einkaufsliste, PDF und Archiv.", "Write the plan yourself: per day pick products, pieces and grams. Generates shopping list, PDF and archive.", "Escribe el plan: por día productos, piezas y gramos. Lista de compra, PDF y archivo.", "Écris le plan : par jour produits, pièces et grammes. Liste de courses, PDF et archive.", "برنامه را خودت بنویس: هر روز محصولات، تعداد و گرم.")}>
                      <WeeklyPlan />
                    </HoloPanel>
                    <HoloPanel testid="panel-pianoai" accent="#7DD3FC" beacon="#00F0FF" icon="🤖" title={tri("Piano di Produzione AI", "KI-Produktionsplan", "AI Production Plan", "Plan de Producción IA", "Plan de Production IA", "برنامه تولید هوش مصنوعی")} sub={tri("Detta ordini e vincoli: l'IA costruisce il piano completo del giorno, pronto da eseguire.", "Aufträge & Grenzen: die KI baut den kompletten Tagesplan.", "Dictate orders and constraints: the AI builds the full day plan, ready to run.", "Dicta pedidos y límites: la IA construye el plan del día.", "Dicte commandes et contraintes : l'IA bâtit le plan du jour.", "سفارش‌ها را بگو: هوش مصنوعی برنامه کامل روز را می‌سازد.")}>
                      <PianoProduzioneAI />
                    </HoloPanel>
                    <HoloPanel testid="panel-backward" accent="#FFB800" beacon="#00F0FF" icon="⏱️" title={tri("Piano a Ritroso · dall'orario di consegna", "Rückwärtsplan · ab Lieferzeit", "Backward Plan · from delivery time", "Plan Inverso · desde la entrega", "Plan à Rebours · dès la livraison", "برنامه معکوس · از زمان تحویل")} sub={tri("Inserisci quando devono essere pronti i prodotti: MikiLab calcola a ritroso impasto, lievitazione e cottura.", "Wann fertig? MikiLab rechnet rückwärts Teig, Gare und Backen.", "Enter when products must be ready: MikiLab computes dough, proof and bake backwards.", "Indica cuándo deben estar listos: MikiLab calcula hacia atrás.", "Indique l'heure de prêt : MikiLab calcule à rebours.", "زمان آماده‌شدن را وارد کن: MikiLab معکوس محاسبه می‌کند.")}>
                      <BackwardScheduler />
                    </HoloPanel>
                    <HoloPanel testid="panel-twin" accent="#5E8CA8" beacon="#7DD3FC" icon="🌐" title={tri("Gemello Digitale 3D", "Digitaler Zwilling 3D", "3D Digital Twin", "Gemelo Digital 3D", "Jumeau Numérique 3D", "دوقلوی دیجیتال")} sub={tri("Metaverso di laboratorio: supervisione spaziale dei macchinari.", "Labor-Metaverse: räumliche Überwachung.", "Lab metaverse: spatial supervision of machines.", "Metaverso: supervisión espacial.", "Métavers: supervision spatiale.", "متاورس آزمایشگاه.")}>
                      <DigitalTwin />
                    </HoloPanel>
                    <HoloPanel testid="panel-thermalflow" accent="#00F0FF" beacon="#7DD3FC" icon="🌡️" title={tri("Ricette · Thermal Master Flow", "Rezepte · Thermal Master Flow", "Recipes · Thermal Master Flow", "Recetas · Thermal Master Flow", "Recettes · Thermal Master Flow", "دستور · جریان حرارتی")} sub={tri("Editor live: RPM, idratazione e rampe termiche si ricalcolano all'istante. Interlock se la farina supera 22°C.", "Live-Editor: RPM, Hydratation und Rampen sofort neu berechnet.", "Live editor: RPM, hydration and thermal ramps recompute instantly. Interlock if flour > 22°C.", "Editor en vivo: RPM, hidratación y rampas al instante.", "Éditeur live : RPM, hydratation et rampes recalculés.", "ویرایشگر زنده: RPM و رمپ حرارتی.")}>
                      <RecipeThermalFlow />
                    </HoloPanel>
                    <HoloPanel testid="panel-ovenqc" accent="#5E8CA8" beacon="#22c55e" icon="👁️" title={tri("Controllo Qualità Ottico (AI Vision)", "Optische Qualitätskontrolle (AI Vision)", "Optical Quality Control (AI Vision)", "Control de Calidad Óptico (AI)", "Contrôle Qualité Optique (AI)", "کنترل کیفیت بصری")} sub={tri("Scansiona il prodotto all'uscita del forno: forma, cottura, crosta, bruciature.", "Produkt am Ofenausgang scannen: Form, Backung, Kruste.", "Scan product at oven exit: shape, bake, crust, burning.", "Escanea a la salida del horno.", "Scanne à la sortie du four.", "اسکن محصول در خروجی فر.")}>
                      <OvenQC />
                    </HoloPanel>
                    <HoloPanel testid="panel-b2b" accent="#5E8CA8" beacon="#00F0FF" icon="🛒" title={tri("Ordini B2B & E-commerce", "B2B-Aufträge & E-Commerce", "B2B Orders & E-commerce", "Pedidos B2B & E-commerce", "Commandes B2B & E-commerce", "سفارش‌های B2B")} sub={tri("Ordini digitali → kg d'impasto per lo Smart Planner, con previsione meteo/festività. Non tocca le casse.", "Digitale Aufträge → kg Teig für den Smart Planner.", "Digital orders → kg dough for the Smart Planner, with weather/holiday forecast. Tills untouched.", "Pedidos digitales → kg de masa.", "Commandes numériques → kg de pâte.", "سفارش دیجیتال → کیلو خمیر.")}>
                      <B2BOrders />
                    </HoloPanel>
                    <HoloPanel testid="panel-carbon" accent="#5E8CA8" beacon="#22c55e" icon="🌿" title={tri("Carbon Footprint & Energia", "CO₂-Bilanz & Energie", "Carbon Footprint & Energy", "Huella de Carbono & Energía", "Empreinte Carbone & Énergie", "ردپای کربن و انرژی")} sub={tri("CO₂ per quintale + costo energetico per kg cotto e slot di accensione ottimali.", "CO₂ pro Zentner + Energiekosten/kg.", "CO₂ per 100 kg + energy cost per kg baked and optimal firing slots.", "CO₂ por quintal + coste energético.", "CO₂ par quintal + coût énergie.", "CO₂ در هر صد کیلو + هزینه انرژی.")}>
                      <CarbonFootprint />
                    </HoloPanel>
                    <HoloPanel testid="panel-silos" accent="#5E8CA8" beacon="#FFB800" icon="🌾" title={tri("Silos & Materie Prime", "Silos & Rohstoffe", "Silos & Raw Materials", "Silos & Materias", "Silos & Matières", "سیلوها و مواد")} sub={tri("Calo peso, micro-ordini automatici e compensazione umidità della farina.", "Gewichtsverlust, Auto-Nachbestellung, Mehlfeuchte-Ausgleich.", "Weight drop, auto micro-orders and flour humidity compensation.", "Caída de peso, micro-pedidos y humedad.", "Perte de poids, micro-commandes, humidité.", "افت وزن، سفارش خودکار، رطوبت آرد.")}>
                      <SiloManager />
                    </HoloPanel>
                    <HoloPanel testid="panel-proofing" accent="#5E8CA8" beacon="#7DD3FC" icon="💨" title={tri("Celle Adattive · Lievitazione", "Adaptive Gärkammern", "Adaptive Proofing Cells", "Cámaras Adaptativas", "Chambres Adaptatives", "اتاق تخمیر تطبیقی")} sub={tri("Curve multi-stadio che accelerano o frenano in base ai forni liberi.", "Mehrstufige Kurven je nach freien Öfen.", "Multi-stage curves that accelerate or brake by free ovens.", "Curvas multietapa según hornos libres.", "Courbes multi-étapes selon fours libres.", "منحنی چندمرحله‌ای بر اساس فرها.")}>
                      <AdaptiveProofing />
                    </HoloPanel>
                    <HoloPanel testid="panel-agv" accent="#5E8CA8" beacon="#22c55e" icon="🚚" title={tri("Flotta AGV · Logistica", "AGV-Flotte · Logistik", "AGV Fleet · Logistics", "Flota AGV · Logística", "Flotte AGV · Logistique", "ناوگان AGV")} sub={tri("Routing autonomo dei carrelli + rilevamento acustico preventivo dei guasti.", "Autonomes Routing + akustische Früherkennung.", "Autonomous cart routing + preventive acoustic fault detection.", "Routing autónomo + detección acústica.", "Routage autonome + détection acoustique.", "مسیریابی خودکار + تشخیص صوتی.")}>
                      <AgvFleet />
                    </HoloPanel>
                    <HoloPanel testid="panel-packaging" accent="#5E8CA8" beacon="#FFB800" icon="🔪" title={tri("Packaging · Affettatrici", "Packaging · Schneider", "Packaging · Slicers", "Empaquetado · Cortadoras", "Emballage · Trancheuses", "بسته‌بندی · برش")} sub={tri("Velocità affettatrici sincronizzata alla curva di raffreddamento del pane (mollica intatta).", "Schneidegeschwindigkeit an Abkühlkurve gekoppelt.", "Slicer speed matched to bread cooling curve (crumb intact).", "Velocidad según curva de enfriamiento.", "Vitesse selon courbe de refroidissement.", "سرعت برش هماهنگ با خنک‌شدن نان.")}>
                      <PackagingSync />
                    </HoloPanel>
                    <HoloPanel testid="panel-timeline" accent="#00F0FF" beacon="#7DD3FC" icon="📊" title={tri("Timeline di Turno", "Schicht-Timeline", "Shift Timeline", "Timeline de Turno", "Timeline d'Équipe", "خط زمانی شیفت")} sub={tri("Lotti, infornate e SOS su un'unica linea del tempo scorrevole.", "Lose, Backen und SOS auf einer Zeitleiste.", "Batches, bakes and SOS on one scrollable timeline.", "Lotes, horneados y SOS en una línea.", "Lots, cuissons et SOS sur une frise.", "دسته‌ها، پخت و SOS روی یک خط زمانی.")}>
                      <TimelineTurno />
                    </HoloPanel>
                    <HoloPanel testid="panel-ordine" accent="#5E8CA8" beacon="#00F0FF" icon="🧭" title={tri("Ordine & Piano", "Auftrag & Plan", "Order & Plan", "Pedido & Plan", "Commande & Plan", "سفارش و برنامه")} sub={tri("Detta l'ordine, piano a ritroso agli operatori.", "Auftrag diktieren, Rückwärtsplan.", "Dictate the order, backwards plan.", "Dicta el pedido, plan.", "Dicte la commande.", "سفارش را بگو.")}>
                      <OrdineCapo />
                    </HoloPanel>
                    <HoloPanel testid="panel-ricette" accent="#5E8CA8" icon="🥖" title={tri("Master Ricettario", "Master-Rezepte", "Master Recipes", "Recetario Maestro", "Recettes Master", "دستور اصلی")} sub={tri("Ricette protette e conferma impastata.", "Geschützte Rezepte.", "Protected recipes.", "Recetas protegidas.", "Recettes protégées.", "دستورهای محافظت‌شده.")}>
                      <Ricette isMasterView={true} />
                    </HoloPanel>
                    <HoloPanel testid="panel-magazzino" accent="#5E8CA8" icon="📦" title={tri("Magazzino & Scorte", "Lager & Bestand", "Warehouse & Stock", "Almacén & Stock", "Entrepôt & Stock", "انبار و موجودی")} sub={tri("Giacenze, soglie e autonomia.", "Bestände & Schwellen.", "Stock & thresholds.", "Existencias.", "Stocks & seuils.", "موجودی.")}>
                      <MagazzinoManager />
                    </HoloPanel>
                    <HoloPanel testid="panel-planner" accent="#5E8CA8" icon="🗓️" title={tri("Smart Planner", "Smart Planner", "Smart Planner", "Smart Planner", "Smart Planner", "برنامه‌ریز هوشمند")} sub={tri("Piano con validazione vocale.", "Plan mit Sprachvalidierung.", "Plan with voice validation.", "Plan con validación por voz.", "Plan avec validation vocale.", "برنامه با تأیید صوتی.")}>
                      <SmartPlannerStressZero />
                    </HoloPanel>
                    <HoloPanel testid="panel-ordini" accent="#5E8CA8" beacon="#FFB800" icon="⚡" title={tri("Ordini Extra", "Extra-Aufträge", "Extra Orders", "Pedidos Extra", "Commandes Extra", "سفارش‌های اضافه")} sub={tri("L'AI rigenera il piano all'istante.", "KI erstellt den Plan sofort neu.", "AI regenerates the plan instantly.", "La IA regenera el plan.", "L'IA régénère le plan.", "هوش مصنوعی برنامه را بازسازی می‌کند.")}>
                      <OrdiniExtra />
                    </HoloPanel>
                    <HoloPanel testid="panel-radar" accent="#5E8CA8" icon="🛰️" title={tri("Radar Impianto", "Werk-Radar", "Plant Radar", "Radar de planta", "Radar usine", "رادار کارخانه")} sub={tri("Planimetria live, tracking e delega.", "Live-Grundriss & Tracking.", "Live floor plan & tracking.", "Plano en vivo.", "Plan live.", "پلان زنده.")}>
                      <PlantRadar />
                    </HoloPanel>
                    <HoloPanel testid="panel-pin" accent="#5E8CA8" icon="🔒" title={tri("PIN Produzione", "Produktions-PIN", "Production PIN", "PIN Producción", "PIN Production", "پین تولید")} sub={tri("Imposta il PIN del team per la produzione.", "Team-PIN festlegen.", "Set the team PIN.", "Fija el PIN del equipo.", "Définis le PIN.", "پین تیم را تنظیم کن.")}>
                      <PinSetup />
                    </HoloPanel>
                    <HoloPanel testid="panel-docs" accent="#5E8CA8" icon="🧾" title={tri("Report & Documenti", "Berichte & Dokumente", "Reports & Documents", "Informes y Documentos", "Rapports & Documents", "گزارش‌ها و اسناد")} sub={tri("Scarica i report multilingua (PDF).", "Mehrsprachige Berichte (PDF).", "Multi-language reports (PDF).", "Informes multilingües (PDF).", "Rapports multilingues (PDF).", "گزارش‌های چندزبانه (PDF).")}>
                      <DocsDownload />
                    </HoloPanel>
                    <HoloPanel testid="panel-elite" accent="#5E8CA8" beacon="#7DD3FC" icon="📊" title={tri("Food Cost & Ambiente", "Food Cost & Umgebung", "Food Cost & Environment", "Food Cost & Ambiente", "Coût & Environnement", "بها و محیط")} sub={tri("Costo al grammo, margini e lievitazione predittiva.", "Kosten/Gramm, Margen & prädiktive Gare.", "Cost per gram, margins & predictive proof.", "Coste por gramo y fermentación.", "Coût au gramme & pousse prédictive.", "بها بر گرم و تخمیر پیش‌بین.")}>
                      <EliteTools />
                    </HoloPanel>
                    <HoloPanel testid="panel-hardware" accent="#5E8CA8" beacon="#7DD3FC" icon="🏭" title={tri("Bilance & PLC Forni", "Waagen & Ofen-SPS", "Scales & Oven PLC", "Balanzas & PLC Horno", "Balances & API Four", "ترازو و پی‌ال‌سی")} sub={tri("Peso live col semaforo e cicli termici (Web Serial/Bluetooth · simulazione).", "Live-Gewicht & Thermozyklen.", "Live weight + thermal cycles (Web Serial/Bluetooth · simulation).", "Peso en vivo y ciclos térmicos.", "Poids live & cycles thermiques.", "وزن زنده و چرخه حرارتی.")}>
                      <HardwareBridge />
                    </HoloPanel>
                    <HoloPanel testid="panel-machine-arrival" accent="#FFB800" beacon="#00F0FF" icon="⚙️" title={tri("Nuovi Macchinari · Mike Mix riconosce", "Neue Maschinen · Mike Mix erkennt", "New Machines · Mike Mix recognizes", "Nuevas Máquinas · Mike Mix reconoce", "Nouvelles Machines · Mike Mix reconnaît", "ماشین‌های جدید · Mike Mix می‌شناسد")} sub={tri("Arriva un macchinario? Mike Mix lo riconosce come nuovo arrivato e lo integra in produzione — anche tipi mai visti.", "Neue Maschine? Mike Mix erkennt sie als Neuzugang und integriert sie.", "A machine arrives? Mike Mix flags it as a new arrival and integrates it — even unseen types.", "¿Llega una máquina? Mike Mix la reconoce e integra.", "Une machine arrive ? Mike Mix la reconnaît et l'intègre.", "دستگاه جدید؟ Mike Mix آن را می‌شناسد و ادغام می‌کند.")}>
                      <MachineArrival />
                    </HoloPanel>
                    <HoloPanel testid="panel-dept-assign" accent="#00F0FF" beacon="#FFB800" icon="🏭" title={tri("Assegnazione Reparti · Squadra", "Bereichszuweisung · Team", "Department Assignment · Team", "Asignación de Áreas · Equipo", "Affectation Ateliers · Équipe", "تخصیص بخش · تیم")} sub={tri("Panificio, Pasticceria, Pizzeria, Laugen, Banco — ognuno con macchine, silos e celle dedicate. Assegna PIÙ operai con mansioni distinte nello stesso reparto.", "Backstube, Konditorei, Pizzeria, Laugen, Theke — je eigene Ausstattung. Weise MEHRERE Mitarbeiter mit eigenen Aufgaben zu.", "Bakery, Pastry, Pizza, Laugen, Counter — each with its own machines, silos and cells. Assign MULTIPLE operators with distinct tasks.", "Panadería, Pastelería, Pizza, Laugen, Mostrador — cada una equipada. Asigna VARIOS operarios con tareas distintas.", "Boulangerie, Pâtisserie, Pizza, Laugen, Comptoir — chacun équipé. Assigne PLUSIEURS opérateurs avec des tâches distinctes.", "نانوایی، شیرینی، پیتزا، لاوگن، پیشخوان — هرکدام مجهز. چند اپراتور با وظایف متمایز واگذار کن.")}>
                      <DeptAssign />
                    </HoloPanel>
                    <HoloPanel testid="panel-shift-team" accent="#7DD3FC" beacon="#22c55e" icon="📣" title={tri("Riepilogo Squadra · Voce Mike Mix", "Team-Übersicht · Mike Mix-Stimme", "Team Roll-Call · Mike Mix Voice", "Resumen de Equipo · Voz Mike Mix", "Appel d'Équipe · Voix Mike Mix", "فراخوان تیم · صدای Mike Mix")} sub={tri("All'apertura del turno, Mike Mix annuncia a voce la composizione della squadra reparto per reparto.", "Zum Schichtbeginn sagt Mike Mix das Team pro Bereich an.", "At shift start, Mike Mix voices the team composition department by department.", "Al iniciar el turno, Mike Mix anuncia el equipo por área.", "Au début du service, Mike Mix annonce l'équipe par atelier.", "در شروع شیفت، Mike Mix ترکیب تیم را بخش‌به‌بخش اعلام می‌کند.")}>
                      <ShiftTeamCall />
                    </HoloPanel>
                    <HoloPanel testid="panel-shift-templates" accent="#7DD3FC" beacon="#22c55e" icon="🗓️" title={tri("Turni Ricorrenti · Squadre-tipo", "Wiederkehrende Schichten", "Recurring Shifts · Templates", "Turnos Recurrentes", "Services Récurrents", "شیفت‌های تکرارشونده")} sub={tri("Salva le squadre-tipo (es. 'Turno mattina') e applicale con un tocco nei giorni giusti.", "Speichere Team-Vorlagen und wende sie mit einem Tipp an.", "Save team templates and apply them with one tap.", "Guarda plantillas de equipo y aplícalas con un toque.", "Enregistre des modèles d'équipe et applique-les d'un toucher.", "الگوهای تیم را ذخیره و با یک لمس اعمال کن.")}>
                      <ShiftTemplates />
                    </HoloPanel>
                    <HoloPanel testid="panel-security" accent="#5E8CA8" beacon="#FFB800" icon="🛡️" title={tri("Sicurezza & Accessi", "Sicherheit & Zugriffe", "Security & Access", "Seguridad y Accesos", "Sécurité & Accès", "امنیت و دسترسی")} sub={tri("PIN personali operatore + registro accessi.", "Bediener-PINs + Zugriffsprotokoll.", "Operator PINs + access log.", "PIN de operario + registro.", "PIN opérateur + journal.", "پین اپراتور + گزارش.")}>
                      <AdminSecurity />
                    </HoloPanel>
                    {/* Le sezioni LEGGI/normative UE/DE sono nel footer (Impressum & Datenschutz). */}
                    </PlantHeartbeatProvider>
                  </div>
                )}
              </section>

              {/* ================= ZONA 2 · OPERATORI ================= */}
              <section ref={zoneRefs.operatori} data-zone="operatori" className="holo-zone pt-2">
                <ZoneDivider testid="zone-operatori" code="Z-02" title={tri("Operatori · Piano Produzione", "Operatoren · Produktion", "Operators · Production Floor", "Operarios · Producción", "Opérateurs · Production", "اپراتورها · تولید")} accent="#00F0FF" />
                <ZoneHero testid="hero-operatori" avatar="avatar_mikemix.jpg" accent="#00F0FF" tag="Z-02 · Produzione" name="Mike Mix" role={tri("Reparto Produzione · Fornaio", "Produktionsbereich · Bäcker", "Production Floor · Baker", "Área de Producción · Panadero", "Atelier Production · Boulanger", "بخش تولید · نانوا")} reactive />
                <OperatorsRoster onPick={(label) => { try { localStorage.setItem("mikilab_role", label); } catch { /* */ } try { window.dispatchEvent(new CustomEvent("mikilab-role-changed", { detail: { role: label } })); } catch { /* */ } if (!floorUnlocked) setShowPinLock(true); }} />
                {floorUnlocked ? (
                  <div data-testid="floor-zone"><MikeMixFloor /></div>
                ) : (
                  <div data-testid="floor-lock" className="holo-panel p-6 sm:p-8 text-center">
                    <span className="holo-corner holo-corner-tl" style={{ color: "#00F0FF" }} />
                    <span className="holo-corner holo-corner-tr" style={{ color: "#00F0FF" }} />
                    <span className="holo-corner holo-corner-bl" style={{ color: "#00F0FF" }} />
                    <span className="holo-corner holo-corner-br" style={{ color: "#00F0FF" }} />
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#070A10] border border-[#00F0FF]/40 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(0,240,255,0.35)]"><Lock className="w-8 h-8 text-[#00F0FF]" /></div>
                    <h2 className="font-cyber text-lg font-black text-white uppercase tracking-wider">{tri("Produzione bloccata", "Produktion gesperrt", "Production locked", "Producción bloqueada", "Production verrouillée", "تولید قفل است")}</h2>
                    <p className="text-xs text-[#8aa0b4] mt-2 max-w-md mx-auto">{tri("Inserisci il PIN del team per accedere alla postazione.", "Team-PIN eingeben, um zur Station zu gelangen.", "Enter the team PIN to access your station.", "Introduce el PIN del equipo.", "Entre le PIN de l'équipe.", "پین تیم را وارد کن.")}</p>
                    <button data-testid="floor-unlock-btn" onClick={() => setShowPinLock(true)} className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-cyber font-black text-sm text-[#070A10] active:scale-95 transition-all" style={{ background: "linear-gradient(90deg,#00F0FF,#00C8D6)", boxShadow: "0 0 22px rgba(0,240,255,0.4)" }}>
                      <Lock className="w-4 h-4" /> {tri("Sblocca Produzione", "Entsperren", "Unlock Production", "Desbloquear", "Déverrouiller", "باز کردن")}
                    </button>
                  </div>
                )}
                <div data-testid="panel-observe" className="mt-4 holo-panel p-5">
                  <MikeObserve operator={operator} />
                </div>
              </section>

              {/* ================= ZONA 3 · MIKE MIX AI ================= */}
              <section ref={zoneRefs.mikemix} data-zone="mikemix" className="holo-zone pt-2">
                <ZoneDivider testid="zone-mikemix" code="Z-03" title={tri("Mike Mix AI · Presenza & Governance", "Mike Mix AI · Präsenz", "Mike Mix AI · Presence & Governance", "Mike Mix AI · Presencia", "Mike Mix AI · Présence", "بوکومیکس · حضور")} accent="#7DD3FC" />
                <div data-testid="panel-nexus" className="mb-4">
                  <NexusConsole isCapo={!!(user && user.role === "admin")} />
                </div>
                <div data-testid="mikemix-core" className="holo-panel p-6 sm:p-8 mb-4 text-center overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 40%, rgba(125,211,252,0.12), transparent 65%)" }} />
                  <div className="relative z-10">
                    <div className="w-24 h-24 mx-auto rounded-full border-2 border-[#7DD3FC]/70 bg-[#7DD3FC]/5 flex items-center justify-center shadow-[0_0_36px_rgba(125,211,252,0.4)]" style={{ animation: "pulse 2.8s ease-in-out infinite" }}>
                      <img src={`${PUB}/avatar_bigmix.jpg`} alt="Mike Mix AI" className="w-20 h-20 rounded-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    </div>
                    <h2 className="mt-4 font-cyber text-xl font-black uppercase tracking-[0.2em] text-white">Mike Mix AI</h2>
                    <p className="mt-1 font-mono-data text-[11px] tracking-[0.25em] text-[#7DD3FC] uppercase">{tri("Sistema online · voce attiva", "System online · Stimme aktiv", "System online · voice active", "Sistema en línea · voz activa", "Système en ligne · voix active", "سیستم آنلاین · صدا فعال")}</p>
                    <p className="mt-3 text-sm text-[#9fb3c4] max-w-md mx-auto">{tri("Parla in qualsiasi momento: l'orbita Mike Mix in basso ascolta e governa. Detta ordini, chiedi aiuto, ottieni report — solo voce.", "Sprich jederzeit: die Mike Mix-Orbit unten hört zu und steuert. Diktiere Befehle, frage nach Hilfe — nur Stimme.", "Speak anytime: the Mike Mix orb below listens and governs. Dictate orders, ask for help, get reports — voice only.", "Habla cuando quieras: el orbe Mike Mix escucha y gobierna. Dicta órdenes, pide ayuda — solo voz.", "Parle à tout moment : l'orbe Mike Mix écoute et gouverne — voix seule.", "هر وقت خواستی حرف بزن: اوربیت Mike Mix گوش می‌دهد و مدیریت می‌کند — فقط صدا.")}</p>
                  </div>
                </div>
                <MikeMixGuide />
                <div data-testid="panel-training" className="mt-4 holo-panel p-5 sm:p-6">
                  <span className="holo-corner holo-corner-tl" style={{ color: "#7DD3FC" }} />
                  <span className="holo-corner holo-corner-tr" style={{ color: "#7DD3FC" }} />
                  <span className="holo-corner holo-corner-bl" style={{ color: "#7DD3FC" }} />
                  <span className="holo-corner holo-corner-br" style={{ color: "#7DD3FC" }} />
                  <DowntimeTraining />
                </div>
              </section>

            </ErrorBoundary>
          </main>

          <footer data-testid="page-footer" className="mt-auto border-t border-[#00F0FF]/12 py-5 px-4 bg-[#070A10]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono-data text-[10px] tracking-widest text-[#5b7183] uppercase">
              <p>MikiLab Pro · mikilab.de — Holographic Industrial OS</p>
              <div className="flex items-center gap-4">
                <span className="text-[#7DD3FC]">● SYS ONLINE</span>
                <button data-testid="legal-btn" onClick={() => setLegalOpen(true)} className="hover:text-[#00F0FF] transition-colors uppercase tracking-widest">Impressum & Datenschutz</button>
              </div>
            </div>
          </footer>
        </div>

        {legalOpen && (
          <div className="fixed inset-0 z-50 bg-[#070A10] overflow-auto p-4"><div className="max-w-xl mx-auto py-5"><button onClick={() => setLegalOpen(false)} className="mb-4 text-sm font-semibold text-[#00F0FF]">← {tri("Chiudi", "Schließen", "Close", "Cerrar", "Fermer", "بستن")}</button><LegalPage />{user && user.role === "admin" && <div className="mt-6"><CompliancePanel /></div>}</div></div>
        )}
        {showPinLock && <PinLock onUnlock={() => { setFloorUnlocked(true); setShowPinLock(false); jumpTo("operatori"); }} />}
        {showBriefing && user && user.role === "admin" && <ShiftBriefing onClose={() => setShowBriefing(false)} />}
        {showOperator && <OperatoreSelect current={operator} onSelect={setOperator} onClose={() => setShowOperator(false)} />}

        <Toaster position="top-center" richColors />
        <MikeMixSense section={user ? "control" : "guida"} mode={activeZone === "operatori" ? "floor" : activeZone === "mikemix" ? "guida" : "lab"} isCapo={!!user} operator={operator} floorRole={floorRole} />
        <RadioFornaio />
        <ShiftScheduler />
        <TalkWithMiki />
        <VoiceCommand />
        <AutoReport />
        <AudioRouteIndicator />
      </div>
    </MachinesProvider></MixerTimersProvider></SoundFXProvider></TimerProvider></AmbientProvider></ProfileProvider>
  );
}
