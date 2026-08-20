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
        <div className="w-11 h-11 rounded-2xl bg-[#B34A26] flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("tool_spesa")}</h1>
          <p className="text-sm text-[#8C7567]">{lang === "de" ? "Zutaten aus dem Wochenplan" : "Ingredienti dal piano settimanale"}</p>
        </div>
      </div>

      {loaded && !hasData ? (
        <div className="flex items-start gap-3 bg-[#D99B26]/15 border border-[#D99B26]/30 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-[#B34A26] shrink-0 mt-0.5" />
          <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0]">{lang === "de" ? "Kein Wochenplan gefunden. Trage zuerst Produkte in 'Woche planen' ein und speichere." : "Nessun piano trovato. Inserisci prima i prodotti in 'Pianifica la Settimana' e salva."}</p>
        </div>
      ) : (
        <SupplierOrder totals={totals} />
      )}
    </div>
  );
}
