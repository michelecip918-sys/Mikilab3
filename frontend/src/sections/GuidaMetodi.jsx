import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BookOpen } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const SECTIONS = [
  {
    id: "poolish", icon: "💧",
    it: { title: "Poolish", body: "Il poolish è un prefermento LIQUIDO: parti uguali di farina e acqua (idratazione 100%) con pochissimo lievito. Riposa 8-16 ore a temperatura ambiente finché è pieno di bolle e leggermente incurvato al centro.\n\nA cosa serve: più profumo, mollica più soffice, migliore digeribilità e crosta più fragrante. Ottimo per baguette, ciabatte e pani soffici.\n\nRegola d'oro: quando lo unisci all'impasto, togli dal totale la farina e l'acqua già presenti nel poolish per non sbagliare l'idratazione." },
    de: { title: "Poolish", body: "Poolish ist ein FLÜSSIGER Vorteig: gleiche Teile Mehl und Wasser (100% Hydratation) mit sehr wenig Hefe. 8-16 Stunden bei Raumtemperatur reifen, bis er voller Blasen ist und in der Mitte leicht einsinkt.\n\nWozu: mehr Aroma, weichere Krume, bessere Bekömmlichkeit, knusprigere Kruste. Ideal für Baguette, Ciabatta und lockere Brote.\n\nGoldene Regel: Mehl und Wasser aus dem Poolish von der Gesamtmenge abziehen, damit die Hydratation stimmt." },
  },
  {
    id: "lm", icon: "🌾",
    it: { title: "Lievito Madre — pane vs panettone", body: "Il lievito madre è farina + acqua fermentata dai lieviti e batteri naturali. MA si gestisce in modo DIVERSO a seconda di cosa devi fare:\n\n🍞 PER IL PANE: puoi tenerlo più acido e più idratato (anche liquido, licoli). Bastano 1-2 rinfreschi, un po' di acidità è un pregio: dà sapore, alveolatura e conservazione. Gestione semplice.\n\n🎁 PER IL PANETTONE: serve una PASTA MADRE SOLIDA (legata), poco acida e fortissima di spinta. Va rinfrescata PIÙ VOLTE al giorno (anche 3), spesso con il 'bagnetto' in acqua e zucchero e legata stretta in un telo. Perché? L'impasto del panettone è ricchissimo di burro, tuorli e zucchero: pesa tantissimo sul lievito. Se la madre è acida o debole, il panettone non cresce e sa di acido. Quindi: per il panettone la madre deve essere dolce, in forza e pulita." },
    de: { title: "Sauerteig / Lievito Madre — Brot vs. Panettone", body: "Lievito madre ist fermentiertes Mehl + Wasser mit natürlichen Hefen und Bakterien. ABER die Führung ist UNTERSCHIEDLICH:\n\n🍞 FÜRS BROT: darf saurer und feuchter sein (auch flüssig, Licoli). 1-2 Auffrischungen genügen, etwas Säure ist gut: Geschmack, Porung, Haltbarkeit. Einfache Führung.\n\n🎁 FÜR PANETTONE: braucht eine FESTE Pasta Madre (gebunden), wenig sauer und mit enormer Triebkraft. Sie wird MEHRMALS täglich aufgefrischt (bis 3x), oft mit dem 'Bagnetto' in Zuckerwasser und fest in ein Tuch gebunden. Warum? Der Panettone-Teig ist voller Butter, Eigelb und Zucker und belastet die Hefe stark. Ist die Madre sauer oder schwach, geht der Panettone nicht auf und schmeckt sauer. Also: süß, kraftvoll und sauber." },
  },
  {
    id: "roggen", icon: "🟤",
    it: { title: "Roggen Sauerteig (pasta acida di segale)", body: "È il lievito naturale di SEGALE, tipico del pane tedesco. La segale ha pochissimo glutine e molti enzimi: senza acidità l'impasto risulterebbe colloso e la mollica gommosa.\n\nA cosa serve: l'acidità del Sauerteig 'blocca' quegli enzimi, dà struttura, il tipico gusto intenso e una lunghissima conservazione. Si usa per Roggenbrot, Mischbrot e pani scuri.\n\nGestione: rinfresco con farina di segale e acqua, temperatura ~26-28°C, maturazione 12-16 ore. Più caldo = più acido lattico (dolce); più freddo = più acido acetico (pungente)." },
    de: { title: "Roggensauerteig", body: "Der natürliche ROGGEN-Sauerteig, typisch für deutsches Brot. Roggen hat wenig Gluten und viele Enzyme: ohne Säure würde der Teig klebrig und die Krume gummiartig.\n\nWozu: Die Säure 'stoppt' diese Enzyme, gibt Struktur, den typischen kräftigen Geschmack und lange Haltbarkeit. Für Roggenbrot, Mischbrot und dunkle Brote.\n\nFührung: Auffrischen mit Roggenmehl und Wasser, ~26-28°C, 12-16 Stunden Reife. Wärmer = mehr Milchsäure (mild); kälter = mehr Essigsäure (kräftig)." },
  },
  {
    id: "backmittel", icon: "✨",
    it: { title: "Backmittel (Miglioratore naturale)", body: "Il Backmittel è un miglioratore. Il MIO è NATURALE, senza additivi chimici: un mix di ingredienti come malto d'orzo, un po' di lievito madre essiccato, semi macinati e a volte lecitina naturale.\n\nA cosa serve: aiuta lo sviluppo, la doratura (il malto dà zuccheri), la sofficità e la conservazione, in modo genuino. Si dosa in piccola percentuale sulla farina (circa 2-3%).\n\nDifferenza: i migliorativi industriali usano additivi ed enzimi chimici; il mio punta solo su ingredienti naturali e sul metodo indiretto." },
    de: { title: "Backmittel (natürlicher Backhelfer)", body: "Backmittel ist ein Backhelfer. MEINER ist NATÜRLICH, ohne chemische Zusätze: eine Mischung aus Gerstenmalz, etwas getrocknetem Sauerteig, gemahlenen Saaten und manchmal natürlichem Lecithin.\n\nWozu: unterstützt Entwicklung, Bräunung (Malz liefert Zucker), Weichheit und Haltbarkeit – auf natürliche Weise. Dosierung gering, ca. 2-3% aufs Mehl.\n\nUnterschied: Industrielle Backmittel nutzen chemische Zusätze und Enzyme; meiner setzt nur auf natürliche Zutaten und die indirekte Methode." },
  },
];

export default function GuidaMetodi() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState("poolish");
  return (
    <div className="pb-24">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] p-6 text-white">
        <div className="absolute top-0 left-0 right-0 flex h-1.5">
          <div className="flex-1 bg-[#008C45]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#CD212A]" />
          <div className="flex-1 bg-black" /><div className="flex-1 bg-[#DD0000]" /><div className="flex-1 bg-[#FFCC00]" />
        </div>
        <BookOpen className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{t("guida_title")}</h1>
        <p className="text-white/85 text-sm mt-1">{t("guida_sub")}</p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((s) => {
          const c = s[lang] || s.it;
          const isOpen = open === s.id;
          return (
            <div key={s.id} data-testid={`guida-${s.id}`} className="rounded-2xl bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] overflow-hidden">
              <button data-testid={`guida-toggle-${s.id}`} onClick={() => setOpen(isOpen ? "" : s.id)}
                className="w-full flex items-center gap-3 p-4 text-left">
                <span className="text-2xl">{s.icon}</span>
                <span className="flex-1 font-display text-base font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{c.title}</span>
                <ChevronDown className={`w-5 h-5 text-[#B34A26] transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <p className="px-4 pb-4 text-sm text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed whitespace-pre-line">{c.body}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
