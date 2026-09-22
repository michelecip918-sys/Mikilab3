import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Volume2, RotateCcw } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { playTTS } from "@/lib/tts";
import { itemLabel, ingredientFamily, num } from "@/lib/sitorTools";

// V92 — PESA TUTTO IN UNA CIOTOLA. Niente tara: metti la ciotola sulla bilancia e aggiungi un ingrediente alla volta;
// Sitor ti dice il numero che deve comparire sul display. Se ti scappa la mano su acqua o farina, ricalcola il resto
// così le proporzioni della ricetta restano quelle giuste.

const ORDER = { water: 0, pre: 1, biga: 2, flour: 3, semolina: 4, sugar: 5, dairy: 5, eggs: 5, potato: 5, other: 5, drinks: 5, spices: 5, salt: 7, oil: 8, butter: 8, lard: 8, nuts: 9, driedfruit: 9, chocolate: 9, seeds: 9, veg: 9, meat: 9, yeast: 6, sourdough: 1 };
const BIG = new Set(["water", "pre", "biga", "flour"]);

function buildSteps(dough, t, lang, tri) {
  const steps = [];
  dough.items.forEach((it) => {
    if (!(it.grams > 0)) return;
    const fam = it.key === "extra" ? ingredientFamily(it.name) : it.key;
    if (it.key === "extra" && fam === "flour") { steps.push({ id: `x-${steps.length}`, kind: "flour", name: itemLabel(it, t, lang, tri), g: it.grams, order: 3.5 }); return; }
    steps.push({ id: `${it.key}-${steps.length}`, kind: it.key === "extra" ? fam : it.key, name: itemLabel(it, t, lang, tri), g: it.grams, order: ORDER[it.key === "extra" ? fam : it.key] ?? 5 });
  });
  if (dough.biga) {
    const b = dough.biga;
    steps.push({ id: "biga", kind: "biga", name: b.kind === "poolish" ? tri("tutto il poolish", "den ganzen Poolish", "all the poolish") : tri("tutta la biga", "die ganze Biga", "all the biga"), g: b.flour + b.water + b.yeast, order: 2 });
  }
  steps.sort((a, b) => a.order - b.order);
  return steps;
}

export default function PesaInUnaCiotola({ r, dough, lang, t }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [phase, setPhase] = useState(dough.biga ? 1 : 2);
  const [idx, setIdx] = useState(0);
  const [actual, setActual] = useState({});     // id → grammi messi davvero (solo ingredienti grandi)
  const [tare, setTare] = useState(false);
  const [voice, setVoice] = useState(false);
  const [editing, setEditing] = useState("");
  const steps = useMemo(() => {
    if (phase === 1 && dough.biga) {
      const b = dough.biga;
      return [
        { id: "b-flour", kind: "flour", name: t("ing_flour"), g: b.flour, order: 0 },
        { id: "b-water", kind: "water", name: t("ing_water"), g: b.water, order: 1 },
        b.yeast > 0 && { id: "b-yeast", kind: "yeast", name: tri("Lievito di birra", "Hefe", "Fresh yeast"), g: b.yeast, order: 2 },
      ].filter(Boolean);
    }
    return buildSteps(dough, t, lang, tri);
    // eslint-disable-next-line
  }, [dough, phase, lang]);
  useEffect(() => { setIdx(0); setActual({}); setEditing(""); }, [phase, dough.target]);

  // fattore di correzione: se un ingrediente grande è stato messo in più, tutto il resto sale della stessa percentuale
  const factor = steps.reduce((f, s) => (actual[s.id] != null && s.g > 0 ? Math.max(f, num(actual[s.id]) / s.g) : f), 1);
  const plan = (s) => Math.round(s.g * factor);
  const done = steps.slice(0, idx);
  const cumDone = done.reduce((a, s) => a + (actual[s.id] != null ? num(actual[s.id]) : plan(s)), 0);
  const topUps = done.filter((s) => BIG.has(s.kind) && actual[s.id] != null && plan(s) - num(actual[s.id]) >= 2).map((s) => ({ s, g: plan(s) - num(actual[s.id]) }));
  const topUpTotal = topUps.reduce((a, x) => a + x.g, 0);
  const cur = steps[idx];
  const finished = idx >= steps.length;
  const cumTarget = cumDone + topUpTotal + (cur ? plan(cur) : 0);   // numero da leggere sulla bilancia
  const total = steps.reduce((a, s) => a + plan(s), 0);
  const say = (text) => { if (voice) playTTS(text, { who: "momy", lang }).catch(() => {}); };
  const goNext = () => {
    const n = steps[idx + 1];
    // i rabbocchi suggeriti si considerano fatti: da qui in poi contano come messi
    if (topUps.length) setActual((a) => { const o = { ...a }; topUps.forEach((x) => { o[x.s.id] = plan(x.s); }); return o; });
    setIdx(idx + 1); setEditing("");
    const next = cumTarget + (n ? plan(n) : 0);
    if (n) say(tri(`Aggiungi ${n.name}, ${plan(n)} grammi. ${tare ? "" : `La bilancia deve segnare ${next} grammi.`}`, `Gib ${n.name} dazu, ${plan(n)} Gramm. ${tare ? "" : `Die Waage muss ${next} Gramm zeigen.`}`, `Add ${n.name}, ${plan(n)} grams. ${tare ? "" : `The scale should read ${next} grams.`}`));
    else say(tri("Tutto pesato. Adesso si impasta.", "Alles abgewogen. Jetzt wird geknetet.", "All weighed. Now we knead."));
  };

  if (steps.length === 0) return <p className="text-[12.5px] text-muted-foreground">{tri("Questa ricetta non ha dosi in grammi.", "Dieses Rezept hat keine Grammangaben.", "This recipe has no gram amounts.")}</p>;

  return (
    <div data-testid="pesa-ciotola" className="space-y-3">
      <p className="text-[12.5px] text-foreground/85 leading-snug">
        {tri("Ciotola sulla bilancia, una volta sola. Aggiungi quello che dico e guarda che il display arrivi al numero giusto: niente tara, niente errori.",
          "Schüssel auf die Waage, ein einziges Mal. Gib dazu, was ich sage, und schau, dass das Display die richtige Zahl zeigt: kein Tarieren, keine Fehler.",
          "Bowl on the scale, once. Add what I say and watch the display reach the right number: no taring, no mistakes.")}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {dough.biga && (
          <div className="flex gap-1">
            {[[1, dough.biga.kind === "poolish" ? tri("Fase 1 · Poolish", "Phase 1 · Poolish", "Phase 1 · Poolish") : tri("Fase 1 · Biga", "Phase 1 · Biga", "Phase 1 · Biga")], [2, tri("Fase 2 · Impasto", "Phase 2 · Teig", "Phase 2 · Dough")]].map(([p, l]) => (
              <button key={p} data-testid={`pc-phase-${p}`} onClick={() => setPhase(p)} className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full border active:scale-95 ${phase === p ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border"}`}>{l}</button>
            ))}
          </div>
        )}
        <label className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground ml-auto"><input data-testid="pc-tare" type="checkbox" checked={tare} onChange={(e) => setTare(e.target.checked)} /> {tri("Faccio la tara ogni volta", "Ich tariere jedes Mal", "I tare every time")}</label>
        <button data-testid="pc-voice" onClick={() => setVoice((v) => !v)} className={`inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1 rounded-full border active:scale-95 ${voice ? "bg-salvia text-white border-salvia" : "bg-card text-muted-foreground border-border"}`}><Volume2 className="w-3.5 h-3.5" /> {tri("Voce", "Stimme", "Voice")}</button>
      </div>

      {!finished ? (
        <div data-testid="pc-step" className="rounded-2xl border border-salvia/50 bg-salvia/10 p-4">
          <p className="text-[11px] text-muted-foreground">{tri("Passo", "Schritt", "Step")} {idx + 1} / {steps.length}</p>
          <p className="text-[12.5px] text-muted-foreground mt-1">{tri("Aggiungi", "Gib dazu", "Add")}</p>
          <p className="font-display text-2xl font-bold text-foreground leading-tight">{cur.name}</p>
          <p className="font-display text-4xl font-bold text-primary leading-none mt-1">{plan(cur)} g</p>
          {!tare && <p className="text-[13px] text-foreground mt-3">{tri("La bilancia deve segnare", "Die Waage muss zeigen", "The scale should read")} <span className="font-mono-data text-2xl font-bold">{cumTarget} g</span></p>}
          {topUps.length > 0 && (
            <p data-testid="pc-topup" className="text-[12px] text-foreground mt-2 rounded-lg bg-background border border-border p-2">
              {tri("Prima, per tenere le proporzioni, aggiungi ancora", "Zuerst, damit die Verhältnisse stimmen, noch dazu", "First, to keep the proportions, also add")}: {topUps.map((x) => `${x.g} g ${x.s.name}`).join(", ")}.
              {!tare ? ` ${tri("Il numero qui sopra ne tiene già conto.", "Die Zahl oben berücksichtigt das schon.", "The number above already includes it.")}` : ""}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <button data-testid="pc-done" onClick={goNext} className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold text-[13px] px-4 py-2 rounded-xl active:scale-95"><Check className="w-4 h-4" /> {tri("Fatto", "Erledigt", "Done")}</button>
            {BIG.has(cur.kind) && (
              editing === cur.id ? (
                <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                  {tri("ne ho messi", "ich habe", "I put")}
                  <input data-testid="pc-actual" type="number" min="0" autoFocus value={actual[cur.id] ?? plan(cur)} onChange={(e) => setActual((a) => ({ ...a, [cur.id]: e.target.value }))} className="w-20 text-right font-mono-data text-sm font-bold text-primary bg-card border border-border rounded-lg px-2 py-1 outline-none" /> g
                  <button onClick={() => setEditing("")} className="font-bold text-primary px-1">OK</button>
                </span>
              ) : (
                <button data-testid="pc-more" onClick={() => setEditing(cur.id)} className="text-[12px] font-semibold text-muted-foreground underline decoration-dotted px-1 active:scale-95">{tri("Ne ho messo di più…", "Ich habe mehr genommen…", "I put more…")}</button>
              )
            )}
            {idx > 0 && <button data-testid="pc-back" onClick={() => setIdx(idx - 1)} className="text-[12px] font-semibold text-muted-foreground px-1 active:scale-95">{tri("Indietro", "Zurück", "Back")}</button>}
          </div>
          {!BIG.has(cur.kind) && <p className="text-[11px] text-muted-foreground mt-2">{tri("Se ne va un pizzico in più non succede niente; se è tanto, toglilo con un cucchiaio.", "Eine Prise mehr macht nichts; ist es viel, nimm es mit einem Löffel wieder heraus.", "A pinch more does no harm; if it's a lot, spoon it out.")}</p>}
        </div>
      ) : (
        <div data-testid="pc-finished" className="rounded-2xl border border-salvia/50 bg-salvia/10 p-4">
          <p className="font-display text-2xl font-bold text-foreground">{tri("Tutto pesato. Adesso si impasta.", "Alles abgewogen. Jetzt wird geknetet.", "All weighed. Now we knead.")}</p>
          {!tare && <p className="text-[13px] text-foreground mt-2">{tri("Sulla bilancia dovresti leggere in tutto", "Auf der Waage solltest du insgesamt lesen", "The scale should read in total")} <span className="font-mono-data text-xl font-bold">{cumDone} g</span> {tri("più la ciotola", "plus die Schüssel", "plus the bowl")}.</p>}
          {factor > 1.005 && <p className="text-[12px] text-muted-foreground mt-1">{tri(`Hai fatto un impasto del ${Math.round((factor - 1) * 100)} % più grande, con le stesse proporzioni della ricetta.`, `Du hast einen um ${Math.round((factor - 1) * 100)} % größeren Teig gemacht, mit denselben Verhältnissen wie im Rezept.`, `You made a dough ${Math.round((factor - 1) * 100)} % bigger, with the same proportions as the recipe.`)}</p>}
          <button data-testid="pc-restart" onClick={() => { setIdx(0); setActual({}); }} className="inline-flex items-center gap-1 mt-3 text-[12px] font-semibold text-muted-foreground active:scale-95"><RotateCcw className="w-3.5 h-3.5" /> {tri("Ricomincia", "Nochmal", "Start again")}</button>
        </div>
      )}

      <ol className="space-y-0.5">
        {steps.map((s, i) => (
          <li key={s.id} className={`flex items-center justify-between text-[12px] px-1 ${i === idx ? "text-foreground font-semibold" : i < idx ? "text-muted-foreground line-through" : "text-muted-foreground"}`}>
            <span className="flex items-center gap-1">{i < idx ? <Check className="w-3 h-3 text-salvia" /> : <ChevronRight className={`w-3 h-3 ${i === idx ? "text-primary" : "opacity-30"}`} />}{s.name}</span>
            <span className="font-mono-data">{actual[s.id] != null && i < idx ? `${num(actual[s.id])} g` : `${plan(s)} g`}</span>
          </li>
        ))}
        <li className="flex items-center justify-between text-[12px] px-1 pt-1 border-t border-border/60 text-muted-foreground"><span>{tri("Totale", "Gesamt", "Total")}</span><span className="font-mono-data font-bold text-foreground">{total} g</span></li>
      </ol>
      <p className="text-[12px] text-salvia leading-snug">
        {tri("Sitor: pesa l'acqua per prima e il sale per ultimo, lontano dal lievito. E se sbagli la farina, non buttare niente: dimmelo e ricalcolo il resto.",
          "Sitor: Wasser zuerst, Salz zuletzt, weg von der Hefe. Und wenn beim Mehl etwas daneben geht, wirf nichts weg: sag es mir, ich rechne den Rest neu.",
          "Sitor: weigh the water first and the salt last, away from the yeast. And if you overshoot the flour, throw nothing away: tell me and I'll recalculate the rest.")}
      </p>
    </div>
  );
}
