import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Share2, Send, Facebook, Twitter, Mail, Copy, Download, MessageCircle, Smartphone } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

// Condivisione app (tutti i metodi) + installazione PWA.
export default function ShareInstall() {
  const { t, lang } = useLang();
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  // Link con anteprima social tradotta (l'endpoint serve OG per lingua e reindirizza all'app).
  const backend = process.env.REACT_APP_BACKEND_URL || (typeof window !== "undefined" ? window.location.origin : "https://mikilab.de");
  const url = `${backend}/api/share/${lang}`;
  const text = t("share_text");

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const enc = encodeURIComponent;
  const NETS = [
    { id: "whatsapp", label: "WhatsApp", Icon: MessageCircle, color: "#25D366", href: `https://wa.me/?text=${enc(text + " " + url)}` },
    { id: "telegram", label: "Telegram", Icon: Send, color: "#0088cc", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
    { id: "facebook", label: "Facebook", Icon: Facebook, color: "#1877F2", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { id: "x", label: "X", Icon: Twitter, color: "#111827", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { id: "email", label: "Email", Icon: Mail, color: "#3E9C93", href: `mailto:?subject=${enc("MikiLab")}&body=${enc(text + "\n\n" + url)}` },
  ];

  const nativeShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "MikiLab", text, url });
      else { await navigator.clipboard.writeText(url); toast.success(t("toast_copied_link")); }
    } catch { /* annullato */ }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); toast.success(t("toast_copied_link")); } catch { /* */ }
  };

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
    } else {
      setIosHint(true);
    }
  };

  return (
    <div data-testid="share-install" className="rounded-3xl bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] p-5">
      <div className="flex items-center gap-2 mb-1 text-[#3E9C93]">
        <Share2 className="w-5 h-5" />
        <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{t("share_title")}</h3>
      </div>
      <p className="text-sm text-[#7E8A93] mb-4">{t("share_sub")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5" data-testid="share-networks">
        {NETS.map(({ id, label, Icon, color, href }) => (
          <a key={id} data-testid={`share-${id}`} href={href} target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#2A3B49] dark:border-[#2A3B49] bg-[#e4eff8] dark:bg-[#1B2A38] py-3 active:scale-95 transition-transform">
            <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
              <Icon className="w-5 h-5 text-white" />
            </span>
            <span className="text-[11px] font-medium text-[#3F4A54] dark:text-[#AEB8BF]">{label}</span>
          </a>
        ))}
        <button data-testid="share-copy" onClick={copyLink}
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#2A3B49] dark:border-[#2A3B49] bg-[#e4eff8] dark:bg-[#1B2A38] py-3 active:scale-95 transition-transform">
          <span className="w-9 h-9 rounded-full flex items-center justify-center bg-[#7E8A93]"><Copy className="w-5 h-5 text-white" /></span>
          <span className="text-[11px] font-medium text-[#3F4A54] dark:text-[#AEB8BF]">{t("share_copy")}</span>
        </button>
      </div>

      <button data-testid="share-native" onClick={nativeShare}
        className="mt-3 w-full bg-[#3E9C93] hover:bg-[#5E8CA8] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
        <Share2 className="w-5 h-5" /> {t("share_more")}
      </button>

      {!installed && (
        <button data-testid="install-app" onClick={install}
          className="mt-2 w-full bg-[#3E9C93] hover:bg-[#5E8CA8] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2">
          <Download className="w-5 h-5" /> {t("install_app")}
        </button>
      )}
      {installed && (
        <p data-testid="install-done" className="mt-3 text-center text-sm text-[#3E9C93] font-medium flex items-center justify-center gap-1.5">
          <Smartphone className="w-4 h-4" /> {t("install_done")}
        </p>
      )}

      {iosHint && (
        <div data-testid="install-ios-hint" className="mt-3 rounded-2xl bg-[#3E9C93]/12 border border-[#3E9C93]/30 p-3 text-sm text-[#3F4A54] dark:text-[#AEB8BF]">
          {t("install_ios_hint")}
        </div>
      )}
    </div>
  );
}
