import { BookOpen } from "lucide-react";
import { content } from "@/data/content";
import { useLang } from "@/i18n/LanguageContext";

export default function Encyclopedia() {
  const { t, lang } = useLang();
  const { encyclopedia } = content[lang];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#7E8A93]">
        <BookOpen className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{t("enc_label")}</span>
      </div>
      {encyclopedia.map((e, i) => (
        <div key={i} data-testid={`encyclopedia-${i}`} className="bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-2xl p-5">
          <h3 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#e4eff8]">{e.title}</h3>
          <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] mt-1 leading-relaxed">{e.body}</p>
        </div>
      ))}
    </div>
  );
}
