// V74 — Comandi vocali per la modalità "Mani in Pasta":
//  1) parola di attivazione "Ehi Sitor" (stripWake)
//  2) sostituzione ingredienti a voce, risposta breve e locale, senza IA e senza costi (findSubstitution)
// Funzioni pure: nessuna dipendenza da React o dal browser.

// "Ehi Sitor", "hey Sitor", "ok Sitor", "Sitor, ..." e le storpiature più comuni del riconoscimento vocale.
const WAKE_RE = /(?:\b(?:ehi|ei|hey|hei|ehy|ok|okay|ciao|hallo|hi)[\s,]+)?\b(?:sitor|sitter|sitore|citor|sitar|cittor)\b[\s,.!:;-]*/i;

export function stripWake(said) {
  const text = String(said || "");
  const m = text.match(WAKE_RE);
  if (!m) return { woke: false, rest: text.trim() };
  return { woke: true, rest: (text.slice(0, m.index) + " " + text.slice(m.index + m[0].length)).replace(/\s+/g, " ").trim() };
}

// Frasi che introducono una richiesta di sostituzione (it / de / en). Volutamente solo verbi espliciti:
// parole come "senza" o "ohne" compaiono spesso nei passi letti ad alta voce.
const TRIGGER_RE = /(sostitu|al posto d|invece d|cosa uso|non ho\b|ho finito|finito il|finita la|finite le|manca\b|mancano\b|ersetz|ersatz|statt\b|anstelle|habe (?:kein|keine)|ist aus\b|ausgegangen|substitut|instead of|replace|swap|alternative to|ran out of|out of\b|don't have|do not have)/i;

const SUBS = [
  {
    key: "burro", re: /burro|butter/i,
    it: "Al posto di 100 g di burro: 80 g di olio di semi, oppure 100 g di margarina. Non va bene per sfogliati e croissant.",
    de: "Statt 100 g Butter: 80 g Sonnenblumen- oder Rapsöl, oder 100 g Margarine. Nicht geeignet für Blätterteig und Croissants.",
    en: "Instead of 100 g butter: 80 g sunflower or vegetable oil, or 100 g margarine. Not suitable for laminated doughs and croissants.",
  },
  {
    key: "uova", re: /\buov[oa]\b|\beier?\b|\begg(?:s)?\b/i,
    it: "Al posto di 1 uovo, circa 50 g: 50 g di yogurt naturale, oppure 1 cucchiaio di semi di lino macinati in 3 cucchiai d'acqua. Nei lievitati dolci il risultato è meno soffice.",
    de: "Statt 1 Ei, etwa 50 g: 50 g Naturjoghurt, oder 1 Esslöffel gemahlene Leinsamen in 3 Esslöffeln Wasser. Bei süßen Hefeteigen wird das Ergebnis weniger luftig.",
    en: "Instead of 1 egg, about 50 g: 50 g plain yogurt, or 1 tablespoon ground flaxseed in 3 tablespoons water. In sweet leavened doughs the result is less fluffy.",
  },
  {
    key: "latte", re: /\blatte\b|\bmilch\b|\bmilk\b/i,
    it: "Al posto di 100 ml di latte: 100 ml di acqua con 5 g di burro o di olio, oppure 100 ml di bevanda di avena.",
    de: "Statt 100 ml Milch: 100 ml Wasser mit 5 g Butter oder Öl, oder 100 ml Haferdrink.",
    en: "Instead of 100 ml milk: 100 ml water with 5 g butter or oil, or 100 ml oat drink.",
  },
  {
    key: "lievito", re: /lievito\s+(?:di\s+birra|fresco|secco)|\bhefe\b|frische\s+hefe|trockenhefe|\byeast\b/i,
    it: "Lievito di birra: 3 g di lievito fresco equivalgono a circa 1 g di lievito secco.",
    de: "Hefe: 3 g frische Hefe entsprechen etwa 1 g Trockenhefe.",
    en: "Yeast: 3 g fresh yeast equals about 1 g dry yeast.",
  },
  {
    key: "zucchero", re: /zucchero|zucker|sugar/i,
    it: "Al posto di 100 g di zucchero: 75 g di miele, riducendo i liquidi di circa 15 g. La crosta scurisce prima: abbassa il forno di circa 10 °C.",
    de: "Statt 100 g Zucker: 75 g Honig, die Flüssigkeit um etwa 15 g reduzieren. Die Kruste bräunt schneller: den Ofen um etwa 10 °C senken.",
    en: "Instead of 100 g sugar: 75 g honey, reducing the liquid by about 15 g. The crust browns sooner: lower the oven by about 10 °C.",
  },
  {
    key: "miele", re: /miele|honig|honey/i,
    it: "Al posto di 100 g di miele: 100 g di sciroppo d'acero, oppure 80 g di zucchero con 20 g di acqua.",
    de: "Statt 100 g Honig: 100 g Ahornsirup, oder 80 g Zucker mit 20 g Wasser.",
    en: "Instead of 100 g honey: 100 g maple syrup, or 80 g sugar with 20 g water.",
  },
  {
    key: "farina", re: /farina|\bmehl\b|\bflour\b/i,
    it: "Farina in Germania: per pane e pizza usa la Type 550, per dolci e frolle la Type 405. Per i grandi lievitati come il panettone serve una farina forte.",
    de: "Mehl in Deutschland: für Brot und Pizza Type 550, für Kuchen und Mürbeteig Type 405. Für große Hefeteige wie Panettone braucht man ein starkes Mehl.",
    en: "Flour in Germany: for bread and pizza use Type 550, for cakes and shortcrust Type 405. Large leavened doughs like panettone need a strong flour.",
  },
  {
    key: "strutto", re: /strutto|schweineschmalz|schmalz|\blard\b/i,
    it: "Al posto di 100 g di strutto: 100 g di burro, oppure 85 g di olio.",
    de: "Statt 100 g Schweineschmalz: 100 g Butter, oder 85 g Öl.",
    en: "Instead of 100 g lard: 100 g butter, or 85 g oil.",
  },
  {
    key: "malto", re: /malto|\bmalz\b|\bmalt\b/i,
    it: "Al posto di 1 cucchiaino di malto d'orzo: 1 cucchiaino di miele.",
    de: "Statt 1 Teelöffel Gerstenmalz: 1 Teelöffel Honig.",
    en: "Instead of 1 teaspoon barley malt: 1 teaspoon honey.",
  },
];

const pickLang = (o, lang) => (lang === "de" ? o.de : lang === "it" ? o.it : o.en);

// Ritorna il testo della sostituzione (nella lingua) o null se la frase non chiede una sostituzione.
export function findSubstitution(said, lang) {
  const text = String(said || "");
  const t = text.match(TRIGGER_RE);
  if (!t) return null;
  const after = text.slice(t.index + t[0].length);
  let best = null;
  const scan = (chunk) => {
    for (const s of SUBS) {
      const m = chunk.match(s.re);
      if (m && (best === null || m.index < best.pos)) best = { s, pos: m.index };
    }
  };
  scan(after);
  if (!best) scan(text.slice(0, t.index)); // "il burro, sostituiscilo"
  return best ? pickLang(best.s, lang) : null;
}

export const SUB_KEYS = SUBS.map((s) => s.key);
