import RecipeList from "@/components/RecipeList";
import GuidaMetodi from "@/sections/GuidaMetodi";
import PanettoneLabels from "@/sections/PanettoneLabels";
import { useLang } from "@/i18n/LanguageContext";
import { content } from "@/data/content";
import { Heart, ChefHat, Wheat, Sparkles, BookHeart, BookOpen, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function Mikilab() {
  const { t, lang } = useLang();
  const [imgOk, setImgOk] = useState(true);
  const [view, setView] = useState("main");
  const lm = content[lang].lievitoMadre;

  if (view === "lievito") {
    return (
      <div className="pb-4">
        <BackBtn onClick={() => setView("main")} />
        <div data-testid="lievito-page" className="space-y-4">
          <div className="rounded-2xl p-5 bg-[#D99B26]/12 border border-[#D99B26]/40">
            <div className="flex items-center gap-2 mb-2">
              <Wheat className="w-5 h-5 text-[#B34A26]" />
              <h2 className="font-display text-xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("lm_page_title")}</h2>
            </div>
            <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed">{lm.intro}</p>
          </div>
          {lm.sections.map((s, i) => (
            <div key={i} data-testid={`lm-section-${i}`} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5">
              <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{s.title}</h3>
              <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-1 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === "guida") {
    return (
      <div className="pb-4">
        <BackBtn onClick={() => setView("main")} />
        <GuidaMetodi />
      </div>
    );
  }

  if (view === "labels") {
    return (
      <div className="pb-4">
        <BackBtn onClick={() => setView("main")} />
        <PanettoneLabels />
      </div>
    );
  }

  return (
    <div>
      {/* Bio: Benvenuti + Chi sono */}
      <div data-testid="bio-card" className="mb-5 rounded-3xl overflow-hidden bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] text-white">
        <div className="p-5">
          <div className="flex justify-center mb-3">
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="Mikilab"
              data-testid="bio-logo"
              className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[#FFCE00]/70 shadow-lg"
            />
          </div>
          <p data-testid="bio-welcome-sub" className="text-center text-[11px] uppercase tracking-wider text-white/70 mb-3">{t("bio_welcome_sub")} <span>🇮🇹</span> <span>🇩🇪</span></p>
          <p data-testid="bio-welcome-body" className="text-sm text-white/90 leading-relaxed">{t("bio_welcome_body")}</p>
          <figure className="mt-4">
            <img
              src={`${process.env.PUBLIC_URL}/bio-dough.jpg`}
              alt="Michele — impasto in mano"
              data-testid="bio-dough-photo"
              className="w-full rounded-2xl object-contain bg-[#1A1412] ring-2 ring-[#FFCE00]/60 shadow-xl"
            />
            <figcaption className="text-center text-[11px] text-white/70 mt-2 italic">{t("bio_dough_caption")}</figcaption>
          </figure>
        </div>

        <div className="px-5 pb-5 pt-4 border-t border-white/15">
          <div className="flex items-center gap-3 mb-3">
            <div data-testid="bio-photo" className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-white/15 border-2 border-white/40 flex items-center justify-center">
              {imgOk ? (
                <img src={`${process.env.PUBLIC_URL}/michele-cartoon.jpg`} alt="Michele" className="w-full h-full object-cover" onError={() => setImgOk(false)} />
              ) : (
                <ChefHat className="w-8 h-8 text-white/80" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#FFCE00]" />
              <h3 className="font-display text-lg font-bold">{t("bio_about_title")}</h3>
            </div>
          </div>
          <figure className="mb-4">
            <img data-testid="bio-cartoon" src={`${process.env.PUBLIC_URL}/michele-cartoon.jpg`} alt="Michele — Mikilab"
              className="w-40 h-40 mx-auto rounded-3xl object-cover border-2 border-[#FFCE00]/50 shadow-lg" />
            <figcaption className="text-center text-[11px] text-white/70 mt-2 italic">{t("bio_dough_caption")}</figcaption>
          </figure>
          <p className="text-sm text-white/90 leading-relaxed whitespace-pre-line">{t("bio_about_body")}</p>
        </div>
      </div>

      {/* Accessi rapidi: Lievito madre · Guida ai metodi · Etichette */}
      <AccessBtn testid="lievito-open-btn" Icon={Wheat} title={t("tab_lievito")} sub={t("lm_page_title")} onClick={() => setView("lievito")} />
      <AccessBtn testid="guida-open-btn" Icon={BookOpen} title={t("tool_guida")} sub={t("mikilab_guida_sub")} onClick={() => setView("guida")} />
      <AccessBtn testid="labels-open-btn" Icon={Tag} title={t("tool_labels")} sub={t("mikilab_labels_sub")} onClick={() => setView("labels")} />

      {/* Metodo dell'impasto — diretto vs indiretto (prima delle ricette) */}
      <div data-testid="method-section" className="mt-2 mb-5 rounded-2xl bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-[#B34A26]" />
          <h2 className="font-display text-lg font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("method_section_title")}</h2>
        </div>
        <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed">{t("method_section_body")}</p>
        <div className="grid gap-3 mt-4 sm:grid-cols-2">
          {[["_606t-4KXT4", "method_video1_title"], ["HpOycYo1Cvc", "method_video2_title"]].map(([vid, tk]) => (
            <div key={vid} data-testid={`method-video-${vid}`} className="rounded-xl overflow-hidden border border-[#E8DEC8] dark:border-[#3D302A]">
              <div className="aspect-video bg-black">
                <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${vid}`} title={t(tk)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
              <p className="text-xs font-medium text-[#4A3B34] dark:text-[#C9BBB0] p-2.5">{t(tk)}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#8C7567] mt-2">{t("method_video_hint")}</p>
      </div>

      <RecipeList
        collectionName="mikilab"
        heroImage={`${process.env.PUBLIC_URL}/bio-photo.jpg`}
        heroTitle={t("brand_subtitle")}
        heroSubtitle={t("mikilab_subtitle")}
        emptyText={t("mikilab_empty")}
      />

      {/* Ringraziamenti ai follower */}
      <div data-testid="thanks-card" className="mt-5 rounded-3xl p-5 bg-[#6B8E62]/12 border border-[#6B8E62]/30">
        <div className="flex items-center gap-2 mb-2">
          <BookHeart className="w-5 h-5 text-[#4d6b45] dark:text-[#9ec48f]" />
          <h2 className="font-display text-lg font-bold text-[#2C221E] dark:text-[#F5EFE6]">{t("thanks_label")}</h2>
        </div>
        <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed">{t("thanks_body")}</p>
      </div>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button data-testid="mikilab-back-btn" onClick={onClick} className="flex items-center gap-1 text-[#B34A26] font-medium mb-4">
      <ChevronLeft className="w-5 h-5" /> Mikilab
    </button>
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
