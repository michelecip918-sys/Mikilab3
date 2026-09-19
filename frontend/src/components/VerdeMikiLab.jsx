import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { ChevronLeft, Leaf } from "lucide-react";

const GREEN_NAMES = [
  "Verde Canapa",
  "Panettone Artigianale MikiLab — Verde Canapa",
  "Pane agli Spinaci",
  "Pane alla Spirulina",
  "Panini Basilico e Pomodoro",
  "Cornetto Doppio Gusto Pistacchio e Cioccolato",
];

export default function VerdeMikiLab({ onBack, onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [items, setItems] = useState([]);

  useEffect(() => {
    recipesApi.list("mikilab").then((rows) => {
      const by = {}; (rows || []).forEach((r) => { by[r.name] = r; });
      setItems(GREEN_NAMES.map((n) => by[n]).filter(Boolean));
    }).catch(() => {});
  }, []);

  return (
    <div data-testid="verde-mikilab" className="space-y-5">
      {onBack && <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-[#94A3B8] hover:text-white"><ChevronLeft className="w-4 h-4" />{tri("Home", "Start", "Home")}</button>}
      <div>
        <h1 className="font-display text-3xl font-black text-white flex items-center gap-2"><Leaf className="w-6 h-6 text-[#6E8F7A]" />{tri("Il verde di MikiLab", "Das Grüne von MikiLab", "MikiLab's green")}</h1>
        <p className="text-[#cbd5e1] mt-2 leading-relaxed max-w-2xl">{tri(
          "Pani e dolci colorati dagli ingredienti, non da coloranti. Le ricette con canapa usano solo semi e farina di canapa alimentare, senza effetto psicoattivo e nei limiti di legge. Compra solo prodotti venduti come alimenti, con etichetta alimentare (meglio se con il limite di THC dichiarato). Mai fiori, foglie, tisane o prodotti al CBD.",
          "Brote und Süßes, gefärbt durch Zutaten, nicht durch Farbstoffe. Die Hanf-Rezepte nutzen nur Speisehanf-Samen und -Mehl, ohne psychoaktive Wirkung und im gesetzlichen Rahmen. Kaufe nur als Lebensmittel verkaufte Produkte mit Lebensmittel-Etikett (am besten mit angegebener THC-Grenze). Nie Blüten, Blätter, Tees oder CBD-Produkte.",
          "Breads and sweets coloured by ingredients, not by dyes. Hemp recipes use only food hemp seeds and flour, with no psychoactive effect and within legal limits. Buy only products sold as food, with a food label (better if the THC limit is stated). Never flowers, leaves, teas or CBD products.")}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((r) => (
          <button key={r.id} data-testid={`verde-card-${r.id}`} onClick={() => onOpenRecipe(r.id)}
            className="text-left rounded-2xl border border-[#2A3B49] bg-[#0b1220] overflow-hidden hover:border-[#6E8F7A] active:scale-[0.98] transition-all">
            <div className="aspect-[4/3] bg-[#030712] relative">
              {r.image_url && <img src={r.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />}
              <span className="absolute bottom-1 right-1 text-[8px] font-bold uppercase bg-black/55 text-white/90 px-1.5 py-0.5 rounded">{tri("Immagine illustrativa", "Symbolbild", "Illustrative image")}</span>
            </div>
            <p className="p-2.5 font-bold text-white text-sm">{r.name}</p>
          </button>
        ))}
        {items.length === 0 && <p className="text-[#7E8A93] col-span-full">{tri("Caricamento…", "Wird geladen…", "Loading…")}</p>}
      </div>
    </div>
  );
}
