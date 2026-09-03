import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles, Heart, Share2, Plus, ShieldCheck, Check, X, Loader2, Gift, PartyPopper, Image as ImageIcon, Download } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { wisdomApi, profileApi } from "@/lib/api";
import { toast } from "sonner";
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

function mmdd(dateStr) {
  if (!dateStr) return "";
  const s = String(dateStr);
  if (/^\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d)) return "";
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function MikilaWisdom({ section = "home" }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const L = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const key = WISDOM[section] ? section : (SECTION_MAP[section] && WISDOM[SECTION_MAP[section]] ? SECTION_MAP[section] : "default");
  const base = WISDOM[key] || WISDOM.default;

  const [community, setCommunity] = useState([]);
  const [offset, setOffset] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [modOpen, setModOpen] = useState(false);
  const [cardText, setCardText] = useState(null);

  const loadCommunity = useCallback(() => { wisdomApi.approved().then((r) => setCommunity(Array.isArray(r) ? r : [])).catch(() => {}); }, []);
  useEffect(() => { loadCommunity(); }, [loadCommunity]);

  // Celebrazione: quando l'utente completa una ricetta o una sfida (dura ~20s, anche cambiando sezione).
  useEffect(() => {
    const CELEB_MS = 20000;
    const startWindow = () => {
      const at = Number(sessionStorage.getItem("mikilab-celebrate-at") || 0);
      const remaining = at ? CELEB_MS - (Date.now() - at) : 0;
      if (remaining > 0) { setCelebrate(true); return setTimeout(() => setCelebrate(false), remaining); }
      setCelebrate(false); return null;
    };
    let timer = startWindow();
    const h = () => { sessionStorage.setItem("mikilab-celebrate-at", String(Date.now())); if (timer) clearTimeout(timer); timer = startWindow(); };
    window.addEventListener("mikilab-celebrate", h);
    return () => { window.removeEventListener("mikilab-celebrate", h); if (timer) clearTimeout(timer); };
  }, []);

  // Consiglio speciale personalizzato (compleanno reale o anniversario iscrizione).
  const todayMMDD = mmdd(new Date().toISOString());
  const isBirthday = user?.birthday && mmdd(user.birthday) === todayMMDD;
  const isAnniversary = user?.created_at && mmdd(user.created_at) === todayMMDD && (new Date(user.created_at).getFullYear() < new Date().getFullYear());
  const firstName = (user?.name || (user?.email || "").split("@")[0] || "").split(" ")[0];

  // Pool combinato: sezione + proverbi approvati (i più votati già in cima).
  const pool = useMemo(() => {
    const own = base.map((t) => ({ text: mkTri(lang)(t[0], t[1], t[2], t[3], t[4], t[5]), author: null, id: null }));
    const com = community.map((c) => ({
      text: (lang === "de" ? (c.text_de || c.text) : lang === "en" ? (c.text_en || c.text) : lang === "es" ? (c.text_es || c.text) : lang === "it" ? c.text : (c.text_en || c.text)),
      author: c.author_name, id: c.id, likeCount: c.like_count, likedByMe: c.liked_by_me,
    }));
    return [...com, ...own]; // i proverbi della community (più votati) compaiono per primi
  }, [base, community, lang]);

  const dayIdx = useMemo(() => {
    const d = new Date();
    return (Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)) % Math.max(1, pool.length);
  }, [pool.length]);
  const i = pool.length ? (dayIdx + offset) % pool.length : 0;
  const cur = pool[i] || { text: "", author: null, id: null };

  // Contenuto speciale ha priorità sul proverbio del giorno.
  let special = null;
  if (celebrate) special = { kind: "celebrate", Icon: PartyPopper, text: L(`Bravo${firstName ? " " + firstName : ""}! Ogni pane sfornato è una piccola vittoria 🎉`, `Bravo${firstName ? " " + firstName : ""}! Jedes gebackene Brot ist ein kleiner Sieg 🎉`, `Well done${firstName ? " " + firstName : ""}! Every loaf baked is a little victory 🎉`, `¡Bravo${firstName ? " " + firstName : ""}! Cada pan horneado es una pequeña victoria 🎉`, `Bravo${firstName ? " " + firstName : ""} ! Chaque pain cuit est une petite victoire 🎉`, `آفرین${firstName ? " " + firstName : ""}! هر نان یک پیروزی کوچک است 🎉`) };
  else if (isBirthday) special = { kind: "bday", Icon: Gift, text: L(`Buon compleanno, ${firstName || "fornaio"}! 🎂 Oggi impasta qualcosa che ami: te lo sei meritato.`, `Alles Gute zum Geburtstag, ${firstName || "Bäcker"}! 🎂 Back heute etwas, das du liebst.`, `Happy birthday, ${firstName || "baker"}! 🎂 Bake something you love today — you've earned it.`, `¡Feliz cumpleaños, ${firstName || "panadero"}! 🎂 Hornea hoy algo que ames.`, `Joyeux anniversaire, ${firstName || "boulanger"} ! 🎂 Fais aujourd'hui un pain que tu aimes.`, `تولدت مبارک، ${firstName || "نانوا"}! 🎂 امروز چیزی بپز که دوست داری.`) };
  else if (isAnniversary) special = { kind: "anniv", Icon: PartyPopper, text: L(`Oggi festeggiamo il tuo anniversario in MikiLab, ${firstName || "fornaio"}! 🥳 Grazie di far parte del nostro forno.`, `Heute feiern wir dein MikiLab-Jubiläum, ${firstName || "Bäcker"}! 🥳`, `Today we celebrate your MikiLab anniversary, ${firstName || "baker"}! 🥳 Thanks for being part of our bakery.`, `¡Hoy celebramos tu aniversario en MikiLab, ${firstName || "panadero"}! 🥳`, `Aujourd'hui, on fête ton anniversaire MikiLab, ${firstName || "boulanger"} ! 🥳`, `امروز سالگرد عضویتت در میکیلب را جشن می‌گیریم، ${firstName || "نانوا"}! 🥳`) };

  const text = special ? special.text : cur.text;
  const HeadIcon = special ? special.Icon : Sparkles;

  const likeCur = async () => {
    if (!user) { toast.message(L("Accedi per votare", "Zum Voten anmelden", "Sign in to vote", "Inicia sesión para votar", "Connecte-toi pour voter", "برای رأی وارد شو")); return; }
    if (!cur.id) return;
    setCommunity((cs) => cs.map((c) => c.id === cur.id ? { ...c, liked_by_me: !c.liked_by_me, like_count: c.like_count + (c.liked_by_me ? -1 : 1) } : c));
    try { await wisdomApi.like(cur.id); } catch { loadCommunity(); }
  };
  const shareCur = async () => {
    const msg = `"${text}" — MikiLab 🥖`;
    try { if (navigator.share) { await navigator.share({ text: msg }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(msg); toast.success(L("Copiato!", "Kopiert!", "Copied!", "¡Copiado!", "Copié !", "کپی شد!")); } catch { /* */ }
  };

  return (
    <>
      <div data-testid="mikila-wisdom" className={`mb-4 rounded-2xl border px-3.5 py-3 shadow-sm ${special ? "border-[#F26419]/50 bg-[#F26419]/12" : "border-[#F26419]/25 bg-[#18202E]"}`}>
        <div className="flex items-center gap-3">
          <img src="/michele-real-lab.jpg" alt="MikiLab" loading="lazy"
            className="w-10 h-10 rounded-full object-cover border-2 border-[#F26419]/40 shrink-0"
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#F26419] flex items-center gap-1">
              <HeadIcon className="w-3 h-3" /> {special ? L("MikiLab per te", "MikiLab für dich", "MikiLab for you", "MikiLab para ti", "MikiLab pour toi", "میکی‌لب برای تو") : L("Il pizzico di sapienza di MikiLab", "MikiLabs Prise Weisheit", "MikiLab's pinch of wisdom", "El pellizco de sabiduría de MikiLab", "La pincée de sagesse de MikiLab", "چکه‌ای از خرد میکی‌لب")}
            </p>
            <AnimatePresence mode="wait">
              <motion.p key={text} data-testid="mikila-wisdom-text"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
                className="text-[13px] text-[#E2E8F0] leading-snug mt-0.5 italic">"{text}"</motion.p>
            </AnimatePresence>
            {!special && cur.author && (
              <p className="text-[11px] text-[#E8A838] mt-0.5 font-semibold">— {cur.author}</p>
            )}
          </div>
          {!special && (
            <button data-testid="mikila-wisdom-next" onClick={() => setOffset((o) => o + 1)} aria-label="next tip"
              className="shrink-0 w-8 h-8 rounded-full bg-[#F26419]/15 border border-[#F26419]/30 flex items-center justify-center text-[#F26419] active:scale-90 transition-transform">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 pl-[52px] flex-wrap">
            {!special && cur.id != null && (
              <button data-testid="mikila-wisdom-like" onClick={likeCur}
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border transition-all active:scale-90 ${cur.likedByMe ? "bg-[#ff3b5c] text-white border-[#ff3b5c]" : "text-[#ff3b5c] border-[#ff3b5c]/40"}`}>
                <Heart className={`w-3 h-3 ${cur.likedByMe ? "fill-current" : ""}`} /> {cur.likeCount || 0}
              </button>
            )}
            <button data-testid="mikila-wisdom-share" onClick={shareCur} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F26419] px-2 py-1 rounded-full border border-[#F26419]/40 active:scale-90 transition-all">
              <Share2 className="w-3 h-3" /> {L("Condividi", "Teilen", "Share", "Compartir", "Partager", "اشتراک")}
            </button>
            <button data-testid="mikila-wisdom-card" onClick={() => setCardText({ text, author: special ? null : cur.author })} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F26419] px-2 py-1 rounded-full border border-[#F26419]/40 active:scale-90 transition-all">
              <ImageIcon className="w-3 h-3" /> {L("Crea card", "Karte erstellen", "Make card", "Crear tarjeta", "Créer carte", "ساخت کارت")}
            </button>
            <button data-testid="mikila-wisdom-propose" onClick={() => setProposeOpen(true)} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F26419] px-2 py-1 rounded-full border border-[#F26419]/40 active:scale-90 transition-all">
              <Plus className="w-3 h-3" /> {L("Proponi il tuo", "Deins vorschlagen", "Propose yours", "Propón el tuyo", "Propose le tien", "پیشنهاد بده")}
            </button>
            {user?.role === "admin" && (
              <button data-testid="mikila-wisdom-moderate" onClick={() => setModOpen(true)} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2e8b6f] px-2 py-1 rounded-full border border-[#2e8b6f]/40 active:scale-90 transition-all">
                <ShieldCheck className="w-3 h-3" /> {L("Modera", "Moderieren", "Moderate", "Moderar", "Modérer", "بررسی")}
              </button>
            )}
          </div>
      </div>
      {proposeOpen && <ProposeModal lang={lang} user={user} onClose={() => setProposeOpen(false)} />}
      {modOpen && <ModerateModal lang={lang} onClose={() => { setModOpen(false); loadCommunity(); }} />}
      {cardText && <CardModal lang={lang} text={cardText.text} author={cardText.author} onClose={() => setCardText(null)} />}
    </>
  );
}

function ProposeModal({ lang, user, onClose }) {
  const L = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [text, setText] = useState("");
  const [bday, setBday] = useState(user?.birthday ? String(user.birthday).slice(0, 10) : "");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!user) { toast.message(L("Accedi per proporre un proverbio", "Zum Vorschlagen anmelden", "Sign in to propose", "Inicia sesión para proponer", "Connecte-toi pour proposer", "برای پیشنهاد وارد شو")); return; }
    if (text.trim().length < 8) { toast.error(L("Scrivi un proverbio un po' più lungo", "Etwas länger bitte", "Write a bit more", "Escribe un poco más", "Écris un peu plus", "کمی بلندتر بنویس")); return; }
    setBusy(true);
    try {
      await wisdomApi.submit(text.trim());
      if (bday && bday !== (user?.birthday || "")) { try { await profileApi.update({ birthday: bday }); } catch { /* */ } }
      toast.success(L("Grazie! Il tuo proverbio è in revisione 🙌", "Danke! Dein Spruch wird geprüft 🙌", "Thanks! Your proverb is under review 🙌", "¡Gracias! Tu proverbio está en revisión 🙌", "Merci ! Ton proverbe est en révision 🙌", "ممنون! ضرب‌المثل شما در حال بررسی است 🙌"));
      onClose();
    } catch { toast.error(L("Errore, riprova", "Fehler", "Error, try again", "Error", "Erreur", "خطا")); }
    finally { setBusy(false); }
  };
  return (
    <div data-testid="wisdom-propose-modal" className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-3" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-[#18202E] border border-[#26324A] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[#F26419]" />
          <h3 className="font-display text-lg font-bold text-white">{L("Proponi un proverbio da fornaio", "Bäcker-Spruch vorschlagen", "Propose a baker's proverb", "Propón un proverbio panadero", "Propose un proverbe de boulanger", "یک ضرب‌المثل نانوایی پیشنهاد بده")}</h3>
        </div>
        <p className="text-[12px] text-[#AEB8BF] mb-2">{L("I migliori (più votati) entrano nella rotazione di MikiLab dopo l'ok dell'admin.", "Die beliebtesten kommen nach Admin-OK in MikiLabs Rotation.", "The most-voted enter MikiLab's rotation after admin approval.", "Los más votados entran en la rotación de MikiLab tras el OK del admin.", "Les plus votés entrent dans la rotation de MikiLab après validation admin.", "پس از تأیید ادمین، پرطرفدارها به چرخش میکی‌لب می‌آیند.")}</p>
        <textarea data-testid="wisdom-propose-text" value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={240}
          placeholder={L("Es. «Poco lievito e tanto tempo: pane più buono e leggero.»", "z.B. «Wenig Hefe, viel Zeit: besseres Brot.»", "e.g. 'Little yeast and lots of time: better bread.'", "Ej. «Poca levadura y mucho tiempo.»", "Ex. « Peu de levure, beaucoup de temps. »", "مثلاً «کم مخمر، زمان زیاد.»")}
          className="w-full bg-[#0B0E14] border border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#F26419]" />
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#AEB8BF] mt-3 mb-1">{L("Il tuo compleanno (facoltativo)", "Dein Geburtstag (optional)", "Your birthday (optional)", "Tu cumpleaños (opcional)", "Ton anniversaire (facultatif)", "تولد تو (اختیاری)")}</label>
        <input data-testid="wisdom-birthday-input" type="date" value={bday} onChange={(e) => setBday(e.target.value)}
          className="w-full bg-[#0B0E14] border border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 text-sm text-white outline-none focus:border-[#F26419]" />
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={onClose} className="rounded-2xl shadow-md border border-amber-900/40 border border-[#26324A] text-white font-semibold py-2.5 active:scale-95">{L("Annulla", "Abbrechen", "Cancel", "Cancelar", "Annuler", "لغو")}</button>
          <button data-testid="wisdom-propose-submit" disabled={busy} onClick={submit} className="rounded-2xl shadow-md border border-amber-900/40 bg-[#F26419] text-[#0B0E14] font-bold py-2.5 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {L("Invia", "Senden", "Send", "Enviar", "Envoyer", "ارسال")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModerateModal({ lang, onClose }) {
  const L = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [items, setItems] = useState(null);
  const load = useCallback(() => { wisdomApi.pending().then((r) => setItems(Array.isArray(r) ? r : [])).catch(() => setItems([])); }, []);
  useEffect(() => { load(); }, [load]);
  const act = async (id, approve) => {
    try { await (approve ? wisdomApi.approve(id) : wisdomApi.reject(id)); setItems((it) => it.filter((x) => x.id !== id)); toast.success(approve ? L("Approvato ✓", "Freigegeben ✓", "Approved ✓", "Aprobado ✓", "Approuvé ✓", "تأیید شد ✓") : L("Rifiutato", "Abgelehnt", "Rejected", "Rechazado", "Rejeté", "رد شد")); }
    catch { toast.error(L("Errore", "Fehler", "Error", "Error", "Erreur", "خطا")); }
  };
  return (
    <div data-testid="wisdom-moderate-modal" className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-3" onClick={onClose}>
      <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-3xl bg-[#18202E] border border-[#26324A] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-bold text-white flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#2e8b6f]" /> {L("Proverbi in revisione", "Sprüche in Prüfung", "Proverbs under review", "Proverbios en revisión", "Proverbes en révision", "ضرب‌المثل‌های در انتظار")}</h3>
          <button onClick={onClose} className="text-[#AEB8BF]"><X className="w-5 h-5" /></button>
        </div>
        {items === null ? <div className="py-10 text-center text-[#AEB8BF]"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
          : items.length === 0 ? <p className="py-8 text-center text-[#AEB8BF] text-sm">{L("Niente da moderare 🎉", "Nichts zu moderieren 🎉", "Nothing to moderate 🎉", "Nada que moderar 🎉", "Rien à modérer 🎉", "چیزی برای بررسی نیست 🎉")}</p>
          : (
            <div className="space-y-2.5">
              {items.map((it) => (
                <div key={it.id} data-testid={`wisdom-pending-${it.id}`} className="rounded-2xl shadow-md border border-amber-900/40 bg-[#0B0E14] border border-[#26324A] p-3">
                  <p className="text-[13px] text-white italic">"{it.text}"</p>
                  <p className="text-[11px] text-[#AEB8BF] mt-1">— {it.author_name}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button data-testid={`wisdom-approve-${it.id}`} onClick={() => act(it.id, true)} className="rounded-lg bg-[#2e8b6f] text-white font-semibold py-2 text-sm active:scale-95 flex items-center justify-center gap-1"><Check className="w-4 h-4" /> {L("Approva", "OK", "Approve", "Aprobar", "Approuver", "تأیید")}</button>
                    <button data-testid={`wisdom-reject-${it.id}`} onClick={() => act(it.id, false)} className="rounded-lg border border-[#26324A] text-[#ff3b5c] font-semibold py-2 text-sm active:scale-95 flex items-center justify-center gap-1"><X className="w-4 h-4" /> {L("Rifiuta", "Ablehnen", "Reject", "Rechazar", "Rejeter", "رد")}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

function drawWrapped(ctx, text, x, y, maxW, lh) {
  const words = String(text).split(/\s+/);
  let line = "";
  const lines = [];
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, x, startY + i * lh));
  return lines.length;
}

function CardModal({ lang, text, author, onClose }) {
  const L = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [url, setUrl] = useState(null);

  useEffect(() => {
    let alive = true;
    const S = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext("2d");
    // Sfondo
    ctx.fillStyle = "#0B0E14"; ctx.fillRect(0, 0, S, S);
    // Bordo arancio
    ctx.strokeStyle = "#F26419"; ctx.lineWidth = 14; ctx.strokeRect(28, 28, S - 56, S - 56);
    // Glow decorativo
    const g = ctx.createRadialGradient(S / 2, 200, 50, S / 2, 200, 520);
    g.addColorStop(0, "rgba(255,107,0,0.18)"); g.addColorStop(1, "rgba(255,107,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    // Testo virgolette
    ctx.fillStyle = "#F26419"; ctx.font = "bold 160px Georgia, serif"; ctx.textAlign = "center"; ctx.fillText("“", S / 2, 330);
    // Proverbio
    ctx.fillStyle = "#f2ede8"; ctx.font = "italic 600 52px Georgia, serif"; ctx.textAlign = "center";
    drawWrapped(ctx, text, S / 2, S / 2 + 20, S - 220, 74);
    // Autore
    ctx.fillStyle = "#E8A838"; ctx.font = "bold 34px Arial, sans-serif";
    ctx.fillText(author ? `— ${author}` : "— MikiLab", S / 2, S - 260);

    const finish = () => {
      // Logo
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 46px Arial, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("MikiLab 🥖", S / 2, S - 90);
      try { if (alive) setUrl(canvas.toDataURL("image/png")); } catch { if (alive) setUrl(canvas.toDataURL()); }
    };
    // Avatar cerchio
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const r = 78, cx = S / 2, cy = 150;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2); ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = "#F26419"; ctx.lineWidth = 8; ctx.stroke();
      finish();
    };
    img.onerror = finish;
    img.src = "/michele-real-lab.jpg";
    return () => { alive = false; };
  }, [text, author]);

  const shareImg = async () => {
    try {
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], "mikilab-proverbio.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: "MikiLab 🥖" }); return; }
    } catch { /* fallback download */ }
    const a = document.createElement("a"); a.href = url; a.download = "mikilab-proverbio.png"; a.click();
  };

  return (
    <div data-testid="wisdom-card-modal" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-[#18202E] border border-[#26324A] p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-bold text-white flex items-center gap-2"><ImageIcon className="w-5 h-5 text-[#F26419]" /> {L("Card condivisibile", "Teilbare Karte", "Shareable card", "Tarjeta para compartir", "Carte à partager", "کارت اشتراکی")}</h3>
          <button onClick={onClose} className="text-[#AEB8BF]"><X className="w-5 h-5" /></button>
        </div>
        {url ? <img data-testid="wisdom-card-image" src={url} alt="proverbio" className="w-full rounded-2xl" />
          : <div className="aspect-square rounded-2xl bg-[#0B0E14] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#F26419]" /></div>}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <a data-testid="wisdom-card-download" href={url || "#"} download="mikilab-proverbio.png" className={`flex items-center justify-center gap-2 rounded-2xl shadow-md border border-amber-900/40 border border-[#F26419]/40 text-white font-semibold py-2.5 text-sm active:scale-95 ${!url ? "opacity-50 pointer-events-none" : ""}`}>
            <Download className="w-4 h-4 text-[#F26419]" /> {L("Scarica", "Download", "Download", "Descargar", "Télécharger", "دانلود")}
          </a>
          <button data-testid="wisdom-card-share" disabled={!url} onClick={shareImg} className="flex items-center justify-center gap-2 rounded-2xl shadow-md border border-amber-900/40 bg-[#F26419] text-[#0B0E14] font-bold py-2.5 text-sm active:scale-95 disabled:opacity-50">
            <Share2 className="w-4 h-4" /> {L("Condividi", "Teilen", "Share", "Compartir", "Partager", "اشتراک")}
          </button>
        </div>
      </div>
    </div>
  );
}

