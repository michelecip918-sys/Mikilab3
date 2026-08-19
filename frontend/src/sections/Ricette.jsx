import RecipeList from "@/components/RecipeList";
import { useLang } from "@/i18n/LanguageContext";

export default function Ricette() {
  const { t } = useLang();
  return (
    <div data-testid="ricette-page">
      <RecipeList
        collectionName="mikilab"
        heroImage="https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
        heroTitle={t("brand_subtitle")}
        heroSubtitle={t("mikilab_subtitle")}
        emptyText={t("mikilab_empty")}
      />
    </div>
  );
}
