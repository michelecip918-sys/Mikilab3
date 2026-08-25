import { useState } from "react";
import { GraduationCap, Newspaper } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import Beginners from "@/sections/Beginners";
import NewsPage from "@/sections/NewsPage";

// Pagina Impara: Impara (Video Mentore) + News. (Enciclopedia spostata definitivamente in Ricette.)
export default function LearnHub({ initial = "impara", onNavigate }) {
  const { t, lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const [sub, setSub] = useState(["impara", "news"].includes(initial) ? initial : "impara");

  const TABS = [
    { id: "impara", label: tri("Impara da Casa", "Von zu Hause lernen", "Learn from Home"), Icon: GraduationCap },
    { id: "news", label: t("nav_news"), Icon: Newspaper },
  ];

  return (
    <div>
      <div data-testid="learn-subnav" className="grid grid-cols-2 gap-1.5 bg-[#EAF0EC] dark:bg-[#1F252B] p-1.5 rounded-2xl mb-5 sticky top-2 z-10 border border-[#D7E1DB] dark:border-[#38424B]">
        {TABS.map(({ id, label, Icon }) => {
          const on = sub === id;
          return (
            <button key={id} data-testid={`learn-tab-${id}`} onClick={() => setSub(id)}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                on ? "bg-[#5E8B7E] text-white shadow-md" : "text-[#7E8A93] hover:bg-white/60 dark:hover:bg-[#2A323A]"
              }`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Impara: GRATIS per tutti — laboratorio in versione semplice + tutto per il principiante */}
      {sub === "impara" && <Beginners onNavigate={onNavigate} />}
      {sub === "news" && <NewsPage />}
    </div>
  );
}
