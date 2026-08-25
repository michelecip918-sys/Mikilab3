import { useState } from "react";
import { ChevronLeft, Tag, BookOpen, Wheat } from "lucide-react";
import RecipeList from "@/components/RecipeList";
import PanettoneLabels from "@/sections/PanettoneLabels";
import GuidaMetodi from "@/sections/Enciclopedia";
import FlourTable from "@/components/FlourTable";
import { useLang } from "@/i18n/LanguageContext";
import { useBackClose } from "@/lib/backNav";

export default function Ricette() {
  const { t, lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const [view, setView] = useState("main");
  useBackClose(view !== "main", () => setView("main"));

  if (view === "labels") return <Sub onBack={() => setView("main")}><PanettoneLabels /></Sub>;
  if (view === "guida") return <Sub onBack={() => setView("main")}><GuidaMetodi /></Sub>;
  if (view === "farine") return (
    <Sub onBack={() => setView("main")}>
      <div data-testid="ricette-farine" className="space-y-4">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#4A7265] to-[#33564E] p-6 text-white">
          <div className="it-de-ribbon absolute top-0 left-0 right-0" />
          <div className="flex items-center gap-2 mb-1"><Wheat className="w-6 h-6" /><h1 className="font-display text-2xl font-bold">{tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours")}</h1></div>
          <div className="h-1 w-12 rounded-full bg-[#C88A2B] mb-3" />
          <p className="text-sm text-white/90 leading-relaxed italic">
            {tri(
              "«La farina è la mia lingua madre. In Italia ho imparato che ogni grano racconta una storia: la forza (W), l'assorbimento, i tempi. Qui trovi le sigle e le tabelle che uso ogni giorno per scegliere la farina giusta per ogni impasto. Rispetta il grano e il grano ti ripagherà.» — Michele",
              "„Mehl ist meine Muttersprache. In Italien habe ich gelernt, dass jedes Korn eine Geschichte erzählt: Stärke (W), Wasseraufnahme, Zeiten. Hier findest du die Kürzel und Tabellen, die ich täglich nutze, um das richtige Mehl für jeden Teig zu wählen. Respektiere das Korn, und das Korn belohnt dich.“ — Michele",
              "\"Flour is my mother tongue. In Italy I learned that every grain tells a story: strength (W), absorption, timing. Here are the codes and tables I use every day to choose the right flour for each dough. Respect the grain and the grain will reward you.\" — Michele"
            )}
          </p>
        </div>
        <FlourTable embedded />
      </div>
    </Sub>
  );

  return (
    <div data-testid="ricette-page">
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <UtilBtn testid="ricette-guida-btn" Icon={BookOpen} label={tri("Enciclopedia", "Lexikon", "Encyclopedia")} onClick={() => setView("guida")} />
        <UtilBtn testid="ricette-farine-btn" Icon={Wheat} label={tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours")} onClick={() => setView("farine")} />
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
