import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Mic, CheckCircle2, Circle, PackageCheck, Zap } from "lucide-react";
import { recipesApi } from "@/lib/api";
import { recipeTitle } from "@/lib/loc";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { fetchWeeklyItems, todayKey, itemsForDay, dayLabel } from "@/lib/weeklyPlan";
import { useShift, setWorkMode, setBatchStatus, batchStatus, statusLabel, STATUS_COLOR, basesSummary, autonomyDeadline, fmtHM, baseAlert } from "@/lib/shiftState";

// Ricette del Giorno — lista prodotti in programma oggi; tap → dosi in GRANDE + stato lotto.
// Flusso continuo o Autonomia: aggiorni lo stato (Pronto / In cella / Pre-cotto…) per chi lavora dopo.
const C = { cream: "#F5ECD7", surf: "#FBF6E8", border: "#E3C989", gold: "#C8862B", title: "#8A5A16", dark: "#3D2B1F", muted: "#6B5138" };
// Stati mostrati in dettaglio (avanzamento del lotto).
const STEP_STATUSES = ["pronto", "in_cella", "in_lievitazione", "precotto", "base_pronta", "fatto"];

export default function RicettaDelGiorno() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const shift = useShift();
  const [recipes, setRecipes] = useState([]);
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    (async () => {
      const [mk, pe, wk] = await Promise.all([recipesApi.list("mikilab"), recipesApi.list("personal"), fetchWeeklyItems()]);
      const seen = new Set(); const all = [];
      for (const r of [...(pe || []), ...(mk || [])]) { const id = r.id || r.recipe_id; if (id && !seen.has(id)) { seen.add(id); all.push(r); } }
      setRecipes(all);
      setItems(itemsForDay(wk, todayKey()));
    })();
  }, []);

  const recById = (id) => recipes.find((x) => (x.id || x.recipe_id) === id) || null;
  const batchFor = (it) => { const rr = recById(it.recipe_id); return { id: it.id, recipe_id: it.recipe_id, recipe_name: rr ? recipeTitle(rr, lang) : it.recipe_name, pieces: Math.round(it.pieces || 0) }; };
  const bases = basesSummary(shift);

  const r = sel ? recById(sel.recipe_id) : null;
  const rows = useMemo(() => r ? [
    { k: tri("Farina", "Mehl", "Flour", "Harina"), v: r.flour_grams, u: "g" },
    { k: tri("Acqua", "Wasser", "Water", "Agua"), v: r.water_grams, u: "g", extra: r.water_temp_c ? `${r.water_temp_c}\u00b0C` : null },
    { k: r.preferment_type === "biga" ? "Biga" : tri("Lievito madre", "Sauerteig", "Sourdough", "Masa madre"), v: r.sourdough_grams, u: "g" },
    { k: tri("Sale", "Salz", "Salt", "Sal"), v: r.salt_grams, u: "g" },
  ].filter((x) => x.v != null && x.v !== "") : [], [r, lang]); // eslint-disable-line

  if (sel && r) {
    const pieces = Math.round(sel.pieces || 0);
    const cur = batchStatus(shift, sel.id);
    return (
      <div data-testid="rdg-detail" className="min-h-[70vh] rounded-3xl p-5 pb-28" style={{ background: C.cream, color: C.dark }}>
        <button data-testid="rdg-back" onClick={() => setSel(null)} className="inline-flex items-center gap-1.5 mb-3 font-bold" style={{ color: C.title }}>
          <ChevronLeft className="w-5 h-5" /> {tri("Prodotti di oggi", "Produkte heute", "Today's products", "Productos de hoy")}
        </button>
        <h1 className="font-display font-extrabold leading-tight" style={{ fontSize: "clamp(28px,7vw,44px)", color: C.dark }} data-testid="rdg-name">{recipeTitle(r, lang)}</h1>
        <p className="font-bold mt-0.5" style={{ color: C.title, fontSize: "clamp(15px,4vw,18px)" }}>{pieces > 0 ? `${pieces} ${tri("pezzi", "St\u00fcck", "pieces", "piezas")}` : ""}</p>
        <div className="h-1.5 w-16 rounded-full mt-2 mb-4" style={{ background: C.gold }} />
        <div className="space-y-3" data-testid="rdg-doses">
          {rows.map((row, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 rounded-2xl px-4 py-3" style={{ background: C.surf, border: `2px solid ${C.border}` }}>
              <span className="font-bold" style={{ fontSize: "clamp(18px,5vw,26px)", color: C.dark }}>{row.k}</span>
              <span className="font-mono-data font-extrabold whitespace-nowrap" style={{ fontSize: "clamp(24px,7vw,38px)", color: "#8A5A16" }}>
                {Math.round(row.v)}{row.u}{row.extra ? <span className="ml-2 font-bold" style={{ fontSize: "0.6em", color: C.gold }}>{row.extra}</span> : null}
              </span>
            </div>
          ))}
        </div>

        {/* Avanzamento lotto: stato per chi lavora dopo */}
        <p className="text-xs font-extrabold uppercase tracking-widest mt-5 mb-2" style={{ color: C.title }}>{tri("Segna lo stato del lotto", "Charge-Status setzen", "Set batch status", "Estado del lote")}</p>
        <div className="grid grid-cols-2 gap-2" data-testid="rdg-status-grid">
          {STEP_STATUSES.map((st) => {
            const on = cur === st;
            return (
              <button key={st} data-testid={`rdg-status-${st}`} onClick={() => setBatchStatus(batchFor(sel), st)}
                className="rounded-2xl py-3 px-3 font-extrabold text-[14px] active:scale-95 transition-all text-center"
                style={{ background: on ? (STATUS_COLOR[st] || C.gold) : C.surf, border: `2px solid ${on ? (STATUS_COLOR[st] || C.gold) : C.border}`, color: on ? "#FBF6E8" : C.dark }}>
                {statusLabel(st, tri)}
              </button>
            );
          })}
        </div>
        <button data-testid="rdg-done" onClick={() => { setBatchStatus(batchFor(sel), "fatto"); setSel(null); }}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-extrabold" style={{ background: C.dark, color: C.cream, fontSize: "clamp(16px,4.5vw,19px)" }}>
          <CheckCircle2 className="w-5 h-5" style={{ color: "#E3C989" }} /> {tri("Lotto completato \u2192 prossimo", "Charge fertig", "Batch done \u2192 next", "Lote hecho")}
        </button>
      </div>
    );
  }

  const autonomia = shift.work_mode === "autonomia";
  const deadline = autonomia ? autonomyDeadline(shift) : null;
  return (
    <div data-testid="ricetta-del-giorno" className="min-h-[70vh] rounded-3xl p-5 pb-28" style={{ background: C.cream, color: C.dark }}>
      <p className="text-sm font-bold uppercase tracking-widest" style={{ color: C.title }}>{tri("Ricette del Giorno", "Tagesrezepte", "Today's Recipes", "Recetas del D\u00eda")} · {dayLabel(todayKey(), lang)}</p>
      <h1 className="font-display font-extrabold leading-tight mt-1 mb-2" style={{ fontSize: "clamp(24px,6vw,36px)", color: C.dark }}>{tri("Produzione di oggi", "Heutige Produktion", "Today's production", "Producci\u00f3n de hoy")}</h1>

      {/* Modalità di lavoro: Flusso Continuo vs In Autonomia */}
      <div className="grid grid-cols-2 gap-2 mb-3" data-testid="rdg-workmode">
        {[
          { id: "continuo", Icon: Zap, t: tri("Flusso Continuo", "Kontinuierlich", "Continuous", "Flujo Continuo", "Flux Continu", "پیوسته") },
          { id: "autonomia", Icon: PackageCheck, t: tri("In Autonomia", "Eigenständig", "Autonomous", "En Autonomía", "En Autonomie", "خودگردان") },
        ].map((m) => {
          const on = shift.work_mode === m.id;
          return (
            <button key={m.id} data-testid={`rdg-mode-${m.id}`} onClick={() => setWorkMode(m.id)}
              className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-extrabold text-[13px] active:scale-95 transition-all"
              style={{ background: on ? C.gold : C.surf, border: `2px solid ${on ? C.gold : C.border}`, color: on ? C.cream : C.dark }}>
              <m.Icon className="w-4 h-4" /> {m.t}
            </button>
          );
        })}
      </div>
      {autonomia && (
        <div className="rounded-xl px-3 py-2 mb-3" style={{ background: "#FBEEDD", border: `2px solid ${C.gold}` }}>
          <p className="text-[12px] leading-snug" style={{ color: C.dark }}>{tri("Modalità Autonomia: completa i lotti in blocco e aggiorna lo stato (Pronto / In cella / In lievitazione) per chi lavora dopo di te.", "Autonomie: Chargen im Block fertigen und Status setzen.", "Autonomy: complete batches in bulk and update status for the next worker.", "Autonomía: completa lotes y actualiza el estado.", "Autonomie : termine les lots et mets à jour le statut.", "خودگردان: دسته‌ها را کامل کن و وضعیت را به‌روز کن.")}</p>
          {deadline && <p className="text-[12px] font-extrabold mt-1" style={{ color: "#8A5A16" }}>⏰ {tri("Puoi lavorare in autonomia fino alle", "Autonom bis", "Work autonomously until", "Autonomía hasta", "Autonomie jusqu'à", "خودگردان تا")} {fmtHM(deadline, lang)}.</p>}
        </div>
      )}

      <div className="rounded-xl px-3 py-2 mb-4 flex items-center gap-2" style={{ background: C.surf, border: `2px solid ${C.border}` }}>
        <Mic className="w-4 h-4 shrink-0" style={{ color: C.gold }} />
        <p className="text-[12.5px]" style={{ color: C.muted }}>{tri("A voce: \u00abSegna 10 teglie focaccia come precotte\u00bb o \u00abLotto 2 pronto in cella\u00bb.", "Sag: \u00abMarkiere 10 Bleche Focaccia als vorgebacken\u00bb.", "Say: \u00abMark 10 focaccia trays as pre-baked\u00bb.", "Di: \u00abMarca 10 bandejas de focaccia como precocidas\u00bb.", "Dis : \u00abMarque 10 plaques de focaccia précuites\u00bb.", "بگو: «۱۰ سینی فوکاچا را نیم‌پز علامت بزن».")}</p>
      </div>

      {/* Riepilogo Basi & Pre-cotti disponibili */}
      {bases.length > 0 && (
        <div className="mb-4" data-testid="rdg-bases">
          <p className="text-[11px] font-extrabold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: C.title }}><PackageCheck className="w-4 h-4" /> {tri("Basi & Pre-cotti in cella", "Basen & Vorgebacken", "Bases & Pre-baked", "Bases y Precocidos", "Bases & Précuits", "پایه‌ها و نیم‌پزها")}</p>
          <div className="flex flex-wrap gap-1.5">
            {bases.map((b, i) => {
              const al = baseAlert(b);
              return (
                <span key={i} className="text-[12px] font-bold rounded-full px-3 py-1.5" style={{ background: al ? "#F3C9A6" : "#EED8A8", color: C.dark }}>{b.qty}{b.unit ? ` ${b.unit}` : ""} {b.product} · {statusLabel(b.kind, tri)}{al ? (al === "scaduto" ? " ⚠️" : " ⏳") : ""}</span>
              );
            })}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-lg" style={{ color: C.muted }}>{tri("Nessun prodotto in piano oggi. Pianifica in Gestione \u2192 Programma Settimana.", "Heute nichts geplant.", "Nothing planned today.", "Nada planificado hoy.")}</p>
      ) : (
        <div className="space-y-2.5" data-testid="rdg-list">
          {items.map((it) => {
            const rr = recById(it.recipe_id);
            const st = batchStatus(shift, it.id);
            const isDone = st === "fatto";
            const isActive = st !== "da_fare";
            return (
              <button key={it.id} data-testid={`rdg-item-${it.recipe_id}`} onClick={() => setSel(it)}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left active:scale-98 transition-all" style={{ background: C.surf, border: `2px solid ${isActive ? (STATUS_COLOR[st] || C.gold) : C.border}`, opacity: isDone ? 0.6 : 1 }}>
                {isDone ? <CheckCircle2 className="w-6 h-6 shrink-0" style={{ color: "#5E7A3A" }} /> : <Circle className="w-6 h-6 shrink-0" style={{ color: isActive ? (STATUS_COLOR[st] || C.gold) : C.gold }} />}
                <span className="flex-1 min-w-0">
                  <span className="block font-extrabold truncate" style={{ fontSize: "clamp(18px,5vw,24px)", color: C.dark, textDecoration: isDone ? "line-through" : "none" }}>{rr ? recipeTitle(rr, lang) : it.recipe_name}</span>
                  {isActive && <span className="block text-[11px] font-bold" style={{ color: STATUS_COLOR[st] || C.gold }}>{statusLabel(st, tri)}</span>}
                </span>
                <span className="font-mono-data font-extrabold shrink-0" style={{ fontSize: "clamp(18px,5vw,24px)", color: C.title }}>{Math.round(it.pieces || 0)}×</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
