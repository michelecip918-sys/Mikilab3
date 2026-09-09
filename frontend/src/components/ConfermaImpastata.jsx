import { useState, useEffect } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { warehouseApi, recipesApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";

const g2kg = (g) => Math.round(((Number(g) || 0) / 1000) * 100) / 100;

// Conferma impastata REALE: scarica le materie prime dal magazzino via /consume.
// Modalità "da ricetta" (usa flour/sourdough/salt grams reali) o manuale (peso impasto).
export default function ConfermaImpastata() {
  const [recipes, setRecipes] = useState([]);
  const [sel, setSel] = useState("manual");
  const [batches, setBatches] = useState(1);
  const [doughKg, setDoughKg] = useState(20);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      recipesApi.list("mikilab").catch(() => []),
      recipesApi.list("personal").catch(() => []),
    ]).then(([a, b]) => setRecipes([...(a || []), ...(b || [])]));
  }, []);

  const recipe = recipes.find((r) => r.id === sel);

  // Materie stimate da scaricare in base alla selezione.
  const buildItems = () => {
    if (recipe) {
      const n = Math.max(1, Number(batches) || 1);
      const out = [];
      if (recipe.flour_grams) out.push({ name: recipe.flour_type || "Farina", kg: g2kg(recipe.flour_grams * n), kind: "farina" });
      if (recipe.sourdough_grams) out.push({ name: "Lievito", kg: g2kg(recipe.sourdough_grams * n), kind: "ingrediente" });
      if (recipe.salt_grams) out.push({ name: "Sale", kg: g2kg(recipe.salt_grams * n), kind: "ingrediente" });
      return out;
    }
    const kg = Math.max(0, Number(doughKg) || 0);
    return [
      { name: "Farina", kg: Math.round(kg * 0.62 * 100) / 100, kind: "farina" },
      { name: "Lievito", kg: Math.round(kg * 0.04 * 100) / 100, kind: "ingrediente" },
    ];
  };

  const preview = buildItems();
  const label = recipe ? (recipe.name || "Ricetta") : "impasto manuale";

  const confirm = async () => {
    const items = preview.filter((i) => i.kg > 0);
    if (items.length === 0) { toast.error("Nessuna materia da scaricare"); return; }
    setBusy(true);
    try {
      const res = await warehouseApi.consume(items);
      window.dispatchEvent(new CustomEvent("mikilab-warehouse-changed"));
      const shortfalls = ((res && res.shortfalls) || []).filter((s) => s && s.missing != null);
      if (shortfalls.length > 0) {
        const names = shortfalls.map((s) => s.name).join(", ");
        toast.warning(`Impastata confermata ma scorte insufficienti: ${names}`);
        try { playTTS(`Impastata confermata. Attenzione, scorte insufficienti per ${names}.`); } catch { /* */ }
      } else {
        toast.success(`Impasto confermato (${label}): magazzino scaricato in automatico.`);
        try { playTTS(`Impasto ${label} confermato. Magazzino aggiornato.`); } catch { /* */ }
      }
    } catch {
      toast.error("Scarico scorte non riuscito");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="conferma-impastata" className="p-3 rounded-xl bg-[#030712] border border-[#D95200]/30 space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          data-testid="conferma-impastata-recipe"
          value={sel}
          onChange={(e) => setSel(e.target.value)}
          className="flex-1 bg-[#0b0f19] border border-[#334155] rounded-lg px-2.5 py-2 text-xs text-white focus:border-[#D95200] outline-none"
        >
          <option value="manual">— Manuale (peso impasto) —</option>
          {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        {recipe ? (
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-[#94A3B8] whitespace-nowrap">Impastate</label>
            <input data-testid="conferma-impastata-batches" type="number" min="1" step="1" value={batches} onChange={(e) => setBatches(e.target.value)} className="w-16 bg-[#0b0f19] border border-[#334155] rounded-lg px-2.5 py-2 text-xs text-white focus:border-[#D95200] outline-none" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-[#94A3B8] whitespace-nowrap">Peso (kg)</label>
            <input data-testid="conferma-impastata-kg" type="number" min="0" step="0.5" value={doughKg} onChange={(e) => setDoughKg(e.target.value)} className="w-20 bg-[#0b0f19] border border-[#334155] rounded-lg px-2.5 py-2 text-xs text-white focus:border-[#D95200] outline-none" />
          </div>
        )}
      </div>

      {preview.length > 0 && (
        <p className="text-[10px] text-[#64748B]" data-testid="conferma-impastata-preview">
          Scarico previsto: {preview.map((i) => `${i.name} ${i.kg}kg`).join(" · ")}
        </p>
      )}

      <button
        data-testid="conferma-impastata-btn"
        onClick={confirm}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#D95200] to-[#0d9488] text-[#030712] font-extrabold text-xs rounded-xl shadow-lg shadow-[#D95200]/20 disabled:opacity-50 active:scale-95 transition-all"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Conferma Impastata & Scarico Scorte
      </button>
    </div>
  );
}
