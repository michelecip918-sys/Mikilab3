import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { warehouseApi } from "@/lib/api";
import { playTTS } from "@/lib/tts";

// Conferma impastata REALE: scarica in automatico le materie prime dal magazzino via /consume.
export default function ConfermaImpastata({ recipeName = "Pane di Matera Tradizionale", defaultFlour = "Farina" }) {
  const [busy, setBusy] = useState(false);
  const [doughKg, setDoughKg] = useState(20);

  const confirm = async () => {
    const kg = Math.max(0, Number(doughKg) || 0);
    if (kg <= 0) { toast.error("Inserisci i kg dell'impasto"); return; }
    setBusy(true);
    try {
      // Ripartizione tecnica indicativa: ~62% farina, ~4% lievito madre del peso impasto.
      const items = [
        { name: defaultFlour, kg: Math.round(kg * 0.62 * 100) / 100, kind: "farina" },
        { name: "Lievito", kg: Math.round(kg * 0.04 * 100) / 100, kind: "ingrediente" },
      ];
      const res = await warehouseApi.consume(items);
      window.dispatchEvent(new CustomEvent("mikilab-warehouse-changed"));
      // Solo le materie realmente insufficienti (campo `missing`) generano un avviso;
      // le materie non tracciate a magazzino (reason "not_found") vengono ignorate.
      const shortfalls = ((res && res.shortfalls) || []).filter((s) => s && s.missing != null);
      if (shortfalls.length > 0) {
        const names = shortfalls.map((s) => s.name).join(", ");
        toast.warning(`Impastata confermata ma scorte insufficienti: ${names}`);
        try { playTTS(`Impastata confermata. Attenzione, scorte insufficienti per ${names}.`); } catch { /* */ }
      } else {
        toast.success(`Impasto confermato (${recipeName}): magazzino scaricato in automatico.`);
        try { playTTS(`Impasto ${recipeName} confermato. Magazzino aggiornato.`); } catch { /* */ }
      }
    } catch {
      toast.error("Scarico scorte non riuscito");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="conferma-impastata" className="p-3 rounded-xl bg-[#030712] border border-[#14b8a6]/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <div className="flex items-center gap-2 flex-1">
        <label className="text-[11px] font-bold text-[#94A3B8] whitespace-nowrap">Peso impasto (kg)</label>
        <input
          data-testid="conferma-impastata-kg"
          type="number" min="0" step="0.5" value={doughKg}
          onChange={(e) => setDoughKg(e.target.value)}
          className="w-20 bg-[#0b0f19] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#14b8a6] outline-none"
        />
      </div>
      <button
        data-testid="conferma-impastata-btn"
        onClick={confirm}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-[#030712] font-extrabold text-xs rounded-xl shadow-lg shadow-[#14b8a6]/20 disabled:opacity-50 active:scale-95 transition-all"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Conferma Impastata & Scarico Scorte
      </button>
    </div>
  );
}
