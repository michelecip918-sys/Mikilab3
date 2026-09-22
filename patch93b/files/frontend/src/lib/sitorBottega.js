// V93b — (prima si chiamava bottega.js per errore: quel nome era già della "Tua bottega" della v88)
// V93 — LA BOTTEGA RISPONDE PRIMA. Quando uno scrive a Sitor, prima di chiamare l'IA (che costa crediti)
// si cerca la risposta nel sapere già scritto nel sito: glossario, pronto soccorso, dati della ricetta aperta,
// dove trovare le cose. Se la bottega non sa, la domanda va all'IA come prima. Tutto nel browser.
import { GLOSSARIO, glossEntry, normText } from "@/lib/glossario";
import { S as SOCCORSO } from "@/components/officina/ProntoSoccorso";
import { computeLabel } from "@/components/EtichettaMikiLab";
import { fermentationHours, fmt1, num } from "@/lib/sitorTools";

const L = (o, lang) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);

// Parole con cui si riconosce ogni sintomo del pronto soccorso (minuscole, senza accenti).
const SOCC_KW = {
  "non-cresce": ["non cresce", "non lievita", "non si alza", "non si gonfia", "resta fermo", "sta fermo", "non e cresciuto", "non e lievitato", "geht nicht auf", "geht nicht hoch", "geht nicht", "won't rise", "wont rise", "not rising", "doesn't rise", "didn't rise", "no rise"],
  "appiccicoso": ["appiccicoso", "appiccica", "si attacca", "colla", "troppo molle", "troppo liquido", "klebrig", "klebt", "zu weich", "sticky", "too wet", "too slack"],
  "si-strappa": ["si strappa", "si rompe", "non si stende", "non si allunga", "reisst", "reißt", "laesst sich nicht", "tears", "won't stretch", "wont stretch"],
  "sgonfiato": ["sgonfiato", "si e sgonfiato", "afflosciato", "collassato", "cresciuto troppo", "lievitato troppo", "zusammengefallen", "uebergangen", "übergangen", "collapsed", "over proof", "overproof", "over-proof", "deflated"],
  "piatto": ["piatto", "si allarga", "si e allargato", "troppo basso", "e piatto", "schiacciato", "laeuft breit", "läuft breit", "flach", "spreads", "is flat", "too flat", "came out flat", "pancake"],
  "no-spinta": ["non si gonfia in cottura", "non cresce in forno", "spinta", "non si e aperto", "ofentrieb", "kein trieb", "oven spring", "didn't spring", "no spring"],
  "scoppia": ["scoppia", "scoppiato", "si apre di lato", "esploso", "spacca", "reisst seitlich", "reißt seitlich", "platzt", "bursts", "burst", "blowout", "blow out"],
  "cruda-sotto": ["crudo sotto", "cruda sotto", "crudo dentro", "cruda dentro", "sotto e crudo", "non cotto", "innen roh", "unten roh", "roh", "raw inside", "raw underneath", "underbaked", "undercooked"],
  "pallida": ["pallida", "pallido", "bianca", "non colora", "non si colora", "senza colore", "blass", "bleich", "keine farbe", "pale", "no colour", "no color", "white crust"],
  "gommosa": ["gommosa", "gommoso", "umida dentro", "bagnata", "appiccicosa dentro", "gummig", "gummy", "moist inside", "wet inside", "doughy"],
  "compatta": ["compatta", "compatto", "fitta", "pesante", "mattone", "denso", "densa", "dicht", "schwer", "kompakt", "dense", "heavy", "brick", "tight crumb"],
  "buchi-enormi": ["buchi enormi", "buco enorme", "buchi grandi", "buco grande", "alveoli enormi", "tunnel", "riesige loecher", "riesige löcher", "grosse loecher", "große löcher", "huge holes", "big holes", "large holes"],
  "crosta-dura": ["crosta dura", "crosta spessa", "troppo dura", "kruste hart", "harte kruste", "dicke kruste", "hard crust", "thick crust", "crust too hard"],
  "sa-di-lievito": ["sa di lievito", "sapore di lievito", "sa di alcol", "troppo acido", "sa di acido", "aspro", "schmeckt nach hefe", "zu sauer", "schmeckt sauer", "alkohol", "tastes of yeast", "yeasty", "too sour", "alcohol"],
  "duro-domani": ["giorno dopo", "il giorno dopo", "gia duro", "diventa duro", "si e seccato", "raffermo", "conservare", "come lo conservo", "naechsten tag", "nächsten tag", "hart geworden", "aufbewahren", "stale", "next day", "goes hard", "keep it fresh", "store it", "storing"],
  "biga-acetone": ["acetone", "biga crollata", "poolish crollato", "biga liquida", "biga puzza", "poolish puzza", "aceton", "vorteig zusammengefallen", "riecht nach", "smells of acetone", "poolish collapsed", "biga collapsed"],
  "lm-non-raddoppia": ["non raddoppia", "lievito madre non", "lievito madre fermo", "lievito madre debole", "licoli non", "sauerteig verdoppelt", "sauerteig geht nicht", "starter not rising", "starter won't", "starter wont", "starter doesn't double", "starter isn't doubling"],
  "lm-liquido": ["liquido sopra", "liquido scuro", "acqua sopra", "hooch", "fluessigkeit", "flüssigkeit", "liquid on top", "dark liquid", "grey liquid", "gray liquid"],
};

const FACT_KW = {
  hyd: ["idratazione", "quanta acqua", "quant acqua", "acqua", "hydration", "wasser", "wie viel wasser", "water", "how much water"],
  salt: ["sale", "quanto sale", "salz", "salt"],
  time: ["quanto tempo", "quante ore", "quanto ci vuole", "tempi", "lievitazione", "wie lange", "stunden", "gare", "how long", "hours", "proof"],
  oven: ["forno", "gradi", "temperatura di cottura", "quanti minuti", "cottura", "ofen", "grad", "backen", "oven", "degrees", "bake"],
  yeast: ["quanto lievito", "lievito", "hefe", "wie viel hefe", "yeast", "how much yeast"],
  flour: ["che farina", "quale farina", "farina", "welches mehl", "mehl", "which flour", "flour"],
};

const HELP = [
  { kw: ["dove trovo", "dove sono", "come apro", "wo finde ich", "wo ist", "wo sind", "where do i find", "where is", "where are", "how do i open"],
    it: "Gli attrezzi stanno in due posti: nel Ricettario, sopra la ricerca, c'è l'Officina di Sitor (cosa posso fare, confronto, occhio, pronto soccorso, taglio); dentro ogni ricetta, dopo gli ingredienti, ci sono gli attrezzi con le dosi di quella ricetta. Tutto il resto è in Strumenti, dal menu in alto.",
    de: "Die Werkzeuge stehen an zwei Orten: im Rezeptbuch, über der Suche, ist Sitors Werkstatt (was kann ich machen, Vergleich, Auge, Erste Hilfe, Schnitt); in jedem Rezept, nach den Zutaten, stehen die Werkzeuge mit den Mengen dieses Rezepts. Alles andere unter Werkzeuge im Menü oben.",
    en: "The tools live in two places: in the recipe book, above the search, there's Sitor's Workshop (what can I make, compare, eye, first aid, score); inside each recipe, after the ingredients, are the tools with that recipe's quantities. Everything else is under Tools in the top menu." },
];

// punteggio = lunghezza delle parole riconosciute (frasi lunghe pesano di più delle parole corte)
function hits(n, list) { let s = 0; for (const k of list) { if (n.includes(normText(k))) s += k.length; } return s; }

export function bottegaAnswer(question, lang, ctx) {
  const q = String(question || "").trim();
  if (!q || q.length > 220) return null;
  const n = ` ${normText(q)} `;
  // domande chiaramente da conversazione libera: lascia all'IA
  if (/\b(ricetta di|ricetta per|rezept fuer|rezept für|recipe for|inventa|erfinde|invent|scrivi|scrivimi|schreib|write me|write a)\b/.test(n)) return null;
  const isDef = /\b(cos e|cosa e|cos'e|che cos|che significa|cosa vuol dire|cosa sono|che vuol dire|was ist|was bedeutet|was sind|what is|what's|what does|meaning|significa|bedeutet)\b/.test(n);
  const recipe = ctx && ctx.recipe;

  // 1) sintomi (pronto soccorso)
  let best = null, bestScore = 0;
  const starter = /(lievito madre|licoli|pasta madre|sauerteig|anstellgut|starter|levain)/.test(n);
  for (const s of SOCCORSO) {
    let sc = hits(n, SOCC_KW[s.k] || []);
    if (starter && s.k.startsWith("lm-")) sc += 12;          // parla del lievito madre: prima le sue voci
    if (starter && (s.k === "non-cresce" || s.k === "sgonfiato")) sc -= 12;
    if (sc > bestScore) { best = s; bestScore = sc; }
  }
  if (best && bestScore >= 5) {
    const why = L(best.why, lang), now = L(best.now, lang), next = L(best.next, lang);
    const h = lang === "de" ? ["Warum: ", "Jetzt: ", "Nächstes Mal: "] : lang === "en" ? ["Why: ", "Right now: ", "Next time: "] : ["Perché: ", "Adesso: ", "La prossima volta: "];
    return `${L(best.t, lang)}\n\n${h[0]}${why}\n\n${h[1]}${now}\n\n${h[2]}${next}`;
  }

  // 2) dati della ricetta aperta
  if (recipe && num(recipe.flour_grams) > 0) {
    const Lb = computeLabel(recipe); const F = fermentationHours(recipe);
    const name = recipe[`name_${lang}`] || recipe.name;
    const hyd = num(recipe.hydration_percent) || (num(recipe.water_grams) / num(recipe.flour_grams)) * 100;
    const out = [];
    const want = (k) => hits(n, FACT_KW[k]) > 0;
    if (want("hyd")) out.push(lang === "de" ? `Hydration ${fmt1(hyd)} % (TA ${Math.round(100 + hyd)}): ${Math.round(num(recipe.water_grams))} g Wasser auf ${Math.round(num(recipe.flour_grams))} g Mehl.` : lang === "en" ? `Hydration ${fmt1(hyd)} %: ${Math.round(num(recipe.water_grams))} g water on ${Math.round(num(recipe.flour_grams))} g flour.` : `Idratazione ${fmt1(hyd)} %: ${Math.round(num(recipe.water_grams))} g di acqua su ${Math.round(num(recipe.flour_grams))} g di farina.`);
    if (want("salt")) out.push(lang === "de" ? `Salz: ${Math.round(num(recipe.salt_grams))} g, also ${fmt1(Lb.salt)} g je 100 g Mehl.` : lang === "en" ? `Salt: ${Math.round(num(recipe.salt_grams))} g, that is ${fmt1(Lb.salt)} g per 100 g flour.` : `Sale: ${Math.round(num(recipe.salt_grams))} g, cioè ${fmt1(Lb.salt)} g ogni 100 g di farina.`);
    if (want("time")) {
      const pre = F.hasPre ? (lang === "de" ? `Vorteig ${fmt1(F.preMin)}${F.preMax !== F.preMin ? `-${fmt1(F.preMax)}` : ""} h, ` : lang === "en" ? `preferment ${fmt1(F.preMin)}${F.preMax !== F.preMin ? `-${fmt1(F.preMax)}` : ""} h, ` : `prefermento ${fmt1(F.preMin)}${F.preMax !== F.preMin ? `-${fmt1(F.preMax)}` : ""} h, `) : "";
      out.push(lang === "de" ? `Zeiten (bei 25 °C): ${pre}Stockgare ${fmt1(F.bulk)} h, Stückgare ${fmt1(F.proof)} h. Gesamt etwa ${fmt1(F.totalMin)}${F.totalMax !== F.totalMin ? `-${fmt1(F.totalMax)}` : ""} h. In deiner Küche rechnet 'Gare bei dir zu Hause' die Zeiten um.` : lang === "en" ? `Times (at 25 °C): ${pre}bulk ${fmt1(F.bulk)} h, final proof ${fmt1(F.proof)} h. About ${fmt1(F.totalMin)}${F.totalMax !== F.totalMin ? `-${fmt1(F.totalMax)}` : ""} h in total. 'Rising at your place' adapts them to your kitchen.` : `Tempi (a 25 °C): ${pre}massa ${fmt1(F.bulk)} h, forma ${fmt1(F.proof)} h. In tutto circa ${fmt1(F.totalMin)}${F.totalMax !== F.totalMin ? `-${fmt1(F.totalMax)}` : ""} h. 'Lievitazione a casa tua' li adatta alla tua cucina.`);
    }
    if (want("oven") && num(recipe.bake_temp) > 0) out.push(lang === "de" ? `Ofen: ${Math.round(num(recipe.bake_temp))} °C${num(recipe.bake_minutes) > 0 ? ` für etwa ${Math.round(num(recipe.bake_minutes))} Minuten` : ""}${recipe.oven_type ? ` (${recipe.oven_type})` : ""}.` : lang === "en" ? `Oven: ${Math.round(num(recipe.bake_temp))} °C${num(recipe.bake_minutes) > 0 ? ` for about ${Math.round(num(recipe.bake_minutes))} minutes` : ""}${recipe.oven_type ? ` (${recipe.oven_type})` : ""}.` : `Forno: ${Math.round(num(recipe.bake_temp))} °C${num(recipe.bake_minutes) > 0 ? ` per circa ${Math.round(num(recipe.bake_minutes))} minuti` : ""}${recipe.oven_type ? ` (${recipe.oven_type})` : ""}.`);
    if (want("yeast")) out.push(Lb.lm ? (lang === "de" ? `Dieses Rezept geht mit Sauerteig: ${Math.round(num(recipe.sourdough_grams))} g.` : lang === "en" ? `This recipe rises with sourdough: ${Math.round(num(recipe.sourdough_grams))} g.` : `Questa ricetta lievita con lievito madre: ${Math.round(num(recipe.sourdough_grams))} g.`) : Lb.yeast > 0 ? (lang === "de" ? `Bäckerhefe: ${fmt1(Lb.yeast)} % auf Mehl, also ${Math.round(num(recipe.flour_grams) * Lb.yeast / 100)} g frisch (${Math.round(num(recipe.flour_grams) * Lb.yeast / 300)} g trocken).` : lang === "en" ? `Baker's yeast: ${fmt1(Lb.yeast)} % of flour, that is ${Math.round(num(recipe.flour_grams) * Lb.yeast / 100)} g fresh (${Math.round(num(recipe.flour_grams) * Lb.yeast / 300)} g dry).` : `Lievito di birra: ${fmt1(Lb.yeast)} % sulla farina, cioè ${Math.round(num(recipe.flour_grams) * Lb.yeast / 100)} g fresco (${Math.round(num(recipe.flour_grams) * Lb.yeast / 300)} g secco).`) : (lang === "de" ? "In diesem Rezept steht keine Hefe." : lang === "en" ? "This recipe lists no yeast." : "In questa ricetta non c'è lievito di birra indicato."));
    if (want("flour") && recipe.flour_type) out.push(lang === "de" ? `Mehl: ${recipe[`flour_type_${lang}`] || recipe.flour_type}.` : lang === "en" ? `Flour: ${recipe[`flour_type_${lang}`] || recipe.flour_type}.` : `Farina: ${recipe.flour_type}.`);
    if (out.length) return `${name}\n${out.join("\n")}`;
  }

  // 3) glossario
  if (q.length <= 140) {
    let g = null, gs = 0;
    for (const e of GLOSSARIO) { const sc = hits(n, e.kw); if (sc > gs) { g = e; gs = sc; } }
    if (g && (isDef || gs >= 9 || q.split(/\s+/).length <= 4)) { const v = glossEntry(g, lang); return `${v.title}\n${v.body}`; }
  }

  // 4) dove trovo…
  for (const h of HELP) if (hits(n, h.kw) >= 5) return L(h, lang);
  return null;
}
