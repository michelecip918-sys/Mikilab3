import { Wheat, Moon, Sun, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";

export default function Header() {
  const [dark, setDark] = useState(false);
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-40 bg-[#FDFBF7]/95 dark:bg-[#1A1412]/95 backdrop-blur-md border-b border-[#E8DEC8] dark:border-[#3D302A]"
    >
      {/* Fascia bandiere: Italia (verde-bianco-rosso) + Germania (nero-rosso-oro) */}
      <div data-testid="flag-strip" aria-hidden className="flex h-1.5 w-full">
        <div className="flex-1 bg-[#009246]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#CE2B37]" />
        <div className="flex-1 bg-[#111111]" />
        <div className="flex-1 bg-[#DD0000]" />
        <div className="flex-1 bg-[#FFCE00]" />
      </div>

      <div className="px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[#B34A26] flex items-center justify-center shadow-sm ring-2 ring-[#FFCE00]/70">
          <Wheat className="w-5 h-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="leading-none">
          <div className="font-display text-xl font-bold text-[#2C221E] dark:text-[#F5EFE6]">
            Mikilab
          </div>
          <div className="text-[10px] tracking-wider uppercase font-semibold text-[#8C7567] flex items-center gap-1">
            <span>🇮🇹</span> {t("brand_subtitle")} <span>🇩🇪</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language switcher IT / DE */}
        <div
          data-testid="lang-switcher"
          className="flex items-center bg-[#F5EFE6] dark:bg-[#332823] rounded-xl border border-[#E8DEC8] dark:border-[#3D302A] p-0.5"
          aria-label={t("lang_label")}
        >
          {["it", "de"].map((l) => (
            <button
              key={l}
              data-testid={`lang-${l}`}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                lang === l
                  ? "bg-[#B34A26] text-white shadow-sm"
                  : "text-[#8C7567]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          data-testid="theme-toggle"
          onClick={() => setDark((d) => !d)}
          className="w-10 h-10 rounded-xl bg-[#F5EFE6] dark:bg-[#332823] border border-[#E8DEC8] dark:border-[#3D302A] flex items-center justify-center text-[#B34A26] active:scale-95 transition-all"
          aria-label={t("theme_toggle")}
        >
          {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
      </div>
      </div>
    </header>
  );
}
