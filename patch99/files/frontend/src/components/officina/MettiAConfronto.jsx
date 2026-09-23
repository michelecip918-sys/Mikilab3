import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { CATS, recipeCategory } from "@/lib/recipeCats";
import { computeLabel } from "@/components/EtichettaMikiLab";
import { computeDough, num, fmt1, fmtG } from "@/lib/sitorTools";

// V92 — METTI A CONFRONTO. Due ricette fianco a fianco, riga per riga, e Sitor spiega dove sta la differenza vera.
// Legge i dati delle ricette (come l'Etichetta MikiLab); non li modifica.

const usable = (r) => r && !r.locked && num(r.flour_grams) > 0 && !/migliorator|backmittel|improver/i.test(r.name || "");

function facts(r) {
  const L = computeLabel(r);
  const D = computeDough(r, r.flour_grams);
  const hyd = num(r.hydration_percent) || D.hydration;
  const bakeT = num(r.bake_temp), bakeM = num(r.bake_minutes);
  return { L, D, hyd, bakeT, bakeM };
}

function RecipeSelect({ list, value, onChange, testid, lang, t }) {
  return (
    <select data-testid={testid} value={value} onChange={(e) => onChange(e.target.value)} className="w-full text-[12.5px] font-semibold bg-background text-foreground border border-border rounded-lg px-2 py-1.5 outline-none">
      {CATS.map((c) => {
        const items = list.filter((r) => recipeCategory(r).key === c.key);
        if (!items.length) return null;
        return <optgroup key={c.key} label={`${c.icon} ${t(c.label)}`}>{items.map((r) => <option key={r.id} value={r.id}>{rLoc(r, "name", lang)}</option>)}</optgroup>;
      })}
    </select>
  );
}

export default function MettiAConfronto({ recipes, lang, t }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const list = useMemo(() => (recipes || []).filter(usable), [recipes]);
  const [a, setA] = useState(() => (list[0] ? list[0].id : ""));
  const [b, setB] = useState(() => (list[1] ? list[1].id : list[0] ? list[0].id : ""));
  const ra = list.find((r) => r.id === a) || list[0];
  const rb = list.find((r) => r.id === b) || list[1] || list[0];
  if (!ra || !rb) return <p className="text-[13px] text-muted-foreground">{tri("Servono almeno due ricette con le dosi per fare un confronto.", "Für einen Vergleich braucht es mindestens zwei Rezepte mit Mengen.", "You need at least two recipes with quantities to compare.")}</p>;

  const A = facts(ra), B = facts(rb);
  const rise = (F) => (F.L.lm ? tri("lievito madre", "Sauerteig", "sourdough") : F.L.hasPre ? `${F.L.pt || tri("prefermento", "Vorteig", "preferment")} ${fmt1(F.L.preHours[0])}${F.L.preHours[1] !== F.L.preHours[0] ? `-${fmt1(F.L.preHours[1])}` : ""} h` : tri("diretto", "direkt", "direct"));
  const hours = (F) => (F.L.totMax > 0 ? (F.L.totMin === F.L.totMax ? `≈ ${fmt1(F.L.totMax)} h` : `≈ ${fmt1(F.L.totMin)}-${fmt1(F.L.totMax)} h`) : "—");
  const oven = (F) => (F.bakeT > 0 ? `${Math.round(F.bakeT)} °C${F.bakeM > 0 ? ` · ${Math.round(F.bakeM)} min` : ""}` : "—");
  const diffNum = (x, y, th) => Math.abs(x - y) >= th;

  const rows = [
    { k: tri("Idratazione", "Hydration (TA)", "Hydration"), a: `${fmt1(A.hyd)} %`, b: `${fmt1(B.hyd)} %`, d: diffNum(A.hyd, B.hyd, 5) },
    { k: tri("Come lievita", "Wie er geht", "How it rises"), a: rise(A), b: rise(B), d: rise(A) !== rise(B) },
    { k: tri("Lievito di birra", "Backhefe", "Baker's yeast"), a: A.L.yeast > 0 ? `${fmt1(A.L.yeast)} %` : tri("nessuno", "keine", "none"), b: B.L.yeast > 0 ? `${fmt1(B.L.yeast)} %` : tri("nessuno", "keine", "none"), d: diffNum(A.L.yeast, B.L.yeast, 0.3) },
    { k: tri("Sale ogni 100 g farina", "Salz je 100 g Mehl", "Salt per 100 g flour"), a: `${fmt1(A.L.salt)} g`, b: `${fmt1(B.L.salt)} g`, d: diffNum(A.L.salt, B.L.salt, 0.4) },
    { k: tri("Grassi aggiunti", "Zugesetztes Fett", "Added fat"), a: `${fmt1(A.L.fat)} %`, b: `${fmt1(B.L.fat)} %`, d: diffNum(A.L.fat, B.L.fat, 5) },
    { k: tri("Zuccheri aggiunti", "Zugesetzter Zucker", "Added sugars"), a: `${fmt1(A.L.sugar)} %`, b: `${fmt1(B.L.sugar)} %`, d: diffNum(A.L.sugar, B.L.sugar, 5) },
    { k: tri("Uova", "Eier", "Eggs"), a: A.L.eggs > 0 ? `${fmt1(A.L.eggs)} %` : "—", b: B.L.eggs > 0 ? `${fmt1(B.L.eggs)} %` : "—", d: diffNum(A.L.eggs, B.L.eggs, 5) },
    { k: tri("Lievitazione totale", "Gesamte Gare", "Total fermentation"), a: hours(A), b: hours(B), d: diffNum(A.L.totMax, B.L.totMax, 4) },
    { k: tri("Forno", "Ofen", "Oven"), a: oven(A), b: oven(B), d: diffNum(A.bakeT, B.bakeT, 20) || diffNum(A.bakeM, B.bakeM, 10) },
    { k: tri("Farina", "Mehl", "Flour"), a: rLoc(ra, "flour_type", lang) || "—", b: rLoc(rb, "flour_type", lang) || "—", d: (ra.flour_type || "") !== (rb.flour_type || "") },
    { k: tri("Peso impasto (ricetta)", "Teiggewicht (Rezept)", "Dough weight (recipe)"), a: fmtG(A.D.total), b: fmtG(B.D.total), d: false },
  ];

  // Cosa dice Sitor: regole semplici, una frase per differenza che conta.
  const say = [];
  const nA = rLoc(ra, "name", lang), nB = rLoc(rb, "name", lang);
  const wetter = A.hyd > B.hyd ? nA : nB;
  if (diffNum(A.hyd, B.hyd, 5)) say.push(tri(`${wetter} ha più acqua: mollica più aperta e umida, ma l'impasto è più difficile da tenere in mano. Se sei alle prime armi parti dall'altra.`, `${wetter} hat mehr Wasser: offenere, saftigere Krume, aber der Teig ist schwerer zu handhaben. Für den Anfang lieber das andere.`, `${wetter} has more water: a more open, moist crumb, but the dough is harder to handle. If you're a beginner, start with the other one.`));
  if (A.L.lm !== B.L.lm) { const s = A.L.lm ? nA : nB; say.push(tri(`${s} va con lievito madre: più gusto, più giorni di freschezza, ma ti serve un lievito attivo e più pazienza.`, `${s} geht mit Sauerteig: mehr Geschmack, länger frisch, braucht aber einen aktiven Sauerteig und mehr Geduld.`, `${s} uses sourdough: more flavour, keeps longer, but you need an active starter and more patience.`)); }
  else if (A.L.hasPre !== B.L.hasPre) { const s = A.L.hasPre ? nA : nB; say.push(tri(`${s} usa un prefermento: ti chiede di iniziare il giorno prima, in cambio dà profumo e leggerezza.`, `${s} arbeitet mit Vorteig: du beginnst am Vortag, bekommst dafür Aroma und Lockerheit.`, `${s} uses a preferment: you start the day before, and get aroma and lightness in return.`)); }
  if (diffNum(A.L.totMax, B.L.totMax, 4)) { const s = A.L.totMax > B.L.totMax ? nA : nB; say.push(tri(`${s} lievita molto più a lungo: è quella da programmare, non da improvvisare. Usa "Il pane in agenda".`, `${s} geht deutlich länger: das plant man, das improvisiert man nicht. Nimm "Brot im Kalender".`, `${s} ferments much longer: plan it, don't improvise it. Use "Bread in the diary".`)); }
  if (diffNum(A.L.fat, B.L.fat, 5) || diffNum(A.L.sugar, B.L.sugar, 5)) { const s = (A.L.fat + A.L.sugar) > (B.L.fat + B.L.sugar) ? nA : nB; say.push(tri(`${s} è più ricca di grassi o zuccheri: mollica più morbida e crosta più scura, ma la lievitazione è più lenta e vuole un impasto a 26-27 °C.`, `${s} ist reicher an Fett oder Zucker: weichere Krume, dunklere Kruste, aber die Gare ist langsamer und will einen Teig bei 26-27 °C.`, `${s} is richer in fat or sugar: softer crumb and darker crust, but it rises more slowly and wants a dough at 26-27 °C.`)); }
  if (diffNum(A.L.salt, B.L.salt, 0.4)) { const s = A.L.salt > B.L.salt ? nA : nB; say.push(tri(`${s} è più salata: il sale rallenta un po' il lievito e rafforza il glutine; sotto 1,8 g per 100 g la mollica è più sciapa e la crosta più pallida.`, `${s} ist salziger: Salz bremst die Hefe leicht und stärkt das Gluten; unter 1,8 g je 100 g wird die Krume fad und die Kruste blasser.`, `${s} is saltier: salt slows the yeast a little and strengthens the gluten; below 1.8 g per 100 g the crumb is blander and the crust paler.`)); }
  if (diffNum(A.L.yeast, B.L.yeast, 0.3) && A.L.lm === B.L.lm) { const s = A.L.yeast < B.L.yeast ? nA : nB; say.push(tri(`${s} usa meno lievito: più tempo, meno sapore di lievito, mollica che invecchia meglio.`, `${s} nimmt weniger Hefe: mehr Zeit, weniger Hefegeschmack, eine Krume, die besser altert.`, `${s} uses less yeast: more time, less yeasty taste, a crumb that ages better.`)); }
  if (say.length === 0) say.push(tri("Sono due sorelle: stessa famiglia di impasto. Scegli in base alla forma e al tempo che hai, il risultato in bocca sarà vicino.", "Zwei Schwestern: dieselbe Teigfamilie. Wähle nach Form und Zeit, das Ergebnis im Mund liegt nah beieinander.", "They're two sisters: the same dough family. Choose by shape and the time you have; the result in the mouth will be close."));

  return (
    <div data-testid="metti-a-confronto" className="space-y-3">
      <p className="text-[13px] text-foreground/85 leading-snug">{tri("Scegli due ricette: le metto una accanto all'altra e ti dico dove sta la differenza che conta.", "Wähle zwei Rezepte: ich stelle sie nebeneinander und sage dir, wo der Unterschied liegt, der zählt.", "Pick two recipes: I'll put them side by side and tell you where the difference that matters is.")}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <RecipeSelect list={list} value={ra.id} onChange={setA} testid="mac-a" lang={lang} t={t} />
        <button data-testid="mac-swap" onClick={() => { setA(rb.id); setB(ra.id); }} className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground active:scale-95" title={tri("Scambia", "Tauschen", "Swap")}><ArrowLeftRight className="w-4 h-4" /></button>
        <RecipeSelect list={list} value={rb.id} onChange={setB} testid="mac-b" lang={lang} t={t} />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-2 gap-x-3 text-[12px] font-bold text-primary bg-muted/40 px-2.5 py-1.5">
          <span className="leading-tight">{nA}</span>
          <span className="leading-tight">{nB}</span>
        </div>
        {rows.map((x, i) => (
          <div key={i} data-testid={`mac-row-${i}`} className={`px-2.5 py-1.5 text-[12.5px] border-t border-border ${x.d ? "bg-primary/8" : ""}`}>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{x.k}</p>
            <div className="grid grid-cols-2 gap-x-3">
              <span className={`font-mono-data break-words ${x.d ? "font-bold text-foreground" : "text-foreground/80"}`}>{x.a}</span>
              <span className={`font-mono-data break-words ${x.d ? "font-bold text-foreground" : "text-foreground/80"}`}>{x.b}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">{tri("Le righe evidenziate sono le differenze vere. Valori calcolati dalle dosi alla scala originale.", "Hervorgehobene Zeilen sind die echten Unterschiede. Werte aus den Mengen im Originalmaßstab berechnet.", "Highlighted rows are the real differences. Values calculated from the quantities at the original scale.")}</p>
      <div className="space-y-1.5">
        {say.map((s, i) => <p key={i} data-testid={`mac-say-${i}`} className="text-[12.5px] text-salvia leading-snug">{i === 0 ? "Sitor: " : ""}{s}</p>)}
      </div>
    </div>
  );
}
