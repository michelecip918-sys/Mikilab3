import { useEffect, useState } from "react";
import { Euro, Flame } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { itemLabel, ingredientFamily, num, LS } from "@/lib/sitorTools";

// V92 — QUANTO TI COSTA. Prezzi indicativi al kg (modificabili, salvati sul telefono) × grammi della ricetta alla scala
// attuale, più la corrente del forno. Solo per curiosità e per fare i conti di casa: niente a che vedere con le dosi.

const DEF = { flour: 1.5, semolina: 1.6, water: 0, salt: 0.6, yeast: 12, sourdough: 0.8, pre: 0.8, biga: 1.5, butter: 9, oil: 8, lard: 6, eggs: 6, dairy: 4, sugar: 1.3, chocolate: 10, driedfruit: 9, nuts: 16, seeds: 8, potato: 1.5, meat: 18, veg: 4, drinks: 3, spices: 25, other: 6 };
const LABEL = {
  flour: ["Farina", "Mehl", "Flour"], semolina: ["Semola", "Hartweizengrieß", "Semolina"], water: ["Acqua", "Wasser", "Water"], salt: ["Sale", "Salz", "Salt"],
  yeast: ["Lievito di birra", "Hefe", "Fresh yeast"], sourdough: ["Lievito madre (vale come farina)", "Sauerteig (zählt wie Mehl)", "Sourdough (counts as flour)"], pre: ["Lievito madre / prefermento", "Sauerteig / Vorteig", "Sourdough / preferment"],
  biga: ["Biga / poolish", "Biga / Poolish", "Biga / poolish"], butter: ["Burro", "Butter", "Butter"], oil: ["Olio", "Öl", "Oil"], lard: ["Strutto", "Schmalz", "Lard"], eggs: ["Uova", "Eier", "Eggs"],
  dairy: ["Latte e latticini", "Milch und Milchprodukte", "Milk and dairy"], sugar: ["Zucchero, miele, malto", "Zucker, Honig, Malz", "Sugar, honey, malt"], chocolate: ["Cioccolato / cacao", "Schokolade / Kakao", "Chocolate / cocoa"],
  driedfruit: ["Canditi e frutta secca", "Kandierte und getrocknete Früchte", "Candied and dried fruit"], nuts: ["Frutta a guscio", "Nüsse", "Nuts"], seeds: ["Semi", "Saaten", "Seeds"], potato: ["Patate", "Kartoffeln", "Potatoes"],
  meat: ["Salumi e carne", "Wurst und Fleisch", "Cured meats and meat"], veg: ["Verdure ed erbe", "Gemüse und Kräuter", "Vegetables and herbs"], drinks: ["Birra, vino, liquori", "Bier, Wein, Spirituosen", "Beer, wine, spirits"], spices: ["Spezie e colori naturali", "Gewürze und natürliche Farben", "Spices and natural colours"], other: ["Altro", "Sonstiges", "Other"],
};

export default function QuantoTiCosta({ r, dough, lang, t }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [prices, setPrices] = useState(() => ({ ...DEF, ...LS.get("mikilab_prezzi", {}) }));
  const [kwh, setKwh] = useState(() => LS.get("mikilab_prezzo_kwh", 0.3));
  const [pieces, setPieces] = useState(1);
  const [shop, setShop] = useState("");
  useEffect(() => { LS.set("mikilab_prezzi", prices); }, [prices]);
  useEffect(() => { LS.set("mikilab_prezzo_kwh", kwh); }, [kwh]);
  const L = (k) => (LABEL[k] || LABEL.other)[lang === "de" ? 1 : lang === "en" ? 2 : 0];

  const lines = [];
  dough.items.forEach((it) => {
    if (!(it.grams > 0)) return;
    const fam = it.key === "extra" ? ingredientFamily(it.name) : it.key;
    lines.push({ fam, name: itemLabel(it, t, lang, tri), g: it.grams });
  });
  if (dough.biga) { lines.push({ fam: "flour", name: `${t("ing_flour")} (${dough.biga.kind})`, g: dough.biga.flour }); if (dough.biga.yeast > 0) lines.push({ fam: "yeast", name: `${L("yeast")} (${dough.biga.kind})`, g: dough.biga.yeast }); }
  const cost = (l) => (l.g / 1000) * num(prices[l.fam] ?? DEF.other);
  const ingTotal = lines.reduce((a, l) => a + cost(l), 0);
  const bakeMin = num(r.bake_minutes) || 40;
  const energyKwh = 0.8 + (bakeMin / 60) * 1.5;         // preriscaldamento + cottura, forno elettrico di casa
  const energy = energyKwh * num(kwh);
  const total = ingTotal + energy;
  const n = Math.max(1, Math.round(num(pieces)) || 1);
  const fams = [...new Set(lines.map((l) => l.fam))].filter((f) => f !== "water");
  const eur = (v) => `${(Math.round(v * 100) / 100).toFixed(2).replace(".", ",")} €`;
  const shopN = num(shop);

  return (
    <div data-testid="quanto-costa" className="space-y-3">
      <p className="text-[12.5px] text-foreground/85 leading-snug">
        {tri("Grammi della ricetta per il prezzo al chilo, più la corrente del forno. I prezzi sono di partenza: mettici i tuoi, restano salvati sul telefono.",
          "Gramm des Rezepts mal Kilopreis, plus der Strom für den Ofen. Die Preise sind Startwerte: trag deine ein, sie bleiben auf dem Handy gespeichert.",
          "Recipe grams times the price per kilo, plus the oven's electricity. Prices are starting values: put in yours, they stay saved on your phone.")}
      </p>
      <div data-testid="qc-table" className="rounded-xl border border-border bg-card p-3">
        <div className="space-y-1">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center justify-between text-[12.5px]"><span className="text-muted-foreground truncate pr-2">{l.name} <span className="font-mono-data">{l.g} g</span></span><span className="font-mono-data font-semibold text-foreground shrink-0">{eur(cost(l))}</span></div>
          ))}
          <div className="flex items-center justify-between text-[12.5px] pt-1 border-t border-border/60"><span className="text-muted-foreground flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {tri("Forno", "Ofen", "Oven")} ≈ {(Math.round(energyKwh * 10) / 10).toString().replace(".", ",")} kWh ({bakeMin} min + {tri("preriscaldo", "Vorheizen", "preheat")})</span><span className="font-mono-data font-semibold text-foreground">{eur(energy)}</span></div>
        </div>
      </div>
      <div data-testid="qc-result" className="rounded-xl border border-salvia/50 bg-salvia/10 p-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[12px] text-muted-foreground flex items-center gap-1"><Euro className="w-3.5 h-3.5" /> {tri("Questa infornata ti costa", "Diese Backrunde kostet dich", "This bake costs you")}</p>
            <p className="font-display text-3xl font-bold text-foreground leading-none">{eur(total)}</p>
          </div>
          <label className="text-right text-[12px] text-muted-foreground">
            {tri("Pezzi", "Stücke", "Pieces")} <input data-testid="qc-pieces" type="number" min="1" value={pieces} onChange={(e) => setPieces(e.target.value)} className="w-14 text-right font-mono-data text-sm font-bold text-primary bg-background border border-border rounded-lg px-2 py-1 outline-none" />
            <span className="block font-mono-data font-bold text-foreground mt-0.5">{eur(total / n)} {tri("l'uno", "je Stück", "each")}</span>
          </label>
        </div>
        <label className="flex items-center justify-between gap-2 text-[12px] text-muted-foreground mt-3 pt-2 border-t border-salvia/30">
          <span>{tri("In panetteria uno lo paghi", "Beim Bäcker zahlst du dafür", "At the bakery one costs")}</span>
          <span className="flex items-center gap-1"><input data-testid="qc-shop" type="number" min="0" step="0.1" value={shop} placeholder="—" onChange={(e) => setShop(e.target.value)} className="w-16 text-right font-mono-data text-sm font-bold text-primary bg-background border border-border rounded-lg px-2 py-1 outline-none" /> €</span>
        </label>
        {shopN > 0 && <p className="text-[12.5px] text-foreground mt-1.5">{shopN > total / n ? tri(`Risparmi ${eur(shopN - total / n)} a pezzo (${Math.round((1 - total / n / shopN) * 100)} %).`, `Du sparst ${eur(shopN - total / n)} je Stück (${Math.round((1 - total / n / shopN) * 100)} %).`, `You save ${eur(shopN - total / n)} per piece (${Math.round((1 - total / n / shopN) * 100)} %).`) : tri("Costa quanto in panetteria: ma è tuo.", "Kostet so viel wie beim Bäcker: aber es ist deins.", "It costs the same as the bakery: but it's yours.")}</p>}
      </div>
      <details className="rounded-xl border border-border bg-card p-3">
        <summary className="text-[12.5px] font-semibold text-foreground cursor-pointer">{tri("I miei prezzi (€ al kg)", "Meine Preise (€ je kg)", "My prices (€ per kg)")}</summary>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
          {fams.map((f) => (
            <label key={f} className="flex items-center justify-between gap-1 text-[11.5px] text-muted-foreground"><span className="truncate">{L(f)}</span>
              <input data-testid={`qc-price-${f}`} type="number" min="0" step="0.1" value={prices[f] ?? DEF.other} onChange={(e) => setPrices((p) => ({ ...p, [f]: e.target.value }))} className="w-14 text-right font-mono-data text-xs font-bold text-primary bg-background border border-border rounded-lg px-1.5 py-0.5 outline-none" /></label>
          ))}
          <label className="flex items-center justify-between gap-1 text-[11.5px] text-muted-foreground"><span>{tri("Corrente € al kWh", "Strom € je kWh", "Electricity € per kWh")}</span>
            <input data-testid="qc-kwh" type="number" min="0" step="0.01" value={kwh} onChange={(e) => setKwh(e.target.value)} className="w-14 text-right font-mono-data text-xs font-bold text-primary bg-background border border-border rounded-lg px-1.5 py-0.5 outline-none" /></label>
        </div>
      </details>
      <p className="text-[12px] text-salvia leading-snug">
        {tri("Sitor: il pane fatto in casa costa poco, ma non farlo per risparmiare. Fallo perché sai cosa c'è dentro e perché la casa profuma.",
          "Sitor: Selbstgebackenes Brot kostet wenig, aber backe nicht, um zu sparen. Backe, weil du weißt, was drin ist, und weil das Haus danach duftet.",
          "Sitor: homemade bread costs little, but don't bake to save money. Bake because you know what's inside and because the house smells of it.")}
      </p>
    </div>
  );
}
