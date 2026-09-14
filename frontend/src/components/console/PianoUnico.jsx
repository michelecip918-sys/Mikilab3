import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Wand2, CalendarClock, Clock3, GanttChartSquare, Volume2, Printer, Check, Loader2, Save } from "lucide-react";
import { recipesApi, mikeApi, weeklyApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { getActivity, activityProfile } from "@/lib/activityProfile";
import { toast } from "sonner";

const LINE_LABEL = { baguette: "Baguette", pane: "Pane", pizzeria: "Pizzeria", pasticceria: "Pasticceria" };
const LINE_COLOR = { baguette: "#a4afbb", pane: "#c9a24a", pizzeria: "#b06e78", pasticceria: "#6e9e85" };

const toMin = (hhmm) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || "").trim());
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
};
const fromMin = (min) => {
  const mm = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`;
};

// Flusso UNICO del piano: ricette/ordini -> Sitor genera 2-3 opzioni -> il Capo sceglie
// -> calendario, orari a ritroso e timeline si generano da soli dall'opzione scelta.
export default function PianoUnico({ activity: activityProp }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const activity = activityProp || getActivity();
  const prof = activityProfile(activity);

  const [recipes, setRecipes] = useState([]);
  const [rows, setRows] = useState([{ recipe_id: "", name: "", qty: "" }]);
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedInfo, setSavedInfo] = useState(null);

  useEffect(() => {
    weeklyApi.get().then((d) => {
      if (d && Array.isArray(d.items) && d.items.length) setSavedInfo({ count: d.items.length, at: d.saved_at || d.updated_at || null });
    }).catch(() => {});
  }, []);

  const DAY_TODAY = (() => { const d = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"]; return d[new Date().getDay()]; })();

  const saveChosen = async () => {
    if (!opt) return;
    setSaving(true);
    try {
      const items = (opt.batches || []).map((b) => ({
        day: DAY_TODAY,
        recipe_id: (b.product || "voce").toString().toLowerCase().replace(/\s+/g, "-").slice(0, 40),
        recipe_name: b.product || "",
        pieces: parseFloat(String(b.qty || "0").replace(/[^0-9.]/g, "")) || 0,
      }));
      const d = await weeklyApi.save({ items });
      setSavedInfo({ count: (d.items || items).length, at: d.updated_at || new Date().toISOString() });
      toast.success(tri("Piano salvato.", "Plan gespeichert.", "Plan saved.", "Plan guardado.", "Plan enregistré.", "برنامه ذخیره شد."));
    } catch (e) {
      toast.error(tri("Salvataggio non riuscito. Riprova.", "Speichern fehlgeschlagen.", "Save failed. Retry.", "Error al guardar.", "Échec de l'enregistrement.", "ذخیره ناموفق."));
    } finally { setSaving(false); }
  };

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

  const canGenerate = ordersText.trim().length > 0 && !loading;

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setOptions([]);
    setSelected(null);
    try {
      const res = await mikeApi.autoplanOptions({ orders_text: ordersText, lang, activity });
      const opts = (res && res.options) || [];
      if (!opts.length) {
        toast.error(tri("Sitor non ha prodotto opzioni. Riprova.", "Sitor lieferte keine Optionen.", "Sitor produced no options. Retry.", "Sitor no produjo opciones.", "Sitor n'a produit aucune option.", "سیتور گزینه‌ای نساخت."));
      } else {
        setOptions(opts);
        toast.success(tri(`Sitor ha proposto ${opts.length} opzioni`, `Sitor schlug ${opts.length} Optionen vor`, `Sitor proposed ${opts.length} options`, `Sitor propuso ${opts.length} opciones`, `Sitor a proposé ${opts.length} options`, `سیتور ${opts.length} گزینه پیشنهاد داد`));
      }
    } catch (e) {
      toast.error(tri("Errore nella generazione. Riprova.", "Fehler bei der Generierung.", "Generation error. Retry.", "Error de generación.", "Erreur de génération.", "خطا در ساخت."));
    } finally {
      setLoading(false);
    }
  };

  const opt = selected != null ? options[selected] : null;
  const batches = useMemo(() => {
    const b = (opt && Array.isArray(opt.batches) ? opt.batches : []).map((x) => ({ ...x, _start: toMin(x.start) }));
    return b.sort((a, z) => (a._start ?? 1e9) - (z._start ?? 1e9));
  }, [opt]);

  const span = useMemo(() => {
    const starts = batches.map((b) => b._start).filter((x) => x != null);
    if (!starts.length) return null;
    const ends = batches.map((b) => (b._start != null ? b._start + (parseInt(b.duration_min, 10) || 60) : null)).filter((x) => x != null);
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    return { min, max, dur: Math.max(30, max - min) };
  }, [batches]);

  const speak = () => {
    if (!opt) return;
    try { playTTS(opt.spoken || opt.summary || "", { lang, voice: "nexus" }); } catch { /* */ }
  };

  const Section = ({ icon: Ic, title, accent, testid, children }) => (
    <div data-testid={testid} className="rounded-xl border bg-[#060A10]/70 p-4" style={{ borderColor: `${accent}33` }}>
      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>
        <Ic className="w-4 h-4" /> {title}
      </div>
      {children}
    </div>
  );

  return (
    <div data-testid="piano-unico" className="space-y-5">
      {/* Banner attività: il piano cambia in base a panificio/pizzeria/pasticceria */}
      <div data-testid="piano-activity-banner" className="flex items-start gap-3 rounded-xl border p-3.5" style={{ borderColor: `${prof.accent}44`, background: `${prof.accent}12` }}>
        <span className="text-2xl shrink-0 leading-none">{prof.icon}</span>
        <div className="min-w-0">
          <p className="font-black text-[13px] uppercase tracking-wide" style={{ color: prof.accent }} data-testid="piano-activity-label">{prof.label(lang)}</p>
          <p className="text-[12px] text-[#94A3B8] leading-snug">{prof.paradigm(lang)}</p>
          <p className="text-[11.5px] text-[#7c8794] leading-snug mt-1">{prof.planHint(lang)}</p>
        </div>
      </div>
      {/* STEP 1 — Ricette / Ordini */}
      {savedInfo && (
        <div data-testid="piano-saved-badge" className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-300">
          <Check className="w-4 h-4" /> {tri(`Piano salvato in archivio (${savedInfo.count} voci). Resta disponibile anche dopo il refresh.`, `Plan gespeichert (${savedInfo.count}).`, `Plan saved (${savedInfo.count} items). It stays after refresh.`, `Plan guardado (${savedInfo.count}).`, `Plan enregistré (${savedInfo.count}).`, `برنامه ذخیره شد (${savedInfo.count}).`)}
        </div>
      )}
      <div className="rounded-xl border border-[#8a97a6]/25 bg-[#0b0f19]/60 p-4">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#a4afbb] mb-3">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#a4afbb]/15 text-[#a4afbb] font-black">1</span>
          {tri("Cosa produrre oggi", "Was heute produzieren", "What to produce today", "Qué producir hoy", "Que produire aujourd'hui", "امروز چه تولید کنیم")}
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
                placeholder={tri("pezzi", "Stück", "pieces", "piezas", "pièces", "تعداد")}
                className="w-24 shrink-0 rounded-lg bg-[#060A10] border border-[#8a97a6]/30 px-3 py-2 text-sm text-white"
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
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider bg-[#c9a24a] text-[#0b0f19] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {loading
            ? tri("Sitor sta ragionando…", "Sitor denkt nach…", "Sitor is thinking…", "Sitor está pensando…", "Sitor réfléchit…", "سیتور در حال فکر…")
            : tri("Genera le opzioni con Sitor", "Optionen mit Sitor generieren", "Generate options with Sitor", "Generar opciones con Sitor", "Générer les options avec Sitor", "ساخت گزینه‌ها با سیتور")}
        </button>
        {loading && (
          <p className="mt-2 text-center text-[11px] text-[#64748B]">{tri("Può richiedere ~30 secondi.", "Kann ~30 Sekunden dauern.", "May take ~30 seconds.", "Puede tardar ~30 s.", "Peut prendre ~30 s.", "حدود ۳۰ ثانیه.")}</p>
        )}
      </div>

      {/* STEP 2 — Le 2-3 opzioni di Sitor */}
      {options.length > 0 && (
        <div className="rounded-xl border border-[#9aa6b2]/25 bg-[#0b0f19]/60 p-4">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#9aa6b2] mb-3">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#9aa6b2]/15 text-[#9aa6b2] font-black">2</span>
            {tri("Scegli l'opzione di Sitor", "Sitor-Option wählen", "Choose Sitor's option", "Elige la opción de Sitor", "Choisis l'option de Sitor", "گزینه سیتور را انتخاب کن")}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {options.map((o, i) => {
              const isSel = selected === i;
              return (
                <button
                  key={i}
                  data-testid={`piano-option-${i}`}
                  onClick={() => setSelected(i)}
                  className={`text-left rounded-xl border p-3 transition-all ${isSel ? "border-[#c9a24a] bg-[#c9a24a]/10" : "border-[#8a97a6]/25 bg-[#060A10]/60 hover:border-[#9aa6b2]/50"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-cyber text-sm font-black text-white">{o.label || `Opzione ${i + 1}`}</span>
                    {isSel && <Check className="w-4 h-4 text-[#c9a24a]" />}
                  </div>
                  <p className="mt-1 text-[11px] text-[#9aa6b2] leading-snug">{o.strategy || ""}</p>
                  <p className="mt-1.5 text-[12px] text-[#cbd5e1] leading-snug">{o.summary || ""}</p>
                  <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-[#64748B]">{(o.batches || []).length} {tri("lotti", "Chargen", "batches", "lotes", "lots", "دسته")}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3 — Generati DA SOLI dall'opzione scelta */}
      <AnimatePresence>
        {opt && (
          <motion.div
            data-testid="piano-generated"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4 print-area"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#c9a24a]">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#c9a24a]/15 text-[#c9a24a] font-black mr-1.5">3</span>
                {tri("Piano pronto · generato da Sitor", "Plan bereit · von Sitor erzeugt", "Plan ready · generated by Sitor", "Plan listo · generado por Sitor", "Plan prêt · généré par Sitor", "برنامه آماده · ساختهٔ سیتور")}
              </span>
              <span className="text-[12px] font-black text-white">— {opt.label}</span>
              <div className="ml-auto flex gap-2 no-print">
                <button data-testid="piano-save" onClick={saveChosen} disabled={saving} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {tri("Salva piano", "Plan speichern", "Save plan", "Guardar plan", "Enregistrer", "ذخیره برنامه")}
                </button>
                <button data-testid="piano-speak" onClick={speak} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#a6b1bc] hover:text-white">
                  <Volume2 className="w-4 h-4" /> {tri("Ascolta", "Anhören", "Listen", "Escuchar", "Écouter", "بشنو")}
                </button>
                <button data-testid="piano-print" onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#a6b1bc] hover:text-white">
                  <Printer className="w-4 h-4" /> {tri("Stampa", "Drucken", "Print", "Imprimir", "Imprimer", "چاپ")}
                </button>
              </div>
            </div>

            {/* Calendario del giorno */}
            <Section icon={CalendarClock} title={tri("Calendario del giorno", "Tageskalender", "Day calendar", "Calendario del día", "Calendrier du jour", "تقویم روز")} accent="#a4afbb" testid="piano-calendar">
              {batches.length === 0 ? (
                <p className="text-[12px] text-[#64748B]">{tri("Nessun lotto nell'opzione.", "Keine Chargen.", "No batches.", "Sin lotes.", "Aucun lot.", "بدون دسته.")}</p>
              ) : (
                <div className="space-y-1.5">
                  {batches.map((b, i) => (
                    <div key={i} data-testid={`piano-cal-row-${i}`} className="flex items-center gap-3 rounded-lg bg-[#0b0f19]/60 px-3 py-2">
                      <span className="font-cyber text-sm font-black text-white tabular-nums w-14 shrink-0">{b.start || "--:--"}</span>
                      <span className="w-1.5 h-8 rounded-full shrink-0" style={{ background: LINE_COLOR[b.line] || "#8a97a6" }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-white truncate">{b.product} {b.qty ? <span className="text-[#9aa6b2] font-normal">· {b.qty}</span> : null}</div>
                        <div className="text-[11px] text-[#64748B] truncate">{LINE_LABEL[b.line] || b.line} · {b.assignee || tri("da assegnare", "zuzuweisen", "to assign", "por asignar", "à assigner", "برای تخصیص")} · {b.rationale || ""}</div>
                      </div>
                      <span className="text-[10px] font-mono text-[#64748B] shrink-0">{b.duration_min ? `${b.duration_min}′` : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Orari a ritroso */}
            <Section icon={Clock3} title={tri("Orari a ritroso", "Rückwärts-Zeiten", "Backward times", "Horarios inversos", "Horaires à rebours", "زمان‌های معکوس")} accent="#c9a24a" testid="piano-backward">
              {span ? (
                <>
                  <div className="mb-3 rounded-lg border border-[#c9a24a]/30 bg-[#c9a24a]/8 px-3 py-2 text-[12px] text-[#f6d27a]">
                    ⏰ {tri("Prima azione (sveglia):", "Erste Aktion:", "First action (wake):", "Primera acción:", "Première action :", "اولین اقدام:")} <b className="font-cyber tabular-nums">{fromMin(span.min - 30)}</b> — {tri("30 min di preparazione prima del primo impasto.", "30 Min. Vorbereitung vor der ersten Charge.", "30 min prep before the first batch.", "30 min de preparación.", "30 min de préparation.", "۳۰ دقیقه آماده‌سازی.")}
                  </div>
                  <div className="space-y-1.5">
                    {batches.filter((b) => b._start != null).map((b, i) => (
                      <div key={i} data-testid={`piano-back-row-${i}`} className="flex items-center gap-3 text-[12px]">
                        <span className="font-cyber font-black text-[#c9a24a] tabular-nums w-14 shrink-0">{b.start}</span>
                        <span className="text-[#94a3b8]">→</span>
                        <span className="text-[#cbd5e1] truncate">{tri("inizia", "starte", "start", "empieza", "commence", "شروع")} {b.product}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[12px] text-[#64748B]">{tri("Orari non disponibili in questa opzione.", "Keine Zeiten.", "No times available.", "Sin horarios.", "Pas d'horaires.", "بدون زمان.")}</p>
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
                  {batches.filter((b) => b._start != null).map((b, i) => {
                    const left = ((b._start - span.min) / span.dur) * 100;
                    const width = Math.max(4, ((parseInt(b.duration_min, 10) || 60) / span.dur) * 100);
                    return (
                      <div key={i} data-testid={`piano-timeline-row-${i}`} className="relative h-7 rounded bg-[#0b0f19]/60">
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

            {(opt.warnings && opt.warnings.length > 0) && (
              <div data-testid="piano-warnings" className="rounded-xl border border-[#b06e78]/30 bg-[#b06e78]/8 p-3">
                <p className="text-[11px] font-mono uppercase tracking-widest text-[#b06e78] mb-1.5">{tri("Avvisi di Sitor", "Sitor-Warnungen", "Sitor warnings", "Avisos de Sitor", "Avertissements", "هشدارها")}</p>
                <ul className="space-y-1">
                  {opt.warnings.map((w, i) => (<li key={i} className="text-[12px] text-[#fda4af]">• {w}</li>))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
