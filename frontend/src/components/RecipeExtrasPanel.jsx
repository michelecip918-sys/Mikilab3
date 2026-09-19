import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Home, ChefHat, Lightbulb, Wrench, AlertTriangle, ShieldAlert, Beaker, Save } from "lucide-react";

const MODE_KEY = "mikilab_recipe_mode"; // "casa" | "esperto"
const SKILL_KEY = "mikilab_skill";

const DIFF = {
  facile: { it: "Facile", de: "Einfach", en: "Easy", c: "#6e9e85" },
  media: { it: "Media", de: "Mittel", en: "Medium", c: "#c9a227" },
  sfida: { it: "Sfida", de: "Herausforderung", en: "Challenge", c: "#b06e78" },
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
      {/* CASA / ESPERTO + difficoltà */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div data-testid="recipe-mode-toggle" className="inline-flex rounded-xl border border-[#2A3B49] overflow-hidden">
          <button data-testid="recipe-mode-casa" onClick={() => setModePref("casa")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all ${mode === "casa" ? "bg-[#D97736] text-[#0D1520]" : "text-[#7E8A93] hover:text-white"}`}>
            <Home className="w-3.5 h-3.5" /> {tri("Casa", "Zu Hause", "Home")}
          </button>
          <button data-testid="recipe-mode-esperto" onClick={() => setModePref("esperto")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all ${mode === "esperto" ? "bg-[#D97736] text-[#0D1520]" : "text-[#7E8A93] hover:text-white"}`}>
            <ChefHat className="w-3.5 h-3.5" /> {tri("Esperto", "Experte", "Expert")}
          </button>
        </div>
        <span data-testid="recipe-difficulty" className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full border" style={{ color: dcfg.c, borderColor: `${dcfg.c}66`, background: `${dcfg.c}18` }}>
          {li([dcfg.it, dcfg.de, dcfg.en])}
        </span>
      </div>

      {/* IL TRUCCO DI MICHELE */}
      {tipText && (
        <div data-testid="michele-tip" className="rounded-2xl border border-[#D97736]/40 bg-[#D97736]/10 p-3.5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#D97736] mb-1"><Lightbulb className="w-3.5 h-3.5" /> {tri("Il trucco di Michele", "Micheles Trick", "Michele's trick")}</p>
          <p className="text-sm text-[#e4eff8]">{tipText}</p>
        </div>
      )}

      {/* CASA: dosi per la tua farina */}
      {mode === "casa" && (
        <div data-testid="casa-doses" className="rounded-2xl border border-[#2A3B49] bg-[#0b1220] p-3.5">
          <p className="text-[11px] font-black uppercase tracking-wide text-[#3E9C93] mb-2">{tri("Le tue dosi (per la farina scelta)", "Deine Mengen (für die gewählte Mehlmenge)", "Your doses (for the chosen flour)")}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[250, 500, 1000].map((f) => (
              <button key={f} data-testid={`casa-flour-${f}`} onClick={() => setFlour(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${flour === f ? "bg-[#3E9C93] text-white border-[#3E9C93]" : "text-[#7E8A93] border-[#2A3B49] hover:text-white"}`}>{f} g</button>
            ))}
            <input data-testid="casa-flour-free" type="number" min="50" step="50" value={flour}
              onChange={(e) => setFlour(Math.max(1, Number(e.target.value) || 0))}
              className="w-24 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#0D1520] border border-[#2A3B49] text-white outline-none focus:border-[#3E9C93]" />
          </div>
          <table className="w-full text-sm">
            <tbody>
              {doses.map(([n, g], i) => (
                <tr key={i} className="border-b border-[#2A3B49]/50 last:border-0">
                  <td className="py-1.5 text-[#cbd5e1]">{n}</td>
                  <td className="py-1.5 text-right font-bold text-white">{g} g</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-[#7E8A93] mt-2">{tri("Dosi indicative ricalcolate dalla ricetta originale.", "Ungefähre Mengen, aus dem Originalrezept umgerechnet.", "Approximate doses recalculated from the original recipe.")}</p>
        </div>
      )}

      {/* ESPERTO: nota % del fornaio */}
      {mode === "esperto" && (
        <div data-testid="esperto-note" className="rounded-2xl border border-[#2A3B49] bg-[#0b1220] p-3.5 text-sm text-[#cbd5e1]">
          {tri("Modalità esperto: usa le percentuali del panificatore e l'idratazione qui sotto; scala a qualsiasi peso.", "Expertenmodus: nutze Bäckerprozente und Hydration unten; auf jedes Gewicht skalierbar.", "Expert mode: use baker's percentages and hydration below; scale to any weight.")}
          {recipe.hydration_percent ? <span className="block mt-1 font-bold text-white">{tri("Idratazione", "Hydration", "Hydration")}: {recipe.hydration_percent}%</span> : null}
        </div>
      )}

      {/* CONTROLLO LIEVITO MADRE / LICOLI (solo in CASA) */}
      {mode === "casa" && ex.leaven_kind === "lm" && (
        <div data-testid="control-lm" className="rounded-2xl border border-[#3E9C93]/40 bg-[#3E9C93]/8 p-3.5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#3E9C93] mb-2"><Beaker className="w-3.5 h-3.5" /> {tri("Controllo del lievito madre", "Kontrolle des Sauerteigs (Lievito Madre)", "Sourdough (Lievito Madre) check")}</p>
          <ol className="text-[13px] text-[#cbd5e1] space-y-1.5 list-decimal pl-4">
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
          <p className="text-[12px] text-[#7E8A93] mt-2">{tri("Prima di un panettone il lievito deve essere già stabile (rinfrescato con regolarità per settimane). Chi non ce l'ha può chiedere un pezzetto a un panificio o usare lievito madre secco da riattivare (circa una settimana).", "Vor einem Panettone muss der Sauerteig stabil sein (wochenlang regelmäßig aufgefrischt). Wer keinen hat, kann in einer Bäckerei ein Stück erbitten oder Trockensauerteig reaktivieren (ca. eine Woche).", "Before a panettone the starter must be stable (regularly refreshed for weeks). If you don't have one, ask a bakery for a piece or reactivate dried sourdough (about a week).")}</p>
        </div>
      )}
      {mode === "casa" && ex.leaven_kind === "licoli" && (
        <div data-testid="control-licoli" className="rounded-2xl border border-[#3E9C93]/40 bg-[#3E9C93]/8 p-3.5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#3E9C93] mb-2"><Beaker className="w-3.5 h-3.5" /> {tri("Controllo del licoli", "Kontrolle des LiCoLi", "LiCoLi check")}</p>
          <ol className="text-[13px] text-[#cbd5e1] space-y-1.5 list-decimal pl-4">
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

      {/* COSA TI SERVE */}
      {ex.equipment && ex.equipment.length > 0 && (
        <div data-testid="recipe-equipment" className="rounded-2xl border border-[#2A3B49] bg-[#0b1220] p-3.5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-[#c9a227] mb-2">
            <Wrench className="w-3.5 h-3.5" /> {tri("Cosa ti serve", "Was du brauchst", "What you need")}
            {ex.equipment_draft && <span className="text-[9px] font-bold text-[#7E8A93] normal-case">· {tri("bozza", "Entwurf", "draft")}</span>}
          </p>
          <ul className="space-y-1.5">
            {ex.equipment.map((it2, i) => (
              <li key={i} className="text-[13px] text-[#cbd5e1] flex flex-col">
                <span className="font-semibold text-white">{li([it2.it, it2.de, it2.en])}{it2.optional ? ` · ${tri("facoltativo", "optional", "optional")}` : ""}</span>
                {it2.buy && <span className="text-[11px] text-[#7E8A93]">{tri("Dove:", "Wo:", "Where:")} {li([it2.buy.it, it2.buy.de, it2.buy.en])}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ALLERGENI */}
      {ex.allergens && ex.allergens.length > 0 && (
        <div data-testid="recipe-allergens" className="rounded-2xl border border-[#2A3B49] bg-[#0b1220] p-3.5">
          <p className="text-[11px] font-black uppercase tracking-wide text-[#94A3B8] mb-2">{tri("Allergeni", "Allergene", "Allergens")}</p>
          <div className="flex flex-wrap gap-1.5">
            {ex.allergens.map((a) => (
              <span key={a} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#94A3B8]/12 border border-[#94A3B8]/30 text-[#cbd5e1]">{li(ALLERGEN_LABEL[a] || [a, a, a])}</span>
            ))}
          </div>
          <p className="text-[11px] text-[#7E8A93] mt-2">{tri("Controlla sempre le etichette dei tuoi prodotti.", "Prüfe immer die Etiketten deiner Produkte.", "Always check the labels of your products.")}</p>
        </div>
      )}

      {/* AVVISI DI SICUREZZA */}
      {ex.safety && ex.safety.length > 0 && (
        <div data-testid="recipe-safety" className="rounded-2xl border border-[#b06e78]/40 bg-[#b06e78]/10 p-3.5 space-y-1.5">
          {ex.safety.includes("lye") && (
            <p className="flex items-start gap-2 text-[13px] text-[#f0c9cf]"><ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-[#b06e78]" />
              {tri("La liscivia è caustica: guanti e occhiali, lontano dai bambini. Alternativa più sicura: bicarbonato cotto in forno.", "Lauge ist ätzend: Handschuhe und Schutzbrille, von Kindern fernhalten. Sicherere Alternative: im Ofen gebackenes Natron.", "Lye is caustic: gloves and goggles, keep away from children. Safer alternative: baked baking soda.")}</p>
          )}
          {ex.safety.includes("oven") && (
            <p className="flex items-start gap-2 text-[13px] text-[#f0c9cf]"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#b06e78]" />
              {tri("Forno e vapore scottano.", "Ofen und Dampf verbrennen.", "Oven and steam can burn.")}</p>
          )}
        </div>
      )}

      {/* ADMIN */}
      {isAdmin && (
        <div data-testid="recipe-extras-admin" className="rounded-2xl border border-[#D97736]/30 bg-[#0b1220] p-3.5 space-y-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-[#D97736]">{tri("Admin · extra ricetta", "Admin · Rezept-Extras", "Admin · recipe extras")}</p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#94A3B8]">{tri("Difficoltà", "Schwierigkeit", "Difficulty")}</label>
            <select data-testid="admin-difficulty" value={ex.difficulty} onChange={(e) => saveAdmin({ difficulty: e.target.value })} disabled={saving}
              className="bg-[#0D1520] border border-[#2A3B49] rounded-lg text-xs text-white px-2 py-1.5 outline-none">
              <option value="facile">{tri("Facile", "Einfach", "Easy")}</option>
              <option value="media">{tri("Media", "Mittel", "Medium")}</option>
              <option value="sfida">{tri("Sfida", "Herausforderung", "Challenge")}</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-[#cbd5e1]">
            {[["real_photo", tri("Foto reale", "Echtes Foto", "Real photo")], ["verified", tri("Verificata", "Geprüft", "Verified")], ["hidden_public", tri("Nascondi al pubblico", "Öffentlich verbergen", "Hide from public")]].map(([k, lbl]) => (
              <label key={k} className="inline-flex items-center gap-1.5"><input type="checkbox" data-testid={`admin-${k}`} checked={!!ex[k]} onChange={(e) => saveAdmin({ [k]: e.target.checked })} disabled={saving} />{lbl}</label>
            ))}
          </div>
          <div>
            <p className="text-xs text-[#94A3B8] mb-1">{tri("Il trucco di Michele (IT / DE / EN)", "Micheles Trick (IT / DE / EN)", "Michele's trick (IT / DE / EN)")}</p>
            {["it", "de", "en"].map((lc) => (
              <input key={lc} data-testid={`admin-tip-${lc}`} defaultValue={(ex.michele_tip || {})[lc] || ""}
                onBlur={(e) => { const v = e.target.value.trim(); const cur = ex.michele_tip || {}; if (v !== (cur[lc] || "")) saveAdmin({ michele_tip: { ...cur, [lc]: v } }); }}
                placeholder={lc.toUpperCase()} className="w-full mb-1.5 bg-[#0D1520] border border-[#2A3B49] rounded-lg text-xs text-white px-2.5 py-1.5 outline-none focus:border-[#D97736]" />
            ))}
            <p className="inline-flex items-center gap-1 text-[10px] text-[#7E8A93]"><Save className="w-3 h-3" /> {tri("Salva automaticamente quando esci dal campo.", "Speichert automatisch beim Verlassen des Feldes.", "Auto-saves when you leave the field.")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
