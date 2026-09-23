import { mkTri } from "@/i18n/triMaps";
import { ingredientFamily, itemLabel, fmt1 } from "@/lib/sitorTools";

// V98 — IN TAZZE E ONCE. Per chi cucina con le misure americane: ogni dose in cups / tablespoons / teaspoons e in once,
// con la densità giusta per ingrediente. Con una raccomandazione onesta: la bilancia vince sempre.

const CUP = { flour: 120, semolina: 165, sugar: 200, butter: 227, oil: 218, water: 240, dairy: 245, potato: 210, driedfruit: 150, nuts: 120, seeds: 150, chocolate: 170, sourdough: 240, meat: 225, veg: 150, drinks: 240, other: 150 };
const TSP = { salt: 6, yeast: 3, spices: 2, sugar: 4.2, oil: 4.5, water: 5 };

function toUS(grams, fam) {
  if (fam === "eggs") return { txt: `≈ ${fmt1(grams / 50)} egg${grams / 50 > 1.2 ? "s" : ""}` };
  if (TSP[fam] && grams < 40) { const tsp = grams / TSP[fam]; return { txt: tsp >= 3 ? `${fmt1(tsp / 3)} tbsp` : `${fmt1(tsp)} tsp` }; }
  const c = CUP[fam] || CUP.other; const cups = grams / c;
  if (cups >= 0.25) return { txt: `${fmt1(Math.round(cups * 4) / 4)} cup${cups > 1.2 ? "s" : ""}` };
  const tbsp = cups * 16; return { txt: tbsp >= 1 ? `${fmt1(Math.round(tbsp * 2) / 2)} tbsp` : `${fmt1(tbsp * 3)} tsp` };
}

export default function TazzeOnce({ r, dough, lang, t }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const rows = [];
  if (dough.biga) { rows.push({ l: `${dough.biga.kind === "poolish" ? "Poolish" : "Biga"} · ${t("ing_flour")}`, g: dough.biga.flour, fam: "flour" }, { l: `${dough.biga.kind === "poolish" ? "Poolish" : "Biga"} · ${t("ing_water")}`, g: dough.biga.water, fam: "water" }, { l: `${dough.biga.kind === "poolish" ? "Poolish" : "Biga"} · ${tri("lievito", "Hefe", "yeast")}`, g: dough.biga.yeast, fam: "yeast" }); }
  dough.items.forEach((it) => rows.push({ l: itemLabel(it, t, lang, tri), g: it.grams, fam: it.key === "flour" ? (/semol|grie|durum|hartweizen/i.test(r.flour_type || "") ? "semolina" : "flour") : it.key === "water" ? "water" : it.key === "salt" ? "salt" : it.key === "pre" ? "sourdough" : ingredientFamily(it.name) }));
  return (
    <div data-testid="tazze-once" className="space-y-2.5">
      <p className="text-[13px] text-foreground/85 leading-snug">{tri("Le dosi in tazze, cucchiai e once, per chi cucina con le misure americane. Densità diversa per ogni ingrediente: una tazza di farina non pesa come una di zucchero.", "Die Mengen in Cups, Löffeln und Unzen, für alle, die mit US-Maßen backen. Jede Zutat mit eigener Dichte: eine Tasse Mehl wiegt nicht wie eine Tasse Zucker.", "Quantities in cups, spoons and ounces, for those who cook with US measures. Each ingredient has its own density: a cup of flour doesn't weigh like a cup of sugar.")}</p>
      <div className="rounded-xl border border-border bg-card overflow-hidden text-[12.5px]">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] px-2.5 py-1.5 bg-muted/40 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"><span /><span className="text-right">g · oz</span><span className="text-right">cups</span></div>
        {rows.filter((x) => x.g > 0).map((x, i) => <div key={i} data-testid={`to-row-${i}`} className="grid grid-cols-[1.4fr_1fr_1fr] px-2.5 py-1.5 border-t border-border"><span className="text-foreground/85 break-words leading-tight">{x.l}</span><span className="font-mono-data text-right text-muted-foreground leading-tight">{Math.round(x.g)} g<br /><span className="text-[11px]">{fmt1(x.g / 28.35)} oz</span></span><span className="font-mono-data text-right font-semibold text-foreground">{toUS(x.g, x.fam).txt}</span></div>)}
      </div>
      {r && Number(r.bake_temp) > 0 && <p className="text-[12.5px] text-foreground">{tri("Forno", "Ofen", "Oven")}: <b className="font-mono-data">{Math.round(Number(r.bake_temp))} °C = {Math.round(Number(r.bake_temp) * 9 / 5 + 32)} °F</b>{Number(r.bake_minutes) > 0 ? ` · ${Math.round(Number(r.bake_minutes))} min` : ""}</p>}
      <p className="text-[12.5px] text-salvia leading-snug">{tri("Sitor: le tazze sono un'approssimazione (farina pressata o setacciata cambia del 20 %). Se hai una bilancia, usa i grammi: il pane ti ringrazia.", "Sitor: Cups sind eine Näherung (gedrücktes oder gesiebtes Mehl macht 20 % aus). Hast du eine Waage, nimm Gramm: das Brot dankt es dir.", "Sitor: cups are an approximation (packed or sifted flour changes by 20 %). If you have a scale, use grams: the bread will thank you.")}</p>
    </div>
  );
}
