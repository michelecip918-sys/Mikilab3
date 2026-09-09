import { useState, useEffect } from "react";
import { mikeApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { Sparkles, Volume2, Send } from "lucide-react";

// PILASTRO 1 — Mike Mix Direttore d'Orchestra: piano di produzione ottimale auto-generato.
export default function AutoPlan() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [orders, setOrders] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  // Sync ordini B2B → prefill del piano (evento dal modulo E-commerce B2B).
  useEffect(() => {
    const h = (e) => { const t = e?.detail?.text; if (t) { setOrders(t); toast.info(tri("Ordini B2B caricati nel piano.", "B2B-Aufträge im Plan.", "B2B orders loaded into the plan.", "Pedidos B2B cargados.", "Commandes B2B chargées.", "سفارش‌های B2B بارگذاری شد.")); } };
    window.addEventListener("mikilab-prefill-orders", h);
    return () => window.removeEventListener("mikilab-prefill-orders", h);
  }, [tri]);

  const gen = async () => {
    setBusy(true);
    try { const r = await mikeApi.autoplan({ orders_text: orders, lang }); setRes(r.plan); } catch (e) { toast.error(tri("Mike Mix non è riuscito a generare il piano. Riprova.", "Plan fehlgeschlagen. Erneut versuchen.", "Mike Mix couldn't generate the plan. Try again.", "No se pudo generar el plan.", "Échec du plan. Réessaie.", "برنامه ساخته نشد.")); }
    setBusy(false);
  };

  return (
    <div data-testid="autoplan" className="space-y-3">
      <textarea data-testid="autoplan-orders" value={orders} onChange={(e) => setOrders(e.target.value)} rows={2}
        placeholder={tri("Ordini del giorno (facoltativo): es. 300 baguette, 120 focacce, 40 torte…", "Tagesaufträge (optional)…", "Today's orders (optional)…", "Pedidos de hoy (opcional)…", "Commandes du jour (optionnel)…", "سفارش‌های امروز (اختیاری)…")}
        className="w-full bg-[#0C1019] border border-[#64748B]/30 rounded-lg px-3 py-2 text-sm text-white focus:border-[#64748B] outline-none resize-none" />
      <button data-testid="autoplan-gen" onClick={gen} disabled={busy}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-cyber font-black text-sm text-[#060A10] active:scale-95 transition-all disabled:opacity-50"
        style={{ background: "linear-gradient(90deg,#FF9D42,#FF6B00)", boxShadow: "0 0 20px rgba(255,107,0,0.35)" }}>
        <Sparkles className="w-4 h-4" /> {busy ? tri("Mike Mix pianifica…", "Mike Mix plant…", "Mike Mix is planning…", "Mike Mix planifica…", "Mike Mix planifie…", "برنامه‌ریزی…") : tri("Genera piano ottimale", "Optimalen Plan erstellen", "Generate optimal plan", "Generar plan óptimo", "Générer le plan optimal", "تولید برنامه بهینه")}
      </button>

      {res && (
        <div data-testid="autoplan-result" className="space-y-3 pt-1">
          {res.summary && (
            <div className="flex items-start gap-2 bg-[#0C1019]/70 border border-[#FF9D42]/30 rounded-xl p-3">
              <p className="flex-1 text-sm text-[#d6fbff]">{res.summary}</p>
              {res.spoken && <button data-testid="autoplan-speak" onClick={() => { try { playTTS(res.spoken, { lang, voice: "bakemix" }); } catch (e) { /* */ } }} className="text-[#FF9D42] active:scale-90 transition-all"><Volume2 className="w-4 h-4" /></button>}
            </div>
          )}
          {(res.batches || []).length > 0 && (
            <button data-testid="autoplan-dispatch" onClick={async () => {
              try { const r = await mikeApi.dispatch(res.batches); try { window.dispatchEvent(new Event("mikilab-tasks-updated")); } catch { /* */ } toast.success(tri(`Inviati ${r.created} lotti agli operatori.`, `${r.created} Lose ans Team gesendet.`, `Sent ${r.created} batches to operators.`, `${r.created} lotes enviados.`, `${r.created} lots envoyés.`, `${r.created} دسته ارسال شد.`)); } catch (e) { toast.error(tri("Invio non riuscito.", "Senden fehlgeschlagen.", "Dispatch failed.", "Envío fallido.", "Échec de l'envoi.", "ارسال ناموفق.")); }
            }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF9D42]/15 border border-[#FF9D42]/50 text-[#FF9D42] font-bold text-sm active:scale-95 transition-all">
              <Send className="w-4 h-4" /> {tri("Invia agli operatori", "Ans Team senden", "Send to operators", "Enviar a operarios", "Envoyer aux opérateurs", "ارسال به اپراتورها")}
            </button>
          )}
          {(res.batches || []).map((b, i) => (
            <div key={i} data-testid={`autoplan-batch-${i}`} className="flex items-center gap-3 bg-[#0C1019]/60 border border-[#64748B]/25 rounded-lg px-3 py-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FF9D42]/15 border border-[#FF9D42]/50 text-[#FF9D42] font-black text-xs shrink-0">{b.seq || i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{b.product} {b.qty ? `· ${b.qty}` : ""}</p>
                <p className="text-[11px] text-[#94A3B8] truncate">{[b.line, b.start, b.duration_min ? `${b.duration_min}′` : null, b.assignee].filter(Boolean).join(" · ")}{b.rationale ? ` — ${b.rationale}` : ""}</p>
              </div>
            </div>
          ))}
          {(res.warnings || []).map((w, i) => (
            <p key={i} data-testid={`autoplan-warn-${i}`} className="text-xs text-[#FFB800] flex items-center gap-1.5">⚠ {w}</p>
          ))}
        </div>
      )}
    </div>
  );
}
