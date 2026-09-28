// V136 — «DILLO A SITOR». Una frase («pizza sabato alle 20 per 6», «Brot für morgen früh», «bread for tomorrow night»)
// diventa un piano vero: la ricetta di MikiLab che ci sta nel tempo, le dosi per quelle persone, l'ora di ogni passaggio
// contando all'indietro da quando si mangia, la spesa, i promemoria nel calendario. Poi Sitor ti segue fino al forno e,
// a pane fatto, chiede com'è venuto e se lo ricorda per la volta dopo. Tutto nel telefono: nessun dato inviato.
// Le dosi di Michele non si toccano: si calcola solo quanta farina usare, come fa lo scalatore della scheda.
import { num, computeDough, fermentationHours, LS } from "@/lib/sitorTools";

export const PIANO_KEY = "mikilab_piano_sitor";
export const DIARIO_KEY = "mikilab_diario_sitor";
export const TESTO_KEY = "mk_dillo_testo"; // sessionStorage: la frase scritta in Home
const H = 3600000, M = 60000, DAY = 86400000;
export const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss");

// Che cosa vuoi fare: parole in italiano, tedesco e inglese (senza accenti). g = grammi di impasto a persona.
export const TIPI = [
  { k: "pizza", re: /\bpizz[aei]|\bpinsa\b/, cats: ["pizza"], g: 250, n: { it: "Pizza", de: "Pizza", en: "Pizza" } },
  { k: "focaccia", re: /focacc|schiacciat|fugass/, cats: ["focacce"], g: 150, n: { it: "Focaccia", de: "Focaccia", en: "Focaccia" } },
  { k: "panettone", re: /panetton|colomb[ae]|pandoro|veneziana|stollen/, cats: ["panettoni"], g: 100, n: { it: "Panettone", de: "Panettone", en: "Panettone" } },
  { k: "panini", re: /\bpanin|brotchen|semmel|\brolls?\b|\bbuns?\b|rosett|michett/, cats: ["panini"], g: 100, n: { it: "Panini", de: "Brötchen", en: "Rolls" } },
  { k: "dolce", re: /\bdolc[ei]|brioche|cornett|croissant|biscott|cookie|keks|kuchen|\bsweet|cantucc|frollin|\btreccia|plunder|danese|saccottin/, cats: ["viennoiserie", "pasticceria"], g: 70, n: { it: "Dolci e colazione", de: "Süßes und Frühstück", en: "Sweets and breakfast" } },
  { k: "snack", re: /grissin|taralli|tarallo|cracker|frisell|snack|stuzzich|brezel|pretzel|\blaugen/, cats: ["snack", "rosticceria", "fritti"], g: 50, n: { it: "Grissini, taralli, crackers", de: "Grissini, Taralli, Cracker", en: "Breadsticks, taralli, crackers" } },
  { k: "pane", re: /\bpane\b|pagnott|filone|\bbrot\b|\blaib|\bbread\b|\bloaf|baguette|ciabatta|\bsegale|\broggen|integrale|vollkorn|kastenbrot|cassetta/, cats: ["pane"], g: 120, n: { it: "Pane", de: "Brot", en: "Bread" } },
];
const DEF = {
  pane: { bulk: 2.5, proof: 1.5, bake: 40, cool: 1.5 }, panini: { bulk: 1.5, proof: 1, bake: 18, cool: 0.33 },
  focaccia: { bulk: 1.5, proof: 1.5, bake: 22, cool: 0.17 }, pizza: { bulk: 1.5, proof: 2.5, bake: 12, cool: 0 },
  snack: { bulk: 1, proof: 0.5, bake: 20, cool: 0.33 }, dolce: { bulk: 2, proof: 2, bake: 20, cool: 0.5 },
  panettone: { bulk: 12, proof: 6, bake: 50, cool: 8 },
};
export function tipoDi(r) {
  const c = String((r && r.menu_category) || "").toLowerCase();
  const t = TIPI.find((x) => x.cats.includes(c));
  return t ? t.k : "pane";
}
export const tipo = (k) => TIPI.find((x) => x.k === k) || TIPI[TIPI.length - 1];

const NUMERI = { uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12, quindici: 15, venti: 20,
  zwei: 2, drei: 3, vier: 4, funf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwolf: 12, zwanzig: 20,
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20 };
const GIORNI = [[/\bdomenica|\bsonntag|\bsunday/, 0], [/\blunedi|\bmontag|\bmonday/, 1], [/\bmartedi|\bdienstag|\btuesday/, 2], [/\bmercoledi|\bmittwoch|\bwednesday/, 3],
  [/\bgiovedi|\bdonnerstag|\bthursday/, 4], [/\bvenerdi|\bfreitag|\bfriday/, 5], [/\bsabato|\bsamstag|\bsaturday/, 6]];

// Quando si mangia. null = «il prima possibile».
export function capisciQuando(t, now = new Date()) {
  const oggi = new Date(now); oggi.setHours(0, 0, 0, 0);
  let d = null, h = null, m = 0, giornoDetto = false;
  if (/\b(stasera|stanotte|heute abend|tonight|this evening)\b/.test(t)) { d = new Date(oggi); h = 20; giornoDetto = true; }
  if (!d && /\b(oggi|heute|today)\b/.test(t)) { d = new Date(oggi); giornoDetto = true; }
  if (/\b(dopodomani|ubermorgen|day after tomorrow)\b/.test(t)) { d = new Date(oggi.getTime() + 2 * DAY); giornoDetto = true; }
  else if (/\b(domani|tomorrow)\b/.test(t) || (/\bmorgen\b/.test(t) && !/\bheute morgen\b/.test(t))) { d = new Date(oggi.getTime() + DAY); giornoDetto = true; }
  for (const [re, wd] of GIORNI) if (re.test(t)) { d = new Date(oggi.getTime() + ((wd - now.getDay() + 7) % 7) * DAY); giornoDetto = true; break; }
  if (/colazion|fruhstuck|breakfast/.test(t)) h = 8;
  else if (/pranzo|mittag|lunch/.test(t)) h = 13;
  else if (/merenda|pomeriggio|nachmittag|afternoon/.test(t)) h = 16;
  else if (/aperitiv|aperitif/.test(t)) h = 19;
  else if (/\bcena\b|abendessen|dinner|\bsera\b|\babends?\b|evening|\bnight\b/.test(t)) h = h == null ? 20 : h;
  else if (/mattin|\bfruh\b|morning|\bmorgens\b|\bheute morgen\b/.test(t)) h = 9;
  let x = t.match(/\b(\d{1,2})[:.](\d{2})\b/);
  if (x) { h = +x[1]; m = +x[2]; }
  else if ((x = t.match(/\b(\d{1,2})\s*(am|pm|uhr)\b/))) { h = +x[1]; if (x[2] === "pm" && h < 12) h += 12; if (x[2] === "am" && h === 12) h = 0; }
  else if ((x = t.match(/\b(?:alle|ore|um|at|verso|gegen|around|by)\s+(\d{1,2})\b(?!\s*(?:persone|personen|people|or[ae]\b|stunden|hours))/))) { h = +x[1]; if (h >= 1 && h <= 7 && /\b(pm|sera|abend|evening|night)\b/.test(t)) h += 12; }
  const FESTE = [[/\bnatale\b|weihnacht|christmas/, 11, 25, 13], [/vigilia di natale|heiligabend|christmas eve/, 11, 24, 20], [/capodanno|silvester|new year.?s eve/, 11, 31, 20], [/ferragosto/, 7, 15, 13]];
  for (const [re, mo, gg, oo] of FESTE) if (re.test(t)) { const f = new Date(now.getFullYear(), mo, gg, h == null ? oo : h, m, 0, 0); if (f.getTime() < now.getTime()) f.setFullYear(f.getFullYear() + 1); return f; }
  const entro = t.match(/\b(?:in|entro|tra|fra|innerhalb von|within)\s+(\d{1,2})\s*(?:or[ae]|stunden?|hours?|h)\b/);
  if (entro) return new Date(now.getTime() + +entro[1] * H);
  if (d == null && h == null) return null;
  if (h == null || h > 23) h = 19;
  if (d == null) d = new Date(oggi);
  const out = new Date(d); out.setHours(h, m, 0, 0);
  if (out.getTime() < now.getTime() + 20 * M) out.setTime(out.getTime() + (giornoDetto && d.getTime() !== oggi.getTime() ? 7 : 1) * DAY);
  return out;
}

// La frase intera → che cosa, per quando, per quanti, con quale lievito.
export function capisci(testo, now = new Date()) {
  let t = norm(testo);
  t = t.replace(/\b[a-z]+\b/g, (w) => (NUMERI[w] != null ? String(NUMERI[w]) : w));
  const tp = TIPI.find((x) => x.re.test(t));
  let persone = null, pezzi = null;
  let x = t.match(/\b(\d{1,3})\s*(?:persone|persona|ospiti|people|persons|guests|personen|gaste|leute|bambini|kinder|kids|amici|freunde|friends)\b/);
  if (x) persone = +x[1];
  else if ((x = t.match(/\b(?:per|fur|for)\s+(\d{1,3})\b(?!\s*(?:am|pm|uhr|h\b|:|or[ae]\b|stunden|hours))/))) persone = +x[1];
  x = t.match(/\b(\d{1,3})\s*(?:panini|pezzi|stuck|brotchen|rolls|buns|pieces|pizze|pizzen|pizzas|teglie|bleche|trays)\b/);
  if (x) pezzi = +x[1];
  const lievito = /lievito madre|pasta madre|licoli|sauerteig|sourdough|lievito naturale|levain/.test(t) ? "lm" : /lievito di birra|lievito secco|\bhefe\b|\byeast\b/.test(t) ? "birra" : null;
  let oreMax = null;
  if ((x = t.match(/\b(?:ho|habe|have|avere|avro)\s+(?:solo\s+|nur\s+|only\s+)?(\d{1,2})\s*(?:or[ae]|stunden?|hours?)\b/))) oreMax = +x[1];
  const veloce = /veloc|in fretta|di corsa|schnell|\bquick|\bfast\b|subito|sofort|right now/.test(t);
  const canapa = /canapa|\bhanf|\bhemp/.test(t);
  return { testo, t, tipo: tp ? tp.k : null, persone, pezzi, lievito, oreMax: oreMax || (veloce ? 6 : null), canapa, quando: capisciQuando(t, now) };
}

// Ore di ogni fase per una ricetta (dai dati della ricetta; dove mancano, valori prudenti per quel tipo di impasto).
export function tempi(r) {
  const F = fermentationHours(r); const k = tipoDi(r); const def = DEF[k] || DEF.pane;
  const lievita = !!(F.yeast || F.lm || F.hasPre);
  const pt = String(r.preferment_type || "").toLowerCase();
  let pre = F.hasPre ? (F.preMin + F.preMax) / 2 : 0;
  let preKind = F.hasPre ? ((r.biga && r.biga.kind === "poolish") || pt === "poolish" ? "poolish" : "biga") : null;
  if (!F.hasPre && (pt === "poolish" || pt === "biga")) { pre = pt === "poolish" ? 14 : 16; preKind = pt; } // la ricetta dice poolish/biga ma non ha i numeri: tempi classici
  const rinfresco = F.lm && !pre ? 4 : 0;
  const bulk = lievita ? (F.bulk || def.bulk) : Math.max(0.25, (num(r.rest_minutes) || 30) / 60);
  const proof = lievita ? (F.proof || def.proof) : 0;
  const bake = (num(r.bake_minutes) || def.bake) / 60;
  const cool = def.cool;
  const total = rinfresco + pre + 0.5 + bulk + 0.25 + proof + bake + cool;
  return { k, lievita, pre, preKind, rinfresco, bulk, proof, bake, cool, total, lm: F.lm };
}

// Le ricette che vanno bene, le migliori prima. extras = mappa /recipe-extras (stato «Provata», foto vera).
const SPECIALI = /curcuma|zafferano|nduja|spirulina|spinaci|carbon|colorat|innovaz|barbabiet|cacao|curry|matcha|canapa|kristall|cristallo/i;
const STOP = new Set(["alla", "allo", "alle", "della", "delle", "dello", "senza", "mikilab", "artigianale", "ricetta", "classico", "classica", "tradizionale", "italiano", "italiana", "salato", "morbido", "morbida", "soffice", "rustico", "rustica", "panini", "panino", "focaccia", "pizza", "canapa", "verde", "with", "bread", "rolls", "brotchen"]);
const parole = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !STOP.has(w));
export function usabili(recipes) {
  return (recipes || []).filter((r) => r && !r.hidden && !r.locked && num(r.flour_grams) > 0 && String(r.menu_category || "") !== "basi" && !/migliorator|backmittel|improver/i.test(r.name || ""));
}
export function scegli(recipes, intent, extras = {}, now = new Date()) {
  const lista = usabili(recipes);
  const df = new Map();
  lista.forEach((r) => new Set([...parole(r.name), ...parole(r.name_de), ...parole(r.name_en)]).forEach((w) => df.set(w, (df.get(w) || 0) + 1)));
  const oreFino = intent.quando ? (intent.quando.getTime() - now.getTime()) / H : null;
  const out = [];
  for (const r of lista) {
    const nome = new Set([...parole(r.name), ...parole(r.name_de), ...parole(r.name_en)]);
    let nomeScore = 0; nome.forEach((w) => { if ((df.get(w) || 0) <= 3 && new RegExp(`\\b${w}`).test(intent.t)) nomeScore += 1; });
    const k = tipoDi(r);
    if (!nomeScore) {
      if (intent.tipo && tipo(intent.tipo).k !== k) continue;
      if (intent.canapa && !/canapa/i.test(r.name)) continue;
    }
    const T = tempi(r);
    if (intent.lievito === "lm" && !T.lm && !nomeScore) continue;
    if (intent.lievito === "birra" && T.lm && !nomeScore) continue;
    const limite = intent.oreMax != null ? intent.oreMax : oreFino;
    const ciSta = limite == null || T.total <= limite + 0.01;
    const x = extras[r.id] || {};
    let score = nomeScore * 20 + (x.status === "tested" ? 4 : x.status === "reviewed" ? 2 : 0) + (x.real_photo ? 1 : 0) + (x.difficulty === "facile" ? 2 : x.difficulty === "sfida" ? -2 : 0);
    if (intent.canapa && /canapa/i.test(r.name)) score += 6;
    if (nomeScore && intent.tipo && tipo(intent.tipo).k !== k) score -= 10; // «pane allo zafferano»: prima il pane, poi il panettone
    // Se non l'hai chiesto tu, prima i pani «di tutti i giorni»: quelli colorati o speciali restano come alternative.
    const etichetta = r.label && typeof r.label === "object" ? `${r.label.it || ""} ${r.label.de || ""}` : String(r.label || "");
    if (!nomeScore && !intent.canapa && SPECIALI.test(`${r.name} ${etichetta}`)) score -= 3;
    if (limite != null) score += ciSta ? Math.min(T.total, limite) / Math.max(1, limite) * 3 : -50; // più lievitazione = più gusto, se ci sta
    else score += intent.oreMax ? -T.total / 10 : Math.min(T.total, 24) / 12;
    out.push({ r, T, ciSta, score, nomeScore });
  }
  out.sort((a, b) => b.score - a.score || a.T.total - b.T.total);
  const scelti = out[0] && out[0].nomeScore > 0 ? out.filter((x) => x.nomeScore > 0) : out; // ha nominato una ricetta: solo quella (e le sorelle)
  return scelti.slice(0, 3);
}

// Quanta farina per quelle persone o quei pezzi (le proporzioni della ricetta restano quelle di Michele).
export function farinaPer(r, intent) {
  const base = computeDough(r, r.flour_grams);
  const ratio = base.total / (base.target || 1) || 1.7;
  const k = tipoDi(r);
  let impasto = 0;
  if (intent.pezzi && k === "panini") impasto = intent.pezzi * 80;
  else if (intent.pezzi && k === "pizza") impasto = intent.pezzi * 250;
  else if (intent.persone) impasto = intent.persone * tipo(k).g;
  if (!impasto) return Math.round(num(r.flour_grams));
  return Math.max(250, Math.min(3000, Math.round(impasto / ratio / 50) * 50));
}

// Il piano: ogni passaggio con la sua ora, contando all'indietro da quando si mangia (o da adesso, se «prima possibile»).
export function pianifica(r, quando, now = new Date()) {
  const T = tempi(r);
  const pronto = quando ? quando.getTime() : now.getTime() + 10 * M + T.total * H;
  const sforna = pronto - T.cool * H, inforna = sforna - T.bake * H, appretto = inforna - T.proof * H;
  const forma = appretto - 0.25 * H, puntata = forma - T.bulk * H, impasto = puntata - 0.5 * H;
  const passi = [];
  if (T.rinfresco) passi.push({ k: "rinfresco", at: impasto - T.rinfresco * H, min: 10 });
  if (T.pre) passi.push({ k: "pre", at: impasto - T.pre * H, min: 10 });
  passi.push({ k: "impasto", at: impasto, min: 30 });
  passi.push({ k: T.lievita ? "puntata" : "riposo", at: puntata, min: Math.round(T.bulk * 60) });
  passi.push({ k: "forma", at: forma, min: 15 });
  if (T.proof > 0) passi.push({ k: "appretto", at: appretto, min: Math.round(T.proof * 60) });
  passi.push({ k: "accendi", at: inforna - 45 * M, min: 45 });
  passi.push({ k: "cottura", at: inforna, min: Math.round(T.bake * 60) });
  passi.push({ k: "pronto", at: pronto, min: 0 });
  const cinque = 5 * M;
  passi.forEach((x) => { if (x.k !== "pronto") x.at = Math.floor(x.at / cinque) * cinque; }); // orari tondi, mai in ritardo
  // Niente sveglie di notte: se la biga, il poolish o il rinfresco cadono tra le 23 e le 6:30, si spostano alla sera prima
  // (prefermento più lungo, fino a 4 ore) o al mattino (più corto, fino a 3 ore): i prefermenti lo reggono.
  const primo = passi.find((x) => x.k === "pre" || x.k === "rinfresco");
  if (primo && diNotte(primo.at)) {
    const d = new Date(primo.at); const sera = new Date(d); if (d.getHours() < 12) sera.setDate(sera.getDate() - 1); sera.setHours(22, 0, 0, 0);
    const mattina = new Date(d); if (d.getHours() >= 12) mattina.setDate(mattina.getDate() + 1); mattina.setHours(6, 30, 0, 0);
    const imp = passi.find((x) => x.k === "impasto").at;
    if (primo.at - sera.getTime() <= 4 * H) primo.at = sera.getTime();
    else if (mattina.getTime() - primo.at <= 3 * H && imp - mattina.getTime() >= (primo.k === "pre" ? 8 : 3) * H) primo.at = mattina.getTime();
  }
  passi.sort((a, b) => a.at - b.at);
  const notte = passi.some((x) => ATTIVI.has(x.k) && diNotte(x.at));
  return { passi, T, pronto, inizio: passi[0].at, notte };
}

const ATTIVI = new Set(["rinfresco", "pre", "impasto", "forma", "accendi", "cottura"]);
export function diNotte(at) { const d = new Date(at); const hm = d.getHours() * 60 + d.getMinutes(); return hm >= 23 * 60 || hm < 6 * 60 + 30; }

export const leggiPiano = () => { const p = LS.get(PIANO_KEY, null); return p && p.id && Array.isArray(p.passi) ? p : null; };
export const salvaPiano = (p) => { if (p) LS.set(PIANO_KEY, p); else LS.del(PIANO_KEY); try { window.dispatchEvent(new CustomEvent("mikilab-piano-sitor")); } catch { /* */ } };
export const leggiDiario = () => { const d = LS.get(DIARIO_KEY, {}); return d && typeof d === "object" ? d : {}; };
export function annotaDiario(id, voce) {
  const d = leggiDiario(); const l = Array.isArray(d[id]) ? d[id] : [];
  d[id] = [...l, voce].slice(-5); LS.set(DIARIO_KEY, d); return d;
}
// Il passo in corso e il prossimo, rispetto all'ora di adesso.
export function aCheePunto(p, now = Date.now()) {
  const fatti = new Set(p.fatti || []);
  const prossimo = p.passi.find((s) => !fatti.has(s.k) && s.k !== "pronto" && s.at + (s.min || 0) * M > now) || null;
  const finito = now >= p.pronto - 15 * M || p.passi.every((s) => s.k === "pronto" || fatti.has(s.k));
  return { prossimo, finito, fatti };
}
