import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { motion, Reorder } from "framer-motion";
import { ChefHat, Plus, X, Thermometer, Sparkles, Printer, Share2, CalendarDays, Clock, ShoppingCart, Euro, Store, Users, BookOpen, Snowflake, CheckCircle2, RotateCcw, FlaskConical, Flag, Recycle, Wrench, SlidersHorizontal, Building2, Scale, Flame, Droplets, Timer as TimerIcon, CloudSun, Camera, QrCode, ScanLine, ListChecks, CalendarClock, Archive, Info, Eye, EyeOff, ChevronUp, ChevronDown, Settings2, HelpCircle, Star } from "lucide-react";
import { API, labConfigApi, recipesApi, weeklyApi, capoPlanApi, subscriptionApi } from "@/lib/api";
import { computeRecipeCostPerPiece } from "@/data/prices";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { computeShopping } from "@/lib/shopping";
import SupplierOrder from "@/components/SupplierOrder";
import { fireHighFive } from "@/components/HighFive";
import PlanArchive from "@/components/PlanArchive";
import LabTour from "@/components/LabTour";
import { guideFor } from "@/lib/toolGuide";
import { shareContent } from "@/lib/share";
import { rLoc } from "@/lib/loc";

const DAYS = ["", "lun", "mar", "mer", "gio", "ven", "sab", "dom"];

const tri3 = (lang, i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);

// Piano di Produzione con IA (spostato dalla "Impostazione Macchine").
// Config macchine/celle letta in sola lettura per alimentare l'IA.
const isPanettoneRecipe = (r) => /panettone/i.test(r?.name || "") || /panettone/i.test(r?.menu_category || "");

// Moduli opzionali del Piano IA: si accendono/spengono senza bloccare il piano base.
const DEFAULT_MODULES = { celle: true, orari: true, freezer: true, spesa: true, foodcost: true, turni: false, clima: false, punti: false, antispreco: false };
const MODULES = [
  { id: "celle", Icon: Wrench, it: "Celle & Impastatrici", de: "Kammern & Kneter", en: "Cells & Mixers" },
  { id: "orari", Icon: Clock, it: "Orari d'inizio", de: "Startzeiten", en: "Start times" },
  { id: "freezer", Icon: Snowflake, it: "Giacenze Freezer", de: "Gefrierbestand", en: "Freezer stock" },
  { id: "turni", Icon: Users, it: "Turni & Personale", de: "Schichten & Personal", en: "Shifts & staff" },
  { id: "clima", Icon: Thermometer, it: "Meteo & Clima", de: "Wetter & Klima", en: "Weather & climate" },
  { id: "spesa", Icon: ShoppingCart, it: "Lista Spesa", de: "Einkaufsliste", en: "Shopping list" },
  { id: "foodcost", Icon: Euro, it: "Costi & Margine", de: "Kosten & Marge", en: "Costs & margin" },
  { id: "punti", Icon: Store, it: "Punti Vendita", de: "Verkaufspunkte", en: "Sales points" },
  { id: "antispreco", Icon: Recycle, it: "Anti-Spreco", de: "Anti-Verschwendung", en: "Anti-waste" },
];

// Ogni interruttore-modulo apre lo strumento corrispondente per configurarlo.
const MODULE_TOOL = { celle: "capo", orari: "inversa", freezer: "freezer", turni: "turni", clima: "termo", spesa: "spesa", foodcost: "foodcost", punti: "salespoints", antispreco: "spreco" };

// Strumenti apribili (personalizzabili: riordina/nascondi). Gli interruttori-modulo sono a parte.
const TOOLS = [
  { id: "mydata", Icon: Archive, it: "I Miei Dati", de: "Meine Daten", en: "My Data" },
  { id: "twin", Icon: FlaskConical, it: "Digital Twin", de: "Teig-Zwilling", en: "Dough Twin" },
  { id: "adatta", Icon: Flame, it: "Adatta Forno", de: "Ofen anpassen", en: "Adapt Oven" },
  { id: "bilancia", Icon: Scale, it: "Bilancia Smart", de: "Smarte Waage", en: "Smart Scale" },
  { id: "termo", Icon: Thermometer, it: "Termostato & Clima", de: "Thermostat & Klima", en: "Thermostat & Climate" },
  { id: "acqua", Icon: Droplets, it: "Temp. Acqua", de: "Wasser-Temp.", en: "Water Temp." },
  { id: "pesata", Icon: Scale, it: "Pesata Guidata", de: "Geführtes Wiegen", en: "Guided Weighing" },
  { id: "timer", Icon: TimerIcon, it: "Timer", de: "Timer", en: "Timer" },
  { id: "meteo", Icon: CloudSun, it: "Meteo", de: "Wetter", en: "Weather" },
  { id: "ph", Icon: FlaskConical, it: "pH Lievito", de: "pH Sauerteig", en: "Sourdough pH" },
  { id: "diagnosi", Icon: Camera, it: "Diagnosi Foto", de: "Foto-Diagnose", en: "Photo Diagnosis" },
  { id: "suono", Icon: Camera, it: "Diagnosi Suono", de: "Klang-Diagnose", en: "Sound Diagnosis" },
  { id: "sessioni", Icon: Thermometer, it: "Diario Impasti", de: "Teig-Tagebuch", en: "Dough Log" },
  { id: "lotti", Icon: QrCode, it: "Tracciabilità Lotti", de: "Chargen", en: "Batch Traceability" },
  { id: "haccp", Icon: ScanLine, it: "Registro HACCP", de: "HACCP-Register", en: "HACCP Log" },
  { id: "check", Icon: ListChecks, it: "Checklist", de: "Checklisten", en: "Checklists" },
  { id: "shelf", Icon: CalendarClock, it: "Shelf-Life", de: "Shelf-Life", en: "Shelf-Life" },
];

export default function PianoProduzioneAI({ onOpenTool }) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [mixers, setMixers] = useState([]);
  const [cells, setCells] = useState([]);
  const [staff, setStaff] = useState("");
  const [stdTemp, setStdTemp] = useState(26);
  const [labTemp, setLabTemp] = useState("");
  const [startTime, setStartTime] = useState("05:00");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState([{ recipe_id: "", name: "", qty: "", unit: "pezzi", gpp: "", day: "", start: false }]);
  const [recipes, setRecipes] = useState([]);
  const [weeklyItems, setWeeklyItems] = useState([]);
  const [useWeekly, setUseWeekly] = useState(false);
  const [preferment, setPreferment] = useState("solido");
  const [bizType, setBizType] = useState("pro");
  const [freezerStock, setFreezerStock] = useState([]);
  const [plan, setPlan] = useState("");
  const capoArchiveRef = useRef(null);
  const favDragMoved = useRef(false);
  const [guideId, setGuideId] = useState(null); // strumento spiegato da Mohammadreza
  const [generating, setGenerating] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickSearch, setPickSearch] = useState("");
  const [savedProducts, setSavedProducts] = useState([]);
  const [modules, setModules] = useState(DEFAULT_MODULES);
  const toggleMod = (id) => setModules((m) => ({ ...m, [id]: !m[id] }));
  const [bump, setBump] = useState(0);

  // Personalizzazione strumenti (riordina/nascondi) + tour guidato.
  const [toolPrefs, setToolPrefs] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_tool_prefs") || "{}"); } catch { return {}; } });
  const [editTools, setEditTools] = useState(false);
  const [tourForce, setTourForce] = useState(0);
  const [toolUsage, setToolUsage] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_tool_usage") || "{}"); } catch { return {}; } });
  const openToolTracked = (id) => {
    let next;
    try {
      const cur = JSON.parse(localStorage.getItem("mikilab_tool_usage") || "{}");
      next = { ...cur, [id]: (cur[id] || 0) + 1 };
      localStorage.setItem("mikilab_tool_usage", JSON.stringify(next));
    } catch { next = { ...toolUsage, [id]: (toolUsage[id] || 0) + 1 }; }
    setToolUsage(next);
    onOpenTool && onOpenTool(id);
  };
  const favTools = useMemo(() => {
    const byId = Object.fromEntries(TOOLS.map((tl) => [tl.id, tl]));
    return Object.entries(toolUsage)
      .filter(([id, c]) => byId[id] && c > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => byId[id]);
  }, [toolUsage]);
  const savePrefs = (p) => { setToolPrefs(p); try { localStorage.setItem("mikilab_tool_prefs", JSON.stringify(p)); } catch { /* */ } };
  const orderedTools = useMemo(() => {
    const order = Array.isArray(toolPrefs.order) ? toolPrefs.order : [];
    const byId = Object.fromEntries(TOOLS.map((tl) => [tl.id, tl]));
    const seen = new Set(); const list = [];
    order.forEach((id) => { if (byId[id] && !seen.has(id)) { list.push(byId[id]); seen.add(id); } });
    TOOLS.forEach((tl) => { if (!seen.has(tl.id)) list.push(tl); });
    return list;
  }, [toolPrefs]);
  const hiddenTools = new Set(toolPrefs.hidden || []);
  const visibleTools = orderedTools.filter((tl) => editTools || !hiddenTools.has(tl.id));
  const moveTool = (id, dir) => {
    const ids = orderedTools.map((tl) => tl.id);
    const i = ids.indexOf(id); const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    savePrefs({ ...toolPrefs, order: ids });
  };
  const toggleHideTool = (id) => {
    const h = new Set(toolPrefs.hidden || []);
    h.has(id) ? h.delete(id) : h.add(id);
    savePrefs({ ...toolPrefs, hidden: [...h] });
  };
  const togglePinTool = (id) => {
    const p = new Set(toolPrefs.pinned || []);
    p.has(id) ? p.delete(id) : p.add(id);
    savePrefs({ ...toolPrefs, pinned: [...p] });
  };
  const favRow = useMemo(() => {
    const byId = Object.fromEntries(TOOLS.map((tl) => [tl.id, tl]));
    const pinned = (toolPrefs.pinned || []).map((id) => byId[id]).filter(Boolean);
    const pinnedIds = new Set(pinned.map((tl) => tl.id));
    const auto = favTools.filter((tl) => !pinnedIds.has(tl.id));
    return [...pinned, ...auto].slice(0, 6).map((tl) => ({ ...tl, pinned: pinnedIds.has(tl.id) }));
  }, [toolPrefs, favTools]);

  const addRecipes = (ids) => setProducts((l) => {
    const existing = new Set(l.map((p) => p.recipe_id).filter(Boolean));
    const base = l.filter((p) => p.recipe_id || p.name || p.qty);
    const toAdd = ids.filter((id) => !existing.has(id)).map((id) => {
      const r = recipes.find((x) => x.id === id);
      return { recipe_id: id, name: r ? r.name : "", qty: "", unit: "pezzi", gpp: "", day: "", start: false };
    });
    return [...base, ...toAdd];
  });
  const removeByRecipe = (id) => setProducts((l) => { const n = l.filter((p) => p.recipe_id !== id); return n.length ? n : [{ recipe_id: "", name: "", qty: "", unit: "pezzi", gpp: "", day: "", start: false }]; });
  const restorePrevPlan = () => { if (savedProducts.length) { setProducts(savedProducts); toast.success(tri3(lang, "Ricette dell'ultimo piano ricaricate: cambia solo le quantità.", "Rezepte des letzten Plans geladen: nur Mengen anpassen.", "Last plan's recipes loaded: just adjust quantities.")); } };

  // "Ripeti questo piano" dall'archivio: ricarica impostazioni + prodotti + testo,
  // così Michele può ritoccare e rigenerare per la settimana prossima.
  const repeatArchivedPlan = (payload) => {
    const s = (payload && payload.state) || {};
    if (Array.isArray(s.products) && s.products.length) { setProducts(s.products); setSavedProducts(s.products); }
    if (typeof s.useWeekly === "boolean") setUseWeekly(s.useWeekly);
    if (s.staff !== undefined) setStaff(s.staff);
    if (s.stdTemp !== undefined) setStdTemp(s.stdTemp);
    if (s.labTemp !== undefined) setLabTemp(s.labTemp);
    if (s.startTime) setStartTime(s.startTime);
    if (s.notes !== undefined) setNotes(s.notes);
    if (s.preferment) setPreferment(s.preferment);
    if (s.bizType) setBizType(s.bizType);
    if (s.modules && typeof s.modules === "object") setModules((m) => ({ ...m, ...s.modules }));
    if (payload && payload.plan_text) { setPlan(payload.plan_text); setSavedAt(null); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        const [mk, ps, wp, st] = await Promise.all([
          recipesApi.list("mikilab"),
          recipesApi.list("personal"),
          weeklyApi.get(),
          subscriptionApi.status().catch(() => ({})),
        ]);
        let usage = {}; try { usage = JSON.parse(localStorage.getItem("mikilab_recipe_usage") || "{}"); } catch { /* */ }
        const sortFn = (a, b) => ((usage[b.id] || 0) - (usage[a.id] || 0)) || (a.name || "").localeCompare(b.name || "");
        const own = (ps || []).map((r) => ({ ...r, _own: true })).sort(sortFn);
        // Ricette MikiLab (proprietarie di Michele): visibili nel generatore SOLO all'owner/admin
        // oppure a chi le ha ACQUISTATE (acquisto singolo / panettoni / tutte). L'abbonamento al
        // Laboratorio (PRO) NON dà accesso al ricettario: gli altri usano solo le proprie ricette.
        const hasFullAccess = !!(st && st.unlock_all);
        const unlockPan = !!(st && st.unlock_panettoni);
        const unlockedIds = new Set((st && st.unlocked_recipes) || []);
        const canUseMikilab = (r) => {
          if (isAdmin) return true;
          if (hasFullAccess) return true;
          if (unlockPan && isPanettoneRecipe(r)) return true;
          return unlockedIds.has(r.id) && r.locked !== true;
        };
        const lib = (mk || []).filter(canUseMikilab).sort(sortFn);
        setRecipes([...own, ...lib]);  // le più usate in cima, ricette del panettiere prima
        if (wp && wp.items) setWeeklyItems(wp.items);
      } catch { /* */ }
      try {
        const r = await fetch(`${API}/freezer`, { credentials: "include" });
        if (r.ok) { const d = await r.json(); setFreezerStock(d.items || []); }
      } catch { /* */ }
      // Ripristina l'ULTIMO piano generato (così non si perde uscendo dal laboratorio).
      try {
        const last = await capoPlanApi.get();
        if (last && last.plan_text) {
          setPlan(last.plan_text);
          setSavedAt(last.saved_at || null);
          const s = last.state || {};
          if (Array.isArray(s.products) && s.products.length) { setProducts(s.products); setSavedProducts(s.products); }
          if (typeof s.useWeekly === "boolean") setUseWeekly(s.useWeekly);
          if (s.staff !== undefined) setStaff(s.staff);
          if (s.stdTemp !== undefined) setStdTemp(s.stdTemp);
          if (s.labTemp !== undefined) setLabTemp(s.labTemp);
          if (s.startTime) setStartTime(s.startTime);
          if (s.notes !== undefined) setNotes(s.notes);
          if (s.preferment) setPreferment(s.preferment);
          if (s.bizType) setBizType(s.bizType);
          if (s.modules && typeof s.modules === "object") setModules((m) => ({ ...m, ...s.modules }));
        }
      } catch { /* nessun piano salvato o non loggato */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bump]);

  // Sblocco immediato: dopo un acquisto ricetta ricarica ricette + stato abbonamento.
  useEffect(() => {
    const onUpd = () => setBump((n) => n + 1);
    window.addEventListener("mikilab-entitlements-updated", onUpd);
    return () => window.removeEventListener("mikilab-entitlements-updated", onUpd);
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
        items: products.map((p) => ({ recipe_id: p.recipe_id || null, name: p.name, quantity: p.qty === "" ? null : Number(p.qty), unit: p.unit, day: p.day || null, start: !!p.start })),
        mixers: modules.celle ? mixers : [], cells: modules.celle ? cells : [], mode: bizType === "casa" ? "home" : "pro", phase, use_weekly: useWeekly,
        freezer_stock: modules.freezer ? freezerStock : [],
        staff: modules.turni && staff !== "" ? Number(staff) : null,
        start_time: modules.orari ? startTime : null,
        lab_temp_c: modules.clima && labTemp !== "" ? Number(labTemp) : null,
        standard_temp_c: Number(stdTemp) || 26, notes, lang, preferment_choice: preferment,
        active_modules: Object.keys(modules).filter((k) => modules[k]),
      }),
    });
    if (!res.ok) {
      toast.error(res.status === 402 || res.status === 403 ? (lang === "de" ? "PRO erforderlich" : lang === "en" ? "PRO required" : "Serve l'abbonamento PRO") : t("chat_error"));
      return { ok: false, text: "" };
    }
    let acc = "";
    if (headerLabel) { const h = `## ${headerLabel}\n\n`; acc += h; setPlan((p) => p + (p ? "\n\n" : "") + h); }
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
        if (obj.d) { acc += obj.d; setPlan((p) => p + obj.d); }
      }
    }
    return { ok: done, text: acc };
  };

  const persistPlan = async (text) => {
    try {
      const res = await capoPlanApi.save({
        plan_text: text,
        state: { products, useWeekly, staff, stdTemp, labTemp, startTime, notes, preferment, bizType, modules },
      });
      setSavedAt(res.saved_at || new Date().toISOString());
    } catch {
      toast.warning(tri3(lang, "Piano generato ma non salvato: potrebbe perdersi uscendo.", "Plan erstellt, aber nicht gespeichert: geht beim Verlassen evtl. verloren.", "Plan generated but not saved: it may be lost when you leave."));
    }
  };

  const clearPlan = async () => {
    setPlan(""); setSavedAt(null);
    try { await capoPlanApi.clear(); } catch { /* */ }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Aggiorna da solo le giacenze freezer: scala i pezzi usati (match per nome, anche parziale).
  const updateFreezerAfterPlan = async () => {
    if (!modules.freezer) return;
    if (!freezerStock.length) return;
    const norm = (s) => (s || "").toLowerCase().trim();
    const planned = products
      .filter((p) => p.recipe_id && Number(p.qty) > 0)
      .map((p) => ({ name: norm(p.name), qty: Number(p.qty) }));
    if (!planned.length) return;
    const matchQty = (freezerName) => {
      const fn = norm(freezerName);
      let total = 0;
      planned.forEach((pl) => {
        if (!pl.name || pl.name.length < 3) return;
        const hit = fn === pl.name || (fn.length >= 4 && pl.name.length >= 4 && (fn.includes(pl.name) || pl.name.includes(fn)));
        if (hit) total += pl.qty;
      });
      return total;
    };
    const deducted = [];
    let changed = false;
    const newItems = freezerStock.map((it) => {
      const avail = Number(it.qty) || 0;
      const u = matchQty(it.name);
      if (u > 0 && avail > 0) {
        const take = Math.min(avail, u);
        if (take > 0) { changed = true; deducted.push(`${it.name} −${take}`); return { ...it, qty: avail - take }; }
      }
      return it;
    });
    if (!changed) return;
    try {
      const r = await fetch(`${API}/freezer?lang=${lang}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ items: newItems }),
      });
      if (!r.ok) throw new Error("save failed");
      setFreezerStock(newItems);
      toast.success(tri3(lang,
        `🧊 Giacenze freezer aggiornate: ${deducted.join(", ")}`,
        `🧊 Freezer-Bestand aktualisiert: ${deducted.join(", ")}`,
        `🧊 Freezer stock updated: ${deducted.join(", ")}`));
    } catch {
      toast.error(tri3(lang, "Non sono riuscito ad aggiornare le giacenze freezer.", "Freezer-Bestand konnte nicht aktualisiert werden.", "Could not update the freezer stock."));
    }
  };

  const applyBiz = (v) => {
    setBizType(v);
    if (v === "casa") {
      setPreferment("lievito_birra");
      setStdTemp(22);
      setNotes((n) => (n && n.trim() ? n : tri3(lang,
        "Impasto casalingo: piccole quantità e forno di casa. Spiega tutto passo-passo in modo semplice.",
        "Hausgemacht: kleine Mengen und Haushaltsofen. Erkläre alles einfach Schritt für Schritt.",
        "Home baking: small quantities and home oven. Explain everything simply, step by step.")));
    } else {
      setPreferment("solido");
      setStdTemp(26);
    }
  };

  const validProducts = useMemo(
    () => products.filter((p) => p.recipe_id && Number(p.qty) > 0),
    [products]
  );
  const canGenerate = validProducts.length > 0;

  const generate = async () => {
    if (!canGenerate) {
      toast.error(tri3(lang,
        "Per generare il piano inserisci almeno una ricetta con la quantità.",
        "Um den Plan zu erstellen, füge mindestens ein Rezept mit Menge hinzu.",
        "To generate the plan, add at least one recipe with a quantity."));
      return;
    }
    setGenerating(true); setPlan(""); setSavedAt(null);
    const twoPhase = useWeekly || products.some((p) => p.day);
    try {
      let ok = true;
      let fullText = "";
      if (twoPhase) {
        const r1 = await streamPhase("weekly", t("capo_phase_weekly"));
        const r2 = await streamPhase("daily", t("capo_phase_daily"));
        ok = r1.ok && r2.ok;
        fullText = [r1.text, r2.text].filter(Boolean).join("\n\n");
      } else {
        const r1 = await streamPhase("daily", null);
        ok = r1.ok;
        fullText = r1.text;
      }
      if (!ok) toast.warning(t("capo_plan_incomplete"));
      else fireHighFive(lang === "de" ? "Plan erstellt! 👏" : lang === "en" ? "Plan generated! 👏" : "Piano generato! 👏");
      if (fullText.trim()) { await persistPlan(fullText); await updateFreezerAfterPlan();
        try { const u = JSON.parse(localStorage.getItem("mikilab_recipe_usage") || "{}"); products.forEach((p) => { if (p.recipe_id && Number(p.qty) > 0) u[p.recipe_id] = (u[p.recipe_id] || 0) + 1; }); localStorage.setItem("mikilab_recipe_usage", JSON.stringify(u)); } catch { /* */ }
      }
    } catch { toast.error(t("chat_error")); }
    finally { setGenerating(false); }
  };

  return (
    <div className="pb-40">
      {onOpenTool && <LabTour force={tourForce} onClose={() => setTourForce(0)} storageKey="mikilab_lab_tour_v1"
        labels={{ skip: tri3(lang, "Salta", "Überspringen", "Skip"), next: tri3(lang, "Avanti", "Weiter", "Next"), done: tri3(lang, "Ho capito!", "Verstanden!", "Got it!") }}
        steps={[
          { target: null, title: tri3(lang, "Ciao, sono Mohammadreza 👋", "Hallo, ich bin Mohammadreza 👋", "Hi, I'm Mohammadreza 👋"),
            body: tri3(lang, "Ti mostro in 3 passi come creare il tuo primo Piano di Produzione. Meno di un minuto!", "In 3 Schritten zeige ich dir deinen ersten Produktionsplan. Weniger als eine Minute!", "I'll show you in 3 steps how to create your first Production Plan. Under a minute!") },
          { target: "capo-source-choice", title: tri3(lang, "1 · Scegli le ricette", "1 · Rezepte wählen", "1 · Pick the recipes"),
            body: tri3(lang, "Tocca «Scegli ricette ora» e aggiungi almeno una ricetta con la quantità. È l'unica cosa davvero obbligatoria.", "Tippe auf „Rezepte jetzt wählen“ und füge mind. ein Rezept mit Menge hinzu. Das ist das Einzige, was Pflicht ist.", "Tap 'Pick recipes now' and add at least one recipe with a quantity. That's the only required thing.") },
          { target: "capo-modules", title: tri3(lang, "2 · Accendi gli extra (facoltativo)", "2 · Extras aktivieren (optional)", "2 · Turn on extras (optional)"),
            body: tri3(lang, "Con gli interruttori ON/OFF aggiungi solo ciò che ti serve: orari, freezer, costi… Tocca la «i» e ti spiego ognuno.", "Mit den ON/OFF-Schaltern fügst du nur hinzu, was du brauchst. Tippe auf „i“ für Erklärungen.", "With the ON/OFF switches add only what you need. Tap the 'i' for an explanation of each.") },
          { target: "capo-generate", title: tri3(lang, "3 · Genera il piano", "3 · Plan erstellen", "3 · Generate the plan"),
            body: tri3(lang, "Premi «Genera il piano»: creo la sequenza degli impasti, gli orari e la lista. Poi puoi stamparlo o salvarlo.", "Drücke „Plan erstellen“: ich erstelle Teig-Reihenfolge, Zeiten und Liste. Danach drucken oder speichern.", "Press 'Generate the plan': I build the dough sequence, times and list. Then print or save it.") },
        ]} />}
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#4A7265] to-[#33564E] p-6 text-white">
        <div className="it-de-ribbon absolute top-0 left-0 right-0" />
        <Sparkles className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{lang === "de" ? "Produktionsplan mit KI" : lang === "en" ? "AI Production Plan" : "Piano di Produzione con IA"}</h1>
        <p className="text-white/85 text-sm mt-1">{lang === "de" ? "Fülle die Daten aus und lass den Plan generieren" : lang === "en" ? "Fill in the data and generate the plan" : "Compila i dati e genera il tuo piano di lavoro"}</p>
      </div>

      {onOpenTool && (
        <div data-testid="capo-quicklinks" className="mb-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#33564E] dark:text-[#9ec48f] mb-0.5">
              {tri3(lang, "INIZIA", "START", "START")}
            </p>
            <button data-testid="lab-tour-replay" onClick={() => setTourForce((n) => n + 1)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5E8B7E] px-2.5 py-1 rounded-full border border-[#D7E1DB] dark:border-[#38424B] bg-white dark:bg-[#232A31] active:scale-95 transition-all">
              <HelpCircle className="w-3.5 h-3.5" /> {tri3(lang, "Come si fa?", "Wie geht's?", "How to?")}
            </button>
          </div>
          <p className="text-[10.5px] text-[#7E8A93] mb-2">{tri3(lang, "Passi base per generare il piano", "Basisschritte für den Plan", "Base steps to generate the plan")}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "aggiungi", Icon: BookOpen, label: tri3(lang, "Inserisci Ricette", "Rezepte hinzufügen", "Add Recipes") },
              { id: "lavoro", Icon: ChefHat, label: tri3(lang, "Piano Giornaliero", "Tagesplan", "Daily Plan") },
              { id: "settimana", Icon: CalendarDays, label: tri3(lang, "Produzione Settimanale", "Wochenproduktion", "Weekly Production") },
              { id: "enterprise", Icon: Building2, label: tri3(lang, "Multi-negozio", "Multi-Filiale", "Multi-store") },
              { id: "dayclose", Icon: CheckCircle2, label: tri3(lang, "Concludi Giornata", "Tag abschließen", "Close the Day") },
            ].map(({ id, Icon, label }) => (
              <button key={id} data-testid={`capo-quicklink-${id}`} onClick={() => onOpenTool(id)}
                className="flex items-center gap-2 bg-gradient-to-br from-[#5E8B7E] to-[#33564E] text-white rounded-2xl p-3 text-left active:scale-95 transition-all shadow-sm">
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[12px] font-bold leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(mixers.length === 0 || cells.length === 0) && modules.celle && (
        <div data-testid="capo-setup-hint" className="mb-4 rounded-2xl bg-[#C88A2B]/12 border border-[#C88A2B]/35 p-3.5">
          <p className="text-sm text-[#33564E] dark:text-[#8FB0C2] leading-snug">
            {(() => {
              const miss = [];
              if (mixers.length === 0) miss.push(tri3(lang, "impastatrici", "Kneter", "mixers"));
              if (cells.length === 0) miss.push(tri3(lang, "celle di lievitazione/frigo/freezer", "Kammern (Gär/Kühl/Gefrier)", "proofing/fridge/freezer cells"));
              const list = miss.join(tri3(lang, " e ", " und ", " and "));
              return tri3(lang,
                `💡 Consigliato (non obbligatorio): aggiungi ${list} da «Celle Frigo & Freezer». Con questi dati l'IA genera un piano molto più preciso (portate macchine, destinazioni celle, tempi).`,
                `💡 Empfohlen (nicht Pflicht): füge ${list} über „Kammern & Gefrier" hinzu. Damit erstellt die KI einen viel präziseren Plan (Maschinen, Kammern, Zeiten).`,
                `💡 Recommended (not required): add ${list} via "Cells & Freezer". With this data the AI makes a much more precise plan (machine loads, cell destinations, timing).`);
            })()}
          </p>
          {onOpenTool && (
            <button data-testid="capo-setup-hint-btn" onClick={() => onOpenTool("capo")}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#C88A2B] hover:bg-[#b3781f] px-3 py-1.5 rounded-lg active:scale-95 transition-all">
              <Snowflake className="w-3.5 h-3.5" /> {tri3(lang, "Configura ora", "Jetzt einrichten", "Set up now")}
            </button>
          )}
        </div>
      )}

      <Section icon={<SlidersHorizontal className="w-4 h-4" />} title={tri3(lang, "SCEGLI ANCHE (interruttori del piano)", "AUCH WÄHLEN (Plan-Schalter)", "ALSO CHOOSE (plan switches)")}>
        <div data-testid="capo-modules-hint" className="mb-3 flex items-center gap-2 rounded-xl bg-[#C88A2B]/15 border border-[#C88A2B]/45 px-3 py-2.5">
          <SlidersHorizontal className="w-4 h-4 text-[#A66A15] shrink-0" />
          <p className="text-[12px] font-bold text-[#7a4e12] dark:text-[#E4C98B] leading-snug">
            {tri3(lang,
              "👆 Interruttori ON/OFF: accendi solo ciò che vuoi nel piano. Tocca la «i» e Mohammadreza ti spiega cosa fa. Il piano base (ricette + quantità) si genera comunque.",
              "👆 ON/OFF-Schalter: aktiviere nur, was du im Plan willst. Tippe auf „i“ und Mohammadreza erklärt es. Der Basisplan (Rezepte + Mengen) wird trotzdem erstellt.",
              "👆 ON/OFF switches: turn on only what you want in the plan. Tap the 'i' and Mohammadreza explains it. The base plan (recipes + quantities) is generated anyway.")}
          </p>
        </div>

        {/* Mohammadreza spiega l'interruttore o lo strumento al tocco della "i" */}
        {guideId && (
          <div data-testid="tool-guide-bubble" className="mb-3 flex items-start gap-2.5 rounded-2xl bg-gradient-to-br from-[#2D5A4C] to-[#5E8B7E] text-white p-3 shadow-md">
            <img src={`${process.env.PUBLIC_URL}/mohammed-avatar.jpg`} alt="Mohammadreza" className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/60 shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">Mohammadreza</p>
              <p className="text-sm leading-snug mt-0.5">{guideFor(guideId, lang)}</p>
              <div className="flex gap-2 mt-2">
                <button data-testid="tool-guide-open" onClick={() => { const g = MODULE_TOOL[guideId] || guideId; setGuideId(null); onOpenTool && onOpenTool(g); }}
                  className="text-xs font-bold bg-white text-[#2D5A4C] px-3 py-1.5 rounded-lg active:scale-95">{tri3(lang, "Apri strumento", "Werkzeug öffnen", "Open tool")}</button>
                <button data-testid="tool-guide-close" onClick={() => setGuideId(null)}
                  className="text-xs font-semibold bg-white/15 text-white px-3 py-1.5 rounded-lg active:scale-95">{tri3(lang, "Chiudi", "Schließen", "Close")}</button>
              </div>
            </div>
          </div>
        )}

        <div data-testid="capo-modules" className="grid grid-cols-3 gap-2">
          {MODULES.map(({ id, Icon, it, de, en }) => {
            const on = !!modules[id];
            return (
              <div key={id} data-testid={`capo-module-${id}`} aria-pressed={on} onClick={() => toggleMod(id)}
                className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl p-3 pt-5 text-center transition-all active:scale-95 border min-h-[82px] cursor-pointer ${
                  on
                    ? "bg-[#5E8B7E] text-white border-[#5E8B7E] shadow-sm"
                    : "bg-white dark:bg-[#232A31] text-[#7E8A93] border-[#D7E1DB] dark:border-[#38424B]"}`}>
                <span className={`absolute top-1.5 left-1.5 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full ${on ? "bg-white/25 text-white" : "bg-[#EAF0EC] dark:bg-[#2A323A] text-[#9aa4ac]"}`}>{on ? "ON" : "OFF"}</span>
                <button type="button" data-testid={`tool-info-${id}`} aria-label="info"
                  onClick={(e) => { e.stopPropagation(); setGuideId(id); }}
                  className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center active:scale-90 ${on ? "bg-white/25 text-white" : "bg-[#5E8B7E]/12 text-[#5E8B7E]"}`}>
                  <Info className="w-3.5 h-3.5" />
                </button>
                <Icon className={`w-5 h-5 ${on ? "text-white" : "text-[#9aa4ac]"}`} />
                <span className="text-[10.5px] font-semibold leading-tight">{tri3(lang, it, de, en)}</span>
              </div>
            );
          })}
        </div>

        {onOpenTool && (
          <>
            <div className="mt-4 mb-2 h-px bg-[#D7E1DB] dark:bg-[#38424B]" />
            {!editTools && (() => {
              const discovered = TOOLS.filter((t) => toolUsage[t.id]).length;
              const total = TOOLS.length;
              const pct = Math.round((discovered / total) * 100);
              const done = discovered >= total;
              return (
                <div data-testid="tools-discovery" className={`mb-3 rounded-2xl border p-3 ${done ? "bg-[#5E8B7E]/10 border-[#5E8B7E]/40" : "bg-[#C88A2B]/10 border-[#C88A2B]/40"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[12px] font-bold text-[#2B303B] dark:text-[#EAF0EC]">
                      {done
                        ? tri3(lang, "🎉 Hai scoperto tutti gli strumenti!", "🎉 Du hast alle Werkzeuge entdeckt!", "🎉 You've discovered every tool!")
                        : tri3(lang, `Hai scoperto ${discovered}/${total} strumenti`, `Du hast ${discovered}/${total} Werkzeuge entdeckt`, `You've discovered ${discovered}/${total} tools`)}
                    </p>
                    <span data-testid="tools-discovery-pct" className={`text-[12px] font-extrabold ${done ? "text-[#4C7368]" : "text-[#A66A15]"}`}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${done ? "bg-[#5E8B7E]" : "bg-[#C88A2B]"}`} style={{ width: `${pct}%` }} />
                  </div>
                  {!done && (
                    <p className="text-[10.5px] text-[#7E8A93] mt-1.5">{tri3(lang, `Apri quelli con il pallino «NUOVO»: ne restano ${total - discovered}.`, `Öffne die mit „NEU“: noch ${total - discovered} übrig.`, `Open the ones marked 'NEW': ${total - discovered} left.`)}</p>
                  )}
                </div>
              );
            })()}
            {favRow.length > 0 && !editTools && (() => {
              const pinnedIds = (toolPrefs.pinned || []).filter((id) => TOOLS.some((t) => t.id === id));
              const byId = Object.fromEntries(TOOLS.map((t) => [t.id, t]));
              const pinnedFavs = pinnedIds.map((id) => byId[id]).filter(Boolean);
              const autoFavs = favRow.filter((t) => !t.pinned);
              return (
                <div data-testid="tools-favorites" className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#C88A2B] mb-1.5">⭐ {tri3(lang, "I TUOI PREFERITI", "DEINE FAVORITEN", "YOUR FAVORITES")}{pinnedFavs.length > 1 ? ` · ${tri3(lang, "trascina per ordinare", "zum Sortieren ziehen", "drag to reorder")}` : ""}</p>
                  {pinnedFavs.length > 0 && (
                    <Reorder.Group as="div" axis="x" values={pinnedIds} onReorder={(ids) => savePrefs({ ...toolPrefs, pinned: ids })}
                      className="flex gap-2 overflow-x-auto pb-1 mb-2" style={{ scrollbarWidth: "none" }}>
                      {pinnedFavs.map(({ id, Icon, it, de, en }) => (
                        <Reorder.Item as="div" key={id} value={id} data-testid={`fav-tool-${id}`}
                          whileDrag={{ scale: 1.07, zIndex: 5 }}
                          onDragStart={() => { favDragMoved.current = true; }}
                          onClick={() => { if (favDragMoved.current) { favDragMoved.current = false; return; } openToolTracked(id); }}
                          className="relative shrink-0 w-[104px] flex flex-col items-center justify-center gap-1.5 bg-[#C88A2B]/12 border border-[#C88A2B]/50 rounded-2xl p-3 min-h-[70px] cursor-grab active:cursor-grabbing select-none">
                          <Star className="absolute top-1 right-1 w-3.5 h-3.5 text-[#C88A2B] fill-[#C88A2B]" />
                          <Icon className="w-5 h-5 text-[#C88A2B]" />
                          <span className="text-[11px] font-semibold leading-tight text-[#2B303B] dark:text-[#EAF0EC] text-center">{tri3(lang, it, de, en)}</span>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  )}
                  {autoFavs.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {autoFavs.map(({ id, Icon, it, de, en }) => (
                        <div key={id} data-testid={`fav-tool-${id}`} onClick={() => openToolTracked(id)}
                          className="relative flex flex-col items-center justify-center gap-1.5 bg-[#C88A2B]/10 border border-[#C88A2B]/40 rounded-2xl p-3 text-center active:scale-95 hover:border-[#C88A2B]/70 transition-all min-h-[70px] cursor-pointer">
                          <Icon className="w-5 h-5 text-[#C88A2B]" />
                          <span className="text-[11px] font-semibold leading-tight text-[#2B303B] dark:text-[#EAF0EC]">{tri3(lang, it, de, en)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#33564E] dark:text-[#9ec48f]">
                {tri3(lang, "APRI UNO STRUMENTO", "WERKZEUG ÖFFNEN", "OPEN A TOOL")}
              </p>
              <button data-testid="tools-edit-toggle" onClick={() => setEditTools((v) => !v)}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border active:scale-95 transition-all ${editTools ? "bg-[#5E8B7E] text-white border-[#5E8B7E]" : "bg-white dark:bg-[#232A31] text-[#5E8B7E] border-[#D7E1DB] dark:border-[#38424B]"}`}>
                <Settings2 className="w-3.5 h-3.5" /> {editTools ? tri3(lang, "Fatto", "Fertig", "Done") : tri3(lang, "Personalizza", "Anpassen", "Customize")}
              </button>
            </div>
            <p className="text-[10.5px] text-[#7E8A93] mb-2">
              {editTools
                ? tri3(lang, "Occhio = nascondi · stella = preferito · frecce = riordina.", "Auge = ausblenden · Stern = Favorit · Pfeile = sortieren.", "Eye = hide · star = favorite · arrows = reorder.")
                : tri3(lang, "Tocca per aprirlo e usarlo. La «i» ti spiega a cosa serve.", "Tippe zum Öffnen und Nutzen. Die „i“ erklärt den Zweck.", "Tap to open and use it. The 'i' explains what it's for.")}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {visibleTools.map(({ id, Icon, it, de, en }) => {
                const label = tri3(lang, it, de, en);
                const isHidden = hiddenTools.has(id);
                return (
                  <div key={id} data-testid={`capo-quicklink-${id}`} onClick={() => { if (!editTools) openToolTracked(id); }}
                    className={`relative flex flex-col items-center justify-center gap-1.5 bg-white dark:bg-[#232A31] border rounded-2xl p-3 pt-4 text-center transition-all min-h-[70px] ${editTools ? "cursor-default border-dashed border-[#5E8B7E]/50" : "cursor-pointer border-[#D7E1DB] dark:border-[#38424B] active:scale-95 hover:border-[#5E8B7E]/60"} ${isHidden ? "opacity-40" : ""}`}>
                    {editTools ? (
                      <>
                        <div className="absolute top-1 left-1 flex gap-0.5">
                          <button type="button" data-testid={`tool-hide-${id}`} aria-label="hide" onClick={(e) => { e.stopPropagation(); toggleHideTool(id); }}
                            className="w-6 h-6 rounded-full bg-[#EAF0EC] dark:bg-[#2A323A] flex items-center justify-center text-[#5E8B7E] active:scale-90">
                            {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button type="button" data-testid={`tool-pin-${id}`} aria-label="pin" onClick={(e) => { e.stopPropagation(); togglePinTool(id); }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center active:scale-90 ${(toolPrefs.pinned || []).includes(id) ? "bg-[#C88A2B] text-white" : "bg-[#EAF0EC] dark:bg-[#2A323A] text-[#C88A2B]"}`}>
                            <Star className={`w-3.5 h-3.5 ${(toolPrefs.pinned || []).includes(id) ? "fill-white" : ""}`} />
                          </button>
                        </div>
                        <div className="absolute top-1 right-1 flex flex-col">
                          <button type="button" data-testid={`tool-up-${id}`} aria-label="up" onClick={(e) => { e.stopPropagation(); moveTool(id, -1); }} className="w-6 h-4 flex items-center justify-center text-[#7E8A93] active:scale-90"><ChevronUp className="w-3.5 h-3.5" /></button>
                          <button type="button" data-testid={`tool-down-${id}`} aria-label="down" onClick={(e) => { e.stopPropagation(); moveTool(id, 1); }} className="w-6 h-4 flex items-center justify-center text-[#7E8A93] active:scale-90"><ChevronDown className="w-3.5 h-3.5" /></button>
                        </div>
                      </>
                    ) : (
                      <>
                        {!toolUsage[id] && (
                          <span data-testid={`tool-new-${id}`} className="absolute top-1 left-1 flex items-center gap-1 text-[8px] font-extrabold uppercase text-white bg-[#C0574D] px-1.5 py-0.5 rounded-full shadow">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />{tri3(lang, "NUOVO", "NEU", "NEW")}
                          </span>
                        )}
                        {guideFor(id, lang) && (
                          <button type="button" data-testid={`tool-info-${id}`} aria-label="info"
                            onClick={(e) => { e.stopPropagation(); setGuideId(id); }}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#5E8B7E]/12 flex items-center justify-center text-[#5E8B7E] active:scale-90">
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                    <Icon className="w-5 h-5 text-[#5E8B7E]" />
                    <span className="text-[11px] font-semibold leading-tight text-[#2B303B] dark:text-[#EAF0EC]">{label}</span>
                  </div>
                );
              })}
            </div>
            {!editTools && hiddenTools.size > 0 && (
              <p data-testid="tools-hidden-note" className="text-[10.5px] text-[#7E8A93] mt-2">
                {tri3(lang, `${hiddenTools.size} strumenti nascosti · tocca «Personalizza» per rivederli.`, `${hiddenTools.size} Werkzeuge ausgeblendet · „Anpassen“ zum Anzeigen.`, `${hiddenTools.size} tools hidden · tap 'Customize' to show them.`)}
              </p>
            )}
          </>
        )}
      </Section>

      <Section icon={<Sparkles className="w-4 h-4" />} title={tri3(lang, "Compila per generare", "Zum Generieren ausfüllen", "Fill in to generate")}>
        <div data-testid="capo-source-choice" className="grid grid-cols-2 gap-2 mb-3">
            <button data-testid="capo-source-weekly" onClick={() => setUseWeekly(true)}
              className={`rounded-2xl p-3 text-left border-2 transition-all active:scale-97 ${useWeekly ? "bg-[#5E8B7E] text-white border-[#5E8B7E]" : "bg-white dark:bg-[#232A31] text-[#33564E] dark:text-[#9ec48f] border-[#D7E1DB] dark:border-[#38424B]"}`}>
              <CalendarDays className="w-5 h-5 mb-1" />
              <p className="text-[13px] font-bold leading-tight">{tri3(lang, "Piano Settimanale", "Wochenplan", "Weekly Plan")}</p>
              <p className={`text-[10.5px] leading-snug ${useWeekly ? "text-white/85" : "text-[#7E8A93]"}`}>{tri3(lang, "Usa quello inserito (modificabile)", "Bereits erfasst (änderbar)", "Use what you entered (editable)")}</p>
            </button>
            <button data-testid="capo-source-manual" onClick={() => setUseWeekly(false)}
              className={`rounded-2xl p-3 text-left border-2 transition-all active:scale-97 ${!useWeekly ? "bg-[#5E8B7E] text-white border-[#5E8B7E]" : "bg-white dark:bg-[#232A31] text-[#33564E] dark:text-[#9ec48f] border-[#D7E1DB] dark:border-[#38424B]"}`}>
              <ChefHat className="w-5 h-5 mb-1" />
              <p className="text-[13px] font-bold leading-tight">{tri3(lang, "Scegli ricette ora", "Rezepte jetzt wählen", "Pick recipes now")}</p>
              <p className={`text-[10.5px] leading-snug ${!useWeekly ? "text-white/85" : "text-[#7E8A93]"}`}>{tri3(lang, "Inserisci prodotti a mano", "Produkte manuell", "Add products manually")}</p>
            </button>
        </div>
        {useWeekly && weeklyItems.length === 0 && (
          <div data-testid="capo-weekly-empty" className="mb-3 rounded-xl bg-[#C88A2B]/12 border border-[#C88A2B]/40 px-3 py-2.5">
            <p className="text-[12px] text-[#7a4e12] dark:text-[#E4C98B] leading-snug mb-2">
              {tri3(lang,
                "Non hai ancora un Piano Settimanale. Creane uno per generare da lì (potrai modificarlo quando vuoi).",
                "Du hast noch keinen Wochenplan. Erstelle einen, um daraus zu generieren (jederzeit änderbar).",
                "You don't have a Weekly Plan yet. Create one to generate from it (editable anytime).")}
            </p>
            {onOpenTool && (
              <button data-testid="capo-weekly-create" onClick={() => onOpenTool("settimana")}
                className="w-full flex items-center justify-center gap-2 bg-[#C88A2B] text-white font-bold py-2 rounded-xl active:scale-98 transition-all text-sm">
                <CalendarDays className="w-4 h-4" /> {tri3(lang, "Apri Produzione Settimanale", "Wochenproduktion öffnen", "Open Weekly Production")}
              </button>
            )}
          </div>
        )}
        {useWeekly && weeklyItems.length > 0 && (
          <div data-testid="capo-weekly-note" className="mb-3 rounded-xl bg-[#6E8CA0]/12 border border-[#6E8CA0]/35 px-3 py-2.5 flex items-start gap-2">
            <CalendarDays className="w-4 h-4 text-[#33564E] dark:text-[#8FB0C2] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#33564E] dark:text-[#8FB0C2] leading-snug">
              {tri3(lang,
                `Genero dal Piano Settimanale (${weeklyItems.length} voci). Per cambiare quantità o giorni apri «Produzione Settimanale». Puoi scegliere l'impasto di partenza qui sotto.`,
                `Ich generiere aus dem Wochenplan (${weeklyItems.length} Einträge). Zum Ändern öffne „Wochenproduktion". Den Start-Teig kannst du unten wählen.`,
                `Generating from the Weekly Plan (${weeklyItems.length} items). To change quantities/days open 'Weekly Production'. You can pick the starting dough below.`)}
            </p>
          </div>
        )}
        <div className={`space-y-2 ${useWeekly ? "hidden" : ""}`} data-testid="capo-products">
          {products.map((p, i) => (
            <div key={i} className="bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <select data-testid={`capo-product-recipe-${i}`} value={p.recipe_id || ""}
                  onChange={(e) => { const r = recipes.find((x) => x.id === e.target.value); setProducts((l) => l.map((x, k) => k === i ? { ...x, recipe_id: e.target.value, name: r ? r.name : x.name } : x)); }}
                  className="flex-1 min-w-0 bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#5E8B7E]">
                  <option value="">{t("capo_pick_recipe")}</option>
                  {recipes.some((r) => r._own) && (
                    <optgroup label={tri3(lang, "Le mie ricette (panettiere)", "Meine Rezepte", "My recipes")}>
                      {recipes.filter((r) => r._own).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </optgroup>
                  )}
                  {recipes.some((r) => !r._own) && (
                    <optgroup label={tri3(lang, "Ricette MikiLab", "MikiLab-Rezepte", "MikiLab recipes")}>
                      {recipes.filter((r) => !r._own).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </optgroup>
                  )}
                </select>
                <button onClick={() => setProducts((l) => l.filter((_, k) => k !== i))} className="text-[#C0574D] p-1 shrink-0"><X className="w-4 h-4" /></button>
              </div>
              {p.recipe_id && (
                <button type="button" data-testid={`capo-product-start-${i}`}
                  onClick={() => setProducts((l) => l.map((x, k) => ({ ...x, start: k === i ? !x.start : false })))}
                  className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg border transition-all active:scale-97 ${
                    p.start
                      ? "bg-[#A64B2A] text-white border-[#A64B2A]"
                      : "bg-white dark:bg-[#232A31] text-[#7E8A93] border-[#D7E1DB] dark:border-[#38424B]"}`}>
                  <Flag className="w-3.5 h-3.5" />
                  {p.start
                    ? tri3(lang, "Impasto di partenza", "Start-Teig", "Starting dough")
                    : tri3(lang, "Parti da qui", "Hier starten", "Start here")}
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input data-testid={`capo-product-qty-${i}`} type="number" value={p.qty} placeholder={tri3(lang, "Quantità", "Menge", "Quantity")}
                    onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, qty: e.target.value } : x))}
                    className="w-full bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 pr-12 text-sm outline-none focus:border-[#5E8B7E]" />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#7E8A93]">{p.unit === "kg" ? "kg" : t("capo_unit_pieces")}</span>
                </div>
                <button type="button" data-testid={`capo-product-opts-${i}`}
                  onClick={() => setProducts((l) => l.map((x, k) => k === i ? { ...x, _opts: !x._opts } : x))}
                  className="shrink-0 text-xs font-semibold text-[#5E8B7E] px-2.5 py-2 rounded-lg border border-[#D7E1DB] dark:border-[#38424B] active:scale-95 transition-all">
                  {p._opts ? tri3(lang, "Meno", "Weniger", "Less") : tri3(lang, "Opzioni", "Optionen", "Options")}
                </button>
              </div>
              {p._opts && (
                <div className="flex items-center gap-2 flex-wrap">
                  <select data-testid={`capo-product-unit-${i}`} value={p.unit}
                    onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, unit: e.target.value } : x))}
                    className="w-[80px] shrink-0 bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#5E8B7E]">
                    <option value="pezzi">{t("capo_unit_pieces")}</option>
                    <option value="kg">{t("capo_unit_kg")}</option>
                  </select>
                  {p.unit === "pezzi" && (
                    <div className="relative w-[80px] shrink-0">
                      <input data-testid={`capo-product-gpp-${i}`} type="number" value={p.gpp ?? ""} placeholder="g/pz"
                        onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, gpp: e.target.value } : x))}
                        className="w-full bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 pr-6 text-sm outline-none focus:border-[#5E8B7E]" />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[#7E8A93]">g</span>
                    </div>
                  )}
                  <select data-testid={`capo-product-day-${i}`} value={p.day || ""}
                    onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, day: e.target.value } : x))}
                    className="flex-1 min-w-[110px] bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#5E8B7E]">
                    {DAYS.map((d) => <option key={d} value={d}>{d === "" ? t("capo_day_any") : t(`day_${d}`)}</option>)}
                  </select>
                </div>
              )}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <button data-testid="capo-product-add" onClick={() => setProducts((l) => [...l, { recipe_id: "", name: "", qty: "", unit: "pezzi", gpp: "", day: "", start: false }])} className="text-sm font-medium text-[#5E8B7E] flex items-center gap-1"><Plus className="w-4 h-4" /> {t("capo_add_product")}</button>
            <button data-testid="capo-open-picker" onClick={() => { setPickSearch(""); setPickerOpen(true); }} className="text-sm font-semibold text-white bg-[#5E8B7E] px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95"><ChefHat className="w-4 h-4" /> {tri3(lang, "Aggiungi ricette", "Rezepte hinzufügen", "Add recipes")}</button>
            {savedProducts.length > 0 && (
              <button data-testid="capo-restore-prev" onClick={restorePrevPlan} className="text-sm font-semibold text-[#33564E] dark:text-[#9ec48f] bg-[#6B8E62]/12 border border-[#6B8E62]/30 px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95"><RotateCcw className="w-3.5 h-3.5" /> {tri3(lang, "Riparti dall'ultimo piano", "Vom letzten Plan starten", "Reuse last plan")}</button>
            )}
          </div>
          <p className="text-[11px] text-[#7E8A93] leading-snug mt-1.5 flex items-start gap-1">
            <Flag className="w-3.5 h-3.5 text-[#A64B2A] shrink-0 mt-0.5" />
            {tri3(lang, "Scegli tu l'impasto da cui partire: tocca «Parti da qui». L'IA organizzerà la sequenza iniziando da quello.",
              "Wähle den Start-Teig: tippe auf „Hier starten“. Die KI ordnet die Reihenfolge ab diesem Teig.",
              "Choose the dough to start from: tap 'Start here'. The AI will sequence the work starting from it.")}
          </p>
          {!isAdmin && !recipes.some((r) => !r._own) && (
            <div data-testid="capo-mikilab-buy-hint" className="mt-2 rounded-xl border border-[#C88A2B]/40 bg-[#C88A2B]/10 p-3 flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-[#C88A2B] shrink-0 mt-0.5" />
              <p className="text-xs text-[#5b4a2a] dark:text-[#E4C98B] leading-snug">
                {tri3(lang,
                  "Qui usi le TUE ricette (scansionate o scritte a mano). Vuoi usare anche le ricette di MikiLab nel piano? Acquistale nella sezione «Ricette» e compariranno qui.",
                  "Hier verwendest du DEINE Rezepte (gescannt oder handschriftlich). Möchtest du auch MikiLab-Rezepte im Plan nutzen? Kaufe sie im Bereich „Rezepte“, dann erscheinen sie hier.",
                  "Here you use YOUR recipes (scanned or handwritten). Want to use MikiLab recipes in the plan too? Buy them in the 'Recipes' section and they'll appear here.")}
              </p>
            </div>
          )}
        </div>

        {pickerOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setPickerOpen(false)}>
            <div className="bg-white dark:bg-[#1B2127] w-full sm:max-w-md max-h-[82vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-[#D7E1DB] dark:border-[#38424B]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#EAF0EC]">{tri3(lang, "Aggiungi ricette", "Rezepte hinzufügen", "Add recipes")}</h3>
                  <button data-testid="capo-picker-close" onClick={() => setPickerOpen(false)} className="text-[#7E8A93] p-1"><X className="w-5 h-5" /></button>
                </div>
                <input data-testid="capo-picker-search" value={pickSearch} onChange={(e) => setPickSearch(e.target.value)} autoFocus
                  placeholder={tri3(lang, "Cerca ricetta…", "Rezept suchen…", "Search recipe…")}
                  className="w-full bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl p-2.5 text-sm outline-none focus:border-[#5E8B7E]" />
              </div>
              <div className="overflow-y-auto p-2 flex-1">
                {recipes.filter((r) => (r.name || "").toLowerCase().includes(pickSearch.toLowerCase())).map((r) => {
                  const sel = products.some((p) => p.recipe_id === r.id);
                  return (
                    <button key={r.id} data-testid={`capo-pick-${r.id}`} onClick={() => (sel ? removeByRecipe(r.id) : addRecipes([r.id]))}
                      className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left mb-1 transition-all ${sel ? "bg-[#5E8B7E]/12 border border-[#5E8B7E]/40" : "hover:bg-[#EAF0EC] dark:hover:bg-[#2A323A] border border-transparent"}`}>
                      {sel ? <CheckCircle2 className="w-5 h-5 text-[#5E8B7E] shrink-0" /> : <span className="w-5 h-5 rounded-full border-2 border-[#D7E1DB] dark:border-[#4a5560] shrink-0" />}
                      <span className="flex-1 min-w-0 text-sm text-[#2B303B] dark:text-[#EAF0EC] truncate">{r.name}</span>
                      {r._own && <span className="text-[10px] text-[#C88A2B]">★</span>}
                    </button>
                  );
                })}
              </div>
              <div className="p-3 border-t border-[#D7E1DB] dark:border-[#38424B]">
                <button data-testid="capo-picker-done" onClick={() => setPickerOpen(false)} className="w-full bg-[#5E8B7E] text-white font-semibold py-2.5 rounded-xl active:scale-98">
                  {tri3(lang, "Fatto", "Fertig", "Done")} ({products.filter((p) => p.recipe_id).length})
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          {modules.orari && <LabelInput testid="capo-start-time" label={t("capo_start_time")} type="time" value={startTime} onChange={setStartTime} />}
          {modules.clima && <LabelInput testid="capo-lab-temp" label={t("capo_lab_temp")} type="number" value={labTemp} onChange={setLabTemp} unit="°C" />}
          {modules.turni && <LabelInput testid="capo-staff" label={tri3(lang, "Personale in turno oggi", "Personal heute", "Staff on shift today")} type="number" value={staff} onChange={setStaff} />}
          {modules.clima && <LabelInput testid="capo-std-temp" label={tri3(lang, "Temp. standard laboratorio", "Standardtemperatur", "Standard lab temp")} type="number" value={stdTemp} onChange={setStdTemp} unit="°C" />}
        </div>
        {modules.clima && tempMsg && (
          <div data-testid="capo-temp-msg" className={`mt-2 text-sm rounded-xl px-3 py-2 border ${tempDelta && Math.abs(tempDelta) >= 1 ? "bg-[#6E8CA0]/15 border-[#6E8CA0]/40 text-[#33564E] dark:text-[#8FB0C2]" : "bg-[#6B8E62]/12 border-[#6B8E62]/30 text-[#4d6b45] dark:text-[#9ec48f]"}`}>
            <Thermometer className="w-4 h-4 inline mr-1" />{tempMsg}
          </div>
        )}
        <div className="mt-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{lang === "de" ? "Triebmittel / Vorteig" : lang === "en" ? "Leaven / Preferment" : "Lievito / Prefermento"}</label>
          <select data-testid="capo-preferment" value={preferment} onChange={(e) => setPreferment(e.target.value)}
            className="mt-1 w-full bg-white dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl p-3 text-sm outline-none focus:border-[#5E8B7E]">
            <option value="solido">{lang === "de" ? "Fester Lievito Madre" : lang === "en" ? "Solid sourdough" : "Lievito Madre solido"}</option>
            <option value="licoli">{lang === "de" ? "LiCoLi (Flüssighefe)" : lang === "en" ? "LiCoLi (liquid starter)" : "LiCoLi (lievito in coltura liquida)"}</option>
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

        {modules.foodcost && (() => {
          const num = (x) => Number(x) || 0;
          const rows = products.map((p) => {
            if (!p.recipe_id || !(num(p.qty) > 0)) return null;
            const r = recipes.find((x) => x.id === p.recipe_id);
            if (!r) return null;
            const cc = computeRecipeCostPerPiece(r);
            const cpp = cc && cc.costPerPiece != null ? cc.costPerPiece : null;
            const sell = num(r.price);
            if (cpp == null && sell === 0) return null;
            const qty = num(p.qty);
            return { name: p.name || r.name, qty, cpp, sell, cost: cpp != null ? cpp * qty : null, rev: sell > 0 ? sell * qty : null };
          }).filter(Boolean);
          if (!rows.length) return null;
          const totCost = rows.reduce((a, x) => a + (x.cost || 0), 0);
          const totRev = rows.reduce((a, x) => a + (x.rev || 0), 0);
          const margin = totRev - totCost;
          const marginPct = totRev > 0 ? (margin / totRev) * 100 : null;
          const eur = (n) => `€${(n || 0).toFixed(2)}`;
          const missing = rows.some((x) => x.cpp == null || x.sell === 0);
          return (
            <div data-testid="capo-cost-summary" className="mt-4 rounded-2xl bg-[#33564E]/8 border border-[#33564E]/25 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Euro className="w-4 h-4 text-[#33564E] dark:text-[#9ec48f]" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#33564E] dark:text-[#9ec48f]">{tri3(lang, "Costi & Margine", "Kosten & Marge", "Costs & Margin")}</span>
              </div>
              <div className="space-y-1.5">
                {rows.map((x, i) => (
                  <div key={i} data-testid={`capo-cost-row-${i}`} className="flex items-center justify-between text-sm">
                    <span className="text-[#3F4A54] dark:text-[#AEB8BF] truncate flex-1">{x.name} <span className="text-[#7E8A93]">×{x.qty}</span></span>
                    <span className="font-mono-data text-[#7E8A93] mr-3">{x.cost != null ? eur(x.cost) : "—"}</span>
                    <span className="font-mono-data font-semibold text-[#33564E] dark:text-[#9ec48f]">{x.rev != null ? eur(x.rev) : "—"}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#33564E]/20 grid grid-cols-3 gap-2 text-center">
                <div><p className="text-[10px] uppercase text-[#7E8A93]">{tri3(lang, "Costo", "Kosten", "Cost")}</p><p className="font-mono-data font-bold text-[#B34A26]">{eur(totCost)}</p></div>
                <div><p className="text-[10px] uppercase text-[#7E8A93]">{tri3(lang, "Ricavo", "Umsatz", "Revenue")}</p><p className="font-mono-data font-bold text-[#33564E] dark:text-[#9ec48f]">{eur(totRev)}</p></div>
                <div><p className="text-[10px] uppercase text-[#7E8A93]">{tri3(lang, "Margine", "Marge", "Margin")}</p><p className="font-mono-data font-bold text-[#5E8B7E]">{eur(margin)}{marginPct != null ? ` · ${marginPct.toFixed(0)}%` : ""}</p></div>
              </div>
              {missing && (
                <p className="text-[11px] text-[#7E8A93] mt-2 leading-snug">
                  {tri3(lang, "Suggerimento: imposta prezzo di vendita e n° pezzi nella ricetta (sezione costi) per un margine preciso.",
                    "Tipp: Setze VK-Preis und Stückzahl im Rezept (Kosten) für eine genaue Marge.",
                    "Tip: set selling price and pieces in the recipe (costing) for an exact margin.")}
                </p>
              )}
            </div>
          );
        })()}

        <button data-testid="capo-generate" onClick={generate} disabled={generating || !canGenerate}
          className="mt-3 w-full bg-[#5E8B7E] hover:bg-[#4C7368] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2">
          <ChefHat className="w-5 h-5" /> {generating ? t("capo_generating") : t("capo_generate")}
        </button>
        {!canGenerate && (
          <p data-testid="capo-generate-hint" className="text-[11px] text-[#B34A26] mt-1.5 text-center">
            {tri3(lang, "⚠️ Obbligatorio: scegli almeno una ricetta e la quantità per generare il piano.",
              "⚠️ Pflicht: Wähle mindestens ein Rezept und die Menge, um den Plan zu erstellen.",
              "⚠️ Required: choose at least one recipe and quantity to generate the plan.")}
          </p>
        )}

        {plan && (
          <>
            <div data-testid="capo-saved-banner" className="no-print mt-4 rounded-2xl bg-[#6B8E62]/12 border border-[#6B8E62]/35 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <CheckCircle2 className="w-5 h-5 text-[#5a7a52] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#33564E] dark:text-[#9ec48f] leading-tight">
                    {savedAt
                      ? tri3(lang, "Piano salvato — resta qui finché non lo chiudi tu", "Plan gespeichert — bleibt hier, bis du ihn schließt", "Plan saved — it stays here until you close it")
                      : tri3(lang, "Piano generato", "Plan erstellt", "Plan generated")}
                  </p>
                  {savedAt && (
                    <p className="text-[11px] text-[#7E8A93] mt-0.5">
                      {tri3(lang, "Salvato il", "Gespeichert am", "Saved on")} {new Date(savedAt).toLocaleString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
              <button data-testid="capo-new-plan" onClick={clearPlan}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-[#33564E] dark:text-[#EAF0EC] bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] px-3 py-2 rounded-xl active:scale-95 transition-all">
                <RotateCcw className="w-3.5 h-3.5" /> {tri3(lang, "Nuovo piano", "Neuer Plan", "New plan")}
              </button>
            </div>
            <button data-testid="capo-quick-archive" onClick={() => capoArchiveRef.current?.openSave()}
              className="no-print mt-2 w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#33564E] dark:text-[#8FB0C2] bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] px-4 py-2.5 rounded-2xl active:scale-98 transition-all">
              <Archive className="w-4 h-4" /> {tri3(lang, "Salva questo piano nell'archivio", "Diesen Plan im Archiv speichern", "Save this plan to the archive")}
            </button>
            <button data-testid="capo-print" onClick={() => window.print()}
              className="no-print mt-3 w-full bg-[#6B8E62] hover:bg-[#5a7a52] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
              <Printer className="w-5 h-5" /> {tri3(lang, "PDF Completo (piano + spesa + ricette)", "Komplettes PDF (Plan + Einkauf + Rezepte)", "Full PDF (plan + shopping + recipes)")}
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

              {modules.spesa && <SupplierOrder totals={shopTotals} />}

              {usedRecipes.length > 0 && (
                <div data-testid="capo-recipes" className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#5E8B7E]">{t("capo_recipes_title")}</p>
                  {usedRecipes.map((r) => <RecipePrint key={r.id} r={r} lang={lang} />)}
                </div>
              )}
            </div>
          </>
        )}

        <PlanArchive
          kind="capo"
          ref={capoArchiveRef}
          canSave={!!(plan && plan.trim())}
          getPayload={() => (plan && plan.trim()
            ? { plan_text: plan, state: { products, useWeekly, staff, stdTemp, labTemp, startTime, notes, preferment, bizType, modules } }
            : null)}
          onRepeat={repeatArchivedPlan}
          repeatLabel={tri3(lang, "Usa per settimana prossima", "Für nächste Woche", "Use next week")}
          describe={(p) => {
            const n = ((p.state && p.state.products) || []).filter((x) => x && x.recipe_id).length;
            return tri3(lang, `${n} ricette`, `${n} Rezepte`, `${n} recipes`);
          }}
        />
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
