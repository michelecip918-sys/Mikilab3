import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/i18n/LanguageContext";
import CoursePlayer from "@/components/CoursePlayer";
import { mkTri } from "@/i18n/triMaps";
import { api, siteSettingsApi } from "@/lib/api";
import { toast } from "sonner";
import { Home, ChefHat, Lightbulb, Wrench, AlertTriangle, ShieldAlert, Beaker, Save, Check, Music2, Copy } from "lucide-react";

const MODE_KEY = "mikilab_recipe_mode"; // "casa" | "esperto"
const DONE_KEY = "mikilab_done";
const SKILL_KEY = "mikilab_skill";

const DIFF = {
  facile: { it: "Facile", de: "Einfach", en: "Easy", c: "hsl(var(--accent))" },
  media: { it: "Media", de: "Mittel", en: "Medium", c: "hsl(var(--muted-foreground))" },
  sfida: { it: "Sfida", de: "Herausforderung", en: "Challenge", c: "hsl(var(--mattone))" },
};
const ALLERGEN_LABEL = {
  glutine: ["Glutine", "Gluten", "Gluten"], uova: ["Uova", "Eier", "Eggs"], latte: ["Latte", "Milch", "Milk"],
  frutta_a_guscio: ["Frutta a guscio", "Schalenfrüchte", "Tree nuts"], sesamo: ["Sesamo", "Sesam", "Sesame"],
  soia: ["Soia", "Soja", "Soy"], lupino: ["Lupino", "Lupine", "Lupin"], arachidi: ["Arachidi", "Erdnüsse", "Peanuts"],
};

function round(x) { return x >= 100 ? Math.round(x) : Math.round(x * 10) / 10; }

export default function RecipeExtrasPanel({ recipe, isAdmin = false }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const li = (arr) => (lang === "de" ? arr[1] : lang === "en" ? arr[2] : arr[0]);
  const [ex, setEx] = useState(null);
  const [mode, setMode] = useState(() => {
    try {
      const m = localStorage.getItem(MODE_KEY);
      if (m) return m;
      return localStorage.getItem(SKILL_KEY) === "expert" ? "esperto" : "casa";
    } catch { return "casa"; }
  });
  const [flour, setFlour] = useState(500);
  const [saving, setSaving] = useState(false);
  const [showCourse, setShowCourse] = useState(false);
  const [settings, setSettings] = useState({});
  const [done, setDone] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) || "[]")).has(recipe.id); } catch { return false; } });
  useEffect(() => { siteSettingsApi.get().then(setSettings).catch(() => {}); }, []);
  const toggleDone = () => {
    let s; try { s = new Set(JSON.parse(localStorage.getItem(DONE_KEY) || "[]")); } catch { s = new Set(); }
    s.has(recipe.id) ? s.delete(recipe.id) : s.add(recipe.id);
    localStorage.setItem(DONE_KEY, JSON.stringify([...s]));
    setDone(s.has(recipe.id));
    window.dispatchEvent(new CustomEvent("mikilab-done-changed"));
  };
  const handle = (settings.tiktok_handle || "").trim();
  const hashtag = settings.hashtag || "#MikiLab";
  const copyHashtag = async () => { try { await navigator.clipboard.writeText(hashtag); toast.success(tri("Hashtag copiato", "Hashtag kopiert", "Hashtag copied")); } catch { /* */ } };

  useEffect(() => {
    let stop = false;
    setEx(null);
    api.get(`/recipe-extras/${recipe.id}`).then((r) => { if (!stop) setEx(r.data); }).catch(() => { /* */ });
    return () => { stop = true; };
  }, [recipe.id]);

  const setModePref = (m) => { setMode(m); try { localStorage.setItem(MODE_KEY, m); } catch { /* */ } };

  // Dosi CASA calcolate dal peso farina della ricetta.
  const doses = useMemo(() => {
    const fg = Number(recipe.flour_grams) || 0;
    const factor = fg > 0 ? flour / fg : (flour / 1000);
    const rows = [];
    rows.push([tri("Farina", "Mehl", "Flour"), flour]);
    if (recipe.water_grams) rows.push([tri("Acqua", "Wasser", "Water"), (Number(recipe.water_grams) || 0) * factor]);
    else if (recipe.hydration_percent) rows.push([tri("Acqua", "Wasser", "Water"), flour * (Number(recipe.hydration_percent) / 100)]);
    if (recipe.sourdough_grams) rows.push([tri("Lievito madre", "Lievito madre", "Sourdough"), (Number(recipe.sourdough_grams) || 0) * factor]);
    if (recipe.salt_grams) rows.push([tri("Sale", "Salz", "Salt"), (Number(recipe.salt_grams) || 0) * factor]);
    (recipe.extra_ingredients || []).forEach((it2) => {
      if (it2 && it2.name && it2.percent) rows.push([it2.name, flour * (Number(it2.percent) / 100)]);
    });
    return rows.map(([n, g]) => [n, round(g)]);
  }, [recipe, flour, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // ESPERTO: percentuali del panificatore (base = farina della ricetta) + grammi per la farina scelta.
  const bakerRows = useMemo(() => {
    const fg = Number(recipe.flour_grams) || 0;
    const pct = (grams) => (fg > 0 && grams ? Math.round((Number(grams) / fg) * 1000) / 10 : null);
    const rows = [[tri("Farina", "Mehl", "Flour"), fg > 0 ? 100 : null, flour]];
    if (recipe.water_grams) rows.push([tri("Acqua", "Wasser", "Water"), pct(recipe.water_grams), (Number(recipe.water_grams) || 0) / (fg || 1) * flour]);
    if (recipe.sourdough_grams) rows.push([tri("Lievito madre", "Lievito madre", "Sourdough"), pct(recipe.sourdough_grams), (Number(recipe.sourdough_grams) || 0) / (fg || 1) * flour]);
    if (recipe.salt_grams) rows.push([tri("Sale", "Salz", "Salt"), pct(recipe.salt_grams), (Number(recipe.salt_grams) || 0) / (fg || 1) * flour]);
    (recipe.extra_ingredients || []).forEach((it2) => {
      if (it2 && it2.name && it2.percent) rows.push([it2.name, Number(it2.percent), flour * (Number(it2.percent) / 100)]);
    });
    return rows;
  }, [recipe, flour, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveAdmin = async (patch) => {
    setSaving(true);
    try { const r = await api.put(`/recipe-extras/${recipe.id}`, patch); setEx(r.data); toast.success(tri("Salvato", "Gespeichert", "Saved")); }
    catch { toast.error(tri("Errore nel salvataggio", "Fehler beim Speichern", "Save failed")); }
    finally { setSaving(false); }
  };

  if (!ex) return null;
  const dcfg = DIFF[ex.difficulty] || DIFF.facile;
  const tip = ex.michele_tip || {};
  const tipText = li([tip.it, tip.de, tip.en]) || tip.it || tip.de || tip.en || "";

  return (
    <div data-testid={`recipe-extras-${recipe.id}`} className="space-y-4 no-print">
      {showCourse && <CoursePlayer recipe={recipe} onClose={() => setShowCourse(false)} />}
      {/* CUCINA CON SITOR */}
      <button data-testid="cook-with-sitor" onClick={() => setShowCourse(true)}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-muted hover:bg-muted text-foreground font-bold text-[16px] active:scale-[0.98] transition-all shadow-lg">
        <ChefHat className="w-5 h-5" /> {tri("Cucina con Sitor", "Koch mit Sitor", "Cook with Sitor")}
      </button>
      <button data-testid="mark-done" onClick={toggleDone}
        className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all border ${done ? "bg-accent border-accent text-white" : "bg-transparent border-border text-foreground hover:border-accent"}`}>
        <Check className="w-4 h-4" /> {done ? tri("Fatta ✓ (togli)", "Gemacht ✓ (entfernen)", "Done ✓ (undo)") : tri("Segna come fatta", "Als gemacht markieren", "Mark as done")}
      </button>

      {/* CASA / ESPERTO + difficoltà */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div data-testid="recipe-mode-toggle" className="inline-flex rounded-xl border border-border overflow-hidden">
          <button data-testid="recipe-mode-casa" onClick={() => setModePref("casa")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all ${mode === "casa" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Home className="w-3.5 h-3.5" /> {tri("Casa", "Zu Hause", "Home")}
          </button>
          <button data-testid="recipe-mode-esperto" onClick={() => setModePref("esperto")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all ${mode === "esperto" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <ChefHat className="w-3.5 h-3.5" /> {tri("Esperto", "Experte", "Expert")}
          </button>
        </div>
        <span data-testid="recipe-difficulty" className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border" style={{ color: dcfg.c, borderColor: `${dcfg.c}66`, background: `${dcfg.c}18` }}>
          {li([dcfg.it, dcfg.de, dcfg.en])}
        </span>
      </div>

      {/* IL TRUCCO DI MICHELE */}
      {tipText && (
        <div data-testid="michele-tip" className="rounded-2xl border border-primary/40 bg-primary/10 p-3.5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-primary mb-1"><Lightbulb className="w-3.5 h-3.5" /> {tri("Il trucco di Michele", "Micheles Trick", "Michele's trick")}</p>
          <p className="text-sm text-foreground">{tipText}</p>
        </div>
      )}

      {/* CASA: dosi per la tua farina */}
      {mode === "casa" && (
        <div data-testid="casa-doses" className="rounded-2xl border border-border bg-background p-3.5">
          <p className="text-[11px] font-black uppercase tracking-wide text-primary mb-2">{tri("Le tue dosi (per la farina scelta)", "Deine Mengen (für die gewählte Mehlmenge)", "Your doses (for the chosen flour)")}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[250, 500, 1000].map((f) => (
              <button key={f} data-testid={`casa-flour-${f}`} onClick={() => setFlour(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${flour === f ? "bg-primary text-white border-primary" : "text-muted-foreground border-border hover:text-foreground"}`}>{f} g</button>
            ))}
            <input data-testid="casa-flour-free" type="number" min="50" step="50" value={flour}
              onChange={(e) => setFlour(Math.max(1, Number(e.target.value) || 0))}
              className="w-24 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-background border border-border text-foreground outline-none focus:border-primary" />
          </div>
          <table className="w-full text-sm">
            <tbody>
              {doses.map(([n, g], i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 text-foreground">{n}</td>
                  <td className="py-1.5 text-right font-bold text-foreground">{g} g</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-muted-foreground mt-2">{tri("Dosi indicative ricalcolate dalla ricetta originale.", "Ungefähre Mengen, aus dem Originalrezept umgerechnet.", "Approximate doses recalculated from the original recipe.")}</p>
        </div>
      )}

      {/* ESPERTO: percentuali del panificatore, idratazione calcolata, scaling a qualsiasi peso */}
      {mode === "esperto" && (
        <div data-testid="esperto-note" className="rounded-2xl border border-border bg-background p-3.5">
          <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-2">{tri("Percentuali del panificatore", "Bäckerprozente", "Baker's percentages")}</p>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">{tri("Farina di riferimento", "Referenzmehl", "Reference flour")}:</span>
            <input data-testid="esperto-flour" type="number" min="1" step="100" value={flour}
              onChange={(e) => setFlour(Math.max(1, Number(e.target.value) || 0))}
              className="w-28 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-background border border-border text-foreground outline-none focus:border-border" />
            <span className="text-xs text-muted-foreground">g</span>
            <span data-testid="esperto-hydration" className="ml-auto text-xs font-bold text-foreground">
              {tri("Idratazione", "Hydration", "Hydration")}: {ex.calc_hydration != null ? `${ex.calc_hydration}%` : "—"}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] uppercase text-muted-foreground"><th className="text-left font-bold py-1">{tri("Ingrediente", "Zutat", "Ingredient")}</th><th className="text-right font-bold py-1">%</th><th className="text-right font-bold py-1">g</th></tr></thead>
            <tbody>
              {bakerRows.map(([n, pct, g], i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 text-foreground">{n}</td>
                  <td className="py-1.5 text-right text-muted-foreground font-semibold">{pct == null ? "—" : `${pct}%`}</td>
                  <td className="py-1.5 text-right font-bold text-foreground">{round(g)} g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CONTROLLO LIEVITO MADRE / LICOLI (solo in CASA) */}
      {mode === "casa" && ex.leaven_kind === "lm" && (
        <div data-testid="control-lm" className="rounded-2xl border border-primary/40 bg-primary/8 p-3.5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-primary mb-2"><Beaker className="w-3.5 h-3.5" /> {tri("Controllo del lievito madre", "Kontrolle des Sauerteigs (Lievito Madre)", "Sourdough (Lievito Madre) check")}</p>
          <ol className="text-[13px] text-foreground space-y-1.5 list-decimal pl-4">
            {[
              ["Metti il lievito in un barattolo di vetro dritto e trasparente, segna il livello con un elastico e annota l'ora.", "Gib den Sauerteig in ein gerades, durchsichtiges Glas, markiere den Stand mit einem Gummiband und notiere die Uhrzeit.", "Put the starter in a straight clear glass jar, mark the level with a rubber band and note the time."],
              ["È pronto quando è raddoppiato (per il panettone: al volume indicato dalla ricetta) con la superficie bombata a cupola.", "Fertig, wenn er sich verdoppelt hat (beim Panettone: auf das im Rezept angegebene Volumen) mit gewölbter Kuppel.", "Ready when doubled (for panettone: to the volume in the recipe) with a domed top."],
              ["Segni buoni: bolle visibili contro il vetro, profumo di yogurt o latte dolce.", "Gute Zeichen: sichtbare Blasen am Glas, Duft nach Joghurt oder süßer Milch.", "Good signs: bubbles against the glass, smell of yogurt or sweet milk."],
              ["Cupola afflosciata e odore pungente (aceto, solvente) = «passato»: rinfrescalo di nuovo prima di usarlo.", "Eingefallene Kuppel und stechender Geruch (Essig, Lösungsmittel) = «über den Punkt»: vor Gebrauch erneut auffrischen.", "Collapsed dome and sharp smell (vinegar, solvent) = «over-proofed»: refresh again before use."],
              ["Da buttare: muffa a peluria, strisce rosa o arancioni.", "Wegwerfen: pelziger Schimmel, rosa oder orange Streifen.", "Discard: fuzzy mould, pink or orange streaks."],
              ["Tienilo intorno ai 28 °C (es. forno spento con la luce accesa; controlla con un termometro).", "Halte ihn bei etwa 28 °C (z. B. ausgeschalteter Ofen mit Licht; mit Thermometer prüfen).", "Keep it around 28 °C (e.g. oven off with light on; check with a thermometer)."],
              ["Annota quante ore ci mette a raddoppiare: se a ogni rinfresco ci mette meno, si sta rinforzando.", "Notiere, wie lange er zum Verdoppeln braucht: wird es bei jeder Auffrischung kürzer, wird er stärker.", "Note how many hours it takes to double: if it gets faster each refresh, it's getting stronger."],
            ].map((s, i) => <li key={i}>{li(s)}</li>)}
          </ol>
          <p className="text-[12px] text-muted-foreground mt-2">{tri("Prima di un panettone il lievito deve essere già stabile (rinfrescato con regolarità per settimane). Chi non ce l'ha può chiedere un pezzetto a un panificio o usare lievito madre secco da riattivare (circa una settimana).", "Vor einem Panettone muss der Sauerteig stabil sein (wochenlang regelmäßig aufgefrischt). Wer keinen hat, kann in einer Bäckerei ein Stück erbitten oder Trockensauerteig reaktivieren (ca. eine Woche).", "Before a panettone the starter must be stable (regularly refreshed for weeks). If you don't have one, ask a bakery for a piece or reactivate dried sourdough (about a week).")}</p>
        </div>
      )}
      {mode === "casa" && ex.leaven_kind === "licoli" && (
        <div data-testid="control-licoli" className="rounded-2xl border border-primary/40 bg-primary/8 p-3.5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-primary mb-2"><Beaker className="w-3.5 h-3.5" /> {tri("Controllo del licoli", "Kontrolle des LiCoLi", "LiCoLi check")}</p>
          <ol className="text-[13px] text-foreground space-y-1.5 list-decimal pl-4">
            {[
              ["Rinfresco 1:1:1 (es. 50 g licoli + 50 g farina + 50 g acqua a 24 °C), mescola fino a pastella liscia.", "Auffrischung 1:1:1 (z. B. 50 g LiCoLi + 50 g Mehl + 50 g Wasser bei 24 °C), zu glattem Teig rühren.", "Refresh 1:1:1 (e.g. 50 g licoli + 50 g flour + 50 g water at 24 °C), stir to a smooth batter."],
              ["Lascialo a 26-28 °C per 3-4 ore in un barattolo di vetro trasparente, con un elastico sul livello di partenza.", "Bei 26-28 °C für 3-4 Stunden im durchsichtigen Glas, mit Gummiband am Startniveau.", "Leave at 26-28 °C for 3-4 hours in a clear glass jar, with a rubber band at the starting level."],
              ["È al picco quando è raddoppiato e ha bolle in superficie: usalo in quel momento.", "Am Höhepunkt, wenn verdoppelt und mit Blasen an der Oberfläche: dann verwenden.", "At its peak when doubled with surface bubbles: use it then."],
              ["Profumo buono: lattico, di yogurt. Se è pungente (aceto, solvente) rinfrescalo di nuovo.", "Guter Duft: milchig, nach Joghurt. Wenn stechend (Essig, Lösungsmittel), erneut auffrischen.", "Good smell: milky, yogurt-like. If sharp (vinegar, solvent), refresh again."],
              ["Uno strato di liquido sopra non è muffa: mescola. Da buttare: muffa a peluria, strisce rosa o arancioni.", "Eine Flüssigkeitsschicht oben ist kein Schimmel: umrühren. Wegwerfen: pelziger Schimmel, rosa/orange Streifen.", "A liquid layer on top is not mould: stir. Discard: fuzzy mould, pink/orange streaks."],
              ["Tra un rinfresco e l'altro tienilo in frigo a 4 °C.", "Zwischen den Auffrischungen im Kühlschrank bei 4 °C lagern.", "Between refreshes keep it in the fridge at 4 °C."],
              ["Il licoli è al 100% di idratazione: quando lo usi al posto del lievito solido, scomputa dall'acqua della ricetta la metà del suo peso.", "LiCoLi hat 100% Hydration: ersetzt du festen Sauerteig, ziehe die Hälfte seines Gewichts vom Rezeptwasser ab.", "LiCoLi is at 100% hydration: when replacing stiff starter, subtract half its weight from the recipe water."],
            ].map((s, i) => <li key={i}>{li(s)}</li>)}
          </ol>
        </div>
      )}

      {/* L'HAI FATTA? — TikTok (solo se handle impostato) */}
      {handle && (
        <div data-testid="tiktok-box" className="rounded-2xl border border-border bg-background p-3.5">
          <p className="text-sm text-foreground mb-2">{tri(`L'hai fatta? Mostrami com'è venuta su TikTok con ${hashtag} e taggami @${handle}`, `Gemacht? Zeig's mir auf TikTok mit ${hashtag} und markiere @${handle}`, `Made it? Show me on TikTok with ${hashtag} and tag @${handle}`)}</p>
          <div className="flex flex-wrap gap-2">
            <button data-testid="tiktok-copy-hashtag" onClick={copyHashtag} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-foreground/10 text-foreground text-sm font-bold active:scale-95"><Copy className="w-4 h-4" />{tri("Copia hashtag", "Hashtag kopieren", "Copy hashtag")}</button>
            <a data-testid="tiktok-open" href={`https://www.tiktok.com/@${handle}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-background text-foreground text-sm font-bold active:scale-95"><Music2 className="w-4 h-4" />{tri("Apri TikTok", "TikTok öffnen", "Open TikTok")}</a>
          </div>
        </div>
      )}

      {/* COSA TI SERVE */}
      {ex.equipment && ex.equipment.length > 0 && (
        <div data-testid="recipe-equipment" className="rounded-2xl border border-border bg-background p-3.5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-2">
            <Wrench className="w-3.5 h-3.5" /> {tri("Cosa ti serve", "Was du brauchst", "What you need")}
            {ex.equipment_draft && <span className="text-[9px] font-bold text-muted-foreground normal-case">· {tri("bozza", "Entwurf", "draft")}</span>}
          </p>
          <ul className="space-y-1.5">
            {ex.equipment.map((it2, i) => (
              <li key={i} className="text-[13px] text-foreground flex flex-col">
                <span className="font-semibold text-foreground">{li([it2.it, it2.de, it2.en])}{it2.optional ? ` · ${tri("facoltativo", "optional", "optional")}` : ""}</span>
                {it2.buy && <span className="text-[11px] text-muted-foreground">{tri("Dove:", "Wo:", "Where:")} {li([it2.buy.it, it2.buy.de, it2.buy.en])}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ALLERGENI */}
      {ex.allergens && ex.allergens.length > 0 && (
        <div data-testid="recipe-allergens" className="rounded-2xl border border-border bg-background p-3.5">
          <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-2">{tri("Allergeni", "Allergene", "Allergens")}</p>
          <div className="flex flex-wrap gap-1.5">
            {ex.allergens.map((a) => (
              <span key={a} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted/12 border border-border/30 text-foreground">{li(ALLERGEN_LABEL[a] || [a, a, a])}</span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">{tri("Controlla sempre le etichette dei tuoi prodotti.", "Prüfe immer die Etiketten deiner Produkte.", "Always check the labels of your products.")}</p>
        </div>
      )}

      {/* AVVISI DI SICUREZZA */}
      {ex.safety && ex.safety.length > 0 && (
        <div data-testid="recipe-safety" className="rounded-2xl border border-mattone/40 bg-mattone/10 p-3.5 space-y-1.5">
          {ex.safety.includes("lye") && (
            <p className="flex items-start gap-2 text-[13px] text-foreground"><ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-mattone" />
              {tri("La liscivia è caustica: guanti e occhiali, lontano dai bambini. Alternativa più sicura: bicarbonato cotto in forno.", "Lauge ist ätzend: Handschuhe und Schutzbrille, von Kindern fernhalten. Sicherere Alternative: im Ofen gebackenes Natron.", "Lye is caustic: gloves and goggles, keep away from children. Safer alternative: baked baking soda.")}</p>
          )}
          {ex.safety.includes("oven") && (
            <p className="flex items-start gap-2 text-[13px] text-foreground"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-mattone" />
              {tri("Forno e vapore scottano.", "Ofen und Dampf verbrennen.", "Oven and steam can burn.")}</p>
          )}
          {ex.safety.includes("hot_high_temp") && (
            <p data-testid="safety-hot-temp" className="flex items-start gap-2 text-[13px] text-foreground"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-mattone" />
              {tri("Questa ricetta prevede una temperatura oltre 300 °C: nel forno di casa (massimo circa 250 °C) il risultato sarà diverso.", "Dieses Rezept sieht über 300 °C vor: im Hausofen (max. ca. 250 °C) fällt das Ergebnis anders aus.", "This recipe calls for over 300 °C: in a home oven (about 250 °C max) the result will differ.")}</p>
          )}
          {ex.safety.includes("frying") && (
            <p data-testid="safety-frying" className="flex items-start gap-2 text-[13px] text-foreground"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-mattone" />
              {tri("Frittura: usa una pentola alta riempita al massimo a metà, controlla l'olio con un termometro, mai acqua nell'olio, non lasciare mai la pentola incustodita, tieni lontani i bambini.", "Frittieren: hoher Topf, höchstens halb gefüllt, Öl mit Thermometer prüfen, nie Wasser ins Öl, den Topf nie unbeaufsichtigt lassen, Kinder fernhalten.", "Frying: use a tall pot filled at most halfway, check the oil with a thermometer, never water in oil, never leave the pot unattended, keep children away.")}</p>
          )}
        </div>
      )}

      {/* ADMIN */}
      {isAdmin && (
        <div data-testid="recipe-extras-admin" className="rounded-2xl border border-primary/30 bg-background p-3.5 space-y-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-primary">{tri("Admin · extra ricetta", "Admin · Rezept-Extras", "Admin · recipe extras")}</p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">{tri("Difficoltà", "Schwierigkeit", "Difficulty")}</label>
            <select data-testid="admin-difficulty" value={ex.difficulty} onChange={(e) => saveAdmin({ difficulty: e.target.value })} disabled={saving}
              className="bg-background border border-border rounded-lg text-xs text-foreground px-2 py-1.5 outline-none">
              <option value="facile">{tri("Facile", "Einfach", "Easy")}</option>
              <option value="media">{tri("Media", "Mittel", "Medium")}</option>
              <option value="sfida">{tri("Sfida", "Herausforderung", "Challenge")}</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-foreground">
            {[["real_photo", tri("Foto reale", "Echtes Foto", "Real photo")], ["verified", tri("Verificata", "Geprüft", "Verified")], ["hidden_public", tri("Nascondi al pubblico", "Öffentlich verbergen", "Hide from public")]].map(([k, lbl]) => (
              <label key={k} className="inline-flex items-center gap-1.5"><input type="checkbox" data-testid={`admin-${k}`} checked={!!ex[k]} onChange={(e) => saveAdmin({ [k]: e.target.checked })} disabled={saving} />{lbl}</label>
            ))}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{tri("Il trucco di Michele (IT / DE / EN)", "Micheles Trick (IT / DE / EN)", "Michele's trick (IT / DE / EN)")}</p>
            {["it", "de", "en"].map((lc) => (
              <input key={lc} data-testid={`admin-tip-${lc}`} defaultValue={(ex.michele_tip || {})[lc] || ""}
                onBlur={(e) => { const v = e.target.value.trim(); const cur = ex.michele_tip || {}; if (v !== (cur[lc] || "")) saveAdmin({ michele_tip: { ...cur, [lc]: v } }); }}
                placeholder={lc.toUpperCase()} className="w-full mb-1.5 bg-background border border-border rounded-lg text-xs text-foreground px-2.5 py-1.5 outline-none focus:border-primary" />
            ))}
            <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Save className="w-3 h-3" /> {tri("Salva automaticamente quando esci dal campo.", "Speichert automatisch beim Verlassen des Feldes.", "Auto-saves when you leave the field.")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
