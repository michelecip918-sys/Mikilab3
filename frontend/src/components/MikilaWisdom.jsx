import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// "Il Pizzico di Sapienza di Mikila" — un consiglio da fornaio, diverso per sezione,
// che cambia ogni giorno e a ogni tocco. Presente in ogni parte del sito.
// Ogni voce = [it, de, en, es, fr, fa]
const WISDOM = {
  home: [
    ["Il pane non ha fretta: chi rispetta i tempi, mangia meglio.", "Brot hat es nicht eilig: wer die Zeit achtet, isst besser.", "Bread is never in a hurry: respect the timing and you'll eat better.", "El pan no tiene prisa: quien respeta los tiempos, come mejor.", "Le pain n'est jamais pressé : respecte le temps et tu mangeras mieux.", "نان عجله ندارد: هر که به زمان احترام بگذارد، بهتر می‌خورد."],
    ["Un buon fornaio ascolta l'impasto prima di guardare l'orologio.", "Ein guter Bäcker hört auf den Teig, bevor er auf die Uhr schaut.", "A good baker listens to the dough before looking at the clock.", "Un buen panadero escucha la masa antes de mirar el reloj.", "Un bon boulanger écoute la pâte avant de regarder l'horloge.", "نانوای خوب پیش از نگاه به ساعت، به خمیر گوش می‌دهد."],
    ["La qualità nasce dalla calma: organizza oggi per lavorare sereno domani.", "Qualität entsteht aus Ruhe: plane heute, um morgen gelassen zu arbeiten.", "Quality is born from calm: plan today to work with peace tomorrow.", "La calidad nace de la calma: organiza hoy para trabajar sereno mañana.", "La qualité naît du calme : organise aujourd'hui pour travailler serein demain.", "کیفیت از آرامش زاده می‌شود: امروز برنامه‌ریزی کن تا فردا آسوده کار کنی."],
    ["Impasto, tempo e amore: sono questi i tre lieviti veri.", "Teig, Zeit und Liebe: das sind die drei echten Triebmittel.", "Dough, time and love: these are the three true leaveners.", "Masa, tiempo y amor: estos son los tres verdaderos fermentos.", "Pâte, temps et amour : voilà les trois vrais levains.", "خمیر، زمان و عشق: سه ورآورندهٔ حقیقی همین‌هاست."],
  ],
  ricette: [
    ["L'idratazione è una conversazione con la tua farina: parte piano, poi cresce.", "Hydration ist ein Gespräch mit deinem Mehl: langsam beginnen, dann steigern.", "Hydration is a conversation with your flour: start slow, then build up.", "La hidratación es una conversación con tu harina: empieza despacio y sube.", "L'hydratation est un dialogue avec ta farine : commence doucement, puis augmente.", "آبگیری گفت‌وگویی با آرد توست: آرام شروع کن و کم‌کم زیاد کن."],
    ["Pesa sempre il sale a parte: un grammo cambia tutta la lievitazione.", "Wiege das Salz immer separat: ein Gramm verändert die ganze Gärung.", "Always weigh salt separately: one gram changes the whole fermentation.", "Pesa siempre la sal aparte: un gramo cambia toda la fermentación.", "Pèse toujours le sel à part : un gramme change toute la fermentation.", "نمک را همیشه جدا وزن کن: یک گرم کل تخمیر را تغییر می‌دهد."],
    ["Prima di scalare le dosi, guarda la percentuale sulla farina: è la vera bussola.", "Bevor du die Mengen skalierst, schau auf den Prozentsatz zum Mehl: der wahre Kompass.", "Before scaling doses, look at the baker's percentage: that's the real compass.", "Antes de escalar las dosis, mira el porcentaje sobre la harina: esa es la brújula.", "Avant de convertir les doses, regarde le pourcentage boulanger : c'est la vraie boussole.", "پیش از تغییر مقادیر، درصد نانوایی را ببین: قطب‌نمای واقعی همان است."],
    ["Ogni farina ha il suo carattere: assaggiala, annusala, poi impastala.", "Jedes Mehl hat seinen Charakter: koste, rieche, dann knete.", "Every flour has its character: taste it, smell it, then knead it.", "Cada harina tiene su carácter: pruébala, huélela y luego amásala.", "Chaque farine a son caractère : goûte-la, sens-la, puis pétris-la.", "هر آردی شخصیت خود را دارد: بچش، ببو، سپس ورز بده."],
  ],
  impara: [
    ["Sbagliare una pagnotta è la lezione più gustosa che esista.", "Ein misslungenes Brot ist die leckerste Lektion überhaupt.", "A failed loaf is the tastiest lesson there is.", "Equivocarse con un pan es la lección más sabrosa que existe.", "Rater un pain est la leçon la plus savoureuse qui soit.", "خراب‌کردن یک نان، خوش‌مزه‌ترین درس دنیاست."],
    ["Comincia da un impasto solo: quando lo padroneggi, il resto è in discesa.", "Fang mit einem einzigen Teig an: beherrschst du ihn, geht der Rest leicht.", "Start with a single dough: once you master it, the rest is downhill.", "Empieza con una sola masa: cuando la domines, lo demás es cuesta abajo.", "Commence par une seule pâte : une fois maîtrisée, le reste est facile.", "با یک خمیر شروع کن: وقتی مسلط شدی، بقیه آسان است."],
    ["Le mani imparano più in fretta degli occhi: tocca l'impasto senza paura.", "Die Hände lernen schneller als die Augen: fass den Teig ohne Angst an.", "Hands learn faster than eyes: touch the dough without fear.", "Las manos aprenden más rápido que los ojos: toca la masa sin miedo.", "Les mains apprennent plus vite que les yeux : touche la pâte sans crainte.", "دست‌ها زودتر از چشم‌ها یاد می‌گیرند: بی‌ترس خمیر را لمس کن."],
  ],
  maestro: [
    ["Un laboratorio ordinato è metà del lavoro già fatto.", "Eine aufgeräumte Backstube ist die halbe Arbeit.", "A tidy lab is half the work already done.", "Un obrador ordenado es la mitad del trabajo hecho.", "Un fournil bien rangé, c'est la moitié du travail déjà faite.", "کارگاه مرتب، نیمی از کار انجام‌شده است."],
    ["Pianifica a ritroso dall'infornata: gli orari trovano posto da soli.", "Plane rückwärts vom Backen: die Zeiten fügen sich von selbst.", "Plan backwards from the bake: the timings fall into place.", "Planifica hacia atrás desde el horneado: los horarios encajan solos.", "Planifie à rebours depuis la cuisson : les horaires se placent tout seuls.", "از لحظهٔ پخت به عقب برنامه‌ریزی کن: زمان‌ها خودشان جا می‌افتند."],
    ["Conosci le tue macchine come conosci le tue mani: sarai più veloce.", "Kenne deine Maschinen wie deine Hände: du wirst schneller.", "Know your machines like your hands: you'll be faster.", "Conoce tus máquinas como tus manos: serás más rápido.", "Connais tes machines comme tes mains : tu iras plus vite.", "ماشین‌هایت را مثل دست‌هایت بشناس: سریع‌تر می‌شوی."],
  ],
  community: [
    ["Una ricetta condivisa non si dimezza: si moltiplica.", "Ein geteiltes Rezept wird nicht halbiert: es vervielfacht sich.", "A shared recipe isn't halved: it multiplies.", "Una receta compartida no se divide: se multiplica.", "Une recette partagée ne se divise pas : elle se multiplie.", "دستوری که به اشتراک بگذاری نصف نمی‌شود؛ چند برابر می‌شود."],
    ["Mostra anche i pani venuti male: da lì nascono i consigli migliori.", "Zeig auch die misslungenen Brote: daraus entstehen die besten Tipps.", "Show the loaves that went wrong too: the best tips are born there.", "Muestra también los panes fallidos: de ahí nacen los mejores consejos.", "Montre aussi les pains ratés : c'est là que naissent les meilleurs conseils.", "نان‌های ناموفق را هم نشان بده: بهترین توصیه‌ها از همان‌جا زاده می‌شوند."],
  ],
  diagnosi: [
    ["La mollica racconta la storia dell'impasto: impara a leggerla.", "Die Krume erzählt die Geschichte des Teigs: lerne, sie zu lesen.", "The crumb tells the story of the dough: learn to read it.", "La miga cuenta la historia de la masa: aprende a leerla.", "La mie raconte l'histoire de la pâte : apprends à la lire.", "مغز نان داستان خمیر را می‌گوید: خواندنش را بیاموز."],
    ["Una foto vale mille dubbi: fai analizzare la crosta prima di rifare tutto.", "Ein Foto klärt tausend Zweifel: lass die Kruste prüfen, bevor du alles neu machst.", "A photo answers a thousand doubts: analyse the crust before redoing it all.", "Una foto resuelve mil dudas: analiza la corteza antes de rehacerlo todo.", "Une photo répond à mille doutes : fais analyser la croûte avant de tout refaire.", "یک عکس هزار تردید را پاسخ می‌دهد: پیش از تکرار همه‌چیز، پوسته را تحلیل کن."],
  ],
  default: [
    ["Il grano è un dono: trattalo con rispetto e ti ripagherà.", "Getreide ist ein Geschenk: behandle es mit Respekt und es zahlt sich aus.", "Grain is a gift: treat it with respect and it'll repay you.", "El grano es un regalo: trátalo con respeto y te lo devolverá.", "Le grain est un cadeau : traite-le avec respect et il te le rendra.", "غله هدیه است: با احترام با آن رفتار کن تا جبران کند."],
    ["Poco lievito e tanto tempo: il segreto della digeribilità.", "Wenig Hefe und viel Zeit: das Geheimnis der Bekömmlichkeit.", "Little yeast and plenty of time: the secret to digestibility.", "Poca levadura y mucho tiempo: el secreto de la digestibilidad.", "Peu de levure et beaucoup de temps : le secret de la digestibilité.", "کم مخمر و زمان زیاد: راز گوارش‌پذیری."],
  ],
};

const SECTION_MAP = { news: "impara", enciclopedia: "impara", shop: "default", enterprise: "maestro" };

export default function MikilaWisdom({ section = "home" }) {
  const { lang } = useLang();
  const key = WISDOM[section] ? section : (SECTION_MAP[section] && WISDOM[SECTION_MAP[section]] ? SECTION_MAP[section] : "default");
  const pool = WISDOM[key] || WISDOM.default;
  const dayIdx = useMemo(() => {
    const d = new Date();
    return (Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)) % pool.length;
  }, [pool.length]);
  const [offset, setOffset] = useState(0);
  const i = (dayIdx + offset) % pool.length;
  const tip = pool[i];
  const text = mkTri(lang)(tip[0], tip[1], tip[2], tip[3], tip[4], tip[5]);

  return (
    <div data-testid="mikila-wisdom" className="mb-4 flex items-center gap-3 rounded-2xl border border-[#ff6b00]/25 bg-[#181818] px-3.5 py-3 shadow-sm">
      <img src="/michele-avatar.jpg" alt="Mikila" loading="lazy"
        className="w-10 h-10 rounded-full object-cover border-2 border-[#ff6b00]/40 shrink-0"
        onError={(e) => { e.currentTarget.style.display = "none"; }} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#ff6b00] flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> {mkTri(lang)("Il pizzico di sapienza di Mikila", "Mikilas Prise Weisheit", "Mikila's pinch of wisdom", "El pellizco de sabiduría de Mikila", "Le pincée de sagesse de Mikila", "چکه‌ای از خرد میکیلا")}
        </p>
        <AnimatePresence mode="wait">
          <motion.p key={i} data-testid="mikila-wisdom-text"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
            className="text-[13px] text-[#E0D5CF] leading-snug mt-0.5 italic">
            "{text}"
          </motion.p>
        </AnimatePresence>
      </div>
      <button data-testid="mikila-wisdom-next" onClick={() => setOffset((o) => o + 1)} aria-label="next tip"
        className="shrink-0 w-8 h-8 rounded-full bg-[#ff6b00]/15 border border-[#ff6b00]/30 flex items-center justify-center text-[#ff6b00] active:scale-90 transition-transform">
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
}
