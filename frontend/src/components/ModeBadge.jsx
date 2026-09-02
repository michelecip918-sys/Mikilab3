import { Crown, Heart } from "lucide-react";
import { useProfile } from "@/profile/ProfileContext";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Badge fisso sempre visibile: mostra la modalità attiva (Pro / Passione). Tap → apre il menu per cambiarla.
export default function ModeBadge() {
  const { profile } = useProfile();
  const { lang } = useLang();
  const pro = profile === "pro";
  const label = pro
    ? mkTri(lang)("Pro", "Pro", "Pro", "Pro", "Pro", "حرفه‌ای")
    : mkTri(lang)("Passione", "Passion", "Passion", "Pasión", "Passion", "علاقه");
  return (
    <button data-testid="mode-badge" onClick={() => window.dispatchEvent(new Event("mikilab-open-menu"))}
      className={`fixed top-1.5 left-1/2 -translate-x-1/2 z-[45] inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wide shadow-md border active:scale-95 transition-all ${pro ? "bg-[#c94f00] text-white border-[#c94f00]" : "bg-[#161616]/90 backdrop-blur text-[#c94f00] border-[#c94f00]/55"}`}>
      {pro ? <Crown className="w-3 h-3" /> : <Heart className="w-3 h-3" />}
      {label}
    </button>
  );
}
