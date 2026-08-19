import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ShoppingCart, Wheat, Droplets, Share2, AlertTriangle } from "lucide-react";
import { recipesApi, weeklyApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { rLoc } from "@/lib/loc";

const GRAM_FIELDS = ["flour_grams", "water_grams", "sourdough_grams", "salt_grams"];

function fmtQty(g) {
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
  return `${Math.round(g)} g`;
}

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
  }, []);

  const recipeById = useMemo(() => Object.fromEntries(recipes.map((r) => [r.id, r])), [recipes]);

  const totals = useMemo(() => {
    const flourByType = {};
    const others = {}; // water, sourdough, salt
    const extras = {};
    let anyFlour = 0;
    items.forEach((it) => {
      const r = recipeById[it.recipe_id];
      if (!r) return;
      const totalDough = Number(it.pieces || 0) * Number(it.grams_per_piece || 0);
      const recTotal = GRAM_FIELDS.reduce((s, f) => s + Number(r[f] || 0), 0);
      if (recTotal <= 0 || totalDough <= 0) return;
      const factor = totalDough / recTotal;
      const flourG = Number(r.flour_grams || 0) * factor;
      if (flourG > 0) {
        const type = (rLoc(r, "flour_type", lang) || (lang === "de" ? "Mehl" : "Farina")).trim();
        flourByType[type] = (flourByType[type] || 0) + flourG;
        anyFlour += flourG;
      }
      ["water_grams", "sourdough_grams", "salt_grams"].forEach((f) => {
        const g = Number(r[f] || 0) * factor;
        if (g > 0) others[f] = (others[f] || 0) + g;
      });
      (r.extra_ingredients || []).forEach((e) => {
        if (e && e.name && e.percent != null && e.percent !== "") {
          const g = Number(r.flour_grams || 0) * factor * (Number(e.percent) / 100);
          if (g > 0) extras[e.name] = (extras[e.name] || 0) + g;
        }
      });
    });
    return { flourByType, others, extras, anyFlour };
  }, [items, recipeById, lang]);

  const hasData = totals.anyFlour > 0 || Object.keys(totals.extras).length > 0;

  const otherLabel = (f) => f === "water_grams" ? (lang === "de" ? "Wasser" : "Acqua")
    : f === "sourdough_grams" ? (lang === "de" ? "Vorteig/Sauerteig" : "Prefermento/Lievito madre")
    : (lang === "de" ? "Salz" : "Sale");

  const buildText = () => {
    let out = (lang === "de" ? "Einkaufsliste Mikilab\n\n" : "Lista della spesa Mikilab\n\n");
    out += (lang === "de" ? "MEHL:\n" : "FARINE:\n");
    Object.entries(totals.flourByType).forEach(([k, v]) => { out += `  • ${k}: ${fmtQty(v)}\n`; });
    Object.entries(totals.others).forEach(([f, v]) => { out += `  • ${otherLabel(f)}: ${fmtQty(v)}\n`; });
    if (Object.keys(totals.extras).length) {
      out += (lang === "de" ? "\nWEITERE ZUTATEN:\n" : "\nALTRI INGREDIENTI:\n");
      Object.entries(totals.extras).forEach(([k, v]) => { out += `  • ${k}: ${fmtQty(v)}\n`; });
    }
    return out.trim();
  };

  const share = async () => {
    const text = buildText();
    try {
      if (navigator.share) { await navigator.share({ title: "Mikilab", text }); }
      else { await navigator.clipboard.writeText(text); toast.success(t("toast_copied")); }
    } catch { /* */ }
  };

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
      ) : hasData ? (
        <div className="space-y-4">
          <Card title={lang === "de" ? "Mehl (nach Typ / W)" : "Farine (per tipo / W)"} icon={<Wheat className="w-4 h-4" />} testid="sl-flour">
            {Object.entries(totals.flourByType).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <Row key={k} label={k} value={fmtQty(v)} />
            ))}
          </Card>
          <Card title={lang === "de" ? "Basis" : "Base"} icon={<Droplets className="w-4 h-4" />} testid="sl-base">
            {Object.entries(totals.others).map(([f, v]) => <Row key={f} label={otherLabel(f)} value={fmtQty(v)} />)}
          </Card>
          {Object.keys(totals.extras).length > 0 && (
            <Card title={lang === "de" ? "Weitere Zutaten" : "Altri ingredienti"} icon={<ShoppingCart className="w-4 h-4" />} testid="sl-extras">
              {Object.entries(totals.extras).sort((a, b) => b[1] - a[1]).map(([k, v]) => <Row key={k} label={k} value={fmtQty(v)} />)}
            </Card>
          )}
          <button data-testid="sl-share" onClick={share} className="w-full bg-[#6B8E62] hover:bg-[#5a7a52] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
            <Share2 className="w-5 h-5" /> {t("weekly_share")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Card({ title, icon, testid, children }) {
  return (
    <div data-testid={testid} className="rounded-2xl bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] p-4">
      <div className="flex items-center gap-2 mb-2 text-[#B34A26]">
        {icon}<h2 className="font-display text-base font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{title}</h2>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#4A3B34] dark:text-[#C9BBB0]">{label}</span>
      <span className="font-mono-data font-bold text-[#8C3A1D] dark:text-[#E5AC3A]">{value}</span>
    </div>
  );
}
