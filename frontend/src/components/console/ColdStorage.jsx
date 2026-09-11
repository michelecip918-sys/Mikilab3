import { useEffect, useState, useCallback } from "react";
import { Snowflake, Thermometer, Plus, Trash2, Save, AlertTriangle, Building2, Waves } from "lucide-react";
import { toast } from "sonner";
import { deptApi, freezerApi, sensorsApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { SubTabs } from "@/components/console/SubTabs";
import AdaptiveProofing from "@/components/console/AdaptiveProofing";

// Deduce tipo cella + temperatura obiettivo dal nome (nessun dato hardware richiesto).
function cellKind(name, tri) {
  const n = (name || "").toLowerCase();
  if (/freezer|surgel|abbatt|gefrier/.test(n)) return { key: "freezer", temp: -18, color: "#7DA3C0", label: tri("Freezer", "Gefrier", "Freezer", "Congelador", "Congélateur", "فریزر") };
  if (/ferm|retard|blocca/.test(n)) return { key: "retard", temp: 3, color: "#6ea0b0", label: tri("Fermalievitazione", "Gärverzögerung", "Cold retard", "Fermentación en frío", "Pousse contrôlée", "تخمیر سرد") };
  if (/lievit|gär|proof/.test(n)) return { key: "proof", temp: 28, color: "#b0916e", label: tri("Lievitazione", "Gärung", "Proofing", "Fermentación", "Pousse", "تخمیر") };
  if (/matur/.test(n)) return { key: "matur", temp: 4, color: "#6e9e85", label: tri("Maturazione", "Reifung", "Maturation", "Maduración", "Maturation", "رسیدن") };
  if (/vetrina|espositore|display/.test(n) && /caldo|warm|hot/.test(n)) return { key: "hot", temp: 60, color: "#b06e78", label: tri("Espositore caldo", "Warmvitrine", "Hot display", "Expositor caliente", "Vitrine chaude", "ویترین گرم") };
  if (/vetrina|espositore|display/.test(n)) return { key: "coldshow", temp: 4, color: "#7DA3C0", label: tri("Vetrina refrigerata", "Kühlvitrine", "Chilled display", "Vitrina refrigerada", "Vitrine réfrigérée", "ویترین سرد") };
  if (/essicc|dry|trocken/.test(n)) return { key: "dry", temp: 30, color: "#9aa6b2", label: tri("Essiccatoio", "Trockner", "Drying", "Secadero", "Séchoir", "خشک‌کن") };
  if (/frigo|kühl|fridge|ingredient/.test(n)) return { key: "fridge", temp: 4, color: "#7DA3C0", label: tri("Frigorifero", "Kühlraum", "Fridge", "Frigorífico", "Réfrigérateur", "یخچال") };
  return { key: "gen", temp: 4, color: "#9aa6b2", label: tri("Cella", "Kammer", "Cell", "Cámara", "Cellule", "سلول") };
}

// Mappa il tipo di cella al tipo di sensore fisico (lab_sensors: cella|freezer|frigo).
const SENSOR_OF = { freezer: "freezer", retard: "frigo", proof: "cella", matur: "frigo", coldshow: "frigo", fridge: "frigo", gen: "frigo", hot: null, dry: null };

// Semaforo LIVE: confronta la lettura reale del sensore con la temperatura obiettivo.
// Nessuna lettura reale = grigio "nessun sensore" (mai un verde finto).
function cellStatus(k, readings, tri) {
  const st = SENSOR_OF[k.key];
  if (!st) return null;
  const r = (readings || []).filter((x) => (x.type || "").toLowerCase() === st).sort((a, b) => (b.at || "").localeCompare(a.at || ""))[0];
  if (!r || r.value == null) return { color: "#475569", live: false, label: tri("Nessun sensore", "Kein Sensor", "No sensor", "Sin sensor", "Aucun capteur", "بدون سنسور") };
  const v = Number(r.value);
  let color = "#6e9e85", lab = tri("In norma", "In Ordnung", "In range", "En rango", "Dans la plage", "در محدوده");
  if (st === "freezer") {
    if (v > -8) { color = "#b06e78"; lab = tri("Troppo caldo", "Zu warm", "Too warm", "Muy cálido", "Trop chaud", "خیلی گرم"); }
    else if (v > -15) { color = "#b0916e"; lab = tri("Da controllare", "Prüfen", "Watch", "Vigilar", "À surveiller", "بررسی"); }
  } else {
    const d = Math.abs(v - k.temp);
    if (d > 5) { color = "#b06e78"; lab = tri("Fuori norma", "Außerhalb", "Out of range", "Fuera de rango", "Hors plage", "خارج از محدوده"); }
    else if (d > 2.5) { color = "#b0916e"; lab = tri("Da controllare", "Prüfen", "Watch", "Vigilar", "À surveiller", "بررسی"); }
  }
  return { color, live: true, label: lab, value: v };
}

// PILASTRO — Celle & Freezer UNIFICATI: un'unica vista per reparto (nessun doppione).
export default function ColdStorage() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [depts, setDepts] = useState([]);
  const [items, setItems] = useState([]);
  const [readings, setReadings] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const d = await deptApi.catalog(); setDepts(d.departments || []); } catch { /* */ }
    try { const f = await freezerApi.get(); setItems(f.items || []); } catch { /* */ }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const tick = () => sensorsApi.readings().then((d) => setReadings(Array.isArray(d) ? d : [])).catch(() => {});
    tick(); const iv = setInterval(tick, 15000); return () => clearInterval(iv);
  }, []);

  const deptOptions = depts.map((d) => ({ key: d.key, name: d.name }));
  const deptName = (k) => (depts.find((d) => d.key === k) || {}).name || tri("Generale", "Allgemein", "General", "General", "Général", "عمومی");

  const addItem = () => { setItems((p) => [...p, { name: "", qty: 0, min_qty: 0, dept: deptOptions[0]?.key || "" }]); setDirty(true); };
  const patch = (i, k, v) => { setItems((p) => p.map((it, idx) => (idx === i ? { ...it, [k]: v } : it))); setDirty(true); };
  const remove = (i) => { setItems((p) => p.filter((_, idx) => idx !== i)); setDirty(true); };

  const save = async () => {
    setBusy(true);
    try {
      const clean = items.filter((it) => (it.name || "").trim()).map((it) => ({ name: it.name.trim(), qty: Number(it.qty) || 0, min_qty: Number(it.min_qty) || 0, dept: it.dept || "" }));
      const r = await freezerApi.save(clean, lang);
      setDirty(false);
      if (r.low && r.low.length) toast.warning(tri(`${r.low.length} scorte sotto soglia.`, `${r.low.length} Bestände unter Schwelle.`, `${r.low.length} items below threshold.`, `${r.low.length} bajo el umbral.`, `${r.low.length} sous le seuil.`, `${r.low.length} زیر آستانه.`) + (r.emailed ? tri(" Email inviata.", " E-Mail gesendet.", " Email sent.", " Email enviado.", " Email envoyé.", " ایمیل ارسال شد.") : ""));
      else toast.success(tri("Giacenze salvate.", "Bestände gespeichert.", "Stock saved.", "Stock guardado.", "Stock enregistré.", "موجودی ذخیره شد."));
    } catch { toast.error(tri("Salvataggio non riuscito.", "Speichern fehlgeschlagen.", "Save failed.", "Error al guardar.", "Échec.", "خطا در ذخیره.")); }
    setBusy(false);
  };

  // Raggruppa freezer per reparto.
  const groups = {};
  items.forEach((it, idx) => { const k = it.dept || "_gen"; (groups[k] = groups[k] || []).push({ ...it, _idx: idx }); });

  const CelleTab = (
    <div data-testid="cold-cells" className="space-y-3">
      <p className="text-[11px] text-[#8a97a6]">{tri("Panoramica di tutte le celle per reparto: tipo e temperatura obiettivo, senza doppioni.", "Übersicht aller Kammern pro Bereich.", "Overview of every cell by department: type and target temperature.", "Vista de cámaras por área.", "Aperçu des cellules par atelier.", "نمای همه سلول‌ها بر اساس بخش.")}</p>
      <div data-testid="cold-legend" className="flex flex-wrap items-center gap-3 text-[10px] text-[#94A3B8]">
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#6e9e85" }} /> {tri("In norma", "In Ordnung", "In range", "En rango", "Dans la plage", "در محدوده")}</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#b0916e" }} /> {tri("Da controllare", "Prüfen", "Watch", "Vigilar", "À surveiller", "بررسی")}</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#b06e78" }} /> {tri("Fuori norma", "Außerhalb", "Out of range", "Fuera de rango", "Hors plage", "خارج از محدوده")}</span>
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#475569" }} /> {tri("Nessun sensore", "Kein Sensor", "No sensor", "Sin sensor", "Aucun capteur", "بدون سنسور")}</span>
      </div>
      {depts.map((d) => (
        <div key={d.key} data-testid={`cold-dept-${d.key}`} className="rounded-xl border border-[#64748B]/25 bg-[#0C1019]/60 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{d.icon}</span>
            <span className="text-[13px] font-black text-white">{d.name}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(d.cells || []).map((c, i) => {
              const k = cellKind(c, tri);
              const s = cellStatus(k, readings, tri);
              return (
                <div key={i} data-testid={`cold-cell-${d.key}-${i}`} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5" style={{ borderColor: `${k.color}55`, background: `${k.color}10` }}>
                  {s && <span data-testid={`cold-cell-status-${d.key}-${i}`} title={s.label} className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color, boxShadow: s.live ? `0 0 6px ${s.color}` : "none" }} />}
                  <Snowflake className="w-3.5 h-3.5" style={{ color: k.color }} />
                  <span className="text-[12px] font-semibold text-white">{c}</span>
                  <span className="text-[10px] font-bold" style={{ color: k.color }}>{k.label}</span>
                  <span className="inline-flex items-center gap-0.5 text-[11px] text-[#a4afbb]"><Thermometer className="w-3 h-3" /> {s && s.live ? `${s.value}°C` : `${k.temp}°C`}</span>
                </div>
              );
            })}
            {(!d.cells || d.cells.length === 0) && <span className="text-[11px] text-[#64748B]">{tri("Nessuna cella configurata.", "Keine Kammern.", "No cells configured.", "Sin cámaras.", "Aucune cellule.", "بدون سلول.")}</span>}
          </div>
        </div>
      ))}
    </div>
  );

  const FreezerTab = (
    <div data-testid="cold-freezer" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-[#8a97a6] flex-1">{tri("Giacenze freezer per reparto. Imposta la soglia minima: Sitor avvisa (anche via email) quando scende sotto.", "Gefrier-Bestände pro Bereich mit Mindestschwelle.", "Freezer stock per department. Set a minimum threshold: Sitor warns when it drops below.", "Stock de congelador por área con umbral mínimo.", "Stock congélateur par atelier avec seuil minimum.", "موجودی فریزر بر اساس بخش با حد آستانه.")}</p>
        <button data-testid="cold-freezer-add" onClick={addItem} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#7DA3C0]/15 border border-[#7DA3C0]/50 text-[#7DA3C0] font-bold text-xs active:scale-95 shrink-0">
          <Plus className="w-3.5 h-3.5" /> {tri("Aggiungi", "Hinzufügen", "Add", "Añadir", "Ajouter", "افزودن")}
        </button>
      </div>

      {items.length === 0 && <p className="text-[12px] text-[#64748B] py-2">{tri("Nessuna giacenza. Aggiungi il primo prodotto congelato.", "Keine Bestände.", "No stock yet. Add your first frozen product.", "Sin stock.", "Aucun stock.", "بدون موجودی.")}</p>}

      {Object.keys(groups).map((gk) => (
        <div key={gk} data-testid={`cold-freezer-group-${gk}`} className="rounded-xl border border-[#64748B]/25 bg-[#0C1019]/60 p-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Building2 className="w-3.5 h-3.5 text-[#8a97a6]" />
            <span className="text-[12px] font-black text-white">{gk === "_gen" ? tri("Generale", "Allgemein", "General", "General", "Général", "عمومی") : deptName(gk)}</span>
          </div>
          <div className="space-y-1.5">
            {groups[gk].map((it) => {
              const low = it.min_qty > 0 && Number(it.qty) < Number(it.min_qty);
              return (
                <div key={it._idx} data-testid={`cold-freezer-row-${it._idx}`} className={`flex flex-wrap items-center gap-1.5 rounded-lg border p-2 ${low ? "border-[#b06e78]/60 bg-[#b06e78]/10" : "border-[#1e293b] bg-[#030712]"}`}>
                  <input data-testid={`cold-freezer-name-${it._idx}`} value={it.name} onChange={(e) => patch(it._idx, "name", e.target.value)} placeholder={tri("Prodotto", "Produkt", "Product", "Producto", "Produit", "محصول")}
                    className="flex-1 min-w-[120px] bg-transparent border-b border-[#334155] px-1 py-1 text-[13px] text-white outline-none focus:border-[#7DA3C0]" />
                  <label className="flex items-center gap-1 text-[10px] text-[#64748B]">{tri("pz", "St", "pc", "u", "pc", "عدد")}
                    <input data-testid={`cold-freezer-qty-${it._idx}`} type="number" value={it.qty} onChange={(e) => patch(it._idx, "qty", e.target.value)}
                      className="w-16 bg-[#0C1019] border border-[#334155] rounded px-1.5 py-1 text-[13px] text-white outline-none focus:border-[#7DA3C0]" />
                  </label>
                  <label className="flex items-center gap-1 text-[10px] text-[#64748B]">{tri("min", "min", "min", "mín", "min", "حداقل")}
                    <input data-testid={`cold-freezer-min-${it._idx}`} type="number" value={it.min_qty} onChange={(e) => patch(it._idx, "min_qty", e.target.value)}
                      className="w-16 bg-[#0C1019] border border-[#334155] rounded px-1.5 py-1 text-[13px] text-white outline-none focus:border-[#7DA3C0]" />
                  </label>
                  <select data-testid={`cold-freezer-dept-${it._idx}`} value={it.dept || ""} onChange={(e) => patch(it._idx, "dept", e.target.value)}
                    className="bg-[#0C1019] border border-[#334155] rounded px-1.5 py-1 text-[11px] text-[#a4afbb] outline-none focus:border-[#7DA3C0]">
                    <option value="">{tri("Generale", "Allgemein", "General", "General", "Général", "عمومی")}</option>
                    {deptOptions.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}
                  </select>
                  {low && <AlertTriangle className="w-4 h-4 text-[#b06e78]" title={tri("Sotto soglia", "Unter Schwelle", "Below threshold", "Bajo umbral", "Sous seuil", "زیر آستانه")} />}
                  <button data-testid={`cold-freezer-del-${it._idx}`} onClick={() => remove(it._idx)} className="text-[#64748b] hover:text-[#b06e78] active:scale-90"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {dirty && (
        <button data-testid="cold-freezer-save" onClick={save} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#7DA3C0]/15 border border-[#7DA3C0]/50 text-[#7DA3C0] font-bold text-sm active:scale-95 disabled:opacity-50">
          <Save className="w-4 h-4" /> {busy ? tri("Salvo…", "Speichere…", "Saving…", "Guardando…", "Enregistre…", "ذخیره…") : tri("Salva giacenze", "Bestände speichern", "Save stock", "Guardar stock", "Enregistrer", "ذخیره موجودی")}
        </button>
      )}
    </div>
  );

  return (
    <div data-testid="cold-storage" className="space-y-3">
      <SubTabs testid="subtabs-cold" accent="#7DA3C0" tabs={[
        { id: "cells", label: <span className="inline-flex items-center gap-1"><Snowflake className="w-3.5 h-3.5" /> {tri("Celle", "Kammern", "Cells", "Cámaras", "Cellules", "سلول‌ها")}</span>, content: CelleTab },
        { id: "freezer", label: <span className="inline-flex items-center gap-1"><Snowflake className="w-3.5 h-3.5" /> {tri("Freezer", "Gefrier", "Freezer", "Congelador", "Congélateur", "فریزر")}</span>, content: FreezerTab },
        { id: "proof", label: <span className="inline-flex items-center gap-1"><Waves className="w-3.5 h-3.5" /> {tri("Lievitazione Adattiva", "Adaptive Gärung", "Adaptive Proofing", "Fermentación Adaptativa", "Pousse Adaptative", "تخمیر تطبیقی")}</span>, content: <AdaptiveProofing /> },
      ]} />
    </div>
  );
}
