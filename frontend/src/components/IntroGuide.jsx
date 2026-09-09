import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLang } from "@/i18n/LanguageContext";
import { pick } from "@/i18n/triMaps";

const CONTENT = {
  it: { title: "La Tua Guida alla Panificazione", greet: "Ciao! Ti do il benvenuto nel mio panificio digitale.", desc: "Ricette, calcoli di laboratorio e supporto intelligente sempre a portata di mano.", start: "Inizia Ora" },
  de: { title: "Dein Backleitfaden", greet: "Hallo! Willkommen in meiner digitalen Backstube.", desc: "Rezepte, Laborberechnungen und smarte Unterstützung – immer griffbereit.", start: "Jetzt starten" },
  en: { title: "Your Baking Guide", greet: "Hi! Welcome to my digital bakery.", desc: "Recipes, lab calculations and smart support, always at hand.", start: "Start now" },
};

const LANGS = [
  { id: "it", flag: "🇮🇹", label: "IT" },
  { id: "de", flag: "🇩🇪", label: "DE" },
  { id: "en", flag: "🇬🇧", label: "EN" },
  { id: "es", flag: "🇪🇸", label: "ES" },
];

export default function IntroGuide() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const c = pick(CONTENT, lang);

  useEffect(() => { setOpen(true); }, []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <DialogContent data-testid="intro-guide" className="max-w-md bg-[#0D1520] dark:bg-[#0D1520] border-[#2A3B49] dark:border-[#2A3B49] p-0 overflow-hidden">
        <DialogTitle className="sr-only">{c.title}</DialogTitle>
        <DialogDescription className="sr-only">{c.desc}</DialogDescription>
        <div className="bg-gradient-to-br from-[#3E9C93] to-[#3E9C93] text-white p-6 text-center">
          <img src={`${process.env.PUBLIC_URL}/michele-real-lab.jpg`} alt="MikiLab Avatar"
            className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[#3E9C93]/70 shadow-lg mx-auto mb-3"
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <p className="text-sm text-white/90 mb-1">{c.greet}</p>
          <h2 className="font-display text-2xl font-bold leading-tight">{c.title}</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed text-center">{c.desc}</p>

          {/* Selettore lingua trilingue */}
          <div data-testid="intro-lang" className="mt-4 flex items-center justify-center gap-2">
            {LANGS.map((l) => (
              <button key={l.id} data-testid={`intro-lang-${l.id}`} onClick={() => setLang(l.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl shadow-md border border-amber-900/40 text-sm font-bold border transition-all ${
                  lang === l.id ? "bg-[#3E9C93] text-white border-[#3E9C93]" : "bg-[#e4eff8] dark:bg-[#1B2A38] text-[#7E8A93] border-[#2A3B49] dark:border-[#2A3B49]"
                }`}>
                <span>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>

          <button
            data-testid="intro-close-btn"
            onClick={() => setOpen(false)}
            className="mt-5 w-full bg-[#3E9C93] hover:bg-[#64748B] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" /> {c.start} →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
