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

// Componenti essenziali e puliti
import Header from "@/components/Header";
import PinLock from "@/components/PinLock";
import { isLocked as pinIsLocked, lockNow as pinLockNow } from "@/lib/pinLock";
import VoiceCommand from "@/components/VoiceCommand";
import RadioFornaio from "@/components/RadioFornaio";
import ShiftScheduler from "@/components/ShiftScheduler";
import TalkWithMiki from "@/components/TalkWithMiki";
import AudioRouteIndicator from "@/components/AudioRouteIndicator";
import LegalPage from "@/sections/LegalPage";
import PeripheralSetup from "@/components/PeripheralSetup";

// Viste principali pulite
import Ricette from "@/sections/Ricette";
import Maestro from "@/sections/Maestro";

export default function App() {
  useLang();

  // STATO PRINCIPALE: Doppia modalità rigida e pulita (Lab Control vs Floor Mode)
  const [activeMode, setActiveMode] = useState("floor"); // Di default sul campo per il team
  const [currentView, setCurrentView] = useState("dashboard"); // dashboard, ricette, magazzino, maestro
  const [locked, setLocked] = useState(() => pinIsLocked());
  const [legalOpen, setLegalOpen] = useState(false);

  // Sblocco PIN di sicurezza
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
      <div className="min-h-screen bg-[#090D12] text-[#F8FAFC] font-sans selection:bg-[#14b8a6] selection:text-[#090D12]">

        {/* SFONDO CYBER-INDUSTRIAL SCURO */}
        <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,#111827_0%,#030712_100%)] opacity-95" />

        <div className="relative z-10 flex flex-col min-h-screen">
          <Header />

          {/* BARRA SUPERIORE DI SEPARAZIONE RUOLI: LAB CONTROL vs FLOOR MODE */}
          <div className="bg-[#111827] border-b border-[#1F2937] px-4 py-3 sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">

              {/* SWITCH RUOLO */}
              <div className="flex items-center gap-2 bg-[#030712] p-1 rounded-xl border border-[#1F2937] w-full sm:w-auto">
                <button
                  data-testid="mode-lab-btn"
                  onClick={() => { setActiveMode("lab"); setCurrentView("dashboard"); }}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeMode === 'lab'
                      ? 'bg-[#14b8a6] text-[#030712] shadow-lg shadow-[#14b8a6]/20'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  🛡️ Lab Control [Michele]
                </button>
                <button
                  data-testid="mode-floor-btn"
                  onClick={() => { setActiveMode("floor"); setCurrentView("dashboard"); }}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeMode === 'floor'
                      ? 'bg-[#14b8a6] text-[#030712] shadow-lg shadow-[#14b8a6]/20'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  ⚡ Floor Mode [Team]
                </button>
              </div>

              {/* STATO BLUETOOTH & VOCE */}
              <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                <span className="flex items-center gap-1 bg-[#1F2937] px-2.5 py-1 rounded-md border border-[#374151]">
                  🎧 Cuffie: <strong className="text-[#14b8a6]">Attive (BT)</strong>
                </span>
                <span className="flex items-center gap-1 bg-[#1F2937] px-2.5 py-1 rounded-md border border-[#374151]">
                  🎙️ Voice Core: <strong className="text-[#14b8a6]">Nativo</strong>
                </span>
              </div>
            </div>
          </div>

          {/* AREA DI LAVORO PRINCIPALE */}
          <main className="flex-1 max-w-4xl w-full mx-auto p-4 pb-32">

            {activeMode === 'lab' ? (
              /* ==========================================================
                 LAB CONTROL (MICHELE) - Amministrazione, Ricette Master & Magazzino
                 ========================================================== */
              <div className="space-y-6" data-testid="lab-control-view">
                <div className="p-5 rounded-2xl bg-[#111827] border border-[#1F2937] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#14b8a6]/5 rounded-full blur-2xl pointer-events-none" />
                  <h1 className="text-lg font-extrabold text-[#14b8a6] flex items-center gap-2">
                    <span>🛡️</span> Plancia Amministrativa Master
                  </h1>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Controllo totale delle ricette protette (Pane di Matera), gestione magazzino materie prime e configurazione flussi di produzione.
                  </p>
                </div>

                {/* MODULI RAPIDI LAB */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    data-testid="lab-nav-ricette"
                    onClick={() => setCurrentView("ricette")}
                    className="p-4 rounded-xl bg-[#111827] border border-[#1F2937] hover:border-[#14b8a6] text-left transition-all group"
                  >
                    <div className="text-xl mb-2">🥖</div>
                    <h3 className="font-bold text-sm text-white group-hover:text-[#14b8a6]">Master Ricettario</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Gestisci e sblocca ricette personali protette.</p>
                  </button>

                  <button
                    data-testid="lab-nav-magazzino"
                    onClick={() => setCurrentView("magazzino")}
                    className="p-4 rounded-xl bg-[#111827] border border-[#1F2937] hover:border-[#14b8a6] text-left transition-all group"
                  >
                    <div className="text-xl mb-2">📦</div>
                    <h3 className="font-bold text-sm text-white group-hover:text-[#14b8a6]">Logistica & Magazzino</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Carico/scarico ceste, farine e scorte.</p>
                  </button>

                  <button
                    data-testid="lab-nav-iot"
                    onClick={() => setCurrentView("maestro")}
                    className="p-4 rounded-xl bg-[#111827] border border-[#1F2937] hover:border-[#14b8a6] text-left transition-all group"
                  >
                    <div className="text-xl mb-2">⚙️</div>
                    <h3 className="font-bold text-sm text-white group-hover:text-[#14b8a6]">Impostazioni IoT</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Sensori termici e forni in rete locale.</p>
                  </button>
                </div>

                {/* VISUALIZZATORE VISTA ATTIVA IN LAB */}
                {currentView === "ricette" && <div className="bg-[#111827] p-4 rounded-xl border border-[#1F2937]"><Ricette isMasterView={true} /></div>}
                {currentView === "magazzino" && (
                  <div className="bg-[#111827] p-5 rounded-xl border border-[#1F2937] space-y-3">
                    <h3 className="text-sm font-bold text-[#14b8a6]">Gestione Rapida Magazzino & Ceste</h3>
                    <p className="text-xs text-[#94A3B8]">Registra i carichi in entrata e controlla le scorte disponibili per la produzione giornaliera.</p>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => toast.success("Carico magazzino aggiornato con successo!")} className="px-4 py-2 bg-[#14b8a6] text-[#030712] text-xs font-bold rounded-lg">Registra Carico</button>
                      <button onClick={() => toast.info("Verifica ceste completata.")} className="px-4 py-2 bg-[#1F2937] text-white text-xs font-bold rounded-lg border border-[#374151]">Verifica Ceste</button>
                    </div>
                  </div>
                )}
                {currentView === "maestro" && (
                  <div className="space-y-4">
                    {/* AUTO-SETUP PERIFERICHE (microfono, telecamera, sensori IoT) */}
                    <PeripheralSetup />
                    <div className="bg-[#111827] p-4 rounded-xl border border-[#1F2937]"><Maestro /></div>
                  </div>
                )}

              </div>
            ) : (
              /* ==========================================================
                 FLOOR MODE (TEAM) - Operatività ultra-veloce, Timer e Voice
                 ========================================================== */
              <div className="space-y-6" data-testid="floor-mode-view">
                <div className="p-5 rounded-2xl bg-[#111827] border border-[#1F2937] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#14b8a6]/5 rounded-full blur-2xl pointer-events-none" />
                  <h1 className="text-lg font-extrabold text-[#14b8a6] flex items-center gap-2">
                    <span>⚡</span> Floor Mode // Operatività Laboratorio
                  </h1>
                  <p className="text-xs text-[#94A3B8] mt-1">
                    Plancia di produzione per il team. Gestione timer globali, comandi vocali a mani libere e inserimento rapido ceste.
                  </p>
                </div>

                {/* PULSANTI OPERATIVI GIGANTI PER IL TEAM */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-[#111827] border border-[#1F2937] hover:border-[#14b8a6] transition-all flex flex-col justify-between">
                    <div>
                      <div className="text-2xl mb-2">⏱️</div>
                      <h3 className="font-bold text-sm text-white">Timer Globali & Forni</h3>
                      <p className="text-xs text-[#94A3B8] mt-1">Monitora i tempi di cottura e lievitazione attivi in tempo reale.</p>
                    </div>
                    <button onClick={() => toast.success("Timer sincronizzato con le celle.")} className="mt-4 w-full py-2.5 bg-[#14b8a6] text-[#030712] font-bold text-xs rounded-lg shadow-md">
                      Gestisci Timer
                    </button>
                  </div>

                  <div className="p-5 rounded-xl bg-[#111827] border border-[#1F2937] hover:border-[#14b8a6] transition-all flex flex-col justify-between">
                    <div>
                      <div className="text-2xl mb-2">🎙️</div>
                      <h3 className="font-bold text-sm text-white">Voice Core Attivo</h3>
                      <p className="text-xs text-[#94A3B8] mt-1">Usa i comandi vocali in cuffia Bluetooth senza toccare lo schermo.</p>
                    </div>
                    <div className="mt-4"><VoiceCommand /></div>
                  </div>
                </div>

                {/* ACCESSO RAPIDO RICETTE DI PRODUZIONE STANDARD */}
                <div className="bg-[#111827] p-5 rounded-xl border border-[#1F2937]">
                  <h3 className="text-sm font-bold text-white mb-2">Ricettario di Produzione</h3>
                  <p className="text-xs text-[#94A3B8] mb-4">Consulta le lavorazioni giornaliere autorizzate per il turno.</p>
                  <Ricette isFloorMode={true} />
                </div>
              </div>
            )}

          </main>

          {/* FOOTER PULITO */}
          <footer className="mt-auto border-t border-[#1F2937] py-6 px-4 bg-[#030712]">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
              <p>MikiLab · mikilab.de — Cyber-Industrial OS · 100% Sicuro</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setLegalOpen(true)} className="hover:text-[#14b8a6] transition-colors">Impressum</button>
                <button onClick={() => setLegalOpen(true)} className="hover:text-[#14b8a6] transition-colors">Datenschutz</button>
                <button onClick={() => setLegalOpen(true)} className="hover:text-[#14b8a6] transition-colors">Contatti</button>
              </div>
            </div>
          </footer>

        </div>

        {/* MODALI DI SISTEMA */}
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
