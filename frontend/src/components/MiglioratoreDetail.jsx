import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Scheda "Il mio Miglioratore": perché l'ho creato, cosa fa ogni ingrediente, dosaggio 2-4%.
export default function MiglioratoreDetail() {
  const { lang } = useLang();
  const L = (o) => o[lang] || o.it;
  const [open, setOpen] = useState(false);

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
    <div data-testid="miglioratore-detail" className="mt-3 pl-9">
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
                  it: "L'ho creato io, con 5 ingredienti 100% naturali, per controllare ogni dettaglio del pane. Non è obbligatorio — è la mia scelta.",
                  de: "Ich habe ihn selbst entwickelt, mit 5 zu 100% natürlichen Zutaten, um jedes Detail des Brotes zu kontrollieren. Er ist nicht Pflicht — es ist meine Wahl.",
                  en: "I created it myself, with 5 fully natural ingredients, to control every detail of the bread. It's not mandatory — it's my choice.",
                  es: "Lo creé yo, con 5 ingredientes 100% naturales, para controlar cada detalle del pan. No es obligatorio — es mi elección.",
                  fr: "Je l'ai créé moi-même, avec 5 ingrédients 100% naturels, pour contrôler chaque détail du pain. Ce n'est pas obligatoire — c'est mon choix.",
                  fa: "خودم آن را با ۵ مادهٔ کاملاً طبیعی ساختم تا هر جزئیات نان را کنترل کنم. اجباری نیست — انتخاب من است.",
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
