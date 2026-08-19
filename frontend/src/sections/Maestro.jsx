import { useState } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle, CalendarDays, ChefHat, Flame, Wheat, ChevronLeft, ChevronRight,
  ClipboardList, Thermometer, ScanLine, Camera, Sparkles, BookPlus,
} from "lucide-react";
import RecipeList from "@/components/RecipeList";
import WeeklyPlan from "@/sections/WeeklyPlan";
import StartDoughs from "@/sections/StartDoughs";
import AdattaForno from "@/sections/AdattaForno";
import SvegliaLievito from "@/sections/SvegliaLievito";
import CapoLaboratorio from "@/sections/CapoLaboratorio";
import ClimaTermostato from "@/sections/ClimaTermostato";
import ScanRecipe from "@/sections/ScanRecipe";
import { useLang } from "@/i18n/LanguageContext";

export default function Maestro() {
  const [tool, setTool] = useState(null);
  const { t } = useLang();

  const TOOL_META = {
    aggiungi: { title: t("tool_aggiungi"), desc: t("tool_aggiungi_desc"), Icon: PlusCircle },
    scan: { title: t("tool_scan"), desc: t("tool_scan_desc"), Icon: ScanLine },
    capo: { title: t("tool_capo"), desc: t("tool_capo_desc"), Icon: ClipboardList },
    settimana: { title: t("tool_settimana"), desc: t("tool_settimana_desc"), Icon: CalendarDays },
    lavoro: { title: t("tool_lavoro"), desc: t("tool_lavoro_desc"), Icon: ChefHat },
    adatta: { title: t("tool_adatta"), desc: t("tool_adatta_desc"), Icon: Flame },
    termo: { title: t("tool_termo"), desc: t("tool_termo_desc"), Icon: Thermometer },
    sveglia: { title: t("tool_sveglia"), desc: t("tool_sveglia_desc"), Icon: Wheat },
  };

  const STEPS = [
    { n: 1, title: t("step1_title"), desc: t("step1_desc"), Icon: BookPlus, tools: ["aggiungi", "scan"] },
    { n: 2, title: t("step2_title"), desc: t("step2_desc"), Icon: CalendarDays, tools: ["capo", "settimana", "lavoro"] },
    { n: 3, title: t("step3_title"), desc: t("step3_desc"), Icon: Camera, tools: ["adatta"] },
    { n: 4, title: t("step4_title"), desc: t("step4_desc"), Icon: Sparkles, tools: ["termo", "sveglia"] },
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
        {tool === "scan" && <ScanRecipe />}
        {tool === "capo" && <CapoLaboratorio />}
        {tool === "settimana" && <WeeklyPlan />}
        {tool === "lavoro" && <StartDoughs />}
        {tool === "adatta" && <AdattaForno />}
        {tool === "termo" && <ClimaTermostato />}
        {tool === "sveglia" && <SvegliaLievito />}
      </div>
    );
  }

  return (
    <div className="pb-4">
      <h1 className="font-display text-3xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("maestro_title")}</h1>
      <p className="text-sm text-[#8C7567] mt-1 mb-5">{t("maestro_flow_intro")}</p>

      <div className="space-y-5">
        {STEPS.map(({ n, title, desc, Icon, tools }, si) => (
          <motion.div
            key={n}
            data-testid={`maestro-step-${n}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.08 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#B34A26] text-white flex items-center justify-center shrink-0 font-display font-bold">
                {n}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-lg font-bold text-[#2C221E] dark:text-[#F5EFE6] leading-tight flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-[#B34A26]" /> {title.replace(/^\d+\s·\s/, "")}
                </h2>
                <p className="text-xs text-[#8C7567] leading-snug">{desc}</p>
              </div>
            </div>
            <div className="ml-4 pl-4 border-l-2 border-[#E8DEC8] dark:border-[#3D302A] space-y-2">
              {tools.map((id) => {
                const m = TOOL_META[id];
                if (!m) return null;
                const { title: tt, desc: td, Icon: TI } = m;
                return (
                  <button
                    key={id}
                    data-testid={`maestro-tool-${id}`}
                    onClick={() => setTool(id)}
                    className="w-full flex items-center gap-3 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-3.5 shadow-sm active:scale-98 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#D99B26]/15 border border-[#D99B26]/30 flex items-center justify-center shrink-0">
                      <TI className="w-5 h-5 text-[#B34A26]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-base font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{tt}</h3>
                      <p className="text-xs text-[#8C7567] truncate">{td}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#C9BBB0] shrink-0" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
