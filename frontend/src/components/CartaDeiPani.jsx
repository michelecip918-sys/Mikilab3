import { useEffect, useState } from "react";
import { ChevronLeft, ScrollText, Printer, Plus, Trash2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { computeLabel } from "@/components/EtichettaMikiLab";
import { LS, num, fmt1, fmtDateLong } from "@/lib/sitorTools";

// V95 — LA CARTA DEI PANI. Come la carta dei vini, ma per il pane: scegli i pani, un titolo, una data, se vuoi i prezzi;
// esce una carta elegante da stampare (cena in casa, regalo, banco della bottega). Descrizioni lette dalle ricette.

const KEY = "mikilab_carta";
const usable = (r) => r && !r.locked && num(r.flour_grams) > 0 && !/migliorator|backmittel|improver/i.test(r.name || "");

function describe(r, lang, tri) {
  const Lb = computeLabel(r); const bits = [];
  if (Lb.lm) bits.push(tri("lievito madre", "Sauerteig", "sourdough"));
  else if (Lb.hasPre) bits.push(tri(`${Lb.pt || "prefermento"} di ${fmt1(Lb.preHours[1] || Lb.preHours[0])} ore`, `${Lb.pt || "Vorteig"} über ${fmt1(Lb.preHours[1] || Lb.preHours[0])} Stunden`, `${Lb.pt || "preferment"} of ${fmt1(Lb.preHours[1] || Lb.preHours[0])} hours`));
  if (Lb.totMax >= 12) bits.push(tri(`${fmt1(Lb.totMax)} ore di lievitazione`, `${fmt1(Lb.totMax)} Stunden Gare`, `${fmt1(Lb.totMax)} hours of fermentation`));
  if (r.flour_type) bits.push(rLoc(r, "flour_type", lang) || r.flour_type);
  if (Lb.whole) bits.push(tri("cereali integrali", "Vollkorn", "wholegrain"));
  if (Lb.fat === 0 && Lb.sugar === 0) bits.push(tri("solo farina, acqua e sale", "nur Mehl, Wasser und Salz", "just flour, water and salt"));
  return bits.join(" · ");
}

export default function CartaDeiPani({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [recipes, setRecipes] = useState([]);
  const [st, setSt] = useState(() => LS.get(KEY, { title: "", sub: "", items: [], prices: false }));
  const set = (patch) => { const n = { ...st, ...patch }; setSt(n); LS.set(KEY, n); };
  const [pick, setPick] = useState("");
  useEffect(() => { let ok = true; recipesApi.list("mikilab").then((d) => { if (ok) setRecipes((d || []).filter(usable)); }).catch(() => {}); return () => { ok = false; }; }, []);
  const items = (st.items || []).map((it) => ({ ...it, r: recipes.find((x) => x.id === it.id) })).filter((it) => it.r);
  const title = st.title || tri("La carta dei pani", "Die Brotkarte", "The bread menu");
  const upd = (i, patch) => set({ items: st.items.map((x, k) => (k === i ? { ...x, ...patch } : x)) });

  return (
    <div data-testid="carta-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="carta-back" onClick={onBack} className="no-print inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="no-print">
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><ScrollText className="w-3 h-3" />MikiLab</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("La carta dei pani", "Die Brotkarte", "The bread menu")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tri("Come la carta dei vini, ma per il pane. Per una cena in casa, per un regalo, per il banco. Le descrizioni le leggo dalle ricette.", "Wie die Weinkarte, nur fürs Brot. Für ein Abendessen zu Hause, ein Geschenk, die Theke. Die Beschreibungen lese ich aus den Rezepten.", "Like a wine list, but for bread. For a dinner at home, a gift, the counter. I read the descriptions from the recipes.")}</p>
      </div>
      <div className="no-print rounded-2xl border border-border bg-card p-3 space-y-2">
        <input data-testid="carta-title" value={st.title} onChange={(e) => set({ title: e.target.value.slice(0, 60) })} placeholder={tri("Titolo (es. I pani di Michele)", "Titel (z. B. Micheles Brote)", "Title (e.g. Michele's breads)")} className="w-full text-[13px] bg-background text-foreground border border-border rounded-lg px-3 py-2 outline-none" />
        <input data-testid="carta-sub" value={st.sub} onChange={(e) => set({ sub: e.target.value.slice(0, 80) })} placeholder={tri("Sottotitolo (es. Cena del 16 ottobre, Giornata del pane)", "Untertitel (z. B. Abendessen am 16. Oktober)", "Subtitle (e.g. Dinner of 16 October)")} className="w-full text-[13px] bg-background text-foreground border border-border rounded-lg px-3 py-2 outline-none" />
        <div className="flex gap-1.5">
          <select data-testid="carta-pick" value={pick} onChange={(e) => setPick(e.target.value)} className="flex-1 text-[12px] font-semibold bg-background text-foreground border border-border rounded-lg px-2 py-2 outline-none">
            <option value="">{tri("Aggiungi un pane…", "Brot hinzufügen…", "Add a bread…")}</option>
            {recipes.filter((r) => !(st.items || []).some((it) => it.id === r.id)).map((r) => <option key={r.id} value={r.id}>{rLoc(r, "name", lang)}</option>)}
          </select>
          <button data-testid="carta-add" onClick={() => { if (pick && (st.items || []).length < 10) { set({ items: [...(st.items || []), { id: pick, price: "", note: "" }] }); setPick(""); } }} disabled={!pick} className="inline-flex items-center gap-1 text-[12px] font-bold px-3 rounded-lg bg-primary text-white disabled:opacity-40 active:scale-95"><Plus className="w-4 h-4" /></button>
        </div>
        <label className="flex items-center gap-2 text-[12px] text-foreground"><input data-testid="carta-prices" type="checkbox" checked={!!st.prices} onChange={(e) => set({ prices: e.target.checked })} className="accent-[hsl(var(--primary))]" />{tri("Mostra i prezzi (per il banco)", "Preise zeigen (für die Theke)", "Show prices (for the counter)")}</label>
        {items.map((it, i) => (
          <div key={it.id} className="flex items-center gap-2 text-[12px]">
            <span className="flex-1 font-semibold text-foreground truncate">{rLoc(it.r, "name", lang)}</span>
            <input data-testid={`carta-note-${i}`} value={it.note} onChange={(e) => upd(i, { note: e.target.value.slice(0, 60) })} placeholder={tri("nota (facoltativa)", "Notiz (optional)", "note (optional)")} className="w-32 bg-background text-foreground border border-border rounded-md px-2 py-1 outline-none" />
            {st.prices && <input data-testid={`carta-price-${i}`} value={it.price} onChange={(e) => upd(i, { price: e.target.value.slice(0, 8) })} placeholder="€" className="w-14 font-mono-data text-right bg-background text-foreground border border-border rounded-md px-2 py-1 outline-none" />}
            <button data-testid={`carta-del-${i}`} onClick={() => set({ items: st.items.filter((_, k) => k !== i) })} className="p-1 text-muted-foreground"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {/* La carta vera e propria: è quella che si stampa */}
      <div data-testid="carta-print" className="print-area rounded-2xl border border-border bg-background px-6 py-8 text-center" style={{ fontFeatureSettings: '"liga", "kern"' }}>
        <img src="/logo.webp" alt="MikiLab" className="w-12 h-12 mx-auto rounded-full object-cover mb-3" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <p className="font-mono-data text-[10px] tracking-[0.35em] uppercase text-muted-foreground">MikiLab · {tri("Il Manuale di Sitor", "Sitors Handbuch", "Sitor's Manual")}</p>
        <h2 className="font-display text-3xl font-bold text-foreground mt-2">{title}</h2>
        {st.sub ? <p className="font-display italic text-[15px] text-muted-foreground mt-1">{st.sub}</p> : <p className="font-display italic text-[15px] text-muted-foreground mt-1">{fmtDateLong(new Date(), lang)}</p>}
        <div className="w-16 h-px bg-primary mx-auto my-5" />
        {items.length === 0 && <p className="text-[12.5px] text-muted-foreground">{tri("Aggiungi i pani qui sopra: compaiono qui, pronti da stampare.", "Füge oben die Brote hinzu: sie erscheinen hier, druckfertig.", "Add the breads above: they appear here, ready to print.")}</p>}
        <div className="space-y-5 max-w-md mx-auto">
          {items.map((it, i) => (
            <div key={it.id} data-testid={`carta-item-${i}`}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-[19px] font-bold text-foreground text-left">{rLoc(it.r, "name", lang)}</p>
                {st.prices && it.price && <p className="font-mono-data text-[13px] text-foreground shrink-0">{it.price} €</p>}
              </div>
              <p className="text-[12px] text-muted-foreground text-left leading-snug">{describe(it.r, lang, tri)}</p>
              {it.note && <p className="text-[12px] italic text-foreground/80 text-left">{it.note}</p>}
            </div>
          ))}
        </div>
        <div className="w-16 h-px bg-primary mx-auto my-5" />
        <p className="text-[11px] text-muted-foreground">{tri("Ricette di Michele Signorella · guida IA Sitor · mikilab.de", "Rezepte von Michele Signorella · KI-Guide Sitor · mikilab.de", "Recipes by Michele Signorella · AI guide Sitor · mikilab.de")}</p>
      </div>
      <div className="no-print flex gap-1.5">
        <button data-testid="carta-printbtn" onClick={() => window.print()} disabled={items.length === 0} className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-xl bg-primary text-white disabled:opacity-40 active:scale-95"><Printer className="w-4 h-4" />{tri("Stampa la carta", "Karte drucken", "Print the menu")}</button>
      </div>
      <p className="no-print text-[10.5px] text-muted-foreground">{tri("Dalla stampa del telefono si può salvare anche come PDF. Se metti i prezzi per la vendita, l'etichettatura obbligatoria (ingredienti, allergeni) resta a parte: qui trovi i cartellini del banco nel Laboratorio.", "Über den Druckdialog des Handys lässt sich auch ein PDF speichern. Bei Preisen für den Verkauf bleibt die Pflichtkennzeichnung (Zutaten, Allergene) separat: die Thekenschilder findest du in der Backstube.", "From the phone's print dialog you can also save a PDF. If you add prices for sale, the mandatory labelling (ingredients, allergens) stays separate: the counter tags are in the bakery section.")}</p>
    </div>
  );
}
