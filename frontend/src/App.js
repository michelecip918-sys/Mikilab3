import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Mikilab from "@/sections/Mikilab";
import Maestro from "@/sections/Maestro";
import PhotoDiagnosi from "@/sections/PhotoDiagnosi";
import MaestroSaTutto from "@/sections/MaestroSaTutto";
import VoiceAssistant from "@/components/VoiceAssistant";
import RadioFornaio from "@/components/RadioFornaio";
import IntroGuide from "@/components/IntroGuide";

function App() {
  const [tab, setTab] = useState("mikilab");

  return (
    <div className="App min-h-screen bg-[#FDFBF7] dark:bg-[#1A1412]">
      <Header />
      <main className="max-w-xl mx-auto px-4 pt-4 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {tab === "mikilab" && <Mikilab />}
            {tab === "maestro" && <Maestro />}
            {tab === "foto" && <PhotoDiagnosi />}
            {tab === "sa-tutto" && <MaestroSaTutto />}
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
