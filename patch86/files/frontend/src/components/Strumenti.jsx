import { ChevronLeft, Sparkles, Radio, BookOpen, ChefHat, CalendarDays, Beaker, Globe, Recycle, Sprout, Settings, Flame, Soup, FlaskConical, Camera, Compass, ZoomIn, Ear, AlarmClock, MapPin, Scale, BookOpen as BookOpenIcon, Moon } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { usePublicContent } from "@/lib/publicContent";

// V76 — "Strumenti": tutti gli strumenti del sito in un solo posto (prima erano tanti chip in Home).
export default function Strumenti({ onBack, onNav, features }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const pub = usePublicContent(); // null finché non caricato

  const all = [
    { route: "panico", Icon: Flame, show: true, t: tri("Panico da cena", "Abendessen-Panik", "Dinner panic"), d: tri("Idee veloci per stasera", "Schnelle Ideen für heute Abend", "Quick ideas for tonight") },
    { route: "sughi", Icon: Soup, show: true, t: tri("Sopra la focaccia", "Auf die Focaccia", "On the focaccia"), d: tri("Condimenti per focacce, pizze e pane", "Beläge für Focaccia, Pizza und Brot", "Toppings for focaccia, pizza and bread") },
    { route: "cosa-faccio", Icon: Sparkles, show: !features || features.FEATURE_PLAN !== false, t: tri("Cosa faccio?", "Was mache ich?", "What can I make?"), d: tri("Cosa posso fare con quello che ho", "Was ich mit dem machen kann, was ich habe", "What I can make with what I have") },
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
    { route: "giro", Icon: Compass, show: true, t: tri("Il primo giro con Sitor", "Die erste Runde mit Sitor", "The first tour with Sitor"), d: tri("Come funziona il sito, in un minuto", "Wie die Seite funktioniert, in einer Minute", "How the site works, in one minute") },
    { route: "notte", Icon: Moon, show: true, t: tri("Modo notte del fornaio", "Nachtmodus des Bäckers", "Baker's night mode"), d: tri("Schermo caldo e scuro, tutto più grande, Sitor sussurra (accendi/spegni)", "Warmer, dunkler Bildschirm, alles größer, Sitor flüstert (an/aus)", "Warm dark screen, everything bigger, Sitor whispers (on/off)") },
    { route: "grande", Icon: ZoomIn, show: true, t: tri("Modo grande", "Großmodus", "Big mode"), d: tri("Scritte e pulsanti più grandi (accendi/spegni)", "Größere Schrift und Knöpfe (an/aus)", "Bigger text and buttons (on/off)") },
  ].filter((x) => x.show);

  return (
    <div data-testid="strumenti-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="strumenti-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold">
        <ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}
      </button>
      <div>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Strumenti", "Werkzeuge", "Tools")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tri("Tutto quello che ti aiuta in cucina, in un solo posto.", "Alles, was dir in der Küche hilft, an einem Ort.", "Everything that helps you in the kitchen, in one place.")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5" data-testid="strumenti-grid">
        {all.map((x) => (
          <button key={x.route} data-testid={`strumenti-${x.route}`} onClick={() => onNav(x.route)}
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
