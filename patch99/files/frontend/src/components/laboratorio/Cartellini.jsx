import { useState } from "react";
import { Printer, Plus, Trash2 } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { computeDough, LS, num } from "@/lib/sitorTools";
import { allergens } from "@/components/officina/CartolinaDelPane";

// V95 — I CARTELLINI DEL BANCO. Cartellini eleganti da stampare per il banco: nome, peso, prezzo, "contiene"
// (dedotto dagli ingredienti della ricetta). Promemoria: non sostituiscono l'etichettatura obbligatoria (Reg. UE 1169/2011).

const KEY = "mikilab_lab_cartellini";

export default function Cartellini({ recipes, lang, t }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [items, setItems] = useState(() => LS.get(KEY, []));
  const [pick, setPick] = useState("");
  const save = (n) => { setItems(n); LS.set(KEY, n); };
  const rows = items.map((it) => ({ ...it, r: recipes.find((x) => x.id === it.id) })).filter((it) => it.r);
  const upd = (i, p) => save(items.map((x, k) => (k === i ? { ...x, ...p } : x)));
  return (
    <div data-testid="cartellini" className="space-y-3">
      <p className="text-[13px] text-foreground/85 leading-snug">{tri("Cartellini per il banco: nome, peso, prezzo e cosa contiene, letto dagli ingredienti della ricetta. Si stampano in una pagina e si ritagliano.", "Thekenschilder: Name, Gewicht, Preis und Inhaltsstoffe, aus den Rezeptzutaten gelesen. Auf einer Seite drucken und ausschneiden.", "Counter tags: name, weight, price and what it contains, read from the recipe ingredients. Print on one page and cut out.")}</p>
      <div className="no-print flex gap-1.5">
        <select data-testid="ct-pick" value={pick} onChange={(e) => setPick(e.target.value)} className="flex-1 text-[12.5px] font-semibold bg-background text-foreground border border-border rounded-lg px-2 py-2 outline-none">
          <option value="">{tri("Aggiungi un prodotto…", "Produkt hinzufügen…", "Add a product…")}</option>
          {recipes.map((r) => <option key={r.id} value={r.id}>{rLoc(r, "name", lang)}</option>)}
        </select>
        <button data-testid="ct-add" onClick={() => { if (pick) { save([...items, { id: pick, g: 500, price: "" }]); setPick(""); } }} disabled={!pick} className="inline-flex items-center gap-1 text-[12.5px] font-bold px-3 rounded-lg bg-primary text-white disabled:opacity-40 active:scale-95"><Plus className="w-4 h-4" /></button>
      </div>
      <div className="no-print space-y-1.5">
        {rows.map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-[12.5px]">
            <span className="flex-1 font-semibold text-foreground truncate">{rLoc(it.r, "name", lang)}</span>
            <label className="inline-flex items-center gap-1"><input data-testid={`ct-g-${i}`} type="number" min="10" step="10" value={it.g} onChange={(e) => upd(i, { g: e.target.value })} className="w-16 font-mono-data text-right bg-background text-foreground border border-border rounded-md px-2 py-1 outline-none" /> g</label>
            <label className="inline-flex items-center gap-1"><input data-testid={`ct-price-${i}`} value={it.price} onChange={(e) => upd(i, { price: e.target.value.slice(0, 8) })} placeholder="0,00" className="w-16 font-mono-data text-right bg-background text-foreground border border-border rounded-md px-2 py-1 outline-none" /> €</label>
            <button data-testid={`ct-del-${i}`} onClick={() => save(items.filter((_, k) => k !== i))} className="p-1 text-muted-foreground"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div data-testid="ct-print" className="print-area grid grid-cols-2 gap-3">
        {rows.map((it, i) => {
          const d = computeDough(it.r, it.r.flour_grams); const cont = allergens(it.r, d, lang);
          return (
            <div key={i} data-testid={`ct-tag-${i}`} className="rounded-xl border border-foreground/30 bg-background p-3 text-center min-h-[120px] flex flex-col justify-between">
              <div>
                <p className="font-mono-data text-[9px] tracking-[0.3em] uppercase text-muted-foreground">MikiLab</p>
                <p className="font-display text-[17px] font-bold text-foreground leading-tight mt-1">{rLoc(it.r, "name", lang)}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{tri("Contiene", "Enthält", "Contains")}: {cont.join(", ") || tri("— (controlla gli ingredienti)", "— (Zutaten prüfen)", "— (check ingredients)")}</p>
              </div>
              <div className="flex items-end justify-between mt-2">
                <span className="font-mono-data text-[12.5px] text-foreground">{num(it.g) > 0 ? `${Math.round(num(it.g))} g` : ""}</span>
                <span className="font-mono-data text-[18px] font-bold text-foreground">{it.price ? `${it.price} €` : ""}</span>
              </div>
            </div>
          );
        })}
      </div>
      {rows.length > 0 && <button data-testid="ct-printbtn" onClick={() => window.print()} className="no-print inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl bg-primary text-white active:scale-95"><Printer className="w-4 h-4" />{tri("Stampa i cartellini", "Schilder drucken", "Print the tags")}</button>}
      <p className="text-[11px] text-muted-foreground">{tri("Il \"contiene\" è dedotto dalla ricetta: verifica sempre le etichette degli ingredienti che usi. Per la vendita vale l'etichettatura obbligatoria (Reg. UE 1169/2011); questo è un cartellino, non l'etichetta.", "\"Enthält\" wird aus dem Rezept abgeleitet: prüfe immer die Etiketten deiner Zutaten. Für den Verkauf gilt die Pflichtkennzeichnung (VO (EU) 1169/2011); das ist ein Schild, kein Etikett.", "\"Contains\" is derived from the recipe: always check the labels of the ingredients you use. For sale, mandatory labelling (Reg. EU 1169/2011) applies; this is a tag, not the label.")}</p>
    </div>
  );
}
