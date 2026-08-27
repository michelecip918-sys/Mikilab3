import { useState } from "react";
import { ChevronLeft, Tag, BookOpen, Wheat, ChefHat, User } from "lucide-react";
import RecipeList from "@/components/RecipeList";
import { NovitaColorate } from "@/components/NovitaColorate";
import PanettoneLabels from "@/sections/PanettoneLabels";
import GuidaMetodi from "@/sections/Enciclopedia";
import FlourTable from "@/components/FlourTable";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { useBackClose } from "@/lib/backNav";

export default function Ricette() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : lang === "en" ? e : i);
  const [view, setView] = useState("main");
  const [coll, setColl] = useState("mikilab");
  useBackClose(view !== "main", () => setView("main"));

  if (view === "labels") return <Sub onBack={() => setView("main")}><PanettoneLabels /></Sub>;
  if (view === "guida") return <Sub onBack={() => setView("main")}><GuidaMetodi /></Sub>;
  if (view === "farine") return (
    <Sub onBack={() => setView("main")}>
      <div data-testid="ricette-farine" className="space-y-4">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#2f6a97] to-[#234b6e] p-6 text-white">
          <div className="it-de-ribbon absolute top-0 left-0 right-0" />
          <div className="flex items-center gap-2 mb-1"><Wheat className="w-6 h-6" /><h1 className="font-display text-2xl font-bold">{tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours", "Tablas y Harinas")}</h1></div>
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
      {user && (
        <div data-testid="ricette-collection-switch" className="grid grid-cols-2 gap-2 mb-3 bg-[#e4eff8] dark:bg-[#2A323A] rounded-2xl p-1">
          <button
            data-testid="ricette-tab-mikilab"
            onClick={() => setColl("mikilab")}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${coll === "mikilab" ? "bg-white dark:bg-[#232A31] text-[#234b6e] dark:text-[#8FB0C2] shadow-sm" : "text-[#7E8A93]"}`}
          >
            <ChefHat className="w-4 h-4" /> {tri("Ricette MikiLab", "MikiLab-Rezepte", "MikiLab recipes", "Recetas MikiLab")}
          </button>
          <button
            data-testid="ricette-tab-personal"
            onClick={() => setColl("personal")}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${coll === "personal" ? "bg-white dark:bg-[#232A31] text-[#234b6e] dark:text-[#8FB0C2] shadow-sm" : "text-[#7E8A93]"}`}
          >
            <User className="w-4 h-4" /> {tri("Le Mie Ricette", "Meine Rezepte", "My Recipes", "Mis Recetas")}
          </button>
        </div>
      )}

      {coll === "mikilab" && (
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <UtilBtn testid="ricette-guida-btn" Icon={BookOpen} label={tri("Enciclopedia", "Lexikon", "Encyclopedia", "Enciclopedia")} onClick={() => setView("guida")} />
          <UtilBtn testid="ricette-farine-btn" Icon={Wheat} label={tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours", "Tablas y Harinas")} onClick={() => setView("farine")} />
          <UtilBtn testid="ricette-labels-btn" Icon={Tag} label={t("tool_labels")} onClick={() => setView("labels")} />
        </div>
      )}

      {coll === "mikilab" ? (
        <RecipeList
          collectionName="mikilab"
          heroImage={`${process.env.PUBLIC_URL}/michele-avatar-full.jpg`}
          heroPosition="50% 15%"
          heroTitle={t("brand_subtitle")}
          heroSubtitle={t("mikilab_subtitle")}
          emptyText={t("mikilab_empty")}
          extraHeader={<NovitaColorate />}
        />
      ) : (
        <RecipeList
          collectionName="personal"
          heroImage="https://images.unsplash.com/photo-1732565649629-eb4932a1ec09?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
          heroTitle={t("personal_hero_title")}
          heroSubtitle={t("personal_hero_sub")}
          emptyText={t("personal_empty")}
        />
      )}
    </div>
  );
}

function UtilBtn({ testid, Icon, label, onClick }) {
  return (
    <button data-testid={testid} onClick={onClick}
      className="flex flex-col items-center justify-start gap-2 bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] rounded-2xl p-3 shadow-sm active:scale-97 hover:border-[#6E8CA0]/60 transition-all min-w-0">
      <div className="w-10 h-10 rounded-xl bg-[#6E8CA0]/15 border border-[#6E8CA0]/30 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#3f7cac]" />
      </div>
      <span className="w-full font-display text-xs sm:text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] text-center leading-tight break-words hyphens-auto">{label}</span>
    </button>
  );
}

function Sub({ onBack, children }) {
  const { lang } = useLang();
  const backLabel = lang === "de" ? "Rezepte" : lang === "en" ? "Recipes" : "Ricette";
  return (
    <div className="pb-4">
      <button data-testid="ricette-back-btn" onClick={onBack} className="flex items-center gap-1 text-[#3f7cac] font-medium mb-4">
        <ChevronLeft className="w-5 h-5" /> {backLabel}
      </button>
      {children}
    </div>
  );
}
