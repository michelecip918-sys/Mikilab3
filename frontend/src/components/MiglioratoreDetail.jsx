import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { MIX } from "@/lib/improver";

// Scheda "Il mio Miglioratore": perché l'ho creato, cosa fa ogni ingrediente, dosaggio 2% (indiretto) o 3% (diretto).
export default function MiglioratoreDetail() {
  const { lang } = useLang();
  const L = (o) => o[lang] || o.it;
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Apertura da un asterisco cliccato nel procedimento ("Miglioratore*").
  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      // Aspetta l'animazione di espansione prima di calcolare lo scroll.
      setTimeout(() => {
        rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 380);
    };
    window.addEventListener("mikilab-open-improver", onOpen);
    return () => window.removeEventListener("mikilab-open-improver", onOpen);
  }, []);

  return (
    <div ref={rootRef} data-testid="miglioratore-detail" className="mt-3 pl-9 scroll-mt-24">
      <button data-testid="miglioratore-detail-toggle" onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-foreground bg-foreground/15 border border-foreground/25 rounded-full px-3 py-1.5 active:scale-95 hover:bg-foreground/25 transition-all">
        <FlaskConical className="w-3.5 h-3.5" />
        {L({ it: "Il Miglioratore MikiLab: scopri di più", de: "Der MikiLab-Verbesserer: mehr erfahren", en: "The MikiLab Improver: learn more", es: "El Mejorador MikiLab: saber más", fr: "L'Améliorant MikiLab : en savoir plus", fa: "بهبوددهندهٔ MikiLab: بیشتر بدانید" })}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-2.5 rounded-2xl shadow-md border border-amber-900/40 bg-background/20 border border-foreground/20 p-3">
              <p className="text-[12.5px] text-foreground/90 leading-snug mb-2.5">
                {L({
                  it: "Il Miglioratore Naturale MikiLab è una miscela a secco (su 100 g: le quantità qui sotto) di 8 ingredienti naturali che danno al pane forza, profumo e una morbidezza che dura, senza additivi chimici. È facoltativo: nella pagina «Il mio miglioratore» trovi il calcolatore e cosa usare se non lo hai.",
                  de: "Der natürliche MikiLab-Verbesserer ist eine Trockenmischung (auf 100 g: die Mengen unten) aus 8 natürlichen Zutaten für Kraft, Aroma und lang anhaltende Weichheit, ohne chemische Zusätze. Er ist optional: Auf der Seite «Mein Verbesserer» findest du den Rechner und Alternativen.",
                  en: "The MikiLab Natural Improver is a dry mix (per 100 g: the amounts below) of 8 natural ingredients that give bread strength, aroma and lasting softness, with no chemical additives. It is optional: on the «My improver» page you'll find the calculator and alternatives.",
                })}
              </p>
              <div className="space-y-1.5">
                {MIX.map((x, i) => (
                  <div key={i} data-testid={`miglioratore-ing-${i}`} className="flex items-baseline gap-2 text-[12.5px]">
                    <span className="font-mono-data font-bold text-foreground w-11 shrink-0">{x.g} g</span>
                    <span className="text-foreground font-semibold">{L(x.name)}</span>
                    <span className="text-foreground/75">— {L(x.fn)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-foreground bg-foreground/15 rounded-lg px-3 py-2 border border-foreground/20">
                <strong>{L({ it: "Dosaggio", de: "Dosierung", en: "Dosage", es: "Dosis", fr: "Dosage", fa: "دوز" })}:</strong>{" "}
                {L({
                  it: "2% sul peso della farina per gli impasti indiretti, 3% per i diretti (su 500 g di farina: 10 g oppure 15 g).",
                  de: "2 % des Mehlgewichts bei indirekter Führung, 3 % bei direkter (auf 500 g Mehl: 10 g oder 15 g).",
                  en: "2% of flour weight for indirect doughs, 3% for direct ones (on 500 g flour: 10 g or 15 g).",
                })}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
