import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations } from "@/i18n/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem("mikilab_lang");
    // Solo IT/DE per ora (EN temporaneamente disattivato lato UI).
    if (saved === "de") return "de";
    return "it";
  });

  useEffect(() => {
    localStorage.setItem("mikilab_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l) => setLangState(l === "de" ? "de" : "it"), []);

  const t = useCallback(
    (key) => (translations[lang] && translations[lang][key]) || translations.it[key] || key,
    [lang]
  );

  // Helper per stringhe inline trilingue: tri(it, de, en). EN ricade su IT se mancante.
  const tri = useCallback((it_, de_, en_) => (lang === "de" ? de_ : lang === "en" ? (en_ ?? it_) : it_), [lang]);

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
