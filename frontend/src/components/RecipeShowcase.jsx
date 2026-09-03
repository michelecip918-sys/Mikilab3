import { mkTri } from "@/i18n/triMaps";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Wheat } from "lucide-react";
import { recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { rLoc } from "@/lib/loc";
import { flagEmoji, countryColors, countryName } from "@/lib/countries";

// Vetrina delle ricette MikiLab in Home: griglia 2 per riga con foto grandi.
// Il tap porta al tab Ricette (dettagli completi lì).
export default function RecipeShowcase({ onOpen }) {
  const { t, lang } = useLang();
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    recipesApi.list("mikilab").then((r) => setRecipes(r || [])).catch(() => {});
  }, []);

  if (recipes.length === 0) return null;

  return (
    <div data-testid="home-showcase">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8]">
          {mkTri(lang)("Le mie ricette", "Meine Rezepte", "My recipes")}
        </h2>
        <button data-testid="home-recipes-all" onClick={() => onOpen && onOpen()}
          className="text-sm font-medium text-[#F26419] flex items-center gap-1">
          {mkTri(lang)("Tutte", "Alle", "All")} <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3" data-testid="showcase-grid">
        {recipes.map((r, i) => {
          const colors = countryColors(r.origin);
          return (
            <motion.button
              key={r.id}
              data-testid={`showcase-card-${r.id}`}
              onClick={() => onOpen && onOpen()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] shadow-sm active:scale-[0.98] hover:border-[#F26419]/60 transition-all text-left"
            >
              <div className="relative h-36 w-full overflow-hidden bg-[#e4eff8] dark:bg-[#18202E]">
                {r.image_url ? (
                  <img src={r.image_url} alt="" loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Wheat className="w-8 h-8 text-[#AEB8BF]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                {colors && (
                  <div aria-hidden className="absolute top-0 left-0 right-0 flex h-1.5">
                    {colors.map((c, k) => <div key={k} className="flex-1" style={{ background: c }} />)}
                  </div>
                )}
                {r.origin && flagEmoji(r.origin) && (
                  <span className="absolute bottom-2 left-2 text-lg drop-shadow" title={countryName(r.origin)}>{flagEmoji(r.origin)}</span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-display text-base font-semibold leading-tight text-[#2B303B] dark:text-[#e4eff8] line-clamp-2">
                  {rLoc(r, "name", lang)}
                </h3>
                {rLoc(r, "real_name", lang) && rLoc(r, "real_name", lang).toLowerCase() !== (rLoc(r, "name", lang) || "").toLowerCase() ? (
                  <p className="text-[11px] font-medium text-[#F26419] truncate mt-0.5">{rLoc(r, "real_name", lang)}</p>
                ) : null}
                {r.flour_type ? (
                  <p className="text-[11px] text-[#7E8A93] truncate mt-0.5">{rLoc(r, "flour_type", lang)}</p>
                ) : null}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
