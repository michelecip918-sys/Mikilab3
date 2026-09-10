import { useState } from "react";
import { Eye, Loader2, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { api } from "@/lib/api";
import { playTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// FASE 10 · Ecosistema Autonomo — Miki-Nexus osserva la scelta dell'operatore, impara e allerta il Capo.
export default function MikeObserve({ operator }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [recipe, setRecipe] = useState("");
  const [action, setAction] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);

  const submit = async () => {
    if (!action.trim() || busy) return;
    setBusy(true); setRes(null);
    try {
      const { data } = await api.post("/mike/observe", { recipe_name: recipe || null, action, operator: operator?.name || null, lang }, { timeout: 45000 });
      setRes(data);
      try { if (data.advice) playTTS(data.advice, { lang, voice: "mikemix" }); } catch { /* */ }
    } catch { setRes({ status: "ok", advice: tri("Registrato.", "Erfasst.", "Logged.", "Registrado.", "Enregistré.", "ثبت شد.") }); }
    setBusy(false);
  };

  const anomaly = res && res.status === "anomalia";

  return (
    <div data-testid="mike-observe" className="space-y-3">
      <div className="flex items-center gap-2">
        <Eye className="w-5 h-5 text-[#FF6B00]" />
        <div><h4 className="font-cyber text-sm font-black text-white uppercase tracking-wide">{tri("Miki-Nexus osserva", "Miki-Nexus beobachtet", "Miki-Nexus observes", "Miki-Nexus observa", "Miki-Nexus observe", "Miki-Nexus مشاهده می‌کند")}</h4>
        <p className="text-[10.5px] text-[#94A3B8]">{tri("Scrivi come hai lavorato: Miki-Nexus impara e, se serve, avvisa il Capo.", "Schreib, wie du gearbeitet hast: Miki-Nexus lernt und warnt ggf. den Chef.", "Write how you worked: Miki-Nexus learns and alerts the Capo if needed.", "Escribe cómo trabajaste: Miki-Nexus aprende y avisa al Capo.", "Écris comment tu as travaillé : Miki-Nexus apprend et alerte le Capo.", "بنویس چطور کار کردی: Miki-Nexus یاد می‌گیرد.")}</p></div>
      </div>
      <input data-testid="observe-recipe" value={recipe} onChange={(e) => setRecipe(e.target.value)} placeholder={tri("Ricetta (opzionale)", "Rezept (optional)", "Recipe (optional)", "Receta (opcional)", "Recette (option)", "دستور (اختیاری)")}
        className="w-full rounded-lg bg-[#060A10] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#FF6B00] outline-none" />
      <textarea data-testid="observe-action" value={action} onChange={(e) => setAction(e.target.value)} rows={2}
        placeholder={tri("Es. Ho alzato la temperatura dell'acqua e ridotto la puntata…", "Z. B. Wassertemperatur erhöht und Stockgare verkürzt…", "E.g. I raised the water temp and shortened bulk…", "Ej. Subí la temperatura del agua…", "Ex. J'ai monté la température de l'eau…", "مثلاً دمای آب را بالا بردم…")}
        className="w-full rounded-lg bg-[#060A10] border border-[#1e293b] text-white text-sm px-3 py-2 focus:border-[#FF6B00] outline-none resize-none" />
      <button data-testid="observe-submit" onClick={submit} disabled={busy || !action.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-[#060A10] active:scale-95 transition-all disabled:opacity-50"
        style={{ background: "linear-gradient(90deg,#FF6B00,#00C8D6)" }}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {tri("Invia a Miki-Nexus", "An Miki-Nexus senden", "Send to Miki-Nexus", "Enviar a Miki-Nexus", "Envoyer à Miki-Nexus", "ارسال به Miki-Nexus")}
      </button>
      {res && (
        <div data-testid="observe-result" className="rounded-lg border p-3" style={{ borderColor: anomaly ? "#f59e0b55" : "#22c55e55", background: anomaly ? "rgba(245,158,11,0.08)" : "rgba(34,197,94,0.07)" }}>
          <p className="flex items-center gap-1.5 text-[12px] font-bold" style={{ color: anomaly ? "#fbbf24" : "#86efac" }}>
            {anomaly ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {anomaly ? tri("Anomalia rilevata", "Anomalie erkannt", "Anomaly detected", "Anomalía detectada", "Anomalie détectée", "ناهنجاری") : tri("Tecnica valida · appresa", "Gültige Technik · gelernt", "Valid technique · learned", "Técnica válida · aprendida", "Technique valide · apprise", "تکنیک معتبر · آموخته شد")}
          </p>
          {res.advice && <p className="mt-1 text-[12px] text-[#c5d3df] leading-snug">{res.advice}</p>}
          {res.alert_capo && <p data-testid="observe-alerted" className="mt-1.5 text-[11px] font-bold text-[#f59e0b]">⚑ {tri("Capo Supremo avvisato.", "Oberster Chef benachrichtigt.", "Supreme Capo alerted.", "Capo Supremo avisado.", "Capo Suprême alerté.", "کاپو مطلع شد.")}</p>}
        </div>
      )}
    </div>
  );
}
