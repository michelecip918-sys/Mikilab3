import { useEffect, useState } from "react";
import { Printer, Tag } from "lucide-react";
import { recipesApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";

const ENRICH = new Set(["Zucchero", "Tuorlo", "Burro", "Miele", "Pasta d'arancia", "Miglioratore naturale"]);

export default function PanettoneLabels() {
  const { t, tri } = useLang();
  const [items, setItems] = useState([]);
  const [view, setView] = useState("labels");

  useEffect(() => {
    (async () => {
      try {
        const mk = await recipesApi.list("mikilab");
        setItems((mk || []).filter((r) => (r.name || "").includes("Panettone") || r.menu_category === "panettoni"));
      } catch { /* */ }
    })();
  }, []);

  const flavor = (name) => name.split("—")[1]?.trim() || name;

  return (
    <div className="pb-24">
      <div className="no-print relative rounded-3xl overflow-hidden mb-5 bg-gradient-to-br from-[#5E8B7E] to-[#33564E] p-6 text-white">
        <div className="absolute top-0 left-0 right-0 flex h-1.5">
          <div className="flex-1 bg-[#6B8E62]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#6E8CA0]" />
          <div className="flex-1 bg-black" /><div className="flex-1 bg-[#6E8CA0]" /><div className="flex-1 bg-[#A9C5D4]" />
        </div>
        <Tag className="w-7 h-7 mb-2" />
        <h1 className="font-display text-2xl font-bold">{t("labels_title")}</h1>
        <p className="text-white/85 text-sm mt-1">{t("labels_sub")}</p>
      </div>

      <div className="no-print flex gap-2 mb-3">
        {["labels", "listino"].map((v) => (
          <button key={v} data-testid={`view-${v}`} onClick={() => setView(v)}
            className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${view === v ? "bg-[#5E8B7E] text-white border-[#5E8B7E]" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#D7E1DB] dark:border-[#38424B]"}`}>
            {t(v === "labels" ? "view_labels" : "view_listino")}
          </button>
        ))}
      </div>

      <button data-testid="labels-print-btn" onClick={() => window.print()}
        className="no-print w-full mb-5 bg-[#5E8B7E] hover:bg-[#4C7368] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2">
        <Printer className="w-5 h-5" /> {view === "labels" ? t("labels_print") : t("listino_print")}
      </button>

      <p data-testid="labels-b2b-hint" className="no-print text-xs text-[#7E8A93] mb-3 -mt-2">{t("labels_sub")}</p>

      {items.length === 0 ? (
        <p className="no-print text-center text-[#7E8A93] py-8">{t("labels_empty")}</p>
      ) : view === "listino" ? (
        <div className="print-area">
          <div className="rounded-2xl border-2 border-[#5E8B7E] bg-white text-[#2B303B] overflow-hidden">
            <div className="relative bg-gradient-to-br from-[#5E8B7E] to-[#33564E] text-white p-5 text-center">
              <div className="absolute top-0 left-0 right-0 flex h-1.5">
                <div className="flex-1 bg-[#6B8E62]" /><div className="flex-1 bg-white" /><div className="flex-1 bg-[#6E8CA0]" />
                <div className="flex-1 bg-black" /><div className="flex-1 bg-[#6E8CA0]" /><div className="flex-1 bg-[#A9C5D4]" />
              </div>
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Mikilab" className="w-14 h-14 rounded-xl object-cover ring-2 ring-[#A9C5D4]/70 mx-auto mb-1.5 mt-1" />
              <h2 className="font-display text-2xl font-extrabold">Panettoni Mikilab</h2>
              <p className="text-white/85 text-xs mt-0.5">{t("listino_subtitle")}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#EAF0EC] text-[#33564E] text-xs uppercase tracking-wide">
                  <th className="text-left p-2.5">{t("listino_col_flavor")}</th>
                  <th className="text-right p-2.5 whitespace-nowrap">500 g</th>
                  <th className="text-right p-2.5 whitespace-nowrap">100 g</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const c = r.costing || {};
                  return (
                    <tr key={r.id} data-testid={`listino-${r.id}`} className="border-t border-[#D7E1DB]">
                      <td className="p-2.5 font-semibold">{flavor(r.name)}</td>
                      <td className="p-2.5 text-right font-mono-data">{c.b2b_500g != null ? `€ ${Number(c.b2b_500g).toFixed(2)}` : "—"}</td>
                      <td className="p-2.5 text-right font-mono-data">{c.b2b_100g != null ? `€ ${Number(c.b2b_100g).toFixed(2)}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-center text-[10px] text-[#7E8A93] italic p-3">Il Laboratorio di Michele · Stoccarda 🇮🇹🇩🇪 · mikilab.de</p>
          </div>
        </div>
      ) : (
        <div className="print-area grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((r) => {
            const susp = (r.extra_ingredients || []).filter((e) => e.name && !ENRICH.has(e.name)).map((e) => e.name);
            const sl = susp.join(" ").toLowerCase();
            const alg = [
              tri("glutine (frumento)", "Gluten (Weizen)", "gluten (wheat)"),
              tri("uova", "Eier", "eggs"),
              tri("latte", "Milch", "milk"),
              tri("frutta a guscio (mandorle, nocciole)", "Schalenfrüchte (Mandeln, Haselnüsse)", "tree nuts (almonds, hazelnuts)"),
            ];
            if (sl.includes("pistacch")) alg.push(tri("pistacchi", "Pistazien", "pistachios"));
            if (sl.includes("cocco") || sl.includes("kokos")) alg.push(tri("frutta a guscio (cocco)", "Schalenfrüchte (Kokos)", "tree nuts (coconut)"));
            const allergens = alg.join(", ") + ". " + tri("Può contenere tracce di soia.", "Kann Spuren von Soja enthalten.", "May contain traces of soy.");
            return (
              <div key={r.id} data-testid={`label-${r.id}`}
                className="rounded-2xl border-2 border-[#5E8B7E] bg-white text-[#2B303B] p-4 flex flex-col items-center text-center break-inside-avoid"
                style={{ pageBreakInside: "avoid" }}>
                {r.image_url && <img src={r.image_url} alt={r.name} className="w-full h-28 object-cover rounded-xl mb-2 border border-[#D7E1DB]" />}
                <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Mikilab" className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#A9C5D4]/70 mb-1.5 -mt-6 bg-white" />
                <p className="font-display text-lg font-bold leading-tight">Panettone Artigianale MikiLab</p>
                <div className="my-1.5 flex items-center gap-1 text-[10px] font-bold tracking-wider">
                  <span className="inline-block w-3 h-2 bg-[#6B8E62]" /><span className="inline-block w-3 h-2 bg-[#6E8CA0]" />
                  <span className="px-1">•</span>
                  <span className="inline-block w-3 h-2 bg-black" /><span className="inline-block w-3 h-2 bg-[#A9C5D4]" />
                </div>
                <p className="font-display text-xl font-extrabold text-[#5E8B7E]">{flavor(r.name)}</p>
                {susp.length > 0 && (
                  <p className="text-xs text-[#3F4A54] mt-1.5"><span className="font-semibold">{t("labels_ingredients")}:</span> {susp.join(", ")}</p>
                )}
                <p className="text-[11px] font-bold text-[#33564E] mt-1.5">{tri("Peso netto", "Nettogewicht", "Net weight")}: ~1 kg</p>
                <p data-testid={`label-allergens-${r.id}`} className="text-[10px] text-[#3F4A54] mt-1 leading-snug">
                  <span className="font-semibold uppercase">{tri("Allergeni", "Allergene", "Allergens")}:</span> {allergens}
                </p>
                <p className="text-[9px] text-[#7E8A93] mt-2 italic">Il Laboratorio di Michele · Stoccarda 🇮🇹🇩🇪</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
