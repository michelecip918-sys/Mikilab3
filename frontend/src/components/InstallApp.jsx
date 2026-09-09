import { useState, useEffect } from "react";
import { Download, Share, Plus, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const isStandalone = () =>
  (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
  (typeof navigator !== "undefined" && navigator.standalone === true);
const isIOS = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

// Pulsante "Installa App" (PWA). Usa beforeinstallprompt su Android/desktop;
// su iOS mostra le istruzioni "Aggiungi a Home" (Safari non espone il prompt).
export default function InstallApp({ variant = "hero" }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (installed) return null;
  if (variant !== "hero" && !deferred && !isIOS()) return null; // chip: mostra solo se installabile

  const click = async () => {
    if (deferred) { deferred.prompt(); try { await deferred.userChoice; } catch { /* */ } setDeferred(null); return; }
    if (isIOS()) { setIosHelp(true); return; }
    setIosHelp(true); // fallback: istruzioni generiche
  };

  const label = tri("Installa App", "App installieren", "Install App", "Instalar App", "Installer l'App", "نصب اپ");

  return (
    <>
      {variant === "hero" ? (
        <button data-testid="install-app-btn" onClick={click}
          className="pointer-events-auto mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0b0f19] border border-[#D95200]/40 text-[#D95200] font-bold text-sm hover:border-[#D95200] active:scale-95 transition-all">
          <Download className="w-4 h-4" /> {label}
        </button>
      ) : (
        <button data-testid="install-app-chip" onClick={click} title={label}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#D95200]/10 border border-[#D95200]/30 text-[#D95200] font-bold hover:bg-[#D95200]/20 active:scale-95 transition-all">
          <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{label}</span>
        </button>
      )}

      {iosHelp && (
        <div data-testid="install-help" className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/70 p-4" onClick={() => setIosHelp(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0b0f19] border border-[#1e293b] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-white">{label}</h3>
              <button data-testid="install-help-close" onClick={() => setIosHelp(false)} className="text-[#94A3B8] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-[#94A3B8] mb-3">{tri("Per installare MikiLab sul telefono:", "So installierst du MikiLab:", "To install MikiLab on your phone:", "Para instalar MikiLab en el móvil:", "Pour installer MikiLab sur le téléphone :", "برای نصب میکی‌لب روی گوشی:")}</p>
            <ol className="space-y-2 text-sm text-[#cbd5e1]">
              <li className="flex items-center gap-2"><Share className="w-4 h-4 text-[#D95200]" /> {tri("Tocca «Condividi» nel browser", "Tippe auf «Teilen»", "Tap «Share» in the browser", "Toca «Compartir»", "Touche «Partager»", "روی «اشتراک» بزن")}</li>
              <li className="flex items-center gap-2"><Plus className="w-4 h-4 text-[#D95200]" /> {tri("Scegli «Aggiungi a Home»", "Wähle «Zum Home-Bildschirm»", "Choose «Add to Home Screen»", "Elige «Añadir a inicio»", "Choisis «Sur l'écran d'accueil»", "«افزودن به صفحه اصلی» را انتخاب کن")}</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
