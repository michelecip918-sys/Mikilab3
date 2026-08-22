import { useState } from "react";
import { GraduationCap, Newspaper, Library, Users } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import Beginners from "@/sections/Beginners";
import NewsPage from "@/sections/NewsPage";
import Enciclopedia from "@/sections/Enciclopedia";
import Community from "@/sections/Community";
import PaywallGate from "@/components/PaywallGate";

// Pagina unica: Impara + News + Enciclopedia + Community con sotto-schede.
export default function LearnHub({ initial = "impara" }) {
  const { t, lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const [sub, setSub] = useState(["impara", "news", "enciclopedia", "community"].includes(initial) ? initial : "impara");

  const TABS = [
    { id: "impara", label: t("nav_impara"), Icon: GraduationCap },
    { id: "news", label: t("nav_news"), Icon: Newspaper },
    { id: "enciclopedia", label: t("nav_enciclopedia"), Icon: Library },
    { id: "community", label: tri("Community", "Community", "Community"), Icon: Users },
  ];

  return (
    <div>
      <div data-testid="learn-subnav" className="grid grid-cols-4 gap-1.5 bg-[#EAF0EC] dark:bg-[#1F252B] p-1.5 rounded-2xl mb-5 sticky top-2 z-10 border border-[#D7E1DB] dark:border-[#38424B]">
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
        <PaywallGate feature="beginners" sectionName={tri("Sezione Principianti", "Sektion Anfänger", "Beginners Section")}><Beginners /></PaywallGate>
      )}
      {sub === "news" && <NewsPage />}
      {sub === "enciclopedia" && <Enciclopedia />}
      {sub === "community" && <Community />}
    </div>
  );
}
