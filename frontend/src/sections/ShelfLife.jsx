import { useState } from "react";
import { CalendarClock, BadgeCheck, FlaskConical } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import RecipePicker from "@/components/RecipePicker";
import { recipeCategory } from "@/lib/recipeCats";
import { mkTri } from "@/i18n/triMaps";

const PRODUCTS = [
  { id: "pane", base: 3 }, { id: "panettone", base: 30 }, { id: "brezel", base: 2 }, { id: "dolci", base: 5 },
];
const CAT_BASE = { basi: 5, pane: 3, panini: 2, snack: 2, focacce: 3, viennoiserie: 20, panettoni: 30 };

export default function ShelfLife() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [prod, setProd] = useState("pane");
  const [ph, setPh] = useState("4.3");
  const [hours, setHours] = useState("18");
  const [recipe, setRecipe] = useState(null);

  const PLABEL = { pane: tri("Pane", "Brot", "Bread"), panettone: "Panettone", brezel: "Brezel", dolci: tri("Dolci", "Süßes", "Sweets") };
  const base = recipe ? (CAT_BASE[recipeCategory(recipe).key] || 3) : (PRODUCTS.find((p) => p.id === prod) || PRODUCTS[0]).base;
  const h = Number(hours) || 0;
  const p = Number(ph) || 0;
  // Fermentazione lunga = staling più lento → più giorni di freschezza.
  const days = Math.round(base * (1 + Math.min(h, 48) / 48 * 0.6));
  const highDigest = p >= 4.0 && p <= 4.6 && h >= 12;

  const inp = "w-full bg-[#FAF5EC] dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2.5 font-mono-data outline-none text-[#2B303B] dark:text-[#e4eff8]";

  return (
    <div className="pb-40">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#B45309] flex items-center justify-center"><CalendarClock className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">Shelf-Life &amp; {tri("Digeribilità", "Verdaulichkeit", "Digestibility")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Freschezza e bollino da pH e lievitazione", "Frische & Siegel aus pH und Gärung", "Freshness & badge from pH and fermentation")}</p>
        </div>
      </div>

      <div className="space-y-3">
        <RecipePicker testid="sl-recipe" value={recipe?.id} onChange={(r) => setRecipe(r)} />
        {!recipe && (
        <div className="grid grid-cols-2 gap-2">
          {PRODUCTS.map((x) => (
            <button key={x.id} data-testid={`sl-prod-${x.id}`} onClick={() => setProd(x.id)}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold border ${prod === x.id ? "bg-[#B45309] text-white border-[#B45309]" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#E6D8C3] dark:border-[#38424B]"}`}>{PLABEL[x.id]}</button>
          ))}
        </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[11px] font-semibold uppercase text-[#7E8A93]">pH {tri("finale", "final", "final")}
            <input data-testid="sl-ph" type="number" step="0.1" value={ph} onChange={(e) => setPh(e.target.value)} className={inp + " mt-1"} /></label>
          <label className="text-[11px] font-semibold uppercase text-[#7E8A93]">{tri("Ore lievitazione", "Gärstunden", "Fermentation hrs")}
            <input data-testid="sl-hours" type="number" value={hours} onChange={(e) => setHours(e.target.value)} className={inp + " mt-1"} /></label>
        </div>
      </div>

      <div data-testid="sl-result" className="mt-5 rounded-3xl bg-gradient-to-br from-[#B45309] to-[#374f31] text-white p-6 text-center shadow-lg">
        <p className="text-white/80 text-sm uppercase tracking-wider font-semibold">{tri("Freschezza stimata", "Geschätzte Frische", "Estimated freshness")}</p>
        {recipe && <p data-testid="sl-recipe-name" className="text-white font-semibold text-sm mt-0.5">{recipe.name}</p>}
        <p data-testid="sl-days" className="font-mono-data text-5xl font-bold mt-1">{days} {tri("giorni", "Tage", "days")}</p>
        <p className="text-white/80 text-xs mt-2">{tri("Fermentazioni lunghe = pane che resta fresco più a lungo.", "Lange Gärung = länger frisches Brot.", "Long fermentation = bread that stays fresh longer.")}</p>
      </div>

      <div data-testid="sl-badge" className={`mt-4 rounded-2xl p-4 flex items-center gap-3 border ${highDigest ? "bg-[#B45309]/12 border-[#B45309]/40" : "bg-white dark:bg-[#232A31] border-[#E6D8C3] dark:border-[#38424B]"}`}>
        {highDigest ? <BadgeCheck className="w-9 h-9 text-[#8C4A27] shrink-0" /> : <FlaskConical className="w-8 h-8 text-[#7E8A93] shrink-0" />}
        <div>
          {highDigest ? (
            <>
              <p className="font-display font-bold text-[#6E371C] dark:text-[#a9d2ec]">{tri("Alta Digeribilità", "Hohe Verdaulichkeit", "High Digestibility")}</p>
              <p className="text-xs text-[#7E8A93]">{tri("Fermentazione Controllata (pH 4,0–4,6 · ≥12 h). Puoi applicare il bollino.", "Kontrollierte Gärung (pH 4,0–4,6 · ≥12 Std.). Siegel anwendbar.", "Controlled fermentation (pH 4.0–4.6 · ≥12 h). Badge eligible.")}</p>
            </>
          ) : (
            <p className="text-sm text-[#7E8A93]">{tri("Per il bollino 'Alta Digeribilità' servono pH 4,0–4,6 e almeno 12 h di lievitazione.", "Für das Siegel: pH 4,0–4,6 und mind. 12 Std. Gärung.", "For the 'High Digestibility' badge: pH 4.0–4.6 and at least 12 h of fermentation.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
