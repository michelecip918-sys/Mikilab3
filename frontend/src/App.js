import { useState, useEffect } from "react";
import "@/App.css";
import { Toaster, toast } from "sonner";
import { ProfileProvider } from "@/profile/ProfileContext";
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

// Viste principali
import Ricette from "@/sections/Ricette";
import Maestro from "@/sections/Maestro";
import SmartPlannerStressZero from "@/sections/SmartPlannerStressZero";

export default function App() {
  useLang();

  const [activeMode, setActiveMode] = useState("floor");
  const [currentView, setCurrentView] = useState("dashboard");
  const [locked, setLocked] = useState(() => pinIsLocked());
  const [legalOpen, setLegalOpen] = useState(false);

  useEffect(() => {
    const onLock = () => { pinLockNow(); setLocked(true); };
    window.addEventListener("mikilab-lock", onLock);
    return () => window.removeEventListener("mikilab-lock", onLock);
  }, []);

  if (locked) {
    return <PinLock onUnlock={() => setLocked(false)} />;
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

          {/* HEADER CON LOGO FUTURISTICO "ML" */}
          <header className="border-b border-[#1e293b] bg-[#0b0f19]/80 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#14b8a6] to-[#0f172a] p-[1px] shadow-lg shadow-[#14b8a6]/20">
                  <div className="w-full h-full bg-[#030712] rounded-[11px] flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-r from-[#14b8a6] to-[#38bdf8] tracking-wider text-base">
                    ML
                  </div>
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-wider text-white uppercase flex items-center gap-2">
                    MikiLab <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/30">Cyber OS</span>
                  </h1>
                  <p className="text-[10px] text-[#94A3B8]">Laboratorio Panificazione Avanzata</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0f172a] border border-[#1e293b] text-[#94A3B8]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Cuffie BT & Voice Attivi
                </span>
              </div>
            </div>
          </header>

          {/* SELETTORE MODALITÀ PULITO */}
          <div className="bg-[#0b0f19]/90 border-b border-[#1e293b] px-4 py-2.5 sticky top-[65px] z-40 backdrop-blur-md">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 bg-[#030712] p-1 rounded-xl border border-[#1e293b] w-full max-w-md">
                <button
                  data-testid="mode-lab-btn"
                  onClick={() => { setActiveMode("lab"); setCurrentView("dashboard"); }}
                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeMode === 'lab'
                      ? 'bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] shadow-md shadow-[#14b8a6]/20'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  🛡️ Lab Control
                </button>
                <button
                  data-testid="mode-floor-btn"
                  onClick={() => { setActiveMode("floor"); setCurrentView("dashboard"); }}
                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeMode === 'floor'
                      ? 'bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] shadow-md shadow-[#14b8a6]/20'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  ⚡ Floor Mode
                </button>
              </div>
            </div>
          </div>

          {/* CORPO PRINCIPALE */}
          <main className="flex-1 max-w-4xl w-full mx-auto p-4 pb-32">

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
                  <div className="flex items-center gap-3 bg-[#030712]/80 border border-[#1e293b] px-3 py-2 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-[#14b8a6]/20 border border-[#14b8a6] flex items-center justify-center text-xs font-bold text-[#14b8a6]">M</div>
                    <div className="hidden sm:block">
                      <p className="text-[11px] font-bold text-white">Michele</p>
                      <p className="text-[9px] text-[#14b8a6]">Master Admin</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button data-testid="lab-nav-ricette" onClick={() => setCurrentView("ricette")} className="p-4 rounded-xl bg-[#0b0f19] border border-[#1e293b] hover:border-[#14b8a6] text-left transition-all group">
                    <div className="text-xl mb-2">🥖</div>
                    <h3 className="font-bold text-sm text-white group-hover:text-[#14b8a6]">Master Ricettario</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Ricette protette e conferma impastata.</p>
                  </button>

                  <button data-testid="lab-nav-magazzino" onClick={() => setCurrentView("magazzino")} className="p-4 rounded-xl bg-[#0b0f19] border border-[#1e293b] hover:border-[#14b8a6] text-left transition-all group">
                    <div className="text-xl mb-2">📦</div>
                    <h3 className="font-bold text-sm text-white group-hover:text-[#14b8a6]">Magazzino & Scorte</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Giacenze, soglie e giorni di autonomia.</p>
                  </button>

                  <button data-testid="lab-nav-planner" onClick={() => setCurrentView("planner")} className="p-4 rounded-xl bg-[#0b0f19] border border-[#1e293b] hover:border-[#14b8a6] text-left transition-all group">
                    <div className="text-xl mb-2">🗓️</div>
                    <h3 className="font-bold text-sm text-white group-hover:text-[#14b8a6]">Smart Planner</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Piano settimanale con validazione vocale.</p>
                  </button>

                  <button data-testid="lab-nav-iot" onClick={() => setCurrentView("maestro")} className="p-4 rounded-xl bg-[#0b0f19] border border-[#1e293b] hover:border-[#14b8a6] text-left transition-all group">
                    <div className="text-xl mb-2">⚙️</div>
                    <h3 className="font-bold text-sm text-white group-hover:text-[#14b8a6]">Sistemi IoT</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Auto-setup periferiche, sensori e forni.</p>
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
                  <div className="flex items-center gap-3 bg-[#030712]/80 border border-[#1e293b] px-3 py-2 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-xs font-bold text-amber-400">MR</div>
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
                    <button onClick={() => toast.success("Timer sincronizzati con successo.")} className="mt-4 w-full py-2.5 bg-[#14b8a6] text-[#030712] font-bold text-xs rounded-lg">
                      Gestisci Timer
                    </button>
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

        <Toaster position="top-center" richColors />
        <RadioFornaio />
        <ShiftScheduler />
        <TalkWithMiki />
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
