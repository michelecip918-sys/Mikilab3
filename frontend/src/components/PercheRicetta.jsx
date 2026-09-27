import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { percheDellaRicetta } from "@/lib/perche";

// V130 — IL PERCHÉ, sotto il procedimento: i passaggi chiave di questa ricetta spiegati in due righe.
// Si aprono con un tocco. Scritti da Sitor (IA) e detti come tali; le dosi restano sempre quelle di Michele.
const VAI = {
  curalievito: ["Curare il lievito madre", "Den Sauerteig pflegen", "Caring for your starter"],
  miglioratore: ["Il mio miglioratore", "Mein Verbesserer", "My improver"],
  tecniche: ["Le tecniche disegnate", "Die gezeichneten Techniken", "The drawn techniques"],
  calcolatrice: ["La calcolatrice del fornaio", "Der Bäckerrechner", "The baker's calculator"],
  banco: ["Il banco delle prove", "Der Probentisch", "The test bench"],
  "officina:taglio": ["Disegna il taglio", "Zeichne den Schnitt", "Draw the score"],
};

export default function PercheRicetta({ recipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (o ? (lang === "de" ? o.de : lang === "en" ? o.en : o.it) : "");
  const [open, setOpen] = useState(null);
  const voci = percheDellaRicetta(recipe, lang);
  if (!voci.length) return null;
  const vai = (r) => window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route: r } }));
  return (
    <div data-testid={`recipe-perche-${recipe.id}`} className="no-print rounded-2xl border border-salvia/40 bg-salvia/5 p-3">
      <p className="text-[13.5px] font-bold text-foreground flex items-center gap-1.5"><Lightbulb className="w-4 h-4 text-salvia" />{tri("Il perché", "Das Warum", "The why")}</p>
      <p className="text-[11.5px] text-muted-foreground mb-1.5">{tri("I passaggi di questa ricetta spiegati da Sitor (IA). Le dosi restano quelle di Michele.", "Die Schritte dieses Rezepts, erklärt von Sitor (KI). Die Mengen bleiben die von Michele.", "This recipe's steps explained by Sitor (AI). The quantities stay Michele's.")}</p>
      <div className="divide-y divide-border">
        {voci.map((v) => (
          <div key={v.k} data-testid={`perche-${v.k}`}>
            <button onClick={() => setOpen(open === v.k ? null : v.k)} aria-expanded={open === v.k} className="w-full flex items-center justify-between gap-2 py-2 text-left">
              <span className="text-[13.5px] font-semibold text-foreground">{L(v.t)}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open === v.k ? "rotate-180" : ""}`} />
            </button>
            {open === v.k && (
              <div className="pb-2.5">
                <p className="text-[13px] text-foreground/85 leading-relaxed">{L(v.p)}</p>
                {v.vai && VAI[v.vai] && <button onClick={() => vai(v.vai)} className="mt-1 text-[12.5px] font-bold text-primary">{tri(...VAI[v.vai])}</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
