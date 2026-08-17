import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, CalendarClock, Thermometer, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import RecipeList from "@/components/RecipeList";
import CalcolaGradi from "@/sections/CalcolaGradi";
import PianificaProduzione from "@/sections/PianificaProduzione";
import GestioneForno from "@/sections/GestioneForno";

const TOOLS = [
  { id: "aggiungi", title: "Aggiungi ricetta", desc: "Le tue ricette, inserite a mano", Icon: PlusCircle },
  { id: "pianifica", title: "Pianifica la produzione", desc: "Tabella di marcia a ritroso", Icon: CalendarClock },
  { id: "gradi", title: "Calcola gradi", desc: "Temperatura acqua impasto", Icon: Thermometer },
  { id: "forno", title: "Gestione forno", desc: "Fasi di cottura, vapore e timer", Icon: Flame },
];

export default function Maestro() {
  const [tool, setTool] = useState(null);

  if (tool) {
    return (
      <div>
        <button
          data-testid="maestro-back-btn"
          onClick={() => setTool(null)}
          className="flex items-center gap-1 text-[#B34A26] font-medium mb-4"
        >
          <ChevronLeft className="w-5 h-5" /> Strumenti
        </button>
        {tool === "aggiungi" && (
          <RecipeList
            collectionName="personal"
            heroImage="https://images.unsplash.com/photo-1732565649629-eb4932a1ec09?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHw0fHxiYWtlciUyMHNjb3JpbmclMjBzb3VyZG91Z2glMjBmbG91ciUyMHRhYmxlfGVufDB8fHx8MTc4Njk4MjgzMHww&ixlib=rb-4.1.0&q=85"
            heroTitle="Le tue ricette"
            heroSubtitle="Inseriscile a mano, senza esempi"
            emptyText="Ancora nessuna ricetta tua. Aggiungine una da zero."
          />
        )}
        {tool === "pianifica" && <PianificaProduzione />}
        {tool === "gradi" && <CalcolaGradi />}
        {tool === "forno" && <GestioneForno />}
      </div>
    );
  }

  return (
    <div className="pb-4">
      <h1 className="font-display text-3xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">Il Maestro</h1>
      <p className="text-sm text-[#8C7567] mt-1 mb-5">Strumenti e calcoli per la panificazione</p>

      <div className="space-y-3">
        {TOOLS.map(({ id, title, desc, Icon }, i) => (
          <motion.button
            key={id}
            data-testid={`maestro-tool-${id}`}
            onClick={() => setTool(id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="w-full flex items-center gap-4 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-4 shadow-sm active:scale-98 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#D99B26]/15 border border-[#D99B26]/30 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-[#B34A26]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{title}</h3>
              <p className="text-sm text-[#8C7567] truncate">{desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#C9BBB0] shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
