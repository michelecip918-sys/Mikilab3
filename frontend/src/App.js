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
import GuidaSOS from "@/components/GuidaSOS";
import { User, BookOpen, LayoutGrid, LifeBuoy } from "lucide-react";

import Ricette from "@/sections/Ricette";
import Maestro from "@/sections/Maestro";
import SmartPlannerStressZero from "@/sections/SmartPlannerStressZero";

const PUB = process.env.PUBLIC_URL;
const SECTIONS = [
  { id: "ricette", label: "Ricette", Icon: BookOpen, avatar: "avatar_mohamed.jpg" },
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
  useLang();
  const { user, authOpen, setAuthOpen } = useAuth();

  const [section, setSection] = useState("control");
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

  if (locked && !resetToken) return <PinLock onUnlock={() => setLocked(false)} />;
  if (!operator && !resetToken) return <OperatoreSelect onSelect={setOperator} />;

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
                <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#14b8a6]/40 shadow-lg shadow-[#14b8a6]/20 bg-[#030712]">
                  <img src={`${PUB}/logo-emblem.png`} alt="MikiLab" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-2">MikiLab <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/30">Cyber OS</span></h1>
                  <p className="text-[10px] text-[#94A3B8]">Laboratorio Panificazione Avanzata</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button data-testid="operatore-chip" onClick={() => setShowOperator(true)} className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-[#0f172a] border border-[#1e293b] text-white hover:border-[#14b8a6] active:scale-95 transition-all" title="Cambia operatore">
                  {operator && <img src={`${PUB}/${operator.img}`} alt={operator.name} className="w-6 h-6 rounded-full object-cover object-top border border-[#14b8a6]/50" />}
                  <span className="font-bold hidden sm:inline">{operator ? operator.name : "Operatore"}</span>
                </button>
                <button data-testid="account-btn" onClick={() => { setAuthMode("login"); setAuthOpen(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14b8a6]/10 border border-[#14b8a6]/30 text-[#14b8a6] font-bold hover:bg-[#14b8a6]/20 active:scale-95 transition-all">
                  <User className="w-3.5 h-3.5" />{user ? (user.email ? user.email.split("@")[0].slice(0, 10) : "Account") : "Accedi"}
                </button>
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
                    <span className="hidden sm:inline">{s.label}</span>
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
                <SectionHead avatar="avatar_mohamed.jpg" title="Ricette di MikiLab" sub="Consultazione visiva rapida: foto e ricette essenziali." />
                <Ricette />
              </div>
            )}

            {/* SEZIONE 2 — MIKILAB CONTROL */}
            {section === "control" && (
              <div className="space-y-5 animate-fadeIn" data-testid="section-control">
                <div className="flex items-center gap-1.5 bg-[#030712] p-1 rounded-xl border border-[#1e293b] max-w-md mx-auto">
                  <button data-testid="mode-lab-btn" onClick={() => { setActiveMode("lab"); setCurrentView("dashboard"); }} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${activeMode === "lab" ? "bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712]" : "text-[#94A3B8] hover:text-white"}`}>🛡️ Capo · Lab Control</button>
                  <button data-testid="mode-floor-btn" onClick={() => { setActiveMode("floor"); setCurrentView("dashboard"); }} className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${activeMode === "floor" ? "bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712]" : "text-[#94A3B8] hover:text-white"}`}>⚡ Produzione · Floor</button>
                </div>

                {activeMode === "lab" ? (
                  <div className="space-y-5" data-testid="lab-control-view">
                    <LabBriefing />
                    <SectionHead avatar="avatar_miki.jpg" title="Plancia Capo" sub="Ricettario, piano, produzione e Ordini Extra con AI." roleName="Michele" roleTag="Master Admin" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <LabCard testid="lab-nav-ricette" icon="🥖" title="Master Ricettario" sub="Ricette protette e conferma impastata." onClick={() => setCurrentView("ricette")} />
                      <LabCard testid="lab-nav-magazzino" icon="📦" title="Magazzino & Scorte" sub="Giacenze, soglie e autonomia." onClick={() => setCurrentView("magazzino")} />
                      <LabCard testid="lab-nav-planner" icon="🗓️" title="Smart Planner" sub="Piano con validazione vocale." onClick={() => setCurrentView("planner")} />
                      <LabCard testid="lab-nav-ordini" icon="⚡" title="Ordini Extra" sub="AI rigenera il piano all'istante." onClick={() => setCurrentView("ordini")} accent />
                      <LabCard testid="lab-nav-iot" icon="⚙️" title="Sistemi IoT" sub="Auto-setup periferiche e forni." onClick={() => setCurrentView("maestro")} />
                    </div>
                    {currentView === "dashboard" && <DocsDownload />}
                    {currentView === "ricette" && <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b] space-y-4"><Ricette isMasterView={true} /><ConfermaImpastata /></div>}
                    {currentView === "magazzino" && <div className="bg-[#0b0f19] p-5 rounded-xl border border-[#1e293b]"><MagazzinoManager /></div>}
                    {currentView === "planner" && <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b]"><SmartPlannerStressZero /></div>}
                    {currentView === "ordini" && <div className="bg-[#0b0f19] p-5 rounded-xl border border-[#1e293b]"><OrdiniExtra /></div>}
                    {currentView === "maestro" && <div className="space-y-4"><PeripheralSetup /><div className="bg-[#0b0f19] p-4 rounded-xl border border-[#1e293b]"><Maestro /></div></div>}
                  </div>
                ) : (
                  <div className="space-y-5" data-testid="floor-mode-view">
                    <SectionHead avatar="avatar_mohamed.jpg" title="Produzione · Floor Mode" sub="Timer, voce a mani libere e ricettario di turno." roleName="Mohamed Reza" roleTag="Capo Turno" amber />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-5 rounded-xl bg-[#0b0f19] border border-[#1e293b] flex flex-col justify-between">
                        <div><div className="text-2xl mb-2">⏱️</div><h3 className="font-bold text-sm text-white">Timer Forni & Celle</h3><p className="text-xs text-[#94A3B8] mt-1">Cicli di cottura e lievitazione in tempo reale.</p></div>
                        <button onClick={() => toast.success("Timer sincronizzati con successo.")} className="mt-4 w-full py-2.5 bg-[#14b8a6] text-[#030712] font-bold text-xs rounded-lg">Gestisci Timer</button>
                      </div>
                      <div className="p-5 rounded-xl bg-[#0b0f19] border border-[#1e293b] flex flex-col justify-between">
                        <div><div className="text-2xl mb-2">🎙️</div><h3 className="font-bold text-sm text-white">Voice Core Attivo</h3><p className="text-xs text-[#94A3B8] mt-1">Comandi vocali a mani libere via cuffie.</p></div>
                        <div className="mt-4 text-[11px] text-[#64748B]">Assistente voce globale attivo in basso a destra.</div>
                      </div>
                    </div>
                    <div className="bg-[#0b0f19] p-5 rounded-xl border border-[#1e293b]"><h3 className="text-sm font-bold text-white mb-2">Ricettario Operativo Turno</h3><Ricette isFloorMode={true} /></div>
                    <DocsDownload />
                  </div>
                )}
              </div>
            )}

            {/* SEZIONE 3 — GUIDA, SOS & AI */}
            {section === "guida" && (
              <div className="space-y-4 animate-fadeIn" data-testid="section-guida">
                <SectionHead avatar="avatar_bigmix.jpg" title="Guida, SOS & AI Assistant" sub="Tutto sul laboratorio, le impostazioni e come usare il sito." roleName="Bake Mix" roleTag="AI Assistant" />
                <GuidaSOS />
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
