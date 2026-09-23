import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, HelpCircle, ChevronDown, Search } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { GLOSSARIO, glossEntry, normText } from "@/lib/glossario";
import { S as SOCCORSO } from "@/components/officina/ProntoSoccorso";

// V108 — LE DOMANDE DEL FORNAIO. Tutte le domande a cui la bottega sa già rispondere (parole del mestiere e sintomi),
// in una pagina sola con la ricerca, e con i dati strutturati FAQPage per Google. Zero IA, zero crediti, zero dati.

const LD_ID = "mikilab-faq-ld";

export default function Domande({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const faq = useMemo(() => {
    const wq = (t) => (lang === "de" ? `Was ist ${t}?` : lang === "en" ? `What is ${t}?` : `Cos'è ${t}?`);
    const a = GLOSSARIO.map((g) => { const e = glossEntry(g, lang); return { k: `g-${g.k}`, q: wq(e.title.replace(/\s*\(.*\)$/, "")), a: e.body }; });
    const hd = lang === "de" ? ["Warum: ", "Jetzt: ", "Nächstes Mal: "] : lang === "en" ? ["Why: ", "Right now: ", "Next time: "] : ["Perché: ", "Adesso: ", "La prossima volta: "];
    const b = SOCCORSO.map((s) => ({ k: `s-${s.k}`, q: (lang === "de" ? "Mein Teig: " : lang === "en" ? "My dough: " : "Il mio impasto: ") + L(s.t).toLowerCase() + (lang === "en" ? ". What now?" : lang === "de" ? ". Was tun?" : ". Cosa faccio?"), a: `${hd[0]}${L(s.why)} ${hd[1]}${L(s.now)} ${hd[2]}${L(s.next)}` }));
    return [...b, ...a];
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = q.trim() ? faq.filter((f) => normText(f.q + " " + f.a).includes(normText(q))) : faq;
  useEffect(() => {
    try {
      const ld = { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: lang, mainEntity: faq.slice(0, 40).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
      let s = document.getElementById(LD_ID); if (!s) { s = document.createElement("script"); s.type = "application/ld+json"; s.id = LD_ID; document.head.appendChild(s); }
      s.textContent = JSON.stringify(ld);
      return () => { const e = document.getElementById(LD_ID); if (e) e.remove(); };
    } catch { return undefined; }
  }, [faq, lang]);
  return (
    <div data-testid="domande-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="domande-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><HelpCircle className="w-3 h-3" />MikiLab</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Le domande del fornaio", "Die Fragen des Bäckers", "The baker's questions")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-sm text-muted-foreground mt-1">{tri(`${faq.length} domande a cui la bottega risponde subito, senza intelligenza artificiale: i problemi dell'impasto e le parole del mestiere.`, `${faq.length} Fragen, die die Werkstatt sofort beantwortet, ohne künstliche Intelligenz: die Probleme des Teigs und die Fachwörter.`, `${faq.length} questions the workshop answers at once, with no artificial intelligence: dough problems and trade words.`)}</p>
      </div>
      <div className="relative"><Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" /><input data-testid="domande-cerca" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tri("Cerca una domanda…", "Frage suchen…", "Search a question…")} className="w-full text-[14px] bg-card text-foreground border border-border rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-primary" /></div>
      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {shown.map((f) => (
          <div key={f.k} data-testid={`faq-${f.k}`}>
            <button onClick={() => setOpen(open === f.k ? null : f.k)} className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"><span className="text-[13.5px] font-bold text-foreground leading-tight">{f.q}</span><ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open === f.k ? "rotate-180" : ""}`} /></button>
            {open === f.k && <p className="px-3 pb-3 text-[13px] text-foreground/90 leading-snug">{f.a}</p>}
          </div>
        ))}
        {shown.length === 0 && <p className="px-3 py-3 text-[13px] text-muted-foreground">{tri("Nessuna domanda con queste parole: chiedila a Sitor.", "Keine Frage mit diesen Wörtern: frag Sitor.", "No question with those words: ask Sitor.")}</p>}
      </div>
    </div>
  );
}
