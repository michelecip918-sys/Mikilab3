import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronRight, ChevronDown, Info, ChefHat, FlaskConical, Smile, BookOpen, Wrench, GraduationCap, Camera, Newspaper } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import MaestroSaTutto from "@/sections/MaestroSaTutto";
import LegalPage from "@/sections/LegalPage";
import RecipeList from "@/components/RecipeList";
import RecipeShowcase from "@/components/RecipeShowcase";
import ShareInstall from "@/components/ShareInstall";

const CONCEPTS = {
  it: [
    { id: "cosa", title: "Cosa fa Mikilab", icon: Info, grad: "from-[#B34A26] to-[#8C3A1D]",
      body: "Mikilab è il tuo laboratorio digitale e il tuo assistente personale: ricette spiegate passo dopo passo, pianificazione della produzione, diagnosi di pane e impasti da una semplice foto, riconoscimento di macchine e guasti, e un Maestro AI pronto a rispondere a ogni domanda. Tutto in italiano e in tedesco." },
    { id: "chi", title: "Chi sono io", icon: ChefHat, grad: "from-[#D99B26] to-[#B8801a]",
      body: "Sono Michele, panettiere per passione prima ancora che per mestiere. Amo il farro, il lievito madre e il profumo del pane appena sfornato. Ho creato Mikilab per mettere in tasca a ogni fornaio le mie ricette e il mio modo di lavorare, con la stessa cura che metto ogni giorno in laboratorio." },
    { id: "metodo", title: "Il mio Metodo", icon: FlaskConical, grad: "from-[#6B8E62] to-[#4d6b45]",
      body: "Il mio metodo unisce la tradizione italiana alla precisione tedesca: prefermenti (lievito madre, poolish, biga), la farina giusta al momento giusto e i tempi sempre rispettati. Sono le piccole idee — e l'esperienza — che rivoluzionano il lavoro in laboratorio, rendendolo più semplice, costante e sereno." },
    { id: "serenita", title: "Lavorare in Serenità", icon: Smile, grad: "from-[#3a2d27] to-[#1A1412]",
      body: "Lavora in totale serenità e zero stress: con Mikilab è praticamente come avere me al tuo fianco in forno a guidarti passaggio dopo passaggio… con il vantaggio che io non ti urlo dietro se sbagli un rinfresco! 😄" },
  ],
  de: [
    { id: "cosa", title: "Was Mikilab macht", icon: Info, grad: "from-[#B34A26] to-[#8C3A1D]",
      body: "Mikilab ist deine digitale Backstube und dein persönlicher Assistent: Schritt-für-Schritt-Rezepte, Produktionsplanung, Diagnose von Brot und Teigen per Foto, Erkennung von Maschinen und Störungen und ein Meister-KI, der jede Frage beantwortet. Alles auf Italienisch und Deutsch." },
    { id: "chi", title: "Wer ich bin", icon: ChefHat, grad: "from-[#D99B26] to-[#B8801a]",
      body: "Ich bin Michele, Bäcker aus Leidenschaft, noch bevor es mein Beruf wurde. Ich liebe Dinkel, Lievito Madre und den Duft von frisch gebackenem Brot. Mikilab habe ich geschaffen, um jedem Bäcker meine Rezepte und meine Arbeitsweise in die Tasche zu geben – mit der gleichen Sorgfalt, die ich täglich in die Backstube stecke." },
    { id: "metodo", title: "Meine Methode", icon: FlaskConical, grad: "from-[#6B8E62] to-[#4d6b45]",
      body: "Meine Methode verbindet italienische Tradition mit deutscher Präzision: Vorteige (Lievito Madre, Poolish, Biga), das richtige Mehl zur richtigen Zeit und stets eingehaltene Zeiten. Es sind die kleinen Ideen – und die Erfahrung – die die Arbeit in der Backstube revolutionieren: einfacher, gleichmäßiger und entspannter." },
    { id: "serenita", title: "Entspannt arbeiten", icon: Smile, grad: "from-[#3a2d27] to-[#1A1412]",
      body: "Arbeite völlig entspannt und ohne Stress: Mit Mikilab ist es fast so, als stünde ich neben dir am Ofen und führe dich Schritt für Schritt … mit dem Vorteil, dass ich dich nicht anschreie, wenn du eine Auffrischung verpatzt! 😄" },
  ],
};

const CONCEPT_PHOTOS = {
  chi: `${process.env.PUBLIC_URL}/michele-cartoon.jpg`,
  metodo: `${process.env.PUBLIC_URL}/bio-dough-2.jpg`,
};

export default function Home({ onNavigate }) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [chat, setChat] = useState(false);
  const [legal, setLegal] = useState(false);
  const [open, setOpen] = useState(null);
  const concepts = CONCEPTS[lang === "de" ? "de" : "it"];
  const go = (tab) => onNavigate && onNavigate(tab);

  const SECTIONS = [
    { tab: "ricette", label: t("nav_ricette"), Icon: BookOpen, grad: "from-[#B34A26] to-[#8C3A1D]" },
    { tab: "maestro", label: t("nav_maestro"), Icon: Wrench, grad: "from-[#D99B26] to-[#B8801a]" },
    { tab: "impara", label: t("nav_impara"), Icon: GraduationCap, grad: "from-[#6B8E62] to-[#4d6b45]" },
    { tab: "diagnosi", label: t("nav_foto"), Icon: Camera, grad: "from-[#8C7567] to-[#5f4f45]" },
    { tab: "news", label: t("nav_news"), Icon: Newspaper, grad: "from-[#4d6b45] to-[#374f31]" },
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
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/75 mt-2">{t("bio_welcome_sub")} <span>🇮🇹</span> <span>🇩🇪</span></p>
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

      {/* Sezioni — pulsanti a tutta larghezza (link diretti) */}
      <div className="grid grid-cols-2 gap-3" data-testid="home-sections">
        {SECTIONS.map(({ tab, label, Icon, grad }) => (
          <button key={tab} data-testid={`home-section-${tab}`} onClick={() => go(tab)}
            className={`flex items-center gap-3 rounded-2xl p-4 text-white shadow-md active:scale-97 transition-all bg-gradient-to-br ${grad}`}>
            <Icon className="w-6 h-6 shrink-0" />
            <span className="font-display text-base font-bold text-left leading-tight flex-1">{label}</span>
            <ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
          </button>
        ))}
      </div>

      {/* 4 concetti */}
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
                <h3 className="flex-1 min-w-0 text-left font-display text-xl font-bold">{c.title}</h3>
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

      {/* Le mie ricette private (solo loggati) */}
      {user && (
        <div data-testid="home-personal-recipes">
          <h2 className="font-display text-xl font-bold text-[#2C221E] dark:text-[#F5EFE6] mb-3">
            {lang === "de" ? "Meine privaten Rezepte" : "Le mie ricette private"}
          </h2>
          <RecipeList
            collectionName="personal"
            heroImage="https://images.unsplash.com/photo-1732565649629-eb4932a1ec09?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
            heroTitle={t("personal_hero_title")}
            heroSubtitle={t("personal_hero_sub")}
            emptyText={t("personal_empty")}
          />
        </div>
      )}

      {/* Le mie ricette (Mikilab) — vetrina */}
      <RecipeShowcase onOpen={() => go("ricette")} />

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
