import { useState, useEffect } from "react";
import { ChevronLeft, Globe, Wheat } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi, api } from "@/lib/api";

// STADIO J3 — "Dal mondo e moderni": guida "Farina cotta" + ricette collegate.
const WORLD_KEYS = ["kochst", "tangzhong", "yudane", "shokupan", "latte giappones", "bao", "melon", "curry pan", "cong you", "milk bread"];

export default function DalMondo({ onBack, onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [worldRecipes, setWorldRecipes] = useState([]);

  useEffect(() => {
    Promise.all([recipesApi.list("mikilab"), api.get(`/recipe-extras`).then((r) => r.data || {}).catch(() => ({}))]).then(([recs, extras]) => {
      if (!Array.isArray(recs)) return;
      const found = recs.filter((r) => {
        const n = (r.name || "").toLowerCase();
        const hidden = extras[r.id] && extras[r.id].hidden_public;
        return !hidden && WORLD_KEYS.some((k) => n.includes(k));
      });
      setWorldRecipes(found);
    }).catch(() => {});
  }, []);

  return (
    <div data-testid="dalmondo-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="dalmondo-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2"><Globe className="w-6 h-6 text-primary" /><h1 className="font-display text-2xl font-black text-foreground">{tri("Dal mondo e moderni", "Aus aller Welt & modern", "From the world & modern")}</h1></div>

      <article data-testid="dalmondo-farinacotta" className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
        <div className="flex items-center gap-2"><Wheat className="w-5 h-5 text-ambra" /><h2 className="font-display text-xl font-bold text-foreground">{tri("Farina cotta: un'idea, tre nomi", "Gekochtes Mehl: eine Idee, drei Namen", "Cooked flour: one idea, three names")}</h2></div>
        <p className="text-[15px] text-foreground leading-relaxed">{tri(
          "In Germania si chiama Kochstück, in Asia orientale tangzhong, in Giappone yudane. È la stessa idea nata in Asia orientale: si cuoce una piccola parte della farina con acqua (o latte) fino a ottenere una pasta densa, che poi si aggiunge all'impasto.",
          "In Deutschland heißt es Kochstück, in Ostasien Tangzhong, in Japan Yudane. Dieselbe, in Ostasien entstandene Idee: Ein kleiner Teil des Mehls wird mit Wasser (oder Milch) zu einer dicken Paste gekocht und dann dem Teig zugegeben.",
          "In Germany it's called Kochstück, in East Asia tangzhong, in Japan yudane. The same idea, born in East Asia: a small part of the flour is cooked with water (or milk) into a thick paste, then added to the dough.")}</p>
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-primary mb-1">{tri("Perché rende il pane più morbido", "Warum es das Brot weicher macht", "Why it makes bread softer")}</p>
          <p className="text-[14px] text-foreground/85">{tri(
            "La farina cotta gelatinizza gli amidi e trattiene più acqua: la mollica resta soffice più a lungo e il pane si secca più lentamente.",
            "Das gekochte Mehl verkleistert die Stärke und bindet mehr Wasser: die Krume bleibt länger weich und das Brot trocknet langsamer.",
            "Cooked flour gelatinises the starch and holds more water: the crumb stays soft longer and the bread dries out more slowly.")}</p>
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-primary mb-1">{tri("Come si prepara", "Zubereitung", "How to prepare it")}</p>
          <p className="text-[14px] text-foreground/85">{tri(
            "Scalda una parte di farina con circa cinque parti di liquido, mescolando, fino a circa 65 °C: diventa una crema densa. Falla intiepidire prima di unirla all'impasto.",
            "Erhitze einen Teil Mehl mit etwa fünf Teilen Flüssigkeit unter Rühren auf ca. 65 °C: es wird eine dicke Creme. Lauwarm werden lassen, bevor du es in den Teig gibst.",
            "Heat one part flour with about five parts liquid, stirring, to about 65 °C: it becomes a thick cream. Let it cool to lukewarm before adding it to the dough.")}</p>
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-primary mb-1">{tri("Come si usa", "Verwendung", "How to use it")}</p>
          <p className="text-[14px] text-foreground/85">{tri(
            "In genere si cuoce circa il 5-10% della farina totale della ricetta (la pasta cotta va aggiunta tiepida). È un punto di partenza da provare: regola secondo la tua farina.",
            "Meist kocht man etwa 5-10% des gesamten Mehls (die gekochte Paste lauwarm zugeben). Ein Startwert zum Ausprobieren: passe ihn an dein Mehl an.",
            "Usually about 5-10% of the recipe's total flour is cooked (add the paste lukewarm). It's a starting point to test: adjust to your flour.")}</p>
        </div>
      </article>

      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-2">{tri("Ricette collegate", "Verknüpfte Rezepte", "Related recipes")}</h3>
        {worldRecipes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3" data-testid="dalmondo-recipes">
            {worldRecipes.map((r) => (
              <button key={r.id} data-testid={`dalmondo-recipe-${r.id}`} onClick={() => onOpenRecipe && onOpenRecipe(r.id)}
                className="rounded-2xl overflow-hidden border border-border bg-background text-left hover:border-primary active:scale-[0.98] transition-all">
                <div className="h-24 bg-background">{r.image_url && <img src={r.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />}</div>
                <p className="px-2.5 py-2 text-[12px] font-bold text-foreground leading-tight line-clamp-2">{r.name}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{tri("Nuove ricette dal mondo appariranno qui quando Michele le pubblica.", "Neue Rezepte aus aller Welt erscheinen hier, sobald Michele sie veröffentlicht.", "New recipes from around the world will appear here when Michele publishes them.")}</p>
        )}
      </div>
    </div>
  );
}
