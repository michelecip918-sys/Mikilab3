import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { PackagePlus, Send, X, Loader2, Truck } from "lucide-react";
import { mikeApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

export const ReorderProposals = () => {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [items, setItems] = useState([]);
  const [autoSend, setAutoSend] = useState(false);
  const [busy, setBusy] = useState("");

  const load = useCallback(() => {
    mikeApi.reorderProposals().then((d) => {
      setItems(d.proposals || []);
      setAutoSend(!!(d.config && d.config.auto_send));
    }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleAuto = async () => {
    const nv = !autoSend;
    setAutoSend(nv);
    try { await mikeApi.reorderConfigSet(nv); toast.success(nv ? tri("Invio automatico attivo", "Auto-Versand an", "Auto-send on", "Envío automático activo", "Envoi auto activé", "ارسال خودکار فعال") : tri("Invio automatico disattivato", "Auto-Versand aus", "Auto-send off", "Envío automático desactivado", "Envoi auto désactivé", "ارسال خودکار خاموش")); }
    catch { setAutoSend(!nv); }
  };

  const send = async (p) => {
    setBusy(p.id);
    try { const r = await mikeApi.reorderSend(p.id); toast.success(r.emailed ? tri(`Ordine inviato a ${r.supplier}`, `Bestellung an ${r.supplier} gesendet`, `Order sent to ${r.supplier}`, `Pedido enviado a ${r.supplier}`, `Commande envoyée à ${r.supplier}`, `سفارش ارسال شد به ${r.supplier}`) : tri("Segnato come inviato (nessun fornitore email)", "Als gesendet markiert", "Marked as sent", "Marcado como enviado", "Marqué comme envoyé", "به‌عنوان ارسال‌شده علامت خورد")); load(); }
    catch { toast.error(tri("Invio non riuscito", "Senden fehlgeschlagen", "Send failed", "Envío fallido", "Échec de l'envoi", "ارسال ناموفق")); }
    setBusy("");
  };
  const dismiss = async (p) => { setBusy(p.id); try { await mikeApi.reorderDismiss(p.id); load(); } catch { /* */ } setBusy(""); };

  const proposed = items.filter((p) => p.status === "proposed");
  const sent = items.filter((p) => p.status === "sent");

  return (
    <div data-testid="reorder-proposals" className="rounded-2xl border border-[#e0a94a]/30 bg-[#e0a94a]0d p-3 mb-4" style={{ background: "#e0a94a0d" }}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#e0a94a] flex items-center gap-1.5"><PackagePlus className="w-3.5 h-3.5" /> {tri("Proposte di riordino", "Nachbestell-Vorschläge", "Reorder proposals", "Propuestas de pedido", "Propositions de réappro", "پیشنهاد سفارش")}</p>
        <label className="flex items-center gap-1.5 text-[11px] text-[#9aa6b2] cursor-pointer" data-testid="reorder-auto-label">
          {tri("Invio auto", "Auto-Versand", "Auto-send", "Envío auto", "Envoi auto", "ارسال خودکار")}
          <button type="button" role="switch" aria-checked={autoSend} data-testid="reorder-auto-toggle" onClick={toggleAuto}
            className={`relative w-10 h-5 rounded-full shrink-0 transition-colors ${autoSend ? "bg-[#3E9C93]" : "bg-[#334155]"}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoSend ? "translate-x-5" : ""}`} />
          </button>
        </label>
      </div>
      {proposed.length === 0 && sent.length === 0 && (
        <p className="text-[12px] text-[#64748B] py-2">{tri("Nessuna proposta: le scorte sono sopra soglia.", "Keine Vorschläge: Bestände über Schwelle.", "No proposals: stock above threshold.", "Sin propuestas: stock sobre umbral.", "Aucune proposition : stock au-dessus du seuil.", "پیشنهادی نیست: موجودی بالای آستانه.")}</p>
      )}
      <div className="space-y-1.5">
        {proposed.map((p) => (
          <div key={p.id} data-testid={`reorder-item-${p.id}`} className="flex items-center justify-between gap-2 bg-[#0b0f19] border border-[#e0a94a]/25 rounded-xl px-3 py-2">
            <span className="text-[12.5px] text-white min-w-0">
              <b className="truncate">{p.name}</b> <span className="text-[#94A3B8]">· {tri("proponi", "vorschlagen", "suggest", "sugerir", "suggérer", "پیشنهاد")} {p.suggested_qty_kg}kg</span>
              <span className="block text-[10.5px] text-[#7c8794]">{p.current_kg}/{p.min_kg} kg · {p.source === "silos" ? "Silos" : tri("Magazzino", "Lager", "Warehouse", "Almacén", "Entrepôt", "انبار")}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <button data-testid={`reorder-send-${p.id}`} onClick={() => send(p)} disabled={busy === p.id} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3E9C93] text-white text-[11px] font-bold active:scale-95 disabled:opacity-50">{busy === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {tri("Invia", "Senden", "Send", "Enviar", "Envoyer", "ارسال")}</button>
              <button data-testid={`reorder-dismiss-${p.id}`} onClick={() => dismiss(p)} disabled={busy === p.id} className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[#334155] text-[#94A3B8] active:scale-95"><X className="w-3.5 h-3.5" /></button>
            </span>
          </div>
        ))}
        {sent.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5 text-[11.5px] text-[#6e9e85] px-1" data-testid={`reorder-sent-${p.id}`}>
            <Truck className="w-3.5 h-3.5" /> {p.name} · {p.suggested_qty_kg}kg — {p.auto ? tri("inviato auto", "auto gesendet", "auto-sent", "auto enviado", "envoi auto", "ارسال خودکار") : tri("inviato", "gesendet", "sent", "enviado", "envoyé", "ارسال‌شده")}
          </div>
        ))}
      </div>
    </div>
  );
};
