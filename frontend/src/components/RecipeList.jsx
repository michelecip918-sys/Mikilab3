import { useEffect, useState } from "react";
import { mkTri } from "@/i18n/triMaps";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wheat, Droplets, Clock, Copy, Scale, Flame, Layers, MoreHorizontal, Lock, Crown, Search, ChevronDown, X, Share2, ChefHat, Volume2, Printer, Hand, Heart } from "lucide-react";
import { recipesApi, siteSettingsApi } from "@/lib/api";
import { CATS, CAT_COLORS, recipeCategory } from "@/lib/recipeCats";
import RecipeDialog from "@/components/RecipeDialog";
import EULabel from "@/components/EULabel";
import ScaleDialog from "@/components/ScaleDialog";
import PrintHeader from "@/components/PrintHeader";
import MachineScheda from "@/components/MachineScheda";
import { playTTS } from "@/lib/tts";import { addXP } from "@/lib/level";
import HandsFreeMode from "@/components/HandsFreeMode";
import RecipeTimeline from "@/components/RecipeTimeline";
import { TattooSignature } from "@/components/TattooSignature";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { rLoc, ingLoc } from "@/lib/loc";
import { useBackClose } from "@/lib/backNav";
import { renderProcedureWithImprover } from "@/lib/improverText";
import { useFavRecipes } from "@/lib/favorites";
import { flagEmoji, countryColors, countryName } from "@/lib/countries";
import { isColored } from "@/lib/coloredRecipes";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function RecipeList({ collectionName, heroImage, heroTitle, heroSubtitle, emptyText, readOnly = false, heroPosition, extraHeader }) {
  const [scale, setScale] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [scaling, setScaling] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [pendingOpenId, setPendingOpenId] = useState(null);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [baseFilter, setBaseFilter] = useState("all");
  const [favFilter, setFavFilter] = useState(false);
  const { favs, toggle: toggleFav, countOf } = useFavRecipes();
  const [openCats, setOpenCats] = useState({});
  const [folderCovers, setFolderCovers] = useState({});
  const [translating, setTranslating] = useState(false);
  const { t, lang, setLang } = useLang();
  useBackClose(!!viewing, () => setViewing(null));
  useBackClose(dialogOpen, () => setDialogOpen(false));
  useBackClose(!!scaling, () => setScaling(null));
  const triM = (i_, d_, e_) => mkTri(lang)(i_, d_, e_);
  const { user, setAuthOpen } = useAuth();
  // MikiLab: modifica solo admin. Personali: UI sempre visibile, il SALVATAGGIO richiede login.
  const canEdit = collectionName === "mikilab" ? user?.role === "admin" : true;

  const load = async () => {
    setLoading(true);
    try {
      const list = await recipesApi.list(collectionName);
      list.sort((a, b) => {
        const ca = recipeCategory(a), cb = recipeCategory(b);
        if (ca.rank !== cb.rank) return ca.rank - cb.rank;
        if (ca.sub !== cb.sub) return ca.sub - cb.sub;
        return (a.name || "").localeCompare(b.name || "");
      });
      setRecipes(list);
    } catch (e) {
      // ricette personali senza login → lista vuota (nessun errore)
      if (collectionName !== "mikilab" && e?.response?.status === 401) setRecipes([]);
      else toast.error(t("toast_load_error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [collectionName]);

  // Copertine cartelle scelte dall'admin (globali, per categoria).
  useEffect(() => { siteSettingsApi.get().then((s) => setFolderCovers((s && s.folder_covers) || {})).catch(() => {}); }, []);

  // Sblocco immediato: dopo un acquisto ricetta ricarica la lista (no reload manuale).
  useEffect(() => {
    const onUpd = () => load();
    window.addEventListener("mikilab-entitlements-updated", onUpd);
    return () => window.removeEventListener("mikilab-entitlements-updated", onUpd);
    // eslint-disable-next-line
  }, [collectionName]);

  // Deep-link da QR etichetta (?prodotto=ID): apre la scheda del prodotto MikiLab.
  useEffect(() => {
    if (collectionName !== "mikilab" || !recipes.length) return;
    const pid = new URLSearchParams(window.location.search).get("prodotto");
    if (!pid) return;
    const target = recipes.find((x) => x.id === pid);
    if (target) {
      setViewing(target);
      const u = new URL(window.location.href); u.searchParams.delete("prodotto");
      window.history.replaceState({}, "", u.toString());
    }
    // eslint-disable-next-line
  }, [recipes, collectionName]);


  // Apertura ricetta da eventi esterni (es. vetrina "Novità", consiglio SOS).
  // Salva l'id richiesto e lo risolve appena le ricette sono caricate (evita race di timing).
  useEffect(() => {
    if (collectionName !== "mikilab") return;
    const onOpen = (e) => {
      const id = e?.detail?.id;
      if (id) { window.__mikilabPendingRecipe = id; setPendingOpenId(id); }
    };
    window.addEventListener("mikilab-open-recipe", onOpen);
    if (window.__mikilabPendingRecipe) setPendingOpenId(window.__mikilabPendingRecipe);
    return () => window.removeEventListener("mikilab-open-recipe", onOpen);
  }, [collectionName]);

  useEffect(() => {
    if (collectionName !== "mikilab" || !pendingOpenId || !recipes.length) return;
    const target = recipes.find((x) => x.id === pendingOpenId);
    if (target) {
      setViewing(target);
      setPendingOpenId(null);
      window.__mikilabPendingRecipe = null;
    }
  }, [recipes, pendingOpenId, collectionName]);


  // tiene aggiornata la ricetta aperta dopo un salvataggio/scala
  useEffect(() => {
    if (viewing) {
      const fresh = recipes.find((x) => x.id === viewing.id);
      if (fresh && fresh !== viewing) setViewing(fresh);
    }
    /* eslint-disable-next-line */
  }, [recipes]);

  const handleSave = async (payload) => {
    if (!user) {
      setAuthOpen(true);
      toast.info(t("gate_save_login"));
      return;
    }
    try {
      if (editing) {
        await recipesApi.update(editing.id, payload);
        toast.success(t("toast_recipe_updated"));
      } else {
        await recipesApi.create({ ...payload, collection_name: collectionName });
        addXP(2);
        toast.success(t("toast_recipe_added"));
      }
      setDialogOpen(false);
      setEditing(null);
      load();
    } catch {
      toast.error(t("toast_save_error"));
    }
  };

  const handleDelete = async () => {
    try {
      await recipesApi.remove(toDelete.id);
      toast.success(t("toast_recipe_deleted"));
      setToDelete(null);
      setViewing(null);
      load();
    } catch {
      toast.error(t("toast_delete_error"));
    }
  };

  const handleDuplicate = async (r) => {
    try {
      const { id, created_at, updated_at, ...rest } = r;
      await recipesApi.create({ ...rest, collection_name: collectionName, name: `${r.name} (${t("copy_suffix")})` });
      toast.success(t("toast_recipe_duplicated"));
      load();
    } catch {
      toast.error(t("toast_dup_error"));
    }
  };

  const handleScaleSave = async (payload) => {
    try {
      await recipesApi.create({ ...payload, collection_name: collectionName });
      toast.success(t("toast_recipe_scaled"));
      setScaling(null);
      load();
    } catch {
      toast.error(t("toast_save_error"));
    }
  };

  const openImprover = () => {
    const target = recipes.find((x) => /migliorator|backmittel/i.test(x.name || ""));
    if (target) setViewing(target);
  };

  // "Assaggio": apre le opzioni di acquisto (singola / panettoni / tutte) o abbonamento.
  const handleUnlock = () => {};

  return (
    <div className="pb-28">
      <div className="relative rounded-3xl overflow-hidden mb-5 h-40">
        <img src={heroImage} alt="" className="w-full h-full object-cover" style={heroPosition ? { objectPosition: heroPosition } : undefined} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B18]/85 via-[#1E1B18]/30 to-transparent" />
        <div className="it-de-ribbon absolute top-0 left-0 right-0 z-10" />
        {collectionName === "mikilab" && (
          <div data-testid="mikilab-flags" className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/35 backdrop-blur rounded-full px-2.5 py-1 border border-white/25">
            <span className="text-lg leading-none" title="Italiano">🇮🇹</span>
            <span className="text-lg leading-none" title="Deutsch">🇩🇪</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 p-5">
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
            {heroTitle}
            {collectionName === "mikilab" && <span className="text-xl leading-none">🇮🇹🇩🇪</span>}
          </h1>
          <div className="h-1 w-12 rounded-full bg-[#ff6b00] mt-1.5 mb-0.5" />
          {heroSubtitle ? <p className="text-white/85 text-sm mt-1">{heroSubtitle}</p> : null}
        </div>
      </div>

      {extraHeader ? (
        <div className="mb-5 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-4">
          {extraHeader}
        </div>
      ) : null}

      {/* Tabella farine unificata: accessibile SOLO dal pulsante «Tabelle & Farine» sopra l'avatar
          (rimosso il doppione qui sotto per evitare due tabelle diverse). */}

      {canEdit && (
        <button
          data-testid="add-recipe-btn"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="w-full bg-[#ff6b00] hover:bg-[#ff8a33] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 mb-5"
        >
          <Plus className="w-5 h-5" /> {t("add_recipe")}
        </button>
      )}

      {collectionName === "personal" && !readOnly && (
        <div data-testid="personal-lab-hint" className="-mt-2 mb-5 flex items-start gap-2 rounded-2xl border border-[#ff6b00]/30 bg-[#ff6b00]/8 px-3.5 py-2.5">
          <ChefHat className="w-4 h-4 text-[#ff6b00] shrink-0 mt-0.5" />
          <p className="text-[12.5px] leading-snug text-[#2B303B] dark:text-[#cfe0ec]">
            {triM(
              "Queste sono le tue ricette da panettiere: le ritrovi nel Laboratorio → Piano di Lavoro (gruppo «Le mie ricette») per generare il piano di produzione, gli orari e le infornate.",
              "Das sind deine Bäcker-Rezepte: du findest sie im Labor → Arbeitsplan (Gruppe „Meine Rezepte“), um Produktionsplan, Zeiten und Backfahrplan zu erstellen.",
              "These are your baker's recipes: find them in the Lab → Work Plan (group 'My recipes') to generate the production plan, timings and baking schedule."
            )}
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-center text-[#7E8A93] py-8">{t("loading")}</p>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 px-6 border-2 border-dashed border-[#2e2e2e] dark:border-[#2e2e2e] rounded-3xl">
          <Wheat className="w-10 h-10 text-[#ff6b00] mx-auto mb-3" />
          <p className="text-[#6B7680] dark:text-[#9AA6AE]">{emptyText}</p>
        </div>
      ) : (() => {
        const q = query.trim().toLowerCase();
        const matches = (r) => {
          if (favFilter && !favs.has(r.id)) return false;
          if (catFilter !== "all" && recipeCategory(r).key !== catFilter) return false;
          if (baseFilter === "colorati") { if (!isColored(r.name)) return false; }
          else if (baseFilter !== "all" && !recipeBase(r).includes(baseFilter)) return false;
          if (!q) return true;
          const hay = [rLoc(r, "name", lang), rLoc(r, "real_name", lang), rLoc(r, "flour_type", lang), r.notes || "", recipeBadges(r).join(" ")].join(" ").toLowerCase();
          return hay.includes(q);
        };
        const filtered = recipes.filter(matches);
        const baseChips = ["all", ...BASE_KEYS];

        const Card = (r, i) => (
          <motion.button
            key={r.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.015, 0.2) }}
            onClick={() => setViewing(r)}
            data-testid={`recipe-row-${r.id}`}
            className="relative overflow-hidden text-left bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl shadow-sm active:scale-[0.98] hover:border-[#ff6b00]/60 transition-all flex flex-col"
          >
            {/* strisciolina tricolore del Paese d'origine */}
            {countryColors(r.origin) && (
              <div aria-hidden className="absolute top-0 left-0 right-0 z-10 flex h-1.5">
                {countryColors(r.origin).map((c, k) => <div key={k} className="flex-1" style={{ background: c }} />)}
              </div>
            )}
            {/* foto vetrina */}
            <div className="relative w-full aspect-[4/3] bg-[#e4eff8] dark:bg-[#181818]">
              <div className="absolute inset-0 flex items-center justify-center"><ChefHat className="w-9 h-9 text-[#1e1e1e]/40" /></div>
              {r.image_url && (
                <img src={r.image_url} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} className="relative z-[1] w-full h-full object-cover" />
              )}
              {r.origin && flagEmoji(r.origin) && (
                <span title={countryName(r.origin)} className="absolute top-2.5 right-2 text-xl drop-shadow-md">{flagEmoji(r.origin)}</span>
              )}
              {isColored(r.name) && (
                <span data-testid={`recipe-new-badge-${r.id}`} className="absolute top-2 left-2 z-10 text-[9px] font-extrabold uppercase tracking-wide text-white px-2 py-0.5 rounded-full shadow bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#4f5bd5]">
                  {triM("Novità", "Neu", "New")}
                </span>
              )}
              {r.locked && (
                <span className="absolute bottom-2 right-2 bg-white/90 dark:bg-[#1e1e1e]/90 rounded-full p-1.5 shadow">
                  <Lock data-testid={`recipe-locked-${r.id}`} className="w-3.5 h-3.5 text-[#ff6b00]" />
                </span>
              )}
              <button
                type="button"
                data-testid={`recipe-fav-${r.id}`}
                aria-pressed={favs.has(r.id)}
                onClick={(e) => { e.stopPropagation(); toggleFav(r.id); }}
                className="absolute bottom-2 left-2 z-20 inline-flex items-center gap-1 bg-white/90 dark:bg-[#121212]/80 rounded-full pl-1.5 pr-2 py-1.5 shadow active:scale-90 transition-transform"
                title={favs.has(r.id) ? triM("Rimuovi dai preferiti", "Aus Favoriten entfernen", "Remove from favourites") : triM("Aggiungi ai preferiti", "Zu Favoriten", "Add to favourites")}
              >
                <Heart className={`w-4 h-4 transition-colors ${favs.has(r.id) ? "text-[#ff3b5c] fill-[#ff3b5c]" : "text-[#7E8A93]"}`} />
                {countOf(r.id) > 0 && <span data-testid={`recipe-fav-count-${r.id}`} className="text-[11px] font-bold text-[#ff3b5c] leading-none">{countOf(r.id)}</span>}
              </button>
            </div>
            {/* testo */}
            <div className="p-3 min-w-0 flex-1">
              <h3 className="font-display text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] leading-tight line-clamp-2">
                {(() => { const c = recipeCategory(r); const col = CAT_COLORS[c.key] || "#ff6b00"; return (
                  <span data-testid={`recipe-cat-icon-${r.id}`} title={t(c.label)}
                    className="inline-flex items-center justify-center w-5 h-5 rounded-md mr-1.5 text-[11px] align-middle shrink-0"
                    style={{ background: col + "26", boxShadow: `inset 0 0 0 1px ${col}` }} aria-hidden>{c.icon}</span>
                ); })()}{rLoc(r, "name", lang)}
              </h3>
              {rLoc(r, "real_name", lang) ? <p className="text-[11px] font-medium text-[#ff6b00] truncate mt-0.5">{rLoc(r, "real_name", lang)}</p> : null}
              {rLoc(r, "flour_type", lang) ? <p className="text-[10px] text-[#7E8A93] truncate mt-0.5">{(mkTri(lang)("Farina: ", "Mehl: ", "Flour: ", "Harina: "))}{rLoc(r, "flour_type", lang)}</p> : null}
            </div>
          </motion.button>
        );

        return (
          <div>
            {/* Barra di ricerca */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[#7E8A93] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                data-testid="recipe-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={triM("Cerca ricetta, farina, badge…", "Rezept, Mehl, Badge suchen…", "Search recipe, flour, badge…")}
                className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] text-sm text-[#2B303B] dark:text-[#e4eff8] outline-none focus:border-[#ff6b00]"
              />
              {query && (
                <button data-testid="recipe-search-clear" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E8A93]" aria-label="clear">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro per Base / prefermento */}
            {baseChips.length > 1 && (
              <div data-testid="recipe-base-filters" className="flex gap-2 overflow-x-auto pb-2 mb-3 px-0.5 scrollbar-none max-w-full">
                {baseChips.map((b) => (
                  <button key={b} data-testid={`base-filter-${b}`} onClick={() => setBaseFilter(b)}
                    className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all active:scale-97 ${
                      baseFilter === b
                        ? "bg-[#ff6b00] text-white border-[#ff6b00] shadow-sm"
                        : "bg-white dark:bg-[#1e1e1e] text-[#ff6b00] border-[#2e2e2e] dark:border-[#2e2e2e] hover:border-[#ff6b00]/60"}`}>
                    {baseLabel(b, lang)}
                  </button>
                ))}
                {collectionName === "mikilab" && (
                  <button data-testid="base-filter-colorati" onClick={() => setBaseFilter(baseFilter === "colorati" ? "all" : "colorati")}
                    className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all active:scale-97 ${
                      baseFilter === "colorati"
                        ? "bg-gradient-to-r from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white border-transparent shadow-sm"
                        : "bg-white dark:bg-[#1e1e1e] text-[#d62976] border-[#d62976]/40 hover:border-[#d62976]"}`}>
                    🌈 {triM("Colorati", "Bunt", "Colourful")}
                  </button>
                )}
              </div>
            )}

            {/* Filtro rapido per categoria (chip colorate) */}
            {(() => {
              const favRecipes = recipes.filter((r) => favs.has(r.id));
              if (favRecipes.length === 0 || favFilter) return null;
              return (
                <div data-testid="recipe-fav-row" className="mb-3">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-[#ff3b5c] mb-1.5 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 fill-[#ff3b5c]" /> {triM("Le tue preferite", "Deine Favoriten", "Your favourites")}
                  </p>
                  <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
                    {favRecipes.map((r) => (
                      <button key={r.id} data-testid={`fav-row-item-${r.id}`} onClick={() => setViewing(r)}
                        className="snap-start shrink-0 w-32 text-left rounded-2xl overflow-hidden border border-[#ff3b5c]/40 bg-white dark:bg-[#1e1e1e] active:scale-97 hover:border-[#ff3b5c] transition-all">
                        <img src={r.image_url || "/logo.png"} onError={(e) => { e.currentTarget.src = "/logo.png"; }} alt="" className="w-full h-16 object-cover bg-[#1e1e1e]" loading="lazy" />
                        <p className="text-[12px] font-bold text-[#2B303B] dark:text-white px-2 py-1.5 line-clamp-2 leading-tight">{rLoc(r, "name", lang)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div data-testid="recipe-cat-filters" className="flex gap-2 overflow-x-auto pb-2 mb-3 px-0.5 scrollbar-none max-w-full">
              <button data-testid="cat-filter-favs" onClick={() => setFavFilter((v) => !v)}
                className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all active:scale-97 ${favFilter ? "bg-[#ff3b5c] text-white border-[#ff3b5c] shadow-sm" : "bg-white dark:bg-[#1e1e1e] text-[#ff3b5c] border-[#ff3b5c]/40 hover:border-[#ff3b5c]"}`}>
                <Heart className={`w-3.5 h-3.5 ${favFilter ? "fill-white" : "fill-[#ff3b5c]"}`} />
                {triM("Preferite", "Favoriten", "Favourites")}{(() => { const n = [...favs].filter((id) => !String(id).startsWith("custodite:")).length; return n > 0 ? ` (${n})` : ""; })()}
              </button>
              <button data-testid="cat-filter-all" onClick={() => setCatFilter("all")}
                className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all active:scale-97 ${catFilter === "all" ? "bg-[#ff6b00] text-white border-[#ff6b00] shadow-sm" : "bg-white dark:bg-[#1e1e1e] text-[#ff6b00] border-[#2e2e2e] dark:border-[#2e2e2e] hover:border-[#ff6b00]/60"}`}>
                {triM("Tutte", "Alle", "All")}
              </button>
              {CATS.map((c) => {
                const active = catFilter === c.key;
                const col = CAT_COLORS[c.key] || "#ff6b00";
                return (
                  <button key={c.key} data-testid={`cat-filter-${c.key}`} onClick={() => setCatFilter(active ? "all" : c.key)}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all active:scale-97"
                    style={active
                      ? { background: col, color: "#fff", borderColor: col, boxShadow: `0 3px 10px ${col}55` }
                      : { background: "transparent", color: col, borderColor: col + "66" }}>
                    <span>{c.icon}</span>{t(c.label)}
                  </button>
                );
              })}
            </div>

            {/* Contatore risultati + azzera filtri: rende chiaro cosa stai vedendo */}
            <div data-testid="recipe-results-bar" className="flex items-center justify-between gap-2 mb-2 px-0.5">
              <span className="text-xs font-semibold text-[#7E8A93]">
                {filtered.length} {filtered.length === 1 ? triM("ricetta", "Rezept", "recipe") : triM("ricette", "Rezepte", "recipes")}
              </span>
              {(catFilter !== "all" || baseFilter !== "all" || favFilter || (query || "").trim() !== "") && (
                <button data-testid="recipe-clear-filters" onClick={() => { setCatFilter("all"); setBaseFilter("all"); setFavFilter(false); setQuery(""); }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#ff6b00] active:scale-95 transition-transform">
                  <X className="w-3.5 h-3.5" /> {triM("Azzera filtri", "Filter zurücksetzen", "Clear filters")}
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <p className="text-center text-[#7E8A93] py-8 text-sm" data-testid="recipe-no-results">
                {favFilter && [...favs].filter((id) => !String(id).startsWith("custodite:")).length === 0
                  ? triM("Nessuna preferita ancora. Tocca il ❤ su una ricetta per salvarla qui.", "Noch keine Favoriten. Tippe auf das ❤ einer Rezept, um es hier zu speichern.", "No favourites yet. Tap the ❤ on a recipe to save it here.")
                  : triM("Nessuna ricetta trovata.", "Kein Rezept gefunden.", "No recipe found.")}
              </p>
            ) : (
              <div className="space-y-3">
                {CATS.map((cat) => {
                  const items = filtered.filter((r) => recipeCategory(r).key === cat.key);
                  if (items.length === 0) return null;
                  const searching = (query || "").trim() !== "" || baseFilter !== "all" || favFilter || catFilter !== "all";
                  const open = searching ? true : (openCats[cat.key] !== undefined ? openCats[cat.key] : false); // ricerca attiva: apri le cartelle; altrimenti TUTTE le categorie chiuse di default
                  const coverSrc = (() => {
                    const chosen = folderCovers[cat.key];
                    const raw = chosen || (items.find((r) => r.image_url) || {}).image_url;
                    if (!raw) return null;
                    return raw.startsWith("http") ? raw : `${process.env.PUBLIC_URL}${raw}`;
                  })();
                  return (
                    <div key={cat.key} data-testid={`cat-section-${cat.key}`}
                      className="rounded-2xl border border-[#2e2e2e] dark:border-[#2e2e2e] overflow-hidden bg-white/40 dark:bg-[#1e1e1e]/40">
                      <button data-testid={`cat-folder-${cat.key}`}
                        onClick={() => setOpenCats((o) => ({ ...o, [cat.key]: !open }))}
                        className="relative w-full h-24 flex items-end active:scale-[0.99] transition-all overflow-hidden">
                        {coverSrc && (
                          <img src={coverSrc} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        )}
                        <div className={`absolute inset-0 ${coverSrc ? "bg-gradient-to-t from-[#1A1412]/85 via-[#1A1412]/30 to-[#1A1412]/10" : "bg-[#ff6b00]/12"}`} />
                        <div className="relative z-10 w-full flex items-center gap-2 px-3.5 py-3">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-xl shrink-0 drop-shadow"
                            style={{ background: (CAT_COLORS[cat.key] || "#ff6b00") + (coverSrc ? "55" : "33"), boxShadow: `inset 0 0 0 1.5px ${CAT_COLORS[cat.key] || "#ff6b00"}` }}>{cat.icon}</span>
                          <h2 className={`font-display text-xl font-bold flex-1 text-left ${coverSrc ? "text-white drop-shadow" : "text-[#ff6b00]"}`}>{t(cat.label)}</h2>
                          <span className="text-xs font-mono-data font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: (CAT_COLORS[cat.key] || "#ff6b00") + (coverSrc ? "cc" : "aa") }}>{items.length}</span>
                          <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${coverSrc ? "text-white" : "text-[#7E8A93]"} ${open ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }} className="overflow-hidden">
                            <div className="grid grid-cols-2 gap-3 p-3">
                              {items.map((r, i) => Card(r, i))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Finestra ricetta */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto bg-[#121212] dark:bg-[#121212] border-[#2e2e2e] dark:border-[#2e2e2e] p-0">
          <DialogTitle className="sr-only">{viewing?.name || t("recipe_ingredients")}</DialogTitle>
          <DialogDescription className="sr-only">{t("recipe_dialog_desc")}</DialogDescription>
          <div className="sticky top-0 z-10 flex justify-end items-center gap-1 px-4 pt-3 pb-2 bg-[#121212]/95 dark:bg-[#121212]/95 backdrop-blur">
            {canEdit && viewing && (lang === "de" || lang === "en" || lang === "es") && !viewing[`name_${lang}`] && (
              <button data-testid="recipe-translate-btn" disabled={translating}
                onClick={async () => {
                  setTranslating(true);
                  try {
                    const up = await recipesApi.translate(viewing.id, lang);
                    setViewing(up); load();
                    toast.success(triM("Ricetta tradotta ✓", "Rezept übersetzt ✓", "Recipe translated ✓"));
                  } catch (e) {
                    toast.error(e?.response?.status === 403 ? triM("Funzione PRO", "PRO-Funktion", "PRO feature") : triM("Traduzione non riuscita", "Übersetzung fehlgeschlagen", "Translation failed"));
                  } finally { setTranslating(false); }
                }}
                className="mr-auto text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#ff6b00] text-white disabled:opacity-60 active:scale-95 transition-all">
                {translating ? "…" : triM(`Traduci in ${lang.toUpperCase()}`, `Auf ${lang.toUpperCase()} übersetzen`, `Translate to ${lang.toUpperCase()}`)}
              </button>
            )}
            {["it", "de", "en", "es", "fr", "fa"].map((lc) => (
              <button key={lc} data-testid={`recipe-lang-${lc}`} onClick={() => setLang(lc)}
                className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg border transition-all ${lang === lc ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-white dark:bg-[#1e1e1e] text-[#7E8A93] border-[#2e2e2e] dark:border-[#2e2e2e]"}`}>
                {lc}
              </button>
            ))}
          </div>
          {viewing && (
            <RecipeDetail
              r={viewing}
              t={t}
              readOnly={readOnly}
              canEdit={canEdit}
              scaleVal={scale[viewing.id]}
              onScaleChange={(v) => setScale((s) => ({ ...s, [viewing.id]: v }))}
              onImprover={openImprover}
              onUnlock={handleUnlock}
              onEdit={() => { setEditing(viewing); setDialogOpen(true); setViewing(null); }}
              onDuplicate={() => handleDuplicate(viewing)}
              onScaleAction={() => setScaling(viewing)}
              onDelete={() => setToDelete(viewing)}
            />
          )}
        </DialogContent>
      </Dialog>

      <RecipeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={handleSave}
      />

      {/* Acquisto singolo ricette (pay-per-item) */}
      <ScaleDialog
        recipe={scaling}
        open={!!scaling}
        onOpenChange={(o) => !o && setScaling(null)}
        onSave={handleScaleSave}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="bg-[#121212] dark:bg-[#121212] border-[#2e2e2e] dark:border-[#2e2e2e]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{t("delete_recipe_q")}</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.name}" {t("delete_recipe_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-cancel-btn">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="delete-confirm-btn"
              onClick={handleDelete}
              className="bg-[#ff6b00] hover:bg-[#ff8a33]"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// "Miglioratore" (localizzato) nel procedimento → asterisco cliccabile che apre la scheda del Miglioratore.
function procWithImprover(text, onImprover) {
  return renderProcedureWithImprover(text, onImprover);
}


function RecipeDetail({ r, t, readOnly, canEdit, scaleVal, onScaleChange, onImprover, onUnlock, onEdit, onDuplicate, onScaleAction, onDelete }) {
  const { lang } = useLang();
  const de = lang === "de";
  const { isFav, toggle: toggleFav } = useFavRecipes();
  const tri = (i_, d_, e_) => mkTri(lang)(i_, d_, e_);
  const isPanettone = /panettone|colomba|pandoro/i.test(r.name || "");
  const [farro, setFarro] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  useEffect(() => { setFarro(false); /* eslint-disable-next-line */ }, [r.id]);
  const flourG = Number(r.flour_grams) || 0;
  const target = flourG > 0 ? (Number(scaleVal) || flourG) : 0;
  const f = flourG > 0 ? target / flourG : 1;
  const g = (v) => (v == null ? null : Math.round(Number(v) * f));
  // In modalità farro l'idratazione dell'impasto principale è ridotta ~4%.
  const gWater = (v) => { const b = g(v); return b == null ? null : (farro ? Math.round(b * 0.96) : b); };
  const pct = (v) => (flourG > 0 && v != null ? ` · ${Math.round((Number(v) / flourG) * 1000) / 10}%` : "");
  const biga = (!r.locked && r.preferment_type === "biga" && r.biga) ? r.biga : null;
  const bFlour = biga ? Math.round((Number(biga.flour_g) || 0) * f) : 0;
  const bWater = biga ? Math.round((Number(biga.water_g) || 0) * f) : 0;
  const bYeast = biga ? Math.round((Number(biga.yeast_g) || 0) * f) : 0;
  const rows = [];
  if (r.flour_grams != null) rows.push([t("ing_flour"), `${g(r.flour_grams) - bFlour} g${pct(Number(r.flour_grams) - (biga ? Number(biga.flour_g) || 0 : 0))}`]);
  if (r.water_grams != null) rows.push([t("ing_water"), `${gWater(r.water_grams) - bWater} g${pct((farro ? Number(r.water_grams) * 0.96 : Number(r.water_grams)) - (biga ? Number(biga.water_g) || 0 : 0))}`]);
  if (r.sourdough_grams) rows.push([`${t("ing_preferment")}${r.preferment_type && r.preferment_type !== "none" ? ` (${t(`pf_${r.preferment_type}`)})` : ""}`, `${g(r.sourdough_grams)} g${pct(r.sourdough_grams)}`]);
  if (r.salt_grams != null) rows.push([t("ing_salt"), `${g(r.salt_grams)} g${pct(r.salt_grams)}`]);
  (r.extra_ingredients || []).forEach((e) => {
    if (e && e.name && e.percent != null && e.percent !== "") {
      if (biga && /lievito di birra|hefe/i.test(e.name)) return; // il lievito è nel Vorteig
      const grams = flourG > 0 ? Math.round(target * (Number(e.percent) / 100)) : null;
      rows.push([e[`name_${lang}`] || ingLoc(e.name, lang), grams != null ? `${grams} g · ${e.percent}%` : `${e.percent}%`]);
    }
  });
  (r.costing?.extras || []).forEach((e) => { if (e.name) rows.push([ingLoc(e.name, lang), e.cost ? `€ ${e.cost}` : "—"]); });

  const cst = r.costing;
  const n = (v) => Number(v) || 0;
  const [pieces, setPieces] = useState("");
  useEffect(() => { setPieces(cst?.pieces != null ? String(cst.pieces) : ""); /* eslint-disable-next-line */ }, [r.id]);
  let priceBlock = null;
  if (cst && !isPanettone) {
    const cFlour = n(g(r.flour_grams)) / 1000 * n(cst.flour_kg);
    const cWater = n(g(r.water_grams)) / 1000 * n(cst.water_l);
    const cSour = n(g(r.sourdough_grams)) / 1000 * n(cst.sourdough_kg);
    const cSalt = n(g(r.salt_grams)) / 1000 * n(cst.salt_kg);
    const overhead = n(cst.overhead);
    const br = [];
    if (cFlour > 0) br.push([t("ing_flour"), cFlour]);
    if (cWater > 0) br.push([t("ing_water"), cWater]);
    if (cSour > 0) br.push([t("ing_preferment"), cSour]);
    if (cSalt > 0) br.push([t("ing_salt"), cSalt]);
    (cst.extras || []).forEach((e) => { if (e.name && n(e.cost) > 0) br.push([e.name, n(e.cost)]); });
    if (overhead > 0) br.push([t("cost_overhead"), overhead]);
    const total = br.reduce((s, [, v]) => s + v, 0);
    const pcs = n(pieces);
    const perPiece = pcs > 0 ? total / pcs : null;
    if (total > 0) {
      priceBlock = (
        <div data-testid={`recipe-cost-${r.id}`} className="rounded-xl px-3 py-3 border bg-[#ff6b00]/10 border-[#ff6b00]/30">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] dark:text-[#8FB0C2] mb-2">{t("cost_breakdown")}</p>
          <div className="space-y-1 mb-2">
            {br.map(([label, val], idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{label}</span>
                <span className="font-mono-data text-[#ff6b00] dark:text-[#8FB0C2]">€ {val.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#2e2e2e]/60 dark:border-[#2e2e2e]">
            <span className="text-xs font-semibold text-[#3F4A54] dark:text-[#AEB8BF]">{t("cost_total")}</span>
            <span className="font-mono-data text-sm font-bold text-[#ff6b00] dark:text-[#8FB0C2]">€ {total.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[#7E8A93]">{t("cost_pieces")}</span>
            <div className="flex items-center gap-1.5">
              <button data-testid={`pieces-minus-${r.id}`} onClick={() => setPieces((p) => String(Math.max(1, (n(p) || 1) - 1)))} className="w-7 h-7 rounded-lg bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] text-[#ff6b00] font-bold">−</button>
              <input
                data-testid={`pieces-input-${r.id}`} type="number" value={pieces}
                onChange={(e) => setPieces(e.target.value)}
                className="w-14 text-center font-mono-data text-sm font-bold bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg py-1 outline-none"
              />
              <button data-testid={`pieces-plus-${r.id}`} onClick={() => setPieces((p) => String((n(p) || 0) + 1))} className="w-7 h-7 rounded-lg bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] text-[#ff6b00] font-bold">+</button>
            </div>
          </div>
          {perPiece != null && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2e2e2e]/60 dark:border-[#2e2e2e]">
              <span className="text-xs font-semibold text-[#3F4A54] dark:text-[#AEB8BF]">{t("cost_per_piece")}</span>
              <span className="font-mono-data text-sm font-bold text-[#ff6b00]">€ {perPiece.toFixed(2)}</span>
            </div>
          )}
          {(cst.b2b_500g || cst.b2b_100g) && (
            <div className="mt-2 pt-2 border-t border-[#2e2e2e]/60 dark:border-[#2e2e2e]" data-testid={`b2b-${r.id}`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] mb-1">{t("labels_b2b_hint")}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#ff6b00]/10 border border-[#ff6b00]/30 px-2 py-1.5 text-center">
                  <p className="text-[9px] uppercase tracking-wide text-[#7E8A93]">{t("labels_b2b_500")}</p>
                  <p className="font-mono-data text-sm font-extrabold text-[#ff6b00]">€ {Number(cst.b2b_500g || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-[#ff6b00]/10 border border-[#ff6b00]/30 px-2 py-1.5 text-center">
                  <p className="text-[9px] uppercase tracking-wide text-[#7E8A93]">{t("labels_b2b_100")}</p>
                  <p className="font-mono-data text-sm font-extrabold text-[#ff6b00]">€ {Number(cst.b2b_100g || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  const shareRecipe = async () => {
    const url = `${window.location.origin}/?ricetta=${r.id}`;
    const title = rLoc(r, "name", lang);
    const textMsg = tri(`Guarda questa ricetta su MikiLab: ${title}`, `Schau dir dieses Rezept auf MikiLab an: ${title}`, `Check out this recipe on MikiLab: ${title}`);
    try {
      if (navigator.share) { await navigator.share({ title: `MikiLab · ${title}`, text: textMsg, url }); return; }
    } catch (e) { /* utente ha annullato */ return; }
    try { await navigator.clipboard.writeText(url); toast.success(tri("Link copiato!", "Link kopiert!", "Link copied!")); }
    catch { toast.error(tri("Impossibile copiare il link", "Link kann nicht kopiert werden", "Couldn't copy the link")); }
  };

  return (
    <div data-testid={`recipe-detail-${r.id}`}>
      {r.image_url && isPanettone && (
        <div className="relative h-40 w-full">
          <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
          {countryColors(r.origin) && (
            <div aria-hidden className="absolute top-0 left-0 right-0 flex h-1.5">
              {countryColors(r.origin).map((c, k) => <div key={k} className="flex-1" style={{ background: c }} />)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/70 to-transparent" />
        </div>
      )}
      <div className="p-5 space-y-4 print-area">
        <PrintHeader title={rLoc(r, "name", lang)} lang={lang} />
        <div>
          <h2 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">
            {r.origin && flagEmoji(r.origin) && <span className="mr-1" title={countryName(r.origin)}>{flagEmoji(r.origin)}</span>}
            {isPanettone && farro ? rLoc(r, "name", lang).replace(/mikilab/i, (m) => "al Farro " + m) : rLoc(r, "name", lang)}
          </h2>
          {rLoc(r, "real_name", lang) ? <p className="text-sm font-semibold text-[#ff6b00] mt-0.5">{rLoc(r, "real_name", lang)}</p> : null}
          {r.flour_type ? <p className="text-sm text-[#7E8A93] mt-0.5">{rLoc(r, "flour_type", lang)}</p> : null}
        </div>

        <div className="flex gap-1.5 no-print flex-wrap">
          <ActionBtn testid={`fav-recipe-${r.id}`} onClick={() => toggleFav(r.id)} color={isFav(r.id) ? "#ff3b5c" : "#7E8A93"} label={isFav(r.id) ? tri("Nei preferiti", "In Favoriten", "In favourites") : tri("Aggiungi ai preferiti", "Zu Favoriten", "Add to favourites")}>
            <Heart className={`w-4 h-4 ${isFav(r.id) ? "fill-[#ff3b5c]" : ""}`} />
          </ActionBtn>
          <ActionBtn testid={`share-recipe-${r.id}`} onClick={shareRecipe} color="#ff6b00" label={tri("Condividi", "Teilen", "Share")}><Share2 className="w-4 h-4" /></ActionBtn>
          {!r.locked && rLoc(r, "procedure", lang) && (
            <ActionBtn testid={`listen-recipe-${r.id}`} onClick={() => playTTS(`${rLoc(r, "name", lang)}. ${rLoc(r, "procedure", lang)}`, { who: "momy", lang }).catch(() => {})} color="#ff6b00" label={tri("Ascolta", "Anhören", "Listen")}><Volume2 className="w-4 h-4" /></ActionBtn>
          )}
          {!r.locked && rLoc(r, "procedure", lang) && (
            <ActionBtn testid={`handsfree-recipe-${r.id}`} onClick={() => setHandsFree(true)} color="#ff6b00" label={tri("Mani in Pasta", "Hände im Teig", "Hands-free", "Manos en la masa")}><Hand className="w-4 h-4" /></ActionBtn>
          )}
          {!r.locked && (
            <ActionBtn testid={`timeline-recipe-${r.id}`} onClick={() => setShowTimeline((v) => !v)} color="#2e8b6f" label={tri("Linea del tempo", "Zeitplan", "Timeline", "Línea de tiempo")}><Clock className="w-4 h-4" /></ActionBtn>
          )}
          {!r.locked && (
            <ActionBtn testid={`pdf-recipe-${r.id}`} onClick={() => window.print()} color="#ff6b00" label={tri("PDF / Stampa", "PDF / Drucken", "PDF / Print")}><Printer className="w-4 h-4" /></ActionBtn>
          )}
          <ActionBtn testid={`scale-recipe-${r.id}`} onClick={onScaleAction} color="#ff6b00" label={t("scale_aria")}><Scale className="w-4 h-4" /></ActionBtn>
          {canEdit && <ActionBtn testid={`duplicate-recipe-${r.id}`} onClick={onDuplicate} color="#7E8A93" label={t("duplicate_aria")}><Copy className="w-4 h-4" /></ActionBtn>}
          {canEdit && <ActionBtn testid={`edit-recipe-${r.id}`} onClick={onEdit} color="#ff6b00"><Pencil className="w-4 h-4" /></ActionBtn>}
          {canEdit && <ActionBtn testid={`delete-recipe-${r.id}`} onClick={onDelete} color="#ff6b00"><Trash2 className="w-4 h-4" /></ActionBtn>}
        </div>

        {isPanettone && !r.locked && (
          <button data-testid={`farro-toggle-${r.id}`} onClick={() => setFarro((v) => !v)}
            className={`w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold text-sm transition-all active:scale-98 border ${
              farro ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-[#ff6b00]/10 text-[#ff6b00] dark:text-[#8FB0C2] border-[#ff6b00]/40"
            }`}>
            <Wheat className="w-4 h-4" />
            {farro
              ? tri("Versione al Farro attiva — torna al grano", "Dinkel-Version aktiv — zur Weizen-Version", "Spelt version active — back to wheat")
              : tri("Converti in Farro", "In Dinkel (Farro) umwandeln", "Convert to Spelt")}
          </button>
        )}

        {isPanettone && !r.locked && farro && (
          <div data-testid={`farro-banner-${r.id}`} className="rounded-xl bg-[#ff6b00]/12 border border-[#ff6b00]/30 p-3 text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">
            🌾 {tri(
              "VERSIONE AL FARRO: essendo il glutine del farro più fragile e tenace, l'idratazione è stata ridotta di ~4%. Impasta per meno tempo e più delicatamente (evita il surriscaldamento); inserisci burro e tuorli in piccole dosi frazionate. Gestione del lievito madre, glassa e procedimento restano invariati.",
              "DINKEL-VERSION: Da das Dinkelgluten zerbrechlicher ist, wurde die Hydratation ~4% reduziert. Kürzer und schonender kneten (Überhitzung vermeiden); Butter und Eigelb in kleinen Portionen fraktioniert einarbeiten. Lievito-Madre-Führung, Glasur und Ablauf bleiben unverändert.",
              "SPELT VERSION: as spelt gluten is more fragile and tenacious, hydration was reduced by ~4%. Knead shorter and more gently (avoid overheating); add butter and yolks in small fractioned portions. Sourdough management, glaze and procedure stay unchanged.")}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {r.dough_category && <Badge icon={<Layers className="w-3.5 h-3.5" />}>{t(`dc_${r.dough_category}`)}</Badge>}
          {r.water_temp_c != null && r.water_temp_c !== "" && <Badge icon={<Droplets className="w-3.5 h-3.5" />}>{r.water_temp_c}°C {t("badge_water_temp")}</Badge>}
          {r.hydration_percent != null && <Badge icon={<Droplets className="w-3.5 h-3.5" />}>{r.hydration_percent}% {t("badge_hydration")}</Badge>}
          {r.flour_grams != null && <Badge icon={<Wheat className="w-3.5 h-3.5" />}>{r.flour_grams}g {t("badge_flour")}</Badge>}
          {r.bulk_fermentation_hours != null && <Badge icon={<Clock className="w-3.5 h-3.5" />}>{r.bulk_fermentation_hours}h {t("badge_ferment")}</Badge>}
          {r.bake_temp != null && (
            <Badge icon={<Flame className="w-3.5 h-3.5" />}>
              {r.bake_temp}°{r.bake_minutes != null ? ` · ${r.bake_minutes}′` : ""} {r.oven_type === "ventilato" ? t("oven_type_fan") : r.oven_type === "rotor" ? t("oven_type_rotor") : t("oven_type_static")}
            </Badge>
          )}
          {r.method_type && (
            <Badge icon={<Layers className="w-3.5 h-3.5" />}>{r.method_type === "diretto" ? t("method_diretto") : t("method_indiretto")}</Badge>
          )}
        </div>

        {isPanettone && !r.locked ? (
          <PanettoneStructure r={r} t={t} lang={lang} flourG={flourG} farro={farro} scaleVal={scaleVal} onScaleChange={onScaleChange} />
        ) : rows.length > 0 ? (
          <>
          {biga && (
            <div data-testid={`recipe-biga-${r.id}`} className="rounded-xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] dark:text-[#8FB0C2] mb-2">🥖 {tri("Fase 1 · Vorteig (Biga)", "Phase 1 · Vorteig (Biga)", "Phase 1 · Vorteig (Biga)")}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm"><span className="text-[#3F4A54] dark:text-[#AEB8BF]">{t("ing_flour")}</span><span className="font-mono-data font-semibold text-[#ff6b00] dark:text-[#8FB0C2]">{bFlour} g</span></div>
                <div className="flex items-center justify-between text-sm"><span className="text-[#3F4A54] dark:text-[#AEB8BF]">{t("ing_water")}</span><span className="font-mono-data font-semibold text-[#ff6b00] dark:text-[#8FB0C2]">{bWater} g</span></div>
                {bYeast > 0 && <div className="flex items-center justify-between text-sm"><span className="text-[#3F4A54] dark:text-[#AEB8BF]">{tri("Lievito di birra", "Hefe", "Fresh yeast")}</span><span className="font-mono-data font-semibold text-[#ff6b00] dark:text-[#8FB0C2]">{bYeast} g</span></div>}
              </div>
              {(biga.hours || biga.hours_de) && <p className="text-[11px] text-[#7E8A93] mt-2 leading-relaxed">{de ? (biga.hours_de || biga.hours) : (lang === "en" ? (biga.hours_en || biga.hours) : biga.hours)}</p>}
            </div>
          )}
          {biga && <div className="border-t border-dashed border-[#ff6b00]/50 my-1" aria-hidden />}
          <div data-testid={`recipe-ingredients-${r.id}`} className="rounded-xl bg-[#e4eff8] dark:bg-[#1e1e1e] p-3 print-table">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00]">{biga ? tri("Fase 2 · Impasto principale", "Phase 2 · Hauptteig", "Phase 2 · Main dough") : t("recipe_ingredients")}</p>
              {flourG > 0 && (
                <div className="flex items-center gap-1 no-print">
                  <span className="text-[10px] text-[#7E8A93]">{t("recipe_scale")}</span>
                  <input
                    data-testid={`recipe-scale-${r.id}`} type="number" value={scaleVal ?? flourG}
                    onChange={(e) => onScaleChange(e.target.value)}
                    className="w-20 text-right font-mono-data text-xs font-bold text-[#ff6b00] dark:text-[#8FB0C2] bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-md px-1.5 py-1 outline-none"
                  />
                  <span className="text-[10px] text-[#7E8A93]">g</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              {rows.map(([k, v], idx) => {
                const isImprover = typeof k === "string" && /migliorator|backmittel/i.test(k);
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-[#3F4A54] dark:text-[#AEB8BF]">
                      {k}
                      {isImprover && (
                        <button data-testid={`improver-link-${r.id}`} onClick={onImprover} className="ml-1 text-[#ff6b00] font-bold align-super" title={t("improver_link_title")}>*</button>
                      )}
                    </span>
                    <span className="font-mono-data font-semibold text-[#ff6b00] dark:text-[#8FB0C2]">{v}</span>
                  </div>
                );
              })}
            </div>
          </div>
          </>
        ) : null}

        {r.procedure ? (
          <div data-testid={`recipe-procedure-${r.id}`} className="rounded-xl bg-[#ff6b00]/10 border border-[#ff6b00]/25 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] dark:text-[#a9d2ec] mb-1.5">{t("recipe_procedure")}</p>
            <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed whitespace-pre-line">{procWithImprover(rLoc(r, "procedure", lang), onImprover)}</p>
          </div>
        ) : null}

        {!r.locked && r.procedure ? <MachineScheda /> : null}

        {r.notes ? <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed whitespace-pre-line">{rLoc(r, "notes", lang)}</p> : null}

        <GlossaryBox text={`${r.procedure || ""} ${r.notes || ""}`} />

        <EULabel recipe={r} lang={lang} />

        {Array.isArray(r.work_phases) && r.work_phases.filter((p) => p && (p.name || p.time || p.temp)).length > 0 && (
          <div data-testid={`recipe-phases-${r.id}`} className="rounded-xl bg-[#ff6b00]/8 border border-[#ff6b00]/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] mb-2">{t("work_phases_section")}</p>
            <div className="space-y-1.5">
              {r.work_phases.filter((p) => p && (p.name || p.time || p.temp)).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-[#3F4A54] dark:text-[#AEB8BF] font-medium">{p.name || `${t("phase_name_ph")} ${idx + 1}`}</span>
                  <span className="font-mono-data text-[#ff6b00] dark:text-[#8FB0C2] shrink-0 ml-2">
                    {p.time ? p.time : ""}{p.time && p.temp ? " · " : ""}{p.temp ? `${fmtTemp(p.temp)}°C` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showTimeline && !r.locked && <RecipeTimeline recipe={r} lang={lang} />}

        {priceBlock}

        <TattooSignature className="mt-1" testid={`recipe-signature-${r.id}`} />
      </div>
      {handsFree && (
        <HandsFreeMode recipe={r} procedure={rLoc(r, "procedure", lang)} lang={lang} onClose={() => setHandsFree(false)} />
      )}
    </div>
  );
}

function ActionBtn({ testid, onClick, color, label, children }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      aria-label={label}
      className="w-9 h-9 rounded-lg bg-[#e4eff8] dark:bg-[#1e1e1e] flex items-center justify-center active:scale-95"
      style={{ color }}
    >
      {children}
    </button>
  );
}

function Badge({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#ff6b00]/15 text-[#ff6b00] dark:text-[#8FB0C2] font-mono-data text-xs px-2.5 py-1 rounded-full font-bold border border-[#ff6b00]/30">
      {icon}
      {children}
    </span>
  );
}

// Normalizes a phase temperature: keeps the number, drops any unit (° / C) the user may have typed.
function fmtTemp(v) {
  if (v == null) return "";
  const m = String(v).match(/-?\d+(?:[.,]\d+)?/);
  return m ? m[0].replace(",", ".") : String(v).replace(/[°cC\s]+$/g, "");
}

// Categoria e ordine di visualizzazione: Backmittel -> Lievito Madre -> Panettoni -> Pane -> Panini

// Badge sintetici derivati dalla ricetta (LM, LDB, Vk, Rg, Poolish, Biga, numeri farina).
function recipeBadges(r) {
  const out = [];
  const pref = (r.preferment_type || "").toLowerCase();
  const ft = (r.flour_type || "").toLowerCase();
  const notes = (r.notes || "").toLowerCase();
  const extras = r.extra_ingredients || [];
  if (/segale|roggen|\brg\b|rye/.test(ft) || pref.includes("segale")) out.push("Rg");
  if (/licoli|lievito madre|lievito naturale|pasta madre|sauerteig|sourdough/.test(pref + " " + ft)) out.push("LM");
  if (/poolish/.test(pref + " " + notes)) out.push("Poolish");
  if (pref === "biga" || /\bbiga\b|vorteig/.test(ft) || (r.biga && r.preferment_type === "biga")) out.push("Biga");
  if (/integrale|vollkorn|\bvk\b/.test(ft + " " + notes)) out.push("Vk");
  if (extras.some((e) => /lievito di birra|hefe/i.test(e && e.name))) out.push("LDB");
  // numeri farina (630, 550, 405, 812, 1050, 00, W380…)
  const wm = (r.flour_type || "").match(/w\s?\d{3}/gi);
  if (wm) wm.forEach((w) => out.push(w.replace(/\s/g, "").toUpperCase()));
  const nums = (r.flour_type || "").match(/\b(300|380|405|550|630|812|1050|1600)\b/g);
  if (nums) nums.forEach((n) => { if (!out.includes(n)) out.push(n); });
  return [...new Set(out)];
}

const BADGE_STYLE = {
  LM: "bg-[#ff6b00]/15 text-[#ff6b00] border-[#ff6b00]/40",
  LDB: "bg-[#ff6b00]/12 text-[#ff6b00] border-[#ff6b00]/35",
  Rg: "bg-[#ff6b00]/12 text-[#ff6b00] border-[#ff6b00]/35",
  Vk: "bg-[#ff6b00]/12 text-[#ff6b00] border-[#ff6b00]/35",
  Poolish: "bg-[#ff6b00]/12 text-[#ff8a33] border-[#ff6b00]/35",
  Biga: "bg-[#ff6b00]/12 text-[#ff8a33] border-[#ff6b00]/35",
};
function badgeClass(b) {
  return BADGE_STYLE[b] || "bg-[#ff6b00]/15 text-[#ff6b00] border-[#ff6b00]/35";
}

// Etichetta badge localizzata: sigle comprensibili per lingua.
const BADGE_LABEL = {
  Vk: { it: "INT", de: "VK", en: "WW" },        // integrale / Vollkorn / wholewheat
  LDB: { it: "LDB", de: "Frischhefe", en: "Yeast" },
  Rg: { it: "Segale", de: "Roggen", en: "Rye" },
  LM: { it: "LM", de: "Sauerteig", en: "Sourdough" },
};
function badgeLabel(b, lang) {
  const m = BADGE_LABEL[b];
  return m ? (m[lang] || m.it) : b;
}
// Spiegazione farine tedesche (Type) → cereale/equivalente italiano.
const FLOUR_INFO = {
  "300": { it: "Farina debole", de: "Schwaches Mehl", en: "Weak flour" },
  "380": { it: "W380 · farina forte", de: "W380 · starkes Mehl", en: "W380 · strong flour" },
  "405": { it: "≈ Farina 00 (grano tenero)", de: "Weizen Type 405", en: "≈ soft wheat 00" },
  "550": { it: "≈ Farina 0 (grano tenero)", de: "Weizen Type 550", en: "≈ soft wheat type 0" },
  "630": { it: "Farro · Dinkel (Type 630)", de: "Dinkelmehl Type 630", en: "Spelt (Type 630)" },
  "812": { it: "≈ Farina Tipo 1", de: "Weizen Type 812", en: "≈ type 1 flour" },
  "1050": { it: "≈ Tipo 2 · semi-integrale", de: "Weizen Type 1050", en: "≈ type 2 / high-extraction" },
  "1600": { it: "≈ Farina integrale", de: "Vollkorn Type 1600", en: "≈ wholemeal" },
};
function badgeTitle(b, lang) {
  if (FLOUR_INFO[b]) return FLOUR_INFO[b][lang] || FLOUR_INFO[b].it;
  if (/^W\d{3}$/.test(b)) return { it: "Farina forte (indice W)", de: "Starkes Mehl (W-Wert)", en: "Strong flour (W index)" }[lang] || "";
  const desc = { Vk: { it: "Farina integrale", de: "Vollkornmehl", en: "Wholewheat" }, LDB: { it: "Lievito di birra", de: "Frischhefe", en: "Fresh yeast" }, Rg: { it: "Segale", de: "Roggen", en: "Rye" }, LM: { it: "Lievito madre", de: "Sauerteig", en: "Sourdough" }, Poolish: { it: "Prefermento liquido", de: "Poolish-Vorteig", en: "Poolish preferment" }, Biga: { it: "Prefermento solido (Biga)", de: "Biga-Vorteig", en: "Biga preferment" } }[b];
  return desc ? (desc[lang] || desc.it) : "";
}

// Basi/prefermenti presenti in una ricetta → per il filtro "per Base".
const BASE_KEYS = ["poolish", "biga", "lm", "segale", "licoli", "kochstuck", "quark", "indiretto", "diretto"];
function recipeBase(r) {
  const pref = (r.preferment_type || "").toLowerCase();
  const ft = (r.flour_type || "").toLowerCase();
  const notes = (r.notes || "").toLowerCase();
  const name = (r.name || "").toLowerCase();
  const extras = (r.extra_ingredients || []).map((e) => ((e && e.name) || "").toLowerCase()).join(" ");
  const hay = [pref, ft, notes, name, extras].join(" ");
  const out = [];
  if (/poolish/.test(hay)) out.push("poolish");
  if (pref === "biga" || /\bbiga\b|vorteig/.test(hay) || r.biga) out.push("biga");
  if (/licoli/.test(hay)) out.push("licoli");
  if (/segale|roggen|\brye\b/.test(hay)) out.push("segale");
  if (pref === "lm" || /lievito madre|pasta madre|lievito naturale|sauerteig|sourdough/.test(hay)) out.push("lm");
  if (/kochst|farina cotta/.test(hay)) out.push("kochstuck");
  if (/quark/.test(hay)) out.push("quark");
  const method = (r.method_type || "").toLowerCase();
  const hasPref = out.some((k) => ["poolish", "biga", "lm", "licoli", "segale"].includes(k));
  const isIndirect = method === "indiretto" || hasPref;
  if (isIndirect) out.push("indiretto");
  if (!isIndirect && (pref === "diretto" || pref === "none" || pref === "" || out.length === 0)) out.push("diretto");
  return [...new Set(out)];
}
function baseLabel(k, lang) {
  const T = mkTri(lang);
  switch (k) {
    case "all": return T("Tutte", "Alle", "All", "Todas");
    case "poolish": return "Poolish";
    case "biga": return "Biga";
    case "lm": return T("Lievito Madre", "Sauerteig", "Sourdough", "Masa madre");
    case "segale": return T("LM di Segale", "Roggen-ST", "Rye sourdough", "MM de centeno");
    case "licoli": return "LiCoLi";
    case "kochstuck": return T("Farina Cotta", "Kochstück", "Cooked flour", "Harina cocida");
    case "quark": return "Quark";
    case "indiretto": return T("Indiretto", "Indirekt", "Indirect", "Indirecto");
    case "diretto": return T("Diretto", "Direkt", "Direct", "Directo");
    default: return k;
  }
}

const GLOSSARY = {
  bassinage: {
    it: "Bassinage: si trattiene una parte dell'acqua (~10%) e la si aggiunge poco a poco all'impasto GIÀ incordato, per raggiungere alte idratazioni senza smontare la maglia glutinica.",
    de: "Bassinage: Man hält ca. 10% des Wassers zurück und arbeitet es erst in den FERTIG gekneteten Teig ein – so erreicht man hohe Hydratation, ohne das Glutengerüst zu zerstören.",
    en: "Bassinage: hold back part of the water (~10%) and work it into the ALREADY developed dough little by little, to reach high hydration without breaking the gluten network.",
    match: ["bassinage"],
  },
  autolisi: {
    it: "Autolisi: riposo iniziale di farina e acqua (20-40 min) prima di sale e lievito; sviluppa glutine e rende l'impasto più estensibile.",
    de: "Autolyse: anfängliche Ruhezeit von Mehl und Wasser (20-40 Min.) vor Salz und Hefe; entwickelt Gluten und macht den Teig dehnbarer.",
    en: "Autolyse: an initial rest of flour and water (20-40 min) before salt and yeast; it develops gluten and makes the dough more extensible.",
    match: ["autolisi", "autolyse"],
  },
  poolish: {
    it: "Poolish: prefermento liquido (farina e acqua in parti uguali + poco lievito), matura 8-16 h; dà aroma e sofficità.",
    de: "Poolish: flüssiger Vorteig (Mehl und Wasser zu gleichen Teilen + wenig Hefe), reift 8-16 h; gibt Aroma und Lockerheit.",
    en: "Poolish: a liquid preferment (equal parts flour and water + a little yeast), ripens 8-16 h; adds aroma and softness.",
    match: ["poolish"],
  },
  stockgare: {
    it: "Stockgare (puntata): prima lievitazione in massa dopo l'impasto, spesso con pieghe.",
    de: "Stockgare: erste Teigruhe in der Masse nach dem Kneten, oft mit Dehnen und Falten.",
    en: "Stockgare (bulk proof): the first bulk fermentation after mixing, often with folds.",
    match: ["stockgare"],
  },
  quellstuck: {
    it: "Quellstück: semi/cereali messi in ammollo (spesso la sera prima) così assorbono acqua e non rubano umidità all'impasto.",
    de: "Quellstück: Saaten/Körner werden eingeweicht (oft am Vorabend), damit sie Wasser aufnehmen und dem Teig keine Feuchtigkeit entziehen.",
    en: "Quellstück: seeds/grains soaked (often the night before) so they absorb water and don't steal moisture from the dough.",
    match: ["quellstück", "quellstuck"],
  },
  sauerteig: {
    it: "Sauerteig: lievito naturale (pasta acida). Il Weizensauerteig è di frumento, il Roggensauerteig di segale.",
    de: "Sauerteig: natürliches Triebmittel. Weizensauerteig aus Weizen, Roggensauerteig aus Roggen.",
    en: "Sauerteig: natural sourdough. Weizensauerteig is wheat-based, Roggensauerteig is rye-based.",
    match: ["sauerteig", "weizensauerteig", "roggensauerteig"],
  },
  incordare: {
    it: "Incordare: impastare fino a che l'impasto diventa liscio, elastico e si stacca dalle pareti (glutine ben sviluppato).",
    de: "Auskneten (incordare): kneten, bis der Teig glatt, elastisch ist und sich von der Schüssel löst (Gluten gut entwickelt).",
    en: "Full development (incordare): knead until the dough is smooth, elastic and pulls away from the bowl (gluten fully developed).",
    match: ["incorda", "incordat"],
  },
  appretto: {
    it: "Appretto: seconda lievitazione dopo la formatura, prima della cottura.",
    de: "Stückgare (appretto): zweite Gare nach dem Formen, vor dem Backen.",
    en: "Final proof (appretto): the second proof after shaping, before baking.",
    match: ["appretto"],
  },
  ta: {
    it: "TA (Teigausbeute): resa dell'impasto = (farina+acqua)/farina ×100. Es. TA 182 ≈ 82% di idratazione.",
    de: "TA (Teigausbeute): (Mehl+Wasser)/Mehl ×100. Z. B. TA 182 ≈ 82% Hydratation.",
    en: "TA (Teigausbeute / dough yield): (flour+water)/flour ×100. E.g. TA 182 ≈ 82% hydration.",
    match: ["teigausbeute", "ta ~", "ta182", "ta 18"],
  },
};

function GlossaryBox({ text }) {
  const { t, lang } = useLang();
  const low = (text || "").toLowerCase();
  const found = Object.values(GLOSSARY).filter((g) => g.match.some((m) => low.includes(m)));
  if (found.length === 0) return null;
  return (
    <div data-testid="recipe-glossary" className="rounded-xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] dark:text-[#8FB0C2] mb-1.5">{t("gloss_title")} *</p>
      <ul className="space-y-1.5">
        {found.map((g, i) => (
          <li key={i} className="text-xs text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed">* {lang === "de" ? g.de : lang === "en" ? g.en : lang === "es" ? (g.es ?? g.en ?? g.it) : g.it}</li>
        ))}
      </ul>
    </div>
  );
}


// ——— Struttura tecnica obbligatoria dei Panettoni (Direttiva v7.8) ———
const PAN_MY = {
  it: [
    { s: "Bagnetto", d: "15 min in acqua a 28°C — pH 3,9" },
    { s: "1° Rinfresco", d: "1:1:0,5 a 28°C — pH 3,9" },
    { s: "2° Rinfresco", d: "28°C per 3,5–4 h — pH 4,1–4,3" },
    { s: "Legato in sacco", d: "16°C per 16–18 h" },
  ],
  de: [
    { s: "Bagnetto (Bad)", d: "15 Min. in Wasser bei 28°C — pH 3,9" },
    { s: "1. Auffrischung", d: "1:1:0,5 bei 28°C — pH 3,9" },
    { s: "2. Auffrischung", d: "28°C für 3,5–4 h — pH 4,1–4,3" },
    { s: "Gebunden im Sack", d: "16°C für 16–18 h" },
  ],
  en: [
    { s: "Bath (bagnetto)", d: "15 min in water at 28°C — pH 3.9" },
    { s: "1st refresh", d: "1:1:0.5 at 28°C — pH 3.9" },
    { s: "2nd refresh", d: "28°C for 3.5–4 h — pH 4.1–4.3" },
    { s: "Bound in cloth", d: "16°C for 16–18 h" },
  ],
};

const PAN_GLAZE = [
  ["Zucchero", "Zucker", "Sugar", 54.55],
  ["Mandorle grezze", "Rohe Mandeln", "Raw almonds", 18.18],
  ["Albumi", "Eiweiß", "Egg whites", 18.18],
  ["Nocciole", "Haselnüsse", "Hazelnuts", 3.64],
  ["Armelline", "Bittermandeln (Aprikosenkerne)", "Apricot kernels", 1.82],
  ["Farina MP", "Mehl", "Wheat flour", 1.82],
  ["Farina Fioretto", "Maismehl (fein)", "Fine corn flour", 0.91],
  ["Fecola", "Kartoffelstärke", "Potato starch", 0.91],
];

function PanettoneStructure({ r, t, lang, flourG, farro, scaleVal, onScaleChange }) {
  const de = lang === "de";
  const tri = (i_, d_, e_) => mkTri(lang)(i_, d_, e_);
  const [glazeTot, setGlazeTot] = useState(150);
  const targetVal = flourG > 0 ? (Number(scaleVal) || flourG) : 0;
  const fct = flourG > 0 ? targetVal / flourG : 1;
  const G = (v) => (v == null ? 0 : Math.round(Number(v) * fct));
  const flourTot = G(r.flour_grams);
  const items = [];
  items.push({ name: t("ing_flour"), tot: flourTot, first: 0.5 });
  const waterBase = G(r.water_grams);
  items.push({ name: t("ing_water"), tot: farro ? Math.round(waterBase * 0.96) : waterBase, first: 1 });
  if (r.sourdough_grams) items.push({ name: t("ing_preferment"), tot: G(r.sourdough_grams), first: 1 });
  (r.extra_ingredients || []).forEach((e) => {
    if (!e || !e.name || e.percent == null || e.percent === "") return;
    const tot = flourG > 0 ? Math.round(targetVal * (Number(e.percent) / 100)) : 0;
    const key = String(e.name).toLowerCase();
    let first = 0;
    if (key.includes("zuccher") || key.includes("zucker")) first = 0.45;
    else if (key.includes("tuorl") || key.includes("eigelb")) first = 0.31;
    else if (key.includes("burro") || key.includes("butter")) first = 0.42;
    items.push({ name: e[`name_${lang}`] || ingLoc(e.name, lang), tot, first });
  });
  if (r.salt_grams) items.push({ name: t("ing_salt"), tot: G(r.salt_grams), first: 0 });
  const pctOf = (v) => (flourTot > 0 ? `${Math.round((v / flourTot) * 1000) / 10}%` : "—");

  return (
    <div data-testid={`panettone-structure-${r.id}`} className="space-y-4">
      {flourG > 0 && (
        <div className="flex items-center justify-end gap-1">
          <span className="text-[10px] text-[#7E8A93]">{t("recipe_scale")}</span>
          <input data-testid={`recipe-scale-${r.id}`} type="number" value={scaleVal ?? flourG}
            onChange={(e) => onScaleChange(e.target.value)}
            className="w-20 text-right font-mono-data text-xs font-bold text-[#ff6b00] dark:text-[#8FB0C2] bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-md px-1.5 py-1 outline-none" />
          <span className="text-[10px] text-[#7E8A93]">g</span>
        </div>
      )}

      <div className="rounded-xl bg-[#ff6b00]/8 border border-[#ff6b00]/25 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] mb-2">🌾 {tri("Gestione Lievito Madre (pH)", "Führung Lievito Madre (pH)", "Sourdough management (pH)")}</p>
        <div className="space-y-1">
          {PAN_MY[de ? "de" : lang === "en" ? "en" : "it"].map((m, i) => (
            <div key={i} className="flex items-start justify-between gap-2 text-sm">
              <span className="font-medium text-[#3F4A54] dark:text-[#AEB8BF] shrink-0">{m.s}</span>
              <span className="text-right text-[#7E8A93]">{m.d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-[#e4eff8] dark:bg-[#1e1e1e] p-3 overflow-x-auto">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] mb-2">{tri("Ingredienti: 1° e 2° Impasto · Totale", "Zutaten: 1./2. Teig · Gesamt", "Ingredients: 1st/2nd dough · Total")}</p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[10px] uppercase text-[#7E8A93]">
              <th className="text-left font-semibold pb-1">{tri("Ingrediente", "Zutat", "Ingredient")}</th>
              <th className="text-right font-semibold pb-1 pl-4">1°</th>
              <th className="text-right font-semibold pb-1 pl-4">2°</th>
              <th className="text-right font-semibold pb-1 pl-4">{tri("Tot.", "Ges.", "Tot.")}</th>
              <th className="text-right font-semibold pb-1 pl-4">%</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const first = Math.round(it.tot * it.first);
              const second = it.tot - first;
              return (
                <tr key={i} className="border-t border-[#2e2e2e]/60 dark:border-[#2e2e2e]">
                  <td className="py-1 text-[#3F4A54] dark:text-[#AEB8BF] pr-2">{it.name}</td>
                  <td className="py-1 text-right font-mono-data text-[#7E8A93] pl-4 whitespace-nowrap">{first > 0 ? first : "—"}</td>
                  <td className="py-1 text-right font-mono-data text-[#7E8A93] pl-4 whitespace-nowrap">{second > 0 ? second : "—"}</td>
                  <td className="py-1 text-right font-mono-data font-semibold text-[#ff6b00] dark:text-[#8FB0C2] pl-4 whitespace-nowrap">{it.tot}</td>
                  <td className="py-1 text-right font-mono-data text-[#7E8A93] pl-4 whitespace-nowrap">{pctOf(it.tot)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[10px] text-[#7E8A93] mt-2">{tri("g · % sul peso della farina totale. Sospensioni sempre a fine impasto, a bassa velocità.", "g · % auf das Gesamtmehl. Suspensionen immer am Ende, langsam einarbeiten.", "g · % of total flour. Add suspensions at the very end, at low speed.")}</p>
      </div>

      <div className="rounded-xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#ff6b00] dark:text-[#8FB0C2]">{tri("Modulo Glassa (automatico)", "Glasur-Modul (automatisch)", "Glaze module (automatic)")}</p>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#7E8A93]">{tri("Totale", "Gesamt", "Total")}</span>
            <input data-testid={`glaze-total-${r.id}`} type="number" value={glazeTot}
              onChange={(e) => setGlazeTot(e.target.value)}
              className="w-16 text-right font-mono-data text-xs font-bold text-[#ff6b00] dark:text-[#8FB0C2] bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-md px-1.5 py-1 outline-none" />
            <span className="text-[10px] text-[#7E8A93]">g</span>
          </div>
        </div>
        <div className="space-y-1">
          {PAN_GLAZE.map(([itn, den, enn, p], i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{de ? den : lang === "en" ? enn : itn}</span>
              <span className="font-mono-data text-[#ff6b00] dark:text-[#8FB0C2]">{Math.round((Number(glazeTot) || 0) * p / 100)} g · {p}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
