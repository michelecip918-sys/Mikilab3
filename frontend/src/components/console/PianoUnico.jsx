import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Wand2, CalendarClock, Clock3, GanttChartSquare, Volume2, Printer, Check, Loader2, Save, Users, GraduationCap, X } from "lucide-react";
import { recipesApi, mikeApi, weeklyApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { getActivity, activityProfile } from "@/lib/activityProfile";
import { toast } from "sonner";

const LINE_COLOR = { baguette: "#a4afbb", pane: "#c9a24a", pizzeria: "#b06e78", pasticceria: "#6e9e85" };

const DAYS = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
const DAY_TRI = {
  lun: ["Lunedì", "Montag", "Monday", "Lunes", "Lundi", "دوشنبه"],
  mar: ["Martedì", "Dienstag", "Tuesday", "Martes", "Mardi", "سه‌شنبه"],
  mer: ["Mercoledì", "Mittwoch", "Wednesday", "Miércoles", "Mercredi", "چهارشنبه"],
  gio: ["Giovedì", "Donnerstag", "Thursday", "Jueves", "Jeudi", "پنجشنبه"],
  ven: ["Venerdì", "Freitag", "Friday", "Viernes", "Vendredi", "جمعه"],
  sab: ["Sabato", "Samstag", "Saturday", "Sábado", "Samedi", "شنبه"],
  dom: ["Domenica", "Sonntag", "Sunday", "Domingo", "Dimanche", "یکشنبه"],
};

// Settimana vuota di default: i giorni Lun-Dom restano SEMPRE visibili, anche prima di generare.
const EMPTY_WEEK = () => Object.fromEntries(DAYS.map((k) => [k, { batches: [], warnings: [], team: [] }]));

const toMin = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || "").trim());
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
};
const fromMin = (min) => {
  const mm = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`;
};

const Section = ({ icon: Ic, title, accent, testid, children }) => (
  <div data-testid={testid} className="rounded-xl border bg-[#060A10]/70 p-4 sm:p-5" style={{ borderColor: `${accent}33` }}>
    <div className="holo-section-title" style={{ color: accent }}>
      <Ic className="w-4 h-4" /> {title}
    </div>
    {children}
  </div>
);

// Dettaglio di UN giorno: turni della squadra, calendario modificabile, orari a ritroso e timeline.
function DayPlan({ day, data, tri, onPatch, onDel, onAdd, onTeamAdd, onTeamPatch, onTeamDel, onCourse, suggestions = [], onApplySuggestion }) {
  const batches = data.batches || [];
  const team = data.team || [];
  const teamNames = team.map((t) => t.name).filter(Boolean);
  const span = useMemo(() => {
    const starts = batches.map((b) => toMin(b.start)).filter((x) => x != null);
    if (!starts.length) return null;
    const ends = batches
      .map((b) => {
        const s = toMin(b.start);
        return s != null ? s + (parseInt(b.duration_min, 10) || 60) : null;
      })
      .filter((x) => x != null);
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    return { min, max, dur: Math.max(30, max - min) };
  }, [batches]);

  const ROLE_OPTS = [
    tri("Impasto", "Teig", "Dough", "Masa", "Pétrin", "خمیر"),
    tri("Formatura", "Formen", "Shaping", "Formado", "Façonnage", "شکل‌دهی"),
    tri("Forni", "Öfen", "Ovens", "Hornos", "Fours", "فرها"),
    tri("Celle", "Zellen", "Cells", "Cámaras", "Chambres", "سلول‌ها"),
    tri("Banco", "Theke", "Counter", "Mostrador", "Comptoir", "پیشخوان"),
    tri("Pulizie", "Reinigung", "Cleaning", "Limpieza", "Nettoyage", "نظافت"),
  ];

  return (
    <div className="space-y-5">
      {suggestions.length > 0 && (
        <div data-testid={`piano-suggestions-${day}`} className="rounded-xl border border-[#f0c000]/30 bg-[#f0c000]/5 p-3.5">
          <p className="text-[11px] font-black uppercase tracking-wide text-[#c9a24a] mb-1.5">{tri("Sitor suggerisce (da chiusura precedente)", "Sitor schlägt vor", "Sitor suggests (from last close)", "Sitor sugiere", "Sitor suggère", "پیشنهاد سیتور")}</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, i) => (
              <button key={i} data-testid={`piano-sugg-apply-${day}-${i}`} onClick={() => onApplySuggestion(day, s.recipe_name, s.suggested_qty)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#8a97a6]/15 hover:bg-[#8a97a6]/30 text-[#cbd5e1] text-[12px] font-bold px-3 py-1.5 transition-colors">
                {s.recipe_name} → {s.suggested_qty} <Check className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Turni del giorno — chi lavora e con quale mansione */}
      <Section icon={Users} title={tri("Turni del giorno", "Schicht des Tages", "Day shift", "Turno del día", "Équipe du jour", "شیفت روز")} accent="#8a97a6" testid="piano-team">
        {team.length === 0 ? (
          <p className="text-[12px] text-[#64748B] mb-2">{tri("Nessuno assegnato a questo giorno.", "Niemand zugewiesen.", "No one assigned to this day.", "Nadie asignado.", "Personne assigné.", "کسی تخصیص نیافته.")}</p>
        ) : (
          <div className="space-y-1.5 mb-2">
            {team.map((m, i) => (
              <div key={i} data-testid={`piano-team-row-${day}-${i}`} className="flex items-center gap-2 rounded-lg bg-[#0b0f19]/60 px-3 py-2">
                <Users className="w-3.5 h-3.5 text-[#8a97a6] shrink-0" />
                <input
                  data-testid={`piano-team-name-${day}-${i}`}
                  value={m.name || ""}
                  onChange={(e) => onTeamPatch(day, i, { name: e.target.value })}
                  placeholder={tri("Nome", "Name", "Name", "Nombre", "Nom", "نام")}
                  className="flex-1 min-w-0 bg-transparent text-[13px] font-bold text-white placeholder:text-[#475569] focus:outline-none"
                />
                <select
                  data-testid={`piano-team-role-${day}-${i}`}
                  value={m.role || ""}
                  onChange={(e) => onTeamPatch(day, i, { role: e.target.value })}
                  className="shrink-0 rounded-md bg-[#060A10] border border-[#8a97a6]/30 px-2 py-1 text-[11px] text-[#cbd5e1]"
                >
                  <option value="">{tri("Mansione…", "Aufgabe…", "Role…", "Tarea…", "Rôle…", "نقش…")}</option>
                  {ROLE_OPTS.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
                <button data-testid={`piano-team-del-${day}-${i}`} onClick={() => onTeamDel(day, i)} className="shrink-0 p-1.5 rounded-lg text-[#b06e78] hover:bg-[#b06e78]/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button data-testid={`piano-team-add-${day}`} onClick={() => onTeamAdd(day)} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#a4afbb] hover:text-white">
          <Plus className="w-4 h-4" /> {tri("Aggiungi persona al turno", "Person zur Schicht", "Add person to shift", "Añadir persona", "Ajouter une personne", "افزودن نفر")}
        </button>
      </Section>

      {/* Calendario del giorno (modificabile dalla Direzione) */}
      <Section icon={CalendarClock} title={tri("Calendario del giorno", "Tageskalender", "Day calendar", "Calendario del día", "Calendrier du jour", "تقویم روز")} accent="#a4afbb" testid="piano-calendar">
        {batches.length === 0 ? (
          <p className="text-[12px] text-[#64748B]">{tri("Nessun lotto per questo giorno.", "Keine Chargen an diesem Tag.", "No batches for this day.", "Sin lotes este día.", "Aucun lot ce jour.", "بدون دسته در این روز.")}</p>
        ) : (
          <div className="space-y-1.5">
            {batches.map((b, i) => (
              <div key={i} data-testid={`piano-cal-row-${day}-${i}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-[#0b0f19]/60 px-3 py-2">
                <input
                  data-testid={`piano-batch-start-${day}-${i}`}
                  value={b.start || ""}
                  onChange={(e) => onPatch(day, i, { start: e.target.value })}
                  placeholder="HH:MM"
                  className="w-16 shrink-0 rounded-md bg-[#060A10] border border-[#8a97a6]/30 px-1.5 py-1 font-cyber text-sm font-black text-white text-center tabular-nums"
                />
                <span className="w-1.5 h-8 rounded-full shrink-0" style={{ background: LINE_COLOR[b.line] || "#8a97a6" }} />
                <div className="min-w-0 flex-1 basis-[50%]">
                  <input
                    data-testid={`piano-batch-product-${day}-${i}`}
                    value={b.product || ""}
                    onChange={(e) => onPatch(day, i, { product: e.target.value })}
                    placeholder={tri("Prodotto", "Produkt", "Product", "Producto", "Produit", "محصول")}
                    className="w-full bg-transparent text-[13px] font-bold text-white placeholder:text-[#475569] focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-[#64748B] shrink-0">{[b.line, b.rationale].filter(Boolean).join(" · ")}</span>
                    <input
                      list={`piano-team-list-${day}`}
                      data-testid={`piano-batch-assignee-${day}-${i}`}
                      value={b.assignee || ""}
                      onChange={(e) => onPatch(day, i, { assignee: e.target.value })}
                      placeholder={tri("assegna a…", "zuweisen…", "assign to…", "asignar a…", "assigner à…", "به…")}
                      className="min-w-0 flex-1 bg-transparent text-[11px] text-[#cbd5e1] placeholder:text-[#475569] border-b border-dashed border-[#8a97a6]/30 focus:outline-none focus:border-[#3E9C93]"
                    />
                  </div>
                </div>
                {/* Controlli finali: restano in linea su desktop, vanno a capo su mobile */}
                <div className="flex items-center gap-1.5 ml-auto shrink-0">
                  <input
                    data-testid={`piano-batch-qty-${day}-${i}`}
                    value={b.qty || ""}
                    onChange={(e) => onPatch(day, i, { qty: e.target.value })}
                    placeholder={tri("qtà", "Menge", "qty", "cant.", "qté", "مقدار")}
                    className="w-20 shrink-0 rounded-md bg-[#060A10] border border-[#8a97a6]/30 px-2 py-1 text-[12px] text-[#cbd5e1]"
                  />
                  <span className="text-[10px] font-mono text-[#64748B] shrink-0 w-8 text-right">{b.duration_min ? `${b.duration_min}′` : ""}</span>
                  <button data-testid={`piano-batch-course-${day}-${i}`} onClick={() => onCourse && onCourse(b.product)} title={tri("Corso della ricetta", "Rezeptkurs", "Recipe course", "Curso de receta", "Cours de recette", "دوره دستور")} className="shrink-0 p-1.5 rounded-lg text-[#8a97a6] hover:text-[#3E9C93] hover:bg-[#3E9C93]/10">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </button>
                  <button data-testid={`piano-batch-del-${day}-${i}`} onClick={() => onDel(day, i)} className="shrink-0 p-1.5 rounded-lg text-[#b06e78] hover:bg-[#b06e78]/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <datalist id={`piano-team-list-${day}`}>
          {teamNames.map((n) => (<option key={n} value={n} />))}
        </datalist>
        <button data-testid={`piano-day-add-${day}`} onClick={() => onAdd(day)} className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#a4afbb] hover:text-white">
          <Plus className="w-4 h-4" /> {tri("Aggiungi lotto", "Charge hinzufügen", "Add batch", "Añadir lote", "Ajouter un lot", "افزودن دسته")}
        </button>
      </Section>

      {/* Orari a ritroso */}
      <Section icon={Clock3} title={tri("Orari a ritroso", "Rückwärts-Zeiten", "Backward times", "Horarios inversos", "Horaires à rebours", "زمان‌های معکوس")} accent="#c9a24a" testid="piano-backward">
        {span ? (
          <>
            <div className="mb-3 rounded-lg border border-[#c9a24a]/30 bg-[#c9a24a]/8 px-3 py-2 text-[12px] text-[#f6d27a]">
              {tri("Prima azione (sveglia):", "Erste Aktion:", "First action (wake):", "Primera acción:", "Première action :", "اولین اقدام:")} <b className="font-cyber tabular-nums">{fromMin(span.min - 30)}</b> — {tri("30 min di preparazione prima del primo impasto.", "30 Min. Vorbereitung vor der ersten Charge.", "30 min prep before the first batch.", "30 min de preparación.", "30 min de préparation.", "۳۰ دقیقه آماده‌سازی.")}
            </div>
            <div className="space-y-1.5">
              {batches.filter((b) => toMin(b.start) != null).map((b, i) => (
                <div key={i} data-testid={`piano-back-row-${day}-${i}`} className="flex items-center gap-3 text-[12px]">
                  <span className="font-cyber font-black text-[#c9a24a] tabular-nums w-14 shrink-0">{b.start}</span>
                  <span className="text-[#94a3b8]">→</span>
                  <span className="text-[#cbd5e1] truncate">{tri("inizia", "starte", "start", "empieza", "commence", "شروع")} {b.product}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[12px] text-[#64748B]">{tri("Orari non disponibili per questo giorno.", "Keine Zeiten für diesen Tag.", "No times for this day.", "Sin horarios.", "Pas d'horaires.", "بدون زمان.")}</p>
        )}
      </Section>

      {/* Timeline */}
      <Section icon={GanttChartSquare} title={tri("Timeline del turno", "Schicht-Timeline", "Shift timeline", "Línea de tiempo", "Chronologie", "خط زمانی شیفت")} accent="#6e9e85" testid="piano-timeline">
        {span ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-[#64748B] mb-1">
              <span>{fromMin(span.min)}</span>
              <span>{fromMin(span.max)}</span>
            </div>
            {batches.filter((b) => toMin(b.start) != null).map((b, i) => {
              const left = ((toMin(b.start) - span.min) / span.dur) * 100;
              const width = Math.max(4, ((parseInt(b.duration_min, 10) || 60) / span.dur) * 100);
              return (
                <div key={i} data-testid={`piano-timeline-row-${day}-${i}`} className="relative h-7 rounded bg-[#0b0f19]/60">
                  <div
                    className="absolute top-0 h-7 rounded flex items-center px-2 overflow-hidden"
                    style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%`, background: `${LINE_COLOR[b.line] || "#8a97a6"}cc` }}
                  >
                    <span className="text-[10px] font-bold text-[#0b0f19] truncate">{b.product}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[12px] text-[#64748B]">{tri("Timeline non disponibile.", "Keine Timeline.", "No timeline.", "Sin línea de tiempo.", "Pas de chronologie.", "بدون خط زمانی.")}</p>
        )}
      </Section>

      {(data.warnings || []).length > 0 && (
        <div data-testid="piano-warnings" className="rounded-xl border border-[#b06e78]/30 bg-[#b06e78]/8 p-3">
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#b06e78] mb-1.5">{tri("Avvisi di Sitor", "Sitor-Warnungen", "Sitor warnings", "Avisos de Sitor", "Avertissements", "هشدارها")}</p>
          <ul className="space-y-1">
            {data.warnings.map((w, i) => (<li key={i} className="text-[12px] text-[#fda4af]">• {w}</li>))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Flusso UNICO del piano settimanale: ricette/ordini -> Sitor propone 3 strategie lun-dom
// -> la Direzione sceglie -> Sitor dettaglia i 7 giorni (orari, linee, assegnatari)
// -> la Direzione può ritoccare ogni giorno e salvare in archivio.
export default function PianoUnico({ activity: activityProp }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const activity = activityProp || getActivity();
  const prof = activityProfile(activity);

  const [recipes, setRecipes] = useState([]);
  const [rows, setRows] = useState([{ recipe_id: "", name: "", qty: "" }]);
  const [extra, setExtra] = useState("");
  const [loadingOpt, setLoadingOpt] = useState(false);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [week, setWeek] = useState(() => EMPTY_WEEK());
  const [activeDay, setActiveDay] = useState(() => DAYS[(new Date().getDay() + 6) % 7]);
  const [saving, setSaving] = useState(false);
  const [savedInfo, setSavedInfo] = useState(null);
  const [chosenLabel, setChosenLabel] = useState("");
  const [courseModal, setCourseModal] = useState(null); // {name, loading, course, err}
  const [suggMap, setSuggMap] = useState({}); // day_key -> [{recipe_name, suggested_qty}]
  useEffect(() => {
    import("@/lib/api").then(({ productionApi }) => {
      productionApi.planSuggestions().then((r) => {
        const m = {};
        (r.suggestions || []).forEach((s) => { (m[s.day_key] = m[s.day_key] || []).push(s); });
        setSuggMap(m);
      }).catch(() => {});
    });
  }, []);
  const applySuggestion = (day, recipeName, qty) => {
    setWeek((w) => {
      const d = w[day] || { batches: [], warnings: [], team: [] };
      const batches = [...(d.batches || [])];
      const idx = batches.findIndex((b) => (b.product || "").trim().toLowerCase() === recipeName.trim().toLowerCase());
      if (idx >= 0) batches[idx] = { ...batches[idx], qty: String(qty) };
      else batches.push({ product: recipeName, qty: String(qty), start: "06:00", duration_min: 60, line: "", assignee: "", rationale: "da chiusura" });
      return { ...w, [day]: { ...d, batches } };
    });
    toast.success(`${recipeName} → ${qty}`);
  };
  const openBatchCourse = async (productName) => {
    const nm = (productName || "").trim();
    if (!nm) return;
    const match = recipes.find((r) => (r.name || "").trim().toLowerCase() === nm.toLowerCase())
      || recipes.find((r) => (r.name || "").trim().toLowerCase().includes(nm.toLowerCase()));
    if (!match) { toast.error(tri("Ricetta non trovata nel ricettario.", "Rezept nicht gefunden.", "Recipe not found.", "Receta no encontrada.", "Recette introuvable.", "دستور یافت نشد.")); return; }
    setCourseModal({ name: match.name, loading: true, course: null, err: "" });
    try {
      const d = await recipesApi.course(match.id, lang);
      if (d && d.course && (d.course.phases || []).length) setCourseModal({ name: match.name, loading: false, course: d.course, err: "" });
      else setCourseModal({ name: match.name, loading: false, course: null, err: tri("Corso non disponibile, riprova.", "Kurs nicht verfügbar.", "Course unavailable.", "Curso no disponible.", "Cours indisponible.", "دوره در دسترس نیست.") });
    } catch {
      setCourseModal({ name: match.name, loading: false, course: null, err: tri("Corso non disponibile, riprova.", "Kurs nicht verfügbar.", "Course unavailable.", "Curso no disponible.", "Cours indisponible.", "دوره در دسترس نیست.") });
    }
  };

  // Ripristino del piano settimanale salvato (sopravvive al refresh)
  useEffect(() => {
    weeklyApi.get().then((d) => {
      if (!d) return;
      if (d.days && typeof d.days === "object") {
        const norm = {};
        DAYS.forEach((k) => {
          const dd = d.days[k];
          norm[k] = dd && Array.isArray(dd.batches) ? dd : { batches: [], warnings: [] };
        });
        setWeek(norm);
        setChosenLabel(d.option_label || "");
        const todayKey = DAYS[(new Date().getDay() + 6) % 7];
        const firstFull = DAYS.find((k) => (norm[k].batches || []).length > 0);
        if (!((norm[todayKey] || {}).batches || []).length && firstFull) setActiveDay(firstFull);
      }
      const cnt = Array.isArray(d.items) ? d.items.length : 0;
      if (cnt) setSavedInfo({ count: cnt, at: d.updated_at || null });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    recipesApi.list("mikilab", true).then((d) => setRecipes(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const addRow = () => setRows((r) => [...r, { recipe_id: "", name: "", qty: "" }]);
  const delRow = (i) => setRows((r) => (r.length > 1 ? r.filter((_, k) => k !== i) : r));
  const setRow = (i, patch) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  const ordersText = useMemo(() => {
    const parts = rows
      .filter((x) => x.name && x.qty)
      .map((x) => `${x.qty} ${x.name}`);
    const t = parts.join(", ");
    return [t, extra.trim()].filter(Boolean).join(". ");
  }, [rows, extra]);

  const canGenerate = ordersText.trim().length > 0 && !loadingOpt;

  const generate = async () => {
    if (!canGenerate) return;
    setLoadingOpt(true);
    setOptions([]);
    setSelected(null);
    setWeek(EMPTY_WEEK());
    try {
      const res = await mikeApi.autoplanWeekOptions({ orders_text: ordersText, lang, activity });
      const opts = (res && res.options) || [];
      if (!opts.length) {
        toast.error(tri("Sitor non ha prodotto strategie. Riprova.", "Sitor lieferte keine Strategien.", "Sitor produced no strategies. Retry.", "Sitor no produjo estrategias.", "Sitor n'a produit aucune stratégie.", "سیتور راهبردی نساخت."));
      } else {
        setOptions(opts);
        toast.success(tri(`Sitor ha proposto ${opts.length} strategie settimanali`, `Sitor schlug ${opts.length} Wochenstrategien vor`, `Sitor proposed ${opts.length} weekly strategies`, `Sitor propuso ${opts.length} estrategias`, `Sitor a proposé ${opts.length} stratégies`, `سیتور ${opts.length} راهبرد پیشنهاد داد`));
      }
    } catch (e) {
      toast.error(tri("Errore nella generazione. Riprova.", "Fehler bei der Generierung.", "Generation error. Retry.", "Error de generación.", "Erreur de génération.", "خطا در ساخت."));
    } finally {
      setLoadingOpt(false);
    }
  };

  const choose = async (i) => {
    setSelected(i);
    const o = options[i];
    if (!o) return;
    setChosenLabel(o.label || "");
    setLoadingDetail(true);
    try {
      const res = await mikeApi.autoplanWeekDetail({ days: o.days || {}, option_label: o.label || "", orders_text: ordersText, lang, activity });
      const dd = (res && res.days) || {};
      const norm = {};
      DAYS.forEach((k) => {
        norm[k] = dd[k] && Array.isArray(dd[k].batches) ? dd[k] : { batches: [], warnings: [] };
      });
      setWeek(norm);
    } catch (e) {
      toast.error(tri("Dettaglio dei 7 giorni non riuscito. Riprova.", "Detailgenerierung fehlgeschlagen.", "7-day detail failed. Retry.", "Detalle fallido.", "Échec du détail.", "جزئیات ناموفق."));
    } finally {
      setLoadingDetail(false);
    }
  };

  const patchBatch = (day, i, patch) => setWeek((w) => ({ ...w, [day]: { ...w[day], batches: w[day].batches.map((b, k) => (k === i ? { ...b, ...patch } : b)) } }));
  const delBatch = (day, i) => setWeek((w) => ({ ...w, [day]: { ...w[day], batches: w[day].batches.filter((_, k) => k !== i) } }));
  const addBatch = (day) => setWeek((w) => ({ ...w, [day]: { ...w[day], batches: [...w[day].batches, { product: "", qty: "", start: "08:00", duration_min: 60, line: "", assignee: "", rationale: "" }] } }));
  const addTeam = (day) => setWeek((w) => ({ ...w, [day]: { ...w[day], team: [...(w[day].team || []), { name: "", role: "" }] } }));
  const patchTeam = (day, i, patch) => setWeek((w) => ({ ...w, [day]: { ...w[day], team: (w[day].team || []).map((m, k) => (k === i ? { ...m, ...patch } : m)) } }));
  const delTeam = (day, i) => setWeek((w) => ({ ...w, [day]: { ...w[day], team: (w[day].team || []).filter((_, k) => k !== i) } }));

  const saveAll = async () => {
    if (!week) return;
    const totalBatches = DAYS.reduce((n, d) => n + (((week[d] || {}).batches || []).length), 0);
    if (totalBatches === 0) {
      toast.info(tri("Nessun lotto da salvare: aggiungi prodotti ai giorni.", "Keine Chargen: Produkte zu den Tagen hinzufügen.", "Nothing to save: add products to the days.", "Nada que guardar: añade productos a los días.", "Rien à enregistrer : ajoute des produits aux jours.", "چیزی برای ذخیره نیست: به روزها محصول اضافه کن."));
      return;
    }
    setSaving(true);
    try {
      const items = [];
      DAYS.forEach((day) => {
        ((week[day] || {}).batches || []).forEach((b) => {
          const match = recipes.find((r) => (r.name || "").trim().toLowerCase() === String(b.product || "").trim().toLowerCase());
          items.push({
            day,
            recipe_id: (match && match.id) || (b.product || "voce").toString().toLowerCase().replace(/\s+/g, "-").slice(0, 40) || "voce",
            recipe_name: b.product || "",
            pieces: parseFloat(String(b.qty || "0").replace(/[^0-9.]/g, "")) || 0,
          });
        });
      });
      const d = await weeklyApi.save({ items, days: week, option_label: chosenLabel });
      setSavedInfo({ count: items.length, at: d.updated_at || new Date().toISOString() });
      toast.success(tri("Piano settimanale salvato in archivio.", "Wochenplan gespeichert.", "Weekly plan saved.", "Plan semanal guardado.", "Plan hebdomadaire enregistré.", "برنامه هفتگی ذخیره شد."));
    } catch (e) {
      toast.error(tri("Salvataggio non riuscito. Riprova.", "Speichern fehlgeschlagen.", "Save failed. Retry.", "Error al guardar.", "Échec de l'enregistrement.", "ذخیره ناموفق."));
    } finally {
      setSaving(false);
    }
  };

  const speak = () => {
    const o = selected != null ? options[selected] : null;
    const txt = (o && (o.spoken || o.summary)) || chosenLabel;
    if (!txt) return;
    try { playTTS(txt, { lang, voice: "nexus" }); } catch { /* */ }
  };

  return (
    <div data-testid="piano-unico" className="space-y-6 sm:space-y-8">
      {/* Banner attività: il piano cambia in base a panificio/pizzeria/pasticceria */}
      <div data-testid="piano-activity-banner" className="flex items-start gap-3 rounded-xl border p-3.5" style={{ borderColor: `${prof.accent}44`, background: `${prof.accent}12` }}>
        <span className="text-2xl shrink-0 leading-none">{prof.icon}</span>
        <div className="min-w-0">
          <p className="font-black text-[13px] uppercase tracking-wide" style={{ color: prof.accent }} data-testid="piano-activity-label">{prof.label(lang)}</p>
          <p className="text-[12px] text-[#94A3B8] leading-snug">{prof.paradigm(lang)}</p>
          <p className="text-[11.5px] text-[#7c8794] leading-snug mt-1">{prof.planHint(lang)}</p>
        </div>
      </div>

      {savedInfo && (
        <div data-testid="piano-saved-badge" className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-300">
          <Check className="w-4 h-4" /> {tri(`Piano settimanale in archivio (${savedInfo.count} lotti). Resta disponibile anche dopo il refresh.`, `Wochenplan gespeichert (${savedInfo.count}).`, `Weekly plan saved (${savedInfo.count} batches). It stays after refresh.`, `Plan semanal guardado (${savedInfo.count}).`, `Plan hebdomadaire enregistré (${savedInfo.count}).`, `برنامه هفتگی ذخیره شد (${savedInfo.count}).`)}
        </div>
      )}

      {/* STEP 1 — Prodotti della settimana */}
      <div className="rounded-xl border border-[#8a97a6]/25 bg-[#0b0f19]/60 p-4">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#a4afbb] mb-3">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#a4afbb]/15 text-[#a4afbb] font-black">1</span>
          {tri("Cosa produrre questa settimana", "Was diese Woche produzieren", "What to produce this week", "Qué producir esta semana", "Que produire cette semaine", "این هفته چه تولید کنیم")}
        </div>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                data-testid={`piano-recipe-${i}`}
                value={row.recipe_id}
                onChange={(e) => {
                  const r = recipes.find((x) => x.id === e.target.value);
                  setRow(i, { recipe_id: e.target.value, name: r ? (r.name || "") : "" });
                }}
                className="flex-1 min-w-0 rounded-lg bg-[#060A10] border border-[#8a97a6]/30 px-3 py-2 text-sm text-white"
              >
                <option value="">{tri("Scegli una ricetta…", "Rezept wählen…", "Choose a recipe…", "Elige receta…", "Choisir une recette…", "انتخاب دستور…")}</option>
                {recipes.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
              <input
                data-testid={`piano-qty-${i}`}
                value={row.qty}
                onChange={(e) => setRow(i, { qty: e.target.value.replace(/[^0-9]/g, "") })}
                inputMode="numeric"
                placeholder={tri("pezzi/sett.", "Stück/Woche", "pieces/week", "piezas/sem.", "pièces/sem.", "تعداد/هفته")}
                className="w-28 shrink-0 rounded-lg bg-[#060A10] border border-[#8a97a6]/30 px-3 py-2 text-sm text-white"
              />
              <button data-testid={`piano-del-row-${i}`} onClick={() => delRow(i)} className="shrink-0 p-2 rounded-lg text-[#b06e78] hover:bg-[#b06e78]/10">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button data-testid="piano-add-row" onClick={addRow} className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#a4afbb] hover:text-white">
          <Plus className="w-4 h-4" /> {tri("Aggiungi prodotto", "Produkt hinzufügen", "Add product", "Añadir producto", "Ajouter un produit", "افزودن محصول")}
        </button>
        <textarea
          data-testid="piano-extra-orders"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          rows={2}
          placeholder={prof.orderPlaceholder(lang)}
          className="mt-3 w-full rounded-lg bg-[#060A10] border border-[#8a97a6]/30 px-3 py-2 text-sm text-white placeholder:text-[#64748B]"
        />
        <button
          data-testid="piano-generate"
          onClick={generate}
          disabled={!canGenerate}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider bg-[#3E9C93] hover:bg-[#347f78] text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all"
        >
          {loadingOpt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {loadingOpt
            ? tri("Sitor sta ragionando…", "Sitor denkt nach…", "Sitor is thinking…", "Sitor está pensando…", "Sitor réfléchit…", "سیتور در حال فکر…")
            : tri("Genera le strategie con Sitor", "Strategien mit Sitor generieren", "Generate strategies with Sitor", "Generar estrategias con Sitor", "Générer les stratégies avec Sitor", "ساخت راهبردها با سیتور")}
        </button>
        {loadingOpt && (
          <p className="mt-2 text-center text-[11px] text-[#64748B]">{tri("Può richiedere ~30 secondi.", "Kann ~30 Sekunden dauern.", "May take ~30 seconds.", "Puede tardar ~30 s.", "Peut prendre ~30 s.", "حدود ۳۰ ثانیه.")}</p>
        )}
      </div>

      {/* STEP 2 — Le 3 strategie settimanali di Sitor */}
      {options.length > 0 && (
        <div className="rounded-xl border border-[#9aa6b2]/25 bg-[#0b0f19]/60 p-4">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#9aa6b2] mb-3">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#9aa6b2]/15 text-[#9aa6b2] font-black">2</span>
            {tri("Scegli la strategia della settimana", "Wochenstrategie wählen", "Choose the weekly strategy", "Elige la estrategia semanal", "Choisis la stratégie de la semaine", "راهبرد هفته را انتخاب کن")}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {options.map((o, i) => {
              const isSel = selected === i;
              return (
                <button
                  key={i}
                  data-testid={`piano-option-${i}`}
                  onClick={() => choose(i)}
                  className={`text-left rounded-xl border p-3 transition-all ${isSel ? "border-[#c9a24a] bg-[#c9a24a]/10" : "border-[#8a97a6]/25 bg-[#060A10]/60 hover:border-[#9aa6b2]/50"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-cyber text-sm font-black text-white">{o.label || `Opzione ${i + 1}`}</span>
                    {isSel && <Check className="w-4 h-4 text-[#c9a24a]" />}
                  </div>
                  <p className="mt-1 text-[11px] text-[#9aa6b2] leading-snug">{o.strategy || ""}</p>
                  <p className="mt-1.5 text-[12px] text-[#cbd5e1] leading-snug">{o.summary || ""}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {DAYS.map((d) => {
                      const n = (((o.days || {})[d]) || []).length;
                      if (!n) return null;
                      return (
                        <span key={d} className="rounded-md bg-[#8a97a6]/10 border border-[#8a97a6]/20 px-1.5 py-0.5 text-[10px] font-mono text-[#9aa6b2]">
                          {tri(...DAY_TRI[d]).slice(0, 3)} · {n}
                        </span>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3 — Dettaglio dei 7 giorni */}
      {loadingDetail && (
        <div data-testid="piano-detail-loading" className="rounded-xl border border-[#c9a24a]/30 bg-[#c9a24a]/8 p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#c9a24a]" />
          <div>
            <p className="text-[13px] font-bold text-[#f6d27a]">{tri("Sitor sta dettagliando i 7 giorni…", "Sitor erstellt die 7 Tage…", "Sitor is detailing the 7 days…", "Sitor detalla los 7 días…", "Sitor détaille les 7 jours…", "سیتور در حال جزئیات ۷ روز…")}</p>
            <p className="text-[11px] text-[#94a3b8]">{tri("Orari, linee e assegnatari per ogni giorno. Può richiedere ~40 secondi.", "Zeiten, Linien und Zuständige pro Tag. Kann ~40 Sekunden dauern.", "Times, lines and assignees for each day. May take ~40 seconds.", "Puede tardar ~40 s.", "Peut prendre ~40 s.", "حدود ۴۰ ثانیه.")}</p>
          </div>
        </div>
      )}
      <AnimatePresence>
        {week && !loadingDetail && (
          <motion.div
            data-testid="piano-generated"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#c9a24a]">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#c9a24a]/15 text-[#c9a24a] font-black mr-1.5">3</span>
                {(chosenLabel || savedInfo)
                  ? tri("Piano settimanale pronto · generato da Sitor", "Wochenplan bereit · von Sitor erzeugt", "Weekly plan ready · generated by Sitor", "Plan semanal listo · generado por Sitor", "Plan hebdomadaire prêt · généré par Sitor", "برنامه هفتگی آماده · ساختهٔ سیتور")
                  : tri("La tua settimana · tocca un giorno e componi il lavoro", "Deine Woche · Tag antippen und Arbeit eintragen", "Your week · tap a day and fill in the work", "Tu semana · toca un día y compón el trabajo", "Ta semaine · touche un jour et compose le travail", "هفتهٔ تو · روی یک روز بزن و کار را بنویس")}
              </span>
              {chosenLabel && <span className="text-[12px] font-black text-white">— {chosenLabel}</span>}
              <div className="ml-auto flex gap-2 no-print">
                <button data-testid="piano-save" onClick={saveAll} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#3E9C93] hover:bg-[#347f78] text-white text-[12px] font-bold px-3 py-1.5 disabled:opacity-50 active:scale-95 transition-all">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {tri("Salva settimana", "Woche speichern", "Save week", "Guardar semana", "Enregistrer la semaine", "ذخیره هفته")}
                </button>
                {options.length > 0 && (
                <button data-testid="piano-speak" onClick={speak} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#a6b1bc] hover:text-white">
                  <Volume2 className="w-4 h-4" /> {tri("Ascolta", "Anhören", "Listen", "Escuchar", "Écouter", "بشنو")}
                </button>
                )}
                <button data-testid="piano-print" onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#a6b1bc] hover:text-white">
                  <Printer className="w-4 h-4" /> {tri("Stampa", "Drucken", "Print", "Imprimir", "Imprimer", "چاپ")}
                </button>
              </div>
            </div>

            {/* Schede Lun–Dom */}
            <div className="flex flex-wrap gap-1.5" data-testid="piano-day-tabs">
              {DAYS.map((d) => {
                const cnt = ((week[d] || {}).batches || []).length;
                const isAct = activeDay === d;
                return (
                  <button
                    key={d}
                    data-testid={`piano-day-tab-${d}`}
                    onClick={() => setActiveDay(d)}
                    className={`rounded-lg border px-3 py-1.5 text-[12px] font-bold transition-all ${isAct ? "border-[#c9a24a] bg-[#c9a24a]/15 text-white" : "border-[#8a97a6]/25 bg-[#060A10]/60 text-[#9aa6b2] hover:border-[#9aa6b2]/50"}`}
                  >
                    {tri(...DAY_TRI[d])}
                    <span className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-mono ${isAct ? "bg-[#c9a24a]/20 text-[#f6d27a]" : "bg-[#8a97a6]/10 text-[#64748B]"}`}>{cnt}</span>
                  </button>
                );
              })}
            </div>

            <div className="print-area">
              <DayPlan day={activeDay} data={week[activeDay] || { batches: [], warnings: [], team: [] }} tri={tri} onPatch={patchBatch} onDel={delBatch} onAdd={addBatch} onTeamAdd={addTeam} onTeamPatch={patchTeam} onTeamDel={delTeam} onCourse={openBatchCourse} suggestions={suggMap[activeDay] || []} onApplySuggestion={applySuggestion} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {courseModal && (
          <motion.div data-testid="piano-course-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={() => setCourseModal(null)}>
            <motion.div initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#3E9C93]/30 bg-[#0b0f19] p-5 space-y-3">
              <div className="flex items-center gap-2 sticky top-0 bg-[#0b0f19] pb-2">
                <GraduationCap className="w-5 h-5 text-[#3E9C93]" />
                <span className="flex-1 min-w-0 text-sm font-black text-white truncate">{courseModal.name}</span>
                <button data-testid="piano-course-close" onClick={() => setCourseModal(null)} className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-white/10"><X className="w-4 h-4" /></button>
              </div>
              {courseModal.loading && (
                <div data-testid="piano-course-loading" className="flex items-center gap-2 text-sm text-[#94A3B8] py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-[#3E9C93]" />
                  {tri("Sitor sta preparando il corso… (solo la prima volta)", "Sitor bereitet den Kurs vor…", "Sitor is preparing the course… (first time only)", "Sitor prepara el curso…", "Sitor prépare le cours…", "سیتور در حال آماده‌سازی دوره…")}
                </div>
              )}
              {courseModal.err && !courseModal.loading && <p className="text-sm text-[#b06e78] py-4">{courseModal.err}</p>}
              {courseModal.course && !courseModal.loading && (
                <div className="space-y-3">
                  {courseModal.course.intro && <p className="text-sm text-[#AEB8BF] leading-relaxed italic">{courseModal.course.intro}</p>}
                  <ol className="space-y-3">
                    {(courseModal.course.phases || []).map((p, i) => (
                      <li key={i} data-testid={`piano-course-phase-${i}`} className="flex gap-3">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-[#3E9C93] text-white text-xs font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#e4eff8]">{p.name}</p>
                          <p className="text-sm text-[#AEB8BF] leading-relaxed mt-0.5">{p.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {(courseModal.course.tips || []).length > 0 && (
                    <div className="rounded-xl bg-[#8a97a6]/10 border border-[#8a97a6]/20 p-3">
                      <p className="text-[11px] font-black uppercase tracking-wide text-[#8a97a6] mb-1.5">{tri("Consigli del maestro", "Tipps vom Meister", "Master's tips", "Consejos del maestro", "Conseils du maître", "توصیه‌های استاد")}</p>
                      <ul className="space-y-1">{courseModal.course.tips.map((tp, i) => (<li key={i} className="text-sm text-[#AEB8BF] leading-relaxed flex gap-2"><span className="text-[#3E9C93]">•</span><span>{tp}</span></li>))}</ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
