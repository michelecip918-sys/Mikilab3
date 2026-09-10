import { useState, useEffect, useCallback } from "react";
import { Cake, Plus, Trash2, Check, CalendarClock, Loader2 } from "lucide-react";
import { pastryApi } from "@/lib/api";
import SmartAttach from "@/components/console/SmartAttach";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Sezione dedicata Pasticceria: consegne su commessa (torte, matrimoni, eventi) con date e promemoria.
export default function PasticceriaConsegne() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ client: "", item: "", event_type: "torta", date: "", time: "", people: "", notes: "" });

  const load = useCallback(() => { pastryApi.list().then((d) => setList(d.deliveries || [])).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const TYPES = [
    { id: "torta", label: tri("Torta", "Torte", "Cake", "Tarta", "Gâteau", "کیک") },
    { id: "matrimonio", label: tri("Matrimonio", "Hochzeit", "Wedding", "Boda", "Mariage", "عروسی") },
    { id: "evento", label: tri("Evento", "Event", "Event", "Evento", "Événement", "رویداد") },
    { id: "altro", label: tri("Altro", "Andere", "Other", "Otro", "Autre", "دیگر") },
  ];

  const submit = async () => {
    if (!form.client.trim() || !form.date) return;
    setBusy(true);
    try { await pastryApi.create(form); setForm({ client: "", item: "", event_type: "torta", date: "", time: "", people: "", notes: "" }); load(); }
    catch { /* */ } finally { setBusy(false); }
  };
  const toggle = (id) => pastryApi.toggle(id).then(load).catch(() => {});
  const remove = (id) => pastryApi.remove(id).then(load).catch(() => {});

  const daysTo = (dISO) => { try { const t = Math.ceil((new Date(dISO) - new Date()) / 86400000); return t; } catch { return null; } };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div data-testid="pastry-deliveries" className="space-y-3">
      <p className="text-[11px] text-[#94A3B8]">{tri(
        "Consegne su commessa: torte, matrimoni ed eventi con data e promemoria. Sitor le tiene d'occhio e avvisa quando si avvicinano.",
        "Auftragslieferungen: Torten, Hochzeiten, Events mit Datum.", "Made-to-order deliveries: cakes, weddings, events with dates and reminders.",
        "Entregas por encargo: tartas, bodas y eventos.", "Livraisons sur commande : gâteaux, mariages, événements.", "تحویل سفارشی: کیک، عروسی، رویداد.")}</p>

      {/* Nuova consegna */}
      <div className="rounded-xl bg-[#0C1019] border border-[#7FD8C0]/30 p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input data-testid="pastry-client" value={form.client} onChange={set("client")} placeholder={tri("Cliente", "Kunde", "Client", "Cliente", "Client", "مشتری")} className="rounded-lg bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#7FD8C0] outline-none" />
          <input data-testid="pastry-item" value={form.item} onChange={set("item")} placeholder={tri("Prodotto (es. torta 3 piani)", "Produkt", "Item (e.g. 3-tier cake)", "Producto", "Produit", "محصول")} className="rounded-lg bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#7FD8C0] outline-none" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button key={t.id} data-testid={`pastry-type-${t.id}`} onClick={() => setForm((f) => ({ ...f, event_type: t.id }))}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border active:scale-95 ${form.event_type === t.id ? "bg-[#7FD8C0]/20 border-[#7FD8C0]/60 text-[#7FD8C0]" : "bg-[#030712] border-[#1e293b] text-[#94A3B8]"}`}>{t.label}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input data-testid="pastry-date" type="date" value={form.date} onChange={set("date")} className="rounded-lg bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#7FD8C0] outline-none" />
          <input data-testid="pastry-time" type="time" value={form.time} onChange={set("time")} className="rounded-lg bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#7FD8C0] outline-none" />
          <input data-testid="pastry-people" value={form.people} onChange={set("people")} inputMode="numeric" placeholder={tri("Persone", "Personen", "People", "Personas", "Personnes", "نفر")} className="rounded-lg bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#7FD8C0] outline-none" />
        </div>
        <input data-testid="pastry-notes" value={form.notes} onChange={set("notes")} placeholder={tri("Note (gusto, allergie, indirizzo…)", "Notiz", "Notes (flavor, allergies, address…)", "Notas", "Notes", "یادداشت")} className="w-full rounded-lg bg-[#030712] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#7FD8C0] outline-none" />
        <SmartAttach context={tri("ordine torta/evento (cliente, prodotto, data)", "Torten-/Event-Bestellung", "cake/event order (client, item, date)", "pedido de tarta/evento", "commande gâteau/événement", "سفارش کیک/رویداد")} compact
          onExtract={(t) => setForm((f) => ({ ...f, notes: (f.notes ? f.notes + "\n" : "") + t }))} />
        <button data-testid="pastry-add" onClick={submit} disabled={busy || !form.client.trim() || !form.date} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#7FD8C0]/15 border border-[#7FD8C0]/50 text-[#7FD8C0] font-bold text-sm active:scale-95 disabled:opacity-40">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {tri("Aggiungi consegna", "Lieferung hinzufügen", "Add delivery", "Añadir entrega", "Ajouter livraison", "افزودن تحویل")}
        </button>
      </div>

      {/* Lista consegne */}
      <div className="space-y-2">
        {list.length === 0 ? (
          <p className="text-[12px] text-[#64748B] text-center py-3">{tri("Nessuna consegna programmata.", "Keine Lieferungen.", "No deliveries scheduled.", "Sin entregas.", "Aucune livraison.", "تحویلی نیست.")}</p>
        ) : list.map((d) => {
          const dt = daysTo(d.date);
          const soon = dt !== null && dt >= 0 && dt <= 2;
          return (
            <div key={d.id} data-testid={`pastry-row-${d.id}`} className="rounded-xl bg-[#0C1019] border p-3" style={{ borderColor: d.done ? "#22c55e55" : soon ? "#f59e0b66" : "#1e293b" }}>
              <div className="flex items-center gap-2">
                <Cake className="w-4 h-4 shrink-0" style={{ color: d.done ? "#22c55e" : "#7FD8C0" }} />
                <span className={`text-sm font-black flex-1 min-w-0 truncate ${d.done ? "text-emerald-300 line-through" : "text-white"}`}>{d.client}{d.item ? ` · ${d.item}` : ""}</span>
                <button data-testid={`pastry-toggle-${d.id}`} onClick={() => toggle(d.id)} className="shrink-0 w-7 h-7 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/40 text-[#22c55e] flex items-center justify-center active:scale-95"><Check className="w-4 h-4" /></button>
                <button data-testid={`pastry-del-${d.id}`} onClick={() => remove(d.id)} className="shrink-0 w-7 h-7 rounded-lg bg-[#030712] border border-[#1e293b] text-[#64748B] hover:text-rose-400 flex items-center justify-center active:scale-95"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[11px] flex-wrap">
                <span className="inline-flex items-center gap-1 text-[#94A3B8]"><CalendarClock className="w-3 h-3" /> {d.date}{d.time ? ` · ${d.time}` : ""}</span>
                {d.people && <span className="text-[#94A3B8]">· {d.people} {tri("pers.", "Pers.", "ppl", "pers.", "pers.", "نفر")}</span>}
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#7FD8C0]/10 text-[#7FD8C0] border border-[#7FD8C0]/25">{d.event_type}</span>
                {soon && !d.done && <span data-testid={`pastry-soon-${d.id}`} className="text-[10px] font-black text-[#f59e0b]">⏰ {dt === 0 ? tri("OGGI", "HEUTE", "TODAY", "HOY", "AUJOURD'HUI", "امروز") : tri(`tra ${dt} g`, `in ${dt} T`, `in ${dt}d`, `en ${dt}d`, `dans ${dt}j`, `${dt} روز`)}</span>}
              </div>
              {d.notes && <p className="mt-1 text-[11px] text-[#94A3B8]">{d.notes}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
