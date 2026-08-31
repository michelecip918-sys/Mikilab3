import { useEffect, useState } from "react";
import { Loader2, X, Wheat } from "lucide-react";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Vetrina Focacce: galleria a griglia con le foto dedicate di ogni focaccia.
// Tap → lightbox con foto grande + nome + condimento.
export default function VetrinaFocacce() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
    let alive = true;
    recipesApi.list("mikilab").then((all) => {
      if (!alive) return;
      const foc = (all || []).filter((r) => r.menu_category === "focacce" && r.image_url);
      foc.sort((a, b) => rLoc(a, "name", lang).localeCompare(rLoc(b, "name", lang)));
      setItems(foc);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { alive = false; };
  }, [lang]);

  return (
    <div className="pb-8" data-testid="vetrina-focacce">
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#121212] shadow-xl mb-4" style={{ background: "linear-gradient(135deg,#ff6b00,#c94f00)" }}>
        <div className="it-de-ribbon absolute top-0 left-0 right-0" />
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><Wheat className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{tri("Vetrina delle Focacce", "Focaccia-Schaufenster", "Focaccia Showcase", "Vitrina de Focaccias", "Vitrine des Focaccias", "ویترین فوکاچا")}</h1>
        <p className="text-[#121212]/85 text-sm mt-2 leading-snug">{tri(`${items.length || ""} focacce, ogni gusto con la sua foto. Tocca per ingrandire.`, `${items.length || ""} Focaccias, jede mit eigenem Foto. Tippen zum Vergrößern.`, `${items.length || ""} focaccias, each with its own photo. Tap to enlarge.`, `${items.length || ""} focaccias, cada una con su foto. Toca para ampliar.`, `${items.length || ""} focaccias, chacune avec sa photo. Touchez pour agrandir.`, "روی هر فوکاچا بزنید")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#ff6b00]" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5" data-testid="vetrina-grid">
          {items.map((r) => (
            <button key={r.id} data-testid={`vetrina-card-${r.id}`} onClick={() => setZoom(r)}
              className="relative h-40 rounded-2xl overflow-hidden shadow-md active:scale-97 transition-all text-left group">
              <img src={r.image_url} alt={rLoc(r, "name", lang)} loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 40%,#121212ee)" }} />
              <div className="relative h-full flex flex-col justify-end p-2.5">
                <h3 className="font-display text-[13px] font-bold text-white leading-tight drop-shadow">{rLoc(r, "name", lang)}</h3>
              </div>
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div data-testid="vetrina-lightbox" className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={() => setZoom(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative max-w-sm w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button data-testid="vetrina-lightbox-close" onClick={() => setZoom(null)} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center active:scale-95"><X className="w-5 h-5" /></button>
            <img src={zoom.image_url} alt={rLoc(zoom, "name", lang)} className="w-full aspect-square object-cover" />
            <div className="p-4">
              <h3 className="font-display text-lg font-bold text-white leading-tight">{rLoc(zoom, "name", lang)}</h3>
              {rLoc(zoom, "notes", lang) && <p className="text-[12.5px] text-[#AEB8BF] leading-snug mt-1.5 whitespace-pre-line line-clamp-4">{rLoc(zoom, "notes", lang)}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
