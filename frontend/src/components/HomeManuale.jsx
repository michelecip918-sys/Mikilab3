import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import SitorBadge from "@/components/SitorBadge";
import SitorDice from "@/components/SitorDice"; // V90
import LaTuaCucina from "@/components/LaTuaCucina"; // V88 → V128: striscia compatta
import { BancoNota } from "@/components/BancoMichele";
import BenvenutoMikiLab from "@/components/BenvenutoMikiLab"; // V107 → V128
import CominciaDaQui from "@/components/CominciaDaQui"; // V128
import OggiInBottega from "@/components/OggiInBottega"; // V101
import TuttoMikiLab from "@/components/TuttoMikiLab"; // V119 → V128: otto stanze
import NonSoloRicetta from "@/components/NonSoloRicetta"; // V118
import { TAPPE, SKILL_KEY as SK } from "@/lib/piano";

const PUB = process.env.PUBLIC_URL;

// V128 — LA HOME PIÙ SEMPLICE. Dall'alto: il saluto, la ricerca e le ricette; «Comincia da qui» (ricette sempre diverse,
// o il percorso per chi è alle prime armi); oggi in bottega; le tue cose (solo se ci sono); Sitor, una volta sola;
// le otto stanze di «Tutto MikiLab»; le parole di Michele. Prima erano circa novanta pulsanti, ora una ventina.

// I cinque panini di partenza sono la prima tappa del percorso (restano esportati per il libretto da stampare).
export const START_NAMES = TAPPE[0].names;
export const SKILL_KEY = SK; // "learning" | "expert"

export default function HomeManuale({ onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [all, setAll] = useState([]);

  useEffect(() => {
    let stop = false;
    recipesApi.list("mikilab").then((recs) => { if (!stop && Array.isArray(recs)) setAll(recs); }).catch(() => { /* */ });
    return () => { stop = true; };
  }, []);

  const openRecipe = (id) => { onNav("recipes"); setTimeout(() => { try { window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })); } catch { /* */ } }, 120); };
  const count = all.filter((r) => r && !r.hidden && (r.collection_name || "mikilab") === "mikilab").length;

  return (
    <div data-testid="home-manuale" className="pt-2 space-y-7">
      <BenvenutoMikiLab onNav={onNav} count={count} />
      <CominciaDaQui recipes={all} onNav={onNav} onOpenRecipe={openRecipe} />
      <div className="space-y-3">
        <OggiInBottega onNav={onNav} />
        <LaTuaCucina onNav={onNav} />
        <BancoNota />
      </div>

      {/* Sitor, una volta sola: chi è, una frase da fornaio, e la chat */}
      <section data-testid="home-sitor" className="rounded-3xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <img src={`${PUB}/sitor_official.webp`} alt={tri("Avatar IA di Michele (Sitor)", "KI-Avatar von Michele (Sitor)", "AI avatar of Michele (Sitor)")} data-testid="home-sitor-img"
            className="w-16 h-16 rounded-2xl object-cover object-top border-2 border-primary/40 shrink-0" />
          <div className="min-w-0">
            <h2 className="font-display text-xl font-black text-foreground leading-tight">{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}</h2>
            <p className="text-[13.5px] text-foreground/85 leading-snug mt-0.5">{tri("La guida di MikiLab: risponde su pane, pizza e dolci, anche a voce.", "Der Guide von MikiLab: antwortet zu Brot, Pizza und Süßem, auch per Sprache.", "MikiLab's guide: answers about bread, pizza and sweets, by voice too.")}</p>
            <p data-testid="home-ai-disclaimer" className="text-[12px] text-muted-foreground mt-1">{tri("Sitor è un'intelligenza artificiale, non una persona.", "Sitor ist eine künstliche Intelligenz, keine Person.", "Sitor is an artificial intelligence, not a person.")}</p>
          </div>
        </div>
        <SitorDice />
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <button data-testid="home-btn-chat" onClick={() => onNav("chat")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95">
            <MessageCircle className="w-4 h-4" />{tri("Scrivi a Sitor", "Sitor schreiben", "Write to Sitor")}
          </button>
          <SitorBadge size={24} />
        </div>
      </section>

      <TuttoMikiLab onNav={onNav} />
      <NonSoloRicetta testid="home-non-solo-ricetta" />
    </div>
  );
}
