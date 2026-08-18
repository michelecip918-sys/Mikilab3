import RecipeList from "@/components/RecipeList";
import { useLang } from "@/i18n/LanguageContext";
import { content } from "@/data/content";
import { Heart, ChefHat, Wheat, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function Mikilab() {
  const { t, lang } = useLang();
  const [imgOk, setImgOk] = useState(true);
  const [view, setView] = useState("main");
  const lm = content[lang].lievitoMadre;

  if (view === "lievito") {
    return (
      <div className="pb-4">
        <button
          data-testid="lievito-back-btn"
          onClick={() => setView("main")}
          className="flex items-center gap-1 text-[#B34A26] font-medium mb-4"
        >
          <ChevronLeft className="w-5 h-5" /> Mikilab
        </button>
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

  return (
    <div>
      <div data-testid="bio-card" className="mb-5 rounded-3xl p-5 bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] text-white">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5" />
          <h2 className="font-display text-xl font-bold">{t("bio_title")}</h2>
        </div>
        <div className="flex items-start gap-4">
          <div data-testid="bio-photo" className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-white/15 border-2 border-white/40 flex items-center justify-center">
            {imgOk ? (
              <img
                src={`${process.env.PUBLIC_URL}/bio-photo.jpg`}
                alt="Mikilab"
                className="w-full h-full object-cover"
                onError={() => setImgOk(false)}
              />
            ) : (
              <ChefHat className="w-9 h-9 text-white/80" />
            )}
          </div>
          <p className="text-sm text-white/90 leading-relaxed flex-1">{t("bio_text")}</p>
        </div>
      </div>

      <button
        data-testid="lievito-open-btn"
        onClick={() => setView("lievito")}
        className="w-full mb-5 flex items-center gap-4 bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-4 shadow-sm active:scale-98 transition-all text-left"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#D99B26]/15 border border-[#D99B26]/30 flex items-center justify-center shrink-0">
          <Wheat className="w-6 h-6 text-[#B34A26]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{t("tab_lievito")}</h3>
          <p className="text-sm text-[#8C7567] truncate">{t("lm_page_title")}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-[#C9BBB0] shrink-0" />
      </button>

      <RecipeList
        collectionName="mikilab"
        readOnly
        heroImage="https://images.unsplash.com/photo-1675725291010-cb1020860cb2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxhcnRpc2FuJTIwc291cmRvdWdoJTIwYnJlYWQlMjBiYWtlcnklMjB3b29kJTIwb3ZlbiUyMGZsb3VyfGVufDB8fHx8MTc4Njk4MjgxOXww&ixlib=rb-4.1.0&q=85"
        heroTitle={t("mikilab_title")}
        heroSubtitle={t("mikilab_subtitle")}
        emptyText={t("mikilab_empty")}
      />
    </div>
  );
}
