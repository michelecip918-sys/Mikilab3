import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const ENTRIES = {
  it: [
    { t: "Lievito Madre (di Segale)", b: "Prefermento naturale a base di farina di segale e acqua, mantenuto vivo con rinfreschi regolari. Dona acidità dolce, profumo intenso e lunga conservazione. Nel mio metodo riposa in cella a 16°C (max 6 ore). Usalo quando vuoi carattere e durata nel pane." },
    { t: "Sauerteig", b: "È il lievito madre nella tradizione tedesca, di solito di segale: più acido e rustico, perfetto per pani scuri e di segale (Roggenbrot). Si gestisce come una pasta madre con rinfreschi." },
    { t: "Poolish", b: "Prefermento liquido (uguale peso di acqua e farina + poco lievito). Matura 12-16 ore. Regala alveolatura aperta, estensibilità e aroma. Ideale per baguette e pani leggeri." },
    { t: "Biga", b: "Prefermento solido italiano (poca acqua, ~45%). Dà forza e struttura all'impasto, aroma pulito. Ottima per grandi lievitati e pani con molta idratazione finale." },
    { t: "Kochstück (Cookstock)", b: "Farina cotta con acqua (o latte) fino a gel. Trattiene umidità: pane più morbido e a lunga durata. Piccola percentuale sul totale farina." },
    { t: "Quellstück (ammollo semi)", b: "Semi e cereali messi in ammollo la sera prima. Idratano, non rubano acqua all'impasto e non spezzano il glutine. Fondamentale per pani ai semi." },
    { t: "Miglioratore naturale", b: "Mix naturale (malto, farina di germe, ecc.) che migliora lievitazione, colore e conservazione senza additivi chimici. Si usa in piccola percentuale sulla farina." },
    { t: "Malto", b: "Da cereale germinato: nutre i lieviti e dà colore e croccantezza alla crosta. Il malto diastasico è il più 'forte' — dosalo con cura per non rendere l'impasto colloso." },
    { t: "Autolisi", b: "Riposo di farina + acqua (senza lievito e sale) per 20-60 min prima di impastare. Sviluppa il glutine da solo: impasto più estensibile e meno lavorazione." },
    { t: "Idratazione", b: "Percentuale di acqua sul peso della farina. Più alta = alveolatura aperta ma impasto più difficile. Adattala alla farina (W) e al metodo." },
  ],
  de: [
    { t: "Lievito Madre (Roggen)", b: "Natürlicher Vorteig aus Roggenmehl und Wasser, durch regelmäßige Auffrischungen lebendig gehalten. Bringt milde Säure, intensives Aroma und lange Frische. In meiner Methode ruht er in der Kammer bei 16°C (max. 6 Std.)." },
    { t: "Sauerteig", b: "Der Lievito Madre in deutscher Tradition, meist aus Roggen: säuerlicher und rustikaler, perfekt für dunkle Brote und Roggenbrot. Wird wie ein Sauerteig mit Auffrischungen geführt." },
    { t: "Poolish", b: "Flüssiger Vorteig (gleiche Menge Wasser und Mehl + wenig Hefe). Reift 12-16 Std. Bringt offene Porung, Dehnbarkeit und Aroma. Ideal für Baguette und lockere Brote." },
    { t: "Biga", b: "Fester italienischer Vorteig (wenig Wasser, ~45%). Gibt dem Teig Kraft und Struktur, reines Aroma. Top für große Hefegebäcke und stark hydratisierte Brote." },
    { t: "Kochstück", b: "Mehl mit Wasser (oder Milch) zu einem Gel gekocht. Hält Feuchtigkeit: weicheres, länger frisches Brot. Kleiner Anteil an der Gesamtmehlmenge." },
    { t: "Quellstück (Saaten)", b: "Saaten und Körner am Vorabend einweichen. Sie quellen, entziehen dem Teig kein Wasser und zerschneiden das Gluten nicht. Unverzichtbar für Saatenbrote." },
    { t: "Natürliches Backmittel", b: "Natürliche Mischung (Malz, Keimmehl usw.), die Gärung, Farbe und Haltbarkeit ohne chemische Zusätze verbessert. In kleinem Anteil zum Mehl." },
    { t: "Malz", b: "Aus gekeimtem Getreide: nährt die Hefe und gibt Farbe und Krustenknusprigkeit. Diastatisches Malz ist am 'stärksten' — sparsam dosieren, sonst wird der Teig klebrig." },
    { t: "Autolyse", b: "Ruhezeit von Mehl + Wasser (ohne Hefe und Salz) 20-60 Min vor dem Kneten. Entwickelt das Gluten von selbst: dehnbarerer Teig, weniger Knetarbeit." },
    { t: "Hydratation", b: "Wasseranteil bezogen auf das Mehlgewicht. Höher = offenere Porung, aber schwierigerer Teig. An Mehl (W) und Methode anpassen." },
  ],
};

export default function Enciclopedia() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(0);
  const list = ENTRIES[lang === "de" ? "de" : "it"];

  return (
    <div data-testid="enciclopedia" className="pb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#6B8E62] flex items-center justify-center"><BookOpen className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("enc_title")}</h1>
          <p className="text-sm text-[#8C7567]">{t("enc_sub")}</p>
        </div>
      </div>

      <div className="space-y-2">
        {list.map((e, i) => {
          const isOpen = open === i;
          return (
            <div key={e.t} data-testid={`enc-entry-${i}`} className="rounded-2xl bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] overflow-hidden">
              <button onClick={() => setOpen(isOpen ? -1 : i)} className="w-full flex items-center justify-between p-4 text-left">
                <span className="font-display text-base font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{e.t}</span>
                <ChevronDown className={`w-4 h-4 text-[#8C7567] transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && <p className="px-4 pb-4 text-sm leading-relaxed text-[#4A3B34] dark:text-[#C9BBB0]">{e.b}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
