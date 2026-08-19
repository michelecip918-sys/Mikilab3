import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ChefHat, MessageCircle, ChevronLeft, ChevronRight, BookOpen, Tag, Wheat, Sparkles, Droplets, FlaskConical } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { content } from "@/data/content";
import MaestroSaTutto from "@/sections/MaestroSaTutto";
import GuidaMetodi from "@/sections/GuidaMetodi";
import PanettoneLabels from "@/sections/PanettoneLabels";

const PREIMPASTI = {
  it: [
    { icon: "lm", title: "Lievito Madre / Sauerteig", body: "Lievito naturale a base di farina e acqua, rinfrescato regolarmente. Dà aroma, digeribilità e lunga conservazione. Il Weizensauerteig è di frumento, il Roggensauerteig di segale." },
    { icon: "poolish", title: "Poolish", body: "Prefermento liquido (farina e acqua in parti uguali + poco lievito), matura 8–16 h. Regala sofficità, aroma e una crosta più fragrante." },
    { icon: "koch", title: "Kochstück / Quellstück", body: "Metodi di idratazione dei cereali: nel Kochstück la farina viene scaldata con acqua (gelatinizzazione), nel Quellstück semi e cereali vengono messi in ammollo. Entrambi trattengono acqua e mantengono il pane morbido più a lungo." },
  ],
  de: [
    { icon: "lm", title: "Lievito Madre / Sauerteig", body: "Natürliches Triebmittel aus Mehl und Wasser, regelmäßig aufgefrischt. Gibt Aroma, Bekömmlichkeit und lange Haltbarkeit. Weizensauerteig aus Weizen, Roggensauerteig aus Roggen." },
    { icon: "poolish", title: "Poolish", body: "Flüssiger Vorteig (Mehl und Wasser zu gleichen Teilen + wenig Hefe), reift 8–16 h. Bringt Lockerheit, Aroma und eine knusprigere Kruste." },
    { icon: "koch", title: "Kochstück / Quellstück", body: "Methoden zur Hydratation von Getreide: beim Kochstück wird Mehl mit Wasser erhitzt (Verkleisterung), beim Quellstück werden Saaten und Körner eingeweicht. Beide binden Wasser und halten das Brot länger saftig." },
  ],
};

function PiIcon({ type }) {
  if (type === "poolish") return <Droplets className="w-5 h-5 text-[#B34A26]" />;
  if (type === "koch") return <FlaskConical className="w-5 h-5 text-[#B34A26]" />;
  return <Wheat className="w-5 h-5 text-[#B34A26]" />;
}

export default function Home() {
  const { t, lang } = useLang();
  const [imgOk, setImgOk] = useState(true);
  const [view, setView] = useState("main");

  if (view === "chat") return <SubView onBack={() => setView("main")}><MaestroSaTutto /></SubView>;
  if (view === "guida") return <SubView onBack={() => setView("main")}><GuidaMetodi /></SubView>;
  if (view === "labels") return <SubView onBack={() => setView("main")}><PanettoneLabels /></SubView>;

  return (
    <div className="pb-2">
      {/* Bio hub */}
      <div data-testid="bio-card" className="mb-5 rounded-3xl overflow-hidden bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] text-white shadow-xl">
        <div className="p-6">
          <div className="flex justify-center mb-3">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Mikilab" data-testid="bio-logo"
              className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[#FFCE00]/70 shadow-lg" />
          </div>
          <p className="text-center text-[11px] uppercase tracking-[0.18em] text-white/70 mb-3">{t("bio_welcome_sub")} <span>🇮🇹</span> <span>🇩🇪</span></p>
          <p data-testid="bio-welcome-body" className="text-sm text-white/90 leading-relaxed">{t("bio_welcome_body")}</p>
          <figure className="mt-4">
            <img src={`${process.env.PUBLIC_URL}/bio-dough.jpg`} alt="Michele — impasto in mano" data-testid="bio-dough-photo"
              className="w-full rounded-2xl object-contain bg-[#1A1412] ring-2 ring-[#FFCE00]/60 shadow-xl" />
          </figure>
        </div>
        <div className="px-6 pb-6 pt-4 border-t border-white/15">
          <div className="flex items-center gap-3 mb-3">
            <div data-testid="bio-photo" className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-white/15 border-2 border-white/40 flex items-center justify-center">
              {imgOk ? <img src={`${process.env.PUBLIC_URL}/bio-photo.jpg`} alt="Michele" className="w-full h-full object-cover" onError={() => setImgOk(false)} /> : <ChefHat className="w-8 h-8 text-white/80" />}
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#FFCE00]" />
              <h3 className="font-display text-lg font-bold">{t("bio_about_title")}</h3>
            </div>
          </div>
          <p className="text-sm text-white/90 leading-relaxed whitespace-pre-line">{t("bio_about_body")}</p>
        </div>
      </div>

      {/* Chiedi al Maestro — pulsante grande */}
      <button data-testid="home-chat-btn" onClick={() => setView("chat")}
        className="w-full mb-5 flex items-center gap-4 rounded-3xl p-5 bg-gradient-to-br from-[#6B8E62] to-[#4d6b45] text-white shadow-lg active:scale-98 transition-all">
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
          <MessageCircle className="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h3 className="font-display text-xl font-bold">{t("home_chat_btn")}</h3>
          <p className="text-white/85 text-sm">{t("home_chat_sub")}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-white/80 shrink-0" />
      </button>

      {/* Pre-impasti e Lieviti */}
      <div data-testid="preimpasti-section" className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[#B34A26]" />
          <h2 className="font-display text-xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{lang === "de" ? "Vorteige & Triebmittel" : "Pre-impasti e Lieviti"}</h2>
        </div>
        <div className="space-y-2.5">
          {PREIMPASTI[lang === "de" ? "de" : "it"].map((p, i) => (
            <motion.div key={i} data-testid={`preimpasto-${p.icon}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-2xl bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] p-4">
              <div className="flex items-center gap-2 mb-1">
                <PiIcon type={p.icon} />
                <h3 className="font-display text-base font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{p.title}</h3>
              </div>
              <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Accessi: Guida metodi · Etichette */}
      <AccessBtn testid="guida-open-btn" Icon={BookOpen} title={t("tool_guida")} sub={t("mikilab_guida_sub")} onClick={() => setView("guida")} />
      <AccessBtn testid="labels-open-btn" Icon={Tag} title={t("tool_labels")} sub={t("mikilab_labels_sub")} onClick={() => setView("labels")} />

      {/* Ringraziamenti */}
      <div data-testid="thanks-card" className="mt-5 rounded-3xl p-5 bg-[#6B8E62]/12 border border-[#6B8E62]/30">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-[#4d6b45] dark:text-[#9ec48f]" />
          <h2 className="font-display text-lg font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("thanks_label")}</h2>
        </div>
        <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed">{t("thanks_body")}</p>
      </div>
    </div>
  );
}

function SubView({ onBack, children }) {
  return (
    <div className="pb-4">
      <button data-testid="home-back-btn" onClick={onBack} className="flex items-center gap-1 text-[#B34A26] font-medium mb-4">
        <ChevronLeft className="w-5 h-5" /> Home
      </button>
      {children}
    </div>
  );
}

function AccessBtn({ testid, Icon, title, sub, onClick }) {
  return (
    <button data-testid={testid} onClick={onClick} className="w-full mb-3 flex items-center gap-4 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-4 shadow-sm active:scale-98 transition-all text-left">
      <div className="w-12 h-12 rounded-2xl bg-[#D99B26]/15 border border-[#D99B26]/30 flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-[#B34A26]" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{title}</h3>
        <p className="text-sm text-[#8C7567] truncate">{sub}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-[#C9BBB0] shrink-0" />
    </button>
  );
}
