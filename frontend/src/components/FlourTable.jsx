import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table2, ChevronDown } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Tabella Farine unificata: UNA riga per tipo di farina con sigla DE · nome IT, W (forza) e proteine.
const FLOURS = [
  ["Weizen 405 · Farina 00", "90–180 W", "9–11%", "diretto"],
  ["Weizen 550 · Farina 0", "180–260 W", "11–13%", "diretto"],
  ["Weizen 812 · Farina 1", "250–320 W", "12–14%", "diretto/indiretto"],
  ["Weizen 1050 · Farina 2", "220–300 W", "13–14%", "indiretto"],
  ["Dinkel 630 · Farro", "150–220 W", "12–13%", "indiretto"],
  ["Roggen 1150 · Segale", "—", "8–10%", "indiretto"],
  ["Vollkorn · Integrale", "180–280 W", "13–15%", "indiretto"],
  ["Hartweizen · Semola", "200–300 W", "12–15%", "diretto/indiretto"],
];
const SIGNS = [
  ["H2O", "Acqua", "Wasser", "Water"],
  ["IDR", "Idratazione %", "Hydration %", "Hydration %"],
  ["LM", "Lievito Madre", "Sauerteig", "Sourdough starter"],
  ["LB", "Lievito di birra", "Hefe", "Baker's yeast"],
  ["LiCoLi", "Lievito liquido", "Flüssighefe", "Liquid starter"],
  ["Puntata", "Puntata (massa)", "Stockgare", "Bulk fermentation"],
  ["Appretto", "Appretto", "Stückgare", "Final proof"],
  ["TA", "Temp. ambiente", "Raumtemperatur", "Room temperature"],
];

export default function FlourTable({ embedded = false }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [open, setOpen] = useState(embedded);

  const th = "text-left text-[10px] font-bold uppercase tracking-wide text-[#3E9C93] px-2 py-1.5";
  const td = "px-2 py-1.5 text-xs text-[#2B303B] dark:text-[#e4eff8] border-t border-[#e4eff8] dark:border-[#2A3B49]";

  const body = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase text-[#1B2A38] mb-1.5">{tri("Farine — una riga per tipo (sigla DE · nome IT)", "Mehle — eine Zeile pro Typ", "Flours — one row per type")}</p>
        <div className="overflow-x-auto rounded-2xl shadow-md border border-amber-900/40 border border-[#2A3B49] dark:border-[#2A3B49]">
          <table className="w-full border-collapse">
            <thead className="bg-[#0D1520] dark:bg-[#1B2A38]">
              <tr><th className={th}>{tri("Tipo (DE · IT)", "Typ (DE · IT)", "Type (DE · IT)")}</th><th className={th}>W {tri("(forza)", "(Stärke)", "(strength)")}</th><th className={th}>{tri("Proteine", "Protein", "Protein")}</th><th className={th}>{tri("Metodo", "Methode", "Method")}</th></tr>
            </thead>
            <tbody>
              {FLOURS.map((r, i) => (
                <tr key={i} className={i % 2 ? "bg-[#0D1520]/50 dark:bg-[#1B2A38]/50" : ""}>
                  <td className={td + " font-semibold"}>{r[0]}</td>
                  <td className={td + " font-mono-data"}>{r[1]}</td>
                  <td className={td + " font-mono-data"}>{r[2]}</td>
                  <td className={td + " text-[#7E8A93]"}>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase text-[#1B2A38] mb-1.5">{tri("Abbreviazioni d'impasto", "Teig-Abkürzungen", "Dough abbreviations")}</p>
        <div className="overflow-x-auto rounded-2xl shadow-md border border-amber-900/40 border border-[#2A3B49] dark:border-[#2A3B49]">
          <table className="w-full border-collapse">
            <thead className="bg-[#0D1520] dark:bg-[#1B2A38]">
              <tr><th className={th}>{tri("Sigla", "Kürzel", "Code")}</th><th className={th}>🇮🇹 IT</th><th className={th}>🇩🇪 DE</th><th className={th}>🌍 EN</th></tr>
            </thead>
            <tbody>
              {SIGNS.map((r, i) => (
                <tr key={i} className={i % 2 ? "bg-[#0D1520]/50 dark:bg-[#1B2A38]/50" : ""}>
                  <td className={td + " font-mono-data font-semibold"}>{r[0]}</td>
                  <td className={td}>{r[1]}</td><td className={td}>{r[2]}</td><td className={td}>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl shadow-md border border-amber-900/40 bg-[#3E9C93]/12 border border-[#3E9C93]/30 p-3 text-xs text-[#3E9C93] dark:text-[#8FB0C2] leading-relaxed">
        ⚠️ {tri(
          "Nota del Maestro: nel sistema tedesco il 630 è il FARRO (Dinkel), mentre il 550 è il GRANO (Weizen). Le ricette con 630 (farro) e con farine ad alta estrazione sono quasi sempre IMPASTI INDIRETTI (con prefermento/lievito madre); alcune usano un tocco di aceto/acido per dare struttura al glutine più debole del farro.",
          "Meister-Hinweis: Im deutschen System ist 630 der DINKEL, während 550 der WEIZEN ist. Rezepte mit 630 (Dinkel) und hoch ausgemahlenen Mehlen sind fast immer INDIREKTE TEIGE (mit Vorteig/Sauerteig); manche nutzen etwas Essig/Säure, um dem schwächeren Dinkelkleber Struktur zu geben.",
          "Master's note: in the German system 630 means SPELT (Dinkel), while 550 means WHEAT (Weizen). Recipes with 630 (spelt) and high-extraction flours are almost always INDIRECT DOUGHS (with a preferment/sourdough); some use a touch of vinegar/acid to give structure to spelt's weaker gluten.")}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div data-testid="flour-table" className="pb-24">
        <div className="flex items-center gap-2 mb-3 text-[#3E9C93]">
          <Table2 className="w-5 h-5" />
          <h1 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Tabella Farine & Sigle", "Mehl- & Kürzel-Tabelle", "Flour & Codes Table")}</h1>
        </div>
        {body}
      </div>
    );
  }

  return (
    <div data-testid="flour-table" className="mb-4 rounded-2xl bg-white dark:bg-[#1B2A38] border border-[#2A3B49] dark:border-[#2A3B49] overflow-hidden">
      <button data-testid="flour-table-toggle" onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-4 py-3 text-left">
        <Table2 className="w-5 h-5 text-[#3E9C93]" />
        <span className="font-display text-sm font-bold text-[#2B303B] dark:text-[#e4eff8] flex-1">{tri("Tabella Farine & Sigle (DE / IT / EN)", "Mehl- & Kürzel-Tabelle", "Flour & Codes Table")}</span>
        <ChevronDown className={`w-4 h-4 text-[#7E8A93] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4">{body}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
