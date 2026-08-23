import { useState } from "react";
import { ChevronLeft, Tag, BookOpen } from "lucide-react";
import RecipeList from "@/components/RecipeList";
import PanettoneLabels from "@/sections/PanettoneLabels";
import GuidaMetodi from "@/sections/GuidaMetodi";
import { useLang } from "@/i18n/LanguageContext";
import { useBackClose } from "@/lib/backNav";

export default function Ricette() {
  const { t } = useLang();
  const [view, setView] = useState("main");
  useBackClose(view !== "main", () => setView("main"));

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
        heroImage={`${process.env.PUBLIC_URL}/michele-avatar-full.jpg`}
        heroPosition="50% 15%"
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
      className="flex items-center gap-2.5 bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl p-3.5 shadow-sm active:scale-97 hover:border-[#6E8CA0]/60 transition-all">
      <div className="w-10 h-10 rounded-xl bg-[#6E8CA0]/15 border border-[#6E8CA0]/30 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#5E8B7E]" />
      </div>
      <span className="font-display text-sm font-semibold text-[#2B303B] dark:text-[#EAF0EC] text-left leading-tight">{label}</span>
    </button>
  );
}

function Sub({ onBack, children }) {
  return (
    <div className="pb-4">
      <button data-testid="ricette-back-btn" onClick={onBack} className="flex items-center gap-1 text-[#5E8B7E] font-medium mb-4">
        <ChevronLeft className="w-5 h-5" /> Ricette
      </button>
      {children}
    </div>
  );
}
