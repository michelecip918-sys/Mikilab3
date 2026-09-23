import { useState } from "react";
import { Clock, ChevronRight, Wheat } from "lucide-react";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { recipeCategory, CAT_COLORS } from "@/lib/recipeCats";
import { fermentationHours, ingredientFamily, fmt1 } from "@/lib/sitorTools";

// V92 — COSA POSSO FARE ADESSO? Tre domande (tempo, lievito, cosa c'è in dispensa) e Sitor pesca dal ricettario
// le ricette che puoi fare davvero oggi, dicendoti anche cosa ti manca. Nessuna ricerca in rete: legge le ricette.

const TIMES = [
  { k: "2h", max: 3.5, it: "Un paio d'ore", de: "Ein paar Stunden", en: "A couple of hours" },
  { k: "half", max: 8, it: "Mezza giornata", de: "Ein halber Tag", en: "Half a day" },
  { k: "over", max: Infinity, it: "Da oggi a domani", de: "Von heute auf morgen", en: "Today to tomorrow" },
  { k: "any", max: Infinity, it: "Non ho fretta", de: "Keine Eile", en: "No hurry" },
];
const LEAVEN = [
  { k: "yeast", it: "Lievito di birra", de: "Hefe", en: "Baker's yeast" },
  { k: "lm", it: "Lievito madre / licoli", de: "Sauerteig / Licoli", en: "Sourdough / licoli" },
  { k: "both", it: "Tutti e due", de: "Beides", en: "Both" },
];
const PANTRY = [
  { k: "eggs", it: "Uova", de: "Eier", en: "Eggs" }, { k: "butter", it: "Burro", de: "Butter", en: "Butter" }, { k: "dairy", it: "Latte / latticini", de: "Milch / Milchprodukte", en: "Milk / dairy" },
  { k: "potato", it: "Patate", de: "Kartoffeln", en: "Potatoes" }, { k: "semolina", it: "Semola", de: "Hartweizengrieß", en: "Semolina" }, { k: "nuts", it: "Frutta a guscio", de: "Nüsse", en: "Nuts" },
  { k: "driedfruit", it: "Canditi / uvetta", de: "Kandiertes / Rosinen", en: "Candied / raisins" }, { k: "chocolate", it: "Cioccolato", de: "Schokolade", en: "Chocolate" }, { k: "seeds", it: "Semi", de: "Saaten", en: "Seeds" }, { k: "veg", it: "Verdure / erbe", de: "Gemüse / Kräuter", en: "Vegetables / herbs" }, { k: "meat", it: "Salumi / formaggi", de: "Wurst / Käse", en: "Cured meats / cheese" },
];
const ALWAYS = new Set(["flour", "water", "salt", "yeast", "sourdough", "oil", "sugar", "spices", "other", "drinks", "lard", "pre", "biga"]);

export default function CosaPossoFare({ recipes, lang, t, onOpen }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [time, setTime] = useState("half");
  const [leaven, setLeaven] = useState("yeast");
  const [have, setHave] = useState(() => new Set(["eggs", "butter", "dairy"]));
  const [avoid, setAvoid] = useState(() => new Set()); // V98: allergeni/ingredienti da evitare
  const AVOID = [
    { k: "milk", it: "latte e burro", de: "Milch und Butter", en: "milk and butter", test: (fams) => fams.has("dairy") || fams.has("butter") },
    { k: "eggs", it: "uova", de: "Eier", en: "eggs", test: (fams) => fams.has("eggs") },
    { k: "nuts", it: "frutta a guscio", de: "Schalenfrüchte", en: "nuts", test: (fams, names) => fams.has("nuts") || /arachid|erdnuss|peanut|mandorl|mandel|almond|nocciol|haseln|hazel|noci|walnuss|walnut|pistacch/.test(names) },
    { k: "sesame", it: "sesamo", de: "Sesam", en: "sesame", test: (fams, names) => /sesam/.test(names) },
    { k: "soy", it: "soia", de: "Soja", en: "soya", test: (fams, names) => /soia|soja|soy/.test(names) },
    { k: "sugar", it: "zucchero aggiunto", de: "Zucker", en: "added sugar", test: (fams) => fams.has("sugar") || fams.has("chocolate") },
    { k: "meat", it: "carne e salumi", de: "Fleisch und Wurst", en: "meat", test: (fams) => fams.has("meat") },
  ];
  const toggleAvoid = (k) => setAvoid((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const toggle = (k) => setHave((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const T = TIMES.find((x) => x.k === time) || TIMES[1];

  const scored = (recipes || []).filter((r) => r && !r.locked && !/migliorator|backmittel|improver/i.test(r.name || "")).map((r) => {
    const F = fermentationHours(r);
    const total = F.totalMax;
    if (total > T.max) return null;
    if (F.lm && leaven === "yeast") return null;
    if (F.yeast && !F.lm && leaven === "lm") return null;
    const famsAll = new Set((r.extra_ingredients || []).map((e) => ingredientFamily(e && e.name)));
    const namesAll = `${r.flour_type || ""} ${(r.extra_ingredients || []).map((e) => e && e.name).join(" ")}`.toLowerCase();
    if ([...avoid].some((k) => { const a = AVOID.find((x) => x.k === k); return a && a.test(famsAll, namesAll); })) return null; // V98
    const need = new Set((r.extra_ingredients || []).map((e) => ingredientFamily(e && e.name)).filter((f) => !ALWAYS.has(f)));
    const missing = [...need].filter((f) => !have.has(f));
    let score = 10 - missing.length * 3;
    if (time === "over" && total >= 8) score += 2;
    if (time === "2h" && total > 0 && total <= 2.5) score += 1;
    if (total === 0) score -= 1;
    if (leaven === "lm" && F.lm) score += 1;
    return { r, F, total, missing, score };
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.total - b.total).slice(0, 8);

  const famLabel = (f) => { const p = PANTRY.find((x) => x.k === f); return p ? L(p) : f; };

  return (
    <div data-testid="cosa-posso-fare" className="space-y-3">
      <p className="text-[13px] text-foreground/85 leading-snug">{tri("Rispondi a tre domande e ti dico cosa puoi impastare adesso, con quello che hai.", "Beantworte drei Fragen und ich sage dir, was du jetzt kneten kannst, mit dem, was du hast.", "Answer three questions and I'll tell you what you can knead right now, with what you have.")}</p>
      <div className="rounded-xl border border-border bg-card p-3 space-y-3">
        <div>
          <p className="text-[12.5px] font-semibold text-foreground mb-1.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary" /> {tri("Quanto tempo hai?", "Wie viel Zeit hast du?", "How much time do you have?")}</p>
          <div className="flex flex-wrap gap-1.5">{TIMES.map((x) => <button key={x.k} data-testid={`cpf-time-${x.k}`} onClick={() => setTime(x.k)} className={`text-[12px] font-semibold px-2.5 py-1.5 rounded-full border active:scale-95 ${time === x.k ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"}`}>{L(x)}</button>)}</div>
        </div>
        <div>
          <p className="text-[12.5px] font-semibold text-foreground mb-1.5 flex items-center gap-1"><Wheat className="w-3.5 h-3.5 text-primary" /> {tri("Con cosa fai lievitare?", "Womit lässt du gehen?", "What do you leaven with?")}</p>
          <div className="flex flex-wrap gap-1.5">{LEAVEN.map((x) => <button key={x.k} data-testid={`cpf-leaven-${x.k}`} onClick={() => setLeaven(x.k)} className={`text-[12px] font-semibold px-2.5 py-1.5 rounded-full border active:scale-95 ${leaven === x.k ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"}`}>{L(x)}</button>)}</div>
        </div>
        <div>
          <p className="text-[12.5px] font-semibold text-foreground mb-1.5">{tri("Oltre a farina, acqua, sale, olio e zucchero, in casa hai…", "Außer Mehl, Wasser, Salz, Öl und Zucker hast du zu Hause…", "Besides flour, water, salt, oil and sugar, at home you have…")}</p>
          <div className="flex flex-wrap gap-1.5">{PANTRY.map((x) => <button key={x.k} data-testid={`cpf-have-${x.k}`} onClick={() => toggle(x.k)} className={`text-[12px] font-semibold px-2.5 py-1.5 rounded-full border active:scale-95 ${have.has(x.k) ? "bg-salvia text-white border-salvia" : "bg-background text-muted-foreground border-border"}`}>{L(x)}</button>)}</div>
        </div>
        <div>
          <p className="text-[12.5px] font-semibold text-foreground mb-1.5">{tri("Da evitare (per chi mangia con te)", "Zu vermeiden (für die, die mitessen)", "To avoid (for those eating with you)")}</p>
          <div className="flex flex-wrap gap-1.5">{AVOID.map((x) => <button key={x.k} data-testid={`cpf-avoid-${x.k}`} onClick={() => toggleAvoid(x.k)} className={`text-[12px] font-semibold px-2.5 py-1.5 rounded-full border active:scale-95 ${avoid.has(x.k) ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"}`}>{avoid.has(x.k) ? "✕ " : ""}{L(x)}</button>)}</div>
          {avoid.size > 0 && <p className="text-[11px] text-muted-foreground mt-1">{tri("Letto dagli ingredienti della ricetta: controlla sempre le etichette di quello che usi.", "Aus den Rezeptzutaten gelesen: prüfe immer die Etiketten deiner Zutaten.", "Read from the recipe ingredients: always check the labels of what you use.")}</p>}
        </div>
      </div>
      <div data-testid="cpf-results" className="space-y-1.5">
        {scored.length === 0 ? (
          <p className="text-[13px] text-muted-foreground rounded-xl border border-border bg-card p-3">{tri("Con questi limiti non trovo niente: dai un po' più di tempo, o cambia lievito.", "Mit diesen Grenzen finde ich nichts: gib etwas mehr Zeit oder wechsle das Triebmittel.", "With these limits I find nothing: allow a bit more time, or change the leavening.")}</p>
        ) : scored.map(({ r, F, total, missing }) => {
          const c = recipeCategory(r); const col = CAT_COLORS[c.key] || "hsl(var(--primary))";
          return (
            <button key={r.id} data-testid={`cpf-open-${r.id}`} onClick={() => onOpen(r.id)} className="w-full flex items-center gap-2.5 text-left rounded-xl border border-border bg-card px-3 py-2 active:scale-[0.99] hover:border-primary/60 transition-all">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-base shrink-0" style={{ background: col + "26", boxShadow: `inset 0 0 0 1px ${col}` }}>{c.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-foreground truncate">{rLoc(r, "name", lang)}</span>
                <span className="block text-[11px] text-muted-foreground truncate">
                  {total > 0 ? `${fmt1(total)} h · ` : ""}{F.lm ? tri("lievito madre", "Sauerteig", "sourdough") : F.hasPre ? tri("con prefermento", "mit Vorteig", "with preferment") : tri("diretto", "direkt", "direct")}
                  {missing.length > 0 ? ` · ${tri("ti manca", "dir fehlt", "you're missing")}: ${missing.map(famLabel).join(", ")}` : ` · ${tri("hai tutto", "du hast alles", "you have everything")}`}
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
      <p className="text-[12.5px] text-salvia leading-snug">
        {tri("Sitor: se hai poco tempo, non scegliere la ricetta più bella: scegli quella che finisci. Il pane buono è quello che esce dal forno.",
          "Sitor: Hast du wenig Zeit, nimm nicht das schönste Rezept, sondern das, das du zu Ende bringst. Gutes Brot ist das, das aus dem Ofen kommt.",
          "Sitor: if you're short on time, don't pick the prettiest recipe: pick the one you'll finish. Good bread is the one that comes out of the oven.")}
      </p>
    </div>
  );
}
