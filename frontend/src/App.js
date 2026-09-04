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

// Componenti di sistema
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
import { User } from "lucide-react";

// Viste principali
import Ricette from "@/sections/Ricette";
import Maestro from "@/sections/Maestro";
import SmartPlannerStressZero from "@/sections/SmartPlannerStressZero";

export default function App() {
  const { lang } = useLang();
  const { user, authOpen, setAuthOpen } = useAuth();

  const [activeMode, setActiveMode] = useState("floor");
  const [currentView, setCurrentView] = useState("dashboard");
  const [locked, setLocked] = useState(() => pinIsLocked());
  const [legalOpen, setLegalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("reset"));
  const [operator, setOperatorState] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_operator") || "null"); } catch { return null; } });
  const [showOperator, setShowOperator] = useState(false);
  const setOperator = (op) => { try { localStorage.setItem("mikilab_operator", JSON.stringify(op)); } catch { /* */ } setOperatorState(op); setShowOperator(false); };

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

  if (locked && !resetToken) {
    return <PinLock onUnlock={() => setLocked(false)} />;
  }

  if (!operator && !resetToken) {
    return <OperatoreSelect onSelect={setOperator} />;
  }

  return (
    <ProfileProvider>
    <AmbientProvider>
    <TimerProvider>
    <SoundFXProvider>
    <MixerTimersProvider>
    <MachinesProvider>
      <div className="min-h-screen bg-[#030712] text-[#F8FAFC] font-sans selection:bg-[#14b8a6] selection:text-[#030712]">

        {/* SFONDO OLOGRAFICO CYBER-INDUSTRIAL */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,#0f172a_0%,#030712_70%)] opacity-95">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#14b8a6]/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">

          {/* HEADER CON NUOVO LOGO EMBLEMA */}
          <header className="border-b border-[#1e293b] bg-[#0b0f19]/80 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#14b8a6]/40 shadow-lg shadow-[#14b8a6]/20 bg-[#030712]">
                  <img src={`${process.env.PUBLIC_URL}/logo-emblem.png`} alt="MikiLab" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-2">
                    MikiLab <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/30">Cyber OS</span>
                  </h1>
                  <p className="text-[10px] text-[#94A3B8]">Laboratorio Panificazione Avanzata</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  data-testid="operatore-chip"
                  onClick={() => setShowOperator(true)}
                  className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-[#0f172a] border border-[#1e293b] text-white hover:border-[#14b8a6] active:scale-95 transition-all"
                  title="Cambia operatore"
                >
                  {operator && <img src={`${process.env.PUBLIC_URL}/${operator.img}`} alt={operator.name} className="w-6 h-6 rounded-full object-cover object-top border border-[#14b8a6]/50" />}
                  <span className="font-bold hidden sm:inline">{operator ? operator.name : "Operatore"}</span>
                </button>
                <button
                  data-testid="account-btn"
                  onClick={() => { setAuthMode("login"); setAuthOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14b8a6]/10 border border-[#14b8a6]/30 text-[#14b8a6] font-bold hover:bg-[#14b8a6]/20 active:scale-95 transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  {user ? (user.email ? user.email.split("@")[0].slice(0, 10) : "Account") : "Accedi"}
                </button>
              </div>
            </div>
          </header>

          {/* SELETTORE MODALITÀ */}
          <div className="bg-[#0b0f19]/90 border-b border-[#1e293b] px-4 py-2.5 sticky top-[65px] z-40 backdrop-blur-md">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 bg-[#030712] p-1 rounded-xl border border-[#1e293b] w-full max-w-md">
                <button data-testid="mode-lab-btn" onClick={() => { setActiveMode("lab"); setCurrentView("dashboard"); }}
                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeMode === 'lab' ? 'bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] shadow-md shadow-[#14b8a6]/20' : 'text-[#94A3B8] hover:text-white'}`}>
                  🛡️ Lab Control
                </button>
                <button data-testid="mode-floor-btn" onClick={() => { setActiveMode("floor"); setCurrentView("dashboard"); }}
                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeMode === 'floor' ? 'bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] shadow-md shadow-[#14b8a6]/20' : 'text-[#94A3B8] hover:text-white'}`}>
                  ⚡ Floor Mode
                </button>
              </div>
            </div>
          </div>

          {/* CORPO PRINCIPALE */}
          <main className="flex-1 max-w-4xl w-full mx-auto p-4 pb-32">
            <ErrorBoundary resetKey={`${activeMode}-${currentView}`} lang={lang}>

            {activeMode === 'lab' ? (
              /* ================= LAB CONTROL (Michele) ================= */
              <div className="space-y-6 animate-fadeIn" data-testid="lab-control-view">
                <LabBriefing />
                <div className="p-5 rounded-2xl bg-[#0b0f19] border border-[#1e293b] shadow-2xl relative overflow-hidden flex items-center justify-between">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#14b8a6]/10 rounded-full blur-3xl pointer-events-none" />
                  <div>
                    <h2 className="text-base font-extrabold text-[#14b8a6] flex items-center gap-2"><span>🛡️</span> Lab Control</h2>
                    <p className="text-xs text-[#94A3B8] mt-1">Plancia amministrativa master con briefing vocale scorte e gestione logistica.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-[#030712]/80 border border-[#1e293b] px-2.5 py-1.5 rounded-xl">
                    <img src={`${process.env.PUBLIC_URL}/avatar_miki.jpg`} alt="Michele" className="w-9 h-9 rounded-full object-cover object-top border border-[#14b8a6]" />
                    <div className="hidden sm:block">
                      <p className="text-[11px] font-bold text-white">Michele</p>
                      <p className="text-[9px] text-[#14b8a6]">Master Admin</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button data-testid="lab-nav-ricette" onClick={() => setCurrentView("ricette")} className="p-4 rounded-xl bg-[#0b0f19] border border-[#1e293b] hover:border-[#14b8a6] text-left transition-all group">
                    <div className="text-xl mb-2">🥖</div>
                    <h3 className="font-bold text-sm text-white group-hover:text-[#14b8a6]">Master Ricettario</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Ricette protette e conferma impastata.</p>
                  </button>
                  <button data-testid="lab-nav-magazzino" onClick={() => setCurrentView("magazzino")} className="p-4 rounded-xl bg-[#0b0f19] border border-[#1e293b] hover:border-[#14b8a6] text-left transition-all group">
                    <div className="text-xl mb-2">📦</div>
                    <h3 className="font-bold text-sm text-white group-hover:text-[#14b8a6]">Magazzino & Scorte</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Giacenze, soglie e autonomia.</p>
                  </button>
                  <button data-testid="lab-nav-planner" onClick={() => setCurrentView("planner")} className="p-4 rounded-xl bg-[#0b0f19] border border-[#1e293b] hover:border-[#14b8a6] text-left transition-all group">
                    <div className="text-xl mb-2">🗓️</div>
                    <h3 className="font-bold text-sm text-white group-hover:text-[#14b8a6]">Smart Planner</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Piano con validazione vocale.</p>
                  </button>
                  <button data-testid="lab-nav-iot" onClick={() => setCurrentView("maestro")} className="p-4 rounded-xl bg-[#0b0f19] border border-[#1e293b] hover:border-[#14b8a6] text-left transition-all group">
                    <div className="text-xl mb-2">⚙️</div>
                    <h3 className="font-bold text-sm text-white group-hover:text-[#14b8a6]">Sistemi IoT</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Auto-setup periferiche e forni.</p>
                  </button>
                </div>

                {currentView === "dashboard" && <DocsDownload />}
                {currentView === "ricette" && (
                  <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b] space-y-4">
                    <Ricette isMasterView={true} />
                    <ConfermaImpastata />
                  </div>
                )}
                {currentView === "magazzino" && (
                  <div className="bg-[#0b0f19] p-5 rounded-xl border border-[#1e293b]"><MagazzinoManager /></div>
                )}
                {currentView === "planner" && (
                  <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b]"><SmartPlannerStressZero /></div>
                )}
                {currentView === "maestro" && (
                  <div className="space-y-4">
                    <PeripheralSetup />
                    <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b]"><Maestro /></div>
                  </div>
                )}
              </div>
            ) : (
              /* ================= FLOOR MODE (Mohamed Reza) ================= */
              <div className="space-y-6 animate-fadeIn" data-testid="floor-mode-view">
                <div className="p-5 rounded-2xl bg-[#0b0f19] border border-[#1e293b] shadow-2xl relative overflow-hidden flex items-center justify-between">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#14b8a6]/10 rounded-full blur-3xl pointer-events-none" />
                  <div>
                    <h2 className="text-base font-extrabold text-[#14b8a6] flex items-center gap-2"><span>⚡</span> Floor Mode</h2>
                    <p className="text-xs text-[#94A3B8] mt-1">Plancia operativa di produzione, timer globali e comandi vocali per il team.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-[#030712]/80 border border-[#1e293b] px-2.5 py-1.5 rounded-xl">
                    <img src={`${process.env.PUBLIC_URL}/avatar_mohamed.jpg`} alt="Mohamed Reza" className="w-9 h-9 rounded-full object-cover object-top border border-amber-500" />
                    <div className="hidden sm:block">
                      <p className="text-[11px] font-bold text-white">Mohamed Reza</p>
                      <p className="text-[9px] text-amber-400">Capo Turno / Floor</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-[#0b0f19] border border-[#1e293b] flex flex-col justify-between">
                    <div>
                      <div className="text-2xl mb-2">⏱️</div>
                      <h3 className="font-bold text-sm text-white">Timer Forni & Celle</h3>
                      <p className="text-xs text-[#94A3B8] mt-1">Monitoraggio cicli di cottura e lievitazione in tempo reale.</p>
                    </div>
                    <button onClick={() => toast.success("Timer sincronizzati con successo.")} className="mt-4 w-full py-2.5 bg-[#14b8a6] text-[#030712] font-bold text-xs rounded-lg">Gestisci Timer</button>
                  </div>
                  <div className="p-5 rounded-xl bg-[#0b0f19] border border-[#1e293b] flex flex-col justify-between">
                    <div>
                      <div className="text-2xl mb-2">🎙️</div>
                      <h3 className="font-bold text-sm text-white">Voice Core Attivo</h3>
                      <p className="text-xs text-[#94A3B8] mt-1">Comandi vocali a mani libere per tutto il team via cuffie.</p>
                    </div>
                    <div className="mt-4"><VoiceCommand /></div>
                  </div>
                </div>

                <div className="bg-[#0b0f19] p-5 rounded-xl border border-[#1e293b]">
                  <h3 className="text-sm font-bold text-white mb-2">Ricettario Operativo Turno</h3>
                  <p className="text-xs text-[#94A3B8] mb-4">Lavorazioni e impasti autorizzati per la produzione giornaliera.</p>
                  <Ricette isFloorMode={true} />
                </div>

                <DocsDownload />
              </div>
            )}

            </ErrorBoundary>
          </main>

          {/* FOOTER */}
          <footer className="mt-auto border-t border-[#1e293b] py-6 px-4 bg-[#030712]">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
              <p>MikiLab · mikilab.de — Cyber-Industrial OS</p>
              <button onClick={() => setLegalOpen(true)} className="hover:text-[#14b8a6] transition-colors">Impressum & Datenschutz</button>
            </div>
          </footer>

        </div>

        {legalOpen && (
          <div className="fixed inset-0 z-50 bg-[#030712] overflow-auto p-4">
            <div className="max-w-xl mx-auto py-5">
              <button onClick={() => setLegalOpen(false)} className="mb-4 text-sm font-semibold text-[#14b8a6]">← Chiudi</button>
              <LegalPage />
            </div>
          </div>
        )}

        {authOpen && !user && (
          <div className="fixed inset-0 z-[70] bg-[#030712] overflow-auto">
            <AuthScreen onClose={() => setAuthOpen(false)} initialMode={authMode} />
          </div>
        )}

        {resetToken && (
          <ResetPassword token={resetToken} onDone={() => { setResetToken(null); setAuthOpen(true); }} />
        )}

        {showOperator && (
          <OperatoreSelect current={operator} onSelect={setOperator} onClose={() => setShowOperator(false)} />
        )}

        <Toaster position="top-center" richColors />
        <RadioFornaio />
        <ShiftScheduler />
        <TalkWithMiki />
        <AutoReport />
        <AudioRouteIndicator />

      </div>
    </MachinesProvider>
    </MixerTimersProvider>
    </SoundFXProvider>
    </TimerProvider>
    </AmbientProvider>
    </ProfileProvider>
  );
}
