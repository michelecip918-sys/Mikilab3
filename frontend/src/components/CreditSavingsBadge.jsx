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
  const [open, setOpen] = useState(false);

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
    <div data-testid="credit-savings-badge" className="rounded-2xl border border-primary/30 bg-primary/8 p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <PiggyBank className="w-4 h-4 text-primary" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">
          {tri("Risparmio crediti · questo mese", "Kreditersparnis · dieser Monat", "Credit savings · this month", "Ahorro de créditos · este mes", "Économies de crédits · ce mois", "صرفه‌جویی اعتبار · این ماه")}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span data-testid="savings-pct" className="text-2xl font-black text-foreground leading-none">-{d.saved_pct || 0}%</span>
        <span className="text-[11px] text-muted-foreground mb-0.5">
          {tri("sui costi IA", "der KI-Kosten", "on AI cost", "en coste IA", "sur le coût IA", "از هزینه هوش مصنوعی")}
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted/15 text-foreground px-2.5 py-1" data-testid="savings-fast">
          <Zap className="w-3 h-3 text-primary" /> {d.fast_calls || 0} {tri("su modello economico", "günstiges Modell", "on cheap model", "modelo económico", "modèle éco", "مدل اقتصادی")}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted/15 text-foreground px-2.5 py-1" data-testid="savings-cache">
          <Database className="w-3 h-3 text-primary" /> {d.cache_hits || 0} {tri("riuso dalla cache", "aus Cache", "cache reuse", "reuso caché", "réutilisé du cache", "بازاستفاده کش")}
        </span>
      </div>

      {hist.length > 1 && (
        <div data-testid="savings-history" className="mt-3 pt-3 border-t border-primary/15">
          <button data-testid="savings-history-toggle" onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-1.5 mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground hover:text-muted-foreground">
            {tri("Storico mensile", "Monatsverlauf", "Monthly history", "Historial mensual", "Historique mensuel", "تاریخچه ماهانه")}
            <span className="ml-auto text-primary">{open ? tri("nascondi", "verbergen", "hide", "ocultar", "cacher", "پنهان") : tri("dettagli", "Details", "details", "detalles", "détails", "جزئیات")}</span>
          </button>
          <div className="flex items-end gap-2 h-16">
            {hist.map((h, i) => {
              const mm = (h.month || "").slice(5, 7);
              const heightPct = Math.round(((h.saved_pct || 0) / maxPct) * 100);
              return (
                <div key={h.month || i} data-testid={`savings-bar-${i}`} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="w-full flex items-end justify-center" style={{ height: 44 }}>
                    <div className="w-4 sm:w-5 rounded-t bg-primary/70" style={{ height: `${Math.max(6, heightPct)}%` }} title={`-${h.saved_pct || 0}%`} />
                  </div>
                  <span className="text-[9px] font-bold text-primary">-{h.saved_pct || 0}%</span>
                  <span className="text-[9px] text-muted-foreground">{MONTHS[mm] || mm}</span>
                </div>
              );
            })}
          </div>
          {open && (
            <div data-testid="savings-history-detail" className="mt-3 space-y-1.5">
              {[...hist].reverse().map((h, i) => {
                const mm = (h.month || "").slice(5, 7);
                return (
                  <div key={h.month || i} className="flex items-center gap-2 text-[11px] rounded-lg bg-background/60 border border-border px-2.5 py-1.5">
                    <span className="text-foreground font-bold w-14">{MONTHS[mm] || mm} {(h.month || "").slice(0, 4)}</span>
                    <span className="text-primary font-black">-{h.saved_pct || 0}%</span>
                    <span className="ml-auto text-muted-foreground">{h.optimized_calls || 0} {tri("ottimizz.", "opt.", "optimized", "optim.", "optim.", "بهینه")}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {opt > 0 && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          {tri(`${opt} chiamate ottimizzate invece del modello premium.`, `${opt} optimierte Aufrufe statt Premium-Modell.`, `${opt} calls optimized instead of the premium model.`, `${opt} llamadas optimizadas en vez del modelo premium.`, `${opt} appels optimisés au lieu du modèle premium.`, `${opt} فراخوان بهینه به‌جای مدل پریمیوم.`)}
        </p>
      )}
    </div>
  );
}
