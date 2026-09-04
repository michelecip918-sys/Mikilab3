import { useState } from "react";
import { Sparkles, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { ordiniApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";

// Ordini Extra dell'ultimo minuto -> l'IA (GPT-5) rigenera all'istante il piano giornaliero.
export default function OrdiniExtra() {
  const { lang } = useLang();
  const [orders, setOrders] = useState("");
  const [plan, setPlan] = useState("");
  const [busy, setBusy] = useState(false);

  const regen = async () => {
    if (!orders.trim()) { toast.error("Inserisci almeno un ordine extra"); return; }
    setBusy(true);
    try {
      const res = await ordiniApi.regenerate({ orders: orders.trim(), current_plan: plan, lang });
      setPlan(res.plan || "");
      toast.success("Piano giornaliero rigenerato dall'AI");
      try { playTTS("Piano giornaliero aggiornato con gli ordini extra."); } catch { /* */ }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Rigenerazione non riuscita");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="ordini-extra" className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-[#14b8a6] flex items-center gap-2"><Sparkles className="w-4 h-4" /> Ordini Extra · Rigenerazione AI del Piano</h3>
        <p className="text-[11px] text-[#94A3B8] mt-1">Inserisci le variazioni urgenti dell'ultimo minuto (una per riga). L'IA rigenera subito il piano giornaliero.</p>
      </div>
      <textarea
        data-testid="ordini-extra-input"
        value={orders}
        onChange={(e) => setOrders(e.target.value)}
        rows={4}
        placeholder={"Es.\n+30 baguette per Bar Centrale entro le 11:00\n2 torte nuziali per domani mattina\nAnnulla 10 focacce ordine Rossi"}
        className="w-full bg-[#030712] border border-[#334155] rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-[#475569] focus:border-[#14b8a6] outline-none resize-y"
      />
      <button
        data-testid="ordini-extra-btn"
        onClick={regen}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] font-extrabold text-xs rounded-xl shadow-lg shadow-[#14b8a6]/20 disabled:opacity-50 active:scale-95 transition-all"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {busy ? "Rigenerazione in corso…" : "Rigenera Piano Giornaliero"}
      </button>

      {plan && (
        <div data-testid="ordini-extra-plan" className="p-3 rounded-xl bg-[#030712] border border-[#14b8a6]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#38bdf8]">Piano Aggiornato</span>
            <button data-testid="ordini-extra-listen" onClick={() => { try { playTTS(plan); } catch { /* */ } }} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#14b8a6]">
              <Volume2 className="w-3.5 h-3.5" /> Ascolta
            </button>
          </div>
          <pre className="text-[11px] text-[#cbd5e1] whitespace-pre-wrap leading-relaxed font-sans">{plan.replace(/^#{1,6}\s*/gm, "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/^\s*[-*]{3,}\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trim()}</pre>
        </div>
      )}
    </div>
  );
}
