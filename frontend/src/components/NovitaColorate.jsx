import { useEffect, useState } from "react";
import { Sparkles, Leaf } from "lucide-react";
import { recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { COLORED_RECIPES } from "@/lib/coloredRecipes";
import { mkTri } from "@/i18n/triMaps";

const NEW_COLOR = COLORED_RECIPES;

// Vetrina "Novità dal MikiLab": evidenzia le ricette colorate naturalmente.
export const NovitaColorate = () => {
  const { lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
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
      <div className="grid grid-cols-3 gap-2">
        {items.map((r) => (
          <button key={r.id} data-testid={`novita-card-${r.id}`} onClick={() => open(r)}
            className="text-left rounded-xl overflow-hidden bg-[#f8fbfe] dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] shadow-sm active:scale-97 transition-all">
            <div className="h-16 w-full overflow-hidden">
              <img src={r.image_url} alt={rn(r)} loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="p-1.5">
              <p className="font-display text-[11px] font-semibold text-[#2B303B] dark:text-[#e4eff8] leading-tight line-clamp-2">{rn(r)}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Scheda: perché coloriamo naturalmente */}
      <div data-testid="novita-why" className="mt-4 rounded-2xl bg-gradient-to-br from-[#eaf6ef] to-[#e4eff8] dark:from-[#1c2b26] dark:to-[#1F252B] border border-[#2e8b6f]/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Leaf className="w-5 h-5 text-[#2e8b6f]" />
          <h3 className="font-display text-base font-bold text-[#2B303B] dark:text-[#e4eff8]">
            {tri("Perché coloriamo naturalmente", "Warum wir natürlich färben", "Why we colour naturally", "Por qué coloreamos de forma natural")}
          </h3>
        </div>
        <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">
          {tri("Niente coloranti artificiali: solo ingredienti veri. La curcuma e lo zafferano danno il giallo-oro, gli spinaci e il pistacchio il verde, la spirulina il blu-verde, la barbabietola il rosa, il pomodoro e la nduja il rosso, il carbone vegetale il nero. Colore, sapore e valore nutrizionale in un solo impasto, sempre col metodo indiretto.",
               "Keine künstlichen Farbstoffe: nur echte Zutaten. Kurkuma und Safran geben Goldgelb, Spinat und Pistazie Grün, Spirulina Blaugrün, Rote Bete Rosa, Tomate und Nduja Rot, Aktivkohle Schwarz. Farbe, Geschmack und Nährwert in einem Teig, immer mit indirekter Methode.",
               "No artificial dyes: only real ingredients. Turmeric and saffron give golden-yellow, spinach and pistachio green, spirulina blue-green, beetroot pink, tomato and 'nduja red, vegetable charcoal black. Colour, flavour and nutrition in one dough, always with the indirect method.",
               "Sin colorantes artificiales: solo ingredientes reales. La cúrcuma y el azafrán dan amarillo dorado, la espinaca y el pistacho verde, la espirulina azul-verde, la remolacha rosa, el tomate y la nduja rojo, el carbón vegetal negro. Color, sabor y nutrición en una sola masa, siempre con método indirecto.")}
        </p>
      </div>
    </div>
  );
};
