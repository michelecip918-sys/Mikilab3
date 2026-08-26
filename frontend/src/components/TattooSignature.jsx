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
    <div data-testid={testid} className={`flex items-center gap-3 rounded-2xl bg-[#1A1412]/[0.04] dark:bg-white/[0.04] border border-[#d5e4f0] dark:border-[#38424B] p-2.5 ${className}`}>
      <img
        src={`${BASE}/bio-dough.jpg`}
        alt="Michele"
        loading="lazy"
        className="w-12 h-12 rounded-xl object-cover ring-1 ring-[#2e3d4c]/30 shrink-0"
        draggable={false}
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] leading-tight">{caption}</p>
        <p className="text-[11px] font-bold tracking-wide text-[#2e3d4c]">MikiLab 🇮🇹🇩🇪</p>
      </div>
    </div>
  );
}
