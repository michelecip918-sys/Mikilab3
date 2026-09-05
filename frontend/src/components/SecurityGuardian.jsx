import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { securityApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// BakoMix Security Guardian (client, best-effort): rileva e segnala tentativi di
// ispezione/duplicazione (devtools, view-source, context-menu, copia massiva),
// li registra sul backend e avvisa che il codice è proprietà esclusiva del Master.
// Nota onesta: il blocco totale dei devtools del browser non è tecnicamente
// garantibile lato client — qui è deterrente + logging + avviso attivo.
export default function SecurityGuardian() {
  const { lang } = useLang();
  const lastToast = useRef(0);

  useEffect(() => {
    const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
    const warn = () => {
      const now = Date.now();
      if (now - lastToast.current < 8000) return;
      lastToast.current = now;
      toast.warning("BakoMix Security Guardian", {
        description: tri("Sistema proprietario del Master. Ispezione/duplicazione non autorizzata segnalata.",
          "Eigentum des Masters. Unbefugte Inspektion/Duplizierung gemeldet.",
          "Master's proprietary system. Unauthorized inspection/duplication flagged.",
          "Sistema propiedad del Master. Inspección/duplicación no autorizada.",
          "Système propriété du Master. Inspection/duplication non autorisée signalée.",
          "سیستم اختصاصی مستر. بازرسی/کپی غیرمجاز گزارش شد."),
        duration: 5000,
      });
    };
    const report = (event, detail) => { try { securityApi.report(event, detail, window.location.pathname); } catch { /* */ } };

    const onKey = (e) => {
      const k = (e.key || "").toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      const devtools = k === "f12" || (mod && e.shiftKey && ["i", "j", "c"].includes(k));
      const viewSrc = mod && k === "u";
      if (devtools || viewSrc) {
        e.preventDefault();
        report(viewSrc ? "view_source" : "devtools", `key:${k}`);
        warn();
      }
    };
    const onCtx = (e) => {
      // Solo desktop (evita di rompere il long-press mobile).
      if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;
      e.preventDefault();
      report("context_menu", "");
      warn();
    };
    const onCopy = () => {
      try {
        const sel = String(window.getSelection() || "");
        if (sel.length > 400) { report("copy_bulk", `len:${sel.length}`); warn(); }
      } catch { /* */ }
    };

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("contextmenu", onCtx, true);
    window.addEventListener("copy", onCopy, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("contextmenu", onCtx, true);
      window.removeEventListener("copy", onCopy, true);
    };
  }, [lang]);

  return null;
}
