import { useState } from "react";
import { ChevronLeft, Tag, BookOpen, Wheat, UtensilsCrossed, Compass } from "lucide-react";
import RecipeList from "@/components/RecipeList";
import { NovitaColorate } from "@/components/NovitaColorate";
import PanettoneLabels from "@/sections/PanettoneLabels";
import GuidaMetodi from "@/sections/Enciclopedia";
import FlourTable from "@/components/FlourTable";
import SaporiCasa from "@/sections/SaporiCasa";
import ScopriMikiLab from "@/sections/ScopriMikiLab";
import RicetteCustodite from "@/sections/RicetteCustodite";
import { useLang } from "@/i18n/LanguageContext";
import { useBackClose } from "@/lib/backNav";

export default function Ricette() {
  const { t, lang } = useLang();
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : (lang === "en" || lang === "fr" || lang === "fa") ? (e ?? i) : i);
  const [view, setView] = useState("main");
  const coll = "mikilab";
  useBackClose(view !== "main", () => setView("main"));

  if (view === "labels") return <Sub onBack={() => setView("main")}><PanettoneLabels /></Sub>;
  if (view === "guida") return <Sub onBack={() => setView("main")}><GuidaMetodi /></Sub>;
  if (view === "scopri") return <Sub onBack={() => setView("main")}><ScopriMikiLab /></Sub>;
  if (view === "custodite") return <Sub onBack={() => setView("main")}><RicetteCustodite /></Sub>;
  if (view === "sapori") return <SaporiCasa onBack={() => setView("main")} />;
  if (view === "farine") return (
    <Sub onBack={() => setView("main")}>
      <div data-testid="ricette-farine" className="space-y-4">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#2f6a97] to-[#6E371C] p-6 text-white">
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
      {coll === "mikilab" && (
        <div data-testid="ricette-tradizione" className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#8C4A27] mb-2 px-1 flex items-center gap-1.5"><UtensilsCrossed className="w-4 h-4" /> {tri("La Tradizione", "Die Tradition", "The Tradition", "La Tradición")}</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button data-testid="ricette-sapori-band" onClick={() => setView("sapori")}
              className="relative h-28 rounded-2xl overflow-hidden shadow-md active:scale-98 transition-all text-left">
              <img src="https://images.unsplash.com/photo-1598616068594-93ef7202a8ca?crop=entropy&cs=srgb&fm=jpg&q=85&w=900" alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,#3a2415cc,#6E371C88)" }} />
              <div className="relative h-full flex flex-col justify-end p-3 text-white">
                <h3 className="font-display text-base font-bold leading-tight">{tri("Sapori di Casa", "Geschmack von zu Hause", "Home Flavours", "Sabores de Casa")}</h3>
                <p className="text-[10.5px] text-white/90 leading-snug">{tri("Pane, focacce e pasta fatta in casa", "Brot, Focaccia & Pasta", "Bread, focaccia & pasta", "Pan, focaccia y pasta")}</p>
              </div>
            </button>
            <button data-testid="ricette-custodite-band" onClick={() => setView("custodite")}
              className="relative h-28 rounded-2xl overflow-hidden shadow-md active:scale-98 transition-all text-left">
              <img src="https://images.unsplash.com/photo-1590301157172-7ba48dd1c2b2?crop=entropy&cs=srgb&fm=jpg&q=85&w=900" alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,#3a2415cc,#8C4A2788)" }} />
              <div className="relative h-full flex flex-col justify-end p-3 text-white">
                <h3 className="font-display text-base font-bold leading-tight">{tri("Ricette Custodite", "Bewahrte Rezepte", "Treasured Recipes", "Recetas Custodiadas")}</h3>
                <p className="text-[10.5px] text-white/90 leading-snug">{tri("Pani del Sud + adatta le dosi + QR", "Süd-Brote + Mengen + QR", "Southern breads + adapt doses + QR", "Panes del Sur + dosis + QR")}</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {coll === "mikilab" && (
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <UtilBtn testid="ricette-scopri-btn" Icon={Compass} label={tri("Scopri MikiLab", "Entdecke MikiLab", "Discover MikiLab", "Descubre MikiLab")} onClick={() => setView("scopri")} />
          <UtilBtn testid="ricette-guida-btn" Icon={BookOpen} label={tri("Enciclopedia", "Lexikon", "Encyclopedia", "Enciclopedia")} onClick={() => setView("guida")} />
          <UtilBtn testid="ricette-farine-btn" Icon={Wheat} label={tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours", "Tablas y Harinas")} onClick={() => setView("farine")} />
          <UtilBtn testid="ricette-labels-btn" Icon={Tag} label={t("tool_labels")} onClick={() => setView("labels")} />
        </div>
      )}

      <RecipeList
        collectionName="mikilab"
        heroImage={`${process.env.PUBLIC_URL}/michele-avatar-full.jpg`}
        heroPosition="50% 15%"
        heroTitle={tri("Scopri MikiLab e le sue Ricette", "Entdecke MikiLab & seine Rezepte", "Discover MikiLab & its Recipes", "Descubre MikiLab y sus Recetas")}
        heroSubtitle={t("mikilab_subtitle")}
        emptyText={t("mikilab_empty")}
        extraHeader={<NovitaColorate />}
      />
    </div>
  );
}

function UtilBtn({ testid, Icon, label, onClick }) {
  return (
    <button data-testid={testid} onClick={onClick}
      className="flex flex-col items-center justify-start gap-2 bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-2xl p-3 shadow-sm active:scale-97 hover:border-[#B45309]/60 transition-all min-w-0">
      <div className="w-10 h-10 rounded-xl bg-[#B45309]/15 border border-[#B45309]/30 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#8C4A27]" />
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
      <button data-testid="ricette-back-btn" onClick={onBack} className="flex items-center gap-1 text-[#8C4A27] font-medium mb-4">
        <ChevronLeft className="w-5 h-5" /> {backLabel}
      </button>
      {children}
    </div>
  );
}
