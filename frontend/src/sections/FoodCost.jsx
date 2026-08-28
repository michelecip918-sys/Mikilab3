import { useState, useEffect } from "react";
import { Euro, Zap, TrendingUp, Plus, Trash2, Flame, Share2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { shareContent } from "@/lib/share";
import RecipePicker from "@/components/RecipePicker";
import { mkTri } from "@/i18n/triMaps";

const STORE = "mikilab_foodcost";
const load = () => { try { const s = JSON.parse(localStorage.getItem(STORE)); if (s) return s; } catch { /* */ } return null; };

const DEFAULTS = {
  ingr: [
    { id: 1, name: "Farina 630", kg: 1, price: 1.2 },
    { id: 2, name: "Burro", kg: 0.25, price: 8 },
    { id: 3, name: "Zucchero", kg: 0.2, price: 1 },
  ],
  energy: [
    { id: 1, name: "Forno", kw: 6, hours: 0.8 },
    { id: 2, name: "Cella lievitazione", kw: 0.8, hours: 12 },
  ],
  kwhPrice: 0.35, doughG: 2000, loss: 10, pieces: 4, sell: 15,
};

export default function FoodCost() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [s, setS] = useState(() => load() || DEFAULTS);
  const [recipe, setRecipe] = useState(null);
  const onPickRecipe = (r) => {
    setRecipe(r);
    if (r) {
      const patch = {};
      if (r.price) patch.sell = r.price;
      if (r.costing?.dough_weight_g) patch.doughG = r.costing.dough_weight_g;
      if (Object.keys(patch).length) set(patch);
    }
  };
  useEffect(() => { localStorage.setItem(STORE, JSON.stringify(s)); }, [s]);
  const set = (patch) => setS((x) => ({ ...x, ...patch }));
  const num = (v) => (Number(v) || 0);

  const setIngr = (id, p) => set({ ingr: s.ingr.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  const setEnergy = (id, p) => set({ energy: s.energy.map((r) => (r.id === id ? { ...r, ...p } : r)) });

  const ingrCost = s.ingr.reduce((a, r) => a + num(r.kg) * num(r.price), 0);
  const kwh = s.energy.reduce((a, r) => a + num(r.kw) * num(r.hours), 0);
  const energyCost = kwh * num(s.kwhPrice);
  const total = ingrCost + energyCost;
  const pieces = Math.max(1, num(s.pieces));
  const costPiece = total / pieces;
  const bakedG = num(s.doughG) * (1 - num(s.loss) / 100);
  const perPieceBaked = bakedG / pieces;
  const margin = num(s.sell) > 0 ? ((num(s.sell) - costPiece) / num(s.sell)) * 100 : null;
  const eur = (v) => "€ " + v.toFixed(2);

  const inp = "bg-[#FAF5EC] dark:bg-[#1F252B] rounded-lg px-2 py-1 text-sm font-mono-data outline-none text-[#2B303B] dark:text-[#e4eff8]";

  return (
    <div className="pb-40">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#8C4A27] flex items-center justify-center"><Euro className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">Food Cost &amp; {tri("Energia", "Energie", "Energy")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Materie prime + kWh + calo peso = costo reale", "Rohstoffe + kWh + Backverlust = echte Kosten", "Ingredients + kWh + baking loss = real cost")}</p>
        </div>
      </div>

      <RecipePicker testid="fc-recipe" value={recipe?.id} onChange={onPickRecipe}
        label={tri("Calcola il costo di una TUA ricetta", "Kosten EINES DEINER Rezepte", "Cost of one of YOUR recipes")} />

      {/* Materie prime */}
      <h2 className="text-xs font-bold uppercase tracking-wide text-[#8C4A27] mb-2">{tri("Materie prime", "Rohstoffe", "Ingredients")}</h2>
      <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-2 mb-4">
        <div className="grid grid-cols-[1fr_64px_72px_28px] gap-1 px-1 pb-1 text-[10px] font-bold uppercase text-[#7E8A93]">
          <span>{tri("Ingrediente", "Zutat", "Ingredient")}</span><span className="text-right">kg</span><span className="text-right">€/kg</span><span />
        </div>
        {s.ingr.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_64px_72px_28px] gap-1 items-center mb-1">
            <input value={r.name} onChange={(e) => setIngr(r.id, { name: e.target.value })} className={inp + " bg-transparent"} />
            <input type="number" value={r.kg} onChange={(e) => setIngr(r.id, { kg: e.target.value })} className={inp + " text-right"} />
            <input type="number" value={r.price} onChange={(e) => setIngr(r.id, { price: e.target.value })} className={inp + " text-right"} />
            <button onClick={() => set({ ingr: s.ingr.filter((x) => x.id !== r.id) })} className="text-[#C0574D] flex justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <button data-testid="fc-add-ingr" onClick={() => set({ ingr: [...s.ingr, { id: Date.now(), name: "", kg: 0, price: 0 }] })} className="text-xs font-semibold text-[#8C4A27] flex items-center gap-1 mt-1"><Plus className="w-4 h-4" /> {tri("Aggiungi", "Hinzufügen", "Add")}</button>
      </div>

      {/* Energia */}
      <h2 className="text-xs font-bold uppercase tracking-wide text-[#B45309] mb-2 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {tri("Energia", "Energie", "Energy")}</h2>
      <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-2 mb-2">
        <div className="grid grid-cols-[1fr_64px_64px_28px] gap-1 px-1 pb-1 text-[10px] font-bold uppercase text-[#7E8A93]">
          <span>{tri("Macchina", "Maschine", "Machine")}</span><span className="text-right">kW</span><span className="text-right">{tri("ore", "Std.", "hrs")}</span><span />
        </div>
        {s.energy.map((r) => (
          <div key={r.id} className="grid grid-cols-[1fr_64px_64px_28px] gap-1 items-center mb-1">
            <input value={r.name} onChange={(e) => setEnergy(r.id, { name: e.target.value })} className={inp + " bg-transparent"} />
            <input type="number" value={r.kw} onChange={(e) => setEnergy(r.id, { kw: e.target.value })} className={inp + " text-right"} />
            <input type="number" value={r.hours} onChange={(e) => setEnergy(r.id, { hours: e.target.value })} className={inp + " text-right"} />
            <button onClick={() => set({ energy: s.energy.filter((x) => x.id !== r.id) })} className="text-[#C0574D] flex justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <button data-testid="fc-add-energy" onClick={() => set({ energy: [...s.energy, { id: Date.now(), name: "", kw: 0, hours: 0 }] })} className="text-xs font-semibold text-[#B45309] flex items-center gap-1 mt-1"><Plus className="w-4 h-4" /> {tri("Aggiungi", "Hinzufügen", "Add")}</button>
      </div>
      <div className="flex items-center justify-between text-sm mb-4 px-1">
        <span className="text-[#7E8A93]">{tri("Prezzo energia", "Energiepreis", "Energy price")} €/kWh</span>
        <input data-testid="fc-kwh-price" type="number" value={s.kwhPrice} onChange={(e) => set({ kwhPrice: e.target.value })} className={inp + " w-20 text-right"} />
      </div>

      {/* Resa / calo peso */}
      <h2 className="text-xs font-bold uppercase tracking-wide text-[#C0574D] mb-2 flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {tri("Resa & calo cottura", "Ausbeute & Backverlust", "Yield & baking loss")}</h2>
      <div className="grid grid-cols-3 gap-2 mb-5">
        <label className="text-[11px] text-[#7E8A93]">{tri("Impasto g", "Teig g", "Dough g")}<input data-testid="fc-dough" type="number" value={s.doughG} onChange={(e) => set({ doughG: e.target.value })} className={inp + " w-full mt-1"} /></label>
        <label className="text-[11px] text-[#7E8A93]">{tri("Calo %", "Verlust %", "Loss %")}<input data-testid="fc-loss" type="number" value={s.loss} onChange={(e) => set({ loss: e.target.value })} className={inp + " w-full mt-1"} /></label>
        <label className="text-[11px] text-[#7E8A93]">{tri("Pezzi", "Stück", "Pieces")}<input data-testid="fc-pieces" type="number" value={s.pieces} onChange={(e) => set({ pieces: e.target.value })} className={inp + " w-full mt-1"} /></label>
      </div>

      {/* Risultato */}
      <div data-testid="fc-result" className="rounded-3xl bg-gradient-to-br from-[#8C4A27] to-[#6E371C] text-white p-5 shadow-lg">
        {recipe && <p data-testid="fc-recipe-name" className="text-white/90 font-semibold text-sm mb-2 pb-2 border-b border-white/20">{recipe.name}</p>}
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-white/80">{tri("Materie prime", "Rohstoffe", "Ingredients")}</span><span className="text-right font-mono-data">{eur(ingrCost)}</span>
          <span className="text-white/80">{tri("Energia", "Energie", "Energy")} ({kwh.toFixed(1)} kWh)</span><span className="text-right font-mono-data">{eur(energyCost)}</span>
          <span className="text-white/80 font-semibold border-t border-white/20 pt-2">{tri("Costo totale", "Gesamtkosten", "Total cost")}</span><span className="text-right font-mono-data font-bold border-t border-white/20 pt-2">{eur(total)}</span>
          <span className="text-white/80">{tri("Costo per pezzo", "Kosten pro Stück", "Cost per piece")}</span><span data-testid="fc-cost-piece" className="text-right font-mono-data font-bold">{eur(costPiece)}</span>
          <span className="text-white/80">{tri("Peso cotto/pezzo", "Gewicht gebacken/Stück", "Baked weight/piece")}</span><span className="text-right font-mono-data">{Math.round(perPieceBaked)} g</span>
        </div>
        <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
          <span className="text-white/80 text-sm flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {tri("Prezzo vendita/pezzo", "VK-Preis/Stück", "Sell price/piece")}</span>
          <input data-testid="fc-sell" type="number" value={s.sell} onChange={(e) => set({ sell: e.target.value })} className="bg-white/15 rounded-lg px-2 py-1 text-sm text-right font-mono-data w-20 outline-none text-white" />
        </div>
        {margin != null && (
          <p data-testid="fc-margin" className={`mt-2 text-center font-display text-2xl font-bold ${margin < 0 ? "text-[#FFD7CF]" : "text-white"}`}>
            {tri("Margine", "Marge", "Margin")}: {margin.toFixed(0)}%
          </p>
        )}
      </div>

      <button data-testid="fc-share" onClick={() => {
        const L = tri("Food Cost — MikiLab", "Food Cost — MikiLab", "Food Cost — MikiLab");
        const txt = [
          `${tri("Materie prime", "Rohstoffe", "Ingredients")}: ${eur(ingrCost)}`,
          `${tri("Energia", "Energie", "Energy")} (${kwh.toFixed(1)} kWh): ${eur(energyCost)}`,
          `${tri("Costo totale", "Gesamtkosten", "Total cost")}: ${eur(total)}`,
          `${tri("Costo per pezzo", "Kosten/Stück", "Cost/piece")}: ${eur(costPiece)}`,
          `${tri("Prezzo vendita/pezzo", "VK/Stück", "Sell/piece")}: ${eur(num(s.sell))}`,
          margin != null ? `${tri("Margine", "Marge", "Margin")}: ${margin.toFixed(0)}%` : "",
        ].filter(Boolean).join("\n");
        shareContent(L, txt, lang);
      }}
        className="mt-3 w-full bg-[#e4eff8] dark:bg-[#2A323A] text-[#2B303B] dark:text-[#e4eff8] font-medium px-5 py-3 rounded-2xl border border-[#E6D8C3] dark:border-[#38424B] flex items-center justify-center gap-2 active:scale-98 transition-all">
        <Share2 className="w-5 h-5" /> {tri("Condividi", "Teilen", "Share")}
      </button>
    </div>
  );
}
