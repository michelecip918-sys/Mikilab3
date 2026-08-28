import { useEffect, useState } from "react";
import { recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

// Selettore delle ricette DEL PANETTIERE (collezione personale) da usare nei calcolatori.
export default function RecipePicker({ value, onChange, testid = "recipe-picker", label, className = "" }) {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "it" ? i : (e ?? i));
  const [recipes, setRecipes] = useState([]);
  useEffect(() => { recipesApi.list("personal").then((r) => setRecipes(r || [])).catch(() => {}); }, []);
  return (
    <div className={`mb-3 ${className}`}>
      <label className="text-[11px] font-semibold uppercase text-[#7E8A93]">{label || tri("La tua ricetta", "Dein Rezept", "Your recipe")}</label>
      <select data-testid={testid} value={value || ""}
        onChange={(e) => { const r = recipes.find((x) => x.id === e.target.value) || null; onChange(r, e.target.value); }}
        className="w-full mt-1 bg-[#FAF5EC] dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8]">
        <option value="">{recipes.length ? tri("— scegli dalle tue ricette —", "— wähle dein Rezept —", "— pick your recipe —") : tri("Nessuna tua ricetta: aggiungile in «Le Mie Ricette»", "Noch keine Rezepte: unter „Meine Rezepte“ hinzufügen", "No recipes yet: add them in 'My Recipes'")}</option>
        {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
    </div>
  );
}
