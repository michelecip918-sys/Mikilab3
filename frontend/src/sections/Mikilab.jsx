import RecipeList from "@/components/RecipeList";
import { useLang } from "@/i18n/LanguageContext";
import { Heart } from "lucide-react";

export default function Mikilab() {
  const { t } = useLang();
  return (
    <div>
      <div data-testid="bio-card" className="mb-5 rounded-3xl p-5 bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] text-white">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5" />
          <h2 className="font-display text-xl font-bold">{t("bio_title")}</h2>
        </div>
        <p className="text-sm text-white/90 leading-relaxed">{t("bio_text")}</p>
      </div>
      <RecipeList
        collectionName="mikilab"
        heroImage="https://images.unsplash.com/photo-1675725291010-cb1020860cb2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxhcnRpc2FuJTIwc291cmRvdWdoJTIwYnJlYWQlMjBiYWtlcnklMjB3b29kJTIwb3ZlbiUyMGZsb3VyfGVufDB8fHx8MTc4Njk4MjgxOXww&ixlib=rb-4.1.0&q=85"
        heroTitle={t("mikilab_title")}
        heroSubtitle={t("mikilab_subtitle")}
        emptyText={t("mikilab_empty")}
      />
    </div>
  );
}
