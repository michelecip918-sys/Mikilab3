import { useState, useEffect } from "react";
import { ChevronLeft, MapPin } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";

// V86 — "Il pane del mio paese": scegli da dove vieni e vedi prima i pani di casa tua.
// L'abbinamento ricetta→regione è fatto per parole chiave nel nome (nessun dato nuovo nel DB).
// La regione scelta resta nel telefono (localStorage). Le due righe di storia sono BOZZE di Sitor (IA):
// Michele le riscrive con le sue.

const KEY = "mikilab_paese";
const D = (it, de, en) => ({ it, de, en });

export const REGIONS = [
  { k: "basilicata", flag: "🇮🇹", name: D("Basilicata", "Basilikata", "Basilicata"), kw: ["matera", "lucan", "oro di terra", "gran riserva"],
    story: D("La terra di Michele. Pane di grano duro, forme grandi che durano una settimana, forno a legna e crosta spessa: il pane di Matera è il modello di tutto il sito.", "Micheles Heimat. Hartweizenbrot, große Laibe, die eine Woche halten, Holzofen und dicke Kruste: das Brot von Matera ist das Vorbild der ganzen Seite.", "Michele's homeland. Durum wheat bread, big loaves that last a week, wood oven and a thick crust: Matera bread is the model for the whole site.") },
  { k: "puglia", flag: "🇮🇹", name: D("Puglia", "Apulien", "Puglia"), kw: ["altamura", "puglies", "barese", "salentin", "frisell", "tarall", "panzerott", "puccia"],
    story: D("Semola rimacinata, focaccia con i pomodorini e le olive, taralli e friselle: il Sud che si mangia con le mani.", "Feiner Hartweizengrieß, Focaccia mit Kirschtomaten und Oliven, Taralli und Friselle: der Süden, den man mit den Händen isst.", "Fine durum semolina, focaccia with cherry tomatoes and olives, taralli and friselle: the South you eat with your hands.") },
  { k: "campania", flag: "🇮🇹", name: D("Campania", "Kampanien", "Campania"), kw: ["napoletan", "friariell", "pizzette", "rustici", "cornetti all'italiana", "saccottino"],
    story: D("Napoli: la pizza tonda a 450 gradi, i cornetti della colazione, la rosticceria. Impasti morbidi e forni violenti.", "Neapel: die runde Pizza bei 450 Grad, die Cornetti zum Frühstück, die Rosticceria. Weiche Teige und heftige Öfen.", "Naples: round pizza at 450 degrees, breakfast cornetti, street-food bakery. Soft doughs and fierce ovens.") },
  { k: "calabria", flag: "🇮🇹", name: D("Calabria", "Kalabrien", "Calabria"), kw: ["nduja", "tropea"],
    story: D("Cipolla di Tropea dolce e 'nduja piccante: due sapori forti che sul pane trovano pace.", "Süße Zwiebel aus Tropea und scharfe 'Nduja: zwei kräftige Aromen, die auf dem Brot Frieden finden.", "Sweet Tropea onion and spicy 'nduja: two bold flavours that make peace on bread.") },
  { k: "sicilia", flag: "🇮🇹", name: D("Sicilia", "Sizilien", "Sicily"), kw: ["semola al sesamo", "sicilian", "mafald"],
    story: D("Semola di grano duro e sesamo sulla crosta: il pane siciliano è giallo dentro e profumato fuori.", "Hartweizengrieß und Sesam auf der Kruste: sizilianisches Brot ist innen gelb und außen duftend.", "Durum semolina and sesame on the crust: Sicilian bread is yellow inside and fragrant outside.") },
  { k: "liguria", flag: "🇮🇹", name: D("Liguria", "Ligurien", "Liguria"), kw: ["genoves", "pesto", "focaccia patate", "focaccia con patate"],
    story: D("La focaccia genovese: sottile, unta, con i buchi pieni di salamoia. Si mangia anche a colazione, nel cappuccino.", "Die Focaccia aus Genua: dünn, ölig, die Löcher voller Lake. Man isst sie sogar zum Frühstück, in den Cappuccino getunkt.", "Genoese focaccia: thin, oily, its dimples full of brine. Eaten even at breakfast, dipped in cappuccino.") },
  { k: "toscana", flag: "🇮🇹", name: D("Toscana", "Toskana", "Tuscany"), kw: ["toscan", "schiacciata", "all'uva"],
    story: D("Il pane sciapo, senza sale, fatto per i sughi saporiti. E la schiacciata con l'uva a settembre.", "Das salzlose Brot, gemacht für kräftige Saucen. Und die Schiacciata mit Trauben im September.", "Saltless bread, made for full-flavoured sauces. And the grape schiacciata in September.") },
  { k: "lazio", flag: "🇮🇹", name: D("Lazio / Roma", "Latium / Rom", "Lazio / Rome"), kw: ["romana", "alla pala", "al taglio", "casereccio"],
    story: D("La pizza in teglia romana: alta idratazione, croccante sotto, morbida sopra, tagliata con le forbici.", "Die römische Blechpizza: hohe Hydration, unten knusprig, oben weich, mit der Schere geschnitten.", "Roman tray pizza: high hydration, crisp underneath, soft on top, cut with scissors.") },
  { k: "piemonte", flag: "🇮🇹", name: D("Piemonte", "Piemont", "Piedmont"), kw: ["torines", "grissin"],
    story: D("I grissini stirati a mano, lunghi quanto il braccio: nati a Torino per un principe che digeriva male il pane.", "Handgezogene Grissini, armlang: in Turin erfunden für einen Prinzen, der Brot schlecht vertrug.", "Hand-stretched grissini, as long as your arm: born in Turin for a prince who couldn't digest bread.") },
  { k: "nord", flag: "🇮🇹", name: D("Lombardia e Veneto", "Lombardei und Venetien", "Lombardy and Veneto"), kw: ["panettone", "pandoro", "colomba", "venezian", "ciabatta"],
    story: D("I grandi lievitati delle feste: panettone, pandoro, colomba. E la ciabatta, nata negli anni Ottanta per fare concorrenza alla baguette.", "Die großen Festtags-Hefeteige: Panettone, Pandoro, Colomba. Und die Ciabatta, in den Achtzigern als Antwort auf das Baguette erfunden.", "The great festive leavened breads: panettone, pandoro, colomba. And ciabatta, born in the eighties to compete with the baguette.") },
  { k: "baviera", flag: "🇩🇪", name: D("Baviera", "Bayern", "Bavaria"), kw: ["brezel", "bretzel", "bavarese", "laugen"],
    story: D("La Brezel con la liscivia: crosta bruna e lucida, sale grosso, burro dentro. Il pane della birra.", "Die Laugenbrezel: braune, glänzende Kruste, grobes Salz, Butter drin. Das Brot zum Bier.", "The lye pretzel: brown glossy crust, coarse salt, butter inside. The bread that goes with beer.") },
  { k: "svevia", flag: "🇩🇪", name: D("Svevia e Stoccarda", "Schwaben und Stuttgart", "Swabia and Stuttgart"), kw: ["gnetze", "wurzel", "quark", "schwäb", "svev"],
    story: D("La casa di MikiLab. Pane di segale e grano, Quarkbrötchen del sabato, il forno che Michele accende alle 4 di mattina.", "Das Zuhause von MikiLab. Roggen-Weizen-Brot, Quarkbrötchen am Samstag, der Ofen, den Michele um 4 Uhr früh anheizt.", "MikiLab's home. Rye-wheat bread, Saturday Quarkbrötchen, the oven Michele lights at 4 in the morning.") },
  { k: "germania", flag: "🇩🇪", name: D("Germania", "Deutschland", "Germany"), kw: ["stollen", "kochstück", "segale", "roggen", "tedesc", "deutsch", "sinfonia di cereali", "cereali"],
    story: D("La Germania ha più di tremila pani registrati: segale, cereali, semi, Kochstück per la morbidezza. Qui il pane è una cosa seria.", "Deutschland hat über dreitausend eingetragene Brotsorten: Roggen, Körner, Saaten, Kochstück für die Weichheit. Hier ist Brot eine ernste Sache.", "Germany has over three thousand registered breads: rye, grains, seeds, Kochstück for softness. Here bread is serious business.") },
  { k: "francia", flag: "🇫🇷", name: D("Francia", "Frankreich", "France"), kw: ["baguette", "croissant", "brioche", "pain", "filo di francia", "girella"],
    story: D("Baguette con poolish, croissant sfogliati, brioche al burro: la scuola francese, precisa e paziente.", "Baguette mit Poolish, Blätter-Croissants, Butterbrioche: die französische Schule, präzise und geduldig.", "Baguette with poolish, laminated croissants, butter brioche: the French school, precise and patient.") },
  { k: "austria", flag: "🇦🇹", name: D("Austria", "Österreich", "Austria"), kw: ["plunder", "danese", "danish", "austriac"],
    story: D("Il Plunder viennese: la sfoglia lievitata che poi i danesi hanno reso famosa in tutto il mondo.", "Der Wiener Plunder: der Hefeblätterteig, den die Dänen dann weltberühmt gemacht haben.", "Viennese Plunder: the laminated yeast dough the Danes later made famous worldwide.") },
];

export function matchRegion(recipe, region) {
  const n = String(recipe.name || "").toLowerCase();
  return region.kw.some((k) => n.includes(k));
}

export default function PaneDelPaese({ onBack, onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => o[lang] || o.it;
  const [sel, setSel] = useState(() => { try { return localStorage.getItem(KEY) || ""; } catch { return ""; } });
  const [recipes, setRecipes] = useState([]);
  useEffect(() => { let stop = false; recipesApi.list("mikilab").then((r) => { if (!stop && Array.isArray(r)) setRecipes(r.filter((x) => !x.hidden)); }).catch(() => { /* */ }); return () => { stop = true; }; }, []);
  const pick = (k) => { setSel(k); try { localStorage.setItem(KEY, k); } catch { /* */ } };
  const region = REGIONS.find((r) => r.k === sel);
  const list = region ? recipes.filter((r) => matchRegion(r, region)) : [];

  return (
    <div data-testid="paese-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="paese-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2"><MapPin className="w-6 h-6 text-primary" /><h1 className="font-display text-2xl font-black text-foreground">{tri("Il pane del mio paese", "Das Brot meiner Heimat", "The bread of my homeland")}</h1></div>
      <p className="text-sm text-muted-foreground">{tri("Dimmi da dove vieni e ti mostro prima i pani di casa tua. La scelta resta nel tuo telefono.", "Sag mir, woher du kommst, und ich zeige dir zuerst die Brote deiner Heimat. Die Wahl bleibt auf deinem Handy.", "Tell me where you're from and I'll show you the breads of your home first. The choice stays on your phone.")}</p>
      <div className="flex gap-2 flex-wrap" data-testid="paese-chips">
        {REGIONS.map((r) => <button key={r.k} data-testid={`paese-${r.k}`} onClick={() => pick(r.k)} className={`px-3 py-1.5 rounded-full text-sm font-bold border active:scale-95 ${sel === r.k ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:border-primary/60"}`}>{r.flag} {L(r.name)}</button>)}
      </div>
      {region && (
        <section data-testid="paese-region" className="space-y-3">
          <div className="rounded-2xl border border-primary/40 bg-primary/8 p-4">
            <p className="font-display text-xl font-black text-foreground">{region.flag} {L(region.name)}</p>
            <p className="text-[13px] text-foreground/90 mt-1">{L(region.story)}</p>
            <p className="text-[10px] text-muted-foreground mt-2">{tri("Testo: bozza di Sitor (IA), da rivedere da Michele.", "Text: Entwurf von Sitor (KI), von Michele zu prüfen.", "Text: draft by Sitor (AI), to be reviewed by Michele.")}</p>
          </div>
          {list.length === 0 && <p className="text-sm text-muted-foreground">{recipes.length ? tri("Per questa zona non c'è ancora una ricetta con il suo nome: chiedi a Sitor cosa si fa da voi.", "Für diese Gegend gibt es noch kein Rezept mit ihrem Namen: frag Sitor, was man bei euch backt.", "No recipe carries this area's name yet: ask Sitor what's baked where you're from.") : tri("Caricamento…", "Wird geladen…", "Loading…")}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {list.map((r) => (
              <button key={r.id} onClick={() => onOpenRecipe && onOpenRecipe(r.id)} className="group rounded-2xl overflow-hidden border border-border bg-background text-left hover:border-primary active:scale-[0.98] transition-all">
                <div className="h-24 bg-muted">{r.image_url && <img src={r.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />}</div>
                <p className="px-2.5 py-2 text-[12px] font-bold text-foreground leading-tight line-clamp-2">{rLoc(r, "name", lang)}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
