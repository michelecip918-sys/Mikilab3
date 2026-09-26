import { useState } from "react"; // V99 react
import { Calculator, Pizza, Hourglass } from "lucide-react"; // V127
import { ChevronLeft, Sparkles, Radio, BookOpen, ChefHat, CalendarDays, Beaker, Globe, Recycle, Sprout, Settings, Flame, Soup, FlaskConical, Camera, Compass, ZoomIn, Ear, AlarmClock, MapPin, Scale, BookOpen as BookOpenIcon, Moon, Printer, Award, Dices } from "lucide-react";
import { Search as SearchIcon, Layers as LayersIcon, HelpCircle as HelpIcon } from "lucide-react"; // V108
import { LifeBuoy as LifeBuoyIcon } from "lucide-react"; // V107
import { Baby as BabyIcon } from "lucide-react"; // V103
import { GraduationCap as SchoolIcon } from "lucide-react"; // V111
import { Wheat as WheatIcon } from "lucide-react"; // V102
import { Sun as SunIcon } from "lucide-react"; // V101
import { Map as MapIcon } from "lucide-react"; // V100
import { Briefcase as BriefcaseIcon, BookOpen as BookIcon } from "lucide-react"; // V97
import { Users as UsersIcon, ScrollText as ScrollIcon } from "lucide-react"; // V95
import { Wine as WineIcon } from "lucide-react"; // V94
import { Factory as FactoryIcon, Footprints as FootprintsIcon } from "lucide-react"; // V93
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { usePublicContent } from "@/lib/publicContent";

// V76 — "Strumenti": tutti gli strumenti del sito in un solo posto (prima erano tanti chip in Home).
export default function Strumenti({ onBack, onNav, features }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const pub = usePublicContent(); // null finché non caricato

  const all = [
    { route: "calcolatrice", Icon: Calculator, show: true, t: tri("La calcolatrice del fornaio", "Der Bäckerrechner", "The baker's calculator"), d: tri("Il tuo impasto in grammi, con biga, poolish o lievito madre", "Dein Teig in Gramm, mit Biga, Poolish oder Sauerteig", "Your dough in grams, with biga, poolish or sourdough") }, // V127
    { route: "pizza", Icon: Pizza, show: true, t: tri("Calcolo impasto pizza", "Pizzateig-Rechner", "Pizza dough calculator"), d: tri("Panetti o teglia, il lievito giusto per le tue ore", "Teigkugeln oder Blech, die richtige Hefe für deine Stunden", "Dough balls or pan, the right yeast for your hours") }, // V127
    { route: "rinfresco", Icon: Hourglass, show: true, t: tri("Lievito madre pronto all'ora giusta", "Sauerteig pünktlich fertig", "Starter ready on time"), d: tri("Quanto rinfrescare adesso", "Wie viel du jetzt auffrischst", "How much to feed now") }, // V127
    { route: "panico", Icon: Flame, show: true, t: tri("Panico da cena", "Abendessen-Panik", "Dinner panic"), d: tri("Idee veloci per stasera", "Schnelle Ideen für heute Abend", "Quick ideas for tonight") },
    { route: "sughi", Icon: Soup, show: true, t: tri("Sopra la focaccia", "Auf die Focaccia", "On the focaccia"), d: tri("Condimenti per focacce, pizze e pane", "Beläge für Focaccia, Pizza und Brot", "Toppings for focaccia, pizza and bread") },
    { route: "cosa-faccio", Icon: Sparkles, show: !features || features.FEATURE_PLAN !== false, t: tri("Cosa faccio?", "Was mache ich?", "What can I make?"), d: tri("Cosa posso fare con quello che ho", "Was ich mit dem machen kann, was ich habe", "What I can make with what I have") },
    { route: "primopane", Icon: FootprintsIcon, show: true, t: tri("Il tuo primo pane", "Dein erstes Brot", "Your first bread"), d: tri("7 giorni, un passo al giorno, con Sitor accanto", "7 Tage, ein Schritt pro Tag, mit Sitor an der Seite", "7 days, one step a day, with Sitor beside you") }, // V93
    { route: "laboratorio", Icon: FactoryIcon, show: true, t: tri("Il laboratorio", "Die Backstube", "The bakery"), d: tri("Foglio di produzione, cella, conversioni, carico del forno: per chi panifica di mestiere", "Produktionsblatt, Kühlzelle, Umrechnungen, Ofenbelegung: für alle, die beruflich backen", "Production sheet, cold room, conversions, oven loading: for those who bake for a living") }, // V93
    { route: "sommelier", Icon: WineIcon, show: true, t: tri("Il sommelier del pane", "Der Brot-Sommelier", "The bread sommelier"), d: tri("Assaggia il tuo pane con cinque sensi: scheda, verdetto di Sitor, abbinamenti", "Verkoste dein Brot mit fünf Sinnen: Karte, Sitors Urteil, Kombinationen", "Taste your bread with five senses: card, Sitor's verdict, pairings") }, // V94
    { route: "ospiti", Icon: UsersIcon, show: true, t: tri("Stasera ho ospiti", "Heute kommen Gäste", "Guests tonight"), d: tri("Occasione, persone, orario: i pani giusti, le dosi a persona, quando iniziare, la spesa", "Anlass, Personen, Uhrzeit: die richtigen Brote, Mengen pro Person, wann anfangen, der Einkauf", "Occasion, people, time: the right breads, per-person amounts, when to start, the shopping") }, // V95
    { route: "carta", Icon: ScrollIcon, show: true, t: tri("La carta dei pani", "Die Brotkarte", "The bread menu"), d: tri("Un menu elegante da stampare: cena, regalo, banco", "Eine elegante Karte zum Drucken: Abendessen, Geschenk, Theke", "An elegant menu to print: dinner, gift, counter") }, // V95
    { route: "anno", Icon: Sparkles, show: true, t: tri("Il tuo anno da fornaio", "Dein Jahr als Bäcker", "Your year as a baker"), d: tri("Pani fatti, medaglie, lievito, assaggi: i tuoi numeri in un manifesto da condividere", "Brote, Medaillen, Sauerteig, Verkostungen: deine Zahlen auf einem Plakat zum Teilen", "Loaves, medals, starter, tastings: your numbers on a poster to share") }, // V96
    { route: "libro", Icon: BookIcon, show: true, t: tri("Il mio libro di pane", "Mein Brotbuch", "My bread book"), d: tri("Le ricette nel cuore impaginate come un libretto da stampare o salvare in PDF", "Die Lieblingsrezepte als Büchlein zum Drucken oder als PDF", "Your favourite recipes as a booklet to print or save as PDF") }, // V97
    { route: "valigia", Icon: BriefcaseIcon, show: true, t: tri("La valigia della bottega", "Der Koffer der Bottega", "The bottega suitcase"), d: tri("Salva tutto quello che MikiLab sa di te in un file e riaprilo sul telefono nuovo", "Sichere alles, was MikiLab über dich weiß, in einer Datei und pack es auf dem neuen Handy aus", "Save everything MikiLab knows about you to a file and unpack it on a new phone") }, // V97
    { route: "mappa", Icon: MapIcon, show: true, t: tri("La mappa di MikiLab", "Die Karte von MikiLab", "The map of MikiLab"), d: tri("Tutto il sito in una pagina, ogni attrezzo spiegato in una riga", "Die ganze Seite auf einer Seite, jedes Werkzeug in einer Zeile erklärt", "The whole site on one page, every tool explained in a line") }, // V100
    { route: "oggi", Icon: SunIcon, show: true, t: tri("L'almanacco del fornaio", "Der Almanach des Bäckers", "The baker's almanac"), d: tri("Ogni giorno una pagina diversa: festa, proverbio, gesto, pane di oggi, timbro", "Jeden Tag eine andere Seite: Fest, Sprichwort, Handgriff, Brot des Tages, Stempel", "A different page every day: feast, proverb, gesture, today's bread, stamp") }, // V101
    { route: "pasta", Icon: WheatIcon, show: true, t: tri("Le mani in pasta", "Die Hände im Teig", "Hands in the dough"), d: tri("Dodici forme scritte da Sitor, dalla Basilicata in su: dosi a persona, tecnica, condimento", "Zwölf Formen von Sitor, von der Basilikata aufwärts: Mengen pro Person, Technik, Sauce", "Twelve shapes written by Sitor, from Basilicata upwards: per-person amounts, technique, sauce") }, // V102
    { route: "piccoli", Icon: BabyIcon, show: true, t: tri("Il pane dei piccoli", "Das Brot der Kleinen", "Bread for little ones"), d: tri("Fare il pane con i bambini dai tre anni: dodici forme, la storia del pane, la notte del fornaio, il gioco del lievito, un'ora in classe, il diploma", "Brot backen mit Kindern ab drei: zwölf Formen, die Brotgeschichte, die Nacht des Bäckers, das Hefespiel, eine Stunde in der Klasse, die Urkunde", "Baking bread with children from three: twelve shapes, the story of bread, the baker's night, the yeast game, one hour in class, the diploma") }, // V103+V111
    { route: "scuola", Icon: SchoolIcon, show: true, t: tri("MikiLab a scuola", "MikiLab in der Schule", "MikiLab at school"), d: tri("Il programma del pane dall'asilo alla quinta: 36 schede per maestre e maestri, giochi, disegni, quaderno della classe, attestato", "Das Brotprogramm von der Kita bis zur fünften Klasse: 36 Stunden für Lehrkräfte, Spiele, Ausmalbilder, Klassenheft, Urkunde", "The bread programme from kindergarten to fifth grade: 36 sheets for teachers, games, colouring, class notebook, certificate") }, // V111
    { route: "salva", Icon: LifeBuoyIcon, show: true, t: tri("Il pane che salva", "Das Brot, das rettet", "The bread that saves"), d: tri("Il pane senza lievito, senza forno, senza bilancia, senza corrente, e la dispensa di scorta", "Brot ohne Hefe, ohne Ofen, ohne Waage, ohne Strom, und der Notvorrat", "Bread without yeast, oven, scale or power, and the emergency pantry") }, // V107
    { route: "cerca", Icon: SearchIcon, show: true, t: tri("Cerca in tutto MikiLab", "In ganz MikiLab suchen", "Search all of MikiLab"), d: tri("Una casella per ricette, ingredienti, attrezzi, parole del mestiere, feste", "Ein Feld für Rezepte, Zutaten, Werkzeuge, Fachwörter, Feste", "One box for recipes, ingredients, tools, trade words, feasts") }, // V108
    { route: "collezioni", Icon: LayersIcon, show: true, t: tri("Le collezioni", "Die Sammlungen", "The collections"), d: tri("Le ricette per come si usano: in due ore, la domenica, con il lievito madre, i pani del Sud…", "Die Rezepte nach Gebrauch: in zwei Stunden, sonntags, mit Sauerteig, die Brote des Südens…", "Recipes by use: in two hours, on Sunday, with sourdough, breads of the South…") }, // V108
    { route: "domande", Icon: HelpIcon, show: true, t: tri("Le domande del fornaio", "Die Fragen des Bäckers", "The baker's questions"), d: tri("49 domande con la risposta pronta, senza IA: problemi dell'impasto e parole del mestiere", "49 Fragen mit fertiger Antwort, ohne KI: Teigprobleme und Fachwörter", "49 questions with a ready answer, no AI: dough problems and trade words") }, // V108
    { route: "banco", Icon: FlaskConical, show: true, t: tri("Il banco delle prove", "Die Prüfbank", "The test bench"), d: tri("Prova del dito, della finestra, del lievito e il tempo di oggi", "Finger-, Fenster-, Schwimmprobe und das Wetter von heute", "Poke, windowpane, float test and today's weather") },
    { route: "mioforno", Icon: Camera, show: true, t: tri("Il mio forno", "Mein Ofen", "My oven"), d: tri("Foto e note dei tuoi pani, solo sul tuo telefono", "Fotos und Notizen deiner Brote, nur auf deinem Handy", "Photos and notes of your bakes, only on your phone") },
    { route: "mensola", Icon: BookOpen, show: true, t: tri("La mia mensola", "Mein Regal", "My shelf"), d: tri("Le tue ricette salvate", "Deine gespeicherten Rezepte", "Your saved recipes") },
    { route: "cucina", Icon: ChefHat, show: true, t: tri("La mia cucina", "Meine Küche", "My kitchen"), d: tri("I tuoi attrezzi e il tuo forno", "Deine Geräte und dein Ofen", "Your equipment and your oven") },
    { route: "plan", Icon: CalendarDays, show: true, t: tri("Piano settimana", "Wochenplan", "Weekly plan"), d: tri("Organizza cosa infornare", "Plane, was du backst", "Plan what to bake") },
    { route: "calendario", Icon: CalendarDays, show: !!(pub && pub.hasCalendario), t: tri("Calendario del pane", "Brotkalender", "Bread calendar"), d: tri("Cosa fare nelle stagioni", "Was in welcher Saison", "What to bake by season") },
    { route: "testmese", Icon: Beaker, show: !!(pub && pub.hasTestMese), t: tri("Test del mese", "Test des Monats", "Test of the month"), d: tri("L'esperimento del mese", "Das Experiment des Monats", "This month's experiment") },
    { route: "dalmondo", Icon: Globe, show: true, t: tri("Dal mondo", "Aus aller Welt", "From the world"), d: tri("Pani e ricette dal mondo", "Brote und Rezepte aus aller Welt", "Breads and recipes from the world") },
    { route: "paneieri", Icon: Recycle, show: true, t: tri("Pane di ieri", "Brot von gestern", "Yesterday's bread"), d: tri("Non buttare il pane vecchio", "Wirf altes Brot nicht weg", "Don't throw away old bread") },
    { route: "sveglia", Icon: AlarmClock, show: true, t: tri("La sveglia del panettiere", "Der Bäckerwecker", "The baker's alarm"), d: tri("Pane pronto all'ora che dici tu: ogni passo nel calendario", "Brot fertig, wann du willst: jeder Schritt im Kalender", "Bread ready when you say: every step in your calendar") },
    { route: "crosta", Icon: Ear, show: true, t: tri("Il pane parla", "Das Brot spricht", "The bread speaks"), d: tri("Batti sul fondo del pane: il telefono ti dice se è cotto", "Klopf auf den Brotboden: das Handy sagt dir, ob es fertig ist", "Knock on the loaf: your phone tells you if it's done") },
    { route: "paese", Icon: MapPin, show: true, t: tri("Il pane del mio paese", "Das Brot meiner Heimat", "The bread of my homeland"), d: tri("Prima i pani di casa tua", "Zuerst die Brote deiner Heimat", "The breads of your home first") },
    { route: "bilancia", Icon: Scale, show: true, t: tri("Pane senza bilancia", "Brot ohne Waage", "Bread without a scale"), d: tri("Grammi in tazze e cucchiai, per quando non ce l'hai", "Gramm in Tassen und Löffel, wenn keine Waage da ist", "Grams to cups and spoons, when you don't have one") },
    { route: "curalievito", Icon: BookOpenIcon, show: true, t: tri("Curare il lievito madre", "Den Sauerteig pflegen", "Caring for your starter"), d: tri("Come si nutre, si sveglia e si fa crescere", "Wie man ihn füttert, weckt und wachsen lässt", "How to feed it, wake it and help it grow") },
    { route: "miolievito", Icon: Sprout, show: true, t: tri("Il mio lievito madre", "Mein Sauerteig", "My sourdough starter"), d: tri("Nome, data di nascita, pasti e traguardi del tuo lievito", "Name, Geburtstag, Mahlzeiten und Meilensteine deines Sauerteigs", "Name, birthday, feedings and milestones of your starter") },
    { route: "mappaforno", Icon: Flame, show: true, t: tri("La mappa del tuo forno", "Die Karte deines Ofens", "The map of your oven"), d: tri("Scopri dove scalda di più il tuo forno", "Finde heraus, wo dein Ofen am stärksten heizt", "Find out where your oven runs hot") },
    { route: "crealievito", Icon: Sprout, show: true, t: tri("Crea il tuo lievito", "Sauerteig erschaffen", "Create your starter"), d: tri("Il tuo lievito madre", "Dein eigener Sauerteig", "Your own sourdough") },
    { route: "live", Icon: Radio, show: (!features || features.FEATURE_LIVE !== false) && !!(pub && pub.hasLive), t: tri("Live", "Live", "Live"), d: tri("Le dirette di Michele", "Micheles Live-Videos", "Michele's live streams") },
    { route: "attrezzi", Icon: Settings, show: true, t: tri("Attrezzi", "Geräte", "Tools"), d: tri("Guida agli attrezzi", "Geräte-Ratgeber", "Equipment guide") },
    { route: "libretto", Icon: BookOpenIcon, show: true, t: tri("Il libretto dei 5 panini", "Das Heft der 5 Brötchen", "The 5 rolls booklet"), d: tri("Le ricette di partenza da stampare e appendere in cucina", "Die Startrezepte zum Drucken und Aufhängen", "The starter recipes to print and hang in the kitchen") },
    { route: "sorprendimi", Icon: Dices, show: true, t: tri("Sorprendimi", "Überrasch mich", "Surprise me"), d: tri("La ruota del fornaio sceglie per te", "Das Bäckerrad wählt für dich", "The baker's wheel picks for you") },
    { route: "medaglie", Icon: Award, show: true, t: tri("Le mie medaglie", "Meine Medaillen", "My medals"), d: tri("I tuoi passi in bottega", "Deine Schritte in der Backstube", "Your steps in the bakery") },
    { route: "volantino", Icon: Printer, show: true, t: tri("Il volantino da frigo", "Der Kühlschrank-Flyer", "The fridge flyer"), d: tri("Stampa il QR e porta MikiLab in un'altra cucina", "Druck den QR-Code und bring MikiLab in eine andere Küche", "Print the QR and bring MikiLab to another kitchen") },
    { route: "giro", Icon: Compass, show: true, t: tri("Il primo giro con Sitor", "Die erste Runde mit Sitor", "The first tour with Sitor"), d: tri("Come funziona il sito, in un minuto", "Wie die Seite funktioniert, in einer Minute", "How the site works, in one minute") },
    { route: "notte", Icon: Moon, show: true, t: tri("Modo notte del fornaio", "Nachtmodus des Bäckers", "Baker's night mode"), d: tri("Schermo caldo e scuro, tutto più grande, Sitor sussurra (accendi/spegni)", "Warmer, dunkler Bildschirm, alles größer, Sitor flüstert (an/aus)", "Warm dark screen, everything bigger, Sitor whispers (on/off)") },
    { route: "grande", Icon: ZoomIn, show: true, t: tri("Modo grande", "Großmodus", "Big mode"), d: tri("Scritte e pulsanti più grandi (accendi/spegni)", "Größere Schrift und Knöpfe (an/aus)", "Bigger text and buttons (on/off)") },
  ].filter((x) => x.show);
  // V99: cerca un attrezzo per nome e ritrova quelli usati di recente
  const [q, setQ] = useState("");
  const norm = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const shown = q.trim() ? all.filter((x) => norm(x.t + " " + x.d).includes(norm(q))) : all;
  const readRecent = () => { try { return JSON.parse(localStorage.getItem("mikilab_recenti") || "[]"); } catch { return []; } };
  const recent = readRecent().map((r) => all.find((x) => x.route === r)).filter(Boolean).slice(0, 4);
  const go = (route) => { try { localStorage.setItem("mikilab_recenti", JSON.stringify([route, ...readRecent().filter((r) => r !== route)].slice(0, 8))); } catch { /* */ } onNav(route); };

  return (
    <div data-testid="strumenti-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="strumenti-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold">
        <ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}
      </button>
      <div>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Strumenti", "Werkzeuge", "Tools")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tri("Tutto quello che ti aiuta in cucina, in un solo posto.", "Alles, was dir in der Küche hilft, an einem Ort.", "Everything that helps you in the kitchen, in one place.")}</p>
      </div>
      <input data-testid="strumenti-cerca" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tri("Cerca un attrezzo… (es. lievito, forno, stampa)", "Werkzeug suchen… (z. B. Sauerteig, Ofen, Drucken)", "Search a tool… (e.g. starter, oven, print)")} className="w-full text-[14px] bg-card text-foreground border border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary" />
      {!q.trim() && recent.length > 0 && (
        <div data-testid="strumenti-recenti">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{tri("Usati di recente", "Zuletzt benutzt", "Recently used")}</p>
          <div className="flex flex-wrap gap-1.5">{recent.map((x) => <button key={x.route} data-testid={`recente-${x.route}`} onClick={() => go(x.route)} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-full border border-primary/40 bg-primary/8 text-foreground active:scale-95"><x.Icon className="w-3.5 h-3.5 text-primary" />{x.t}</button>)}</div>
        </div>
      )}
      {shown.length === 0 && <p className="text-[13px] text-muted-foreground">{tri("Nessun attrezzo con questo nome. Prova con un'altra parola.", "Kein Werkzeug mit diesem Namen. Versuch ein anderes Wort.", "No tool with that name. Try another word.")}</p>}
      <div className="grid grid-cols-2 gap-2.5" data-testid="strumenti-grid">
        {shown.map((x) => (
          <button key={x.route} data-testid={`strumenti-${x.route}`} onClick={() => go(x.route)}
            className="flex flex-col items-start gap-1.5 text-left rounded-2xl border border-border bg-background p-3.5 active:scale-[0.98] hover:border-primary/60 transition-all min-w-0">
            <span className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center"><x.Icon className="w-5 h-5 text-primary" /></span>
            <span className="font-bold text-foreground text-[14px] leading-tight">{x.t}</span>
            <span className="text-[12px] text-foreground/70 leading-snug">{x.d}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
