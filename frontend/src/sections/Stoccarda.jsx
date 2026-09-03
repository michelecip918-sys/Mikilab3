import { useState, useEffect } from "react";
import { MapPin, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { newsApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

export default function Stoccarda() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const REGIONS = ["all", "stoccarda", "germania", "italia"];
  const regionLabel = (r) => (r === "all" ? t("region_all") : t(`region_${r}`));

  const load = async () => {
    setLoading(true);
    try { setItems(await newsApi.list()); }
    catch { setItems([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const shown = filter === "all" ? items : items.filter((a) => (a.region || "stoccarda") === filter);

  return (
    <div className="space-y-4 mb-5">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-2xl shadow-md border border-amber-900/40 bg-[#F26419]/15 border border-[#F26419]/30 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-[#F26419]" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8] leading-none">{t("tab_stoccarda")}</h2>
          <p className="text-xs text-[#7E8A93] mt-0.5">{t("news_auto_sub")}</p>
        </div>
        <button data-testid="news-refresh" onClick={load} className="p-2 rounded-lg text-[#F26419] hover:bg-[#F26419]/10" aria-label="refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {REGIONS.map((r) => (
          <button key={r} data-testid={`news-filter-${r}`} onClick={() => setFilter(r)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === r ? "bg-[#F26419] text-white border-[#F26419]" : "bg-white dark:bg-[#18202E] text-[#3F4A54] dark:text-[#AEB8BF] border-[#26324A] dark:border-[#26324A]"}`}>
            {regionLabel(r)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#7E8A93] py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> {t("news_loading")}
        </div>
      ) : shown.length === 0 ? (
        <p data-testid="news-empty" className="text-sm text-[#7E8A93] text-center py-6">{t("news_empty")}</p>
      ) : (
        <div className="space-y-2.5" data-testid="news-list">
          {shown.map((a, i) => (
            <a key={i} href={a.link || "#"} target="_blank" rel="noopener noreferrer"
              data-testid={`news-item-${i}`}
              className="block bg-white dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl p-4 hover:border-[#F26419]/50 transition-colors">
              <div className="flex items-start gap-2">
                <span className="mt-1 shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#F26419]/12 text-[#F26419] dark:text-[#a9d2ec] border border-[#F26419]/25">{t(`region_${a.region || "stoccarda"}`)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#2B303B] dark:text-[#e4eff8] leading-snug">{a.title}</p>
                  {a.details ? <p className="text-xs text-[#7E8A93] mt-1 flex items-center gap-1">{a.details} <ExternalLink className="w-3 h-3" /></p> : null}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
