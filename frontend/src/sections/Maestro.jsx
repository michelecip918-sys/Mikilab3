import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, CalendarDays, ChefHat, Flame, Wheat, Sprout, ChevronLeft, ChevronRight, ClipboardList, Thermometer, Tag, ScanLine, BookOpen } from "lucide-react";
import RecipeList from "@/components/RecipeList";
import WeeklyPlan from "@/sections/WeeklyPlan";
import StartDoughs from "@/sections/StartDoughs";
import AdattaForno from "@/sections/AdattaForno";
import SvegliaLievito from "@/sections/SvegliaLievito";
import Beginners from "@/sections/Beginners";
import CapoLaboratorio from "@/sections/CapoLaboratorio";
import ClimaTermostato from "@/sections/ClimaTermostato";
import PanettoneLabels from "@/sections/PanettoneLabels";
import ScanRecipe from "@/sections/ScanRecipe";
import GuidaMetodi from "@/sections/GuidaMetodi";
import { useLang } from "@/i18n/LanguageContext";

export default function Maestro() {
  const [tool, setTool] = useState(null);
  const { t } = useLang();

  const TOOLS = [
    { id: "capo", title: t("tool_capo"), desc: t("tool_capo_desc"), Icon: ClipboardList },
    { id: "termo", title: t("tool_termo"), desc: t("tool_termo_desc"), Icon: Thermometer },
    { id: "scan", title: t("tool_scan"), desc: t("tool_scan_desc"), Icon: ScanLine },
    { id: "guida", title: t("tool_guida"), desc: t("tool_guida_desc"), Icon: BookOpen },
    { id: "labels", title: t("tool_labels"), desc: t("tool_labels_desc"), Icon: Tag },
    { id: "aggiungi", title: t("tool_aggiungi"), desc: t("tool_aggiungi_desc"), Icon: PlusCircle },
    { id: "settimana", title: t("tool_settimana"), desc: t("tool_settimana_desc"), Icon: CalendarDays },
    { id: "lavoro", title: t("tool_lavoro"), desc: t("tool_lavoro_desc"), Icon: ChefHat },
    { id: "adatta", title: t("tool_adatta"), desc: t("tool_adatta_desc"), Icon: Flame },
    { id: "sveglia", title: t("tool_sveglia"), desc: t("tool_sveglia_desc"), Icon: Wheat },
    { id: "principianti", title: t("tool_principianti"), desc: t("tool_principianti_desc"), Icon: Sprout },
  ];

  if (tool) {
    return (
      <div>
        <button
          data-testid="maestro-back-btn"
          onClick={() => setTool(null)}
          className="flex items-center gap-1 text-[#B34A26] font-medium mb-4"
        >
          <ChevronLeft className="w-5 h-5" /> {t("tools_back")}
        </button>
        {tool === "aggiungi" && (
          <RecipeList
            collectionName="personal"
            heroImage="https://images.unsplash.com/photo-1732565649629-eb4932a1ec09?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHw0fHxiYWtlciUyMHNjb3JpbmclMjBzb3VyZG91Z2glMjBmbG91ciUyMHRhYmxlfGVufDB8fHx8MTc4Njk4MjgzMHww&ixlib=rb-4.1.0&q=85"
            heroTitle={t("personal_hero_title")}
            heroSubtitle={t("personal_hero_sub")}
            emptyText={t("personal_empty")}
          />
        )}
        {tool === "settimana" && <WeeklyPlan />}
        {tool === "lavoro" && <StartDoughs />}
        {tool === "capo" && <CapoLaboratorio />}
        {tool === "termo" && <ClimaTermostato />}
        {tool === "scan" && <ScanRecipe />}
        {tool === "guida" && <GuidaMetodi />}
        {tool === "labels" && <PanettoneLabels />}
        {tool === "adatta" && <AdattaForno />}
        {tool === "sveglia" && <SvegliaLievito />}
        {tool === "principianti" && <Beginners />}
      </div>
    );
  }

  return (
    <div className="pb-4">
      <h1 className="font-display text-3xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("maestro_title")}</h1>
      <p className="text-sm text-[#8C7567] mt-1 mb-5">{t("maestro_subtitle")}</p>

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
