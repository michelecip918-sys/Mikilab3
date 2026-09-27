import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi, api } from "@/lib/api";
import { ChevronLeft, Leaf } from "lucide-react";
import { rLoc } from "@/lib/loc";
import FotoBadge, { useFotoVere } from "@/components/FotoBadge"; // V129
import { codiceDi } from "@/lib/codici"; // V132

// V132 — prima le ricette con la canapa (le undici nuove sono scritte da Sitor e restano bozze finché Michele non le prova),
// poi gli altri pani colorati dagli ingredienti. Una ricetta nuova «alla canapa» entra qui da sola.
const ORDINE_CANAPA = ["Verde Canapa", "Pagnotta alla Canapa", "Pane in Cassetta alla Canapa", "Panini alla Canapa", "Focaccia Verde alla Canapa", "Pizza in Teglia alla Canapa", "Grissini alla Canapa", "Crackers alla Canapa", "Taralli alla Canapa", "Friselle alla Canapa", "Biscotti alla Canapa", "Cantucci alla Canapa", "Panettone Artigianale MikiLab — Verde Canapa"];
const ALTRE_VERDI = ["Pane agli Spinaci", "Pane alla Spirulina", "Panini Basilico e Pomodoro", "Cornetto Doppio Gusto Pistacchio e Cioccolato"];
const posto = (r) => { const i = ORDINE_CANAPA.indexOf(r.name); return i === -1 ? ORDINE_CANAPA.length : i; };

export default function VerdeMikiLab({ onBack, onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [items, setItems] = useState(null);
  const [stati, setStati] = useState({});
  const fotoVere = useFotoVere(); // V129

  useEffect(() => {
    let ok = true;
    recipesApi.list("mikilab").then((rows) => {
      const all = rows || [];
      const canapa = all.filter((r) => /canapa/i.test(r.name || "")).sort((a, b) => posto(a) - posto(b));
      const altre = ALTRE_VERDI.map((n) => all.find((r) => r.name === n)).filter(Boolean);
      if (ok) setItems([...canapa, ...altre]);
    }).catch(() => { if (ok) setItems([]); });
    api.get("/recipe-extras").then((r) => { if (ok) setStati(r.data || {}); }).catch(() => { /* */ });
    return () => { ok = false; };
  }, []);

  const regole = [
    [tri("Farina di canapa", "Hanfmehl", "Hemp flour"), tri("al massimo il 15-20% della farina: non ha glutine e beve più acqua. Nelle ricette l'acqua è già aumentata.", "höchstens 15-20 % des Mehls: es hat kein Gluten und nimmt mehr Wasser auf. In den Rezepten ist das Wasser schon erhöht.", "at most 15-20% of the flour: it has no gluten and drinks more water. The recipes already add the extra water.")],
    [tri("Semi decorticati", "Geschälte Hanfsamen", "Hulled hemp seeds"), tri("tostali 2-3 minuti in padella per il profumo; nell'impasto vanno alla fine, sopra vanno crudi.", "2-3 Minuten in der Pfanne rösten für den Duft; in den Teig kommen sie zum Schluss, obendrauf roh.", "toast them 2-3 minutes in a pan for aroma; they go into the dough at the end, raw on top.")],
    [tri("Olio di canapa", "Hanföl", "Hemp seed oil"), tri("solo a crudo, dopo la cottura: col calore perde il profumo.", "nur roh, nach dem Backen: mit Hitze verliert es sein Aroma.", "only raw, after baking: heat takes its aroma away.")],
    [tri("Dove si compra", "Wo man es kauft", "Where to buy"), tri("nei negozi bio, nei Reformhaus e nelle drogherie tedesche (Hanfmehl, Hanfsamen geschält, Hanföl).", "im Bioladen, im Reformhaus und in der Drogerie (Hanfmehl, Hanfsamen geschält, Hanföl).", "in organic shops, health-food stores and drugstores (in Germany: Hanfmehl, Hanfsamen geschält, Hanföl).")],
  ];

  return (
    <div data-testid="verde-mikilab" className="space-y-5">
      {onBack && <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" />{tri("Home", "Start", "Home")}</button>}
      <div>
        <h1 className="font-display text-3xl font-black text-foreground flex items-center gap-2"><Leaf className="w-6 h-6 text-accent" />{tri("Il verde di MikiLab", "Das Grüne von MikiLab", "MikiLab's green")}</h1>
        <p className="text-foreground mt-2 leading-relaxed max-w-2xl">{tri(
          "Pani e dolci colorati dagli ingredienti, non da coloranti. Le ricette con canapa usano solo semi e farina di canapa alimentare, senza effetto psicoattivo e nei limiti di legge. Compra solo prodotti venduti come alimenti, con etichetta alimentare (meglio se con il limite di THC dichiarato). Mai fiori, foglie, tisane o prodotti al CBD.",
          "Brote und Süßes, gefärbt durch Zutaten, nicht durch Farbstoffe. Die Hanf-Rezepte nutzen nur Speisehanf-Samen und -Mehl, ohne psychoaktive Wirkung und im gesetzlichen Rahmen. Kaufe nur als Lebensmittel verkaufte Produkte mit Lebensmittel-Etikett (am besten mit angegebener THC-Grenze). Nie Blüten, Blätter, Tees oder CBD-Produkte.",
          "Breads and sweets coloured by ingredients, not by dyes. Hemp recipes use only food hemp seeds and flour, with no psychoactive effect and within legal limits. Buy only products sold as food, with a food label (better if the THC limit is stated). Never flowers, leaves, teas or CBD products.")}</p>
      </div>

      <section data-testid="verde-regole" className="rounded-2xl border border-accent/40 bg-accent/5 p-4 max-w-2xl">
        <p className="font-bold text-foreground">{tri("La canapa in cucina: quattro regole", "Hanf in der Küche: vier Regeln", "Hemp in the kitchen: four rules")}</p>
        <div className="mt-2 space-y-1.5">
          {regole.map(([t, d]) => <p key={t} className="text-[13.5px] text-foreground/90 leading-relaxed"><b>{t}:</b> {d}</p>)}
        </div>
        <p className="text-[12px] text-muted-foreground mt-2">{tri("Le ricette nuove alla canapa sono scritte da Sitor (IA) col metodo di Michele: restano «bozza» finché Michele non le prova.", "Die neuen Hanf-Rezepte hat Sitor (KI) nach Micheles Methode geschrieben: sie bleiben «Entwurf», bis Michele sie ausprobiert hat.", "The new hemp recipes are written by Sitor (AI) with Michele's method: they stay «draft» until Michele has tried them.")}</p>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(items || []).map((r) => (
          <button key={r.id} data-testid={`verde-card-${r.id}`} onClick={() => onOpenRecipe(r.id)}
            className="text-left rounded-2xl border border-border bg-background overflow-hidden hover:border-accent active:scale-[0.98] transition-all">
            <div className="aspect-[4/3] bg-background relative">
              {r.image_url && <img src={r.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />}
              <FotoBadge vera={!!fotoVere[r.id]} /> {/* V129 */}
              {stati[r.id] && stati[r.id].status === "sitor_draft" && <span className="absolute top-1.5 left-1.5 z-[3] text-[9.5px] font-bold rounded-full bg-background/85 text-foreground px-2 py-0.5">{tri("Bozza di Sitor", "Entwurf von Sitor", "Sitor's draft")}</span>}
            </div>
            {codiceDi(r.id) ? <p className="px-2.5 pt-2 text-[11px] font-bold text-muted-foreground">{tri("N.", "Nr.", "No.")} {codiceDi(r.id)}</p> : null}
            <p className="px-2.5 pb-2.5 pt-0.5 font-bold text-foreground text-sm">{rLoc(r, "name", lang)}</p>
          </button>
        ))}
        {items === null && <p className="text-muted-foreground col-span-full">{tri("Caricamento…", "Wird geladen…", "Loading…")}</p>}
        {items && items.length === 0 && <p className="text-muted-foreground col-span-full">{tri("Nessuna ricetta da mostrare adesso. Riprova tra poco.", "Gerade keine Rezepte. Versuch es gleich noch einmal.", "No recipes to show right now. Try again shortly.")}</p>}
      </div>
    </div>
  );
}
