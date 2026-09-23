import { useMemo, useState } from "react";
import { Plus, Printer, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { computeDough, itemLabel, LS, num, fmt1 } from "@/lib/sitorTools";

// V93 — FOGLIO DI PRODUZIONE. Più ricette nello stesso giorno: quanta farina, quanta acqua, quanto lievito in tutto,
// quanti sacchi, quanto impasto. Ogni riga si imposta in kg di farina oppure in pezzi × peso. Stampa per il banco.

const KEY = "mikilab_lab_foglio";
const kgOrG = (g) => (g >= 1000 ? `${(Math.round(g / 10) / 100).toString().replace(".", ",")} kg` : `${Math.round(g)} g`);

export default function FoglioProduzione({ recipes, lang, t }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [rows, setRows] = useState(() => LS.get(KEY, []));
  const [pick, setPick] = useState("");
  const save = (r) => { setRows(r); LS.set(KEY, r); };
  const byId = (id) => recipes.find((r) => r.id === id);

  const add = () => { const r = byId(pick); if (!r) return; save([...rows, { id: r.id, mode: "kg", kg: 5, pieces: 20, pieceG: 500 }]); setPick(""); };
  const upd = (i, patch) => save(rows.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const del = (i) => save(rows.filter((_, k) => k !== i));

  const lines = useMemo(() => rows.map((row) => {
    const r = byId(row.id); if (!r) return null;
    const base = computeDough(r, r.flour_grams);
    const doughPerFlour = base.total / (base.target || 1);
    const flour = row.mode === "kg" ? num(row.kg) * 1000 : (num(row.pieces) * num(row.pieceG)) / (doughPerFlour || 1);
    const d = computeDough(r, flour);
    return { row, r, d, flour };
  }).filter(Boolean), [rows, recipes]); // eslint-disable-line react-hooks/exhaustive-deps

  // totali per ingrediente (farina, acqua e lievito della biga sommati alle voci principali)
  const totals = useMemo(() => {
    const m = new Map();
    const addTo = (key, label, g) => { if (!(g > 0)) return; const cur = m.get(key) || { label, g: 0 }; cur.g += g; m.set(key, cur); };
    lines.forEach(({ d }) => {
      d.items.forEach((it) => addTo(it.key === "extra" ? `x:${String(it.name).toLowerCase()}` : it.key, itemLabel(it, t, lang, tri), it.grams));
      if (d.biga) { addTo("flour", t("ing_flour"), d.biga.flour); addTo("water", t("ing_water"), d.biga.water); addTo("x:lievito di birra", tri("Lievito di birra (prefermento)", "Hefe (Vorteig)", "Yeast (preferment)"), d.biga.yeast); }
    });
    const order = { flour: 0, water: 1, pre: 2, salt: 3 };
    return [...m.entries()].sort((a, b) => (order[a[0]] ?? 9) - (order[b[0]] ?? 9) || b[1].g - a[1].g);
  }, [lines, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const totFlour = totals.find(([k]) => k === "flour")?.[1].g || 0;
  const totDough = lines.reduce((a, l) => a + l.d.total, 0);

  const asText = () => {
    const L1 = lines.map(({ row, r, d }) => `• ${rLoc(r, "name", lang)}: ${row.mode === "kg" ? `${fmt1(num(row.kg))} kg ${t("ing_flour").toLowerCase()}` : `${row.pieces} × ${row.pieceG} g`} → ${kgOrG(d.total)} ${tri("impasto", "Teig", "dough")}`);
    const L2 = totals.map(([, v]) => `  ${v.label}: ${kgOrG(v.g)}`);
    return `${tri("Foglio di produzione", "Produktionsblatt", "Production sheet")} · mikilab.de\n${L1.join("\n")}\n\n${tri("Totali", "Summen", "Totals")}\n${L2.join("\n")}\n${tri("Sacchi da 25 kg", "Säcke à 25 kg", "25 kg sacks")}: ${(Math.ceil((totFlour / 25000) * 10) / 10).toString().replace(".", ",")}`;
  };

  return (
    <div data-testid="foglio-produzione" className="space-y-3">
      <p className="text-[13px] text-foreground/85 leading-snug">{tri("Metti insieme le ricette della giornata: ti do le quantità totali, i sacchi e l'impasto complessivo. Tutto resta sul tuo telefono.", "Stell die Rezepte des Tages zusammen: du bekommst Gesamtmengen, Säcke und die gesamte Teigmenge. Alles bleibt auf deinem Handy.", "Put together the day's recipes: you get total quantities, sacks and the overall dough. Everything stays on your phone.")}</p>
      <div className="no-print flex gap-1.5">
        <select data-testid="fp-pick" value={pick} onChange={(e) => setPick(e.target.value)} className="flex-1 text-[12.5px] font-semibold bg-background text-foreground border border-border rounded-lg px-2 py-2 outline-none">
          <option value="">{tri("Aggiungi una ricetta…", "Rezept hinzufügen…", "Add a recipe…")}</option>
          {recipes.map((r) => <option key={r.id} value={r.id}>{rLoc(r, "name", lang)}</option>)}
        </select>
        <button data-testid="fp-add" onClick={add} disabled={!pick} className="inline-flex items-center gap-1 text-[12.5px] font-bold px-3 rounded-lg bg-primary text-white disabled:opacity-40 active:scale-95"><Plus className="w-4 h-4" />{tri("Metti", "Rein", "Add")}</button>
      </div>
      <div className="print-area space-y-2">
        {lines.length === 0 && <p className="text-[12.5px] text-muted-foreground rounded-xl border border-border bg-card p-3">{tri("Nessuna ricetta ancora. Aggiungine una qui sopra.", "Noch kein Rezept. Füge oben eines hinzu.", "No recipe yet. Add one above.")}</p>}
        {lines.map(({ row, r, d }, i) => (
          <div key={i} data-testid={`fp-row-${i}`} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-foreground truncate">{rLoc(r, "name", lang)}</p>
              <button data-testid={`fp-del-${i}`} onClick={() => del(i)} className="no-print p-1 text-muted-foreground active:scale-90"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="no-print mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px]">
              <div className="inline-flex rounded-lg border border-border overflow-hidden">
                {["kg", "pz"].map((m) => <button key={m} onClick={() => upd(i, { mode: m })} className={`px-2.5 py-1 font-semibold ${row.mode === m ? "bg-primary text-white" : "bg-background text-muted-foreground"}`}>{m === "kg" ? tri("kg farina", "kg Mehl", "kg flour") : tri("pezzi", "Stück", "pieces")}</button>)}
              </div>
              {row.mode === "kg" ? (
                <label className="inline-flex items-center gap-1">kg <input data-testid={`fp-kg-${i}`} type="number" step="0.5" min="0" value={row.kg} onChange={(e) => upd(i, { kg: e.target.value })} className="w-16 font-mono-data text-right bg-background border border-border rounded-md px-1.5 py-1 outline-none" /></label>
              ) : (
                <>
                  <label className="inline-flex items-center gap-1"><input data-testid={`fp-pieces-${i}`} type="number" min="1" value={row.pieces} onChange={(e) => upd(i, { pieces: e.target.value })} className="w-14 font-mono-data text-right bg-background border border-border rounded-md px-1.5 py-1 outline-none" /> ×</label>
                  <label className="inline-flex items-center gap-1"><input data-testid={`fp-pieceg-${i}`} type="number" min="10" step="10" value={row.pieceG} onChange={(e) => upd(i, { pieceG: e.target.value })} className="w-16 font-mono-data text-right bg-background border border-border rounded-md px-1.5 py-1 outline-none" /> g {tri("crudi", "roh", "raw")}</label>
                </>
              )}
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[12.5px]">
              {d.biga && <div className="col-span-2 text-[11px] font-bold uppercase tracking-wide text-primary">{d.biga.kind === "poolish" ? "Poolish" : "Biga"}: {kgOrG(d.biga.flour)} {t("ing_flour").toLowerCase()} · {kgOrG(d.biga.water)} {t("ing_water").toLowerCase()} · {d.biga.yeast} g {tri("lievito", "Hefe", "yeast")}</div>}
              {d.items.map((it, k) => <div key={k} className="flex justify-between"><span className="text-muted-foreground truncate">{itemLabel(it, t, lang, tri)}</span><span className="font-mono-data font-semibold text-foreground">{kgOrG(it.grams)}</span></div>)}
              <div className="col-span-2 flex justify-between border-t border-border pt-1 mt-1"><span className="text-muted-foreground">{tri("Impasto", "Teig", "Dough")}</span><span className="font-mono-data font-bold text-foreground">{kgOrG(d.total)}{row.mode === "pz" ? ` · ${row.pieces} × ${row.pieceG} g` : ""}</span></div>
            </div>
          </div>
        ))}
        {lines.length > 0 && (
          <div data-testid="fp-totals" className="rounded-xl border border-salvia/40 bg-salvia/8 p-3">
            <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia mb-1.5">{tri("Totali della giornata", "Summen des Tages", "Day totals")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[13px]">
              {totals.map(([k, v]) => <div key={k} className="flex justify-between"><span className="text-muted-foreground truncate">{v.label}</span><span className="font-mono-data font-bold text-foreground">{kgOrG(v.g)}</span></div>)}
            </div>
            <p className="text-[12.5px] text-foreground mt-2">{tri("Sacchi da 25 kg", "Säcke à 25 kg", "25 kg sacks")}: <b className="font-mono-data">{(Math.ceil((totFlour / 25000) * 10) / 10).toString().replace(".", ",")}</b> · {tri("impasto totale", "Teig gesamt", "total dough")}: <b className="font-mono-data">{kgOrG(totDough)}</b></p>
          </div>
        )}
      </div>
      {lines.length > 0 && (
        <div className="no-print flex gap-1.5">
          <button data-testid="fp-print" onClick={() => window.print()} className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95"><Printer className="w-4 h-4" />{tri("Stampa", "Drucken", "Print")}</button>
          <button data-testid="fp-copy" onClick={() => { navigator.clipboard.writeText(asText()).then(() => toast.success(tri("Copiato.", "Kopiert.", "Copied."))).catch(() => toast.error(tri("Non riesco a copiare.", "Kopieren nicht möglich.", "Can't copy."))); }} className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl border border-border bg-card text-foreground active:scale-95"><Copy className="w-4 h-4" />{tri("Copia come testo", "Als Text kopieren", "Copy as text")}</button>
        </div>
      )}
      <p className="text-[12.5px] text-salvia leading-snug">{tri("Sitor: in laboratorio si pesa una volta sola e si scrive. Il foglio in tasca vale più della memoria alle quattro del mattino.", "Sitor: in der Backstube wiegt man einmal und schreibt es auf. Das Blatt in der Tasche ist um vier Uhr morgens mehr wert als das Gedächtnis.", "Sitor: in the bakery you weigh once and write it down. The sheet in your pocket is worth more than memory at four in the morning.")}</p>
    </div>
  );
}
