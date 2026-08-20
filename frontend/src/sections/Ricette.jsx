import { useState } from "react";
import { ChevronLeft, Tag, BookOpen } from "lucide-react";
import RecipeList from "@/components/RecipeList";
import PanettoneLabels from "@/sections/PanettoneLabels";
import GuidaMetodi from "@/sections/GuidaMetodi";
import { useLang } from "@/i18n/LanguageContext";

export default function Ricette() {
  const { t } = useLang();
  const [view, setView] = useState("main");

  if (view === "labels") return <Sub onBack={() => setView("main")}><PanettoneLabels /></Sub>;
  if (view === "guida") return <Sub onBack={() => setView("main")}><GuidaMetodi /></Sub>;

  return (
    <div data-testid="ricette-page">
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <UtilBtn testid="ricette-guida-btn" Icon={BookOpen} label={t("tool_guida")} onClick={() => setView("guida")} />
        <UtilBtn testid="ricette-labels-btn" Icon={Tag} label={t("tool_labels")} onClick={() => setView("labels")} />
      </div>
      <RecipeList
        collectionName="mikilab"
        heroImage="https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
        heroTitle={t("brand_subtitle")}
        heroSubtitle={t("mikilab_subtitle")}
        emptyText={t("mikilab_empty")}
      />
    </div>
  );
}

function UtilBtn({ testid, Icon, label, onClick }) {
  return (
    <button data-testid={testid} onClick={onClick}
      className="flex items-center gap-2.5 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-3.5 shadow-sm active:scale-97 hover:border-[#D99B26]/60 transition-all">
      <div className="w-10 h-10 rounded-xl bg-[#D99B26]/15 border border-[#D99B26]/30 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#B34A26]" />
      </div>
      <span className="font-display text-sm font-semibold text-[#2C221E] dark:text-[#F5EFE6] text-left leading-tight">{label}</span>
    </button>
  );
}

function Sub({ onBack, children }) {
  return (
    <div className="pb-4">
      <button data-testid="ricette-back-btn" onClick={onBack} className="flex items-center gap-1 text-[#B34A26] font-medium mb-4">
        <ChevronLeft className="w-5 h-5" /> Ricette
      </button>
      {children}
    </div>
  );
}
