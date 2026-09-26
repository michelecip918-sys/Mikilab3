// V127 — Conversioni veloci: lieviti, dosi piccolissime, °C e °F, idratazione e TA.
import { useState } from "react";
import { Scale } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { num, fmtN, fmtG } from "@/lib/fornaio";
import { Sezione, Numero, Scelta } from "@/components/calcolatrice/ui";

const K = { fresco: 1, secco: 0.5, istantaneo: 1 / 3 };

export default function ConversioniVeloci({ lang, onNav }) {
  const tri = mkTri(lang);
  const [g, setG] = useState(10);
  const [tipo, setTipo] = useState("fresco");
  const [poco, setPoco] = useState(0.4);
  const [c, setC] = useState(220);
  const [idr, setIdr] = useState(70);
  const fresco = num(g) / (K[tipo] || 1);
  const nomi = {
    fresco: tri("Lievito di birra fresco", "Frischhefe", "Fresh yeast"),
    secco: tri("Secco attivo (da sciogliere)", "Trockenhefe (aktiv, auflösen)", "Active dry (dissolve first)"),
    istantaneo: tri("Secco istantaneo (va nella farina)", "Instanthefe (ins Mehl)", "Instant dry (into the flour)"),
  };
  const fF = Math.round((num(c) * 9) / 5 + 32);
  const sol = num(poco) * 100;

  return (
    <div className="space-y-3" data-testid="calc-conversioni">
      <Sezione testid="conv-lievito" titolo={tri("Da un lievito all'altro", "Von einer Hefe zur anderen", "From one yeast to another")}>
        <div className="flex flex-wrap items-end gap-3">
          <Numero testid="conv-g" label={tri("Ho", "Ich habe", "I have")} value={g} onChange={setG} suffix="g" step={0.5} min={0} />
          <Scelta small testid="conv-tipo" value={tipo} onChange={setTipo} options={[
            { v: "fresco", l: tri("fresco", "frisch", "fresh") }, { v: "secco", l: tri("secco attivo", "trocken", "active dry") }, { v: "istantaneo", l: tri("istantaneo", "instant", "instant") },
          ]} />
        </div>
        <div className="rounded-xl bg-background/60 px-3 py-1" data-testid="conv-tabella">
          {Object.keys(K).map((k) => (
            <div key={k} className={`flex items-baseline justify-between gap-2 py-1.5 border-b border-border/60 last:border-b-0 ${k === tipo ? "font-bold" : ""}`}>
              <span className="text-[13.5px] text-foreground">{nomi[k]}</span>
              <span className="text-[15px] font-mono-data font-bold">{fmtG(fresco * K[k], lang)}</span>
            </div>
          ))}
        </div>
        <p className="text-[11.5px] text-muted-foreground leading-snug">{tri("Un cubetto italiano pesa 25 g, un Würfel tedesco 42 g; una bustina di secco (7 g) vale circa 21 g di fresco. Il lievito madre non si converte grammo per grammo: usa la calcolatrice con «Lievito madre» e i tuoi tempi.", "Ein italienischer Würfel wiegt 25 g, ein deutscher 42 g; ein Päckchen Trockenhefe (7 g) entspricht etwa 21 g Frischhefe. Sauerteig lässt sich nicht Gramm für Gramm umrechnen: nimm den Rechner mit „Sauerteig“ und deinen Zeiten.", "An Italian cube weighs 25 g, a German one 42 g; a sachet of dry yeast (7 g) equals about 21 g of fresh. Sourdough can't be converted gram for gram: use the calculator with \"Stiff starter\" and your times.")}</p>
      </Sezione>

      <Sezione testid="conv-lievitino" titolo={tri("Dosi piccolissime: il lievitino", "Winzige Mengen: die Hefelösung", "Tiny amounts: the yeast solution")} sotto={tri("Quando ti serve meno di un grammo e la bilancia non ce la fa.", "Wenn du weniger als ein Gramm brauchst und die Waage das nicht schafft.", "When you need less than a gram and the scale can't manage it.")}>
        <Numero testid="conv-poco" label={tri("Mi servono", "Ich brauche", "I need")} value={poco} onChange={setPoco} suffix={tri("g di lievito", "g Hefe", "g of yeast")} step={0.05} min={0} />
        <p className="text-[13.5px] text-foreground" data-testid="conv-poco-esito">{num(poco) >= 1
          ? tri("Più di un grammo: pesalo diretto.", "Mehr als ein Gramm: direkt abwiegen.", "More than a gram: weigh it directly.")
          : tri(`Sciogli 1 g di lievito in 100 g d'acqua e usane ${fmtN(sol, 0, lang)} g. Toglili dall'acqua della ricetta.`, `1 g Hefe in 100 g Wasser auflösen und davon ${fmtN(sol, 0, lang)} g nehmen. Vom Rezeptwasser abziehen.`, `Dissolve 1 g of yeast in 100 g of water and use ${fmtN(sol, 0, lang)} g of it. Take them off the recipe water.`)}</p>
      </Sezione>

      <Sezione testid="conv-temp" titolo={tri("Gradi del forno", "Ofentemperatur", "Oven degrees")}>
        <div className="flex flex-wrap gap-3">
          <Numero testid="conv-c" label="°C" value={c} onChange={setC} step={5} w="w-20" />
          <Numero testid="conv-f" label="°F" value={fF} onChange={(v) => setC(Math.round(((num(v) - 32) * 5) / 9))} step={5} w="w-20" />
        </div>
        <p className="text-[11.5px] text-muted-foreground leading-snug">{tri("Col forno ventilato di solito 20 °C in meno dello statico.", "Mit Umluft meist 20 °C weniger als mit Ober-/Unterhitze.", "With a fan oven usually 20 °C less than conventional.")}</p>
      </Sezione>

      <Sezione testid="conv-ta" titolo={tri("Idratazione e TA", "Hydration und TA", "Hydration and TA")} sotto={tri("Le ricette tedesche scrivono la resa (TA): 100 di farina + l'acqua.", "Deutsche Rezepte nennen die Teigausbeute (TA): 100 Mehl + Wasser.", "German recipes give the dough yield (TA): 100 flour + the water.")}>
        <div className="flex flex-wrap gap-3">
          <Numero testid="conv-idr" label={tri("Idratazione", "Hydration", "Hydration")} value={idr} onChange={setIdr} suffix="%" w="w-20" />
          <Numero testid="conv-ta-n" label="TA" value={num(idr) + 100} onChange={(v) => setIdr(num(v) - 100)} w="w-20" />
        </div>
      </Sezione>

      {onNav ? (
        <button type="button" data-testid="conv-bilancia" onClick={() => onNav("bilancia")} className="w-full inline-flex items-center justify-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-xl border border-border bg-card hover:border-primary/60">
          <Scale className="w-4 h-4 text-primary" /> {tri("Senza bilancia: tazze e cucchiai", "Ohne Waage: Tassen und Löffel", "No scale: cups and spoons")}
        </button>
      ) : null}
    </div>
  );
}
