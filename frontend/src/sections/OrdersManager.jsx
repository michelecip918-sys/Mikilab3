import { useState, useEffect, useCallback } from "react";
import { Truck, Plus, Trash2, Mail, MessageCircle, Printer, X, Check, Loader2, PackageCheck, Send } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { ordersApi } from "@/lib/api";
import { SUPPLIERS } from "@/data/suppliers";
import WhatsAppHelp from "@/components/WhatsAppHelp";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

const UNITS = ["kg", "g", "L", "pz", "sacchi", "cartoni"];
const uid = () => Math.random().toString(36).slice(2, 9);

export default function OrdersManager({ store, stores }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const storeName = (id) => (stores.find((s) => s.id === id) || {}).name || tri("Senza negozio", "Ohne Filiale", "No store");

  const STATUS = {
    bozza: { label: tri("Bozza", "Entwurf", "Draft"), color: "#7E8A93" },
    inviato: { label: tri("Inviato", "Gesendet", "Sent"), color: "#c94f00" },
    ricevuto: { label: tri("Ricevuto", "Erhalten", "Received"), color: "#c94f00" },
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const blank = { supplier: "", supplier_email: "", note: "", items: [{ id: uid(), name: "", qty: "", unit: "kg", price: "" }] };
  const [form, setForm] = useState(blank);

  const load = useCallback(async () => { setLoading(true); setOrders(await ordersApi.list(store)); setLoading(false); }, [store]);
  useEffect(() => { load(); }, [load]);

  const pickSupplier = (name) => {
    const s = SUPPLIERS.find((x) => x.name === name);
    setForm((f) => ({ ...f, supplier: name, supplier_email: s?.email || f.supplier_email }));
  };
  const setItem = (id, k, v) => setForm((f) => ({ ...f, items: f.items.map((it) => (it.id === id ? { ...it, [k]: v } : it)) }));
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { id: uid(), name: "", qty: "", unit: "kg", price: "" }] }));
  const rmItem = (id) => setForm((f) => ({ ...f, items: f.items.filter((it) => it.id !== id) }));

  const create = async () => {
    if (!form.supplier.trim()) { toast.error(tri("Indica il fornitore", "Lieferant angeben", "Enter supplier")); return; }
    const items = form.items.filter((it) => it.name.trim()).map((it) => ({ name: it.name.trim(), qty: Number(it.qty) || 0, unit: it.unit, price: it.price === "" ? null : Number(it.price) }));
    if (items.length === 0) { toast.error(tri("Aggiungi almeno un articolo", "Mindestens einen Artikel", "Add at least one item")); return; }
    setBusy(true);
    try {
      await ordersApi.create({ store_id: store || null, supplier: form.supplier.trim(), supplier_email: form.supplier_email.trim(), items, note: form.note.trim(), status: "bozza" });
      toast.success(tri("Ordine creato", "Bestellung erstellt", "Order created"));
      setForm(blank); setShowForm(false); await load();
    } catch { toast.error(tri("Creazione non riuscita", "Erstellung fehlgeschlagen", "Create failed")); }
    finally { setBusy(false); }
  };

  const remove = async (id) => { try { await ordersApi.remove(id); await load(); } catch { toast.error(tri("Eliminazione non riuscita", "Löschen fehlgeschlagen", "Delete failed")); } };
  const setStatus = async (o, status) => {
    try { const u = await ordersApi.update(o.id, { store_id: o.store_id, supplier: o.supplier, supplier_email: o.supplier_email, items: o.items, note: o.note, status }); setOrders((prev) => prev.map((x) => (x.id === o.id ? u : x))); }
    catch { toast.error(tri("Aggiornamento non riuscito", "Update fehlgeschlagen", "Update failed")); }
  };

  const orderText = (o) => {
    const date = new Date(o.created_at || Date.now()).toLocaleDateString(lang === "en" ? "en-GB" : lang === "de" ? "de-DE" : "it-IT");
    const lines = [
      tri(`ORDINE FORNITORE — ${o.supplier}`, `LIEFERANTENBESTELLUNG — ${o.supplier}`, `SUPPLIER ORDER — ${o.supplier}`),
      `${tri("Negozio", "Filiale", "Store")}: ${storeName(o.store_id)}`,
      `${tri("Data", "Datum", "Date")}: ${date}`,
      "",
      `${tri("Articoli", "Artikel", "Items")}:`,
      ...o.items.map((it) => `• ${it.qty || ""} ${it.unit} ${it.name}${it.price ? ` — € ${it.price}` : ""}`),
    ];
    if (o.total) lines.push("", `${tri("Totale stimato", "Geschätzte Summe", "Estimated total")}: € ${o.total}`);
    if (o.note) lines.push("", `${tri("Note", "Notizen", "Notes")}: ${o.note}`);
    lines.push("", "— MikiLab");
    return lines.join("\n");
  };

  const sendEmail = (o) => {
    const subj = tri(`Ordine ${o.supplier}`, `Bestellung ${o.supplier}`, `Order ${o.supplier}`);
    window.location.href = `mailto:${o.supplier_email || ""}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(orderText(o))}`;
    if (o.status === "bozza") setStatus(o, "inviato");
  };
  const sendWhatsApp = (o) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(orderText(o))}`, "_blank");
    if (o.status === "bozza") setStatus(o, "inviato");
  };
  const printOrder = (o) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<pre style="font-family:system-ui;font-size:14px;white-space:pre-wrap;padding:24px">${orderText(o).replace(/</g, "&lt;")}</pre>`);
    w.document.close(); w.focus(); w.print();
    if (o.status === "bozza") setStatus(o, "inviato");
  };

  const inp = "w-full bg-[#121212] dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#c94f00]";

  return (
    <div className="pb-40" data-testid="orders-manager">
      <p className="text-xs text-[#7E8A93] mb-3">{tri("Ordini del negozio", "Bestellungen der Filiale", "Orders for store")}: <b className="text-[#c94f00]">{store ? storeName(store) : tri("tutti", "alle", "all")}</b></p>

      <button data-testid="order-add" onClick={() => setShowForm((s) => !s)}
        className="w-full flex items-center justify-center gap-2 bg-[#c94f00] hover:bg-[#d4a373] text-white font-semibold py-3 rounded-2xl active:scale-98 transition-all mb-4">
        <Plus className="w-5 h-5" /> {tri("Nuovo ordine", "Neue Bestellung", "New order")}
      </button>

      <WhatsAppHelp context="ordini" className="mb-4" />

      {showForm && (
        <div data-testid="order-form" className="bg-[#c94f00]/10 border border-[#c94f00]/30 rounded-2xl p-4 mb-5 space-y-3">
          <div>
            <input data-testid="order-supplier" list="supplier-list" value={form.supplier} onChange={(e) => pickSupplier(e.target.value)} placeholder={tri("Fornitore (scegli o scrivi)", "Lieferant (wählen oder tippen)", "Supplier (pick or type)")} className={inp} />
            <datalist id="supplier-list">{SUPPLIERS.map((s) => <option key={s.id} value={s.name} />)}</datalist>
          </div>
          <input data-testid="order-email" value={form.supplier_email} onChange={(e) => setForm({ ...form, supplier_email: e.target.value })} placeholder={tri("Email fornitore (per invio)", "Lieferanten-E-Mail (für Versand)", "Supplier email (for sending)")} className={inp} />

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-[#c94f00]">{tri("Articoli", "Artikel", "Items")}</p>
            {form.items.map((it) => (
              <div key={it.id} className="grid grid-cols-[1fr_60px_64px_60px_auto] gap-1.5 items-center" data-testid={`order-item-${it.id}`}>
                <input data-testid={`order-item-name-${it.id}`} value={it.name} onChange={(e) => setItem(it.id, "name", e.target.value)} placeholder={tri("Prodotto", "Produkt", "Product")} className={inp + " px-2 py-2"} />
                <input data-testid={`order-item-qty-${it.id}`} type="number" value={it.qty} onChange={(e) => setItem(it.id, "qty", e.target.value)} placeholder={tri("Q.tà", "Menge", "Qty")} className={inp + " px-2 py-2 text-center font-mono-data"} />
                <select data-testid={`order-item-unit-${it.id}`} value={it.unit} onChange={(e) => setItem(it.id, "unit", e.target.value)} className={inp + " px-1 py-2"}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                <input data-testid={`order-item-price-${it.id}`} type="number" value={it.price} onChange={(e) => setItem(it.id, "price", e.target.value)} placeholder="€" className={inp + " px-2 py-2 text-center font-mono-data"} />
                <button data-testid={`order-item-remove-${it.id}`} onClick={() => rmItem(it.id)} className="text-[#7E8A93] hover:text-[#E4572E] p-1"><X className="w-4 h-4" /></button>
              </div>
            ))}
            <button data-testid="order-item-add" onClick={addItem} className="text-sm font-semibold text-[#c94f00] flex items-center gap-1"><Plus className="w-4 h-4" /> {tri("Aggiungi riga", "Zeile hinzufügen", "Add row")}</button>
          </div>

          <textarea data-testid="order-note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} placeholder={tri("Note per il fornitore…", "Notizen für den Lieferanten…", "Notes for the supplier…")} className={inp} />
          <button data-testid="order-create" onClick={create} disabled={busy} className="w-full flex items-center justify-center gap-2 bg-[#c94f00] hover:bg-[#d4a373] text-white font-semibold py-3 rounded-2xl shadow-md border border-amber-900/40 active:scale-98 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {tri("Crea ordine", "Bestellung erstellen", "Create order")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#c94f00]" /></div>
      ) : (
        <div className="space-y-3" data-testid="orders-list">
          {orders.length === 0 && <p className="text-center text-sm text-[#7E8A93] py-8">{tri("Nessun ordine. Creane uno da inviare al fornitore.", "Keine Bestellung. Erstelle eine für den Lieferanten.", "No orders. Create one to send to the supplier.")}</p>}
          {orders.map((o) => {
            const st = STATUS[o.status] || STATUS.bozza;
            return (
              <div key={o.id} data-testid={`order-card-${o.id}`} className="bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="w-10 h-10 rounded-2xl shadow-md border border-amber-900/40 bg-[#c94f00]/15 flex items-center justify-center shrink-0"><Truck className="w-5 h-5 text-[#c94f00]" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8] leading-tight">{o.supplier}</p>
                    <p className="text-[11px] text-[#7E8A93]">{storeName(o.store_id)} · {new Date(o.created_at).toLocaleDateString(lang === "en" ? "en-GB" : lang === "de" ? "de-DE" : "it-IT")}</p>
                  </div>
                  <span data-testid={`order-status-${o.id}`} className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white shrink-0" style={{ background: st.color }}>{st.label}</span>
                </div>

                <ul className="mt-2 text-sm text-[#3F4A54] dark:text-[#AEB8BF] space-y-0.5">
                  {o.items.map((it, i) => <li key={i}>• {it.qty || ""} {it.unit} {it.name}{it.price ? <span className="text-[#7E8A93]"> — € {it.price}</span> : null}</li>)}
                </ul>
                {o.total > 0 && <p className="text-sm font-bold text-[#c94f00] mt-1">{tri("Totale", "Summe", "Total")}: € {o.total}</p>}
                {o.note && <p className="text-xs text-[#7E8A93] mt-1 italic">{o.note}</p>}

                {/* Invio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                  <button data-testid={`order-send-email-${o.id}`} onClick={() => sendEmail(o)} className="flex items-center justify-center gap-1 bg-[#c94f00] text-white text-xs font-semibold py-2.5 rounded-2xl shadow-md border border-amber-900/40 active:scale-95"><Mail className="w-4 h-4" /> Email</button>
                  <button data-testid={`order-send-wa-${o.id}`} onClick={() => sendWhatsApp(o)} className="flex items-center justify-center gap-1 bg-[#25D366] text-white text-xs font-semibold py-2.5 rounded-2xl shadow-md border border-amber-900/40 active:scale-95"><MessageCircle className="w-4 h-4" /> WhatsApp</button>
                  <button data-testid={`order-print-${o.id}`} onClick={() => printOrder(o)} className="flex items-center justify-center gap-1 bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] text-[#2B303B] dark:text-[#e4eff8] text-xs font-semibold py-2.5 rounded-2xl shadow-md border border-amber-900/40 active:scale-95"><Printer className="w-4 h-4 text-[#c94f00]" /> {tri("Stampa", "Druck", "Print")}</button>
                </div>

                {/* Stato + elimina */}
                <div className="flex items-center gap-2 mt-2">
                  {o.status !== "inviato" && <button data-testid={`order-mark-sent-${o.id}`} onClick={() => setStatus(o, "inviato")} className="flex items-center gap-1 text-xs font-semibold text-[#c94f00]"><Send className="w-3.5 h-3.5" /> {tri("Segna inviato", "Als gesendet", "Mark sent")}</button>}
                  {o.status !== "ricevuto" && <button data-testid={`order-mark-received-${o.id}`} onClick={() => setStatus(o, "ricevuto")} className="flex items-center gap-1 text-xs font-semibold text-[#c94f00]"><PackageCheck className="w-3.5 h-3.5" /> {tri("Segna ricevuto", "Als erhalten", "Mark received")}</button>}
                  <button data-testid={`order-remove-${o.id}`} onClick={() => remove(o.id)} className="ml-auto text-xs text-[#7E8A93] hover:text-[#E4572E] flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> {tri("Elimina", "Löschen", "Delete")}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
