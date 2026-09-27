// V127 — IL MOTORE DELLA CALCOLATRICE DEL FORNAIO.
// Tutto gira nel browser: nessuna chiamata di rete, nessun dato inviato. Le ricette di Michele non passano di qui:
// questo motore lavora solo sulle formule scritte da chi usa il sito (le dosi del ricettario restano intoccabili).
//
// Convenzioni (le stesse delle ricette di MikiLab):
//  • «Farina» = la farina che pesi per l'impasto. Con biga e poolish comprende anche quella del prefermento
//    (la biga si fa con una parte della farina). Con lievito madre e licoli NON comprende la farina che sta
//    dentro il lievito (si dice «lievito madre al 20 % sulla farina»).
//  • Acqua, sale, lievito e ingredienti in più sono in % su quella farina (farina = 100).
//  • «Idratazione reale» e TA contano TUTTA l'acqua e TUTTA la farina: anche quelle del lievito madre e l'acqua
//    di latte, uova, patata e burro (come le Bäckerprozente del Gesamtteig tedesco).
//
// Modelli: sono punti di partenza, non verità. L'impasto si guarda, non si cronometra.
//  • velocità del lievito: circa il doppio ogni +8 °C, riferita a 25 °C (come gli altri attrezzi del sito); in frigo
//    (4-5 °C) circa 1/8, dopo 3 ore per raffreddarsi;
//  • lievito di birra nel pane: 3,36 / ore^1,2 (ore equivalenti a 25 °C) → 2 h ≈ 1,5 %, 3 h ≈ 0,9 %, 8 h ≈ 0,27 %;
//    un po' di più con tanto zucchero o tanti grassi;
//  • lievito di birra nella pizza: formula «Japi» dei forum dei pizzaioli (coefficiente 2250), valida tra 15 e 35 °C
//    e tra 1 e 96 ore; la pizza cresce meno del pane, quindi ne chiede meno;
//  • lievito madre: 20 % di lievito solido ≈ 8 ore in tutto a 25 °C; ogni volta che lo dimezzi servono circa 2 ore in più;
//  • poolish: tabella classica (3 h 1,5 %; 7-8 h 0,7 %; 12-15 h 0,1 % sulla farina del poolish, a 20 °C);
//  • rinfresco del lievito madre: picco in (2 × log2(diluizione) + 1,6) ore a 25 °C;
//  • acqua giusta: T acqua = T impasto × N − (aria + farina [+ prefermento]) − attrito (come «Acqua giusta»).

export const L = (o, lang) => (o == null ? "" : typeof o === "string" ? o : (o[lang] != null ? o[lang] : (o.it != null ? o.it : "")));
export const num = (v, d = 0) => { const n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return Number.isFinite(n) ? n : d; };
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const T3 = (it, de, en) => ({ it, de, en });
const pick3 = (lang) => (it, de, en) => (lang === "de" ? de : lang === "en" ? en : it);

// ------------------------------------------------------------------ numeri scritti bene
export const localeOf = (lang) => (lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT");
export function fmtN(n, dec, lang) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "–";
  const p = Math.pow(10, dec);
  return (Math.round(x * p) / p).toLocaleString(localeOf(lang), { minimumFractionDigits: 0, maximumFractionDigits: dec });
}
export function fmtG(g, lang) {
  const x = Number(g) || 0;
  const a = Math.abs(x);
  if (a >= 10) return `${fmtN(x, 0, lang)} g`;
  if (a >= 1) return `${fmtN(x, 1, lang)} g`;
  return `${fmtN(x, 2, lang)} g`;
}
export const fmtP = (p, lang, dec = 1) => `${fmtN(p, dec, lang)} %`;
export function fmtOre(h, lang) {
  const x = Math.max(0, Number(h) || 0);
  if (x < 1) return `${Math.max(1, Math.round(x * 60))} min`;
  let hh = Math.floor(x), mm = Math.round((x - hh) * 60);
  if (mm === 60) { hh += 1; mm = 0; }
  return mm ? `${hh} h ${mm} min` : `${hh} h`;
}
export const fmtOra = (d, lang) => d.toLocaleTimeString(localeOf(lang), { hour: "2-digit", minute: "2-digit" });
export const fmtGiorno = (d, lang) => d.toLocaleDateString(localeOf(lang), { weekday: "short", day: "numeric", month: "short" });

// ------------------------------------------------------------------ tempo e lievito
export function fac(tempC) {
  const t = num(tempC, 22);
  if (t <= 8) return 0.12;
  if (t < 12) return 0.12 + ((t - 8) / 4) * (Math.pow(2, (12 - 25) / 8) - 0.12);
  return Math.pow(2, (t - 25) / 8);
}

// Ore di lievitazione «equivalenti a 25 °C»: le ore fuori dal frigo alla temperatura della cucina, più il frigo
// (le prime 3 ore l'impasto si sta ancora raffreddando).
export function oreEquivalenti(h, T, fr) {
  const room = Math.max(0, num(h)) * fac(T);
  const f = Math.max(0, num(fr));
  let cold = 0;
  if (f > 0) { const cool = Math.min(f, 3); cold = cool * fac((num(T, 22) + 5) / 2) + (f - cool) * fac(5); }
  return room + cold;
}

// Lievito di birra fresco (% sulla farina) per il pane.
export function panePct(te, zuccheroPct, grassoPct) {
  const base = 3.36 / Math.pow(Math.max(0.75, te), 1.2);
  const z = zuccheroPct > 5 ? 1 + (zuccheroPct - 5) / 15 : 1;
  const g = grassoPct > 5 ? 1 + (grassoPct - 5) / 30 : 1;
  return clamp(base * z * g, 0.03, 4);
}

// Formula «Japi» (pizza): grammi di lievito fresco = farina × 2250 × (1 + sale/200) × (1 + grassi/300)
//   / ((−80 + 4,2 i − 0,0305 i²) × gradi^2,5 × ore^1,2); sale e grassi in grammi per litro d'acqua, i = idratazione.
export function japiPct(idr, salePct, grassoPct, T, ore) {
  const i = clamp(num(idr, 62), 50, 100);
  const s = clamp(i > 0 ? (salePct / i) * 1000 : 0, 0, 60);
  const o = clamp(i > 0 ? (grassoPct / i) * 1000 : 0, 0, 60);
  const g = clamp(num(T, 22), 15, 35);
  const t = clamp(num(ore, 8), 1, 96);
  const idro = -80 + 4.2 * i - 0.0305 * i * i;
  return clamp(((2250 * (1 + s / 200) * (1 + o / 300)) / (idro * Math.pow(g, 2.5) * Math.pow(t, 1.2))) * 100, 0.01, 4);
}

// Lievito madre (% sulla farina) per stare nei tempi: lh = idratazione del lievito come frazione (0,5 solido, 1 licoli).
export function lmPctRaw(te, lh) {
  const farinaDentro = 13.33 / Math.pow(2, (te - 8) / 2);
  return farinaDentro * (1 + lh);
}
export function oreLm(lp, lh) { // ore a 25 °C con quel lievito madre
  const farinaDentro = Math.max(0.5, lp / (1 + lh));
  return 8 + 2 * Math.log2(13.33 / farinaDentro);
}

const POOLISH = [[3, 1.5], [5, 1.0], [7.5, 0.7], [10, 0.35], [12, 0.15], [14, 0.1], [18, 0.06], [24, 0.04], [36, 0.03]];
export function poolishLievito(ore, temp) { // % di lievito fresco sulla farina del poolish
  const h20 = (Math.max(1, num(ore, 12)) * fac(temp)) / fac(20);
  if (h20 <= POOLISH[0][0]) return POOLISH[0][1];
  for (let i = 1; i < POOLISH.length; i++) {
    const [h1, y1] = POOLISH[i - 1];
    const [h2, y2] = POOLISH[i];
    if (h20 <= h2) {
      const t = (Math.log(h20) - Math.log(h1)) / (Math.log(h2) - Math.log(h1));
      return Math.exp(Math.log(y1) + t * (Math.log(y2) - Math.log(y1)));
    }
  }
  return POOLISH[POOLISH.length - 1][1];
}

// Rinfresco: «1 : r : r×idr» (lievito : farina : acqua). Ore al picco alla temperatura data.
export function orePicco(r, idr, temp) {
  const D = 1 + r * (1 + idr);
  return (2 * Math.log2(D) + 1.6) / fac(temp);
}
export const RAPPORTI = [0.5, 1, 1.5, 2, 3, 4, 5, 7, 10, 15, 20];

// Il lievito pronto all'ora giusta: quanto rinfrescare adesso per averne «need» grammi al picco fra «ore».
export function lievitoPronto({ need, keep, idr, temp, ore }) {
  const B = Math.max(10, num(need, 200)) + Math.max(0, num(keep, 0));
  const lh = clamp(num(idr, 0.5), 0.35, 1.3);
  const disp = Math.max(0, num(ore, 8));
  let r = null;
  RAPPORTI.forEach((x) => { if (orePicco(x, lh, temp) <= disp + 0.25) r = x; });
  const stato = r == null ? "presto" : (r === RAPPORTI[RAPPORTI.length - 1] && disp - orePicco(r, lh, temp) > 2 ? "tardi" : "ok");
  const rr = r == null ? RAPPORTI[0] : r;
  const D = 1 + rr * (1 + lh);
  const seme = B / D;
  return { r: rr, stato, seme, farina: seme * rr, acqua: seme * rr * lh, tot: B, picco: orePicco(rr, lh, temp), idr: lh };
}

// ------------------------------------------------------------------ farine, ingredienti, stili
export const FARINE = [
  { k: "00", n: T3("Farina 00", "Weizenmehl Type 405", "Type 00 flour"), abs: 0 },
  { k: "0", n: T3("Farina 0", "Weizenmehl Type 550", "Type 0 (bread) flour"), abs: 1 },
  { k: "manitoba", n: T3("Manitoba (farina forte)", "Manitoba (Kraftmehl)", "Manitoba (strong flour)"), abs: 5 },
  { k: "1", n: T3("Farina tipo 1", "Weizenmehl Type 812/1050", "Type 1 flour"), abs: 3 },
  { k: "2", n: T3("Farina tipo 2", "Weizenmehl Type 1050/1600", "Type 2 flour"), abs: 5 },
  { k: "integrale", n: T3("Integrale di grano tenero", "Weizenvollkornmehl", "Wholemeal wheat flour"), abs: 8, integrale: true },
  { k: "semola", n: T3("Semola rimacinata", "Hartweizenmehl (Semola rimacinata)", "Re-milled durum semolina"), abs: 3 },
  { k: "farro", n: T3("Farro (spelta)", "Dinkelmehl Type 630", "Spelt flour"), abs: -4, farro: true },
  { k: "farroint", n: T3("Farro integrale", "Dinkelvollkornmehl", "Wholemeal spelt"), abs: 3, farro: true, integrale: true },
  { k: "segale", n: T3("Segale", "Roggenmehl Type 997/1150", "Rye flour"), abs: 10, segale: true },
  { k: "segaleint", n: T3("Segale integrale", "Roggenvollkornmehl", "Wholemeal rye"), abs: 15, segale: true, integrale: true },
  { k: "altra", n: T3("Altra farina", "Anderes Mehl", "Other flour"), abs: 0 },
];
export const farina = (k) => FARINE.find((x) => x.k === k) || FARINE[FARINE.length - 1];

// w = acqua contenuta (%), grasso / zucchero = quota che conta come grasso o zucchero per il lievito
export const EXTRA = [
  { k: "olio", n: T3("Olio extravergine d'oliva", "Olivenöl", "Olive oil"), w: 0, grasso: 1, def: 3 },
  { k: "burro", n: T3("Burro", "Butter", "Butter"), w: 16, grasso: 0.82, def: 10 },
  { k: "strutto", n: T3("Strutto", "Schweineschmalz", "Lard"), w: 0, grasso: 1, def: 3 },
  { k: "kokos", n: T3("Grasso di cocco (Kokosfett)", "Kokosfett", "Coconut fat (Kokosfett)"), w: 0, grasso: 1, def: 1 },
  { k: "zucchero", n: T3("Zucchero", "Zucker", "Sugar"), w: 0, zucchero: 1, def: 5 },
  { k: "miele", n: T3("Miele", "Honig", "Honey"), w: 17, zucchero: 0.8, def: 3 },
  { k: "malto", n: T3("Malto diastasico in polvere", "Backmalz, enzymaktiv (Pulver)", "Diastatic malt powder"), w: 0, def: 1 },
  { k: "maltosciroppo", n: T3("Malto d'orzo (sciroppo)", "Gerstenmalzsirup", "Barley malt syrup"), w: 20, zucchero: 0.6, def: 2 },
  { k: "latte", n: T3("Latte intero", "Vollmilch", "Whole milk"), w: 87, def: 30 },
  { k: "uova", n: T3("Uova intere (senza guscio)", "Vollei (ohne Schale)", "Whole eggs (no shell)"), w: 75, def: 10 },
  { k: "tuorli", n: T3("Tuorli", "Eigelb", "Egg yolks"), w: 50, grasso: 0.27, def: 5 },
  { k: "patata", n: T3("Patata lessa schiacciata", "Gekochte Kartoffel, zerdrückt", "Boiled mashed potato"), w: 78, def: 15 },
  { k: "yogurt", n: T3("Yogurt bianco", "Naturjoghurt", "Plain yoghurt"), w: 85, def: 10 },
  { k: "aceto", n: T3("Aceto di mele", "Apfelessig", "Apple cider vinegar"), w: 94, def: 1 },
  { k: "miglioratore", n: T3("Miglioratore naturale MikiLab", "MikiLab Natur-Backmittel", "MikiLab natural improver"), w: 0, def: 2 },
  { k: "semi", n: T3("Semi misti (asciutti)", "Saaten (trocken)", "Mixed seeds (dry)"), w: 0, def: 10 },
];
export const extraOf = (k) => EXTRA.find((x) => x.k === k);

export const LIEVITI = ["diretto", "biga", "poolish", "lm", "licoli", "nessuno"];
export const TIPI_LIEVITO = { fresco: 1, secco: 0.5, istantaneo: 1 / 3 };
export const ATTRITO = { mano: 3, planetaria: 9, spirale: 13 };

// fam: pane | focaccia | pizza | dolce | libero. idr / sal: di solito (idratazione reale e sale sulla farina).
// cal: calo di cottura (%). forno: temperatura, minuti, vapore. pw: peso di un pezzo tipico.
export const STILI = {
  pane: { fam: "pane", n: T3("Pane di tutti i giorni", "Brot für jeden Tag", "Everyday bread"), m: "pezzi", pc: 2, pw: 600, bl: [["0", 100]], hy: 65, sa: 2.0, lv: "diretto", h: 5, T: 22, dd: 25, cal: 12, forno: { t: 230, min: 40, vap: true }, idr: [60, 72], sal: [1.8, 2.4], brosel: true, michele: true },
  pagnotta: { fam: "pane", n: T3("Pagnotta al lievito madre", "Sauerteiglaib", "Sourdough loaf"), m: "pezzi", pc: 1, pw: 900, bl: [["0", 80], ["integrale", 20]], hy: 74, sa: 2.2, lv: "lm", lh: 50, h: 9, T: 24, dd: 26, cal: 14, forno: { t: 240, min: 45, vap: true }, idr: [68, 82], sal: [1.9, 2.4], brosel: true, michele: true },
  baguette: { fam: "pane", n: T3("Baguette", "Baguette", "Baguette"), m: "pezzi", pc: 3, pw: 300, bl: [["0", 100]], hy: 68, sa: 2.0, lv: "poolish", pp: 30, ph: 100, pH: 14, pT: 20, yp: 0.2, h: 3, T: 22, dd: 24, cal: 18, forno: { t: 250, min: 22, vap: true }, idr: [65, 75], sal: [1.8, 2.2], brosel: true, michele: true },
  ciabatta: { fam: "pane", n: T3("Ciabatta", "Ciabatta", "Ciabatta"), m: "pezzi", pc: 4, pw: 350, bl: [["0", 100]], hy: 78, sa: 2.2, lv: "biga", pp: 50, ph: 45, py: 1, pH: 18, pT: 18, yp: 0.2, h: 2.5, T: 24, dd: 25, cal: 16, forno: { t: 240, min: 25, vap: true }, idr: [74, 86], sal: [2.0, 2.4], brosel: true, michele: true },
  segale: { fam: "pane", n: T3("Pane di segale (misto)", "Roggenmischbrot", "Rye-wheat bread"), m: "pezzi", pc: 1, pw: 1000, bl: [["segale", 60], ["0", 40]], hy: 70, sa: 2.0, lv: "licoli", lh: 100, lp: 35, ya: false, yp: 0.5, h: 2.5, T: 28, dd: 28, cal: 11, forno: { t: 250, min: 55, vap: true }, idr: [70, 82], sal: [1.8, 2.3], brosel: true, michele: false },
  panini: { fam: "pane", n: T3("Panini morbidi", "Weiche Brötchen", "Soft rolls"), m: "pezzi", pc: 10, pw: 80, bl: [["0", 100]], hy: 20, sa: 1.8, ex: [["latte", 40], ["burro", 8], ["zucchero", 5]], lv: "diretto", h: 3, T: 25, dd: 26, cal: 11, forno: { t: 200, min: 18, vap: false }, idr: [52, 62], sal: [1.6, 2.2], brosel: true, michele: false },
  brezel: { fam: "pane", n: T3("Brezel e Laugen", "Brezeln und Laugengebäck", "Pretzels and lye rolls"), m: "pezzi", pc: 8, pw: 90, bl: [["0", 100]], hy: 56, sa: 2.0, ex: [["burro", 4], ["malto", 1]], lv: "diretto", h: 2.5, T: 22, dd: 24, cal: 10, forno: { t: 220, min: 16, vap: false }, idr: [52, 60], sal: [1.8, 2.3], brosel: true, michele: false },
  focaccia: { fam: "focaccia", n: T3("Focaccia in teglia (come Michele)", "Blech-Focaccia (wie Michele)", "Pan focaccia (Michele's way)"), m: "teglia", tg: { s: "rett", a: 30, b: 40, k: 1, sp: 0.6 }, bl: [["0", 100]], hy: 72, sa: 2.4, ex: [["patata", 15], ["olio", 3]], lv: "biga", pp: 30, ph: 45, py: 1, pH: 16, pT: 18, yp: 0.2, h: 4, T: 24, dd: 25, cal: 10, forno: { t: 230, min: 22, vap: false }, idr: [72, 90], sal: [2.0, 2.8], brosel: true, michele: false },
  napoletana: { fam: "pizza", n: T3("Pizza napoletana", "Neapolitanische Pizza", "Neapolitan pizza"), m: "pezzi", pc: 6, pw: 270, bl: [["00", 100]], hy: 62, sa: 2.8, lv: "diretto", h: 10, T: 22, fr: 0, dd: 24, cal: 8, forno: { t: 280, min: 7, vap: false }, idr: [58, 68], sal: [2.3, 3.1], pizza: true },
  teglia: { fam: "pizza", n: T3("Pizza in teglia (romana)", "Blechpizza (römisch)", "Roman pan pizza"), m: "teglia", tg: { s: "rett", a: 30, b: 40, k: 1, sp: 0.6 }, bl: [["0", 100]], hy: 78, sa: 2.5, ex: [["olio", 2.5]], lv: "diretto", h: 4, T: 22, fr: 24, dd: 22, cal: 10, forno: { t: 250, min: 18, vap: false }, idr: [72, 86], sal: [2.2, 2.8], pizza: true },
  tonda: { fam: "pizza", n: T3("Pizza tonda sottile", "Dünne runde Pizza", "Thin round pizza"), m: "pezzi", pc: 4, pw: 190, bl: [["0", 100]], hy: 58, sa: 2.4, ex: [["olio", 4]], lv: "diretto", h: 6, T: 22, fr: 24, dd: 23, cal: 8, forno: { t: 280, min: 7, vap: false }, idr: [54, 62], sal: [2.0, 2.7], pizza: true },
  brioche: { fam: "dolce", n: T3("Pan brioche", "Brioche-Hefeteig", "Brioche loaf"), m: "pezzi", pc: 1, pw: 800, bl: [["manitoba", 100]], hy: 0, sa: 1.5, ex: [["latte", 40], ["uova", 20], ["burro", 20], ["zucchero", 12]], lv: "diretto", h: 4, T: 26, dd: 26, cal: 10, forno: { t: 180, min: 35, vap: false }, idr: [48, 60], sal: [1.2, 2.0], brosel: false, michele: false },
  libero: { fam: "libero", n: T3("Impasto libero", "Freier Teig", "Free dough"), m: "farina", fl: 1000, bl: [["0", 100]], hy: 65, sa: 2.0, lv: "diretto", h: 4, T: 22, dd: 25, cal: 12, forno: { t: 230, min: 35, vap: true }, idr: [40, 100], sal: [0, 3.5], brosel: true, michele: true },
};
export const GRUPPI = [
  { k: "pane", t: T3("Pane", "Brot", "Bread"), s: ["pane", "pagnotta", "baguette", "ciabatta", "segale", "panini", "brezel"] },
  { k: "pizza", t: T3("Pizza e focaccia", "Pizza und Focaccia", "Pizza and focaccia"), s: ["napoletana", "teglia", "tonda", "focaccia"] },
  { k: "dolce", t: T3("Lievitati dolci", "Süße Hefeteige", "Sweet doughs"), s: ["brioche"] },
  { k: "libero", t: T3("Da zero", "Von null", "From scratch"), s: ["libero"] },
];

const BASE = { v: 1, n: "", m: "pezzi", fl: 1000, dg: 1600, pc: 2, pw: 600, lo: 1, tg: { s: "rett", a: 30, b: 40, k: 1, sp: 0.6 }, bl: [["0", 100]], hy: 65, sa: 2, lv: "diretto", yt: "fresco", ya: true, yp: 0, lp: 20, lh: 50, pp: 30, ph: 45, py: 1, pH: 16, pT: 18, ex: [], h: 4, T: 22, fr: 0, dd: 25, mx: "mano", ac: 15, br: false, mm: false, at: "19:00", gg: 1, fo: "casa" };
const CAMPI = Object.keys(BASE);

export function nuovaFormula(stKey) {
  const k = STILI[stKey] ? stKey : "libero";
  const s = STILI[k];
  const f = JSON.parse(JSON.stringify(BASE));
  CAMPI.forEach((c) => { if (c !== "n" && s[c] !== undefined) f[c] = JSON.parse(JSON.stringify(s[c])); }); // «n» dello stile è il suo nome, non quello della formula
  f.st = k;
  if (f.lv === "licoli" && s.lh === undefined) f.lh = 100;
  if (f.lv !== "diretto" && s.yp === undefined) f.yp = 0;
  if (s.ya === undefined) f.ya = true;
  return f;
}

// Completa una formula letta da localStorage o da un link (valori mancanti = quelli dello stile).
export function completa(o) {
  if (!o || typeof o !== "object") return nuovaFormula("pane");
  const base = nuovaFormula(STILI[o.st] ? o.st : "libero");
  const f = { ...base };
  CAMPI.forEach((c) => { if (o[c] !== undefined && o[c] !== null) f[c] = o[c]; });
  f.st = base.st;
  return f;
}

// Pulisce una formula arrivata da fuori (link condiviso): solo campi noti, numeri nei limiti, testi corti.
export function sanifica(o) {
  if (!o || typeof o !== "object") return null;
  const b = nuovaFormula(STILI[o.st] ? o.st : "libero");
  const n = (k, a, z) => (o[k] === undefined ? b[k] : clamp(num(o[k], b[k]), a, z));
  const f = {
    ...b,
    n: (typeof o.n === "string" ? o.n : "").replace(/[\u0000-\u001f]/g, " ").slice(0, 60),
    m: ["pezzi", "farina", "impasto", "teglia"].includes(o.m) ? o.m : b.m,
    fl: n("fl", 10, 200000), dg: n("dg", 20, 400000), pc: Math.round(n("pc", 1, 500)), pw: n("pw", 10, 5000), lo: n("lo", 0, 15),
    hy: n("hy", 0, 130), sa: n("sa", 0, 6), lv: LIEVITI.includes(o.lv) ? o.lv : b.lv, yt: TIPI_LIEVITO[o.yt] ? o.yt : b.yt,
    ya: o.ya === undefined ? b.ya : !!o.ya, yp: n("yp", 0, 10), lp: n("lp", 0, 80), lh: n("lh", 35, 130),
    pp: n("pp", 5, 100), ph: n("ph", 30, 130), py: n("py", 0, 5), pH: n("pH", 1, 96), pT: n("pT", 2, 35),
    h: n("h", 0, 120), T: n("T", 2, 40), fr: n("fr", 0, 150), dd: n("dd", 15, 35), mx: ATTRITO[o.mx] != null ? o.mx : b.mx,
    ac: n("ac", 1, 40), br: !!o.br, mm: !!o.mm, at: /^\d{1,2}:\d{2}$/.test(String(o.at || "")) ? o.at : b.at, gg: Math.round(n("gg", 0, 3)),
    fo: o.fo === "legna" ? "legna" : "casa",
  };
  const t = o.tg && typeof o.tg === "object" ? o.tg : {};
  f.tg = { s: t.s === "tondo" ? "tondo" : "rett", a: clamp(num(t.a, b.tg.a), 5, 200), b: clamp(num(t.b, b.tg.b), 5, 200), k: Math.round(clamp(num(t.k, 1), 1, 20)), sp: clamp(num(t.sp, b.tg.sp), 0.2, 1.5) };
  const bl = Array.isArray(o.bl) ? o.bl.slice(0, 4).filter(Array.isArray).map((x) => [farina(x[0]).k, clamp(num(x[1]), 0, 100)]) : [];
  f.bl = bl.length ? bl : b.bl;
  f.ex = Array.isArray(o.ex) ? o.ex.slice(0, 12).filter(Array.isArray).map((x) => (x[0] === "x"
    ? ["x", clamp(num(x[1]), 0, 200), String(x[2] || "").replace(/[\u0000-\u001f]/g, " ").slice(0, 40), clamp(num(x[3]), 0, 100)]
    : extraOf(x[0]) ? [x[0], clamp(num(x[1]), 0, 200)] : null)).filter(Boolean) : b.ex;
  return f;
}

// Link di condivisione: la formula va dopo il segno # (il browser non lo manda a nessun server).
const aB64 = (str) => { const bytes = new TextEncoder().encode(str); let bin = ""; bytes.forEach((x) => { bin += String.fromCharCode(x); }); return btoa(bin); };
const daB64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
export function codifica(f) {
  const o = {};
  CAMPI.forEach((c) => { if (f[c] !== undefined && f[c] !== "") o[c] = f[c]; });
  o.st = f.st;
  return aB64(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodifica(s) {
  try {
    let b = String(s || "").trim().replace(/-/g, "+").replace(/_/g, "/");
    if (!b || b.length > 6000) return null;
    while (b.length % 4) b += "=";
    return sanifica(JSON.parse(daB64(b)));
  } catch { return null; }
}

// ------------------------------------------------------------------ il calcolo
function miscela(bl) {
  const m = new Map();
  (Array.isArray(bl) ? bl : []).forEach((x) => {
    if (!Array.isArray(x)) return;
    const p = Math.max(0, num(x[1]));
    if (p > 0) { const k = farina(x[0]).k; m.set(k, (m.get(k) || 0) + p); }
  });
  const tot = [...m.values()].reduce((a, p) => a + p, 0);
  if (!m.size || tot <= 0) return [{ k: "0", frac: 1 }];
  return [...m.entries()].map(([k, p]) => ({ k, frac: p / tot }));
}

function ingredienti(f, st) {
  const out = [];
  (Array.isArray(f.ex) ? f.ex : []).forEach((x) => {
    if (!Array.isArray(x)) return;
    const pct = Math.max(0, num(x[1]));
    if (pct <= 0) return;
    if (x[0] === "x") {
      const nm = String(x[2] || "").trim();
      if (nm) out.push({ k: "x", n: nm, pct, w: clamp(num(x[3]), 0, 100) / 100, grasso: 0, zucchero: 0 });
      return;
    }
    const e = extraOf(x[0]);
    if (e) out.push({ k: e.k, n: e.n, pct, w: e.w / 100, grasso: e.grasso || 0, zucchero: e.zucchero || 0 });
  });
  if (f.mm && st.michele && !out.some((e) => e.k === "burro")) {
    [["olio", 1], ["aceto", 1], ["kokos", 1]].forEach(([k, p]) => {
      if (!out.some((e) => e.k === k)) { const e = extraOf(k); out.push({ k, n: e.n, pct: p, w: e.w / 100, grasso: e.grasso || 0, zucchero: 0, michele: true }); }
    });
  }
  return out;
}

const ORD_EXTRA = { latte: 3, uova: 3, tuorli: 3, yogurt: 3, patata: 4, miele: 4, maltosciroppo: 4, zucchero: 4, malto: 4, miglioratore: 4, x: 4, aceto: 9, kokos: 10, burro: 10, strutto: 10, olio: 11, semi: 12 };
export const NOMI = {
  acqua: T3("Acqua", "Wasser", "Water"),
  sale: T3("Sale", "Salz", "Salt"),
  fresco: T3("Lievito di birra fresco", "Frischhefe", "Fresh yeast"),
  secco: T3("Lievito di birra secco attivo", "Trockenhefe (aktiv)", "Active dry yeast"),
  istantaneo: T3("Lievito secco istantaneo", "Trockenhefe (instant)", "Instant dry yeast"),
  biga: T3("La biga, tutta", "Die ganze Biga", "All the biga"),
  poolish: T3("Il poolish, tutto", "Den ganzen Poolish", "All the poolish"),
  lm: T3("Lievito madre solido, al picco", "Fester Sauerteig, aktiv", "Stiff starter, at its peak"),
  licoli: T3("Licoli (lievito madre liquido), al picco", "Flüssiger Sauerteig, aktiv", "Liquid starter, at its peak"),
  brosel: T3("Il Brösel ammollato, tutto", "Die eingeweichten Brösel, alles", "The soaked breadcrumbs, all"),
  broselPane: T3("Pane grattugiato secco (Brösel)", "Semmelbrösel, trocken", "Dry breadcrumbs"),
};

export function calcola(fIn) {
  const f = completa(fIn);
  const st = STILI[f.st] || STILI.libero;
  const W = clamp(num(f.hy), 0, 130) / 100;
  const S = clamp(num(f.sa), 0, 6) / 100;
  const yt = TIPI_LIEVITO[f.yt] ? f.yt : "fresco";
  const kY = TIPI_LIEVITO[yt];
  const ex = ingredienti(f, st);
  const E = ex.reduce((a, e) => a + e.pct, 0) / 100;
  const grassoPct = ex.reduce((a, e) => a + e.pct * e.grasso, 0);
  const zuccheroPct = ex.reduce((a, e) => a + e.pct * e.zucchero, 0);
  const acquaExtraPct = ex.reduce((a, e) => a + e.pct * e.w, 0);
  const T = clamp(num(f.T, 22), 2, 40);
  const h = clamp(num(f.h, 4), 0, 120);
  const fr = clamp(num(f.fr, 0), 0, 150);
  const te = oreEquivalenti(h, T, fr);
  const lv = LIEVITI.includes(f.lv) ? f.lv : "diretto";
  const pizza = !!st.pizza;

  // lievito di birra nell'impasto (in «fresco», % sulla farina)
  let yFresh = 0, yAuto = false, yModel = null;
  if (lv === "diretto") {
    if (f.ya) {
      yAuto = true; yModel = pizza ? "pizza" : "pane";
      yFresh = pizza ? japiPct(W * 100 + acquaExtraPct, S * 100, grassoPct, T, te / fac(T)) : panePct(te, zuccheroPct, grassoPct);
    } else yFresh = Math.max(0, num(f.yp)) / kY;
  } else if (lv !== "nessuno") yFresh = Math.max(0, num(f.yp)) / kY;

  // prefermento
  let pre = null;
  if (lv === "biga" || lv === "poolish") {
    const pp = clamp(num(f.pp, 30), 5, 100) / 100;
    const ph = clamp(num(f.ph, lv === "poolish" ? 100 : 45), 30, 130) / 100;
    const ore = clamp(num(f.pH, 16), 1, 96), temp = clamp(num(f.pT, 18), 2, 35);
    let pyFresh, auto = false;
    if (lv === "poolish" && f.ya) { pyFresh = poolishLievito(ore, temp); auto = true; } else pyFresh = Math.max(0, num(f.py, 1)) / kY;
    pre = { kind: lv, pp, ph, ore, temp, pyFresh, auto };
  }
  // lievito madre
  let lm = null;
  if (lv === "lm" || lv === "licoli") {
    const lh = clamp(num(f.lh, lv === "licoli" ? 100 : 50), 35, 130) / 100;
    let lp, auto = false, limite = null;
    if (f.ya) { auto = true; const raw = lmPctRaw(te, lh); lp = clamp(raw, 5, 35); if (raw > 35.5) limite = "poco"; else if (raw < 4.5) limite = "tanto"; } else lp = clamp(num(f.lp, 20), 0, 80);
    lm = { lp: lp / 100, lh, auto, limite, picco11: orePicco(1, lh, T) };
  }
  const broselOn = !!f.br && st.brosel !== false;

  // grammi di impasto per ogni grammo di farina
  let P = 1 + W + S + E + (yFresh * kY) / 100;
  if (pre) P += (pre.pp * pre.pyFresh * kY) / 100;
  if (lm) P += lm.lp;
  if (broselOn) P += 0.2;

  const lo = clamp(num(f.lo, 1), 0, 15) / 100;
  const m = ["pezzi", "farina", "impasto", "teglia"].includes(f.m) ? f.m : "pezzi";
  const tg = f.tg && typeof f.tg === "object" ? f.tg : BASE.tg;
  const nTeglie = Math.round(clamp(num(tg.k, 1), 1, 20));
  let F, area = 0;
  if (m === "farina") F = clamp(num(f.fl, 1000), 10, 200000);
  else if (m === "impasto") F = clamp(num(f.dg, 1600), 20, 400000) / P;
  else if (m === "teglia") {
    area = tg.s === "tondo" ? Math.PI * Math.pow(clamp(num(tg.a, 30), 5, 200) / 2, 2) : clamp(num(tg.a, 30), 5, 200) * clamp(num(tg.b, 40), 5, 200);
    F = (area * clamp(num(tg.sp, 0.6), 0.2, 1.5) * nTeglie * (1 + lo)) / P;
  } else F = (Math.round(clamp(num(f.pc, 1), 1, 500)) * clamp(num(f.pw, 500), 10, 5000) * (1 + lo)) / P;

  // farine (la biga e il poolish si fanno con la prima farina della lista)
  const mix = miscela(f.bl);
  let farine = mix.map((x) => ({ k: x.k, g: F * x.frac }));
  const farinePre = [];
  let PF = 0, PW = 0, PY = 0;
  if (pre) {
    PF = F * pre.pp; PW = PF * pre.ph; PY = (PF * pre.pyFresh * kY) / 100;
    let need = PF;
    for (const x of farine) { if (need <= 1e-6) break; const take = Math.min(x.g, need); if (take > 0) { farinePre.push({ k: x.k, g: take }); x.g -= take; need -= take; } }
    farine = farine.filter((x) => x.g > 0.05);
  }
  const Lg = lm ? F * lm.lp : 0, LF = lm ? Lg / (1 + lm.lh) : 0, LW = Lg - LF;
  const acquaTot = F * W;
  const acquaMain = acquaTot - PW;
  const Yg = (F * yFresh * kY) / 100;
  const Sg = F * S;
  const exG = ex.map((e) => ({ ...e, g: (F * e.pct) / 100 }));
  const acquaExtra = exG.reduce((a, e) => a + e.g * e.w, 0);
  const BRg = broselOn ? F * 0.05 : 0, BRw = broselOn ? F * 0.15 : 0;
  const pctF = (g) => (F > 0 ? (g / F) * 100 : 0);

  // fasi
  const fasi = [];
  if (broselOn) fasi.push({ k: "brosel", righe: [{ k: "broselPane", n: NOMI.broselPane, g: BRg, pct: 5 }, { k: "acqua", n: NOMI.acqua, g: BRw, pct: 15 }] });
  if (pre) {
    fasi.push({ k: pre.kind, ore: pre.ore, temp: pre.temp, righe: [
      ...farinePre.map((x) => ({ k: "farina", fk: x.k, n: farina(x.k).n, g: x.g, pct: pctF(x.g) })),
      { k: "acqua", n: NOMI.acqua, g: PW, pct: pctF(PW), nota: "pre" },
      ...(PY > 0 ? [{ k: "lievito", n: NOMI[yt], g: PY, pct: pctF(PY), pctPre: pre.pyFresh * kY }] : []),
    ] });
  }
  const main = [];
  main.push({ k: "acqua", n: NOMI.acqua, g: Math.max(0, acquaMain), pct: pctF(Math.max(0, acquaMain)), ord: 1 });
  if (Yg > 0) main.push({ k: "lievito", n: NOMI[yt], g: Yg, pct: pctF(Yg), ord: 2 });
  if (pre) main.push({ k: "pre", n: NOMI[pre.kind], g: PF + PW + PY, pct: null, ord: 2.5 });
  if (lm) main.push({ k: "lm", n: NOMI[lv], g: Lg, pct: lm.lp * 100, ord: 2.5 });
  exG.filter((e) => (ORD_EXTRA[e.k] || 4) < 5).forEach((e) => main.push({ k: "extra", ek: e.k, n: e.n, g: e.g, pct: e.pct, ord: ORD_EXTRA[e.k] || 4, michele: !!e.michele }));
  farine.forEach((x) => main.push({ k: "farina", fk: x.k, n: farina(x.k).n, g: x.g, pct: pctF(x.g), ord: 5 }));
  if (broselOn) main.push({ k: "brosel", n: NOMI.brosel, g: BRg + BRw, pct: 20, ord: 6 });
  main.push({ k: "sale", n: NOMI.sale, g: Sg, pct: S * 100, ord: 8 });
  exG.filter((e) => (ORD_EXTRA[e.k] || 4) >= 5).forEach((e) => main.push({ k: "extra", ek: e.k, n: e.n, g: e.g, pct: e.pct, ord: ORD_EXTRA[e.k], michele: !!e.michele }));
  main.sort((a, b) => a.ord - b.ord);
  fasi.push({ k: "impasto", righe: main });

  // totali (la spesa) e numeri del fornaio
  const impasto = F + acquaTot + Sg + Yg + PY + Lg + exG.reduce((a, e) => a + e.g, 0) + BRg + BRw;
  const farinaTot = F + LF;
  const acquaVera = acquaTot + LW + acquaExtra;
  const idrReale = farinaTot > 0 ? (acquaVera / farinaTot) * 100 : 0;
  const cal = clamp(num(st.cal, 12), 0, 30);
  let pezzi = null;
  if (m === "pezzi") pezzi = { n: Math.round(clamp(num(f.pc, 1), 1, 500)), g: clamp(num(f.pw, 500), 10, 5000) };
  else if (m === "teglia") pezzi = { n: nTeglie, g: impasto / (1 + lo) / nTeglie, teglia: true, area };
  else if (st.pw) { const n = Math.floor(impasto / st.pw); if (n >= 1) pezzi = { n, g: st.pw, resto: impasto - n * st.pw, stima: true }; }
  const spesa = [
    ...mix.map((x) => ({ k: "farina", fk: x.k, n: farina(x.k).n, g: F * x.frac })),
    { k: "acqua", n: NOMI.acqua, g: acquaTot + BRw },
    ...(Yg + PY > 0 ? [{ k: "lievito", n: NOMI[yt], g: Yg + PY }] : []),
    ...(lm ? [{ k: "lm", n: NOMI[lv], g: Lg }] : []),
    { k: "sale", n: NOMI.sale, g: Sg },
    ...exG.map((e) => ({ k: "extra", ek: e.k, n: e.n, g: e.g })),
    ...(broselOn ? [{ k: "broselPane", n: NOMI.broselPane, g: BRg }] : []),
  ];

  // acqua alla temperatura giusta
  const conPre = !!(pre || lm);
  const N = conPre ? 4 : 3;
  const attr = ATTRITO[f.mx] != null ? ATTRITO[f.mx] : 3;
  const dd = clamp(num(f.dd, 25), 15, 35);
  const acquaT = dd * N - (T + T + (conPre ? (pre ? pre.temp : T) : 0)) - attr;
  const rub = clamp(num(f.ac, 15), 1, 40);
  const tw = Math.max(acquaT, 1);
  const ghiaccio = acquaT < 4 && rub > tw && acquaMain > 0 ? (acquaMain * (rub - tw)) / (80 + tw) : 0;

  const res = {
    f, st, m, F, P, te, T, h, fr, fasi, spesa, impasto, cotto: impasto * (1 - cal / 100), cal, pezzi,
    farinaTot, acquaVera, idrReale, ta: 100 + idrReale,
    pff: farinaTot > 0 ? ((pre ? PF : LF) / farinaTot) * 100 : 0,
    salePct: S * 100, saleTot: farinaTot > 0 ? (Sg / farinaTot) * 100 : 0,
    lievito: { lv, tipo: yt, g: Yg, pct: yFresh * kY, fresco: yFresh, auto: yAuto, model: yModel, tot: Yg + PY },
    pre: pre ? { ...pre, farina: PF, acqua: PW, lievito: PY, pct: pre.pyFresh * kY } : null,
    lm: lm ? { ...lm, g: Lg, farina: LF, acqua: LW, pct: lm.lp * 100 } : null,
    brosel: broselOn ? { pane: BRg, acqua: BRw } : null,
    acqua: { T: acquaT, N, attr, ghiaccio, main: acquaMain, rub, dd },
    extra: exG, grassoPct, zuccheroPct, mix,
  };
  res.avvisi = avvisi(res);
  return res;
}

// ------------------------------------------------------------------ gli avvisi (in tre lingue)
function avvisi(r) {
  const out = [];
  const add = (lvl, t) => out.push({ lvl, t });
  const { f, st } = r;
  const nome = (lang) => L(st.n, lang);
  const [i0, i1] = st.idr || [40, 100];
  const [s0, s1] = st.sal || [0, 3.5];
  const lv = r.lievito.lv;

  if (r.salePct <= 0.05) add("warn", (l) => pick3(l)("Senza sale il pane viene insipido e l'impasto corre troppo. Di solito 1,8-2,5 %.", "Ohne Salz wird das Brot fad und der Teig geht zu schnell. Üblich sind 1,8-2,5 %.", "Without salt the bread tastes flat and the dough runs too fast. Usually 1.8-2.5 %."));
  else if (r.salePct < s0 - 0.05) add("info", (l) => pick3(l)(`Poco sale per ${nome(l)}: di solito ${fmtN(s0, 1, l)}-${fmtN(s1, 1, l)} %.`, `Wenig Salz für ${nome(l)}: üblich sind ${fmtN(s0, 1, l)}-${fmtN(s1, 1, l)} %.`, `Little salt for ${nome(l)}: usually ${fmtN(s0, 1, l)}-${fmtN(s1, 1, l)} %.`));
  else if (r.salePct > s1 + 0.05) add("warn", (l) => pick3(l)(`Tanto sale per ${nome(l)}: di solito ${fmtN(s0, 1, l)}-${fmtN(s1, 1, l)} %. Oltre il 3 % frena il lievito e si sente.`, `Viel Salz für ${nome(l)}: üblich sind ${fmtN(s0, 1, l)}-${fmtN(s1, 1, l)} %. Über 3 % bremst es die Hefe und schmeckt vor.`, `A lot of salt for ${nome(l)}: usually ${fmtN(s0, 1, l)}-${fmtN(s1, 1, l)} %. Above 3 % it slows the yeast and you taste it.`));

  if (r.idrReale < i0 - 0.5) add("info", (l) => pick3(l)(`Impasto più sodo del solito per ${nome(l)} (di solito ${i0}-${i1} % reale): si forma facile, la mollica viene più fitta.`, `Festerer Teig als üblich für ${nome(l)} (sonst ${i0}-${i1} % real): leicht zu formen, die Krume wird dichter.`, `Stiffer than usual for ${nome(l)} (usually ${i0}-${i1} % real): easy to shape, a tighter crumb.`));
  else if (r.idrReale > i1 + 0.5) add("warn", (l) => pick3(l)(`Impasto più morbido del solito per ${nome(l)} (di solito ${i0}-${i1} % reale): servono farina forte, pieghe e mano. Se è la prima volta, scendi di 3-5 punti.`, `Weicherer Teig als üblich für ${nome(l)} (sonst ${i0}-${i1} % real): starkes Mehl, Dehnen und Falten und Übung nötig. Beim ersten Mal 3-5 Punkte weniger.`, `Softer than usual for ${nome(l)} (usually ${i0}-${i1} % real): you need strong flour, folds and practice. First time, go 3-5 points lower.`));

  // la miscela di farine chiede più o meno acqua
  const absMix = r.mix.reduce((a, x) => a + x.frac * farina(x.k).abs, 0);
  const absSt = miscela(st.bl).reduce((a, x) => a + x.frac * farina(x.k).abs, 0);
  if (Math.abs(absMix - absSt) >= 2.5) {
    const sugg = Math.round(num(st.hy) + absMix - absSt);
    if (Math.abs(sugg - num(f.hy)) >= 3) add("info", (l) => pick3(l)(`Con questa miscela di farine di solito serve circa il ${sugg} % d'acqua.`, `Mit dieser Mehlmischung braucht man meist etwa ${sugg} % Wasser.`, `With this flour blend you usually need about ${sugg} % water.`));
  }
  const quota = (pred) => r.mix.filter((x) => pred(farina(x.k))).reduce((a, x) => a + x.frac, 0);
  if (quota((x) => x.segale) >= 0.5 && lv !== "lm" && lv !== "licoli") add("warn", (l) => pick3(l)("Con tanta segale serve il lievito madre: senza acidità la mollica resta collosa.", "Bei viel Roggen braucht es Sauerteig: ohne Säure bleibt die Krume klebrig.", "With a lot of rye you need sourdough: without acidity the crumb stays gummy."));
  if (quota((x) => x.integrale) >= 0.5) add("info", (l) => pick3(l)("Tanta farina integrale: lasciala riposare con l'acqua 30-60 minuti (autolisi) e non avere paura di qualche punto d'acqua in più.", "Viel Vollkornmehl: 30-60 Minuten mit dem Wasser quellen lassen (Autolyse), ein paar Punkte mehr Wasser sind normal.", "A lot of wholemeal: let it soak with the water for 30-60 minutes (autolyse), a few extra points of water are normal."));
  if (quota((x) => x.farro) >= 0.5) add("info", (l) => pick3(l)("Il farro ha un glutine delicato: impasta poco e piano, e tieni l'acqua un po' più bassa.", "Dinkel hat empfindliches Gluten: kurz und sanft kneten, etwas weniger Wasser.", "Spelt has delicate gluten: knead briefly and gently, and keep the water a little lower."));

  if (lv === "diretto" && r.lievito.fresco > 3.5) add("warn", (l) => pick3(l)("Tantissimo lievito: l'impasto corre e il pane sa di lievito. Allunga i tempi.", "Sehr viel Hefe: der Teig rennt und das Brot schmeckt nach Hefe. Mehr Zeit geben.", "A lot of yeast: the dough races and the bread tastes yeasty. Give it more time."));
  if (lv === "diretto" && r.lievito.auto && r.te < 1.5) add("warn", (l) => pick3(l)("Tempi molto corti: anche con tanto lievito il pane resta povero di gusto. Se puoi, dagli almeno 3 ore.", "Sehr kurze Zeiten: selbst mit viel Hefe bleibt das Brot geschmacksarm. Wenn möglich, mindestens 3 Stunden.", "Very short times: even with lots of yeast the bread lacks flavour. If you can, give it at least 3 hours."));
  const yTot = r.lievito.tot;
  if (yTot > 0 && yTot < 1) add("tip", (l) => pick3(l)(`Meno di un grammo di lievito: sciogli 1 g in 100 g d'acqua (presa da quella dell'impasto) e usane ${fmtN(yTot * 100, 0, l)} g.`, `Weniger als ein Gramm Hefe: 1 g in 100 g Wasser auflösen (vom Teigwasser) und davon ${fmtN(yTot * 100, 0, l)} g nehmen.`, `Less than a gram of yeast: dissolve 1 g in 100 g of water (taken from the dough water) and use ${fmtN(yTot * 100, 0, l)} g of it.`));

  if (r.lm && r.lm.limite === "poco") add("warn", (l) => pick3(l)(`Poco tempo per il lievito madre: anche con il 35 % servono circa ${fmtOre(oreLm(35, r.lm.lh) / fac(r.T), l)} a ${fmtN(r.T, 0, l)} °C. Allunga i tempi, scalda a 26-28 °C o aggiungi 0,2-0,5 % di lievito di birra.`, `Wenig Zeit für den Sauerteig: selbst mit 35 % braucht er etwa ${fmtOre(oreLm(35, r.lm.lh) / fac(r.T), l)} bei ${fmtN(r.T, 0, l)} °C. Mehr Zeit, 26-28 °C oder 0,2-0,5 % Hefe dazu.`, `Not much time for the starter: even at 35 % it needs about ${fmtOre(oreLm(35, r.lm.lh) / fac(r.T), l)} at ${fmtN(r.T, 0, l)} °C. Give more time, warm it to 26-28 °C or add 0.2-0.5 % yeast.`));
  if (r.lm && r.lm.limite === "tanto") add("info", (l) => pick3(l)("Tempi lunghi: basta il 5 % di lievito madre. Oltre le 12-14 ore conviene passare dal frigo.", "Lange Zeiten: 5 % Sauerteig reichen. Über 12-14 Stunden lieber über den Kühlschrank gehen.", "Long times: 5 % starter is enough. Beyond 12-14 hours it's better to use the fridge."));
  if (r.lm && !r.lm.auto && r.lm.pct > 40) add("warn", (l) => pick3(l)("Oltre il 40 % di lievito madre il pane diventa acido e l'impasto si indebolisce.", "Über 40 % Sauerteig wird das Brot sauer und der Teig schwach.", "Above 40 % starter the bread gets sour and the dough weakens."));

  if (r.pre) {
    if (r.acqua.main < -0.5) add("warn", (l) => pick3(l)("Il prefermento ha più acqua di tutto l'impasto: alza l'acqua o fai meno prefermento.", "Der Vorteig hat mehr Wasser als der ganze Teig: mehr Wasser oder weniger Vorteig.", "The preferment holds more water than the whole dough: raise the water or use less preferment."));
    if (r.pre.kind === "biga" && r.pre.ph > 0.6) add("info", (l) => pick3(l)("Sopra il 55-60 % d'acqua non è più una biga: è un poolish.", "Über 55-60 % Wasser ist es keine Biga mehr, sondern ein Poolish.", "Above 55-60 % water it's no longer a biga: it's a poolish."));
    if (r.pre.kind === "poolish" && r.pre.ph < 0.9) add("info", (l) => pick3(l)("Il poolish si fa con tanta acqua quanta farina (100 %). Con meno acqua diventa una biga.", "Poolish hat gleich viel Wasser wie Mehl (100 %). Mit weniger Wasser wird es eine Biga.", "Poolish has as much water as flour (100 %). With less water it becomes a biga."));
    if (r.pre.pp > 0.7 && f.st !== "ciabatta") add("info", (l) => pick3(l)("Più del 70 % di farina nel prefermento: tanto gusto, ma l'impasto finale ha poca forza nuova.", "Über 70 % Mehl im Vorteig: viel Geschmack, aber der Hauptteig bekommt wenig neue Kraft.", "Over 70 % of the flour in the preferment: lots of flavour, but the final dough gets little new strength."));
    if (r.pre.kind === "biga" && r.pre.ore > 22) add("tip", (l) => pick3(l)("Biga di più di 22 ore: di solito 0,5-0,8 % di lievito sulla sua farina, e una parte del tempo in frigo.", "Biga über 22 Stunden: meist 0,5-0,8 % Hefe auf ihr Mehl und ein Teil der Zeit im Kühlschrank.", "Biga over 22 hours: usually 0.5-0.8 % yeast on its flour, and part of the time in the fridge."));
  }
  if (num(f.h) > 30 && r.T >= 18) add("warn", (l) => pick3(l)("Tante ore fuori dal frigo: oltre le 24-30 ore l'impasto si sfianca. Metti una parte del tempo in frigo.", "Viele Stunden außerhalb des Kühlschranks: nach 24-30 Stunden wird der Teig schlaff. Einen Teil der Zeit kalt stellen.", "Many hours out of the fridge: beyond 24-30 hours the dough goes slack. Put part of the time in the fridge."));
  if (num(f.fr) >= 24) add("info", (l) => pick3(l)("Per 24 ore e più di frigo serve una farina forte (W 280-330 o 12-13 % di proteine: guardalo sul sacco).", "Für 24 Stunden und mehr im Kühlschrank braucht es starkes Mehl (W 280-330 oder 12-13 % Eiweiß: steht auf der Packung).", "For 24 hours or more in the fridge you need strong flour (W 280-330 or 12-13 % protein: check the bag)."));
  if (r.acqua.T > 45) add("warn", (l) => pick3(l)("Servirebbe acqua troppo calda (oltre 45 °C il lievito soffre): scalda la stanza o accetta un impasto più freddo e aspetta di più.", "Das Wasser müsste zu heiß sein (über 45 °C leidet die Hefe): Raum wärmen oder kälteren Teig akzeptieren und länger warten.", "The water would have to be too hot (above 45 °C yeast suffers): warm the room or accept a cooler dough and wait longer."));
  if (r.F < 150) add("info", (l) => pick3(l)("Impasto piccolissimo: sale e lievito diventano difficili da pesare. Una bilancia da 0,1 g aiuta.", "Sehr kleiner Teig: Salz und Hefe sind schwer abzuwiegen. Eine 0,1-g-Waage hilft.", "A very small dough: salt and yeast get hard to weigh. A 0.1 g scale helps."));
  if (st.fam === "pane" && r.grassoPct > 8 && !["panini", "brezel"].includes(f.st)) add("info", (l) => pick3(l)("Tanti grassi per un pane: viene più morbido e meno croccante, quasi un pan brioche.", "Viel Fett für ein Brot: es wird weicher und weniger knusprig, fast ein Hefezopf.", "A lot of fat for a bread: softer and less crusty, almost a brioche."));
  if (st.pizza && f.fo !== "legna" && r.grassoPct < 0.5 && r.zuccheroPct < 0.5 && !r.extra.some((e) => e.k === "malto")) add("tip", (l) => pick3(l)("Forno di casa (250-300 °C): 1-2 % d'olio e 0,5-1 % di malto aiutano la pizza a colorarsi e restare morbida.", "Haushaltsofen (250-300 °C): 1-2 % Öl und 0,5-1 % Malz helfen der Pizza bei Farbe und Weichheit.", "Home oven (250-300 °C): 1-2 % oil and 0.5-1 % malt help the pizza colour and stay soft."));
  if (st.pizza && f.fo === "legna" && (r.grassoPct > 0 || r.zuccheroPct > 0)) add("info", (l) => pick3(l)("Nel forno a legna (430-480 °C) olio e zuccheri nell'impasto bruciano: di solito non si mettono.", "Im Holzofen (430-480 °C) verbrennen Öl und Zucker im Teig: normalerweise lässt man sie weg.", "In a wood oven (430-480 °C) oil and sugar in the dough burn: they're usually left out."));
  if (f.mm && st.michele && r.extra.some((e) => e.k === "burro")) add("info", (l) => pick3(l)("Il metodo di Michele (olio, aceto e Kokosfett all'1 %) si usa nei pani senza burro: qui c'è il burro, quindi non lo aggiungo.", "Micheles Methode (je 1 % Öl, Essig und Kokosfett) gilt für Brote ohne Butter: hier ist Butter drin, also füge ich sie nicht hinzu.", "Michele's method (1 % each of oil, vinegar and Kokosfett) is for breads without butter: this one has butter, so I don't add it."));
  if (r.pezzi && !r.pezzi.teglia && !r.pezzi.stima && r.pezzi.g < 30) add("info", (l) => pick3(l)("Pezzi sotto i 30 g cuociono in pochi minuti e si seccano: controlla il forno prima.", "Stücke unter 30 g backen in wenigen Minuten und trocknen aus: früher nachsehen.", "Pieces under 30 g bake in minutes and dry out: check the oven early."));
  if (!out.length) add("ok", (l) => pick3(l)(`Numeri a posto per ${nome(l)}.`, `Die Zahlen passen für ${nome(l)}.`, `The numbers are right for ${nome(l)}.`));
  return out;
}

// ------------------------------------------------------------------ il piano (dall'ora del forno all'indietro)
export function piano(res, now = new Date()) {
  const { f, st } = res;
  const HR = 3600e3;
  const [hh, mm] = String(f.at || "19:00").split(":").map((x) => parseInt(x, 10));
  const forno = new Date(now);
  forno.setHours(Number.isFinite(hh) ? hh : 19, Number.isFinite(mm) ? mm : 0, 0, 0);
  forno.setDate(forno.getDate() + Math.round(clamp(num(f.gg, 1), 0, 3)));
  const h = Math.max(0.5, res.h), fr = res.fr;
  const P = [];
  const add = (t, k, n) => P.push({ t: new Date(t), k, n });
  const fam = st.fam;
  const teglia = fam === "focaccia" || f.st === "teglia";
  let mixEnd;
  if (st.pizza) {
    const puntata = clamp(h * 0.3, 0.5, fr > 0 ? 2 : 2.5);
    const fuori = Math.max(0.5, h - puntata);
    mixEnd = forno.getTime() - (puntata + fuori + fr) * HR;
    add(mixEnd + 0, "puntata", T3(`Puntata: l'impasto riposa intero, coperto (${fmtOre(puntata, "it")})`, `Stockgare: der Teig ruht am Stück, abgedeckt (${fmtOre(puntata, "de")})`, `Bulk: the dough rests in one piece, covered (${fmtOre(puntata, "en")})`));
    if (fr > 0) {
      add(mixEnd + puntata * HR, "frigo", T3(`In frigo, coperto (${fmtOre(fr, "it")})`, `In den Kühlschrank, abgedeckt (${fmtOre(fr, "de")})`, `Into the fridge, covered (${fmtOre(fr, "en")})`));
      add(forno.getTime() - fuori * HR, "fuori", teglia
        ? T3("Fuori dal frigo: stendi in teglia con l'olio", "Aus dem Kühlschrank: aufs geölte Blech ziehen", "Out of the fridge: stretch into the oiled pan")
        : T3("Fuori dal frigo: fai i panetti (staglio) e coprili", "Aus dem Kühlschrank: Teigkugeln formen und abdecken", "Out of the fridge: shape the dough balls and cover them"));
    } else {
      add(mixEnd + puntata * HR, "staglio", teglia
        ? T3("Stendi in teglia con l'olio e copri", "Aufs geölte Blech ziehen und abdecken", "Stretch into the oiled pan and cover")
        : T3("Staglio: fai i panetti e coprili", "Teigkugeln formen und abdecken", "Shape the dough balls and cover them"));
    }
    add(forno.getTime() - 1 * HR, "accendi", T3("Accendi il forno al massimo (con la pietra o l'acciaio dentro)", "Ofen auf Höchststufe (mit Stein oder Stahl drin)", "Turn the oven to maximum (with the stone or steel inside)"));
    add(forno.getTime(), "inforna", T3("Inforna la prima pizza", "Die erste Pizza einschießen", "Bake the first pizza"));
  } else {
    let bulk, fuori = 0;
    if (fr > 0) { fuori = h >= 2 ? 1 : h * 0.5; bulk = Math.max(0.5, h - fuori); } else { bulk = h * 0.6; }
    const proof = fr > 0 ? 0 : h - bulk;
    mixEnd = forno.getTime() - (bulk + proof + fuori + fr) * HR;
    const pieghe = res.idrReale >= 68 || res.lm;
    add(mixEnd, "puntata", T3(`Puntata: riposa intero e coperto${pieghe ? ", pieghe ogni 30-40 minuti nelle prime 2 ore" : ""} (${fmtOre(bulk, "it")})`, `Stockgare: am Stück, abgedeckt${pieghe ? ", in den ersten 2 Stunden alle 30-40 Minuten dehnen und falten" : ""} (${fmtOre(bulk, "de")})`, `Bulk: in one piece, covered${pieghe ? ", folds every 30-40 minutes in the first 2 hours" : ""} (${fmtOre(bulk, "en")})`));
    const forma = teglia ? T3("Stendi in teglia con l'olio", "Aufs geölte Blech ziehen", "Stretch into the oiled pan") : T3("Dividi e forma", "Teilen und formen", "Divide and shape");
    if (fr > 0) {
      add(mixEnd + bulk * HR, "forma", T3(`${forma.it}, poi in frigo coperto (${fmtOre(fr, "it")})`, `${forma.de}, dann abgedeckt in den Kühlschrank (${fmtOre(fr, "de")})`, `${forma.en}, then covered into the fridge (${fmtOre(fr, "en")})`));
      add(forno.getTime() - fuori * HR, "fuori", T3("Fuori dal frigo, a temperatura ambiente", "Aus dem Kühlschrank, bei Raumtemperatur", "Out of the fridge, at room temperature"));
    } else add(mixEnd + bulk * HR, "forma", T3(`${forma.it}, poi lievitazione finale coperta (${fmtOre(proof, "it")})`, `${forma.de}, dann Stückgare abgedeckt (${fmtOre(proof, "de")})`, `${forma.en}, then final proof covered (${fmtOre(proof, "en")})`));
    add(forno.getTime() - 0.75 * HR, "accendi", T3(`Accendi il forno a ${st.forno.t} °C${st.forno.vap ? " (con la teglia per il vapore)" : ""}`, `Ofen auf ${st.forno.t} °C${st.forno.vap ? " (mit Blech für den Dampf)" : ""}`, `Turn the oven to ${st.forno.t} °C${st.forno.vap ? " (with a tray for steam)" : ""}`));
    add(forno.getTime(), "inforna", T3(`Inforna${st.forno.vap ? " con vapore" : ""}`, `Einschießen${st.forno.vap ? " mit Dampf" : ""}`, `Bake${st.forno.vap ? " with steam" : ""}`));
    add(forno.getTime() + st.forno.min * 60e3, "sforna", T3("Sforna e lascia raffreddare su una griglia", "Herausnehmen und auf einem Gitter auskühlen lassen", "Take out and cool on a rack"));
  }
  const mixStart = mixEnd - 20 * 60e3;
  add(mixStart, "impasta", T3("Impasta", "Kneten", "Mix the dough"));
  if (res.pre) add(mixStart - res.pre.ore * HR, "pre", res.pre.kind === "biga"
    ? T3(`Prepara la biga (${fmtOre(res.pre.ore, "it")} a ${res.pre.temp} °C)`, `Biga ansetzen (${fmtOre(res.pre.ore, "de")} bei ${res.pre.temp} °C)`, `Make the biga (${fmtOre(res.pre.ore, "en")} at ${res.pre.temp} °C)`)
    : T3(`Prepara il poolish (${fmtOre(res.pre.ore, "it")} a ${res.pre.temp} °C)`, `Poolish ansetzen (${fmtOre(res.pre.ore, "de")} bei ${res.pre.temp} °C)`, `Make the poolish (${fmtOre(res.pre.ore, "en")} at ${res.pre.temp} °C)`));
  if (res.lm) add(mixStart - res.lm.picco11 * HR, "rinfresco", T3("Rinfresca il lievito madre (1 : 1): all'impasto deve essere al picco", "Sauerteig auffrischen (1 : 1): zum Kneten muss er aktiv sein", "Feed the starter (1 : 1): it must be at its peak when you mix"));
  if (res.brosel) add(mixStart - 12 * HR, "brosel", T3("Brösel in ammollo, coperto in frigo", "Brösel einweichen, abgedeckt in den Kühlschrank", "Soak the breadcrumbs, covered in the fridge"));
  P.sort((a, b) => a.t - b.t);
  const inizio = P.length ? P[0].t : new Date(mixStart);
  return { passi: P, forno, inizio, tardi: inizio.getTime() < now.getTime() - 5 * 60e3, mixStart: new Date(mixStart) };
}

// File calendario (.ics) con un promemoria per ogni passo.
export function creaIcs(passi, titolo, lang) {
  const pad = (x) => String(x).padStart(2, "0");
  const utc = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const stamp = utc(new Date());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MikiLab//Calcolatrice del fornaio//IT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  passi.forEach((p, i) => {
    const txt = L(p.n, lang);
    lines.push("BEGIN:VEVENT", `UID:mikilab-${p.t.getTime()}-${i}@mikilab.de`, `DTSTAMP:${stamp}`, `DTSTART:${utc(p.t)}`, `DTEND:${utc(new Date(p.t.getTime() + 15 * 60e3))}`,
      `SUMMARY:${esc(`${titolo} · ${txt}`.slice(0, 150))}`, `DESCRIPTION:${esc(`${txt} — MikiLab, mikilab.de`)}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:PT0M", `DESCRIPTION:${esc(txt.slice(0, 120))}`, "END:VALARM", "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// Due righe che riassumono la formula (per «Il mio forno» e per la domanda a Sitor). Massimo 400 caratteri.
export function riassunto(res, lang) {
  const p = pick3(lang);
  const f = res.f;
  const farine = res.mix.map((x) => `${L(farina(x.k).n, lang)}${res.mix.length > 1 ? ` ${fmtN(x.frac * 100, 0, lang)} %` : ""}`).join(", ");
  const lv = res.lievito.lv;
  const lievito = lv === "lm" || lv === "licoli" ? `${L(NOMI[lv], lang).split(",")[0].split("(")[0].trim()} ${fmtP(res.lm.pct, lang, 0)}`
    : lv === "biga" || lv === "poolish" ? `${lv} ${fmtN(res.pre.pp * 100, 0, lang)} %`
    : lv === "nessuno" ? p("senza lievito", "ohne Triebmittel", "no leavening")
    : `${L(NOMI[res.lievito.tipo], lang)} ${fmtP(res.lievito.pct, lang, 2)}`;
  const tempi = `${fmtOre(res.h, lang)} ${p("a", "bei", "at")} ${fmtN(res.T, 0, lang)} °C${res.fr > 0 ? ` + ${fmtOre(res.fr, lang)} ${p("in frigo", "im Kühlschrank", "in the fridge")}` : ""}`;
  const extra = res.extra.map((e) => `${L(e.n, lang)} ${fmtP(e.pct, lang, 1)}`).join(", ");
  const s = `${f.n ? `${f.n} · ` : ""}${L(res.st.n, lang)}: ${p("farina", "Mehl", "flour")} ${fmtG(res.F, lang)} (${farine}), ${p("acqua", "Wasser", "water")} ${fmtP(num(f.hy), lang, 1)}, ${p("sale", "Salz", "salt")} ${fmtP(res.salePct, lang, 1)}, ${lievito}${extra ? `, ${extra}` : ""}; ${tempi}; ${p("idratazione reale", "reale Hydration", "real hydration")} ${fmtP(res.idrReale, lang, 0)}, ${p("impasto", "Teig", "dough")} ${fmtG(res.impasto, lang)}.`;
  return s.length > 400 ? `${s.slice(0, 397)}…` : s;
}

// ------------------------------------------------------------------ «incolla una ricetta» (senza IA)
const RX = {
  segaleint: /(segale|roggen|rye)[^,;\n]*(integral|vollkorn|whole)|(integral|vollkorn|whole)[^,;\n]*(segale|roggen|rye)/,
  segale: /segale|roggen|\brye\b/,
  farroint: /(farro|dinkel|spelt)[^,;\n]*(integral|vollkorn|whole)|(integral|vollkorn|whole)[^,;\n]*(farro|dinkel|spelt)/,
  farro: /farro|dinkel|spelt/,
  integrale: /integral|vollkorn|wholemeal|whole ?wheat|whole grain/,
  semola: /semola|hartweizen|durum|semolina|grie(ß|ss)/,
  manitoba: /manitoba|kraftmehl|strong flour|bread flour|type 812|typ 812/,
  due: /tipo ?2\b|type ?(1050|1600)\b|typ ?(1050|1600)\b/,
  uno: /tipo ?1\b|type ?812\b|typ ?812\b/,
  zero: /tipo ?0\b|farina 0\b|type ?550\b|typ ?550\b|t ?55\b|t ?65\b/,
  doppiozero: /\b00\b|type ?405\b|typ ?405\b|t ?45\b/,
};
function tipoFarina(s) {
  if (RX.segaleint.test(s)) return "segaleint";
  if (RX.segale.test(s)) return "segale";
  if (RX.farroint.test(s)) return "farroint";
  if (RX.farro.test(s)) return "farro";
  if (RX.semola.test(s)) return "semola";
  if (RX.integrale.test(s)) return "integrale";
  if (RX.manitoba.test(s)) return "manitoba";
  if (RX.due.test(s)) return "2";
  if (RX.uno.test(s)) return "1";
  if (RX.doppiozero.test(s)) return "00";
  if (RX.zero.test(s)) return "0";
  return "0";
}
const UNITA = [
  [/^(kg|kilo|chilo|chili|kilogramm?)\b/, 1000], [/^(g|gr|grammi|grammo|gramm|grams?)\b/, 1], [/^(l|litri|litro|liter|litres?|liters?)\b/, 1000],
  [/^(dl)\b/, 100], [/^(cl)\b/, 10], [/^(ml|millilitri|milliliter|millilitres?)\b/, 1],
  [/^(cucchiaini|cucchiaino|tl|tsp|teaspoons?|teelöffel|teeloeffel)\b/, "tsp"], [/^(cucchiai|cucchiaio|el|tbsp|tablespoons?|esslöffel|essloeffel)\b/, "tbsp"],
];
export function leggiRicetta(testo) {
  const letti = [], ignoti = [];
  const out = { farine: new Map(), acqua: 0, sale: 0, lievito: 0, tipoLievito: "fresco", lm: 0, lmIdr: 0.5, pre: null, extra: [] };
  String(testo || "").split(/\r?\n|;|•/).map((x) => x.trim()).filter(Boolean).slice(0, 60).forEach((riga) => {
    const s = riga.toLowerCase().replace(/[*_]/g, " ").replace(/\s+/g, " ").trim();
    if (!/\d/.test(s)) { if (s.length > 2 && s.length < 80 && !/:$/.test(s)) ignoti.push(riga); return; }
    // numero + unità (prima o dopo il nome)
    let m = s.match(/(\d+(?:[.,]\d+)?)\s*(?:-\s*\d+(?:[.,]\d+)?\s*)?([a-zäöüß]+)?/);
    if (!m) { ignoti.push(riga); return; }
    let q = num(m[1]);
    const dopo = (m[2] || "").trim();
    let unit = null;
    for (const [rx, v] of UNITA) { if (rx.test(dopo)) { unit = v; break; } }
    const nome = s.replace(m[0], " ").replace(/\b(di|de|d'|del|della|dello|dei|delle|of|von|vom|der|die|das)\b/g, " ").replace(/[():,.]/g, " ").replace(/\s+/g, " ").trim();
    const all = s;
    const isSale = /\bsale\b|\bsalz\b|\bsalt\b/.test(all) && !/salsa|salame|salat/.test(all);
    const isOlio = /\bolio\b|\böl\b|\boel\b|\boil\b/.test(all);
    const isZucchero = /zucchero|zucker|\bsugar\b/.test(all);
    if (unit === "tsp") q = q * (isSale ? 6 : isZucchero ? 4 : isOlio ? 4.5 : 3);
    else if (unit === "tbsp") q = q * (isSale ? 18 : isZucchero ? 12 : isOlio ? 13 : 10);
    else if (typeof unit === "number") q = q * unit;
    else if (/\buov[ao]\b|\beier?\b|\beggs?\b/.test(all) && !/tuorl|eigelb|yolk|albume|eiweiß|white/.test(all)) q = q * 50; // numero di uova
    else if (/tuorl|eigelb|yolks?/.test(all)) q = q * 18;
    else if (!unit) { /* numero senza unità: grammi */ }
    if (!(q > 0) || q > 100000) { ignoti.push(riga); return; }
    const push = (cosa) => letti.push({ riga, cosa, g: q });
    if (/biga/.test(all)) { out.pre = { kind: "biga", g: q }; push("biga"); return; }
    if (/poolish/.test(all)) { out.pre = { kind: "poolish", g: q }; push("poolish"); return; }
    if (/lievito madre|pasta madre|licoli|lievito naturale|sauerteig|anstellgut|sourdough|starter|levain|lievito liquido/.test(all)) { out.lm += q; if (/licoli|liquid|flüssig|fluessig|liquido|100 ?%/.test(all)) out.lmIdr = 1; push("lm"); return; }
    if (/lievito|hefe|yeast/.test(all)) { out.lievito += q; if (/secco|trocken|dry|istantaneo|instant/.test(all)) out.tipoLievito = /attivo|active|aktiv/.test(all) ? "secco" : "istantaneo"; push("lievito"); return; }
    if (/farina di mandorl|mandorl|nocciol|mandel|almond|hazelnut|cocco|kokosraspel/.test(all)) { out.extra.push(["x", q, nome.slice(0, 40), 0]); push("extra"); return; }
    if (/farin|mehl|flour|semola|grie(ß|ss)|manitoba|segale|roggen|\brye\b|farro|dinkel|spelt/.test(all)) { const k = tipoFarina(all); out.farine.set(k, (out.farine.get(k) || 0) + q); push("farina"); return; }
    if (/\bacqua\b|wasser|\bwater\b/.test(all)) { out.acqua += q; push("acqua"); return; }
    if (isSale) { out.sale += q; push("sale"); return; }
    const EXR = [["burro", /burro|butter/], ["strutto", /strutto|schmalz|\blard\b/], ["kokos", /kokos|cocco|coconut/], ["olio", /\bolio\b|\böl\b|\boel\b|\boil\b/],
      ["miele", /miele|honig|honey/], ["maltosciroppo", /malt[oa]?[^,;]*(sciroppo|sirup|syrup)|(sciroppo|sirup|syrup)[^,;]*malt/], ["malto", /malto|malz|\bmalt\b/], ["zucchero", /zucchero|zucker|\bsugar\b/],
      ["latte", /\blatte\b|\bmilch\b|\bmilk\b/], ["tuorli", /tuorl|eigelb|yolk/], ["uova", /\buov|\beier?\b|\beggs?\b/], ["patata", /patat|kartoffel|potato/],
      ["yogurt", /yogurt|joghurt|yoghurt/], ["aceto", /aceto|essig|vinegar/], ["miglioratore", /miglioratore|backmittel|improver/], ["semi", /\bsemi\b|saaten|seeds|sesam|lino|leinsamen|girasole|sonnenblume/]];
    for (const [k, rx] of EXR) { if (rx.test(all)) { out.extra.push([k, q]); push(k); return; } }
    if (nome) { out.extra.push(["x", q, nome.slice(0, 40), 0]); push("extra"); return; }
    ignoti.push(riga);
  });
  // da grammi a formula (percentuali sulla farina)
  let F = [...out.farine.values()].reduce((a, x) => a + x, 0);
  let acqua = out.acqua;
  const f = nuovaFormula("libero");
  f.n = "";
  if (out.pre && out.pre.g > 0) {
    const ph = out.pre.kind === "poolish" ? 1 : 0.45;
    const pf = out.pre.g / (1 + ph + (out.pre.kind === "biga" ? 0.01 : 0.001));
    F += pf; acqua += pf * ph;
    f.lv = out.pre.kind; f.ph = ph * 100; f.pp = F > 0 ? Math.round((pf / F) * 1000) / 10 : 30; f.py = out.pre.kind === "biga" ? 1 : 0.1; f.ya = false; f.pH = out.pre.kind === "biga" ? 16 : 14;
    if (!out.farine.size) out.farine.set("0", pf); else { const first = [...out.farine.keys()][0]; out.farine.set(first, out.farine.get(first) + pf); }
  }
  if (!(F > 0)) return { ok: false, letti, ignoti };
  f.m = "farina";
  f.fl = Math.round(F);
  f.bl = [...out.farine.entries()].map(([k, g]) => [k, Math.round((g / F) * 1000) / 10]);
  f.hy = Math.round((acqua / F) * 1000) / 10;
  f.sa = Math.round((out.sale / F) * 1000) / 10;
  if (out.lm > 0) { f.lv = out.lmIdr >= 1 ? "licoli" : "lm"; f.lh = out.lmIdr * 100; f.lp = Math.round((out.lm / F) * 1000) / 10; f.ya = false; f.yp = out.lievito > 0 ? Math.round((out.lievito / F) * 10000) / 100 : 0; f.yt = out.tipoLievito; }
  else if (!out.pre) { if (out.lievito > 0) { f.lv = "diretto"; f.yt = out.tipoLievito; f.yp = Math.round((out.lievito / F) * 10000) / 100; f.ya = false; } else f.lv = "nessuno"; }
  else { f.yt = out.tipoLievito; f.yp = out.lievito > 0 ? Math.round((out.lievito / F) * 10000) / 100 : 0; }
  f.ex = out.extra.map((x) => (x[0] === "x" ? ["x", Math.round((x[1] / F) * 1000) / 10, x[2], x[3]] : [x[0], Math.round((x[1] / F) * 1000) / 10]));
  return { ok: true, f, letti, ignoti };
}
