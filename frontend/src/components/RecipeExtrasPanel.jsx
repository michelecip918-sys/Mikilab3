import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/i18n/LanguageContext";
import CalendarReminder from "@/components/CalendarReminder";
import MixPanel from "@/components/MixPanel";
import EspertoPro from "@/components/EspertoPro";
import RecipeShareActions from "@/components/RecipeShareActions";
import { mkTri } from "@/i18n/triMaps";
import { api, siteSettingsApi } from "@/lib/api";
import { toast } from "sonner";
import BroselBox from "@/components/BroselBox"; // V121
import { Home, ChefHat, Lightbulb, Wrench, AlertTriangle, ShieldAlert, Beaker, Save, Check, Music2, Copy, CalendarClock } from "lucide-react";

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

export default function RecipeExtrasPanel({ recipe, isAdmin = false, scaleG = 0 }) {
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
  const flour = Number(scaleG) || Number(recipe.flour_grams) || 500; // stessa farina scelta nella scheda ricetta
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [done, setDone] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) || "[]")).has(recipe.id); } catch { return false; } });
  useEffect(() => { siteSettingsApi.get().then(setSettings).catch(() => {}); }, []);
  const [doneCount, setDoneCount] = useState(0);
  const [ktemp, setKtempState] = useState(() => { try { return Number(localStorage.getItem("mikilab_kitchen_temp")) || 22; } catch { return 22; } });
  const setKtemp = (t) => { setKtempState(t); try { localStorage.setItem("mikilab_kitchen_temp", String(t)); } catch { /* */ } };
  const round = (n) => Math.round(Number(n) || 0);
  const toggleDone = () => {
    let s; try { s = new Set(JSON.parse(localStorage.getItem(DONE_KEY) || "[]")); } catch { s = new Set(); }
    const wasDone = s.has(recipe.id);
    wasDone ? s.delete(recipe.id) : s.add(recipe.id);
    localStorage.setItem(DONE_KEY, JSON.stringify([...s]));
    setDone(s.has(recipe.id));
    window.dispatchEvent(new CustomEvent("mikilab-done-changed"));
    if (!wasDone) {  // G6: conta solo quando la SEGNI come fatta
      api.post(`/done-ping`, { recipe_id: recipe.id }).then((r) => setDoneCount(r.data?.count || 0)).catch(() => {});
    }
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
    if (recipe.sourdough_grams) rows.push([tri("Lievito madre", "Sauerteig", "Sourdough"), (Number(recipe.sourdough_grams) || 0) * factor]);
    if (recipe.salt_grams) rows.push([tri("Sale", "Salz", "Salt"), (Number(recipe.salt_grams) || 0) * factor]);
    (recipe.extra_ingredients || []).forEach((it2) => {
      if (it2 && it2.name && it2.percent) rows.push([it2[`name_${lang}`] || it2.name, flour * (Number(it2.percent) / 100)]);
    });
    return rows.map(([n, g]) => [n, round(g)]);
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
  // Z1: grandi lievitati (panettone & co.) — frasi specifiche solo per loro
  const grandeLievitato = recipe.menu_category === "panettoni" || /panettone|veneziana|colomba|pandoro|stollen/i.test(recipe.name || "");
  // Z2: focacce in revisione (metodo di Michele in arrivo) — l'avviso sparisce quando verified torna true
  const focacciaInRevisione = recipe.menu_category === "focacce" && ex.status !== "tested" && ex.status !== "reviewed";

  return (
    <div data-testid={`recipe-extras-${recipe.id}`} className="space-y-4">
      {/* Stato ricetta (V1): "Provata da Michele" / "Controllata da Michele" / bozza */}
      <p data-testid="recipe-status-badge" className="text-center">
        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${ex.status === "tested" ? "bg-accent/15 text-accent" : ex.status === "reviewed" ? "bg-primary/15 text-primary" : "bg-foreground/10 text-muted-foreground"}`}>
          {ex.status === "tested"
            ? tri("Provata da Michele", "Von Michele erprobt", "Tested by Michele")
            : ex.status === "reviewed"
              ? tri("Controllata da Michele", "Von Michele geprüft", "Checked by Michele")
              : tri("Bozza di Sitor", "Sitor-Entwurf", "Sitor draft")}
        </span>
      </p>
      {/* CUCINA CON SITOR */}
      <button data-testid="cook-with-sitor" onClick={() => window.dispatchEvent(new CustomEvent("mikilab-open-player", { detail: { kind: "course", recipe } }))}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-muted hover:bg-muted text-foreground font-bold text-[16px] active:scale-[0.98] transition-all shadow-lg">
        <ChefHat className="w-5 h-5" /> {tri("Cucina con Sitor", "Koch mit Sitor", "Cook with Sitor")}
      </button>
      {((Number(recipe.bulk_fermentation_hours) || 0) + (Number(recipe.proofing_hours) || 0)) >= 4 && <CalendarReminder recipe={recipe} />}
      <BroselBox recipe={recipe} flour={flour} /> {/* V121: il tocco di Michele */}
      <RecipeShareActions recipe={recipe} ex={ex} doses={doses} tri={tri} lang={lang} />
      <button data-testid="mark-done" onClick={toggleDone}
        className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all border ${done ? "bg-accent border-accent text-white" : "bg-transparent border-border text-foreground hover:border-accent"}`}>
        <Check className="w-4 h-4" /> {done ? tri("Fatta ✓ (togli)", "Gemacht ✓ (entfernen)", "Done ✓ (undo)") : tri("Segna come fatta", "Als gemacht markieren", "Mark as done")}
      </button>
      {doneCount >= 20 && <p data-testid="done-count" className="text-center text-xs text-muted-foreground">{tri(`${doneCount} persone l'hanno fatta questo mese`, `${doneCount} Personen haben es diesen Monat gemacht`, `${doneCount} people made it this month`)}</p>}
      <button data-testid="add-to-plan" onClick={() => {
        const scale = (Number(recipe.flour_grams) || 0) > 0 ? flour / Number(recipe.flour_grams) : 1;
        const ing = [];
        ing.push({ name: tri("Farina", "Mehl", "Flour"), g: flour });
        if (recipe.water_grams) ing.push({ name: tri("Acqua", "Wasser", "Water"), g: Math.round(recipe.water_grams * scale) });
        if (recipe.salt_grams) ing.push({ name: tri("Sale", "Salz", "Salt"), g: Math.round(recipe.salt_grams * scale) });
        if (recipe.sourdough_grams) ing.push({ name: tri("Lievito madre", "Sauerteig", "Sourdough"), g: Math.round(recipe.sourdough_grams * scale) });
        (recipe.extra_ingredients || []).forEach((it2) => { if (it2 && it2.name && it2.percent) ing.push({ name: it2[`name_${lang}`] || it2.name, g: Math.round(flour * (Number(it2.percent) / 100)) }); });
        let plan; try { plan = JSON.parse(localStorage.getItem("mikilab_plan") || "[]"); } catch { plan = []; }
        plan.push({ id: recipe.id, name: recipe.name, flour, ing, day: 0 });
        localStorage.setItem("mikilab_plan", JSON.stringify(plan));
        window.dispatchEvent(new CustomEvent("mikilab-plan-changed"));
        toast.success(tri("Aggiunta al piano", "Zum Plan hinzugefügt", "Added to plan"));
      }} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-background border border-border text-foreground font-bold text-sm hover:border-accent/50 active:scale-95 transition-all">
        <CalendarClock className="w-4 h-4" /> {tri("Aggiungi al piano", "Zum Plan hinzufügen", "Add to plan")} ({flour} g)
      </button>
      {((Number(recipe.bulk_fermentation_hours) || 0) + (Number(recipe.proofing_hours) || 0)) > 0 && (
        <div data-testid="kitchen-temp" className="rounded-2xl border border-border bg-background p-3.5">
          <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-2">{tri("Tempo e temperatura", "Zeit & Temperatur", "Time & temperature")} <span className="text-foreground/40">({tri("stima", "Schätzung", "estimate")})</span></p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{tri("Temperatura della cucina", "Küchentemperatur", "Kitchen temperature")}:</span>
            {[18, 22, 26, 30].map((t) => (
              <button key={t} data-testid={`ktemp-${t}`} onClick={() => setKtemp(t)} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${ktemp === t ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground border-border"}`}>{t}°C</button>
            ))}
          </div>
          {(() => {
            const base = (Number(recipe.bulk_fermentation_hours) || 0) + (Number(recipe.proofing_hours) || 0);
            if (!base) return null;
            const label = ktemp <= 20 ? tri("Cucina fresca → più lento: verso il limite alto dei tempi.", "Kühle Küche → langsamer: eher am oberen Zeitende.", "Cool kitchen → slower: toward the longer times.")
              : ktemp >= 26 ? tri("Cucina calda → più veloce: verso il limite basso dei tempi.", "Warme Küche → schneller: eher am unteren Zeitende.", "Warm kitchen → faster: toward the shorter times.")
              : tri("Cucina tiepida → usa i tempi indicati.", "Milde Küche → nutze die angegebenen Zeiten.", "Mild kitchen → use the stated times.");
            return <p className="text-foreground/70 text-sm mt-2">{tri("Lievitazione indicata", "Angegebene Gare", "Stated proof")}: ~{round(base)} h. {label}</p>;
          })()}
          <p className="text-foreground/45 text-[11px] mt-1">{tri("Più caldo = più veloce. Stima: i valori esatti li aggiunge Michele.", "Wärmer = schneller. Schätzung: genaue Werte fügt Michele hinzu.", "Warmer = faster. Estimate: exact values added by Michele.")}</p>
        </div>
      )}

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
        {mode === "casa" ? (
          <span data-testid="recipe-difficulty" className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border" style={{ color: dcfg.c, borderColor: `${dcfg.c}66`, background: `${dcfg.c}18` }}>
            {li([dcfg.it, dcfg.de, dcfg.en])}
          </span>
        ) : (
          <span data-testid="recipe-esperto-meta" className="inline-flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
            {(() => {
              const h = (Number(recipe.bulk_fermentation_hours) || 0) + (Number(recipe.proofing_hours) || 0);
              const parts = [];
              if (h > 0) parts.push(`${round(h)} h ${tri("lievitazione", "Gare", "proof")}`);
              const pf = recipe.preferment_type || (recipe.sourdough_grams ? "lievito madre" : recipe.biga ? "biga" : null);
              if (pf) parts.push(pf);
              return parts.join(" · ") || tri("Ricetta professionale", "Profi-Rezept", "Professional recipe");
            })()}
          </span>
        )}
      </div>

      {/* IL TRUCCO DI MICHELE */}
      {tipText && (
        <div data-testid="michele-tip" className="rounded-2xl border border-primary/40 bg-primary/10 p-3.5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-primary mb-1"><Lightbulb className="w-3.5 h-3.5" /> {tri("Il trucco di Michele", "Micheles Trick", "Michele's trick")}</p>
          <p className="text-sm text-foreground">{tipText}</p>
        </div>
      )}

      {/* Z1-Z4: ricette MISCELA (kind=mix) — non sono pane */}
      {ex.kind === "mix" && <MixPanel ex={ex} mode={mode} />}

      {/* Z2: avviso onesto per le focacce in revisione (sparisce quando verified torna true) */}
      {focacciaInRevisione && (
        <div data-testid="focaccia-revision-notice" className="rounded-2xl border border-ambra/50 bg-ambra/10 p-3.5">
          <p className="text-[12px] text-foreground leading-relaxed">{tri("Bozza scritta con il metodo di Michele (poolish, patata lessa schiacciata, un filo d'olio a chiudere l'impasto, in teglia). Da provare: quando Michele la conferma, questo avviso sparisce.", "Entwurf nach Micheles Methode (Poolish, gekochte zerdrückte Kartoffel, ein Schuss Öl zum Abschluss, im Blech). Zum Ausprobieren: Sobald Michele es bestätigt, verschwindet dieser Hinweis.", "Draft written with Michele's method (poolish, mashed boiled potato, a drizzle of oil to finish, in a tray). To try: once Michele confirms it, this notice disappears.")}</p>
        </div>
      )}

      {/* Panettoni base 60/40 in prova: riquadro giallo con la nota (sparisce quando lo stato non è più reviewed) */}
      {recipe.menu_category === "panettoni" && ex.status === "reviewed" && !/Verde Canapa/.test(recipe.name || "") && (
        <div data-testid="panettone-prova-notice" className="rounded-2xl border border-ambra/50 bg-ambra/10 p-3.5">
          <p className="text-[12px] text-foreground leading-relaxed">{tri("Base MikiLab 60/40 in prova: dosi e tempi da confermare dopo la prima cottura.", "MikiLab-Basis 60/40 in Erprobung: Mengen und Zeiten nach dem ersten Backen zu bestätigen.", "MikiLab 60/40 base under testing: quantities and times to be confirmed after the first bake.")}</p>
        </div>
      )}

      {/* ESPERTO: scala professionale, tabella per impasto, temp. acqua, confronto, scheda stampa */}
      {ex.kind !== "mix" && mode === "esperto" && (
        <EspertoPro recipe={recipe} ex={ex} settings={settings} />
      )}

      {/* CONTROLLO LIEVITO MADRE / LICOLI (solo in CASA) */}
      {mode === "casa" && ex.leaven_kind === "lm" && (
        <div data-testid="control-lm" className="rounded-2xl border border-primary/40 bg-primary/8 p-3.5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-primary mb-2"><Beaker className="w-3.5 h-3.5" /> {tri("Controllo del lievito madre", "Kontrolle des Sauerteigs (Lievito Madre)", "Sourdough (Lievito Madre) check")}</p>
          <ol className="text-[13px] text-foreground space-y-1.5 list-decimal pl-4">
            {[
              ["Metti il lievito in un barattolo di vetro dritto e trasparente, segna il livello con un elastico e annota l'ora.", "Gib den Sauerteig in ein gerades, durchsichtiges Glas, markiere den Stand mit einem Gummiband und notiere die Uhrzeit.", "Put the starter in a straight clear glass jar, mark the level with a rubber band and note the time."],
              grandeLievitato
                ? ["È pronto quando è raddoppiato, con la superficie bombata a cupola (per il panettone: al volume indicato dalla ricetta).", "Fertig, wenn er sich verdoppelt hat, mit gewölbter Kuppel (beim Panettone: auf das im Rezept angegebene Volumen).", "Ready when doubled, with a domed top (for panettone: to the volume in the recipe)."]
                : ["È pronto quando è raddoppiato, con la superficie bombata a cupola.", "Fertig, wenn er sich verdoppelt hat, mit gewölbter Kuppel.", "Ready when doubled, with a domed top."],
              ["Segni buoni: bolle visibili contro il vetro, profumo di yogurt o latte dolce.", "Gute Zeichen: sichtbare Blasen am Glas, Duft nach Joghurt oder süßer Milch.", "Good signs: bubbles against the glass, smell of yogurt or sweet milk."],
              ["Cupola afflosciata e odore pungente (aceto, solvente) = «passato»: rinfrescalo di nuovo prima di usarlo.", "Eingefallene Kuppel und stechender Geruch (Essig, Lösungsmittel) = «über den Punkt»: vor Gebrauch erneut auffrischen.", "Collapsed dome and sharp smell (vinegar, solvent) = «over-proofed»: refresh again before use."],
              ["Da buttare: muffa a peluria, strisce rosa o arancioni.", "Wegwerfen: pelziger Schimmel, rosa oder orange Streifen.", "Discard: fuzzy mould, pink or orange streaks."],
              ["Tienilo intorno ai 28 °C (es. forno spento con la luce accesa; controlla con un termometro).", "Halte ihn bei etwa 28 °C (z. B. ausgeschalteter Ofen mit Licht; mit Thermometer prüfen).", "Keep it around 28 °C (e.g. oven off with light on; check with a thermometer)."],
              ["Annota quante ore ci mette a raddoppiare: se a ogni rinfresco ci mette meno, si sta rinforzando.", "Notiere, wie lange er zum Verdoppeln braucht: wird es bei jeder Auffrischung kürzer, wird er stärker.", "Note how many hours it takes to double: if it gets faster each refresh, it's getting stronger."],
            ].map((s, i) => <li key={i}>{li(s)}</li>)}
          </ol>
          {grandeLievitato ? (
            <p className="text-[12px] text-muted-foreground mt-2">{tri("Prima di un panettone il lievito deve essere già stabile (rinfrescato con regolarità per settimane). Chi non ce l'ha può chiedere un pezzetto a un panificio o usare lievito madre secco da riattivare (circa una settimana).", "Vor einem Panettone muss der Sauerteig stabil sein (wochenlang regelmäßig aufgefrischt). Wer keinen hat, kann in einer Bäckerei ein Stück erbitten oder Trockensauerteig reaktivieren (ca. eine Woche).", "Before a panettone the starter must be stable (regularly refreshed for weeks). If you don't have one, ask a bakery for a piece or reactivate dried sourdough (about a week).")}</p>
          ) : (
            <p className="text-[12px] text-muted-foreground mt-2">{tri("Usalo quando è attivo e stabile: raddoppia con regolarità dopo il rinfresco. Se non hai un lievito madre, chiedine un pezzetto a un panificio o usa lievito madre secco da riattivare (circa una settimana).", "Nutze ihn, wenn er aktiv und stabil ist: Er verdoppelt sich nach dem Auffrischen regelmäßig. Hast du keinen Sauerteig, frag in einer Bäckerei nach einem Stück oder nimm getrockneten Sauerteig zum Reaktivieren (etwa eine Woche).", "Use it when it is active and stable: it doubles regularly after a refresh. If you have no starter, ask a bakery for a piece or use dried starter to reactivate (about a week).")}</p>
          )}
          <button data-testid="control-lm-crealievito" onClick={() => window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route: "crealievito" } }))} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary">🌱 {tri("Non hai ancora un lievito? Crealo da zero", "Noch keinen Sauerteig? Erschaffe ihn von Grund auf", "No starter yet? Create one from scratch")}</button>
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
          <button data-testid="control-licoli-crealievito" onClick={() => window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route: "crealievito" } }))} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary">🌱 {tri("Non hai ancora un licoli? Crealo da zero", "Noch keinen LiCoLi? Erschaffe ihn von Grund auf", "No licoli yet? Create one from scratch")}</button>
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
          {/* Diario prove (privato): data + esito + note; stato con un tocco */}
          <div data-testid="admin-diario" className="border-t border-border/50 pt-3 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wide text-primary">{tri("Diario prova (solo tu)", "Test-Tagebuch (nur du)", "Test log (only you)")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" data-testid="admin-test-date" defaultValue={ex.test_date || ""}
                onBlur={(e) => { if ((e.target.value || "") !== (ex.test_date || "")) saveAdmin({ test_date: e.target.value }); }}
                className="bg-background border border-border rounded-lg text-xs text-foreground px-2 py-1.5 outline-none focus:border-primary" />
              <select data-testid="admin-test-outcome" value={ex.test_outcome || ""} onChange={(e) => saveAdmin({ test_outcome: e.target.value })} disabled={saving}
                className="bg-background border border-border rounded-lg text-xs text-foreground px-2 py-1.5 outline-none">
                <option value="">{tri("— esito —", "— Ergebnis —", "— outcome —")}</option>
                <option value="ok">{tri("Riuscita ✓", "Gelungen ✓", "Success ✓")}</option>
                <option value="da_rifare">{tri("Da rifare", "Nochmal", "Redo")}</option>
              </select>
            </div>
            <textarea data-testid="admin-test-notes" defaultValue={ex.test_notes || ""} rows={2}
              onBlur={(e) => { if ((e.target.value || "") !== (ex.test_notes || "")) saveAdmin({ test_notes: e.target.value }); }}
              placeholder={tri("Note della prova: impasto, cottura, gusto…", "Notizen zum Test: Teig, Backen, Geschmack…", "Test notes: dough, bake, taste…")}
              className="w-full bg-background border border-border rounded-lg text-xs text-foreground px-2.5 py-1.5 outline-none focus:border-primary resize-none" />
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-[11px] text-muted-foreground">{tri("Stato", "Status", "Status")}:</span>
              {[["sitor_draft", tri("Bozza", "Entwurf", "Draft")], ["reviewed", tri("Controllata", "Geprüft", "Checked")], ["tested", tri("Provata ✓", "Erprobt ✓", "Tested ✓")]].map(([st, lbl]) => (
                <button key={st} data-testid={`admin-status-${st}`} disabled={saving}
                  onClick={() => saveAdmin(st === "tested" ? { status: "tested", verified: true } : st === "reviewed" ? { status: "reviewed", verified: true } : { status: "sitor_draft", verified: false })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold active:scale-95 disabled:opacity-50 ${ex.status === st ? (st === "tested" ? "bg-accent text-white" : "bg-primary text-primary-foreground") : "bg-foreground/10 text-muted-foreground"}`}>{lbl}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Copyright ricetta (STADIO 2c) */}
      <p data-testid="recipe-copyright" className="text-center text-[11px] text-muted-foreground leading-relaxed pt-1 no-print">
        {tri("Ricette e testi © MikiLab. Gratis per uso personale. Le stampe e le condivisioni ufficiali riportano il logo MikiLab.",
          "Rezepte und Texte © MikiLab. Kostenlos für den privaten Gebrauch. Offizielle Ausdrucke und geteilte Inhalte tragen das MikiLab-Logo.",
          "Recipes and texts © MikiLab. Free for personal use. Official prints and shares carry the MikiLab logo.")}
      </p>
    </div>
  );
}
