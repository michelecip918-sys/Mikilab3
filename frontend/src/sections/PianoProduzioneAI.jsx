import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { motion, Reorder } from "framer-motion";
import { ChefHat, Plus, X, Thermometer, Sparkles, Printer, Share2, CalendarDays, Clock, ShoppingCart, Euro, Store, Users, BookOpen, Snowflake, CheckCircle2, RotateCcw, FlaskConical, Flag, Recycle, Wrench, SlidersHorizontal, Building2, Scale, Flame, Droplets, Timer as TimerIcon, CloudSun, Camera, QrCode, ScanLine, ListChecks, CalendarClock, Archive, Info, Eye, EyeOff, ChevronUp, ChevronDown, Settings2, HelpCircle, Star, Search, AlertTriangle, GripVertical, Activity, Wheat, RefreshCw, Cookie, Stethoscope, Calculator, UtensilsCrossed, TrendingUp, Sprout, FileText, Pizza, Cake, Hand, Landmark, Menu } from "lucide-react";
import { API, labConfigApi, recipesApi, weeklyApi, capoPlanApi, subscriptionApi } from "@/lib/api";
import { computeRecipeCostPerPiece } from "@/data/prices";
import { useLang } from "@/i18n/LanguageContext";
import { useTimers } from "@/audio/TimerContext";
import { useAuth } from "@/auth/AuthContext";
import { computeShopping } from "@/lib/shopping";
import SupplierOrder from "@/components/SupplierOrder";
import { fireHighFive } from "@/components/HighFive";
import PlanArchive from "@/components/PlanArchive";
import LabTour from "@/components/LabTour";
import { getActiveMachineNames } from "@/lib/machines";
import { guideFor } from "@/lib/toolGuide";
import { playSfx } from "@/lib/uiSounds";
import { shareContent } from "@/lib/share";
import { rLoc } from "@/lib/loc";
import PrintHeader from "@/components/PrintHeader";
import HandsFreeMode from "@/components/HandsFreeMode";

const DAYS = ["", "lun", "mar", "mer", "gio", "ven", "sab", "dom"];

const tri3 = (lang, i, d, e, s) => (lang === "de" ? (d ?? i) : lang === "en" ? (e ?? i) : lang === "es" ? (s ?? e ?? i) : (lang === "fr" || lang === "fa") ? (e ?? i) : i);

// Estrae la sezione "Orario Infornate" dal markdown del piano per renderla come tabella modificabile.
const cleanCell = (c) => (c || "").replace(/\*\*/g, "").replace(/__/g, "").replace(/`/g, "").replace(/\*/g, "").trim();
const parseInfornate = (text) => {
  if (!text) return { body: text || "", headers: null, rows: null, heading: null };
  const lines = text.split("\n");
  let hIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,4}\s*.*(orario infornate|backfahrplan|baking schedule|horario|🔥)/i.test(lines[i])) { hIdx = i; break; }
  }
  if (hIdx < 0) return { body: text, headers: null, rows: null, heading: null };
  const tbl = [];
  let started = false;
  for (let i = hIdx + 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l.startsWith("|")) { tbl.push(l); started = true; }
    else if (started && l === "") continue;
    else if (started) break;
  }
  if (tbl.length < 2) return { body: text, headers: null, rows: null, heading: null };
  const parseRow = (l) => l.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => cleanCell(c));
  const headers = parseRow(tbl[0]);
  const rows = tbl.slice(1).filter((l) => !/^[\s|:-]+$/.test(l)).map(parseRow).map((r) => headers.map((_, k) => r[k] ?? ""));
  const body = lines.slice(0, hIdx).join("\n").trimEnd();
  return { body, headers, rows, heading: lines[hIdx] };
};
// Ricostruisce il markdown della tabella infornate dai valori modificati.
const serializeInfTable = (headers, rows) => {
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = (rows || []).map((r) => `| ${headers.map((_, k) => (r[k] ?? "")).join(" | ")} |`).join("\n");
  return [head, sep, body].filter(Boolean).join("\n");
};



// Piano di Produzione con IA (spostato dalla "Impostazione Macchine").
// Config macchine/celle letta in sola lettura per alimentare l'IA.
const isPanettoneRecipe = (r) => /panettone/i.test(r?.name || "") || /panettone/i.test(r?.menu_category || "");

// Moduli opzionali del Piano IA: si accendono/spengono senza bloccare il piano base.
const DEFAULT_MODULES = { celle: true, orari: true, spesa: true, foodcost: true, infornate: true, clima: false, antispreco: false };
const MODULES = [
  { id: "celle", Icon: Wrench, it: "Celle & Impastatrici", de: "Kammern & Kneter", en: "Cells & Mixers" },
  { id: "orari", Icon: Clock, it: "Orari d'inizio", de: "Startzeiten", en: "Start times" },
  { id: "infornate", Icon: Flame, it: "Orario Infornate", de: "Backzeiten", en: "Baking schedule" },
  { id: "clima", Icon: Thermometer, it: "Meteo & Clima", de: "Wetter & Klima", en: "Weather & climate" },
  { id: "spesa", Icon: ShoppingCart, it: "Lista Spesa", de: "Einkaufsliste", en: "Shopping list" },
  { id: "foodcost", Icon: Euro, it: "Costi & Margine", de: "Kosten & Marge", en: "Costs & margin" },
  { id: "antispreco", Icon: Recycle, it: "Anti-Spreco", de: "Anti-Verschwendung", en: "Anti-waste" },
];

// Ogni interruttore-modulo apre lo strumento corrispondente per configurarlo.
const MODULE_TOOL = { celle: "capo", orari: "inversa", freezer: "freezer", turni: "turni", clima: "termo", spesa: "spesa", foodcost: "foodcost", punti: "salespoints", antispreco: "spreco", infornate: "inversa" };

// Obiettivo del piano: frase passata all'AI per orientare la generazione.
const GOAL_TEXT = {
  qualita: { it: "Obiettivo: massima qualità artigianale — privilegia lievitazioni lente, struttura e sapore.", de: "Ziel: maximale handwerkliche Qualität — bevorzuge langsame Gare, Struktur und Geschmack.", en: "Goal: top artisan quality — favour slow proofing, structure and flavour." },
  resa: { it: "Obiettivo: massima resa produttiva — ottimizza l'uso di forni, celle e impastatrici e le quantità.", de: "Ziel: maximaler Output — optimiere Öfen, Kammern, Kneter und Mengen.", en: "Goal: maximum output — optimise ovens, cells, mixers and quantities." },
  tempo: { it: "Obiettivo: risparmio di tempo — proponi sequenze più rapide e accorpa i passaggi dove possibile.", de: "Ziel: Zeit sparen — schnellere Abläufe, Schritte wo möglich bündeln.", en: "Goal: save time — propose faster sequences and combine steps where possible." },
  spreco: { it: "Obiettivo: riduzione degli sprechi — recupera impasti e invenduto e dimensiona con prudenza.", de: "Ziel: weniger Abfall — Teig/Unverkauftes verwerten und vorsichtig dimensionieren.", en: "Goal: reduce waste — reuse dough/unsold and size cautiously." },
  grandi: { it: "Obiettivo: focus sui grandi lievitati (panettoni, colombe, brioche) — gestisci doppi impasti, tempi lunghi e triplicamenti con cura.", de: "Ziel: Fokus auf große Hefegebäcke (Panettone, Colomba, Brioche) — doppelte Teige, lange Zeiten und Verdreifachung sorgfältig steuern.", en: "Goal: focus on large leavened cakes (panettone, colomba, brioche) — carefully manage double doughs, long times and tripling." },
  lotti: { it: "Obiettivo: pochi impasti in grandi lotti — accorpa le lavorazioni per ridurre i cambi impasto e ottimizzare impastatrice e forno.", de: "Ziel: wenige Teige in großen Chargen — Arbeitsgänge bündeln, um Teigwechsel zu reduzieren und Kneter/Ofen zu optimieren.", en: "Goal: few doughs in large batches — combine runs to reduce dough changes and optimise mixer and oven." },
};

// Strumenti apribili (personalizzabili: riordina/nascondi). Gli interruttori-modulo sono a parte.
export const TOOLS = [
  // 🍞 Laboratorio Panificazione
  { id: "generatore", Icon: Sparkles, cat: "panificazione", it: "Generatore Ricette", de: "Rezept-Generator", en: "Recipe Generator", es: "Generador de Recetas" },
  { id: "fermentazione", Icon: Activity, cat: "panificazione", it: "Fermentazione Predittiva", de: "Gärungs-Prognose", en: "Fermentation Forecast", es: "Fermentación Predictiva" },
  { id: "weatherbaker", Icon: CloudSun, cat: "panificazione", it: "Smart Weather-Baker", de: "Smart Weather-Baker", en: "Smart Weather-Baker", es: "Smart Weather-Baker" },
  { id: "trovafarina", Icon: Search, cat: "panificazione", it: "Conversione Farine", de: "Mehl-Umrechnung", en: "Flour Conversion", es: "Conversión de Harinas" },
  { id: "scanflour", Icon: Wheat, cat: "panificazione", it: "Scanner Farina", de: "Mehl-Scanner", en: "Flour Scanner", es: "Escáner de Harina" },
  { id: "simforno", Icon: Flame, cat: "panificazione", it: "Gestione Vapore & Forno", de: "Dampf & Ofen", en: "Steam & Oven", es: "Vapor y Horno" },
  { id: "adatta", Icon: Flame, cat: "panificazione", it: "Adatta Forno", de: "Ofen anpassen", en: "Adapt Oven" },
  { id: "acqua", Icon: Droplets, cat: "panificazione", it: "Temp. Acqua", de: "Wasser-Temp.", en: "Water Temp." },
  { id: "metodo", Icon: Calculator, cat: "panificazione", it: "Calcolatore Metodo", de: "Methoden-Rechner", en: "Method Calculator", es: "Calculadora Método" },
  { id: "twin", Icon: FlaskConical, cat: "panificazione", it: "Digital Twin", de: "Teig-Zwilling", en: "Dough Twin" },
  { id: "cosafare", Icon: Search, cat: "panificazione", it: "Cosa posso fare?", de: "Was kann ich machen?", en: "What can I make?", es: "¿Qué puedo hacer?" },
  { id: "stampi", Icon: Cookie, cat: "panificazione", it: "Stampi & Pirottini", de: "Formen-Rechner", en: "Pan Calculator", es: "Calculadora Moldes" },
  { id: "bilancia", Icon: Scale, cat: "panificazione", it: "Bilancia Smart", de: "Smarte Waage", en: "Smart Scale" },
  { id: "pesata", Icon: Scale, cat: "panificazione", it: "Pesata Guidata", de: "Geführtes Wiegen", en: "Guided Weighing" },
  { id: "saporicasa", Icon: UtensilsCrossed, cat: "panificazione", it: "Sapori di Casa", de: "Geschmack von zu Hause", en: "Home Flavours", es: "Sabores de Casa" },
  { id: "esuberozero", Icon: Recycle, cat: "panificazione", it: "Esubero Zero-Sprechi", de: "Sauerteig-Rest", en: "Zero-Waste Discard", es: "Descarte Cero" },
  { id: "recupero", Icon: Recycle, cat: "panificazione", it: "Angolo del Recupero", de: "Resteverwertung", en: "Recovery Corner", es: "Rincón Aprovechamiento" },
  { id: "energia", Icon: Flame, cat: "panificazione", it: "Costo Energia Forno", de: "Ofen-Energiekosten", en: "Oven Energy Cost", es: "Coste Energía Horno" },
  { id: "timelapse", Icon: TrendingUp, cat: "panificazione", it: "Time-Lapse Raddoppio", de: "Time-Lapse Verdopplung", en: "Doubling Time-Lapse", es: "Time-Lapse Duplicado" },
  { id: "termo", Icon: Thermometer, cat: "panificazione", it: "Termostato & Clima", de: "Thermostat & Klima", en: "Thermostat & Climate" },
  // 🍕 Laboratorio Pizzeria
  { id: "labpizzeria", Icon: Pizza, cat: "pizzeria", it: "Laboratorio Pizzeria", de: "Pizzeria-Labor", en: "Pizzeria Lab", es: "Lab Pizzería" },
  // 🧁 Laboratorio Pasticceria & Gelateria
  { id: "labpasticceria", Icon: Cake, cat: "pasticceria", it: "Laboratorio Pasticceria & Gelateria", de: "Konditorei & Eis-Labor", en: "Pastry & Gelato Lab", es: "Lab Pastelería y Helado" },
  // 📜 Le Ricette Custodite
  { id: "custodite", Icon: Landmark, cat: "custodite", it: "Ricette Custodite", de: "Bewahrte Rezepte", en: "Treasured Recipes", es: "Recetas Custodiadas" },
  // 🛠️ Strumenti Mani in Pasta
  { id: "manisporche", Icon: Hand, cat: "manisporche", it: "Mani Sporche (Voce)", de: "Schmutzige Hände (Stimme)", en: "Dirty Hands (Voice)", es: "Manos Sucias (Voz)" },
  { id: "convlievito", Icon: RefreshCw, cat: "manisporche", it: "Convertitore Lieviti", de: "Hefe-Umrechner", en: "Leavening Converter", es: "Conversor Levaduras" },
  { id: "timer", Icon: TimerIcon, cat: "manisporche", it: "Smart Timer Multi-Impasto", de: "Smart Timer Multi-Teig", en: "Smart Multi-Dough Timer" },
  { id: "ph", Icon: FlaskConical, cat: "manisporche", it: "Registro Lievito Madre", de: "Sauerteig-Register", en: "Sourdough Log", es: "Registro Masa Madre" },
  { id: "sosimpasto", Icon: Stethoscope, cat: "manisporche", it: "SOS Impasto", de: "SOS Teig", en: "Dough SOS", es: "SOS Masa" },
  { id: "aggiungi", Icon: BookOpen, cat: "manisporche", it: "Le Mie Ricette", de: "Meine Rezepte", en: "My Recipes", es: "Mis Recetas" },
  { id: "cantiere", Icon: FileText, cat: "manisporche", it: "Ricetta di Cantiere (PDF)", de: "Baustellen-Rezept (PDF)", en: "Worksite Recipe (PDF)", es: "Receta de Obra (PDF)" },
  { id: "bancalievito", Icon: Sprout, cat: "manisporche", it: "Banca del Lievito", de: "Sauerteig-Bank", en: "Starter Bank", es: "Banco de Masa Madre" },
  // 🏬 Gestione Attività & Cold Chain
  { id: "capo", Icon: Building2, cat: "coldchain", it: "Controllo Celle & Impastatrici", de: "Kammern & Kneter", en: "Cells & Mixers", es: "Cámaras y Amasadoras" },
  { id: "freezer", Icon: Snowflake, cat: "coldchain", it: "Giacenze Freezer", de: "Gefrier-Bestand", en: "Freezer Stock", es: "Stock Congelador" },
  { id: "salespoints", Icon: Store, cat: "coldchain", it: "Punti Vendita", de: "Verkaufsstellen", en: "Sales Points", es: "Puntos de Venta" },
  { id: "dayclose", Icon: CheckCircle2, cat: "coldchain", it: "Chiusura Giornata (HACCP)", de: "Tagesabschluss (HACCP)", en: "Day Close (HACCP)", es: "Cierre del Día (HACCP)" },
  { id: "foodcost", Icon: Euro, cat: "coldchain", it: "Costi & Margine", de: "Kosten & Marge", en: "Costs & Margin", es: "Costes y Margen" },
  { id: "spreco", Icon: Recycle, cat: "coldchain", it: "Anti-Spreco", de: "Anti-Verschwendung", en: "Anti-Waste", es: "Anti-Desperdicio" },
  { id: "mydata", Icon: Archive, cat: "coldchain", it: "I Miei Dati", de: "Meine Daten", en: "My Data" },
  { id: "macchine", Icon: Wrench, cat: "coldchain", it: "Parco Macchine", de: "Maschinenpark", en: "Machine Park" },
  { id: "diagnosi", Icon: Camera, cat: "coldchain", it: "Diagnosi Foto", de: "Foto-Diagnose", en: "Photo Diagnosis" },
  { id: "suono", Icon: Camera, cat: "coldchain", it: "Diagnosi Suono", de: "Klang-Diagnose", en: "Sound Diagnosis" },
  { id: "sessioni", Icon: Thermometer, cat: "coldchain", it: "Diario Impasti", de: "Teig-Tagebuch", en: "Dough Log" },
  { id: "check", Icon: ListChecks, cat: "coldchain", it: "Checklist Laboratorio", de: "Checklisten", en: "Checklists" },
  { id: "shelf", Icon: CalendarClock, cat: "coldchain", it: "Shelf-Life", de: "Shelf-Life", en: "Shelf-Life" },
];

export const TOOL_CATS = [
  { key: "panificazione", Icon: Wheat, color: "#B45309", it: "Laboratorio Panificazione", de: "Backlabor", en: "Baking Lab", es: "Lab de Panificación" },
  { key: "pizzeria", Icon: Pizza, color: "#C0574D", it: "Laboratorio Pizzeria", de: "Pizzeria-Labor", en: "Pizzeria Lab", es: "Lab de Pizzería" },
  { key: "pasticceria", Icon: Cake, color: "#A16207", it: "Laboratorio Pasticceria & Gelateria", de: "Konditorei & Eis", en: "Pastry & Gelato Lab", es: "Pastelería y Helado" },
  { key: "custodite", Icon: Landmark, color: "#6E371C", it: "Le Ricette Custodite", de: "Bewahrte Rezepte", en: "Treasured Recipes", es: "Recetas Custodiadas" },
  { key: "manisporche", Icon: Hand, color: "#8C4A27", it: "Strumenti Mani in Pasta", de: "Werkzeuge (Hände im Teig)", en: "Hands-in-Dough Tools", es: "Herramientas Manos en Masa" },
  { key: "coldchain", Icon: Building2, color: "#8C6B4A", it: "Gestione Attività & Cold Chain", de: "Betrieb & Kühlkette", en: "Business & Cold Chain", es: "Gestión y Cadena de Frío" },
];

export default function PianoProduzioneAI({ onOpenTool }) {
  const { t, lang } = useLang();
  const { addTimer } = useTimers();
  const [menuOpen, setMenuOpen] = useState(false);
  // Snellimento: alla prima apertura del laboratorio, porta subito alla scelta ricette / generazione.
  useEffect(() => {
    if (!onOpenTool) return;
    try { if (sessionStorage.getItem("mikilab_lab_scrolled")) return; } catch { /* */ }
    const id = setTimeout(() => {
      const el = document.querySelector('[data-testid="capo-source-choice"]');
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); try { sessionStorage.setItem("mikilab_lab_scrolled", "1"); } catch { /* */ } }
    }, 500);
    return () => clearTimeout(id);
  }, [onOpenTool]);
  const startPhaseTimer = (label, min, repeat) => {
    addTimer(label, min, repeat);
    toast.success(tri3(lang, `Timer «${label}» avviato (${min}′)`, `Timer „${label}" gestartet (${min}′)`, `Timer "${label}" started (${min}′)`, `Temporizador "${label}" iniciado (${min}′)`));
  };
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
  const [weeklyStartId, setWeeklyStartId] = useState("");
  const [extraToday, setExtraToday] = useState([]);
  const [extraOpen, setExtraOpen] = useState(false);
  const [preferment, setPreferment] = useState("solido");
  const [planGoal, setPlanGoal] = useState("qualita");
  const [bizType, setBizType] = useState("pro");
  const [freezerStock, setFreezerStock] = useState([]);
  const [plan, setPlan] = useState("");
  const capoArchiveRef = useRef(null);
  const favDragMoved = useRef(false);
  const [guideId, setGuideId] = useState(null); // strumento spiegato da Mohammadreza
  const [generating, setGenerating] = useState(false);
  const [savedAt, setSavedAt] = useState(null);  const [pickerOpen, setPickerOpen] = useState(false);
  const [bakerNote, setBakerNote] = useState("");
  const [planTruncated, setPlanTruncated] = useState(false);
  const [infEdit, setInfEdit] = useState(null); // tabella infornate modificabile {headers, rows}
  const [planHF, setPlanHF] = useState(false); // lettura vocale del piano
  const [pickSearch, setPickSearch] = useState("");
  const [savedProducts, setSavedProducts] = useState([]);
  const [modules, setModules] = useState(DEFAULT_MODULES);
  const toggleMod = (id) => setModules((m) => ({ ...m, [id]: !m[id] }));
  const [bump, setBump] = useState(0);

  // Personalizzazione strumenti (riordina/nascondi) + tour guidato.
  const [toolPrefs, setToolPrefs] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_tool_prefs") || "{}"); } catch { return {}; } });
  const [editTools, setEditTools] = useState(false);
  const [toolQuery, setToolQuery] = useState("");
  const [dragId, setDragId] = useState(null);
  const [tourForce, setTourForce] = useState(0);
  const [toolUsage, setToolUsage] = useState(() => { try { return JSON.parse(localStorage.getItem("mikilab_tool_usage") || "{}"); } catch { return {}; } });
  const guideToolId = (id) => MODULE_TOOL[id] || (TOOLS.some((t) => t.id === id) ? id : null);
  // Apertura guida di Mohammadreza con suono di arrivo (campanella del forno)
  const openGuide = (id) => { try { playSfx("ding"); } catch { /* */ } setGuideId(id); };

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
  const pinnedTools = new Set((toolPrefs.pinned || []).filter((id) => TOOLS.some((t) => t.id === id)));
  // Fuori dalla modifica: non ripetere nella griglia gli strumenti già presenti nei Preferiti (no doppioni)
  const visibleTools = orderedTools.filter((tl) => editTools || (!hiddenTools.has(tl.id) && !pinnedTools.has(tl.id)));
  const suggestedTools = useMemo(() => {
    return orderedTools
      .filter((tl) => !pinnedTools.has(tl.id) && !hiddenTools.has(tl.id) && (toolUsage[tl.id] || 0) > 0)
      .sort((a, b) => (toolUsage[b.id] || 0) - (toolUsage[a.id] || 0))
      .slice(0, 3);
  }, [orderedTools, toolUsage, toolPrefs]);
  const moveTool = (id, dir) => {
    const ids = orderedTools.map((tl) => tl.id);
    const i = ids.indexOf(id); const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    savePrefs({ ...toolPrefs, order: ids });
  };
  const reorderTool = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    const ids = orderedTools.map((tl) => tl.id);
    const from = ids.indexOf(fromId); const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
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
  const renderToolCard = ({ id, Icon, it, de, en }) => {
    const label = tri3(lang, it, de, en);
    const isHidden = hiddenTools.has(id);
    return (
      <div key={id} data-testid={`capo-quicklink-${id}`} onClick={() => { if (!editTools) openToolTracked(id); }}
        draggable={editTools}
        onDragStart={editTools ? (e) => { setDragId(id); e.dataTransfer.effectAllowed = "move"; } : undefined}
        onDragOver={editTools ? (e) => e.preventDefault() : undefined}
        onDrop={editTools ? (e) => { e.preventDefault(); reorderTool(dragId, id); setDragId(null); } : undefined}
        onDragEnd={editTools ? () => setDragId(null) : undefined}
        className={`relative flex flex-col items-center justify-center gap-1.5 bg-white dark:bg-[#232A31] border rounded-2xl p-3 pt-4 text-center transition-all min-h-[70px] ${editTools ? "cursor-move border-dashed border-[#8C4A27]/50" : "cursor-pointer border-[#E6D8C3] dark:border-[#38424B] active:scale-95 hover:border-[#8C4A27]/60"} ${isHidden ? "opacity-40" : ""} ${dragId === id ? "opacity-50 scale-95 ring-2 ring-[#8C4A27]" : ""}`}>
        {editTools ? (
          <>
            <div className="absolute top-1 left-1 flex gap-0.5">
              <button type="button" data-testid={`tool-hide-${id}`} aria-label="hide" onClick={(e) => { e.stopPropagation(); toggleHideTool(id); }}
                className="w-6 h-6 rounded-full bg-[#e4eff8] dark:bg-[#2A323A] flex items-center justify-center text-[#8C4A27] active:scale-90">
                {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button type="button" data-testid={`tool-pin-${id}`} aria-label="pin" onClick={(e) => { e.stopPropagation(); togglePinTool(id); }}
                className={`w-6 h-6 rounded-full flex items-center justify-center active:scale-90 ${(toolPrefs.pinned || []).includes(id) ? "bg-[#C88A2B] text-white" : "bg-[#e4eff8] dark:bg-[#2A323A] text-[#C88A2B]"}`}>
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
            <button type="button" data-testid={`tool-fav-${id}`} aria-label="favorite"
              onClick={(e) => { e.stopPropagation(); const was = (toolPrefs.pinned || []).includes(id); togglePinTool(id); toast.success(was ? tri3(lang, "Rimosso dai preferiti", "Aus Favoriten entfernt", "Removed from favorites") : tri3(lang, "Aggiunto ai preferiti ⭐", "Zu Favoriten hinzugefügt ⭐", "Added to favorites ⭐")); }}
              className={`absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center active:scale-90 ${(toolPrefs.pinned || []).includes(id) ? "bg-[#C88A2B] text-white" : "bg-[#C88A2B]/12 text-[#C88A2B]"}`}>
              <Star className={`w-3.5 h-3.5 ${(toolPrefs.pinned || []).includes(id) ? "fill-white" : ""}`} />
              {id === "generatore" && !toolUsage[id] && (
                <span data-testid={`tool-new-${id}`} className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#C0574D] border border-white animate-pulse" title={tri3(lang, "Nuovo", "Neu", "New")} />
              )}
            </button>
            {guideFor(id, lang) && (
              <button type="button" data-testid={`tool-info-${id}`} aria-label="info"
                onClick={(e) => { e.stopPropagation(); openGuide(id); }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#C88A2B] flex items-center justify-center text-white shadow-sm ring-2 ring-white dark:ring-[#232A31] active:scale-90">
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
        <Icon className="w-5 h-5 text-[#8C4A27]" />
        <span className="text-[11px] font-semibold leading-tight text-[#2B303B] dark:text-[#e4eff8]">{label}</span>
      </div>
    );
  };

  // Riga riordinabile col DITO (framer-motion) — usata solo in modalità "Personalizza".
  const renderToolReorderRow = ({ id, Icon, it, de, en }) => {
    const label = tri3(lang, it, de, en);
    const isHidden = hiddenTools.has(id);
    const isPinned = (toolPrefs.pinned || []).includes(id);
    const stop = (e) => e.stopPropagation();
    return (
      <Reorder.Item as="div" key={id} value={id} data-testid={`capo-quicklink-${id}`}
        whileDrag={{ scale: 1.03, zIndex: 5, boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
        className={`relative flex items-center gap-2 bg-white dark:bg-[#232A31] border border-dashed border-[#8C4A27]/50 rounded-2xl px-2.5 py-2.5 select-none touch-none cursor-grab active:cursor-grabbing ${isHidden ? "opacity-40" : ""}`}>
        <GripVertical className="w-4 h-4 text-[#9aa4ac] shrink-0" data-testid={`tool-grip-${id}`} />
        <Icon className="w-5 h-5 text-[#8C4A27] shrink-0" />
        <span className="text-[12px] font-semibold leading-tight text-[#2B303B] dark:text-[#e4eff8] flex-1 min-w-0 truncate">{label}</span>
        <button type="button" data-testid={`tool-hide-${id}`} aria-label="hide" onPointerDown={stop} onClick={(e) => { stop(e); toggleHideTool(id); }}
          className="w-7 h-7 rounded-full bg-[#e4eff8] dark:bg-[#2A323A] flex items-center justify-center text-[#8C4A27] active:scale-90 shrink-0">
          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
        <button type="button" data-testid={`tool-pin-${id}`} aria-label="pin" onPointerDown={stop} onClick={(e) => { stop(e); togglePinTool(id); }}
          className={`w-7 h-7 rounded-full flex items-center justify-center active:scale-90 shrink-0 ${isPinned ? "bg-[#C88A2B] text-white" : "bg-[#e4eff8] dark:bg-[#2A323A] text-[#C88A2B]"}`}>
          <Star className={`w-3.5 h-3.5 ${isPinned ? "fill-white" : ""}`} />
        </button>
        <div className="flex flex-col shrink-0">
          <button type="button" data-testid={`tool-up-${id}`} aria-label="up" onPointerDown={stop} onClick={(e) => { stop(e); moveTool(id, -1); }} className="w-6 h-4 flex items-center justify-center text-[#7E8A93] active:scale-90"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button type="button" data-testid={`tool-down-${id}`} aria-label="down" onPointerDown={stop} onClick={(e) => { stop(e); moveTool(id, 1); }} className="w-6 h-4 flex items-center justify-center text-[#7E8A93] active:scale-90"><ChevronDown className="w-3.5 h-3.5" /></button>
        </div>
      </Reorder.Item>
    );
  };


  // I PREFERITI sono SOLO quelli scelti a mano con la stella (nessuna aggiunta automatica).
  const favRow = useMemo(() => {
    const byId = Object.fromEntries(TOOLS.map((tl) => [tl.id, tl]));
    return (toolPrefs.pinned || []).map((id) => byId[id]).filter(Boolean).map((tl) => ({ ...tl, pinned: true }));
  }, [toolPrefs]);

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
    if (s.planGoal) setPlanGoal(s.planGoal);
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
    if (s.planGoal) setPlanGoal(s.planGoal);
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
        standard_temp_c: Number(stdTemp) || 26, notes: [(GOAL_TEXT[planGoal] && (GOAL_TEXT[planGoal][lang] || GOAL_TEXT[planGoal].it)), notes].filter(Boolean).join(" · "), lang, preferment_choice: preferment, machines: getActiveMachineNames(),
        start_name: useWeekly && weeklyStartId ? ((weeklyItems.find((w) => w.recipe_id === weeklyStartId) || {}).recipe_name || null) : null,
        extra_today: extraToday.filter((x) => x.recipe_id || x.name).map((x) => ({ recipe_id: x.recipe_id || null, name: x.name || (recipeById[x.recipe_id] ? recipeById[x.recipe_id].name : ""), quantity: x.qty === "" ? null : Number(x.qty), unit: x.unit || "pezzi" })),
        active_modules: Object.keys(modules).filter((k) => modules[k]),
      }),
    });
    if (!res.ok) {
      toast.error(res.status === 402 || res.status === 403 ? (lang === "de" ? "PRO erforderlich" : lang === "en" ? "PRO required" : lang === "es" ? "Se requiere PRO" : "Serve l'abbonamento PRO") : t("chat_error"));
      return { ok: false, text: "" };
    }
    let acc = "";
    if (headerLabel) { const h = `## ${headerLabel}\n\n`; acc += h; setPlan((p) => p + (p ? "\n\n" : "") + h); }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;
    let truncated = false;
    while (true) {
      const { done: rd, value } = await reader.read();
      if (rd) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n"); buffer = parts.pop();
      for (const part of parts) {
        const line = part.replace(/^data: ?/, "").trim();
        if (!line) continue;
        let obj; try { obj = JSON.parse(line); } catch { continue; }
        if (obj.done) { done = true; if (obj.truncated) truncated = true; continue; }
        if (obj.d) { acc += obj.d; setPlan((p) => p + obj.d); }
      }
    }
    return { ok: done, text: acc, truncated };
  };

  const persistPlan = async (text) => {
    try {
      const res = await capoPlanApi.save({
        plan_text: text,
        state: { products, useWeekly, staff, stdTemp, labTemp, startTime, notes, preferment, planGoal, bizType, modules },
      });
      setSavedAt(res.saved_at || new Date().toISOString());
    } catch {
      toast.warning(tri3(lang, "Piano generato ma non salvato: potrebbe perdersi uscendo.", "Plan erstellt, aber nicht gespeichert: geht beim Verlassen evtl. verloren.", "Plan generated but not saved: it may be lost when you leave."));
    }
  };

  const clearPlan = async () => {
    setPlan(""); setSavedAt(null); setPlanTruncated(false); setInfEdit(null);
    try { await capoPlanApi.clear(); } catch { /* */ }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Ogni volta che cambia il testo del piano, ri-estrae la tabella infornate (modificabile a mano).
  useEffect(() => {
    const p = parseInfornate(plan);
    setInfEdit(p.headers && p.headers.length ? { headers: p.headers, rows: p.rows || [], heading: p.heading } : null);
  }, [plan]);

  const infPersistRef = useRef(null);
  // Applica una modifica alla tabella: aggiorna l'editor, riscrive il markdown del piano e lo salva (debounce).
  const commitInf = (headers, rows, heading) => {
    setInfEdit({ headers, rows, heading });
    const body = parseInfornate(plan).body;
    const newPlan = `${body}\n\n${heading || "## 🔥 Orario Infornate"}\n\n${serializeInfTable(headers, rows)}`.trimEnd();
    setPlan(newPlan);
    if (infPersistRef.current) clearTimeout(infPersistRef.current);
    infPersistRef.current = setTimeout(() => { persistPlan(newPlan); }, 1200);
  };
  const infSetCell = (ri, ci, val) => { if (!infEdit) return; const rows = infEdit.rows.map((r, i) => (i === ri ? r.map((c, k) => (k === ci ? val : c)) : r)); commitInf(infEdit.headers, rows, infEdit.heading); };
  const infDelRow = (ri) => { if (!infEdit) return; commitInf(infEdit.headers, infEdit.rows.filter((_, i) => i !== ri), infEdit.heading); };
  const infAddRow = () => { if (!infEdit) return; commitInf(infEdit.headers, [...infEdit.rows, infEdit.headers.map(() => "")], infEdit.heading); };

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
    setGenerating(true); setPlan(""); setSavedAt(null); setPlanTruncated(false);
    const twoPhase = useWeekly || products.some((p) => p.day);
    try {
      let ok = true;
      let fullText = "";
      let wasTruncated = false;
      if (twoPhase) {
        const r1 = await streamPhase("weekly", t("capo_phase_weekly"));
        const r2 = await streamPhase("daily", t("capo_phase_daily"));
        ok = r1.ok && r2.ok;
        wasTruncated = r1.truncated || r2.truncated;
        fullText = [r1.text, r2.text].filter(Boolean).join("\n\n");
      } else {
        const r1 = await streamPhase("daily", null);
        ok = r1.ok;
        wasTruncated = r1.truncated;
        fullText = r1.text;
      }
      fullText = fullText.replace(/\[\[PLAN_END\]\]/g, "").trimEnd();
      setPlan((p) => p.replace(/\[\[PLAN_END\]\]/g, "").trimEnd());
      setPlanTruncated(wasTruncated);
      if (!ok) toast.warning(t("capo_plan_incomplete"));
      else if (wasTruncated) toast.warning(tri3(lang, "Piano molto lungo: potrebbe essere incompleto. Rigeneralo o spegni qualche modulo.", "Sehr langer Plan: evtl. unvollständig. Neu erstellen oder Module ausschalten.", "Very long plan: it may be incomplete. Regenerate or turn off some modules.", "Plan muy largo: puede estar incompleto. Regénéralo o apaga algún módulo."));
      else fireHighFive(lang === "de" ? "Plan erstellt! 👏" : lang === "en" ? "Plan generated! 👏" : lang === "es" ? "¡Plan generado! 👏" : "Piano generato! 👏");
      if (fullText.trim()) { await persistPlan(fullText); await updateFreezerAfterPlan();
        try { const u = JSON.parse(localStorage.getItem("mikilab_recipe_usage") || "{}"); products.forEach((p) => { if (p.recipe_id && Number(p.qty) > 0) u[p.recipe_id] = (u[p.recipe_id] || 0) + 1; }); localStorage.setItem("mikilab_recipe_usage", JSON.stringify(u)); } catch { /* */ }
      }
    } catch { toast.error(t("chat_error")); }
    finally { setGenerating(false); }
  };

  return (
    <div className="pb-40">
      {onOpenTool && <LabTour force={tourForce} onClose={() => setTourForce(0)} storageKey="mikilab_lab_tour_v2"
        labels={{ skip: tri3(lang, "Salta", "Überspringen", "Skip"), next: tri3(lang, "Avanti", "Weiter", "Next"), done: tri3(lang, "Ho capito!", "Verstanden!", "Got it!") }}
        steps={[
          { target: null, title: tri3(lang, "Ciao, sono Mohammadreza 👋", "Hallo, ich bin Mohammadreza 👋", "Hi, I'm Mohammadreza 👋"),
            body: tri3(lang, "Ti mostro in pochi passi come muoverti nel tuo laboratorio. Meno di un minuto!", "Ich zeige dir in wenigen Schritten dein Labor. Weniger als eine Minute!", "I'll show you in a few steps how to move around your lab. Under a minute!") },
          { target: "capo-source-choice", title: tri3(lang, "1 · Scegli le ricette", "1 · Rezepte wählen", "1 · Pick the recipes"),
            body: tri3(lang, "Tocca «Scegli ricette ora» e aggiungi almeno una ricetta con la quantità. È l'unica cosa davvero obbligatoria.", "Tippe auf „Rezepte jetzt wählen“ und füge mind. ein Rezept mit Menge hinzu. Das ist das Einzige, was Pflicht ist.", "Tap 'Pick recipes now' and add at least one recipe with a quantity. That's the only required thing.") },
          { target: "capo-modules", title: tri3(lang, "2 · Accendi gli extra (facoltativo)", "2 · Extras aktivieren (optional)", "2 · Turn on extras (optional)"),
            body: tri3(lang, "Con gli interruttori ON/OFF aggiungi solo ciò che ti serve: orari, freezer, costi…", "Mit den ON/OFF-Schaltern fügst du nur hinzu, was du brauchst.", "With the ON/OFF switches add only what you need.") },
          { target: "tool-info-celle", title: tri3(lang, "3 · La «i» dorata ti spiega tutto", "3 · Das goldene „i“ erklärt alles", "3 · The golden 'i' explains everything"),
            body: tri3(lang, "Su ogni strumento c'è una «i» DORATA: toccala e io ti spiego a cosa serve (con un suono). Non resterai mai bloccato!", "Auf jedem Werkzeug gibt es ein GOLDENES „i“: tippe darauf und ich erkläre es dir (mit Ton). Du bleibst nie stecken!", "Every tool has a GOLDEN 'i': tap it and I'll explain what it does (with a sound). You'll never get stuck!") },
          { target: "capo-generate", title: tri3(lang, "4 · Genera il piano", "4 · Plan erstellen", "4 · Generate the plan"),
            body: tri3(lang, "Premi «Genera il piano»: creo la sequenza degli impasti, gli orari e la lista. Poi puoi stamparlo o salvarlo.", "Drücke „Plan erstellen“: ich erstelle Teig-Reihenfolge, Zeiten und Liste. Danach drucken oder speichern.", "Press 'Generate the plan': I build the dough sequence, times and list. Then print or save it.") },
          { target: null, title: tri3(lang, "🔥 Sfida della Settimana", "🔥 Challenge der Woche", "🔥 Weekly Challenge"),
            body: tri3(lang, "Nella sezione «Impara» c'è ogni settimana una sfida a tema del Quiz del Fornaio: gareggia con gli amici e diventa «Fornaio della Settimana» 🏆!", "Im Bereich „Lernen“ gibt es jede Woche eine Themen-Challenge im Bäcker-Quiz: tritt gegen Freunde an und werde „Bäcker der Woche“ 🏆!", "In the 'Learn' section there's a weekly themed Baker Quiz challenge: compete with friends and become 'Baker of the Week' 🏆!") },
        ]} />}
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#2f6a97] to-[#6E371C] p-6 text-white">
        <div className="it-de-ribbon absolute top-0 left-0 right-0" />
        {onOpenTool && (
          <button data-testid="lab-menu-open" onClick={() => setMenuOpen(true)} aria-label="Menu strumenti"
            className="absolute top-4 right-4 w-11 h-11 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center active:scale-95 hover:bg-white/25 transition-all">
            <Menu className="w-6 h-6" />
          </button>
        )}
        <Sparkles className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{lang === "de" ? "Produktionsplan mit KI" : lang === "en" ? "AI Production Plan" : lang === "es" ? "Plan de Producción con IA" : "Piano di Produzione con IA"}</h1>
        <p className="text-white/85 text-sm mt-1">{lang === "de" ? "Fülle die Daten aus und lass den Plan generieren" : lang === "en" ? "Fill in the data and generate the plan" : lang === "es" ? "Rellena los datos y genera tu plan de trabajo" : "Compila i dati e genera il tuo piano di lavoro"}</p>
      </div>

      {onOpenTool && menuOpen && (
        <div data-testid="lab-menu-drawer" className="fixed inset-0 z-[200]" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />
          <div onClick={(e) => e.stopPropagation()}
            className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-[#FAF5EC] dark:bg-[#1A1F24] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#6E371C] text-white">
              <span className="font-display text-lg font-bold flex items-center gap-2"><Wrench className="w-5 h-5" /> {tri3(lang, "Tutti gli strumenti", "Alle Werkzeuge", "All tools", "Todas las herramientas")}</span>
              <button data-testid="lab-menu-close" onClick={() => setMenuOpen(false)} className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center active:scale-95"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3 space-y-4">
              {TOOL_CATS.map((c) => {
                const items = TOOLS.filter((tl) => tl.cat === c.key);
                if (items.length === 0) return null;
                return (
                  <div key={c.key} data-testid={`lab-menu-cat-${c.key}`}>
                    <div className="flex items-center gap-2 mb-1.5 pb-1 border-b" style={{ borderColor: `${c.color}40` }}>
                      <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `${c.color}1a` }}>
                        <c.Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                      </span>
                      <span className="font-display text-sm font-bold" style={{ color: c.color }}>{tri3(lang, c.it, c.de, c.en, c.es)}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {items.map((tl) => (
                        <button key={tl.id} data-testid={`lab-menu-tool-${tl.id}`} onClick={() => { setMenuOpen(false); onOpenTool(tl.id); window.scrollTo(0, 0); }}
                          className="flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] active:scale-98 hover:border-[#B45309]/60 transition-all">
                          <tl.Icon className="w-4 h-4 shrink-0" style={{ color: c.color }} />
                          <span className="text-sm font-medium text-[#2B303B] dark:text-[#e4eff8] truncate">{tri3(lang, tl.it, tl.de, tl.en, tl.es)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {onOpenTool && (
        <div data-testid="capo-quicklinks" className="mb-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#6E371C] dark:text-[#a9d2ec] mb-0.5">
              {tri3(lang, "INIZIA", "START", "START")}
            </p>
            <button data-testid="lab-tour-replay" onClick={() => setTourForce((n) => n + 1)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C4A27] px-2.5 py-1 rounded-full border border-[#E6D8C3] dark:border-[#38424B] bg-white dark:bg-[#232A31] active:scale-95 transition-all">
              <HelpCircle className="w-3.5 h-3.5" /> {tri3(lang, "Come si fa?", "Wie geht's?", "How to?")}
            </button>
          </div>
          <p className="text-[10.5px] text-[#7E8A93] mb-2">{tri3(lang, "Passi base per generare il piano", "Basisschritte für den Plan", "Base steps to generate the plan")}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "aggiungi", Icon: BookOpen, label: tri3(lang, "Inserisci Ricette", "Rezepte hinzufügen", "Add Recipes") },
              { id: "lavoro", Icon: ChefHat, label: tri3(lang, "Piano Giornaliero", "Tagesplan", "Daily Plan") },
              { id: "settimana", Icon: CalendarDays, label: tri3(lang, "Produzione Settimanale", "Wochenproduktion", "Weekly Production") },
              { id: "metodo", Icon: Calculator, label: tri3(lang, "Calcolatore Metodo", "Methoden-Rechner", "Method Calculator") },
            ].map(({ id, Icon, label }) => (
              <button key={id} data-testid={`capo-quickstart-${id}`} onClick={() => onOpenTool(id)}
                className="flex items-center gap-2 bg-gradient-to-br from-[#8C4A27] to-[#6E371C] text-white rounded-2xl p-3 text-left active:scale-95 transition-all shadow-sm">
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[12px] font-bold leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(mixers.length === 0 || cells.length === 0) && modules.celle && (
        <div data-testid="capo-setup-hint" className="mb-4 rounded-2xl bg-[#C88A2B]/12 border border-[#C88A2B]/35 p-3.5">
          <p className="text-sm text-[#6E371C] dark:text-[#8FB0C2] leading-snug">
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

      <div className="flex flex-col">
      {/* Spiegazione Mohammadreza: pannello FISSO in fondo, visibile ovunque (niente scroll in alto) */}
      {guideId && (
        <div data-testid="tool-guide-bubble" className="fixed inset-x-0 bottom-0 z-[80] px-3 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 pointer-events-none">
          <div className="mx-auto max-w-md pointer-events-auto flex items-start gap-2.5 rounded-2xl bg-gradient-to-br from-[#6E371C] to-[#8C4A27] text-white p-3 shadow-2xl ring-1 ring-white/15">
            <img src={`${process.env.PUBLIC_URL}/mohammed-avatar.jpg`} alt="Mohammadreza" className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/60 shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">Mohammadreza</p>
              <p className="text-sm leading-snug mt-0.5">{guideFor(guideId, lang)}</p>
              {onOpenTool && guideToolId(guideId) && (
                <button data-testid="tool-guide-open" onClick={() => { const tid = guideToolId(guideId); setGuideId(null); openToolTracked(tid); }}
                  className="mt-2 mr-2 inline-flex items-center gap-1 text-xs font-bold bg-white text-[#6E371C] px-3 py-1.5 rounded-lg active:scale-95"><Wrench className="w-3.5 h-3.5" /> {tri3(lang, "Apri strumento", "Öffnen", "Open tool")}</button>
              )}
              <button data-testid="tool-guide-close" onClick={() => setGuideId(null)}
                className="mt-2 inline-flex text-xs font-semibold bg-white/15 text-white px-3 py-1.5 rounded-lg active:scale-95">{tri3(lang, "Ho capito", "Verstanden", "Got it")}</button>
            </div>
            <button data-testid="tool-guide-x" onClick={() => setGuideId(null)} className="text-white/70 hover:text-white shrink-0"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      <Section order={1} icon={<SlidersHorizontal className="w-4 h-4" />} title={tri3(lang, "SCEGLI ANCHE (interruttori del piano)", "AUCH WÄHLEN (Plan-Schalter)", "ALSO CHOOSE (plan switches)")}>
        <div data-testid="capo-modules-hint" className="mb-3 flex items-center gap-2 rounded-xl bg-[#C88A2B]/15 border border-[#C88A2B]/45 px-3 py-2.5">
          <SlidersHorizontal className="w-4 h-4 text-[#A66A15] shrink-0" />
          <p className="text-[12px] font-bold text-[#7a4e12] dark:text-[#E4C98B] leading-snug">
            {tri3(lang,
              "👆 Interruttori ON/OFF: accendi solo ciò che vuoi nel piano. Tocca la «i» e Mohammadreza ti spiega cosa fa. Il piano base (ricette + quantità) si genera comunque.",
              "👆 ON/OFF-Schalter: aktiviere nur, was du im Plan willst. Tippe auf „i“ und Mohammadreza erklärt es. Der Basisplan (Rezepte + Mengen) wird trotzdem erstellt.",
              "👆 ON/OFF switches: turn on only what you want in the plan. Tap the 'i' and Mohammadreza explains it. The base plan (recipes + quantities) is generated anyway.")}
          </p>
        </div>

        {/* La spiegazione di Mohammadreza ora è un pannello fisso in fondo (vedi sotto): niente più scroll in alto. */}

        <div data-testid="capo-modules" className="grid grid-cols-3 gap-2">
          {MODULES.map(({ id, Icon, it, de, en }) => {
            const on = !!modules[id];
            return (
              <div key={id} data-testid={`capo-module-${id}`} aria-pressed={on} onClick={() => toggleMod(id)}
                className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl p-3 pt-5 text-center transition-all active:scale-95 border min-h-[82px] cursor-pointer ${
                  on
                    ? "bg-[#8C4A27] text-white border-[#8C4A27] shadow-sm"
                    : "bg-white dark:bg-[#232A31] text-[#7E8A93] border-[#E6D8C3] dark:border-[#38424B]"}`}>
                <span className={`absolute top-1.5 left-1.5 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full ${on ? "bg-white/25 text-white" : "bg-[#e4eff8] dark:bg-[#2A323A] text-[#9aa4ac]"}`}>{on ? "ON" : "OFF"}</span>
                <button type="button" data-testid={`tool-info-${id}`} aria-label="info"
                  onClick={(e) => { e.stopPropagation(); openGuide(id); }}
                  className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center active:scale-90 shadow-sm ring-2 ${on ? "bg-white text-[#8C4A27] ring-[#8C4A27]" : "bg-[#C88A2B] text-white ring-white dark:ring-[#232A31]"}`}>
                  <Info className="w-3.5 h-3.5" />
                </button>
                <Icon className={`w-5 h-5 ${on ? "text-white" : "text-[#9aa4ac]"}`} />
                <span className="text-[10.5px] font-semibold leading-tight">{tri3(lang, it, de, en)}</span>
                {onOpenTool && (MODULE_TOOL[id]) && (
                  <button type="button" data-testid={`capo-module-open-${id}`}
                    onClick={(e) => { e.stopPropagation(); openToolTracked(MODULE_TOOL[id] || id); }}
                    className={`mt-0.5 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full active:scale-95 transition-all ${on ? "bg-white text-[#6E371C]" : "bg-[#8C4A27]/12 text-[#8C4A27] border border-[#8C4A27]/30"}`}>
                    <Wrench className="w-2.5 h-2.5" /> {tri3(lang, "Apri strumento", "Öffnen", "Open tool")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section order={3} icon={<Wrench className="w-4 h-4" />} title={tri3(lang, "Apri anche altri strumenti", "Weitere Werkzeuge öffnen", "Open other tools")}>
        <div className="mb-3 rounded-xl bg-[#f7efe0] dark:bg-[#2a2418] border border-[#e5d4b0] dark:border-[#4a3f28] p-2.5 flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-[#C88A2B] flex items-center justify-center text-white shrink-0 mt-0.5"><Info className="w-3 h-3" /></span>
          <p className="text-[11px] text-[#7a5a1f] dark:text-[#d3ab6b] leading-snug">{tri3(lang, "Tocca la «i» dorata su ogni strumento: Mohammadreza ti spiega a cosa serve (con un suono). Poi tocca lo strumento per aprirlo.", "Tippe auf das goldene „i“ auf jedem Werkzeug: Mohammadreza erklärt es dir (mit Ton). Dann tippe auf das Werkzeug, um es zu öffnen.", "Tap the golden 'i' on each tool: Mohammadreza explains what it's for (with a sound). Then tap the tool to open it.")}</p>
        </div>
        {onOpenTool && (
          <>
            <div className="mt-4 mb-2 h-px bg-[#E6D8C3] dark:bg-[#38424B]" />
            {!editTools && (() => {
              const discovered = TOOLS.filter((t) => toolUsage[t.id]).length;
              const total = TOOLS.length;
              const pct = Math.round((discovered / total) * 100);
              const done = discovered >= total;
              return (
                <div data-testid="tools-discovery" className={`mb-3 rounded-2xl border p-3 ${done ? "bg-[#8C4A27]/10 border-[#8C4A27]/40" : "bg-[#C88A2B]/10 border-[#C88A2B]/40"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[12px] font-bold text-[#2B303B] dark:text-[#e4eff8]">
                      {done
                        ? tri3(lang, "🎉 Hai scoperto tutti gli strumenti!", "🎉 Du hast alle Werkzeuge entdeckt!", "🎉 You've discovered every tool!")
                        : tri3(lang, `Hai scoperto ${discovered}/${total} strumenti`, `Du hast ${discovered}/${total} Werkzeuge entdeckt`, `You've discovered ${discovered}/${total} tools`)}
                    </p>
                    <span data-testid="tools-discovery-pct" className={`text-[12px] font-extrabold ${done ? "text-[#336a94]" : "text-[#A66A15]"}`}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${done ? "bg-[#8C4A27]" : "bg-[#C88A2B]"}`} style={{ width: `${pct}%` }} />
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
              const unpin = (id) => { togglePinTool(id); toast.success(tri3(lang, "Rimosso dai preferiti", "Aus Favoriten entfernt", "Removed from favorites")); };
              return (
                <div data-testid="tools-favorites" className="mb-3">
                  <p className="mb-1.5"><span className="font-display text-lg font-bold text-[#C88A2B]">⭐ {tri3(lang, "I tuoi preferiti", "Deine Favoriten", "Your favorites", "Tus favoritos")}</span><span className="text-[11px] font-semibold text-[#7E8A93]">{pinnedFavs.length > 1 ? ` · ${tri3(lang, "trascina per ordinare · tocca la stella per togliere", "ziehen zum Sortieren · Stern zum Entfernen", "drag to reorder · tap star to remove")}` : ` · ${tri3(lang, "tocca la stella per togliere", "Stern zum Entfernen", "tap star to remove")}`}</span></p>
                  <Reorder.Group as="div" axis="x" values={pinnedIds} onReorder={(ids) => savePrefs({ ...toolPrefs, pinned: ids })}
                    className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {pinnedFavs.map(({ id, Icon, it, de, en }) => (
                      <Reorder.Item as="div" key={id} value={id} data-testid={`fav-tool-${id}`}
                        whileDrag={{ scale: 1.07, zIndex: 5 }}
                        onDragStart={() => { favDragMoved.current = true; }}
                        onContextMenu={(e) => { e.preventDefault(); unpin(id); }}
                        onClick={() => { if (favDragMoved.current) { favDragMoved.current = false; return; } openToolTracked(id); }}
                        className="relative shrink-0 w-[104px] flex flex-col items-center justify-center gap-1.5 bg-[#C88A2B]/12 border border-[#C88A2B]/50 rounded-2xl p-3 pt-6 min-h-[70px] cursor-grab active:cursor-grabbing select-none">
                        <button type="button" data-testid={`fav-remove-${id}`} aria-label="remove favorite"
                          onClick={(e) => { e.stopPropagation(); unpin(id); }} onPointerDown={(e) => e.stopPropagation()}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center bg-[#C88A2B] active:scale-90">
                          <Star className="w-3.5 h-3.5 text-white fill-white" />
                        </button>
                        <Icon className="w-5 h-5 text-[#C88A2B]" />
                        <span className="text-[11px] font-semibold leading-tight text-[#2B303B] dark:text-[#e4eff8] text-center">{tri3(lang, it, de, en)}</span>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>
              );
            })()}
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-display text-lg font-bold text-[#6E371C] dark:text-[#a9d2ec]">
                {tri3(lang, "Apri uno strumento", "Werkzeug öffnen", "Open a tool", "Abrir una herramienta")}
              </p>
              <button data-testid="tools-edit-toggle" onClick={() => setEditTools((v) => !v)}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border active:scale-95 transition-all ${editTools ? "bg-[#8C4A27] text-white border-[#8C4A27]" : "bg-white dark:bg-[#232A31] text-[#8C4A27] border-[#E6D8C3] dark:border-[#38424B]"}`}>
                <Settings2 className="w-3.5 h-3.5" /> {editTools ? tri3(lang, "Fatto", "Fertig", "Done") : tri3(lang, "Personalizza", "Anpassen", "Customize")}
              </button>
            </div>
            <p className="text-[10.5px] text-[#7E8A93] mb-2">
              {editTools
                ? tri3(lang, "Trascina per riordinare · occhio = nascondi · stella = preferito · frecce = sposta.", "Ziehen zum Sortieren · Auge = ausblenden · Stern = Favorit · Pfeile = verschieben.", "Drag to reorder · eye = hide · star = favorite · arrows = move.", "Arrastra para reordenar · ojo = ocultar · estrella = favorito · flechas = mover.")
                : tri3(lang, "Tocca per aprirlo. La ⭐ lo aggiunge ai preferiti, la «i» spiega a cosa serve.", "Tippe zum Öffnen. Der ⭐ fügt zu Favoriten hinzu, die „i“ erklärt es.", "Tap to open. The ⭐ adds to favorites, the 'i' explains it.")}
            </p>

            {!editTools && (
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-[#7E8A93] absolute left-3 top-1/2 -translate-y-1/2" />
                <input data-testid="tools-search" value={toolQuery} onChange={(e) => setToolQuery(e.target.value)}
                  placeholder={tri3(lang, "Cerca uno strumento…", "Werkzeug suchen…", "Search a tool…", "Buscar herramienta…")}
                  className="w-full rounded-xl border border-[#E6D8C3] dark:border-[#38424B] bg-white dark:bg-[#232A31] pl-9 pr-3 py-2 text-sm outline-none focus:border-[#8C4A27]" />
              </div>
            )}

            {!editTools && !toolQuery.trim() && suggestedTools.length > 0 && (
              <div data-testid="tools-suggested" className="mb-4">
                <p className="font-display text-lg font-bold text-[#C88A2B] mb-2">{tri3(lang, "Suggeriti per te", "Für dich empfohlen", "Suggested for you", "Sugeridos para ti")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {suggestedTools.map((tl) => renderToolCard(tl))}
                </div>
              </div>
            )}

            {editTools ? (
              <Reorder.Group as="div" axis="y" values={visibleTools.map((t) => t.id)}
                onReorder={(ids) => savePrefs({ ...toolPrefs, order: ids })} className="space-y-2">
                {visibleTools.map((tl) => renderToolReorderRow(tl))}
              </Reorder.Group>
            ) : toolQuery.trim() ? (
              <div className="grid grid-cols-3 gap-2">
                {visibleTools.filter(({ it, de, en }) => {
                  const q = toolQuery.trim().toLowerCase();
                  if (!q) return true;
                  return `${it} ${de} ${en}`.toLowerCase().includes(q);
                }).map((tl) => renderToolCard(tl))}
              </div>
            ) : (
              <div className="space-y-4">
                {TOOL_CATS.map((c) => {
                  const items = visibleTools.filter((tl) => (tl.cat || "gestione") === c.key && !suggestedTools.some((s) => s.id === tl.id));
                  if (items.length === 0) return null;
                  return (
                    <div key={c.key} data-testid={`tools-cat-${c.key}`}>
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b-2" style={{ borderColor: `${c.color}33` }}>
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${c.color}1a` }}>
                          <c.Icon className="w-4 h-4" style={{ color: c.color }} />
                        </span>
                        <p className="font-display text-lg font-bold" style={{ color: c.color }}>{tri3(lang, c.it, c.de, c.en, c.es)}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {items.map((tl) => renderToolCard(tl))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!editTools && hiddenTools.size > 0 && (
              <p data-testid="tools-hidden-note" className="text-[10.5px] text-[#7E8A93] mt-2">
                {tri3(lang, `${hiddenTools.size} strumenti nascosti · tocca «Personalizza» per rivederli.`, `${hiddenTools.size} Werkzeuge ausgeblendet · „Anpassen“ zum Anzeigen.`, `${hiddenTools.size} tools hidden · tap 'Customize' to show them.`)}
              </p>
            )}
          </>
        )}
      </Section>

      <Section order={2} highlight badge={tri3(lang, "Inizia qui", "Hier starten", "Start here")} icon={<Sparkles className="w-4 h-4" />} title={tri3(lang, "Compila per generare", "Zum Generieren ausfüllen", "Fill in to generate")}>
        <div data-testid="capo-source-choice" className="grid grid-cols-2 gap-2 mb-3">
            <button data-testid="capo-source-weekly" onClick={() => setUseWeekly(true)}
              className={`rounded-2xl p-3 text-left border-2 transition-all active:scale-97 ${useWeekly ? "bg-[#8C4A27] text-white border-[#8C4A27]" : "bg-white dark:bg-[#232A31] text-[#6E371C] dark:text-[#a9d2ec] border-[#E6D8C3] dark:border-[#38424B]"}`}>
              <CalendarDays className="w-5 h-5 mb-1" />
              <p className="text-[13px] font-bold leading-tight">{tri3(lang, "Piano Settimanale", "Wochenplan", "Weekly Plan")}</p>
              <p className={`text-[10.5px] leading-snug ${useWeekly ? "text-white/85" : "text-[#7E8A93]"}`}>{tri3(lang, "Usa quello inserito (modificabile)", "Bereits erfasst (änderbar)", "Use what you entered (editable)")}</p>
            </button>
            <button data-testid="capo-source-manual" onClick={() => setUseWeekly(false)}
              className={`rounded-2xl p-3 text-left border-2 transition-all active:scale-97 ${!useWeekly ? "bg-[#8C4A27] text-white border-[#8C4A27]" : "bg-white dark:bg-[#232A31] text-[#6E371C] dark:text-[#a9d2ec] border-[#E6D8C3] dark:border-[#38424B]"}`}>
              <ChefHat className="w-5 h-5 mb-1" />
              <p className="text-[13px] font-bold leading-tight">{tri3(lang, "Aggiungi al piano settimanale", "Zum Wochenplan hinzufügen", "Add to weekly plan")}</p>
              <p className={`text-[10.5px] leading-snug ${!useWeekly ? "text-white/85" : "text-[#7E8A93]"}`}>{tri3(lang, "es. per oggi · a mano", "z. B. für heute · manuell", "e.g. for today · manually")}</p>
            </button>
        </div>
        {/* Ordine EXTRA solo per oggi: si somma al piano di oggi senza modificare il Piano settimanale salvato */}
        <div data-testid="capo-extra-today" className="mb-3 rounded-xl border border-[#C88A2B]/40 bg-[#C88A2B]/8 overflow-hidden">
          <button type="button" data-testid="capo-extra-toggle" onClick={() => { setExtraOpen((s) => !s); if (!extraOpen && extraToday.length === 0) setExtraToday([{ recipe_id: "", name: "", qty: "", unit: "pezzi" }]); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-left active:scale-[0.99] transition-transform">
            <span className="w-7 h-7 rounded-lg bg-[#C88A2B] text-white flex items-center justify-center shrink-0"><Plus className="w-4 h-4" /></span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold text-[#7a4e12] dark:text-[#E4C98B] leading-tight">{tri3(lang, "Ordine extra di oggi", "Extra-Bestellung heute", "Extra order for today")}</span>
              <span className="block text-[10.5px] text-[#7a4e12]/80 dark:text-[#E4C98B]/80 leading-snug">{tri3(lang, "Solo per oggi · si somma al piano, senza modificarlo", "Nur heute · wird addiert, ohne Änderung", "Today only · added on top, plan unchanged")}</span>
            </span>
            {extraToday.filter((x) => x.recipe_id || x.name).length > 0 && (
              <span className="ml-auto text-[10px] font-extrabold text-white bg-[#C88A2B] px-2 py-0.5 rounded-full shrink-0">{extraToday.filter((x) => x.recipe_id || x.name).length}</span>
            )}
          </button>
          {extraOpen && (
            <div className="px-3 pb-3 space-y-2">
              {extraToday.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select data-testid={`capo-extra-recipe-${i}`} value={p.recipe_id || ""}
                    onChange={(e) => { const r = recipes.find((x) => x.id === e.target.value); setExtraToday((l) => l.map((x, k) => k === i ? { ...x, recipe_id: e.target.value, name: r ? r.name : x.name } : x)); }}
                    className="flex-1 min-w-0 bg-white dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#C88A2B]">
                    <option value="">{t("capo_pick_recipe")}</option>
                    {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <div className="relative w-[92px] shrink-0">
                    <input data-testid={`capo-extra-qty-${i}`} type="number" value={p.qty} placeholder={tri3(lang, "Qtà", "Menge", "Qty")}
                      onChange={(e) => setExtraToday((l) => l.map((x, k) => k === i ? { ...x, qty: e.target.value } : x))}
                      className="w-full bg-white dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg p-2 pr-9 text-sm outline-none focus:border-[#C88A2B]" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#7E8A93]">{p.unit === "kg" ? "kg" : t("capo_unit_pieces")}</span>
                  </div>
                  <button type="button" data-testid={`capo-extra-remove-${i}`} onClick={() => setExtraToday((l) => l.filter((_, k) => k !== i))} className="text-[#C0574D] p-1 shrink-0"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button type="button" data-testid="capo-extra-add" onClick={() => setExtraToday((l) => [...l, { recipe_id: "", name: "", qty: "", unit: "pezzi" }])}
                className="text-sm font-medium text-[#C88A2B] flex items-center gap-1"><Plus className="w-4 h-4" /> {t("capo_add_product")}</button>
              <p className="text-[11px] text-[#7a4e12]/80 dark:text-[#E4C98B]/80 leading-snug">
                {tri3(lang, "L'IA aggiungerà una sezione «⭐ Solo per oggi» con impasti e infornate extra, senza toccare il tuo Piano settimanale.",
                  "Die KI fügt einen Abschnitt «⭐ Nur heute» hinzu, ohne den Wochenplan zu ändern.",
                  "The AI will add a '⭐ Today only' section with the extra work, without changing your Weekly Plan.")}
              </p>
            </div>
          )}
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
          <div data-testid="capo-weekly-note" className="mb-3 rounded-xl bg-[#B45309]/12 border border-[#B45309]/35 px-3 py-2.5 space-y-2.5">
            <div className="flex items-start gap-2">
              <CalendarDays className="w-4 h-4 text-[#6E371C] dark:text-[#8FB0C2] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#6E371C] dark:text-[#8FB0C2] leading-snug">
                {tri3(lang,
                  `Genero dal Piano Settimanale (${weeklyItems.length} voci). Per cambiare quantità o giorni apri «Produzione Settimanale».`,
                  `Ich generiere aus dem Wochenplan (${weeklyItems.length} Einträge). Zum Ändern öffne „Wochenproduktion".`,
                  `Generating from the Weekly Plan (${weeklyItems.length} items). To change quantities/days open 'Weekly Production'.`)}
              </p>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#24303c] dark:text-[#a9d2ec] mb-1">
                <Flag className="w-3.5 h-3.5" /> {tri3(lang, "Inizia con quale impasto?", "Mit welchem Teig beginnen?", "Start with which dough?")}
              </label>
              <select data-testid="capo-weekly-start" value={weeklyStartId}
                onChange={(e) => setWeeklyStartId(e.target.value)}
                className="w-full bg-white dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#8C4A27]">
                <option value="">{tri3(lang, "Lascia decidere all'IA", "KI entscheiden lassen", "Let the AI decide")}</option>
                {[...new Map(weeklyItems.map((w) => [w.recipe_id, w])).values()].map((w) => (
                  <option key={w.recipe_id} value={w.recipe_id}>{w.recipe_name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className={`space-y-2 ${useWeekly ? "hidden" : ""}`} data-testid="capo-products">
          {products.map((p, i) => (
            <div key={i} className="bg-white dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <select data-testid={`capo-product-recipe-${i}`} value={p.recipe_id || ""}
                  onChange={(e) => { const r = recipes.find((x) => x.id === e.target.value); setProducts((l) => l.map((x, k) => k === i ? { ...x, recipe_id: e.target.value, name: r ? r.name : x.name } : x)); }}
                  className="flex-1 min-w-0 bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#8C4A27]">
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
                      ? "bg-[#24303c] text-white border-[#24303c]"
                      : "bg-white dark:bg-[#232A31] text-[#7E8A93] border-[#E6D8C3] dark:border-[#38424B]"}`}>
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
                    className="w-full bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg p-2 pr-12 text-sm outline-none focus:border-[#8C4A27]" />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#7E8A93]">{p.unit === "kg" ? "kg" : t("capo_unit_pieces")}</span>
                </div>
                <button type="button" data-testid={`capo-product-opts-${i}`}
                  onClick={() => setProducts((l) => l.map((x, k) => k === i ? { ...x, _opts: !x._opts } : x))}
                  className="shrink-0 text-xs font-semibold text-[#8C4A27] px-2.5 py-2 rounded-lg border border-[#E6D8C3] dark:border-[#38424B] active:scale-95 transition-all">
                  {p._opts ? tri3(lang, "Meno", "Weniger", "Less") : tri3(lang, "Opzioni", "Optionen", "Options")}
                </button>
              </div>
              {p._opts && (
                <div className="flex items-center gap-2 flex-wrap">
                  <select data-testid={`capo-product-unit-${i}`} value={p.unit}
                    onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, unit: e.target.value } : x))}
                    className="w-[80px] shrink-0 bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#8C4A27]">
                    <option value="pezzi">{t("capo_unit_pieces")}</option>
                    <option value="kg">{t("capo_unit_kg")}</option>
                  </select>
                  {p.unit === "pezzi" && (
                    <div className="relative w-[80px] shrink-0">
                      <input data-testid={`capo-product-gpp-${i}`} type="number" value={p.gpp ?? ""} placeholder="g/pz"
                        onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, gpp: e.target.value } : x))}
                        className="w-full bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg p-2 pr-6 text-sm outline-none focus:border-[#8C4A27]" />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[#7E8A93]">g</span>
                    </div>
                  )}
                  <select data-testid={`capo-product-day-${i}`} value={p.day || ""}
                    onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, day: e.target.value } : x))}
                    className="flex-1 min-w-[110px] bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#8C4A27]">
                    {DAYS.map((d) => <option key={d} value={d}>{d === "" ? t("capo_day_any") : t(`day_${d}`)}</option>)}
                  </select>
                </div>
              )}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <button data-testid="capo-product-add" onClick={() => setProducts((l) => [...l, { recipe_id: "", name: "", qty: "", unit: "pezzi", gpp: "", day: "", start: false }])} className="text-sm font-medium text-[#8C4A27] flex items-center gap-1"><Plus className="w-4 h-4" /> {t("capo_add_product")}</button>
            <button data-testid="capo-open-picker" onClick={() => { setPickSearch(""); setPickerOpen(true); }} className="text-sm font-semibold text-white bg-[#8C4A27] px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95"><ChefHat className="w-4 h-4" /> {tri3(lang, "Aggiungi ricette", "Rezepte hinzufügen", "Add recipes")}</button>
            {savedProducts.length > 0 && (
              <button data-testid="capo-restore-prev" onClick={restorePrevPlan} className="text-sm font-semibold text-[#6E371C] dark:text-[#a9d2ec] bg-[#B45309]/12 border border-[#B45309]/30 px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95"><RotateCcw className="w-3.5 h-3.5" /> {tri3(lang, "Riparti dall'ultimo piano", "Vom letzten Plan starten", "Reuse last plan")}</button>
            )}
          </div>
          <p className="text-[11px] text-[#7E8A93] leading-snug mt-1.5 flex items-start gap-1">
            <Flag className="w-3.5 h-3.5 text-[#24303c] shrink-0 mt-0.5" />
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
          <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setPickerOpen(false)}>
            <div className="bg-white dark:bg-[#1B2127] w-full sm:max-w-md max-h-[82vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-[#E6D8C3] dark:border-[#38424B]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri3(lang, "Aggiungi ricette", "Rezepte hinzufügen", "Add recipes")}</h3>
                  <button data-testid="capo-picker-close" onClick={() => setPickerOpen(false)} className="text-[#7E8A93] p-1"><X className="w-5 h-5" /></button>
                </div>
                <input data-testid="capo-picker-search" value={pickSearch} onChange={(e) => setPickSearch(e.target.value)} autoFocus
                  placeholder={tri3(lang, "Cerca ricetta…", "Rezept suchen…", "Search recipe…")}
                  className="w-full bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl p-2.5 text-sm outline-none focus:border-[#8C4A27]" />
              </div>
              <div className="overflow-y-auto p-2 flex-1">
                {recipes.filter((r) => (r.name || "").toLowerCase().includes(pickSearch.toLowerCase())).map((r) => {
                  const sel = products.some((p) => p.recipe_id === r.id);
                  return (
                    <button key={r.id} data-testid={`capo-pick-${r.id}`} onClick={() => (sel ? removeByRecipe(r.id) : addRecipes([r.id]))}
                      className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left mb-1 transition-all ${sel ? "bg-[#8C4A27]/12 border border-[#8C4A27]/40" : "hover:bg-[#e4eff8] dark:hover:bg-[#2A323A] border border-transparent"}`}>
                      {sel ? <CheckCircle2 className="w-5 h-5 text-[#8C4A27] shrink-0" /> : <span className="w-5 h-5 rounded-full border-2 border-[#E6D8C3] dark:border-[#4a5560] shrink-0" />}
                      <span className="flex-1 min-w-0 text-sm text-[#2B303B] dark:text-[#e4eff8] truncate">{r.name}</span>
                      {r._own && <span className="text-[10px] text-[#C88A2B]">★</span>}
                    </button>
                  );
                })}
              </div>
              <div className="p-3 border-t border-[#E6D8C3] dark:border-[#38424B]">
                <button data-testid="capo-picker-done" onClick={() => setPickerOpen(false)} className="w-full bg-[#8C4A27] text-white font-semibold py-2.5 rounded-xl active:scale-98">
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
          <div data-testid="capo-temp-msg" className={`mt-2 text-sm rounded-xl px-3 py-2 border ${tempDelta && Math.abs(tempDelta) >= 1 ? "bg-[#B45309]/15 border-[#B45309]/40 text-[#6E371C] dark:text-[#8FB0C2]" : "bg-[#B45309]/12 border-[#B45309]/30 text-[#8C4A27] dark:text-[#a9d2ec]"}`}>
            <Thermometer className="w-4 h-4 inline mr-1" />{tempMsg}
          </div>
        )}
        <div className="mt-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{lang === "de" ? "Ziel des Plans" : lang === "en" ? "Plan goal" : lang === "es" ? "Objetivo del plan" : "Obiettivo del piano"}</label>
          <select data-testid="capo-plan-goal" value={planGoal} onChange={(e) => setPlanGoal(e.target.value)}
            className="mt-1 w-full bg-white dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl p-3 text-sm outline-none focus:border-[#8C4A27]">
            <option value="qualita">{lang === "de" ? "🥖 Handwerkliche Qualität (langsame Gare, Struktur)" : lang === "en" ? "🥖 Artisan quality (slow proof, structure)" : lang === "es" ? "🥖 Calidad artesanal (fermentaciones lentas, estructura)" : "🥖 Qualità artigianale (lievitazioni lente, struttura)"}</option>
            <option value="resa">{lang === "de" ? "📈 Maximaler Output (Öfen/Kammern optimieren)" : lang === "en" ? "📈 Maximum output (optimise ovens/cells)" : lang === "es" ? "📈 Máximo rendimiento (optimizar hornos/cámaras)" : "📈 Massima resa (ottimizza forni/celle)"}</option>
            <option value="tempo">{lang === "de" ? "⏱️ Zeit sparen (schnellere Abläufe)" : lang === "en" ? "⏱️ Save time (faster sequences)" : lang === "es" ? "⏱️ Ahorrar tiempo (secuencias más rápidas)" : "⏱️ Risparmio di tempo (sequenze più rapide)"}</option>
            <option value="spreco">{lang === "de" ? "♻️ Weniger Abfall (Teig/Unverkauftes verwerten)" : lang === "en" ? "♻️ Less waste (reuse dough/unsold)" : lang === "es" ? "♻️ Menos desperdicio (reutilizar masa/no vendido)" : "♻️ Riduci gli sprechi (recupero impasti/invenduto)"}</option>
            <option value="grandi">{lang === "de" ? "🎁 Nur große Hefegebäcke (Panettone, Colomba…)" : lang === "en" ? "🎁 Large leavened cakes only (panettone, colomba…)" : lang === "es" ? "🎁 Solo grandes levados (panettone, colomba…)" : "🎁 Solo grandi lievitati (panettoni, colombe…)"}</option>
            <option value="lotti">{lang === "de" ? "📦 Wenige Teige, große Chargen" : lang === "en" ? "📦 Few doughs, large batches" : lang === "es" ? "📦 Pocas masas, grandes lotes" : "📦 Pochi impasti, grandi lotti"}</option>
          </select>
          <p className="mt-1 text-[11px] text-[#7E8A93] leading-snug">{lang === "de" ? "Orientiert die KI bei der Erstellung deines Plans." : lang === "en" ? "Guides the AI when building your plan." : lang === "es" ? "Orienta a la IA al generar tu plan." : "Orienta l'AI nella generazione del tuo piano."}</p>
        </div>

        <div className="mt-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{t("capo_notes")}</label>
          <div className="flex flex-wrap gap-1.5 mt-1 mb-1.5">
            <button type="button" data-testid="capo-cmd-mohammadreza"
              onClick={() => setNotes(tri3(lang,
                "Ciao Mohammadreza, sono in laboratorio e devo gestire la produzione. Voglio che analizzi la situazione, ricalcoli l'intero piano di lavoro a ritroso e mi dica esattamente cosa fare ora per ora. Se ci sono ordini urgenti, adatta gli slot del forno, le impastatrici e la cella frigo senza far bruciare o ritardare gli altri pani. Calcola anche la temperatura dell'acqua, l'idratazione corretta e inviami la timeline aggiornata con la conferma da premere.",
                "Hallo Mohammadreza, ich bin in der Backstube und muss die Produktion steuern. Analysiere die Lage, rechne den gesamten Arbeitsplan rückwärts neu und sag mir Stunde für Stunde genau, was zu tun ist. Bei dringenden Bestellungen passe Ofen-, Kneter- und Kühlzeiten an, ohne andere Brote zu verbrennen oder zu verzögern. Berechne auch Wassertemperatur und Hydratation und schick mir die aktualisierte Timeline mit Bestätigung.",
                "Hi Mohammadreza, I'm in the bakery and need to manage production. Analyse the situation, recalculate the whole work plan backwards and tell me exactly what to do hour by hour. If there are urgent orders, adapt oven, mixer and fridge slots without burning or delaying the other breads. Also calculate water temperature and correct hydration and send me the updated timeline with a confirmation to press."))}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8C4A27] bg-[#8C4A27]/10 border border-[#8C4A27]/30 px-2.5 py-1 rounded-full active:scale-95">
              <Sparkles className="w-3 h-3" /> {tri3(lang, "Gestisci la produzione ora", "Produktion jetzt steuern", "Manage production now")}
            </button>
            <button type="button" data-testid="capo-cmd-emergenza"
              onClick={() => setNotes(tri3(lang,
                "Ciao Mohammadreza, è arrivato un ordine extra all'ultimo momento e devo aggiungerlo alla produzione di oggi senza far ritardare o rovinare gli impasti già avviati. Dimmi in quale impastatrice inserirlo, come spostare gli slot del forno e della cella, e ricalcola la timeline ora per ora con le nuove quantità.",
                "Hallo Mohammadreza, es kam kurzfristig eine Extrabestellung und ich muss sie in die heutige Produktion aufnehmen, ohne die bereits gestarteten Teige zu verzögern oder zu verderben. Sag mir, in welchen Kneter ich sie gebe, wie ich Ofen- und Kammerzeiten verschiebe, und rechne die Timeline stundenweise mit den neuen Mengen neu.",
                "Hi Mohammadreza, a last-minute extra order came in and I need to add it to today's production without delaying or ruining the doughs already started. Tell me which mixer to use, how to shift the oven and cell slots, and recalculate the timeline hour by hour with the new quantities."))}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#C0574D] bg-[#C0574D]/10 border border-[#C0574D]/30 px-2.5 py-1 rounded-full active:scale-95">
              <Sparkles className="w-3 h-3" /> {tri3(lang, "Ordine urgente extra", "Dringende Extrabestellung", "Urgent extra order")}
            </button>
            <button type="button" data-testid="capo-cmd-correzione"
              onClick={() => setNotes(tri3(lang,
                "Ciao Mohammadreza, l'impasto di oggi non è venuto come volevo (dimmi tu quali difetti controllare: struttura, idratazione, lievitazione, cottura). Analizza le possibili cause e correggi la ricetta e i tempi per la prossima volta: idratazione, temperatura dell'acqua, dosi di prefermento, durata di puntata e appretto. Dammi la versione corretta pronta da usare.",
                "Hallo Mohammadreza, der heutige Teig ist nicht wie gewünscht geworden (sag mir, welche Fehler ich prüfen soll: Struktur, Hydratation, Gare, Backen). Analysiere die möglichen Ursachen und korrigiere Rezept und Zeiten für das nächste Mal: Hydratation, Wassertemperatur, Vorteigmengen, Stock- und Stückgare. Gib mir die korrigierte, einsatzbereite Version.",
                "Hi Mohammadreza, today's dough didn't turn out as I wanted (tell me which faults to check: structure, hydration, proofing, baking). Analyse the possible causes and correct the recipe and timings for next time: hydration, water temperature, preferment amounts, bulk and final proof. Give me the corrected version ready to use."))}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#a9772f] bg-[#a9772f]/10 border border-[#a9772f]/30 px-2.5 py-1 rounded-full active:scale-95">
              <Sparkles className="w-3 h-3" /> {tri3(lang, "Correggi la ricetta", "Rezept korrigieren", "Fix the recipe")}
            </button>
            <button type="button" data-testid="capo-cmd-domani"
              onClick={() => setNotes(tri3(lang,
                "Ciao Mohammadreza, prepariamo già la produzione di domani. In base ai prodotti e alle quantità che ti indico, dimmi quali prefermenti e rinfreschi devo avviare stasera, a che ora, con quali dosi e temperature. Poi costruisci la timeline completa di domani a ritroso dall'orario di apertura, con impasti, celle e forni organizzati.",
                "Hallo Mohammadreza, lass uns die morgige Produktion vorbereiten. Sag mir anhand der Produkte und Mengen, welche Vorteige und Auffrischungen ich heute Abend ansetzen muss, um wie viel Uhr, mit welchen Mengen und Temperaturen. Erstelle dann die komplette Timeline für morgen rückwärts ab Öffnungszeit, mit organisierten Teigen, Kammern und Öfen.",
                "Hi Mohammadreza, let's prepare tomorrow's production now. Based on the products and quantities I give you, tell me which preferments and refreshes I must start tonight, at what time, with which amounts and temperatures. Then build tomorrow's full timeline backwards from opening time, with doughs, cells and ovens organised."))}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2e8b6f] bg-[#2e8b6f]/10 border border-[#2e8b6f]/30 px-2.5 py-1 rounded-full active:scale-95">
              <Sparkles className="w-3 h-3" /> {tri3(lang, "Pianifica domani", "Morgen planen", "Plan tomorrow")}
            </button>
          </div>
          <textarea data-testid="capo-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="mt-1 w-full bg-white dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl p-3 text-sm outline-none focus:border-[#8C4A27] resize-none" />
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
            <div data-testid="capo-cost-summary" className="mt-4 rounded-2xl bg-[#6E371C]/8 border border-[#6E371C]/25 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Euro className="w-4 h-4 text-[#6E371C] dark:text-[#a9d2ec]" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#6E371C] dark:text-[#a9d2ec]">{tri3(lang, "Costi & Margine", "Kosten & Marge", "Costs & Margin")}</span>
              </div>
              <div className="space-y-1.5">
                {rows.map((x, i) => (
                  <div key={i} data-testid={`capo-cost-row-${i}`} className="flex items-center justify-between text-sm">
                    <span className="text-[#3F4A54] dark:text-[#AEB8BF] truncate flex-1">{x.name} <span className="text-[#7E8A93]">×{x.qty}</span></span>
                    <span className="font-mono-data text-[#7E8A93] mr-3">{x.cost != null ? eur(x.cost) : "—"}</span>
                    <span className="font-mono-data font-semibold text-[#6E371C] dark:text-[#a9d2ec]">{x.rev != null ? eur(x.rev) : "—"}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#6E371C]/20 grid grid-cols-3 gap-2 text-center">
                <div><p className="text-[10px] uppercase text-[#7E8A93]">{tri3(lang, "Costo", "Kosten", "Cost")}</p><p className="font-mono-data font-bold text-[#2e3d4c]">{eur(totCost)}</p></div>
                <div><p className="text-[10px] uppercase text-[#7E8A93]">{tri3(lang, "Ricavo", "Umsatz", "Revenue")}</p><p className="font-mono-data font-bold text-[#6E371C] dark:text-[#a9d2ec]">{eur(totRev)}</p></div>
                <div><p className="text-[10px] uppercase text-[#7E8A93]">{tri3(lang, "Margine", "Marge", "Margin")}</p><p className="font-mono-data font-bold text-[#8C4A27]">{eur(margin)}{marginPct != null ? ` · ${marginPct.toFixed(0)}%` : ""}</p></div>
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
          className="mt-3 w-full bg-[#8C4A27] hover:bg-[#336a94] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2">
          <ChefHat className="w-5 h-5" /> {generating ? t("capo_generating") : t("capo_generate")}
        </button>
        {!canGenerate && (
          <p data-testid="capo-generate-hint" className="text-[11px] text-[#2e3d4c] mt-1.5 text-center">
            {tri3(lang, "⚠️ Obbligatorio: scegli almeno una ricetta e la quantità per generare il piano.",
              "⚠️ Pflicht: Wähle mindestens ein Rezept und die Menge, um den Plan zu erstellen.",
              "⚠️ Required: choose at least one recipe and quantity to generate the plan.")}
          </p>
        )}

        {plan && (
          <>
            <div data-testid="capo-saved-banner" className="no-print mt-4 rounded-2xl bg-[#B45309]/12 border border-[#B45309]/35 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <CheckCircle2 className="w-5 h-5 text-[#336a94] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#6E371C] dark:text-[#a9d2ec] leading-tight">
                    {savedAt
                      ? tri3(lang, "Piano salvato — resta qui finché non lo chiudi tu", "Plan gespeichert — bleibt hier, bis du ihn schließt", "Plan saved — it stays here until you close it")
                      : tri3(lang, "Piano generato", "Plan erstellt", "Plan generated")}
                  </p>
                  {savedAt && (
                    <p className="text-[11px] text-[#7E8A93] mt-0.5">
                      {tri3(lang, "Salvato il", "Gespeichert am", "Saved on", "Guardado el")} {new Date(savedAt).toLocaleString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : lang === "es" ? "es-ES" : "it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
              <button data-testid="capo-new-plan" onClick={clearPlan}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E371C] dark:text-[#e4eff8] bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] px-3 py-2 rounded-xl active:scale-95 transition-all">
                <RotateCcw className="w-3.5 h-3.5" /> {tri3(lang, "Nuovo piano", "Neuer Plan", "New plan")}
              </button>
            </div>
            <div data-testid="capo-phase-timers" className="no-print mt-2 rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#8C4A27] mb-2 flex items-center gap-1.5"><TimerIcon className="w-4 h-4" /> {tri3(lang, "Timer di fase (Smart Timer)", "Phasen-Timer (Smart Timer)", "Phase timers (Smart Timer)", "Temporizadores de fase")}</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { k: "pieghe", label: tri3(lang, "Pieghe", "Falten", "Folds", "Pliegues"), min: 30, repeat: true },
                  { k: "puntata", label: tri3(lang, "Puntata", "Stockgare", "Bulk", "Fermentación"), min: 90 },
                  { k: "appretto", label: tri3(lang, "Appretto", "Stückgare", "Proof", "Formado"), min: 60 },
                  { k: "cottura", label: tri3(lang, "Cottura", "Backen", "Bake", "Cocción"), min: 40 },
                ].map((p) => (
                  <button key={p.k} data-testid={`capo-phase-timer-${p.k}`} onClick={() => startPhaseTimer(p.label, p.min, p.repeat)}
                    className="relative flex flex-col items-center gap-0.5 py-2.5 rounded-xl bg-[#FAF5EC] dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] active:scale-95 hover:border-[#B45309] transition-all">
                    {p.repeat && <RefreshCw className="absolute top-1.5 right-1.5 w-3 h-3 text-[#B45309]" />}
                    <span className="text-[12px] font-bold text-[#2B303B] dark:text-[#e4eff8]">{p.label}</span>
                    <span className="font-mono-data text-[10px] text-[#7E8A93]">{p.min}′</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#7E8A93] mt-1.5">{tri3(lang, "I timer suonano anche mentre usi altri strumenti.", "Timer klingeln auch bei anderen Werkzeugen.", "Timers ring even while using other tools.", "Suenan aunque uses otras herramientas.")}</p>
            </div>
            <button data-testid="capo-quick-archive" onClick={() => capoArchiveRef.current?.openSave()}
              className="no-print mt-2 w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#6E371C] dark:text-[#8FB0C2] bg-[#e4eff8] dark:bg-[#2A323A] border border-[#E6D8C3] dark:border-[#38424B] px-4 py-2.5 rounded-2xl active:scale-98 transition-all">
              <Archive className="w-4 h-4" /> {tri3(lang, "Salva questo piano nell'archivio", "Diesen Plan im Archiv speichern", "Save this plan to the archive")}
            </button>
            <div className="no-print mt-3">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#8C4A27] mb-1.5">{tri3(lang, "Note del fornaio (finiscono nel PDF)", "Notizen des Bäckers (kommen ins PDF)", "Baker's notes (added to the PDF)", "Notas del panadero (van al PDF)")}</label>
              <textarea data-testid="capo-baker-note" value={bakerNote} onChange={(e) => setBakerNote(e.target.value)} rows={2}
                placeholder={tri3(lang, "Es. attaccare la biga alle 22:00, controllare il forno n.2…", "z. B. Biga um 22:00 ansetzen, Ofen Nr. 2 prüfen…", "e.g. start the biga at 22:00, check oven no. 2…", "Ej. iniciar la biga a las 22:00, revisar el horno n.º 2…")}
                className="w-full rounded-xl border border-[#E6D8C3] dark:border-[#38424B] bg-white dark:bg-[#232A31] px-3 py-2 text-sm outline-none focus:border-[#8C4A27] resize-y" />
            </div>
            <button data-testid="capo-print" onClick={() => window.print()}
              className="no-print mt-3 w-full bg-[#B45309] hover:bg-[#336a94] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
              <Printer className="w-5 h-5" /> {tri3(lang, "PDF Completo (piano + spesa + ricette)", "Komplettes PDF (Plan + Einkauf + Rezepte)", "Full PDF (plan + shopping + recipes)")}
            </button>
            {!generating && (
              <button data-testid="capo-voice" onClick={() => setPlanHF(true)}
                className="no-print mt-2 w-full bg-[#C88A2B] hover:bg-[#a66f20] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
                <ChefHat className="w-5 h-5" /> {tri3(lang, "Leggi il piano a voce (mani libere)", "Plan vorlesen (Hände frei)", "Read the plan aloud (hands-free)", "Leer el plan en voz alta (manos libres)")}
              </button>
            )}
            <button data-testid="capo-share" onClick={() => shareContent(lang === "de" ? "Produktionsplan — MikiLab" : lang === "en" ? "Production plan — MikiLab" : lang === "es" ? "Plan de producción — MikiLab" : "Piano di Produzione — MikiLab", plan, lang)}
              className="no-print mt-2 w-full bg-[#e4eff8] dark:bg-[#2A323A] text-[#2B303B] dark:text-[#e4eff8] font-medium px-5 py-3 rounded-2xl border border-[#E6D8C3] dark:border-[#38424B] active:scale-98 transition-all flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5" /> {lang === "de" ? "Teilen" : lang === "en" ? "Share" : lang === "es" ? "Compartir" : "Condividi"}
            </button>

            <div className="print-area mt-4 space-y-4">
              <PrintHeader title={tri3(lang, "Piano di Produzione", "Produktionsplan", "Production Plan", "Plan de Producción")} lang={lang} />
              {bakerNote.trim() && (
                <div data-testid="capo-baker-note-print" className="print-table rounded-xl border border-[#C88A2B]/40 bg-[#C88A2B]/8 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#A66A15] mb-1">{tri3(lang, "Note del fornaio", "Notizen des Bäckers", "Baker's notes", "Notas del panadero")}</p>
                  <p className="text-sm text-[#2B303B] dark:text-[#e4eff8] whitespace-pre-wrap leading-relaxed">{bakerNote}</p>
                </div>
              )}
              <div data-testid="capo-plan" className="markdown-body bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-2xl p-5 text-sm leading-relaxed text-[#2B303B] dark:text-[#e4eff8]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C4A27] mb-2">{t("capo_plan_title")}</p>
                {planTruncated && (
                  <div data-testid="capo-plan-truncated" className="no-print mb-3 flex items-start gap-2 rounded-xl border border-[#C0574D]/40 bg-[#C0574D]/10 px-3 py-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#C0574D] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#8f3a32] dark:text-[#e79a91] leading-relaxed">
                      {tri3(lang,
                        "⚠️ Il piano potrebbe essere incompleto (troppo lungo). Rigeneralo, oppure spegni qualche modulo per accorciarlo.",
                        "⚠️ Der Plan ist evtl. unvollständig (zu lang). Neu erstellen oder Module ausschalten.",
                        "⚠️ The plan may be incomplete (too long). Regenerate it, or turn off some modules to shorten it.",
                        "⚠️ El plan puede estar incompleto (demasiado largo). Regénéralo o apaga algún módulo.")}
                    </p>
                  </div>
                )}
                {(() => {
                  const showInf = !generating && infEdit && infEdit.headers && infEdit.headers.length > 0;
                  const body = showInf ? parseInfornate(plan).body : plan;
                  return (
                    <>
                      <ReactMarkdown>{body}</ReactMarkdown>
                      {showInf && (
                        <div data-testid="capo-infornate-editor" className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[12px] font-bold text-[#2B303B] dark:text-[#e4eff8]">🔥 {tri3(lang, "Orario Infornate (modificabile)", "Backfahrplan (bearbeitbar)", "Baking schedule (editable)", "Horario de horneado (editable)")}</p>
                            <button data-testid="capo-inf-add-row" onClick={infAddRow} className="no-print inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C4A27] border border-[#8C4A27]/40 px-2 py-1 rounded-lg active:scale-95">
                              <Plus className="w-3.5 h-3.5" /> {tri3(lang, "Riga", "Zeile", "Row", "Fila")}
                            </button>
                          </div>
                          <div className="overflow-x-auto print-table rounded-xl border border-[#E6D8C3] dark:border-[#38424B]">
                            <table className="w-full text-[12px] border-collapse">
                              <thead>
                                <tr className="bg-[#e4eff8] dark:bg-[#2A323A]">
                                  {infEdit.headers.map((h, ci) => (
                                    <th key={ci} className="text-left font-bold text-[#6E371C] dark:text-[#a9d2ec] px-2 py-1.5 whitespace-nowrap">{h}</th>
                                  ))}
                                  <th className="no-print w-8" />
                                </tr>
                              </thead>
                              <tbody>
                                {infEdit.rows.map((r, ri) => (
                                  <tr key={ri} data-testid={`capo-inf-row-${ri}`} className="border-t border-[#E6D8C3] dark:border-[#38424B]">
                                    {infEdit.headers.map((_, ci) => (
                                      <td key={ci} className="px-1 py-1 align-top">
                                        <input data-testid={`capo-inf-cell-${ri}-${ci}`} value={r[ci] ?? ""} onChange={(e) => infSetCell(ri, ci, e.target.value)}
                                          className="w-full min-w-[70px] bg-transparent px-1.5 py-1 rounded-md outline-none focus:bg-[#8C4A27]/8 border border-transparent focus:border-[#8C4A27]/40" />
                                      </td>
                                    ))}
                                    <td className="no-print px-1 py-1 align-middle">
                                      <button data-testid={`capo-inf-del-${ri}`} onClick={() => infDelRow(ri)} aria-label="delete row" className="text-[#C0574D] p-1 active:scale-90"><X className="w-3.5 h-3.5" /></button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div data-testid="capo-plan-disclaimer" className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
                    {tri3(lang,
                      "Piano generato dall'IA a scopo indicativo. Tempi, temperature e idratazione vanno sempre validati dal fornaio in base a farina, ambiente e attrezzatura.",
                      "KI-generierter Plan als Richtwert. Zeiten, Temperaturen und Hydratation müssen stets vom Bäcker anhand von Mehl, Umgebung und Ausstattung geprüft werden.",
                      "AI-generated plan for guidance only. Times, temperatures and hydration must always be validated by the baker based on flour, environment and equipment.",
                      "Plan generado por IA a título orientativo. Los tiempos, temperaturas e hidratación deben ser validados siempre por el panadero según la harina, el entorno y el equipo."
                    )}
                  </p>
                </div>
              </div>

              {modules.spesa && <SupplierOrder totals={shopTotals} />}

              {usedRecipes.length > 0 && (
                <div data-testid="capo-recipes" className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#8C4A27]">{t("capo_recipes_title")}</p>
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
            ? { plan_text: plan, state: { products, useWeekly, staff, stdTemp, labTemp, startTime, notes, preferment, planGoal, bizType, modules } }
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
      {planHF && (
        <HandsFreeMode
          recipe={{ id: "plan" }}
          procedure={(plan || "").replace(/\[\[PLAN_END\]\]/g, "").replace(/^#{1,6}\s*/gm, "").replace(/[*`>_]/g, "").replace(/\|/g, "  ").split("\n").map((l) => l.trim()).filter(Boolean).join("\n")}
          lang={lang}
          onClose={() => setPlanHF(false)}
        />
      )}
    </div>
  );
}

function RecipePrint({ r, lang }) {
  const ing = [
    [lang === "de" ? "Mehl" : lang === "en" ? "Flour" : lang === "es" ? "Harina" : "Farina", r.flour_grams],
    [lang === "de" ? "Wasser" : lang === "en" ? "Water" : lang === "es" ? "Agua" : "Acqua", r.water_grams],
    [lang === "de" ? "Vorteig/Sauerteig" : lang === "en" ? "Preferment/Sourdough" : lang === "es" ? "Prefermento/Masa madre" : "Prefermento/Lievito madre", r.sourdough_grams],
    [lang === "de" ? "Salz" : lang === "en" ? "Salt" : lang === "es" ? "Sal" : "Sale", r.salt_grams],
  ].filter(([, g]) => Number(g) > 0);
  const proc = rLoc(r, "procedure", lang);
  return (
    <div className="bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] rounded-2xl p-4">
      <h3 className="font-display text-base font-bold text-[#2B303B] dark:text-[#e4eff8]">{rLoc(r, "name", lang)}</h3>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
        {ing.map(([label, g]) => (
          <div key={label} className="flex items-center justify-between text-xs">
            <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{label}</span>
            <span className="font-mono-data font-bold text-[#6E371C] dark:text-[#8FB0C2]">{g} g</span>
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

function Section({ icon, title, children, highlight, badge, order }) {
  const ACCENTS = { 1: "#8C4A27", 2: "#C88A2B", 3: "#2e8b6f", 4: "#7a4fbf", 5: "#b23a2f" };
  const accent = ACCENTS[order] || "#8C4A27";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={order ? { order } : undefined}
      className={`relative mb-4 rounded-2xl p-4 pl-5 overflow-hidden ${highlight
        ? "bg-white dark:bg-[#232A31] border-2 border-[#C88A2B] shadow-lg shadow-[#C88A2B]/20 ring-1 ring-[#C88A2B]/30"
        : "bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B]"}`}>
      <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: accent }} />
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: accent }}>{icon}</span>
        <h2 className="font-display text-[17px] font-bold leading-tight" style={{ color: accent }}>{title}</h2>
        {badge && <span className="ml-auto text-[10px] font-extrabold uppercase tracking-wide text-white bg-[#C88A2B] px-2 py-0.5 rounded-full shadow">{badge}</span>}
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
          className="w-full bg-white dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl p-2.5 text-sm outline-none focus:border-[#8C4A27]" />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7E8A93] pointer-events-none">{unit}</span>}
      </div>
    </div>
  );
}
