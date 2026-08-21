import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { MikiAvatar } from "@/components/MikiAvatar";

const ENTRIES = {
  it: [
    { t: "Miglioratore Naturale Pro", b: "Per tutti gli impasti (metodo Diretto e Indiretto) si utilizza unicamente il Miglioratore Naturale Pro al 2% sul peso della farina. Un'unica formula universale per garantire spinta, tenuta e morbidezza." },
    { t: "Lievito Madre / Licoli (Liko)", b: "Pasta madre solida (idr. 45-50%) o Licoli in coltura liquida (idr. 100%, più reattivo). Mantenuta viva con rinfreschi regolari. Nei pani 15-20% sul peso farina, con Licoli fino al 25-35%; nei grandi lievitati 25-30%." },
    { t: "Lievito Madre di Segale", b: "Sauerteig di segale, più acido e attivo (idratazione 100%, liquido). Fermenta 12-16 h a 26-28°C. Perfetto per pani di segale e misti (20-30% sulla farina)." },
    { t: "Poolish", b: "Prefermento liquido (stesso peso di acqua e farina + poco lievito). Matura 12-16 h a 18°C. Regala alveolatura aperta, estensibilità e aroma. Usa 30-40% sul totale farina." },
    { t: "Kochstück (con Haferflocken)", b: "Fiocchi d'avena (Haferflocken) cotti con acqua e sale (1:4) fino a crema densa, poi raffreddati. Trattengono acqua: pane più morbido e a lunga durata. Aggiungi 10-20% sul peso farina riducendo un po' l'acqua." },
    { t: "Biga", b: "Prefermento solido italiano (poca acqua, ~45%). Dà forza e struttura all'impasto, aroma pulito. Ottima per grandi lievitati e pani molto idratati." },
    { t: "Quellstück (ammollo semi)", b: "Semi e cereali in ammollo la sera prima. Idratano, non rubano acqua all'impasto e non spezzano il glutine. Fondamentale per pani ai semi." },
    { t: "Malto", b: "Da cereale germinato: nutre i lieviti e dà colore e croccantezza alla crosta. Il malto diastasico è il più 'forte' — dosalo con cura. È già incluso nel Miglioratore Naturale Pro." },
    { t: "Autolisi", b: "Riposo di farina + acqua (senza lievito e sale) per 20-60 min prima di impastare. Sviluppa il glutine da solo: impasto più estensibile e meno lavorazione." },
    { t: "Idratazione", b: "Percentuale di acqua sul peso della farina. Più alta = alveolatura aperta ma impasto più difficile. Adattala alla farina (W) e al metodo." },
  ],
  de: [
    { t: "Natürlicher Pro-Backmittel", b: "Für alle Teige (Direkt und Indirekt) wird ausschließlich der Natürliche Pro-Backmittel mit 2% auf das Mehlgewicht verwendet. Eine einzige universelle Formel für Trieb, Stand und Weichheit." },
    { t: "Lievito Madre / Licoli (Liko)", b: "Fester Sauerteig (Hydr. 45-50%) oder Licoli als Flüssigsauer (Hydr. 100%, reaktiver). Durch regelmäßige Auffrischungen lebendig gehalten. Brote 15-20% auf das Mehl, mit Licoli bis 25-35%; große Hefegebäcke 25-30%." },
    { t: "Roggen-Sauerteig", b: "Roggensauerteig, säuerlicher und aktiver (Hydration 100%, flüssig). Reift 12-16 h bei 26-28°C. Perfekt für Roggen- und Mischbrote (20-30% auf das Mehl)." },
    { t: "Poolish", b: "Flüssiger Vorteig (gleiche Menge Wasser und Mehl + wenig Hefe). Reift 12-16 h bei 18°C. Bringt offene Porung, Dehnbarkeit und Aroma. 30-40% auf das Gesamtmehl." },
    { t: "Kochstück (mit Haferflocken)", b: "Haferflocken mit Wasser und Salz (1:4) zu einer dicken Creme gekocht, dann abgekühlt. Binden Wasser: weicheres, länger frisches Brot. 10-20% auf das Mehl, Wasser etwas reduzieren." },
    { t: "Biga", b: "Fester italienischer Vorteig (wenig Wasser, ~45%). Gibt dem Teig Kraft und Struktur, reines Aroma. Top für große Hefegebäcke und stark hydratisierte Brote." },
    { t: "Quellstück (Saaten)", b: "Saaten und Körner am Vorabend einweichen. Sie quellen, entziehen dem Teig kein Wasser und zerschneiden das Gluten nicht. Unverzichtbar für Saatenbrote." },
    { t: "Malz", b: "Aus gekeimtem Getreide: nährt die Hefe und gibt Farbe und Krustenknusprigkeit. Diastatisches Malz ist am 'stärksten' — sparsam dosieren. Bereits im Pro-Backmittel enthalten." },
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
      <MikiAvatar label="Michele" subtitle={t("enc_title")} className="mb-4" />
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
