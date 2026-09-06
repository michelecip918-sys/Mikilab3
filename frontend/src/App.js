/*
 * ============================================================================
 *  MIKILAB PRO & BakoMix AI — PROPRIETARY & CONFIDENTIAL
 *  (c) 2026 MikiLab Pro. Tutti i diritti riservati / All rights reserved.
 *  Unico proprietario legale: il Master. Sole legal owner: the Master.
 *  Codice riservato: vietata copia, distribuzione, reverse engineering o
 *  cloning non autorizzati, tracciati dal BakoMix AI Security Guardian.
 * ============================================================================
 *  PLANCIA OLOGRAFICA — Zero-Menu vertical command console (v40).
 *  Unica PWA continua a scorrimento verticale: Master · Operatori · BakoMix AI.
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
import MohamedFloor from "@/components/MohamedFloor";
import BakoMixSense from "@/components/BakoMixSense";
import BakemixGuide from "@/components/BakemixGuide";
import AdminGate from "@/components/AdminGate";
import LangSelector from "@/components/LangSelector";
import { resetSessionBoards } from "@/lib/sessionState";
import { recipesApi, warehouseApi, planApi, weeklyApi, floorPlanApi } from "@/lib/api";
import InstallApp from "@/components/InstallApp";
import { mkTri } from "@/i18n/triMaps";
import { ShieldCheck, LogOut, User, WifiOff, Lock } from "lucide-react";

import Ricette from "@/sections/Ricette";
import OrdiniExtra from "@/components/OrdiniExtra";
import PlantRadar from "@/components/PlantRadar";
import SecurityGuardian from "@/components/SecurityGuardian";
import AmbientBako from "@/components/AmbientBako";
import CompliancePanel from "@/components/CompliancePanel";
import ComplianceBeacon from "@/components/ComplianceBeacon";
import SmartPlannerStressZero from "@/sections/SmartPlannerStressZero";
import { ZoneDivider, HoloPanel, ZoneRail, ZoneHero } from "@/components/console/HoloKit";
import OperatorsRoster from "@/components/console/OperatorsRoster";
import AdminSecurity from "@/components/console/AdminSecurity";
import EliteTools from "@/components/console/EliteTools";
import HardwareBridge from "@/components/console/HardwareBridge";
import AutoPlan from "@/components/console/AutoPlan";
import ShiftBriefing from "@/components/console/ShiftBriefing";

const PUB = process.env.PUBLIC_URL;

const ZONES = [
  { id: "master", label: "Master", accent: "#5E8CA8", avatar: "avatar_miki.jpg" },
  { id: "operatori", label: "Operatori", accent: "#00F0FF", avatar: "avatar_mohamed.jpg" },
  { id: "bakomix", label: "BakoMix AI", accent: "#7DD3FC", avatar: "avatar_bigmix.jpg" },
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

  // Cyber-Trio: briefing automatico all'apertura turno (una volta al giorno, solo Capo).
  useEffect(() => {
    if (user && user.role === "admin") {
      const today = new Date().toISOString().slice(0, 10);
      try { if (localStorage.getItem("mikilab_briefing_day") !== today) { localStorage.setItem("mikilab_briefing_day", today); setShowBriefing(true); } } catch (e) { /* */ }
    }
  }, [user]);

  const zoneRefs = { master: useRef(null), operatori: useRef(null), bakomix: useRef(null) };

  const jumpTo = useCallback((id) => {
    const el = zoneRefs[id]?.current;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!adminOk && !resetToken) return <AdminGate onUnlock={() => { try { localStorage.setItem("mikilab_admin_unlocked", "1"); } catch { /* */ } setAdminOk(true); }} />;
  if (resetToken) return <ResetPassword token={resetToken} onDone={() => { setResetToken(null); setAuthOpen(true); }} />;
  if (authOpen && !user) return <div className="fixed inset-0 z-[70] bg-[#070A10] overflow-auto"><AuthScreen onClose={() => setAuthOpen(false)} initialMode={authMode} /></div>;

  return (
    <ProfileProvider><AmbientProvider><TimerProvider><SoundFXProvider><MixerTimersProvider><MachinesProvider>
      <SecurityGuardian />
      <AmbientBako />
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
                  <span className="block font-cyber text-sm sm:text-base font-black tracking-[0.18em] text-white uppercase truncate">MikiLab<span className="text-[#00F0FF]"> Pro</span></span>
                  <span className="hidden sm:block font-mono-data text-[9px] tracking-[0.3em] text-[#00F0FF]/70 uppercase">Holographic Command OS</span>
                </span>
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2 relative">
                <ComplianceBeacon compact onOpen={() => jumpTo("master")} />
                {user && user.role === "admin" && (
                  <button data-testid="briefing-open" onClick={() => setShowBriefing(true)} title="Cyber-Trio"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#7DD3FC]/10 border border-[#7DD3FC]/40 text-[#7DD3FC] font-bold text-xs active:scale-95 transition-all">
                    ◐ <span className="hidden sm:inline">{tri("Turno", "Schicht", "Shift", "Turno", "Turn", "شیفت")}</span>
                  </button>
                )}
                <LangSelector testid="header-lang" />
                <InstallApp variant="chip" />
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
                    <LabBriefing />
                    <HoloPanel testid="panel-autoplan" accent="#7DD3FC" beacon="#00F0FF" icon="✨" defaultOpen title={tri("BakoMix · Piano del Giorno", "BakoMix · Tagesplan", "BakoMix · Day Plan", "BakoMix · Plan del Día", "BakoMix · Plan du Jour", "بوکومیکس · برنامه روز")} sub={tri("BakoMix genera la sequenza di produzione ottimale del giorno.", "BakoMix erstellt den optimalen Produktionsablauf.", "BakoMix generates the optimal production sequence.", "BakoMix genera la secuencia óptima.", "BakoMix génère la séquence optimale.", "بوکومیکس بهترین توالی تولید را می‌سازد.")}>
                      <AutoPlan />
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
                    <HoloPanel testid="panel-security" accent="#5E8CA8" beacon="#FFB800" icon="🛡️" title={tri("Sicurezza & Accessi", "Sicherheit & Zugriffe", "Security & Access", "Seguridad y Accesos", "Sécurité & Accès", "امنیت و دسترسی")} sub={tri("PIN personali operatore + registro accessi.", "Bediener-PINs + Zugriffsprotokoll.", "Operator PINs + access log.", "PIN de operario + registro.", "PIN opérateur + journal.", "پین اپراتور + گزارش.")}>
                      <AdminSecurity />
                    </HoloPanel>
                    {/* Sezioni LEGGI/normative — in fondo, come richiesto */}
                    <HoloPanel testid="panel-compliance" accent="#5E8CA8" beacon="#7DD3FC" icon="⚖️" title={tri("Leggi & Compliance UE/DE", "Recht & Compliance EU/DE", "Laws & Compliance EU/DE", "Leyes & Compliance UE/DE", "Lois & Conformité UE/DE", "قوانین و انطباق")} sub={tri("Orari di lavoro (ArbZG), sicurezza (DGUV) e privacy (GDPR).", "Arbeitszeiten (ArbZG), DGUV & DSGVO.", "Working hours (ArbZG), DGUV & GDPR.", "Horas (ArbZG), DGUV y RGPD.", "Heures (ArbZG), DGUV & RGPD.", "ساعات کاری، ایمنی و حریم خصوصی.")}>
                      <CompliancePanel />
                    </HoloPanel>
                  </div>
                )}
              </section>

              {/* ================= ZONA 2 · OPERATORI ================= */}
              <section ref={zoneRefs.operatori} data-zone="operatori" className="holo-zone pt-2">
                <ZoneDivider testid="zone-operatori" code="Z-02" title={tri("Operatori · Piano Produzione", "Operatoren · Produktion", "Operators · Production Floor", "Operarios · Producción", "Opérateurs · Production", "اپراتورها · تولید")} accent="#00F0FF" />
                <ZoneHero testid="hero-operatori" avatar="avatar_mohamed.jpg" accent="#00F0FF" tag="Z-02 · Operatori" name="Mohamed" role={tri("Capo Turno · Maestro Fornaio", "Schichtleiter · Bäckermeister", "Shift Lead · Master Baker", "Jefe de Turno · Maestro Panadero", "Chef d'équipe · Maître Boulanger", "سرشیفت · استاد نانوا")} reactive />
                <OperatorsRoster onPick={(label) => { try { localStorage.setItem("mikilab_role", label); } catch { /* */ } try { window.dispatchEvent(new CustomEvent("mikilab-role-changed", { detail: { role: label } })); } catch { /* */ } if (!floorUnlocked) setShowPinLock(true); }} />
                {floorUnlocked ? (
                  <div data-testid="floor-zone"><MohamedFloor /></div>
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
              </section>

              {/* ================= ZONA 3 · BAKOMIX AI ================= */}
              <section ref={zoneRefs.bakomix} data-zone="bakomix" className="holo-zone pt-2">
                <ZoneDivider testid="zone-bakomix" code="Z-03" title={tri("BakoMix AI · Presenza & Governance", "BakoMix AI · Präsenz", "BakoMix AI · Presence & Governance", "BakoMix AI · Presencia", "BakoMix AI · Présence", "بوکومیکس · حضور")} accent="#7DD3FC" />
                <div data-testid="bakomix-core" className="holo-panel p-6 sm:p-8 mb-4 text-center overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 40%, rgba(125,211,252,0.12), transparent 65%)" }} />
                  <div className="relative z-10">
                    <div className="w-24 h-24 mx-auto rounded-full border-2 border-[#7DD3FC]/70 bg-[#7DD3FC]/5 flex items-center justify-center shadow-[0_0_36px_rgba(125,211,252,0.4)]" style={{ animation: "pulse 2.8s ease-in-out infinite" }}>
                      <img src={`${PUB}/avatar_bigmix.jpg`} alt="BakoMix AI" className="w-20 h-20 rounded-full object-cover object-top" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    </div>
                    <h2 className="mt-4 font-cyber text-xl font-black uppercase tracking-[0.2em] text-white">BakoMix AI</h2>
                    <p className="mt-1 font-mono-data text-[11px] tracking-[0.25em] text-[#7DD3FC] uppercase">{tri("Sistema online · voce attiva", "System online · Stimme aktiv", "System online · voice active", "Sistema en línea · voz activa", "Système en ligne · voix active", "سیستم آنلاین · صدا فعال")}</p>
                    <p className="mt-3 text-sm text-[#9fb3c4] max-w-md mx-auto">{tri("Parla in qualsiasi momento: l'orbita BakoMix in basso ascolta e governa. Detta ordini, chiedi aiuto, ottieni report — solo voce.", "Sprich jederzeit: die BakoMix-Orbit unten hört zu und steuert. Diktiere Befehle, frage nach Hilfe — nur Stimme.", "Speak anytime: the BakoMix orb below listens and governs. Dictate orders, ask for help, get reports — voice only.", "Habla cuando quieras: el orbe BakoMix escucha y gobierna. Dicta órdenes, pide ayuda — solo voz.", "Parle à tout moment : l'orbe BakoMix écoute et gouverne — voix seule.", "هر وقت خواستی حرف بزن: اوربیت BakoMix گوش می‌دهد و مدیریت می‌کند — فقط صدا.")}</p>
                  </div>
                </div>
                <BakemixGuide />
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
          <div className="fixed inset-0 z-50 bg-[#070A10] overflow-auto p-4"><div className="max-w-xl mx-auto py-5"><button onClick={() => setLegalOpen(false)} className="mb-4 text-sm font-semibold text-[#00F0FF]">← {tri("Chiudi", "Schließen", "Close", "Cerrar", "Fermer", "بستن")}</button><LegalPage /></div></div>
        )}
        {showPinLock && <PinLock onUnlock={() => { setFloorUnlocked(true); setShowPinLock(false); jumpTo("operatori"); }} />}
        {showBriefing && user && user.role === "admin" && <ShiftBriefing onClose={() => setShowBriefing(false)} />}
        {showOperator && <OperatoreSelect current={operator} onSelect={setOperator} onClose={() => setShowOperator(false)} />}

        <Toaster position="top-center" richColors />
        <BakoMixSense section={user ? "control" : "guida"} mode={activeZone === "operatori" ? "floor" : activeZone === "bakomix" ? "guida" : "lab"} isCapo={!!user} operator={operator} floorRole={floorRole} />
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
