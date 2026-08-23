import { useState } from "react";
import { GraduationCap, Newspaper, Library } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import AcademyHome from "@/sections/AcademyHome";
import NewsPage from "@/sections/NewsPage";
import Enciclopedia from "@/sections/Enciclopedia";
import PaywallGate from "@/components/PaywallGate";

// Pagina unica: Impara (Video Mentore) + News + Enciclopedia del Pane con sotto-schede.
export default function LearnHub({ initial = "impara", onNavigate }) {
  const { t, lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const [sub, setSub] = useState(["impara", "news", "enciclopedia"].includes(initial) ? initial : "impara");

  const TABS = [
    { id: "impara", label: tri("Video Mentore", "Mentor-Videos", "Mentor Videos"), Icon: GraduationCap },
    { id: "news", label: t("nav_news"), Icon: Newspaper },
    { id: "enciclopedia", label: tri("Enciclopedia del Pane", "Brot-Lexikon", "Bread Encyclopedia"), Icon: Library },
  ];

  return (
    <div>
      <div data-testid="learn-subnav" className="grid grid-cols-3 gap-1.5 bg-[#EAF0EC] dark:bg-[#1F252B] p-1.5 rounded-2xl mb-5 sticky top-2 z-10 border border-[#D7E1DB] dark:border-[#38424B]">
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

      {sub === "impara" && (
        <PaywallGate feature="beginners" sectionName={tri("Impara da Casa", "Von zu Hause lernen", "Learn from Home")}><AcademyHome onNavigate={onNavigate} /></PaywallGate>
      )}
      {sub === "news" && <NewsPage />}
      {sub === "enciclopedia" && <Enciclopedia />}
    </div>
  );
}
