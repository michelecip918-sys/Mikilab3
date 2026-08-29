import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, BookOpen, PlusCircle, Lock, Check, ArrowRight, Route, RotateCcw, ChevronDown, ChevronUp, Sparkles, ListChecks, ShoppingCart, Share2, Printer, Trophy } from "lucide-react";
import { recipesApi, weeklyApi } from "@/lib/api";
import { computeShopping, fmtQty } from "@/lib/shopping";
import { recipeTitle } from "@/lib/loc";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const CHAL_KEY = "mikilab_wizard_challenge";

const MANUAL_KEY = "mikilab_wizard_manual";
const WEEK_KEY = "mikilab_wizard_week";
const readManual = () => { try { return JSON.parse(localStorage.getItem(MANUAL_KEY)) || {}; } catch { return {}; } };
const writeManual = (m) => { try { localStorage.setItem(MANUAL_KEY, JSON.stringify(m)); } catch { /* */ } };
const DAY_ORDER = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
function isoWeekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
  return `${t.getUTCFullYear()}-W${wk}`;
}

// Percorso guidato a 3 step sbloccabili per "Il Tuo Laboratorio".
// Arricchisce (non sostituisce) gli strumenti: sotto restano tutte le sezioni esistenti.
export default function LabWizard({ onOpenTool }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [auto1, setAuto1] = useState(false);
  const [auto2, setAuto2] = useState(false);
  const [weeklyItems, setWeeklyItems] = useState([]);
  const [recipeById, setRecipeById] = useState({});
  const [manual, setManual] = useState(readManual);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [weekly, personal, miki] = await Promise.all([
        weeklyApi.get().catch(() => null),
        recipesApi.list("personal").catch(() => []),
        recipesApi.list("mikilab").catch(() => []),
      ]);
      const items = (weekly && Array.isArray(weekly.items)) ? weekly.items : [];
      setWeeklyItems(items);
      const map = {};
      [...(Array.isArray(miki) ? miki : []), ...(Array.isArray(personal) ? personal : [])].forEach((r) => { if (r && r.id) map[r.id] = r; });
      setRecipeById(map);
      setAuto1(items.length > 0);
      setAuto2(Array.isArray(personal) && personal.length > 0);
    } catch { /* */ }
    finally { setLoaded(true); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Reset automatico del percorso a ogni nuova settimana (lunedì), senza toccare i dati salvati.
  useEffect(() => {
    try {
      const cur = isoWeekKey();
      const stored = localStorage.getItem(WEEK_KEY);
      if (stored && stored !== cur) { setManual({}); writeManual({}); }
      localStorage.setItem(WEEK_KEY, cur);
    } catch { /* */ }
  }, []);

  // Riepilogo settimana: ricette scelte + totale pezzi (aggregato su tutti i giorni)
  const summary = useMemo(() => {
    const map = {};
    weeklyItems.forEach((w) => {
      const key = w.recipe_id || w.recipe_name || Math.random();
      if (!map[key]) map[key] = { name: w.recipe_name || "—", pieces: 0 };
      map[key].pieces += Number(w.pieces || 0);
    });
    return Object.values(map).sort((a, b) => b.pieces - a.pieces);
  }, [weeklyItems]);
  const totalPieces = summary.reduce((s, x) => s + x.pieces, 0);

  // Riepilogo per giorno della settimana
  const byDay = useMemo(() => {
    const m = {};
    weeklyItems.forEach((w) => { const d = w.day || "?"; m[d] = (m[d] || 0) + Number(w.pieces || 0); });
    return DAY_ORDER.filter((d) => m[d] > 0).map((d) => ({ day: d, pieces: m[d] }));
  }, [weeklyItems]);
  const dayLabel = (d) => ({
    lun: tri("Lun", "Mo", "Mon", "Lun", "Lun", "دو"), mar: tri("Mar", "Di", "Tue", "Mar", "Mar", "سه"),
    mer: tri("Mer", "Mi", "Wed", "Mié", "Mer", "چه"), gio: tri("Gio", "Do", "Thu", "Jue", "Jeu", "پن"),
    ven: tri("Ven", "Fr", "Fri", "Vie", "Ven", "جم"), sab: tri("Sab", "Sa", "Sat", "Sáb", "Sam", "شن"),
    dom: tri("Dom", "So", "Sun", "Dom", "Dim", "یک"),
  }[d] || d);

  // Mini lista spesa: farina totale + acqua stimata dal piano settimanale
  const shopping = useMemo(() => {
    const list = weeklyItems.filter((w) => w.recipe_id).map((w) => ({ recipe_id: w.recipe_id, grams: Number(w.pieces || 0) * Number(w.grams_per_piece || 0) }));
    try { return computeShopping(list, recipeById, lang); } catch { return { anyFlour: 0, others: {} }; }
  }, [weeklyItems, recipeById, lang]);
  const flourTot = shopping.anyFlour || 0;
  const waterTot = (shopping.others && shopping.others.water_grams) || 0;
  const prefermentTot = (shopping.others && shopping.others.sourdough_grams) || 0;
  const flourTypes = useMemo(() => Object.entries(shopping.flourByType || {}).sort((a, b) => b[1] - a[1]), [shopping]);
  const [shopOpen, setShopOpen] = useState(false);

  const generateToday = (day) => {
    window.dispatchEvent(new CustomEvent("mikilab-generate-today", { detail: day ? { day } : {} }));
    const el = document.querySelector('[data-testid="capo-generate"]');
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
  };

  const buildSummaryText = () => {
    let s = tri("Riepilogo settimana — MikiLab", "Wochen-Übersicht — MikiLab", "Week summary — MikiLab", "Resumen semana — MikiLab", "Résumé semaine — MikiLab", "خلاصهٔ هفته — MikiLab") + "\n\n";
    summary.forEach((x) => { s += `• ${x.name}: ${x.pieces} pz\n`; });
    if (byDay.length) s += "\n" + tri("Per giorno", "Pro Tag", "By day", "Por día", "Par jour", "به تفکیک روز") + ": " + byDay.map((d) => `${dayLabel(d.day)} ${d.pieces}`).join(" · ") + "\n";
    if (flourTot > 0) s += `\n🌾 ${fmtQty(flourTot)}` + (waterTot > 0 ? ` · 💧 ${fmtQty(waterTot)}` : "");
    return s.trim();
  };
  const shareSummary = async () => {
    const text = buildSummaryText();
    try {
      if (navigator.share) { await navigator.share({ title: "MikiLab", text }); }
      else { await navigator.clipboard.writeText(text); toast.success(tri("Riepilogo copiato!", "Übersicht kopiert!", "Summary copied!", "¡Resumen copiado!", "Résumé copié !", "خلاصه کپی شد!")); }
    } catch { /* */ }
  };

  // Sfida della settimana: prova una ricetta nuova (stabile per settimana)
  const challenge = useMemo(() => {
    const inWeek = new Set(weeklyItems.map((w) => w.recipe_id));
    const pool = Object.values(recipeById).filter((r) => r && r.id && !inWeek.has(r.id) && !r.locked);
    if (pool.length === 0) return null;
    const wk = isoWeekKey();
    let h = 0; for (let i = 0; i < wk.length; i++) h = (h * 31 + wk.charCodeAt(i)) >>> 0;
    return pool[h % pool.length];
  }, [recipeById, weeklyItems]);
  const [chalDone, setChalDone] = useState(false);
  useEffect(() => {
    try { const c = JSON.parse(localStorage.getItem(CHAL_KEY) || "{}"); setChalDone(c.week === isoWeekKey() && !!c.done); } catch { /* */ }
  }, []);
  const toggleChallenge = () => {
    const nd = !chalDone; setChalDone(nd);
    try { localStorage.setItem(CHAL_KEY, JSON.stringify({ week: isoWeekKey(), done: nd })); } catch { /* */ }
    if (nd) toast.success(tri("Sfida completata! 🏆", "Challenge geschafft! 🏆", "Challenge done! 🏆", "¡Reto completado! 🏆", "Défi réussi ! 🏆", "چالش انجام شد! 🏆"));
  };
  const shareChallenge = async () => {
    if (!challenge) return;
    const text = `🏆 MikiLab — ${tri("Sfida della settimana", "Challenge der Woche", "Weekly challenge", "Reto de la semana", "Défi de la semaine", "چالش هفته")}: ${recipeTitle(challenge, lang)}. ${tri("La provi anche tu?", "Machst du mit?", "Will you try it too?", "¿Te animas?", "Tu tentes aussi ?", "تو هم امتحان می‌کنی؟")}`;
    try {
      if (navigator.share) { await navigator.share({ title: "MikiLab", text }); }
      else { await navigator.clipboard.writeText(text); toast.success(tri("Copiato! Incollalo nella Community 🍞", "Kopiert! Poste es in der Community 🍞", "Copied! Paste it in the Community 🍞", "¡Copiado! Pégalo en la Comunidad 🍞", "Copié ! Colle-le dans la Communauté 🍞", "کپی شد! در انجمن بگذار 🍞")); }
    } catch { /* */ }
  };

  const c1 = auto1 || !!manual["1"];
  const c2 = auto2 || !!manual["2"];
  const c3 = !!manual["3"];
  const done = (c1 ? 1 : 0) + (c2 ? 1 : 0) + (c3 ? 1 : 0);
  const pct = Math.round((done / 3) * 100);
  const activeStep = !c1 ? 1 : !c2 ? 2 : !c3 ? 3 : 3;

  const toggleManual = (n) => {
    const m = { ...manual, [String(n)]: !manual[String(n)] };
    setManual(m); writeManual(m);
  };
  const resetPath = () => { setManual({}); writeManual({}); refresh(); };

  const goExtra = () => {
    const el = document.querySelector('[data-testid="capo-extra-today"]');
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const toggle = el.querySelector('[data-testid="capo-extra-toggle"]');
      if (toggle) setTimeout(() => toggle.click(), 400);
    }
  };

  const STEPS = [
    {
      n: 1, Icon: CalendarDays, unlocked: true, complete: c1, auto: auto1,
      title: tri("Produzione Settimanale", "Wochenproduktion", "Weekly Production", "Producción Semanal", "Production Hebdomadaire", "تولید هفتگی"),
      desc: tri("Pianifica cosa produrre nella settimana e salva il piano.", "Plane die Wochenproduktion und speichere den Plan.", "Plan what to produce this week and save the plan.", "Planifica la producción de la semana y guarda el plan.", "Planifie la production de la semaine et enregistre le plan.", "تولید هفته را برنامه‌ریزی کن و ذخیره کن."),
      cta: tri("Pianifica la settimana", "Woche planen", "Plan the week", "Planificar la semana", "Planifier la semaine", "برنامه‌ریزی هفته"),
      action: () => onOpenTool && onOpenTool("settimana"),
    },
    {
      n: 2, Icon: BookOpen, unlocked: c1, complete: c2, auto: auto2,
      title: tri("Inserimento Ricetta", "Rezept hinzufügen", "Add Recipe", "Añadir Receta", "Ajouter une Recette", "افزودن دستور"),
      desc: tri("Inserisci e salva i dati della ricetta da eseguire.", "Gib die Daten des auszuführenden Rezepts ein und speichere.", "Enter and save the recipe you want to make.", "Introduce y guarda los datos de la receta a ejecutar.", "Saisis et enregistre la recette à réaliser.", "داده‌های دستور موردنظر را وارد و ذخیره کن."),
      cta: tri("Inserisci una ricetta", "Rezept hinzufügen", "Add a recipe", "Añadir una receta", "Ajouter une recette", "افزودن دستور"),
      action: () => onOpenTool && onOpenTool("aggiungi"),
    },
    {
      n: 3, Icon: PlusCircle, unlocked: c2, complete: c3, auto: false,
      title: tri("Extra per Oggi", "Extra für Heute", "Extras for Today", "Extra para Hoy", "Extra pour Aujourd'hui", "اضافه برای امروز"),
      desc: tri("Aggiungi variazioni e produzioni fuori programma del giorno.", "Füge Tagesänderungen und außerplanmäßige Produktionen hinzu.", "Add today's variations and off-schedule productions.", "Añade variaciones y producciones fuera de programa del día.", "Ajoute les variations et productions hors programme du jour.", "تغییرات و تولیدهای خارج از برنامهٔ امروز را اضافه کن."),
      cta: tri("Aggiungi extra di oggi", "Heutige Extras hinzufügen", "Add today's extras", "Añadir extra de hoy", "Ajouter extra du jour", "افزودن اضافهٔ امروز"),
      action: goExtra,
    },
  ];

  return (
    <div data-testid="lab-wizard" className="mb-5 rounded-3xl bg-[#181818] border border-[#2e2e2e] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <Route className="w-5 h-5 text-[#ff6b00] shrink-0" />
          <h2 className="font-display text-lg font-bold text-white truncate">
            {tri("Percorso Guidato", "Geführter Ablauf", "Guided Path", "Ruta Guiada", "Parcours Guidé", "مسیر راهنما")}
          </h2>
        </div>
        <button data-testid="lab-wizard-collapse" onClick={() => setOpen((o) => !o)}
          className="w-8 h-8 rounded-lg bg-[#242424] text-[#ff6b00] flex items-center justify-center shrink-0 active:scale-95">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-sm text-[#9aa4ab] mb-3">
        {tri("Segui i 3 passi per organizzare la produzione. Ogni passo sblocca il successivo.", "Folge den 3 Schritten, um die Produktion zu organisieren. Jeder Schritt schaltet den nächsten frei.", "Follow the 3 steps to organize production. Each step unlocks the next.", "Sigue los 3 pasos para organizar la producción. Cada paso desbloquea el siguiente.", "Suis les 3 étapes pour organiser la production. Chaque étape débloque la suivante.", "برای سازماندهی تولید ۳ مرحله را دنبال کن. هر مرحله مرحلهٔ بعد را باز می‌کند.")}
      </p>

      {/* Barra di avanzamento */}
      <div data-testid="lab-wizard-progress" className="mb-1.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">
            {tri("Passo", "Schritt", "Step", "Paso", "Étape", "مرحله")} {activeStep} {tri("di", "von", "of", "de", "de", "از")} 3
          </span>
          <span className="text-xs font-bold text-[#ff6b00]">{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-[#2a2a2a] overflow-hidden">
          <motion.div className="h-full rounded-full bg-[#ff6b00]" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="steps" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3 pt-3">
              {STEPS.map((s) => {
                const locked = !s.unlocked;
                return (
                  <div key={s.n} data-testid={`lab-wizard-step-${s.n}`}
                    className={`rounded-2xl border p-3.5 transition-all ${s.complete ? "border-[#ff6b00]/60 bg-[#ff6b00]/10" : locked ? "border-[#2a2a2a] bg-[#141414] opacity-60" : "border-[#3a3a3a] bg-[#1e1e1e]"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.complete ? "bg-[#ff6b00] text-white" : locked ? "bg-[#242424] text-[#6b7379]" : "bg-[#2a2a2a] text-[#ff6b00]"}`}>
                        {s.complete ? <Check className="w-5 h-5" /> : locked ? <Lock className="w-5 h-5" /> : <s.Icon className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-[#7E8A93]">
                            {tri("Passo", "Schritt", "Step", "Paso", "Étape", "مرحله")} {s.n}
                          </span>
                          {s.complete && (
                            <span data-testid={`lab-wizard-badge-done-${s.n}`} className="text-[10px] font-bold uppercase text-[#ff6b00] bg-[#ff6b00]/15 px-2 py-0.5 rounded-full">
                              {tri("Completato", "Erledigt", "Done", "Hecho", "Fait", "انجام شد")}
                            </span>
                          )}
                          {locked && (
                            <span data-testid={`lab-wizard-badge-locked-${s.n}`} className="text-[10px] font-bold uppercase text-[#6b7379] bg-[#242424] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" /> {tri("Bloccato", "Gesperrt", "Locked", "Bloqueado", "Verrouillé", "قفل")}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-base font-bold text-white mt-0.5">{s.title}</h3>
                        <p className="text-[13px] text-[#9aa4ab] leading-snug mt-0.5">{s.desc}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-2.5">
                          <button
                            data-testid={`lab-wizard-cta-${s.n}`}
                            disabled={locked}
                            onClick={s.action}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-all ${locked ? "bg-[#242424] text-[#6b7379] cursor-not-allowed" : "bg-[#ff6b00] text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] active:scale-95 hover:bg-[#ff8226]"}`}>
                            {locked ? (
                              <>{tri("Completa prima il passo precedente", "Erst vorherigen Schritt abschließen", "Complete the previous step first", "Completa antes el paso anterior", "Termine d'abord l'étape précédente", "ابتدا مرحلهٔ قبل را کامل کن")}</>
                            ) : (
                              <>{s.cta} <ArrowRight className="w-4 h-4" /></>
                            )}
                          </button>
                          {/* Conferma manuale: utile soprattutto per il Passo 3 (nessun segnale automatico) */}
                          {!locked && !s.auto && (
                            <button
                              data-testid={`lab-wizard-mark-${s.n}`}
                              onClick={() => toggleManual(s.n)}
                              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full font-semibold text-sm border transition-all active:scale-95 ${s.complete ? "border-[#ff6b00] text-[#ff6b00] bg-[#ff6b00]/10" : "border-[#3a3a3a] text-[#9aa4ab] hover:border-[#ff6b00]/60"}`}>
                              <Check className="w-4 h-4" />
                              {s.complete
                                ? tri("Fatto ✓", "Erledigt ✓", "Done ✓", "Hecho ✓", "Fait ✓", "انجام شد ✓")
                                : tri("Segna come fatto", "Als erledigt markieren", "Mark as done", "Marcar como hecho", "Marquer comme fait", "علامت‌گذاری به‌عنوان انجام‌شده")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Riepilogo settimana: ricette scelte + quantità, senza aprire i tool */}
            {summary.length > 0 && (
              <div data-testid="lab-wizard-summary" className="mt-4 rounded-2xl border border-[#2e2e2e] bg-[#141414] p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks className="w-4 h-4 text-[#ff6b00]" />
                  <h3 className="font-display text-sm font-bold text-white">
                    {tri("Riepilogo settimana", "Wochen-Übersicht", "Week summary", "Resumen de la semana", "Résumé de la semaine", "خلاصهٔ هفته")}
                  </h3>
                  <button data-testid="lab-wizard-share" onClick={shareSummary} title={tri("Condividi", "Teilen", "Share", "Compartir", "Partager", "اشتراک")}
                    className="ms-auto w-7 h-7 rounded-lg bg-[#1e1e1e] border border-[#333] text-[#ff6b00] flex items-center justify-center active:scale-95 hover:border-[#ff6b00]/60 transition-all">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button data-testid="lab-wizard-print" onClick={() => { try { window.print(); } catch { /* */ } }} title={tri("Stampa", "Drucken", "Print", "Imprimir", "Imprimer", "چاپ")}
                    className="w-7 h-7 rounded-lg bg-[#1e1e1e] border border-[#333] text-[#ff6b00] flex items-center justify-center active:scale-95 hover:border-[#ff6b00]/60 transition-all">
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-[#ff6b00] bg-[#ff6b00]/15 px-2 py-0.5 rounded-full">
                    {totalPieces} {tri("pz", "St.", "pcs", "uds", "pcs", "عدد")}
                  </span>
                </div>
                <div className="space-y-1">
                  {summary.slice(0, 8).map((s, i) => (
                    <div key={i} data-testid={`lab-wizard-summary-row-${i}`} className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="text-[#cfd6da] truncate">{s.name}</span>
                      <span className="font-mono-data font-bold text-white shrink-0">{s.pieces} {tri("pz", "St.", "pcs", "uds", "pcs", "عدد")}</span>
                    </div>
                  ))}
                  {summary.length > 8 && (
                    <p className="text-[11px] text-[#7E8A93] pt-0.5">+{summary.length - 8} {tri("altre ricette", "weitere Rezepte", "more recipes", "más recetas", "autres recettes", "دستور دیگر")}</p>
                  )}
                </div>
                {byDay.length > 0 && (
                  <div data-testid="lab-wizard-byday" className="mt-3 pt-2.5 border-t border-[#2a2a2a]">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5">{tri("Per giorno · tocca per generare", "Pro Tag · tippen zum Erstellen", "By day · tap to generate", "Por día · toca para generar", "Par jour · touchez pour générer", "به تفکیک روز · برای ساخت لمس کن")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {byDay.map(({ day, pieces }) => (
                        <button key={day} data-testid={`lab-wizard-day-${day}`} onClick={() => generateToday(day)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#cfd6da] bg-[#1e1e1e] border border-[#333] rounded-full px-2.5 py-1 active:scale-95 hover:border-[#ff6b00]/70 transition-all">
                          <span className="text-[#ff6b00] font-bold">{dayLabel(day)}</span>
                          <span className="font-mono-data">{pieces}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {(flourTot > 0 || waterTot > 0) && (
                  <div data-testid="lab-wizard-shopping" className="mt-3 pt-2.5 border-t border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#7E8A93]">{tri("Spesa stimata", "Geschätzter Einkauf", "Estimated shopping", "Compra estimada", "Achats estimés", "خرید تخمینی")}</p>
                      {(flourTypes.length > 1 || prefermentTot > 0) && (
                        <button data-testid="lab-wizard-shop-expand" onClick={() => setShopOpen((v) => !v)} className="text-[10px] font-bold text-[#ff6b00] inline-flex items-center gap-0.5">
                          {shopOpen ? tri("meno", "weniger", "less", "menos", "moins", "کمتر") : tri("dettagli", "Details", "details", "detalles", "détails", "جزئیات")}
                          {shopOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                      {onOpenTool && (
                        <button data-testid="lab-wizard-open-shopping" onClick={() => onOpenTool("spesa")}
                          className="ms-auto inline-flex items-center gap-1 text-[10.5px] font-bold text-white bg-[#ff6b00] px-2.5 py-1 rounded-full active:scale-95 hover:bg-[#ff8226] transition-all">
                          <ShoppingCart className="w-3 h-3" /> {tri("Lista completa", "Volle Liste", "Full list", "Lista completa", "Liste complète", "لیست کامل")}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span data-testid="lab-wizard-flour" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#cfd6da] bg-[#1e1e1e] border border-[#333] rounded-full px-3 py-1">
                        🌾 <span className="text-[#F0B429]">{tri("Farina", "Mehl", "Flour", "Harina", "Farine", "آرد")}</span> <span className="font-mono-data text-white">{fmtQty(flourTot)}</span>
                      </span>
                      {waterTot > 0 && (
                        <span data-testid="lab-wizard-water" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#cfd6da] bg-[#1e1e1e] border border-[#333] rounded-full px-3 py-1">
                          💧 <span className="text-[#5aa9e6]">{tri("Acqua", "Wasser", "Water", "Agua", "Eau", "آب")}</span> <span className="font-mono-data text-white">{fmtQty(waterTot)}</span>
                        </span>
                      )}
                      {prefermentTot > 0 && (
                        <span data-testid="lab-wizard-preferment" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#cfd6da] bg-[#1e1e1e] border border-[#333] rounded-full px-3 py-1">
                          🫧 <span className="text-[#C77D48]">{tri("Prefermento", "Vorteig", "Preferment", "Prefermento", "Préferment", "پیش‌خمیر")}</span> <span className="font-mono-data text-white">{fmtQty(prefermentTot)}</span>
                        </span>
                      )}
                    </div>
                    {shopOpen && flourTypes.length > 0 && (
                      <div data-testid="lab-wizard-flour-detail" className="mt-2 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#7E8A93]">{tri("Farine per tipo (W/forza)", "Mehle nach Typ (W)", "Flours by type (W)", "Harinas por tipo (W)", "Farines par type (W)", "آردها بر اساس نوع")}</p>
                        {flourTypes.map(([type, g], i) => (
                          <div key={i} data-testid={`lab-wizard-flour-type-${i}`} className="flex items-center justify-between gap-2 text-[12px]">
                            <span className="text-[#cfd6da] truncate">{type}</span>
                            <span className="font-mono-data font-bold text-white shrink-0">{fmtQty(g)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {loaded && done === 3 && (
              <div data-testid="lab-wizard-complete" className="mt-4 rounded-2xl border border-[#ff6b00]/50 bg-[#ff6b00]/10 p-3.5 text-center">
                <p className="text-sm text-[#ff6b00] font-semibold mb-2.5">
                  {tri("🎉 Percorso completato! Genera il piano di produzione di oggi, pronto da stampare.", "🎉 Ablauf abgeschlossen! Erstelle den heutigen Produktionsplan, druckfertig.", "🎉 Path complete! Generate today's production plan, ready to print.", "🎉 ¡Ruta completada! Genera el plan de producción de hoy, listo para imprimir.", "🎉 Parcours terminé ! Génère le plan de production du jour, prêt à imprimer.", "🎉 مسیر کامل شد! برنامهٔ تولید امروز را بساز، آمادهٔ چاپ.")}
                </p>
                <button data-testid="lab-wizard-generate-today" onClick={() => generateToday()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm bg-[#ff6b00] text-white shadow-[0_4px_14px_rgba(255,107,0,0.4)] active:scale-95 hover:bg-[#ff8226] transition-all">
                  <Sparkles className="w-4 h-4" />
                  {tri("Genera il piano di oggi", "Heutigen Plan erstellen", "Generate today's plan", "Generar el plan de hoy", "Générer le plan du jour", "ساخت برنامهٔ امروز")}
                </button>
              </div>
            )}

            {/* Sfida della settimana: prova una ricetta nuova (torna ogni lunedì) */}
            {challenge && (
              <div data-testid="lab-wizard-challenge" className={`mt-3 rounded-2xl border p-3.5 flex items-start gap-3 ${chalDone ? "border-[#ff6b00]/60 bg-[#ff6b00]/10" : "border-[#3a3a3a] bg-[#181818]"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${chalDone ? "bg-[#ff6b00] text-white" : "bg-[#2a2a2a] text-[#F0B429]"}`}>
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#7E8A93]">{tri("Sfida della settimana", "Challenge der Woche", "Weekly challenge", "Reto de la semana", "Défi de la semaine", "چالش هفته")}</p>
                  <h3 className="font-display text-sm font-bold text-white mt-0.5 leading-tight">
                    {tri("Prova una ricetta nuova:", "Probiere ein neues Rezept:", "Try a new recipe:", "Prueba una receta nueva:", "Essaie une nouvelle recette :", "یک دستور جدید امتحان کن:")} <span className="text-[#ff6b00]">{recipeTitle(challenge, lang)}</span>
                  </h3>
                  <button data-testid="lab-wizard-challenge-done" onClick={toggleChallenge}
                    className={`mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-sm border transition-all active:scale-95 ${chalDone ? "border-[#ff6b00] text-[#ff6b00] bg-[#ff6b00]/10" : "border-[#3a3a3a] text-[#9aa4ab] hover:border-[#ff6b00]/60"}`}>
                    <Check className="w-4 h-4" />
                    {chalDone
                      ? tri("Provata! 🏆", "Geschafft! 🏆", "Tried! 🏆", "¡Probada! 🏆", "Essayée ! 🏆", "امتحان شد! 🏆")
                      : tri("L'ho provata", "Ausprobiert", "I tried it", "La probé", "Je l'ai essayée", "امتحانش کردم")}
                  </button>
                  <button data-testid="lab-wizard-challenge-share" onClick={shareChallenge}
                    className="mt-2 ms-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-sm bg-[#ff6b00] text-white shadow-[0_3px_10px_rgba(255,107,0,0.35)] active:scale-95 hover:bg-[#ff8226] transition-all">
                    <Share2 className="w-4 h-4" />
                    {tri("Sfida i colleghi", "Kollegen fordern", "Challenge colleagues", "Reta a colegas", "Défie tes collègues", "چالش با همکاران")}
                  </button>
                </div>
              </div>
            )}

            <button data-testid="lab-wizard-reset" onClick={resetPath}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#9aa4ab] hover:text-[#ff6b00] transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              {tri("Ricomincia il percorso", "Ablauf neu starten", "Restart the path", "Reiniciar la ruta", "Recommencer le parcours", "شروع دوبارهٔ مسیر")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
