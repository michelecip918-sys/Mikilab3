import { X, Flag, CalendarDays } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import CategoryRecipePicker from "@/components/CategoryRecipePicker";

const DAYS = ["", "lun", "mar", "mer", "gio", "ven", "sab", "dom"];

// Una riga prodotto del Laboratorio (ricetta + quantità + opzioni + chip giorno).
export default function CapoProductRow({ p, i, recipes, setProducts }) {
  const { t, lang } = useLang();
  const tri3 = (it, de, en, es) => mkTri(lang)(it, de, en, es);
  const patch = (fn) => setProducts((l) => l.map((x, k) => (k === i ? fn(x) : x)));

  return (
    <div className="bg-white dark:bg-[#181818] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-2xl shadow-md border border-amber-900/40 p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <CategoryRecipePicker recipes={recipes} value={p.recipe_id || ""}
            onChange={(e) => { const r = recipes.find((x) => x.id === e.target.value); patch((x) => ({ ...x, recipe_id: e.target.value, name: r ? r.name : x.name })); }}
            testid={`capo-product-recipe-${i}`} />
        </div>
        <button data-testid={`capo-product-del-${i}`} onClick={() => setProducts((l) => l.filter((_, k) => k !== i))} className="text-[#c94f00] p-1 shrink-0"><X className="w-4 h-4" /></button>
      </div>
      {p.day && (
        <button type="button" data-testid={`capo-product-daychip-${i}`}
          onClick={() => patch((x) => ({ ...x, _opts: true }))}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#c94f00] bg-[#c94f00]/12 border border-[#c94f00]/30 rounded-full pl-2 pr-2.5 py-1 active:scale-95 transition-all">
          <CalendarDays className="w-3.5 h-3.5" /> {t(`day_${p.day}`)}
        </button>
      )}
      {p.recipe_id && (
        <button type="button" data-testid={`capo-product-start-${i}`}
          onClick={() => setProducts((l) => l.map((x, k) => ({ ...x, start: k === i ? !x.start : false })))}
          className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg border transition-all active:scale-97 ${
            p.start
              ? "bg-[#1e1e1e] text-white border-[#1e1e1e]"
              : "bg-white dark:bg-[#1e1e1e] text-[#7E8A93] border-[#2e2e2e] dark:border-[#2e2e2e]"}`}>
          <Flag className="w-3.5 h-3.5" />
          {p.start
            ? tri3("Impasto di partenza", "Start-Teig", "Starting dough")
            : tri3("Parti da qui", "Hier starten", "Start here")}
        </button>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input data-testid={`capo-product-qty-${i}`} type="number" value={p.qty} placeholder={tri3("Quantità", "Menge", "Quantity")}
            onChange={(e) => patch((x) => ({ ...x, qty: e.target.value }))}
            className="w-full bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg p-2 pr-12 text-sm outline-none focus:border-[#c94f00]" />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#7E8A93]">{p.unit === "kg" ? "kg" : t("capo_unit_pieces")}</span>
        </div>
        <button type="button" data-testid={`capo-product-opts-${i}`}
          onClick={() => patch((x) => ({ ...x, _opts: !x._opts }))}
          className="shrink-0 text-xs font-semibold text-[#c94f00] px-2.5 py-2 rounded-lg border border-[#2e2e2e] dark:border-[#2e2e2e] active:scale-95 transition-all">
          {p._opts ? tri3("Meno", "Weniger", "Less") : tri3("Opzioni", "Optionen", "Options")}
        </button>
      </div>
      {p._opts && (
        <div className="flex items-center gap-2 flex-wrap">
          <select data-testid={`capo-product-unit-${i}`} value={p.unit}
            onChange={(e) => patch((x) => ({ ...x, unit: e.target.value }))}
            className="w-[80px] shrink-0 bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg p-2 text-sm outline-none focus:border-[#c94f00]">
            <option value="pezzi">{t("capo_unit_pieces")}</option>
            <option value="kg">{t("capo_unit_kg")}</option>
          </select>
          {p.unit === "pezzi" && (
            <div className="relative w-[80px] shrink-0">
              <input data-testid={`capo-product-gpp-${i}`} type="number" value={p.gpp ?? ""} placeholder="g/pz"
                onChange={(e) => patch((x) => ({ ...x, gpp: e.target.value }))}
                className="w-full bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg p-2 pr-6 text-sm outline-none focus:border-[#c94f00]" />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[#7E8A93]">g</span>
            </div>
          )}
          <select data-testid={`capo-product-day-${i}`} value={p.day || ""}
            onChange={(e) => patch((x) => ({ ...x, day: e.target.value }))}
            className="flex-1 min-w-[110px] bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg p-2 text-sm outline-none focus:border-[#c94f00]">
            {DAYS.map((d) => <option key={d} value={d}>{d === "" ? t("capo_day_any") : t(`day_${d}`)}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
