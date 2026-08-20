import { useState } from "react";
import { GraduationCap, Newspaper, Library } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import Beginners from "@/sections/Beginners";
import NewsPage from "@/sections/NewsPage";
import Enciclopedia from "@/sections/Enciclopedia";
import PaywallGate from "@/components/PaywallGate";

// Pagina unica: Impara + News + Enciclopedia con sotto-schede.
export default function LearnHub({ initial = "impara" }) {
  const { t } = useLang();
  const [sub, setSub] = useState(["impara", "news", "enciclopedia"].includes(initial) ? initial : "impara");

  const TABS = [
    { id: "impara", label: t("nav_impara"), Icon: GraduationCap },
    { id: "news", label: t("nav_news"), Icon: Newspaper },
    { id: "enciclopedia", label: t("nav_enciclopedia"), Icon: Library },
  ];

  return (
    <div>
      <div data-testid="learn-subnav" className="grid grid-cols-3 gap-1.5 bg-[#F5EFE6] dark:bg-[#241D19] p-1.5 rounded-2xl mb-5 sticky top-2 z-10 border border-[#E8DEC8] dark:border-[#3D302A]">
        {TABS.map(({ id, label, Icon }) => {
          const on = sub === id;
          return (
            <button key={id} data-testid={`learn-tab-${id}`} onClick={() => setSub(id)}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                on ? "bg-[#B34A26] text-white shadow-md" : "text-[#8C7567] hover:bg-white/60 dark:hover:bg-[#332823]"
              }`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {sub === "impara" && (
        <PaywallGate feature="beginners" sectionName={t("nav_impara") === "Impara" ? "Sezione Principianti" : "Sektion Anfänger"}><Beginners /></PaywallGate>
      )}
      {sub === "news" && <NewsPage />}
      {sub === "enciclopedia" && <Enciclopedia />}
    </div>
  );
}
