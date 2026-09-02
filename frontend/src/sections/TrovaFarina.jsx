import { mkTri } from "@/i18n/triMaps";
import { ChevronRight, Wheat, Search } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Equivalenze farine da supermercato europeo per replicare le ricette
const ROWS = [
  { use: ["Pane a lunga lievitazione (forte)", "Langzeit-Brot (stark)", "Long-fermentation bread (strong)", "Pan de larga fermentación (fuerte)"], w: "W 280–330",
    it: "Farina 0 forte / Manitoba", de: "Weizenmehl Type 550 (kräftig) / Manitoba", fr: "T65 de gruau / Manitoba", es: "Harina de fuerza" },
  { use: ["Pizza & focaccia", "Pizza & Focaccia", "Pizza & focaccia", "Pizza y focaccia"], w: "W 260–300",
    it: "Farina 00 per pizza", de: "Pizzamehl Type 00/550", fr: "T55 / T65", es: "Media fuerza" },
  { use: ["Pane comune / pagnotta", "Alltagsbrot", "Everyday bread / loaf", "Pan común"], w: "W 220–260",
    it: "Farina 0", de: "Weizenmehl Type 405/550", fr: "T55", es: "Harina panificable" },
  { use: ["Dolci & frolla", "Kuchen & Mürbeteig", "Cakes & shortcrust", "Repostería"], w: "W 150–200",
    it: "Farina 00 debole", de: "Weizenmehl Type 405", fr: "T45", es: "Harina floja" },
  { use: ["Integrale", "Vollkorn", "Whole wheat", "Integral"], w: "—",
    it: "Farina integrale", de: "Vollkornmehl", fr: "T150", es: "Harina integral" },
  { use: ["Segale (Sauerteig)", "Roggen (Sauerteig)", "Rye (sourdough)", "Centeno"], w: "—",
    it: "Farina di segale", de: "Roggenmehl Type 997/1150", fr: "Seigle T130", es: "Harina de centeno" },
  { use: ["Semola grano duro", "Hartweizen", "Durum semolina", "Sémola trigo duro"], w: "—",
    it: "Semola rimacinata", de: "Hartweizengrieß / Durum", fr: "Semoule fine de blé dur", es: "Sémola de trigo duro" },
];

export default function TrovaFarina({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const uL = (arr) => (lang === "de" ? arr[1] : lang === "es" ? arr[3] : (lang === "en" || lang === "fr" || lang === "fa") ? arr[2] : arr[0]);
  const flagRow = [["it", "🇮🇹"], ["de", "🇩🇪"], ["fr", "🇫🇷"], ["es", "🇪🇸"]];

  return (
    <div className="pb-8" data-testid="trova-farina">
      {onBack && <button data-testid="farina-back" onClick={onBack} className="flex items-center gap-1 text-[#c94f00] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#121212] shadow-xl mb-5" style={{ background: "linear-gradient(135deg,#c94f00,#c94f00 60%,#c94f00)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><Search className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Trova-Farina Europeo", "Mehl-Finder Europa", "European Flour Finder", "Buscador de Harinas")}</h1>
        <p className="text-[#121212]/85 text-sm mt-2 leading-snug">{L("Quale farina comprare al supermercato (in Germania, Italia, Francia o Spagna) per replicare la ricetta giusta.", "Welches Supermarkt-Mehl du kaufen sollst, um das Rezept zu treffen.", "Which supermarket flour to buy to match the recipe.", "Qué harina comprar en el supermercado para replicar la receta.")}</p>
      </div>

      <div className="space-y-3">
        {ROWS.map((r, i) => (
          <div key={i} data-testid={`farina-row-${i}`} className="rounded-2xl bg-[#121212] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Wheat className="w-4.5 h-4.5 text-[#c94f00]" />
              <p className="font-display text-[15px] font-bold text-[#c94f00] dark:text-[#e4eff8] flex-1 leading-tight">{uL(r.use)}</p>
              {r.w !== "—" && <span className="text-[10px] font-bold uppercase bg-[#ffffff] text-[#c94f00] px-2 py-0.5 rounded-full">{r.w}</span>}
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[12.5px]">
              {flagRow.map(([k, flag]) => (
                <p key={k} className="text-[#c94f00] dark:text-[#AEB8BF]"><span className="mr-1">{flag}</span>{r[k]}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
