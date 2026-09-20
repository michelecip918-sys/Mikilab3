import { useEffect, useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { recipesApi } from "@/lib/api";
import { ChevronLeft, FlaskConical, Leaf, Scale, Sparkles, AlertTriangle, Replace } from "lucide-react";
import { MIX, DOSE, fmtL, substitutes } from "@/lib/improver";

const PUB = process.env.PUBLIC_URL || "";

// Pagina guida "Il mio miglioratore": cos'è, come si dosa (calcolatore), come farlo in casa e cosa usare se non puoi farlo.
export default function MiglioratorePage({ onBack, onOpenRecipe }) {
  const { lang } = useLang();
  const L = (o) => (o && (o[lang] || o.it)) || "";
  const [recipe, setRecipe] = useState(null);
  const [flour, setFlour] = useState(500);
  const [method, setMethod] = useState("indirect");
  const [batch, setBatch] = useState(100);

  useEffect(() => {
    recipesApi.list("mikilab").then((rows) => {
      const r = (rows || []).find((x) => /miglioratore/i.test(x.name || ""));
      if (r) setRecipe(r);
    }).catch(() => {});
  }, []);

  const F = Math.max(0, Number(flour) || 0);
  const pct = DOSE[method];
  const total = (F * pct) / 100;
  const B = Math.max(0, Number(batch) || 0);
  const subs = substitutes(F || 500);

  return (
    <div data-testid="miglioratore-page" className="space-y-6 max-w-3xl">
      {onBack && (
        <button data-testid="miglioratore-back" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" />{L({ it: "Home", de: "Start", en: "Home" })}
        </button>
      )}

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

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[17px] text-foreground leading-relaxed">
          {L({
            it: "L'ho creato perché non volevo usare i miglioratori chimici del commercio. Il mio è una miscela a secco di 5 ingredienti naturali che dà al pane forza, profumo e una morbidezza che dura giorni: senza additivi, senza sigle. Nelle ricette lo trovo come ingrediente facoltativo: se non lo vuoi o non lo trovi, qui sotto vedi come sostituirlo.",
            de: "Ich habe ihn entwickelt, weil ich keine chemischen Backmittel aus dem Handel verwenden wollte. Meiner ist eine Trockenmischung aus 5 natürlichen Zutaten, die dem Brot Kraft, Aroma und tagelange Weichheit gibt: ohne Zusatzstoffe, ohne Kürzel. In den Rezepten steht er als optionale Zutat: Wenn du ihn nicht willst oder findest, siehst du unten, wie du ihn ersetzt.",
            en: "I created it because I didn't want to use commercial chemical improvers. Mine is a dry mix of 5 natural ingredients that gives bread strength, aroma and a softness that lasts for days: no additives, no codes. In the recipes it appears as an optional ingredient: if you don't want it or can't find it, see below how to replace it.",
          })}
        </p>
      </div>

      {/* Calcolatore dose */}
      <div data-testid="miglioratore-calc" className="rounded-2xl border border-primary/40 bg-primary/10 p-5 space-y-3">
        <h2 className="font-display text-base font-black text-foreground flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />{L({ it: "Quanto ne metto? (calcolatore)", de: "Wie viel nehme ich? (Rechner)", en: "How much do I use? (calculator)" })}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-foreground">{L({ it: "Farina della ricetta", de: "Mehl im Rezept", en: "Recipe flour" })}</label>
          <input data-testid="miglioratore-flour" type="number" min="0" step="50" value={flour} onChange={(e) => setFlour(e.target.value)}
            className="w-24 px-2.5 py-1.5 rounded-lg text-sm font-bold bg-background border border-border text-foreground outline-none focus:border-primary" />
          <span className="text-sm text-muted-foreground font-bold">g</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[["indirect", { it: "Impasto indiretto (lievito madre, poolish, biga): 2%", de: "Indirekte Führung (Sauerteig, Poolish, Biga): 2 %", en: "Indirect method (sourdough, poolish, biga): 2%" }],
            ["direct", { it: "Impasto diretto: 3%", de: "Direkte Führung: 3 %", en: "Direct dough: 3%" }]].map(([k, lbl]) => (
            <button key={k} data-testid={`miglioratore-method-${k}`} onClick={() => setMethod(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${method === k ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground border-border hover:text-foreground"}`}>{L(lbl)}</button>
          ))}
        </div>
        <p className="text-[15px] text-foreground" data-testid="miglioratore-result">
          {L({ it: "Miglioratore da usare:", de: "Zu verwendender Verbesserer:", en: "Improver to use:" })}{" "}
          <strong className="font-mono-data text-primary text-lg">{fmtL(total, lang)} g</strong>
          <span className="text-muted-foreground"> ({pct}% {L({ it: "sulla farina", de: "auf das Mehl", en: "of the flour" })})</span>
        </p>
        <p className="text-[13px] text-foreground/80">
          {L({ it: "Si aggiunge insieme alla farina, all'inizio dell'impasto. Parti sempre dalla dose bassa e regola in base al risultato.",
               de: "Wird am Anfang des Knetens zusammen mit dem Mehl zugegeben. Beginne immer mit der niedrigen Menge und passe nach dem Ergebnis an.",
               en: "Add it together with the flour at the start of mixing. Always start with the low dose and adjust to the result." })}
        </p>
      </div>

      {/* Miscela */}
      <div>
        <h2 className="font-display text-lg font-black text-foreground uppercase tracking-wide flex items-center gap-2 mb-1">
          <Leaf className="w-5 h-5 text-accent" />{L({ it: "Come si prepara la miscela", de: "So wird die Mischung gemacht", en: "How to make the mix" })}
        </h2>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-sm text-muted-foreground">{L({ it: "Quantità di miscela da preparare", de: "Menge der Mischung", en: "Amount of mix to make" })}</span>
          <input data-testid="miglioratore-batch" type="number" min="0" step="50" value={batch} onChange={(e) => setBatch(e.target.value)}
            className="w-20 px-2.5 py-1.5 rounded-lg text-sm font-bold bg-background border border-border text-foreground outline-none focus:border-primary" />
          <span className="text-sm text-muted-foreground font-bold">g</span>
        </div>
        <div className="space-y-2">
          {MIX.map((x, i) => (
            <div key={x.key} data-testid={`miglioratore-page-ing-${i}`} className="flex items-baseline gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <span className="font-mono-data font-bold text-primary w-16 shrink-0">{fmtL((x.g * B) / 100, lang)} g</span>
              <div>
                <span className="text-foreground font-bold">{L(x.name)}</span>
                <span className="text-muted-foreground"> ({x.g} {L({ it: "parti su 100", de: "Teile auf 100", en: "parts per 100" })}): {L(x.fn)}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[13px] text-muted-foreground mt-2">
          {L({ it: "Mescola bene e conserva in un barattolo chiuso, al fresco e all'asciutto, per pochi mesi.",
               de: "Gut mischen und in einem verschlossenen Glas kühl und trocken für wenige Monate aufbewahren.",
               en: "Mix well and keep in a closed jar, cool and dry, for a few months." })}
        </p>
      </div>

      {/* Sostituzioni */}
      <div data-testid="miglioratore-subs">
        <h2 className="font-display text-lg font-black text-foreground uppercase tracking-wide flex items-center gap-2 mb-1">
          <Replace className="w-5 h-5 text-primary" />{L({ it: "Non riesci a farlo? Ecco cosa usare", de: "Kannst du ihn nicht machen? Das nimmst du stattdessen", en: "Can't make it? Use this instead" })}
        </h2>
        <p className="text-[13px] text-muted-foreground mb-3">{L({ it: `Le quantità sono calcolate per ${F || 500} g di farina (cambia il valore nel calcolatore qui sopra).`, de: `Die Mengen gelten für ${F || 500} g Mehl (Wert im Rechner oben ändern).`, en: `Amounts are for ${F || 500} g of flour (change the value in the calculator above).` })}</p>
        <div className="space-y-2">
          {subs.map((s) => (
            <div key={s.id} data-testid={`miglioratore-sub-${s.id}`} className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-foreground font-bold">{L(s.title)}</span>
                <span className="font-mono-data font-bold text-primary shrink-0">{typeof s.amount === "string" ? s.amount : L(s.amount)}</span>
              </div>
              <p className="text-[13.5px] text-foreground/80 mt-1 leading-relaxed">{L(s.how)}</p>
            </div>
          ))}
        </div>
      </div>

      <div data-testid="miglioratore-allergens" className="rounded-2xl border border-mattone/40 bg-mattone/10 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-mattone shrink-0 mt-0.5" />
        <p className="text-[13.5px] text-foreground leading-relaxed">
          {L({ it: "Allergeni: la miscela contiene LUPINO (può dare reazioni a chi è allergico alle arachidi) e malto d'orzo (glutine). Controlla sempre le etichette.",
               de: "Allergene: Die Mischung enthält LUPINE (kann bei Erdnussallergie Reaktionen auslösen) und Gerstenmalz (Gluten). Immer die Etiketten prüfen.",
               en: "Allergens: the mix contains LUPIN (may cause reactions in people allergic to peanuts) and barley malt (gluten). Always check labels." })}
        </p>
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
