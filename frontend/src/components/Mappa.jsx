import { useState } from "react";
import { ChevronLeft, Map, ChevronRight, Search } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

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
    { r: "piccoli", t: { it: "Il pane dei piccoli", de: "Das Brot der Kleinen", en: "Bread for little ones" }, d: { it: "fare il pane con i bambini dai tre anni: impasto facile, sei forme, cinque regole, il diploma (scritto da Sitor)", de: "Brot backen mit Kindern ab drei: einfacher Teig, sechs Formen, fünf Regeln, die Urkunde (von Sitor)", en: "baking bread with children from three: easy dough, six shapes, five rules, the diploma (by Sitor)" } },
    { r: "scuola", t: { it: "MikiLab a scuola", de: "MikiLab in der Schule", en: "MikiLab at school" }, d: { it: "il programma del pane dall'asilo alla quinta: sei attività per l'asilo e trenta lezioni pronte per maestre e maestri, giochi, disegni da colorare, la filastrocca del pane, le parole del pane, il quaderno della classe, la lettera ai genitori, l'attestato di fine anno", de: "das Brotprogramm von der Kita bis zur fünften Klasse: sechs Kita-Angebote und dreißig fertige Stunden für Lehrkräfte, Spiele, Ausmalbilder, der Brot-Reim, die Wörter des Brotes, das Klassenheft, der Elternbrief, die Jahresurkunde", en: "a bread programme from kindergarten to fifth grade: six kindergarten activities and thirty ready lessons for teachers, games, colouring pages, the bread rhyme, the words of bread, the class notebook, the letter to parents, the end-of-year certificate" } },
    { r: "primopane", t: { it: "Il tuo primo pane in 7 giorni", de: "Dein erstes Brot in 7 Tagen", en: "Your first bread in 7 days" }, d: { it: "un passo al giorno, dalla spesa al pane con la biga, con attestato", de: "ein Schritt pro Tag, vom Einkauf bis zum Biga-Brot, mit Urkunde", en: "one step a day, from shopping to a biga loaf, with a certificate" } },
    { r: "giro", t: { it: "Il primo giro con Sitor", de: "Die erste Runde mit Sitor", en: "The first tour with Sitor" }, d: { it: "come funziona il sito, in un minuto", de: "wie die Seite funktioniert, in einer Minute", en: "how the site works, in a minute" } },
    { r: "inizia", t: { it: "Prima di iniziare", de: "Bevor du anfängst", en: "Before you start" }, d: { it: "le basi: farina, acqua, sale, lievito, tempo", de: "die Grundlagen: Mehl, Wasser, Salz, Hefe, Zeit", en: "the basics: flour, water, salt, yeast, time" } },
    { r: "attrezzi", t: { it: "Attrezzi", de: "Geräte", en: "Equipment" }, d: { it: "cosa serve davvero in cucina (poco)", de: "was man in der Küche wirklich braucht (wenig)", en: "what you really need in the kitchen (little)" } },
    { r: "bilancia", t: { it: "Pane senza bilancia", de: "Brot ohne Waage", en: "Bread without a scale" }, d: { it: "grammi in tazze e cucchiai", de: "Gramm in Tassen und Löffeln", en: "grams in cups and spoons" } },
  ] },
  { k: "ricette", t: { it: "Le ricette e l'Officina", de: "Die Rezepte und die Werkstatt", en: "The recipes and the Workshop" }, items: [
    { r: "recipes", t: { it: "Il Ricettario", de: "Das Rezeptbuch", en: "The recipe book" }, d: { it: "167 ricette; sopra la ricerca c'è l'Officina di Sitor; dentro ogni ricetta gli attrezzi con le tue dosi, l'etichetta, gli appunti", de: "167 Rezepte; über der Suche Sitors Werkstatt; in jedem Rezept die Werkzeuge mit deinen Mengen, das Etikett, die Notizen", en: "167 recipes; above the search, Sitor's Workshop; inside each recipe the tools with your quantities, the label, your notes" } },
    { r: "recipes", t: { it: "Cosa posso fare adesso? · Metti a confronto · L'occhio di Sitor · Pronto soccorso · Disegna il taglio", de: "Was kann ich jetzt machen? · Im Vergleich · Sitors Auge · Erste Hilfe · Zeichne den Schnitt", en: "What can I make now? · Side by side · Sitor's eye · First aid · Draw the score" }, d: { it: "nell'Officina, in cima al Ricettario", de: "in der Werkstatt, oben im Rezeptbuch", en: "in the Workshop, at the top of the recipe book" } },
    { r: "pasta", t: { it: "Le mani in pasta", de: "Die Hände im Teig", en: "Hands in the dough" }, d: { it: "dodici forme scritte da Sitor, con il cuore in Basilicata e Puglia: dosi a persona, tecnica, condimento", de: "zwölf Formen von Sitor, mit dem Herzen in Basilikata und Apulien: Mengen pro Person, Technik, Sauce", en: "twelve shapes written by Sitor, with their heart in Basilicata and Puglia: per-person amounts, technique, sauce" } },
    { r: "collezioni", t: { it: "Le collezioni", de: "Die Sammlungen", en: "The collections" }, d: { it: "le ricette per come si usano: in due ore, la domenica, con il lievito madre, i pani del Sud…", de: "die Rezepte nach Gebrauch: in zwei Stunden, sonntags, mit Sauerteig, die Brote des Südens…", en: "recipes by use: in two hours, on Sunday, with sourdough, breads of the South…" } },
    { r: "domande", t: { it: "Le domande del fornaio", de: "Die Fragen des Bäckers", en: "The baker's questions" }, d: { it: "49 domande con la risposta pronta, senza IA", de: "49 Fragen mit fertiger Antwort, ohne KI", en: "49 questions with a ready answer, no AI" } },
    { r: "sorprendimi", t: { it: "Sorprendimi", de: "Überrasch mich", en: "Surprise me" }, d: { it: "la ruota del fornaio sceglie per te", de: "das Bäckerrad wählt für dich", en: "the baker's wheel chooses for you" } },
    { r: "paese", t: { it: "Il pane del mio paese", de: "Das Brot meiner Heimat", en: "The bread of my hometown" }, d: { it: "15 regioni, e la dedica a Miglionico", de: "15 Regionen, und die Widmung an Miglionico", en: "15 regions, and the dedication to Miglionico" } },
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
    { r: "banco", t: { it: "Il banco delle prove", de: "Der Probentisch", en: "The test bench" }, d: { it: "il quaderno di bottega: cosa hai fatto, cosa cambi", de: "das Werkstattheft: was du gemacht hast, was du änderst", en: "the workshop notebook: what you did, what you change" } },
    { r: "panico", t: { it: "Panico da cena", de: "Panik vor dem Abendessen", en: "Dinner panic" }, d: { it: "un pane in due ore, quando sei in ritardo", de: "ein Brot in zwei Stunden, wenn du spät dran bist", en: "a bread in two hours, when you're late" } },
    { r: "grande", t: { it: "Modo grande · Modo notte · Mani libere", de: "Großmodus · Nachtmodus · Freie Hände", en: "Big mode · Night mode · Hands free" }, d: { it: "scritte grandi, schermo caldo, la voce del telefono", de: "große Schrift, warmer Bildschirm, die Stimme des Handys", en: "big text, warm screen, the phone's voice" } },
  ] },
  { k: "ospiti", t: { it: "Per la tavola e per regalare", de: "Für den Tisch und zum Verschenken", en: "For the table and for gifts" }, items: [
    { r: "ospiti", t: { it: "Stasera ho ospiti", de: "Heute kommen Gäste", en: "Guests tonight" }, d: { it: "occasione, persone, orario: pani, dosi, quando iniziare, spesa", de: "Anlass, Personen, Uhrzeit: Brote, Mengen, wann anfangen, Einkauf", en: "occasion, people, time: breads, amounts, when to start, shopping" } },
    { r: "carta", t: { it: "La carta dei pani", de: "Die Brotkarte", en: "The bread menu" }, d: { it: "un menu elegante da stampare", de: "eine elegante Karte zum Drucken", en: "an elegant menu to print" } },
    { r: "sommelier", t: { it: "Il sommelier del pane", de: "Der Brot-Sommelier", en: "The bread sommelier" }, d: { it: "assaggia con cinque sensi, scheda e abbinamenti", de: "mit fünf Sinnen verkosten, Karte und Kombinationen", en: "taste with five senses, card and pairings" } },
    { r: "libro", t: { it: "Il mio libro di pane", de: "Mein Brotbuch", en: "My bread book" }, d: { it: "i preferiti stampati come un libro, con i tuoi appunti", de: "die Favoriten gedruckt wie ein Buch, mit deinen Notizen", en: "favourites printed like a book, with your notes" } },
    { r: "volantino", t: { it: "Il volantino da frigo", de: "Der Kühlschrank-Flyer", en: "The fridge flyer" }, d: { it: "porta MikiLab in un'altra cucina", de: "bring MikiLab in eine andere Küche", en: "take MikiLab to another kitchen" } },
  ] },
  { k: "lab", t: { it: "Per chi panifica di mestiere", de: "Für alle, die beruflich backen", en: "For those who bake for a living" }, items: [
    { r: "laboratorio", t: { it: "Il laboratorio", de: "Die Backstube", en: "The bakery" }, d: { it: "foglio di produzione, programmazione a freddo, conversioni, carico del forno, cartellini del banco", de: "Produktionsblatt, kalte Führung, Umrechnungen, Ofenbelegung, Thekenschilder", en: "production sheet, cold retard plan, conversions, oven loading, counter tags" } },
  ] },
  { k: "me", t: { it: "Le mie cose", de: "Meine Sachen", en: "My things" }, items: [
    { r: "medaglie", t: { it: "Le mie medaglie", de: "Meine Medaillen", en: "My medals" }, d: { it: "18 passi in bottega", de: "18 Schritte in der Backstube", en: "18 steps in the bakery" } },
    { r: "anno", t: { it: "Il tuo anno da fornaio", de: "Dein Jahr als Bäcker", en: "Your year as a baker" }, d: { it: "i tuoi numeri in un manifesto", de: "deine Zahlen auf einem Plakat", en: "your numbers on a poster" } },
    { r: "valigia", t: { it: "La valigia della bottega", de: "Der Koffer der Bottega", en: "The bottega suitcase" }, d: { it: "porta tutto sul telefono nuovo", de: "nimm alles aufs neue Handy mit", en: "take everything to a new phone" } },
    { r: "strumenti", t: { it: "Tutti gli Strumenti", de: "Alle Werkzeuge", en: "All the Tools" }, d: { it: "la pagina completa, con la ricerca", de: "die vollständige Seite, mit Suche", en: "the full page, with search" } },
  ] },
];

export default function Mappa({ onBack, onNav }) {
  const go = (r) => (typeof onNav === "function" ? onNav(r) : nav(r));
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [q, setQ] = useState("");
  const norm = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter((it) => !q.trim() || norm(L(it.t) + " " + L(it.d)).includes(norm(q))) })).filter((g) => g.items.length);
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
