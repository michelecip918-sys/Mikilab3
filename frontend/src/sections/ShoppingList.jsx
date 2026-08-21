import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ShoppingCart, AlertTriangle } from "lucide-react";
import { recipesApi, weeklyApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { computeShopping, hasShoppingData } from "@/lib/shopping";
import SupplierOrder from "@/components/SupplierOrder";

export default function ShoppingList() {
  const { t, lang } = useLang();
  const [recipes, setRecipes] = useState([]);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [mk, ps, saved] = await Promise.all([recipesApi.list("mikilab"), recipesApi.list("personal"), weeklyApi.get()]);
        setRecipes([...mk, ...ps]);
        if (saved && saved.items) setItems(saved.items);
      } catch { toast.error(t("toast_load_error")); }
      finally { setLoaded(true); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recipeById = useMemo(() => Object.fromEntries(recipes.map((r) => [r.id, r])), [recipes]);
  const totals = useMemo(() => computeShopping(
    items.map((it) => ({ recipe_id: it.recipe_id, grams: Number(it.pieces || 0) * Number(it.grams_per_piece || 0) })),
    recipeById, lang,
  ), [items, recipeById, lang]);

  const hasData = hasShoppingData(totals);

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#5E8B7E] flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#EAF0EC]">{t("tool_spesa")}</h1>
          <p className="text-sm text-[#7E8A93]">{lang === "de" ? "Zutaten aus dem Wochenplan" : lang === "en" ? "Ingredients from the weekly plan" : "Ingredienti dal piano settimanale"}</p>
        </div>
      </div>

      {loaded && !hasData ? (
        <div className="flex items-start gap-3 bg-[#6E8CA0]/15 border border-[#6E8CA0]/30 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-[#5E8B7E] shrink-0 mt-0.5" />
          <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF]">{lang === "de" ? "Kein Wochenplan gefunden. Trage zuerst Produkte in 'Woche planen' ein und speichere." : lang === "en" ? "No plan found. First add products in 'Plan the Week' and save." : "Nessun piano trovato. Inserisci prima i prodotti in 'Pianifica la Settimana' e salva."}</p>
        </div>
      ) : (
        <SupplierOrder totals={totals} />
      )}
    </div>
  );
}
