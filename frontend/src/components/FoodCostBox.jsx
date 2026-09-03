import { useState, useMemo } from "react";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Calcolatore Food Cost & Margini generico, valido per qualsiasi ricetta/prodotto.
export default function FoodCostBox() {
  const { lang } = useLang();
  const L = (i, e, s, f) => mkTri(lang)(i, e, e, s || e, f || e);
  const inp = "w-full bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 outline-none text-[#3E9C93] dark:text-[#e4eff8] focus:border-[#3E9C93] font-mono-data";
  const lbl = "text-[12px] font-semibold text-[#3E9C93] dark:text-[#AEB8BF] mb-1";

  const [rows, setRows] = useState([
    { name: L("Farina", "Flour", "Harina", "Farine"), cost: 1.2, qty: 1 },
    { name: L("Lievito madre", "Sourdough", "Masa madre", "Levain"), cost: 0, qty: 0 },
  ]);
  const [pieces, setPieces] = useState(10);
  const [price, setPrice] = useState(3.5);
  const [overhead, setOverhead] = useState(25);

  const set = (i, k, v) => setRows((l) => l.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const add = () => setRows((l) => [...l, { name: "", cost: 0, qty: 0 }]);
  const del = (i) => setRows((l) => l.filter((_, j) => j !== i));

  const calc = useMemo(() => {
    const ingCost = rows.reduce((a, r) => a + (Number(r.cost) || 0) * (Number(r.qty) || 0), 0);
    const oh = ingCost * (Number(overhead) || 0) / 100;
    const total = ingCost + oh;
    const perPiece = pieces > 0 ? total / pieces : 0;
    const revenue = (Number(price) || 0) * (Number(pieces) || 0);
    const profit = revenue - total;
    const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;
    const markupPct = total > 0 ? (profit / total) * 100 : 0;
    return { ingCost, oh, total, perPiece, revenue, profit, marginPct, markupPct };
  }, [rows, pieces, price, overhead]);

  const eur = (v) => (Number(v) || 0).toLocaleString(lang === "it" ? "it" : "en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const card = "rounded-2xl bg-[#0E1620] dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] p-4 shadow-sm";

  return (
    <div className={card} data-testid="foodcost-box">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-[#3E9C93]" />
        <h3 className="font-display text-lg font-bold text-[#3E9C93] dark:text-[#e4eff8]">{L("Food Cost & Margini", "Food Cost & Margins", "Food Cost y Márgenes", "Food Cost & Marges")}</h3>
      </div>

      <p className={lbl}>{L("Ingredienti (costo al kg/l · quantità in kg/l)", "Ingredients (cost per kg/l · qty in kg/l)", "Ingredientes (coste por kg/l · cantidad kg/l)", "Ingrédients (coût au kg/l · quantité kg/l)")}</p>
      <div className="space-y-2 mb-3">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2" data-testid={`fc-row-${i}`}>
            <input data-testid={`fc-name-${i}`} value={r.name} onChange={(e) => set(i, "name", e.target.value)} placeholder={L("Ingrediente", "Ingredient", "Ingrediente", "Ingrédient")} className={inp + " flex-1 min-w-0 !font-sans"} />
            <input data-testid={`fc-cost-${i}`} type="number" step="0.01" value={r.cost} onChange={(e) => set(i, "cost", e.target.value)} className={inp + " w-20 shrink-0"} title="€/kg" />
            <input data-testid={`fc-qty-${i}`} type="number" step="0.01" value={r.qty} onChange={(e) => set(i, "qty", e.target.value)} className={inp + " w-20 shrink-0"} title="kg" />
            <button data-testid={`fc-del-${i}`} onClick={() => del(i)} className="text-[#3E9C93] shrink-0 p-1"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <button data-testid="fc-add" onClick={add} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#3E9C93] mb-4"><Plus className="w-4 h-4" /> {L("Aggiungi ingrediente", "Add ingredient", "Añadir ingrediente", "Ajouter un ingrédient")}</button>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
        <div><p className={lbl}>{L("Pezzi", "Pieces", "Piezas", "Pièces")}</p><input data-testid="fc-pieces" type="number" value={pieces} onChange={(e) => setPieces(Number(e.target.value))} className={inp} /></div>
        <div><p className={lbl}>{L("Prezzo/pz €", "Price/pc €", "Precio/pza €", "Prix/pc €")}</p><input data-testid="fc-price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inp} /></div>
        <div><p className={lbl}>{L("Spese % ", "Overhead %", "Gastos %", "Frais %")}</p><input data-testid="fc-overhead" type="number" value={overhead} onChange={(e) => setOverhead(e.target.value)} className={inp} /></div>
      </div>

      <div data-testid="fc-out" className="rounded-2xl shadow-md border border-amber-900/40 bg-[#ffffff] p-3 divide-y divide-[#2A3B49]">
        {[
          [L("Costo ingredienti", "Ingredient cost", "Coste ingredientes", "Coût ingrédients"), `€ ${eur(calc.ingCost)}`],
          [L("Spese generali", "Overhead", "Gastos generales", "Frais généraux"), `€ ${eur(calc.oh)}`],
          [L("Costo totale", "Total cost", "Coste total", "Coût total"), `€ ${eur(calc.total)}`],
          [L("Costo a pezzo", "Cost per piece", "Coste por pieza", "Coût par pièce"), `€ ${eur(calc.perPiece)}`],
          [L("Ricavo", "Revenue", "Ingresos", "Revenu"), `€ ${eur(calc.revenue)}`],
        ].map(([k, v], i) => (
          <div key={i} className="flex justify-between py-1.5 text-[13px]"><span className="text-[#3E9C93]">{k}</span><span className="font-mono-data font-bold text-[#3E9C93]">{v}</span></div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div data-testid="fc-margin" className={`rounded-2xl shadow-md border border-amber-900/40 p-3 text-center border ${calc.profit >= 0 ? "bg-[#DCFCE7] border-[#16A34A]" : "bg-[#FEE2E2] border-[#DC2626]"}`}>
          <p className="text-[11px] font-semibold text-[#3E9C93]">{L("Margine", "Margin", "Margen", "Marge")}</p>
          <p className="font-display text-2xl font-bold text-[#3E9C93]">{calc.marginPct.toFixed(0)}%</p>
          <p className="text-[11px] text-[#3E9C93]">€ {eur(calc.profit)}</p>
        </div>
        <div className="rounded-2xl shadow-md border border-amber-900/40 p-3 text-center border bg-[#ffffff] border-[#3E9C93]">
          <p className="text-[11px] font-semibold text-[#3E9C93]">{L("Ricarico", "Markup", "Margen s/coste", "Marge s/coût")}</p>
          <p className="font-display text-2xl font-bold text-[#3E9C93]">{calc.markupPct.toFixed(0)}%</p>
          <p className="text-[11px] text-[#3E9C93]">{L("sul costo", "on cost", "sobre coste", "sur coût")}</p>
        </div>
      </div>
    </div>
  );
}
