import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Home from "@/sections/Home";
import Ricette from "@/sections/Ricette";
import Maestro from "@/sections/Maestro";
import LearnHub from "@/sections/LearnHub";
import PhotoDiagnosi from "@/sections/PhotoDiagnosi";
import PaywallGate from "@/components/PaywallGate";
import VoiceAssistant from "@/components/VoiceAssistant";
import RadioFornaio from "@/components/RadioFornaio";
import IntroGuide from "@/components/IntroGuide";
import AuthScreen from "@/components/AuthScreen";
import ResetPassword from "@/components/ResetPassword";
import { useAuth } from "@/auth/AuthContext";
import { AmbientProvider } from "@/audio/AmbientContext";
import ambient from "@/lib/ambientMusic";

function App() {
  const [tab, setTab] = useState("home");
  const tabRef = useRef("home");
  const { user, authOpen, setAuthOpen } = useAuth();
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("reset"));

  // Gestione tasto Indietro: sincronizza i tab con la history del browser.
  const navigate = useCallback((next) => {
    if (next === tabRef.current) return;
    tabRef.current = next;
    window.history.pushState({ tab: next }, "");
    setTab(next);
  }, []);

  useEffect(() => {
    window.history.replaceState({ tab: "home" }, "");
    const onPop = (e) => {
      const next = (e.state && e.state.tab) || "home";
      tabRef.current = next;
      setTab(next);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // chiudi il modale login appena l'utente è autenticato
  useEffect(() => { if (user) setAuthOpen(false); }, [user, setAuthOpen]);

  // Sottofondo musicale: cambia melodia in base alla sezione attiva.
  useEffect(() => { ambient.setSection(tab); }, [tab]);

  return (
    <AmbientProvider>
    <div className="App min-h-screen bg-[#FDFBF7] dark:bg-[#1A1412]">
      {/* Sfondo tematico cartone (leggero, su ogni pagina) */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none bg-no-repeat bg-right-bottom opacity-[0.05] dark:opacity-[0.07]"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/michele-cartoon.jpg)`, backgroundSize: "min(70vw, 420px)" }} />
      <div className="relative z-10">
      <Header />
      <main className="max-w-xl mx-auto px-4 pt-4 pb-48">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {tab === "home" && <Home onNavigate={navigate} />}
            {tab === "ricette" && <Ricette />}
            {tab === "maestro" && <PaywallGate feature="lab" sectionName="Il Tuo Laboratorio"><Maestro /></PaywallGate>}
            {["impara", "news", "enciclopedia"].includes(tab) && <LearnHub key={tab} initial={tab} />}
            {tab === "diagnosi" && <PaywallGate feature="diagnosi" sectionName="Diagnosi"><PhotoDiagnosi /></PaywallGate>}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav active={tab} onChange={navigate} />
      <VoiceAssistant onNavigate={navigate} />
      <RadioFornaio />
      {!resetToken && <IntroGuide />}

      <AnimatePresence>
        {authOpen && !user && (
          <motion.div
            data-testid="auth-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[#FDFBF7] dark:bg-[#1A1412] overflow-auto"
          >
            <AuthScreen onClose={() => setAuthOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="top-center" richColors />
      {resetToken && (
        <ResetPassword
          token={resetToken}
          onDone={() => {
            setResetToken(null);
            const u = new URL(window.location.href);
            u.searchParams.delete("reset");
            window.history.replaceState(null, "", u.pathname + u.search);
            setAuthOpen(true);
          }}
        />
      )}
      </div>
    </div>
    </AmbientProvider>
  );
}

export default App;
