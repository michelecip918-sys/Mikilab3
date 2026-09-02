import { useState, useEffect } from "react";
import { ChevronLeft, Tag, BookOpen, Wheat, UtensilsCrossed, Compass } from "lucide-react";
import RecipeList from "@/components/RecipeList";
import AvatarBubbles from "@/components/AvatarBubbles";
import SectionHero from "@/components/SectionHero";
import { NovitaColorate } from "@/components/NovitaColorate";
import GuidaMetodi from "@/sections/Enciclopedia";
import Glossario from "@/sections/Glossario";
import FlourTable from "@/components/FlourTable";
import SaporiCasa from "@/sections/SaporiCasa";
import ScopriMikiLab from "@/sections/ScopriMikiLab";
import SaporeDelGiorno from "@/components/SaporeDelGiorno";
import RicetteCustodite from "@/sections/RicetteCustodite";
import VetrinaFocacce from "@/components/VetrinaFocacce";
import SectionJumpBar from "@/components/SectionJumpBar";
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
  const coll = "mikilab";
  useBackClose(view !== "main", () => setView("main"));
  useEffect(() => {
    const h = (e) => { const v = e?.detail?.view; if (v) { setView(v); window.scrollTo(0, 0); } };
    window.addEventListener("mikilab-ricette-view", h);
    return () => window.removeEventListener("mikilab-ricette-view", h);
  }, []);

  if (view === "guida") return <Sub onBack={() => setView("main")}><GuidaMetodi /><div className="mt-6 pt-6 border-t border-[#2e2e2e] dark:border-[#2e2e2e]"><Glossario /></div></Sub>;
  if (view === "scopri") return <Sub onBack={() => setView("main")}><ScopriMikiLab /></Sub>;
  if (view === "custodite") return <Sub onBack={() => { setView("main"); setCustoditeInit(null); }}><RicetteCustodite initialId={custoditeInit} /></Sub>;
  if (view === "sapori") return <SaporiCasa onBack={() => setView("main")} />;
  if (view === "focacce") return <Sub onBack={() => setView("main")}><VetrinaFocacce onOpenRecipe={(id) => { setView("main"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 80); }} /></Sub>;
  if (view === "farine") return (
    <Sub onBack={() => setView("main")}>
      <div data-testid="ricette-farine" className="space-y-4">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#c94f00] to-[#c94f00] p-6 text-white">
          <div className="it-de-ribbon absolute top-0 left-0 right-0" />
          <div className="flex items-center gap-2 mb-1"><Wheat className="w-6 h-6" /><h1 className="font-display text-2xl font-bold">{tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours", "Tablas y Harinas", "Tableaux & Farines")}</h1></div>
          <div className="h-1 w-12 rounded-full bg-[#c94f00] mb-3" />
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
    <div data-testid="ricette-page">
      <SectionHero testid="ricette-title" image="hero-ricette.jpg" position="50% 30%"
        title={mkTri(lang)("Ricette del MikiLab", "MikiLab Rezepte", "MikiLab Recipes", "Recetas del MikiLab", "Recettes du MikiLab", "دستورهای میکی‌لب")}
        subtitle={mkTri(lang)("Ricette artigianali spiegate passo dopo passo, con il mio metodo", "Handwerkliche Rezepte, Schritt für Schritt nach meiner Methode", "Artisan recipes explained step by step, with my method", "Recetas artesanales explicadas paso a paso, con mi método", "Recettes artisanales expliquées pas à pas, avec ma méthode", "دستورهای دست‌ساز، گام‌به‌گام با روش من")} />
      <AvatarBubbles variant="ricette" />
      {coll === "mikilab" && (
        <SectionJumpBar testid="ricette-jump" sections={[
          { target: "ricette-tradizione", label: tri("Tradizione", "Tradition", "Tradition", "Tradición", "Tradition"), Icon: UtensilsCrossed },
          { target: "ricette-utils", label: tri("Guide", "Anleitungen", "Guides", "Guías", "Guides"), Icon: BookOpen },
          { target: "ricette-list", label: tri("Ricettario", "Rezeptbuch", "Recipe book", "Recetario", "Recettes"), Icon: Wheat },
        ]} />
      )}
      <div className="mb-4"><SaporeDelGiorno /></div>
      {coll === "mikilab" && (
        <button data-testid="ricette-vetrina" onClick={() => { setCustoditeInit("matera"); setView("custodite"); }}
          className="relative w-full h-32 rounded-2xl overflow-hidden mb-3 shadow-md active:scale-98 transition-all text-left ring-2 ring-[#c94f00]/60">
          <img src="https://images.unsplash.com/photo-1549413468-cd78edb7e75c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200" alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,#3a2415ee 15%,#c94f00aa 60%,#c94f0022)" }} />
          <div className="relative h-full flex flex-col justify-center px-4 text-white">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide bg-[#c94f00] px-2 py-0.5 rounded-full w-fit mb-1">★ {tri("In vetrina", "Im Schaufenster", "Featured", "En vitrina", "À la une")}</span>
            <h3 className="font-display text-xl font-bold leading-tight">{tri("Pane di Matera IGP", "Materaner Brot", "Bread of Matera", "Pan de Matera", "Pain de Matera")}</h3>
            <p className="text-[12px] text-white/90">{tri("La ricetta della tradizione, adattata alle tue dosi", "Das Traditionsrezept, an deine Mengen angepasst", "The traditional recipe, adapted to your amounts", "La receta tradicional, adaptada a tus dosis", "La recette de tradition, adaptée à tes quantités")}</p>
          </div>
        </button>
      )}

      {coll === "mikilab" && (
        <div data-testid="ricette-tradizione" className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#c94f00] mb-2 px-1 flex items-center gap-1.5"><UtensilsCrossed className="w-4 h-4" /> {tri("La Tradizione", "Die Tradition", "The Tradition", "La Tradición", "La Tradition")}</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button data-testid="ricette-sapori-band" onClick={() => setView("sapori")}
              className="relative h-28 rounded-2xl overflow-hidden shadow-md active:scale-98 transition-all text-left">
              <img src="https://images.unsplash.com/photo-1598616068594-93ef7202a8ca?crop=entropy&cs=srgb&fm=jpg&q=85&w=900" alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,#3a2415cc,#c94f0088)" }} />
              <div className="relative h-full flex flex-col justify-end p-3 text-white">
                <h3 className="font-display text-base font-bold leading-tight">{tri("Sapori di Casa", "Geschmack von zu Hause", "Home Flavours", "Sabores de Casa", "Saveurs de la Maison")}</h3>
                <p className="text-[10.5px] text-white/90 leading-snug">{tri("Pane, focacce e pasta fatta in casa", "Brot, Focaccia & Pasta", "Bread, focaccia & pasta", "Pan, focaccia y pasta", "Pain, focaccia & pâtes maison")}</p>
              </div>
            </button>
            <button data-testid="ricette-custodite-band" onClick={() => setView("custodite")}
              className="relative h-28 rounded-2xl overflow-hidden shadow-md active:scale-98 transition-all text-left">
              <img src="https://images.unsplash.com/photo-1590301157172-7ba48dd1c2b2?crop=entropy&cs=srgb&fm=jpg&q=85&w=900" alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,#3a2415cc,#c94f0088)" }} />
              <div className="relative h-full flex flex-col justify-end p-3 text-white">
                <h3 className="font-display text-base font-bold leading-tight">{tri("Ricette Custodite", "Bewahrte Rezepte", "Treasured Recipes", "Recetas Custodiadas", "Recettes Gardées")}</h3>
                <p className="text-[10.5px] text-white/90 leading-snug">{tri("Pani del Sud + adatta le dosi + QR", "Süd-Brote + Mengen + QR", "Southern breads + adapt doses + QR", "Panes del Sur + dosis + QR", "Pains du Sud + adapte les doses + QR")}</p>
              </div>
            </button>
            <button data-testid="ricette-focacce-band" onClick={() => setView("focacce")}
              className="relative h-28 rounded-2xl overflow-hidden shadow-md active:scale-98 transition-all text-left col-span-2">
              <img src="/recipes/foc_barese.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center" onError={(e) => { e.currentTarget.style.display = "none"; }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,#3a2415ee 10%,#c94f0099 70%,#c94f0022)" }} />
              <div className="relative h-full flex flex-col justify-center p-3 text-white">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide bg-[#c94f00] px-2 py-0.5 rounded-full w-fit mb-1">🫓 {tri("Novità", "Neu", "New", "Novedad", "Nouveau")}</span>
                <h3 className="font-display text-lg font-bold leading-tight">{tri("Vetrina delle Focacce", "Focaccia-Schaufenster", "Focaccia Showcase", "Vitrina de Focaccias", "Vitrine des Focaccias")}</h3>
                <p className="text-[11px] text-white/90 leading-snug">{tri("Tutti i gusti in foto, sfoglia e scegli", "Alle Sorten in Fotos, blättern und wählen", "Every flavour in photos, browse and choose", "Todos los sabores en fotos, hojea y elige", "Toutes les saveurs en photos, feuillette et choisis")}</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {coll === "mikilab" && (
        <div data-testid="ricette-utils" className="grid grid-cols-2 gap-2.5 mb-4">
          <UtilBtn testid="ricette-scopri-btn" Icon={Compass} label={tri("Scopri MikiLab", "Entdecke MikiLab", "Discover MikiLab", "Descubre MikiLab", "Découvre MikiLab")} onClick={() => setView("scopri")} />
          <UtilBtn testid="ricette-guida-btn" Icon={BookOpen} label={tri("Enciclopedia del Pane", "Brot-Lexikon", "Bread Encyclopedia", "Enciclopedia del Pan", "Encyclopédie du Pain")} onClick={() => setView("guida")} />
          <UtilBtn testid="ricette-farine-btn" Icon={Wheat} label={tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours", "Tablas y Harinas", "Tableaux & Farines")} onClick={() => setView("farine")} />
          <UtilBtn testid="ricette-backup-btn" Icon={Download} label={tri("Backup Ricette", "Rezept-Backup", "Recipe Backup", "Copia de Recetas", "Sauvegarde Recettes")} onClick={() => setBackupOpen(true)} />
        </div>
      )}

      <div data-testid="ricette-list">
      <RecipeList
        collectionName="mikilab"
        heroImage={`${process.env.PUBLIC_URL}/michele-avatar-full.jpg`}
        heroPosition="50% 15%"
        heroTitle={tri("Scopri MikiLab e le sue Ricette", "Entdecke MikiLab & seine Rezepte", "Discover MikiLab & its Recipes", "Descubre MikiLab y sus Recetas", "Découvre MikiLab et ses Recettes")}
        heroSubtitle={t("mikilab_subtitle")}
        emptyText={t("mikilab_empty")}
        extraHeader={<NovitaColorate />}
      />
      </div>

      {backupOpen && (
        <div data-testid="ricette-backup-modal" className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4" onClick={() => setBackupOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-[#161616] border border-[#2e2e2e] rounded-3xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="w-10 h-10 rounded-2xl bg-[#c94f00]/15 border border-[#c94f00]/40 flex items-center justify-center shrink-0"><Download className="w-5 h-5 text-[#c94f00]" /></span>
              <h3 className="font-display text-lg font-extrabold text-white">{tri("Backup delle tue ricette", "Backup deiner Rezepte", "Backup your recipes", "Copia de tus recetas", "Sauvegarde de tes recettes")}</h3>
            </div>
            <p className="text-[13px] text-[#AEB8BF] leading-snug mb-4">{tri("Scarica una copia delle tue ricette personali. Scegli il formato.", "Lade eine Kopie deiner eigenen Rezepte herunter. Wähle das Format.", "Download a copy of your personal recipes. Choose the format.", "Descarga una copia de tus recetas personales. Elige el formato.", "Télécharge une copie de tes recettes personnelles. Choisis le format.")}</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button data-testid="ricette-export-csv-btn" disabled={expBusy} onClick={() => { setBackupOpen(false); exportMine("csv"); }}
                className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-[#1e1e1e] border border-[#c94f00]/40 text-white active:scale-97 hover:border-[#c94f00] transition-all disabled:opacity-50">
                <Download className="w-5 h-5 text-[#c94f00]" /><span className="font-display text-sm font-bold">CSV</span>
                <span className="text-[10.5px] text-[#7E8A93]">{tri("Fogli di calcolo", "Tabellen", "Spreadsheets", "Hojas de cálculo", "Tableurs")}</span>
              </button>
              <button data-testid="ricette-export-pdf-btn" disabled={expBusy} onClick={() => { setBackupOpen(false); exportMine("pdf"); }}
                className="flex flex-col items-center gap-1.5 py-4 rounded-2xl bg-[#1e1e1e] border border-[#c94f00]/40 text-white active:scale-97 hover:border-[#c94f00] transition-all disabled:opacity-50">
                <Download className="w-5 h-5 text-[#c94f00]" /><span className="font-display text-sm font-bold">PDF</span>
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
      className="flex flex-col items-center justify-start gap-2 bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl p-3 shadow-sm active:scale-97 hover:border-[#c94f00]/60 transition-all min-w-0">
      <div className="w-10 h-10 rounded-2xl shadow-md border border-amber-900/40 bg-[#c94f00]/15 border border-[#c94f00]/30 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#c94f00]" />
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
      <button data-testid="ricette-back-btn" onClick={onBack} className="flex items-center gap-1 text-[#c94f00] font-medium mb-4">
        <ChevronLeft className="w-5 h-5" /> {backLabel}
      </button>
      {children}
    </div>
  );
}
