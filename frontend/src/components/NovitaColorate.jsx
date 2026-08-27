import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

const NEW_COLOR = [
  "Cornetto Bicolore Cacao e Vaniglia",
  "Cornetto Doppio Gusto Pistacchio e Cioccolato",
  "Pane all'Nduja",
  "Pane alla Barbabietola",
  "Panini Basilico e Pomodoro",
  "Pane alla Curcuma e Zenzero",
  "Pane agli Spinaci",
  "Pane Nero al Carbone Vegetale",
  "Cornetto Bicolore Carbone e Vaniglia",
  "Pane allo Zafferano",
  "Pane alla Spirulina",
  "Cornetto Bicolore Rosa (Rapa Rossa) e Vaniglia",
];

// Vetrina "Novità dal MikiLab": evidenzia le ricette colorate naturalmente.
export const NovitaColorate = () => {
  const { lang } = useLang();
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : lang === "en" ? e : i);
  const rn = (r) => (lang === "de" ? (r.name_de || r.name) : lang === "en" ? (r.name_en || r.name) : lang === "es" ? (r.name_es || r.name_en || r.name) : r.name);
  const [items, setItems] = useState([]);

  useEffect(() => {
    recipesApi.list("mikilab").then((rs) => {
      setItems((rs || []).filter((r) => NEW_COLOR.includes(r.name) && r.image_url));
    }).catch(() => {});
  }, []);

  if (!items.length) return null;

  const open = (r) => {
    window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id: r.id } }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div data-testid="ricette-novita">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-[#C88A2B]" />
        <h2 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">
          {tri("Novità dal MikiLab", "Neu bei MikiLab", "New at MikiLab", "Novedades de MikiLab")}
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#C88A2B] bg-[#C88A2B]/15 border border-[#C88A2B]/40 px-2 py-0.5 rounded-full">
          {tri("Colori naturali", "Natürliche Farben", "Natural colours", "Colores naturales")}
        </span>
      </div>
      <p className="text-sm text-[#7E8A93] mb-3">
        {tri("Pani e cornetti colorati SOLO con ingredienti naturali, col metodo indiretto. Tocca per aprire la ricetta.",
             "Brote und Hörnchen NUR mit natürlichen Zutaten gefärbt, indirekte Methode. Zum Öffnen tippen.",
             "Breads and croissants coloured ONLY with natural ingredients, indirect method. Tap to open the recipe.",
             "Panes y cruasanes coloreados SOLO con ingredientes naturales, método indirecto. Toca para abrir.")}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {items.map((r) => (
          <button key={r.id} data-testid={`novita-card-${r.id}`} onClick={() => open(r)}
            className="shrink-0 w-40 snap-start text-left rounded-2xl overflow-hidden bg-[#f8fbfe] dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] shadow-sm active:scale-97 transition-all">
            <div className="h-28 w-full overflow-hidden">
              <img src={r.image_url} alt={rn(r)} loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="p-2.5">
              <p className="font-display text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] leading-tight line-clamp-2">{rn(r)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
