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
        <div className="w-9 h-9 rounded-2xl shadow-md border border-amber-900/40 bg-[#ff6b00]/15 border border-[#ff6b00]/30 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-[#ff6b00]" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-lg font-bold text-[#2B303B] dark:text-[#e4eff8] leading-none">{t("tab_stoccarda")}</h2>
          <p className="text-xs text-[#7E8A93] mt-0.5">{t("news_auto_sub")}</p>
        </div>
        <button data-testid="news-refresh" onClick={load} className="p-2 rounded-lg text-[#ff6b00] hover:bg-[#ff6b00]/10" aria-label="refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {REGIONS.map((r) => (
          <button key={r} data-testid={`news-filter-${r}`} onClick={() => setFilter(r)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === r ? "bg-[#ff6b00] text-white border-[#ff6b00]" : "bg-white dark:bg-[#1e1e1e] text-[#3F4A54] dark:text-[#AEB8BF] border-[#2e2e2e] dark:border-[#2e2e2e]"}`}>
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
              className="block bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl p-4 hover:border-[#ff6b00]/50 transition-colors">
              <div className="flex items-start gap-2">
                <span className="mt-1 shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#ff6b00]/12 text-[#ff6b00] dark:text-[#a9d2ec] border border-[#ff6b00]/25">{t(`region_${a.region || "stoccarda"}`)}</span>
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
