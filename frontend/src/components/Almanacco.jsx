import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Sun, Stamp, Calendar, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { award } from "@/lib/medaglie";
import { recipeKind, fermentationHours, LS, num, fmtDateLong, downloadBlob } from "@/lib/sitorTools";

// V101 — L'ALMANACCO DEL FORNAIO. Ogni giorno la bottega ha una pagina diversa: la tradizione del giorno (quando c'è),
// il proverbio, un gesto da due minuti, il pane di oggi (scelto tra le ricette per stagione e giorno della settimana).
// Chi passa lascia un timbro: la collezione del mese, i giorni di fila, una medaglia a sette giorni. E un promemoria
// nel calendario del telefono, per il pane della settimana. Nessun server: è un'abitudine, non una trappola.

export const GIORNI_KEY = "mikilab_bottega_giorni";
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const doy = (d = new Date()) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
const pick = (arr, seed) => arr[((seed % arr.length) + arr.length) % arr.length];

export const TRADIZIONI = [
  { m: 1, d: 1, it: "Capodanno: in Puglia il pane nuovo dell'anno si benedice e si divide con i vicini.", de: "Neujahr: in Apulien wird das erste Brot des Jahres gesegnet und mit den Nachbarn geteilt.", en: "New Year: in Puglia the year's first bread is blessed and shared with the neighbours." },
  { m: 1, d: 6, it: "Epifania: la Befana lasciava pane e fichi secchi; in Germania i Sternsinger portano il Dreikönigskuchen.", de: "Dreikönig: die Sternsinger ziehen umher, es gibt Dreikönigskuchen; in Italien brachte die Befana Brot und Feigen.", en: "Epiphany: the Befana left bread and dried figs; in Germany the Sternsinger bring the Dreikönigskuchen." },
  { m: 1, d: 17, it: "Sant'Antonio Abate: pane benedetto per gli animali e le case, dal Sud fino alle Alpi.", de: "Antonius der Große: gesegnetes Brot für Tiere und Häuser, vom Süden bis zu den Alpen.", en: "St Anthony the Abbot: blessed bread for animals and homes, from the South up to the Alps." },
  { m: 2, d: 2, it: "Candelora: in Lucania si fanno le focacce con l'olio nuovo. Se piove, l'inverno è fuori.", de: "Lichtmess: in der Lukanien backt man Focaccia mit dem neuen Öl. Regnet es, ist der Winter vorbei.", en: "Candlemas: in Lucania focaccia is made with the new oil. If it rains, winter is out." },
  { m: 2, d: 5, it: "Sant'Agata: a Catania le minne di Sant'Agata, pan di Spagna e ricotta.", de: "Sankt Agatha: in Catania die Minne di Sant'Agata, Biskuit und Ricotta.", en: "St Agatha: in Catania the minne di Sant'Agata, sponge and ricotta." },
  { m: 3, d: 19, it: "San Giuseppe: zeppole in Campania, sfince in Sicilia, pane in forma di bastone del santo in Basilicata.", de: "Josefstag: Zeppole in Kampanien, Sfince in Sizilien, Brot in Form des Josefsstabs in der Basilikata.", en: "St Joseph: zeppole in Campania, sfince in Sicily, bread shaped like the saint's staff in Basilicata." },
  { m: 4, d: 25, it: "San Marco: a Venezia il bocolo, e il pane del dolce di San Marco.", de: "Markustag: in Venedig der Bocolo und das Gebäck des San Marco.", en: "St Mark: in Venice the bocolo and the San Marco sweet bread." },
  { m: 5, d: 1, it: "Primo maggio: pane, fave e pecorino nei campi. La merenda dei contadini di Lucania.", de: "Erster Mai: Brot, Saubohnen und Pecorino auf dem Feld. Die Brotzeit der Bauern der Lukanien.", en: "May Day: bread, broad beans and pecorino in the fields. The Lucanian farmers' snack." },
  { m: 6, d: 13, it: "Sant'Antonio da Padova: il pane di Sant'Antonio, benedetto e regalato ai poveri.", de: "Antonius von Padua: das Antoniusbrot, gesegnet und an Arme verschenkt.", en: "St Anthony of Padua: St Anthony's bread, blessed and given to the poor." },
  { m: 6, d: 24, it: "San Giovanni: la notte delle erbe; il pane con le noci nuove e il primo grano mietuto.", de: "Johannistag: die Nacht der Kräuter; Brot mit den ersten Nüssen und dem ersten geernteten Korn.", en: "St John: the night of herbs; bread with the new walnuts and the first harvested wheat." },
  { m: 6, d: 29, it: "Santi Pietro e Paolo: la mietitura è fatta, si cuoce il pane nuovo del grano dell'anno.", de: "Peter und Paul: die Ernte ist eingebracht, das erste Brot aus dem neuen Korn wird gebacken.", en: "Saints Peter and Paul: the harvest is done, the year's new-wheat bread is baked." },
  { m: 7, d: 2, it: "Madonna della Bruna, Matera: il carro di cartapesta, e il pane di Matera in tavola con la festa.", de: "Madonna della Bruna, Matera: der Wagen aus Pappmaché, und das Brot von Matera auf dem Festtisch.", en: "Madonna della Bruna, Matera: the papier-mâché float, and Matera bread on the festive table." },
  { m: 8, d: 10, it: "San Lorenzo: la notte delle stelle. Panini piccoli, cotti al mattino, mangiati sotto il cielo.", de: "Laurentius: die Nacht der Sternschnuppen. Kleine Brötchen, morgens gebacken, unter dem Himmel gegessen.", en: "St Lawrence: the night of shooting stars. Small rolls, baked in the morning, eaten under the sky." },
  { m: 8, d: 15, it: "Ferragosto: la focaccia con i pomodori d'estate, e il pane raffermo nella cialledda.", de: "Ferragosto: Focaccia mit Sommertomaten, und altbackenes Brot in der Cialledda.", en: "Ferragosto: focaccia with summer tomatoes, and stale bread in the cialledda." },
  { m: 9, d: 29, it: "San Michele: in Germania si ringrazia per il raccolto (Erntedank), pane di segale e mele nuove.", de: "Michaelistag: Erntedank, Roggenbrot und die ersten Äpfel.", en: "St Michael: harvest thanksgiving in Germany, rye bread and the first apples." },
  { m: 10, d: 16, it: "Giornata mondiale del pane. Il giorno di MikiLab: oggi regala mezza pagnotta a qualcuno.", de: "Welttag des Brotes. Der Tag von MikiLab: verschenke heute einen halben Laib.", en: "World Bread Day. MikiLab's day: give half a loaf to someone today." },
  { m: 10, d: 31, it: "Vigilia di Ognissanti: il pane dei morti, con noci e uvetta, per chi non c'è più.", de: "Allerheiligenabend: das Totenbrot mit Nüssen und Rosinen, für die, die nicht mehr da sind.", en: "All Hallows' Eve: the bread of the dead, with walnuts and raisins, for those who are gone." },
  { m: 11, d: 11, it: "San Martino: si tocca il vino nuovo; in Germania i Weckmänner, omini di pasta dolce con la pipa.", de: "Martinstag: der neue Wein; Weckmänner aus süßem Hefeteig, mit der Tonpfeife.", en: "St Martin: the new wine; in Germany the Weckmänner, sweet dough men with a clay pipe." },
  { m: 12, d: 6, it: "San Nicola: Bari fa festa; in Germania il Nikolaus lascia Stutenkerl e mandarini nella scarpa.", de: "Nikolaus: Bari feiert; der Nikolaus legt Stutenkerl und Mandarinen in den Stiefel.", en: "St Nicholas: Bari celebrates; in Germany the Nikolaus leaves Stutenkerl and mandarins in the boot." },
  { m: 12, d: 13, it: "Santa Lucia: in Sicilia niente pane e pasta, solo cuccìa di grano; in Svezia i Lussekatter allo zafferano.", de: "Luciatag: in Sizilien kein Brot, nur Cuccìa aus Weizen; in Schweden Lussekatter mit Safran.", en: "St Lucy: in Sicily no bread, only wheat cuccìa; in Sweden saffron Lussekatter." },
  { m: 12, d: 24, it: "Vigilia di Natale: il panettone e lo Stollen aspettano in dispensa da settimane. Stasera si tagliano.", de: "Heiligabend: Panettone und Stollen warten seit Wochen in der Kammer. Heute werden sie angeschnitten.", en: "Christmas Eve: the panettone and the Stollen have waited in the pantry for weeks. Tonight they are cut." },
  { m: 12, d: 25, it: "Natale: pane e panettone in tavola, e un pezzo messo da parte per il giorno dopo, come vuole l'usanza.", de: "Weihnachten: Brot und Panettone auf dem Tisch, und ein Stück für den nächsten Tag beiseitegelegt, wie es der Brauch will.", en: "Christmas: bread and panettone on the table, and a piece set aside for the next day, as custom wants." },
  { m: 12, d: 31, it: "San Silvestro: in Germania i Berliner (uno con la senape, per scherzo); da noi cotechino, lenticchie e pane.", de: "Silvester: Berliner (einer mit Senf, zum Spaß); in Italien Cotechino, Linsen und Brot.", en: "New Year's Eve: in Germany the Berliner (one filled with mustard, as a prank); in Italy cotechino, lentils and bread." },
];

const PROVERBI = [
  { it: "Chi ha il pane non ha i denti, chi ha i denti non ha il pane.", de: "Wer Brot hat, hat keine Zähne; wer Zähne hat, hat kein Brot.", en: "Those who have bread have no teeth; those who have teeth have no bread." },
  { it: "Pane e nozze: le cose buone vanno fatte in tempo.", de: "Brot und Hochzeit: gute Dinge macht man zur rechten Zeit.", en: "Bread and weddings: good things are done in good time." },
  { it: "Il pane degli altri ha sette croste.", de: "Das Brot der anderen hat sieben Krusten.", en: "Other people's bread has seven crusts." },
  { it: "Meglio pane con amore che cappone con dolore.", de: "Lieber Brot mit Liebe als Kapaun mit Kummer.", en: "Better bread with love than capon with sorrow." },
  { it: "Pane e cipolla a casa propria vale più di un banchetto altrove.", de: "Brot und Zwiebel daheim sind mehr wert als ein Festmahl anderswo.", en: "Bread and onion at home are worth more than a feast elsewhere." },
  { it: "Il forno caldo non aspetta nessuno.", de: "Der heiße Ofen wartet auf niemanden.", en: "A hot oven waits for no one." },
  { it: "Farina del proprio sacco.", de: "Mehl aus dem eigenen Sack.", en: "Flour from your own sack." },
  { it: "Chi impasta la sera mangia pane la mattina.", de: "Wer abends knetet, isst morgens Brot.", en: "Who kneads at night eats bread in the morning." },
  { it: "Il pane si spezza, non si taglia, quando è tra amici.", de: "Unter Freunden wird Brot gebrochen, nicht geschnitten.", en: "Among friends bread is broken, not cut." },
  { it: "Acqua, farina e pazienza: il resto è vanità.", de: "Wasser, Mehl und Geduld: der Rest ist Eitelkeit.", en: "Water, flour and patience: the rest is vanity." },
  { it: "Il lievito lavora anche quando dormi. Impara da lui.", de: "Der Sauerteig arbeitet auch, wenn du schläfst. Lern von ihm.", en: "The starter works while you sleep. Learn from it." },
  { it: "Pane di ieri, vino di un anno, amico di trent'anni.", de: "Brot von gestern, Wein von einem Jahr, Freund von dreißig Jahren.", en: "Yesterday's bread, a year's wine, a thirty-year friend." },
  { it: "Chi ha fretta, mangia crudo.", de: "Wer es eilig hat, isst roh.", en: "Who hurries eats raw." },
  { it: "Ogni pane ha la sua crosta, ogni giorno la sua fatica.", de: "Jedes Brot hat seine Kruste, jeder Tag seine Mühe.", en: "Every loaf has its crust, every day its toil." },
  { it: "A Miglionico dicono: il pane si guarda, poi si tocca, poi si sente. La bocca è l'ultima.", de: "In Miglionico sagt man: Brot wird angesehen, dann angefasst, dann gehört. Der Mund kommt zuletzt.", en: "In Miglionico they say: bread is looked at, then touched, then listened to. The mouth comes last." },
  { it: "Il sale poco si sente subito, il sale troppo si sente per sempre.", de: "Zu wenig Salz merkt man sofort, zu viel Salz für immer.", en: "Too little salt you notice at once, too much salt forever." },
  { it: "Non c'è pane cattivo per chi ha fame, ma c'è pane buono per chi ha pazienza.", de: "Es gibt kein schlechtes Brot für den Hungrigen, aber gutes Brot für den Geduldigen.", en: "There's no bad bread for the hungry, but there's good bread for the patient." },
  { it: "Il taglio è la firma del fornaio.", de: "Der Schnitt ist die Unterschrift des Bäckers.", en: "The score is the baker's signature." },
  { it: "Crosta che canta, cuore contento.", de: "Kruste, die singt, Herz, das lacht.", en: "A crust that sings, a heart that's glad." },
  { it: "Prima si nutre il lievito, poi la famiglia.", de: "Erst wird der Sauerteig gefüttert, dann die Familie.", en: "First you feed the starter, then the family." },
  { it: "Un pane venuto male insegna più di dieci venuti bene.", de: "Ein misslungenes Brot lehrt mehr als zehn gelungene.", en: "One loaf gone wrong teaches more than ten gone right." },
  { it: "La farina non mente: se l'impasto è molle, era troppa acqua.", de: "Mehl lügt nicht: ist der Teig weich, war es zu viel Wasser.", en: "Flour doesn't lie: if the dough is slack, it was too much water." },
  { it: "Con le mani infarinate non si litiga.", de: "Mit bemehlten Händen streitet man nicht.", en: "Nobody argues with floury hands." },
  { it: "Il pane grande si fa il sabato, per la domenica e per chi viene.", de: "Das große Brot backt man samstags, für den Sonntag und für den, der kommt.", en: "The big loaf is baked on Saturday, for Sunday and for whoever comes." },
];

const GESTI = [
  { it: "Apri il barattolo del lievito e annusalo: yogurt è bene, aceto è fame, marcio si butta.", de: "Öffne das Sauerteigglas und riech daran: Joghurt ist gut, Essig ist Hunger, faulig kommt weg.", en: "Open the starter jar and smell it: yoghurt is good, vinegar is hunger, rotten goes in the bin." },
  { it: "Pesa 500 g d'acqua a occhio in una ciotola, poi mettila sulla bilancia. Quanto hai sbagliato?", de: "Wiege 500 g Wasser nach Augenmaß in eine Schüssel, dann auf die Waage. Wie weit daneben?", en: "Pour 500 g of water by eye into a bowl, then weigh it. How far off were you?" },
  { it: "Guarda la crosta del pane che hai in casa controluce: leggi i colori, dal pallido all'ambra.", de: "Halte die Kruste deines Brotes gegen das Licht: lies die Farben, von blass bis bernstein.", en: "Hold your bread's crust against the light: read the colours, from pale to amber." },
  { it: "Fai la prova del dito su qualunque impasto oggi, anche la pizza comprata: impara la memoria del glutine.", de: "Mach heute die Fingerprobe an irgendeinem Teig, auch am gekauften Pizzateig: lern das Gedächtnis des Glutens.", en: "Do the poke test on any dough today, even shop-bought pizza dough: learn the gluten's memory." },
  { it: "Tocca la farina che hai: strofinala tra le dita. Fine come talco o granulosa? Ora sai che tipo è.", de: "Nimm dein Mehl zwischen die Finger. Fein wie Puder oder griffig? Jetzt weißt du, welcher Typ es ist.", en: "Rub your flour between your fingers. Fine as talc or gritty? Now you know what kind it is." },
  { it: "Metti un termometro nella cucina e segna la temperatura: è lei che decide i tempi, non la ricetta.", de: "Stell ein Thermometer in die Küche und notier die Temperatur: sie bestimmt die Zeiten, nicht das Rezept.", en: "Put a thermometer in the kitchen and note the temperature: it decides the timing, not the recipe." },
  { it: "Batti sotto una pagnotta e ascolta: vuoto o sordo? Due minuti, un orecchio da fornaio.", de: "Klopf auf den Boden eines Laibs und hör hin: hohl oder dumpf? Zwei Minuten, ein Bäckerohr.", en: "Tap the base of a loaf and listen: hollow or dull? Two minutes, a baker's ear." },
  { it: "Scrivi una riga negli appunti di una ricetta che hai fatto: la memoria delle mani va su carta.", de: "Schreib eine Zeile in die Notizen eines Rezepts, das du gebacken hast: das Gedächtnis der Hände gehört aufs Papier.", en: "Write one line in the notes of a recipe you've made: the hands' memory goes on paper." },
  { it: "Guarda dove metti la teglia nel forno: oggi prova un ripiano più in basso.", de: "Schau, wo du das Blech in den Ofen schiebst: probier heute eine Schiene tiefer.", en: "Look at where you put the tray in the oven: today try one rack lower." },
  { it: "Prendi una fetta di pane e guarda i buchi: fini, aperti, un buco solo? Dillo al Sommelier.", de: "Nimm eine Scheibe Brot und schau dir die Poren an: fein, offen, ein einziges Loch? Sag es dem Sommelier.", en: "Take a slice and look at the holes: fine, open, one big hole? Tell the sommelier." },
  { it: "Bagna le mani e piega un pezzo di impasto, anche di pasta frolla: senti come si comporta.", de: "Nasse Hände, und falte irgendein Stück Teig, auch Mürbeteig: spür, wie er sich verhält.", en: "Wet your hands and fold any piece of dough, even shortcrust: feel how it behaves." },
  { it: "Fai la spesa con una lista di quattro cose: farina, sale, lievito, tempo. Il tempo è gratis.", de: "Kauf mit einer Liste von vier Dingen ein: Mehl, Salz, Hefe, Zeit. Zeit ist umsonst.", en: "Shop with a list of four things: flour, salt, yeast, time. Time is free." },
  { it: "Rigenera un pane di ieri: spruzzalo d'acqua, 8 minuti a 180 °C. Sembra magia, è fisica.", de: "Frisch auf ein Brot von gestern: mit Wasser besprühen, 8 Minuten bei 180 °C. Sieht aus wie Zauberei, ist Physik.", en: "Refresh yesterday's bread: spray with water, 8 minutes at 180 °C. Looks like magic, it's physics." },
  { it: "Guarda le etichette di due farine al supermercato: cerca le proteine. Più di 12 %? È forte.", de: "Lies die Etiketten von zwei Mehlen im Laden: such das Eiweiß. Über 12 %? Es ist stark.", en: "Read the labels of two flours at the shop: look for protein. Over 12 %? It's strong." },
  { it: "Regala un pezzo di pane a qualcuno oggi, anche comprato. Il gesto conta più della crosta.", de: "Verschenk heute ein Stück Brot, auch gekauftes. Die Geste zählt mehr als die Kruste.", en: "Give someone a piece of bread today, even bought. The gesture counts more than the crust." },
  { it: "Accendi il forno vuoto per 30 minuti e misura: quanto ci mette a 230 °C? Il tuo forno ha un carattere.", de: "Heiz den leeren Ofen 30 Minuten und miss: wie lange bis 230 °C? Dein Ofen hat einen Charakter.", en: "Heat the empty oven for 30 minutes and measure: how long to 230 °C? Your oven has a character." },
  { it: "Prendi un cucchiaino di lievito madre e mettilo in un bicchiere d'acqua: galleggia? È pronto.", de: "Nimm einen Teelöffel Sauerteig und leg ihn in ein Glas Wasser: schwimmt er? Er ist bereit.", en: "Take a teaspoon of starter and drop it in a glass of water: does it float? It's ready." },
  { it: "Ripeti a memoria la percentuale di sale del pane: 2 su 100. Se la sai, non sbagli più un pane.", de: "Sag die Salzprozent von Brot auswendig: 2 auf 100. Wenn du das weißt, versalzt du nie wieder.", en: "Say the salt percentage of bread by heart: 2 in 100. Know it, and you'll never get a loaf wrong." },
  { it: "Chiedi a Sitor una parola che non conosci: la bottega risponde senza spendere niente.", de: "Frag Sitor nach einem Wort, das du nicht kennst: die Werkstatt antwortet, ohne etwas zu kosten.", en: "Ask Sitor a word you don't know: the workshop answers for free." },
  { it: "Guarda il cielo: se domani è umido, l'impasto vorrà un po' meno acqua. La farina respira.", de: "Schau zum Himmel: ist morgen feucht, will der Teig etwas weniger Wasser. Mehl atmet.", en: "Look at the sky: if tomorrow is humid, the dough will want a little less water. Flour breathes." },
];

const WHY = {
  0: { it: "È domenica: il pane grande, quello che dura la settimana.", de: "Sonntag: das große Brot, das die Woche hält.", en: "Sunday: the big loaf that lasts the week." },
  1: { it: "Lunedì: qualcosa di semplice, che si impasta la sera senza pensarci.", de: "Montag: etwas Einfaches, abends geknetet, ohne nachzudenken.", en: "Monday: something simple, kneaded in the evening without thinking." },
  2: { it: "Martedì: un dolce da colazione per la settimana.", de: "Dienstag: etwas Süßes fürs Frühstück der Woche.", en: "Tuesday: a sweet bread for the week's breakfasts." },
  3: { it: "Mercoledì: panini, per la scuola e per il lavoro.", de: "Mittwoch: Brötchen, für Schule und Arbeit.", en: "Wednesday: rolls, for school and work." },
  4: { it: "Giovedì: si prepara la biga per il pane del fine settimana.", de: "Donnerstag: die Biga fürs Wochenendbrot wird angesetzt.", en: "Thursday: the biga for the weekend loaf is started." },
  5: { it: "Venerdì: pizza o focaccia, che la settimana è finita.", de: "Freitag: Pizza oder Focaccia, die Woche ist geschafft.", en: "Friday: pizza or focaccia, the week is done." },
  6: { it: "Sabato: il pane della domenica si fa oggi, per chi viene.", de: "Samstag: das Sonntagsbrot wird heute gebacken, für den, der kommt.", en: "Saturday: Sunday's bread is baked today, for whoever comes." },
};
const KINDS = { 0: ["pane"], 1: ["pane", "panini"], 2: ["dolce", "panettone"], 3: ["panini", "laugen"], 4: ["pane"], 5: ["pizza", "focaccia"], 6: ["pane"] };

export function breadOfToday(recipes, date = new Date()) {
  const usable = (recipes || []).filter((r) => r && !r.locked && num(r.flour_grams) > 0 && !/migliorator|backmittel|improver/i.test(r.name || ""));
  const wd = date.getDay(); const kinds = KINDS[wd];
  let pool = usable.filter((r) => kinds.includes(recipeKind(r)));
  if (wd === 4) pool = pool.filter((r) => fermentationHours(r).hasPre);
  if (!pool.length) pool = usable;
  if (!pool.length) return null;
  return pick(pool, doy(date) + date.getFullYear());
}

export function stampsInfo() {
  const days = LS.get(GIORNI_KEY, []) || [];
  const set = new Set(days);
  const today = dayKey();
  let streak = 0; const d = new Date();
  for (;;) { if (!set.has(dayKey(d))) break; streak++; d.setDate(d.getDate() - 1); }
  const m = today.slice(0, 7);
  return { days, set, today: set.has(today), streak, month: days.filter((x) => x.startsWith(m)).length, total: days.length };
}

export default function Almanacco({ onBack, onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [recipes, setRecipes] = useState([]);
  const [info, setInfo] = useState(stampsInfo);
  const [rem, setRem] = useState(() => LS.get("mikilab_promemoria", { wd: 6, h: "09:00" }));
  useEffect(() => { let ok = true; recipesApi.list("mikilab").then((d) => { if (ok) setRecipes(d || []); }).catch(() => {}); return () => { ok = false; }; }, []);
  const now = new Date();
  const seed = doy(now) + now.getFullYear() * 7;
  const trad = TRADIZIONI.find((t) => t.m === now.getMonth() + 1 && t.d === now.getDate());
  const prov = pick(PROVERBI, seed);
  const gesto = pick(GESTI, seed * 3 + 1);
  const bread = useMemo(() => breadOfToday(recipes, now), [recipes]); // eslint-disable-line react-hooks/exhaustive-deps
  const stamp = () => {
    if (info.today) return;
    const days = [...new Set([...(info.days || []), dayKey()])].sort().slice(-400);
    LS.set(GIORNI_KEY, days); const n = stampsInfo(); setInfo(n);
    toast.success(tri("Timbro messo. Buona giornata in bottega.", "Stempel gesetzt. Einen schönen Tag in der Backstube.", "Stamped. Have a good day in the workshop."));
    if (n.total >= 7 && award("sette_giorni")) toast.success(tri("Medaglia: sette giorni in bottega.", "Medaille: sieben Tage in der Backstube.", "Medal: seven days in the workshop."));
  };
  const openRecipe = (id) => { if (onNav) onNav("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 200); };
  const go = (r) => (onNav ? onNav(r) : window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route: r } })));
  const ics = () => {
    LS.set("mikilab_promemoria", rem);
    const [hh, mm] = String(rem.h || "09:00").split(":").map(Number);
    const d = new Date(); const diff = (num(rem.wd) - d.getDay() + 7) % 7; d.setDate(d.getDate() + diff); d.setHours(hh || 9, mm || 0, 0, 0);
    const p = (n) => String(n).padStart(2, "0"); const loc = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
    const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][num(rem.wd)];
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
    const txt = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MikiLab//Almanacco//IT\nBEGIN:VEVENT\nUID:mikilab-pane-settimana-${Date.now()}@mikilab.de\nDTSTAMP:${stamp}\nDTSTART:${loc}\nDTEND:${loc.slice(0, 9)}${p(hh || 9)}${p((mm || 0) + 30 > 59 ? 59 : (mm || 0) + 30)}00\nRRULE:FREQ=WEEKLY;BYDAY=${BYDAY}\nSUMMARY:${tri("Il pane della settimana · MikiLab", "Das Brot der Woche · MikiLab", "The bread of the week · MikiLab")}\nDESCRIPTION:https://mikilab.de/oggi\nBEGIN:VALARM\nTRIGGER:-PT0M\nACTION:DISPLAY\nDESCRIPTION:MikiLab\nEND:VALARM\nEND:VEVENT\nEND:VCALENDAR\n`;
    if (!downloadBlob(new Blob([txt], { type: "text/calendar" }), "mikilab-pane-della-settimana.ics")) toast.error(tri("Non riesco a creare il file.", "Datei kann nicht erstellt werden.", "Can't create the file."));
    else toast.success(tri("Promemoria pronto: aprilo e salvalo nel calendario.", "Erinnerung fertig: öffnen und im Kalender speichern.", "Reminder ready: open it and save it to the calendar."));
  };
  const WD = [tri("domenica", "Sonntag", "Sunday"), tri("lunedì", "Montag", "Monday"), tri("martedì", "Dienstag", "Tuesday"), tri("mercoledì", "Mittwoch", "Wednesday"), tri("giovedì", "Donnerstag", "Thursday"), tri("venerdì", "Freitag", "Friday"), tri("sabato", "Samstag", "Saturday")];
  // griglia del mese
  const first = new Date(now.getFullYear(), now.getMonth(), 1); const nDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells = [...Array(offset).fill(null), ...Array.from({ length: nDays }, (_, i) => i + 1)];

  return (
    <div data-testid="almanacco-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="almanacco-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><Sun className="w-3 h-3" />{tri("L'almanacco del fornaio", "Der Almanach des Bäckers", "The baker's almanac")}</p>
        <h1 className="font-display text-2xl font-black text-foreground">{fmtDateLong(now, lang)}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tri("Ogni giorno la bottega ha una pagina diversa. Passa, leggi, lascia il timbro.", "Jeden Tag hat die Backstube eine andere Seite. Komm vorbei, lies, setz den Stempel.", "Every day the workshop has a different page. Drop by, read, leave your stamp.")}</p>
      </div>
      {trad && <div data-testid="alm-trad" className="rounded-2xl border border-primary/40 bg-primary/8 p-3"><p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary mb-1">{tri("Oggi si festeggia", "Heute feiert man", "Today we celebrate")}</p><p className="text-[13.5px] text-foreground leading-snug">{L(trad)}</p></div>}
      <div data-testid="alm-prov" className="rounded-2xl border border-border bg-card p-3"><p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-1">{tri("Il proverbio", "Das Sprichwort", "The proverb")}</p><p className="font-display italic text-[16px] text-foreground leading-snug">“{L(prov)}”</p></div>
      <div data-testid="alm-gesto" className="rounded-2xl border border-salvia/40 bg-salvia/8 p-3"><p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia mb-1">{tri("Il gesto di oggi (due minuti)", "Der Handgriff des Tages (zwei Minuten)", "Today's gesture (two minutes)")}</p><p className="text-[13.5px] text-foreground leading-snug">{L(gesto)}</p></div>
      {bread && (
        <button data-testid="alm-bread" onClick={() => openRecipe(bread.id)} className="w-full text-left rounded-2xl border border-border bg-card p-3 active:scale-[0.99]">
          <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-1">{tri("Il pane di oggi", "Das Brot des Tages", "Today's bread")}</p>
          <p className="font-display text-[18px] font-bold text-foreground leading-tight flex items-center gap-1">{rLoc(bread, "name", lang)}<ChevronRight className="w-4 h-4 text-primary" /></p>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">{L(WHY[now.getDay()])}</p>
        </button>
      )}
      <div data-testid="alm-stamps" className="rounded-2xl border border-border bg-card p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{tri("I timbri del mese", "Die Stempel des Monats", "This month's stamps")}</p>
          <p className="text-[12px] text-muted-foreground">{info.month}/{nDays} · {tri("di fila", "in Folge", "in a row")}: <b className="text-foreground">{info.streak}</b></p>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => { const k = d ? dayKey(new Date(now.getFullYear(), now.getMonth(), d)) : null; const on = k && info.set.has(k); const isToday = d === now.getDate(); return <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-mono-data ${!d ? "" : on ? "bg-salvia text-white font-bold" : isToday ? "border border-primary text-primary" : "bg-muted/40 text-muted-foreground"}`}>{d || ""}</div>; })}
        </div>
        <button data-testid="alm-stamp" onClick={stamp} disabled={info.today} className={`w-full inline-flex items-center justify-center gap-1.5 text-[13px] font-bold px-3 py-2.5 rounded-xl active:scale-95 ${info.today ? "bg-salvia/15 text-salvia" : "bg-salvia text-white"}`}><Stamp className="w-4 h-4" />{info.today ? tri("Timbro di oggi messo", "Stempel für heute gesetzt", "Today's stamp is in") : tri("Sono passato in bottega", "Ich war in der Backstube", "I dropped by the workshop")}</button>
        <p className="text-[11px] text-muted-foreground">{tri("La bottega non chiude e non tiene il conto contro di te: se salti un giorno, il timbro ti aspetta. A sette timbri, una medaglia.", "Die Backstube schließt nie und rechnet nicht gegen dich: verpasst du einen Tag, wartet der Stempel. Bei sieben Stempeln eine Medaille.", "The workshop never closes and doesn't count against you: skip a day and the stamp waits. Seven stamps, one medal.")}</p>
      </div>
      <div data-testid="alm-rem" className="rounded-2xl border border-border bg-card p-3 space-y-2">
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{tri("Il pane della settimana", "Das Brot der Woche", "The bread of the week")}</p>
        <p className="text-[12.5px] text-foreground/85 leading-snug">{tri("Scegli il giorno e l'ora in cui vuoi impastare ogni settimana: il promemoria va nel calendario del telefono, senza notifiche del sito.", "Wähl Tag und Uhrzeit, an denen du jede Woche kneten willst: die Erinnerung kommt in den Kalender des Handys, ohne Benachrichtigungen der Seite.", "Choose the day and time you want to knead every week: the reminder goes into your phone's calendar, no notifications from the site.")}</p>
        <div className="flex gap-2">
          <select data-testid="alm-wd" value={rem.wd} onChange={(e) => setRem({ ...rem, wd: Number(e.target.value) })} className="flex-1 text-[13px] font-semibold bg-background text-foreground border border-border rounded-lg px-2 py-2 outline-none">{WD.map((w, i) => <option key={i} value={i}>{w}</option>)}</select>
          <input data-testid="alm-h" type="time" value={rem.h} onChange={(e) => setRem({ ...rem, h: e.target.value })} className="w-28 font-mono-data font-bold text-foreground bg-background border border-border rounded-lg px-2 py-2 outline-none" />
        </div>
        <button data-testid="alm-ics" onClick={ics} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl bg-primary text-white active:scale-95"><Calendar className="w-4 h-4" />{tri("Metti nel calendario", "In den Kalender", "Add to calendar")}</button>
      </div>
      <button data-testid="alm-mappa" onClick={() => go("mappa")} className="w-full text-left rounded-2xl border border-border bg-card p-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary shrink-0" /><span className="text-[13px] text-foreground">{tri("Non sai da dove cominciare? La mappa di MikiLab.", "Du weißt nicht, wo anfangen? Die Karte von MikiLab.", "Don't know where to start? The map of MikiLab.")}</span><ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" /></button>
      <p className="text-[11px] text-muted-foreground">{tri("Timbri e promemoria restano nel tuo telefono. Ventiquattro proverbi, venti gesti, ventitré feste: torna, e li trovi diversi.", "Stempel und Erinnerungen bleiben auf deinem Handy. Vierundzwanzig Sprichwörter, zwanzig Handgriffe, dreiundzwanzig Feste: komm wieder, und du findest sie anders.", "Stamps and reminders stay on your phone. Twenty-four proverbs, twenty gestures, twenty-three feasts: come back and they'll be different.")}</p>
    </div>
  );
}
