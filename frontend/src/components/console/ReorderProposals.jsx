import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { PackagePlus, Send, X, Loader2, Truck, CheckCircle2, History, Brain, ChevronDown } from "lucide-react";
import { mikeApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

export const ReorderProposals = () => {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [items, setItems] = useState([]);
  const [autoSend, setAutoSend] = useState(false);
  const [autoThreshold, setAutoThreshold] = useState(false);
  const [busy, setBusy] = useState("");
  const [history, setHistory] = useState(null);
  const [thresholds, setThresholds] = useState(null);
  const [showHist, setShowHist] = useState(false);
  const [showSmart, setShowSmart] = useState(false);

  const load = useCallback(() => {
    mikeApi.reorderProposals().then((d) => {
      setItems(d.proposals || []);
      setAutoSend(!!(d.config && d.config.auto_send));
      setAutoThreshold(!!(d.config && d.config.auto_threshold));
    }).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const setConfig = async (nextSend, nextThresh) => {
    try { await mikeApi.reorderConfigSet(nextSend, nextThresh); }
    catch { load(); }
  };
  const toggleAuto = async () => { const nv = !autoSend; setAutoSend(nv); await setConfig(nv, autoThreshold); toast.success(nv ? tri("Invio automatico attivo", "Auto-Versand an", "Auto-send on", "Envío automático activo", "Envoi auto activé", "ارسال خودکار فعال") : tri("Invio automatico disattivato", "Auto-Versand aus", "Auto-send off", "Envío automático desactivado", "Envoi auto désactivé", "ارسال خودکار خاموش")); };
  const toggleThreshold = async () => { const nv = !autoThreshold; setAutoThreshold(nv); await setConfig(autoSend, nv); toast.success(nv ? tri("Soglie automatiche attive: Sitor le calcola dai consumi", "Auto-Schwellen an", "Auto thresholds on: Sitor computes from usage", "Umbrales automáticos activos", "Seuils auto activés", "آستانه خودکار فعال") : tri("Soglie automatiche disattivate", "Auto-Schwellen aus", "Auto thresholds off", "Umbrales automáticos off", "Seuils auto désactivés", "آستانه خودکار خاموش")); };

  const send = async (p) => {
    setBusy(p.id);
    try { const r = await mikeApi.reorderSend(p.id); toast.success(r.emailed ? tri(`Ordine inviato a ${r.supplier}`, `Bestellung an ${r.supplier} gesendet`, `Order sent to ${r.supplier}`, `Pedido enviado a ${r.supplier}`, `Commande envoyée à ${r.supplier}`, `سفارش ارسال شد به ${r.supplier}`) : tri("Segnato come inviato (nessun fornitore email)", "Als gesendet markiert", "Marked as sent", "Marcado como enviado", "Marqué comme envoyé", "به‌عنوان ارسال‌شده علامت خورد")); load(); }
    catch { toast.error(tri("Invio non riuscito", "Senden fehlgeschlagen", "Send failed", "Envío fallido", "Échec de l'envoi", "ارسال ناموفق")); }
    setBusy("");
  };
  const dismiss = async (p) => { setBusy(p.id); try { await mikeApi.reorderDismiss(p.id); load(); } catch { /* */ } setBusy(""); };
  const receive = async (p) => {
    setBusy(p.id);
    try { const r = await mikeApi.reorderReceive(p.id); toast.success(tri(`Merce ricevuta: +${r.added_kg}kg di ${r.name} (ora ${r.new_quantity_kg}kg)`, `Ware erhalten: +${r.added_kg}kg`, `Goods received: +${r.added_kg}kg ${r.name} (now ${r.new_quantity_kg}kg)`, `Mercancía recibida: +${r.added_kg}kg`, `Marchandise reçue : +${r.added_kg}kg`, `کالا دریافت شد: +${r.added_kg}kg`)); load(); if (showHist) loadHistory(); }
    catch { toast.error(tri("Registrazione non riuscita", "Fehlgeschlagen", "Failed", "Fallido", "Échec", "ناموفق")); }
    setBusy("");
  };

  const loadHistory = useCallback(() => { mikeApi.reorderHistory().then((d) => setHistory(d.history || [])).catch(() => setHistory([])); }, []);
  const loadThresholds = useCallback(() => { mikeApi.reorderSmartThresholds().then((d) => setThresholds(d.thresholds || [])).catch(() => setThresholds([])); }, []);
  const applyThreshold = async (t) => {
    setBusy(t.name + t.source);
    try { const r = await mikeApi.reorderApplyThreshold(t.name, t.source); toast.success(tri(`Soglia di ${t.name} aggiornata a ${r.new_min_kg}kg (dai consumi reali)`, `Schwelle ${t.name}: ${r.new_min_kg}kg`, `${t.name} threshold set to ${r.new_min_kg}kg (from real usage)`, `Umbral ${t.name}: ${r.new_min_kg}kg`, `Seuil ${t.name} : ${r.new_min_kg}kg`, `آستانه ${t.name}: ${r.new_min_kg}kg`)); loadThresholds(); }
    catch (e) { toast.error(e?.response?.data?.detail || tri("Consumi insufficienti", "Zu wenig Daten", "Not enough usage data", "Datos insuficientes", "Données insuffisantes", "داده کافی نیست")); }
    setBusy("");
  };

  const proposed = items.filter((p) => p.status === "proposed");
  const sent = items.filter((p) => p.status === "sent");
  const smartActionable = (thresholds || []).filter((t) => t.smart_min_kg > 0 && Math.abs(t.smart_min_kg - t.fixed_min_kg) >= 1);
  const whName = tri("Magazzino", "Lager", "Warehouse", "Almacén", "Entrepôt", "انبار");

  return (
    <div data-testid="reorder-proposals" className="rounded-2xl border border-[#e0a94a]/30 p-3 mb-4" style={{ background: "#e0a94a0d" }}>
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#e0a94a] flex items-center gap-1.5"><PackagePlus className="w-3.5 h-3.5" /> {tri("Proposte di riordino", "Nachbestell-Vorschläge", "Reorder proposals", "Propuestas de pedido", "Propositions de réappro", "پیشنهاد سفارش")}</p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[11px] text-[#9aa6b2] cursor-pointer">
            {tri("Invio auto", "Auto-Versand", "Auto-send", "Envío auto", "Envoi auto", "ارسال خودکار")}
            <button type="button" role="switch" aria-checked={autoSend} data-testid="reorder-auto-toggle" onClick={toggleAuto}
              className={`relative w-10 h-5 rounded-full shrink-0 transition-colors ${autoSend ? "bg-[#3E9C93]" : "bg-[#334155]"}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoSend ? "translate-x-5" : ""}`} />
            </button>
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-[#9aa6b2] cursor-pointer">
            {tri("Soglia auto", "Auto-Schwelle", "Auto threshold", "Umbral auto", "Seuil auto", "آستانه خودکار")}
            <button type="button" role="switch" aria-checked={autoThreshold} data-testid="reorder-threshold-toggle" onClick={toggleThreshold}
              className={`relative w-10 h-5 rounded-full shrink-0 transition-colors ${autoThreshold ? "bg-[#8a6bd0]" : "bg-[#334155]"}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoThreshold ? "translate-x-5" : ""}`} />
            </button>
          </label>
        </div>
      </div>

      {proposed.length === 0 && sent.length === 0 && (
        <p className="text-[12px] text-[#64748B] py-2">{tri("Nessuna proposta: le scorte sono sopra soglia.", "Keine Vorschläge: Bestände über Schwelle.", "No proposals: stock above threshold.", "Sin propuestas: stock sobre umbral.", "Aucune proposition : stock au-dessus du seuil.", "پیشنهادی نیست: موجودی بالای آستانه.")}</p>
      )}
      <div className="space-y-1.5">
        {proposed.map((p) => (
          <div key={p.id} data-testid={`reorder-item-${p.id}`} className="flex items-center justify-between gap-2 bg-[#0b0f19] border border-[#e0a94a]/25 rounded-xl px-3 py-2">
            <span className="text-[12.5px] text-white min-w-0">
              <b className="truncate">{p.name}</b> <span className="text-[#94A3B8]">· {tri("proponi", "vorschlagen", "suggest", "sugerir", "suggérer", "پیشنهاد")} {p.suggested_qty_kg}kg</span>
              <span className="block text-[10.5px] text-[#7c8794]">{p.current_kg}/{p.min_kg} kg · {p.source === "silos" ? "Silos" : whName}{p.weekly_avg_kg > 0 ? ` · ${tri("consumo", "Verbrauch", "usage", "consumo", "conso", "مصرف")} ~${p.weekly_avg_kg}kg/${tri("sett", "Wo", "wk", "sem", "sem", "هفته")}` : ""}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <button data-testid={`reorder-send-${p.id}`} onClick={() => send(p)} disabled={busy === p.id} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3E9C93] text-white text-[11px] font-bold active:scale-95 disabled:opacity-50">{busy === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} {tri("Invia", "Senden", "Send", "Enviar", "Envoyer", "ارسال")}</button>
              <button data-testid={`reorder-dismiss-${p.id}`} onClick={() => dismiss(p)} disabled={busy === p.id} className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[#334155] text-[#94A3B8] active:scale-95"><X className="w-3.5 h-3.5" /></button>
            </span>
          </div>
        ))}
        {sent.map((p) => (
          <div key={p.id} data-testid={`reorder-sent-${p.id}`} className="flex items-center justify-between gap-2 bg-[#0b0f19] border border-[#6e9e85]/25 rounded-xl px-3 py-2">
            <span className="flex items-center gap-1.5 text-[11.5px] text-[#6e9e85] min-w-0">
              <Truck className="w-3.5 h-3.5 shrink-0" /> <b className="truncate">{p.name}</b> · {p.suggested_qty_kg}kg — {p.auto ? tri("inviato auto", "auto gesendet", "auto-sent", "auto enviado", "envoi auto", "ارسال خودکار") : tri("inviato", "gesendet", "sent", "enviado", "envoyé", "ارسال‌شده")}
            </span>
            <button data-testid={`reorder-receive-${p.id}`} onClick={() => receive(p)} disabled={busy === p.id} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#6e9e85] text-[#04140c] text-[11px] font-bold active:scale-95 disabled:opacity-50 shrink-0">{busy === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} {tri("Ricevuta", "Erhalten", "Received", "Recibida", "Reçue", "دریافت شد")}</button>
          </div>
        ))}
      </div>

      {/* Soglie intelligenti calcolate da Sitor sui consumi reali */}
      <div className="mt-3 pt-2 border-t border-[#e0a94a]/15">
        <button type="button" data-testid="reorder-smart-toggle" onClick={() => { const nv = !showSmart; setShowSmart(nv); if (nv && thresholds === null) loadThresholds(); }}
          className="w-full flex items-center justify-between text-[11px] font-bold text-[#a58ce0] py-1">
          <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> {tri("Soglie intelligenti (dai consumi)", "Smart-Schwellen", "Smart thresholds (from usage)", "Umbrales inteligentes", "Seuils intelligents", "آستانه هوشمند")}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showSmart ? "rotate-180" : ""}`} />
        </button>
        {showSmart && (
          <div data-testid="reorder-smart-list" className="mt-1.5 space-y-1">
            {thresholds === null && <p className="text-[11px] text-[#64748B] py-1"><Loader2 className="w-3.5 h-3.5 animate-spin inline" /></p>}
            {thresholds !== null && smartActionable.length === 0 && <p className="text-[11px] text-[#64748B] py-1">{tri("Le soglie attuali sono già in linea con i consumi recenti.", "Schwellen passen zum Verbrauch.", "Current thresholds already match recent usage.", "Los umbrales ya coinciden con el consumo.", "Les seuils correspondent déjà à la conso.", "آستانه‌ها با مصرف اخیر همخوان است.")}</p>}
            {smartActionable.map((t) => (
              <div key={t.name + t.source} data-testid={`reorder-smart-${t.source}-${t.name}`} className="flex items-center justify-between gap-2 text-[11.5px] text-[#cbd5e1] bg-[#0b0f19] border border-[#a58ce0]/20 rounded-lg px-2.5 py-1.5">
                <span className="min-w-0"><b className="truncate">{t.name}</b> <span className="text-[#7c8794]">· {t.source === "silos" ? "Silos" : whName} · {tri("ora", "jetzt", "now", "ahora", "actuel", "اکنون")} {t.fixed_min_kg}kg → <span className="text-[#a58ce0] font-bold">{t.smart_min_kg}kg</span></span></span>
                <button data-testid={`reorder-apply-${t.source}-${t.name}`} onClick={() => applyThreshold(t)} disabled={busy === (t.name + t.source)} className="px-2 py-1 rounded-lg border border-[#a58ce0]/40 text-[#a58ce0] text-[10.5px] font-bold active:scale-95 disabled:opacity-50 shrink-0">{busy === (t.name + t.source) ? <Loader2 className="w-3 h-3 animate-spin" /> : tri("Applica", "Anwenden", "Apply", "Aplicar", "Appliquer", "اعمال")}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storico riordini */}
      <div className="mt-1 pt-2 border-t border-[#e0a94a]/15">
        <button type="button" data-testid="reorder-history-toggle" onClick={() => { const nv = !showHist; setShowHist(nv); if (nv && history === null) loadHistory(); }}
          className="w-full flex items-center justify-between text-[11px] font-bold text-[#9aa6b2] py-1">
          <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> {tri("Storico riordini", "Nachbestell-Verlauf", "Reorder history", "Historial de pedidos", "Historique réappro", "تاریخچه سفارش")}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showHist ? "rotate-180" : ""}`} />
        </button>
        {showHist && (
          <div data-testid="reorder-history-list" className="mt-1.5 space-y-1 max-h-64 overflow-y-auto">
            {history === null && <p className="text-[11px] text-[#64748B] py-1"><Loader2 className="w-3.5 h-3.5 animate-spin inline" /></p>}
            {history !== null && history.length === 0 && <p className="text-[11px] text-[#64748B] py-1">{tri("Nessun rifornimento registrato.", "Keine Nachbestellungen.", "No restocks recorded.", "Sin reposiciones.", "Aucun réappro.", "بدون سابقه.")}</p>}
            {(history || []).map((h) => {
              const st = h.status === "received" ? { c: "#6e9e85", t: tri("ricevuta", "erhalten", "received", "recibida", "reçue", "دریافت‌شده") }
                : h.status === "sent" ? { c: "#3E9C93", t: tri("inviata", "gesendet", "sent", "enviada", "envoyée", "ارسال‌شده") }
                : { c: "#7c8794", t: tri("scartata", "verworfen", "dismissed", "descartada", "rejetée", "رد‌شده") };
              return (
                <div key={h.id} className="flex items-center justify-between gap-2 text-[11px] px-2.5 py-1 rounded-lg bg-[#0b0f19]">
                  <span className="text-[#cbd5e1] min-w-0 truncate"><b>{h.name}</b> · {h.suggested_qty_kg}kg · {h.source === "silos" ? "Silos" : whName}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span style={{ color: st.c }} className="font-bold">{st.t}</span>
                    <span className="text-[#64748B]">{(h.received_at || h.sent_at || h.created_at || "").slice(0, 10)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
