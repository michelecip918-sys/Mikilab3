import { Wheat } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// V121 — IL TOCCO DI MICHELE: IL BRÖSEL. In tutte le ricette salate Michele aggiunge pane grattugiato ammollato
// (Altbrot-Quellstück). Numeri di Michele: 5% di Brösel secco sulla farina, acqua circa il triplo (15%),
// il giorno prima in frigo; l'acqua della ricetta NON cambia. Le ricette dolci e le basi non lo mostrano.
const SWEET_CATS = ["viennoiserie", "panettoni", "pasticceria", "basi"];
const SWEET_NAMES = /frittelle|quarkb[äa]llchen|dolce all'uva|carezza dolce/i;
export function hasBrosel(recipe) {
  if (!recipe) return false;
  const cat = String(recipe.menu_category || "").toLowerCase();
  if (SWEET_CATS.includes(cat) && !/salato/i.test(recipe.name || "")) return false;
  if (SWEET_NAMES.test(recipe.name || "")) return false;
  return true;
}

export default function BroselBox({ recipe, flour }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  if (!hasBrosel(recipe)) return null;
  const F = Math.max(0, Number(flour) || Number(recipe.flour_grams) || 0);
  if (!F) return null;
  const bread = Math.round(F * 0.05);
  const water = Math.round(F * 0.15);
  return (
    <section data-testid="brosel-box" className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <p className="font-bold text-foreground flex items-center gap-2"><Wheat className="w-4 h-4 text-primary" />
        {tri("Il tocco di Michele: il Brösel", "Micheles Kniff: die Brösel", "Michele's touch: soaked breadcrumbs")}</p>
      <p className="text-[13.5px] text-foreground/90 leading-relaxed mt-1.5">
        {tri(
          "In tutte le mie ricette salate aggiungo un po' di pane grattugiato ammollato, il «Brösel». Rende la mollica più morbida, dà sapore di crosta e fa durare il pane di più. È facoltativo: la ricetta riesce anche senza, ma io lo faccio sempre.",
          "In all meinen herzhaften Rezepten gebe ich etwas eingeweichtes Paniermehl dazu, die «Brösel» (bei Bäckern: Altbrot-Quellstück). Es macht die Krume weicher, bringt Krustenaroma und hält das Brot länger frisch. Freiwillig: das Rezept gelingt auch ohne, aber ich mache es immer.",
          "In all my savoury recipes I add a little soaked breadcrumb, the «Brösel» (German bakers call it an old-bread soaker). It makes the crumb softer, brings crust flavour and keeps the bread fresh longer. Optional: the recipe works without it, but I always do it.")}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div data-testid="brosel-bread" className="rounded-xl bg-background border border-border p-2.5 text-center">
          <p className="text-[11px] text-muted-foreground">{tri("Brösel secco", "Brösel, trocken", "Dry breadcrumbs")}</p>
          <p className="text-lg font-black text-foreground">{bread} g</p>
        </div>
        <div data-testid="brosel-water" className="rounded-xl bg-background border border-border p-2.5 text-center">
          <p className="text-[11px] text-muted-foreground">{tri("Acqua", "Wasser", "Water")}</p>
          <p className="text-lg font-black text-foreground">{water} g</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1 text-center">
        {tri(`per questa ricetta, con ${F} g di farina`, `für dieses Rezept, mit ${F} g Mehl`, `for this recipe, with ${F} g of flour`)}
      </p>
      <ol className="mt-3 space-y-1.5 text-[13px] text-foreground/90 leading-snug list-decimal pl-5">
        <li>{tri(
          "Il giorno prima: mescola il Brösel con l'acqua fino a una pappina morbida. Copri e metti in frigo per la notte.",
          "Am Vortag: die Brösel mit dem Wasser zu einem weichen Brei verrühren. Abdecken und über Nacht in den Kühlschrank stellen.",
          "The day before: stir the breadcrumbs and water into a soft paste. Cover and keep it in the fridge overnight.")}</li>
        <li>{tri(
          "Il giorno dopo: aggiungi tutta la pappina all'impasto finale (non alla biga o al lievitino), insieme agli altri ingredienti. L'acqua della ricetta resta la stessa.",
          "Am nächsten Tag: den ganzen Brei in den Hauptteig geben (nicht in den Vorteig), zusammen mit den anderen Zutaten. Die Wassermenge des Rezepts bleibt gleich.",
          "The next day: add all the paste to the final dough (not to the preferment), with the other ingredients. The recipe's water stays the same.")}</li>
      </ol>
      <p className="text-[12px] text-muted-foreground mt-2">
        {tri(
          "Usa pane grattugiato semplice, senza sale né aromi. Il migliore è il tuo pane di ieri, seccato e grattugiato.",
          "Nimm einfaches Paniermehl, ohne Salz oder Gewürze. Am besten ist dein eigenes Brot von gestern, getrocknet und gerieben.",
          "Use plain breadcrumbs, with no salt or seasoning. Best of all is your own bread from yesterday, dried and grated.")}
      </p>
    </section>
  );
}
