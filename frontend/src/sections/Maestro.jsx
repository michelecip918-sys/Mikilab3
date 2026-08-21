import { useState } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle, CalendarDays, ChefHat, Flame, Wheat, ChevronLeft, ChevronRight,
  ClipboardList, Thermometer, ScanLine, Clock, ShoppingCart, Users, CheckSquare, ListChecks, Snowflake,
} from "lucide-react";
import RecipeList from "@/components/RecipeList";
import WeeklyPlan from "@/sections/WeeklyPlan";
import StartDoughs from "@/sections/StartDoughs";
import AdattaForno from "@/sections/AdattaForno";
import SvegliaLievito from "@/sections/SvegliaLievito";
import CapoLaboratorio from "@/sections/CapoLaboratorio";
import ClimaTermostato from "@/sections/ClimaTermostato";
import ScanRecipe from "@/sections/ScanRecipe";
import BackwardScheduler from "@/sections/BackwardScheduler";
import ShoppingList from "@/sections/ShoppingList";
import ShiftRoles from "@/sections/ShiftRoles";
import Checklists from "@/sections/Checklists";
import FreezerStock from "@/sections/FreezerStock";
import { useLang } from "@/i18n/LanguageContext";
import { MikiAvatar } from "@/components/MikiAvatar";

export default function Maestro() {
  const [tool, setTool] = useState(null);
  const { t, lang } = useLang();

  const TOOLS = [
    { id: "lavoro", title: t("tool_lavoro"), desc: t("tool_lavoro_desc"), Icon: ChefHat },
    { id: "inversa", title: t("tool_inversa"), desc: t("tool_inversa_desc"), Icon: Clock },
    { id: "adatta", title: t("tool_adatta"), desc: t("tool_adatta_desc"), Icon: Flame },
    { id: "settimana", title: t("tool_settimana"), desc: t("tool_settimana_desc"), Icon: CalendarDays },
    { id: "check", title: t("tool_check"), desc: t("tool_check_desc"), Icon: ListChecks },
    { id: "spesa", title: t("tool_spesa"), desc: t("tool_spesa_desc"), Icon: ShoppingCart },
    { id: "turni", title: t("tool_turni"), desc: t("tool_turni_desc"), Icon: Users },
    { id: "freezer", title: lang === "de" ? "Freezer-Bestand" : "Giacenze Freezer", desc: "", Icon: Snowflake },
    { id: "aggiungi", title: t("tool_aggiungi"), desc: t("tool_aggiungi_desc"), Icon: PlusCircle },
    { id: "scan", title: t("tool_scan"), desc: t("tool_scan_desc"), Icon: ScanLine },
    { id: "termo", title: t("tool_termo"), desc: t("tool_termo_desc"), Icon: Thermometer },
    { id: "capo", title: t("tool_capo"), desc: t("tool_capo_desc"), Icon: ClipboardList },
  ];

  const STEPS = [
    { n: 1, t: t("mstep1_t"), d: t("mstep1_d") },
    { n: 2, t: t("mstep2_t"), d: t("mstep2_d") },
    { n: 3, t: t("mstep3_t"), d: t("mstep3_d") },
    { n: 4, t: t("mstep4_t"), d: t("mstep4_d") },
  ];

  if (tool) {
    return (
      <div>
        <button data-testid="maestro-back-btn" onClick={() => setTool(null)} className="flex items-center gap-1 text-[#B34A26] font-medium mb-4">
          <ChevronLeft className="w-5 h-5" /> {t("tools_back")}
        </button>
        {tool === "aggiungi" && (
          <RecipeList collectionName="personal"
            heroImage="https://images.unsplash.com/photo-1732565649629-eb4932a1ec09?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
            heroTitle={t("personal_hero_title")} heroSubtitle={t("personal_hero_sub")} emptyText={t("personal_empty")} />
        )}
        {tool === "scan" && <ScanRecipe />}
        {tool === "capo" && <CapoLaboratorio />}
        {tool === "settimana" && <WeeklyPlan />}
        {tool === "inversa" && <BackwardScheduler />}
        {tool === "lavoro" && <StartDoughs />}
        {tool === "adatta" && <AdattaForno />}
        {tool === "termo" && <ClimaTermostato />}
        {tool === "freezer" && <FreezerStock />}
        {tool === "spesa" && <ShoppingList />}
        {tool === "turni" && <ShiftRoles />}
        {tool === "check" && <Checklists />}
        {tool === "sveglia" && <SvegliaLievito />}
      </div>
    );
  }

  return (
    <div className="pb-4">
      <MikiAvatar label="Michele" subtitle={t("maestro_title")} className="mb-4" />
      <h1 className="font-display text-3xl font-bold text-[#2C221E] dark:text-[#F5EFE6] mb-4">{t("maestro_title")}</h1>

      {/* Guida a 4 passi */}
      <div data-testid="maestro-guide" className="mb-6 rounded-3xl bg-[#D99B26]/10 border border-[#D99B26]/30 p-5">
        <h2 className="font-display text-lg font-bold text-[#2C221E] dark:text-[#F5EFE6] mb-3">{t("maestro_guide_title")}</h2>
        <div className="space-y-3">
          {STEPS.map((s) => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-[#B34A26] text-white flex items-center justify-center shrink-0 font-display font-bold text-sm">{s.n}</div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[#2C221E] dark:text-[#F5EFE6] leading-tight">{s.t.replace(/^\d+\s·\s/, "")}</p>
                <p className="text-xs text-[#8C7567] leading-snug">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tutti gli strumenti — 1 tap */}
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-[#B34A26] mb-3">{t("maestro_tools_title")}</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {TOOLS.map(({ id, title, desc, Icon }, i) => (
          <motion.button key={id} data-testid={`maestro-tool-${id}`} onClick={() => setTool(id)}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
            className="flex flex-col items-start gap-2 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-3.5 shadow-sm active:scale-97 hover:border-[#D99B26]/60 transition-all text-left min-h-[112px]">
            <div className="w-10 h-10 rounded-xl bg-[#D99B26]/15 border border-[#D99B26]/30 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#B34A26]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-base font-semibold text-[#2C221E] dark:text-[#F5EFE6] leading-tight">{title}</h3>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
