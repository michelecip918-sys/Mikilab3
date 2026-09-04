import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const LANGS = [
  { code: "it", flag: "🇮🇹", label: "Italiano" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "fa", flag: "🇮🇷", label: "فارسی" },
];

export default function LangSelector({ testid = "lang-selector" }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cur = LANGS.find((l) => l.code === lang) || LANGS[0];

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button data-testid={`${testid}-btn`} onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0f172a] border border-[#1e293b] text-white hover:border-[#14b8a6] active:scale-95 transition-all">
        <Globe className="w-4 h-4 text-[#14b8a6]" />
        <span className="text-base leading-none">{cur.flag}</span>
        <span className="text-xs font-bold uppercase">{cur.code}</span>
      </button>
      {open && (
        <div data-testid={`${testid}-menu`} className="absolute right-0 top-11 w-40 rounded-xl bg-[#0b0f19] border border-[#1e293b] shadow-2xl p-1.5 z-[90]">
          {LANGS.map((l) => (
            <button key={l.code} data-testid={`${testid}-${l.code}`} onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${l.code === lang ? "bg-[#14b8a6]/15 text-[#14b8a6] font-bold" : "text-[#cbd5e1] hover:bg-[#0f172a]"}`}>
              <span className="text-base leading-none">{l.flag}</span>
              <span className="flex-1 text-left">{l.label}</span>
              {l.code === lang && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
