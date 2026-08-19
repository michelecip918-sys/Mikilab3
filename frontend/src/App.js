import { useState } from "react";
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
import VoiceAssistant from "@/components/VoiceAssistant";
import RadioFornaio from "@/components/RadioFornaio";
import IntroGuide from "@/components/IntroGuide";

function App() {
  const [tab, setTab] = useState("home");

  return (
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
            {tab === "home" && <Home />}
            {tab === "ricette" && <Ricette />}
            {tab === "maestro" && <Maestro />}
            {tab === "impara" && <Beginners />}
            {tab === "diagnosi" && <PhotoDiagnosi />}
            {tab === "news" && <NewsPage />}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav active={tab} onChange={setTab} />
      <VoiceAssistant onNavigate={setTab} />
      <RadioFornaio />
      <IntroGuide />
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
