import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, Send, Plus, Wheat } from "lucide-react";
import { toast } from "sonner";
import { mikeApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// v14 · E-commerce / Ordini B2B → kg di impasto per lo Smart Planner.
// Non sostituisce le casse: sincronizza solo gli ordini digitali con la produzione.
export default function B2BOrders() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [data, setData] = useState({ orders: [], aggregate: [], total_dough_kg: 0 });
  const [forecast, setForecast] = useState(null);
  const [form, setForm] = useState({ client: "", product: "", pieces: "", grams_each: "500" });

  const load = useCallback(async () => {
    try { setData(await mikeApi.b2bList()); } catch { /* */ }
    try { setForecast(await mikeApi.b2bForecast()); } catch { /* */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.product || !Number(form.pieces)) { toast.error(tri("Inserisci prodotto e pezzi", "Produkt und Stück eingeben", "Enter product and pieces", "Ingresa producto y piezas", "Entre produit et pièces", "محصول و تعداد را وارد کن")); return; }
    try {
      await mikeApi.b2bAdd({ client: form.client, product: form.product, pieces: Number(form.pieces), grams_each: Number(form.grams_each) || 500 });
      setForm({ client: "", product: "", pieces: "", grams_each: form.grams_each });
      load();
    } catch { toast.error(tri("Salvataggio non riuscito", "Speichern fehlgeschlagen", "Save failed", "Guardado fallido", "Échec", "ذخیره ناموفق")); }
  };

  const del = async (id) => { setData((d) => ({ ...d, orders: d.orders.filter((o) => o.id !== id) })); try { await mikeApi.b2bDel(id); } catch { /* */ } load(); };

  const toPlan = async () => {
    try {
      const r = await mikeApi.b2bToPlan();
      try { window.dispatchEvent(new CustomEvent("mikilab-prefill-orders", { detail: { text: r.orders_text } })); } catch { /* */ }
      toast.success(tri(`Inviato al piano: ${r.total_dough_kg} kg d'impasto.`, `An Plan gesendet: ${r.total_dough_kg} kg Teig.`, `Sent to plan: ${r.total_dough_kg} kg dough.`, `Enviado al plan: ${r.total_dough_kg} kg masa.`, `Envoyé au plan : ${r.total_dough_kg} kg pâte.`, `به برنامه ارسال شد: ${r.total_dough_kg} کیلوگرم خمیر.`));
    } catch { toast.error(tri("Invio non riuscito", "Senden fehlgeschlagen", "Send failed", "Envío fallido", "Échec", "ارسال ناموفق")); }
  };

  const inp = "bg-[#0C1019] border border-[#5E8CA8]/30 rounded-lg px-2.5 py-2 text-sm text-white outline-none placeholder:text-[#4b6070]";

  return (
    <div data-testid="b2b-orders" className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input data-testid="b2b-client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder={tri("Cliente (bar/ristorante)", "Kunde", "Client", "Cliente", "Client", "مشتری")} className={inp} />
        <input data-testid="b2b-product" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder={tri("Prodotto", "Produkt", "Product", "Producto", "Produit", "محصول")} className={inp} />
        <input data-testid="b2b-pieces" type="number" value={form.pieces} onChange={(e) => setForm({ ...form, pieces: e.target.value })} placeholder={tri("Pezzi", "Stück", "Pieces", "Piezas", "Pièces", "تعداد")} className={inp} />
        <label className="flex items-center gap-1 bg-[#0C1019] border border-[#5E8CA8]/30 rounded-lg px-2.5 py-2">
          <input data-testid="b2b-grams" type="number" value={form.grams_each} onChange={(e) => setForm({ ...form, grams_each: e.target.value })} className="w-full bg-transparent text-sm text-white outline-none" />
          <span className="text-[10px] text-[#64748b]">g/pz</span>
        </label>
      </div>
      <button data-testid="b2b-add" onClick={add} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/50 text-[#00F0FF] font-bold text-sm active:scale-95"><Plus className="w-4 h-4" /> {tri("Aggiungi ordine", "Auftrag hinzufügen", "Add order", "Añadir pedido", "Ajouter", "افزودن سفارش")}</button>

      {data.orders.length > 0 && (
        <div className="space-y-1.5">
          <AnimatePresence>
            {data.orders.map((o) => (
              <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid={`b2b-order-${o.id}`} className="flex items-center gap-2 rounded-lg border border-[#1e293b] bg-[#030712] px-2.5 py-2">
                <ShoppingCart className="w-3.5 h-3.5 text-[#5E8CA8] shrink-0" />
                <span className="text-[13px] text-white flex-1 min-w-0 truncate">{o.pieces}× {o.product} <span className="text-[#64748b]">· {o.client}</span></span>
                <span className="text-[11px] font-bold text-[#00F0FF]">{o.dough_kg} kg</span>
                <button data-testid={`b2b-del-${o.id}`} onClick={() => del(o.id)} className="text-[#f43f5e]/70 hover:text-[#f43f5e]"><Trash2 className="w-3.5 h-3.5" /></button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {data.aggregate.length > 0 && (
        <div data-testid="b2b-aggregate" className="rounded-xl border border-[#5E8CA8]/30 bg-[#5E8CA8]/5 p-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#5E8CA8] flex items-center gap-1.5 mb-2"><Wheat className="w-3.5 h-3.5" /> {tri("Fabbisogno impasto", "Teigbedarf", "Dough needed", "Masa necesaria", "Pâte nécessaire", "خمیر لازم")}</p>
          {data.aggregate.map((a) => (
            <div key={a.product} className="flex justify-between text-[13px] text-white py-0.5">
              <span className="truncate">{a.product} <span className="text-[#64748b]">({a.pieces} pz)</span></span>
              <span className="font-bold text-[#00F0FF]">{a.dough_kg} kg</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-black text-white pt-2 mt-1 border-t border-[#5E8CA8]/20">
            <span>{tri("Totale", "Gesamt", "Total", "Total", "Total", "مجموع")}</span>
            <span data-testid="b2b-total" className="text-[#00F0FF]">{data.total_dough_kg} kg</span>
          </div>
          <button data-testid="b2b-to-plan" onClick={toPlan} className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm text-[#070A10] active:scale-95" style={{ background: "linear-gradient(90deg,#7DD3FC,#00F0FF)" }}><Send className="w-4 h-4" /> {tri("Invia allo Smart Planner", "An Smart Planner", "Send to Smart Planner", "Enviar al Planner", "Envoyer au Planner", "ارسال به برنامه‌ریز")}</button>
        </div>
      )}

      {forecast && forecast.factor && (
        <div data-testid="b2b-forecast" className="rounded-xl border border-[#FFB800]/40 bg-[#FFB800]/5 p-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#FFB800] mb-1">{tri("Previsione contestuale (meteo + festività)", "Kontext-Prognose (Wetter + Feiertag)", "Contextual forecast (weather + holidays)", "Previsión contextual", "Prévision contextuelle", "پیش‌بینی زمینه‌ای")}</p>
          <div className="flex items-center justify-between text-[13px] text-white">
            <span>{tri("Consigliato", "Empfohlen", "Suggested", "Sugerido", "Suggéré", "پیشنهادی")}: <b className="text-[#FFB800]">{forecast.suggested_dough_kg} kg</b></span>
            <span className="text-[11px] text-[#8aa0b4]">{forecast.delta_kg >= 0 ? "+" : ""}{forecast.delta_kg} kg · ×{forecast.factor}</span>
          </div>
          {(forecast.weather_note || forecast.holiday_note) && <p className="mt-1 text-[11px] text-[#c9dbe8]">{[forecast.weather_note, forecast.holiday_note].filter(Boolean).join(" · ")}</p>}
        </div>
      )}
    </div>
  );
}
