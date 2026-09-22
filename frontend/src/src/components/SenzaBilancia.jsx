import { useState } from "react";
import { ChevronLeft, Scale, Info } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// V86 — "Pane senza bilancia": per chi è in vacanza o a casa della nonna. Trasforma i grammi della
// ricetta in tazze/bicchieri e cucchiai. Le dosi delle ricette NON cambiano: qui si converte solo il
// numero letto. Tabella unica, approssimazione dichiarata (±10 %). Nessun dato salvato.

const D = (it, de, en) => ({ it, de, en });
// grammi per: tazza da 240 ml, bicchiere da 200 ml, cucchiaio (15 ml), cucchiaino (5 ml)
const ING = [
  { k: "farina", n: D("Farina di grano (00, 0, 550)", "Weizenmehl (405, 550)", "Wheat flour (plain, 550)"), cup: 130, tbsp: 8, tsp: 2.7 },
  { k: "integrale", n: D("Farina integrale o segale", "Vollkorn- oder Roggenmehl", "Wholemeal or rye flour"), cup: 120, tbsp: 7.5, tsp: 2.5 },
  { k: "semola", n: D("Semola rimacinata", "Feiner Hartweizengrieß", "Fine durum semolina"), cup: 165, tbsp: 10, tsp: 3.5 },
  { k: "acqua", n: D("Acqua o latte", "Wasser oder Milch", "Water or milk"), cup: 240, tbsp: 15, tsp: 5 },
  { k: "olio", n: D("Olio", "Öl", "Oil"), cup: 220, tbsp: 14, tsp: 4.5 },
  { k: "zucchero", n: D("Zucchero", "Zucker", "Sugar"), cup: 200, tbsp: 12.5, tsp: 4 },
  { k: "sale", n: D("Sale fino", "Feines Salz", "Fine salt"), cup: 290, tbsp: 18, tsp: 6 },
  { k: "lievitosecco", n: D("Lievito di birra secco", "Trockenhefe", "Dry yeast"), cup: 150, tbsp: 9.5, tsp: 3.1 },
  { k: "burro", n: D("Burro morbido", "Weiche Butter", "Soft butter"), cup: 225, tbsp: 14, tsp: 4.7 },
  { k: "miele", n: D("Miele o malto", "Honig oder Malz", "Honey or malt"), cup: 340, tbsp: 21, tsp: 7 },
];

function breakdown(g, ing, cupG) {
  const parts = [];
  let rest = g;
  const cups = Math.floor(rest / cupG); if (cups) { parts.push([cups, "cup"]); rest -= cups * cupG; }
  const half = rest >= cupG / 2 - 1 ? 1 : 0; if (half) { parts.push([0.5, "cup"]); rest -= cupG / 2; }
  const tbsp = Math.floor(rest / ing.tbsp); if (tbsp) { parts.push([tbsp, "tbsp"]); rest -= tbsp * ing.tbsp; }
  const tsp = Math.round(rest / ing.tsp); if (tsp) parts.push([tsp, "tsp"]);
  return parts;
}

export default function SenzaBilancia({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => o[lang] || o.it;
  const [vessel, setVessel] = useState("tazza"); // tazza 240 | bicchiere 200
  const [vals, setVals] = useState({ farina: 500, acqua: 350, sale: 10, lievitosecco: 4 });
  const unit = (u, n) => u === "cup" ? (vessel === "tazza" ? tri(n === 1 ? "tazza" : "tazze", n === 1 ? "Tasse" : "Tassen", n === 1 ? "cup" : "cups") : tri(n === 1 ? "bicchiere" : "bicchieri", n === 1 ? "Glas" : "Gläser", n === 1 ? "glass" : "glasses"))
    : u === "tbsp" ? tri(n === 1 ? "cucchiaio" : "cucchiai", "EL", "tbsp") : tri(n === 1 ? "cucchiaino" : "cucchiaini", "TL", "tsp");

  return (
    <div data-testid="bilancia-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="bilancia-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2"><Scale className="w-6 h-6 text-primary" /><h1 className="font-display text-2xl font-black text-foreground">{tri("Pane senza bilancia", "Brot ohne Waage", "Bread without a scale")}</h1></div>
      <p className="text-sm text-muted-foreground">{tri("In vacanza, a casa della nonna, in campeggio: niente bilancia. Scrivi i grammi della ricetta e ti dico quante tazze e cucchiai sono. Le ricette restano in grammi: questa è solo una stampella.", "Im Urlaub, bei Oma, beim Camping: keine Waage. Schreib die Gramm aus dem Rezept und ich sage dir, wie viele Tassen und Löffel das sind. Die Rezepte bleiben in Gramm: das hier ist nur eine Krücke.", "On holiday, at grandma's, camping: no scale. Type the grams from the recipe and I'll tell you how many cups and spoons that is. Recipes stay in grams: this is just a crutch.")}</p>

      <div className="flex gap-2">
        <button onClick={() => setVessel("tazza")} className={`px-3 py-1.5 rounded-full text-sm font-bold border ${vessel === "tazza" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground"}`}>{tri("Tazza da 240 ml", "Tasse 240 ml", "240 ml cup")}</button>
        <button onClick={() => setVessel("bicchiere")} className={`px-3 py-1.5 rounded-full text-sm font-bold border ${vessel === "bicchiere" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground"}`}>{tri("Bicchiere da 200 ml", "Glas 200 ml", "200 ml glass")}</button>
      </div>

      <div className="space-y-2" data-testid="bilancia-rows">
        {ING.map((ing) => {
          const g = Number(vals[ing.k]) || 0;
          const cupG = vessel === "tazza" ? ing.cup : Math.round(ing.cup * 200 / 240);
          const parts = g ? breakdown(g, ing, cupG) : [];
          return (
            <div key={ing.k} className="rounded-xl border border-border bg-background px-3 py-2 grid grid-cols-[1fr_auto] gap-2 items-center">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-foreground leading-tight">{L(ing.n)}</p>
                <p className="text-[13px] text-primary font-bold min-h-[1.25rem]">{parts.length ? parts.map(([n, u]) => `${n === 0.5 ? "½" : n} ${unit(u, n)}`).join(" + ") : ""}</p>
              </div>
              <label className="flex items-center gap-1 text-[12px] text-muted-foreground">
                <input type="number" inputMode="numeric" min="0" max="5000" value={vals[ing.k] ?? ""} onChange={(e) => setVals((v) => ({ ...v, [ing.k]: e.target.value }))} placeholder="0" className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground text-right" /> g
              </label>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-ambra/50 bg-ambra/12 p-3 text-[12px] text-foreground/90 space-y-1">
        <p className="flex items-start gap-1.5"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-ambra" />{tri("Precisione circa ±10 %: per pane, focacce e pizze va bene. Per panettone, croissant e dolci serve la bilancia.", "Genauigkeit etwa ±10 %: für Brot, Focaccia und Pizza reicht das. Für Panettone, Croissants und Süßes braucht es die Waage.", "Accuracy about ±10 %: fine for bread, focaccia and pizza. For panettone, croissants and sweets you need the scale.")}</p>
        <p>{tri("Farina: riempi la tazza con un cucchiaio senza pressare e livella con il dorso di un coltello. Lievito fresco: un cubetto da 25 g si divide a occhio (metà = 12 g, un quarto = 6 g).", "Mehl: die Tasse mit einem Löffel füllen, nicht drücken, mit dem Messerrücken abstreichen. Frischhefe: ein 42-g-Würfel nach Augenmaß teilen (Hälfte = 21 g, Viertel = 10 g).", "Flour: fill the cup with a spoon without pressing and level with the back of a knife. Fresh yeast: split the block by eye (half, quarter).")}</p>
      </div>
    </div>
  );
}
