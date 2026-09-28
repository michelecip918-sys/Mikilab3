import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Search, ChefHat, GraduationCap, Sprout, Calculator, Flame, Baby, UtensilsCrossed, Star, MessageCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useFeatures } from "@/lib/features";
import { usePublicContent } from "@/lib/publicContent";
import { isNightMode } from "@/lib/notte";
import { isBigMode } from "@/components/PrimoGiro";

// V128 — TUTTO MIKILAB. Una pagina sola al posto di tre elenchi (Strumenti, Mappa, «Tutto MikiLab» in Home):
// otto stanze, ogni pagina del sito con una riga che dice a cosa serve. La Home mostra solo le otto porte.
// Le pagine che possono essere vuote (test del mese, calendario, perché MikiLab, farine, dirette, «Cosa faccio?»)
// compaiono solo quando hanno qualcosa da mostrare o sono accese.

const nav = (route) => window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route } }));
const openChat = () => window.dispatchEvent(new CustomEvent("mikilab-open-chat"));
const T = (it, de, en) => ({ it, de, en });
const V = (r, t, d, extra = {}) => ({ r, t, d, ...extra });

export const STANZE = [
  { k: "ricette", I: ChefHat, t: T("Le ricette", "Die Rezepte", "The recipes"), d: T("tutte le ricette e i modi per sceglierle", "alle Rezepte und wie du sie auswählst", "every recipe and ways to choose one"), items: [
    V("recipes", T("Il ricettario", "Das Rezeptbuch", "The recipe book"), T("pane, panini, focacce, pizza e dolci, divisi per reparto", "Brot, Brötchen, Focaccia, Pizza und Süßes, nach Bereichen", "bread, rolls, focaccia, pizza and sweets, by section")),
    V("collezioni", T("Le collezioni", "Die Sammlungen", "The collections"), T("le ricette per come si usano: in due ore, la domenica, con il lievito madre…", "die Rezepte nach Gebrauch: in zwei Stunden, sonntags, mit Sauerteig…", "recipes by use: in two hours, on Sunday, with sourdough…")),
    V("officina:cosa", T("Cosa posso fare adesso?", "Was kann ich jetzt machen?", "What can I make now?"), T("scegli tempo, lievito e dispensa: ti dice quali ricette puoi fare (senza IA)", "wähle Zeit, Triebmittel und Vorrat: es zeigt, welche Rezepte gehen (ohne KI)", "choose time, leavening and pantry: it shows which recipes you can make (no AI)")),
    V("cosa-faccio", T("Chiedi a Sitor cosa fare", "Sitor fragen, was du backen kannst", "Ask Sitor what to make"), T("dici tempo, forno e ingredienti: Sitor (IA) sceglie fino a tre ricette", "sag Zeit, Ofen und Zutaten: Sitor (KI) wählt bis zu drei Rezepte", "tell time, oven and ingredients: Sitor (AI) picks up to three recipes"), { when: "plan" }),
    V("sorprendimi", T("Sorprendimi", "Überrasch mich", "Surprise me"), T("la ruota del fornaio sceglie per te", "das Bäckerrad wählt für dich", "the baker's wheel chooses for you")),
    V("salva", T("Il pane che salva", "Das Brot, das rettet", "The bread that saves"), T("senza lievito, senza forno, senza bilancia, senza corrente; la dispensa di scorta (scritto da Sitor)", "ohne Hefe, Ofen, Waage oder Strom; der Notvorrat (von Sitor)", "without yeast, oven, scale or power; the emergency pantry (by Sitor)")),
    V("ricette-view:sapori", T("Sapori di casa: il Sud", "Geschmack von zu Hause: der Süden", "Home flavours: the South"), T("le ricette di Basilicata e Puglia, ognuna con la sua storia", "die Rezepte aus Basilikata und Apulien, jedes mit seiner Geschichte", "recipes from Basilicata and Puglia, each with its story")),
    V("ricette-view:custodite", T("Le ricette custodite", "Die bewahrten Rezepte", "The treasured recipes"), T("pani del Sud Italia e della Germania, col metodo di Michele", "Brote aus Süditalien und Deutschland, mit Micheles Methode", "breads from southern Italy and Germany, with Michele's method")),
    V("paese", T("Il pane del mio paese", "Das Brot meiner Heimat", "The bread of my hometown"), T("15 regioni: prima i pani di casa tua", "15 Regionen: zuerst die Brote deiner Heimat", "15 regions: the breads of your home first")),
    V("dalmondo", T("Dal mondo e moderni", "Aus aller Welt & modern", "From the world & modern"), T("i pani di altri paesi e le tecniche nuove", "Brote aus anderen Ländern und neue Techniken", "breads from other countries and new techniques")),
    V("verde", T("Il verde di MikiLab", "Das Grüne von MikiLab", "MikiLab's green"), T("pani e dolci verdi: canapa, spinaci, spirulina, pistacchio", "grüne Brote und Süßes: Hanf, Spinat, Spirulina, Pistazie", "green breads and sweets: hemp, spinach, spirulina, pistachio")),
    V("tiktok", T("MikiLab su TikTok", "MikiLab auf TikTok", "MikiLab on TikTok"), T("il numero della ricetta dai video, i video di Michele, fai il tuo", "die Rezeptnummer aus den Videos, Micheles Videos, dein eigenes Video", "the recipe number from the videos, Michele's videos, make your own")), // V132
    V("pasta", T("Le mani in pasta", "Die Hände im Teig", "Hands in the dough"), T("la pasta di casa: dodici forme scritte da Sitor, dosi a persona", "Pasta von Hand: zwölf Formen von Sitor, Mengen pro Person", "homemade pasta: twelve shapes written by Sitor, per-person amounts")),
  ] },
  { k: "imparare", I: GraduationCap, t: T("Imparare", "Lernen", "Learning"), d: T("dalle basi alle tecniche, un passo alla volta", "von den Grundlagen zu den Techniken, Schritt für Schritt", "from the basics to the techniques, one step at a time"), items: [
    V("percorso", T("Il percorso in sei tappe", "Der Weg in sechs Etappen", "The six-stage path"), T("dai primi panini al panettone: la prossima ricetta è sempre pronta", "von den ersten Brötchen bis zum Panettone: das nächste Rezept liegt bereit", "from the first rolls to panettone: the next recipe is always ready")),
    V("primopane", T("Il tuo primo pane in 7 giorni", "Dein erstes Brot in 7 Tagen", "Your first bread in 7 days"), T("un passo al giorno, dalla spesa al pane con la biga, con attestato", "ein Schritt pro Tag, vom Einkauf bis zum Biga-Brot, mit Urkunde", "one step a day, from shopping to a biga loaf, with a certificate")),
    V("inizia", T("Prima di iniziare", "Bevor du anfängst", "Before you start"), T("le basi: farina, acqua, sale, lievito, tempo", "die Grundlagen: Mehl, Wasser, Salz, Hefe, Zeit", "the basics: flour, water, salt, yeast, time")),
    V("tecniche", T("Le tecniche", "Die Techniken", "The techniques"), T("pieghe, pirlatura, baguette, croissant, filone, panettone: disegnate passo passo", "Falten, Rundwirken, Baguette, Croissant, Laib, Panettone: Schritt für Schritt gezeichnet", "folds, shaping, baguette, croissant, loaf, panettone: drawn step by step")),
    V("ricette-view:farine", T("Tabelle e farine", "Tabellen und Mehle", "Tables and flours"), T("le sigle delle farine italiane e tedesche, e quale scegliere", "die italienischen und deutschen Mehltypen, und welches du nimmst", "Italian and German flour codes, and which to choose")),
    V("farine", T("Che farina uso?", "Welches Mehl nehme ich?", "Which flour do I use?"), T("le farine spiegate semplici", "die Mehle einfach erklärt", "flours explained simply"), { when: "farine" }),
    V("ricette-view:guida", T("Studia il mestiere", "Lerne das Handwerk", "Study the craft"), T("l'enciclopedia del pane, il glossario e gli attrezzi che servono davvero", "das Brotlexikon, das Glossar und die Geräte, die du wirklich brauchst", "the bread encyclopedia, the glossary and the tools you really need")),
    V("domande", T("Le domande del fornaio", "Die Fragen des Bäckers", "The baker's questions"), T("49 domande con la risposta pronta, senza IA", "49 Fragen mit fertiger Antwort, ohne KI", "49 questions with a ready answer, no AI")),
    V("officina:confronto", T("Metti a confronto", "Im Vergleich", "Side by side"), T("due ricette una accanto all'altra, la differenza vera", "zwei Rezepte nebeneinander, der echte Unterschied", "two recipes next to each other, the real difference")),
    V("miglioratore", T("Il mio miglioratore", "Mein Verbesserer", "My improver"), T("cos'è, come si dosa, come farlo in casa", "was es ist, wie man es dosiert, wie man es selbst macht", "what it is, how to dose it, how to make it at home")),
    V("libretto", T("Il libretto dei 5 panini", "Das Heft der 5 Brötchen", "The 5 rolls booklet"), T("le prime cinque ricette da stampare e appendere in cucina", "die ersten fünf Rezepte zum Drucken und Aufhängen", "the first five recipes to print and hang in the kitchen")),
    V("testmese", T("Il test del mese", "Der Test des Monats", "Test of the month"), T("ogni mese una prova da fare insieme", "jeden Monat eine Probe zum gemeinsamen Backen", "every month a bake to do together"), { when: "testmese" }),
    V("giro", T("Il primo giro con Sitor", "Die erste Runde mit Sitor", "The first tour with Sitor"), T("come funziona il sito, in un minuto", "wie die Seite funktioniert, in einer Minute", "how the site works, in a minute")),
  ] },
  { k: "lievito", I: Sprout, t: T("Il lievito madre", "Der Sauerteig", "The sourdough starter"), d: T("crearlo, curarlo, averlo pronto all'ora giusta", "ansetzen, pflegen, pünktlich bereit haben", "create it, care for it, have it ready on time"), items: [
    V("crealievito", T("Crea il tuo lievito", "Sauerteig ansetzen", "Create your starter"), T("da zero, in una settimana", "von null, in einer Woche", "from scratch, in a week")),
    V("curalievito", T("Curare il lievito madre", "Den Sauerteig pflegen", "Caring for your starter"), T("rinfreschi, frigo, viaggi, emergenze", "Auffrischen, Kühlschrank, Reisen, Notfälle", "feeds, fridge, travel, emergencies")),
    V("miolievito", T("Il mio lievito madre", "Mein Sauerteig", "My sourdough starter"), T("nome, compleanno, pasti e il QR per farlo viaggiare", "Name, Geburtstag, Mahlzeiten und der QR-Code zum Verreisen", "name, birthday, feeds and the QR to make it travel")),
    V("rinfresco", T("Pronto all'ora giusta", "Pünktlich bereit", "Ready on time"), T("quanto rinfrescare adesso per averlo al picco quando impasti", "wie viel du jetzt auffrischst, damit er beim Kneten aktiv ist", "how much to feed now so it peaks when you mix")),
  ] },
  { k: "calcoli", I: Calculator, t: T("Calcoli e orari", "Rechnen und Zeiten", "Maths and timing"), d: T("grammi, lievito, tempi, la spesa della settimana", "Gramm, Hefe, Zeiten, der Wocheneinkauf", "grams, yeast, timing, the week's shopping"), items: [
    V("calcolatrice", T("La calcolatrice del fornaio", "Der Bäckerrechner", "The baker's calculator"), T("il tuo impasto in grammi: pane, focaccia, biga, poolish, lievito madre", "dein Teig in Gramm: Brot, Focaccia, Biga, Poolish, Sauerteig", "your dough in grams: bread, focaccia, biga, poolish, sourdough")),
    V("miglioratoreperte", T("Il miglioratore per la tua ricetta", "Der Verbesserer für dein Rezept", "The improver for your recipe"), T("incolla una ricetta qualsiasi: quanto miglioratore naturale di Michele aggiungere, in grammi", "füg ein beliebiges Rezept ein: wie viel von Micheles natürlichem Verbesserer, in Gramm", "paste any recipe: how much of Michele's natural improver to add, in grams")), // V131
    V("pizza", T("Calcolo impasto pizza", "Pizzateig-Rechner", "Pizza dough calculator"), T("panetti o teglia, il lievito giusto per le tue ore, anche col frigo", "Teigkugeln oder Blech, die richtige Hefe für deine Stunden, auch mit Kühlschrank", "dough balls or pan, the right yeast for your hours, fridge too")),
    V("formule", T("Le mie formule", "Meine Rezepturen", "My formulas"), T("le formule che hai salvato, solo nel tuo telefono", "deine gespeicherten Rezepturen, nur auf deinem Handy", "the formulas you saved, only on your phone")),
    V("sveglia", T("La sveglia del panettiere", "Der Bäckerwecker", "The baker's alarm"), T("pane pronto all'ora che dici tu: ogni passo nel calendario", "Brot fertig, wann du willst: jeder Schritt im Kalender", "bread ready when you say: every step in your calendar")),
    V("plan", T("Piano della settimana", "Wochenplan", "Weekly plan"), T("le ricette della settimana e la lista della spesa", "die Rezepte der Woche und die Einkaufsliste", "the week's recipes and the shopping list")),
    V("bilancia", T("Pane senza bilancia", "Brot ohne Waage", "Bread without a scale"), T("grammi in tazze e cucchiai", "Gramm in Tassen und Löffeln", "grams in cups and spoons")),
    V("calendario", T("Il calendario del pane", "Der Brotkalender", "The bread calendar"), T("cosa si impasta nelle feste e nelle stagioni", "was man zu Festen und Jahreszeiten backt", "what to bake for feasts and seasons"), { when: "calendario" }),
    V("laboratorio", T("Il laboratorio", "Die Backstube", "The bakery"), T("per chi panifica di mestiere: produzione, cella, conversioni, forno, cartellini", "für alle, die beruflich backen: Produktion, Kühlzelle, Umrechnungen, Ofen, Schilder", "for those who bake for a living: production, cold room, conversions, oven, tags")),
  ] },
  { k: "cucina", I: Flame, t: T("Mentre impasti e inforni", "Beim Kneten und Backen", "While you knead and bake"), d: T("prove, rimedi e il tuo forno", "Proben, Rettung und dein Ofen", "tests, fixes and your oven"), items: [
    V("banco", T("Il banco delle prove", "Der Probentisch", "The test bench"), T("le prove con le mani (dito, finestra, galleggiamento) e il tempo di oggi", "die Handproben (Finger, Fenster, Schwimmtest) und das Wetter von heute", "the hand tests (poke, windowpane, float) and today's weather")),
    V("officina:soccorso", T("Pronto soccorso dell'impasto", "Erste Hilfe für den Teig", "Dough first aid"), T("cosa fare quando l'impasto va storto", "was tun, wenn der Teig schiefgeht", "what to do when the dough goes wrong")),
    V("officina:occhio", T("L'occhio di Sitor", "Sitors Auge", "Sitor's eye"), T("una foto alla crosta o alla fetta, letta nel telefono", "ein Foto von Kruste oder Scheibe, im Handy gelesen", "a photo of the crust or slice, read on your phone")),
    V("officina:taglio", T("Disegna il taglio", "Zeichne den Schnitt", "Draw the score"), T("forme e schemi del taglio, e come si apre in forno", "Formen und Muster des Schnitts, und wie er im Ofen aufgeht", "scoring shapes and patterns, and how it opens in the oven")),
    V("crosta", T("Il pane parla", "Das Brot spricht", "The bread speaks"), T("batti sul fondo del pane: il telefono ti dice se è cotto", "klopf auf den Brotboden: das Handy sagt dir, ob es fertig ist", "knock on the loaf: your phone tells you if it's done")),
    V("mappaforno", T("La mappa del tuo forno", "Die Karte deines Ofens", "The map of your oven"), T("scopri dove scalda di più", "finde heraus, wo er am stärksten heizt", "find out where it runs hot")),
    V("mioforno", T("Il mio forno", "Mein Ofen", "My oven"), T("foto e note dei tuoi pani, solo nel tuo telefono", "Fotos und Notizen deiner Brote, nur auf deinem Handy", "photos and notes of your bakes, only on your phone")),
    V("live", T("Impastiamo insieme", "Backen wir zusammen", "Let's bake together"), T("le dirette con Michele", "Live-Sessions mit Michele", "live sessions with Michele"), { when: "live" }),
  ] },
  { k: "bambini", I: Baby, t: T("Bambini e scuola", "Kinder und Schule", "Children and school"), d: T("il pane con i piccoli, a casa e in classe", "Brot mit den Kleinen, zu Hause und in der Klasse", "bread with little ones, at home and in class"), items: [
    V("piccoli", T("Il pane dei piccoli", "Das Brot der Kleinen", "Bread for little ones"), T("dai tre anni: dodici forme, la storia del pane, la notte del fornaio, il gioco del lievito, il diploma (scritto da Sitor)", "ab drei: zwölf Formen, die Brotgeschichte, die Nacht des Bäckers, das Hefespiel, die Urkunde (von Sitor)", "from age three: twelve shapes, the story of bread, the baker's night, the yeast game, the diploma (by Sitor)")),
    V("scuola", T("MikiLab a scuola", "MikiLab in der Schule", "MikiLab at school"), T("dall'asilo alla quinta: lezioni pronte, giochi, disegni, il quaderno della classe, l'attestato", "von der Kita bis zur fünften Klasse: fertige Stunden, Spiele, Ausmalbilder, Klassenheft, Urkunde", "from kindergarten to fifth grade: ready lessons, games, colouring, class notebook, certificate")),
  ] },
  { k: "tavola", I: UtensilsCrossed, t: T("A tavola e da regalare", "Am Tisch und zum Verschenken", "At the table and as gifts"), d: T("ospiti, idee per cena, pane di ieri, regali", "Gäste, Ideen fürs Abendessen, Brot von gestern, Geschenke", "guests, dinner ideas, yesterday's bread, gifts"), items: [
    V("ospiti", T("Stasera ho ospiti", "Heute kommen Gäste", "Guests tonight"), T("occasione, persone, orario: pani, dosi, quando iniziare, spesa", "Anlass, Personen, Uhrzeit: Brote, Mengen, wann anfangen, Einkauf", "occasion, people, time: breads, amounts, when to start, shopping")),
    V("panico", T("Panico da cena", "Abendessen-Panik", "Dinner panic"), T("idee veloci per stasera, già scritte (senza IA)", "schnelle Ideen für heute Abend, fertig geschrieben (ohne KI)", "quick ideas for tonight, already written (no AI)")),
    V("sughi", T("Sopra la focaccia", "Auf die Focaccia", "On the focaccia"), T("condimenti per focacce, pizze e pane", "Beläge für Focaccia, Pizza und Brot", "toppings for focaccia, pizza and bread")),
    V("paneieri", T("Pane di ieri: seconda vita", "Brot von gestern: zweites Leben", "Yesterday's bread: second life"), T("cosa fare con il pane vecchio", "was man mit altem Brot macht", "what to do with old bread")),
    V("carta", T("La carta dei pani", "Die Brotkarte", "The bread menu"), T("un menu elegante da stampare", "eine elegante Karte zum Drucken", "an elegant menu to print")),
    V("sommelier", T("Il sommelier del pane", "Der Brot-Sommelier", "The bread sommelier"), T("assaggia con cinque sensi: scheda, verdetto di Sitor, abbinamenti", "mit fünf Sinnen verkosten: Karte, Sitors Urteil, Kombinationen", "taste with five senses: card, Sitor's verdict, pairings")),
    V("regala", T("Regala MikiLab", "MikiLab verschenken", "Gift MikiLab"), T("manda MikiLab a chi vuoi bene", "schick MikiLab an deine Liebsten", "send MikiLab to the people you love")),
    V("volantino", T("Il volantino da frigo", "Der Kühlschrank-Flyer", "The fridge flyer"), T("stampa il QR e porta MikiLab in un'altra cucina", "druck den QR-Code und bring MikiLab in eine andere Küche", "print the QR and take MikiLab to another kitchen")),
  ] },
  { k: "mie", I: Star, t: T("Le mie cose", "Meine Sachen", "My things"), d: T("i tuoi traguardi, i tuoi dati, come vedi il sito", "deine Erfolge, deine Daten, wie du die Seite siehst", "your milestones, your data, how you see the site"), items: [
    V("oggi", T("L'almanacco del fornaio", "Der Almanach des Bäckers", "The baker's almanac"), T("ogni giorno: la festa, il proverbio, un gesto, il pane di oggi, il timbro", "jeden Tag: das Fest, das Sprichwort, ein Handgriff, das Brot des Tages, der Stempel", "every day: the feast, the proverb, a gesture, today's bread, the stamp")),
    V("medaglie", T("Le mie medaglie", "Meine Medaillen", "My medals"), T("i tuoi passi in bottega", "deine Schritte in der Backstube", "your steps in the bakery")),
    V("anno", T("Il tuo anno da fornaio", "Dein Jahr als Bäcker", "Your year as a baker"), T("i tuoi numeri in un manifesto da condividere", "deine Zahlen auf einem Plakat zum Teilen", "your numbers on a poster to share")),
    V("mensola", T("La mia mensola", "Mein Regal", "My shelf"), T("le tue ricette salvate e i traguardi", "deine gespeicherten Rezepte und Meilensteine", "your saved recipes and milestones")),
    V("libro", T("Il mio libro di pane", "Mein Brotbuch", "My bread book"), T("le preferite stampate come un libro, con i tuoi appunti", "die Favoriten gedruckt wie ein Buch, mit deinen Notizen", "favourites printed like a book, with your notes")),
    V("cucina", T("La mia cucina", "Meine Küche", "My kitchen"), T("i tuoi attrezzi e il tuo forno, salvati solo nel telefono", "deine Geräte und dein Ofen, nur auf dem Handy gespeichert", "your equipment and oven, saved only on your phone")),
    V("valigia", T("La valigia della bottega", "Der Koffer der Bottega", "The bottega suitcase"), T("porta tutto sul telefono nuovo", "nimm alles aufs neue Handy mit", "take everything to a new phone")),
    V("grande", T("Modo grande", "Großmodus", "Big mode"), T("scritte e pulsanti più grandi", "größere Schrift und Knöpfe", "bigger text and buttons"), { toggle: "grande" }),
    V("notte", T("Modo notte del fornaio", "Nachtmodus des Bäckers", "Baker's night mode"), T("schermo caldo e scuro, Sitor parla piano", "warmer, dunkler Bildschirm, Sitor spricht leise", "warm dark screen, Sitor speaks softly"), { toggle: "notte" }),
    V("dedica", T("Da Miglionico a Stoccarda", "Von Miglionico nach Stuttgart", "From Miglionico to Stuttgart"), T("la storia di Michele e dei panettieri che gli hanno insegnato il mestiere", "die Geschichte von Michele und den Bäckern, die ihm das Handwerk beibrachten", "the story of Michele and the bakers who taught him the trade")),
    V("perche", T("Perché MikiLab", "Warum MikiLab", "Why MikiLab"), T("cos'è e perché esiste", "was es ist und warum es das gibt", "what it is and why it exists"), { when: "perche" }),
  ] },
];

// Cerca in tutto MikiLab usa le stesse voci: stesso nome, così le due liste non possono mai essere diverse.
export const GROUPS = STANZE;

// Una voce si vede solo se ha qualcosa da mostrare (contenuti pubblicati) o se la funzione è accesa.
export function voceVisibile(it, feats, pub) {
  switch (it.when) {
    case "plan": return !feats || feats.FEATURE_PLAN !== false;
    case "live": return !!(pub && pub.hasLive) && (!feats || feats.FEATURE_LIVE !== false);
    case "calendario": return !!(pub && pub.hasCalendario);
    case "testmese": return !!(pub && pub.hasTestMese);
    case "perche": return !!(pub && pub.hasPerche);
    case "farine": return !!(pub && pub.hasFarine);
    default: return true;
  }
}

export const STANZA_KEY = "mikilab_stanza"; // sessionStorage: le stanze aperte in questa visita
const RECENTI_KEY = "mikilab_recenti";

export default function Mappa({ onBack, onNav }) {
  const go0 = (r) => (typeof onNav === "function" ? onNav(r) : nav(r));
  const { lang } = useLang();
  const feats = useFeatures();
  const pub = usePublicContent();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [q, setQ] = useState("");
  const [, setTick] = useState(0);
  const refs = useRef({});
  const [open, setOpen] = useState(() => {
    const want = window.__mkStanza; window.__mkStanza = null;
    let s = []; try { s = JSON.parse(sessionStorage.getItem(STANZA_KEY) || "[]"); } catch { /* */ }
    return new Set(want ? [want] : s);
  });
  const [focus, setFocus] = useState(() => (open.size === 1 ? [...open][0] : null));
  useEffect(() => { try { sessionStorage.setItem(STANZA_KEY, JSON.stringify([...open])); } catch { /* */ } }, [open]);
  useEffect(() => { // dalla Home: apri la stanza scelta e portala in vista
    const h = (e) => { const k = e?.detail?.k; if (!k) return; window.__mkStanza = null; setOpen((o) => new Set([...o, k])); setFocus(k); };
    window.addEventListener("mikilab-stanza", h);
    return () => window.removeEventListener("mikilab-stanza", h);
  }, []);
  useEffect(() => {
    if (!focus) return undefined;
    const t = setTimeout(() => { try { const el = refs.current[focus]; if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: "smooth" }); } catch { /* */ } }, 120); // sotto l'intestazione fissa
    return () => clearTimeout(t);
  }, [focus]);

  const readRecent = () => { try { return JSON.parse(localStorage.getItem(RECENTI_KEY) || "[]"); } catch { return []; } };
  const go = (r) => {
    if (r === "grande" || r === "notte") { go0(r); setTick((x) => x + 1); return; }
    try { localStorage.setItem(RECENTI_KEY, JSON.stringify([r, ...readRecent().filter((x) => x !== r)].slice(0, 8))); } catch { /* */ }
    go0(r);
  };
  const norm = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const stanze = STANZE.map((s) => ({ ...s, items: s.items.filter((it) => voceVisibile(it, feats, pub)) }));
  const tutte = stanze.flatMap((s) => s.items);
  const recent = readRecent().map((r) => tutte.find((it) => it.r === r)).filter(Boolean).slice(0, 4);
  const cerca = q.trim();
  const trovate = cerca ? stanze.map((s) => ({ ...s, items: s.items.filter((it) => norm(L(it.t) + " " + L(it.d)).includes(norm(cerca))) })).filter((s) => s.items.length) : null;
  const toggle = (k) => setOpen((o) => { const n = new Set(o); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const stato = (it) => (it.toggle === "grande" ? isBigMode() : it.toggle === "notte" ? isNightMode() : null);

  const riga = (it, testid) => {
    const st = stato(it);
    return (
      <button key={it.r} data-testid={testid} onClick={() => go(it.r)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left active:bg-muted/40">
        <span className="flex-1 min-w-0"><span className="block text-[14px] font-bold text-foreground leading-tight">{L(it.t)}</span><span className="block text-[12.5px] text-muted-foreground leading-snug">{L(it.d)}</span></span>
        {st === null ? <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          : <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full border ${st ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>{st ? tri("Acceso", "An", "On") : tri("Spento", "Aus", "Off")}</span>}
      </button>
    );
  };

  return (
    <div data-testid="mappa-page" className="max-w-2xl mx-auto px-1 sm:px-4 py-4 space-y-4">
      <button data-testid="mappa-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Tutto MikiLab", "Ganz MikiLab", "All of MikiLab")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-[13.5px] text-muted-foreground">{tri("Ogni pagina del sito, in otto stanze. Tocca una stanza per aprirla.", "Jede Seite der Website, in acht Räumen. Tippe auf einen Raum, um ihn zu öffnen.", "Every page of the site, in eight rooms. Tap a room to open it.")}</p>
      </div>
      <div className="relative"><Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" /><input data-testid="mappa-cerca" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tri("Cerca una pagina… (es. lievito, forno, stampa)", "Seite suchen… (z. B. Sauerteig, Ofen, Drucken)", "Search a page… (e.g. starter, oven, print)")} className="w-full text-[14px] bg-card text-foreground border border-border rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-primary" /></div>

      {!cerca && recent.length > 0 && (
        <div data-testid="mappa-recenti">
          <p className="text-[12px] font-bold text-muted-foreground mb-1.5">{tri("Usati di recente", "Zuletzt benutzt", "Recently used")}</p>
          <div className="flex flex-wrap gap-1.5">{recent.map((it) => <button key={it.r} data-testid={`recente-${it.r}`} onClick={() => go(it.r)} className="text-[12.5px] font-semibold px-3 py-1.5 rounded-full border border-primary/40 bg-primary/8 text-foreground active:scale-95">{L(it.t)}</button>)}</div>
        </div>
      )}

      {trovate && trovate.length === 0 && <p className="text-[13px] text-muted-foreground">{tri("Nessuna pagina con questa parola. Prova con un'altra, o chiedi a Sitor.", "Keine Seite mit diesem Wort. Versuch ein anderes, oder frag Sitor.", "No page with that word. Try another, or ask Sitor.")}</p>}
      {trovate && trovate.map((s) => (
        <section key={s.k} data-testid={`mappa-trovate-${s.k}`}>
          <p className="text-[12px] font-bold text-muted-foreground mb-1.5">{L(s.t)}</p>
          <div className="rounded-2xl border border-border bg-card divide-y">{s.items.map((it, i) => riga(it, `mappa-${s.k}-${i}`))}</div>
        </section>
      ))}

      {!trovate && stanze.map((s) => {
        const aperta = open.has(s.k);
        return (
          <section key={s.k} ref={(el) => { refs.current[s.k] = el; }} data-testid={`stanza-${s.k}`} className="scroll-mt-20 rounded-2xl border border-border bg-card overflow-hidden">
            <button data-testid={`stanza-${s.k}-apri`} aria-expanded={aperta} onClick={() => toggle(s.k)} className="w-full flex items-center gap-3 px-3 py-3 text-left">
              <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><s.I className="w-5 h-5 text-primary" /></span>
              <span className="flex-1 min-w-0"><span className="block font-display text-[17px] font-black text-foreground leading-tight">{L(s.t)}</span><span className="block text-[12.5px] text-muted-foreground leading-snug">{L(s.d)} · {s.items.length}</span></span>
              <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${aperta ? "rotate-180" : ""}`} />
            </button>
            {aperta && <div className="border-t border-border divide-y">{s.items.map((it, i) => riga(it, `mappa-${s.k}-${i}`))}</div>}
          </section>
        );
      })}

      <button data-testid="mappa-sitor" onClick={openChat} className="w-full flex items-center gap-3 rounded-2xl border border-salvia/40 bg-salvia/8 p-3 text-left">
        <MessageCircle className="w-5 h-5 text-salvia shrink-0" />
        <span className="flex-1 min-w-0"><span className="block text-[14px] font-bold text-foreground">{tri("Non trovi qualcosa? Chiedi a Sitor", "Du findest etwas nicht? Frag Sitor", "Can't find something? Ask Sitor")}</span><span className="block text-[12.5px] text-muted-foreground leading-snug">{tri("La guida IA di MikiLab: prima risponde la bottega, poi l'intelligenza artificiale se serve.", "Der KI-Guide von MikiLab: erst antwortet die Werkstatt, dann die künstliche Intelligenz, wenn nötig.", "MikiLab's AI guide: the workshop answers first, then the artificial intelligence if needed.")}</span></span>
      </button>
      <p className="text-[11.5px] text-muted-foreground">{tri("Niente conti, niente tracciamento: quello che fai resta nel tuo telefono.", "Keine Konten, kein Tracking: was du tust, bleibt auf deinem Handy.", "No accounts, no tracking: what you do stays on your phone.")}</p>
    </div>
  );
}
