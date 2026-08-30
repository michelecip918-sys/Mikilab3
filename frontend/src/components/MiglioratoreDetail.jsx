import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Scheda "Il mio Miglioratore": perché l'ho creato, cosa fa ogni ingrediente, dosaggio 2-4%.
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

  const ING = [
    {
      pct: "3%",
      name: L({ it: "Malto diastasico puro", de: "Reines diastatisches Malz", en: "Pure diastatic malt", es: "Malta diastásica pura", fr: "Malt diastasique pur", fa: "مالت دیاستاتیک خالص" }),
      fn: L({ it: "nutre i lieviti, dona colore e croccantezza", de: "nährt die Hefen, gibt Farbe und Knusprigkeit", en: "feeds the yeasts, adds colour and crispness", es: "alimenta las levaduras, da color y crujiente", fr: "nourrit les levures, donne couleur et croustillant", fa: "مخمرها را تغذیه می‌کند، رنگ و ترد‌ی می‌دهد" }),
    },
    {
      pct: "2%",
      name: L({ it: "Lino dorato", de: "Goldleinsamen", en: "Golden flax", es: "Lino dorado", fr: "Lin doré", fa: "بذر کتان طلایی" }),
      fn: L({ it: "aggiunge struttura e omega", de: "gibt Struktur und Omega", en: "adds structure and omega", es: "aporta estructura y omega", fr: "apporte structure et oméga", fa: "ساختار و امگا اضافه می‌کند" }),
    },
    {
      pct: "1%",
      name: L({ it: "Lupino dolce", de: "Süße Lupine", en: "Sweet lupin", es: "Altramuz dulce", fr: "Lupin doux", fa: "لوپین شیرین" }),
      fn: L({ it: "rinforza la maglia glutinica e la tenuta", de: "stärkt das Glutennetz und die Stabilität", en: "strengthens the gluten network and hold", es: "refuerza la red de gluten y la tenida", fr: "renforce le réseau de gluten et la tenue", fa: "شبکهٔ گلوتن و پایداری را تقویت می‌کند" }),
    },
    {
      pct: "0,5%",
      name: L({ it: "Buccia di psillio", de: "Flohsamenschalen", en: "Psyllium husk", es: "Cáscara de psyllium", fr: "Enveloppe de psyllium", fa: "پوستهٔ اسفرزه" }),
      fn: L({ it: "trattiene l'idratazione, pane morbido più a lungo", de: "hält die Feuchtigkeit, Brot länger weich", en: "retains hydration, bread stays soft longer", es: "retiene la hidratación, pan blando más tiempo", fr: "retient l'hydratation, pain moelleux plus longtemps", fa: "رطوبت را نگه می‌دارد، نان بیشتر نرم می‌ماند" }),
    },
    {
      pct: "0,3%",
      name: L({ it: "Acerola (vitamina C naturale)", de: "Acerola (natürliches Vitamin C)", en: "Acerola (natural vitamin C)", es: "Acerola (vitamina C natural)", fr: "Acérola (vitamine C naturelle)", fa: "آسرولا (ویتامین C طبیعی)" }),
      fn: L({ it: "rinforza la maglia glutinica e la tenuta", de: "stärkt das Glutennetz und die Stabilität", en: "strengthens the gluten network and hold", es: "refuerza la red de gluten y la tenida", fr: "renforce le réseau de gluten et la tenue", fa: "شبکهٔ گلوتن و پایداری را تقویت می‌کند" }),
    },
  ];

  return (
    <div ref={rootRef} data-testid="miglioratore-detail" className="mt-3 pl-9 scroll-mt-24">
      <button data-testid="miglioratore-detail-toggle" onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-white bg-white/15 border border-white/25 rounded-full px-3 py-1.5 active:scale-95 hover:bg-white/25 transition-all">
        <FlaskConical className="w-3.5 h-3.5" />
        {L({ it: "Il mio Miglioratore: scopri di più", de: "Mein Verbesserer: mehr erfahren", en: "My Improver: learn more", es: "Mi Mejorador: saber más", fr: "Mon Améliorant : en savoir plus", fa: "بهبوددهندهٔ من: بیشتر بدانید" })}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-2.5 rounded-xl bg-black/20 border border-white/20 p-3">
              <p className="text-[12.5px] text-white/90 leading-snug mb-2.5">
                {L({
                  it: "Il Miglioratore Naturale MikiLab nasce nel mio laboratorio: 5 ingredienti 100% naturali, dosati con precisione per dare al pane forza, profumo e una morbidezza che dura nel tempo. Negli anni ho studiato e imparato a usarlo a modo mio: è la mia firma, ma non è obbligatorio — puoi sostituirlo con un semplice malto o con l'ingrediente naturale che conosci e preferisci.",
                  de: "Der Natürliche Verbesserer von MikiLab entsteht in meinem Labor: 5 zu 100% natürliche Zutaten, präzise dosiert, um dem Brot Kraft, Aroma und eine lang anhaltende Weichheit zu geben. Über die Jahre habe ich gelernt, ihn auf meine Art zu verwenden: er ist meine Handschrift, aber nicht Pflicht — du kannst ihn durch ein einfaches Malz oder eine natürliche Zutat ersetzen, die du kennst und bevorzugst.",
                  en: "The MikiLab Natural Improver is born in my lab: 5 fully natural ingredients, precisely dosed to give bread strength, aroma and a softness that lasts. Over the years I studied and learned to use it my own way: it's my signature, but it's not mandatory — you can replace it with a simple malt or any natural ingredient you know and prefer.",
                  es: "El Mejorador Natural MikiLab nace en mi laboratorio: 5 ingredientes 100% naturales, dosificados con precisión para dar al pan fuerza, aroma y una ternura duradera. Con los años aprendí a usarlo a mi manera: es mi firma, pero no es obligatorio — puedes sustituirlo por una simple malta o por el ingrediente natural que conozcas y prefieras.",
                  fr: "L'Améliorant Naturel MikiLab naît dans mon laboratoire : 5 ingrédients 100% naturels, dosés avec précision pour donner au pain force, arôme et un moelleux durable. Au fil des ans j'ai appris à l'utiliser à ma façon : c'est ma signature, mais ce n'est pas obligatoire — tu peux le remplacer par un simple malt ou par l'ingrédient naturel que tu connais et préfères.",
                  fa: "بهبوددهندهٔ طبیعی MikiLab در آزمایشگاه من متولد می‌شود: ۵ مادهٔ کاملاً طبیعی برای قدرت، عطر و نرمی ماندگار نان. در طول سال‌ها یاد گرفتم به روش خودم از آن استفاده کنم: امضای من است، اما اجباری نیست — می‌توانی آن را با یک مالت ساده یا هر مادهٔ طبیعی که می‌شناسی جایگزین کنی.",
                })}
              </p>
              <div className="space-y-1.5">
                {ING.map((x, i) => (
                  <div key={i} data-testid={`miglioratore-ing-${i}`} className="flex items-baseline gap-2 text-[12.5px]">
                    <span className="font-mono-data font-bold text-[#ffe0c2] w-11 shrink-0">{x.pct}</span>
                    <span className="text-white font-semibold">{x.name}</span>
                    <span className="text-white/75">— {x.fn}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] text-white bg-white/15 rounded-lg px-3 py-2 border border-white/20">
                <strong>{L({ it: "Dosaggio", de: "Dosierung", en: "Dosage", es: "Dosis", fr: "Dosage", fa: "دوز" })}:</strong>{" "}
                {L({
                  it: "2–4% sul peso della farina (indiretto 2–3%, diretto 3–4%).",
                  de: "2–4% des Mehlgewichts (indirekt 2–3%, direkt 3–4%).",
                  en: "2–4% of flour weight (indirect 2–3%, direct 3–4%).",
                  es: "2–4% del peso de la harina (indirecto 2–3%, directo 3–4%).",
                  fr: "2–4% du poids de farine (indirect 2–3%, direct 3–4%).",
                  fa: "۲ تا ۴٪ وزن آرد (غیرمستقیم ۲–۳٪، مستقیم ۳–۴٪).",
                })}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
