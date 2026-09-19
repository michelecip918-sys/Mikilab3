import { useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Z2/Z3/Z4: pannello per le ricette "miscela" (kind=mix). NON è pane: proporzioni su 100 g di miscela.
export default function MixPanel({ ex, mode }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const li = (o) => (o && (o[lang] || o.it)) || "";
  const [scorta, setScorta] = useState(100);
  const [flourOfRecipe, setFlourOfRecipe] = useState(500);
  const comp = ex.mix_composition || [];
  const unit = ex.mix_unit_g || 100;
  const round = (n) => Math.round(n * 10) / 10;

  return (
    <div data-testid="mix-panel" className="space-y-4">
      <div className="rounded-2xl border border-border bg-background p-3.5">
        <p className="text-[11px] font-black uppercase tracking-wide text-primary mb-2">{tri("La tua scorta", "Dein Vorrat", "Your stock")}</p>
        {mode === "casa" && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[50, 100, 200, 500].map((g) => (
              <button key={g} data-testid={`mix-scorta-${g}`} onClick={() => setScorta(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${scorta === g ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground border-border hover:text-foreground"}`}>{g} g</button>
            ))}
            <div className="inline-flex items-center gap-1">
              <input data-testid="mix-scorta-free" type="number" min="10" step="10" value={scorta}
                onChange={(e) => setScorta(Math.max(1, Number(e.target.value) || 0))}
                className="w-20 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-background border border-border text-foreground outline-none focus:border-primary" />
              <span className="text-xs text-muted-foreground font-bold">g</span>
            </div>
          </div>
        )}
        <table className="w-full text-sm">
          <tbody>
            {comp.map((c, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-1.5 text-foreground">{li(c)}</td>
                {mode === "esperto"
                  ? <td data-testid={`mix-pct-${i}`} className="py-1.5 text-right font-bold text-foreground">{c.pct}%</td>
                  : <td data-testid={`mix-g-${i}`} className="py-1.5 text-right font-bold text-foreground">{round((c.pct * scorta) / 100)} g</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {mode === "esperto" && <p className="text-[11px] text-muted-foreground mt-2">{tri("Composizione della miscela (somma 100%). Non è pane: nessuna farina, nessuna idratazione.", "Zusammensetzung der Mischung (Summe 100%). Kein Brot: kein Mehl, keine Hydration.", "Mix composition (sums to 100%). Not bread: no flour, no hydration.")}</p>}
      </div>

      {/* Come si usa: 2% indiretti / 3% diretti del peso della farina */}
      <div data-testid="mix-usage" className="rounded-2xl border border-accent/40 bg-accent/10 p-3.5">
        <p className="text-[11px] font-black uppercase tracking-wide text-accent-foreground mb-1">{tri("Come si usa", "Anwendung", "How to use")}</p>
        <p className="text-sm text-foreground/85 mb-2">{tri("Aggiungi il 2% (impasti indiretti) o il 3% (diretti) del PESO DELLA FARINA della tua ricetta.", "Gib 2% (indirekte Teige) oder 3% (direkte) des MEHLGEWICHTS deines Rezepts dazu.", "Add 2% (indirect doughs) or 3% (direct) of your recipe's FLOUR WEIGHT.")}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{tri("Farina della tua ricetta", "Mehl deines Rezepts", "Your recipe's flour")}:</span>
          <input data-testid="mix-flour-input" type="number" min="1" step="50" value={flourOfRecipe}
            onChange={(e) => setFlourOfRecipe(Math.max(0, Number(e.target.value) || 0))}
            className="w-24 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-background border border-border text-foreground outline-none focus:border-accent" />
          <span className="text-xs text-muted-foreground font-bold">g</span>
        </div>
        <p data-testid="mix-usage-result" className="text-sm font-bold text-foreground mt-2">
          {tri("Miscela", "Mischung", "Mix")}: {round(flourOfRecipe * 0.02)} g (2%) {tri("oppure", "oder", "or")} {round(flourOfRecipe * 0.03)} g (3%)
        </p>
      </div>

      {/* Z4: EXTRA MORBIDEZZA (bozza) */}
      <div data-testid="mix-extra-soft" className="rounded-2xl border border-border bg-background p-3.5">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">{tri("Extra morbidezza (da provare)", "Extra Weichheit (zum Ausprobieren)", "Extra softness (to try)")}</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-foreground/10 text-muted-foreground">{tri("Bozza di Sitor", "Sitor-Entwurf", "Sitor draft")}</span>
        </div>
        <p className="text-sm text-foreground/80">{tri(
          "Fiocchi di patate (o farina di patate), da aggiungere A PARTE alla farina, indicativamente dal 3 al 5% del suo peso: possono aiutare a mantenere morbida la mollica più a lungo, come la patata lessa nella focaccia. NON vanno dentro la miscela. Prova con una dose bassa. Controlla le etichette.",
          "Kartoffelflocken (oder Kartoffelmehl), SEPARAT zum Mehl zugeben, etwa 3–5% seines Gewichts: können die Krume länger weich halten, wie gekochte Kartoffel in der Focaccia. NICHT in die Mischung. Beginne mit wenig. Etiketten prüfen.",
          "Potato flakes (or potato flour), added SEPARATELY to the flour, roughly 3–5% of its weight: may help keep the crumb soft longer, like boiled potato in focaccia. NOT inside the mix. Start with a small dose. Check labels.")}</p>
      </div>
    </div>
  );
}
