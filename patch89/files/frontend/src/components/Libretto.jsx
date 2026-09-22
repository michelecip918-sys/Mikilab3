import { useState, useEffect } from "react";
import { ChevronLeft, Printer, BookOpen } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc, ingLoc } from "@/lib/loc";
import { START_NAMES } from "@/components/HomeManuale";

// V89 — "Il libretto dei 5 panini": le cinque ricette di "Comincia da qui" in un libretto da stampare
// e appendere in cucina (o dare a chi non usa il telefono con le mani in pasta). Versione CASA:
// dosi ricalcolate per 500 g di farina (le dosi originali nel sito non cambiano). Logo e firma su
// ogni pagina. Stampa: solo il libretto sulla carta.

const PUB = process.env.PUBLIC_URL;
const HOME_FLOUR = 500;

export default function Libretto({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [recs, setRecs] = useState([]);
  useEffect(() => {
    let stop = false;
    recipesApi.list("mikilab").then((all) => {
      if (stop || !Array.isArray(all)) return;
      const by = {}; all.forEach((r) => { if (r && r.name) by[r.name] = r; });
      setRecs(START_NAMES.map((n) => by[n]).filter(Boolean));
    }).catch(() => { /* */ });
    return () => { stop = true; };
  }, []);

  const print = () => { try { document.body.classList.add("ml-lib"); window.print(); } finally { setTimeout(() => document.body.classList.remove("ml-lib"), 500); } };
  const g = (n) => `${Math.round(n)} g`;
  const ingredients = (r) => {
    const k = HOME_FLOUR / (Number(r.flour_grams) || HOME_FLOUR);
    const out = [[g(HOME_FLOUR), rLoc(r, "flour_type", lang) || tri("Farina", "Mehl", "Flour")]];
    if (r.water_grams) out.push([g(r.water_grams * k), tri("Acqua", "Wasser", "Water")]);
    if (r.salt_grams) out.push([g(r.salt_grams * k), tri("Sale", "Salz", "Salt")]);
    if (r.sourdough_grams) out.push([g(r.sourdough_grams * k), tri("Lievito madre", "Sauerteig", "Sourdough starter")]);
    (r.extra_ingredients || []).forEach((e) => { const name = e.name_de && lang === "de" ? e.name_de : e.name_en && lang === "en" ? e.name_en : ingLoc(e.name, lang) || e.name; if (e.percent) out.push([g(HOME_FLOUR * e.percent / 100), name]); else if (e.grams) out.push([g(e.grams * k), name]); });
    return out;
  };

  return (
    <div data-testid="libretto-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <style>{`
        @media print {
          body.ml-lib * { visibility: hidden !important; }
          body.ml-lib #ml-libretto, body.ml-lib #ml-libretto * { visibility: visible !important; }
          body.ml-lib #ml-libretto { position: absolute; left: 0; top: 0; width: 100%; }
          body.ml-lib .ml-lib-page { page-break-after: always; border: none !important; box-shadow: none !important; }
          @page { size: A4 portrait; margin: 14mm; }
        }
      `}</style>
      <button data-testid="libretto-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold print:hidden"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="print:hidden">
        <div className="flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" /><h1 className="font-display text-2xl font-black text-foreground">{tri("Il libretto dei 5 panini", "Das Heft der 5 Brötchen", "The 5 rolls booklet")}</h1></div>
        <p className="text-sm text-muted-foreground mt-1">{tri("Le cinque ricette di «Comincia da qui», da stampare e appendere in cucina. Dosi per 500 g di farina (versione casa), con logo e firma su ogni pagina. Per la nonna, per chi non vuole il telefono vicino all'impasto, per regalarlo.", "Die fünf Rezepte von «Fang hier an», zum Drucken und in die Küche hängen. Mengen für 500 g Mehl (Hausversion), mit Logo und Unterschrift auf jeder Seite. Für Oma, für alle, die das Handy nicht am Teig wollen, zum Verschenken.", "The five «Start here» recipes, to print and hang in the kitchen. Quantities for 500 g of flour (home version), with logo and signature on every page. For grandma, for those who don't want the phone near the dough, to give away.")}</p>
        <button data-testid="libretto-print" onClick={print} disabled={!recs.length} className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 disabled:opacity-50"><Printer className="w-4 h-4" />{tri("Stampa il libretto (5 pagine A4)", "Heft drucken (5 Seiten A4)", "Print the booklet (5 A4 pages)")}</button>
      </div>

      <div id="ml-libretto" className="space-y-4">
        {recs.length === 0 && <p className="text-sm text-muted-foreground">{tri("Caricamento…", "Wird geladen…", "Loading…")}</p>}
        {recs.map((r, i) => (
          <article key={r.id} className="ml-lib-page bg-white text-[#2B2E33] rounded-2xl border border-border shadow-sm p-6" style={{ fontFamily: "Manrope, Arial, sans-serif" }}>
            <div className="flex items-center justify-between gap-3 border-b border-[#D9CFBC] pb-3">
              <div className="flex items-center gap-2"><img src={`${PUB}/logo-emblem.webp`} alt="MikiLab" className="w-9 h-9 rounded-lg object-contain" /><div><p className="text-lg font-black tracking-[0.14em] uppercase leading-none" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>MikiLab</p><p className="text-[9px] tracking-[0.28em] uppercase text-[#5B5F66]">{tri("Il libretto dei 5 panini", "Das Heft der 5 Brötchen", "The 5 rolls booklet")} · {i + 1}/5</p></div></div>
              <img src={`${PUB}/polpo-firma.svg`} alt="" className="w-10 h-10" />
            </div>
            <h2 className="text-[26px] leading-tight font-black mt-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>{rLoc(r, "name", lang)}</h2>
            <p className="text-[12px] text-[#5B5F66] mt-1">{tri("Versione casa · dosi per 500 g di farina", "Hausversion · Mengen für 500 g Mehl", "Home version · quantities for 500 g of flour")}{r.bake_temp ? ` · ${tri("Forno", "Ofen", "Oven")} ${Math.round(r.bake_temp)} °C, ${Math.round(r.bake_minutes || 0)} min` : ""}</p>
            <div className="grid sm:grid-cols-[13rem_1fr] gap-5 mt-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#A15621] mb-1">{tri("Ingredienti", "Zutaten", "Ingredients")}</p>
                <table className="w-full text-[13px]"><tbody>{ingredients(r).map(([q, n], k) => <tr key={k} className="border-b border-[#EDE6D8]"><td className="py-1 font-bold whitespace-nowrap pr-2">{q}</td><td className="py-1">{n}</td></tr>)}</tbody></table>
                <p className="text-[10px] text-[#5B5F66] mt-2">{tri("Il lievito di birra è indicato nel procedimento. Le dosi complete e la versione da laboratorio sono sul sito.", "Die Hefe steht im Verfahren. Vollständige Mengen und Backstubenversion auf der Seite.", "Baker's yeast is given in the method. Full quantities and the bakery version are on the site.")}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#A15621] mb-1">{tri("Come si fa", "So geht's", "Method")}</p>
                <p className="text-[13px] leading-relaxed whitespace-pre-line">{rLoc(r, "procedure", lang)}</p>
                {rLoc(r, "notes", lang) && <p className="text-[12px] text-[#5B5F66] mt-2 italic">{rLoc(r, "notes", lang)}</p>}
              </div>
            </div>
            <p className="text-[10px] text-[#5B5F66] mt-4 pt-2 border-t border-[#D9CFBC]">{tri("© MikiLab — Il Manuale di Sitor · mikilab.de · Gratis per uso personale. Fatto con le mani di Michele, panettiere a Stoccarda, da Miglionico.", "© MikiLab — Sitors Handbuch · mikilab.de · Kostenlos für den privaten Gebrauch. Mit Micheles Händen gemacht, Bäcker in Stuttgart, aus Miglionico.", "© MikiLab — Sitor's Manual · mikilab.de · Free for personal use. Made with Michele's hands, baker in Stuttgart, from Miglionico.")}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
