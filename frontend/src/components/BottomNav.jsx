import { BookOpen, Wrench, GraduationCap, Newspaper, Camera, MessageCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

export default function BottomNav({ active, onChange }) {
  const { t } = useLang();
  const TABS = [
    { id: "mikilab", label: t("nav_mikilab"), Icon: BookOpen },
    { id: "maestro", label: t("nav_maestro"), Icon: Wrench },
    { id: "foto", label: t("nav_foto"), Icon: Camera },
    { id: "impara", label: t("nav_impara"), Icon: GraduationCap },
    { id: "news", label: t("nav_news"), Icon: Newspaper },
    { id: "chiedi", label: t("nav_chiedi"), Icon: MessageCircle },
  ];

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 inset-x-0 bg-[#FDFBF7]/95 dark:bg-[#1A1412]/95 backdrop-blur-md border-t border-[#E8DEC8] dark:border-[#3D302A] z-50 shadow-[0_-4px_20px_rgba(44,34,30,0.06)]"
    >
      <div aria-hidden className="flex h-1 w-full">
        <div className="flex-1 bg-[#009246]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#CE2B37]" />
        <div className="flex-1 bg-[#111111]" />
        <div className="flex-1 bg-[#DD0000]" />
        <div className="flex-1 bg-[#FFCE00]" />
      </div>
      <div className="max-w-xl mx-auto grid grid-cols-6 gap-0.5 px-1 py-2">
        {TABS.map(({ id, label, Icon }) => {
          const on = active === id;
          return (
            <button
              key={id}
              data-testid={`nav-tab-${id}`}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-0.5 rounded-xl transition-all min-h-[52px] ${
                on
                  ? "bg-[#B34A26] text-white shadow-md"
                  : "text-[#8C7567] hover:bg-[#F5EFE6] dark:hover:bg-[#332823]"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={on ? 2.4 : 2} />
              <span className="text-[9px] font-semibold leading-none text-center">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
