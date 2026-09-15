import { useEffect, useState } from "react";
import { Truck, Plus, Trash2, MapPin, Clock3, AlertTriangle, Wand2, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { deliveriesApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";

const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; };

export default function ConsegneFurgoni() {
  const [list, setList] = useState([]);
  const [plan, setPlan] = useState(null);
  const [organizing, setOrganizing] = useState(false);
  const [form, setForm] = useState({ client: "", address: "", deadline: "", van: "Furgone 1", product: "", qty: "", items: [] });

  const load = async () => { try { const d = await deliveriesApi.list(); setList(d.deliveries || []); } catch { /* */ } };
  useEffect(() => { load(); }, []);

  const addItem = () => {
    if (!form.product.trim()) return;
    setForm((f) => ({ ...f, items: [...f.items, { product: f.product.trim(), qty: num(f.qty) }], product: "", qty: "" }));
  };
  const save = async () => {
    const items = form.product.trim() ? [...form.items, { product: form.product.trim(), qty: num(form.qty) }] : form.items;
    if (!form.client.trim() || items.length === 0) { toast.error("Cliente e almeno un prodotto"); return; }
    try {
      await deliveriesApi.create({ client: form.client, address: form.address, deadline: form.deadline, van: form.van || "Furgone 1", items });
      setForm({ client: "", address: "", deadline: "", van: "Furgone 1", product: "", qty: "", items: [] });
      await load(); setPlan(null);
      toast.success("Consegna aggiunta");
    } catch { toast.error("Salvataggio non riuscito"); }
  };
  const del = async (id) => { try { await deliveriesApi.remove(id); await load(); setPlan(null); } catch { /* */ } };
  const organize = async () => {
    setOrganizing(true);
    try {
      const d = await deliveriesApi.organize();
      setPlan(d);
      // Sitor legge a voce gli avvisi: il Capo sente gli ordini in ritardo prima di caricare.
      const w = d.warnings || [];
      if (w.length) playTTS("Attenzione. " + w.slice(0, 4).join(". "));
    } catch { toast.error("Organizzazione non riuscita"); }
    finally { setOrganizing(false); }
  };

  const fld = "bg-[#060A10] border border-[#8a97a6]/30 rounded-md px-2 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#3E9C93]";

  return (
    <div data-testid="consegne-furgoni" className="space-y-5">
      {/* Nuova consegna */}
      <div className="rounded-xl border border-[#8a97a6]/20 bg-[#0b0f19]/60 p-3 space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input data-testid="consegna-client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Cliente" className={fld} />
          <input data-testid="consegna-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Indirizzo" className={fld} />
          <input data-testid="consegna-deadline" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="Entro (HH:MM)" className={fld} />
          <input data-testid="consegna-van" value={form.van} onChange={(e) => setForm({ ...form, van: e.target.value })} placeholder="Furgone" className={fld} />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input data-testid="consegna-product" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder="Prodotto" className={`${fld} flex-1 min-w-[120px]`} />
          <input data-testid="consegna-qty" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="Qtà" className={`${fld} w-20 text-center`} />
          <button data-testid="consegna-add-item" onClick={addItem} className="p-2 rounded-lg bg-[#8a97a6]/15 text-[#a4afbb] hover:bg-[#8a97a6]/25"><Plus className="w-4 h-4" /></button>
        </div>
        {form.items.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.items.map((it, i) => (<span key={i} className="text-[11px] bg-[#3E9C93]/15 text-[#7fd3c9] rounded-full px-2 py-0.5">{it.qty} {it.product}</span>))}
          </div>
        )}
        <button data-testid="consegna-save" onClick={save} className="inline-flex items-center gap-2 bg-[#3E9C93] hover:bg-[#347f78] text-white font-bold px-4 py-2 rounded-xl text-sm active:scale-98 transition-all"><Plus className="w-4 h-4" /> Aggiungi consegna</button>
      </div>

      {/* Elenco consegne */}
      {list.length > 0 && (
        <div className="space-y-1.5">
          {list.map((d) => (
            <div key={d.id} data-testid={`consegna-row-${d.id}`} className="flex items-center gap-2 rounded-lg bg-[#0b0f19]/60 px-3 py-2">
              <Truck className="w-4 h-4 text-[#a4afbb] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white truncate">{d.client} <span className="text-[11px] text-[#64748B]">{d.van}</span></p>
                <p className="text-[11px] text-[#94A3B8] truncate">{d.deadline && `entro ${d.deadline} · `}{(d.items || []).map((i) => `${i.qty} ${i.product}`).join(", ")}</p>
              </div>
              <button data-testid={`consegna-del-${d.id}`} onClick={() => del(d.id)} className="p-1.5 text-[#b06e78] hover:bg-[#b06e78]/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      <button data-testid="consegne-organize" onClick={organize} disabled={organizing || list.length === 0} className="w-full inline-flex items-center justify-center gap-2 bg-[#3E9C93] hover:bg-[#347f78] disabled:opacity-50 text-white font-bold px-4 py-3 rounded-2xl active:scale-98 transition-all">
        {organizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />} Organizza il giro con Sitor
      </button>

      {/* Risultato: carico per furgone + tappe + avvisi */}
      {plan && (
        <div data-testid="consegne-plan" className="space-y-3">
          {(plan.warnings || []).length > 0 && (
            <div data-testid="consegne-warnings" className="rounded-xl border border-[#b06e78]/40 bg-[#b06e78]/10 p-3 space-y-1">
              {plan.warnings.map((w, i) => (<p key={i} className="text-[12px] text-[#e0a0a8] flex gap-2"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{w}</p>))}
            </div>
          )}
          {(plan.vans || []).map((v, i) => (
            <div key={i} data-testid={`consegne-van-${i}`} className="rounded-2xl border border-[#3E9C93]/30 bg-[#0b0f19]/70 p-4 space-y-2">
              <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-[#3E9C93]" /><span className="text-sm font-black text-white">{v.van}</span></div>
              <div className="flex items-start gap-2 text-[12px] text-[#cbd5e1]"><Package className="w-3.5 h-3.5 text-[#a4afbb] shrink-0 mt-0.5" /><span><b>Carico:</b> {v.load.map((x) => `${x.qty} ${x.product}`).join(" · ")}</span></div>
              <ol className="space-y-1">
                {v.stops.map((s, k) => (
                  <li key={k} className="flex items-center gap-2 text-[12px] text-[#94A3B8]">
                    <span className="w-5 h-5 rounded-full bg-[#3E9C93] text-white text-[10px] font-black flex items-center justify-center shrink-0">{k + 1}</span>
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1"><b className="text-[#cbd5e1]">{s.client}</b> {s.address}</span>
                    {s.deadline && <span className="inline-flex items-center gap-1 text-[#7fd3c9]"><Clock3 className="w-3 h-3" />{s.deadline}</span>}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
