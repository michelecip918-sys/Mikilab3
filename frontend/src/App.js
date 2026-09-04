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
import MohamedFloor from "@/components/MohamedFloor";
import BakemixGuide from "@/components/BakemixGuide";
import IntroLanding from "@/components/IntroLanding";
import AvatarHub from "@/components/AvatarHub";
import AdminGate from "@/components/AdminGate";
import LangSelector from "@/components/LangSelector";
import { mkTri } from "@/i18n/triMaps";
import { User, BookOpen, LayoutGrid, LifeBuoy, ShieldCheck, LogOut, Lock } from "lucide-react";

import Ricette from "@/sections/Ricette";
import Maestro from "@/sections/Maestro";
import SmartPlannerStressZero from "@/sections/SmartPlannerStressZero";

const PUB = process.env.PUBLIC_URL;
const SECTIONS = [
  { id: "ricette", label: "Ricette", Icon: BookOpen, avatar: "avatar_miki.jpg" },
  { id: "control", label: "MikiLab Control", Icon: LayoutGrid, avatar: "avatar_miki.jpg" },
  { id: "guida", label: "Guida & SOS", Icon: LifeBuoy, avatar: "avatar_bigmix.jpg" },
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
  const [screen, setScreen] = useState(() => { try { return localStorage.getItem("mikilab_admin_unlocked") === "1" ? "intro" : "admin"; } catch { return "admin"; } });
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("reset"));
  const [operator, setOperatorState] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_operator") || "null"); } catch { return null; } });
  const [showOperator, setShowOperator] = useState(false);
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
  useEffect(() => { if (user) setAuthOpen(false); }, [user, setAuthOpen]);

  if (screen === "admin" && !resetToken) return <AdminGate onUnlock={() => setScreen("intro")} />;
  if (screen === "intro" && !resetToken) return <IntroLanding onStart={() => setScreen("hub")} />;
  if (screen === "hub" && !resetToken) return <AvatarHub onSelect={handleHubSelect} />;
  if (screen === "pin" && !resetToken) return <PinLock onUnlock={() => { setLocked(false); setScreen("app"); }} />;

  const activeAvatar = (SECTIONS.find((s) => s.id === section) || SECTIONS[1]).avatar;

  return (
    <ProfileProvider><AmbientProvider><TimerProvider><SoundFXProvider><MixerTimersProvider><MachinesProvider>
      <div className="min-h-screen bg-[#030712] text-[#F8FAFC] font-sans selection:bg-[#14b8a6] selection:text-[#030712]">
        <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,#0f172a_0%,#030712_70%)] opacity-95">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#14b8a6]/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
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
                const active = section === s.id;
                return (
                  <button key={s.id} data-testid={`nav-${s.id}`} onClick={() => setSection(s.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${active ? "bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] shadow-md shadow-[#14b8a6]/20" : "text-[#94A3B8] hover:text-white"}`}>
                    <img src={`${PUB}/${s.avatar}`} alt="" className={`w-6 h-6 rounded-full object-cover object-top border ${active ? "border-[#030712]" : "border-[#334155]"}`} />
                    <span className="hidden sm:inline">{s.id === "ricette" ? tri("Ricette", "Rezepte", "Recipes", "Recetas", "Recettes", "دستورها") : s.id === "control" ? tri("MikiLab Control", "MikiLab Control", "MikiLab Control", "MikiLab Control", "MikiLab Control", "کنترل میکی‌لب") : tri("Guida & SOS", "Hilfe & SOS", "Guide & SOS", "Guía & SOS", "Guide & SOS", "راهنما و SOS")}</span>
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
                <SectionHead avatar="avatar_miki.jpg" title={tri("Ricette di MikiLab", "MikiLab Rezepte", "MikiLab Recipes", "Recetas de MikiLab", "Recettes de MikiLab", "دستورهای میکی‌لب")} sub={tri("Plancia del Capo: foto e ricette essenziali, coordinate dall'AI MikiLab.", "Chef-Konsole: Fotos und Kernrezepte, koordiniert von der MikiLab-KI.", "Capo's console: photos and core recipes, coordinated by MikiLab AI.", "Consola del Capo: fotos y recetas esenciales, coordinadas por la IA MikiLab.", "Console du Capo : photos et recettes clés, coordonnées par l'IA MikiLab.", "کنسول کاپو: عکس‌ها و دستورهای اصلی، هماهنگ با هوش مصنوعی.")} roleName="Michele" roleTag="Capo" />
                <Ricette />
              </div>
            )}

            {/* SEZIONE 2 — MIKILAB CONTROL */}
            {section === "control" && (
              <div className="space-y-5 animate-fadeIn" data-testid="section-control">
                <div className="flex items-center gap-1.5 bg-[#030712] p-1 rounded-xl border border-[#1e293b] max-w-md mx-auto">
                  <button data-testid="mode-lab-btn" onClick={() => { setActiveMode("lab"); setCurrentView("dashboard"); if (!user) { setAuthMode("login"); setAuthOpen(true); } }} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 ${activeMode === "lab" ? "bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712]" : "text-[#94A3B8] hover:text-white"}`}>{!user && <Lock className="w-3 h-3" />}🛡️ {tri("Capo · Lab Control", "Chef · Lab Control", "Capo · Lab Control", "Capo · Lab Control", "Capo · Lab Control", "کاپو · کنترل")}</button>
                  <button data-testid="mode-floor-btn" onClick={() => { setActiveMode("floor"); setCurrentView("dashboard"); if (pinIsLocked()) setScreen("pin"); }} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${activeMode === "floor" ? "bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712]" : "text-[#94A3B8] hover:text-white"}`}>⚡ {tri("Produzione · Floor", "Produktion · Floor", "Production · Floor", "Producción · Floor", "Production · Floor", "تولید · Floor")}</button>
                </div>

                {activeMode === "lab" ? (
                  !user ? (
                    <CapoGate onLogin={() => { setAuthMode("login"); setAuthOpen(true); }} onFloor={() => setActiveMode("floor")} tri={tri} />
                  ) : (
                  <div className="space-y-5" data-testid="lab-control-view">
                    <LabBriefing />
                    <SectionHead avatar="avatar_miki.jpg" title={tri("Plancia Capo", "Chef-Konsole", "Capo Console", "Consola Capo", "Console Capo", "کنسول کاپو")} sub={tri("Ricettario, piano, produzione e Ordini Extra con AI.", "Rezepte, Plan, Produktion und Extra-Aufträge mit KI.", "Recipe book, plan, production and Extra Orders with AI.", "Recetario, plan, producción y Pedidos Extra con IA.", "Recettes, plan, production et Commandes Extra avec l'IA.", "دستورها، برنامه، تولید و سفارش‌های اضافه با هوش مصنوعی.")} roleName="Michele" roleTag="Master Admin" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <LabCard testid="lab-nav-ricette" icon="🥖" title={tri("Master Ricettario", "Master-Rezepte", "Master Recipes", "Recetario Maestro", "Recettes Master", "دستور اصلی")} sub={tri("Ricette protette e conferma impastata.", "Geschützte Rezepte und Teig-Bestätigung.", "Protected recipes and batch confirmation.", "Recetas protegidas y confirmación de amasado.", "Recettes protégées et confirmation de pétrissage.", "دستورهای محافظت‌شده و تأیید خمیر.")} onClick={() => setCurrentView("ricette")} />
                      <LabCard testid="lab-nav-magazzino" icon="📦" title={tri("Magazzino & Scorte", "Lager & Bestand", "Warehouse & Stock", "Almacén & Stock", "Entrepôt & Stock", "انبار و موجودی")} sub={tri("Giacenze, soglie e autonomia.", "Bestände, Schwellen und Reichweite.", "Stock levels, thresholds and autonomy.", "Existencias, umbrales y autonomía.", "Stocks, seuils et autonomie.", "موجودی، آستانه‌ها و خودکفایی.")} onClick={() => setCurrentView("magazzino")} />
                      <LabCard testid="lab-nav-planner" icon="🗓️" title={tri("Smart Planner", "Smart Planner", "Smart Planner", "Smart Planner", "Smart Planner", "برنامه‌ریز هوشمند")} sub={tri("Piano con validazione vocale.", "Plan mit Sprachvalidierung.", "Plan with voice validation.", "Plan con validación por voz.", "Plan avec validation vocale.", "برنامه با تأیید صوتی.")} onClick={() => setCurrentView("planner")} />
                      <LabCard testid="lab-nav-ordini" icon="⚡" title={tri("Ordini Extra", "Extra-Aufträge", "Extra Orders", "Pedidos Extra", "Commandes Extra", "سفارش‌های اضافه")} sub={tri("AI rigenera il piano all'istante.", "KI erstellt den Plan sofort neu.", "AI regenerates the plan instantly.", "La IA regenera el plan al instante.", "L'IA régénère le plan à l'instant.", "هوش مصنوعی برنامه را فوری بازسازی می‌کند.")} onClick={() => setCurrentView("ordini")} accent />
                      <LabCard testid="lab-nav-iot" icon="⚙️" title={tri("Sistemi IoT", "IoT-Systeme", "IoT Systems", "Sistemas IoT", "Systèmes IoT", "سیستم‌های IoT")} sub={tri("Auto-setup periferiche e forni.", "Auto-Setup für Peripherie und Öfen.", "Auto-setup for peripherals and ovens.", "Auto-configuración de periféricos y hornos.", "Auto-configuration des périphériques et fours.", "پیکربندی خودکار تجهیزات و فرها.")} onClick={() => setCurrentView("maestro")} />
                    </div>
                    {currentView === "dashboard" && <DocsDownload />}
                    {currentView === "ricette" && <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b] space-y-4"><Ricette isMasterView={true} /></div>}
                    {currentView === "magazzino" && <div className="bg-[#0b0f19] p-5 rounded-xl border border-[#1e293b]"><MagazzinoManager /></div>}
                    {currentView === "planner" && <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b]"><SmartPlannerStressZero /></div>}
                    {currentView === "ordini" && <div className="bg-[#0b0f19] p-5 rounded-xl border border-[#1e293b]"><OrdiniExtra /></div>}
                    {currentView === "maestro" && <div className="space-y-4"><PeripheralSetup /><PinSetup /><div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b]"><Maestro /></div></div>}
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
                <SectionHead avatar="avatar_bigmix.jpg" title={tri("Guida, SOS & AI Assistant", "Hilfe, SOS & KI-Assistent", "Guide, SOS & AI Assistant", "Guía, SOS & Asistente IA", "Guide, SOS & Assistant IA", "راهنما، SOS و دستیار هوش مصنوعی")} sub={tri("Tutto sul laboratorio, le impostazioni e come usare il sito.", "Alles über die Backstube, Einstellungen und Nutzung.", "Everything about the lab, settings and how to use the site.", "Todo sobre el laboratorio, ajustes y cómo usar el sitio.", "Tout sur le labo, les réglages et l'usage du site.", "همه‌چیز درباره آزمایشگاه، تنظیمات و نحوه استفاده.")} roleName="Bakemix" roleTag="AI Assistant" />
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
