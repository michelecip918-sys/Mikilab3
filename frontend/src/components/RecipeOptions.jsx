import { CATS, recipeCategory } from "@/lib/recipeCats";
import { recipeTitle } from "@/lib/loc";
import { useLang } from "@/i18n/LanguageContext";

// <option> raggruppate per SEZIONE (categoria), con titoli tradotti.
// Da usare dentro un <select> per i selettori ricetta (Laboratorio + Impara da casa).
export default function RecipeOptions({ recipes }) {
  const { t, lang } = useLang();
  const list = recipes || [];
  return CATS.map((cat) => {
    const items = list
      .filter((r) => recipeCategory(r).key === cat.key)
      .sort((a, b) => recipeTitle(a, lang).localeCompare(recipeTitle(b, lang)));
    if (!items.length) return null;
    return (
      <optgroup key={cat.key} label={`${cat.icon} ${t(cat.label)}`}>
        {items.map((r) => (
          <option key={r.id} value={r.id}>{recipeTitle(r, lang)}</option>
        ))}
      </optgroup>
    );
  });
}
