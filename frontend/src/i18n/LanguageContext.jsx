import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations } from "@/i18n/translations";
import { mkTri } from "@/i18n/triMaps";
import { applyMeta } from "@/i18n/meta";
import { setTTSAppLang } from "@/lib/tts";

const LanguageContext = createContext(null);
const SUPPORTED = ["it", "de", "en"];

// V137 — L'INDIRIZZO DECIDE LA LINGUA. mikilab.de/it/…, /de/… e /en/… si aprono sempre in quella lingua, per chiunque:
// persone e motori di ricerca, qualunque lingua abbia il telefono e qualunque scelta fosse salvata. Prima vinceva la
// scelta salvata e l'italiano non aveva un indirizzo suo: Google, col browser in inglese, sull'indirizzo italiano
// vedeva l'inglese e scartava la pagina italiana come doppione di quella inglese (Search Console, 7 ottobre 2026).
function linguaDaIndirizzo() {
  try { const seg = (window.location.pathname.split("/")[1] || "").toLowerCase(); return SUPPORTED.includes(seg) ? seg : null; } catch { return null; }
}
function linguaSalvata() {
  try { const s = localStorage.getItem("mikilab_lang"); return SUPPORTED.includes(s) ? s : null; } catch { return null; }
}

function initialLang() {
  // 1) prefisso lingua nell'indirizzo (/it /de /en): decide lui
  const daIndirizzo = linguaDaIndirizzo();
  if (daIndirizzo) return daIndirizzo;
  // 2) indirizzo senza prefisso: la scelta salvata dall'utente (resta stabile dopo i reload)
  const saved = linguaSalvata();
  if (saved) return saved;
  // V117: i motori di ricerca, sull'indirizzo senza prefisso, leggono l'italiano
  try { if (/bot|crawler|spider|slurp|google-inspectiontool|lighthouse/i.test(navigator.userAgent || "")) return "it"; } catch { /* */ }
  // 3) lingua del browser: it/de se disponibili, altrimenti EN
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  if (nav === "it" || nav === "de") return nav;
  return "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    // V137: la lingua arrivata dall'indirizzo vale per questa visita e non cancella la scelta che la persona aveva
    // salvato; si salva da sola solo la prima volta. La scelta fatta col selettore la salva setLang, qui sotto.
    try { if (!linguaSalvata()) localStorage.setItem("mikilab_lang", lang); } catch { /* */ }
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === "fa" || lang === "ar") ? "rtl" : "ltr";
    applyMeta(lang);
    setTTSAppLang(lang); // voce audio sempre allineata al testo
  }, [lang]);

  // V137: se l'indirizzo nella barra ha il prefisso di una lingua, segue la lingua scelta (mikilab.de/it/scuola →
  // mikilab.de/de/scuola): così il link che si copia è sempre nella lingua che si sta leggendo. Le ricette cambiano
  // anche il nome nell'indirizzo, ci pensa recipeSeo.
  useEffect(() => {
    const allinea = () => {
      try {
        const p = window.location.pathname || "/";
        const m = p.match(/^\/(it|de|en)(?=\/|$)/i);
        if (m && m[1].toLowerCase() !== lang) window.history.replaceState(window.history.state, "", `/${lang}${p.slice(3)}${window.location.search}${window.location.hash}`);
      } catch { /* */ }
    };
    allinea();
    window.addEventListener("popstate", allinea);
    return () => window.removeEventListener("popstate", allinea);
  }, [lang]);

  const setLang = useCallback((l) => {
    const v = SUPPORTED.includes(l) ? l : "en";
    try { localStorage.setItem("mikilab_lang", v); } catch { /* */ } // V137: la scelta fatta a mano si salva sempre
    setLangState(v);
  }, []);

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
