import { useEffect, useState } from "react";
import { Sparkles, Bell } from "lucide-react";
import { atelierApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Widget che il Capo ha condiviso col reparto — sola lettura sul tablet operai.
export default function SharedWidgets({ dept = "" }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [widgets, setWidgets] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = () => atelierApi.shared(dept).then((d) => { if (alive) setWidgets(d.widgets || []); }).catch(() => {});
    load(); const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [dept]);

  if (!widgets.length) return null;

  return (
    <div data-testid="shared-widgets" className="rounded-2xl border border-[#a6b1bc]/25 bg-[#0C1019]/50 p-4 space-y-2.5">
      <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#a6b1bc]">
        <Sparkles className="w-4 h-4" /> {tri("Dal Capo · condiviso", "Vom Chef · geteilt", "From the Capo · shared", "Del Capo · compartido", "Du Capo · partagé", "از کاپو · اشتراکی")}
      </p>
      {widgets.map((w) => (
        <div key={w.id} data-testid={`shared-widget-${w.id}`} className="rounded-xl bg-[#060A10] border border-[#1e293b] p-3">
          <p className="text-[13px] font-bold text-white mb-1.5">{w.title}</p>
          {w.type === "note" && <p className="text-[12px] text-[#CBD5E1] whitespace-pre-wrap">{w.config.text}</p>}
          {w.type === "metric" && <p className="text-xl font-black text-[#a6b1bc]">{w.config.value || "—"} <span className="text-xs text-[#94A3B8]">{w.config.unit}</span></p>}
          {w.type === "reminder" && <p className="text-[12px] text-[#CBD5E1] flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-[#9aa6b2]" />{w.config.text}{w.config.date ? ` · ${w.config.date}` : ""}</p>}
          {w.type === "counter" && <p className="text-xl font-black text-[#a6b1bc]">{w.config.value || 0} <span className="text-xs text-[#94A3B8]">{w.config.label}</span></p>}
          {w.type === "checklist" && (
            <ul className="space-y-1">
              {(w.config.items || []).map((it, k) => <li key={k} className={`text-[12px] ${it.done ? "line-through text-[#64748B]" : "text-[#CBD5E1]"}`}>• {it.t}</li>)}
            </ul>
          )}
          {w.type === "chart" && (() => {
            const s = w.config.series || []; const max = Math.max(1, ...s.map((p) => Number(p.v) || 0));
            return (
              <div className="flex items-end gap-1.5 h-20">
                {s.map((p, k) => (
                  <div key={k} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-[9px] text-[#a6b1bc] font-bold">{Number(p.v) || 0}</span>
                    <div className="w-full rounded-t" style={{ height: `${Math.max(4, ((Number(p.v) || 0) / max) * 100)}%`, background: "linear-gradient(180deg,#a6b1bc,#8a97a6)" }} />
                    <span className="text-[9px] text-[#64748B] mt-0.5">{p.d}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      ))}
    </div>
  );
}
