import { BookOpen } from "lucide-react";
import { content } from "@/data/content";
import { useLang } from "@/i18n/LanguageContext";

export default function Encyclopedia() {
  const { t, lang } = useLang();
  const { encyclopedia } = content[lang];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#8C7567]">
        <BookOpen className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{t("enc_label")}</span>
      </div>
      {encyclopedia.map((e, i) => (
        <div key={i} data-testid={`encyclopedia-${i}`} className="bg-white dark:bg-[#2A211D] border border-[#E8DEC8] dark:border-[#3D302A] rounded-2xl p-5">
          <h3 className="font-display text-lg font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{e.title}</h3>
          <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] mt-1 leading-relaxed">{e.body}</p>
        </div>
      ))}
    </div>
  );
}
