import { Newspaper } from "lucide-react";
import Stoccarda from "@/sections/Stoccarda";
import { useLang } from "@/i18n/LanguageContext";
import { content } from "@/data/content";
import { HeroAvatar } from "@/components/MikiAvatar";

export default function NewsPage() {
  const { t, lang } = useLang();
  const news = content[lang].news || [];
  return (
    <div data-testid="news-page" className="pb-4">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#6B8E62] to-[#4d6b45] p-6 text-white">
        <div className="absolute top-0 left-0 right-0 flex h-1.5">
          <div className="flex-1 bg-[#6B8E62]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#6E8CA0]" />
          <div className="flex-1 bg-black" /><div className="flex-1 bg-[#6E8CA0]" /><div className="flex-1 bg-[#A9C5D4]" />
        </div>
        <HeroAvatar />
        <Newspaper className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{t("news_page_title")}</h1>
        <p className="text-white/85 text-sm mt-1">{t("news_page_sub")}</p>
      </div>

      {news.length > 0 && (
        <div className="space-y-3 mb-6">
          {news.map((n, i) => (
            <div key={i} data-testid={`news-highlight-${i}`} className={`rounded-2xl p-5 border ${n.highlight ? "bg-[#6E8CA0]/10 border-[#6E8CA0]/40" : "bg-white dark:bg-[#232A31] border-[#D7E1DB] dark:border-[#38424B]"}`}>
              <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${n.highlight ? "text-white bg-[#5E8B7E]" : "text-[#5E8B7E] bg-[#6E8CA0]/15"}`}>{n.tag}</span>
              <h3 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#EAF0EC]">{n.title}</h3>
              <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-1 leading-relaxed">{n.body}</p>
            </div>
          ))}
        </div>
      )}

      <Stoccarda />
    </div>
  );
}
