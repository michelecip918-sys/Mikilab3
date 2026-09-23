import { useMemo, useState } from "react";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { computeDough, ingredientFamily, LS, num, fmt1 } from "@/lib/sitorTools";

// V93 — CONVERSIONI. La stessa ricetta con quattro metodi (diretto, biga, poolish, lievito madre), a parità di
// farina e acqua totali; TA e temperatura impasto; calo e resa per lotto; costo per lotto e per pezzo.

const KEY = "mikilab_lab_conv";
const g = (x) => `${Math.round(x)} g`;

function convert(r, kg) {
  const base = computeDough(r, r.flour_grams);
  const F = kg * 1000;
  const scale = F / (base.target || 1);
  const W = base.totalWater * scale;
  const salt = (base.items.find((i) => i.key === "salt") || {}).grams * scale || 0;
  const extras = base.items.filter((i) => i.key === "extra" && !/lievito di birra|hefe|yeast|lievito madre|sauerteig|licoli/i.test(i.name)).map((i) => ({ name: i.name, e: i.e, grams: i.grams * scale }));
  const bigaF = F * 0.4, bigaW = bigaF * 0.45, bigaY = bigaF * 0.01;
  const poolF = F * 0.3, poolW = poolF, poolY = poolF * 0.002;
  const lm = F * 0.25, lmF = lm / 1.5, lmW = lm / 3;
  return {
    F, W, salt, extras, hyd: (W / F) * 100,
    diretto: { yeast: F * 0.01, flour: F, water: W },
    biga: { bigaF, bigaW, bigaY, flour: F - bigaF, water: W - bigaW, yeast: F * 0.003 },
    poolish: { poolF, poolW, poolY, flour: F - poolF, water: W - poolW, yeast: F * 0.002 },
    lm: { lm, flour: F - lmF, water: W - lmW },
  };
}

export default function Conversioni({ recipes, lang, t }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [st, setSt] = useState(() => LS.get(KEY, { id: "", kg: 10, pieces: 20, loss: 12, price: 3.5 }));
  const set = (patch) => { const n = { ...st, ...patch }; setSt(n); LS.set(KEY, n); };
  const r = recipes.find((x) => x.id === st.id) || recipes[0];
  const C = useMemo(() => (r ? convert(r, Math.max(0.1, num(st.kg))) : null), [r, st.kg]);
  const prices = LS.get("mikilab_prezzi", {});
  const kwh = num(LS.get("mikilab_prezzo_kwh", 0.3)) || 0.3;
  if (!r || !C) return <p className="text-[12.5px] text-muted-foreground">{tri("Nessuna ricetta con le dosi.", "Kein Rezept mit Mengen.", "No recipe with quantities.")}</p>;

  const DEF = { flour: 1.2, semolina: 1.6, water: 0.002, salt: 0.6, yeast: 6, sourdough: 0, butter: 9, oil: 8, eggs: 5, dairy: 1.5, sugar: 1.2, chocolate: 12, driedfruit: 9, nuts: 14, seeds: 7, potato: 1.2, meat: 14, veg: 3, drinks: 3, spices: 25, other: 3 };
  const priceOf = (fam) => num(prices[fam] != null ? prices[fam] : DEF[fam] ?? 3);
  const total = C.F + C.W + C.salt + C.extras.reduce((a, x) => a + x.grams, 0) + C.diretto.yeast;
  const cost = (C.F / 1000) * priceOf(ingredientFamily(r.flour_type || "farina")) + (C.salt / 1000) * priceOf("salt") + (C.diretto.yeast / 1000) * priceOf("yeast") + C.extras.reduce((a, x) => a + (x.grams / 1000) * priceOf(ingredientFamily(x.name)), 0) + (num(r.bake_minutes) / 60) * 3.5 * kwh;
  const pieces = Math.max(1, num(st.pieces));
  const rawPiece = total / pieces;
  const baked = rawPiece * (1 - num(st.loss) / 100);
  const ptype = String(r.preferment_type || "").toLowerCase();
  const current = num(r.sourdough_grams) > 0 || ptype.includes("madre") ? "lm" : r.biga && (r.biga.show || ptype === "biga" || ptype === "poolish") ? (r.biga.kind === "poolish" || ptype === "poolish" ? "poolish" : "biga") : "diretto";

  const Card = ({ k, title, hours, rows, note }) => (
    <div data-testid={`cv-${k}`} className={`rounded-xl border p-3 ${current === k ? "border-primary/60 bg-primary/8" : "border-border bg-card"}`}>
      <p className="text-[13px] font-bold text-foreground">{title}{current === k && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-primary">{tri("com'è scritta", "wie im Rezept", "as written")}</span>}</p>
      <p className="text-[11px] text-muted-foreground mb-1.5">{hours}</p>
      <div className="space-y-0.5 text-[12.5px]">{rows.map(([a, b], i) => <div key={i} className="flex justify-between gap-2"><span className="text-muted-foreground">{a}</span><span className="font-mono-data font-semibold text-foreground">{b}</span></div>)}</div>
      {note && <p className="text-[12px] text-salvia mt-1.5 leading-snug">{note}</p>}
    </div>
  );
  const extrasRows = C.extras.map((x) => [x.e && x.e[`name_${lang}`] ? x.e[`name_${lang}`] : x.name, g(x.grams)]);
  const saltRow = [t("ing_salt"), g(C.salt)];

  return (
    <div data-testid="conversioni" className="space-y-3">
      <p className="text-[13px] text-foreground/85 leading-snug">{tri("La stessa ricetta con quattro metodi, a parità di farina e acqua totali. Scegli quello che entra nel tuo orario, non il contrario.", "Dasselbe Rezept mit vier Methoden, bei gleicher Gesamtmenge Mehl und Wasser. Wähl die, die in deinen Zeitplan passt, nicht umgekehrt.", "The same recipe with four methods, keeping total flour and water. Choose the one that fits your schedule, not the other way round.")}</p>
      <div className="rounded-xl border border-border bg-card p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select data-testid="cv-recipe" value={r.id} onChange={(e) => set({ id: e.target.value })} className="col-span-2 text-[12.5px] font-semibold bg-background text-foreground border border-border rounded-lg px-2 py-2 outline-none">
          {recipes.map((x) => <option key={x.id} value={x.id}>{rLoc(x, "name", lang)}</option>)}
        </select>
        <label className="block text-[12.5px] text-muted-foreground">{tri("kg farina", "kg Mehl", "kg flour")}<input data-testid="cv-kg" type="number" min="0.5" step="0.5" value={st.kg} onChange={(e) => set({ kg: e.target.value })} className="mt-0.5 w-full font-mono-data font-bold text-foreground bg-background border border-border rounded-md px-2 py-1.5 outline-none" /></label>
        <label className="block text-[12.5px] text-muted-foreground">{tri("pezzi", "Stück", "pieces")}<input data-testid="cv-pieces" type="number" min="1" value={st.pieces} onChange={(e) => set({ pieces: e.target.value })} className="mt-0.5 w-full font-mono-data font-bold text-foreground bg-background border border-border rounded-md px-2 py-1.5 outline-none" /></label>
      </div>
      <p className="text-[12.5px] text-foreground">{tri("Totali", "Gesamt", "Totals")}: <b className="font-mono-data">{g(C.F)}</b> {t("ing_flour").toLowerCase()} · <b className="font-mono-data">{g(C.W)}</b> {t("ing_water").toLowerCase()} · {tri("idratazione", "Hydration", "hydration")} <b className="font-mono-data">{fmt1(C.hyd)} %</b> · TA <b className="font-mono-data">{Math.round(100 + C.hyd)}</b></p>
      <div className="grid sm:grid-cols-2 gap-2">
        <Card k="diretto" title={tri("Diretto", "Direkt", "Direct")} hours={tri("Massa 1,5-2 h, forma 1-1,5 h a 25 °C", "Stockgare 1,5-2 h, Stückgare 1-1,5 h bei 25 °C", "Bulk 1.5-2 h, proof 1-1.5 h at 25 °C")}
          rows={[[t("ing_flour"), g(C.F)], [t("ing_water"), g(C.W)], [tri("Lievito fresco 1 %", "Frischhefe 1 %", "Fresh yeast 1 %"), g(C.diretto.yeast)], saltRow, ...extrasRows]}
          note={tri("Il più veloce, il meno profumato. Impasto a 25-26 °C.", "Am schnellsten, am wenigsten Aroma. Teig bei 25-26 °C.", "The fastest, the least aromatic. Dough at 25-26 °C.")} />
        <Card k="biga" title="Biga (40 %)" hours={tri("Biga 16-18 h a 16-18 °C; poi massa 1 h, forma 1-1,5 h", "Biga 16-18 h bei 16-18 °C; dann Stockgare 1 h, Stückgare 1-1,5 h", "Biga 16-18 h at 16-18 °C; then bulk 1 h, proof 1-1.5 h")}
          rows={[[tri("Biga: farina", "Biga: Mehl", "Biga: flour"), g(C.biga.bigaF)], [tri("Biga: acqua (45 %)", "Biga: Wasser (45 %)", "Biga: water (45 %)"), g(C.biga.bigaW)], [tri("Biga: lievito fresco 1 %", "Biga: Frischhefe 1 %", "Biga: fresh yeast 1 %"), g(C.biga.bigaY)], [tri("Impasto: farina", "Hauptteig: Mehl", "Final dough: flour"), g(C.biga.flour)], [tri("Impasto: acqua", "Hauptteig: Wasser", "Final dough: water"), g(C.biga.water)], [tri("Impasto: lievito 0,3 %", "Hauptteig: Hefe 0,3 %", "Final dough: yeast 0.3 %"), g(C.biga.yeast)], saltRow, ...extrasRows]}
          note={tri("Il metodo di Michele: gusto, durata, mollica che canta. La biga si sbriciola in acqua prima di aggiungere la farina.", "Micheles Methode: Geschmack, Haltbarkeit, eine Krume, die singt. Die Biga in Wasser zerbröseln, bevor das Mehl dazukommt.", "Michele's method: flavour, keeping, a crumb that sings. Crumble the biga into the water before adding the flour.")} />
        <Card k="poolish" title="Poolish (30 %)" hours={tri("Poolish 12-16 h a 20 °C; poi massa 1,5 h, forma 1 h", "Poolish 12-16 h bei 20 °C; dann Stockgare 1,5 h, Stückgare 1 h", "Poolish 12-16 h at 20 °C; then bulk 1.5 h, proof 1 h")}
          rows={[[tri("Poolish: farina", "Poolish: Mehl", "Poolish: flour"), g(C.poolish.poolF)], [tri("Poolish: acqua (100 %)", "Poolish: Wasser (100 %)", "Poolish: water (100 %)"), g(C.poolish.poolW)], [tri("Poolish: lievito fresco 0,2 %", "Poolish: Frischhefe 0,2 %", "Poolish: fresh yeast 0.2 %"), `${fmt1(C.poolish.poolY)} g`], [tri("Impasto: farina", "Hauptteig: Mehl", "Final dough: flour"), g(C.poolish.flour)], [tri("Impasto: acqua", "Hauptteig: Wasser", "Final dough: water"), g(C.poolish.water)], [tri("Impasto: lievito 0,2 %", "Hauptteig: Hefe 0,2 %", "Final dough: yeast 0.2 %"), g(C.poolish.yeast)], saltRow, ...extrasRows]}
          note={tri("Estensibile, crosta croccante: baguette, ciabatta, treccia. Pronto quando la superficie è piena di bolle e comincia ad avvallarsi al centro.", "Dehnbar, knusprige Kruste: Baguette, Ciabatta, Zopf. Fertig, wenn die Oberfläche voller Blasen ist und in der Mitte leicht einsinkt.", "Extensible, crisp crust: baguette, ciabatta, plaited loaves. Ready when the surface is full of bubbles and just starts to dip in the centre.")} />
        <Card k="lm" title={tri("Lievito madre (25 %)", "Sauerteig (25 %)", "Sourdough (25 %)")} hours={tri("2 rinfreschi prima; massa 3-4 h, forma 3-4 h a 26 °C (o notte in cella)", "2 Auffrischungen vorher; Stockgare 3-4 h, Stückgare 3-4 h bei 26 °C (oder nachts kalt)", "2 refreshes before; bulk 3-4 h, proof 3-4 h at 26 °C (or overnight cold)")}
          rows={[[tri("Lievito madre solido (50 %)", "Fester Sauerteig (50 %)", "Stiff starter (50 %)"), g(C.lm.lm)], [tri("Impasto: farina", "Hauptteig: Mehl", "Final dough: flour"), g(C.lm.flour)], [tri("Impasto: acqua", "Hauptteig: Wasser", "Final dough: water"), g(C.lm.water)], saltRow, ...extrasRows]}
          note={tri("Con il licoli (100 %): stessa quantità, ma togli metà del suo peso alla farina e metà all'acqua.", "Mit Licoli (100 %): gleiche Menge, aber je die Hälfte seines Gewichts vom Mehl und vom Wasser abziehen.", "With liquid starter (100 %): same amount, but subtract half its weight from the flour and half from the water.")} />
      </div>
      <div className="rounded-xl border border-border bg-card p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12.5px]">
        <label className="block text-muted-foreground">{tri("Calo di cottura", "Backverlust", "Bake loss")}<span className="flex items-center gap-1"><input data-testid="cv-loss" type="number" min="0" max="40" value={st.loss} onChange={(e) => set({ loss: e.target.value })} className="mt-0.5 w-full font-mono-data font-bold text-foreground bg-background border border-border rounded-md px-2 py-1.5 outline-none" />%</span></label>
        <div className="text-muted-foreground">{tri("Impasto totale", "Teig gesamt", "Total dough")}<br /><b className="font-mono-data text-foreground">{g(total)}</b></div>
        <div className="text-muted-foreground">{tri("Per pezzo, crudo → cotto", "Pro Stück, roh → gebacken", "Per piece, raw → baked")}<br /><b className="font-mono-data text-foreground">{g(rawPiece)} → {g(baked)}</b></div>
        <div className="text-muted-foreground">{tri("Costo lotto / pezzo", "Kosten Charge / Stück", "Batch / piece cost")}<br /><b className="font-mono-data text-foreground">{cost.toFixed(2).replace(".", ",")} € / {(cost / pieces).toFixed(2).replace(".", ",")} €</b></div>
      </div>
      <p className="text-[11px] text-muted-foreground">{tri("Costi con i prezzi salvati in 'Quanto ti costa' (o quelli di partenza) e la corrente del forno. Calo: pane 10-14 %, panini 10-12 %, baguette 16-20 %, cassetta 8-10 %.", "Kosten mit den in 'Was es dich kostet' gespeicherten Preisen (oder den Startwerten) und dem Ofenstrom. Verlust: Brot 10-14 %, Brötchen 10-12 %, Baguette 16-20 %, Kastenbrot 8-10 %.", "Costs use the prices saved in 'What it costs you' (or the defaults) and the oven's electricity. Loss: bread 10-14 %, rolls 10-12 %, baguette 16-20 %, tin loaf 8-10 %.")}</p>
      <p className="text-[12.5px] text-salvia leading-snug">{tri("Sitor: cambiare metodo non cambia la farina e l'acqua, cambia il tempo. Il tempo è l'ingrediente che non si compra.", "Sitor: die Methode zu wechseln ändert weder Mehl noch Wasser, sondern die Zeit. Zeit ist die Zutat, die man nicht kaufen kann.", "Sitor: changing method changes neither flour nor water, it changes time. Time is the ingredient you can't buy.")}</p>
    </div>
  );
}
