import { useState } from "react";
import { Recycle, TrendingUp } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import RecipePicker from "@/components/RecipePicker";
import { mkTri } from "@/i18n/triMaps";

export default function AntiWaste() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [kg, setKg] = useState("2");
  const [cost, setCost] = useState("1.5"); // costo materia già sostenuto €/kg
  const [rec, setRec] = useState("pangrattato");
  const [source, setSource] = useState(null);

  const RECIPES = [
    { id: "pangrattato", label: tri("Pangrattato speciale", "Spezial-Paniermehl", "Special breadcrumbs"), yield: 0.7, sell: 4 },
    { id: "biscotti", label: tri("Biscotti / Sbriciolata", "Kekse / Streusel", "Cookies / crumble"), yield: 0.9, sell: 12 },
    { id: "fette", label: tri("Fette tostate (rusk)", "Zwieback", "Toasted rusks"), yield: 0.8, sell: 8 },
    { id: "budino", label: tri("Budino / French toast", "Pudding / French Toast", "Pudding / French toast"), yield: 1.0, sell: 6 },
  ];
  const r = RECIPES.find((x) => x.id === rec) || RECIPES[0];
  const q = Number(kg) || 0;
  const outKg = Math.round(q * r.yield * 100) / 100;
  const recovered = Math.round(outKg * r.sell * 100) / 100;
  const wasted = Math.round(q * (Number(cost) || 0) * 100) / 100;
  const gain = Math.round((recovered - wasted) * 100) / 100;
  const inp = "w-full bg-[#121212] dark:bg-[#181818] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-xl px-3 py-2.5 font-mono-data outline-none text-[#2B303B] dark:text-[#e4eff8]";

  return (
    <div className="pb-40">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#ff6b00] flex items-center justify-center"><Recycle className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Anti-Spreco", "Anti-Verschwendung", "Anti-Waste")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Trasforma gli esuberi in nuovo margine", "Reste in neue Marge verwandeln", "Turn leftovers into new margin")}</p>
        </div>
      </div>

      <RecipePicker testid="aw-recipe" value={source?.id}
        label={tri("Esubero da quale TUA ricetta", "Rest von welchem DEINER Rezepte", "Leftover from which of YOUR recipes")}
        onChange={(r) => { setSource(r); if (r?.costing?.cost_per_kg) setCost(String(r.costing.cost_per_kg)); }} />

      <div className="grid grid-cols-2 gap-3 mb-3">
        <label className="text-[11px] font-semibold uppercase text-[#7E8A93]">{tri("Esubero kg", "Reste kg", "Leftover kg")}
          <input data-testid="aw-kg" type="number" value={kg} onChange={(e) => setKg(e.target.value)} className={inp + " mt-1"} /></label>
        <label className="text-[11px] font-semibold uppercase text-[#7E8A93]">{tri("Costo €/kg", "Kosten €/kg", "Cost €/kg")}
          <input data-testid="aw-cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} className={inp + " mt-1"} /></label>
      </div>

      <p className="text-xs font-bold uppercase tracking-wide text-[#ff6b00] mb-2">{tri("Ricetta di recupero", "Verwertungsrezept", "Recovery recipe")}</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {RECIPES.map((x) => (
          <button key={x.id} data-testid={`aw-rec-${x.id}`} onClick={() => setRec(x.id)}
            className={`px-3 py-2.5 rounded-xl text-sm font-semibold border text-left ${rec === x.id ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-white dark:bg-[#1e1e1e] text-[#3F4A54] dark:text-[#AEB8BF] border-[#2b2b2b] dark:border-[#2e2e2e]"}`}>
            {x.label}
          </button>
        ))}
      </div>

      <div data-testid="aw-result" className="rounded-3xl bg-gradient-to-br from-[#ff6b00] to-[#374f31] text-white p-6 shadow-lg">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          {source && <><span className="text-white/80">{tri("Ricetta esubero", "Rest-Rezept", "Leftover recipe")}</span><span data-testid="aw-source-name" className="text-right font-mono-data font-bold">{source.name}</span></>}
          <span className="text-white/80">{tri("Prodotto recuperato", "Gewonnenes Produkt", "Recovered product")}</span><span className="text-right font-mono-data">{outKg} kg</span>
          <span className="text-white/80">{tri("Valore recuperato", "Gewonnener Wert", "Recovered value")}</span><span data-testid="aw-recovered" className="text-right font-mono-data font-bold">€ {recovered.toFixed(2)}</span>
          <span className="text-white/80">{tri("Costo esubero", "Kosten Reste", "Leftover cost")}</span><span className="text-right font-mono-data">€ {wasted.toFixed(2)}</span>
        </div>
        <p data-testid="aw-gain" className="mt-3 pt-3 border-t border-white/20 text-center font-display text-2xl font-bold flex items-center justify-center gap-2">
          <TrendingUp className="w-6 h-6" /> {tri("Guadagno", "Gewinn", "Gain")}: € {gain.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
