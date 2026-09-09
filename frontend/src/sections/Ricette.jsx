import { useState, useEffect } from "react";
import { ChevronLeft, Tag, BookOpen, Wheat, UtensilsCrossed, Sandwich } from "lucide-react";
import RecipeList from "@/components/RecipeList";
import { NovitaColorate } from "@/components/NovitaColorate";
import GuidaMetodi from "@/sections/Enciclopedia";
import Glossario from "@/sections/Glossario";
import FlourTable from "@/components/FlourTable";
import SaporiCasa from "@/sections/SaporiCasa";
// (Rimosso "Scopri MikiLab" / "Guida al Sito" su richiesta)
import SaporeDelGiorno from "@/components/SaporeDelGiorno";
import RicetteCustodite from "@/sections/RicetteCustodite";
import VetrinaFocacce from "@/components/VetrinaFocacce";
import { useLang } from "@/i18n/LanguageContext";
import { useBackClose } from "@/lib/backNav";
import { mkTri, triFA } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { downloadCsv, downloadRecipesPdf } from "@/lib/recipeExport";
import { toast } from "sonner";
import { Download } from "lucide-react";

export default function Ricette() {
  const { t, lang } = useLang();
  const tri = (i, d, e, s, f) => mkTri(lang)(i, d, e, s, f);
  const [expBusy, setExpBusy] = useState(false);
  const exportMine = async (kind) => {
    if (expBusy) return;
    setExpBusy(true);
    try {
      const mine = await recipesApi.list("personal");
      if (!mine || mine.length === 0) { toast.error(tri("Non hai ancora ricette personali da esportare.", "Noch keine eigenen Rezepte zum Exportieren.", "You have no personal recipes to export yet.", "Aún no tienes recetas personales.")); return; }
      if (kind === "csv") { downloadCsv(mine); }
      else { await downloadRecipesPdf(mine, lang); }
      toast.success(tri("Backup ricette scaricato ✅", "Rezept-Backup heruntergeladen ✅", "Recipe backup downloaded ✅", "Copia de recetas descargada ✅"));
    } catch {
      toast.error(tri("Export non riuscito, riprova.", "Export fehlgeschlagen.", "Export failed, try again.", "Error al exportar."));
    } finally { setExpBusy(false); }
  };
  const [view, setView] = useState("main");
  const [backupOpen, setBackupOpen] = useState(false);
  const [custoditeInit, setCustoditeInit] = useState(null);
  useBackClose(view !== "main", () => setView("main"));
  useEffect(() => {
    const h = (e) => { const v = e?.detail?.view; if (v) { setView(v); window.scrollTo(0, 0); } };
    window.addEventListener("mikilab-ricette-view", h);
    return () => window.removeEventListener("mikilab-ricette-view", h);
  }, []);

  if (view === "guida") return <Sub onBack={() => setView("main")}><GuidaMetodi /><div className="mt-6 pt-6 border-t border-[#2A3B49] dark:border-[#2A3B49]"><Glossario /></div></Sub>;
  if (view === "custodite") return <Sub onBack={() => { setView("main"); setCustoditeInit(null); }}><RicetteCustodite initialId={custoditeInit} /></Sub>;
  if (view === "sapori") return <SaporiCasa onBack={() => setView("main")} />;
  if (view === "focacce") return <Sub onBack={() => setView("main")}><VetrinaFocacce onOpenRecipe={(id) => { setView("main"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 80); }} /></Sub>;
  if (view === "farine") return (
    <Sub onBack={() => setView("main")}>
      <div data-testid="ricette-farine" className="space-y-4">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#3E9C93] to-[#3E9C93] p-6 text-white">
          <div className="it-de-ribbon absolute top-0 left-0 right-0" />
          <div className="flex items-center gap-2 mb-1"><Wheat className="w-6 h-6" /><h1 className="font-display text-2xl font-bold">{tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours", "Tablas y Harinas", "Tableaux & Farines")}</h1></div>
          <div className="h-1 w-12 rounded-full bg-[#3E9C93] mb-3" />
          <p className="text-sm text-white/90 leading-relaxed italic">
            {tri(
              "«La farina è la mia lingua madre. In Italia ho imparato che ogni grano racconta una storia: la forza (W), l'assorbimento, i tempi. Qui trovi le sigle e le tabelle che uso ogni giorno per scegliere la farina giusta per ogni impasto. Rispetta il grano e il grano ti ripagherà.» — Michele",
              "„Mehl ist meine Muttersprache. In Italien habe ich gelernt, dass jedes Korn eine Geschichte erzählt: Stärke (W), Wasseraufnahme, Zeiten. Hier findest du die Kürzel und Tabellen, die ich täglich nutze, um das richtige Mehl für jeden Teig zu wählen. Respektiere das Korn, und das Korn belohnt dich.“ — Michele",
              "\"Flour is my mother tongue. In Italy I learned that every grain tells a story: strength (W), absorption, timing. Here are the codes and tables I use every day to choose the right flour for each dough. Respect the grain and the grain will reward you.\" — Michele",
              "«La harina es mi lengua materna. En Italia aprendí que cada grano cuenta una historia: la fuerza (W), la absorción, los tiempos. Aquí tienes las siglas y tablas que uso cada día para elegir la harina justa para cada masa. Respeta el grano y el grano te lo devolverá.» — Michele",
              "« La farine est ma langue maternelle. En Italie j'ai appris que chaque grain raconte une histoire : la force (W), l'absorption, les temps. Voici les sigles et les tableaux que j'utilise chaque jour pour choisir la bonne farine pour chaque pâte. Respecte le grain et le grain te le rendra. » — Michele"
            )}
          </p>
        </div>
        <FlourTable embedded />
      </div>
    </Sub>
  );

  return (
    <div data-testid="ricette-page" className="pb-4">
      {/* HEADER UNICO — Ricette del MikiLab (foto nuova) */}
      <div data-testid="ricette-title" className="relative rounded-3xl overflow-hidden mb-4 h-44">
        <img src={`${process.env.PUBLIC_URL}/mikilab-ricette-hero.jpg`} alt="" className="w-full h-full object-cover" style={{ objectPosition: "50% 55%" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/40 to-transparent" />
        <div aria-hidden className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#D9520011_1px,transparent_1px),linear-gradient(to_bottom,#D9520011_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-30" />
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/35 backdrop-blur rounded-full px-2.5 py-1 border border-white/25">
          <span className="text-lg leading-none" title="Italiano">🇮🇹</span>
          <span className="text-lg leading-none" title="Deutsch">🇩🇪</span>
        </div>
        <div className="absolute bottom-0 left-0 p-5">
          <h1 className="font-display text-3xl font-bold text-white leading-tight" style={{ textShadow: "0 2px 10px rgba(0,0,0,.85)" }}>
            {mkTri(lang)("Ricette del MikiLab", "MikiLab Rezepte", "MikiLab Recipes", "Recetas del MikiLab", "Recettes du MikiLab", "دستورهای میکی‌لب")}
          </h1>
          <div className="h-1 w-12 rounded-full bg-[#D95200] mt-1.5 mb-1" />
          <p className="text-white/90 text-sm max-w-md" style={{ textShadow: "0 1px 6px rgba(0,0,0,.9)" }}>
            {mkTri(lang)("Tutto il ricettario professionale: sfoglia, scala le dosi e adatta alla tua produzione.", "Das komplette Profi-Rezeptbuch: blättern, Mengen skalieren und an deine Produktion anpassen.", "The full professional recipe book: browse, scale doses and adapt to your production.", "Todo el recetario profesional: hojea, escala las dosis y adáptalo a tu producción.", "Tout le recettaire professionnel : feuillette, adapte les quantités à ta production.", "کل کتاب دستور حرفه‌ای: ورق بزن، مقادیر را تنظیم و با تولیدت هماهنگ کن.")}
          </p>
        </div>
      </div>

      {/* BARRA BOTTONI — tutti in alto, compatti */}
      <div data-testid="ricette-toolbar" className="grid grid-cols-3 gap-2 mb-4">
        <UtilBtn testid="ricette-sapori-band" Icon={UtensilsCrossed} label={tri("Sapori di Casa", "Geschmack von zu Hause", "Home Flavours", "Sabores de Casa", "Saveurs de la Maison")} onClick={() => setView("sapori")} />
        <UtilBtn testid="ricette-custodite-band" Icon={Tag} label={tri("Ricette Custodite", "Bewahrte Rezepte", "Treasured Recipes", "Recetas Custodiadas", "Recettes Gardées")} onClick={() => setView("custodite")} />
        <UtilBtn testid="ricette-focacce-band" Icon={Sandwich} label={tri("Vetrina Focacce", "Focaccia-Schaufenster", "Focaccia Showcase", "Vitrina de Focaccias", "Vitrine des Focaccias")} onClick={() => setView("focacce")} />
        <UtilBtn testid="ricette-guida-btn" Icon={BookOpen} label={tri("Enciclopedia del Pane", "Brot-Lexikon", "Bread Encyclopedia", "Enciclopedia del Pan", "Encyclopédie du Pain")} onClick={() => setView("guida")} />
        <UtilBtn testid="ricette-farine-btn" Icon={Wheat} label={tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours", "Tablas y Harinas", "Tableaux & Farines")} onClick={() => setView("farine")} />
        <UtilBtn testid="ricette-backup-btn" Icon={Download} label={tri("Backup Ricette", "Rezept-Backup", "Recipe Backup", "Copia de Recetas", "Sauvegarde Recettes")} onClick={() => setBackupOpen(true)} />
      </div>

      <div className="mb-4"><SaporeDelGiorno /></div>

      <div data-testid="ricette-list">
      <RecipeList
        collectionName="mikilab"
        deptScoped={true}
        hideHero={true}
        emptyText={t("mikilab_empty")}
        extraHeader={<NovitaColorate />}
      />
      </div>

      {backupOpen && (
        <div data-testid="ricette-backup-modal" className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4" onClick={() => setBackupOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-[#14212C] border border-[#2A3B49] rounded-3xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-10 h-10 rounded-2xl bg-[#3E9C93]/15 border border-[#3E9C93]/40 flex items-center justify-center shrink-0"><Download className="w-5 h-5 text-[#3E9C93]" /></span>
              <h3 className="font-display text-lg font-extrabold text-white">{tri("Backup delle tue ricette", "Backup deiner Rezepte", "Backup your recipes", "Copia de tus recetas", "Sauvegarde de tes recettes")}</h3>
            </div>
            <p className="text-[13px] text-[#AEB8BF] leading-snug mb-4">{tri("Scarica una copia delle tue ricette personali. Scegli il formato.", "Lade eine Kopie deiner eigenen Rezepte herunter. Wähle das Format.", "Download a copy of your personal recipes. Choose the format.", "Descarga una copia de tus recetas personales. Elige el formato.", "Télécharge une copie de tes recettes personnelles. Choisis le format.")}</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button data-testid="ricette-export-csv-btn" disabled={expBusy} onClick={() => { setBackupOpen(false); exportMine("csv"); }}
                className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-[#1B2A38] border border-[#3E9C93]/40 text-white active:scale-97 hover:border-[#3E9C93] transition-all disabled:opacity-50">
                <Download className="w-5 h-5 text-[#3E9C93]" /><span className="font-display text-sm font-bold">CSV</span>
                <span className="text-[10.5px] text-[#7E8A93]">{tri("Fogli di calcolo", "Tabellen", "Spreadsheets", "Hojas de cálculo", "Tableurs")}</span>
              </button>
              <button data-testid="ricette-export-pdf-btn" disabled={expBusy} onClick={() => { setBackupOpen(false); exportMine("pdf"); }}
                className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-[#1B2A38] border border-[#3E9C93]/40 text-white active:scale-97 hover:border-[#3E9C93] transition-all disabled:opacity-50">
                <Download className="w-5 h-5 text-[#3E9C93]" /><span className="font-display text-sm font-bold">PDF</span>
                <span className="text-[10.5px] text-[#7E8A93]">{tri("Da stampare", "Zum Drucken", "For printing", "Para imprimir", "À imprimer")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UtilBtn({ testid, Icon, label, onClick }) {
  return (
    <button data-testid={testid} onClick={onClick}
      className="flex flex-col items-center justify-start gap-2 bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl p-3 shadow-sm active:scale-97 hover:border-[#3E9C93]/60 transition-all min-w-0">
      <div className="w-10 h-10 rounded-2xl shadow-md border border-amber-900/40 bg-[#3E9C93]/15 border border-[#3E9C93]/30 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#3E9C93]" />
      </div>
      <span className="w-full font-display text-xs sm:text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] text-center leading-tight break-words hyphens-auto">{label}</span>
    </button>
  );
}

function Sub({ onBack, children }) {
  const { lang } = useLang();
  const backLabel = lang === "de" ? "Rezepte" : lang === "en" ? "Recipes" : lang === "es" ? "Recetas" : lang === "fr" ? "Recettes" : lang === "fa" ? (triFA("Ricette") || "دستورها") : "Ricette";
  return (
    <div className="pb-4">
      <button data-testid="ricette-back-btn" onClick={onBack} className="flex items-center gap-1 text-[#3E9C93] font-medium mb-4">
        <ChevronLeft className="w-5 h-5" /> {backLabel}
      </button>
      {children}
    </div>
  );
}
