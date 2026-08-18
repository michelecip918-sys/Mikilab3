import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLang } from "@/i18n/LanguageContext";

export default function IntroGuide() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("mikilab_seen_intro")) setOpen(true);
  }, []);

  const close = () => {
    localStorage.setItem("mikilab_seen_intro", "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md bg-[#FDFBF7] dark:bg-[#1A1412] border-[#E8DEC8] dark:border-[#3D302A] p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] text-white p-6 text-center">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Mikilab" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#FFCE00]/70 shadow-lg mx-auto mb-3" />
          <h2 className="font-display text-2xl font-bold">{t("bio_welcome_title")}</h2>
          <p className="text-[11px] uppercase tracking-wider text-white/70 mt-0.5">{t("bio_welcome_sub")} <span>🇮🇹</span> <span>🇩🇪</span></p>
          <p className="font-display italic text-[#FFE9B8] text-sm leading-relaxed mt-3">{t("bio_motto")}</p>
        </div>
        <div className="p-6">
          <p className="text-sm text-[#4A3B34] dark:text-[#C9BBB0] leading-relaxed">{t("bio_welcome_body")}</p>
          <button
            data-testid="intro-close-btn"
            onClick={close}
            className="mt-5 w-full bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" /> {t("intro_start")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
