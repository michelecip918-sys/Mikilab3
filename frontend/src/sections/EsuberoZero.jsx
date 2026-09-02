import { mkTri } from "@/i18n/triMaps";
import { useState, useMemo } from "react";
import { ChevronRight, Recycle, Scale } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Ricette esubero: dosi in funzione del peso di esubero (rapporti sul peso esubero)
const RECIPES = [
  { key: "pancake", it: "Pancake all'esubero", de: "Sauerteig-Pancakes", en: "Discard pancakes", es: "Tortitas de descarte",
    ing: (g) => [["Esubero", g], ["Farina", Math.round(g * 0.6)], ["Latte", Math.round(g * 0.7)], ["Uovo", Math.max(1, Math.round(g / 100))], ["Zucchero", Math.round(g * 0.15)]] },
  { key: "crackers", it: "Crackers all'esubero", de: "Discard-Cracker", en: "Discard crackers", es: "Crackers de descarte",
    ing: (g) => [["Esubero", g], ["Farina", Math.round(g * 0.5)], ["Olio EVO", Math.round(g * 0.2)], ["Sale", Math.round(g * 0.02) || 2]] },
  { key: "grissini", it: "Grissini rapidi", de: "Schnelle Grissini", en: "Quick breadsticks", es: "Grissini rápidos",
    ing: (g) => [["Esubero", g], ["Farina", Math.round(g * 0.7)], ["Olio EVO", Math.round(g * 0.15)], ["Sale", Math.round(g * 0.02) || 2]] },
];

export default function EsuberoZero({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const rL = (r) => (lang === "de" ? r.de : lang === "es" ? r.es : (lang === "en" || lang === "fr" || lang === "fa") ? r.en : r.it);
  const [g, setG] = useState(150);
  const grams = useMemo(() => Math.max(0, Number(g) || 0), [g]);
  const num = (v) => Math.round(v).toLocaleString(lang === "en" ? "en" : "it");

  return (
    <div className="pb-8" data-testid="esubero-zero">
      {onBack && <button data-testid="esubero-back" onClick={onBack} className="flex items-center gap-1 text-[#c94f00] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#121212] shadow-xl mb-5" style={{ background: "linear-gradient(135deg,#2e8b6f,#1c5c49 70%,#c94f00)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><Recycle className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Calcolatore Esubero Zero-Sprechi", "Sauerteig-Rest-Rechner", "Zero-Waste Discard Calculator", "Calculadora Descarte Cero Residuos")}</h1>
        <p className="text-[#121212]/85 text-sm mt-2 leading-snug">{L("Pesa l'esubero di lievito madre nel frigo: ti do subito le ricette con le dosi già calcolate.", "Wiege deinen Sauerteig-Rest: sofort Rezepte mit Mengen.", "Weigh your sourdough discard: instant recipes with doses.", "Pesa tu descarte: recetas con dosis al instante.")}</p>
      </div>

      <div className="rounded-2xl bg-[#121212] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-4 shadow-sm mb-4">
        <p className="text-[12px] font-semibold text-[#c94f00] dark:text-[#AEB8BF] mb-1 flex items-center gap-1.5"><Scale className="w-4 h-4" /> {L("Peso esubero (g)", "Rest-Gewicht (g)", "Discard weight (g)", "Peso descarte (g)")}</p>
        <input data-testid="esubero-input" type="number" value={g} onChange={(e) => setG(e.target.value)}
          className="w-full bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 outline-none text-[#c94f00] dark:text-[#e4eff8] focus:border-[#c94f00] font-mono-data text-lg" />
      </div>

      <div className="space-y-3" data-testid="esubero-recipes">
        {RECIPES.map((r, i) => (
          <div key={r.key} data-testid={`esubero-recipe-${i}`} className="rounded-2xl bg-[#121212] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] overflow-hidden shadow-sm">
            <div className="bg-[#2e8b6f] text-[#121212] px-4 py-2.5"><p className="font-display text-base font-bold">{rL(r)}</p></div>
            <div className="divide-y divide-[#2e2e2e] dark:divide-[#2e2e2e]">
              {r.ing(grams).map(([name, val], j) => (
                <div key={j} className="flex items-center justify-between px-4 py-2 text-[13px]">
                  <span className="text-[#c94f00] dark:text-[#AEB8BF]">{name}</span>
                  <span className="font-mono-data font-bold text-[#c94f00] dark:text-[#e4eff8]">{name === "Uovo" ? `${val} pz` : `${num(val)} g`}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
