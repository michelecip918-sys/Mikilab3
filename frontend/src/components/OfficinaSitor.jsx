import { useState } from "react";
import { Search, ArrowLeftRight, Eye, AlertTriangle, Scissors, Sparkles, Footprints, Factory, Wine, Users, ScrollText, BookOpen, Briefcase, Map, Sun } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useBackClose } from "@/lib/backNav";
import CosaPossoFare from "@/components/officina/CosaPossoFare";
import MettiAConfronto from "@/components/officina/MettiAConfronto";
import OcchioDiSitor from "@/components/officina/OcchioDiSitor";
import ProntoSoccorso from "@/components/officina/ProntoSoccorso";
import DisegnaIlTaglio from "@/components/officina/DisegnaIlTaglio";

// V92 — L'OFFICINA DI SITOR. Striscia di attrezzi nel Ricettario mikilab (sopra la ricerca): ognuno si apre
// in una finestra. Gli attrezzi che riguardano una ricetta precisa stanno invece dentro la scheda ricetta.

export default function OfficinaSitor({ recipes, t }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [open, setOpen] = useState(null);
  useBackClose(!!open, () => setOpen(null));
  const openRecipe = (id) => { setOpen(null); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 60); };

  const tools = [
    { k: "cosa", I: Search, l: tri("Cosa posso fare adesso?", "Was kann ich jetzt machen?", "What can I make now?"), s: tri("tempo, lievito, dispensa", "Zeit, Triebmittel, Vorrat", "time, leavening, pantry"), C: () => <CosaPossoFare recipes={recipes} lang={lang} t={t} onOpen={openRecipe} /> },
    { k: "confronto", I: ArrowLeftRight, l: tri("Metti a confronto", "Im Vergleich", "Side by side"), s: tri("due ricette, la differenza vera", "zwei Rezepte, der echte Unterschied", "two recipes, the real difference"), C: () => <MettiAConfronto recipes={recipes} lang={lang} t={t} /> },
    { k: "occhio", I: Eye, l: tri("L'occhio di Sitor", "Sitors Auge", "Sitor's eye"), s: tri("foto alla crosta o alla fetta", "Foto von Kruste oder Scheibe", "photo of crust or slice"), C: () => <OcchioDiSitor lang={lang} /> },
    { k: "soccorso", I: AlertTriangle, l: tri("Pronto soccorso dell'impasto", "Erste Hilfe für den Teig", "Dough first aid"), s: tri("cosa fare quando va storto", "was tun, wenn es schiefgeht", "what to do when it goes wrong"), C: () => <ProntoSoccorso lang={lang} /> },
    { k: "taglio", I: Scissors, l: tri("Disegna il taglio", "Zeichne den Schnitt", "Draw the score"), s: tri("forme e schemi, come si apre", "Formen und Muster, wie es aufgeht", "shapes and patterns, how it opens"), C: () => <DisegnaIlTaglio r={null} lang={lang} /> },
  ];
  const cur = tools.find((x) => x.k === open);
  const nav = (route) => window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route } })); // V93
  const pages = [
    { k: "primopane", I: Footprints, route: "primopane", l: tri("Il tuo primo pane", "Dein erstes Brot", "Your first bread"), s: tri("7 giorni, un passo al giorno", "7 Tage, ein Schritt pro Tag", "7 days, one step a day") },
    { k: "ospiti", I: Users, route: "ospiti", l: tri("Stasera ho ospiti", "Heute kommen Gäste", "Guests tonight"), s: tri("pani, dosi a persona, orari, spesa", "Brote, Mengen pro Person, Zeiten, Einkauf", "breads, per-person amounts, times, shopping") },
    { k: "carta", I: ScrollText, route: "carta", l: tri("La carta dei pani", "Die Brotkarte", "The bread menu"), s: tri("un menu elegante da stampare", "eine elegante Karte zum Drucken", "an elegant menu to print") },
    { k: "sommelier", I: Wine, route: "sommelier", l: tri("Il sommelier del pane", "Der Brot-Sommelier", "The bread sommelier"), s: tri("assaggia con cinque sensi", "mit fünf Sinnen verkosten", "taste with five senses") },
    { k: "oggi", I: Sun, route: "oggi", l: tri("L'almanacco del fornaio", "Der Almanach des Bäckers", "The baker's almanac"), s: tri("ogni giorno una pagina nuova", "jeden Tag eine neue Seite", "a new page every day") },
    { k: "mappa", I: Map, route: "mappa", l: tri("La mappa di MikiLab", "Die Karte von MikiLab", "The map of MikiLab"), s: tri("tutto il sito in una pagina", "die ganze Seite auf einer Seite", "the whole site on one page") },
    { k: "libro", I: BookOpen, route: "libro", l: tri("Il mio libro di pane", "Mein Brotbuch", "My bread book"), s: tri("i preferiti, stampati come un libro", "die Favoriten, gedruckt wie ein Buch", "favourites, printed like a book") },
    { k: "valigia", I: Briefcase, route: "valigia", l: tri("La valigia della bottega", "Der Koffer der Bottega", "The bottega suitcase"), s: tri("porta i tuoi dati sul nuovo telefono", "nimm deine Daten aufs neue Handy mit", "take your data to a new phone") },
    { k: "anno", I: Sparkles, route: "anno", l: tri("Il tuo anno da fornaio", "Dein Jahr als Bäcker", "Your year as a baker"), s: tri("i tuoi numeri, un manifesto", "deine Zahlen, ein Plakat", "your numbers, a poster") },
    { k: "laboratorio", I: Factory, route: "laboratorio", l: tri("Il laboratorio", "Die Backstube", "The bakery"), s: tri("produzione, cella, conversioni, forno", "Produktion, Kühlzelle, Umrechnung, Ofen", "production, cold room, conversions, oven") },
  ];

  return (
    <div data-testid="officina-sitor" className="mb-3">
      <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia mb-1.5 flex items-center gap-1.5"><Sparkles className="w-3 h-3" />{tri("L'Officina di Sitor", "Sitors Werkstatt", "Sitor's Workshop")}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {tools.map((x) => (
          <button key={x.k} data-testid={`officina-${x.k}`} onClick={() => setOpen(x.k)}
            className="snap-start shrink-0 w-[164px] min-h-[92px] text-left rounded-xl border border-salvia/40 bg-salvia/8 p-2.5 active:scale-[0.98] hover:border-salvia transition-all">
            <x.I className="w-4 h-4 text-salvia mb-1.5" />
            <span className="block text-[12.5px] font-bold text-foreground leading-tight">{x.l}</span>
            <span className="block text-[11px] text-muted-foreground leading-tight mt-0.5">{x.s}</span>
          </button>
        ))}
        {pages.map((x) => (
          <button key={x.k} data-testid={`officina-${x.k}`} onClick={() => nav(x.route)}
            className="snap-start shrink-0 w-[164px] min-h-[92px] text-left rounded-xl border border-primary/40 bg-primary/8 p-2.5 active:scale-[0.98] hover:border-primary transition-all">
            <x.I className="w-4 h-4 text-primary mb-1.5" />
            <span className="block text-[12.5px] font-bold text-foreground leading-tight">{x.l}</span>
            <span className="block text-[11px] text-muted-foreground leading-tight mt-0.5">{x.s}</span>
          </button>
        ))}
      </div>
      <Dialog open={!!cur} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto bg-background dark:bg-background border-border dark:border-border p-4">
          <DialogTitle className="font-display text-lg font-bold text-foreground flex items-center gap-2">{cur && <cur.I className="w-5 h-5 text-salvia" />}{cur ? cur.l : ""}</DialogTitle>
          <DialogDescription className="sr-only">{tri("Attrezzo dell'Officina di Sitor", "Werkzeug aus Sitors Werkstatt", "A tool from Sitor's Workshop")}</DialogDescription>
          {cur && <cur.C />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
