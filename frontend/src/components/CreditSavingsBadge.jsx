import { useEffect, useState } from "react";
import { PiggyBank, Zap, Database } from "lucide-react";
import { aiApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const MONTHS = { "01": "Gen", "02": "Feb", "03": "Mar", "04": "Apr", "05": "Mag", "06": "Giu", "07": "Lug", "08": "Ago", "09": "Set", "10": "Ott", "11": "Nov", "12": "Dic" };

// Badge Direzione: quanto sta risparmiando la produzione grazie al modello economico di
// Sitor e alla cache delle risposte identiche, con mini-storico mensile (aggiorna ogni 60s).
export default function CreditSavingsBadge() {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [d, setD] = useState(null);
  const [hist, setHist] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = () => {
      aiApi.savings().then((x) => { if (alive) setD(x); }).catch(() => {});
      aiApi.savingsHistory(6).then((x) => { if (alive) setHist((x && x.history) || []); }).catch(() => {});
    };
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (!d) return null;
  const opt = d.optimized_calls || 0;
  const maxPct = Math.max(1, ...hist.map((h) => h.saved_pct || 0));

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

      {hist.length > 1 && (
        <div data-testid="savings-history" className="mt-3 pt-3 border-t border-[#3E9C93]/15">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#64748B] mb-2">
            {tri("Storico mensile", "Monatsverlauf", "Monthly history", "Historial mensual", "Historique mensuel", "تاریخچه ماهانه")}
          </p>
          <div className="flex items-end gap-2 h-16">
            {hist.map((h, i) => {
              const mm = (h.month || "").slice(5, 7);
              const heightPct = Math.round(((h.saved_pct || 0) / maxPct) * 100);
              return (
                <div key={h.month || i} data-testid={`savings-bar-${i}`} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="w-full flex items-end justify-center" style={{ height: 44 }}>
                    <div className="w-4 sm:w-5 rounded-t bg-[#3E9C93]/70" style={{ height: `${Math.max(6, heightPct)}%` }} title={`-${h.saved_pct || 0}%`} />
                  </div>
                  <span className="text-[9px] font-bold text-[#3E9C93]">-{h.saved_pct || 0}%</span>
                  <span className="text-[9px] text-[#64748B]">{MONTHS[mm] || mm}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {opt > 0 && (
        <p className="mt-2 text-[10px] text-[#64748B]">
          {tri(`${opt} chiamate ottimizzate invece del modello premium.`, `${opt} optimierte Aufrufe statt Premium-Modell.`, `${opt} calls optimized instead of the premium model.`, `${opt} llamadas optimizadas en vez del modelo premium.`, `${opt} appels optimisés au lieu du modèle premium.`, `${opt} فراخوان بهینه به‌جای مدل پریمیوم.`)}
        </p>
      )}
    </div>
  );
}
