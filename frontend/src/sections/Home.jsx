import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronRight, ChevronDown, Info, ChefHat, FlaskConical, Smile, BookOpen, Wrench, GraduationCap, Laugh, ShoppingBag, Smartphone, Monitor, Users, Activity, Hand, Clock, MapPin, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import MaestroSaTutto from "@/sections/MaestroSaTutto";
import { TattooSignature } from "@/components/TattooSignature";
import { recipesApi } from "@/lib/api";
import LegalPage from "@/sections/LegalPage";
import ShareInstall from "@/components/ShareInstall";
import HomeNews from "@/components/HomeNews";
import { getProfile } from "@/components/Onboarding";
import { getLevelProgress } from "@/lib/level";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const CONCEPTS = {
  it: [
    { id: "cosa", title: "Cos'è MikiLab", icon: Info, grad: "from-[#3f7cac] to-[#234b6e]",
      body: "MikiLab è il mio laboratorio creativo e scientifico digitale dedicato all'arte bianca. Nasce per fondere la passione artigianale con lo studio metodico delle farine e dei processi fermentativi. Qui la panificazione non è una semplice sequenza di gesti, ma una costante ricerca dell'eccellenza, dove ogni ingrediente è calibrato al milligrammo per ottenere strutture perfette, digeribilità estrema e sapori autentici. È il luogo in cui la tradizione dell'arte panificatoria incontra l'innovazione e la precisione." },
    { id: "chi", title: "Chi sono io", icon: ChefHat, grad: "from-[#6E8CA0] to-[#5E7E90]",
      body: "Sono Michele, panettiere per passione prima ancora che per mestiere. Amo il farro, il lievito madre e il profumo del pane appena sfornato. Ho creato Mikilab per mettere in tasca a ogni fornaio le mie ricette e il mio modo di lavorare, con la stessa cura che metto ogni giorno in laboratorio." },
    { id: "metodo", title: "Il mio Metodo", icon: FlaskConical, grad: "from-[#5aa0cf] to-[#2e6690]",
      body: "Il mio metodo unisce la grande tradizione italiana alla precisione tecnica tedesca. Lavoro quotidianamente sia con metodi diretti sia con metodi indiretti, anche se prediligo nettamente questi ultimi: prefermenti come lievito madre, poolish, biga e precotture come il kochstück sono la vera anima delle mie ricette. Prediligere l'indiretto significa dare tempo al tempo, permettendo agli enzimi di trasformare la materia prima per ottenere una complessità aromatica unica, una crosta fragrante e un'alveolatura sviluppata. Tuttavia, amo ogni sfumatura della panificazione: la farina giusta al momento giusto e il rispetto rigoroso dei tempi sono la chiave per dominare ogni tipo di impasto." },
    { id: "serenita", title: "Lavorare in Serenità", icon: Smile, grad: "from-[#234b6e] to-[#1B2127]",
      body: "Lavorare in serenità significa trasformare il laboratorio in un ambiente organizzato, efficiente e privo di stress. Con una pianificazione accurata dei tempi di fermentazione, l'uso di standard precisi e la scelta di tecniche affidabili, ogni imprevisto viene eliminato. Le piccole intuizioni pratiche, unite all'esperienza sul campo, semplificano le operazioni quotidiane rendendo il lavoro costante, sicuro e piacevole. Panificare con serenità è il segreto per esprimere la massima qualità senza mai perdere la passione per questo mestiere." },
  ],
  de: [
    { id: "cosa", title: "Was ist MikiLab", icon: Info, grad: "from-[#3f7cac] to-[#234b6e]",
      body: "MikiLab ist mein kreatives und wissenschaftliches digitales Labor für die Backkunst. Es verbindet handwerkliche Leidenschaft mit dem methodischen Studium von Mehlen und Fermentationsprozessen. Hier ist Backen keine bloße Abfolge von Handgriffen, sondern eine ständige Suche nach Exzellenz, bei der jede Zutat auf das Milligramm genau kalibriert wird – für perfekte Strukturen, höchste Bekömmlichkeit und authentische Aromen. Hier trifft die Tradition der Backkunst auf Innovation und Präzision." },
    { id: "chi", title: "Wer ich bin", icon: ChefHat, grad: "from-[#6E8CA0] to-[#5E7E90]",
      body: "Ich bin Michele, Bäcker aus Leidenschaft, noch bevor es mein Beruf wurde. Ich liebe Dinkel, Lievito Madre und den Duft von frisch gebackenem Brot. Mikilab habe ich geschaffen, um jedem Bäcker meine Rezepte und meine Arbeitsweise in die Tasche zu geben – mit der gleichen Sorgfalt, die ich täglich in die Backstube stecke." },
    { id: "metodo", title: "Meine Methode", icon: FlaskConical, grad: "from-[#5aa0cf] to-[#2e6690]",
      body: "Meine Methode verbindet die große italienische Tradition mit deutscher technischer Präzision. Ich arbeite täglich sowohl mit direkten als auch mit indirekten Methoden, bevorzuge aber klar Letztere: Vorteige wie Lievito Madre, Poolish, Biga und Kochstücke sind die wahre Seele meiner Rezepte. Indirekt zu arbeiten heißt, der Zeit Zeit zu geben, damit die Enzyme den Rohstoff verwandeln – für einzigartige Aromatik, knusprige Kruste und offene Porung. Dennoch liebe ich jede Nuance des Backens: das richtige Mehl zum richtigen Zeitpunkt und die strikte Einhaltung der Zeiten sind der Schlüssel, um jeden Teig zu beherrschen." },
    { id: "serenita", title: "Entspannt arbeiten", icon: Smile, grad: "from-[#234b6e] to-[#1B2127]",
      body: "Entspannt zu arbeiten bedeutet, die Backstube in eine organisierte, effiziente und stressfreie Umgebung zu verwandeln. Mit sorgfältiger Planung der Gärzeiten, präzisen Standards und zuverlässigen Techniken werden Überraschungen ausgeschlossen. Kleine praktische Einsichten, verbunden mit Erfahrung, vereinfachen den Alltag und machen die Arbeit gleichmäßig, sicher und angenehm. Mit Gelassenheit zu backen ist das Geheimnis für höchste Qualität, ohne je die Leidenschaft für dieses Handwerk zu verlieren." },
  ],
  en: [
    { id: "cosa", title: "What is MikiLab", icon: Info, grad: "from-[#3f7cac] to-[#234b6e]",
      body: "MikiLab is my creative, scientific digital lab dedicated to the baking art. It was born to blend artisan passion with the methodical study of flours and fermentation. Here baking is not a mere sequence of gestures but a constant pursuit of excellence, where every ingredient is calibrated to the milligram for perfect structures, extreme digestibility and authentic flavours. It's where the tradition of baking meets innovation and precision." },
    { id: "chi", title: "About me", icon: ChefHat, grad: "from-[#5aa0cf] to-[#2e6690]",
      body: "I'm Michele, a baker by passion even before by trade. I love spelt, sourdough and the scent of freshly baked bread. I created Mikilab to put my recipes and my way of working into every baker's pocket, with the same care I bring to the bakery every day." },
    { id: "metodo", title: "My method", icon: FlaskConical, grad: "from-[#5aa0cf] to-[#2e6690]",
      body: "My method blends the great Italian tradition with German technical precision. I work daily with both direct and indirect methods, though I clearly prefer the latter: preferments such as sourdough, poolish, biga and pre-cooks like kochstück are the true soul of my recipes. Choosing indirect means giving time to time, letting enzymes transform the raw material for unique aromatic complexity, a fragrant crust and an open crumb. Yet I love every nuance of baking: the right flour at the right moment and strict respect for timings are the key to mastering any dough." },
    { id: "serenita", title: "Working with peace of mind", icon: Smile, grad: "from-[#234b6e] to-[#1B2127]",
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
  es: [
    "Organizo tus recetas 📋",
    "Planifico la producción en el obrador ⏱️",
    "Calculo dosis, hidratación y costes 🧮",
    "Te acompaño desde el móvil y el PC 📱💻",
  ],
};

function HomeAvatarScene({ lang }) {
  const de = lang === "de";
  const phrases = SCENE_PHRASES[lang] || SCENE_PHRASES.it;
  const [idx, setIdx] = useState(0);
  const BASE = process.env.PUBLIC_URL || "";
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % phrases.length), 3000);
    return () => clearInterval(id);
  }, [phrases.length]);

  return (
    <div data-testid="home-founder-photo" className="relative rounded-3xl overflow-hidden shadow-xl h-80 bg-[#2B303B]">
      {/* Solo FOTO: nessun audio/video, l'avatar comunica per iscritto (fumetto) */}
      <img src={`${BASE}/michele-avatar-full.jpg`} alt="Michele" data-testid="home-avatar-full"
        className="absolute inset-0 w-full h-full object-contain" loading="lazy" />
      <div aria-hidden className="absolute top-0 left-0 right-0 h-1.5 z-20 pointer-events-none bg-gradient-to-r from-[#5aa0cf] via-[#6E8CA0] to-[#A9C5D4]" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#2B303B]/85 via-[#2B303B]/15 to-transparent" />

      <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none">
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

      <div className="absolute bottom-0 left-0 p-5 z-20 pointer-events-none">
        <p className="font-display text-3xl font-bold text-white">MikiLab Avatar</p>
        <p className="text-white/85 text-sm mt-0.5">{de ? "Dein digitaler Begleiter" : lang === "en" ? "Your digital companion" : lang === "es" ? "Tu compañero digital" : "Il tuo compagno digitale"} 🇮🇹 🇩🇪 🇬🇧 🇪🇸</p>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: Wrench, color: "#3f7cac",
    it: ["Il Tuo Laboratorio", "Piano di produzione con l'IA: orari d'inizio, celle, impasti, lista spesa, costi e margini — e la tabella delle infornate."],
    de: ["Dein Labor", "KI-Produktionsplan: Startzeiten, Kammern, Teige, Einkaufsliste, Kosten & Margen — und die Back-Tabelle."],
    en: ["Your Lab", "AI production plan: start times, cells, doughs, shopping list, costs & margins — plus the baking schedule."],
    es: ["Tu Laboratorio", "Plan de producción con IA: horarios, cámaras, masas, lista de compra, costes y márgenes — y la tabla de horneado."] },
  { icon: Activity, color: "#2e8b6f",
    it: ["Fermentazione Predittiva", "Ti dice quanto lieviterà l'impasto oggi (usando il meteo) e ti avvisa quando è pronto."],
    de: ["Gärungs-Prognose", "Sagt dir, wie lange die Gare heute dauert (mit Wetter) und meldet sich, wenn der Teig fertig ist."],
    en: ["Fermentation Forecast", "Tells you how long proofing takes today (using the weather) and alerts you when the dough is ready."],
    es: ["Fermentación Predictiva", "Te dice cuánto leudará hoy (con el clima) y te avisa cuando la masa está lista."] },
  { icon: Hand, color: "#C88A2B",
    it: ["Mani in Pasta & Timeline", "Leggi le ricette a voce con le mani libere e vedi la linea del tempo con gli orari a ritroso dallo sforno."],
    de: ["Hände im Teig & Zeitplan", "Rezepte freihändig vorlesen lassen und den Zeitplan rückwärts ab dem Ausbacken sehen."],
    en: ["Hands-free & Timeline", "Have recipes read aloud hands-free and see the timeline with times counted back from baking."],
    es: ["Manos en la Masa y Timeline", "Escucha las recetas con las manos libres y ve la línea de tiempo a partir del horneado."] },
  { icon: BookOpen, color: "#234b6e",
    it: ["Le Mie Ricette + Generatore", "Le ricette col mio metodo (dosi, idratazione, costi) e un generatore IA per crearne di nuove su misura."],
    de: ["Meine Rezepte + Generator", "Rezepte mit meiner Methode (Mengen, Hydratation, Kosten) und ein KI-Generator für neue, maßgeschneiderte."],
    en: ["My Recipes + Generator", "Recipes with my method (doses, hydration, costs) and an AI generator to create tailored new ones."],
    es: ["Mis Recetas + Generador", "Recetas con mi método (dosis, hidratación, costes) y un generador IA para crear nuevas a medida."] },
  { icon: GraduationCap, color: "#5aa0cf",
    it: ["Impara", "Lezioni passo-passo e la diagnosi dell'impasto da una foto: capisci subito cosa migliorare."],
    de: ["Lernen", "Schritt-für-Schritt-Lektionen und Teig-Diagnose per Foto: sofort verstehen, was zu verbessern ist."],
    en: ["Learn", "Step-by-step lessons and dough diagnosis from a photo: instantly see what to improve."],
    es: ["Aprende", "Lecciones paso a paso y diagnóstico de la masa por foto: entiende al instante qué mejorar."] },
  { icon: Users, color: "#6E8CA0",
    it: ["Community & Mappa dei Fornai", "Confrontati con altri fornai e scopri chi usa MikiLab nel mondo sulla mappa."],
    de: ["Community & Bäcker-Karte", "Tausche dich mit anderen Bäckern aus und entdecke auf der Karte, wer MikiLab weltweit nutzt."],
    en: ["Community & Bakers Map", "Connect with other bakers and discover who uses MikiLab worldwide on the map."],
    es: ["Comunidad y Mapa de Panaderos", "Conecta con otros panaderos y descubre en el mapa quién usa MikiLab en el mundo."] },
];

export default function Home({ onNavigate }) {
  const { t, lang } = useLang();
  const [chat, setChat] = useState(false);
  const [legal, setLegal] = useState(false);
  const [open, setOpen] = useState(null);
  const [storyOpen, setStoryOpen] = useState(() => {
    try { return !localStorage.getItem("mikilab_home_story_seen"); } catch { return true; }
  });
  const toggleStory = () => {
    try { localStorage.setItem("mikilab_home_story_seen", "1"); } catch { /* */ }
    setStoryOpen((v) => !v);
  };
  const concepts = CONCEPTS[lang] || CONCEPTS.it;
  const activeConcept = concepts.find((c) => c.id === open) || null;
  const go = (tab) => onNavigate && onNavigate(tab);
  const jokes = JOKES[lang] || JOKES.it;
  const [joke] = useState(() => jokes[Math.floor(Math.random() * jokes.length)]);
  const de = lang === "de";
  const L = (it_, de_, en_, es_) => (de ? de_ : lang === "en" ? en_ : lang === "es" ? (es_ ?? en_) : it_);
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

  if (chat) {
    return (
      <div className="pb-4">
        <button data-testid="home-back-btn" onClick={() => setChat(false)} className="flex items-center gap-1 text-[#3f7cac] font-medium mb-4">
          <ChevronRight className="w-5 h-5 rotate-180" /> Home
        </button>
        <MaestroSaTutto />
      </div>
    );
  }

  if (legal) {
    return (
      <div className="pb-4">
        <button data-testid="legal-back-btn" onClick={() => setLegal(false)} className="flex items-center gap-1 text-[#3f7cac] font-medium mb-4">
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

      {/* ===== MIKILAB + SCOPRI MIKILAB uniti in un'unica card ===== */}
      <div data-testid="home-story" className="-mt-2">
        <button data-testid="home-story-toggle" onClick={toggleStory}
          className="w-full text-left relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#234b6e] to-[#3f7cac] text-white shadow-lg active:scale-98 transition-all">
          <div className="it-de-ribbon absolute top-0 left-0 right-0" />
          <div className="p-5" data-testid="home-slogan">
            <p className="font-display text-lg sm:text-xl font-bold leading-tight mt-1">MikiLab</p>
            <p className="text-sm text-white/90 leading-snug mt-0.5">{t("brand_slogan")}</p>
            <div className="mt-4 flex items-center gap-3 border-t border-white/20 pt-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base font-bold">{L("Scopri MikiLab", "MikiLab kennenlernen", "Discover MikiLab", "Descubre MikiLab")}</h3>
                <p className="text-white/85 text-[13px] leading-snug">{L("Chi è Michele, il metodo e la filosofia", "Wer Michele ist, die Methode und Philosophie", "Who Michele is, the method and philosophy", "Quién es Michele, el método y la filosofía")}</p>
              </div>
              <ChevronDown className={`w-6 h-6 text-white/90 shrink-0 transition-transform duration-300 ${storyOpen ? "rotate-180" : ""}`} />
            </div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {storyOpen && (
            <motion.div key="story" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
              <div className="space-y-6 pt-6">
                <div data-testid="home-lab-photo" className="rounded-3xl overflow-hidden shadow-xl ring-2 ring-[#C88A2B]/40 relative">
                  <img src={`${process.env.PUBLIC_URL}/michele-real-lab.jpg`} alt={L("Michele, mani in pasta", "Michele, mittendrin im Teig", "Michele, hands in the dough", "Michele, con las manos en la masa")}
                    className="w-full h-56 object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white font-display text-lg font-bold leading-tight">{L("Michele, mani in pasta", "Michele, mittendrin im Teig", "Michele, hands in the dough", "Michele, con las manos en la masa")}</p>
                    <p className="text-white/85 text-xs leading-snug">{L("Passione, metodo e arte bianca — ogni giorno.", "Leidenschaft, Methode und Backkunst — jeden Tag.", "Passion, method and the baking craft — every day.", "Pasión, método y arte blanco — cada día.")}</p>
                  </div>
                </div>

                <div data-testid="bio-card" className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#3f7cac] to-[#234b6e] text-white shadow-xl p-7 text-center">
                  <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Mikilab" data-testid="bio-logo"
                    className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[#A9C5D4]/70 shadow-lg mx-auto mb-4" />
                  <h1 className="font-display text-3xl font-bold">Mikilab</h1>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/75 mt-2">{t("brand_subtitle")} <span>🇮🇹</span> <span>🇩🇪</span></p>
                </div>

                <div data-testid="home-promo" className="rounded-3xl bg-[#e4eff8] dark:bg-[#1F252B] border border-[#6E8CA0]/40 shadow-md p-5 flex items-start gap-4">
                  <img src={`${process.env.PUBLIC_URL}/michele-avatar.jpg`} alt="Michele" loading="lazy"
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#6E8CA0]/50 shrink-0"
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <p className="text-sm text-[#3F4A54] dark:text-[#e4eff8] leading-relaxed">
                    {L(
                      "Un sito pensato per organizzare il lavoro proprio come lo faresti tu. Dalla gestione dettagliata delle ricette alla lista della spesa, fino alla pianificazione precisa della produzione in laboratorio. In più, con l'aiuto dell'AI potrai calcolare, adattare e gestire ogni fase senza margine di errore: tu pensi al laboratorio, al resto ci pensiamo noi.",
                      "Eine Website, die die Arbeit genau so organisiert, wie du es tun würdest. Von der detaillierten Rezeptverwaltung über die Einkaufsliste bis zur präzisen Produktionsplanung in der Backstube. Und mit Hilfe der KI kannst du jede Phase ohne Fehler berechnen, anpassen und steuern: Du kümmerst dich um die Backstube, um den Rest kümmern wir uns.",
                      "A website designed to organise the work exactly as you would. From detailed recipe management to the shopping list, all the way to precise production planning in the bakery. Plus, with AI's help you can calculate, adapt and manage every stage with no margin for error: you focus on the bakery, we take care of the rest."
                    )}
                  </p>
                </div>

                <div data-testid="home-features" className="rounded-3xl bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] shadow-md overflow-hidden">
                  <div className="bg-gradient-to-br from-[#234b6e] to-[#3f7cac] text-white px-5 py-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-display text-lg font-bold">{L("Cosa puoi fare con MikiLab", "Was du mit MikiLab machen kannst", "What you can do with MikiLab", "Qué puedes hacer con MikiLab")}</h3>
                  </div>
                  <div className="divide-y divide-[#d5e4f0] dark:divide-[#38424B]">
                    {FEATURES.map((f, i) => {
                      const Icon = f.icon;
                      const txt = f[lang] || f.it;
                      return (
                        <div key={i} data-testid={`home-feature-${i}`} className="flex items-start gap-3 px-5 py-4">
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${f.color}1a` }}>
                            <Icon className="w-5 h-5" style={{ color: f.color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[15px] text-[#2B303B] dark:text-[#e4eff8] leading-tight">{txt[0]}</p>
                            <p className="text-[13px] text-[#3F4A54] dark:text-[#AEB8BF] leading-snug mt-0.5">{txt[1]}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-5 py-3 bg-[#e4eff8] dark:bg-[#151b21] text-center">
                    <p className="text-[12px] text-[#7E8A93]">🇮🇹 🇩🇪 🇬🇧 🇪🇸 · {L("in italiano, tedesco, inglese e spagnolo — su smartphone e PC", "auf Italienisch, Deutsch, Englisch & Spanisch — Smartphone & PC", "in Italian, German, English & Spanish — on smartphone & PC", "en italiano, alemán, inglés y español — en móvil y PC")}</p>
                  </div>
                </div>

                <div data-testid="home-lab-gallery">
                  <p className="font-display text-base font-bold text-[#2B303B] dark:text-[#e4eff8] mb-2 px-1">{L("Il laboratorio in immagini", "Die Backstube in Bildern", "The bakery in pictures")}</p>
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                    {[
                      { src: "bio-dough-3.jpg", cap: L("Al forno", "Am Ofen", "At the oven") },
                      { src: "michele-real2.jpg", cap: L("Tra le teglie", "Zwischen den Blechen", "Among the trays") },
                      { src: "bio-dough.jpg", cap: L("Impasto in mano", "Teig in der Hand", "Dough in hand") },
                    ].map((p, i) => (
                      <div key={i} data-testid={`lab-gallery-${i}`} className="shrink-0 w-60 rounded-2xl overflow-hidden bg-[#2B303B] ring-1 ring-[#C88A2B]/30">
                        <img src={`${process.env.PUBLIC_URL}/${p.src}`} alt={p.cap} loading="lazy"
                          className="w-full h-56 object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        <p className="text-white/85 text-xs font-medium text-center py-2">{p.cap}</p>
                      </div>
                    ))}
                  </div>
                </div>

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
                            <p className="text-white/70 text-[11px] font-medium">{t("home_tap_open")}</p>
                          </div>
                          <ChevronDown className={`w-6 h-6 text-white/90 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
                              <div data-testid={`concept-content-${c.id}`} className="rounded-b-3xl bg-white dark:bg-[#1F252B] border border-t-0 border-[#d5e4f0] dark:border-[#38424B] overflow-hidden">
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

                <div data-testid="home-joke" className="flex items-start gap-3 rounded-2xl bg-[#6E8CA0]/12 border border-[#6E8CA0]/30 p-4">
                  <Laugh className="w-5 h-5 text-[#3f7cac] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] italic leading-relaxed">{joke}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* News · Arte Bianca (curate dall'admin) */}
      <HomeNews />

      {/* ===== IL CUORE DI MIKILAB: le 3 sezioni-anima, in evidenza ===== */}
      <div data-testid="home-core">
        <div className="flex items-center gap-2 mb-1 px-1">
          <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{L("Il cuore di MikiLab", "Das Herz von MikiLab", "The heart of MikiLab")}</h2>
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#C88A2B] bg-[#C88A2B]/15 border border-[#C88A2B]/40 px-2 py-0.5 rounded-full">{L("L'anima del sito", "Die Seele", "The soul")}</span>
        </div>
        <div className="h-1 w-12 rounded-full bg-[#C88A2B] mb-3 ml-1" />

        {/* Laboratorio — card grande in evidenza */}
        <button data-testid="home-core-maestro" onClick={() => go("maestro")}
          className="relative w-full text-left rounded-3xl p-5 mb-3 text-white shadow-xl active:scale-98 transition-all bg-gradient-to-br from-[#3f7cac] to-[#234b6e] ring-2 ring-[#C88A2B]/70 overflow-hidden">
          <div className="it-de-ribbon absolute top-0 left-0 right-0" />
          <div className="flex items-center gap-3 mt-1">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0"><Wrench className="w-6 h-6" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold">{L("Il Tuo Laboratorio", "Dein Labor", "Your Lab")}</h3>
                <span className="text-[10px] font-bold bg-[#C88A2B] text-white px-2 py-0.5 rounded-full">PRO</span>
              </div>
              <p className="text-white/85 text-sm leading-snug">{L("Piano di produzione IA, costi, celle e impasti — tutto in un posto.", "KI-Produktionsplan, Kosten, Kammern und Teige — alles an einem Ort.", "AI production plan, costs, cells and doughs — all in one place.")}</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/80 shrink-0" />
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button data-testid="home-core-ricette" onClick={() => go("ricette")}
            className="text-left rounded-2xl p-4 text-white shadow-md active:scale-97 transition-all bg-gradient-to-br from-[#24303c] to-[#16202b] min-h-[112px] flex flex-col gap-2">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center"><BookOpen className="w-6 h-6" /></div>
            <p className="font-display text-base font-bold leading-tight">{L("Le Mie Ricette", "Meine Rezepte", "My Recipes")}</p>
            <p className="text-[11px] text-white/85 leading-snug">{L("Le ricette col mio metodo", "Rezepte mit meiner Methode", "Recipes with my method")}</p>
          </button>
          <button data-testid="home-core-corsi" onClick={() => go("shop")}
            className="text-left rounded-2xl p-4 text-white shadow-md active:scale-97 transition-all bg-gradient-to-br from-[#5aa0cf] to-[#2e6690] min-h-[112px] flex flex-col gap-2">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center"><GraduationCap className="w-6 h-6" /></div>
            <p className="font-display text-base font-bold leading-tight">{L("I Miei Corsi", "Meine Kurse", "My Courses")}</p>
            <p className="text-[11px] text-white/85 leading-snug">{L("Corsi online di Michele (in arrivo)", "Micheles Online-Kurse (bald)", "Michele's online courses (soon)")}</p>
          </button>
        </div>
      </div>

      {/* ===== CHIEDI AL MAESTRO ===== */}
      <button data-testid="home-chat-btn" onClick={() => setChat(true)}
        className="w-full flex items-center gap-4 rounded-3xl p-5 bg-gradient-to-br from-[#5aa0cf] to-[#2e6690] text-white shadow-lg active:scale-98 transition-all">
        <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
          <MessageCircle className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h3 className="font-display text-lg font-bold">{t("home_chat_btn")}</h3>
          <p className="text-white/85 text-sm">{t("home_chat_sub")}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-white/80 shrink-0" />
      </button>

      {/* Condividi & Installa app */}
      <ShareInstall />

      {/* MikiLab Shop & Corsi — IN FONDO, "in arrivo a breve" (niente redirect alle ricette) */}
      <div data-testid="home-shop-corsi" className="mb-4">
        <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8] mb-2">{L("MikiLab Shop & Corsi", "MikiLab Shop & Kurse", "MikiLab Shop & Courses")}</p>
        <div className="grid grid-cols-2 gap-1.5 bg-[#e4eff8] dark:bg-[#1F252B] p-1.5 rounded-2xl mb-3 border border-[#d5e4f0] dark:border-[#38424B]">
          <button data-testid="shop-tab-premium" onClick={() => setShopTab("premium")}
            className={`py-2 rounded-xl text-sm font-semibold transition-all ${shopTab === "premium" ? "bg-[#3f7cac] text-white shadow" : "text-[#7E8A93]"}`}>
            {L("Shop Ricette", "Rezept-Shop", "Recipe Shop")}
          </button>
          <button data-testid="shop-tab-corsi" onClick={() => setShopTab("corsi")}
            className={`py-2 rounded-xl text-sm font-semibold transition-all ${shopTab === "corsi" ? "bg-[#3f7cac] text-white shadow" : "text-[#7E8A93]"}`}>
            {L("I Miei Corsi", "Meine Kurse", "My Courses")}
          </button>
        </div>

        <div data-testid="shop-coming-soon" className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#2f6a97] to-[#234b6e] p-6 text-center text-white">
          <div className="it-de-ribbon absolute top-0 left-0 right-0" />
          {shopTab === "premium" ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mx-auto mb-2"><ChefHat className="w-6 h-6" /></div>
              <p className="font-display text-lg font-bold">{L("Shop di tutte le mie ricette", "Shop all meiner Rezepte", "Shop of all my recipes")}</p>
              <span className="inline-block mt-2 text-[11px] font-bold bg-[#5aa0cf] text-white px-3 py-1 rounded-full uppercase tracking-wide">{L("Disponibile ora", "Jetzt verfügbar", "Available now")}</span>
              <p className="text-sm text-white/85 mt-2 leading-snug">{L("Sfoglia e acquista le ricette di Michele, complete di dosi e procedimento.", "Stöbere und kaufe Micheles Rezepte, komplett mit Mengen und Zubereitung.", "Browse and buy Michele's recipes, complete with doses and method.")}</p>
              <button data-testid="shop-recipes-cta" onClick={() => go("ricette")}
                className="mt-3 inline-flex items-center gap-2 bg-white text-[#234b6e] font-bold px-5 py-2.5 rounded-2xl active:scale-95 transition-all">
                <ShoppingBag className="w-4 h-4" /> {L("Vai alle ricette", "Zu den Rezepten", "Go to recipes")}
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mx-auto mb-2"><GraduationCap className="w-6 h-6" /></div>
              <p className="font-display text-lg font-bold">{L("I Miei Corsi", "Meine Kurse", "My Courses")}</p>
              <span className="inline-block mt-2 text-[11px] font-bold bg-[#C88A2B] text-white px-3 py-1 rounded-full uppercase tracking-wide">{L("In arrivo a breve", "Kommt bald", "Coming soon")}</span>
              <p className="text-sm text-white/85 mt-2 leading-snug">{L("I corsi online di panificazione e pasticceria firmati Michele stanno arrivando.", "Micheles Online-Kurse für Backen und Konditorei kommen bald.", "Michele's online baking & pastry courses are coming soon.")}</p>
            </>
          )}
        </div>
      </div>

      {/* Footer legale */}
      <button data-testid="home-legal-link" onClick={() => setLegal(true)}
        className="w-full text-center text-xs text-[#7E8A93] underline underline-offset-2 py-2">
        {L("Note legali & Privacy", "Impressum & Datenschutz", "Legal notice & Privacy")}
      </button>
    </div>
  );
}
