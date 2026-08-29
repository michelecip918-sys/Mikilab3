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
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#2f6a97] to-[#325046] p-6 text-white">
        <div className="it-de-ribbon absolute top-0 left-0 right-0" />
        <HeroAvatar />
        <Newspaper className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{t("news_page_title")}</h1>
        <div className="h-1 w-12 rounded-full bg-[#ff6b00] mt-1.5" />
        <p className="text-white/85 text-sm mt-1">{t("news_page_sub")}</p>
      </div>

      {news.length > 0 && (
        <div className="space-y-3 mb-6">
          {news.map((n, i) => (
            <div key={i} data-testid={`news-highlight-${i}`} className={`rounded-2xl p-5 border ${n.highlight ? "bg-[#ff6b00]/10 border-[#ff6b00]/40" : "bg-white dark:bg-[#1e1e1e] border-[#2b2b2b] dark:border-[#2e2e2e]"}`}>
              <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${n.highlight ? "text-white bg-[#ff6b00]" : "text-[#ff6b00] bg-[#ff6b00]/15"}`}>{n.tag}</span>
              <h3 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#e4eff8]">{n.title}</h3>
              <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-1 leading-relaxed">{n.body}</p>
            </div>
          ))}
        </div>
      )}

      <Stoccarda />
    </div>
  );
}
