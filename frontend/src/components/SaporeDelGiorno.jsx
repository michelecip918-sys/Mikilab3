import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Rotazione giornaliera (day-of-year) tra i "sapori del giorno"
const FLAVORS = [
  { emoji: "🥖", it: ["Pane di Matera IGP", "Crosta spessa, mollica gialla e alveolata: semola rimacinata e lievito madre."], de: ["Brot von Matera", "Dicke Kruste, gelbe Krume: Hartweizen & Sauerteig."], en: ["Matera Bread", "Thick crust, yellow open crumb: durum semolina & sourdough."], es: ["Pan de Matera", "Corteza gruesa, miga amarilla: sémola y masa madre."] },
  { emoji: "🫓", it: ["Focaccia Barese", "Patata nell'impasto, pomodorini e olive: soffice per ore."], de: ["Focaccia aus Bari", "Kartoffel im Teig, Tomaten & Oliven."], en: ["Bari Focaccia", "Potato in the dough, tomatoes & olives: soft for hours."], es: ["Focaccia de Bari", "Patata en la masa, tomates y aceitunas."] },
  { emoji: "🎄", it: ["Panettone", "Lievito madre, lunga lievitazione e burro: il re dei lievitati."], de: ["Panettone", "Sauerteig, lange Gare & Butter: der König."], en: ["Panettone", "Sourdough, long proof & butter: the king of leavened cakes."], es: ["Panettone", "Masa madre, larga fermentación y mantequilla."] },
  { emoji: "🥨", it: ["Taralli al finocchietto", "Vino, olio e semi: sbollentati e poi in forno, croccantissimi."], de: ["Taralli mit Fenchel", "Wein, Öl & Samen: gebrüht, dann gebacken."], en: ["Fennel Taralli", "Wine, oil & seeds: boiled then baked, super crisp."], es: ["Taralli de hinojo", "Vino, aceite y semillas: hervidos y al horno."] },
  { emoji: "🌀", it: ["Orecchiette", "Semola e acqua, trascinate col coltello: la pasta di Puglia."], de: ["Orecchiette", "Hartweizen & Wasser, von Hand geformt."], en: ["Orecchiette", "Semolina & water, dragged by knife: Puglia's pasta."], es: ["Orecchiette", "Sémola y agua, formadas a mano."] },
  { emoji: "🥐", it: ["Cornetto sfogliato", "Burro in piega e lievito madre: fragranza e mille strati."], de: ["Plunder-Cornetto", "Buttertouren & Sauerteig: viele Schichten."], en: ["Laminated Cornetto", "Butter lamination & sourdough: crisp, many layers."], es: ["Cornetto hojaldrado", "Mantequilla laminada y masa madre."] },
  { emoji: "🍕", it: ["Pizza in teglia", "Alta idratazione e lunga maturazione: leggera e alveolata."], de: ["Blechpizza", "Hohe Hydratation & lange Reife."], en: ["Pan Pizza", "High hydration & long maturation: light and airy."], es: ["Pizza en bandeja", "Alta hidratación y larga maduración."] },
];

export default function SaporeDelGiorno() {
  const { lang } = useLang();
  const f = useMemo(() => {
    const now = new Date();
    const day = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    return FLAVORS[day % FLAVORS.length];
  }, []);
  const txt = f[lang] || f.en || f.it;
  const label = lang === "de" ? "Der Geschmack des Tages" : lang === "es" ? "El sabor del día" : (lang === "en" || lang === "fr" || lang === "fa") ? "Flavour of the Day" : "Il Sapore del Giorno";

  return (
    <div data-testid="home-sapore-giorno" className="relative overflow-hidden rounded-3xl p-5 text-[#FFFDF9] shadow-lg flex items-center gap-4"
      style={{ background: "linear-gradient(135deg,#D97706 0%,#B45309 55%,#8C4A27 100%)" }}>
      <div aria-hidden className="absolute -right-6 -bottom-8 w-36 h-36 rounded-full opacity-25" style={{ background: "radial-gradient(circle,#FEF3C7,transparent 70%)" }} />
      <div className="text-5xl leading-none shrink-0">{f.emoji}</div>
      <div className="min-w-0 flex-1 relative">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#FEF3C7] flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> {label}</p>
        <p className="font-display text-xl font-bold leading-tight mt-0.5">{txt[0]}</p>
        <p className="text-[#FFFDF9]/85 text-[13px] leading-snug mt-1">{txt[1]}</p>
      </div>
    </div>
  );
}
