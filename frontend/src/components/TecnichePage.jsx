import { useState, useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { ChevronLeft, Wrench, AlertTriangle } from "lucide-react";

export default function TecnichePage({ initialSlug, onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const li = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [list, setList] = useState([]);
  const [slug, setSlug] = useState(initialSlug || null);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get(`/techniques`).then((r) => setList(r.data?.techniques || [])).catch(() => {}); }, []);
  useEffect(() => { setSlug(initialSlug || null); }, [initialSlug]);
  useEffect(() => {
    if (!slug) { setPage(null); return; }
    setLoading(true);
    api.get(`/techniques/${slug}?lang=${lang}`).then((r) => setPage(r.data)).catch(() => setPage({ error: true })).finally(() => setLoading(false));
  }, [slug, lang]);

  if (slug) {
    const b = page?.body;
    const hidden = new Set(page?.hidden_images || []);
    return (
      <div data-testid="technique-detail" className="space-y-5">
        <button data-testid="technique-back" onClick={() => setSlug(null)} className="inline-flex items-center gap-1 text-sm font-bold text-[#94A3B8] hover:text-white"><ChevronLeft className="w-4 h-4" />{tri("Tutte le tecniche", "Alle Techniken", "All techniques")}</button>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-display text-3xl font-black text-white">{page?.title || slug}</h1>
          <span data-testid="technique-verified" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${page?.verified ? "bg-[#6E8F7A]/30 text-[#DDE8DF]" : "bg-white/10 text-[#94A3B8]"}`}>
            {page?.verified ? tri("Verificato da Michele ✓", "Von Michele geprüft ✓", "Verified by Michele ✓") : tri("Bozza di Sitor", "Sitor-Entwurf", "Sitor draft")}
          </span>
        </div>
        {loading && <p className="text-[#94A3B8]">{tri("Sitor sta scrivendo…", "Sitor schreibt…", "Sitor is writing…")}</p>}
        {b && (<>
          {b.intro && <p className="text-[17px] text-[#cbd5e1] leading-relaxed">{b.intro}</p>}
          {/* immagini (se presenti come file statici) */}
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].filter((n) => !hidden.has(n)).map((n) => (
              <figure key={n} className="rounded-xl overflow-hidden bg-white/5">
                <img src={`/tecniche/${slug}/${n}.webp`} alt="" loading="lazy" onError={(e) => { e.currentTarget.closest("figure").style.display = "none"; }} className="w-full h-full object-cover" />
                <figcaption className="text-[10px] text-[#7E8A93] px-2 py-1">{tri("Illustrazione generata dall'IA: segui anche il testo", "KI-Illustration: folge auch dem Text", "AI illustration: follow the text too")}</figcaption>
              </figure>
            ))}
          </div>
          <ol className="space-y-2 list-decimal list-inside">
            {b.steps?.map((s, i) => <li key={i} className="text-[16px] text-[#e4eff8] leading-relaxed">{s}</li>)}
          </ol>
          {b.errors?.length > 0 && (
            <div className="rounded-xl border border-[#b06e78]/40 bg-[#b06e78]/10 p-3.5">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#b06e78] mb-2"><AlertTriangle className="w-3.5 h-3.5" />{tri("Errori comuni", "Häufige Fehler", "Common mistakes")}</p>
              <ul className="space-y-1 list-disc list-inside">{b.errors.map((e, i) => <li key={i} className="text-[14px] text-[#f0c9cf]">{e}</li>)}</ul>
            </div>
          )}
        </>)}
        {page?.error && <p className="text-[#b06e78]">{tri("Tecnica non disponibile al momento.", "Technik momentan nicht verfügbar.", "Technique not available right now.")}</p>}
      </div>
    );
  }

  return (
    <div data-testid="technique-list" className="space-y-5">
      {onBack && <button onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-[#94A3B8] hover:text-white"><ChevronLeft className="w-4 h-4" />{tri("Home", "Start", "Home")}</button>}
      <div>
        <h1 className="font-display text-3xl font-black text-white flex items-center gap-2"><Wrench className="w-6 h-6 text-[#E9A23B]" />{tri("Tecniche", "Techniken", "Techniques")}</h1>
        <p className="text-[#94A3B8] mt-1">{tri("I gesti del mestiere, spiegati da Sitor.", "Die Handgriffe, von Sitor erklärt.", "The craft's gestures, explained by Sitor.")}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {list.map((t) => (
          <button key={t.slug} data-testid={`technique-card-${t.slug}`} onClick={() => setSlug(t.slug)}
            className="text-left rounded-2xl border border-[#2A3B49] bg-[#0b1220] p-4 hover:border-[#E9A23B] active:scale-[0.98] transition-all">
            <p className="font-bold text-white">{li(t)}</p>
            {t.verified && <span className="text-[10px] text-[#6E8F7A] font-bold">✓ {tri("verificato", "geprüft", "verified")}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
