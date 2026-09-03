import { mkTri } from "@/i18n/triMaps";
import GLOSS from "@/i18n/glossary_i18n.json";
import { useState, useMemo } from "react";
import { ChevronRight, BookOpen, Search } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const TERMS = [
  { t: "Autolisi", d: "Riposo iniziale di farina e acqua (senza sale e lievito) per idratare la farina e sviluppare il glutine con meno fatica." },
  { t: "Alveolatura", d: "La struttura dei buchi (alveoli) nella mollica: dipende da idratazione, forza della farina e lievitazione." },
  { t: "Appretto", d: "L'ultima lievitazione dopo la formatura, prima della cottura (detta anche seconda lievitazione)." },
  { t: "Bassinage", d: "Aggiunta graduale dell'ultima acqua dopo l'incordatura, per raggiungere idratazioni molto alte." },
  { t: "Biga", d: "Prefermento solido (idratazione ~45%) tipico italiano: dona forza, aroma e conservabilità." },
  { t: "Incordatura", d: "Il punto in cui l'impasto ha sviluppato il glutine ed è liscio, elastico e forma il 'velo'." },
  { t: "Idratazione", d: "Percentuale di acqua rispetto alla farina (es. 700 g acqua su 1000 g farina = 70%)." },
  { t: "Kochstück / Tangzhong", d: "Precottura di una parte di farina e acqua a gel: rende la mollica più soffice e umida a lungo." },
  { t: "Lievito Madre", d: "Impasto acido di farina e acqua con lieviti e batteri lattici, rinfrescato regolarmente." },
  { t: "Li.Co.Li.", d: "Lievito madre in coltura liquida (idratazione 100%): pratico da gestire e rinfrescare." },
  { t: "Maturazione", d: "Il lavoro di enzimi e fermenti nel tempo (spesso in frigo) che migliora digeribilità e aroma." },
  { t: "Poolish", d: "Prefermento liquido (idratazione 100%) con poco lievito: estensibilità e profumo." },
  { t: "Pieghe", d: "Manipolazioni durante la puntata che rinforzano il glutine senza impastare di nuovo." },
  { t: "Puntata", d: "La prima lievitazione di massa, subito dopo l'impasto e prima della formatura." },
  { t: "Pirlatura", d: "Il gesto di arrotondare l'impasto creando tensione superficiale per una buona forma." },
  { t: "Rinfresco", d: "Nutrire il lievito madre con nuova farina e acqua per mantenerlo attivo e in forza." },
  { t: "Semola rimacinata", d: "Farina di grano duro macinata fine: base di pane pugliese/lucano e pasta fresca." },
  { t: "W (forza)", d: "Indice di forza della farina: più è alto (W300+), più regge idratazioni e lievitazioni lunghe." },
  { t: "Spiffero", d: "Piccola apertura dello sportello del forno a fine cottura per far uscire l'umidità e asciugare la crosta." },
];

export default function Glossario({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [q, setQ] = useState("");
  const gt = (x) => (lang === "it" ? x.t : (GLOSS[x.t]?.t?.[lang] || x.t));
  const gd = (x) => (lang === "it" ? x.d : (GLOSS[x.t]?.d?.[lang] || x.d));
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const sorted = [...TERMS].sort((a, b) => a.t.localeCompare(b.t));
    return s ? sorted.filter((x) => (gt(x) + " " + gd(x)).toLowerCase().includes(s) || x.t.toLowerCase().includes(s)) : sorted;
  }, [q, lang]); // eslint-disable-line

  return (
    <div className="pb-8" data-testid="glossario">
      {onBack && <button data-testid="glossario-back" onClick={onBack} className="flex items-center gap-1 text-[#F26419] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#0B0E14] shadow-xl mb-4" style={{ background: "linear-gradient(135deg,#F26419,#F26419 60%,#F26419)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><BookOpen className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Glossario dell'Arte Bianca", "Glossar der Backkunst", "Baking Craft Glossary", "Glosario del Arte Blanco")}</h1>
        <p className="text-[#0B0E14]/85 text-sm mt-2 leading-snug">{L("I termini tecnici spiegati in parole semplici. Cerca quello che ti serve.", "Fachbegriffe einfach erklärt.", "Technical terms in plain words. Search what you need.", "Términos técnicos en palabras sencillas.")}</p>
      </div>

      <div className="relative mb-4">
        <Search className="w-4.5 h-4.5 text-[#E8A838] absolute left-3 top-1/2 -translate-y-1/2" />
        <input data-testid="glossario-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={L("Cerca un termine…", "Begriff suchen…", "Search a term…", "Busca un término…")}
          className="w-full bg-[#0B0E14] dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl pl-10 pr-3 py-3 outline-none text-[#F26419] dark:text-[#e4eff8] focus:border-[#F26419]" />
      </div>

      <div className="space-y-2.5" data-testid="glossario-list">
        {list.map((x, i) => (
          <div key={x.t} data-testid={`glossario-term-${i}`} className="rounded-2xl bg-[#0B0E14] dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] p-4 shadow-sm">
            <p className="font-display text-[16px] font-bold text-[#F26419] leading-tight">{gt(x)}</p>
            <p className="text-[13.5px] text-[#F26419] dark:text-[#AEB8BF] leading-relaxed mt-1">{gd(x)}</p>
          </div>
        ))}
        {list.length === 0 && <p className="text-center text-sm text-[#E8A838] py-8">{L("Nessun termine trovato.", "Kein Begriff gefunden.", "No term found.", "Ningún término.")}</p>}
      </div>
    </div>
  );
}
