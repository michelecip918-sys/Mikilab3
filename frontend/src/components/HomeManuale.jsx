import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import SitorBadge from "@/components/SitorBadge";
import { BookOpen, ChefHat, Sparkles, GraduationCap, Info, MessageCircle, Leaf, Wrench, Settings, FlaskConical, Radio, Award, CalendarDays, Wheat, Beaker } from "lucide-react";

const PUB = process.env.PUBLIC_URL;

// 5 ricette FACILI (impasto diretto, senza lievito madre, senza sfoglia, senza liscivia),
// in ordine crescente di difficoltà. Risolte per NOME (id robusti tra ambienti).
const START_NAMES = [
  "Panino al Latte per Hamburger",
  "Panino alle Patate",
  "Panino al Sesamo",
  "Panino ai Semi di Papavero",
  "Panino al Farro",
];

export const SKILL_KEY = "mikilab_skill"; // "learning" | "expert"

export default function HomeManuale({ onNav, features }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [starts, setStarts] = useState([]);
  const [skill, setSkill] = useState(() => { try { return localStorage.getItem(SKILL_KEY) || ""; } catch { return ""; } });

  useEffect(() => {
    let stop = false;
    recipesApi.list("mikilab").then((recs) => {
      if (stop || !Array.isArray(recs)) return;
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
      {/* Sitor accoglie */}
      <section className="rounded-3xl border border-border/25 bg-background/70 overflow-hidden">
        <div className="grid sm:grid-cols-[auto_1fr] gap-5 p-6 sm:p-8 items-center">
          <img src={`${PUB}/sitor_official.jpg`} alt={tri("Avatar IA di Michele (Sitor)", "KI-Avatar von Michele (Sitor)", "AI avatar of Michele (Sitor)")} data-testid="home-sitor-img"
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

      {/* Chip: Il verde di MikiLab · Tecniche · Attrezzi */}
      <div data-testid="home-chips" className="flex flex-wrap gap-2 mt-4">
        <button data-testid="home-chip-verde" onClick={() => onNav("verde")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent/15 border border-accent/40 text-accent-foreground text-sm font-bold hover:bg-accent/25 active:scale-95 transition-all"><Leaf className="w-4 h-4" />{tri("Il verde di MikiLab", "Das Grüne von MikiLab", "MikiLab's green")}</button>
        <button data-testid="home-chip-miglioratore" onClick={() => onNav("miglioratore")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/15 border border-primary/40 text-foreground text-sm font-bold hover:bg-primary/25 active:scale-95 transition-all"><FlaskConical className="w-4 h-4 text-primary" />{tri("Il mio miglioratore", "Mein Verbesserer", "My improver")}</button>
        {(!features || features.FEATURE_PLAN !== false) && (
          <button data-testid="home-chip-cosa-faccio" onClick={() => onNav("cosa-faccio")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ambra/20 border border-ambra/50 text-foreground text-sm font-bold hover:bg-ambra/30 active:scale-95 transition-all"><Sparkles className="w-4 h-4 text-ambra" />{tri("Cosa faccio?", "Was mache ich?", "What can I make?")}</button>
        )}
        {(!features || features.FEATURE_LIVE !== false) && (
          <button data-testid="home-chip-live" onClick={() => onNav("live")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-mattone/15 border border-mattone/40 text-foreground text-sm font-bold hover:bg-mattone/25 active:scale-95 transition-all"><Radio className="w-4 h-4 text-mattone" />{tri("Impastiamo insieme", "Zusammen backen", "Bake together")}</button>
        )}
        <button data-testid="home-chip-mensola" onClick={() => onNav("mensola")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-salvia/20 border border-salvia/50 text-foreground text-sm font-bold hover:bg-salvia/30 active:scale-95 transition-all"><Award className="w-4 h-4 text-salvia" />{tri("La mia mensola", "Mein Regal", "My shelf")}</button>
        <button data-testid="home-chip-cucina" onClick={() => onNav("cucina")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground/8 border border-border text-foreground text-sm font-bold hover:bg-foreground/12 active:scale-95 transition-all"><Wrench className="w-4 h-4 text-muted-foreground" />{tri("La mia cucina", "Meine Küche", "My kitchen")}</button>
        <button data-testid="home-chip-plan" onClick={() => onNav("plan")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground/8 border border-border text-foreground text-sm font-bold hover:bg-foreground/12 active:scale-95 transition-all"><BookOpen className="w-4 h-4 text-muted-foreground" />{tri("Piano settimana", "Wochenplan", "Weekly plan")}</button>
        <button data-testid="home-chip-tecniche" onClick={() => onNav("tecniche")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-background/70 border border-border/30 text-foreground text-sm font-bold hover:border-primary active:scale-95 transition-all"><Wrench className="w-4 h-4" />{tri("Tecniche", "Techniken", "Techniques")}</button>
        <button data-testid="home-chip-calendario" onClick={() => onNav("calendario")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-background/70 border border-border/30 text-foreground text-sm font-bold hover:border-primary active:scale-95 transition-all"><CalendarDays className="w-4 h-4 text-primary" />{tri("Calendario", "Kalender", "Calendar")}</button>
        <button data-testid="home-chip-farine" onClick={() => onNav("farine")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-background/70 border border-border/30 text-foreground text-sm font-bold hover:border-primary active:scale-95 transition-all"><Wheat className="w-4 h-4 text-ambra" />{tri("Farine", "Mehle", "Flours")}</button>
        <button data-testid="home-chip-testmese" onClick={() => onNav("testmese")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-background/70 border border-border/30 text-foreground text-sm font-bold hover:border-primary active:scale-95 transition-all"><Beaker className="w-4 h-4 text-mattone" />{tri("Test del mese", "Test des Monats", "Test of the month")}</button>
        <button data-testid="home-chip-attrezzi" onClick={() => onNav("attrezzi")} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-background/70 border border-border/30 text-foreground text-sm font-bold hover:border-primary active:scale-95 transition-all"><Settings className="w-4 h-4" />{tri("Attrezzi", "Geräte", "Tools")}</button>
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
              <p className="px-2.5 py-2 text-[12px] font-bold text-foreground leading-tight line-clamp-2">{r.name}</p>
            </button>
          ))}
          {starts.length === 0 && <p className="text-sm text-muted-foreground col-span-full">{tri("Caricamento…", "Wird geladen…", "Loading…")}</p>}
        </div>
      </section>
    </div>
  );
}
