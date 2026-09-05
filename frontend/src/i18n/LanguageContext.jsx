import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations } from "@/i18n/translations";
import { mkTri } from "@/i18n/triMaps";
import { applyMeta } from "@/i18n/meta";
import { setTTSAppLang } from "@/lib/tts";

const LanguageContext = createContext(null);
const SUPPORTED = ["it", "de", "en", "es", "fr", "fa", "ar", "tr"];

function initialLang() {
  // 1) prefisso lingua nell'URL (/it /de /en /es) → SEO / condivisione
  const seg = (window.location.pathname.split("/")[1] || "").toLowerCase();
  if (SUPPORTED.includes(seg)) return seg;
  // 2) scelta salvata
  const saved = localStorage.getItem("mikilab_lang");
  if (SUPPORTED.includes(saved)) return saved;
  // 3) lingua del browser
  const nav = (navigator.language || "it").slice(0, 2).toLowerCase();
  if (SUPPORTED.includes(nav)) return nav;
  return "it";
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    localStorage.setItem("mikilab_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === "fa" || lang === "ar") ? "rtl" : "ltr";
    applyMeta(lang);
    setTTSAppLang(lang); // voce audio sempre allineata al testo
  }, [lang]);

  const setLang = useCallback((l) => setLangState(SUPPORTED.includes(l) ? l : "it"), []);

  // t(key): lingua scelta → EN → IT → key. Così le lingue senza dizionario ricadono su EN.
  const t = useCallback(
    (key) => {
      const L = translations[lang] || {};
      return L[key] ?? translations.en?.[key] ?? translations.it[key] ?? key;
    },
    [lang]
  );

  // Testi inline: tri(it, de, en, es[, fr, fa]). fr/fa usano la mappa auto-generata, poi EN, poi IT.
  const tri = useCallback((it_, de_, en_, es_, fr_, fa_) => mkTri(lang)(it_, de_, en_, es_, fr_, fa_), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tri }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
