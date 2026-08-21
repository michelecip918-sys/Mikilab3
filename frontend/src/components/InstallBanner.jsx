import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const DISMISS_KEY = "mikilab_install_dismissed";

export default function InstallBanner() {
  const { t } = useLang();
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return;
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); setShow(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const close = () => { setShow(false); localStorage.setItem(DISMISS_KEY, "1"); };

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    try { await prompt.userChoice; } catch (e) { /* ignore */ }
    close();
  };

  if (!show) return null;

  return (
    <div data-testid="install-banner" className="max-w-xl mx-auto px-4 mt-2">
      <div className="flex items-center gap-3 rounded-2xl bg-[#2B303B] text-white px-4 py-2.5 shadow-lg border border-[#A9C5D4]/30">
        <div className="w-8 h-8 rounded-xl bg-[#A9C5D4]/20 flex items-center justify-center shrink-0">
          <Download className="w-4 h-4 text-[#A9C5D4]" />
        </div>
        <p className="flex-1 min-w-0 text-sm font-medium truncate">{t("install_banner_title")}</p>
        <button data-testid="install-banner-btn" onClick={install}
          className="shrink-0 bg-[#5E8B7E] hover:bg-[#4C7368] text-white text-sm font-semibold px-3 py-1.5 rounded-xl active:scale-95 transition-all">
          {t("install_app")}
        </button>
        <button data-testid="install-banner-close" onClick={close} className="shrink-0 text-white/60 hover:text-white p-1" aria-label="close">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
