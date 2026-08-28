import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { siteSettingsApi } from "@/lib/api";

const WA_DEFAULT = "491601253378"; // +49 160 1253378

export default function WhatsAppFab() {
  const { lang } = useLang();
  const [num, setNum] = useState(WA_DEFAULT);
  const [hidden, setHidden] = useState(false);
  useEffect(() => { siteSettingsApi.get().then((s) => { if (s && s.whatsapp_number) setNum(s.whatsapp_number); }).catch(() => {}); }, []);
  useEffect(() => {
    let timer;
    const onScroll = () => {
      setHidden(true);
      clearTimeout(timer);
      timer = setTimeout(() => setHidden(false), 700);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(timer); };
  }, []);
  const tri = (i, d, e) => (lang === "de" ? d : lang === "it" ? i : (e ?? i));
  const msg = tri(
    "Ciao Michele! Ti scrivo da MikiLab.",
    "Hallo Michele! Ich schreibe dir über MikiLab.",
    "Hi Michele! I'm messaging you from MikiLab."
  );
  const href = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;

  return (
    <a
      data-testid="whatsapp-fab"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className={`fixed z-40 right-4 bottom-44 flex flex-col items-center gap-1 transition-all duration-300 ${hidden ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"}`}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <span className="w-12 h-12 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center active:scale-95 transition-transform">
        <svg viewBox="0 0 32 32" className="w-7 h-7" fill="white" aria-hidden="true">
          <path d="M16.04 4C9.93 4 4.98 8.95 4.98 15.06c0 1.94.51 3.83 1.47 5.5L4 28l7.6-2.42a11.02 11.02 0 0 0 4.44.93h.01c6.11 0 11.06-4.95 11.06-11.06C27.11 8.95 22.16 4 16.04 4Zm0 20.2c-1.37 0-2.72-.37-3.9-1.07l-.28-.17-4.51 1.44 1.46-4.39-.18-.29a9.14 9.14 0 0 1-1.4-4.86c0-5.06 4.12-9.18 9.18-9.18 2.45 0 4.75.96 6.49 2.69a9.12 9.12 0 0 1 2.69 6.49c0 5.06-4.12 9.18-9.18 9.18Zm5.03-6.87c-.28-.14-1.63-.8-1.88-.9-.25-.09-.44-.14-.62.14-.18.28-.71.9-.87 1.08-.16.18-.32.2-.6.07-.28-.14-1.16-.43-2.21-1.36-.82-.73-1.37-1.63-1.53-1.91-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.35-.02-.48-.07-.14-.62-1.5-.85-2.05-.22-.53-.45-.46-.62-.47-.16-.01-.35-.01-.53-.01-.18 0-.48.07-.73.35-.25.28-.96.94-.96 2.3 0 1.36.98 2.67 1.12 2.85.14.18 1.94 2.96 4.7 4.15.66.28 1.17.45 1.57.58.66.21 1.26.18 1.74.11.53-.08 1.63-.67 1.86-1.31.23-.64.23-1.19.16-1.31-.07-.12-.25-.19-.53-.33Z" />
        </svg>
      </span>
      <span className="text-[9px] font-semibold text-[#3F4A54] dark:text-[#AEB8BF] bg-white/80 dark:bg-[#232A31]/80 px-1.5 py-0.5 rounded-full">WhatsApp</span>
    </a>
  );
}
