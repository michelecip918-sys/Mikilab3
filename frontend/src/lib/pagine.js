import { META } from "@/i18n/meta";

// V112 — LE PAGINE DI MIKILAB: indirizzo, titolo e descrizione di ogni pagina pubblica. Servono a tre cose:
// 1) la barra degli indirizzi cambia quando cambi pagina (così un link si può copiare e condividere: mikilab.de/scuola);
// 2) il titolo della scheda del browser e della cronologia dice dove sei («MikiLab a scuola · MikiLab»);
// 3) Google legge titolo, descrizione e canonical della pagina giusta. Niente rete, niente dati.
// I testi vengono dalla Mappa di MikiLab (stessi titoli, stesse descrizioni).

export const PAGINE = {
  volantino: { path: "/volantino", t: { it: "Il volantino da frigo", de: "Der Kühlschrank-Flyer", en: "The fridge flyer" }, d: { it: "Porta MikiLab in un'altra cucina.", de: "Bring MikiLab in eine andere Küche.", en: "Take MikiLab to another kitchen." } },
  domande: { path: "/domande", t: { it: "Le domande del fornaio", de: "Die Fragen des Bäckers", en: "The baker's questions" }, d: { it: "49 domande con la risposta pronta, senza IA.", de: "49 Fragen mit fertiger Antwort, ohne KI.", en: "49 questions with a ready answer, no AI." } },
  collezioni: { path: "/collezioni", t: { it: "Le collezioni", de: "Die Sammlungen", en: "The collections" }, d: { it: "Le ricette per come si usano: in due ore, la domenica, con il lievito madre, i pani del Sud….", de: "Die Rezepte nach Gebrauch: in zwei Stunden, sonntags, mit Sauerteig, die Brote des Südens….", en: "Recipes by use: in two hours, on Sunday, with sourdough, breads of the South…." } },
  cerca: { path: "/cerca", t: { it: "Cerca in tutto MikiLab", de: "In ganz MikiLab suchen", en: "Search all of MikiLab" }, d: { it: "Una casella per ricette, ingredienti, attrezzi, parole, feste.", de: "Ein Feld für Rezepte, Zutaten, Werkzeuge, Wörter, Feste.", en: "One box for recipes, ingredients, tools, words, feasts." } },
  salva: { path: "/salva", t: { it: "Il pane che salva", de: "Das Brot, das rettet", en: "The bread that saves" }, d: { it: "Il pane senza lievito, senza forno, senza bilancia, senza corrente; la dispensa di scorta (scritto da Sitor).", de: "Brot ohne Hefe, ohne Ofen, ohne Waage, ohne Strom; der Notvorrat (von Sitor).", en: "Bread without yeast, oven, scale or power; the emergency pantry (by Sitor)." } },
  piccoli: { path: "/piccoli", t: { it: "Il pane dei piccoli", de: "Das Brot der Kleinen", en: "Bread for little ones" }, d: { it: "Fare il pane con i bambini dai tre anni: dodici forme, la storia del pane, la notte del fornaio, il gioco del lievito, un'ora in classe, il diploma (scritto da Sitor).", de: "Brot backen mit Kindern ab drei: zwölf Formen, die Brotgeschichte, die Nacht des Bäckers, das Hefespiel, eine Stunde in der Klasse, die Urkunde (von Sitor).", en: "Baking bread with children from three: twelve shapes, the story of bread, the baker's night, the yeast game, one hour in class, the diploma (by Sitor)." } },
  scuola: { path: "/scuola", t: { it: "MikiLab a scuola", de: "MikiLab in der Schule", en: "MikiLab at school" }, d: { it: "Il programma del pane dall'asilo alla quinta: sei attività per l'asilo e trenta lezioni pronte per maestre e maestri, giochi, disegni da colorare, la filastrocca del pane, le parole del pane, il quaderno della classe, la lettera ai genitori, l'attestato di fine anno.", de: "Das Brotprogramm von der Kita bis zur fünften Klasse: sechs Kita-Angebote und dreißig fertige Stunden für Lehrkräfte, Spiele, Ausmalbilder, der Brot-Reim, die Wörter des Brotes, das Klassenheft, der Elternbrief, die Jahresurkunde.", en: "A bread programme from kindergarten to fifth grade: six kindergarten activities and thirty ready lessons for teachers, games, colouring pages, the bread rhyme, the words of bread, the class notebook, the letter to parents, the end-of-year certificate." } },
  pasta: { path: "/pasta", t: { it: "Le mani in pasta", de: "Die Hände im Teig", en: "Hands in the dough" }, d: { it: "Dodici forme scritte da Sitor, con il cuore in Basilicata e Puglia: dosi a persona, tecnica, condimento.", de: "Zwölf Formen von Sitor, mit dem Herzen in Basilikata und Apulien: Mengen pro Person, Technik, Sauce.", en: "Twelve shapes written by Sitor, with their heart in Basilicata and Puglia: per-person amounts, technique, sauce." } },
  oggi: { path: "/oggi", t: { it: "L'almanacco del fornaio", de: "Der Almanach des Bäckers", en: "The baker's almanac" }, d: { it: "Ogni giorno: la festa, il proverbio, un gesto, il pane di oggi, il timbro.", de: "Jeden Tag: das Fest, das Sprichwort, ein Handgriff, das Brot des Tages, der Stempel.", en: "Every day: the feast, the proverb, a gesture, today's bread, the stamp." } },
  mappa: { path: "/mappa", t: { it: "La mappa di MikiLab", de: "Die Karte von MikiLab", en: "The map of MikiLab" }, d: { it: "Tutte le pagine e gli attrezzi del sito in una pagina sola, con la ricerca.", de: "Alle Seiten und Werkzeuge der Website auf einer Seite, mit Suche.", en: "Every page and tool of the site on one page, with search." } },
  libro: { path: "/libro", t: { it: "Il mio libro di pane", de: "Mein Brotbuch", en: "My bread book" }, d: { it: "I preferiti stampati come un libro, con i tuoi appunti.", de: "Die Favoriten gedruckt wie ein Buch, mit deinen Notizen.", en: "Favourites printed like a book, with your notes." } },
  valigia: { path: "/valigia", t: { it: "La valigia della bottega", de: "Der Koffer der Bottega", en: "The bottega suitcase" }, d: { it: "Porta tutto sul telefono nuovo.", de: "Nimm alles aufs neue Handy mit.", en: "Take everything to a new phone." } },
  anno: { path: "/anno", t: { it: "Il tuo anno da fornaio", de: "Dein Jahr als Bäcker", en: "Your year as a baker" }, d: { it: "I tuoi numeri in un manifesto.", de: "Deine Zahlen auf einem Plakat.", en: "Your numbers on a poster." } },
  carta: { path: "/carta", t: { it: "La carta dei pani", de: "Die Brotkarte", en: "The bread menu" }, d: { it: "Un menu elegante da stampare.", de: "Eine elegante Karte zum Drucken.", en: "An elegant menu to print." } },
  ospiti: { path: "/ospiti", t: { it: "Stasera ho ospiti", de: "Heute kommen Gäste", en: "Guests tonight" }, d: { it: "Occasione, persone, orario: pani, dosi, quando iniziare, spesa.", de: "Anlass, Personen, Uhrzeit: Brote, Mengen, wann anfangen, Einkauf.", en: "Occasion, people, time: breads, amounts, when to start, shopping." } },
  sommelier: { path: "/sommelier", t: { it: "Il sommelier del pane", de: "Der Brot-Sommelier", en: "The bread sommelier" }, d: { it: "Assaggia con cinque sensi, scheda e abbinamenti.", de: "Mit fünf Sinnen verkosten, Karte und Kombinationen.", en: "Taste with five senses, card and pairings." } },
  primopane: { path: "/primopane", t: { it: "Il tuo primo pane in 7 giorni", de: "Dein erstes Brot in 7 Tagen", en: "Your first bread in 7 days" }, d: { it: "Un passo al giorno, dalla spesa al pane con la biga, con attestato.", de: "Ein Schritt pro Tag, vom Einkauf bis zum Biga-Brot, mit Urkunde.", en: "One step a day, from shopping to a biga loaf, with a certificate." } },
  calcolatrice: { path: "/calcolatrice", t: { it: "La calcolatrice del fornaio", de: "Der Bäckerrechner", en: "The baker's calculator" }, d: { it: "Il tuo impasto in grammi: pane, pizza, focaccia, biga, poolish e lievito madre, con le percentuali del fornaio, l'acqua alla temperatura giusta e il piano con gli orari.", de: "Dein Teig in Gramm: Brot, Pizza, Focaccia, Biga, Poolish und Sauerteig, mit Bäckerprozenten, richtiger Wassertemperatur und Zeitplan.", en: "Your dough in grams: bread, pizza, focaccia, biga, poolish and sourdough, with baker's percentages, the right water temperature and a schedule." } }, // V127
  pizza: { path: "/pizza", t: { it: "Calcolo impasto pizza", de: "Pizzateig-Rechner", en: "Pizza dough calculator" }, d: { it: "Panetti o teglia, napoletana, romana o sottile: farina, acqua, sale e lievito giusti per le tue ore, anche con il frigo.", de: "Teigkugeln oder Blech, neapolitanisch, römisch oder dünn: Mehl, Wasser, Salz und Hefe passend zu deinen Stunden, auch mit Kühlschrank.", en: "Dough balls or pan, Neapolitan, Roman or thin: flour, water, salt and yeast right for your hours, fridge included." } }, // V127
  rinfresco: { path: "/rinfresco", t: { it: "Il lievito madre pronto all'ora giusta", de: "Sauerteig pünktlich fertig", en: "Starter ready on time" }, d: { it: "Quanto rinfrescare adesso per avere il lievito madre al picco quando impasti.", de: "Wie viel du jetzt auffrischst, damit der Sauerteig beim Kneten aktiv ist.", en: "How much to feed now so your starter peaks when you mix." } }, // V127
  formule: { path: "/formule", t: { it: "Le mie formule", de: "Meine Rezepturen", en: "My formulas" }, d: { it: "Le formule che hai salvato con la calcolatrice del fornaio, solo nel tuo telefono.", de: "Deine mit dem Bäckerrechner gespeicherten Rezepturen, nur auf deinem Handy.", en: "The formulas you saved with the baker's calculator, only on your phone." } }, // V127
  laboratorio: { path: "/laboratorio", t: { it: "Il laboratorio", de: "Die Backstube", en: "The bakery" }, d: { it: "Foglio di produzione, programmazione a freddo, conversioni, carico del forno, cartellini del banco.", de: "Produktionsblatt, kalte Führung, Umrechnungen, Ofenbelegung, Thekenschilder.", en: "Production sheet, cold retard plan, conversions, oven loading, counter tags." } },
  dedica: { path: "/miglionico", t: { it: "Da Miglionico a Stoccarda", de: "Von Miglionico nach Stuttgart", en: "From Miglionico to Stuttgart" }, d: { it: "La storia di Michele e dei panettieri di Miglionico che gli hanno insegnato il mestiere.", de: "Die Geschichte von Michele und den Bäckern von Miglionico, die ihm das Handwerk beibrachten.", en: "The story of Michele and the bakers of Miglionico who taught him the trade." } },
  libretto: { path: "/libretto", t: { it: "Il libretto dei cinque panini", de: "Das Heft der fünf Brötchen", en: "The five-rolls booklet" }, d: { it: "Le cinque ricette per cominciare, in un libretto da stampare e appendere in cucina.", de: "Die fünf Rezepte zum Anfangen, als Heft zum Drucken und Aufhängen in der Küche.", en: "The five recipes to start with, as a booklet to print and hang in the kitchen." } },
  impressum: { path: "/impressum", t: { it: "Impressum", de: "Impressum", en: "Legal notice" }, d: { it: "Chi c'è dietro MikiLab.", de: "Wer hinter MikiLab steht.", en: "Who is behind MikiLab." } },
  datenschutz: { path: "/datenschutz", t: { it: "Privacy", de: "Datenschutzerklärung", en: "Privacy policy" }, d: { it: "Cosa fa e cosa non fa MikiLab con i tuoi dati: niente tracciamento, tutto nel tuo browser.", de: "Was MikiLab mit Ihren Daten tut und nicht tut: kein Tracking, alles in Ihrem Browser.", en: "What MikiLab does and doesn't do with your data: no tracking, everything in your browser." } },
};

export function pathForRoute(route) {
  const p = PAGINE[route];
  if (p) return p.path;
  if (route === "home") return "/";
  return undefined; // ricette (gestite da recipeSeo), pagine interne e admin: l'indirizzo non cambia
}

const pick = (o, lang) => (o && (o[lang] || o.en || o.it)) || "";
function setMeta(sel, attr, val) { try { const el = document.head.querySelector(sel); if (el && val != null) el.setAttribute(attr, val); } catch { /* */ } }

// Applica titolo, descrizione e canonical della pagina. Per la Home ripristina quelli del sito.
// Va chiamata dopo gli effetti dei provider (setTimeout 0), perché LanguageProvider riscrive i meta a ogni cambio lingua.
export function applyPageMeta(route, lang) {
  if (typeof document === "undefined" || route === "recipes") return;
  setTimeout(() => {
    try {
      const p = PAGINE[route];
      const m = META[lang] || META.it;
      const canon = document.head.querySelector('link[rel="canonical"]');
      if (!p) {
        // Home e pagine senza indirizzo proprio (Strumenti, Tecniche, admin…): titolo e descrizione del sito
        { document.title = m.title; setMeta('meta[name="description"]', "content", m.description); setMeta('meta[property="og:title"]', "content", m.ogTitle); setMeta('meta[property="og:description"]', "content", m.ogDescription); setMeta('meta[property="og:url"]', "content", "https://mikilab.de/" + (lang === "de" || lang === "en" ? lang + "/" : "")); if (canon) canon.setAttribute("href", "https://mikilab.de/" + (lang === "de" || lang === "en" ? lang + "/" : "")); } // V117: home per lingua
        return;
      }
      const titolo = `${pick(p.t, lang)} · MikiLab`;
      const descr = pick(p.d, lang);
      document.title = titolo;
      setMeta('meta[name="description"]', "content", descr);
      setMeta('meta[property="og:title"]', "content", titolo);
      setMeta('meta[property="og:description"]', "content", descr);
      setMeta('meta[property="og:url"]', "content", "https://mikilab.de" + p.path);
      setMeta('meta[name="twitter:title"]', "content", titolo);
      setMeta('meta[name="twitter:description"]', "content", descr);
      if (canon) canon.setAttribute("href", "https://mikilab.de" + p.path);
    } catch { /* */ }
  }, 0);
}
