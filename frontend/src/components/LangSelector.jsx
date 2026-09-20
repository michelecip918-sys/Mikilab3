import { useState, useRef, useEffect, useMemo } from "react";
import { Globe, Check, Search, Clock } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Lingue ATTIVE (dizionari completi) + set globale predisposto all'espansione.
const READY = [
  { code: "it", flag: "🇮🇹", label: "Italiano", native: "Italiano" },
  { code: "de", flag: "🇩🇪", label: "Deutsch", native: "German" },
  { code: "en", flag: "🇬🇧", label: "English", native: "English" },
];
// Altre lingue: usa il traduttore del browser (nessuna traduzione integrata mostrata).
const SOON = [];

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
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background border border-border text-foreground hover:border-primary active:scale-95 transition-all">
        <Globe className="w-4 h-4 text-primary" />
        <span className="text-base leading-none">{cur.flag}</span>
        <span className="text-xs font-bold uppercase">{cur.code}</span>
      </button>
      {open && (
        <div data-testid={`${testid}-menu`} className="absolute right-0 top-11 w-64 max-h-[70vh] overflow-hidden rounded-xl bg-background border border-border shadow-2xl z-[95] flex flex-col">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 bg-background rounded-lg px-2.5 py-2 border border-border focus-within:border-primary">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input ref={inputRef} data-testid={`${testid}-search`} value={q} onChange={(e) => setQ(e.target.value)}
                placeholder={tri("Cerca la tua lingua…", "Sprache suchen…", "Search your language…", "Busca tu idioma…", "Cherche ta langue…", "زبان خود را جستجو کن…")}
                className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
          <div className="overflow-y-auto p-1.5 space-y-0.5">
            {ready.map((l) => (
              <button key={l.code} data-testid={`${testid}-${l.code}`} onClick={() => { setLang(l.code); setOpen(false); setQ(""); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${l.code === lang ? "bg-primary/15 text-primary font-bold" : "text-foreground hover:bg-background"}`}>
                <span className="text-base leading-none">{l.flag}</span>
                <span className="flex-1 text-left">{l.label}</span>
                {l.code === lang && <Check className="w-4 h-4" />}
              </button>
            ))}
            {soon.length > 0 && (
              <>
                <p className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{tri("In arrivo (espandibile)", "Bald (erweiterbar)", "Coming soon (expandable)", "Próximamente", "Bientôt", "به‌زودی")}</p>
                {soon.map((l) => (
                  <div key={l.code} data-testid={`${testid}-soon-${l.code}`} title={tri("Presto disponibile", "Bald verfügbar", "Available soon", "Pronto", "Bientôt", "به‌زودی")}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-muted-foreground cursor-not-allowed">
                    <span className="text-base leading-none opacity-60">{l.flag}</span>
                    <span className="flex-1 text-left">{l.label}</span>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                ))}
              </>
            )}
            {ready.length === 0 && soon.length === 0 && (
              <p data-testid={`${testid}-empty`} className="px-3 py-4 text-center text-xs text-muted-foreground">{tri("Nessuna lingua trovata", "Keine Sprache gefunden", "No language found", "Sin resultados", "Aucune langue", "زبانی یافت نشد")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
