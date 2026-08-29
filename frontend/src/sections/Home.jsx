import { mkTri, triFR, triFA } from "@/i18n/triMaps";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronRight, ChevronDown, Info, ChefHat, FlaskConical, Smile, BookOpen, Wrench, GraduationCap, Laugh, ShoppingBag, Smartphone, Monitor, Users, Activity, Hand, Clock, MapPin, Sparkles, Trophy, Calculator, UtensilsCrossed, Landmark, Pizza, Croissant } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import MaestroSaTutto from "@/sections/MaestroSaTutto";
import { TattooSignature } from "@/components/TattooSignature";
import { recipesApi } from "@/lib/api";
import { dmApi, academyApi, profileApi } from "@/lib/api";
import { useAuth } from "@/auth/AuthContext";
import ChatPanel from "@/components/ChatPanel";
import LegalPage from "@/sections/LegalPage";
import ShareInstall from "@/components/ShareInstall";
import NewsletterSignup from "@/components/NewsletterSignup";
import HomeNews from "@/components/HomeNews";
import GuidaAvatar from "@/components/GuidaAvatar";
import SaporeDelGiorno from "@/components/SaporeDelGiorno";
import SaporiCasa from "@/sections/SaporiCasa";
import CalcolatoreMetodo from "@/sections/CalcolatoreMetodo";
import { getProfile } from "@/components/Onboarding";
import { getLevelProgress } from "@/lib/level";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const CONCEPTS = {
  it: [
    { id: "cosa", title: "Cos'è MikiLab", icon: Info, grad: "from-[#ff6b00] to-[#ff6b00]",
      body: "MikiLab è il mio laboratorio creativo e scientifico digitale dedicato all'arte bianca. Nasce per fondere la passione artigianale con lo studio metodico delle farine e dei processi fermentativi. Qui la panificazione non è una semplice sequenza di gesti, ma una costante ricerca dell'eccellenza, dove ogni ingrediente è calibrato al milligrammo per ottenere strutture perfette, digeribilità estrema e sapori autentici. È il luogo in cui la tradizione dell'arte panificatoria incontra l'innovazione e la precisione." },
    { id: "chi", title: "Chi sono io", icon: ChefHat, grad: "from-[#ff6b00] to-[#ff6b00]",
      body: "Sono Michele, panettiere per passione prima ancora che per mestiere. Amo il farro, il lievito madre e il profumo del pane appena sfornato. Ho creato MikiLab per mettere in tasca a ogni fornaio le mie ricette e il mio modo di lavorare, con la stessa cura che metto ogni giorno in laboratorio." },
    { id: "metodo", title: "Il mio Metodo", icon: FlaskConical, grad: "from-[#ff6b00] to-[#ff6b00]",
      body: "Il mio metodo unisce la grande tradizione italiana alla precisione tecnica tedesca. Lavoro quotidianamente sia con metodi diretti sia con metodi indiretti, anche se prediligo nettamente questi ultimi: prefermenti come lievito madre, poolish, biga e precotture come il kochstück sono la vera anima delle mie ricette. Prediligere l'indiretto significa dare tempo al tempo, permettendo agli enzimi di trasformare la materia prima per ottenere una complessità aromatica unica, una crosta fragrante e un'alveolatura sviluppata. Tuttavia, amo ogni sfumatura della panificazione: la farina giusta al momento giusto e il rispetto rigoroso dei tempi sono la chiave per dominare ogni tipo di impasto." },
    { id: "serenita", title: "Lavorare in Serenità", icon: Smile, grad: "from-[#ff6b00] to-[#ff6b00]",
      body: "Lavorare in serenità significa trasformare il laboratorio in un ambiente organizzato, efficiente e privo di stress. Con una pianificazione accurata dei tempi di fermentazione, l'uso di standard precisi e la scelta di tecniche affidabili, ogni imprevisto viene eliminato. Le piccole intuizioni pratiche, unite all'esperienza sul campo, semplificano le operazioni quotidiane rendendo il lavoro costante, sicuro e piacevole. Panificare con serenità è il segreto per esprimere la massima qualità senza mai perdere la passione per questo mestiere." },
  ],
  de: [
    { id: "cosa", title: "Was ist MikiLab", icon: Info, grad: "from-[#ff6b00] to-[#ff6b00]",
      body: "MikiLab ist mein kreatives und wissenschaftliches digitales Labor für die Backkunst. Es verbindet handwerkliche Leidenschaft mit dem methodischen Studium von Mehlen und Fermentationsprozessen. Hier ist Backen keine bloße Abfolge von Handgriffen, sondern eine ständige Suche nach Exzellenz, bei der jede Zutat auf das Milligramm genau kalibriert wird – für perfekte Strukturen, höchste Bekömmlichkeit und authentische Aromen. Hier trifft die Tradition der Backkunst auf Innovation und Präzision." },
    { id: "chi", title: "Wer ich bin", icon: ChefHat, grad: "from-[#ff6b00] to-[#ff6b00]",
      body: "Ich bin Michele, Bäcker aus Leidenschaft, noch bevor es mein Beruf wurde. Ich liebe Dinkel, Lievito Madre und den Duft von frisch gebackenem Brot. MikiLab habe ich geschaffen, um jedem Bäcker meine Rezepte und meine Arbeitsweise in die Tasche zu geben – mit der gleichen Sorgfalt, die ich täglich in die Backstube stecke." },
    { id: "metodo", title: "Meine Methode", icon: FlaskConical, grad: "from-[#ff6b00] to-[#ff6b00]",
      body: "Meine Methode verbindet die große italienische Tradition mit deutscher technischer Präzision. Ich arbeite täglich sowohl mit direkten als auch mit indirekten Methoden, bevorzuge aber klar Letztere: Vorteige wie Lievito Madre, Poolish, Biga und Kochstücke sind die wahre Seele meiner Rezepte. Indirekt zu arbeiten heißt, der Zeit Zeit zu geben, damit die Enzyme den Rohstoff verwandeln – für einzigartige Aromatik, knusprige Kruste und offene Porung. Dennoch liebe ich jede Nuance des Backens: das richtige Mehl zum richtigen Zeitpunkt und die strikte Einhaltung der Zeiten sind der Schlüssel, um jeden Teig zu beherrschen." },
    { id: "serenita", title: "Entspannt arbeiten", icon: Smile, grad: "from-[#ff6b00] to-[#ff6b00]",
      body: "Entspannt zu arbeiten bedeutet, die Backstube in eine organisierte, effiziente und stressfreie Umgebung zu verwandeln. Mit sorgfältiger Planung der Gärzeiten, präzisen Standards und zuverlässigen Techniken werden Überraschungen ausgeschlossen. Kleine praktische Einsichten, verbunden mit Erfahrung, vereinfachen den Alltag und machen die Arbeit gleichmäßig, sicher und angenehm. Mit Gelassenheit zu backen ist das Geheimnis für höchste Qualität, ohne je die Leidenschaft für dieses Handwerk zu verlieren." },
  ],
  en: [
    { id: "cosa", title: "What is MikiLab", icon: Info, grad: "from-[#ff6b00] to-[#ff6b00]",
      body: "MikiLab is my creative, scientific digital lab dedicated to the baking art. It was born to blend artisan passion with the methodical study of flours and fermentation. Here baking is not a mere sequence of gestures but a constant pursuit of excellence, where every ingredient is calibrated to the milligram for perfect structures, extreme digestibility and authentic flavours. It's where the tradition of baking meets innovation and precision." },
    { id: "chi", title: "About me", icon: ChefHat, grad: "from-[#ff6b00] to-[#ff6b00]",
      body: "I'm Michele, a baker by passion even before by trade. I love spelt, sourdough and the scent of freshly baked bread. I created MikiLab to put my recipes and my way of working into every baker's pocket, with the same care I bring to the bakery every day." },
    { id: "metodo", title: "My method", icon: FlaskConical, grad: "from-[#ff6b00] to-[#ff6b00]",
      body: "My method blends the great Italian tradition with German technical precision. I work daily with both direct and indirect methods, though I clearly prefer the latter: preferments such as sourdough, poolish, biga and pre-cooks like kochstück are the true soul of my recipes. Choosing indirect means giving time to time, letting enzymes transform the raw material for unique aromatic complexity, a fragrant crust and an open crumb. Yet I love every nuance of baking: the right flour at the right moment and strict respect for timings are the key to mastering any dough." },
    { id: "serenita", title: "Working with peace of mind", icon: Smile, grad: "from-[#ff6b00] to-[#ff6b00]",
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
  const L = (...a) => mkTri(lang)(...a);
  const phrases = SCENE_PHRASES[lang] || (lang === "fr" ? SCENE_PHRASES.it.map((s) => triFR(s) || s) : lang === "fa" ? SCENE_PHRASES.it.map((s) => triFA(s) || s) : SCENE_PHRASES.it);
  const [idx, setIdx] = useState(0);
  const BASE = process.env.PUBLIC_URL || "";
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % phrases.length), 3000);
    return () => clearInterval(id);
  }, [phrases.length]);

  return (
    <div data-testid="home-founder-photo" className="relative pt-3">
      {/* Targa di legno "Aperto" appesa nell'angolo */}
      <div data-testid="home-open-sign" className="absolute -top-1 right-3 z-30 rotate-[-4deg] peel-shadow">
        <div className="w-px h-3 bg-[#2e2e2e] mx-auto" />
        <div className="wood-surface wood-emboss rounded-lg px-3 py-1.5 border-2 border-[#2e2e2e] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#3a7a3a] shadow-[0_0_6px_#4caf50]" />
          <span className="font-display text-sm font-extrabold text-[#eaf6ea] drop-shadow">{L("Aperto", "Geöffnet", "Open", "Abierto", "Ouvert", "باز")}</span>
        </div>
      </div>

      {/* Portale ad arco in mattoni che si affaccia sul laboratorio */}
      <div className="relative rounded-t-[110px] rounded-b-[28px] p-2.5 shadow-2xl" style={{ background: "linear-gradient(160deg,#ff8a33,#ff6b00 55%,#c94f00)" }}>
        <div aria-hidden className="absolute inset-2.5 rounded-t-[100px] rounded-b-[22px] pointer-events-none ring-2 ring-[#ff8a33]/30 z-20" />
        <div className="relative rounded-t-[100px] rounded-b-[22px] overflow-hidden bg-[#2B303B] grain-overlay">
          <img src={`${BASE}/michele-avatar-full.jpg`} alt="MikiLab · Michele" data-testid="home-avatar-full"
            className="w-full h-[440px] object-cover object-top" loading="eager" />
          {/* pulviscolo di farina sospeso nella luce calda */}
          <div aria-hidden className="absolute inset-0 pointer-events-none opacity-60"
            style={{ background: "radial-gradient(120% 60% at 50% 12%, rgba(255,226,170,.35), transparent 60%)" }} />
          {/* pulviscolo di farina che fluttua nella luce */}
          <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
            {[
              { l: "18%", b: "22%", s: 4, d: 0, dur: 6 }, { l: "34%", b: "12%", s: 3, d: 1.5, dur: 7 },
              { l: "52%", b: "30%", s: 5, d: 0.8, dur: 5.5 }, { l: "67%", b: "18%", s: 3, d: 2.2, dur: 6.5 },
              { l: "80%", b: "26%", s: 4, d: 1.1, dur: 7.5 }, { l: "44%", b: "40%", s: 2, d: 3, dur: 5 },
            ].map((p, i) => (
              <span key={i} className="dust-particle" style={{ left: p.l, bottom: p.b, width: p.s, height: p.s, animationDelay: `${p.d}s`, animationDuration: `${p.dur}s` }} />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1B1410]/92 via-[#1B1410]/25 to-transparent pt-16 pb-4 px-4 z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx} data-testid="home-scene-bubble"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="inline-block max-w-[92%] bg-[#121212]/88 backdrop-blur-sm text-white text-[15px] font-bold leading-snug px-4 py-2.5 rounded-2xl rounded-bl-md shadow-xl ring-1 ring-white/20"
              >
                {phrases[idx]}
              </motion.div>
            </AnimatePresence>
            <div className="pointer-events-none mt-2">
              <p className="font-display text-3xl font-bold text-white drop-shadow-lg">MikiLab</p>
              <p className="text-white/85 text-xs mt-0.5">{L("Entra nel panificio digitale", "Tritt in die digitale Backstube", "Step into the digital bakery", "Entra en el obrador digital", "Entre dans la boulangerie digitale", "به نانوایی دیجیتال وارد شوید")} 🇮🇹 🇩🇪 🇬🇧 🇪🇸 🇫🇷 🇮🇷</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: Wrench, color: "#ff6b00",
    it: ["Il Tuo Laboratorio", "Piano di produzione con l'IA: orari d'inizio, celle, impasti, lista spesa, costi e margini — e la tabella delle infornate."],
    de: ["Dein Labor", "KI-Produktionsplan: Startzeiten, Kammern, Teige, Einkaufsliste, Kosten & Margen — und die Back-Tabelle."],
    en: ["Your Lab", "AI production plan: start times, cells, doughs, shopping list, costs & margins — plus the baking schedule."],
    es: ["Tu Laboratorio", "Plan de producción con IA: horarios, cámaras, masas, lista de compra, costes y márgenes — y la tabla de horneado."] },
  { icon: Activity, color: "#2e8b6f",
    it: ["Fermentazione Predittiva", "Ti dice quanto lieviterà l'impasto oggi (usando il meteo) e ti avvisa quando è pronto."],
    de: ["Gärungs-Prognose", "Sagt dir, wie lange die Gare heute dauert (mit Wetter) und meldet sich, wenn der Teig fertig ist."],
    en: ["Fermentation Forecast", "Tells you how long proofing takes today (using the weather) and alerts you when the dough is ready."],
    es: ["Fermentación Predictiva", "Te dice cuánto leudará hoy (con el clima) y te avisa cuando la masa está lista."] },
  { icon: Hand, color: "#ff6b00",
    it: ["Mani in Pasta & Timeline", "Leggi le ricette a voce con le mani libere e vedi la linea del tempo con gli orari a ritroso dallo sforno."],
    de: ["Hände im Teig & Zeitplan", "Rezepte freihändig vorlesen lassen und den Zeitplan rückwärts ab dem Ausbacken sehen."],
    en: ["Hands-free & Timeline", "Have recipes read aloud hands-free and see the timeline with times counted back from baking."],
    es: ["Manos en la Masa y Timeline", "Escucha las recetas con las manos libres y ve la línea de tiempo a partir del horneado."] },
  { icon: BookOpen, color: "#ff6b00",
    it: ["Le Mie Ricette + Generatore", "Le ricette col mio metodo (dosi, idratazione, costi) e un generatore IA per crearne di nuove su misura."],
    de: ["Meine Rezepte + Generator", "Rezepte mit meiner Methode (Mengen, Hydratation, Kosten) und ein KI-Generator für neue, maßgeschneiderte."],
    en: ["My Recipes + Generator", "Recipes with my method (doses, hydration, costs) and an AI generator to create tailored new ones."],
    es: ["Mis Recetas + Generador", "Recetas con mi método (dosis, hidratación, costes) y un generador IA para crear nuevas a medida."] },
  { icon: GraduationCap, color: "#ff6b00",
    it: ["Impara", "Lezioni passo-passo e la diagnosi dell'impasto da una foto: capisci subito cosa migliorare."],
    de: ["Lernen", "Schritt-für-Schritt-Lektionen und Teig-Diagnose per Foto: sofort verstehen, was zu verbessern ist."],
    en: ["Learn", "Step-by-step lessons and dough diagnosis from a photo: instantly see what to improve."],
    es: ["Aprende", "Lecciones paso a paso y diagnóstico de la masa por foto: entiende al instante qué mejorar."] },
  { icon: Users, color: "#ff6b00",
    it: ["Community & Mappa dei Fornai", "Confrontati con altri fornai e scopri chi usa MikiLab nel mondo sulla mappa."],
    de: ["Community & Bäcker-Karte", "Tausche dich mit anderen Bäckern aus und entdecke auf der Karte, wer MikiLab weltweit nutzt."],
    en: ["Community & Bakers Map", "Connect with other bakers and discover who uses MikiLab worldwide on the map."],
    es: ["Comunidad y Mapa de Panaderos", "Conecta con otros panaderos y descubre en el mapa quién usa MikiLab en el mundo."] },
];

export default function Home({ onNavigate }) {
  const { t, lang } = useLang();
  const { user, setAuthOpen } = useAuth();
  const [chat, setChat] = useState(false);
  const [convos, setConvos] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [weekTheme, setWeekTheme] = useState(null);
  const [isChampion, setIsChampion] = useState(false);
  useEffect(() => {
    if (user) dmApi.conversations().then((c) => setConvos((c || []).filter((x) => x.unread > 0))).catch(() => setConvos([]));
    else setConvos([]);
  }, [user, chatOpen]);
  useEffect(() => { academyApi.weeklyTheme(lang).then((t) => t && setWeekTheme(t)).catch(() => {}); }, [lang]);
  useEffect(() => {
    if (!user) { setIsChampion(false); return; }
    profileApi.get(user.user_id).then((p) => setIsChampion((p?.badges || []).includes("fornaio_settimana"))).catch(() => {});
  }, [user]);
  const [legal, setLegal] = useState(false);
  const [sapori, setSapori] = useState(false);
  const [calc, setCalc] = useState(false);
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
  const openLabTool = (id) => { try { localStorage.setItem("mikilab_pending_tool", id); } catch { /* */ } onNavigate && onNavigate("maestro"); };
  const jokes = JOKES[lang] || JOKES.it;
  const [joke] = useState(() => jokes[Math.floor(Math.random() * jokes.length)]);
  const de = lang === "de";
  const L = (...a) => mkTri(lang)(...a);
  const profile = getProfile();

  const [panettoni, setPanettoni] = useState([]);
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
        <button data-testid="home-back-btn" onClick={() => setChat(false)} className="flex items-center gap-1 text-[#ff6b00] font-medium mb-4">
          <ChevronRight className="w-5 h-5 rotate-180" /> {mkTri(lang)("Home", "Home", "Home", "Inicio", "Accueil", "خانه")}
        </button>
        <MaestroSaTutto />
      </div>
    );
  }

  if (legal) {
    return (
      <div className="pb-4">
        <button data-testid="legal-back-btn" onClick={() => setLegal(false)} className="flex items-center gap-1 text-[#ff6b00] font-medium mb-4">
          <ChevronRight className="w-5 h-5 rotate-180" /> {mkTri(lang)("Home", "Home", "Home", "Inicio", "Accueil", "خانه")}
        </button>
        <LegalPage />
      </div>
    );
  }

  if (sapori) return <SaporiCasa onBack={() => setSapori(false)} />;
  if (calc) return <CalcolatoreMetodo onBack={() => setCalc(false)} />;

  return (
    <div className="pb-2 space-y-6">
      {/* Card in alto: avatar digitale animato (finto video) */}
      <HomeAvatarScene lang={lang} />

      {/* Promo Social: unisciti alla community MikiLab */}
      <button data-testid="home-social-promo" onClick={() => go("community")}
        className="w-full text-left rounded-3xl p-5 border-2 border-[#ff6b00] bg-gradient-to-br from-[#ff6b00] to-[#c94f00] shadow-[0_4px_0_rgba(0,0,0,.35),0_6px_14px_rgba(255,107,0,.3)] active:scale-98 transition-all flex items-center gap-4">
        <Users className="w-9 h-9 text-white shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold text-white leading-tight">{mkTri(lang)("Unisciti alla community", "Tritt der Community bei", "Join the community", "Únete a la comunidad", "Rejoins la communauté", "به جامعه بپیوند")}</p>
          <p className="text-white/90 text-[13px] leading-snug">{mkTri(lang)("Condividi i tuoi pani, sfida altri fornai e scopri il Social di MikiLab", "Teile deine Brote und entdecke das MikiLab Social", "Share your breads, challenge bakers and explore MikiLab Social", "Comparte tus panes y descubre el Social de MikiLab", "Partage tes pains et découvre le Social MikiLab", "نان‌هایت را به اشتراک بگذار و سوشیال میکی‌لب را کشف کن")}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-white shrink-0" />
      </button>

      {/* HERO — 100% gratis (lead magnet: account gratuito) */}
      <div data-testid="home-hero" className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-[#ff6b00]/40"
        style={{ background: "linear-gradient(135deg,#1a1a1a 0%,#241206 55%,#3a1a00 100%)" }}>
        <div aria-hidden className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-30" style={{ background: "radial-gradient(circle,#ff8a33,transparent 70%)" }} />
        <div className="relative">
          <span data-testid="home-hero-badge" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#3a6b3a] bg-[#dff0dd] border border-[#8fbf8f] rounded-full px-3 py-1 mb-3">
            {L("✅ 100% Gratuito · Nessun pagamento · Nessuna carta",
               "✅ 100% Kostenlos · Keine Zahlung · Keine Karte",
               "✅ 100% Free · No payment · No card",
               "✅ 100% Gratis · Sin pago · Sin tarjeta",
               "✅ 100% Gratuit · Aucun paiement · Aucune carte",
               "✅ ۱۰۰٪ رایگان · بدون پرداخت · بدون کارت")}
          </span>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold leading-[1.1] text-white break-words">
            {L("Il tuo laboratorio di panificazione, 100% gratis",
               "Deine Backstube, 100% kostenlos",
               "Your bakery lab, 100% free",
               "Tu laboratorio de panificación, 100% gratis",
               "Ton laboratoire de boulangerie, 100% gratuit",
               "آزمایشگاه نان‌پزی شما، ۱۰۰٪ رایگان")}
          </h1>
          <p className="text-sm sm:text-base text-[#E0E0E0] leading-relaxed mt-3 max-w-xl">
            {L("Ricette testate col mio metodo, piani di produzione con l'IA, timer e calcolo costi. Tutto sbloccato, per sempre. Crea il tuo account gratis e inizia subito.",
               "Erprobte Rezepte nach meiner Methode, KI-Produktionspläne, Timer und Kostenrechnung. Alles freigeschaltet, für immer. Erstelle dein kostenloses Konto und leg sofort los.",
               "Tested recipes with my method, AI production plans, timers and cost calculation. Everything unlocked, forever. Create your free account and start now.",
               "Recetas probadas con mi método, planes de producción con IA, temporizadores y cálculo de costes. Todo desbloqueado, para siempre. Crea tu cuenta gratis y empieza ya.",
               "Des recettes testées selon ma méthode, des plans de production avec l'IA, des minuteurs et le calcul des coûts. Tout débloqué, pour toujours. Crée ton compte gratuit et commence tout de suite.",
               "دستورهای آزموده‌شده به روش من، برنامه‌های تولید با هوش مصنوعی، تایمر و محاسبه هزینه. همه‌چیز باز، برای همیشه. حساب رایگان خود را بسازید و همین حالا شروع کنید.")}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            {!user ? (
              <button data-testid="home-hero-cta" onClick={() => { setAuthOpen(true); try { window.dispatchEvent(new CustomEvent("mikilab-open-auth", { detail: { mode: "register" } })); } catch { /* */ } }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ff6b00] text-white font-bold text-sm sm:text-base px-6 py-3.5 shadow-lg active:scale-97 transition-all">
                {L("Crea il tuo account gratis", "Kostenloses Konto erstellen", "Create your free account", "Crea tu cuenta gratis", "Crée ton compte gratuit", "حساب رایگان خود را بسازید")}
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <p className="text-[13px] font-semibold text-[#ff6b00] flex items-center gap-1.5">
                <ChevronDown className="w-4 h-4" />
                {L("Scegli qui sotto il laboratorio con cui iniziare 👇", "Wähle unten dein Labor 👇", "Choose your lab below 👇", "Elige abajo tu laboratorio 👇", "Choisis ton laboratoire ci-dessous 👇", "آزمایشگاه خود را در زیر انتخاب کنید 👇")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Selettore rapido dei laboratori: Panetteria · Pizzeria · Pasticceria */}
      <div data-testid="home-lab-switch">
        <div className="flex items-center gap-2 mb-2 px-1">
          <h2 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{L("Scegli il tuo laboratorio", "Wähle dein Labor", "Choose your lab", "Elige tu laboratorio", "Choisis ton laboratoire", "آزمایشگاه خود را انتخاب کنید")}</h2>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: "pianoai", Icon: Wrench, label: L("Panetteria", "Bäckerei", "Bakery", "Panadería", "Boulangerie", "نانوایی"), grad: "from-[#ff6b00] to-[#ff6b00]" },
            { id: "labpizzeria", Icon: Pizza, label: L("Pizzeria", "Pizzeria", "Pizzeria", "Pizzería", "Pizzeria", "پیتزریا"), grad: "from-[#ff6b00] to-[#ff6b00]" },
            { id: "labpasticceria", Icon: Croissant, label: L("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "شیرینی‌پزی"), grad: "from-[#ff6b00] to-[#ff6b00]" },
          ].map(({ id, Icon, label, grad }) => (
            <button key={id} data-testid={`home-lab-${id}`} onClick={() => openLabTool(id)}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-white shadow-md active:scale-95 transition-all bg-gradient-to-br ${grad} min-h-[104px]`}>
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center"><Icon className="w-6 h-6" /></div>
              <span className="font-display text-[13px] font-bold text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Motore Sfide — sblocca contenuti completando le sfide (no pagamenti) */}
      <button data-testid="home-sfide-btn" onClick={() => { try { window.dispatchEvent(new CustomEvent("mikilab-go-challenges")); } catch { /* */ } }}
        className="w-full flex items-center gap-4 rounded-3xl p-5 text-[#161616] shadow-lg active:scale-98 transition-all"
        style={{ background: "linear-gradient(135deg,#ff6b00 0%,#ff6b00 60%,#ff6b00 100%)" }}>
        <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0"><Trophy className="w-6 h-6" /></div>
        <div className="flex-1 min-w-0 text-left">
          <h3 className="font-display text-lg font-bold">{L("Motore Sfide", "Challenges", "Challenge Engine", "Motor de Retos")}</h3>
          <p className="text-[#161616]/85 text-sm leading-snug">{L("Sblocca ricette e schede completando le sfide. Nessun pagamento.", "Inhalte durch Challenges freischalten. Keine Zahlung.", "Unlock recipes by completing challenges. No payment.", "Desbloquea recetas con retos. Sin pago.")}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-white/80 shrink-0" />
      </button>

      {/* Premio del Campione: banner speciale per il Fornaio della Settimana */}
      {isChampion && (
        <div data-testid="home-champion-banner" className="rounded-2xl p-4 text-white shadow-md flex items-center gap-3" style={{ background: "linear-gradient(135deg,#ff6b00,#7a531d)" }}>
          <span className="text-3xl">🏆</span>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold leading-tight">{L("Sei il Fornaio della Settimana!", "Du bist Bäcker der Woche!", "You're the Baker of the Week!", "¡Eres el Panadero de la Semana!")}</p>
            <p className="text-[12px] text-white/90 leading-snug">{L("Il badge 🏆 è sul tuo profilo Social. Difendi il titolo nella sfida a tema!", "Das 🏆-Abzeichen ist in deinem Profil. Verteidige den Titel in der Themen-Challenge!", "The 🏆 badge is on your Social profile. Defend your title in the themed challenge!", "La insignia 🏆 está en tu perfil. ¡Defiende tu título en el desafío temático!")}</p>
          </div>
        </div>
      )}

      {/* Annuncio della Sfida: tema quiz della settimana */}
      {weekTheme && (
        <button data-testid="home-weekly-challenge" onClick={() => onNavigate && onNavigate("impara")}
          className="w-full flex items-center gap-3 rounded-2xl p-4 text-left text-white shadow-md active:scale-98 transition-all" style={{ background: "linear-gradient(135deg,#ff6b00,#c94f00)" }}>
          <span className="text-2xl shrink-0">🔥</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/80">{L("Sfida della settimana", "Challenge der Woche", "Weekly challenge", "Desafío de la semana")}</p>
            <p className="font-display text-base font-bold leading-tight truncate">{weekTheme.title}</p>
            <p className="text-[12px] text-white/90 leading-snug">{L("Metti alla prova te e i tuoi amici nel quiz a tema!", "Fordere dich und deine Freunde im Themen-Quiz heraus!", "Challenge yourself and your friends in the themed quiz!", "¡Rétate a ti y a tus amigos en el quiz temático!")}</p>
          </div>
          <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full shrink-0">{L("Gioca", "Spielen", "Play", "Jugar")}</span>
        </button>
      )}


      {/* Messaggi non letti dagli amici */}
      {convos.length > 0 && (
        <div data-testid="home-unread-chats" className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-[#ff6b00]" />
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93]">{L("Messaggi non letti", "Ungelesene Nachrichten", "Unread messages", "Mensajes no leídos")}</p>
            <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-[#ff6b00] text-white text-[11px] font-bold flex items-center justify-center">{convos.reduce((a, x) => a + (x.unread || 0), 0)}</span>
          </div>
          <div className="space-y-1.5">
            {convos.slice(0, 4).map((c) => (
              <button key={c.other_id} data-testid={`home-chat-${c.other_id}`} onClick={() => { setChatUser({ user_id: c.other_id, name: c.name, picture: c.picture }); setChatOpen(true); }}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#121212] dark:hover:bg-[#242424] active:scale-98 transition-all text-left">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1c1c1c] flex items-center justify-center text-white text-sm font-bold shrink-0">{c.picture ? <img src={c.picture} alt={c.name} className="w-full h-full object-cover" /> : (c.name || "F")[0].toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] truncate">{c.name}</p>
                  <p className="text-[12px] text-[#7E8A93] truncate">{c.last}</p>
                </div>
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff6b00] text-white text-[10px] font-bold flex items-center justify-center shrink-0">{c.unread}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <ChatPanel open={chatOpen} onClose={() => { setChatOpen(false); setChatUser(null); }} initialUser={chatUser} />

      {/* ===== MIKILAB + SCOPRI MIKILAB uniti in un'unica card ===== */}
      {false && (<div data-testid="home-story" className="-mt-2">
        <button data-testid="home-story-toggle" onClick={toggleStory}
          className="w-full text-left relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] text-white shadow-lg active:scale-98 transition-all">
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
                {/* Scopri MikiLab — versione semplificata: un solo testo */}
                <div data-testid="home-about" className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] text-white shadow-xl">
                  <img src={`${process.env.PUBLIC_URL}/michele-real-lab.jpg`} alt="Michele" className="w-full h-52 object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="MikiLab" className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/40" />
                      <h1 className="font-display text-2xl font-bold">MikiLab</h1>
                    </div>
                    <p className="text-[15px] leading-relaxed text-white/95">{L(
                      "Ciao, sono Michele: fornaio e appassionato di arte bianca. MikiLab è il sito che ho creato per aiutare i panettieri a organizzare il lavoro come lo farei io. Trovi ricette dettagliate, liste della spesa, la pianificazione della produzione e un assistente AI che calcola e adatta ogni fase senza errori. C'è anche il Social dei Panettieri per condividere idee, foto e ricette, trovare colleghi e comprare o vendere attrezzatura usata. Tu pensi al laboratorio, al resto pensiamo noi — in italiano, tedesco, inglese e spagnolo, su smartphone e PC.",
                      "Hallo, ich bin Michele: Bäcker mit Leidenschaft für die Backkunst. MikiLab ist die Website, die ich erstellt habe, um Bäckern zu helfen, ihre Arbeit so zu organisieren, wie ich es tun würde. Du findest detaillierte Rezepte, Einkaufslisten, die Produktionsplanung und einen KI-Assistenten, der jede Phase fehlerfrei berechnet und anpasst. Es gibt auch das Bäcker-Social zum Teilen von Ideen, Fotos und Rezepten, um Kollegen zu finden und gebrauchte Ausrüstung zu kaufen oder zu verkaufen. Du kümmerst dich um die Backstube, um den Rest kümmern wir uns — auf Italienisch, Deutsch, Englisch und Spanisch, auf Smartphone und PC.",
                      "Hi, I'm Michele: a baker in love with the baking craft. MikiLab is the site I built to help bakers organise their work exactly as I would. You'll find detailed recipes, shopping lists, production planning and an AI assistant that calculates and adapts every stage with no errors. There's also the Bakers' Social to share ideas, photos and recipes, meet fellow bakers and buy or sell used equipment. You focus on the bakery, we take care of the rest — in Italian, German, English and Spanish, on smartphone and PC.",
                      "Hola, soy Michele: panadero apasionado por el arte blanco. MikiLab es el sitio que creé para ayudar a los panaderos a organizar el trabajo como lo haría yo. Encontrarás recetas detalladas, listas de la compra, la planificación de la producción y un asistente de IA que calcula y adapta cada fase sin errores. También está el Social de Panaderos para compartir ideas, fotos y recetas, encontrar colegas y comprar o vender equipo usado. Tú piensa en el obrador, del resto nos encargamos nosotros — en italiano, alemán, inglés y español, en móvil y PC."
                    )}</p>
                  </div>
                </div>
                {false && (<>
                <div data-testid="home-lab-photo" className="rounded-3xl overflow-hidden shadow-xl ring-2 ring-[#ff6b00]/40 relative">
                  <img src={`${process.env.PUBLIC_URL}/michele-real-lab.jpg`} alt={L("Michele, mani in pasta", "Michele, mittendrin im Teig", "Michele, hands in the dough", "Michele, con las manos en la masa")}
                    className="w-full h-56 object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white font-display text-lg font-bold leading-tight">{L("Michele, mani in pasta", "Michele, mittendrin im Teig", "Michele, hands in the dough", "Michele, con las manos en la masa")}</p>
                    <p className="text-white/85 text-xs leading-snug">{L("Passione, metodo e arte bianca — ogni giorno.", "Leidenschaft, Methode und Backkunst — jeden Tag.", "Passion, method and the baking craft — every day.", "Pasión, método y arte blanco — cada día.")}</p>
                  </div>
                </div>

                <div data-testid="bio-card" className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] text-white shadow-xl p-7 text-center">
                  <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="MikiLab" data-testid="bio-logo"
                    className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[#ff6b00]/70 shadow-lg mx-auto mb-4" />
                  <h1 className="font-display text-3xl font-bold">MikiLab</h1>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/75 mt-2">{t("brand_subtitle")} <span>🇮🇹</span> <span>🇩🇪</span></p>
                </div>

                <div data-testid="home-promo" className="rounded-3xl bg-[#e4eff8] dark:bg-[#181818] border border-[#ff6b00]/40 shadow-md p-5 flex items-start gap-4">
                  <img src={`${process.env.PUBLIC_URL}/michele-avatar.jpg`} alt="Michele" loading="lazy"
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#ff6b00]/50 shrink-0"
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  <p className="text-sm text-[#3F4A54] dark:text-[#e4eff8] leading-relaxed">
                    {L(
                      "Un sito pensato per organizzare il lavoro proprio come lo faresti tu. Dalla gestione dettagliata delle ricette alla lista della spesa, fino alla pianificazione precisa della produzione in laboratorio. In più, con l'aiuto dell'AI potrai calcolare, adattare e gestire ogni fase senza margine di errore: tu pensi al laboratorio, al resto ci pensiamo noi.",
                      "Eine Website, die die Arbeit genau so organisiert, wie du es tun würdest. Von der detaillierten Rezeptverwaltung über die Einkaufsliste bis zur präzisen Produktionsplanung in der Backstube. Und mit Hilfe der KI kannst du jede Phase ohne Fehler berechnen, anpassen und steuern: Du kümmerst dich um die Backstube, um den Rest kümmern wir uns.",
                      "A website designed to organise the work exactly as you would. From detailed recipe management to the shopping list, all the way to precise production planning in the bakery. Plus, with AI's help you can calculate, adapt and manage every stage with no margin for error: you focus on the bakery, we take care of the rest."
                    )}
                  </p>
                </div>

                <div data-testid="home-features" className="rounded-3xl bg-white dark:bg-[#181818] border border-[#2b2b2b] dark:border-[#2e2e2e] shadow-md overflow-hidden">
                  <div className="bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] text-white px-5 py-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-display text-lg font-bold">{L("Cosa puoi fare con MikiLab", "Was du mit MikiLab machen kannst", "What you can do with MikiLab", "Qué puedes hacer con MikiLab")}</h3>
                  </div>
                  <div className="divide-y divide-[#2b2b2b] dark:divide-[#2e2e2e]">
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
                      <div key={i} data-testid={`lab-gallery-${i}`} className="shrink-0 w-60 rounded-2xl overflow-hidden bg-[#2B303B] ring-1 ring-[#ff6b00]/30">
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
                              <div data-testid={`concept-content-${c.id}`} className="rounded-b-3xl bg-white dark:bg-[#181818] border border-t-0 border-[#2b2b2b] dark:border-[#2e2e2e] overflow-hidden">
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

                <div data-testid="home-joke" className="flex items-start gap-3 rounded-2xl bg-[#ff6b00]/12 border border-[#ff6b00]/30 p-4">
                  <Laugh className="w-5 h-5 text-[#ff6b00] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] italic leading-relaxed">{joke}</p>
                </div>
                </>)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>)}

      {/* ===== IL CUORE DI MIKILAB: le 3 sezioni-anima, in evidenza ===== */}
      <div data-testid="home-core">
        <div className="flex items-center gap-2 mb-1 px-1">
          <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{L("Il cuore di MikiLab", "Das Herz von MikiLab", "The heart of MikiLab")}</h2>
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] bg-[#ff6b00]/15 border border-[#ff6b00]/40 px-2 py-0.5 rounded-full">{L("L'anima del sito", "Die Seele", "The soul")}</span>
        </div>
        <div className="h-1 w-12 rounded-full bg-[#ff6b00] mb-3 ml-1" />

        {/* 1) Le Mie Ricette + I Miei Corsi */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button data-testid="home-core-ricette" onClick={() => go("ricette")}
            className="relative text-left rounded-2xl p-4 text-white shadow-md active:scale-97 transition-all bg-gradient-to-br from-[#1c1c1c] to-[#16202b] min-h-[112px] flex flex-col gap-2 ring-2 ring-[#ff6b00]/70 overflow-hidden">
            <span className="absolute top-2.5 right-2.5 text-[9px] font-bold uppercase tracking-wide bg-[#ff6b00] text-white px-2 py-0.5 rounded-full">{L("Inizia qui", "Hier starten", "Start here", "Empieza aquí", "Commence ici", "از اینجا شروع کن")}</span>
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center"><BookOpen className="w-6 h-6" /></div>
            <p className="font-display text-base font-bold leading-tight">{L("Le Mie Ricette", "Meine Rezepte", "My Recipes")}</p>
            <p className="text-[11px] text-white/85 leading-snug">{L("Le ricette col mio metodo", "Rezepte mit meiner Methode", "Recipes with my method")}</p>
          </button>
          <button data-testid="home-core-corsi" onClick={() => go("shop")}
            className="text-left rounded-2xl p-4 text-white shadow-md active:scale-97 transition-all bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] min-h-[112px] flex flex-col gap-2">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center"><GraduationCap className="w-6 h-6" /></div>
            <p className="font-display text-base font-bold leading-tight">{L("I Miei Corsi", "Meine Kurse", "My Courses")}</p>
            <p className="text-[11px] text-white/85 leading-snug">{L("Corsi online di Michele (in arrivo)", "Micheles Online-Kurse (bald)", "Michele's online courses (soon)")}</p>
          </button>
        </div>

        {/* 2) Il Tuo Laboratorio — grande e in evidenza, subito dopo le ricette */}
        <button data-testid="home-core-maestro" onClick={() => go("maestro")}
          className="relative w-full text-left rounded-3xl p-5 text-white shadow-xl active:scale-98 transition-all bg-gradient-to-br from-[#ff6b00] to-[#ff6b00] ring-2 ring-[#ff6b00]/70 overflow-hidden">
          <div className="it-de-ribbon absolute top-0 left-0 right-0" />
          <div className="flex items-center gap-3 mt-1">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0"><Wrench className="w-7 h-7" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold">{L("Il Tuo Laboratorio", "Dein Labor", "Your Lab")}</h3>
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">{L("Gratis", "Gratis", "Free", "Gratis", "Gratuit", "رایگان")}</span>
              </div>
              <p className="text-white/85 text-sm leading-snug">{L("Genera il piano IA, timer, costi, celle e impasti — tutto in un posto.", "KI-Plan, Timer, Kosten, Kammern & Teige — alles an einem Ort.", "Generate the AI plan, timers, costs, cells & doughs — all in one place.")}</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/80 shrink-0" />
          </div>
        </button>
      </div>

      {/* Newsletter — lead magnet 100% gratis */}
      <NewsletterSignup />

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
