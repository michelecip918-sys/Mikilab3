import { Home, BookOpen, Wrench, GraduationCap, Users } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

export default function BottomNav({ active, onChange }) {
  const { t } = useLang();
  // Impara resta evidenziato anche quando si è in News/Enciclopedia (stessa pagina).
  const norm = ["news", "enciclopedia"].includes(active) ? "impara" : active;
  const TABS = [
    { id: "home", label: t("nav_home"), Icon: Home },
    { id: "ricette", label: t("nav_ricette"), Icon: BookOpen },
    { id: "maestro", label: t("nav_maestro"), Icon: Wrench },
    { id: "impara", label: t("nav_impara"), Icon: GraduationCap },
    { id: "community", label: t("nav_community"), Icon: Users },
  ];

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 inset-x-0 bg-[#F6F8F5]/95 dark:bg-[#1B2127]/95 backdrop-blur-md border-t border-[#D7E1DB] dark:border-[#38424B] z-50 shadow-[0_-4px_20px_rgba(44,34,30,0.06)]"
    >
      <div aria-hidden className="flex h-1 w-full">
        <div className="flex-1 bg-[#6B8E62]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#6E8CA0]" />
        <div className="flex-1 bg-[#2B303B]" />
        <div className="flex-1 bg-[#6E8CA0]" />
        <div className="flex-1 bg-[#A9C5D4]" />
      </div>
      <div className="max-w-xl mx-auto grid grid-cols-5 gap-0.5 px-1 py-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        {TABS.map(({ id, label, Icon }) => {
          const on = norm === id;
          return (
            <button
              key={id}
              data-testid={`nav-tab-${id}`}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-0.5 rounded-xl transition-all min-h-[52px] ${
                on ? "bg-[#5E8B7E] text-white shadow-md" : "text-[#7E8A93] hover:bg-[#EAF0EC] dark:hover:bg-[#2A323A]"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={on ? 2.4 : 2} />
              <span className="text-[10px] font-semibold leading-none text-center">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
