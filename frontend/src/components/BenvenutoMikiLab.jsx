import { useState } from "react";
import { Sun, Footprints, LifeBuoy, Search, Factory, Baby, Map, ChevronRight, ChefHat } from "lucide-react";
import { CERCA_KEY } from "@/components/Cerca"; // V108
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// V107 — BENVENUTO. Chi apre MikiLab deve capire in trenta secondi cos'è e a chi serve: a tutti. Farina, acqua, sale e le mani
// bastano per mangiare, ovunque. Sei porte chiare, una per ogni persona che arriva. La prima volta si vede tutto;
// poi diventa una riga sola (con "rivedi"), per non stare in mezzo a chi il sito lo conosce già.

const KEY = "mikilab_benvenuto_visto";

export default function BenvenutoMikiLab({ onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [open, setOpen] = useState(() => { try { return !localStorage.getItem(KEY); } catch { return true; } });
  const close = () => { setOpen(false); try { localStorage.setItem(KEY, String(Date.now())); } catch { /* */ } };
  const go = (r) => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* */ } onNav(r); };
  const [q, setQ] = useState(""); // V108
  const cerca = (e) => { if (e) e.preventDefault(); try { sessionStorage.setItem(CERCA_KEY, q); } catch { /* */ } onNav("cerca"); };
  const searchBox = (
    <form data-testid="benvenuto-cerca" onSubmit={cerca} className="relative mb-3"><Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tri("Cerca in tutto MikiLab: ricette, ingredienti, parole…", "In ganz MikiLab suchen: Rezepte, Zutaten, Wörter…", "Search all of MikiLab: recipes, ingredients, words…")} className="w-full text-[14px] bg-card text-foreground border border-border rounded-xl pl-9 pr-16 py-2.5 outline-none focus:border-primary" /><button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[12px] font-bold px-2.5 py-1.5 rounded-lg bg-primary text-white">{tri("Cerca", "Suchen", "Search")}</button></form>
  );

  const doors = [
    { r: "salva", I: LifeBuoy, t: tri("Ho poco in casa", "Ich habe wenig zu Hause", "I have little at home"), d: tri("pane senza lievito, senza forno, senza bilancia, senza corrente", "Brot ohne Hefe, ohne Ofen, ohne Waage, ohne Strom", "bread without yeast, oven, scale or power") },
    { r: "primopane", I: Footprints, t: tri("Non ho mai fatto il pane", "Ich habe nie Brot gebacken", "I've never made bread"), d: tri("sette giorni, un passo al giorno", "sieben Tage, ein Schritt pro Tag", "seven days, one step a day") },
    { r: "recipes", I: Search, t: tri("Voglio fare qualcosa oggi", "Ich will heute etwas backen", "I want to bake something today"), d: tri("167 ricette; in cima: \"cosa posso fare adesso?\"", "167 Rezepte; oben: \"was kann ich jetzt machen?\"", "167 recipes; at the top: \"what can I make now?\"") },
    { r: "oggi", I: Sun, t: tri("Passo ogni giorno", "Ich komme jeden Tag", "I drop by every day"), d: tri("l'almanacco: festa, proverbio, pane di oggi", "der Almanach: Fest, Sprichwort, Brot des Tages", "the almanac: feast, proverb, today's bread") },
    { r: "piccoli", I: Baby, t: tri("Con i bambini", "Mit Kindern", "With children"), d: tri("sei forme da fare insieme, e il diploma", "sechs Formen zum gemeinsamen Machen, und die Urkunde", "six shapes to make together, and a diploma") },
    { r: "laboratorio", I: Factory, t: tri("Lavoro in bottega", "Ich arbeite in der Backstube", "I work in a bakery"), d: tri("produzione, cella, conversioni, forno", "Produktion, Kühlzelle, Umrechnungen, Ofen", "production, cold room, conversions, oven") },
  ];

  if (!open) return (
    <div>
    {searchBox}
    <button data-testid="benvenuto-ricette" onClick={() => onNav("recipes")} className="mb-3 w-full flex items-center gap-3 rounded-2xl border-2 border-primary/60 bg-primary/10 px-4 py-3 text-left active:scale-[0.99] hover:border-primary transition-all"> {/* V126 */}
      <ChefHat className="w-6 h-6 text-primary shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block font-display text-lg font-black text-foreground leading-tight">{tri("Tutte le ricette", "Alle Rezepte", "All recipes")}</span>
        <span className="block text-[12px] text-muted-foreground">{tri("Pane, panini, focacce, pizza e dolci", "Brot, Brötchen, Focaccia, Pizza und Süßes", "Bread, rolls, focaccia, pizza and sweets")}</span>
      </span>
      <ChevronRight className="w-5 h-5 text-primary shrink-0" />
    </button>
    <button data-testid="benvenuto-compatto" onClick={() => setOpen(true)} className="mb-3 w-full text-left text-[12.5px] text-muted-foreground flex items-center gap-1.5">
      <span className="font-display italic text-foreground">{tri("Farina, acqua, sale e le tue mani.", "Mehl, Wasser, Salz und deine Hände.", "Flour, water, salt and your hands.")}</span>
      <span className="underline decoration-dotted">{tri("Cos'è MikiLab?", "Was ist MikiLab?", "What is MikiLab?")}</span>
    </button>
    </div>
  );

  return (
    <section data-testid="benvenuto" className="mb-4 rounded-3xl border border-primary/30 bg-background/80 p-5">
      <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary">{tri("Benvenuto in MikiLab", "Willkommen bei MikiLab", "Welcome to MikiLab")}</p>
      <h1 className="font-display text-[26px] leading-tight font-black text-foreground mt-1">{tri("Farina, acqua, sale e le tue mani: con questo si mangia, ovunque.", "Mehl, Wasser, Salz und deine Hände: damit isst man, überall.", "Flour, water, salt and your hands: that's enough to eat, anywhere.")}</h1>
      <div className="mk-oro-line my-3" />
      {searchBox}
      <p className="text-[14px] text-foreground/90 leading-snug">{tri("MikiLab insegna a fare il pane, la pizza, la pasta e i dolci lievitati a tutti: a chi non ha mai impastato, a chi lo fa di mestiere, a chi deve arrangiarsi con poco. Saper fare il pane non è un hobby: è saper badare a sé e agli altri. Le ricette sono di Michele, panettiere a Stoccarda nato a Matera; Sitor è la guida, un'intelligenza artificiale.", "MikiLab bringt allen bei, Brot, Pizza, Pasta und Hefegebäck zu machen: denen, die nie geknetet haben, denen, die es beruflich tun, denen, die mit wenig auskommen müssen. Brot backen können ist kein Hobby: es heißt, für sich und andere sorgen zu können. Die Rezepte sind von Michele, Bäcker in Stuttgart, geboren in Matera; Sitor ist der Guide, eine künstliche Intelligenz.", "MikiLab teaches everyone to make bread, pizza, pasta and leavened sweets: those who have never kneaded, those who do it for a living, those who must get by with little. Knowing how to make bread isn't a hobby: it's knowing how to look after yourself and others. The recipes are Michele's, a baker in Stuttgart born in Matera; Sitor is the guide, an artificial intelligence.")}</p>
      <p className="text-[12.5px] text-muted-foreground mt-2">{tri("Gratis, senza registrazione, senza pubblicità. Quello che fai resta nel tuo telefono. Da dove vuoi cominciare?", "Kostenlos, ohne Anmeldung, ohne Werbung. Was du tust, bleibt auf deinem Handy. Wo willst du anfangen?", "Free, no sign-up, no ads. What you do stays on your phone. Where would you like to start?")}</p>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {doors.map((x) => (
          <button key={x.r} data-testid={`benvenuto-${x.r}`} onClick={() => go(x.r)} className="flex items-center gap-3 text-left rounded-2xl border border-border bg-card px-3 py-2.5 active:scale-[0.99] hover:border-primary/60 transition-all">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 shrink-0"><x.I className="w-5 h-5 text-primary" /></span>
            <span className="flex-1 min-w-0"><span className="block text-[14px] font-bold text-foreground leading-tight">{x.t}</span><span className="block text-[12px] text-muted-foreground leading-snug">{x.d}</span></span>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button data-testid="benvenuto-mappa" onClick={() => go("mappa")} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-primary"><Map className="w-4 h-4" />{tri("Tutto il sito in una pagina", "Die ganze Seite auf einer Seite", "The whole site on one page")}</button>
        <button data-testid="benvenuto-chiudi" onClick={close} className="ml-auto text-[12px] text-muted-foreground underline decoration-dotted">{tri("Ho capito, chiudi", "Verstanden, schließen", "Got it, close")}</button>
      </div>
    </section>
  );
}
