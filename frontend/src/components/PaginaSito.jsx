import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { ChevronLeft } from "lucide-react";

export default function PaginaSito({ slug, onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [page, setPage] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/site-pages/${slug}?lang=${lang}`).then((r) => setPage(r.data)).catch(() => setNotFound(true));
  }, [slug, lang]);

  return (
    <div data-testid={`page-${slug}`} className="max-w-2xl mx-auto space-y-4">
      {onBack && <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-[#94A3B8] hover:text-white"><ChevronLeft className="w-4 h-4" />{tri("Home", "Start", "Home")}</button>}
      {notFound && <p className="text-[#94A3B8]">{tri("Pagina non disponibile.", "Seite nicht verfügbar.", "Page not available.")}</p>}
      {page && (<>
        <h1 className="font-display text-3xl font-black text-white">{page.title}</h1>
        <div className="text-[17px] text-[#cbd5e1] leading-relaxed whitespace-pre-wrap">{page.body}</div>
      </>)}
    </div>
  );
}
