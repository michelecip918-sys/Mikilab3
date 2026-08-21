import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronRight, ChevronDown, Info, ChefHat, FlaskConical, Smile, BookOpen, Wrench, GraduationCap, Camera, Newspaper, Library, Laugh, ShoppingBag } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import MaestroSaTutto from "@/sections/MaestroSaTutto";
import LegalPage from "@/sections/LegalPage";
import ShareInstall from "@/components/ShareInstall";

const CONCEPTS = {
  it: [
    { id: "cosa", title: "Cos'è MikiLab", icon: Info, grad: "from-[#B34A26] to-[#8C3A1D]",
      body: "MikiLab è il mio laboratorio creativo e scientifico digitale dedicato all'arte bianca. Nasce per fondere la passione artigianale con lo studio metodico delle farine e dei processi fermentativi. Qui la panificazione non è una semplice sequenza di gesti, ma una costante ricerca dell'eccellenza, dove ogni ingrediente è calibrato al milligrammo per ottenere strutture perfette, digeribilità estrema e sapori autentici. È il luogo in cui la tradizione dell'arte panificatoria incontra l'innovazione e la precisione." },
    { id: "chi", title: "Chi sono io", icon: ChefHat, grad: "from-[#D99B26] to-[#B8801a]",
      body: "Sono Michele, panettiere per passione prima ancora che per mestiere. Amo il farro, il lievito madre e il profumo del pane appena sfornato. Ho creato Mikilab per mettere in tasca a ogni fornaio le mie ricette e il mio modo di lavorare, con la stessa cura che metto ogni giorno in laboratorio." },
    { id: "metodo", title: "Il mio Metodo", icon: FlaskConical, grad: "from-[#6B8E62] to-[#4d6b45]",
      body: "Il mio metodo unisce la grande tradizione italiana alla precisione tecnica tedesca. Lavoro quotidianamente sia con metodi diretti sia con metodi indiretti, anche se prediligo nettamente questi ultimi: prefermenti come lievito madre, poolish, biga e precotture come il kochstück sono la vera anima delle mie ricette. Prediligere l'indiretto significa dare tempo al tempo, permettendo agli enzimi di trasformare la materia prima per ottenere una complessità aromatica unica, una crosta fragrante e un'alveolatura sviluppata. Tuttavia, amo ogni sfumatura della panificazione: la farina giusta al momento giusto e il rispetto rigoroso dei tempi sono la chiave per dominare ogni tipo di impasto." },
    { id: "serenita", title: "Lavorare in Serenità", icon: Smile, grad: "from-[#3a2d27] to-[#1A1412]",
      body: "Lavorare in serenità significa trasformare il laboratorio in un ambiente organizzato, efficiente e privo di stress. Con una pianificazione accurata dei tempi di fermentazione, l'uso di standard precisi e la scelta di tecniche affidabili, ogni imprevisto viene eliminato. Le piccole intuizioni pratiche, unite all'esperienza sul campo, semplificano le operazioni quotidiane rendendo il lavoro costante, sicuro e piacevole. Panificare con serenità è il segreto per esprimere la massima qualità senza mai perdere la passione per questo mestiere." },
  ],
  de: [
    { id: "cosa", title: "Was ist MikiLab", icon: Info, grad: "from-[#B34A26] to-[#8C3A1D]",
      body: "MikiLab ist mein kreatives und wissenschaftliches digitales Labor für die Backkunst. Es verbindet handwerkliche Leidenschaft mit dem methodischen Studium von Mehlen und Fermentationsprozessen. Hier ist Backen keine bloße Abfolge von Handgriffen, sondern eine ständige Suche nach Exzellenz, bei der jede Zutat auf das Milligramm genau kalibriert wird – für perfekte Strukturen, höchste Bekömmlichkeit und authentische Aromen. Hier trifft die Tradition der Backkunst auf Innovation und Präzision." },
    { id: "chi", title: "Wer ich bin", icon: ChefHat, grad: "from-[#D99B26] to-[#B8801a]",
      body: "Ich bin Michele, Bäcker aus Leidenschaft, noch bevor es mein Beruf wurde. Ich liebe Dinkel, Lievito Madre und den Duft von frisch gebackenem Brot. Mikilab habe ich geschaffen, um jedem Bäcker meine Rezepte und meine Arbeitsweise in die Tasche zu geben – mit der gleichen Sorgfalt, die ich täglich in die Backstube stecke." },
    { id: "metodo", title: "Meine Methode", icon: FlaskConical, grad: "from-[#6B8E62] to-[#4d6b45]",
      body: "Meine Methode verbindet die große italienische Tradition mit deutscher technischer Präzision. Ich arbeite täglich sowohl mit direkten als auch mit indirekten Methoden, bevorzuge aber klar Letztere: Vorteige wie Lievito Madre, Poolish, Biga und Kochstücke sind die wahre Seele meiner Rezepte. Indirekt zu arbeiten heißt, der Zeit Zeit zu geben, damit die Enzyme den Rohstoff verwandeln – für einzigartige Aromatik, knusprige Kruste und offene Porung. Dennoch liebe ich jede Nuance des Backens: das richtige Mehl zum richtigen Zeitpunkt und die strikte Einhaltung der Zeiten sind der Schlüssel, um jeden Teig zu beherrschen." },
    { id: "serenita", title: "Entspannt arbeiten", icon: Smile, grad: "from-[#3a2d27] to-[#1A1412]",
      body: "Entspannt zu arbeiten bedeutet, die Backstube in eine organisierte, effiziente und stressfreie Umgebung zu verwandeln. Mit sorgfältiger Planung der Gärzeiten, präzisen Standards und zuverlässigen Techniken werden Überraschungen ausgeschlossen. Kleine praktische Einsichten, verbunden mit Erfahrung, vereinfachen den Alltag und machen die Arbeit gleichmäßig, sicher und angenehm. Mit Gelassenheit zu backen ist das Geheimnis für höchste Qualität, ohne je die Leidenschaft für dieses Handwerk zu verlieren." },
    { id: "serenita", title: "Entspannt arbeiten", icon: Smile, grad: "from-[#3a2d27] to-[#1A1412]",
      body: "Arbeite völlig entspannt und ohne Stress: Mit Mikilab ist es fast so, als stünde ich neben dir am Ofen und führe dich Schritt für Schritt … mit dem Vorteil, dass ich dich nicht anschreie, wenn du eine Auffrischung verpatzt! 😄" },
  ],
};

const CONCEPT_PHOTOS = {
  cosa: `${process.env.PUBLIC_URL}/bio-dough.jpg`,
  chi: `${process.env.PUBLIC_URL}/michele-avatar.jpg`,
  metodo: `${process.env.PUBLIC_URL}/bio-dough-2.jpg`,
  serenita: `${process.env.PUBLIC_URL}/bio-dough-3.jpg`,
};

const JOKES = {
  it: [
    "Il pane appena sfornato non fa mai domande… ma sa sempre come farsi ascoltare! 🍞",
    "Perché il lievito madre è così saggio? Perché ha passato tantissime notti a lievitare pensando alla vita. 😄",
    "Un fornaio non va mai in crisi: sa sempre come rimboccarsi le maniche e impastare! 💪",
    "Il segreto del pane perfetto? Pazienza, farina buona… e non aprire il forno ogni due minuti! 😅",
  ],
  de: [
    "Frisch gebackenes Brot stellt keine Fragen … weiß aber immer, wie man ihm zuhört! 🍞",
    "Warum ist der Sauerteig so weise? Weil er so viele Nächte mit Nachdenken über das Leben gegärt hat. 😄",
    "Ein Bäcker gerät nie in die Krise: Er weiß immer, wie man die Ärmel hochkrempelt und knetet! 💪",
    "Das Geheimnis des perfekten Brots? Geduld, gutes Mehl … und den Ofen nicht alle zwei Minuten öffnen! 😅",
  ],
};

export default function Home({ onNavigate }) {
  const { t, lang } = useLang();
  const [chat, setChat] = useState(false);
  const [legal, setLegal] = useState(false);
  const [open, setOpen] = useState(null);
  const concepts = CONCEPTS[lang === "de" ? "de" : "it"];
  const go = (tab) => onNavigate && onNavigate(tab);
  const jokes = JOKES[lang === "de" ? "de" : "it"];
  const [joke] = useState(() => jokes[Math.floor(Math.random() * jokes.length)]);
  const de = lang === "de";

  const SECTIONS = [
    { tab: "ricette", label: t("nav_ricette"), Icon: BookOpen, grad: "from-[#B34A26] to-[#8C3A1D]",
      sub: de ? "43 Rezepte mit meiner Methode (Gratis-Vorschau)" : "43 ricette col mio metodo (assaggio gratis)" },
    { tab: "impara", label: t("nav_impara"), Icon: GraduationCap, grad: "from-[#6B8E62] to-[#4d6b45]",
      sub: de ? "Für Anfänger: Grundlagen & einfache Rezepte" : "Per chi inizia: basi e ricette semplici" },
    { tab: "news", label: t("nav_news"), Icon: Newspaper, grad: "from-[#4d6b45] to-[#374f31]",
      sub: de ? "Neuigkeiten aus IT, Stuttgart und DE" : "Novità da Italia, Stoccarda e Germania" },
    { tab: "maestro", label: t("nav_maestro"), Icon: Wrench, grad: "from-[#D99B26] to-[#B8801a]",
      sub: de ? "Für Profis: Arbeitsplan, Kosten, Teige (PRO)" : "Per professionisti: piano, costi, impasti (PRO)" },
    { tab: "diagnosi", label: t("nav_foto"), Icon: Camera, grad: "from-[#8C7567] to-[#5f4f45]",
      sub: de ? "Brotfehler per Foto erkennen (PRO)" : "Scopri i difetti del pane da una foto (PRO)" },
    { tab: "enciclopedia", label: t("nav_enciclopedia"), Icon: Library, grad: "from-[#3a2d27] to-[#1A1412]",
      sub: de ? "Alle Grundlagen erklärt" : "Tutte le basi spiegate" },
    { tab: "shop", label: de ? "Shop & Academy" : "Shop & Academy", Icon: ShoppingBag, grad: "from-[#8C3A1D] to-[#5f2410]",
      sub: de ? "Panettoni & Kurse — bald verfügbar" : "Panettoni & corsi — in arrivo" },
  ];

  if (chat) {
    return (
      <div className="pb-4">
        <button data-testid="home-back-btn" onClick={() => setChat(false)} className="flex items-center gap-1 text-[#B34A26] font-medium mb-4">
          <ChevronRight className="w-5 h-5 rotate-180" /> Home
        </button>
        <MaestroSaTutto />
      </div>
    );
  }

  if (legal) {
    return (
      <div className="pb-4">
        <button data-testid="legal-back-btn" onClick={() => setLegal(false)} className="flex items-center gap-1 text-[#B34A26] font-medium mb-4">
          <ChevronRight className="w-5 h-5 rotate-180" /> Home
        </button>
        <LegalPage />
      </div>
    );
  }

  return (
    <div className="pb-2 space-y-6">
      {/* Hero compatto */}
      <div data-testid="bio-card" className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] text-white shadow-xl p-7 text-center">
        <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Mikilab" data-testid="bio-logo"
          className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[#FFCE00]/70 shadow-lg mx-auto mb-4" />
        <h1 className="font-display text-3xl font-bold">Mikilab</h1>
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/75 mt-2">{t("brand_subtitle")} <span>🇮🇹</span> <span>🇩🇪</span></p>
      </div>

      {/* Blocco promozionale in evidenza */}
      <div data-testid="home-promo" className="rounded-3xl bg-[#FFF7E8] dark:bg-[#241D19] border border-[#D99B26]/40 shadow-md p-5 flex items-start gap-4">
        <img src={`${process.env.PUBLIC_URL}/michele-avatar.jpg`} alt="Michele" loading="lazy"
          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#D99B26]/50 shrink-0"
          onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <p className="text-sm text-[#4A3B34] dark:text-[#E9DCCB] leading-relaxed">
          {de
            ? "Eine Website, die die Arbeit genau so organisiert, wie du es tun würdest. Von der detaillierten Rezeptverwaltung über die Einkaufsliste bis zur präzisen Produktionsplanung in der Backstube. Und mit Hilfe der KI kannst du jede Phase ohne Fehler berechnen, anpassen und steuern: Du kümmerst dich um die Backstube, um den Rest kümmern wir uns."
            : "Un sito pensato per organizzare il lavoro proprio come lo faresti tu. Dalla gestione dettagliata delle ricette alla lista della spesa, fino alla pianificazione precisa della produzione in laboratorio. In più, con l'aiuto dell'AI potrai calcolare, adattare e gestire ogni fase senza margine di errore: tu pensi al laboratorio, al resto ci pensiamo noi."}
        </p>
      </div>

      {/* 4 concetti (in alto) */}
      <div className="space-y-4">
        {concepts.map((c) => {
          const isOpen = open === c.id;
          const Icon = c.icon;
          return (
            <div key={c.id} data-testid={`home-concept-${c.id}`}>
              <button onClick={() => setOpen(isOpen ? null : c.id)}
                className={`w-full flex items-center gap-4 rounded-3xl p-6 text-white shadow-lg active:scale-98 transition-all bg-gradient-to-br ${c.grad}`}>
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="font-display text-xl font-bold">{c.title}</h3>
                  <p className="text-white/70 text-[11px] font-medium">{t("home_tap_open")}</p>
                </div>
                {isOpen ? <ChevronDown className="w-6 h-6 text-white/80 shrink-0" /> : <ChevronRight className="w-6 h-6 text-white/80 shrink-0" />}
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="mt-2 rounded-3xl bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] overflow-hidden">
                      {CONCEPT_PHOTOS[c.id] && (
                        <img src={CONCEPT_PHOTOS[c.id]} alt={c.title} data-testid={`concept-photo-${c.id}`} className="w-full h-52 object-cover" loading="lazy" />
                      )}
                      <p className="p-6 text-[15px] leading-relaxed text-[#4A3B34] dark:text-[#C9BBB0]">{c.body}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Menu principale — subito sotto i blocchi */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#8C7567] mb-2 px-1">{t("home_tap_open")}</p>

        {/* Due mondi: professionisti + principianti */}
        <div data-testid="home-audiences" className="grid grid-cols-1 gap-2.5 mb-3">
          <div className="rounded-2xl bg-[#D99B26]/10 border border-[#D99B26]/30 p-4">
            <p className="font-display text-base font-bold text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#B34A26]" /> {de ? "Für Profis · „Dein Labor“" : "Per professionisti · «Il Tuo Laboratorio»"}
            </p>
            <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-1 leading-snug">
              {de ? "Täglicher/wöchentlicher Produktionsplan, Kostenrechnung, Zellen- und Reinigungsverwaltung, unterstützt von der KI zum Regenerieren von Teigen und Prozessen."
                  : "Piano di produzione giornaliero/settimanale, calcolo costi, gestione celle e pulizie, affiancato dall'IA per rigenerare impasti e processi."}
            </p>
          </div>
          <div className="rounded-2xl bg-[#6B8E62]/10 border border-[#6B8E62]/30 p-4">
            <p className="font-display text-base font-bold text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#4d6b45]" /> {de ? "Für Anfänger · Sektion Anfänger" : "Per chi inizia · Sezione Principianti"}
            </p>
            <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-1 leading-snug">
              {de ? "Erste Schritte in der Backkunst: geführte Anleitungen, Grundlagen und vereinfachte Rezepte."
                  : "I primi passi nell'Arte Bianca: guide passo-passo, basi della panificazione e ricette semplificate."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3" data-testid="home-sections">
          {SECTIONS.map(({ tab, label, Icon, grad, sub }) => (
            <button key={tab} data-testid={`home-section-${tab}`} onClick={() => go(tab)}
              className={`flex flex-col gap-1 rounded-2xl p-4 text-white shadow-md active:scale-97 transition-all bg-gradient-to-br ${grad} min-h-[104px]`}>
              <div className="flex items-center gap-2">
                <Icon className="w-6 h-6 shrink-0" />
                <span className="font-display text-base font-bold text-left leading-tight flex-1">{label}</span>
                <ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
              </div>
              {sub && <span className="text-[11px] text-white/85 leading-snug text-left">{sub}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Chiedi al Maestro */}
      <button data-testid="home-chat-btn" onClick={() => setChat(true)}
        className="w-full flex items-center gap-4 rounded-3xl p-6 bg-gradient-to-br from-[#6B8E62] to-[#4d6b45] text-white shadow-lg active:scale-98 transition-all">
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
          <MessageCircle className="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h3 className="font-display text-xl font-bold">{t("home_chat_btn")}</h3>
          <p className="text-white/85 text-sm">{t("home_chat_sub")}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-white/80 shrink-0" />
      </button>

      {/* Battuta del giorno */}
      <div data-testid="home-joke" className="flex items-start gap-3 rounded-2xl bg-[#D99B26]/12 border border-[#D99B26]/30 p-4">
        <Laugh className="w-5 h-5 text-[#B34A26] shrink-0 mt-0.5" />
        <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] italic leading-relaxed">{joke}</p>
      </div>

      {/* Condividi & Installa app */}
      <ShareInstall />

      {/* Footer legale */}
      <button data-testid="home-legal-link" onClick={() => setLegal(true)}
        className="w-full text-center text-xs text-[#8C7567] underline underline-offset-2 py-2">
        {lang === "de" ? "Impressum & Datenschutz" : "Note legali & Privacy"}
      </button>
    </div>
  );
}
