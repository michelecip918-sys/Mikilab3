import { useState, useEffect } from "react";
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
import { isLocked as pinIsLocked, lockNow as pinLockNow } from "@/lib/pinLock";
import VoiceCommand from "@/components/VoiceCommand";
import RadioFornaio from "@/components/RadioFornaio";
import ShiftScheduler from "@/components/ShiftScheduler";
import TalkWithMiki from "@/components/TalkWithMiki";
import AudioRouteIndicator from "@/components/AudioRouteIndicator";
import LegalPage from "@/sections/LegalPage";
import PeripheralSetup from "@/components/PeripheralSetup";
import MagazzinoManager from "@/components/MagazzinoManager";
import DocsDownload from "@/components/DocsDownload";
import ConfermaImpastata from "@/components/ConfermaImpastata";
import LabBriefing from "@/components/LabBriefing";
import AutoReport from "@/components/AutoReport";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthScreen from "@/components/AuthScreen";
import ResetPassword from "@/components/ResetPassword";
import OperatoreSelect from "@/components/OperatoreSelect";
import OrdiniExtra from "@/components/OrdiniExtra";
import PinSetup from "@/components/PinSetup";
import MamoAssistant from "@/components/MamoAssistant";
import OrdineCapo from "@/components/OrdineCapo";
import MohamedFloor from "@/components/MohamedFloor";
import BakoMixSense from "@/components/BakoMixSense";
import BakemixGuide from "@/components/BakemixGuide";
import IntroLanding from "@/components/IntroLanding";
import AvatarHub from "@/components/AvatarHub";
import AdminGate from "@/components/AdminGate";
import LangSelector from "@/components/LangSelector";
import { useDept, setDept } from "@/lib/dept";
import { recipesApi, warehouseApi, planApi, weeklyApi, floorPlanApi } from "@/lib/api";
import InstallApp from "@/components/InstallApp";
import { mkTri } from "@/i18n/triMaps";
import { User, BookOpen, LayoutGrid, LifeBuoy, ShieldCheck, LogOut, Lock, WifiOff } from "lucide-react";

import Ricette from "@/sections/Ricette";
import Maestro from "@/sections/Maestro";
import SmartPlannerStressZero from "@/sections/SmartPlannerStressZero";

const PUB = process.env.PUBLIC_URL;
const SECTIONS = [
  { id: "capo", kind: "lab", avatar: "avatar_miki.jpg" },
  { id: "mohamed", kind: "floor", avatar: "avatar_mohamed.jpg" },
  { id: "bakemix", kind: "guida", avatar: "avatar_bigmix.jpg" },
];

function LabCard({ testid, icon, title, sub, onClick, accent }) {
  return (
    <button data-testid={testid} onClick={onClick} className={`p-4 rounded-xl bg-[#0b0f19] border ${accent ? "border-[#14b8a6]/40" : "border-[#1e293b]"} hover:border-[#14b8a6] text-left transition-all group`}>
      <div className="text-xl mb-2">{icon}</div>
      <h3 className="font-bold text-sm text-white group-hover:text-[#14b8a6]">{title}</h3>
      <p className="text-[11px] text-[#94A3B8] mt-1">{sub}</p>
    </button>
  );
}

export default function App() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const { user, authOpen, setAuthOpen, logout } = useAuth();

  const [section, setSection] = useState("control");
  const [activeMode, setActiveMode] = useState("floor");
  const [currentView, setCurrentView] = useState("dashboard");
  const [locked, setLocked] = useState(() => pinIsLocked());
  const [legalOpen, setLegalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const capoDept = useDept();
  const setCapoDept = setDept;
  const [screen, setScreen] = useState(() => {
    try {
      const unlocked = localStorage.getItem("mikilab_admin_unlocked") === "1";
      if (!unlocked) return "admin";
      // Utente di ritorno (gate già sbloccato) → salta la schermata "Inizia", vai all'hub.
      const seenIntro = localStorage.getItem("mikilab_seen_intro") === "1";
      return seenIntro ? "hub" : "intro";
    } catch { return "admin"; }
  });
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("reset"));
  const [operator, setOperatorState] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_operator") || "null"); } catch { return null; } });
  const [showOperator, setShowOperator] = useState(false);
  const [floorRole, setFloorRole] = useState(() => { try { return localStorage.getItem("mikilab_role") || ""; } catch { return ""; } });
  const [online, setOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [glassLevel, setGlassLevel] = useState(() => { try { const v = Number(localStorage.getItem("mikilab_glass_level")); return Number.isFinite(v) && v > 0 ? v : 62; } catch { return 62; } });
  useEffect(() => { const h = (e) => setGlassLevel(e.detail); window.addEventListener("mikilab-glass-changed", h); return () => window.removeEventListener("mikilab-glass-changed", h); }, []);
  const bgOpacity = Math.max(0.12, Math.min(0.95, 0.12 + (glassLevel / 100) * 0.83));
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
    // Pre-cache dell'archivio ricette su IndexedDB per l'uso 100% offline (best-effort).
    const warm = () => { if (navigator.onLine) { recipesApi.list("mikilab"); if (user) recipesApi.list("personal"); } };
    warm();
    window.addEventListener("online", warm);
    return () => window.removeEventListener("online", warm);
  }, [user]);
  useEffect(() => {
    // SINCRONIZZAZIONE AL RITORNO: quando la rete torna, ricarica e riallinea tutto (magazzino,
    // piani, coda del Floor) dal server, ri-scaldando la cache IndexedDB e notificando le viste aperte.
    const resync = () => {
      Promise.allSettled([
        recipesApi.list("mikilab"),
        warehouseApi.list(),
        planApi.get(),
        weeklyApi.get(),
        floorPlanApi.get(),
      ]).then(() => {
        try { window.dispatchEvent(new Event("mikilab-floor-plan-updated")); } catch { /* */ }
        try { window.dispatchEvent(new Event("mikilab-warehouse-changed")); } catch { /* */ }
        toast.success(tri("Riconnesso · dati aggiornati dal server.", "Wieder online · Daten aktualisiert.", "Back online · data synced from server.", "Reconectado · datos actualizados.", "Reconnecté · données synchronisées.", "دوباره آنلاین · داده‌ها همگام شد."));
      });
    };
    window.addEventListener("online", resync);
    return () => window.removeEventListener("online", resync);
  }, [tri]);
  const setOperator = (op) => { try { localStorage.setItem("mikilab_operator", JSON.stringify(op)); } catch { /* */ } setOperatorState(op); setShowOperator(false); };

  // Selezione dall'hub avatar → apre la sezione giusta (Capo=login, Mohamed=PIN produzione, Bakemix=libero).
  const handleHubSelect = (kind) => {
    if (kind === "lab") { setSection("control"); setActiveMode("lab"); setCurrentView("dashboard"); setScreen("app"); if (!user) { setAuthMode("login"); setAuthOpen(true); } }
    else if (kind === "floor") { setSection("control"); setActiveMode("floor"); setCurrentView("dashboard"); if (pinIsLocked()) setScreen("pin"); else setScreen("app"); }
    else { setSection("guida"); setScreen("app"); }
  };

  useEffect(() => {
    const onLock = () => { pinLockNow(); setLocked(true); };
    window.addEventListener("mikilab-lock", onLock);
    return () => window.removeEventListener("mikilab-lock", onLock);
  }, []);
  useEffect(() => {
    const h = (e) => { setAuthMode((e && e.detail && e.detail.mode) || "login"); setAuthOpen(true); };
    window.addEventListener("mikilab-open-auth", h);
    return () => window.removeEventListener("mikilab-open-auth", h);
  }, [setAuthOpen]);
  useEffect(() => { if (user) { setAuthOpen(false); try { localStorage.setItem("mikilab_seen_intro", "1"); } catch { /* */ } } }, [user, setAuthOpen]);

  // GHOST MODE: link d'invito (?invite=) → apre direttamente la registrazione gated.
  useEffect(() => {
    try {
      const inv = new URLSearchParams(window.location.search).get("invite");
      if (inv && !user) { setAuthMode("register"); setAuthOpen(true); }
    } catch { /* */ }
  }, [user, setAuthOpen]);

  if (authOpen && !user && !resetToken) return <div className="fixed inset-0 z-[70] bg-[#030712] overflow-auto"><AuthScreen onClose={() => setAuthOpen(false)} initialMode={authMode} /></div>;
  if (screen === "admin" && !resetToken) return <AdminGate onUnlock={() => setScreen("intro")} />;
  if (screen === "intro" && !resetToken) return <IntroLanding onStart={() => { try { localStorage.setItem("mikilab_seen_intro", "1"); } catch { /* */ } setScreen("hub"); }} onRegister={() => { setAuthMode("register"); setAuthOpen(true); }} />;
  if (screen === "hub" && !resetToken) return <AvatarHub onSelect={handleHubSelect} isLoggedIn={!!user} onLogin={() => { setAuthMode("login"); setAuthOpen(true); }} />;
  if (screen === "pin" && !resetToken) return <PinLock onUnlock={() => { setLocked(false); setScreen("app"); }} />;

  const activeAvatar = (SECTIONS.find((s) => s.id === section) || SECTIONS[1]).avatar;

  // Sfondo tematico per sezione (Capo=sala comandi, Mohamed=laboratorio, BakemixAI=olografico).
  const bgTheme = section === "guida" ? "bakemix" : (section === "control" && activeMode === "floor") ? "mohamed" : "capo";
  const mohStation = (() => {
    const r = (floorRole || "").toLowerCase();
    if (!r) return null;
    // Postazioni "hot": forno, cottura, abbattitore
    if (/forn|sfornat|abbattitore|raffredda|cottura|pizza|pizze|arrosti|griglia/.test(r)) return "forno";
    // Postazioni impasto/fermentazione/planetaria
    if (/impast|fermentaz|planetari|spiral|lievit|farin/.test(r)) return "impasto";
    // Laugen / pretzel
    if (/laugen|pretzel|brezel/.test(r)) return "laugen";
    // Banco/pasticceria/decorazioni/confezionamento (fallback esplicito)
    if (/banco|pasticc|decor|glass|cioccolat|gelat|confezion|pack|vetrina|bilanci|dolc/.test(r)) return "banco";
    return "banco";
  })();
  const bgSrc = bgTheme === "mohamed" && mohStation ? `${PUB}/bg-st-${mohStation}.jpg` : `${PUB}/bg-${bgTheme}.jpg`;
  const roleTint = (() => {
    const r = (floorRole || "").toLowerCase();
    if (/pizza|forno pizze|sfornate|consegne/.test(r)) return "#3E9C93";        // Pizzeria
    if (/pasticc|gelat|bilanci|abbattitore|raffredda/.test(r)) return "#7FB0A6"; // Pasticceria
    if (/apprendista|bancon|aiuto/.test(r)) return "#f59e0b";                    // Generale
    return "#5E8CA8";                                                            // Panetteria
  })();

  return (
    <ProfileProvider><AmbientProvider><TimerProvider><SoundFXProvider><MixerTimersProvider><MachinesProvider>
      <div className="min-h-screen bg-[#030712] text-[#F8FAFC] font-sans selection:bg-[#14b8a6] selection:text-[#030712]">
        <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,#0f172a_0%,#030712_70%)]">
          {/* Sfondo immersivo tematico della sezione attiva (per Mohamed cambia per postazione) */}
          <img key={bgSrc} src={bgSrc} alt="" className="absolute inset-0 w-full h-full object-cover animate-fadeIn" style={{ opacity: bgOpacity }} />
          {/* Overlay antracite: contrasto sul testo senza appiattire l'immagine */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/40 via-[#050b17]/55 to-[#030712]/88" />
          {/* Vetro antracite: sheen radiale per dare profondità (mai piatto) */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(130% 80% at 50% -10%, rgba(94,140,168,0.15), transparent 55%)" }} />
          {bgTheme === "mohamed" && (
            <div className="absolute inset-0 transition-colors duration-700" style={{ background: `radial-gradient(120% 70% at 50% 0%, ${roleTint}2e, transparent 60%)` }} />
          )}
          {/* Griglia geometrica nitida che svanisce verso il basso (effetto tech industriale) */}
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(to right, rgba(94,234,212,0.11) 1px, transparent 1px), linear-gradient(to bottom, rgba(94,234,212,0.11) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "linear-gradient(to bottom, #000 0%, #000 42%, transparent 88%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 42%, transparent 88%)",
          }} />
          {/* Micro-griglia circuito, densa in alto */}
          <div className="absolute inset-0 opacity-50" style={{
            backgroundImage: "linear-gradient(to right, rgba(51,65,85,0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(51,65,85,0.28) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
            maskImage: "radial-gradient(120% 85% at 50% 0%, #000, transparent 68%)",
            WebkitMaskImage: "radial-gradient(120% 85% at 50% 0%, #000, transparent 68%)",
          }} />
          {/* Bagliori d'accento (profondità cromatica) */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#14b8a6]/12 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-[-60px] w-[420px] h-[260px] bg-[#5E8CA8]/10 blur-[130px] rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          {!online && (
            <div data-testid="offline-badge" className="fixed top-[118px] left-1/2 -translate-x-1/2 z-[60] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/50 text-amber-300 text-[11px] font-bold backdrop-blur-md shadow-lg animate-fadeIn">
              <WifiOff className="w-3.5 h-3.5" /> {tri("Offline · archivio locale", "Offline · lokales Archiv", "Offline · local archive", "Sin conexión · archivo local", "Hors ligne · archive locale", "آفلاین · بایگانی محلی")}
            </div>
          )}
          {/* HEADER */}
          <header className="border-b border-[#1e293b] bg-[#0b0f19]/80 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button data-testid="hub-home-btn" onClick={() => setScreen("hub")} title="Hub" className="w-11 h-11 rounded-xl overflow-hidden border border-[#14b8a6]/40 shadow-lg shadow-[#14b8a6]/20 bg-[#030712] active:scale-95 transition-all">
                  <img src={`${PUB}/logo-emblem.png`} alt="MikiLab" className="w-full h-full object-contain" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-2 whitespace-nowrap">MikiLab <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/30">Cyber OS</span></h1>
                  <p className="hidden sm:block text-[10px] text-[#94A3B8]">Laboratorio Panificazione Avanzata</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs relative">
                <LangSelector testid="header-lang" />
                <InstallApp variant="chip" />
                <button data-testid="operatore-chip" onClick={() => setShowOperator(true)} className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-[#0f172a] border border-[#1e293b] text-white hover:border-[#14b8a6] active:scale-95 transition-all" title="Cambia operatore">
                  {operator && <img src={`${PUB}/${operator.img}`} alt={operator.name} className="w-6 h-6 rounded-full object-cover object-top border border-[#14b8a6]/50" />}
                  <span className="font-bold hidden sm:inline">{operator ? operator.name : tri("Operatore", "Bediener", "Operator", "Operario", "Opérateur", "اپراتور")}</span>
                </button>
                <button data-testid="account-btn" onClick={() => { if (user) { setShowAccountMenu((v) => !v); } else { setAuthMode("login"); setAuthOpen(true); } }} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold active:scale-95 transition-all border ${user ? "bg-[#14b8a6]/15 border-[#14b8a6]/50 text-[#14b8a6]" : "bg-[#14b8a6]/10 border-[#14b8a6]/30 text-[#14b8a6] hover:bg-[#14b8a6]/20"}`}>
                  {user ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}{user ? (user.name || (user.email ? user.email.split("@")[0].slice(0, 10) : "Capo")) : tri("Accedi", "Anmelden", "Sign in", "Acceder", "Connexion", "ورود")}
                </button>
                {user && showAccountMenu && (
                  <div data-testid="account-menu" className="absolute right-0 top-11 w-56 rounded-xl bg-[#0b0f19] border border-[#1e293b] shadow-2xl p-3 z-[80]">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#14b8a6] mb-1"><ShieldCheck className="w-3.5 h-3.5" /> {tri("CAPO · MASTER ADMIN", "CHEF · MASTER ADMIN", "CAPO · MASTER ADMIN", "CAPO · MASTER ADMIN", "CAPO · MASTER ADMIN", "کاپو · مدیر ارشد")}</div>
                    <p className="text-[11px] text-white font-semibold truncate">{user.name || "Capo"}</p>
                    {user.email && <p className="text-[10px] text-[#94A3B8] truncate mb-2">{user.email}</p>}
                    <button data-testid="logout-btn" onClick={async () => { await logout(); setShowAccountMenu(false); setActiveMode("floor"); toast.success(tri("Sei uscito. Sessione Capo chiusa.", "Abgemeldet. Chef-Sitzung beendet.", "Signed out. Capo session closed.", "Has salido. Sesión Capo cerrada.", "Déconnecté. Session Capo fermée.", "خارج شدی. جلسه کاپو بسته شد.")); }} className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-[#0f172a] border border-[#1e293b] text-[#f87171] font-bold text-xs hover:border-[#f87171]/50 active:scale-95 transition-all">
                      <LogOut className="w-3.5 h-3.5" /> {tri("Esci dall'account Capo", "Chef-Konto verlassen", "Sign out of Capo account", "Salir de la cuenta Capo", "Quitter le compte Capo", "خروج از حساب کاپو")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* NAV 3 SEZIONI (One-Page) */}
          <div className="bg-[#0b0f19]/90 border-b border-[#1e293b] px-4 py-2 sticky top-[65px] z-40 backdrop-blur-md">
            <div className="max-w-4xl mx-auto flex items-center gap-2">
              {SECTIONS.map((s) => {
                const active = s.kind === "guida" ? section === "guida" : section === "control" && activeMode === (s.kind === "lab" ? "lab" : "floor");
                const label = s.id === "capo" ? "MikiLab" : s.id === "mohamed" ? "Mohamed" : "BakemixAI";
                return (
                  <button key={s.id} data-testid={`nav-${s.id}`} onClick={() => handleHubSelect(s.kind)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${active ? "bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] shadow-md shadow-[#14b8a6]/20" : "text-[#94A3B8] hover:text-white"}`}>
                    <img src={`${PUB}/${s.avatar}`} alt="" className={`w-6 h-6 rounded-full object-cover object-top border ${active ? "border-[#030712]" : "border-[#334155]"}`} />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <main className="flex-1 max-w-4xl w-full mx-auto p-4 pb-32">
            <ErrorBoundary resetKey={`${section}-${activeMode}-${currentView}`}>

            {/* SEZIONE 1 — RICETTE */}
            {section === "ricette" && (
              <div className="space-y-4 animate-fadeIn" data-testid="section-ricette">
                <SectionHead avatar="avatar_miki.jpg" title={tri("Ricette di MikiLab", "MikiLab Rezepte", "MikiLab Recipes", "Recetas de MikiLab", "Recettes de MikiLab", "دستورهای میکی‌لب")} sub={tri("Plancia del Capo: foto e ricette essenziali, coordinate dall'AI MikiLab.", "Chef-Konsole: Fotos und Kernrezepte, koordiniert von der MikiLab-KI.", "Capo's console: photos and core recipes, coordinated by MikiLab AI.", "Consola del Capo: fotos y recetas esenciales, coordinadas por la IA MikiLab.", "Console du Capo : photos et recettes clés, coordonnées par l'IA MikiLab.", "کنسول کاپو: عکس‌ها و دستورهای اصلی، هماهنگ با هوش مصنوعی.")} roleName="MikiLab" roleTag="Capo" />
                <Ricette />
              </div>
            )}

            {/* SEZIONE 2 — MIKILAB CONTROL */}
            {section === "control" && (
              <div className="space-y-5 animate-fadeIn" data-testid="section-control">
                {activeMode === "lab" ? (
                  !user ? (
                    <CapoGate onLogin={() => { setAuthMode("login"); setAuthOpen(true); }} onFloor={() => setActiveMode("floor")} tri={tri} />
                  ) : (
                  <div className="space-y-5" data-testid="lab-control-view">
                    <LabBriefing />
                    <SectionHead avatar="avatar_miki.jpg" title={tri("Plancia Capo", "Chef-Konsole", "Capo Console", "Consola Capo", "Console Capo", "کنسول کاپو")} sub={tri("Ricettario, piano, produzione e Ordini Extra con AI.", "Rezepte, Plan, Produktion und Extra-Aufträge mit KI.", "Recipe book, plan, production and Extra Orders with AI.", "Recetario, plan, producción y Pedidos Extra con IA.", "Recettes, plan, production et Commandes Extra avec l'IA.", "دستورها، برنامه، تولید و سفارش‌های اضافه با هوش مصنوعی.")} roleName="MikiLab" roleTag="Master Admin" />
                    <div data-testid="capo-dept-switch" className="flex items-center gap-1.5 bg-[#030712] p-1 rounded-xl border border-[#1e293b] overflow-x-auto">
                      {[["panificazione", "🍞", tri("Panificazione", "Bäckerei", "Bakery", "Panadería", "Boulangerie", "نانوایی")], ["pizzeria", "🍕", "Pizzeria"], ["pasticceria", "🥐", tri("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "قنادی")], ["tutti", "👑", tri("Tutti", "Alle", "All", "Todos", "Tous", "همه")]].map(([k, ic, lb]) => (
                        <button key={k} data-testid={`capo-dept-${k}`} onClick={() => setCapoDept(k)} className={`flex-1 whitespace-nowrap py-2 px-3 rounded-lg text-xs font-bold transition-all ${capoDept === k ? "bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712]" : "text-[#94A3B8] hover:text-white"}`}>{ic} {lb}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <LabCard testid="lab-nav-ordine" icon="🧭" title={tri("Ordine & Piano", "Auftrag & Plan", "Order & Plan", "Pedido & Plan", "Commande & Plan", "سفارش و برنامه")} sub={tri("Detta l'ordine, piano a ritroso a Mohamed.", "Auftrag diktieren, Rückwärtsplan an Mohamed.", "Dictate the order, backwards plan to Mohamed.", "Dicta el pedido, plan a Mohamed.", "Dicte la commande, plan à Mohamed.", "سفارش را بگو، برنامه به محمد.")} onClick={() => setCurrentView("ordine-capo")} accent />
                      <LabCard testid="lab-nav-ricette" icon="🥖" title={tri("Master Ricettario", "Master-Rezepte", "Master Recipes", "Recetario Maestro", "Recettes Master", "دستور اصلی")} sub={tri("Ricette protette e conferma impastata.", "Geschützte Rezepte und Teig-Bestätigung.", "Protected recipes and batch confirmation.", "Recetas protegidas y confirmación de amasado.", "Recettes protégées et confirmation de pétrissage.", "دستورهای محافظت‌شده و تأیید خمیر.")} onClick={() => setCurrentView("ricette")} />
                      <LabCard testid="lab-nav-magazzino" icon="📦" title={tri("Magazzino & Scorte", "Lager & Bestand", "Warehouse & Stock", "Almacén & Stock", "Entrepôt & Stock", "انبار و موجودی")} sub={tri("Giacenze, soglie e autonomia.", "Bestände, Schwellen und Reichweite.", "Stock levels, thresholds and autonomy.", "Existencias, umbrales y autonomía.", "Stocks, seuils et autonomie.", "موجودی، آستانه‌ها و خودکفایی.")} onClick={() => setCurrentView("magazzino")} />
                      <LabCard testid="lab-nav-planner" icon="🗓️" title={tri("Smart Planner", "Smart Planner", "Smart Planner", "Smart Planner", "Smart Planner", "برنامه‌ریز هوشمند")} sub={tri("Piano con validazione vocale.", "Plan mit Sprachvalidierung.", "Plan with voice validation.", "Plan con validación por voz.", "Plan avec validation vocale.", "برنامه با تأیید صوتی.")} onClick={() => setCurrentView("planner")} />
                      <LabCard testid="lab-nav-ordini" icon="⚡" title={tri("Ordini Extra", "Extra-Aufträge", "Extra Orders", "Pedidos Extra", "Commandes Extra", "سفارش‌های اضافه")} sub={tri("AI rigenera il piano all'istante.", "KI erstellt den Plan sofort neu.", "AI regenerates the plan instantly.", "La IA regenera el plan al instante.", "L'IA régénère le plan à l'instant.", "هوش مصنوعی برنامه را فوری بازسازی می‌کند.")} onClick={() => setCurrentView("ordini")} accent />
                      <LabCard testid="lab-nav-pin" icon="🔒" title={tri("PIN Produzione", "Produktions-PIN", "Production PIN", "PIN Producción", "PIN Production", "پین تولید")} sub={tri("Imposta il PIN del team per la produzione.", "Team-PIN für die Produktion festlegen.", "Set the team PIN for production.", "Fija el PIN del equipo.", "Définis le PIN de l'équipe.", "پین تیم را تنظیم کن.")} onClick={() => setCurrentView("pinsetup")} />
                    </div>
                    {currentView === "dashboard" && <DocsDownload />}
                    {currentView === "ordine-capo" && <div className="bg-[#0b0f19] p-5 rounded-xl border border-[#1e293b]"><OrdineCapo /></div>}
                    {currentView === "ricette" && <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b] space-y-4"><Ricette isMasterView={true} /></div>}
                    {currentView === "magazzino" && <div className="bg-[#0b0f19] p-5 rounded-xl border border-[#1e293b]"><MagazzinoManager /></div>}
                    {currentView === "planner" && <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b]"><SmartPlannerStressZero /></div>}
                    {currentView === "ordini" && <div className="bg-[#0b0f19] p-5 rounded-xl border border-[#1e293b]"><OrdiniExtra /></div>}
                    {currentView === "pinsetup" && <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b]"><PinSetup /></div>}
                  </div>
                  )
                ) : (
                  <div className="space-y-5" data-testid="floor-mode-view">
                    <MohamedFloor />
                  </div>
                )}
              </div>
            )}

            {/* SEZIONE 3 — GUIDA, SOS & AI */}
            {section === "guida" && (
              <div className="space-y-4 animate-fadeIn" data-testid="section-guida">
                <SectionHead avatar="avatar_bigmix.jpg" title={tri("Guida, SOS & AI Assistant", "Hilfe, SOS & KI-Assistent", "Guide, SOS & AI Assistant", "Guía, SOS & Asistente IA", "Guide, SOS & Assistant IA", "راهنما، SOS و دستیار هوش مصنوعی")} sub={tri("Tutto sul laboratorio, le impostazioni e come usare il sito.", "Alles über die Backstube, Einstellungen und Nutzung.", "Everything about the lab, settings and how to use the site.", "Todo sobre el laboratorio, ajustes y cómo usar el sitio.", "Tout sur le labo, les réglages et l'usage du site.", "همه‌چیز درباره آزمایشگاه، تنظیمات و نحوه استفاده.")} roleName="BakemixAI" roleTag="AI Assistant" />
                <BakemixGuide />
              </div>
            )}

            </ErrorBoundary>
          </main>

          <footer className="mt-auto border-t border-[#1e293b] py-6 px-4 bg-[#030712]">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
              <p>MikiLab · mikilab.de — Cyber-Industrial OS</p>
              <button onClick={() => setLegalOpen(true)} className="hover:text-[#14b8a6] transition-colors">Impressum & Datenschutz</button>
            </div>
          </footer>
        </div>

        {legalOpen && (
          <div className="fixed inset-0 z-50 bg-[#030712] overflow-auto p-4"><div className="max-w-xl mx-auto py-5"><button onClick={() => setLegalOpen(false)} className="mb-4 text-sm font-semibold text-[#14b8a6]">← Chiudi</button><LegalPage /></div></div>
        )}
        {authOpen && !user && <div className="fixed inset-0 z-[70] bg-[#030712] overflow-auto"><AuthScreen onClose={() => setAuthOpen(false)} initialMode={authMode} /></div>}
        {resetToken && <ResetPassword token={resetToken} onDone={() => { setResetToken(null); setAuthOpen(true); }} />}
        {showOperator && <OperatoreSelect current={operator} onSelect={setOperator} onClose={() => setShowOperator(false)} />}

        <Toaster position="top-center" richColors />
        <BakoMixSense
          section={section}
          mode={section === "control" ? activeMode : "guida"}
          isCapo={!!user}
          operator={operator}
          floorRole={floorRole}
        />
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

function CapoGate({ onLogin, onFloor, tri }) {
  return (
    <div data-testid="capo-gate" className="relative overflow-hidden rounded-2xl bg-[#0b0f19] border border-[#14b8a6]/30 shadow-2xl p-6 sm:p-8 text-center animate-fadeIn">
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#14b8a6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#030712] border border-[#14b8a6]/40 flex items-center justify-center mb-4 shadow-lg shadow-[#14b8a6]/20">
          <ShieldCheck className="w-8 h-8 text-[#14b8a6]" />
        </div>
        <h2 className="text-lg font-extrabold text-white">{tri("Accesso Capo riservato", "Chef-Zugang reserviert", "Capo access reserved", "Acceso Capo reservado", "Accès Capo réservé", "دسترسی کاپو محفوظ است")}</h2>
        <p className="text-xs text-[#94A3B8] mt-2 max-w-md mx-auto">
          {tri("La ", "Die ", "The ", "El ", "Le ", "")}<span className="text-[#14b8a6] font-bold">Lab Control</span>{tri(" è la plancia del Capo: ricettario protetto, piano di produzione, magazzino e Ordini Extra con l'AI. Accedi con Google o email per gestire il laboratorio; il team resta in Produzione · Floor con il PIN.",
            " ist die Chef-Konsole: geschützte Rezepte, Produktionsplan, Lager und Extra-Aufträge mit KI. Melde dich mit Google oder E-Mail an; das Team bleibt in Produktion · Floor mit PIN.",
            " is the Capo's console: protected recipes, production plan, warehouse and AI Extra Orders. Sign in with Google or email to run the lab; the team stays in Production · Floor with the PIN.",
            " es la consola del Capo: recetas protegidas, plan de producción, almacén y Pedidos Extra con IA. Accede con Google o email; el equipo usa Producción · Floor con el PIN.",
            " est la console du Capo : recettes protégées, plan de production, entrepôt et Commandes Extra avec l'IA. Connecte-toi avec Google ou e-mail ; l'équipe reste en Production · Floor avec le PIN.",
            " کنسول کاپو است: دستورهای محافظت‌شده، برنامه تولید، انبار و سفارش‌های اضافه با هوش مصنوعی. با گوگل یا ایمیل وارد شو؛ تیم با PIN در بخش تولید می‌ماند.")}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button data-testid="capo-gate-login" onClick={onLogin} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] font-black text-sm shadow-md shadow-[#14b8a6]/30 active:scale-95 transition-all">
            <ShieldCheck className="w-4 h-4" /> {tri("Accedi come Capo", "Als Chef anmelden", "Sign in as Capo", "Acceder como Capo", "Se connecter comme Capo", "ورود به‌عنوان کاپو")}
          </button>
          <button data-testid="capo-gate-floor" onClick={onFloor} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0f172a] border border-[#1e293b] text-[#94A3B8] font-bold text-sm hover:text-white hover:border-[#14b8a6]/40 active:scale-95 transition-all">
            ⚡ {tri("Vai a Produzione · Floor", "Zu Produktion · Floor", "Go to Production · Floor", "Ir a Producción · Floor", "Aller à Production · Floor", "برو به تولید · Floor")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ avatar, title, sub, roleName, roleTag, amber }) {
  return (
    <div className="p-4 rounded-2xl bg-[#0b0f19] border border-[#1e293b] shadow-xl relative overflow-hidden flex items-center justify-between gap-3">
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#14b8a6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-center gap-3 min-w-0">
        <img src={`${PUB}/${avatar}`} alt="" className={`w-12 h-12 rounded-xl object-cover object-top border ${amber ? "border-amber-500" : "border-[#14b8a6]"}`} />
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-[#14b8a6] truncate">{title}</h2>
          <p className="text-xs text-[#94A3B8]">{sub}</p>
        </div>
      </div>
      {roleName && (
        <div className="hidden sm:block text-right shrink-0">
          <p className="text-[11px] font-bold text-white">{roleName}</p>
          <p className={`text-[9px] ${amber ? "text-amber-400" : "text-[#14b8a6]"}`}>{roleTag}</p>
        </div>
      )}
    </div>
  );
}
