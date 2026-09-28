// V136 — le parole di «Dillo a Sitor»: nomi dei passaggi, durate, giorni. Tre lingue.
import { fmtTime } from "@/lib/sitorTools";

const L3 = (lang, a) => (lang === "de" ? a[1] : lang === "en" ? a[2] : a[0]);
export function durata(min, lang) {
  const m = Math.round(min); if (m < 60) return L3(lang, [`${m} min`, `${m} Min.`, `${m} min`]);
  const h = Math.floor(m / 60), r = m % 60;
  if (lang === "de") return `${h} Std.${r ? ` ${r} Min.` : ""}`;
  if (lang === "en") return `${h} h${r ? ` ${r} min` : ""}`;
  return `${h} ${h === 1 ? "ora" : "ore"}${r ? ` e ${r} min` : ""}`;
}
export function giorno(at, lang, now = Date.now()) {
  const d = new Date(at), o = new Date(now); o.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - o.getTime()) / 86400000);
  if (diff === 0) return L3(lang, ["oggi", "heute", "today"]);
  if (diff === 1) return L3(lang, ["domani", "morgen", "tomorrow"]);
  if (diff === -1) return L3(lang, ["ieri", "gestern", "yesterday"]);
  return d.toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { weekday: "long", day: "numeric", month: "short" });
}
export const quandoTesto = (at, lang, now) => `${giorno(at, lang, now)}, ${fmtTime(new Date(at), lang)}`;
export function traQuanto(at, lang, now = Date.now()) {
  const m = Math.round((at - now) / 60000);
  if (Math.abs(m) <= 10) return L3(lang, ["adesso", "jetzt", "now"]);
  if (m < 0) return L3(lang, ["già passato", "schon vorbei", "already passed"]);
  return L3(lang, [`tra ${durata(m, lang)}`, `in ${durata(m, lang)}`, `in ${durata(m, lang)}`]);
}
// Nome e spiegazione di ogni passaggio. x = { T, d (dosi), r (ricetta), lang }
export function passoTesto(k, s, x) {
  const { T, d, r, lang } = x; const L = (a) => L3(lang, a);
  const forno = Math.round(Number(r.bake_temp) || 230);
  const bg = d && d.biga;
  switch (k) {
    case "rinfresco": return { t: L(["Rinfresca il lievito madre", "Sauerteig auffrischen", "Feed your sourdough starter"]), d: L(["Mettilo al caldo, a 26-28 °C: sarà al picco quando impasti.", "Warm stellen, 26-28 °C: er ist auf dem Höhepunkt, wenn du knetest.", "Keep it warm, 26-28 °C: it will peak when you mix."]) };
    case "pre": {
      const nome = T.preKind === "poolish" ? "poolish" : "biga";
      const g = bg ? L([`${bg.flour} g di farina, ${bg.water} g d'acqua, ${bg.yeast} g di lievito: mescola e copri.`, `${bg.flour} g Mehl, ${bg.water} g Wasser, ${bg.yeast} g Hefe: mischen und abdecken.`, `${bg.flour} g flour, ${bg.water} g water, ${bg.yeast} g yeast: mix and cover.`]) : L(["Come dice la ricetta: mescola e copri.", "Wie im Rezept: mischen und abdecken.", "As the recipe says: mix and cover."]);
      return { t: L([`Prepara ${nome === "poolish" ? "il poolish" : "la biga"}`, `${nome === "poolish" ? "Poolish" : "Biga"} ansetzen`, `Make the ${nome}`]), d: `${g} ${L(["Poi riposa fino all'impasto.", "Dann ruht er bis zum Kneten.", "Then it rests until mixing."])}` };
    }
    case "impasto": return { t: L(["Impasta", "Kneten", "Mix the dough"]), d: L([`Segui la ricetta passo per passo: ${d ? d.totalFlour + " g di farina in tutto" : ""}.`, `Folge dem Rezept Schritt für Schritt: ${d ? d.totalFlour + " g Mehl insgesamt" : ""}.`, `Follow the recipe step by step: ${d ? d.totalFlour + " g of flour in total" : ""}.`]) };
    case "puntata": return { t: L(["Prima lievitazione", "Stockgare", "Bulk fermentation"]), d: s.min >= 480 ? L([`${durata(s.min, lang)}, coperto: se la ricetta lo dice, in frigo.`, `${durata(s.min, lang)}, abgedeckt: wenn das Rezept es sagt, im Kühlschrank.`, `${durata(s.min, lang)}, covered: in the fridge if the recipe says so.`]) : L([`${durata(s.min, lang)}, coperto. Se la ricetta dice pieghe, falle nella prima ora.`, `${durata(s.min, lang)}, abgedeckt. Wenn das Rezept Falten sagt, in der ersten Stunde.`, `${durata(s.min, lang)}, covered. If the recipe says folds, do them in the first hour.`]) };
    case "riposo": return { t: L(["Riposo", "Ruhen lassen", "Rest"]), d: L([`${durata(s.min, lang)}, coperto.`, `${durata(s.min, lang)}, abgedeckt.`, `${durata(s.min, lang)}, covered.`]) };
    case "forma": return { t: L(["Dai la forma", "Formen", "Shape"]), d: L(["Pagnotta, panini, teglia: come dice la ricetta.", "Laib, Brötchen, Blech: wie im Rezept.", "Loaf, rolls, pan: as the recipe says."]) };
    case "appretto": return { t: L(["Ultima lievitazione", "Stückgare", "Final proof"]), d: s.min >= 480 ? L([`${durata(s.min, lang)} in frigo, coperto: il freddo lungo dà sapore.`, `${durata(s.min, lang)} im Kühlschrank, abgedeckt: die lange Kälte bringt Geschmack.`, `${durata(s.min, lang)} in the fridge, covered: the long cold brings flavour.`]) : L([`${durata(s.min, lang)}, finché è gonfio.`, `${durata(s.min, lang)}, bis er aufgegangen ist.`, `${durata(s.min, lang)}, until puffy.`]) };
    case "accendi": return { t: L([`Accendi il forno a ${forno} °C`, `Ofen auf ${forno} °C vorheizen`, `Heat the oven to ${forno} °C`]), d: L(["Scaldalo bene: 45 minuti, con la teglia dentro.", "Gut vorheizen: 45 Minuten, mit dem Blech drin.", "Heat it well: 45 minutes, with the tray inside."]) };
    case "cottura": return { t: L(["In forno", "Ab in den Ofen", "Into the oven"]), d: L([`${durata(s.min, lang)} a ${forno} °C, come dice la ricetta.`, `${durata(s.min, lang)} bei ${forno} °C, wie im Rezept.`, `${durata(s.min, lang)} at ${forno} °C, as the recipe says.`]) };
    default: return { t: L(["In tavola", "Auf den Tisch", "On the table"]), d: T.cool >= 1 ? L(["Prima lascialo raffreddare: tagliato caldo, la mollica si schiaccia.", "Erst auskühlen lassen: warm angeschnitten wird die Krume matschig.", "Let it cool first: cut warm, the crumb squashes."]) : L(["Buon appetito.", "Guten Appetit.", "Enjoy."]) };
  }
}
