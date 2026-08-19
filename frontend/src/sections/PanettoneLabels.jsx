import { useEffect, useState } from "react";
import { Printer, Tag } from "lucide-react";
import { recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

const ENRICH = new Set(["Zucchero", "Tuorlo", "Burro", "Miele", "Pasta d'arancia", "Miglioratore naturale"]);

export default function PanettoneLabels() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [view, setView] = useState("labels");

  useEffect(() => {
    (async () => {
      try {
        const mk = await recipesApi.list("mikilab");
        setItems((mk || []).filter((r) => (r.name || "").includes("Panettone Mikilab —")));
      } catch { /* */ }
    })();
  }, []);

  const flavor = (name) => name.split("—")[1]?.trim() || name;

  return (
    <div className="pb-24">
      <div className="no-print relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] p-6 text-white">
        <div className="absolute top-0 left-0 right-0 flex h-1.5">
          <div className="flex-1 bg-[#009246]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#CE2B37]" />
          <div className="flex-1 bg-black" /><div className="flex-1 bg-[#DD0000]" /><div className="flex-1 bg-[#FFCE00]" />
        </div>
        <Tag className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{t("labels_title")}</h1>
        <p className="text-white/85 text-sm mt-1">{t("labels_sub")}</p>
      </div>

      <div className="no-print flex gap-2 mb-3">
        {["labels", "listino"].map((v) => (
          <button key={v} data-testid={`view-${v}`} onClick={() => setView(v)}
            className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${view === v ? "bg-[#B34A26] text-white border-[#B34A26]" : "bg-white dark:bg-[#2A211D] text-[#4A3B34] dark:text-[#C9BBB0] border-[#E8DEC8] dark:border-[#3D302A]"}`}>
            {t(v === "labels" ? "view_labels" : "view_listino")}
          </button>
        ))}
      </div>

      <button data-testid="labels-print-btn" onClick={() => window.print()}
        className="no-print w-full mb-5 bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2">
        <Printer className="w-5 h-5" /> {view === "labels" ? t("labels_print") : t("listino_print")}
      </button>

      <p data-testid="labels-b2b-hint" className="no-print text-xs text-[#8C7567] mb-3 -mt-2">{t("labels_b2b_hint")}</p>

      {items.length === 0 ? (
        <p className="no-print text-center text-[#8C7567] py-8">{t("labels_empty")}</p>
      ) : view === "listino" ? (
        <div className="print-area">
          <div className="rounded-2xl border-2 border-[#B34A26] bg-white text-[#2C221E] overflow-hidden">
            <div className="relative bg-gradient-to-br from-[#B34A26] to-[#8C3A1D] text-white p-5 text-center">
              <div className="absolute top-0 left-0 right-0 flex h-1.5">
                <div className="flex-1 bg-[#008C45]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#CD212A]" />
                <div className="flex-1 bg-black" /><div className="flex-1 bg-[#DD0000]" /><div className="flex-1 bg-[#FFCC00]" />
              </div>
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Mikilab" className="w-14 h-14 rounded-xl object-cover ring-2 ring-[#FFCE00]/70 mx-auto mb-1.5 mt-1" />
              <h2 className="font-display text-2xl font-extrabold">Panettoni Mikilab</h2>
              <p className="text-white/85 text-xs mt-0.5">{t("listino_subtitle")}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5EFE6] text-[#8C3A1D] text-xs uppercase tracking-wide">
                  <th className="text-left p-2.5">{t("listino_col_flavor")}</th>
                  <th className="text-right p-2.5 text-[#008C45]">500 g</th>
                  <th className="text-right p-2.5 text-[#B34A26]">100 g</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const c = r.costing || {};
                  return (
                    <tr key={r.id} data-testid={`listino-${r.id}`} className="border-t border-[#E8DEC8]">
                      <td className="p-2.5 font-semibold">{flavor(r.name)}</td>
                      <td className="p-2.5 text-right font-mono-data font-bold text-[#008C45]">€{Number(c.b2b_500g || 0).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono-data font-bold text-[#B34A26]">€{Number(c.b2b_100g || 0).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-center text-[10px] text-[#8C7567] italic p-3">Il Laboratorio di Michele · Stoccarda 🇮🇹🇩🇪 · mikilab.de</p>
          </div>
        </div>
      ) : (
        <div className="print-area grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((r) => {
            const susp = (r.extra_ingredients || []).filter((e) => e.name && !ENRICH.has(e.name)).map((e) => e.name);
            const c = r.costing || {};
            return (
              <div key={r.id} data-testid={`label-${r.id}`}
                className="rounded-2xl border-2 border-[#B34A26] bg-white text-[#2C221E] p-4 flex flex-col items-center text-center break-inside-avoid"
                style={{ pageBreakInside: "avoid" }}>
                {r.image_url && <img src={r.image_url} alt={r.name} className="w-full h-28 object-cover rounded-xl mb-2 border border-[#E8DEC8]" />}
                <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Mikilab" className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#FFCE00]/70 mb-1.5 -mt-6 bg-white" />
                <p className="font-display text-lg font-bold leading-tight">Panettone Mikilab</p>
                <div className="my-1.5 flex items-center gap-1 text-[10px] font-bold tracking-wider">
                  <span className="inline-block w-3 h-2 bg-[#008C45]" /><span className="inline-block w-3 h-2 bg-[#CD212A]" />
                  <span className="px-1">•</span>
                  <span className="inline-block w-3 h-2 bg-black" /><span className="inline-block w-3 h-2 bg-[#FFCC00]" />
                </div>
                <p className="font-display text-xl font-extrabold text-[#B34A26]">{flavor(r.name)}</p>
                {susp.length > 0 && (
                  <p className="text-xs text-[#4A3B34] mt-1.5"><span className="font-semibold">{t("labels_ingredients")}:</span> {susp.join(", ")}</p>
                )}
                <div className="mt-2.5 grid grid-cols-2 gap-2 w-full">
                  <div className="rounded-lg bg-[#008C45]/10 border border-[#008C45]/30 py-1.5">
                    <p className="text-[9px] uppercase tracking-wide text-[#6B6157]">{t("labels_b2b_500")}</p>
                    <p className="font-mono-data text-base font-extrabold text-[#008C45]">€{Number(c.b2b_500g || 0).toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg bg-[#B34A26]/10 border border-[#B34A26]/30 py-1.5">
                    <p className="text-[9px] uppercase tracking-wide text-[#6B6157]">{t("labels_b2b_100")}</p>
                    <p className="font-mono-data text-base font-extrabold text-[#B34A26]">€{Number(c.b2b_100g || 0).toFixed(2)}</p>
                  </div>
                </div>
                <p className="text-[9px] text-[#8C7567] mt-2 italic">Il Laboratorio di Michele · Stoccarda 🇮🇹🇩🇪</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
