import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { ChefHat, Plus, X, Thermometer, Sparkles, Printer, Share2 } from "lucide-react";
import { API, labConfigApi, recipesApi, weeklyApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { computeShopping } from "@/lib/shopping";
import SupplierOrder from "@/components/SupplierOrder";
import { fireHighFive } from "@/components/HighFive";
import { shareContent } from "@/lib/share";
import { rLoc } from "@/lib/loc";

const DAYS = ["", "lun", "mar", "mer", "gio", "ven", "sab", "dom"];

// Piano di Produzione con IA (spostato dalla "Impostazione Macchine").
// Config macchine/celle letta in sola lettura per alimentare l'IA.
export default function PianoProduzioneAI() {
  const { t, lang } = useLang();
  const [mixers, setMixers] = useState([]);
  const [cells, setCells] = useState([]);
  const [staff, setStaff] = useState("");
  const [stdTemp, setStdTemp] = useState(26);
  const [labTemp, setLabTemp] = useState("");
  const [startTime, setStartTime] = useState("05:00");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState([{ recipe_id: "", name: "", qty: "", unit: "pezzi", gpp: "", day: "" }]);
  const [recipes, setRecipes] = useState([]);
  const [weeklyItems, setWeeklyItems] = useState([]);
  const [useWeekly, setUseWeekly] = useState(false);
  const [preferment, setPreferment] = useState("solido");
  const [plan, setPlan] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await labConfigApi.get();
        if (cfg) {
          setMixers(cfg.mixers || []);
          setCells(cfg.cells || []);
          setStaff(cfg.staff ?? "");
          setStdTemp(cfg.standard_temp_c ?? 26);
        }
      } catch { /* first run */ }
      try {
        const [mk, ps, wp] = await Promise.all([recipesApi.list("mikilab"), recipesApi.list("personal"), weeklyApi.get()]);
        setRecipes([...(mk || []), ...(ps || [])].sort((a, b) => (a.name || "").localeCompare(b.name || "")));
        if (wp && wp.items) setWeeklyItems(wp.items);
      } catch { /* */ }
    })();
  }, []);

  const recipeById = useMemo(() => Object.fromEntries(recipes.map((r) => [r.id, r])), [recipes]);

  const shopTotals = useMemo(() => {
    const list = products
      .filter((p) => p.recipe_id)
      .map((p) => ({ recipe_id: p.recipe_id, grams: p.unit === "kg" ? Number(p.qty || 0) * 1000 : Number(p.qty || 0) * Number(p.gpp || 500) }));
    if (useWeekly) {
      weeklyItems.forEach((w) => list.push({ recipe_id: w.recipe_id, grams: Number(w.pieces || 0) * Number(w.grams_per_piece || 0) }));
    }
    return computeShopping(list, recipeById, lang);
  }, [products, useWeekly, weeklyItems, recipeById, lang]);

  const usedRecipes = useMemo(() => {
    const ids = new Set(products.filter((p) => p.recipe_id).map((p) => p.recipe_id));
    if (useWeekly) weeklyItems.forEach((w) => ids.add(w.recipe_id));
    return [...ids].map((id) => recipeById[id]).filter(Boolean);
  }, [products, useWeekly, weeklyItems, recipeById]);

  const tempDelta = labTemp === "" ? null : Number(labTemp) - (Number(stdTemp) || 26);
  const tempMsg = tempDelta == null ? null : Math.abs(tempDelta) < 1 ? t("capo_temp_ok") : tempDelta > 0 ? t("capo_temp_warm") : t("capo_temp_cold");

  const streamPhase = async (phase, headerLabel) => {
    const res = await fetch(`${API}/capo/plan`, {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({
        items: products.map((p) => ({ recipe_id: p.recipe_id || null, name: p.name, quantity: p.qty === "" ? null : Number(p.qty), unit: p.unit, day: p.day || null })),
        mixers, cells, mode: "pro", phase, use_weekly: useWeekly,
        staff: staff === "" ? null : Number(staff),
        start_time: startTime, lab_temp_c: labTemp === "" ? null : Number(labTemp),
        standard_temp_c: Number(stdTemp) || 26, notes, lang, preferment_choice: preferment,
      }),
    });
    if (!res.ok) {
      toast.error(res.status === 402 || res.status === 403 ? (lang === "de" ? "PRO erforderlich" : lang === "en" ? "PRO required" : "Serve l'abbonamento PRO") : t("chat_error"));
      return false;
    }
    if (headerLabel) setPlan((p) => p + (p ? "\n\n" : "") + `## ${headerLabel}\n\n`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;
    while (true) {
      const { done: rd, value } = await reader.read();
      if (rd) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n"); buffer = parts.pop();
      for (const part of parts) {
        const line = part.replace(/^data: ?/, "").trim();
        if (!line) continue;
        let obj; try { obj = JSON.parse(line); } catch { continue; }
        if (obj.done) { done = true; continue; }
        if (obj.d) setPlan((p) => p + obj.d);
      }
    }
    return done;
  };

  const generate = async () => {
    if (products.length === 0 && !(useWeekly && weeklyItems.length)) { toast.error(t("capo_no_products")); return; }
    setGenerating(true); setPlan("");
    const twoPhase = useWeekly || products.some((p) => p.day);
    try {
      let ok = true;
      if (twoPhase) {
        ok = await streamPhase("weekly", t("capo_phase_weekly"));
        ok = (await streamPhase("daily", t("capo_phase_daily"))) && ok;
      } else {
        ok = await streamPhase("daily", null);
      }
      if (!ok) toast.warning(t("capo_plan_incomplete"));
      else fireHighFive(lang === "de" ? "Plan erstellt! 👏" : lang === "en" ? "Plan generated! 👏" : "Piano generato! 👏");
    } catch { toast.error(t("chat_error")); }
    finally { setGenerating(false); }
  };

  return (
    <div className="pb-40">
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#5E8B7E] to-[#33564E] p-6 text-white">
        <div className="absolute top-0 left-0 right-0 flex h-1.5">
          <div className="flex-1 bg-[#6B8E62]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#6E8CA0]" />
          <div className="flex-1 bg-black" /><div className="flex-1 bg-[#6E8CA0]" /><div className="flex-1 bg-[#A9C5D4]" />
        </div>
        <Sparkles className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{lang === "de" ? "Produktionsplan mit KI" : lang === "en" ? "AI Production Plan" : "Piano di Produzione con IA"}</h1>
        <p className="text-white/85 text-sm mt-1">{lang === "de" ? "Wähle, was du vorbereiten willst, und lass den Plan generieren" : lang === "en" ? "Choose what to prepare and generate the plan" : "Scegli cosa preparare e genera il piano di lavoro"}</p>
      </div>

      {mixers.length === 0 && cells.length === 0 && (
        <div className="mb-4 rounded-2xl bg-[#6E8CA0]/12 border border-[#6E8CA0]/30 p-3.5 text-sm text-[#33564E] dark:text-[#8FB0C2]">
          {lang === "de" ? "Tipp: Richte zuerst deine Maschinen im Schritt 1 „Hardware-Einrichtung“ ein, damit die KI Kneter und Zellen berücksichtigt."
            : lang === "en" ? "Tip: set up your machines first in Step 1 “Hardware Setup”, so the AI can use mixers and cells."
            : "Suggerimento: configura prima le tue macchine nel Passo 1 «Prima Configurazione Hardware», così l'IA userà impastatrici e celle."}
        </div>
      )}

      <Section icon={<Sparkles className="w-4 h-4" />} title={t("capo_products_title")}>
        <div className="space-y-2" data-testid="capo-products">
          {products.map((p, i) => (
            <div key={i} className="bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <select data-testid={`capo-product-recipe-${i}`} value={p.recipe_id || ""}
                  onChange={(e) => { const r = recipes.find((x) => x.id === e.target.value); setProducts((l) => l.map((x, k) => k === i ? { ...x, recipe_id: e.target.value, name: r ? r.name : x.name } : x)); }}
                  className="flex-1 min-w-0 bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#5E8B7E]">
                  <option value="">{t("capo_pick_recipe")}</option>
                  {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <button onClick={() => setProducts((l) => l.filter((_, k) => k !== i))} className="text-[#C0574D] p-1 shrink-0"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2">
                <input data-testid={`capo-product-qty-${i}`} type="number" value={p.qty} placeholder={t("capo_qty")}
                  onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, qty: e.target.value } : x))}
                  className="w-16 shrink-0 bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#5E8B7E]" />
                <select data-testid={`capo-product-unit-${i}`} value={p.unit}
                  onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, unit: e.target.value } : x))}
                  className="w-[72px] shrink-0 bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#5E8B7E]">
                  <option value="pezzi">{t("capo_unit_pieces")}</option>
                  <option value="kg">{t("capo_unit_kg")}</option>
                </select>
                {p.unit === "pezzi" && (
                  <div className="relative w-[72px] shrink-0">
                    <input data-testid={`capo-product-gpp-${i}`} type="number" value={p.gpp ?? ""} placeholder="g/pz"
                      onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, gpp: e.target.value } : x))}
                      className="w-full bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 pr-6 text-sm outline-none focus:border-[#5E8B7E]" />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[#7E8A93]">g</span>
                  </div>
                )}
                <select data-testid={`capo-product-day-${i}`} value={p.day || ""}
                  onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, day: e.target.value } : x))}
                  className="flex-1 min-w-0 bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#5E8B7E]">
                  {DAYS.map((d) => <option key={d} value={d}>{d === "" ? t("capo_day_any") : t(`day_${d}`)}</option>)}
                </select>
              </div>
            </div>
          ))}
          <button data-testid="capo-product-add" onClick={() => setProducts((l) => [...l, { recipe_id: "", name: "", qty: "", unit: "pezzi", gpp: "", day: "" }])} className="text-sm font-medium text-[#5E8B7E] flex items-center gap-1"><Plus className="w-4 h-4" /> {t("capo_add_product")}</button>
        </div>

        {weeklyItems.length > 0 && (
          <label data-testid="capo-use-weekly" className="mt-3 flex items-center gap-2 text-sm text-[#3F4A54] dark:text-[#AEB8BF] cursor-pointer">
            <input type="checkbox" checked={useWeekly} onChange={(e) => setUseWeekly(e.target.checked)} className="w-4 h-4 accent-[#5E8B7E]" />
            {lang === "de" ? "Auch den gespeicherten Wochenplan verwenden" : lang === "en" ? "Also use the saved weekly plan" : "Usa anche il Piano Settimanale salvato"}
          </label>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <LabelInput testid="capo-start-time" label={t("capo_start_time")} type="time" value={startTime} onChange={setStartTime} />
          <LabelInput testid="capo-lab-temp" label={t("capo_lab_temp")} type="number" value={labTemp} onChange={setLabTemp} unit="°C" />
        </div>
        {tempMsg && (
          <div data-testid="capo-temp-msg" className={`mt-2 text-sm rounded-xl px-3 py-2 border ${tempDelta && Math.abs(tempDelta) >= 1 ? "bg-[#6E8CA0]/15 border-[#6E8CA0]/40 text-[#33564E] dark:text-[#8FB0C2]" : "bg-[#6B8E62]/12 border-[#6B8E62]/30 text-[#4d6b45] dark:text-[#9ec48f]"}`}>
            <Thermometer className="w-4 h-4 inline mr-1" />{tempMsg}
          </div>
        )}
        <div className="mt-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{lang === "de" ? "Triebmittel / Vorteig" : lang === "en" ? "Leaven / Preferment" : "Lievito / Prefermento"}</label>
          <select data-testid="capo-preferment" value={preferment} onChange={(e) => setPreferment(e.target.value)}
            className="mt-1 w-full bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl p-3 text-sm outline-none focus:border-[#5E8B7E]">
            <option value="solido">{lang === "de" ? "Fester Lievito Madre" : lang === "en" ? "Solid sourdough" : "Lievito Madre solido"}</option>
            <option value="licoli">LiCoLi ({lang === "de" ? "Flüssighefe" : lang === "en" ? "liquid starter" : "lievito in coltura liquida"})</option>
            <option value="poolish">Poolish</option>
            <option value="lievito_birra">{lang === "de" ? "Hefe (Bierhefe)" : lang === "en" ? "Baker's yeast" : "Lievito di birra"}</option>
          </select>
          {(preferment === "licoli" || preferment === "poolish") && (
            <div data-testid="capo-preferment-banner" className="mt-2 rounded-xl bg-[#6E8CA0]/15 border border-[#6E8CA0]/40 p-3 text-sm text-[#33564E] dark:text-[#8FB0C2] leading-relaxed">
              ⚠️ {lang === "de"
                ? "TECHNISCHER HINWEIS: Du verwendest LiCoLi oder Poolish. Da es sich um Vorteige mit 100% Hydratation handelt, wird die Wassermenge im Hauptteig automatisch neu berechnet und reduziert, damit die Endhydratation ausgewogen bleibt."
                : "ATTENZIONE TECNICA: Stai utilizzando il LiCoLi o il Poolish. Essendo prefermenti al 100% di idratazione, la quantità di acqua/liquidi nell'impasto principale è stata automaticamente ricalcolata e ridotta per mantenere bilanciata l'idratazione finale."}
            </div>
          )}
        </div>

        <div className="mt-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("capo_notes")}</label>
          <textarea data-testid="capo-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="mt-1 w-full bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl p-3 text-sm outline-none focus:border-[#5E8B7E] resize-none" />
        </div>

        <button data-testid="capo-generate" onClick={generate} disabled={generating}
          className="mt-3 w-full bg-[#5E8B7E] hover:bg-[#4C7368] disabled:opacity-50 text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2">
          <ChefHat className="w-5 h-5" /> {generating ? t("capo_generating") : t("capo_generate")}
        </button>

        {plan && (
          <>
            <button data-testid="capo-print" onClick={() => window.print()}
              className="no-print mt-3 w-full bg-[#6B8E62] hover:bg-[#5a7a52] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
              <Printer className="w-5 h-5" /> {t("capo_print")}
            </button>
            <button data-testid="capo-share" onClick={() => shareContent(lang === "de" ? "Produktionsplan — MikiLab" : lang === "en" ? "Production plan — MikiLab" : "Piano di Produzione — MikiLab", plan, lang)}
              className="no-print mt-2 w-full bg-[#EAF0EC] dark:bg-[#2A323A] text-[#2B303B] dark:text-[#EAF0EC] font-medium px-5 py-3 rounded-2xl border border-[#D7E1DB] dark:border-[#38424B] active:scale-98 transition-all flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5" /> {lang === "de" ? "Teilen" : lang === "en" ? "Share" : "Condividi"}
            </button>

            <div className="print-area mt-4 space-y-4">
              <div data-testid="capo-plan" className="markdown-body bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl p-5 text-sm leading-relaxed text-[#2B303B] dark:text-[#EAF0EC]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#5E8B7E] mb-2">{t("capo_plan_title")}</p>
                <ReactMarkdown>{plan}</ReactMarkdown>
              </div>

              <SupplierOrder totals={shopTotals} />

              {usedRecipes.length > 0 && (
                <div data-testid="capo-recipes" className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#5E8B7E]">{t("capo_recipes_title")}</p>
                  {usedRecipes.map((r) => <RecipePrint key={r.id} r={r} lang={lang} />)}
                </div>
              )}
            </div>
          </>
        )}
      </Section>
    </div>
  );
}

function RecipePrint({ r, lang }) {
  const ing = [
    [lang === "de" ? "Mehl" : lang === "en" ? "Flour" : "Farina", r.flour_grams],
    [lang === "de" ? "Wasser" : lang === "en" ? "Water" : "Acqua", r.water_grams],
    [lang === "de" ? "Vorteig/Sauerteig" : lang === "en" ? "Preferment/Sourdough" : "Prefermento/Lievito madre", r.sourdough_grams],
    [lang === "de" ? "Salz" : lang === "en" ? "Salt" : "Sale", r.salt_grams],
  ].filter(([, g]) => Number(g) > 0);
  const proc = rLoc(r, "procedure", lang);
  return (
    <div className="bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl p-4">
      <h3 className="font-display text-base font-bold text-[#2B303B] dark:text-[#EAF0EC]">{rLoc(r, "name", lang)}</h3>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
        {ing.map(([label, g]) => (
          <div key={label} className="flex items-center justify-between text-xs">
            <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{label}</span>
            <span className="font-mono-data font-bold text-[#33564E] dark:text-[#8FB0C2]">{g} g</span>
          </div>
        ))}
      </div>
      {(r.extra_ingredients || []).length > 0 && (
        <p className="text-xs text-[#7E8A93] mt-1.5">{r.extra_ingredients.map((e) => `${e.name} ${e.percent}%`).join(" · ")}</p>
      )}
      {proc && <p className="text-xs text-[#3F4A54] dark:text-[#AEB8BF] mt-2 whitespace-pre-line leading-relaxed">{proc}</p>}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-4">
      <div className="flex items-center gap-2 mb-3 text-[#5E8B7E]">
        {icon}
        <h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#EAF0EC]">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function LabelInput({ testid, label, type, value, onChange, unit }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93]">{label}</label>
      <div className="relative mt-1">
        <input data-testid={testid} type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl p-2.5 text-sm outline-none focus:border-[#5E8B7E]" />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7E8A93] pointer-events-none">{unit}</span>}
      </div>
    </div>
  );
}
