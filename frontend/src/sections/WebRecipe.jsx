import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Globe, Loader2, Sparkles, Search, Wheat, Pencil, RotateCcw, History, Droplets, Layers, X } from "lucide-react";
import { API, recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import RecipeDialog from "@/components/RecipeDialog";
import { mkTri } from "@/i18n/triMaps";

const HISTORY_KEY = "mikilab_webrec_history";

export default function WebRecipe() {
  const { t, lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("mikilab");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [farro, setFarro] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; } });

  useEffect(() => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 8))); } catch { /* */ } }, [history]);

  const METHODS = [
    { id: "mikilab", label: tri("Metodo MikiLab", "MikiLab-Methode", "MikiLab Method", "Método MikiLab", "Méthode MikiLab", "روش میکی‌لب") },
    { id: "qualita", label: tri("Qualità massima", "Höchste Qualität", "Top quality", "Máxima calidad", "Qualité max", "بالاترین کیفیت") },
    { id: "veloce", label: tri("Veloce", "Schnell", "Fast", "Rápido", "Rapide", "سریع") },
    { id: "diretto", label: tri("Diretto", "Direkt", "Direct", "Directo", "Direct", "مستقیم") },
    { id: "indiretto", label: tri("Indiretto", "Indirekt", "Indirect", "Indirecto", "Indirect", "غیرمستقیم") },
    { id: "poolish", label: "Poolish" },
    { id: "autolisi", label: tri("Autolisi", "Autolyse", "Autolyse", "Autólisis", "Autolyse", "اتولیز") },
  ];
  const methodLabel = (id) => (METHODS.find((m) => m.id === id) || {}).label || id;

  // Converte la ricetta in versione al FARRO (Dinkel): -4% acqua/idratazione, farina e nome aggiornati, nota tecnica.
  const toFarro = (r) => {
    if (!r) return r;
    const water = r.water_grams != null ? Math.round(Number(r.water_grams) * 0.96) : r.water_grams;
    const hyd = r.hydration_percent != null ? Math.round(Number(r.hydration_percent) * 0.96 * 10) / 10 : r.hydration_percent;
    const ft = r.flour_type ? (/farro|dinkel/i.test(r.flour_type) ? r.flour_type : `${r.flour_type} · Farro (Dinkel)`) : "Farro (Dinkel)";
    const name = r.name ? (/farro|dinkel/i.test(r.name) ? r.name : `${r.name} ${tri("al Farro", "(Dinkel)", "(Spelt)", "de Espelta", "à l'Épeautre", "با اسپلت")}`) : r.name;
    const note = tri(
      "🌾 VERSIONE AL FARRO (Dinkel): idratazione ridotta ~4%, impasto più delicato e più corto (il glutine del farro è più fragile). Inserisci i grassi in piccole dosi.",
      "🌾 DINKEL-VERSION: Hydratation ~4% reduziert, kürzer und schonender kneten (Dinkelgluten ist fragiler). Fette in kleinen Portionen zugeben.",
      "🌾 SPELT VERSION: hydration reduced ~4%, knead shorter and more gently (spelt gluten is more fragile). Add fats in small portions.",
      "🌾 VERSIÓN DE ESPELTA: hidratación reducida ~4%, amasado más corto y suave.",
      "🌾 VERSION ÉPEAUTRE : hydratation réduite ~4%, pétrissage plus court et délicat.",
      "🌾 نسخهٔ اسپلت: آب حدود ۴٪ کمتر، ورز کوتاه‌تر و ملایم‌تر.");
    const notes = r.notes ? `${note}\n\n${r.notes}` : note;
    return { ...r, water_grams: water, hydration_percent: hyd, flour_type: ft, name, notes, _farro: true };
  };

  const displayRecipe = farro ? toFarro(result) : result;

  const runSearch = async (q, m) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/maestro/web-recipe`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ query: q, lang, method: m }),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error(tri("Serve l'abbonamento PRO", "PRO erforderlich", "PRO required", "Se requiere PRO", "PRO requis", "نیاز به PRO"));
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || tri("Ricetta non trovata, riprova.", "Rezept nicht gefunden.", "Recipe not found, try again.", "Receta no encontrada.", "Recette introuvable.", "دستور یافت نشد."));
      }
      const data = await res.json();
      setResult(data);
      setFarro(false);
      setHistory((h) => [{ q, method: m, at: Date.now(), recipe: data }, ...h.filter((x) => !(x.q === q && x.method === m))].slice(0, 8));
      toast.success(tri("Ricetta pronta ✓ — controllala e salvala.", "Rezept bereit ✓ — prüfen und speichern.", "Recipe ready ✓ — review and save.", "Receta lista ✓ — revísala y guárdala.", "Recette prête ✓ — vérifie et enregistre.", "دستور آماده است ✓"));
    } catch (err) {
      toast.error(err?.message || tri("Ricerca non riuscita.", "Suche fehlgeschlagen.", "Search failed.", "Búsqueda fallida.", "Recherche échouée.", "جست‌وجو ناموفق بود."));
    } finally {
      setLoading(false);
    }
  };

  const search = () => {
    const q = query.trim();
    if (q.length < 2) {
      toast.error(tri("Scrivi il nome di una ricetta.", "Gib den Namen eines Rezepts ein.", "Type a recipe name.", "Escribe el nombre de una receta.", "Écris le nom d'une recette.", "نام یک دستور را بنویس."));
      return;
    }
    runSearch(q, method);
  };

  const openHistory = (item) => { setResult(item.recipe); setFarro(false); setQuery(item.q); setMethod(item.method); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const clearResult = () => { setResult(null); setFarro(false); };

  const handleSave = async (payload) => {
    try {
      await recipesApi.create({ ...payload, collection_name: "personal" });
      toast.success(t("toast_saved"));
      setDialogOpen(false);
      setResult(null);
      setFarro(false);
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
        <p className="text-white/85 text-sm mt-1">{tri("Scrivi il nome di una ricetta OPPURE incolla il link di una pagina: la leggo dal web e la riadatto al metodo che scegli. Poi puoi convertirla al farro prima di salvarla.", "Gib einen Rezeptnamen ein ODER füge einen Link ein: ich lese die Seite und passe sie an die gewählte Methode an. Danach in Dinkel umwandelbar.", "Type a recipe name OR paste a page link: I read it from the web and adapt it to your chosen method. Then convert it to spelt before saving.", "Escribe el nombre de una receta O pega un enlace: la leo de la web y la adapto al método elegido.", "Écris un nom de recette OU colle un lien : je lis la page et l'adapte à la méthode choisie.", "نام دستور را بنویس یا لینک صفحه را بچسبان: از وب می‌خوانم و تطبیق می‌دهم.")}</p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-5">
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-[#7E8A93] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            data-testid="web-recipe-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) search(); }}
            placeholder={tri("Nome ricetta o incolla un link (es. https://…)", "Rezeptname oder Link einfügen (z. B. https://…)", "Recipe name or paste a link (e.g. https://…)", "Nombre de receta o pega un enlace (https://…)", "Nom de recette ou colle un lien (https://…)", "نام دستور یا یک لینک بچسبان (https://…)")}
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

      {/* Risultato: anteprima con tasto "Converti in Farro" prima del salvataggio */}
      {displayRecipe && (
        <div data-testid="web-recipe-result" className="mt-4 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#ff6b00]/40 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] mb-0.5">{tri("Risultato", "Ergebnis", "Result", "Resultado", "Résultat", "نتیجه")}{farro ? " · 🌾 Farro" : ""}</p>
              <h3 data-testid="web-recipe-result-name" className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8] leading-tight">{displayRecipe.name}</h3>
              {displayRecipe.flour_type && <p className="text-[12px] text-[#7E8A93] mt-0.5 truncate">{displayRecipe.flour_type}</p>}
              {displayRecipe.source && (
                <a data-testid="web-recipe-source" href={displayRecipe.source.url} target="_blank" rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#7E8A93] hover:text-[#ff6b00] truncate max-w-full">
                  <Globe className="w-3 h-3 shrink-0" />
                  <span className="truncate">{tri("Fonte", "Quelle", "Source", "Fuente", "Source", "منبع")}: {displayRecipe.source.title || displayRecipe.source.domain} · <b>{displayRecipe.source.domain}</b></span>
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {displayRecipe.hydration_percent != null && <span className="inline-flex items-center gap-1 bg-[#ff6b00]/12 text-[#ff6b00] text-[11px] font-bold px-2 py-1 rounded-full"><Droplets className="w-3 h-3" />{displayRecipe.hydration_percent}%</span>}
            {displayRecipe.preferment_type && displayRecipe.preferment_type !== "none" && <span className="inline-flex items-center gap-1 bg-[#ff6b00]/12 text-[#ff6b00] text-[11px] font-bold px-2 py-1 rounded-full"><Layers className="w-3 h-3" />{displayRecipe.preferment_type}</span>}
            {displayRecipe.method_type && <span className="inline-flex items-center gap-1 bg-[#ff6b00]/12 text-[#ff6b00] text-[11px] font-bold px-2 py-1 rounded-full">{displayRecipe.method_type}</span>}
          </div>

          {displayRecipe.original && (() => {
            const o = displayRecipe.original;
            const dash = (v) => (v == null || v === "" ? "—" : v);
            const rows = [
              [tri("Idratazione", "Hydratation", "Hydration", "Hidratación", "Hydratation", "آب"), o.hydration_percent != null ? `${o.hydration_percent}%` : null, displayRecipe.hydration_percent != null ? `${displayRecipe.hydration_percent}%` : null],
              [tri("Metodo", "Methode", "Method", "Método", "Méthode", "روش"), o.method_type, displayRecipe.method_type],
              [tri("Prefermento", "Vorteig", "Preferment", "Prefermento", "Préferment", "پیش‌خمیر"), o.preferment_type, displayRecipe.preferment_type],
              [tri("Farina", "Mehl", "Flour", "Harina", "Farine", "آرد"), o.flour_type, displayRecipe.flour_type],
            ].filter((r) => r[1] || r[2]);
            return (
              <div data-testid="web-recipe-compare" className="mt-3 rounded-xl bg-[#f6f8fb] dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] p-3">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 items-center mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#7E8A93]">{tri("Originale", "Original", "Original", "Original", "Original", "اصلی")}</span>
                  <span />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] text-right">{tri("Adattata", "Angepasst", "Adapted", "Adaptada", "Adaptée", "تطبیق‌یافته")}</span>
                </div>
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-x-2 items-center py-1 border-t border-[#2e2e2e]/50 first:border-t-0">
                    <span className="text-[12px] text-[#3F4A54] dark:text-[#AEB8BF] truncate">{dash(r[1])}</span>
                    <span className="text-[11px] text-[#7E8A93] px-1 shrink-0">→</span>
                    <span className={`text-[12px] font-semibold text-right truncate ${String(r[1]) !== String(r[2]) ? "text-[#ff6b00]" : "text-[#2B303B] dark:text-[#e4eff8]"}`}>{dash(r[2])}</span>
                    <span className="col-span-3 text-[9px] uppercase tracking-wide text-[#7E8A93]/70 -mt-1">{r[0]}</span>
                  </div>
                ))}
              </div>
            );
          })()}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button data-testid="web-recipe-farro-toggle" onClick={() => setFarro((v) => !v)}
              className={`inline-flex items-center justify-center gap-1.5 font-semibold text-sm px-3 py-2.5 rounded-xl border transition-all active:scale-97 ${farro ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-[#ff6b00]/10 text-[#ff6b00] border-[#ff6b00]/40"}`}>
              <Wheat className="w-4 h-4" />
              {farro ? tri("Farro attivo — torna al grano", "Dinkel aktiv — zurück", "Spelt on — back to wheat", "Espelta activa — volver", "Épeautre activé — retour", "اسپلت فعال — بازگشت") : tri("Converti in Farro", "In Dinkel umwandeln", "Convert to Spelt", "Convertir a Espelta", "Convertir en Épeautre", "تبدیل به اسپلت")}
            </button>
            <button data-testid="web-recipe-edit-save" onClick={() => setDialogOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-[#2e8b6f] text-white font-semibold text-sm px-3 py-2.5 rounded-xl active:scale-97 transition-all">
              <Pencil className="w-4 h-4" /> {tri("Modifica e salva", "Bearbeiten & speichern", "Edit and save", "Editar y guardar", "Modifier et enregistrer", "ویرایش و ذخیره")}
            </button>
          </div>
          <button data-testid="web-recipe-new" onClick={clearResult} className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#7E8A93] active:scale-97">
            <RotateCcw className="w-3.5 h-3.5" /> {tri("Nuova ricerca", "Neue Suche", "New search", "Nueva búsqueda", "Nouvelle recherche", "جست‌وجوی جدید")}
          </button>
        </div>
      )}

      {/* Storico ricerche: le ultime ricette cercate, riapribili con un tocco (nessuna nuova chiamata) */}
      {history.length > 0 && (
        <div data-testid="web-recipe-history" className="mt-4 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#ff6b00] flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> {tri("Ricerche recenti", "Letzte Suchen", "Recent searches", "Búsquedas recientes", "Recherches récentes", "جست‌وجوهای اخیر")}</p>
            <button data-testid="web-recipe-history-clear" onClick={() => setHistory([])} className="text-[11px] font-bold text-[#7E8A93] inline-flex items-center gap-1 active:scale-95"><X className="w-3 h-3" /> {tri("Svuota", "Leeren", "Clear", "Vaciar", "Vider", "پاک")}</button>
          </div>
          <ul className="space-y-2">
            {history.map((item, i) => (
              <li key={i}>
                <button data-testid={`web-recipe-history-${i}`} onClick={() => openHistory(item)}
                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl border border-[#2e2e2e] dark:border-[#2e2e2e] bg-[#f6f8fb] dark:bg-[#181818] hover:border-[#ff6b00] active:scale-98 transition-all">
                  <Globe className="w-4 h-4 text-[#ff6b00] shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-sm text-[#2B303B] dark:text-[#e4eff8] truncate">{(item.recipe && item.recipe.name) || item.q}</span>
                    <span className="block text-[11px] text-[#7E8A93] truncate">{methodLabel(item.method)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-[#7E8A93] mt-3 px-1 leading-snug">
        {tri("La ricetta viene ricostruita dall'IA e adattata al metodo: controllala sempre e salvala nel tuo ricettario personale.", "Das Rezept wird von der KI erstellt und an die Methode angepasst: immer prüfen und im eigenen Rezeptbuch speichern.", "The recipe is AI-rebuilt and adapted to the method: always review it and save it to your personal book.", "La receta la reconstruye la IA: revísala y guárdala en tu recetario.", "La recette est reconstruite par l'IA : vérifie-la et enregistre-la.", "دستور توسط هوش مصنوعی بازسازی می‌شود: بررسی و ذخیره کن.")}
      </p>

      <RecipeDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={displayRecipe} onSave={handleSave} />
    </div>
  );
}
