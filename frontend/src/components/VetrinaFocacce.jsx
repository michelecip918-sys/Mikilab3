import { useEffect, useMemo, useState } from "react";
import { Loader2, X, Wheat, BookOpen, Share2 } from "lucide-react";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Vetrina delle Ricette: galleria a griglia con le foto di ogni ricetta, per categoria.
// Tap → lightbox (foto grande + nome + note) con CTA "Vedi ricetta completa".
const TAB_DEF = [
  { key: "focacce", it: "Focacce", de: "Focaccia", en: "Focaccia", es: "Focaccias", icon: "🫓" },
  { key: "pizza", it: "Pizza", de: "Pizza", en: "Pizza", es: "Pizza", icon: "🍕" },
  { key: "pasticceria", it: "Pasticceria", de: "Konditorei", en: "Pastry", es: "Pastelería", icon: "🧁" },
  { key: "pane", it: "Pane", de: "Brot", en: "Bread", es: "Pan", icon: "🍞" },
  { key: "panini", it: "Panini", de: "Brötchen", en: "Buns", es: "Panecillos", icon: "🥪" },
  { key: "panettoni", it: "Panettoni", de: "Panettone", en: "Panettone", es: "Panettones", icon: "🎄" },
  { key: "viennoiserie", it: "Dolci & Sfoglie", de: "Süßes & Blätterteig", en: "Sweets & Pastry", es: "Dulces y Hojaldre", icon: "🥐" },
  { key: "snack", it: "Snack", de: "Snacks", en: "Snacks", es: "Snacks", icon: "🥨" },
  { key: "basi", it: "Basi & Lieviti", de: "Basen & Hefen", en: "Bases & Leavens", es: "Bases y Levaduras", icon: "✨" },
];

export default function VetrinaFocacce({ initialCat = "focacce", onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(null);
  const [cat, setCat] = useState(initialCat);

  useEffect(() => {
    let alive = true;
    recipesApi.list("mikilab").then((rows) => {
      if (!alive) return;
      setAll((rows || []).filter((r) => r.image_url));
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { alive = false; };
  }, []);

  const tabs = useMemo(() => TAB_DEF.filter((t) => all.some((r) => r.menu_category === t.key)), [all]);
  const items = useMemo(() => {
    const list = all.filter((r) => r.menu_category === cat);
    list.sort((a, b) => rLoc(a, "name", lang).localeCompare(rLoc(b, "name", lang)));
    return list;
  }, [all, cat, lang]);

  const catName = (k) => { const t = TAB_DEF.find((x) => x.key === k); return t ? tri(t.it, t.de, t.en, t.es) : k; };

  const shareItem = async (r) => {
    const img = (r.image_url || "").startsWith("http") ? r.image_url : `${window.location.origin}${r.image_url}`;
    const title = rLoc(r, "name", lang);
    const text = `${title} — MikiLab 🥖`;
    // 1) prova a condividere il FILE immagine vero (dove il telefono lo permette)
    try {
      const resp = await fetch(img);
      const blob = await resp.blob();
      const file = new File([blob], `${(title || "mikilab").replace(/[^a-z0-9]+/gi, "_").toLowerCase()}.jpg`, { type: blob.type || "image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
        return;
      }
    } catch { /* fall through */ }
    // 2) fallback: condividi il link della foto
    try { if (navigator.share) { await navigator.share({ title, text, url: img }); return; } } catch { return; }
    // 3) ultimo fallback: WhatsApp web
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + img)}`, "_blank");
  };

  return (
    <div className="pb-8" data-testid="vetrina-focacce">
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#0B0E14] shadow-xl mb-4" style={{ background: "linear-gradient(135deg,#F26419,#F26419)" }}>
        <div className="it-de-ribbon absolute top-0 left-0 right-0" />
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><Wheat className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{tri("Vetrina delle Ricette", "Rezept-Schaufenster", "Recipe Showcase", "Vitrina de Recetas", "Vitrine des Recettes", "ویترین دستورها")}</h1>
        <p className="text-[#0B0E14]/85 text-sm mt-2 leading-snug">{tri("Ogni ricetta con la sua foto. Scegli una categoria e tocca per ingrandire.", "Jedes Rezept mit eigenem Foto. Wähle eine Kategorie und tippe zum Vergrößern.", "Every recipe with its own photo. Pick a category and tap to enlarge.", "Cada receta con su foto. Elige una categoría y toca para ampliar.", "Chaque recette avec sa photo. Choisis une catégorie et touche pour agrandir.", "هر دستور با عکس خودش")}</p>
      </div>

      {/* Tab categorie */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1" data-testid="vetrina-tabs">
        {tabs.map((t) => (
          <button key={t.key} data-testid={`vetrina-tab-${t.key}`} onClick={() => setCat(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap border transition-all ${cat === t.key ? "bg-[#F26419] text-[#0B0E14] border-[#F26419]" : "bg-[#18202E] text-[#AEB8BF] border-[#26324A]"}`}>
            {t.icon} {catName(t.key)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#F26419]" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5" data-testid="vetrina-grid">
          {items.map((r) => (
            <button key={r.id} data-testid={`vetrina-card-${r.id}`} onClick={() => setZoom(r)}
              className="relative h-40 rounded-2xl overflow-hidden shadow-md active:scale-97 transition-all text-left group">
              <img src={r.image_url} alt={rLoc(r, "name", lang)} loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 40%,#0B0E14ee)" }} />
              <div className="relative h-full flex flex-col justify-end p-2.5">
                <h3 className="font-display text-[13px] font-bold text-white leading-tight drop-shadow">{rLoc(r, "name", lang)}</h3>
              </div>
            </button>
          ))}
          {items.length === 0 && <p className="col-span-2 text-center text-sm text-[#7E8A93] py-10">{tri("Nessuna foto in questa categoria.", "Keine Fotos in dieser Kategorie.", "No photos in this category.", "Sin fotos en esta categoría.")}</p>}
        </div>
      )}

      {zoom && (
        <div data-testid="vetrina-lightbox" className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={() => setZoom(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative max-w-sm w-full bg-[#1a1a1a] border border-[#26324A] rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button data-testid="vetrina-lightbox-close" onClick={() => setZoom(null)} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center active:scale-95"><X className="w-5 h-5" /></button>
            <img src={zoom.image_url} alt={rLoc(zoom, "name", lang)} className="w-full aspect-square object-cover" />
            <div className="p-4">
              <h3 className="font-display text-lg font-bold text-white leading-tight">{rLoc(zoom, "name", lang)}</h3>
              {rLoc(zoom, "notes", lang) && <p className="text-[12.5px] text-[#AEB8BF] leading-snug mt-1.5 whitespace-pre-line line-clamp-4">{rLoc(zoom, "notes", lang)}</p>}
              <button data-testid="vetrina-share" onClick={() => shareItem(zoom)}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl shadow-md border border-amber-900/40 bg-[#18202E] border border-[#F26419]/40 text-white font-semibold py-2.5 text-sm active:scale-95 transition-all">
                <Share2 className="w-4 h-4 text-[#F26419]" /> {tri("Condividi la foto", "Foto teilen", "Share the photo", "Compartir la foto", "Partager la photo", "اشتراک عکس")}
              </button>
              {onOpenRecipe && (
                <button data-testid="vetrina-open-recipe" onClick={() => onOpenRecipe(zoom.id)}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl shadow-md border border-amber-900/40 bg-[#F26419] text-white font-semibold py-2.5 text-sm active:scale-95 transition-all">
                  <BookOpen className="w-4 h-4" /> {tri("Vedi ricetta completa", "Ganzes Rezept ansehen", "See full recipe", "Ver receta completa", "Voir la recette complète", "دیدن دستور کامل")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
