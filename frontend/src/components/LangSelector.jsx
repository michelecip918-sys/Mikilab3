import { useState, useRef, useEffect, useMemo } from "react";
import { Globe, Check, Search, Clock, Volume2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { playTTS } from "@/lib/tts";

// Frase-esempio per ascoltare la voce di Miki-Nexus in ogni lingua.
const SAMPLE = {
  it: "Salve Mio Supremo Capo, sono Miki-Nexus, al vostro servizio.",
  de: "Guten Tag, mein erhabener Chef, ich bin Miki-Nexus, zu Ihren Diensten.",
  en: "Hello Capo, I am Miki-Nexus, at your service.",
  es: "Hola Mi Supremo Jefe, soy Miki-Nexus, a su servicio.",
  fr: "Bonjour Mon Illustre Commandant, je suis Miki-Nexus, à votre service.",
  fa: "سلام فرمانده، من بوکومیکس هستم، در خدمت شما.",
  ar: "مرحباً أيها القائد، أنا مايك ميكس، في خدمتك.",
  tr: "Merhaba Şefim, ben Miki-Nexus, hizmetinizdeyim.",
};

// Lingue ATTIVE (dizionari completi) + set globale predisposto all'espansione.
const READY = [
  { code: "it", flag: "🇮🇹", label: "Italiano", native: "Italiano" },
  { code: "de", flag: "🇩🇪", label: "Deutsch", native: "German" },
  { code: "en", flag: "🇬🇧", label: "English", native: "English" },
  { code: "es", flag: "🇪🇸", label: "Español", native: "Spanish" },
  { code: "fr", flag: "🇫🇷", label: "Français", native: "French" },
  { code: "fa", flag: "🇮🇷", label: "فارسی", native: "Persian" },
  { code: "ar", flag: "🇸🇦", label: "العربية", native: "Arabic" },
  { code: "tr", flag: "🇹🇷", label: "Türkçe", native: "Turkish" },
];
// Predisposizione globale: mostrate come "in arrivo" (architettura espandibile).
const SOON = [
  { code: "pt", flag: "🇵🇹", label: "Português", native: "Portuguese" },
  { code: "pl", flag: "🇵🇱", label: "Polski", native: "Polish" },
  { code: "ro", flag: "🇷🇴", label: "Română", native: "Romanian" },
  { code: "ru", flag: "🇷🇺", label: "Русский", native: "Russian" },
  { code: "zh", flag: "🇨🇳", label: "中文", native: "Chinese" },
  { code: "hi", flag: "🇮🇳", label: "हिन्दी", native: "Hindi" },
  { code: "uk", flag: "🇺🇦", label: "Українська", native: "Ukrainian" },
  { code: "nl", flag: "🇳🇱", label: "Nederlands", native: "Dutch" },
];

export default function LangSelector({ testid = "lang-selector" }) {
  const { lang, setLang, tri } = useLang();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);
  const cur = READY.find((l) => l.code === lang) || READY[0];

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => { if (open && inputRef.current) setTimeout(() => inputRef.current.focus(), 50); }, [open]);

  const filt = (arr) => {
    const s = q.trim().toLowerCase();
    if (!s) return arr;
    return arr.filter((l) => l.label.toLowerCase().includes(s) || l.native.toLowerCase().includes(s) || l.code.includes(s));
  };
  const ready = useMemo(() => filt(READY), [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const soon = useMemo(() => filt(SOON), [q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={ref} className="relative">
      <button data-testid={`${testid}-btn`} onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0f172a] border border-[#1e293b] text-white hover:border-[#D95200] active:scale-95 transition-all">
        <Globe className="w-4 h-4 text-[#D95200]" />
        <span className="text-base leading-none">{cur.flag}</span>
        <span className="text-xs font-bold uppercase">{cur.code}</span>
      </button>
      {open && (
        <div data-testid={`${testid}-menu`} className="absolute right-0 top-11 w-64 max-h-[70vh] overflow-hidden rounded-xl bg-[#0b0f19] border border-[#1e293b] shadow-2xl z-[95] flex flex-col">
          <div className="p-2 border-b border-[#1e293b]">
            <div className="flex items-center gap-2 bg-[#030712] rounded-lg px-2.5 py-2 border border-[#1e293b] focus-within:border-[#D95200]">
              <Search className="w-4 h-4 text-[#64748B] shrink-0" />
              <input ref={inputRef} data-testid={`${testid}-search`} value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={tri("Cerca la tua lingua…", "Sprache suchen…", "Search your language…", "Busca tu idioma…", "Cherche ta langue…", "زبان خود را جستجو کن…")}
                className="flex-1 min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-[#64748B]" />
            </div>
          </div>
          <div className="overflow-y-auto p-1.5 space-y-0.5">
            {ready.map((l) => (
              <button key={l.code} data-testid={`${testid}-${l.code}`} onClick={() => { setLang(l.code); setOpen(false); setQ(""); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${l.code === lang ? "bg-[#D95200]/15 text-[#D95200] font-bold" : "text-[#cbd5e1] hover:bg-[#0f172a]"}`}>
                <span className="text-base leading-none">{l.flag}</span>
                <span className="flex-1 text-left">{l.label}</span>
                <span data-testid={`${testid}-preview-${l.code}`} role="button" tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); try { playTTS(SAMPLE[l.code] || SAMPLE.en, { lang: l.code, voice: "bakemix" }); } catch { /* */ } }}
                  className="shrink-0 p-1 rounded-md hover:bg-[#D95200]/20 text-[#D95200]" title={tri("Ascolta un esempio", "Beispiel anhören", "Listen to a sample", "Escuchar ejemplo", "Écouter un exemple", "شنیدن نمونه")}>
                  <Volume2 className="w-3.5 h-3.5" />
                </span>
                {l.code === lang && <Check className="w-4 h-4" />}
              </button>
            ))}
            {soon.length > 0 && (
              <>
                <p className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#475569]">{tri("In arrivo (espandibile)", "Bald (erweiterbar)", "Coming soon (expandable)", "Próximamente", "Bientôt", "به‌زودی")}</p>
                {soon.map((l) => (
                  <div key={l.code} data-testid={`${testid}-soon-${l.code}`} title={tri("Presto disponibile", "Bald verfügbar", "Available soon", "Pronto", "Bientôt", "به‌زودی")}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-[#475569] cursor-not-allowed">
                    <span className="text-base leading-none opacity-60">{l.flag}</span>
                    <span className="flex-1 text-left">{l.label}</span>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                ))}
              </>
            )}
            {ready.length === 0 && soon.length === 0 && (
              <p data-testid={`${testid}-empty`} className="px-3 py-4 text-center text-xs text-[#64748B]">{tri("Nessuna lingua trovata", "Keine Sprache gefunden", "No language found", "Sin resultados", "Aucune langue", "زبانی یافت نشد")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
