import { useState, useEffect } from "react";
import { mikeApi, deusApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { Sparkles, Volume2, Send, Layers, Check } from "lucide-react";
import SmartAttach from "@/components/console/SmartAttach";

// PILASTRO 1 — Sitor Direttore d'Orchestra: piano di produzione ottimale auto-generato.
export default function AutoPlan() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [orders, setOrders] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState([]);
  const [busyOpt, setBusyOpt] = useState(false);
  const [chosen, setChosen] = useState(-1);

  // Sync ordini B2B → prefill del piano (evento dal modulo E-commerce B2B).
  useEffect(() => {
    const h = (e) => { const t = e?.detail?.text; if (t) { setOrders(t); toast.info(tri("Ordini B2B caricati nel piano.", "B2B-Aufträge im Plan.", "B2B orders loaded into the plan.", "Pedidos B2B cargados.", "Commandes B2B chargées.", "سفارش‌های B2B بارگذاری شد.")); } };
    window.addEventListener("mikilab-prefill-orders", h);
    return () => window.removeEventListener("mikilab-prefill-orders", h);
  }, [tri]);

  const gen = async () => {
    setBusy(true); setOptions([]); setChosen(-1);
    try { const r = await mikeApi.autoplan({ orders_text: orders, lang }); setRes(r.plan); } catch (e) { toast.error(tri("Sitor non è riuscito a generare il piano. Riprova.", "Plan fehlgeschlagen. Erneut versuchen.", "Sitor couldn't generate the plan. Try again.", "No se pudo generar el plan.", "Échec du plan. Réessaie.", "برنامه ساخته نشد.")); }
    setBusy(false);
  };

  // Sitor genera PIÙ OPZIONI di piano tra cui il Capo sceglie.
  const genOptions = async () => {
    setBusyOpt(true); setRes(null); setChosen(-1); setOptions([]);
    try {
      const r = await mikeApi.autoplanOptions({ orders_text: orders, lang });
      if ((r.options || []).length) { setOptions(r.options); try { playTTS(tri("Ho preparato tre strategie. Scegli quella che preferisci.", "Drei Strategien. Wähle eine.", "I prepared three strategies. Pick one.", "Preparé tres estrategias. Elige una.", "J'ai préparé trois stratégies. Choisis-en une.", "سه استراتژی آماده کردم. یکی را انتخاب کن."), { lang, voice: "nexus" }); } catch { /* */ } }
      else toast.error(tri("Nessuna opzione generata. Riprova.", "Keine Optionen.", "No options generated.", "Sin opciones.", "Aucune option.", "گزینه‌ای نیست."));
    } catch (e) { toast.error(tri("Sitor non è riuscito a generare le opzioni.", "Optionen fehlgeschlagen.", "Couldn't generate options.", "No se pudieron generar.", "Échec des options.", "خطا در گزینه‌ها.")); }
    setBusyOpt(false);
  };

  const chooseOption = (i) => { setChosen(i); setRes(options[i]); };

  return (
    <div data-testid="autoplan" className="space-y-3">
      <textarea data-testid="autoplan-orders" value={orders} onChange={(e) => setOrders(e.target.value)} rows={2}
        placeholder={tri("Ordini del giorno (facoltativo): es. 300 baguette, 120 focacce, 40 torte…", "Tagesaufträge (optional)…", "Today's orders (optional)…", "Pedidos de hoy (opcional)…", "Commandes du jour (optionnel)…", "سفارش‌های امروز (اختیاری)…")}
        className="w-full bg-[#0C1019] border border-[#64748B]/30 rounded-lg px-3 py-2 text-sm text-white focus:border-[#64748B] outline-none resize-none" />
      <SmartAttach context={tri("ordini di produzione del giorno", "Tagesaufträge", "day's production orders", "pedidos del día", "commandes du jour", "سفارش‌های روز")} compact
        onExtract={(t) => setOrders((o) => (o ? o + "\n" : "") + t)} />
      <div className="flex flex-wrap gap-2">
        <button data-testid="autoplan-gen" onClick={gen} disabled={busy || busyOpt}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-cyber font-black text-sm text-[#060A10] active:scale-95 transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(90deg,#9aa6b2,#8a97a6)", boxShadow: "0 0 20px rgba(138,151,166,0.35)" }}>
          <Sparkles className="w-4 h-4" /> {busy ? tri("Sitor pianifica…", "Sitor plant…", "Sitor is planning…", "Sitor planifica…", "Sitor planifie…", "برنامه‌ریزی…") : tri("Piano ottimale", "Optimaler Plan", "Optimal plan", "Plan óptimo", "Plan optimal", "برنامه بهینه")}
        </button>
        <button data-testid="autoplan-gen-options" onClick={genOptions} disabled={busy || busyOpt}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-cyber font-black text-sm text-[#9aa6b2] border border-[#9aa6b2]/50 bg-[#9aa6b2]/10 active:scale-95 transition-all disabled:opacity-50">
          <Layers className="w-4 h-4" /> {busyOpt ? tri("Sitor prepara le opzioni…", "Optionen…", "Preparing options…", "Preparando opciones…", "Options…", "گزینه‌ها…") : tri("3 opzioni tra cui scegliere", "3 Optionen", "3 options to choose", "3 opciones", "3 options", "۳ گزینه")}
        </button>
      </div>

      {/* Opzioni di piano (Sitor propone, il Capo sceglie) */}
      {options.length > 0 && (
        <div data-testid="autoplan-options" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {options.map((o, i) => (
            <button key={i} data-testid={`autoplan-option-${i}`} onClick={() => chooseOption(i)}
              className="text-left rounded-xl p-3 border transition-all active:scale-[0.98]"
              style={chosen === i ? { borderColor: "#9aa6b2", background: "rgba(255,157,66,0.12)", boxShadow: "0 0 18px rgba(255,157,66,0.3)" } : { borderColor: "#334155", background: "#0C1019" }}>
              <div className="flex items-center gap-1.5 mb-1">
                {chosen === i && <Check className="w-4 h-4 text-[#9aa6b2]" />}
                <span className="text-sm font-black text-white">{o.label || `Opzione ${i + 1}`}</span>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-snug">{o.strategy || o.summary}</p>
              <p className="text-[10px] text-[#64748B] mt-1">{(o.batches || []).length} {tri("lotti", "Lose", "batches", "lotes", "lots", "دسته")}</p>
            </button>
          ))}
        </div>
      )}

      {res && (
        <div data-testid="autoplan-result" className="space-y-3 pt-1">
          {res.summary && (
            <div className="flex items-start gap-2 bg-[#0C1019]/70 border border-[#9aa6b2]/30 rounded-xl p-3">
              <p className="flex-1 text-sm text-[#d6fbff]">{res.summary}</p>
              {res.spoken && <button data-testid="autoplan-speak" onClick={() => { try { playTTS(res.spoken, { lang, voice: "bakemix" }); } catch (e) { /* */ } }} className="text-[#9aa6b2] active:scale-90 transition-all"><Volume2 className="w-4 h-4" /></button>}
            </div>
          )}
          {(res.batches || []).length > 0 && (
            <button data-testid="autoplan-dispatch" onClick={async () => {
              try { const r = await mikeApi.dispatch(res.batches); try { await deusApi.broadcast({ plan_markdown: res.summary || "", headline: res.spoken || res.summary || "" }); } catch { /* */ } try { window.dispatchEvent(new Event("mikilab-tasks-updated")); } catch { /* */ } toast.success(tri(`Inviati ${r.created} lotti agli operatori.`, `${r.created} Lose ans Team gesendet.`, `Sent ${r.created} batches to operators.`, `${r.created} lotes enviados.`, `${r.created} lots envoyés.`, `${r.created} دسته ارسال شد.`)); } catch (e) { toast.error(tri("Invio non riuscito.", "Senden fehlgeschlagen.", "Dispatch failed.", "Envío fallido.", "Échec de l'envoi.", "ارسال ناموفق.")); }
            }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#9aa6b2]/15 border border-[#9aa6b2]/50 text-[#9aa6b2] font-bold text-sm active:scale-95 transition-all">
              <Send className="w-4 h-4" /> {tri("Invia agli operatori", "Ans Team senden", "Send to operators", "Enviar a operarios", "Envoyer aux opérateurs", "ارسال به اپراتورها")}
            </button>
          )}
          {(res.batches || []).map((b, i) => (
            <div key={i} data-testid={`autoplan-batch-${i}`} className="flex items-center gap-3 bg-[#0C1019]/60 border border-[#64748B]/25 rounded-lg px-3 py-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#9aa6b2]/15 border border-[#9aa6b2]/50 text-[#9aa6b2] font-black text-xs shrink-0">{b.seq || i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{b.product} {b.qty ? `· ${b.qty}` : ""}</p>
                <p className="text-[11px] text-[#94A3B8] truncate">{[b.line, b.start, b.duration_min ? `${b.duration_min}′` : null, b.assignee].filter(Boolean).join(" · ")}{b.rationale ? ` — ${b.rationale}` : ""}</p>
              </div>
            </div>
          ))}
          {(res.warnings || []).map((w, i) => (
            <p key={i} data-testid={`autoplan-warn-${i}`} className="text-xs text-[#a4afbb] flex items-center gap-1.5">⚠ {w}</p>
          ))}
        </div>
      )}
    </div>
  );
}
