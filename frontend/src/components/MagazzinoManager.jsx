import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Trash2, AlertTriangle, Minus, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { warehouseApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import ConsumiChart from "@/components/ConsumiChart";
import OrdineRiacquisto from "@/components/OrdineRiacquisto";
import { useDept, matchDept, deptLabel, deptIcon, DEPTS } from "@/lib/dept";
import { getDeptProfile } from "@/lib/deptProfiles";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const KINDS = [
  { v: "farina", labels: ["Farina", "Mehl", "Flour", "Harina", "Farine", "آرد"] },
  { v: "ingrediente", labels: ["Ingrediente", "Zutat", "Ingredient", "Ingrediente", "Ingrédient", "ماده"] },
];
const EMPTY = { name: "", kind: "farina", force_w: "", quantity_kg: "", unit: "kg", min_kg: "", department: "" };

export default function MagazzinoManager() {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const activeDept = useDept();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, st] = await Promise.all([
        warehouseApi.list(),
        warehouseApi.stats().catch(() => ({ items: [] })),
      ]);
      setItems(Array.isArray(data) ? data : []);
      const map = {};
      (st.items || []).forEach((s) => { map[s.id] = s; });
      setStats(map);
    } catch {
      toast.error(tri("Impossibile caricare il magazzino", "Lager konnte nicht geladen werden", "Could not load the warehouse", "No se pudo cargar el almacén", "Impossible de charger le magasin", "بارگیری انبار ممکن نشد"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Ricarica quando un'impastata confermata scarica le scorte (evento globale).
  useEffect(() => {
    const h = () => load();
    window.addEventListener("mikilab-warehouse-changed", h);
    return () => window.removeEventListener("mikilab-warehouse-changed", h);
  }, [load]);

  const low = items.filter((i) => Number(i.min_kg) > 0 && Number(i.quantity_kg) <= Number(i.min_kg));

  // Filtro per reparto (globale, scelto dal Capo). Le materie senza reparto sono condivise (sempre visibili).
  const visibleItems = items.filter((it) => matchDept(it, activeDept));

  // Allarme scorte sotto soglia: annuncio vocale + toast quando cambia l'elenco critico.
  useEffect(() => {
    if (loading || low.length === 0) return;
    const names = low.map((i) => i.name).join(", ");
    toast.warning(`${tri("Scorte sotto soglia", "Bestand unter Schwelle", "Stock below threshold", "Existencias bajo mínimo", "Stock sous le seuil", "موجودی زیر آستانه")}: ${names}`, { duration: 6000 });
    try { playTTS(`Attenzione. Scorte sotto la soglia minima per: ${names}.`); } catch { /* */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, low.map((i) => i.id).join("|")]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error(tri("Inserisci il nome della materia prima", "Namen der Zutat eingeben", "Enter the ingredient name", "Introduce el nombre de la materia prima", "Saisis le nom de la matière première", "نام ماده اولیه را وارد کن")); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        kind: form.kind,
        force_w: form.force_w.trim(),
        quantity_kg: Math.max(0, Number(form.quantity_kg) || 0),
        unit: form.unit || "kg",
        min_kg: Math.max(0, Number(form.min_kg) || 0),
        department: form.department || null,
      };
      await warehouseApi.save(payload);
      toast.success(`"${payload.name}" ${tri("registrato in magazzino", "im Lager erfasst", "saved to warehouse", "registrado en el almacén", "enregistré au magasin", "در انبار ثبت شد")}`);
      setForm(EMPTY);
      await load();
    } catch {
      toast.error(tri("Salvataggio non riuscito", "Speichern fehlgeschlagen", "Save failed", "Error al guardar", "Échec de l'enregistrement", "ذخیره ناموفق بود"));
    } finally {
      setSaving(false);
    }
  };

  const adjust = async (item, delta) => {
    const q = Math.max(0, Math.round((Number(item.quantity_kg) + delta) * 1000) / 1000);
    try {
      await warehouseApi.save({ ...item, quantity_kg: q });
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, quantity_kg: q } : x)));
    } catch {
      toast.error(tri("Aggiornamento non riuscito", "Aktualisierung fehlgeschlagen", "Update failed", "Error al actualizar", "Échec de la mise à jour", "به‌روزرسانی ناموفق بود"));
    }
  };

  const remove = async (item) => {
    try {
      await warehouseApi.remove(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      toast.info(`"${item.name}" ${tri("rimosso", "entfernt", "removed", "eliminado", "supprimé", "حذف شد")}`);
    } catch {
      toast.error(tri("Rimozione non riuscita", "Entfernen fehlgeschlagen", "Removal failed", "Error al eliminar", "Échec de la suppression", "حذف ناموفق بود"));
    }
  };

  return (
    <div data-testid="magazzino-manager" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[#14b8a6] flex items-center gap-2">
          <Package className="w-4 h-4" /> {tri("Magazzino & Ceste", "Lager & Körbe", "Warehouse & Baskets", "Almacén y Cestas", "Magasin & Paniers", "انبار و سبدها")}
        </h3>
        <button data-testid="magazzino-refresh" onClick={load} className="p-1.5 rounded-lg bg-[#1F2937] border border-[#374151] text-[#94A3B8] hover:text-white active:scale-95 transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {activeDept && activeDept !== "tutti" && (
        <div data-testid="magazzino-dept-banner" className="flex items-center gap-1.5 rounded-lg border border-[#14b8a6]/40 bg-[#14b8a6]/10 px-3 py-1.5 text-xs font-bold text-[#14b8a6]">
          <span>{deptIcon(activeDept)}</span> {tri("Reparto", "Bereich", "Department", "Departamento", "Rayon", "بخش")}: {deptLabel(activeDept, tri)} <span className="font-normal text-[#94A3B8]">· {visibleItems.length}/{items.length} {tri("materie", "Zutaten", "items", "materias", "matières", "مواد")}</span>
        </div>
      )}

      {/* Carico rapido: materie prime TIPICHE del reparto attivo (profilo operativo dedicato) */}
      {(() => {
        const prof = getDeptProfile(activeDept);
        if (!prof || !prof.warehouse.length) return null;
        return (
          <div data-testid="magazzino-dept-suggestions" className="flex flex-wrap gap-1.5">
            {prof.warehouse.map((n) => (
              <button key={n} data-testid={`magazzino-suggest-${n.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`}
                onClick={() => setForm((f) => ({ ...f, name: n, department: activeDept, kind: /farina|mehl|semola|w\d/i.test(n) ? "farina" : "ingrediente" }))}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0f172a] border border-[#14b8a6]/30 text-[11px] font-semibold text-[#94A3B8] hover:text-white hover:border-[#14b8a6] active:scale-95 transition-all">
                <Plus className="w-3 h-3 text-[#14b8a6]" /> {n}
              </button>
            ))}
          </div>
        );
      })()}

      {low.length > 0 && (
        <div data-testid="magazzino-low-alert" className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span><strong>{low.length}</strong> {tri("materia/e sotto la soglia minima", "Zutat(en) unter Mindestschwelle", "item(s) below minimum threshold", "materia(s) bajo el mínimo", "matière(s) sous le seuil minimum", "ماده(های) زیر آستانه حداقل")}: {low.map((i) => i.name).join(", ")}. {tri("Riordina al più presto.", "Baldigst nachbestellen.", "Reorder soon.", "Reabastece pronto.", "Recommande vite.", "به‌زودی سفارش بده.")}</span>
        </div>
      )}

      {low.length > 0 && <OrdineRiacquisto lowItems={low} />}

      {/* Form di carico rapido */}
      <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-7 gap-2 p-3 rounded-xl bg-[#030712] border border-[#1F2937]">
        <input data-testid="magazzino-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={tri("Nome (es. Farina 0)", "Name (z.B. Mehl 0)", "Name (e.g. Flour 0)", "Nombre (ej. Harina 0)", "Nom (ex. Farine 0)", "نام (مثلاً آرد ۰)")} className="col-span-2 sm:col-span-2 bg-[#111827] border border-[#374151] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-[#64748B] focus:border-[#14b8a6] outline-none" />
        <select data-testid="magazzino-kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="bg-[#111827] border border-[#374151] rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-[#14b8a6]">
          {KINDS.map((k) => <option key={k.v} value={k.v}>{tri(...k.labels)}</option>)}
        </select>
        <input data-testid="magazzino-qty" type="number" step="0.1" min="0" value={form.quantity_kg} onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })} placeholder={tri("Q.tà kg", "Menge kg", "Qty kg", "Cant. kg", "Qté kg", "مقدار kg")} className="bg-[#111827] border border-[#374151] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-[#64748B] focus:border-[#14b8a6] outline-none" />
        <input data-testid="magazzino-min" type="number" step="0.1" min="0" value={form.min_kg} onChange={(e) => setForm({ ...form, min_kg: e.target.value })} placeholder={tri("Soglia kg", "Schwelle kg", "Threshold kg", "Umbral kg", "Seuil kg", "آستانه kg")} className="bg-[#111827] border border-[#374151] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-[#64748B] focus:border-[#14b8a6] outline-none" />
        <select data-testid="magazzino-dept" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="bg-[#111827] border border-[#374151] rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-[#14b8a6]">
          <option value="">🌐 {tri("Tutti i reparti", "Alle Bereiche", "All departments", "Todos los departamentos", "Tous les rayons", "همه بخش‌ها")}</option>
          {DEPTS.map((d) => <option key={d} value={d}>{deptIcon(d)} {deptLabel(d, tri)}</option>)}
        </select>
        <button data-testid="magazzino-add" type="submit" disabled={saving} className="inline-flex items-center justify-center gap-1 bg-[#14b8a6] text-[#030712] text-xs font-bold rounded-lg px-2.5 py-2 disabled:opacity-50 active:scale-95 transition-all">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} {tri("Carica", "Laden", "Load", "Cargar", "Charger", "بارگذاری")}
        </button>
      </form>

      {/* Elenco scorte */}
      {loading ? (
        <div className="py-6 text-center text-[#64748B] text-xs flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> {tri("Caricamento…", "Wird geladen…", "Loading…", "Cargando…", "Chargement…", "در حال بارگیری…")}</div>
      ) : visibleItems.length === 0 ? (
        <p data-testid="magazzino-empty" className="py-6 text-center text-[#64748B] text-xs">{items.length === 0 ? tri("Nessuna materia prima registrata. Usa il form sopra per il primo carico.", "Keine Zutaten erfasst. Nutze das Formular oben für den ersten Eingang.", "No ingredients registered. Use the form above for the first load.", "No hay materias primas. Usa el formulario para la primera carga.", "Aucune matière première. Utilise le formulaire ci-dessus.", "هیچ ماده‌ای ثبت نشده. از فرم بالا استفاده کن.") : `${tri("Nessuna materia prima per il reparto", "Keine Zutaten für den Bereich", "No ingredients for department", "Sin materias para el departamento", "Aucune matière pour le rayon", "ماده‌ای برای بخش")} ${deptLabel(activeDept, tri)}. ${tri("Le materie condivise (senza reparto) restano sempre visibili.", "Gemeinsame Zutaten (ohne Bereich) bleiben immer sichtbar.", "Shared items (no department) stay always visible.", "Las materias compartidas siempre son visibles.", "Les matières partagées restent visibles.", "مواد مشترک همیشه نمایش داده می‌شوند.")}`}</p>
      ) : (
        <div className="space-y-2">
          {visibleItems.map((it) => {
            const isLow = Number(it.min_kg) > 0 && Number(it.quantity_kg) <= Number(it.min_kg);
            return (
              <div key={it.id} data-testid={`magazzino-item-${it.id}`} className={`flex items-center gap-2 p-3 rounded-xl border ${isLow ? "border-rose-500/50 bg-rose-500/5" : "border-[#1F2937] bg-[#111827]"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">{it.name}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#1F2937] text-[#94A3B8] border border-[#374151]">{it.kind}</span>
                    {it.department && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#14b8a6]/15 text-[#14b8a6] border border-[#14b8a6]/30">{deptIcon(it.department)} {deptLabel(it.department, tri)}</span>}
                    {isLow && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> {tri("Bassa", "Niedrig", "Low", "Baja", "Basse", "کم")}</span>}
                  </div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">
                    <strong className={isLow ? "text-rose-300" : "text-[#14b8a6]"}>{it.quantity_kg} {it.unit || "kg"}</strong>
                    {Number(it.min_kg) > 0 && <span className="text-[#64748B]"> · {tri("soglia", "Schwelle", "threshold", "umbral", "seuil", "آستانه")} {it.min_kg} {it.unit || "kg"}</span>}
                    {stats[it.id] && stats[it.id].days_left != null && (
                      <span className="text-[#64748B]"> · ~<strong className="text-[#38bdf8]">{stats[it.id].days_left}g</strong> {tri("autonomia", "Reichweite", "autonomy", "autonomía", "autonomie", "خودکفایی")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button data-testid={`magazzino-dec-${it.id}`} onClick={() => adjust(it, -1)} className="w-7 h-7 rounded-lg bg-[#1F2937] border border-[#374151] text-white flex items-center justify-center active:scale-90 transition-all"><Minus className="w-3.5 h-3.5" /></button>
                  <button data-testid={`magazzino-inc-${it.id}`} onClick={() => adjust(it, +1)} className="w-7 h-7 rounded-lg bg-[#1F2937] border border-[#374151] text-white flex items-center justify-center active:scale-90 transition-all"><Plus className="w-3.5 h-3.5" /></button>
                  <button data-testid={`magazzino-del-${it.id}`} onClick={() => remove(it)} className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-center active:scale-90 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConsumiChart />
      <p className="text-[10px] text-[#64748B]">{tri("I pulsanti +/- regolano la giacenza di 1 unità; imposta una soglia per attivare l'allarme vocale di scorta minima.", "Die +/- Tasten ändern den Bestand um 1 Einheit; lege eine Schwelle für den Sprachalarm fest.", "The +/- buttons adjust stock by 1 unit; set a threshold to enable the low-stock voice alert.", "Los botones +/- ajustan 1 unidad; fija un umbral para la alerta de voz.", "Les boutons +/- ajustent d'1 unité ; définis un seuil pour l'alerte vocale.", "دکمه‌های +/- موجودی را ۱ واحد تغییر می‌دهند؛ برای هشدار صوتی آستانه تعیین کن.")}</p>
    </div>
  );
}
