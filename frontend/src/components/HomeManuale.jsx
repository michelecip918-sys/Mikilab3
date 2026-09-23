import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import SitorBadge from "@/components/SitorBadge";
import { BookOpen, ChefHat, Sparkles, GraduationCap, Info, MessageCircle, Settings, Flame, Soup, Compass } from "lucide-react";
import { rLoc } from "@/lib/loc";
// V88 — la Home che ti riconosce + la nota di Michele
import LaTuaCucina, { getName } from "@/components/LaTuaCucina";
import { BancoNota } from "@/components/BancoMichele";
import SitorDice from "@/components/SitorDice"; // V90
import BenvenutoMikiLab from "@/components/BenvenutoMikiLab"; // V107
import ScuolaInHome from "@/ScuolaInHome"; // V110
import OggiInBottega from "@/components/OggiInBottega"; // V101
import { Dices, ChevronDown } from "lucide-react";

const PUB = process.env.PUBLIC_URL;

// 5 ricette FACILI (impasto diretto, senza lievito madre, senza sfoglia, senza liscivia),
// in ordine crescente di difficoltà. Risolte per NOME (id robusti tra ambienti).
export const START_NAMES = [
  "Panino al Latte per Hamburger",
  "Panino alle Patate",
  "Panino al Sesamo",
  "Panino ai Semi di Papavero",
  "Panino al Farro",
];

export const SKILL_KEY = "mikilab_skill"; // "learning" | "expert"

export default function HomeManuale({ onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [starts, setStarts] = useState([]);
  const [all, setAll] = useState([]);
  // Chi ha già una storia col sito vede prima la sua cucina; chi è nuovo vede prima cos'è MikiLab.
  const [aboutOpen, setAboutOpen] = useState(() => { try { return !(localStorage.getItem("mikilab_nome") || localStorage.getItem("mikilab_giro_visto") === "1"); } catch { return true; } }); // V90
  const [known] = useState(() => { try { return !!getName() || JSON.parse(localStorage.getItem("mikilab_done") || "[]").length > 0 || !!localStorage.getItem("mikilab_lievito_figlio"); } catch { return false; } });
  const [skill, setSkill] = useState(() => { try { return localStorage.getItem(SKILL_KEY) || ""; } catch { return ""; } });

  useEffect(() => {
    let stop = false;
    recipesApi.list("mikilab").then((recs) => {
      if (stop || !Array.isArray(recs)) return;
      setAll(recs);
      const by = {}; recs.forEach((r) => { if (r && r.name) by[r.name] = r; });
      setStarts(START_NAMES.map((n) => by[n]).filter(Boolean));
    }).catch(() => { /* */ });
    return () => { stop = true; };
  }, []);

  const setSkillPref = (v) => {
    setSkill(v);
    try {
      localStorage.setItem(SKILL_KEY, v);
      // B2.6: "So già panificare" attiva ESPERTO con scala Laboratorio; "Sto imparando" attiva CASA.
      localStorage.setItem("mikilab_recipe_mode", v === "expert" ? "esperto" : "casa");
      if (v === "expert") {
        const cur = (() => { try { return JSON.parse(localStorage.getItem("mikilab_pro_scale") || "{}"); } catch { return {}; } })();
        if (!cur.scale) localStorage.setItem("mikilab_pro_scale", JSON.stringify({ ...cur, scale: "laboratorio" }));
      }
    } catch { /* */ }
  };
  const openRecipe = (id) => { onNav("recipes"); setTimeout(() => { try { window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })); } catch { /* */ } }, 120); };

  return (
    <div data-testid="home-manuale" className="pt-4">
    <BenvenutoMikiLab onNav={onNav} /> {/* V107 */}
      <ScuolaInHome /> {/* V110 */}
      {known && <LaTuaCucina recipes={all} starts={starts} onNav={onNav} onOpenRecipe={openRecipe} />}
      {known && <BancoNota />}
      <OggiInBottega onNav={onNav} /> {/* V101 */}
      {/* V76 — Prima di tutto: cos'è MikiLab, chi è Sitor e cosa possono fare */}
      <section data-testid="home-about" className="rounded-3xl border border-border/25 bg-background/70 p-5 sm:p-6 mb-4">
        <button data-testid="home-about-toggle" onClick={() => setAboutOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 text-left">
          <h2 className="font-display text-xl font-black text-foreground">{tri("Cos'è MikiLab e chi è Sitor", "Was ist MikiLab und wer ist Sitor", "What MikiLab is and who Sitor is")}</h2>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${aboutOpen ? "rotate-180" : ""}`} />
        </button>
        {aboutOpen && (<>
        <p className="text-[14px] text-foreground/90 leading-relaxed">
          {tri(
            "MikiLab è il ricettario gratuito di Michele, panettiere a Stoccarda, nato a Matera e cresciuto a Miglionico: pane, pizza, focacce, lievitati e dolci, spiegati passo per passo per farli a casa.",
            "MikiLab ist das kostenlose Rezeptbuch von Michele, Bäcker in Stuttgart, geboren in Matera und aufgewachsen in Miglionico: Brot, Pizza, Focaccia, Hefegebäck und Süßes, Schritt für Schritt erklärt, damit du es zu Hause backen kannst.",
            "MikiLab is the free recipe book of Michele, a baker in Stuttgart, born in Matera and raised in Miglionico: bread, pizza, focaccia, leavened bakes and sweets, explained step by step so you can make them at home.")}
        </p>
        <p className="text-[14px] text-foreground/90 leading-relaxed mt-2">
          {tri(
            "Sitor è l'avatar IA di Michele: un'intelligenza artificiale, non una persona. Ti accompagna nelle ricette, legge i passi a voce, risponde alle domande e ti dà idee veloci per cena.",
            "Sitor ist Micheles KI-Avatar: eine künstliche Intelligenz, keine Person. Er begleitet dich durch die Rezepte, liest die Schritte vor, beantwortet Fragen und gibt dir schnelle Ideen fürs Abendessen.",
            "Sitor is Michele's AI avatar: an artificial intelligence, not a person. It guides you through the recipes, reads the steps aloud, answers questions and gives you quick dinner ideas.")}
        </p>
        <ul className="mt-3 space-y-1 text-[13px] text-foreground/85">
          <li>• {tri("Cerca le ricette e adatta le dosi al tuo forno", "Suche Rezepte und passe die Mengen an deinen Ofen an", "Find recipes and adapt the quantities to your oven")}</li>
          <li>• {tri("Fatti guidare a voce con le mani in pasta", "Lass dich per Sprache anleiten, während du knetest", "Get voice guidance with your hands in the dough")}</li>
          <li>• {tri("Capisci farine, lieviti e tecniche prima di iniziare", "Verstehe Mehle, Triebmittel und Techniken, bevor du anfängst", "Understand flours, starters and techniques before you begin")}</li>
          <li>• {tri("Trova un'idea veloce quando non sai cosa cucinare", "Finde eine schnelle Idee, wenn du nicht weißt, was du kochen sollst", "Find a quick idea when you don't know what to cook")}</li>
        </ul>
        <p className="text-[12px] text-muted-foreground mt-3">
          {tri(
            "Le ricette sono di due tipi: quelle provate da Michele e le bozze scritte da Sitor. Ogni ricetta dice chiaramente quale è.",
            "Die Rezepte sind von zwei Arten: von Michele erprobte und von Sitor geschriebene Entwürfe. Jedes Rezept sagt klar, welche Art es ist.",
            "Recipes are of two kinds: those tested by Michele and drafts written by Sitor. Each recipe clearly says which one it is.")}
        </p>
      </>)}
      </section>

      {!known && <LaTuaCucina recipes={all} starts={starts} onNav={onNav} onOpenRecipe={openRecipe} />}
      {!known && <BancoNota />}

      {/* Sitor accoglie */}
      <section className="rounded-3xl border border-border/25 bg-background/70 overflow-hidden">
        <div className="grid sm:grid-cols-[auto_1fr] gap-5 p-6 sm:p-8 items-center">
          <img src={`${PUB}/sitor_official.webp`} alt={tri("Avatar IA di Michele (Sitor)", "KI-Avatar von Michele (Sitor)", "AI avatar of Michele (Sitor)")} data-testid="home-sitor-img"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover object-top border-2 border-primary/50 shadow-[0_0_28px_rgba(217,119,54,0.28)] mx-auto sm:mx-0" />
          <div className="text-center sm:text-left">
            <p className="font-mono-data text-[10px] tracking-[0.28em] text-primary uppercase mb-1">{tri("La tua guida", "Dein Begleiter", "Your guide")}</p>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground leading-tight">{tri("Ciao, sono Sitor.", "Hallo, ich bin Sitor.", "Hi, I'm Sitor.")}</h1>
            <p className="text-sm sm:text-base text-foreground mt-2 max-w-xl">{tri(
              "Ti guido passo-passo a rifare a casa le ricette di pane, pizza e dolci. Scegli una ricetta e cuciniamo insieme.",
              "Ich führe dich Schritt für Schritt, um Brot, Pizza und Süßes zu Hause nachzubacken. Wähle ein Rezept und wir backen zusammen.",
              "I guide you step by step to make bread, pizza and pastry at home. Pick a recipe and let's cook together.")}</p>
            <p data-testid="home-motto" className="text-[13px] font-bold text-primary mt-2">{tri("Non solo fare il pane: capirlo.", "Nicht nur Brot backen: es verstehen.", "Not just making bread: understanding it.")}</p>
            <p data-testid="home-ai-disclaimer" className="inline-flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground bg-background/60 border border-border rounded-full px-3 py-1">
              <Info className="w-3.5 h-3.5 text-muted-foreground" /> {tri("Sitor è un'intelligenza artificiale, non una persona.", "Sitor ist eine künstliche Intelligenz, keine Person.", "Sitor is an artificial intelligence, not a person.")}
            </p>
            <div className="mt-3 flex justify-center sm:justify-start"><SitorBadge size={28} /></div>
            <SitorDice />
          </div>
        </div>
      </section>

      {/* Domanda al primo accesso: livello */}
      {!skill && (
        <section data-testid="home-skill-ask" className="mt-4 rounded-2xl border border-primary/30 bg-primary/8 p-4 sm:p-5">
          <p className="font-bold text-foreground text-sm mb-3">{tri("Prima di iniziare:", "Bevor wir starten:", "Before we start:")}</p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button data-testid="home-skill-learning" onClick={() => setSkillPref("learning")}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-background border border-border/40 text-foreground font-bold text-sm hover:border-primary active:scale-95 transition-all">
              <GraduationCap className="w-4 h-4 text-primary" /> {tri("Sto imparando", "Ich lerne noch", "I'm learning")}
            </button>
            <button data-testid="home-skill-expert" onClick={() => setSkillPref("expert")}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-background border border-border/40 text-foreground font-bold text-sm hover:border-primary active:scale-95 transition-all">
              <ChefHat className="w-4 h-4 text-primary" /> {tri("So già panificare", "Ich kann schon backen", "I already know how to bake")}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">{tri("Puoi cambiarlo su ogni ricetta.", "Du kannst es bei jedem Rezept ändern.", "You can change it on each recipe.")}</p>
        </section>
      )}

      {/* Azioni principali */}
      <section className="mt-4 grid sm:grid-cols-3 gap-3">
        <button data-testid="home-btn-start" onClick={() => onNav("percorso")}
          className="group rounded-2xl border border-border/30 bg-background/70 p-5 text-left hover:border-primary active:scale-[0.98] transition-all">
          <Sparkles className="w-6 h-6 text-primary mb-2" />
          <p className="font-black text-foreground">{tri("Comincia da qui", "Fang hier an", "Start here")}</p>
          <p className="text-xs text-muted-foreground mt-1">{tri("5 ricette facili per iniziare.", "5 einfache Rezepte zum Start.", "5 easy recipes to begin.")}</p>
        </button>
        <button data-testid="home-btn-all" onClick={() => onNav("recipes")}
          className="group rounded-2xl border border-border/30 bg-background/70 p-5 text-left hover:border-primary active:scale-[0.98] transition-all">
          <ChefHat className="w-6 h-6 text-primary mb-2" />
          <p className="font-black text-foreground">{tri("Tutte le ricette", "Alle Rezepte", "All recipes")}</p>
          <p className="text-xs text-muted-foreground mt-1">{tri("Sfoglia per categoria e difficoltà.", "Nach Kategorie und Schwierigkeit.", "Browse by category and difficulty.")}</p>
        </button>
        <button data-testid="home-btn-guide" onClick={() => { onNav("recipes"); setTimeout(() => { try { window.dispatchEvent(new CustomEvent("mikilab-ricette-view", { detail: { view: "guida" } })); } catch { /* */ } }, 120); }}
          className="group rounded-2xl border border-border/30 bg-background/70 p-5 text-left hover:border-primary active:scale-[0.98] transition-all">
          <BookOpen className="w-6 h-6 text-primary mb-2" />
          <p className="font-black text-foreground">{tri("Guide", "Anleitungen", "Guides")}</p>
          <p className="text-xs text-muted-foreground mt-1">{tri("Enciclopedia, glossario, metodi, attrezzi.", "Lexikon, Glossar, Methoden, Geräte.", "Encyclopedia, glossary, methods, tools.")}</p>
        </button>
        <button data-testid="home-btn-chat" onClick={() => onNav("chat")}
          className="group rounded-2xl border border-border/30 bg-background/70 p-5 text-left hover:border-primary active:scale-[0.98] transition-all">
          <MessageCircle className="w-6 h-6 text-primary mb-2" />
          <p className="font-black text-foreground">{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}</p>
          <p className="text-xs text-muted-foreground mt-1">{tri("Domande su pane, pizza e dolci.", "Fragen zu Brot, Pizza und Süßem.", "Questions about bread, pizza and sweets.")}</p>
        </button>
      </section>

      {/* V76 — "Pochi tasti, tutto dentro": prima le informazioni, poi la pratica, e gli strumenti in un solo posto */}
      <div data-testid="home-chips" className="flex flex-wrap gap-2 mt-4">
        <button data-testid="home-chip-prima" onClick={() => onNav("inizia")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/15 border border-primary/40 text-foreground text-sm font-bold hover:bg-primary/25 active:scale-95 transition-all"><GraduationCap className="w-4 h-4 text-primary" />{tri("Prima di iniziare", "Bevor du anfängst", "Before you start")}</button>
        <button data-testid="home-chip-panico" onClick={() => onNav("panico")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ambra/20 border border-ambra/50 text-foreground text-sm font-bold hover:bg-ambra/30 active:scale-95 transition-all"><Flame className="w-4 h-4 text-ambra" />{tri("Panico da cena", "Abendessen-Panik", "Dinner panic")}</button>
        <button data-testid="home-chip-sughi" onClick={() => onNav("sughi")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-background/70 border border-border/30 text-foreground text-sm font-bold hover:border-primary active:scale-95 transition-all"><Soup className="w-4 h-4 text-primary" />{tri("Sopra la focaccia", "Auf die Focaccia", "On the focaccia")}</button>
        <button data-testid="home-chip-sorprendimi" onClick={() => onNav("sorprendimi")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ambra/20 border border-ambra/50 text-foreground text-sm font-bold hover:bg-ambra/30 active:scale-95 transition-all"><Dices className="w-4 h-4 text-ambra" />{tri("Sorprendimi", "Überrasch mich", "Surprise me")}</button>
        <button data-testid="home-chip-giro" onClick={() => onNav("giro")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-background/70 border border-border/30 text-foreground text-sm font-bold hover:border-primary active:scale-95 transition-all"><Compass className="w-4 h-4 text-primary" />{tri("Il primo giro", "Die erste Runde", "The first tour")}</button>
        <button data-testid="home-chip-strumenti" onClick={() => onNav("strumenti")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-background/70 border border-border/30 text-foreground text-sm font-bold hover:border-primary active:scale-95 transition-all"><Settings className="w-4 h-4" />{tri("Strumenti", "Werkzeuge", "Tools")}</button>
      </div>

      <section id="home-start-section" data-testid="home-start-section" className="mt-8 scroll-mt-24">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-black text-foreground uppercase tracking-wide">{tri("Comincia da qui", "Fang hier an", "Start here")}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {starts.map((r, i) => (
            <button key={r.id} data-testid={`home-start-${i}`} onClick={() => openRecipe(r.id)}
              className="group rounded-2xl overflow-hidden border border-border bg-background text-left hover:border-primary active:scale-[0.98] transition-all">
              <div className="relative h-28 bg-background">
                {r.image_url && <img src={r.image_url} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" loading="lazy" />}
                <span className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">{i + 1}</span>
              </div>
              <p className="px-2.5 py-2 text-[12px] font-bold text-foreground leading-tight line-clamp-2">{rLoc(r, "name", lang)}</p>
            </button>
          ))}
          {starts.length === 0 && <p className="text-sm text-muted-foreground col-span-full">{tri("Scaldo il forno…", "Ich heize den Ofen…", "Heating the oven…")}</p>}
        </div>
      </section>
    </div>
  );
}
