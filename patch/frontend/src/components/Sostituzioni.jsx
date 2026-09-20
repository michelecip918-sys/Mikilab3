import { useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { Replace, ChevronDown, ChevronUp } from "lucide-react";
import { substitutes, fmtL } from "@/lib/improver";

// «Non ho questo ingrediente?»: alternative già calcolate sui grammi della ricetta scelta.
// Copre: lievito madre, lievito di birra secco, miglioratore, farina forte. Se nulla è pertinente non mostra niente.
const YEAST_RE = /lievito di birra|hefe|yeast/i;
const LM_RE = /lievito madre|sauerteig|sourdough|licoli/i;
const IMPR_RE = /migliorator|backmittel|improver|verbesserer/i;
const YEAST_CATS = ["pane", "panini", "pizza", "focacce", "snack"];

export default function Sostituzioni({ r, target, f, farro }) {
  const { lang } = useLang();
  const L = (o) => (o && (o[lang] || o.it)) || "";
  const [open, setOpen] = useState(false);
  const flourG = Number(r.flour_grams) || 0;
  if (!(flourG > 0) || r.locked) return null;
  const F = Math.round(target || flourG);
  const extras = (r.extra_ingredients || []).filter((e) => e && e.name && e.percent != null && e.percent !== "");
  const lmG = Math.round((Number(r.sourdough_grams) || 0) * f);
  const hasLM = lmG > 0 && /\blm\b|lievito madre|licoli/i.test(`${r.preferment_type || ""} ${r.name || ""}`) || (lmG > 0 && extras.some((e) => LM_RE.test(e.name)));
  const biga = r.biga && !r.locked ? r.biga : null;
  let yeastG = biga ? (Number(biga.yeast_g) || 0) * f : 0;
  extras.forEach((e) => { if (YEAST_RE.test(e.name) && !/secco|dry|trocken/i.test(e.name)) yeastG += F * (Number(e.percent) / 100); });
  yeastG = Math.round(yeastG * 10) / 10;
  const improver = extras.find((e) => IMPR_RE.test(e.name));
  const strong = /W\s?3\d\d|forte|manitoba|W\s?2[5-9]\d|strong|stark/i.test(`${r.flour_type || ""}`);
  const isLaminated = /sfogliato/i.test(r.method_type || "") || /pasticceria/.test(r.menu_category || "");
  const cards = [];

  if (hasLM) {
    const lf = Math.round((lmG * 2) / 3);
    const lw = Math.round(lmG / 3);
    const py = Math.max(0.1, Math.round(lf * 0.003 * 10) / 10);
    const fy = Math.max(1, Math.round(((F + lf) * 0.008)));
    cards.push({ id: "no-lm",
      title: { it: "Non ho il lievito madre", de: "Ich habe keinen Sauerteig", en: "I don't have sourdough" },
      body: [
        { it: `Opzione 1, poolish (la più vicina): la sera prima mescola ${lf} g di farina, ${lf} g di acqua e ${fmtL(py, lang)} g di lievito di birra fresco. Copri e lascia 12-16 ore a 18-20 °C. Al mattino usalo al posto del lievito madre, togli ${lw} g di acqua dall'impasto e aggiungi ${Math.max(1, Math.round(F * 0.005))} g di lievito fresco.`,
          de: `Option 1, Poolish (am ähnlichsten): am Vorabend ${lf} g Mehl, ${lf} g Wasser und ${fmtL(py, lang)} g frische Hefe verrühren. Abdecken und 12-16 Stunden bei 18-20 °C stehen lassen. Am Morgen anstelle des Sauerteigs verwenden, ${lw} g Wasser aus dem Teig weglassen und ${Math.max(1, Math.round(F * 0.005))} g frische Hefe zugeben.`,
          en: `Option 1, poolish (closest): the evening before mix ${lf} g flour, ${lf} g water and ${fmtL(py, lang)} g fresh yeast. Cover and leave 12-16 hours at 18-20 °C. In the morning use it instead of the sourdough, remove ${lw} g water from the dough and add ${Math.max(1, Math.round(F * 0.005))} g fresh yeast.` },
        { it: `Opzione 2, solo lievito di birra: togli il lievito madre, aggiungi ${lf} g di farina e ${lw} g di acqua all'impasto e usa ${fy} g di lievito fresco (0,8% della farina). Lievitazione di 4-6 ore. Il sapore è meno complesso e il pane si conserva meno.`,
          de: `Option 2, nur Hefe: den Sauerteig weglassen, ${lf} g Mehl und ${lw} g Wasser zum Teig geben und ${fy} g frische Hefe verwenden (0,8 % des Mehls). Gare 4-6 Stunden. Der Geschmack ist weniger komplex und das Brot hält weniger lang.`,
          en: `Option 2, yeast only: leave out the sourdough, add ${lf} g flour and ${lw} g water to the dough and use ${fy} g fresh yeast (0.8% of the flour). Rise 4-6 hours. The flavour is less complex and the bread keeps less.` },
        { it: "Opzione 3: chiedi un pezzetto di lievito madre a un panificio, oppure crealo da zero nella pagina «Crea il tuo lievito».",
          de: "Option 3: Bitte eine Bäckerei um ein Stück Sauerteig oder setze ihn selbst an (Seite «Crea il tuo lievito»).",
          en: "Option 3: ask a bakery for a small piece of sourdough, or make your own from scratch on the «Crea il tuo lievito» page." },
      ] });
  }

  if (!hasLM && !isLaminated && YEAST_CATS.includes(r.menu_category || "") && yeastG > 0) {
    const lm = Math.round(F * 0.2);
    const lf = Math.round((lm * 2) / 3);
    const lw = Math.round(lm / 3);
    cards.push({ id: "want-lm",
      title: { it: "Preferisco il lievito madre al lievito di birra", de: "Ich möchte lieber Sauerteig statt Hefe", en: "I'd rather use sourdough than yeast" },
      body: [
        { it: `Togli tutto il lievito di birra e usa ${lm} g di lievito madre rinfrescato (20% della farina). Togli ${lf} g di farina e ${lw} g di acqua dall'impasto, perché sono già nel lievito. Tempi di partenza: 8-12 ore in tutto a 24-26 °C, guarda l'impasto più dell'orologio. Da provare: la prima volta segna i tempi.`,
          de: `Lass die gesamte Hefe weg und nimm ${lm} g aufgefrischten Sauerteig (20 % des Mehls). Ziehe ${lf} g Mehl und ${lw} g Wasser vom Teig ab, denn sie stecken schon im Sauerteig. Startzeiten: insgesamt 8-12 Stunden bei 24-26 °C, beobachte den Teig mehr als die Uhr. Zum Ausprobieren: notiere beim ersten Mal die Zeiten.`,
          en: `Leave out all the yeast and use ${lm} g refreshed sourdough (20% of the flour). Remove ${lf} g flour and ${lw} g water from the dough, since they are already in the starter. Starting times: 8-12 hours in total at 24-26 °C, watch the dough more than the clock. To try: note your times the first time.` },
      ] });
  }

  if (yeastG > 0) {
    const dry = Math.max(0.5, Math.round((yeastG / 3) * 10) / 10);
    cards.push({ id: "dry-yeast",
      title: { it: "Ho solo lievito secco", de: "Ich habe nur Trockenhefe", en: "I only have dry yeast" },
      body: [
        { it: `La ricetta usa ${fmtL(yeastG, lang)} g di lievito fresco: metti ${fmtL(dry, lang)} g di lievito secco istantaneo (1 parte ogni 3 di fresco). Una bustina da 7 g equivale a un cubetto da 21 g di fresco. Scioglilo nell'acqua tiepida (non oltre 30 °C).`,
          de: `Das Rezept braucht ${fmtL(yeastG, lang)} g frische Hefe: nimm ${fmtL(dry, lang)} g Trockenhefe (1 Teil auf 3 Teile frische). Ein Päckchen (7 g) entspricht einem halben Würfel frischer Hefe (21 g). In lauwarmem Wasser auflösen (höchstens 30 °C).`,
          en: `The recipe uses ${fmtL(yeastG, lang)} g fresh yeast: use ${fmtL(dry, lang)} g instant dry yeast (1 part for every 3 of fresh). A 7 g sachet equals about 21 g of fresh yeast. Dissolve it in lukewarm water (no more than 30 °C).` },
      ] });
  }

  if (improver) {
    const g = Math.round(F * (Number(improver.percent) / 100) * 10) / 10;
    const subs = substitutes(F);
    cards.push({ id: "improver",
      title: { it: "Non ho il miglioratore", de: "Ich habe den Verbesserer nicht", en: "I don't have the improver" },
      body: [
        { it: `Nella ricetta sono ${fmtL(g, lang)} g. È facoltativo. Al suo posto puoi usare:`, de: `Im Rezept sind es ${fmtL(g, lang)} g. Er ist optional. Stattdessen kannst du nehmen:`, en: `The recipe has ${fmtL(g, lang)} g. It is optional. Instead you can use:` },
        ...subs.map((s) => ({ it: `${s.title.it}: ${typeof s.amount === "string" ? s.amount : s.amount.it}. ${s.how.it}`, de: `${s.title.de}: ${typeof s.amount === "string" ? s.amount : s.amount.de}. ${s.how.de}`, en: `${s.title.en}: ${typeof s.amount === "string" ? s.amount : s.amount.en}. ${s.how.en}` })),
      ] });
  }

  if (strong) {
    cards.push({ id: "flour",
      title: { it: "Non trovo la farina forte", de: "Ich finde kein starkes Mehl", en: "I can't find strong flour" },
      body: [
        { it: "In Germania usa Weizenmehl Type 550 (o «Pizzamehl», «Manitoba» se lo trovi). Con farine meno forti l'impasto assorbe meno acqua: parti con il 5% di acqua in meno e aggiungila a cucchiai. Fai una piega in più e non allungare troppo la lievitazione.",
          de: "Nimm Weizenmehl Type 550 (oder «Pizzamehl», «Manitoba», falls vorhanden). Mit schwächeren Mehlen nimmt der Teig weniger Wasser auf: starte mit 5 % weniger Wasser und gib es löffelweise zu. Eine Runde Falten mehr und die Gare nicht zu lang machen.",
          en: "Use type 550 wheat flour (or «pizza flour», «Manitoba» if you can find it). Weaker flours absorb less water: start with 5% less water and add it by the spoonful. Do one more fold and don't over-extend the proof." },
      ] });
  }

  if (cards.length === 0) return null;
  return (
    <div data-testid={`recipe-subs-${r.id}`} className="rounded-2xl border border-border bg-background p-3.5 no-print">
      <button data-testid={`recipe-subs-toggle-${r.id}`} onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 text-left">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-primary">
          <Replace className="w-3.5 h-3.5" />{L({ it: "Non ho questo ingrediente?", de: "Ich habe diese Zutat nicht?", en: "Missing an ingredient?" })}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {farro && <p className="text-[12px] text-muted-foreground">{L({ it: "Le quantità qui sotto sono per la ricetta normale; con il farro cambia solo l'acqua (−8%).", de: "Die Mengen unten gelten für das normale Rezept; beim Dinkel ändert sich nur das Wasser (−8 %).", en: "Amounts below are for the normal recipe; with spelt only the water changes (−8%)." })}</p>}
          {cards.map((c) => (
            <div key={c.id} data-testid={`recipe-sub-${c.id}`} className="rounded-xl bg-card border border-border p-3">
              <p className="text-sm font-bold text-foreground mb-1">{L(c.title)}</p>
              <ul className="space-y-1.5">
                {c.body.map((b, i) => <li key={i} className="text-[13px] text-foreground/85 leading-relaxed">{L(b)}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
