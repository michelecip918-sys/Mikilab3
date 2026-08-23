import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronRight, ChevronDown, Info, ChefHat, FlaskConical, Smile, BookOpen, Wrench, GraduationCap, Camera, Newspaper, Library, Laugh, ShoppingBag, Smartphone, Monitor, Building2, Users } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import MaestroSaTutto from "@/sections/MaestroSaTutto";
import { TattooSignature } from "@/components/TattooSignature";
import { recipesApi } from "@/lib/api";
import LegalPage from "@/sections/LegalPage";
import ShareInstall from "@/components/ShareInstall";
import { getProfile } from "@/components/Onboarding";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const CONCEPTS = {
  it: [
    { id: "cosa", title: "Cos'è MikiLab", icon: Info, grad: "from-[#5E8B7E] to-[#33564E]",
      body: "MikiLab è il mio laboratorio creativo e scientifico digitale dedicato all'arte bianca. Nasce per fondere la passione artigianale con lo studio metodico delle farine e dei processi fermentativi. Qui la panificazione non è una semplice sequenza di gesti, ma una costante ricerca dell'eccellenza, dove ogni ingrediente è calibrato al milligrammo per ottenere strutture perfette, digeribilità estrema e sapori autentici. È il luogo in cui la tradizione dell'arte panificatoria incontra l'innovazione e la precisione." },
    { id: "chi", title: "Chi sono io", icon: ChefHat, grad: "from-[#6E8CA0] to-[#5E7E90]",
      body: "Sono Michele, panettiere per passione prima ancora che per mestiere. Amo il farro, il lievito madre e il profumo del pane appena sfornato. Ho creato Mikilab per mettere in tasca a ogni fornaio le mie ricette e il mio modo di lavorare, con la stessa cura che metto ogni giorno in laboratorio." },
    { id: "metodo", title: "Il mio Metodo", icon: FlaskConical, grad: "from-[#6B8E62] to-[#4d6b45]",
      body: "Il mio metodo unisce la grande tradizione italiana alla precisione tecnica tedesca. Lavoro quotidianamente sia con metodi diretti sia con metodi indiretti, anche se prediligo nettamente questi ultimi: prefermenti come lievito madre, poolish, biga e precotture come il kochstück sono la vera anima delle mie ricette. Prediligere l'indiretto significa dare tempo al tempo, permettendo agli enzimi di trasformare la materia prima per ottenere una complessità aromatica unica, una crosta fragrante e un'alveolatura sviluppata. Tuttavia, amo ogni sfumatura della panificazione: la farina giusta al momento giusto e il rispetto rigoroso dei tempi sono la chiave per dominare ogni tipo di impasto." },
    { id: "serenita", title: "Lavorare in Serenità", icon: Smile, grad: "from-[#33564E] to-[#1B2127]",
      body: "Lavorare in serenità significa trasformare il laboratorio in un ambiente organizzato, efficiente e privo di stress. Con una pianificazione accurata dei tempi di fermentazione, l'uso di standard precisi e la scelta di tecniche affidabili, ogni imprevisto viene eliminato. Le piccole intuizioni pratiche, unite all'esperienza sul campo, semplificano le operazioni quotidiane rendendo il lavoro costante, sicuro e piacevole. Panificare con serenità è il segreto per esprimere la massima qualità senza mai perdere la passione per questo mestiere." },
  ],
  de: [
    { id: "cosa", title: "Was ist MikiLab", icon: Info, grad: "from-[#5E8B7E] to-[#33564E]",
      body: "MikiLab ist mein kreatives und wissenschaftliches digitales Labor für die Backkunst. Es verbindet handwerkliche Leidenschaft mit dem methodischen Studium von Mehlen und Fermentationsprozessen. Hier ist Backen keine bloße Abfolge von Handgriffen, sondern eine ständige Suche nach Exzellenz, bei der jede Zutat auf das Milligramm genau kalibriert wird – für perfekte Strukturen, höchste Bekömmlichkeit und authentische Aromen. Hier trifft die Tradition der Backkunst auf Innovation und Präzision." },
    { id: "chi", title: "Wer ich bin", icon: ChefHat, grad: "from-[#6E8CA0] to-[#5E7E90]",
      body: "Ich bin Michele, Bäcker aus Leidenschaft, noch bevor es mein Beruf wurde. Ich liebe Dinkel, Lievito Madre und den Duft von frisch gebackenem Brot. Mikilab habe ich geschaffen, um jedem Bäcker meine Rezepte und meine Arbeitsweise in die Tasche zu geben – mit der gleichen Sorgfalt, die ich täglich in die Backstube stecke." },
    { id: "metodo", title: "Meine Methode", icon: FlaskConical, grad: "from-[#6B8E62] to-[#4d6b45]",
      body: "Meine Methode verbindet die große italienische Tradition mit deutscher technischer Präzision. Ich arbeite täglich sowohl mit direkten als auch mit indirekten Methoden, bevorzuge aber klar Letztere: Vorteige wie Lievito Madre, Poolish, Biga und Kochstücke sind die wahre Seele meiner Rezepte. Indirekt zu arbeiten heißt, der Zeit Zeit zu geben, damit die Enzyme den Rohstoff verwandeln – für einzigartige Aromatik, knusprige Kruste und offene Porung. Dennoch liebe ich jede Nuance des Backens: das richtige Mehl zum richtigen Zeitpunkt und die strikte Einhaltung der Zeiten sind der Schlüssel, um jeden Teig zu beherrschen." },
    { id: "serenita", title: "Entspannt arbeiten", icon: Smile, grad: "from-[#33564E] to-[#1B2127]",
      body: "Entspannt zu arbeiten bedeutet, die Backstube in eine organisierte, effiziente und stressfreie Umgebung zu verwandeln. Mit sorgfältiger Planung der Gärzeiten, präzisen Standards und zuverlässigen Techniken werden Überraschungen ausgeschlossen. Kleine praktische Einsichten, verbunden mit Erfahrung, vereinfachen den Alltag und machen die Arbeit gleichmäßig, sicher und angenehm. Mit Gelassenheit zu backen ist das Geheimnis für höchste Qualität, ohne je die Leidenschaft für dieses Handwerk zu verlieren." },
  ],
  en: [
    { id: "cosa", title: "What is MikiLab", icon: Info, grad: "from-[#5E8B7E] to-[#33564E]",
      body: "MikiLab is my creative, scientific digital lab dedicated to the baking art. It was born to blend artisan passion with the methodical study of flours and fermentation. Here baking is not a mere sequence of gestures but a constant pursuit of excellence, where every ingredient is calibrated to the milligram for perfect structures, extreme digestibility and authentic flavours. It's where the tradition of baking meets innovation and precision." },
    { id: "chi", title: "About me", icon: ChefHat, grad: "from-[#6B8E62] to-[#4d6b45]",
      body: "I'm Michele, a baker by passion even before by trade. I love spelt, sourdough and the scent of freshly baked bread. I created Mikilab to put my recipes and my way of working into every baker's pocket, with the same care I bring to the bakery every day." },
    { id: "metodo", title: "My method", icon: FlaskConical, grad: "from-[#6B8E62] to-[#4d6b45]",
      body: "My method blends the great Italian tradition with German technical precision. I work daily with both direct and indirect methods, though I clearly prefer the latter: preferments such as sourdough, poolish, biga and pre-cooks like kochstück are the true soul of my recipes. Choosing indirect means giving time to time, letting enzymes transform the raw material for unique aromatic complexity, a fragrant crust and an open crumb. Yet I love every nuance of baking: the right flour at the right moment and strict respect for timings are the key to mastering any dough." },
    { id: "serenita", title: "Working with peace of mind", icon: Smile, grad: "from-[#33564E] to-[#1B2127]",
      body: "Working with peace of mind means turning the bakery into an organised, efficient and stress-free environment. With careful planning of fermentation times, precise standards and reliable techniques, surprises are eliminated. Small practical insights, combined with hands-on experience, simplify daily operations and make the work steady, safe and pleasant. Baking calmly is the secret to expressing top quality without ever losing the passion for this craft." },
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
  en: [
    "Freshly baked bread never asks questions… but it always knows how to make itself heard! 🍞",
    "Why is sourdough so wise? Because it spent so many nights fermenting and pondering life. 😄",
    "A baker never has a crisis: he always knows how to roll up his sleeves and knead! 💪",
    "The secret to perfect bread? Patience, good flour… and don't open the oven every two minutes! 😅",
  ],
};

const SCENE_PHRASES = {
  it: [
    "Organizzo le tue ricette 📋",
    "Pianifico la produzione in laboratorio ⏱️",
    "Calcolo dosi, idratazione e costi 🧮",
    "Ti seguo da smartphone e PC 📱💻",
  ],
  de: [
    "Ich ordne deine Rezepte 📋",
    "Ich plane die Produktion in der Backstube ⏱️",
    "Ich berechne Mengen, Hydratation und Kosten 🧮",
    "Ich begleite dich per Smartphone und PC 📱💻",
  ],
  en: [
    "I organise your recipes 📋",
    "I plan production in the bakery ⏱️",
    "I compute doses, hydration and costs 🧮",
    "I follow you on smartphone and PC 📱💻",
  ],
};

function HomeAvatarScene({ lang }) {
  const de = lang === "de";
  const phrases = SCENE_PHRASES[lang] || SCENE_PHRASES.it;
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % phrases.length), 3000);
    return () => clearInterval(id);
  }, [phrases.length]);

  return (
    <div data-testid="home-founder-photo" className="relative rounded-3xl overflow-hidden shadow-xl h-80 bg-[#2B303B]">
      {/* Avatar COMPLETO di Michele (si vede il tatuaggio sull'avambraccio) */}
      <img src={`${process.env.PUBLIC_URL}/michele-avatar-full.jpg`} alt="Michele" data-testid="home-avatar-full"
        className="absolute inset-0 w-full h-full object-contain" loading="lazy" />
      <div aria-hidden className="absolute top-0 left-0 right-0 h-1.5 z-20 pointer-events-none bg-gradient-to-r from-[#6B8E62] via-[#6E8CA0] to-[#A9C5D4]" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#2B303B]/85 via-[#2B303B]/15 to-transparent" />

      {/* Smartphone & PC che fluttuano */}
      <motion.div
        className="absolute right-4 bottom-6 w-12 h-12 rounded-2xl bg-white/90 backdrop-blur border border-white/60 shadow-lg flex items-center justify-center z-20"
        animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Smartphone className="w-6 h-6 text-[#5E8B7E]" />
      </motion.div>
      <motion.div
        className="absolute right-20 bottom-6 w-12 h-12 rounded-2xl bg-white/90 backdrop-blur border border-white/60 shadow-lg flex items-center justify-center z-20"
        animate={{ y: [0, -8, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      >
        <Monitor className="w-6 h-6 text-[#6B8E62]" />
      </motion.div>

      {/* Fumetto di testo a rotazione */}
      <div className="absolute top-4 left-4 right-4 z-30">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx} data-testid="home-scene-bubble"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4 }}
            className="inline-block max-w-[85%] bg-[#1B2127]/85 backdrop-blur-sm text-white text-[15px] font-bold leading-snug px-4 py-2.5 rounded-2xl rounded-tl-md shadow-xl ring-1 ring-white/20"
          >
            {phrases[idx]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Titolo */}
      <div className="absolute bottom-0 left-0 p-5 z-20">
        <p className="font-display text-3xl font-bold text-white">MikiLab Avatar</p>
        <p className="text-white/85 text-sm mt-0.5">{de ? "Dein digitaler Begleiter" : lang === "en" ? "Your digital companion" : "Il tuo compagno digitale"} 🇮🇹 🇩🇪 🇬🇧</p>
      </div>
    </div>
  );
}

export default function Home({ onNavigate }) {
  const { t, lang } = useLang();
  const [chat, setChat] = useState(false);
  const [legal, setLegal] = useState(false);
  const [open, setOpen] = useState(null);
  const concepts = CONCEPTS[lang] || CONCEPTS.it;
  const activeConcept = concepts.find((c) => c.id === open) || null;
  const go = (tab) => onNavigate && onNavigate(tab);
  const jokes = JOKES[lang] || JOKES.it;
  const [joke] = useState(() => jokes[Math.floor(Math.random() * jokes.length)]);
  const de = lang === "de";
  const L = (it_, de_, en_) => (de ? de_ : lang === "en" ? en_ : it_);
  const profile = getProfile();

  const [panettoni, setPanettoni] = useState([]);
  const [shopTab, setShopTab] = useState("premium");
  useEffect(() => {
    recipesApi.list("mikilab").then((rs) => {
      const p = (rs || []).filter((r) => (r.menu_category === "panettoni") || /panettone/i.test(r.name || "")).slice(0, 8);
      setPanettoni(p);
    }).catch(() => {});
  }, []);
  const focusChip = ({ panettoni: L("Tracker pH Lievito", "pH-Tracker", "pH Tracker"), pane: L("Avvia impasti", "Teige starten", "Start doughs"), brezel: L("Il mio laboratorio", "Meine Backstube", "My lab"), dolci: L("Il mio laboratorio", "Meine Backstube", "My lab") })[profile && profile.focus] || L("Il mio laboratorio", "Meine Backstube", "My lab");
  const _eq = (profile && profile.equip) || [];
  const equipChip = _eq.includes("abbattitore") || _eq.includes("cella")
    ? L("Shelf-Life & Freschezza", "Shelf-Life & Frische", "Shelf-life & freshness")
    : (_eq.includes("forno_rotativo") || _eq.includes("forno_statico"))
      ? L("Adatta il forno", "Ofen anpassen", "Adapt the oven")
      : null;

  const SECTIONS = [
    { tab: "ricette", label: t("nav_ricette"), Icon: BookOpen, grad: "from-[#5E8B7E] to-[#33564E]",
      sub: L("Le ricette col mio metodo (assaggio gratis)", "Rezepte mit meiner Methode (Gratis-Vorschau)", "Recipes with my method (free preview)") },
    { tab: "impara", label: t("nav_impara"), Icon: GraduationCap, grad: "from-[#6B8E62] to-[#4d6b45]",
      sub: L("Per chi inizia: basi e ricette semplici", "Für Anfänger: Grundlagen & einfache Rezepte", "For beginners: basics & easy recipes") },
    { tab: "news", label: t("nav_news"), Icon: Newspaper, grad: "from-[#4d6b45] to-[#374f31]",
      sub: L("Novità da Italia e Germania", "Neuigkeiten aus Italien und Deutschland", "News from Italy and Germany") },
    { tab: "maestro", label: t("nav_maestro"), Icon: Wrench, grad: "from-[#6E8CA0] to-[#5E7E90]",
      sub: L("Per professionisti: piano, costi, impasti (PRO)", "Für Profis: Arbeitsplan, Kosten, Teige (PRO)", "For pros: plan, costs, doughs (PRO)") },
    { tab: "diagnosi", label: t("nav_foto"), Icon: Camera, grad: "from-[#7E8A93] to-[#6B7680]",
      sub: L("Scopri i difetti del pane da una foto (PRO)", "Brotfehler per Foto erkennen (PRO)", "Spot bread defects from a photo (PRO)") },
    { tab: "enterprise", label: "Enterprise", Icon: Building2, grad: "from-[#33564E] to-[#1B2127]",
      sub: L("Multi-negozio e ordini fornitori (PRO)", "Multi-Filiale und Lieferantenbestellungen (PRO)", "Multi-store and supplier orders (PRO)") },
    { tab: "enciclopedia", label: t("nav_enciclopedia"), Icon: Library, grad: "from-[#33564E] to-[#1B2127]",
      sub: L("Tutte le basi spiegate", "Alle Grundlagen erklärt", "All the basics explained") },
    { tab: "shop", label: "Shop & Academy", Icon: ShoppingBag, grad: "from-[#33564E] to-[#33564E]",
      sub: L("Panettoni & corsi — in arrivo", "Panettoni & Kurse — bald verfügbar", "Panettoni & courses — coming soon") },
  ];

  if (chat) {
    return (
      <div className="pb-4">
        <button data-testid="home-back-btn" onClick={() => setChat(false)} className="flex items-center gap-1 text-[#5E8B7E] font-medium mb-4">
          <ChevronRight className="w-5 h-5 rotate-180" /> Home
        </button>
        <MaestroSaTutto />
      </div>
    );
  }

  if (legal) {
    return (
      <div className="pb-4">
        <button data-testid="legal-back-btn" onClick={() => setLegal(false)} className="flex items-center gap-1 text-[#5E8B7E] font-medium mb-4">
          <ChevronRight className="w-5 h-5 rotate-180" /> Home
        </button>
        <LegalPage />
      </div>
    );
  }

  return (
    <div className="pb-2 space-y-6">
      {/* Card in alto: avatar digitale animato (finto video) */}
      <HomeAvatarScene lang={lang} />

      {/* Dashboard personalizzata dall'onboarding */}
      {profile && (
        <div data-testid="home-personal" className="rounded-3xl bg-[#6E8CA0]/12 border border-[#6E8CA0]/30 p-4">
          <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#EAF0EC]">
            {L("Ciao", "Hallo", "Hi")}{profile.labName ? `, ${profile.labName}` : ""}! 👋
          </p>
          <p className="text-xs text-[#7E8A93] mb-3">{L("Le tue scorciatoie rapide", "Deine Schnellzugriffe", "Your quick shortcuts")}</p>
          <div className="flex flex-wrap gap-2">
            <button data-testid="home-quick-ricette" onClick={() => go("ricette")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#5E8B7E] text-white text-sm font-semibold active:scale-97">
              <BookOpen className="w-4 h-4" /> {L("Le mie ricette", "Meine Rezepte", "My recipes")}
            </button>
            <button data-testid="home-quick-diagnosi" onClick={() => go("diagnosi")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#B34A26] text-white text-sm font-semibold active:scale-97">
              <Camera className="w-4 h-4" /> {L("Diagnosi Foto", "Foto-Diagnose", "Photo diagnosis")}
            </button>
            <button data-testid="home-quick-focus" onClick={() => go("maestro")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white dark:bg-[#232A31] border border-[#6E8CA0]/40 text-[#2B303B] dark:text-[#EAF0EC] text-sm font-semibold active:scale-97">
              <Wrench className="w-4 h-4 text-[#6E8CA0]" /> {focusChip}
            </button>
            {equipChip && (
              <button data-testid="home-quick-equip" onClick={() => go("maestro")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white dark:bg-[#232A31] border border-[#6E8CA0]/40 text-[#2B303B] dark:text-[#EAF0EC] text-sm font-semibold active:scale-97">
                <Wrench className="w-4 h-4 text-[#6E8CA0]" /> {equipChip}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Card Community */}
      <button data-testid="home-community-card" onClick={() => go("community")}
        className="w-full text-left rounded-3xl overflow-hidden p-5 text-white flex items-center gap-4 active:scale-98 transition-all shadow-lg mb-4"
        style={{ backgroundImage: "linear-gradient(135deg,#6E8CA0,#3f5b6b)" }}>
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Users className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold">{L("Community MikiLab", "MikiLab Community", "MikiLab Community")}</p>
          <p className="text-sm text-white/85">{L("Confrontati con altri fornai: domande, foto e consigli.", "Tausche dich mit anderen Bäckern aus: Fragen, Fotos, Tipps.", "Connect with other bakers: questions, photos and tips.")}</p>
        </div>
        <ChevronRight className="w-5 h-5 ml-auto shrink-0" />
      </button>


      <div data-testid="bio-card" className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#5E8B7E] to-[#33564E] text-white shadow-xl p-7 text-center">
        <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Mikilab" data-testid="bio-logo"
          className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[#A9C5D4]/70 shadow-lg mx-auto mb-4" />
        <h1 className="font-display text-3xl font-bold">Mikilab</h1>
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/75 mt-2">{t("brand_subtitle")} <span>🇮🇹</span> <span>🇩🇪</span></p>
      </div>

      {/* Blocco promozionale in evidenza */}
      <div data-testid="home-promo" className="rounded-3xl bg-[#EAF0EC] dark:bg-[#1F252B] border border-[#6E8CA0]/40 shadow-md p-5 flex items-start gap-4">
        <img src={`${process.env.PUBLIC_URL}/michele-avatar.jpg`} alt="Michele" loading="lazy"
          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#6E8CA0]/50 shrink-0"
          onError={(e) => { e.currentTarget.style.display = "none"; }} />
        <p className="text-sm text-[#3F4A54] dark:text-[#EAF0EC] leading-relaxed">
          {L(
            "Un sito pensato per organizzare il lavoro proprio come lo faresti tu. Dalla gestione dettagliata delle ricette alla lista della spesa, fino alla pianificazione precisa della produzione in laboratorio. In più, con l'aiuto dell'AI potrai calcolare, adattare e gestire ogni fase senza margine di errore: tu pensi al laboratorio, al resto ci pensiamo noi.",
            "Eine Website, die die Arbeit genau so organisiert, wie du es tun würdest. Von der detaillierten Rezeptverwaltung über die Einkaufsliste bis zur präzisen Produktionsplanung in der Backstube. Und mit Hilfe der KI kannst du jede Phase ohne Fehler berechnen, anpassen und steuern: Du kümmerst dich um die Backstube, um den Rest kümmern wir uns.",
            "A website designed to organise the work exactly as you would. From detailed recipe management to the shopping list, all the way to precise production planning in the bakery. Plus, with AI's help you can calculate, adapt and manage every stage with no margin for error: you focus on the bakery, we take care of the rest."
          )}
        </p>
      </div>

      {/* 4 concetti — accordion: si espandono verso il basso con foto e testo */}
      <div className="space-y-4">
        {concepts.map((c) => {
          const Icon = c.icon;
          const isOpen = open === c.id;
          return (
            <div key={c.id} data-testid={`concept-block-${c.id}`}>
              <button data-testid={`home-concept-${c.id}`} onClick={() => setOpen(isOpen ? null : c.id)}
                className={`w-full flex items-center gap-4 rounded-3xl p-6 text-white shadow-lg active:scale-98 transition-all bg-gradient-to-br ${c.grad} ${isOpen ? "rounded-b-none" : ""}`}>
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="font-display text-xl font-bold">{c.title}</h3>
                  <p className="text-white/70 text-[11px] font-medium">{isOpen ? t("home_tap_open") : t("home_tap_open")}</p>
                </div>
                <ChevronDown className={`w-6 h-6 text-white/90 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                    <div data-testid={`concept-content-${c.id}`} className="rounded-b-3xl bg-white dark:bg-[#1F252B] border border-t-0 border-[#D7E1DB] dark:border-[#38424B] overflow-hidden">
                      {CONCEPT_PHOTOS[c.id] && (
                        <img src={CONCEPT_PHOTOS[c.id]} alt={c.title}
                          data-testid={`concept-photo-${c.id}`} className="w-full h-52 object-cover" loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      )}
                      <p className="p-6 text-[15px] leading-relaxed text-[#3F4A54] dark:text-[#AEB8BF] whitespace-pre-line">{c.body}</p>
                      {c.id === "chi" && (
                        <div className="px-6 pb-6 -mt-2">
                          <TattooSignature testid="home-chi-signature" />
                        </div>
                      )}
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
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93] mb-2 px-1">{t("home_tap_open")}</p>

        {/* Due mondi: professionisti + principianti */}
        <div data-testid="home-audiences" className="grid grid-cols-1 gap-2.5 mb-3">
          <div className="rounded-2xl bg-[#6E8CA0]/10 border border-[#6E8CA0]/30 p-4">
            <p className="font-display text-base font-bold text-[#2B303B] dark:text-[#EAF0EC] flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#5E8B7E]" /> {L("Per professionisti · «Il Tuo Laboratorio»", "Für Profis · „Dein Labor“", "For pros · “Your Lab”")}
            </p>
            <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-1 leading-snug">
              {L("Piano di produzione giornaliero/settimanale, calcolo costi, gestione celle e pulizie, affiancato dall'IA per rigenerare impasti e processi.",
                 "Täglicher/wöchentlicher Produktionsplan, Kostenrechnung, Zellen- und Reinigungsverwaltung, unterstützt von der KI zum Regenerieren von Teigen und Prozessen.",
                 "Daily/weekly production plan, cost calculation, cell and cleaning management, backed by AI to regenerate doughs and processes.")}
            </p>
          </div>
          <div className="rounded-2xl bg-[#6B8E62]/10 border border-[#6B8E62]/30 p-4">
            <p className="font-display text-base font-bold text-[#2B303B] dark:text-[#EAF0EC] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#4d6b45]" /> {L("Per chi inizia · Sezione Principianti", "Für Anfänger · Sektion Anfänger", "For beginners · Beginners section")}
            </p>
            <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-1 leading-snug">
              {L("I primi passi nell'Arte Bianca: guide passo-passo, basi della panificazione e ricette semplificate.",
                 "Erste Schritte in der Backkunst: geführte Anleitungen, Grundlagen und vereinfachte Rezepte.",
                 "First steps in the baking art: step-by-step guides, baking basics and simplified recipes.")}
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
      <div data-testid="home-joke" className="flex items-start gap-3 rounded-2xl bg-[#6E8CA0]/12 border border-[#6E8CA0]/30 p-4">
        <Laugh className="w-5 h-5 text-[#5E8B7E] shrink-0 mt-0.5" />
        <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] italic leading-relaxed">{joke}</p>
      </div>

      {/* MikiLab Shop & Corsi — in fondo alla Home */}
      <div data-testid="home-shop-corsi" className="mb-4">
        <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#EAF0EC] mb-2">{L("MikiLab Shop & Corsi", "MikiLab Shop & Kurse", "MikiLab Shop & Courses")}</p>
        <div className="grid grid-cols-2 gap-1.5 bg-[#EAF0EC] dark:bg-[#1F252B] p-1.5 rounded-2xl mb-3 border border-[#D7E1DB] dark:border-[#38424B]">
          <button data-testid="shop-tab-premium" onClick={() => setShopTab("premium")}
            className={`py-2 rounded-xl text-sm font-semibold transition-all ${shopTab === "premium" ? "bg-[#5E8B7E] text-white shadow" : "text-[#7E8A93]"}`}>
            {L("Ricettari & Premium", "Rezepte & Premium", "Recipes & Premium")}
          </button>
          <button data-testid="shop-tab-corsi" onClick={() => setShopTab("corsi")}
            className={`py-2 rounded-xl text-sm font-semibold transition-all ${shopTab === "corsi" ? "bg-[#5E8B7E] text-white shadow" : "text-[#7E8A93]"}`}>
            {L("Corsi & Formazione", "Kurse & Ausbildung", "Courses & Training")}
          </button>
        </div>

        {shopTab === "premium" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[#7E8A93]">{L("I nostri Panettoni", "Unsere Panettone", "Our Panettoni")}</p>
              <button data-testid="home-panettoni-all" onClick={() => go("ricette")} className="text-xs font-semibold text-[#B34A26] flex items-center gap-0.5">{L("Vedi tutti", "Alle", "See all")} <ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
            {panettoni.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {panettoni.map((r) => (
                  <button key={r.id} data-testid={`home-panettone-${r.id}`} onClick={() => go("ricette")} className="shrink-0 w-36 text-left active:scale-97 transition-all">
                    <div className="w-36 h-36 rounded-2xl overflow-hidden bg-[#EAF0EC] dark:bg-[#232A31] relative">
                      {r.image_url ? <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ChefHat className="w-8 h-8 text-[#B34A26]/50" /></div>}
                      <span className="absolute bottom-1 right-1 text-[10px] font-bold bg-[#B34A26] text-white px-1.5 py-0.5 rounded-full">€4,99</span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-[#2B303B] dark:text-[#EAF0EC] leading-tight line-clamp-2">{r.name}</p>
                  </button>
                ))}
              </div>
            )}
            <button data-testid="home-panettoni-cta" onClick={() => go("ricette")} className="w-full mt-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#B34A26] to-[#8a3a1e] text-white font-semibold px-4 py-2.5 rounded-2xl active:scale-98 transition-all">
              {L("Sblocca ricette e masterclass", "Rezepte & Masterclass freischalten", "Unlock recipes & masterclass")}
            </button>
          </div>
        )}

        {shopTab === "corsi" && (
          <div data-testid="shop-corsi-content" className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#6B8E62]/15 flex items-center justify-center mx-auto mb-2"><GraduationCap className="w-6 h-6 text-[#6B8E62]" /></div>
            <p className="font-display font-bold text-[#2B303B] dark:text-[#EAF0EC]">{L("Corsi & Formazione", "Kurse & Ausbildung", "Courses & Training")}</p>
            <span className="inline-block mt-2 text-[11px] font-bold bg-[#6E8CA0] text-white px-2.5 py-1 rounded-full uppercase tracking-wide">{L("Prossimamente · In Arrivo", "Demnächst", "Coming Soon")}</span>
            <p className="text-sm text-[#7E8A93] mt-2">{L("I corsi di panificazione e pasticceria firmati Michele stanno arrivando. Resta sintonizzato!", "Michele's Back- und Konditoreikurse kommen bald. Bleib dran!", "Michele's baking & pastry courses are coming soon. Stay tuned!")}</p>
          </div>
        )}
      </div>

      {/* Condividi & Installa app */}
      <ShareInstall />

      {/* Footer legale */}
      <button data-testid="home-legal-link" onClick={() => setLegal(true)}
        className="w-full text-center text-xs text-[#7E8A93] underline underline-offset-2 py-2">
        {L("Note legali & Privacy", "Impressum & Datenschutz", "Legal notice & Privacy")}
      </button>
    </div>
  );
}
