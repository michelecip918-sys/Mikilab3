import { useEffect, useState } from "react";
import { PiggyBank, Zap, Database } from "lucide-react";
import { aiApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Badge Direzione: mostra quanto sta risparmiando la produzione grazie al modello
// economico di Sitor e alla cache delle risposte identiche (aggiornato ogni 60s).
export default function CreditSavingsBadge() {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [d, setD] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => aiApi.savings().then((x) => { if (alive) setD(x); }).catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (!d) return null;
  const opt = d.optimized_calls || 0;

  return (
    <div data-testid="credit-savings-badge" className="rounded-2xl border border-[#3E9C93]/30 bg-[#3E9C93]/8 p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <PiggyBank className="w-4 h-4 text-[#3E9C93]" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3E9C93]">
          {tri("Risparmio crediti · questo mese", "Kreditersparnis · dieser Monat", "Credit savings · this month", "Ahorro de créditos · este mes", "Économies de crédits · ce mois", "صرفه‌جویی اعتبار · این ماه")}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span data-testid="savings-pct" className="text-2xl font-black text-white leading-none">-{d.saved_pct || 0}%</span>
        <span className="text-[11px] text-[#94A3B8] mb-0.5">
          {tri("sui costi IA", "der KI-Kosten", "on AI cost", "en coste IA", "sur le coût IA", "از هزینه هوش مصنوعی")}
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#8a97a6]/15 text-[#cbd5e1] px-2.5 py-1" data-testid="savings-fast">
          <Zap className="w-3 h-3 text-[#3E9C93]" /> {d.fast_calls || 0} {tri("su modello economico", "günstiges Modell", "on cheap model", "modelo económico", "modèle éco", "مدل اقتصادی")}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#8a97a6]/15 text-[#cbd5e1] px-2.5 py-1" data-testid="savings-cache">
          <Database className="w-3 h-3 text-[#3E9C93]" /> {d.cache_hits || 0} {tri("riuso dalla cache", "aus Cache", "cache reuse", "reuso caché", "réutilisé du cache", "بازاستفاده کش")}
        </span>
      </div>
      {opt > 0 && (
        <p className="mt-2 text-[10px] text-[#64748B]">
          {tri(`${opt} chiamate ottimizzate invece del modello premium.`, `${opt} optimierte Aufrufe statt Premium-Modell.`, `${opt} calls optimized instead of the premium model.`, `${opt} llamadas optimizadas en vez del modelo premium.`, `${opt} appels optimisés au lieu du modèle premium.`, `${opt} فراخوان بهینه به‌جای مدل پریمیوم.`)}
        </p>
      )}
    </div>
  );
}
