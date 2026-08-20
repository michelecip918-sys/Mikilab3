import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Home from "@/sections/Home";
import Ricette from "@/sections/Ricette";
import Maestro from "@/sections/Maestro";
import Beginners from "@/sections/Beginners";
import PhotoDiagnosi from "@/sections/PhotoDiagnosi";
import NewsPage from "@/sections/NewsPage";
import Enciclopedia from "@/sections/Enciclopedia";
import VoiceAssistant from "@/components/VoiceAssistant";
import RadioFornaio from "@/components/RadioFornaio";
import IntroGuide from "@/components/IntroGuide";
import AuthScreen from "@/components/AuthScreen";
import { useAuth } from "@/auth/AuthContext";
import { AmbientProvider } from "@/audio/AmbientContext";
import ambient from "@/lib/ambientMusic";

function App() {
  const [tab, setTab] = useState("home");
  const tabRef = useRef("home");
  const { user, authOpen, setAuthOpen } = useAuth();

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
            {tab === "maestro" && <Maestro />}
            {tab === "impara" && <Beginners />}
            {tab === "diagnosi" && <PhotoDiagnosi />}
            {tab === "news" && <NewsPage />}
            {tab === "enciclopedia" && <Enciclopedia />}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav active={tab} onChange={navigate} />
      <VoiceAssistant onNavigate={navigate} />
      <RadioFornaio />
      <IntroGuide />

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
    </div>
    </AmbientProvider>
  );
}

export default App;
