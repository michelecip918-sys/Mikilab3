import { useState } from "react";
import { Clock, Snowflake, Sun } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { fermentationHours, fermentationFactor, fmt1, fmtTime, num } from "@/lib/sitorTools";

// V92 — LIEVITAZIONE A CASA TUA. I tempi della ricetta valgono a ~25 °C: ogni 8 °C in meno il lievito
// va circa la metà, ogni 8 °C in più circa il doppio. Qui i tempi vengono adattati alla TUA cucina.

const PRESETS = [
  { t: 4, it: "Frigo", de: "Kühlschrank", en: "Fridge", Icon: Snowflake },
  { t: 14, it: "Cantina", de: "Keller", en: "Cellar" },
  { t: 18, it: "Cucina fredda", de: "Kalte Küche", en: "Cold kitchen" },
  { t: 22, it: "Cucina normale", de: "Normale Küche", en: "Normal kitchen" },
  { t: 27, it: "Estate", de: "Sommer", en: "Summer", Icon: Sun },
  { t: 30, it: "Forno spento, luce accesa", de: "Ofen aus, Licht an", en: "Oven off, light on" },
];

const hrs = (h, lang) => {
  const tri = mkTri(lang);
  if (h < 1) return `${Math.round(h * 60)} ${tri("min", "Min.", "min")}`;
  if (h < 10) return `${fmt1(h)} h`;
  return `${Math.round(h)} h`;
};

export default function LievitazioneACasa({ r, lang }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const F = fermentationHours(r);
  const [temp, setTemp] = useState(22);
  const [ref, setRef] = useState(25);
  const [start, setStart] = useState(() => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; });
  const factor = fermentationFactor(temp, ref);
  const adj = (h) => (h > 0 ? h / factor : 0);
  const bulk = adj(F.bulk), proof = adj(F.proof);
  const cold = temp <= 8;
  const rows = [
    F.bulk > 0 && { k: tri("Lievitazione in massa", "Stockgare (Masse)", "Bulk fermentation"), base: F.bulk, now: bulk },
    F.proof > 0 && { k: tri("Lievitazione finale (dopo la forma)", "Stückgare (nach dem Formen)", "Final proof (after shaping)"), base: F.proof, now: proof },
  ].filter(Boolean);
  const startDate = (() => { const [h, m] = start.split(":").map(num); const d = new Date(); d.setHours(h || 0, m || 0, 0, 0); return d; })();
  const at = (hoursFromStart) => fmtTime(new Date(startDate.getTime() + hoursFromStart * 3600 * 1000), lang);
  const grow = F.lm ? tri("del 60-75 %", "um 60-75 %", "by 60-75 %") : tri("fino al raddoppio", "bis zur Verdopplung", "until doubled");

  if (rows.length === 0) {
    return <p className="text-[12.5px] text-muted-foreground">{tri("Questa ricetta non indica ore di lievitazione: segui il procedimento.", "Dieses Rezept nennt keine Garzeiten: folge dem Ablauf.", "This recipe gives no proofing hours: follow the method.")}</p>;
  }

  return (
    <div data-testid="lievitazione-casa" className="space-y-3">
      <p className="text-[12.5px] text-foreground/85 leading-snug">
        {tri("I tempi scritti nelle ricette valgono per una cucina a circa 25 °C. Dimmi quanti gradi ci sono da te e ti dico quanto aspettare davvero.",
          "Die Zeiten im Rezept gelten für eine Küche mit etwa 25 °C. Sag mir, wie warm es bei dir ist, und ich sage dir, wie lange du wirklich warten musst.",
          "Recipe times are written for a kitchen at about 25 °C. Tell me how warm it is at your place and I'll tell you how long to really wait.")}
      </p>
      <div className="rounded-xl border border-border bg-card p-3 space-y-2.5">
        <label className="block">
          <span className="flex items-center justify-between text-[12.5px] text-muted-foreground"><span>{tri("Temperatura dove lievita l'impasto", "Temperatur, wo der Teig geht", "Temperature where the dough rises")}</span><span className="font-mono-data font-bold text-foreground">{temp} °C</span></span>
          <input data-testid="lc-temp" type="range" min="2" max="34" step="1" value={temp} onChange={(e) => setTemp(Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.t} data-testid={`lc-preset-${p.t}`} onClick={() => setTemp(p.t)}
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all active:scale-95 ${temp === p.t ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"}`}>
              {p.Icon ? <p.Icon className="w-3 h-3" /> : null}{lang === "de" ? p.de : lang === "en" ? p.en : p.it} {p.t} °C
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            {tri("Comincio alle", "Ich beginne um", "I start at")}
            <input data-testid="lc-start" type="time" value={start} onChange={(e) => setStart(e.target.value || "08:00")} className="font-mono-data text-sm font-bold text-primary bg-background border border-border rounded-lg px-2 py-1 outline-none" />
          </label>
          <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            {tri("La ricetta è pensata per", "Rezept gedacht für", "Recipe written for")}
            <input data-testid="lc-ref" type="number" min="18" max="30" value={ref} onChange={(e) => setRef(Math.min(30, Math.max(18, num(e.target.value) || 25)))} className="w-14 text-right font-mono-data text-sm font-bold text-primary bg-background border border-border rounded-lg px-2 py-1 outline-none" /> °C
          </label>
        </div>
      </div>

      <div data-testid="lc-result" className="rounded-xl border border-salvia/50 bg-salvia/10 p-3.5 space-y-2">
        {(() => { let acc = 0; return rows.map((row, i) => { const from = acc; acc += row.now; return (
          <div key={i} className="flex items-start justify-between gap-3 text-[13px]">
            <div>
              <p className="font-semibold text-foreground">{row.k}</p>
              <p className="text-[11.5px] text-muted-foreground">{tri("Nella ricetta", "Im Rezept", "In the recipe")}: {hrs(row.base, lang)} · {tri("da te", "bei dir", "at your place")}: <b className="text-foreground">{hrs(row.now * 0.85, lang)} – {hrs(row.now * 1.15, lang)}</b></p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono-data text-[11px] text-muted-foreground">{at(from)} → </p>
              <p className="font-mono-data font-bold text-foreground">{at(acc)}</p>
            </div>
          </div>
        ); }); })()}
        <div className="flex items-center gap-2 pt-1 border-t border-salvia/30 text-[12px] text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-salvia shrink-0" />
          <span>{tri("Tutto insieme", "Alles zusammen", "All together")}: <b className="font-mono-data text-foreground">{hrs(bulk + proof, lang)}</b> ({tri("nella ricetta", "im Rezept", "in the recipe")} {hrs(F.bulk + F.proof, lang)}) · {tri("il lievito va", "die Hefe arbeitet", "the yeast works")} {factor >= 1 ? `${fmt1(factor)}×` : `${fmt1(factor)}×`} {tri("rispetto a", "verglichen mit", "compared to")} {ref} °C</span>
        </div>
        {cold && <p className="text-[12px] text-foreground/90">{tri("In frigo l'impasto quasi si ferma: la lievitazione finale può durare 8-18 ore, e va bene così (più gusto). Tiralo fuori 1-2 ore prima di infornare, oppure inforna direttamente dal freddo se la ricetta lo prevede.", "Im Kühlschrank steht der Teig fast still: die Stückgare kann 8-18 Stunden dauern, und das ist gut so (mehr Geschmack). Nimm ihn 1-2 Stunden vor dem Backen heraus oder backe direkt aus der Kälte, wenn das Rezept es vorsieht.", "In the fridge the dough almost stops: the final proof can take 8-18 hours, and that's fine (more flavour). Take it out 1-2 hours before baking, or bake straight from cold if the recipe says so.")}</p>}
        {temp >= 30 && <p className="text-[12px] text-foreground/90">{tri("Sopra i 30 °C il lievito corre e il gusto resta indietro: meglio 24-27 °C e un po' più di pazienza.", "Über 30 °C rennt die Hefe, der Geschmack bleibt zurück: besser 24-27 °C und etwas Geduld.", "Above 30 °C the yeast races and flavour lags behind: better 24-27 °C and a little patience.")}</p>}
        {F.hasPre && <p className="text-[11.5px] text-muted-foreground">{tri("Il prefermento (biga o poolish) ha i suoi tempi e la sua temperatura: quelli restano come dice la ricetta.", "Der Vorteig (Biga oder Poolish) hat seine eigenen Zeiten und Temperatur: die bleiben wie im Rezept.", "The preferment (biga or poolish) has its own times and temperature: those stay as the recipe says.")}</p>}
      </div>
      <p className="text-[12px] text-salvia leading-snug">
        {tri(`Sitor: l'orologio ti dice quando guardare, non quando infornare. L'impasto è pronto quando è cresciuto ${grow} e, premendo con un dito, l'impronta torna su piano piano.`,
          `Sitor: Die Uhr sagt dir, wann du nachsehen sollst, nicht wann du backen sollst. Der Teig ist fertig, wenn er ${grow} gewachsen ist und der Fingerabdruck langsam zurückkommt.`,
          `Sitor: the clock tells you when to look, not when to bake. The dough is ready when it has grown ${grow} and a finger dent comes back slowly.`)}
      </p>
    </div>
  );
}
