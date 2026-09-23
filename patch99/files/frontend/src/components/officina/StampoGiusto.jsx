import { useEffect, useMemo, useState } from "react";
import { Ruler, Scale } from "lucide-react";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";
import { num, computeDough, recipeKind, LS, clamp } from "@/lib/sitorTools";

// V92 — LO STAMPO GIUSTO. Dalle misure del tuo stampo, teglia, pentola o cestino calcola quanto impasto serve,
// poi scala la ricetta con la stessa funzione "scala dosi" già presente (le proporzioni non cambiano mai).

const TYPES = [
  { k: "cassetta", it: "Stampo da plumcake / cassetta", de: "Kastenform", en: "Loaf tin", dims: ["L", "W", "H"] },
  { k: "teglia", it: "Teglia rettangolare", de: "Rechteckiges Blech", en: "Rectangular tray", dims: ["L", "W"] },
  { k: "tonda", it: "Teglia tonda", de: "Runde Form", en: "Round tray", dims: ["D"] },
  { k: "pentola", it: "Pentola / cocotte", de: "Topf / Gusseisen", en: "Dutch oven / pot", dims: ["D"] },
  { k: "cestino", it: "Cestino tondo", de: "Rundes Gärkörbchen", en: "Round banneton", dims: ["D"] },
  { k: "ovale", it: "Cestino ovale", de: "Ovales Gärkörbchen", en: "Oval banneton", dims: ["L", "W"] },
  { k: "pirottino", it: "Pirottino da panettone", de: "Panettone-Papierform", en: "Panettone mould", dims: ["N"] },
];
const DIM_LABEL = { L: ["Lunghezza", "Länge", "Length"], W: ["Larghezza", "Breite", "Width"], H: ["Altezza", "Höhe", "Height"], D: ["Diametro", "Durchmesser", "Diameter"], N: ["Peso nominale (g)", "Nenngewicht (g)", "Nominal weight (g)"] };
const DEFAULTS = { cassetta: { L: 25, W: 11, H: 8 }, teglia: { L: 30, W: 40 }, tonda: { D: 30 }, pentola: { D: 24 }, cestino: { D: 25 }, ovale: { L: 28, W: 15 }, pirottino: { N: 1000 } };

// grammi di impasto per contenitore
function doughFor(type, d, kind) {
  const L = num(d.L), W = num(d.W), H = num(d.H), D = num(d.D);
  const area = (D * D * Math.PI) / 4;
  switch (type) {
    case "cassetta": return L * W * H * 0.4;                                // ~0,40 g per cm³ di stampo
    case "teglia": return L * W * (kind === "pizza" ? 0.7 : kind === "focaccia" ? 1.0 : 0.9);
    case "tonda": return area * (kind === "pizza" ? 0.4 : kind === "focaccia" ? 1.0 : 0.9);
    case "pentola": return area * 2.0;
    case "cestino": return area * 1.8;
    case "ovale": return (Math.PI / 4) * L * W * 2.6;
    case "pirottino": return num(d.N) * 1.1;                                 // ~10 % di calo in cottura
    default: return 0;
  }
}

export default function StampoGiusto({ r, lang, onScaleChange, scaleVal }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const kind = recipeKind(r);
  const saved = LS.get("mikilab_stampo", null);
  const [type, setType] = useState(saved?.type || (kind === "panettone" ? "pirottino" : kind === "pizza" || kind === "focaccia" ? "teglia" : "cassetta"));
  const [dims, setDims] = useState(saved?.dims?.[type] || DEFAULTS[type]);
  const [pieces, setPieces] = useState(1);
  const [override, setOverride] = useState("");
  useEffect(() => { setDims((saved?.dims?.[type]) || DEFAULTS[type]); setOverride(""); /* eslint-disable-next-line */ }, [type]);
  useEffect(() => { LS.set("mikilab_stampo", { type, dims: { ...(saved?.dims || {}), [type]: dims } }); /* eslint-disable-next-line */ }, [type, dims]);
  const T = TYPES.find((x) => x.k === type) || TYPES[0];
  const baseFlour = num(r.flour_grams);
  const base = useMemo(() => computeDough(r, baseFlour), [r, baseFlour]);
  const cur = useMemo(() => computeDough(r, num(scaleVal) || baseFlour), [r, scaleVal, baseFlour]);
  const perPiece = override !== "" ? num(override) : doughFor(type, dims, kind);
  const need = perPiece * clamp(num(pieces) || 1, 1, 50);
  const newFlour = base.total > 0 ? Math.round((baseFlour * need) / base.total) : 0;
  const diff = cur.total > 0 ? ((need - cur.total) / cur.total) * 100 : 0;
  const tl = (k) => DIM_LABEL[k][lang === "de" ? 1 : lang === "en" ? 2 : 0];

  if (!(baseFlour > 0)) return <p className="text-[13px] text-muted-foreground">{tri("Questa ricetta non ha la farina in grammi: non posso scalarla.", "Dieses Rezept hat kein Mehl in Gramm: ich kann es nicht skalieren.", "This recipe has no flour in grams: I can't scale it.")}</p>;

  return (
    <div data-testid="stampo-giusto" className="space-y-3">
      <p className="text-[13px] text-foreground/85 leading-snug">
        {tri("Misura il tuo stampo con un righello: ti dico quanto impasto ci sta e scalo la ricetta a quella misura, con le stesse proporzioni.",
          "Miss deine Form mit dem Lineal: ich sage dir, wie viel Teig hineinpasst, und skaliere das Rezept auf dieses Maß, mit denselben Verhältnissen.",
          "Measure your tin with a ruler: I'll tell you how much dough fits and scale the recipe to that size, keeping the same proportions.")}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map((x) => (
          <button key={x.k} data-testid={`sg-type-${x.k}`} onClick={() => setType(x.k)}
            className={`text-[12px] font-semibold px-2.5 py-1.5 rounded-full border transition-all active:scale-95 ${type === x.k ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"}`}>
            {lang === "de" ? x.de : lang === "en" ? x.en : x.it}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-3 space-y-2">
        <div className="flex flex-wrap gap-3">
          {T.dims.map((k) => (
            <label key={k} className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <Ruler className="w-3.5 h-3.5" /> {tl(k)}
              <input data-testid={`sg-dim-${k}`} type="number" min="1" step={k === "N" ? "50" : "0.5"} value={dims[k] ?? ""} onChange={(e) => setDims((d) => ({ ...d, [k]: e.target.value }))}
                className="w-16 text-right font-mono-data text-sm font-bold text-primary bg-background border border-border rounded-lg px-2 py-1 outline-none" />
              {k !== "N" && <span>cm</span>}
            </label>
          ))}
          <label className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
            {tri("Quanti stampi", "Wie viele Formen", "How many tins")}
            <input data-testid="sg-pieces" type="number" min="1" max="50" value={pieces} onChange={(e) => setPieces(e.target.value)}
              className="w-14 text-right font-mono-data text-sm font-bold text-primary bg-background border border-border rounded-lg px-2 py-1 outline-none" />
          </label>
        </div>
        <label className="flex items-center justify-between gap-2 text-[12.5px] text-muted-foreground pt-1 border-t border-border/60">
          <span>{tri("Se sai già quanto impasto ci vuole per stampo, scrivilo qui", "Wenn du schon weißt, wie viel Teig pro Form nötig ist, schreib es hier", "If you already know how much dough per tin, write it here")}</span>
          <span className="flex items-center gap-1"><input data-testid="sg-override" type="number" min="0" step="10" value={override} placeholder={String(Math.round(doughFor(type, dims, kind)))} onChange={(e) => setOverride(e.target.value)}
            className="w-20 text-right font-mono-data text-sm font-bold text-primary bg-background border border-border rounded-lg px-2 py-1 outline-none" /> g</span>
        </label>
      </div>

      <div data-testid="sg-result" className="rounded-xl border border-salvia/50 bg-salvia/10 p-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[12.5px] text-muted-foreground">{tri("Impasto per stampo", "Teig pro Form", "Dough per tin")}</p>
            <p className="font-display text-3xl font-bold text-foreground leading-none">{Math.round(perPiece)} g</p>
          </div>
          <div className="text-right">
            <p className="text-[12.5px] text-muted-foreground">{tri("Impasto totale", "Teig gesamt", "Total dough")}</p>
            <p className="font-mono-data text-xl font-bold text-foreground leading-none">{Math.round(need)} g</p>
          </div>
        </div>
        <p className="text-[12px] text-muted-foreground mt-2">
          {tri("La ricetta com'è adesso fa", "Das Rezept ergibt jetzt", "The recipe as it is now makes")} <b className="font-mono-data text-foreground">{Math.round(cur.total)} g</b> {tri("di impasto con", "Teig mit", "of dough with")} {cur.totalFlour} g {tri("di farina", "Mehl", "of flour")}
          {Math.abs(diff) >= 3 ? ` (${diff > 0 ? tri("te ne serve di più", "du brauchst mehr", "you need more") : tri("ne avanza", "es bleibt übrig", "you'd have leftovers")}: ${diff > 0 ? "+" : ""}${Math.round(diff)} %)` : ` — ${tri("ci siamo", "das passt", "that's about right")}`}.
        </p>
        {type === "cassetta" && <p className="text-[11px] text-muted-foreground mt-1">{tri("Riempi lo stampo per metà: il pane cresce fino al bordo e oltre.", "Form zur Hälfte füllen: das Brot wächst bis zum Rand und darüber.", "Fill the tin halfway: the bread grows to the rim and beyond.")}</p>}
        {(type === "teglia" || type === "tonda") && <p className="text-[11px] text-muted-foreground mt-1">{kind === "pizza" ? tri("Pizza in teglia: circa 0,7 g per cm². Per la pizza tonda al piatto: 250-280 g per 30 cm.", "Blechpizza: etwa 0,7 g je cm². Runde Pizza: 250-280 g für 30 cm.", "Tray pizza: about 0.7 g per cm². Round plate pizza: 250-280 g for 30 cm.") : tri("Focaccia alta e soffice: circa 1 g per cm² di teglia.", "Hohe, weiche Focaccia: etwa 1 g je cm² Blech.", "Tall, soft focaccia: about 1 g per cm² of tray.")}</p>}
        {type === "pirottino" && <p className="text-[11px] text-muted-foreground mt-1">{tri("Un panettone da 1 kg si fa con circa 1100 g di impasto: in cottura perde il 10 %.", "Ein 1-kg-Panettone braucht etwa 1100 g Teig: beim Backen verliert er 10 %.", "A 1 kg panettone takes about 1100 g of dough: it loses 10 % in the oven.")}</p>}
        <div className="flex flex-wrap gap-2 mt-3">
          <button data-testid="sg-apply" disabled={!(newFlour > 0)} onClick={() => { onScaleChange(String(newFlour)); toast.success(tri(`Ricetta scalata: ${newFlour} g di farina`, `Rezept skaliert: ${newFlour} g Mehl`, `Recipe scaled: ${newFlour} g flour`)); }}
            className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold text-[13px] px-3.5 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-50">
            <Scale className="w-4 h-4" /> {tri(`Scala la ricetta a ${newFlour} g di farina`, `Rezept auf ${newFlour} g Mehl skalieren`, `Scale the recipe to ${newFlour} g flour`)}
          </button>
          {Math.round(num(scaleVal) || baseFlour) !== Math.round(baseFlour) && (
            <button data-testid="sg-reset" onClick={() => onScaleChange(String(baseFlour))} className="text-[12.5px] font-semibold text-muted-foreground underline decoration-dotted active:scale-95">
              {tri("Torna alla dose originale", "Zurück zur Originalmenge", "Back to the original amount")}
            </button>
          )}
        </div>
      </div>
      <p className="text-[12.5px] text-salvia leading-snug">
        {tri("Sitor: le dosi restano nelle stesse proporzioni, cambia solo la quantità. Se il pane esce troppo alto o troppo basso, la prossima volta correggi del 10 % e segnatelo.",
          "Sitor: Die Verhältnisse bleiben gleich, nur die Menge ändert sich. Wird das Brot zu hoch oder zu flach, korrigiere beim nächsten Mal um 10 % und notiere es dir.",
          "Sitor: the proportions stay the same, only the quantity changes. If the bread comes out too tall or too flat, adjust by 10 % next time and write it down.")}
      </p>
    </div>
  );
}
