import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { motion, Reorder } from "framer-motion";
import { ChefHat, Plus, X, Thermometer, Sparkles, Printer, Share2, CalendarDays, Clock, ShoppingCart, Euro, Store, Users, BookOpen, Snowflake, CheckCircle2, RotateCcw, FlaskConical, Flag, Recycle, Wrench, SlidersHorizontal, Building2, Scale, Flame, Droplets, Timer as TimerIcon, CloudSun, Camera, QrCode, ScanLine, ListChecks, CalendarClock, Archive, Info, Eye, EyeOff, ChevronUp, ChevronDown, Settings2, HelpCircle, Star, Search, AlertTriangle, GripVertical, Activity } from "lucide-react";
import { API, labConfigApi, recipesApi, weeklyApi, capoPlanApi, subscriptionApi } from "@/lib/api";
import { computeRecipeCostPerPiece } from "@/data/prices";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { computeShopping } from "@/lib/shopping";
import SupplierOrder from "@/components/SupplierOrder";
import { fireHighFive } from "@/components/HighFive";
import PlanArchive from "@/components/PlanArchive";
import LabTour from "@/components/LabTour";
import { getActiveMachineNames } from "@/lib/machines";
import { guideFor } from "@/lib/toolGuide";
import { shareContent } from "@/lib/share";
import { rLoc } from "@/lib/loc";
import PrintHeader from "@/components/PrintHeader";
import HandsFreeMode from "@/components/HandsFreeMode";

const DAYS = ["", "lun", "mar", "mer", "gio", "ven", "sab", "dom"];

const tri3 = (lang, i, d, e, s) => (lang === "de" ? (d ?? i) : lang === "en" ? (e ?? i) : lang === "es" ? (s ?? e ?? i) : i);

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
const DEFAULT_MODULES = { celle: true, orari: true, freezer: true, spesa: true, foodcost: true, infornate: true, turni: false, clima: false, punti: false, antispreco: false };
const MODULES = [
  { id: "celle", Icon: Wrench, it: "Celle & Impastatrici", de: "Kammern & Kneter", en: "Cells & Mixers" },
  { id: "orari", Icon: Clock, it: "Orari d'inizio", de: "Startzeiten", en: "Start times" },
  { id: "freezer", Icon: Snowflake, it: "Giacenze Freezer", de: "Gefrierbestand", en: "Freezer stock" },
  { id: "infornate", Icon: Flame, it: "Orario Infornate", de: "Backzeiten", en: "Baking schedule" },
  { id: "turni", Icon: Users, it: "Turni & Personale", de: "Schichten & Personal", en: "Shifts & staff" },
  { id: "clima", Icon: Thermometer, it: "Meteo & Clima", de: "Wetter & Klima", en: "Weather & climate" },
  { id: "spesa", Icon: ShoppingCart, it: "Lista Spesa", de: "Einkaufsliste", en: "Shopping list" },
  { id: "foodcost", Icon: Euro, it: "Costi & Margine", de: "Kosten & Marge", en: "Costs & margin" },
  { id: "punti", Icon: Store, it: "Punti Vendita", de: "Verkaufspunkte", en: "Sales points" },
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
const TOOLS = [
  { id: "generatore", Icon: Sparkles, cat: "impasto", it: "Generatore Ricette", de: "Rezept-Generator", en: "Recipe Generator", es: "Generador de Recetas" },
  { id: "fermentazione", Icon: Activity, cat: "impasto", it: "Fermentazione Predittiva", de: "Gärungs-Prognose", en: "Fermentation Forecast", es: "Fermentación Predictiva" },
  { id: "mydata", Icon: Archive, cat: "gestione", it: "I Miei Dati", de: "Meine Daten", en: "My Data" },
  { id: "macchine", Icon: Wrench, cat: "gestione", it: "Parco Macchine", de: "Maschinenpark", en: "Machine Park" },
  { id: "twin", Icon: FlaskConical, cat: "impasto", it: "Digital Twin", de: "Teig-Zwilling", en: "Dough Twin" },
  { id: "adatta", Icon: Flame, cat: "cottura", it: "Adatta Forno", de: "Ofen anpassen", en: "Adapt Oven" },
  { id: "bilancia", Icon: Scale, cat: "impasto", it: "Bilancia Smart", de: "Smarte Waage", en: "Smart Scale" },
  { id: "termo", Icon: Thermometer, cat: "impasto", it: "Termostato & Clima", de: "Thermostat & Klima", en: "Thermostat & Climate" },
  { id: "acqua", Icon: Droplets, cat: "impasto", it: "Temp. Acqua", de: "Wasser-Temp.", en: "Water Temp." },
  { id: "pesata", Icon: Scale, cat: "impasto", it: "Pesata Guidata", de: "Geführtes Wiegen", en: "Guided Weighing" },
  { id: "timer", Icon: TimerIcon, cat: "cottura", it: "Timer", de: "Timer", en: "Timer" },
  { id: "meteo", Icon: CloudSun, cat: "cottura", it: "Meteo", de: "Wetter", en: "Weather" },
  { id: "ph", Icon: FlaskConical, cat: "impasto", it: "pH Lievito", de: "pH Sauerteig", en: "Sourdough pH" },
  { id: "diagnosi", Icon: Camera, cat: "gestione", it: "Diagnosi Foto", de: "Foto-Diagnose", en: "Photo Diagnosis" },
  { id: "suono", Icon: Camera, cat: "gestione", it: "Diagnosi Suono", de: "Klang-Diagnose", en: "Sound Diagnosis" },
  { id: "sessioni", Icon: Thermometer, cat: "gestione", it: "Diario Impasti", de: "Teig-Tagebuch", en: "Dough Log" },
  { id: "lotti", Icon: QrCode, cat: "gestione", it: "Tracciabilità Lotti", de: "Chargen", en: "Batch Traceability" },
  { id: "haccp", Icon: ScanLine, cat: "gestione", it: "Registro HACCP", de: "HACCP-Register", en: "HACCP Log" },
  { id: "check", Icon: ListChecks, cat: "gestione", it: "Checklist", de: "Checklisten", en: "Checklists" },
  { id: "shelf", Icon: CalendarClock, cat: "vendita", it: "Shelf-Life", de: "Shelf-Life", en: "Shelf-Life" },
];

const TOOL_CATS = [
  { key: "impasto", it: "Impasto", de: "Teig", en: "Dough", es: "Masa" },
  { key: "cottura", it: "Cottura", de: "Backen", en: "Baking", es: "Cocción" },
  { key: "gestione", it: "Gestione", de: "Verwaltung", en: "Management", es: "Gestión" },
  { key: "vendita", it: "Vendita", de: "Verkauf", en: "Sales", es: "Venta" },
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
        className={`relative flex flex-col items-center justify-center gap-1.5 bg-white dark:bg-[#232A31] border rounded-2xl p-3 pt-4 text-center transition-all min-h-[70px] ${editTools ? "cursor-move border-dashed border-[#3f7cac]/50" : "cursor-pointer border-[#d5e4f0] dark:border-[#38424B] active:scale-95 hover:border-[#3f7cac]/60"} ${isHidden ? "opacity-40" : ""} ${dragId === id ? "opacity-50 scale-95 ring-2 ring-[#3f7cac]" : ""}`}>
        {editTools ? (
          <>
            <div className="absolute top-1 left-1 flex gap-0.5">
              <button type="button" data-testid={`tool-hide-${id}`} aria-label="hide" onClick={(e) => { e.stopPropagation(); toggleHideTool(id); }}
                className="w-6 h-6 rounded-full bg-[#e4eff8] dark:bg-[#2A323A] flex items-center justify-center text-[#3f7cac] active:scale-90">
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
                onClick={(e) => { e.stopPropagation(); setGuideId(id); }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#3f7cac]/12 flex items-center justify-center text-[#3f7cac] active:scale-90">
                <Info className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
        <Icon className="w-5 h-5 text-[#3f7cac]" />
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
        className={`relative flex items-center gap-2 bg-white dark:bg-[#232A31] border border-dashed border-[#3f7cac]/50 rounded-2xl px-2.5 py-2.5 select-none touch-none cursor-grab active:cursor-grabbing ${isHidden ? "opacity-40" : ""}`}>
        <GripVertical className="w-4 h-4 text-[#9aa4ac] shrink-0" data-testid={`tool-grip-${id}`} />
        <Icon className="w-5 h-5 text-[#3f7cac] shrink-0" />
        <span className="text-[12px] font-semibold leading-tight text-[#2B303B] dark:text-[#e4eff8] flex-1 min-w-0 truncate">{label}</span>
        <button type="button" data-testid={`tool-hide-${id}`} aria-label="hide" onPointerDown={stop} onClick={(e) => { stop(e); toggleHideTool(id); }}
          className="w-7 h-7 rounded-full bg-[#e4eff8] dark:bg-[#2A323A] flex items-center justify-center text-[#3f7cac] active:scale-90 shrink-0">
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
      <div className="relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#2f6a97] to-[#234b6e] p-6 text-white">
        <div className="it-de-ribbon absolute top-0 left-0 right-0" />
        <Sparkles className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{lang === "de" ? "Produktionsplan mit KI" : lang === "en" ? "AI Production Plan" : lang === "es" ? "Plan de Producción con IA" : "Piano di Produzione con IA"}</h1>
        <p className="text-white/85 text-sm mt-1">{lang === "de" ? "Fülle die Daten aus und lass den Plan generieren" : lang === "en" ? "Fill in the data and generate the plan" : lang === "es" ? "Rellena los datos y genera tu plan de trabajo" : "Compila i dati e genera il tuo piano di lavoro"}</p>
      </div>

      {onOpenTool && (
        <div data-testid="capo-quicklinks" className="mb-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#234b6e] dark:text-[#a9d2ec] mb-0.5">
              {tri3(lang, "INIZIA", "START", "START")}
            </p>
            <button data-testid="lab-tour-replay" onClick={() => setTourForce((n) => n + 1)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3f7cac] px-2.5 py-1 rounded-full border border-[#d5e4f0] dark:border-[#38424B] bg-white dark:bg-[#232A31] active:scale-95 transition-all">
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
                className="flex items-center gap-2 bg-gradient-to-br from-[#3f7cac] to-[#234b6e] text-white rounded-2xl p-3 text-left active:scale-95 transition-all shadow-sm">
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[12px] font-bold leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(mixers.length === 0 || cells.length === 0) && modules.celle && (
        <div data-testid="capo-setup-hint" className="mb-4 rounded-2xl bg-[#C88A2B]/12 border border-[#C88A2B]/35 p-3.5">
          <p className="text-sm text-[#234b6e] dark:text-[#8FB0C2] leading-snug">
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
          <div data-testid="tool-guide-bubble" className="mb-3 flex items-start gap-2.5 rounded-2xl bg-gradient-to-br from-[#234b6e] to-[#3f7cac] text-white p-3 shadow-md">
            <img src={`${process.env.PUBLIC_URL}/mohammed-avatar.jpg`} alt="Mohammadreza" className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/60 shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">Mohammadreza</p>
              <p className="text-sm leading-snug mt-0.5">{guideFor(guideId, lang)}</p>
              <div className="flex gap-2 mt-2">
                <button data-testid="tool-guide-open" onClick={() => { const g = MODULE_TOOL[guideId] || guideId; setGuideId(null); onOpenTool && onOpenTool(g); }}
                  className="text-xs font-bold bg-white text-[#234b6e] px-3 py-1.5 rounded-lg active:scale-95">{tri3(lang, "Apri strumento", "Werkzeug öffnen", "Open tool")}</button>
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
                    ? "bg-[#3f7cac] text-white border-[#3f7cac] shadow-sm"
                    : "bg-white dark:bg-[#232A31] text-[#7E8A93] border-[#d5e4f0] dark:border-[#38424B]"}`}>
                <span className={`absolute top-1.5 left-1.5 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full ${on ? "bg-white/25 text-white" : "bg-[#e4eff8] dark:bg-[#2A323A] text-[#9aa4ac]"}`}>{on ? "ON" : "OFF"}</span>
                <button type="button" data-testid={`tool-info-${id}`} aria-label="info"
                  onClick={(e) => { e.stopPropagation(); setGuideId(id); }}
                  className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center active:scale-90 ${on ? "bg-white/25 text-white" : "bg-[#3f7cac]/12 text-[#3f7cac]"}`}>
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
            <div className="mt-4 mb-2 h-px bg-[#d5e4f0] dark:bg-[#38424B]" />
            {!editTools && (() => {
              const discovered = TOOLS.filter((t) => toolUsage[t.id]).length;
              const total = TOOLS.length;
              const pct = Math.round((discovered / total) * 100);
              const done = discovered >= total;
              return (
                <div data-testid="tools-discovery" className={`mb-3 rounded-2xl border p-3 ${done ? "bg-[#3f7cac]/10 border-[#3f7cac]/40" : "bg-[#C88A2B]/10 border-[#C88A2B]/40"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[12px] font-bold text-[#2B303B] dark:text-[#e4eff8]">
                      {done
                        ? tri3(lang, "🎉 Hai scoperto tutti gli strumenti!", "🎉 Du hast alle Werkzeuge entdeckt!", "🎉 You've discovered every tool!")
                        : tri3(lang, `Hai scoperto ${discovered}/${total} strumenti`, `Du hast ${discovered}/${total} Werkzeuge entdeckt`, `You've discovered ${discovered}/${total} tools`)}
                    </p>
                    <span data-testid="tools-discovery-pct" className={`text-[12px] font-extrabold ${done ? "text-[#336a94]" : "text-[#A66A15]"}`}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${done ? "bg-[#3f7cac]" : "bg-[#C88A2B]"}`} style={{ width: `${pct}%` }} />
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
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#C88A2B] mb-1.5">⭐ {tri3(lang, "I TUOI PREFERITI", "DEINE FAVORITEN", "YOUR FAVORITES")}{pinnedFavs.length > 1 ? ` · ${tri3(lang, "trascina per ordinare · tocca la stella per togliere", "ziehen zum Sortieren · Stern zum Entfernen", "drag to reorder · tap star to remove")}` : ` · ${tri3(lang, "tocca la stella per togliere", "Stern zum Entfernen", "tap star to remove")}`}</p>
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
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#234b6e] dark:text-[#a9d2ec]">
                {tri3(lang, "APRI UNO STRUMENTO", "WERKZEUG ÖFFNEN", "OPEN A TOOL")}
              </p>
              <button data-testid="tools-edit-toggle" onClick={() => setEditTools((v) => !v)}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border active:scale-95 transition-all ${editTools ? "bg-[#3f7cac] text-white border-[#3f7cac]" : "bg-white dark:bg-[#232A31] text-[#3f7cac] border-[#d5e4f0] dark:border-[#38424B]"}`}>
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
                  className="w-full rounded-xl border border-[#d5e4f0] dark:border-[#38424B] bg-white dark:bg-[#232A31] pl-9 pr-3 py-2 text-sm outline-none focus:border-[#3f7cac]" />
              </div>
            )}

            {!editTools && !toolQuery.trim() && suggestedTools.length > 0 && (
              <div data-testid="tools-suggested" className="mb-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#C88A2B] mb-2">{tri3(lang, "Suggeriti per te", "Für dich empfohlen", "Suggested for you", "Sugeridos para ti")}</p>
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
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#3f7cac] mb-2">{tri3(lang, c.it, c.de, c.en, c.es)}</p>
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

      <Section icon={<Sparkles className="w-4 h-4" />} title={tri3(lang, "Compila per generare", "Zum Generieren ausfüllen", "Fill in to generate")}>
        <div data-testid="capo-source-choice" className="grid grid-cols-2 gap-2 mb-3">
            <button data-testid="capo-source-weekly" onClick={() => setUseWeekly(true)}
              className={`rounded-2xl p-3 text-left border-2 transition-all active:scale-97 ${useWeekly ? "bg-[#3f7cac] text-white border-[#3f7cac]" : "bg-white dark:bg-[#232A31] text-[#234b6e] dark:text-[#a9d2ec] border-[#d5e4f0] dark:border-[#38424B]"}`}>
              <CalendarDays className="w-5 h-5 mb-1" />
              <p className="text-[13px] font-bold leading-tight">{tri3(lang, "Piano Settimanale", "Wochenplan", "Weekly Plan")}</p>
              <p className={`text-[10.5px] leading-snug ${useWeekly ? "text-white/85" : "text-[#7E8A93]"}`}>{tri3(lang, "Usa quello inserito (modificabile)", "Bereits erfasst (änderbar)", "Use what you entered (editable)")}</p>
            </button>
            <button data-testid="capo-source-manual" onClick={() => setUseWeekly(false)}
              className={`rounded-2xl p-3 text-left border-2 transition-all active:scale-97 ${!useWeekly ? "bg-[#3f7cac] text-white border-[#3f7cac]" : "bg-white dark:bg-[#232A31] text-[#234b6e] dark:text-[#a9d2ec] border-[#d5e4f0] dark:border-[#38424B]"}`}>
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
            <CalendarDays className="w-4 h-4 text-[#234b6e] dark:text-[#8FB0C2] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#234b6e] dark:text-[#8FB0C2] leading-snug">
              {tri3(lang,
                `Genero dal Piano Settimanale (${weeklyItems.length} voci). Per cambiare quantità o giorni apri «Produzione Settimanale». Puoi scegliere l'impasto di partenza qui sotto.`,
                `Ich generiere aus dem Wochenplan (${weeklyItems.length} Einträge). Zum Ändern öffne „Wochenproduktion". Den Start-Teig kannst du unten wählen.`,
                `Generating from the Weekly Plan (${weeklyItems.length} items). To change quantities/days open 'Weekly Production'. You can pick the starting dough below.`)}
            </p>
          </div>
        )}
        <div className={`space-y-2 ${useWeekly ? "hidden" : ""}`} data-testid="capo-products">
          {products.map((p, i) => (
            <div key={i} className="bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <select data-testid={`capo-product-recipe-${i}`} value={p.recipe_id || ""}
                  onChange={(e) => { const r = recipes.find((x) => x.id === e.target.value); setProducts((l) => l.map((x, k) => k === i ? { ...x, recipe_id: e.target.value, name: r ? r.name : x.name } : x)); }}
                  className="flex-1 min-w-0 bg-[#e4eff8] dark:bg-[#2A323A] border border-[#d5e4f0] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#3f7cac]">
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
                      : "bg-white dark:bg-[#232A31] text-[#7E8A93] border-[#d5e4f0] dark:border-[#38424B]"}`}>
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
                    className="w-full bg-[#e4eff8] dark:bg-[#2A323A] border border-[#d5e4f0] dark:border-[#38424B] rounded-lg p-2 pr-12 text-sm outline-none focus:border-[#3f7cac]" />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#7E8A93]">{p.unit === "kg" ? "kg" : t("capo_unit_pieces")}</span>
                </div>
                <button type="button" data-testid={`capo-product-opts-${i}`}
                  onClick={() => setProducts((l) => l.map((x, k) => k === i ? { ...x, _opts: !x._opts } : x))}
                  className="shrink-0 text-xs font-semibold text-[#3f7cac] px-2.5 py-2 rounded-lg border border-[#d5e4f0] dark:border-[#38424B] active:scale-95 transition-all">
                  {p._opts ? tri3(lang, "Meno", "Weniger", "Less") : tri3(lang, "Opzioni", "Optionen", "Options")}
                </button>
              </div>
              {p._opts && (
                <div className="flex items-center gap-2 flex-wrap">
                  <select data-testid={`capo-product-unit-${i}`} value={p.unit}
                    onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, unit: e.target.value } : x))}
                    className="w-[80px] shrink-0 bg-[#e4eff8] dark:bg-[#2A323A] border border-[#d5e4f0] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#3f7cac]">
                    <option value="pezzi">{t("capo_unit_pieces")}</option>
                    <option value="kg">{t("capo_unit_kg")}</option>
                  </select>
                  {p.unit === "pezzi" && (
                    <div className="relative w-[80px] shrink-0">
                      <input data-testid={`capo-product-gpp-${i}`} type="number" value={p.gpp ?? ""} placeholder="g/pz"
                        onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, gpp: e.target.value } : x))}
                        className="w-full bg-[#e4eff8] dark:bg-[#2A323A] border border-[#d5e4f0] dark:border-[#38424B] rounded-lg p-2 pr-6 text-sm outline-none focus:border-[#3f7cac]" />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[#7E8A93]">g</span>
                    </div>
                  )}
                  <select data-testid={`capo-product-day-${i}`} value={p.day || ""}
                    onChange={(e) => setProducts((l) => l.map((x, k) => k === i ? { ...x, day: e.target.value } : x))}
                    className="flex-1 min-w-[110px] bg-[#e4eff8] dark:bg-[#2A323A] border border-[#d5e4f0] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#3f7cac]">
                    {DAYS.map((d) => <option key={d} value={d}>{d === "" ? t("capo_day_any") : t(`day_${d}`)}</option>)}
                  </select>
                </div>
              )}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <button data-testid="capo-product-add" onClick={() => setProducts((l) => [...l, { recipe_id: "", name: "", qty: "", unit: "pezzi", gpp: "", day: "", start: false }])} className="text-sm font-medium text-[#3f7cac] flex items-center gap-1"><Plus className="w-4 h-4" /> {t("capo_add_product")}</button>
            <button data-testid="capo-open-picker" onClick={() => { setPickSearch(""); setPickerOpen(true); }} className="text-sm font-semibold text-white bg-[#3f7cac] px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95"><ChefHat className="w-4 h-4" /> {tri3(lang, "Aggiungi ricette", "Rezepte hinzufügen", "Add recipes")}</button>
            {savedProducts.length > 0 && (
              <button data-testid="capo-restore-prev" onClick={restorePrevPlan} className="text-sm font-semibold text-[#234b6e] dark:text-[#a9d2ec] bg-[#5aa0cf]/12 border border-[#5aa0cf]/30 px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95"><RotateCcw className="w-3.5 h-3.5" /> {tri3(lang, "Riparti dall'ultimo piano", "Vom letzten Plan starten", "Reuse last plan")}</button>
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
              <div className="p-4 border-b border-[#d5e4f0] dark:border-[#38424B]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri3(lang, "Aggiungi ricette", "Rezepte hinzufügen", "Add recipes")}</h3>
                  <button data-testid="capo-picker-close" onClick={() => setPickerOpen(false)} className="text-[#7E8A93] p-1"><X className="w-5 h-5" /></button>
                </div>
                <input data-testid="capo-picker-search" value={pickSearch} onChange={(e) => setPickSearch(e.target.value)} autoFocus
                  placeholder={tri3(lang, "Cerca ricetta…", "Rezept suchen…", "Search recipe…")}
                  className="w-full bg-[#e4eff8] dark:bg-[#2A323A] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl p-2.5 text-sm outline-none focus:border-[#3f7cac]" />
              </div>
              <div className="overflow-y-auto p-2 flex-1">
                {recipes.filter((r) => (r.name || "").toLowerCase().includes(pickSearch.toLowerCase())).map((r) => {
                  const sel = products.some((p) => p.recipe_id === r.id);
                  return (
                    <button key={r.id} data-testid={`capo-pick-${r.id}`} onClick={() => (sel ? removeByRecipe(r.id) : addRecipes([r.id]))}
                      className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left mb-1 transition-all ${sel ? "bg-[#3f7cac]/12 border border-[#3f7cac]/40" : "hover:bg-[#e4eff8] dark:hover:bg-[#2A323A] border border-transparent"}`}>
                      {sel ? <CheckCircle2 className="w-5 h-5 text-[#3f7cac] shrink-0" /> : <span className="w-5 h-5 rounded-full border-2 border-[#d5e4f0] dark:border-[#4a5560] shrink-0" />}
                      <span className="flex-1 min-w-0 text-sm text-[#2B303B] dark:text-[#e4eff8] truncate">{r.name}</span>
                      {r._own && <span className="text-[10px] text-[#C88A2B]">★</span>}
                    </button>
                  );
                })}
              </div>
              <div className="p-3 border-t border-[#d5e4f0] dark:border-[#38424B]">
                <button data-testid="capo-picker-done" onClick={() => setPickerOpen(false)} className="w-full bg-[#3f7cac] text-white font-semibold py-2.5 rounded-xl active:scale-98">
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
          <div data-testid="capo-temp-msg" className={`mt-2 text-sm rounded-xl px-3 py-2 border ${tempDelta && Math.abs(tempDelta) >= 1 ? "bg-[#6E8CA0]/15 border-[#6E8CA0]/40 text-[#234b6e] dark:text-[#8FB0C2]" : "bg-[#5aa0cf]/12 border-[#5aa0cf]/30 text-[#2e6690] dark:text-[#a9d2ec]"}`}>
            <Thermometer className="w-4 h-4 inline mr-1" />{tempMsg}
          </div>
        )}
        <div className="mt-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{lang === "de" ? "Ziel des Plans" : lang === "en" ? "Plan goal" : lang === "es" ? "Objetivo del plan" : "Obiettivo del piano"}</label>
          <select data-testid="capo-plan-goal" value={planGoal} onChange={(e) => setPlanGoal(e.target.value)}
            className="mt-1 w-full bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl p-3 text-sm outline-none focus:border-[#3f7cac]">
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
          <textarea data-testid="capo-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="mt-1 w-full bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl p-3 text-sm outline-none focus:border-[#3f7cac] resize-none" />
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
            <div data-testid="capo-cost-summary" className="mt-4 rounded-2xl bg-[#234b6e]/8 border border-[#234b6e]/25 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Euro className="w-4 h-4 text-[#234b6e] dark:text-[#a9d2ec]" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#234b6e] dark:text-[#a9d2ec]">{tri3(lang, "Costi & Margine", "Kosten & Marge", "Costs & Margin")}</span>
              </div>
              <div className="space-y-1.5">
                {rows.map((x, i) => (
                  <div key={i} data-testid={`capo-cost-row-${i}`} className="flex items-center justify-between text-sm">
                    <span className="text-[#3F4A54] dark:text-[#AEB8BF] truncate flex-1">{x.name} <span className="text-[#7E8A93]">×{x.qty}</span></span>
                    <span className="font-mono-data text-[#7E8A93] mr-3">{x.cost != null ? eur(x.cost) : "—"}</span>
                    <span className="font-mono-data font-semibold text-[#234b6e] dark:text-[#a9d2ec]">{x.rev != null ? eur(x.rev) : "—"}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#234b6e]/20 grid grid-cols-3 gap-2 text-center">
                <div><p className="text-[10px] uppercase text-[#7E8A93]">{tri3(lang, "Costo", "Kosten", "Cost")}</p><p className="font-mono-data font-bold text-[#2e3d4c]">{eur(totCost)}</p></div>
                <div><p className="text-[10px] uppercase text-[#7E8A93]">{tri3(lang, "Ricavo", "Umsatz", "Revenue")}</p><p className="font-mono-data font-bold text-[#234b6e] dark:text-[#a9d2ec]">{eur(totRev)}</p></div>
                <div><p className="text-[10px] uppercase text-[#7E8A93]">{tri3(lang, "Margine", "Marge", "Margin")}</p><p className="font-mono-data font-bold text-[#3f7cac]">{eur(margin)}{marginPct != null ? ` · ${marginPct.toFixed(0)}%` : ""}</p></div>
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
          className="mt-3 w-full bg-[#3f7cac] hover:bg-[#336a94] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2">
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
            <div data-testid="capo-saved-banner" className="no-print mt-4 rounded-2xl bg-[#5aa0cf]/12 border border-[#5aa0cf]/35 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <CheckCircle2 className="w-5 h-5 text-[#336a94] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#234b6e] dark:text-[#a9d2ec] leading-tight">
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
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-[#234b6e] dark:text-[#e4eff8] bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] px-3 py-2 rounded-xl active:scale-95 transition-all">
                <RotateCcw className="w-3.5 h-3.5" /> {tri3(lang, "Nuovo piano", "Neuer Plan", "New plan")}
              </button>
            </div>
            <button data-testid="capo-quick-archive" onClick={() => capoArchiveRef.current?.openSave()}
              className="no-print mt-2 w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#234b6e] dark:text-[#8FB0C2] bg-[#e4eff8] dark:bg-[#2A323A] border border-[#d5e4f0] dark:border-[#38424B] px-4 py-2.5 rounded-2xl active:scale-98 transition-all">
              <Archive className="w-4 h-4" /> {tri3(lang, "Salva questo piano nell'archivio", "Diesen Plan im Archiv speichern", "Save this plan to the archive")}
            </button>
            <div className="no-print mt-3">
              <label className="block text-[11px] font-bold uppercase tracking-wide text-[#3f7cac] mb-1.5">{tri3(lang, "Note del fornaio (finiscono nel PDF)", "Notizen des Bäckers (kommen ins PDF)", "Baker's notes (added to the PDF)", "Notas del panadero (van al PDF)")}</label>
              <textarea data-testid="capo-baker-note" value={bakerNote} onChange={(e) => setBakerNote(e.target.value)} rows={2}
                placeholder={tri3(lang, "Es. attaccare la biga alle 22:00, controllare il forno n.2…", "z. B. Biga um 22:00 ansetzen, Ofen Nr. 2 prüfen…", "e.g. start the biga at 22:00, check oven no. 2…", "Ej. iniciar la biga a las 22:00, revisar el horno n.º 2…")}
                className="w-full rounded-xl border border-[#d5e4f0] dark:border-[#38424B] bg-white dark:bg-[#232A31] px-3 py-2 text-sm outline-none focus:border-[#3f7cac] resize-y" />
            </div>
            <button data-testid="capo-print" onClick={() => window.print()}
              className="no-print mt-3 w-full bg-[#5aa0cf] hover:bg-[#336a94] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
              <Printer className="w-5 h-5" /> {tri3(lang, "PDF Completo (piano + spesa + ricette)", "Komplettes PDF (Plan + Einkauf + Rezepte)", "Full PDF (plan + shopping + recipes)")}
            </button>
            {!generating && (
              <button data-testid="capo-voice" onClick={() => setPlanHF(true)}
                className="no-print mt-2 w-full bg-[#C88A2B] hover:bg-[#a66f20] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
                <ChefHat className="w-5 h-5" /> {tri3(lang, "Leggi il piano a voce (mani libere)", "Plan vorlesen (Hände frei)", "Read the plan aloud (hands-free)", "Leer el plan en voz alta (manos libres)")}
              </button>
            )}
            <button data-testid="capo-share" onClick={() => shareContent(lang === "de" ? "Produktionsplan — MikiLab" : lang === "en" ? "Production plan — MikiLab" : lang === "es" ? "Plan de producción — MikiLab" : "Piano di Produzione — MikiLab", plan, lang)}
              className="no-print mt-2 w-full bg-[#e4eff8] dark:bg-[#2A323A] text-[#2B303B] dark:text-[#e4eff8] font-medium px-5 py-3 rounded-2xl border border-[#d5e4f0] dark:border-[#38424B] active:scale-98 transition-all flex items-center justify-center gap-2">
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
              <div data-testid="capo-plan" className="markdown-body bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] rounded-2xl p-5 text-sm leading-relaxed text-[#2B303B] dark:text-[#e4eff8]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#3f7cac] mb-2">{t("capo_plan_title")}</p>
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
                            <button data-testid="capo-inf-add-row" onClick={infAddRow} className="no-print inline-flex items-center gap-1 text-[11px] font-semibold text-[#3f7cac] border border-[#3f7cac]/40 px-2 py-1 rounded-lg active:scale-95">
                              <Plus className="w-3.5 h-3.5" /> {tri3(lang, "Riga", "Zeile", "Row", "Fila")}
                            </button>
                          </div>
                          <div className="overflow-x-auto print-table rounded-xl border border-[#d5e4f0] dark:border-[#38424B]">
                            <table className="w-full text-[12px] border-collapse">
                              <thead>
                                <tr className="bg-[#e4eff8] dark:bg-[#2A323A]">
                                  {infEdit.headers.map((h, ci) => (
                                    <th key={ci} className="text-left font-bold text-[#234b6e] dark:text-[#a9d2ec] px-2 py-1.5 whitespace-nowrap">{h}</th>
                                  ))}
                                  <th className="no-print w-8" />
                                </tr>
                              </thead>
                              <tbody>
                                {infEdit.rows.map((r, ri) => (
                                  <tr key={ri} data-testid={`capo-inf-row-${ri}`} className="border-t border-[#d5e4f0] dark:border-[#38424B]">
                                    {infEdit.headers.map((_, ci) => (
                                      <td key={ci} className="px-1 py-1 align-top">
                                        <input data-testid={`capo-inf-cell-${ri}-${ci}`} value={r[ci] ?? ""} onChange={(e) => infSetCell(ri, ci, e.target.value)}
                                          className="w-full min-w-[70px] bg-transparent px-1.5 py-1 rounded-md outline-none focus:bg-[#3f7cac]/8 border border-transparent focus:border-[#3f7cac]/40" />
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
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#3f7cac]">{t("capo_recipes_title")}</p>
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
    <div className="bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] rounded-2xl p-4">
      <h3 className="font-display text-base font-bold text-[#2B303B] dark:text-[#e4eff8]">{rLoc(r, "name", lang)}</h3>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
        {ing.map(([label, g]) => (
          <div key={label} className="flex items-center justify-between text-xs">
            <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{label}</span>
            <span className="font-mono-data font-bold text-[#234b6e] dark:text-[#8FB0C2]">{g} g</span>
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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-2xl bg-white dark:bg-[#232A31] border border-[#d5e4f0] dark:border-[#38424B] p-4">
      <div className="flex items-center gap-2 mb-3 text-[#3f7cac]">
        {icon}
        <h2 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#e4eff8]">{title}</h2>
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
          className="w-full bg-white dark:bg-[#1F252B] border border-[#d5e4f0] dark:border-[#38424B] rounded-xl p-2.5 text-sm outline-none focus:border-[#3f7cac]" />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7E8A93] pointer-events-none">{unit}</span>}
      </div>
    </div>
  );
}
