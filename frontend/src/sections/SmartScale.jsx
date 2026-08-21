import { useState, useEffect } from "react";
import { Scale, Bluetooth, Plus, Trash2, RotateCcw, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";

const STORE = "mikilab_scale_recipe";
const TOL = 0.02; // ±2%

const DEFAULT_ROWS = [
  { id: 1, name: "Farina", target: 1000, actual: "" },
  { id: 2, name: "Acqua", target: 600, actual: "" },
  { id: 3, name: "Sale", target: 20, actual: "" },
  { id: 4, name: "Lievito", target: 10, actual: "" },
];

export default function SmartScale() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const [rows, setRows] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(STORE)); if (Array.isArray(s) && s.length) return s; } catch { /* */ }
    return DEFAULT_ROWS;
  });
  const [btBusy, setBtBusy] = useState(false);

  useEffect(() => { localStorage.setItem(STORE, JSON.stringify(rows)); }, [rows]);

  const setRow = (id, patch) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { id: Date.now(), name: "", target: 0, actual: "" }]);
  const delRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  const resetActual = () => setRows((rs) => rs.map((r) => ({ ...r, actual: "" })));

  // Pivot = ingrediente pesato con lo scostamento maggiore (oltre la tolleranza).
  let pivot = null, maxDev = 0;
  rows.forEach((r) => {
    const t = Number(r.target), a = Number(r.actual);
    if (t > 0 && a > 0) {
      const dev = Math.abs(a / t - 1);
      if (dev > maxDev) { maxDev = dev; pivot = r; }
    }
  });
  const recalc = pivot && maxDev > TOL;
  const R = recalc ? Number(pivot.actual) / Number(pivot.target) : 1;
  const adjusted = (r) => (recalc ? (r.id === pivot.id ? Number(r.actual) : Math.round(Number(r.target) * R * 10) / 10) : Number(r.target));

  const connectBt = async () => {
    if (!navigator.bluetooth) {
      toast.info(tri("Bluetooth non disponibile: inserisci i pesi a mano.", "Bluetooth nicht verfügbar: Gewichte manuell eingeben.", "Bluetooth unavailable: enter weights manually."));
      return;
    }
    setBtBusy(true);
    try {
      await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ["weight_scale"] });
      toast.success(tri("Bilancia collegata. Se non arrivano dati, inserisci a mano.", "Waage verbunden. Falls keine Daten, manuell eingeben.", "Scale connected. If no data, enter manually."));
    } catch {
      toast.info(tri("Nessuna bilancia selezionata: inserimento manuale.", "Keine Waage gewählt: manuelle Eingabe.", "No scale selected: manual entry."));
    } finally { setBtBusy(false); }
  };

  return (
    <div className="pb-40">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#6E8CA0] flex items-center justify-center"><Scale className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#EAF0EC]">{tri("Bilancia Smart", "Smarte Waage", "Smart Scale")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("Ricalcola tutto se sbagli una pesata (>±2%)", "Rechnet alles neu bei Wiegefehler (>±2%)", "Recalculates everything on a weigh error (>±2%)")}</p>
        </div>
      </div>

      <button data-testid="scale-bt-btn" onClick={connectBt} disabled={btBusy}
        className="w-full mb-4 bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] text-[#2B303B] dark:text-[#EAF0EC] font-semibold px-4 py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
        <Bluetooth className="w-5 h-5 text-[#3F7CAC]" /> {tri("Collega bilancia (Bluetooth)", "Waage verbinden (Bluetooth)", "Connect scale (Bluetooth)")}
      </button>

      {/* Tabella ingredienti */}
      <div className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] overflow-hidden">
        <div className="grid grid-cols-[1fr_72px_72px_28px] gap-1 px-3 py-2 bg-[#EAF0EC] dark:bg-[#2A323A] text-[10px] font-bold uppercase tracking-wide text-[#5E8B7E]">
          <span>{tri("Ingrediente", "Zutat", "Ingredient")}</span>
          <span className="text-right">{tri("Target g", "Ziel g", "Target g")}</span>
          <span className="text-right">{tri("Reale g", "Ist g", "Actual g")}</span>
          <span />
        </div>
        {rows.map((r) => {
          const t = Number(r.target), a = Number(r.actual);
          const dev = t > 0 && a > 0 ? a / t - 1 : 0;
          const off = Math.abs(dev) > TOL && a > 0;
          return (
            <div key={r.id} data-testid={`scale-row-${r.id}`} className="grid grid-cols-[1fr_72px_72px_28px] gap-1 px-3 py-1.5 border-t border-[#D7E1DB] dark:border-[#38424B] items-center">
              <input value={r.name} onChange={(e) => setRow(r.id, { name: e.target.value })} placeholder={tri("nome", "Name", "name")}
                className="bg-transparent text-sm text-[#2B303B] dark:text-[#EAF0EC] outline-none" />
              <input type="number" value={r.target} onChange={(e) => setRow(r.id, { target: e.target.value })}
                className="bg-[#F6F8F5] dark:bg-[#1F252B] rounded-lg px-2 py-1 text-sm text-right font-mono-data outline-none" />
              <input data-testid={`scale-actual-${r.id}`} type="number" value={r.actual} onChange={(e) => setRow(r.id, { actual: e.target.value })} placeholder="—"
                className={`rounded-lg px-2 py-1 text-sm text-right font-mono-data outline-none ${off ? "bg-[#C0574D]/15 text-[#C0574D] font-bold" : "bg-[#F6F8F5] dark:bg-[#1F252B]"}`} />
              <button data-testid={`scale-del-${r.id}`} onClick={() => delRow(r.id)} className="text-[#C0574D] flex justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          );
        })}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#D7E1DB] dark:border-[#38424B]">
          <button data-testid="scale-add-row" onClick={addRow} className="text-xs font-semibold text-[#5E8B7E] flex items-center gap-1"><Plus className="w-4 h-4" /> {tri("Aggiungi", "Hinzufügen", "Add")}</button>
          <button data-testid="scale-reset" onClick={resetActual} className="text-xs text-[#7E8A93] flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> {tri("Azzera pesate", "Wiegungen zurücksetzen", "Reset weights")}</button>
        </div>
      </div>

      {/* Risultato ricalcolo */}
      {recalc ? (
        <div data-testid="scale-result" className="mt-4 rounded-2xl bg-[#D99B26]/10 border border-[#6E8CA0]/40 p-4">
          <p className="flex items-center gap-2 font-bold text-[#33564E] dark:text-[#8FB0C2] mb-1">
            <AlertTriangle className="w-5 h-5 text-[#C0574D]" /> {tri("Scostamento", "Abweichung", "Deviation")} {(R > 1 ? "+" : "")}{Math.round((R - 1) * 1000) / 10}% · {pivot.name || tri("ingrediente", "Zutat", "ingredient")}
          </p>
          <p className="text-xs text-[#7E8A93] mb-3">{tri("Hai messo troppo/poco: ho riproporzionato TUTTA la ricetta per mantenerla equilibrata.", "Zu viel/zu wenig: Ich habe das GANZE Rezept neu proportioniert.", "Too much/little: I re-proportioned the WHOLE recipe to keep it balanced.")}</p>
          <div className="space-y-1">
            {rows.filter((r) => r.name.trim() && Number(r.target) > 0).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-[#3F4A54] dark:text-[#AEB8BF]">{r.name || "—"}</span>
                <span className={`font-mono-data font-semibold ${r.id === pivot.id ? "text-[#C0574D]" : "text-[#5E8B7E]"}`}>
                  {adjusted(r)} g {r.id === pivot.id ? "✓" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        pivot && (
          <div data-testid="scale-ok" className="mt-4 rounded-2xl bg-[#6B8E62]/12 border border-[#6B8E62]/30 p-3 flex items-center gap-2 text-sm text-[#4d6b45] dark:text-[#9ec48f] font-semibold">
            <Check className="w-5 h-5" /> {tri("Pesata nella tolleranza (±2%): tutto ok!", "Wiegung in Toleranz (±2%): alles ok!", "Weigh within tolerance (±2%): all good!")}
          </div>
        )
      )}
    </div>
  );
}
