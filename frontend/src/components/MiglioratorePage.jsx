import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { recipesApi } from "@/lib/api";
import { ChevronLeft, FlaskConical, Leaf, Scale, Sparkles } from "lucide-react";

const PUB = process.env.PUBLIC_URL || "";

// Pagina guida dedicata "Il mio miglioratore" (STADIO 5.1).
export default function MiglioratorePage({ onBack, onOpenRecipe }) {
  const { lang } = useLang();
  const L = (o) => o[lang] || o.it;
  const [recipe, setRecipe] = useState(null);

  useEffect(() => {
    recipesApi.list("mikilab").then((rows) => {
      const r = (rows || []).find((x) => /miglioratore/i.test(x.name || ""));
      if (r) setRecipe(r);
    }).catch(() => {});
  }, []);

  const ING = [
    { pct: "3%", name: L({ it: "Malto diastasico puro", de: "Reines diastatisches Malz", en: "Pure diastatic malt" }),
      fn: L({ it: "nutre i lieviti, dona colore alla crosta e croccantezza", de: "nährt die Hefen, gibt Kruste Farbe und Knusprigkeit", en: "feeds the yeasts, adds crust colour and crispness" }) },
    { pct: "2%", name: L({ it: "Lino dorato", de: "Goldleinsamen", en: "Golden flax" }),
      fn: L({ it: "aggiunge struttura, fibre e grassi buoni (omega)", de: "gibt Struktur, Ballaststoffe und gute Fette (Omega)", en: "adds structure, fibre and good fats (omega)" }) },
    { pct: "1%", name: L({ it: "Lupino dolce", de: "Süße Lupine", en: "Sweet lupin" }),
      fn: L({ it: "rinforza la maglia glutinica e la tenuta dell'impasto", de: "stärkt das Glutennetz und die Teigstabilität", en: "strengthens the gluten network and dough hold" }) },
    { pct: "0,5%", name: L({ it: "Buccia di psillio", de: "Flohsamenschalen", en: "Psyllium husk" }),
      fn: L({ it: "trattiene l'idratazione: il pane resta morbido più a lungo", de: "hält die Feuchtigkeit: Brot bleibt länger weich", en: "retains hydration: bread stays soft longer" }) },
    { pct: "0,3%", name: L({ it: "Acerola (vitamina C naturale)", de: "Acerola (natürliches Vitamin C)", en: "Acerola (natural vitamin C)" }),
      fn: L({ it: "rinforza la maglia glutinica e migliora la spinta in forno", de: "stärkt das Glutennetz und den Ofentrieb", en: "strengthens gluten and improves oven spring" }) },
  ];

  return (
    <div data-testid="miglioratore-page" className="space-y-6 max-w-3xl">
      {onBack && (
        <button data-testid="miglioratore-back" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" />{L({ it: "Home", de: "Start", en: "Home" })}
        </button>
      )}

      {/* Hero */}
      <div className="rounded-3xl overflow-hidden border border-border bg-card">
        <div className="relative h-44 sm:h-56">
          <img src={`${PUB}/recipes/base_miglioratore.webp`} alt="" className="w-full h-full object-cover" style={{ objectPosition: "50% 45%" }}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary">
              <FlaskConical className="w-3.5 h-3.5" />{L({ it: "La mia ricetta segreta", de: "Mein geheimes Rezept", en: "My secret recipe" })}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground leading-tight">
              {L({ it: "Il mio Miglioratore", de: "Mein Verbesserer", en: "My Improver" })}
            </h1>
          </div>
        </div>
      </div>

      {/* Perché */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[17px] text-foreground leading-relaxed">
          {L({
            it: "L'ho creato perché non volevo usare i miglioratori chimici del commercio. Il mio è fatto di 5 ingredienti 100% naturali che danno al pane forza, profumo e una morbidezza che dura giorni — senza additivi, senza sigle. Lo trovi già dosato nelle basi delle mie ricette: è pronto all'uso.",
            de: "Ich habe ihn entwickelt, weil ich keine chemischen Backmittel aus dem Handel verwenden wollte. Meiner besteht aus 5 zu 100% natürlichen Zutaten, die dem Brot Kraft, Aroma und tagelange Weichheit geben — ohne Zusatzstoffe, ohne Kürzel. Er ist in den Basen meiner Rezepte bereits dosiert und einsatzbereit.",
            en: "I created it because I didn't want to use commercial chemical improvers. Mine is made of 5 fully natural ingredients that give bread strength, aroma and a softness that lasts for days — no additives, no codes. You'll find it already dosed in the bases of my recipes: ready to use.",
          })}
        </p>
      </div>

      {/* Ingredienti */}
      <div>
        <h2 className="font-display text-lg font-black text-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
          <Leaf className="w-5 h-5 text-accent" />{L({ it: "Cosa c'è dentro", de: "Was drin ist", en: "What's inside" })}
        </h2>
        <div className="space-y-2">
          {ING.map((x, i) => (
            <div key={i} data-testid={`miglioratore-page-ing-${i}`} className="flex items-baseline gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <span className="font-mono-data font-bold text-primary w-12 shrink-0">{x.pct}</span>
              <div>
                <span className="text-foreground font-bold">{x.name}</span>
                <span className="text-muted-foreground"> — {x.fn}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dosaggio */}
      <div className="rounded-2xl border border-primary/40 bg-primary/10 p-5">
        <h2 className="font-display text-base font-black text-foreground flex items-center gap-2 mb-2">
          <Scale className="w-5 h-5 text-primary" />{L({ it: "Come si dosa", de: "Dosierung", en: "How to dose it" })}
        </h2>
        <p className="text-[15px] text-foreground leading-relaxed">
          {L({
            it: "2–4% sul peso della farina. Con metodo indiretto (lievito madre, poolish, biga) bastano 2–3%; con impasto diretto sali a 3–4%. Si aggiunge insieme alla farina, all'inizio dell'impasto.",
            de: "2–4% des Mehlgewichts. Bei indirekter Führung (Sauerteig, Poolish, Biga) genügen 2–3%; bei direkter Führung 3–4%. Wird zu Beginn des Knetens zusammen mit dem Mehl zugegeben.",
            en: "2–4% of flour weight. With an indirect method (sourdough, poolish, biga) 2–3% is enough; with a direct dough go up to 3–4%. Add it together with the flour at the start of mixing.",
          })}
        </p>
      </div>

      <div data-testid="miglioratore-extra-soft" className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">{L({ it: "Extra morbidezza (da provare)", de: "Extra Weichheit (zum Ausprobieren)", en: "Extra softness (to try)" })}</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-foreground/10 text-muted-foreground">{L({ it: "Bozza di Sitor", de: "Sitor-Entwurf", en: "Sitor draft" })}</span>
        </div>
        <p className="text-sm text-foreground/80">{L({
          it: "Fiocchi di patate (o farina di patate), da aggiungere A PARTE alla farina, indicativamente dal 3 al 5% del suo peso: possono aiutare a mantenere morbida la mollica più a lungo, come la patata lessa nella focaccia. NON vanno dentro la miscela. Prova con una dose bassa. Controlla le etichette.",
          de: "Kartoffelflocken (oder Kartoffelmehl), SEPARAT zum Mehl zugeben, etwa 3–5% seines Gewichts: können die Krume länger weich halten, wie gekochte Kartoffel in der Focaccia. NICHT in die Mischung. Beginne mit wenig. Etiketten prüfen.",
          en: "Potato flakes (or potato flour), added SEPARATELY to the flour, roughly 3–5% of its weight: may help keep the crumb soft longer, like boiled potato in focaccia. NOT inside the mix. Start with a small dose. Check labels." })}</p>
      </div>

      {recipe && (
        <button data-testid="miglioratore-open-recipe" onClick={() => onOpenRecipe && onOpenRecipe(recipe.id)}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold active:scale-[0.98] transition-all">
          <Sparkles className="w-4 h-4" />{L({ it: "Apri la ricetta completa", de: "Vollständiges Rezept öffnen", en: "Open the full recipe" })}
        </button>
      )}
    </div>
  );
}
