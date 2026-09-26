// V127 — Nella scheda ricetta: «quanti pezzi e di che peso?» → la farina giusta. Le proporzioni di Michele non
// cambiano: si sceglie solo quanta farina usare, come con i bottoni 250 / 500 / 750 / 1000.
import { useState } from "react";
import { mkTri } from "@/i18n/triMaps";
import { useLang } from "@/i18n/LanguageContext";
import { computeDough, num } from "@/lib/sitorTools";
import { hasBrosel } from "@/components/BroselBox";

export default function PezziPeso({ r, target, onScaleChange }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [open, setOpen] = useState(false);
  const [n, setN] = useState("2");
  const [w, setW] = useState("");
  const conBrosel = !!(r && hasBrosel(r));
  const [br, setBr] = useState(true);
  const flour = num(r && r.flour_grams);
  let perG = 0;
  try { perG = flour > 0 ? computeDough(r, flour).total / flour + (conBrosel && br ? 0.2 : 0) : 0; } catch { perG = 0; }
  if (!(perG > 1)) return null;
  const loc = lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT";
  const fmt = (x) => Math.round(x).toLocaleString(loc);
  const ora = num(target) * perG;
  const need = num(n) > 0 && num(w) > 0 ? num(n) * num(w) * 1.01 : 0;
  const farina = need > 0 ? Math.ceil(need / perG) : 0;
  const inCls = "w-16 font-mono-data text-[13px] font-bold text-foreground bg-card border border-border rounded-md px-1.5 py-1 outline-none focus:border-primary";

  if (!open) {
    return (
      <div className="no-print mb-2 -mt-1">
        <button type="button" data-testid={`pezzi-peso-open-${r.id}`} onClick={() => setOpen(true)} className="text-[11.5px] font-semibold text-primary hover:underline underline-offset-2">
          {tri("Oppure dimmi quanti pezzi e di che peso →", "Oder sag mir, wie viele Stück und wie schwer →", "Or tell me how many pieces and how heavy →")}
        </button>
      </div>
    );
  }
  return (
    <div data-testid={`pezzi-peso-${r.id}`} className="no-print mb-2 rounded-xl border border-border bg-card/70 p-2.5 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
        <input data-testid={`pezzi-n-${r.id}`} type="number" inputMode="numeric" min={1} value={n} onChange={(e) => setN(e.target.value)} className={inCls} aria-label={tri("Pezzi", "Stück", "Pieces")} />
        <span>{tri("pezzi da", "Stück à", "pieces of")}</span>
        <input data-testid={`pezzi-w-${r.id}`} type="number" inputMode="numeric" min={10} value={w} onChange={(e) => setW(e.target.value)} placeholder="500" className={inCls} aria-label={tri("Peso crudo", "Rohgewicht", "Raw weight")} />
        <span>{tri("g di impasto crudo", "g Rohteig", "g of raw dough")}</span>
        <button type="button" data-testid={`pezzi-usa-${r.id}`} disabled={!farina} onClick={() => { onScaleChange(String(farina)); setOpen(false); }}
          className="ml-auto px-3 py-1 rounded-full text-[11.5px] font-bold bg-primary text-primary-foreground disabled:opacity-40">{tri("Usa", "Übernehmen", "Use")}</button>
      </div>
      {farina ? <p className="text-[12px] text-foreground" data-testid={`pezzi-esito-${r.id}`}>{tri(`Servono ${fmt(farina)} g di farina (con l'1 % in più per la ciotola): le altre dosi seguono.`, `Du brauchst ${fmt(farina)} g Mehl (mit 1 % Zuschlag für die Schüssel): der Rest passt sich an.`, `You need ${fmt(farina)} g of flour (with 1 % extra for the bowl): everything else follows.`)}</p> : null}
      {conBrosel ? (
        <label className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
          <input type="checkbox" checked={br} onChange={(e) => setBr(e.target.checked)} />
          {tri("Conto anche il Brösel (pesa il 20 % della farina)", "Mit Bröseln rechnen (20 % des Mehlgewichts)", "Count the Brösel too (20 % of the flour weight)")}
        </label>
      ) : null}
      <p className="text-[11px] text-muted-foreground">{tri(`Con le dosi di adesso: circa ${fmt(ora)} g di impasto crudo.`, `Mit den aktuellen Mengen: etwa ${fmt(ora)} g Rohteig.`, `With the current amounts: about ${fmt(ora)} g of raw dough.`)}</p>
    </div>
  );
}
