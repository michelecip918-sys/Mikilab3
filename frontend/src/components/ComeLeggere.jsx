import { useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

// Piccola guida per chi cucina a casa: come leggere dosi, percentuali, prefermenti e tempi.
export default function ComeLeggere({ hasPre }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const T = {
    it: { t: "Come leggere questa ricetta", p: [
      "Scegli quanta farina vuoi usare (250, 500, 750 o 1000 g): tutti i grammi si ricalcolano da soli.",
      "La percentuale accanto a ogni ingrediente è rispetto alla farina (farina = 100%). Serve per rifare la ricetta in qualsiasi quantità.",
      "Idratazione = quanta acqua c'è rispetto alla farina. Più è alta, più l'impasto è morbido e appiccicoso.",
      ...(hasPre ? ["Il prefermento (biga o poolish) si prepara la sera prima: farina, acqua e pochissimo lievito lasciati a riposo. Poi entra nell'impasto principale e i suoi grammi sono già tolti dalle dosi della Fase 2."] : []),
      "I tempi sono indicativi: dipendono dalla temperatura della cucina. Fidati dei segnali (raddoppia, bolle, profumo) più che dell'orologio.",
      "Il pulsante «Cucina con Sitor» ti guida passo passo con i timer."] },
    de: { t: "So liest du dieses Rezept", p: [
      "Wähle, wie viel Mehl du nehmen willst (250, 500, 750 oder 1000 g): alle Gramm rechnen sich von selbst um.",
      "Die Prozentzahl neben jeder Zutat bezieht sich auf das Mehl (Mehl = 100 %). So kannst du das Rezept in jeder Menge nachbacken.",
      "Hydration = wie viel Wasser im Verhältnis zum Mehl. Je höher, desto weicher und klebriger der Teig.",
      ...(hasPre ? ["Der Vorteig (Biga oder Poolish) wird am Vorabend angesetzt: Mehl, Wasser und ganz wenig Hefe ruhen lassen. Dann kommt er in den Hauptteig, seine Gramm sind in Phase 2 schon abgezogen."] : []),
      "Die Zeiten sind Richtwerte: Sie hängen von der Küchentemperatur ab. Vertraue den Zeichen (verdoppelt, Blasen, Duft) mehr als der Uhr.",
      "Der Knopf «Koch mit Sitor» führt dich Schritt für Schritt mit Timern."] },
    en: { t: "How to read this recipe", p: [
      "Choose how much flour you want to use (250, 500, 750 or 1000 g): all the grams recalculate by themselves.",
      "The percentage next to each ingredient is relative to the flour (flour = 100%). It lets you redo the recipe in any quantity.",
      "Hydration = how much water there is compared with the flour. The higher it is, the softer and stickier the dough.",
      ...(hasPre ? ["The preferment (biga or poolish) is made the evening before: flour, water and a tiny bit of yeast left to rest. Then it goes into the main dough, and its grams are already subtracted from the Phase 2 amounts."] : []),
      "Times are approximate: they depend on your kitchen temperature. Trust the signs (doubled, bubbles, aroma) more than the clock.",
      "The «Cook with Sitor» button guides you step by step with timers."] },
  };
  const c = T[lang] || T.it;
  return (
    <div data-testid="come-leggere" className="rounded-2xl border border-border bg-background p-3.5 no-print">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 text-left">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-muted-foreground"><HelpCircle className="w-3.5 h-3.5" />{c.t}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <ul className="mt-2 space-y-1.5 list-disc pl-4">{c.p.map((x, i) => <li key={i} className="text-[13px] text-foreground/85 leading-relaxed">{x}</li>)}</ul>}
    </div>
  );
}
