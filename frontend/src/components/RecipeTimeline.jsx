import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Timeline ricetta: distribuisce le fasi a ritroso dall'ora di sforno.
const parseDuration = (s) => {
  if (s == null) return 0;
  const str = String(s).toLowerCase();
  let total = 0;
  const hm = str.match(/(\d+)\s*h\s*(\d{1,2})/);
  if (hm) return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);
  const h = str.match(/(\d+(?:[.,]\d+)?)\s*(h\b|ore|ora|std|hours?|stunden?|horas?)/);
  if (h) total += parseFloat(h[1].replace(",", ".")) * 60;
  const m = str.match(/(\d+)\s*(min|minut|minute|minuten|minutos)/);
  if (m) total += parseInt(m[1], 10);
  const d = str.match(/(\d+)\s*(giorni|giorno|tage?|days?|d[íi]as?)/);
  if (d) total += parseInt(d[1], 10) * 24 * 60;
  if (total === 0) { const num = str.match(/^\s*(\d+(?:[.,]\d+)?)\s*$/); if (num) total = parseFloat(num[1].replace(",", ".")); }
  return Math.round(total);
};

const COLORS = ["#8C4A27", "#B45309", "#2e8b6f", "#C88A2B", "#a05eb5", "#C0574D", "#B45309"];

export default function RecipeTimeline({ recipe, lang: langProp }) {
  const { lang: ctxLang } = useLang();
  const lang = langProp || ctxLang;
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);

  const phases = useMemo(() => {
    const wp = Array.isArray(recipe.work_phases) ? recipe.work_phases.filter((p) => p && (p.name || p.time)) : [];
    const fromWp = wp.map((p) => ({ name: p.name || tri("Fase", "Phase", "Phase", "Fase"), mins: parseDuration(p.time), temp: p.temp })).filter((p) => p.mins > 0);
    if (fromWp.length >= 2) return fromWp;
    // Deriva le fasi dai campi reali della ricetta MikiLab.
    const num = (v) => (v == null || v === "" ? 0 : Number(v) || 0);
    const derived = [];
    if (num(recipe.mix_minutes) > 0) derived.push({ name: tri("Impasto", "Kneten", "Mixing", "Amasado"), mins: Math.round(num(recipe.mix_minutes)) });
    if (num(recipe.bulk_fermentation_hours) > 0) derived.push({ name: tri("Puntata (massa)", "Stockgare", "Bulk ferment", "Fermentación en masa"), mins: Math.round(num(recipe.bulk_fermentation_hours) * 60) });
    if (num(recipe.rest_minutes) > 0) derived.push({ name: tri("Riposo", "Ruhe", "Rest", "Reposo"), mins: Math.round(num(recipe.rest_minutes)) });
    if (num(recipe.proofing_hours) > 0) derived.push({ name: tri("Appretto", "Stückgare", "Final proof", "Fermentación final"), mins: Math.round(num(recipe.proofing_hours) * 60) });
    if (num(recipe.bake_minutes) > 0) derived.push({ name: tri("Cottura", "Backen", "Baking", "Horneado"), mins: Math.round(num(recipe.bake_minutes)), temp: recipe.bake_temp });
    return derived; // può essere vuoto o con 1 sola fase
  }, [recipe, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const isReal = phases.length >= 2 || (Array.isArray(recipe.work_phases) && recipe.work_phases.filter((p) => p && (p.name || p.time)).length >= 2);
  const totalMins = phases.reduce((a, p) => a + p.mins, 0);

  const defaultTarget = useMemo(() => {
    const d = new Date(Date.now() + totalMins * 60000);
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }, [totalMins]);
  const [target, setTarget] = useState(defaultTarget);

  const rows = useMemo(() => {
    const [hh, mm] = (target || "00:00").split(":").map((x) => parseInt(x, 10) || 0);
    const end = new Date(); end.setHours(hh, mm, 0, 0);
    let cur = new Date(end.getTime() - totalMins * 60000); // inizio prima fase
    const fmt = (dt) => dt.toLocaleTimeString(mkTri(lang)("it-IT", "de-DE", "en-GB", "es-ES"), { hour: "2-digit", minute: "2-digit" });
    const out = phases.map((p, i) => {
      const start = new Date(cur);
      cur = new Date(cur.getTime() + p.mins * 60000);
      return { ...p, i, start: fmt(start), end: fmt(cur) };
    });
    return { out, startClock: fmt(new Date(end.getTime() - totalMins * 60000)) };
  }, [phases, target, totalMins, lang]);

  const durStr = (m) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? " " + (m % 60) + "m" : ""}` : `${m}m`);
  const inp = "bg-[#FAF5EC] dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] rounded-lg px-2 py-1.5 outline-none text-sm font-mono-data text-[#2B303B] dark:text-[#e4eff8] focus:border-[#8C4A27]";

  if (phases.length < 2) {
    return (
      <div data-testid={`recipe-timeline-${recipe.id}`} className="rounded-xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#8C4A27] flex items-center gap-1 mb-2"><Clock className="w-3.5 h-3.5" /> {tri("Linea del tempo", "Zeitplan", "Timeline", "Línea de tiempo")}</p>
        <p className="text-sm text-[#7E8A93]">{tri("Questa ricetta non ha una sequenza di lievitazione/cottura con tempi (es. una base, un lievito o un miglioratore).", "Dieses Rezept hat keine Gär-/Backsequenz mit Zeiten (z. B. eine Basis, ein Sauerteig oder ein Verbesserer).", "This recipe has no proof/bake sequence with times (e.g. a base, a starter or an improver).", "Esta receta no tiene una secuencia de fermentación/horneado con tiempos (p. ej. una base, una masa madre o un mejorante).")}</p>
      </div>
    );
  }

  return (
    <div data-testid={`recipe-timeline-${recipe.id}`} className="rounded-xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#8C4A27] flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {tri("Linea del tempo", "Zeitplan", "Timeline", "Línea de tiempo")}</p>
        <label className="text-[11px] font-semibold text-[#7E8A93] flex items-center gap-1.5 no-print">
          {tri("Sforno alle", "Ausbacken um", "Bake out at", "Sacar a las")}
          <input data-testid={`timeline-target-${recipe.id}`} type="time" value={target} onChange={(e) => setTarget(e.target.value)} className={inp} />
        </label>
      </div>
      <p className="text-xs text-[#7E8A93] mb-3">{tri("Inizia a impastare alle", "Beginne zu kneten um", "Start mixing at", "Empieza a amasar a las")} <b data-testid={`timeline-start-${recipe.id}`} className="text-[#6E371C] dark:text-[#a9d2ec] font-mono-data">{rows.startClock}</b> · {tri("durata totale", "Gesamtdauer", "total", "duración total")} {durStr(totalMins)}</p>
      <div className="relative pl-4">
        <div className="absolute left-[6px] top-1 bottom-1 w-0.5 bg-[#E6D8C3] dark:bg-[#38424B]" />
        {rows.out.map((p) => (
          <div key={p.i} data-testid={`timeline-phase-${recipe.id}-${p.i}`} className="relative mb-3 last:mb-0">
            <span className="absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#232A31]" style={{ background: COLORS[p.i % COLORS.length] }} />
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8]">{p.name}</p>
              <span className="font-mono-data text-xs text-[#6E371C] dark:text-[#8FB0C2] shrink-0">{p.start} → {p.end}</span>
            </div>
            <p className="text-[11px] text-[#7E8A93]">{durStr(p.mins)}{p.temp ? ` · ${p.temp}°C` : ""}</p>
          </div>
        ))}
        <div className="relative">
          <span className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-[#C0574D] border-2 border-white dark:border-[#232A31]" />
          <p className="text-sm font-bold text-[#C0574D]">🍞 {tri("Pronto / Sforno", "Fertig / Ausbacken", "Ready / Bake out", "Listo / Sacar")} — <span className="font-mono-data">{target}</span></p>
        </div>
      </div>
      {!isReal && (
        <p className="text-[10.5px] text-[#7E8A93] mt-3 italic">{tri("Orari basati sui tempi della ricetta; regola l'ora di sforno e valida sempre a vista.", "Zeiten aus dem Rezept; Ausback-Zeit anpassen und per Auge prüfen.", "Times from the recipe; adjust the bake-out time and always check by eye.", "Horarios según los tiempos de la receta; ajusta la hora y valida a la vista.")}</p>
      )}
    </div>
  );
}
