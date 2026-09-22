import { useState } from "react";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { GLOSSARIO, termsIn, glossEntry } from "@/lib/glossario";

// V93 — LE PAROLE DELLA RICETTA. Cerca nel procedimento i termini del mestiere e li spiega in una riga.
// Se il procedimento non ne usa, mostra le parole che servono più spesso.

export default function ParoleRicetta({ r, lang }) {
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const text = `${rLoc(r, "procedure", lang) || r.procedure || ""} ${rLoc(r, "notes", lang) || r.notes || ""} ${r.preferment_type || ""}`;
  const found = termsIn(text);
  const list = found.length ? found : GLOSSARIO.slice(0, 8);
  const [sel, setSel] = useState(null);
  const cur = list.find((g) => g.k === sel);
  return (
    <div data-testid="parole-ricetta" className="space-y-2.5">
      <p className="text-[12.5px] text-foreground/85 leading-snug">{found.length ? tri("Le parole del mestiere che trovi in questa ricetta. Tocca quella che non conosci.", "Die Fachwörter aus diesem Rezept. Tipp auf das, das du nicht kennst.", "The trade words in this recipe. Tap the one you don't know.") : tri("Questa ricetta parla semplice. Ecco comunque le parole che incontrerai più spesso.", "Dieses Rezept spricht einfach. Hier trotzdem die Wörter, die dir am häufigsten begegnen.", "This recipe speaks plainly. Here anyway are the words you'll meet most often.")}</p>
      <div className="flex flex-wrap gap-1.5">
        {list.map((g) => <button key={g.k} data-testid={`pr-${g.k}`} onClick={() => setSel(sel === g.k ? null : g.k)} className={`text-[11.5px] font-semibold px-2.5 py-1.5 rounded-full border active:scale-95 ${sel === g.k ? "bg-salvia text-white border-salvia" : "bg-card text-foreground border-border"}`}>{glossEntry(g, lang).title}</button>)}
      </div>
      {cur && <div data-testid="pr-panel" className="rounded-xl border border-salvia/40 bg-salvia/8 p-3"><p className="text-[13px] font-bold text-foreground">{glossEntry(cur, lang).title}</p><p className="text-[12px] text-foreground/90 leading-snug mt-1">{glossEntry(cur, lang).body}</p></div>}
      <p className="text-[12px] text-salvia leading-snug">{tri("Sitor: le parole difficili sono solo gesti che non hai ancora fatto.", "Sitor: schwierige Wörter sind nur Handgriffe, die du noch nicht gemacht hast.", "Sitor: difficult words are just movements you haven't made yet.")}</p>
    </div>
  );
}
