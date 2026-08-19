import { useEffect, useState } from "react";
import { Printer, Tag } from "lucide-react";
import { recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

const ENRICH = new Set(["Zucchero", "Tuorlo", "Burro", "Miele", "Pasta d'arancia", "Miglioratore naturale"]);

function costPerPiece(r) {
  const c = r.costing;
  if (!c) return null;
  const n = (v) => Number(v) || 0;
  const flour = n(r.flour_grams);
  const tot =
    flour / 1000 * n(c.flour_kg) +
    n(r.water_grams) / 1000 * n(c.water_l) +
    n(r.sourdough_grams) / 1000 * n(c.sourdough_kg) +
    n(r.salt_grams) / 1000 * n(c.salt_kg) +
    (c.extras || []).reduce((s, e) => s + n(e.cost), 0) +
    n(c.overhead);
  const pcs = n(c.pieces);
  return pcs > 0 ? tot / pcs : null;
}

export default function PanettoneLabels() {
  const { t } = useLang();
  const [items, setItems] = useState([]);

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

      <button data-testid="labels-print-btn" onClick={() => window.print()}
        className="no-print w-full mb-5 bg-[#B34A26] hover:bg-[#963B1C] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2">
        <Printer className="w-5 h-5" /> {t("labels_print")}
      </button>

      {items.length === 0 ? (
        <p className="no-print text-center text-[#8C7567] py-8">{t("labels_empty")}</p>
      ) : (
        <div className="print-area grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((r) => {
            const susp = (r.extra_ingredients || []).filter((e) => e.name && !ENRICH.has(e.name)).map((e) => e.name);
            const cpp = costPerPiece(r);
            return (
              <div key={r.id} data-testid={`label-${r.id}`}
                className="rounded-2xl border-2 border-[#B34A26] bg-white text-[#2C221E] p-4 flex flex-col items-center text-center break-inside-avoid"
                style={{ pageBreakInside: "avoid" }}>
                <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Mikilab" className="w-14 h-14 rounded-xl object-cover ring-2 ring-[#FFCE00]/70 mb-2" />
                <p className="font-display text-lg font-bold leading-tight">Panettone Mikilab</p>
                <div className="my-1.5 flex items-center gap-1 text-[10px] font-bold tracking-wider">
                  <span className="inline-block w-3 h-2 bg-[#009246]" /><span className="inline-block w-3 h-2 bg-[#CE2B37]" />
                  <span className="px-1">•</span>
                  <span className="inline-block w-3 h-2 bg-black" /><span className="inline-block w-3 h-2 bg-[#FFCE00]" />
                </div>
                <p className="font-display text-xl font-extrabold text-[#B34A26]">{flavor(r.name)}</p>
                {susp.length > 0 && (
                  <p className="text-xs text-[#4A3B34] mt-1.5"><span className="font-semibold">{t("labels_ingredients")}:</span> {susp.join(", ")}</p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-[#6B6157]">
                  <span>{t("labels_net")}</span>
                  {cpp != null && <span className="font-mono-data font-bold text-[#6B8E62]">{t("labels_cost")}: €{cpp.toFixed(2)}</span>}
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
