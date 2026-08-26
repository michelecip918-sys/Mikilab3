import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLang } from "@/i18n/LanguageContext";

const CONTENT = {
  it: { title: "La Tua Guida alla Panificazione", greet: "Ciao! Ti do il benvenuto nel mio panificio digitale.", desc: "Ricette, calcoli di laboratorio e supporto intelligente sempre a portata di mano.", start: "Inizia Ora" },
  de: { title: "Dein Backleitfaden", greet: "Hallo! Willkommen in meiner digitalen Backstube.", desc: "Rezepte, Laborberechnungen und smarte Unterstützung – immer griffbereit.", start: "Jetzt starten" },
  en: { title: "Your Baking Guide", greet: "Hi! Welcome to my digital bakery.", desc: "Recipes, lab calculations and smart support, always at hand.", start: "Start now" },
};

const LANGS = [
  { id: "it", flag: "🇮🇹", label: "IT" },
  { id: "de", flag: "🇩🇪", label: "DE" },
  { id: "en", flag: "🇬🇧", label: "EN" },
];

export default function IntroGuide() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const c = CONTENT[lang] || CONTENT.it;

  useEffect(() => { setOpen(true); }, []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <DialogContent data-testid="intro-guide" className="max-w-md bg-[#f0f6fb] dark:bg-[#1B2127] border-[#d5e4f0] dark:border-[#38424B] p-0 overflow-hidden">
        <DialogTitle className="sr-only">{c.title}</DialogTitle>
        <DialogDescription className="sr-only">{c.desc}</DialogDescription>
        <div className="bg-gradient-to-br from-[#3f7cac] to-[#234b6e] text-white p-6 text-center">
          <img src={`${process.env.PUBLIC_URL}/michele-avatar.jpg`} alt="MikiLab Avatar"
            className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[#A9C5D4]/70 shadow-lg mx-auto mb-3"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${
                  lang === l.id ? "bg-[#3f7cac] text-white border-[#3f7cac]" : "bg-[#e4eff8] dark:bg-[#2A323A] text-[#7E8A93] border-[#d5e4f0] dark:border-[#38424B]"
                }`}>
                <span>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>

          <button
            data-testid="intro-close-btn"
            onClick={() => setOpen(false)}
            className="mt-5 w-full bg-[#3f7cac] hover:bg-[#336a94] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" /> {c.start} →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
