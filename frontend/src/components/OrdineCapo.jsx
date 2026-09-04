import { useState } from "react";
import { Loader2, CalendarClock, Send, Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { planApi, floorPlanApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PRODUCTS = ["baguette", "pane", "focaccia", "pizza", "croissant", "brioche", "panettone"];

// MOTORE MIKILAB — il Capo detta l'ordine, calcoliamo il piano A RITROSO e lo inviamo a Mohamed.
export default function OrdineCapo() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [product, setProduct] = useState("baguette");
  const [quantity, setQuantity] = useState(100);
  const [deadline, setDeadline] = useState("06:00");
  const [dayOffset, setDayOffset] = useState(1);
  const [command, setCommand] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [res, setRes] = useState(null);

  const calc = async () => {
    setBusy(true);
    try {
      const body = command.trim()
        ? { command: command.trim(), lang }
        : { product, quantity: Number(quantity), deadline, day_offset: Number(dayOffset), lang };
      const r = await planApi.order(body);
      setRes(r);
      toast.success(tri("Piano a ritroso calcolato", "Rückwärtsplan berechnet", "Backwards plan computed", "Plan hacia atrás calculado", "Plan à rebours calculé", "برنامه معکوس محاسبه شد"));
    } catch (e) {
      toast.error(e?.response?.data?.detail || tri("Calcolo non riuscito", "Berechnung fehlgeschlagen", "Computation failed", "Cálculo fallido", "Échec du calcul", "محاسبه ناموفق بود"));
    } finally { setBusy(false); }
  };

  const sendToMohamed = async () => {
    if (!res) return;
    setSending(true);
    try {
      await floorPlanApi.push({ plan: res.plan, title: res.title, lang });
      try { window.dispatchEvent(new Event("mikilab-floor-plan-updated")); } catch { /* */ }
      toast.success(tri("Piano inviato a Mohamed! Coordinerà il team a voce.", "Plan an Mohamed gesendet!", "Plan sent to Mohamed! He'll coordinate the team by voice.", "¡Plan enviado a Mohamed!", "Plan envoyé à Mohamed !", "برنامه به محمد ارسال شد!"));
    } catch { toast.error(tri("Invio non riuscito", "Senden fehlgeschlagen", "Send failed", "Fallo al enviar", "Échec de l'envoi", "ارسال ناموفق")); }
    finally { setSending(false); }
  };

  const inputCls = "bg-[#030712] border border-[#334155] rounded-xl px-3 py-2.5 text-sm text-white focus:border-[#14b8a6] outline-none w-full";

  return (
    <div data-testid="ordine-capo" className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#14b8a6] flex items-center gap-2"><CalendarClock className="w-4 h-4" /> {tri("Ordine & Piano a Ritroso", "Auftrag & Rückwärtsplan", "Order & Backwards Plan", "Pedido & Plan a la Inversa", "Commande & Plan à Rebours", "سفارش و برنامه معکوس")}</h3>
        <p className="text-[11px] text-[#94A3B8] mt-1">{tri("Detta l'ordine: dall'ora di consegna calcolo a ritroso impasto, lievitazione e cottura, poi invio la scaletta a Mohamed.", "Diktiere den Auftrag: von der Lieferzeit rechne ich rückwärts.", "Dictate the order: from the delivery time I schedule mixing, proofing and baking backwards, then send it to Mohamed.", "Dicta el pedido: desde la hora de entrega calculo hacia atrás.", "Dicte la commande : depuis l'heure de livraison je planifie à rebours.", "سفارش را بگو: از زمان تحویل به‌صورت معکوس برنامه‌ریزی می‌کنم.")}</p>
      </div>

      {/* comando libero (NLP) */}
      <input data-testid="ordine-command" value={command} onChange={(e) => setCommand(e.target.value)} className={inputCls}
        placeholder={tri("Es. 300 baguette per domani alle 06:00", "z.B. 300 Baguettes für morgen 06:00", "E.g. 300 baguettes for tomorrow at 06:00", "Ej. 300 baguettes para mañana a las 06:00", "Ex. 300 baguettes pour demain à 06:00", "مثال: ۳۰۰ باگت برای فردا ساعت ۶")} />
      <div className="text-center text-[10px] text-[#64748B] uppercase tracking-widest">{tri("oppure compila", "oder ausfüllen", "or fill in", "o rellena", "ou remplis", "یا پر کن")}</div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-[#94A3B8] uppercase tracking-wide">{tri("Prodotto", "Produkt", "Product", "Producto", "Produit", "محصول")}</label>
          <select data-testid="ordine-product" value={product} onChange={(e) => setProduct(e.target.value)} className={inputCls}>
            {PRODUCTS.map((p) => <option key={p} value={p} className="bg-[#0b0f19]">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-[#94A3B8] uppercase tracking-wide">{tri("Quantità", "Menge", "Quantity", "Cantidad", "Quantité", "تعداد")}</label>
          <input data-testid="ordine-quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="text-[10px] text-[#94A3B8] uppercase tracking-wide">{tri("Consegna (ora)", "Lieferung (Zeit)", "Delivery (time)", "Entrega (hora)", "Livraison (heure)", "تحویل (ساعت)")}</label>
          <input data-testid="ordine-deadline" type="time" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="text-[10px] text-[#94A3B8] uppercase tracking-wide">{tri("Giorno", "Tag", "Day", "Día", "Jour", "روز")}</label>
          <select data-testid="ordine-day" value={dayOffset} onChange={(e) => setDayOffset(e.target.value)} className={inputCls}>
            <option value={0} className="bg-[#0b0f19]">{tri("Oggi", "Heute", "Today", "Hoy", "Aujourd'hui", "امروز")}</option>
            <option value={1} className="bg-[#0b0f19]">{tri("Domani", "Morgen", "Tomorrow", "Mañana", "Demain", "فردا")}</option>
          </select>
        </div>
      </div>

      <button data-testid="ordine-calc-btn" onClick={calc} disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] font-extrabold text-xs rounded-xl shadow-lg shadow-[#14b8a6]/20 disabled:opacity-50 active:scale-95 transition-all">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {busy ? tri("Calcolo…", "Berechne…", "Computing…", "Calculando…", "Calcul…", "در حال محاسبه…") : tri("Calcola Piano a Ritroso", "Rückwärtsplan berechnen", "Compute Backwards Plan", "Calcular Plan a la Inversa", "Calculer le Plan à Rebours", "محاسبه برنامه معکوس")}
      </button>

      {res && (
        <div data-testid="ordine-result" className="rounded-xl bg-[#030712] border border-[#14b8a6]/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-white">{res.title}</span>
            <button data-testid="ordine-listen" onClick={() => { try { playTTS(res.plan, { lang }); } catch { /* */ } }} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14b8a6]"><Volume2 className="w-3.5 h-3.5" /> {tri("Ascolta", "Hören", "Listen", "Escuchar", "Écouter", "بشنو")}</button>
          </div>
          <div className="space-y-2">
            {res.steps.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${s.phase === "consegna" ? "bg-[#14b8a6]/10 border-[#14b8a6]/40" : "bg-[#0b0f19] border-[#1e293b]"}`}>
                <span className="text-sm font-black text-[#14b8a6] tabular-nums w-12">{s.clock}</span>
                <span className="flex-1 text-sm font-semibold text-white">{s.label}</span>
                {s.minutes ? <span className="text-[11px] text-[#64748B]">{s.minutes} min</span> : null}
              </div>
            ))}
          </div>
          <button data-testid="ordine-send-mohamed" onClick={sendToMohamed} disabled={sending}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-[#030712] font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-95 transition-all">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? tri("Invio…", "Senden…", "Sending…", "Enviando…", "Envoi…", "ارسال…") : tri("Invia a Mohamed (coordina il team)", "An Mohamed senden", "Send to Mohamed (coordinates the team)", "Enviar a Mohamed", "Envoyer à Mohamed", "ارسال به محمد")}
          </button>
        </div>
      )}
    </div>
  );
}
