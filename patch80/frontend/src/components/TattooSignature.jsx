import { useLang } from "@/i18n/LanguageContext";

const BASE = process.env.PUBLIC_URL || "";

// Firma ricorrente: la foto del braccio tatuato di Michele + didascalia (IT/DE/EN).
export function TattooSignature({ className = "", testid = "tattoo-signature" }) {
  const { lang } = useLang();
  const caption = lang === "de"
    ? "Mit Micheles Händen gemacht"
    : lang === "en"
    ? "Made with Michele's hands"
    : "Fatto con le mani di Michele";

  return (
    <div data-testid={testid} className={`flex items-center gap-3 rounded-2xl bg-background/[0.04] dark:bg-foreground/[0.04] border border-border dark:border-border p-2.5 ${className}`}>
      <img
        src={`${BASE}/bio-dough.jpg`}
        alt="Michele"
        loading="lazy"
        className="w-12 h-12 rounded-2xl shadow-md border border-amber-900/40 object-cover ring-1 ring-border/30 shrink-0"
        draggable={false}
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground dark:text-foreground leading-tight">{caption}</p>
        <p className="text-[11px] font-bold tracking-wide text-foreground">MikiLab 🇮🇹🇩🇪</p>
      </div>
      <img src={`${BASE}/polpo-firma.svg`} alt="" loading="lazy" draggable={false} className="w-11 h-11 ml-auto shrink-0" />
    </div>
  );
}
