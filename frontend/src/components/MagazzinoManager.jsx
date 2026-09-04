import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Trash2, AlertTriangle, Minus, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { warehouseApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import ConsumiChart from "@/components/ConsumiChart";
import OrdineRiacquisto from "@/components/OrdineRiacquisto";

const KINDS = [
  { v: "farina", label: "Farina" },
  { v: "ingrediente", label: "Ingrediente" },
];
const EMPTY = { name: "", kind: "farina", force_w: "", quantity_kg: "", unit: "kg", min_kg: "" };

export default function MagazzinoManager() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

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
      toast.error("Impossibile caricare il magazzino");
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

  // Allarme scorte sotto soglia: annuncio vocale + toast quando cambia l'elenco critico.
  useEffect(() => {
    if (loading || low.length === 0) return;
    const names = low.map((i) => i.name).join(", ");
    toast.warning(`Scorte sotto soglia: ${names}`, { duration: 6000 });
    try { playTTS(`Attenzione. Scorte sotto la soglia minima per: ${names}.`); } catch { /* */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, low.map((i) => i.id).join("|")]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Inserisci il nome della materia prima"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        kind: form.kind,
        force_w: form.force_w.trim(),
        quantity_kg: Math.max(0, Number(form.quantity_kg) || 0),
        unit: form.unit || "kg",
        min_kg: Math.max(0, Number(form.min_kg) || 0),
      };
      await warehouseApi.save(payload);
      toast.success(`"${payload.name}" registrato in magazzino`);
      setForm(EMPTY);
      await load();
    } catch {
      toast.error("Salvataggio non riuscito");
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
      toast.error("Aggiornamento non riuscito");
    }
  };

  const remove = async (item) => {
    try {
      await warehouseApi.remove(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      toast.info(`"${item.name}" rimosso`);
    } catch {
      toast.error("Rimozione non riuscita");
    }
  };

  return (
    <div data-testid="magazzino-manager" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[#14b8a6] flex items-center gap-2">
          <Package className="w-4 h-4" /> Magazzino & Ceste
        </h3>
        <button data-testid="magazzino-refresh" onClick={load} className="p-1.5 rounded-lg bg-[#1F2937] border border-[#374151] text-[#94A3B8] hover:text-white active:scale-95 transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {low.length > 0 && (
        <div data-testid="magazzino-low-alert" className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span><strong>{low.length}</strong> materia/e sotto la soglia minima: {low.map((i) => i.name).join(", ")}. Riordina al più presto.</span>
        </div>
      )}

      {low.length > 0 && <OrdineRiacquisto lowItems={low} />}

      {/* Form di carico rapido */}
      <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 rounded-xl bg-[#030712] border border-[#1F2937]">
        <input data-testid="magazzino-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome (es. Farina 0)" className="col-span-2 sm:col-span-2 bg-[#111827] border border-[#374151] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-[#64748B] focus:border-[#14b8a6] outline-none" />
        <select data-testid="magazzino-kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="bg-[#111827] border border-[#374151] rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-[#14b8a6]">
          {KINDS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}
        </select>
        <input data-testid="magazzino-qty" type="number" step="0.1" min="0" value={form.quantity_kg} onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })} placeholder="Q.tà kg" className="bg-[#111827] border border-[#374151] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-[#64748B] focus:border-[#14b8a6] outline-none" />
        <input data-testid="magazzino-min" type="number" step="0.1" min="0" value={form.min_kg} onChange={(e) => setForm({ ...form, min_kg: e.target.value })} placeholder="Soglia kg" className="bg-[#111827] border border-[#374151] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-[#64748B] focus:border-[#14b8a6] outline-none" />
        <button data-testid="magazzino-add" type="submit" disabled={saving} className="inline-flex items-center justify-center gap-1 bg-[#14b8a6] text-[#030712] text-xs font-bold rounded-lg px-2.5 py-2 disabled:opacity-50 active:scale-95 transition-all">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Carica
        </button>
      </form>

      {/* Elenco scorte */}
      {loading ? (
        <div className="py-6 text-center text-[#64748B] text-xs flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Caricamento…</div>
      ) : items.length === 0 ? (
        <p data-testid="magazzino-empty" className="py-6 text-center text-[#64748B] text-xs">Nessuna materia prima registrata. Usa il form sopra per il primo carico.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const isLow = Number(it.min_kg) > 0 && Number(it.quantity_kg) <= Number(it.min_kg);
            return (
              <div key={it.id} data-testid={`magazzino-item-${it.id}`} className={`flex items-center gap-2 p-3 rounded-xl border ${isLow ? "border-rose-500/50 bg-rose-500/5" : "border-[#1F2937] bg-[#111827]"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">{it.name}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#1F2937] text-[#94A3B8] border border-[#374151]">{it.kind}</span>
                    {isLow && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> Bassa</span>}
                  </div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">
                    <strong className={isLow ? "text-rose-300" : "text-[#14b8a6]"}>{it.quantity_kg} {it.unit || "kg"}</strong>
                    {Number(it.min_kg) > 0 && <span className="text-[#64748B]"> · soglia {it.min_kg} {it.unit || "kg"}</span>}
                    {stats[it.id] && stats[it.id].days_left != null && (
                      <span className="text-[#64748B]"> · ~<strong className="text-[#38bdf8]">{stats[it.id].days_left}g</strong> autonomia</span>
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
      <p className="text-[10px] text-[#64748B]">I pulsanti +/- regolano la giacenza di 1 unità; imposta una soglia per attivare l'allarme vocale di scorta minima.</p>
    </div>
  );
}
