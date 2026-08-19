import { Newspaper } from "lucide-react";
import Stoccarda from "@/sections/Stoccarda";
import { useLang } from "@/i18n/LanguageContext";

export default function NewsPage() {
  const { t } = useLang();
  return (
    <div data-testid="news-page" className="pb-4">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#6B8E62] to-[#4d6b45] p-6 text-white">
        <div className="absolute top-0 left-0 right-0 flex h-1.5">
          <div className="flex-1 bg-[#009246]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#CE2B37]" />
          <div className="flex-1 bg-black" /><div className="flex-1 bg-[#DD0000]" /><div className="flex-1 bg-[#FFCE00]" />
        </div>
        <Newspaper className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{t("news_page_title")}</h1>
        <p className="text-white/85 text-sm mt-1">{t("news_page_sub")}</p>
      </div>
      <Stoccarda />
    </div>
  );
}
