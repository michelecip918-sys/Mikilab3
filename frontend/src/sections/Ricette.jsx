import { useState, useEffect } from "react";
import { ChevronLeft, Tag, BookOpen, Wheat, UtensilsCrossed, Sandwich, FlaskConical, Leaf } from "lucide-react";
import RecipeList from "@/components/RecipeList";
import { NovitaColorate } from "@/components/NovitaColorate";
import { VetrineReparti } from "@/components/VetrineReparti";
import GuidaMetodi from "@/sections/Enciclopedia";
import Glossario from "@/sections/Glossario";
import FlourTable from "@/components/FlourTable";
import SaporiCasa from "@/sections/SaporiCasa";
// (Rimosso "Scopri MikiLab" / "Guida al Sito" su richiesta)
import RicetteCustodite from "@/sections/RicetteCustodite";
import VetrinaFocacce from "@/components/VetrinaFocacce";
import AttrezziGuide from "@/components/AttrezziGuide";
import NonSoloRicetta from "@/components/NonSoloRicetta"; // V118
import { useLang } from "@/i18n/LanguageContext";
import { useBackClose } from "@/lib/backNav";
import { mkTri, triFA } from "@/i18n/triMaps";

export default function Ricette() {
  const { t, lang } = useLang();
  const tri = (i, d, e, s, f) => mkTri(lang)(i, d, e, s, f);
  const [view, setView] = useState("main");
  const [custoditeInit, setCustoditeInit] = useState(null);
  useBackClose(view !== "main", () => setView("main"));
  // V78 — apre una scheda del ricettario da qualsiasi sotto-pagina (Sapori di Casa, Ricette Custodite, Vetrina).
  const openRecipe = (id) => { setView("main"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 80); };
  useEffect(() => {
    const h = (e) => { const v = e?.detail?.view; if (v) { setView(v); window.scrollTo(0, 0); } };
    window.addEventListener("mikilab-ricette-view", h);
    return () => window.removeEventListener("mikilab-ricette-view", h);
  }, []);

  if (view === "guida") return <Sub onBack={() => setView("main")}><div className="mb-4"><h2 className="font-display text-2xl font-black text-foreground">{mkTri(lang)("Studia il mestiere", "Lerne das Handwerk", "Study the craft")}</h2><p className="text-sm text-primary font-bold">{mkTri(lang)("Non solo fare il pane: capirlo.", "Nicht nur Brot backen: es verstehen.", "Not just making bread: understanding it.")}</p></div><button data-testid="guida-crealievito" onClick={() => window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route: "crealievito" } }))} className="w-full text-left rounded-2xl border border-salvia/40 bg-salvia/10 p-4 mb-4 hover:border-salvia active:scale-[0.99] transition-all"><p className="font-display text-lg font-bold text-foreground">🌱 {mkTri(lang)("Crea il tuo lievito", "Erschaffe deinen Sauerteig", "Create your starter")}</p><p className="text-[13px] text-muted-foreground mt-1">{mkTri(lang)("Licoli e lievito madre di grano, o Sauerteig di segale: da zero, giorno per giorno.", "LiCoLi und Weizensauerteig, oder Roggensauerteig: von Grund auf, Tag für Tag.", "Wheat licoli and stiff sourdough, or rye sourdough: from scratch, day by day.")}</p></button><GuidaMetodi /><div className="mt-6 pt-6 border-t border-border dark:border-border"><Glossario /></div><div className="mt-6 pt-6 border-t border-border dark:border-border"><AttrezziGuide /></div></Sub>;
  if (view === "custodite") return <Sub onBack={() => { setView("main"); setCustoditeInit(null); }}><RicetteCustodite initialId={custoditeInit} onOpenRecipe={openRecipe} /></Sub>;
  if (view === "sapori") return <SaporiCasa onBack={() => setView("main")} onOpenCustodite={(id) => { setCustoditeInit(id); setView("custodite"); }} onOpenRecipe={openRecipe} />;
  if (view === "focacce") return <Sub onBack={() => setView("main")}><VetrinaFocacce onOpenRecipe={(id) => { setView("main"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 80); }} /></Sub>;
  if (view === "farine") return (
    <Sub onBack={() => setView("main")}>
      <div data-testid="ricette-farine" className="space-y-4">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-primary p-6 text-white">
          <div className="absolute top-0 left-0 right-0" />
          <div className="flex items-center gap-2 mb-1"><Wheat className="w-6 h-6" /><h1 className="font-display text-2xl font-bold">{tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours", "Tablas y Harinas", "Tableaux & Farines")}</h1></div>
          <div className="h-1 w-12 rounded-full bg-primary mb-3" />
          <p className="text-sm text-foreground/90 leading-relaxed italic">
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div aria-hidden className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#D9520011_1px,transparent_1px),linear-gradient(to_bottom,#D9520011_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-30" />
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-background/35 backdrop-blur rounded-full px-2.5 py-1 border border-foreground/25">
          <span className="text-lg leading-none" title="Italiano">🇮🇹</span>
          <span className="text-lg leading-none" title="Deutsch">🇩🇪</span>
        </div>
        <div className="absolute bottom-0 left-0 p-5">
          <h1 className="font-display text-3xl font-bold text-foreground leading-tight" style={{ textShadow: "0 2px 10px rgba(0,0,0,.85)" }}>
            {mkTri(lang)("Le ricette di Sitor", "Sitors Rezepte", "Sitor's recipes", "Las recetas de Sitor", "Les recettes de Sitor", "دستورهای سیتور")}
          </h1>
          <div className="h-1 w-12 rounded-full bg-primary mt-1.5 mb-1" />
          <p className="text-foreground/90 text-sm max-w-md" style={{ textShadow: "0 1px 6px rgba(0,0,0,.9)" }}>
            {mkTri(lang)("Sfoglia le ricette e falle a casa: dosi ricalcolate per il forno di casa, spiegate passo-passo.", "Blättere durch die Rezepte und mach sie zu Hause: Mengen für den Hausofen umgerechnet, Schritt für Schritt erklärt.", "Browse the recipes and make them at home: doses recalculated for the home oven, explained step by step.", "Hojea las recetas y hazlas en casa: dosis recalculadas para el horno de casa, paso a paso.", "Feuillette les recettes et fais-les à la maison : quantités adaptées au four domestique, pas à pas.", "دستورها را ورق بزن و در خانه بپز: مقادیر برای فر خانگی، مرحله‌به‌مرحله.")}
          </p>
        </div>
      </div>

      <NonSoloRicetta testid="ricette-non-solo-ricetta" /> {/* V118 */}

      <div data-testid="ricette-list">
      <RecipeList
        collectionName="mikilab"
        deptScoped={true}
        hideHero={true}
        emptyText={t("mikilab_empty")}
      />
      </div>

      {/* STRUMENTI EXTRA — in fondo alla pagina, dove non danno fastidio */}
      <div className="mt-8 pt-5 border-t border-border dark:border-border">
        <div className="mb-4 rounded-2xl bg-card dark:bg-card border border-border p-4"><NovitaColorate /></div>
        <div className="mb-4 rounded-2xl bg-card dark:bg-card border border-border p-4"><VetrineReparti /></div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          {tri("Strumenti del ricettario", "Rezeptbuch-Werkzeuge", "Recipe book tools", "Herramientas del recetario", "Outils du livre de recettes")}
        </p>
        <div data-testid="ricette-toolbar" className="grid grid-cols-3 gap-2">
        <UtilBtn testid="ricette-sapori-band" Icon={UtensilsCrossed} label={tri("Sapori di Casa", "Geschmack von zu Hause", "Home Flavours", "Sabores de Casa", "Saveurs de la Maison")} onClick={() => setView("sapori")} />
        <UtilBtn testid="ricette-custodite-band" Icon={Tag} label={tri("Sud Italia · Ricette Custodite", "Süditalien · Bewahrte Rezepte", "Southern Italy · Treasured Recipes", "Sur de Italia · Recetas Custodiadas", "Sud de l'Italie · Recettes Gardées")} onClick={() => setView("custodite")} />
        <UtilBtn testid="ricette-focacce-band" Icon={Sandwich} label={tri("Vetrina delle Ricette", "Rezept-Schaufenster", "Recipe Showcase", "Vitrina de Recetas", "Vitrine des Recettes")} onClick={() => setView("focacce")} />
        <UtilBtn testid="ricette-guida-btn" Icon={BookOpen} label={tri("Enciclopedia del Pane", "Brot-Lexikon", "Bread Encyclopedia", "Enciclopedia del Pan", "Encyclopédie du Pain")} onClick={() => setView("guida")} />
        <UtilBtn testid="ricette-farine-btn" Icon={Wheat} label={tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours", "Tablas y Harinas", "Tableaux & Farines")} onClick={() => setView("farine")} />
        <UtilBtn testid="ricette-verde-btn" Icon={Leaf} label={tri("Il verde di MikiLab", "Das Grüne von MikiLab", "MikiLab's green")} onClick={() => window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route: "verde" } }))} />
        <UtilBtn testid="ricette-miglioratore-btn" Icon={FlaskConical} label={tri("Il mio miglioratore", "Mein Verbesserer", "My improver")} onClick={() => window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route: "miglioratore" } }))} />
        </div>
      </div>

    </div>
  );
}

function UtilBtn({ testid, Icon, label, onClick }) {
  return (
    <button data-testid={testid} onClick={onClick}
      className="flex flex-col items-center justify-start gap-2 bg-card dark:bg-card border border-border dark:border-border rounded-2xl p-3 shadow-sm active:scale-97 hover:border-primary/60 transition-all min-w-0">
      <div className="w-10 h-10 rounded-2xl shadow-md border border-amber-900/40 bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <span className="w-full font-display text-xs sm:text-sm font-semibold text-foreground dark:text-foreground text-center leading-tight break-words hyphens-auto">{label}</span>
    </button>
  );
}

function Sub({ onBack, children }) {
  const { lang } = useLang();
  const backLabel = lang === "de" ? "Rezepte" : lang === "en" ? "Recipes" : lang === "es" ? "Recetas" : lang === "fr" ? "Recettes" : lang === "fa" ? (triFA("Ricette") || "دستورها") : "Ricette";
  return (
    <div className="pb-4">
      <button data-testid="ricette-back-btn" onClick={onBack} className="flex items-center gap-1 text-primary font-medium mb-4">
        <ChevronLeft className="w-5 h-5" /> {backLabel}
      </button>
      {children}
    </div>
  );
}
