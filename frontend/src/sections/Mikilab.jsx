import RecipeList from "@/components/RecipeList";
import { useLang } from "@/i18n/LanguageContext";
import { Heart, ChefHat } from "lucide-react";
import { useState } from "react";

export default function Mikilab() {
  const { t } = useLang();
  const [imgOk, setImgOk] = useState(true);
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
