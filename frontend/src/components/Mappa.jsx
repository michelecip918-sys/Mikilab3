import { useState } from "react";
import { ChevronLeft, Map, ChevronRight, Search } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useFeatures } from "@/lib/features"; // V123

// V100 — LA MAPPA DI MIKILAB. Tutto il sito in una pagina: ogni attrezzo con una riga che dice a cosa serve e dove sta,
// raggruppato per momento (imparare, impastare, il lievito, il forno, il laboratorio, condividere, Sitor). Un tocco e ci sei.
// Nessun dato: è una guida.

const nav = (route) => window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route } }));
const openChat = () => window.dispatchEvent(new CustomEvent("mikilab-open-chat"));

export const GROUPS = [
  { k: "inizio", t: { it: "Per cominciare", de: "Zum Anfangen", en: "To start" }, items: [
    { r: "cerca", t: { it: "Cerca in tutto MikiLab", de: "In ganz MikiLab suchen", en: "Search all of MikiLab" }, d: { it: "una casella per ricette, ingredienti, attrezzi, parole, feste", de: "ein Feld für Rezepte, Zutaten, Werkzeuge, Wörter, Feste", en: "one box for recipes, ingredients, tools, words, feasts" } },
    { r: "salva", t: { it: "Il pane che salva", de: "Das Brot, das rettet", en: "The bread that saves" }, d: { it: "il pane senza lievito, senza forno, senza bilancia, senza corrente; la dispensa di scorta (scritto da Sitor)", de: "Brot ohne Hefe, ohne Ofen, ohne Waage, ohne Strom; der Notvorrat (von Sitor)", en: "bread without yeast, oven, scale or power; the emergency pantry (by Sitor)" } },
    { r: "oggi", t: { it: "L'almanacco del fornaio", de: "Der Almanach des Bäckers", en: "The baker's almanac" }, d: { it: "ogni giorno: la festa, il proverbio, un gesto, il pane di oggi, il timbro", de: "jeden Tag: das Fest, das Sprichwort, ein Handgriff, das Brot des Tages, der Stempel", en: "every day: the feast, the proverb, a gesture, today's bread, the stamp" } },
    { r: "piccoli", t: { it: "Il pane dei piccoli", de: "Das Brot der Kleinen", en: "Bread for little ones" }, d: { it: "fare il pane con i bambini dai tre anni: dodici forme, la storia del pane, la notte del fornaio, il gioco del lievito, un'ora in classe, il diploma (scritto da Sitor)", de: "Brot backen mit Kindern ab drei: zwölf Formen, die Brotgeschichte, die Nacht des Bäckers, das Hefespiel, eine Stunde in der Klasse, die Urkunde (von Sitor)", en: "baking bread with children from three: twelve shapes, the story of bread, the baker's night, the yeast game, one hour in class, the diploma (by Sitor)" } },
    { r: "scuola", t: { it: "MikiLab a scuola", de: "MikiLab in der Schule", en: "MikiLab at school" }, d: { it: "il programma del pane dall'asilo alla quinta: sei attività per l'asilo e trenta lezioni pronte per maestre e maestri, giochi, disegni da colorare, la filastrocca del pane, le parole del pane, il quaderno della classe, la lettera ai genitori, l'attestato di fine anno", de: "das Brotprogramm von der Kita bis zur fünften Klasse: sechs Kita-Angebote und dreißig fertige Stunden für Lehrkräfte, Spiele, Ausmalbilder, der Brot-Reim, die Wörter des Brotes, das Klassenheft, der Elternbrief, die Jahresurkunde", en: "a bread programme from kindergarten to fifth grade: six kindergarten activities and thirty ready lessons for teachers, games, colouring pages, the bread rhyme, the words of bread, the class notebook, the letter to parents, the end-of-year certificate" } },
    { r: "primopane", t: { it: "Il tuo primo pane in 7 giorni", de: "Dein erstes Brot in 7 Tagen", en: "Your first bread in 7 days" }, d: { it: "un passo al giorno, dalla spesa al pane con la biga, con attestato", de: "ein Schritt pro Tag, vom Einkauf bis zum Biga-Brot, mit Urkunde", en: "one step a day, from shopping to a biga loaf, with a certificate" } },
    { r: "giro", t: { it: "Il primo giro con Sitor", de: "Die erste Runde mit Sitor", en: "The first tour with Sitor" }, d: { it: "come funziona il sito, in un minuto", de: "wie die Seite funktioniert, in einer Minute", en: "how the site works, in a minute" } },
    { r: "inizia", t: { it: "Prima di iniziare", de: "Bevor du anfängst", en: "Before you start" }, d: { it: "le basi: farina, acqua, sale, lievito, tempo", de: "die Grundlagen: Mehl, Wasser, Salz, Hefe, Zeit", en: "the basics: flour, water, salt, yeast, time" } },
    { r: "attrezzi", t: { it: "Attrezzi", de: "Geräte", en: "Equipment" }, d: { it: "cosa serve davvero in cucina (poco)", de: "was man in der Küche wirklich braucht (wenig)", en: "what you really need in the kitchen (little)" } },
    { r: "percorso", t: { it: "Il percorso dei 5 panini", de: "Der Weg der 5 Brötchen", en: "The 5 rolls path" }, d: { it: "cinque ricette facili, una dopo l'altra", de: "fünf einfache Rezepte, eins nach dem anderen", en: "five easy recipes, one after another" } },
    { r: "libretto", t: { it: "Il libretto dei 5 panini", de: "Das Heft der 5 Brötchen", en: "The 5 rolls booklet" }, d: { it: "le cinque ricette da stampare", de: "die fünf Rezepte zum Drucken", en: "the five recipes to print" } },
    { r: "perche", t: { it: "Perché MikiLab", de: "Warum MikiLab", en: "Why MikiLab" }, d: { it: "cos'è e perché esiste", de: "was es ist und warum es das gibt", en: "what it is and why it exists" } },
    { r: "bilancia", t: { it: "Pane senza bilancia", de: "Brot ohne Waage", en: "Bread without a scale" }, d: { it: "grammi in tazze e cucchiai", de: "Gramm in Tassen und Löffeln", en: "grams in cups and spoons" } },
  ] },
  { k: "calcoli", t: { it: "Calcolare l'impasto", de: "Den Teig berechnen", en: "Working out the dough" }, items: [ // V127
    { r: "calcolatrice", t: { it: "La calcolatrice del fornaio", de: "Der Bäckerrechner", en: "The baker's calculator" }, d: { it: "il tuo impasto in grammi: pane, focaccia, biga, poolish, lievito madre", de: "dein Teig in Gramm: Brot, Focaccia, Biga, Poolish, Sauerteig", en: "your dough in grams: bread, focaccia, biga, poolish, sourdough" } },
    { r: "pizza", t: { it: "Calcolo impasto pizza", de: "Pizzateig-Rechner", en: "Pizza dough calculator" }, d: { it: "panetti o teglia, il lievito giusto per le tue ore, anche col frigo", de: "Teigkugeln oder Blech, die richtige Hefe für deine Stunden, auch mit Kühlschrank", en: "dough balls or pan, the right yeast for your hours, fridge too" } },
    { r: "rinfresco", t: { it: "Il lievito madre pronto all'ora giusta", de: "Sauerteig pünktlich fertig", en: "Starter ready on time" }, d: { it: "quanto rinfrescare adesso per averlo al picco quando impasti", de: "wie viel du jetzt auffrischst, damit er beim Kneten aktiv ist", en: "how much to feed now so it peaks when you mix" } },
    { r: "formule", t: { it: "Le mie formule", de: "Meine Rezepturen", en: "My formulas" }, d: { it: "le formule che hai salvato, solo nel tuo telefono", de: "deine gespeicherten Rezepturen, nur auf deinem Handy", en: "the formulas you saved, only on your phone" } },
  ] },
  { k: "ricette", t: { it: "Le ricette e l'Officina", de: "Die Rezepte und die Werkstatt", en: "The recipes and the Workshop" }, items: [
    { r: "recipes", t: { it: "Il Ricettario", de: "Das Rezeptbuch", en: "The recipe book" }, d: { it: "167 ricette; sopra la ricerca c'è l'Officina di Sitor; dentro ogni ricetta gli attrezzi con le tue dosi, l'etichetta, gli appunti", de: "167 Rezepte; über der Suche Sitors Werkstatt; in jedem Rezept die Werkzeuge mit deinen Mengen, das Etikett, die Notizen", en: "167 recipes; above the search, Sitor's Workshop; inside each recipe the tools with your quantities, the label, your notes" } },
    { r: "officina:cosa", t: { it: "Cosa posso fare adesso?", de: "Was kann ich jetzt machen?", en: "What can I make now?" }, d: { it: "scegli tempo, lievito e dispensa: ti dice quali ricette puoi fare", de: "wähle Zeit, Triebmittel und Vorrat: es zeigt, welche Rezepte gehen", en: "choose time, leavening and pantry: it shows which recipes you can make" } },
    { r: "officina:confronto", t: { it: "Metti a confronto", de: "Im Vergleich", en: "Side by side" }, d: { it: "due ricette una accanto all'altra, la differenza vera", de: "zwei Rezepte nebeneinander, der echte Unterschied", en: "two recipes next to each other, the real difference" } },
    { r: "officina:occhio", t: { it: "L'occhio di Sitor", de: "Sitors Auge", en: "Sitor's eye" }, d: { it: "una foto alla crosta o alla fetta, letta nel telefono", de: "ein Foto von Kruste oder Scheibe, im Handy gelesen", en: "a photo of the crust or slice, read on your phone" } },
    { r: "officina:soccorso", t: { it: "Pronto soccorso dell'impasto", de: "Erste Hilfe für den Teig", en: "Dough first aid" }, d: { it: "cosa fare quando l'impasto va storto", de: "was tun, wenn der Teig schiefgeht", en: "what to do when the dough goes wrong" } },
    { r: "officina:taglio", t: { it: "Disegna il taglio", de: "Zeichne den Schnitt", en: "Draw the score" }, d: { it: "forme e schemi del taglio, e come si apre in forno", de: "Formen und Muster des Schnitts, und wie er im Ofen aufgeht", en: "scoring shapes and patterns, and how it opens in the oven" } }, // V126: i cinque attrezzi dell'Officina, ognuno col suo bottone
    { r: "pasta", t: { it: "Le mani in pasta", de: "Die Hände im Teig", en: "Hands in the dough" }, d: { it: "dodici forme scritte da Sitor, con il cuore in Basilicata e Puglia: dosi a persona, tecnica, condimento", de: "zwölf Formen von Sitor, mit dem Herzen in Basilikata und Apulien: Mengen pro Person, Technik, Sauce", en: "twelve shapes written by Sitor, with their heart in Basilicata and Puglia: per-person amounts, technique, sauce" } },
    { r: "collezioni", t: { it: "Le collezioni", de: "Die Sammlungen", en: "The collections" }, d: { it: "le ricette per come si usano: in due ore, la domenica, con il lievito madre, i pani del Sud…", de: "die Rezepte nach Gebrauch: in zwei Stunden, sonntags, mit Sauerteig, die Brote des Südens…", en: "recipes by use: in two hours, on Sunday, with sourdough, breads of the South…" } },
    { r: "domande", t: { it: "Le domande del fornaio", de: "Die Fragen des Bäckers", en: "The baker's questions" }, d: { it: "49 domande con la risposta pronta, senza IA", de: "49 Fragen mit fertiger Antwort, ohne KI", en: "49 questions with a ready answer, no AI" } },
    { r: "sorprendimi", t: { it: "Sorprendimi", de: "Überrasch mich", en: "Surprise me" }, d: { it: "la ruota del fornaio sceglie per te", de: "das Bäckerrad wählt für dich", en: "the baker's wheel chooses for you" } },
    { r: "paese", t: { it: "Il pane del mio paese", de: "Das Brot meiner Heimat", en: "The bread of my hometown" }, d: { it: "15 regioni, e la dedica a Miglionico", de: "15 Regionen, und die Widmung an Miglionico", en: "15 regions, and the dedication to Miglionico" } },
    { r: "tecniche", t: { it: "Le tecniche", de: "Die Techniken", en: "The techniques" }, d: { it: "pieghe, pirlatura, baguette, croissant, filone, panettone: disegnate passo passo", de: "Falten, Rundwirken, Baguette, Croissant, Laib, Panettone: Schritt für Schritt gezeichnet", en: "folds, shaping, baguette, croissant, loaf, panettone: drawn step by step" } },
    { r: "farine", t: { it: "Che farina uso?", de: "Welches Mehl nehme ich?", en: "Which flour do I use?" }, d: { it: "le farine spiegate semplici", de: "die Mehle einfach erklärt", en: "flours explained simply" } },
    { r: "cosa-faccio", t: { it: "Cosa faccio con quello che ho?", de: "Was mache ich mit dem, was ich habe?", en: "What can I make with what I have?" }, d: { it: "dici tempo, forno e ingredienti: Sitor sceglie fino a 3 ricette", de: "sag Zeit, Ofen und Zutaten: Sitor wählt bis zu 3 Rezepte", en: "tell time, oven and ingredients: Sitor picks up to 3 recipes" } },
    { r: "dalmondo", t: { it: "Dal mondo e moderni", de: "Aus aller Welt & modern", en: "From the world & modern" }, d: { it: "i pani di altri paesi e le tecniche nuove", de: "Brote aus anderen Ländern und neue Techniken", en: "breads from other countries and new techniques" } },
    { r: "paneieri", t: { it: "Pane di ieri: seconda vita", de: "Brot von gestern: zweites Leben", en: "Yesterday's bread: second life" }, d: { it: "cosa fare con il pane vecchio", de: "was man mit altem Brot macht", en: "what to do with old bread" } },
    { r: "miglioratore", t: { it: "Il mio miglioratore", de: "Mein Verbesserer", en: "My improver" }, d: { it: "cos'è, come si dosa, come farlo in casa", de: "was es ist, wie man es dosiert, wie man es selbst macht", en: "what it is, how to dose it, how to make it at home" } },
    { r: "verde", t: { it: "Il verde di MikiLab", de: "Das Grüne von MikiLab", en: "MikiLab's green" }, d: { it: "i pani e i dolci verdi: canapa, spinaci, spirulina, pistacchio", de: "grüne Brote und Süßes: Hanf, Spinat, Spirulina, Pistazie", en: "green breads and sweets: hemp, spinach, spirulina, pistachio" } },
    { r: "testmese", t: { it: "Il test del mese", de: "Der Test des Monats", en: "Test of the month" }, d: { it: "ogni mese una prova da fare insieme", de: "jeden Monat eine Probe zum gemeinsamen Backen", en: "every month a bake to do together" } },
    { r: "calendario", t: { it: "Il calendario del pane", de: "Der Brotkalender", en: "The bread calendar" }, d: { it: "cosa si impasta in ogni mese", de: "was man in jedem Monat backt", en: "what to bake each month" } },
  ] },
  { k: "lievito", t: { it: "Il lievito madre", de: "Der Sauerteig", en: "The sourdough starter" }, items: [
    { r: "crealievito", t: { it: "Crea il tuo lievito", de: "Sauerteig erschaffen", en: "Create your starter" }, d: { it: "da zero, in una settimana", de: "von null, in einer Woche", en: "from scratch, in a week" } },
    { r: "curalievito", t: { it: "Curare il lievito madre", de: "Den Sauerteig pflegen", en: "Caring for your starter" }, d: { it: "rinfreschi, frigo, viaggi, emergenze", de: "Auffrischen, Kühlschrank, Reisen, Notfälle", en: "refreshes, fridge, travel, emergencies" } },
    { r: "miolievito", t: { it: "Il mio lievito madre", de: "Mein Sauerteig", en: "My sourdough starter" }, d: { it: "nome, compleanno, pasti, il QR per farlo viaggiare", de: "Name, Geburtstag, Mahlzeiten, der QR-Code zum Verreisen", en: "name, birthday, feeds, the QR to make it travel" } },
  ] },
  { k: "cucina", t: { it: "In cucina, mentre impasti", de: "In der Küche, beim Kneten", en: "In the kitchen, while you knead" }, items: [
    { r: "sveglia", t: { it: "La sveglia del panettiere", de: "Der Bäckerwecker", en: "The baker's alarm" }, d: { it: "timer per pieghe, lievitazione, forno", de: "Timer für Falten, Gare, Ofen", en: "timers for folds, proof, oven" } },
    { r: "crosta", t: { it: "Il pane parla", de: "Das Brot spricht", en: "The bread speaks" }, d: { it: "il microfono ascolta la crosta", de: "das Mikrofon hört der Kruste zu", en: "the microphone listens to the crust" } },
    { r: "mappaforno", t: { it: "La mappa del tuo forno · Il mio forno", de: "Die Karte deines Ofens · Mein Ofen", en: "The map of your oven · My oven" }, d: { it: "dove scalda di più, e i minuti veri", de: "wo er stärker heizt, und die echten Minuten", en: "where it heats more, and the real minutes" } },
    { r: "banco", t: { it: "Il banco delle prove", de: "Der Probentisch", en: "The test bench" }, d: { it: "le prove con le mani (dito, finestra, galleggiamento) e il tempo di oggi", de: "die Handproben (Finger, Fenster, Schwimmtest) und das Wetter von heute", en: "the hand tests (poke, windowpane, float) and today's weather" } },
    { r: "panico", t: { it: "Panico da cena · Sughi nel mondo", de: "Abendessen-Panik · Saucen der Welt", en: "Dinner panic · Sauces of the world" }, d: { it: "idee veloci per la cena, e i sughi del mondo", de: "schnelle Ideen fürs Abendessen, und Saucen aus aller Welt", en: "quick dinner ideas, and sauces from around the world" } },
    { r: "cucina", t: { it: "La mia cucina", de: "Meine Küche", en: "My kitchen" }, d: { it: "le impostazioni della tua cucina, salvate solo nel telefono", de: "die Einstellungen deiner Küche, nur auf dem Handy gespeichert", en: "your kitchen settings, saved only on your phone" } },
    { r: "plan", t: { it: "Piano della settimana", de: "Wochenplan", en: "Weekly plan" }, d: { it: "le ricette della settimana e la lista della spesa", de: "die Rezepte der Woche und die Einkaufsliste", en: "the week's recipes and the shopping list" } },
    { r: "live", t: { it: "Impastiamo insieme", de: "Backen wir zusammen", en: "Let's bake together" }, d: { it: "le sessioni dal vivo con Michele", de: "Live-Sessions mit Michele", en: "live sessions with Michele" } },
    { r: "grande", t: { it: "Modo grande · Modo notte · Mani libere", de: "Großmodus · Nachtmodus · Freie Hände", en: "Big mode · Night mode · Hands free" }, d: { it: "scritte grandi, schermo caldo, la voce del telefono", de: "große Schrift, warmer Bildschirm, die Stimme des Handys", en: "big text, warm screen, the phone's voice" } },
  ] },
  { k: "ospiti", t: { it: "Per la tavola e per regalare", de: "Für den Tisch und zum Verschenken", en: "For the table and for gifts" }, items: [
    { r: "ospiti", t: { it: "Stasera ho ospiti", de: "Heute kommen Gäste", en: "Guests tonight" }, d: { it: "occasione, persone, orario: pani, dosi, quando iniziare, spesa", de: "Anlass, Personen, Uhrzeit: Brote, Mengen, wann anfangen, Einkauf", en: "occasion, people, time: breads, amounts, when to start, shopping" } },
    { r: "carta", t: { it: "La carta dei pani", de: "Die Brotkarte", en: "The bread menu" }, d: { it: "un menu elegante da stampare", de: "eine elegante Karte zum Drucken", en: "an elegant menu to print" } },
    { r: "sommelier", t: { it: "Il sommelier del pane", de: "Der Brot-Sommelier", en: "The bread sommelier" }, d: { it: "assaggia con cinque sensi, scheda e abbinamenti", de: "mit fünf Sinnen verkosten, Karte und Kombinationen", en: "taste with five senses, card and pairings" } },
    { r: "libro", t: { it: "Il mio libro di pane", de: "Mein Brotbuch", en: "My bread book" }, d: { it: "i preferiti stampati come un libro, con i tuoi appunti", de: "die Favoriten gedruckt wie ein Buch, mit deinen Notizen", en: "favourites printed like a book, with your notes" } },
    { r: "regala", t: { it: "Regala MikiLab", de: "MikiLab verschenken", en: "Gift MikiLab" }, d: { it: "manda MikiLab a chi vuoi bene", de: "schick MikiLab an deine Liebsten", en: "send MikiLab to the people you love" } },
    { r: "volantino", t: { it: "Il volantino da frigo", de: "Der Kühlschrank-Flyer", en: "The fridge flyer" }, d: { it: "porta MikiLab in un'altra cucina", de: "bring MikiLab in eine andere Küche", en: "take MikiLab to another kitchen" } },
  ] },
  { k: "lab", t: { it: "Per chi panifica di mestiere", de: "Für alle, die beruflich backen", en: "For those who bake for a living" }, items: [
    { r: "laboratorio", t: { it: "Il laboratorio", de: "Die Backstube", en: "The bakery" }, d: { it: "foglio di produzione, programmazione a freddo, conversioni, carico del forno, cartellini del banco", de: "Produktionsblatt, kalte Führung, Umrechnungen, Ofenbelegung, Thekenschilder", en: "production sheet, cold retard plan, conversions, oven loading, counter tags" } },
  ] },
  { k: "me", t: { it: "Le mie cose", de: "Meine Sachen", en: "My things" }, items: [
    { r: "medaglie", t: { it: "Le mie medaglie", de: "Meine Medaillen", en: "My medals" }, d: { it: "18 passi in bottega", de: "18 Schritte in der Backstube", en: "18 steps in the bakery" } },
    { r: "anno", t: { it: "Il tuo anno da fornaio", de: "Dein Jahr als Bäcker", en: "Your year as a baker" }, d: { it: "i tuoi numeri in un manifesto", de: "deine Zahlen auf einem Plakat", en: "your numbers on a poster" } },
    { r: "valigia", t: { it: "La valigia della bottega", de: "Der Koffer der Bottega", en: "The bottega suitcase" }, d: { it: "porta tutto sul telefono nuovo", de: "nimm alles aufs neue Handy mit", en: "take everything to a new phone" } },
    { r: "mensola", t: { it: "La mia mensola", de: "Mein Regal", en: "My shelf" }, d: { it: "i tuoi traguardi: primo panino, prima focaccia…", de: "deine Meilensteine: erstes Brötchen, erste Focaccia…", en: "your milestones: first roll, first focaccia…" } },
    { r: "dedica", t: { it: "Da Miglionico a Stoccarda", de: "Von Miglionico nach Stuttgart", en: "From Miglionico to Stuttgart" }, d: { it: "la dedica di Michele al suo paese", de: "Micheles Widmung an sein Dorf", en: "Michele's dedication to his village" } },
    { r: "strumenti", t: { it: "Tutti gli Strumenti", de: "Alle Werkzeuge", en: "All the Tools" }, d: { it: "la pagina completa, con la ricerca", de: "die vollständige Seite, mit Suche", en: "the full page, with search" } },
  ] },
];

export default function Mappa({ onBack, onNav }) {
  const go = (r) => (typeof onNav === "function" ? onNav(r) : nav(r));
  const { lang } = useLang();
  const feats = useFeatures(); // V123
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [q, setQ] = useState("");
  const norm = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter((it) => !(it.r === "live" && feats && feats.FEATURE_LIVE === false)).filter((it) => !q.trim() || norm(L(it.t) + " " + L(it.d)).includes(norm(q))) })).filter((g) => g.items.length);
  return (
    <div data-testid="mappa-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="mappa-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><Map className="w-3 h-3" />MikiLab</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("La mappa di MikiLab", "Die Karte von MikiLab", "The map of MikiLab")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-sm text-muted-foreground mt-1">{tri("Tutto il sito in una pagina: ogni attrezzo con una riga che dice a cosa serve. Tocca e ci sei. Se non trovi una cosa, chiedila a Sitor.", "Die ganze Seite auf einer Seite: jedes Werkzeug mit einer Zeile, wozu es dient. Tippen, und du bist da. Findest du etwas nicht, frag Sitor.", "The whole site on one page: every tool with a line saying what it's for. Tap and you're there. If you can't find something, ask Sitor.")}</p>
      </div>
      <div className="relative"><Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" /><input data-testid="mappa-cerca" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tri("Cerca nella mappa…", "In der Karte suchen…", "Search the map…")} className="w-full text-[14px] bg-card text-foreground border border-border rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-primary" /></div>
      {groups.map((g) => (
        <section key={g.k} data-testid={`mappa-${g.k}`}>
          <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia mb-1.5">{L(g.t)}</p>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {g.items.map((it, i) => (
              <button key={i} data-testid={`mappa-${g.k}-${i}`} onClick={() => go(it.r)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left active:bg-muted/40">
                <span className="flex-1 min-w-0"><span className="block text-[13.5px] font-bold text-foreground leading-tight">{L(it.t)}</span><span className="block text-[12px] text-muted-foreground leading-snug">{L(it.d)}</span></span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </section>
      ))}
      <button data-testid="mappa-sitor" onClick={openChat} className="w-full rounded-2xl border border-salvia/40 bg-salvia/8 p-3 text-left">
        <span className="block text-[13.5px] font-bold text-foreground">{tri("Sitor, la guida", "Sitor, der Guide", "Sitor, the guide")}</span>
        <span className="block text-[12px] text-muted-foreground leading-snug">{tri("Scrivi o parla: prima risponde la bottega (parole, sintomi, numeri della ricetta), poi l'IA se serve. 15 domande al giorno.", "Schreib oder sprich: erst antwortet die Werkstatt (Wörter, Symptome, Zahlen des Rezepts), dann die KI, wenn nötig. 15 Fragen am Tag.", "Write or speak: the workshop answers first (words, symptoms, recipe numbers), then the AI if needed. 15 questions a day.")}</span>
      </button>
      <p className="text-[11px] text-muted-foreground">{tri("Ricette di Michele Signorella · tre lingue · niente conti, niente tracciamento: quello che fai resta nel tuo telefono.", "Rezepte von Michele Signorella · drei Sprachen · keine Konten, kein Tracking: was du tust, bleibt auf deinem Handy.", "Recipes by Michele Signorella · three languages · no accounts, no tracking: what you do stays on your phone.")}</p>
    </div>
  );
}
