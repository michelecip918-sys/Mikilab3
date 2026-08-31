import { useState } from "react";
import { toast } from "sonner";
import { Globe, Loader2, Sparkles, Search } from "lucide-react";
import { API, recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import RecipeDialog from "@/components/RecipeDialog";
import { mkTri } from "@/i18n/triMaps";

// Cerca una ricetta per nome/descrizione/link e la riadatta al «Metodo Mikilab».
export default function WebRecipe() {
  const { t, lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("mikilab");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const METHODS = [
    { id: "mikilab", label: tri("Metodo Mikilab", "Mikilab-Methode", "Mikilab Method", "Método Mikilab", "Méthode Mikilab", "روش میکی‌لب") },
    { id: "qualita", label: tri("Qualità massima", "Höchste Qualität", "Top quality", "Máxima calidad", "Qualité max", "بالاترین کیفیت") },
    { id: "veloce", label: tri("Veloce", "Schnell", "Fast", "Rápido", "Rapide", "سریع") },
    { id: "diretto", label: tri("Diretto", "Direkt", "Direct", "Directo", "Direct", "مستقیم") },
    { id: "indiretto", label: tri("Indiretto", "Indirekt", "Indirect", "Indirecto", "Indirect", "غیرمستقیم") },
    { id: "poolish", label: "Poolish" },
    { id: "autolisi", label: tri("Autolisi", "Autolyse", "Autolyse", "Autólisis", "Autolyse", "اتولیز") },
  ];

  const search = async () => {
    const q = query.trim();
    if (q.length < 2) {
      toast.error(tri("Scrivi il nome di una ricetta.", "Gib den Namen eines Rezepts ein.", "Type a recipe name.", "Escribe el nombre de una receta.", "Écris le nom d'une recette.", "نام یک دستور را بنویس."));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/maestro/web-recipe`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ query: q, lang, method }),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error(tri("Serve l'abbonamento PRO", "PRO erforderlich", "PRO required", "Se requiere PRO", "PRO requis", "نیاز به PRO"));
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || tri("Ricetta non trovata, riprova.", "Rezept nicht gefunden.", "Recipe not found, try again.", "Receta no encontrada.", "Recette introuvable.", "دستور یافت نشد."));
      }
      const data = await res.json();
      setResult(data);
      setDialogOpen(true);
      toast.success(tri("Ricetta adattata al Metodo Mikilab ✓", "Rezept an die Mikilab-Methode angepasst ✓", "Recipe adapted to the Mikilab Method ✓", "Receta adaptada al Método Mikilab ✓", "Recette adaptée à la Méthode Mikilab ✓", "دستور با روش میکی‌لب سازگار شد ✓"));
    } catch (err) {
      toast.error(err?.message || tri("Ricerca non riuscita.", "Suche fehlgeschlagen.", "Search failed.", "Búsqueda fallida.", "Recherche échouée.", "جست‌وجو ناموفق بود."));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (payload) => {
    try {
      await recipesApi.create({ ...payload, collection_name: "personal" });
      toast.success(t("toast_saved"));
      setDialogOpen(false);
      setResult(null);
      setQuery("");
    } catch {
      toast.error(t("toast_save_error"));
    }
  };

  const examples = [
    tri("Baguette classica", "Klassische Baguette", "Classic baguette", "Baguette clásica", "Baguette classique", "باگت کلاسیک"),
    tri("Ciabatta italiana", "Italienische Ciabatta", "Italian ciabatta", "Chapata italiana", "Ciabatta italienne", "چاباتای ایتالیایی"),
    tri("Pane integrale ai semi", "Vollkornbrot mit Saaten", "Wholemeal seeded bread", "Pan integral con semillas", "Pain complet aux graines", "نان سبوس‌دار با دانه‌ها"),
  ];

  return (
    <div className="pb-24" data-testid="web-recipe">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#ff6b00] to-[#c94f00] p-6 text-white">
        <div className="it-de-ribbon absolute top-0 left-0 right-0" />
        <Globe className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{tri("Cerca & Adatta Ricetta", "Rezept suchen & anpassen", "Find & Adapt Recipe", "Buscar y Adaptar Receta", "Chercher et Adapter", "جست‌وجو و تطبیق دستور")}</h1>
        <p className="text-white/85 text-sm mt-1">{tri("Scrivi il nome di una ricetta: la ricostruisco e la riadatto al tuo Metodo Mikilab (indiretto, prefermento, Miglioratore 2%, cella 16°C).", "Gib den Namen eines Rezepts ein: ich baue es nach und passe es an deine Mikilab-Methode an (indirekt, Vorteig, Verbesserer 2%, 16°C-Kammer).", "Type a recipe name: I rebuild it and adapt it to your Mikilab Method (indirect, preferment, 2% improver, 16°C cell).", "Escribe el nombre de una receta: la reconstruyo y la adapto a tu Método Mikilab.", "Écris le nom d'une recette : je la reconstruis et l'adapte à ta Méthode Mikilab.", "نام یک دستور را بنویس: آن را بازسازی و با روش میکی‌لب سازگار می‌کنم.")}</p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-5">
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-[#7E8A93] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            data-testid="web-recipe-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) search(); }}
            placeholder={tri("Es. Pane di segale, Brioche, Focaccia genovese…", "z. B. Roggenbrot, Brioche, Focaccia…", "e.g. Rye bread, Brioche, Focaccia…", "Ej. Pan de centeno, Brioche…", "Ex. Pain de seigle, Brioche…", "مثلاً نان چاودار، بریوش…")}
            className="w-full pl-9 pr-3 py-3 rounded-2xl bg-[#f6f8fb] dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] text-sm text-[#2B303B] dark:text-[#e4eff8] outline-none focus:border-[#ff6b00]"
          />
        </div>
        <div className="mb-3" data-testid="web-recipe-methods">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#ff6b00] mb-1.5">{tri("Adatta con il metodo", "Mit Methode anpassen", "Adapt with method", "Adaptar con el método", "Adapter avec la méthode", "تطبیق با روش")}</p>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button key={m.id} data-testid={`web-recipe-method-${m.id}`} onClick={() => setMethod(m.id)}
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${method === m.id ? "bg-[#ff6b00] text-white border-[#ff6b00] shadow-sm" : "bg-white dark:bg-[#1e1e1e] text-[#ff6b00] border-[#2e2e2e] dark:border-[#2e2e2e] hover:border-[#ff6b00]/60"}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <button
          data-testid="web-recipe-search-btn"
          onClick={search}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#ff6b00] hover:bg-[#ff8a33] text-white font-semibold px-5 py-3.5 rounded-2xl active:scale-98 transition-all disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {loading
            ? tri("Sto cercando e adattando…", "Suche und passe an…", "Searching and adapting…", "Buscando y adaptando…", "Recherche et adaptation…", "در حال جست‌وجو و تطبیق…")
            : tri("Cerca e adatta", "Suchen & anpassen", "Find and adapt", "Buscar y adaptar", "Chercher et adapter", "جست‌وجو و تطبیق")}
        </button>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-[11px] text-[#7E8A93] w-full">{tri("Prova con:", "Versuch's mit:", "Try:", "Prueba con:", "Essaie :", "امتحان کن:")}</span>
          {examples.map((ex, i) => (
            <button key={i} data-testid={`web-recipe-example-${i}`} onClick={() => setQuery(ex)}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-full border border-[#ff6b00]/40 text-[#ff6b00] hover:bg-[#ff6b00]/10 active:scale-95 transition-all">
              {ex}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-[#7E8A93] mt-3 px-1 leading-snug">
        {tri("La ricetta viene ricostruita dall'IA e adattata al metodo: controllala sempre e salvala nel tuo ricettario personale.", "Das Rezept wird von der KI erstellt und an die Methode angepasst: immer prüfen und im eigenen Rezeptbuch speichern.", "The recipe is AI-rebuilt and adapted to the method: always review it and save it to your personal book.", "La receta la reconstruye la IA: revísala y guárdala en tu recetario.", "La recette est reconstruite par l'IA : vérifie-la et enregistre-la.", "دستور توسط هوش مصنوعی بازسازی می‌شود: بررسی و ذخیره کن.")}
      </p>

      <RecipeDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={result} onSave={handleSave} />
    </div>
  );
}
