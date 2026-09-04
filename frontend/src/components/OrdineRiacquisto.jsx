import { useState } from "react";
import { ShoppingCart, Copy, Mail, Check } from "lucide-react";
import { toast } from "sonner";

// Ordine di riacquisto automatico: precompila un ordine per le materie sotto/vicine alla soglia.
// Quantità suggerita = riporta la giacenza a 2x la soglia minima.
export default function OrdineRiacquisto({ lowItems = [] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const rows = lowItems.map((i) => {
    const target = Math.max(Number(i.min_kg) * 2, Number(i.min_kg) + 1);
    const suggested = Math.max(0, Math.ceil(target - Number(i.quantity_kg)));
    return { name: i.name, current: Number(i.quantity_kg), unit: i.unit || "kg", suggested };
  }).filter((r) => r.suggested > 0);

  if (rows.length === 0) return null;

  const orderText =
    `Ordine di riacquisto MikiLab\nData: ${new Date().toLocaleDateString("it-IT")}\n\n` +
    rows.map((r) => `• ${r.name}: ${r.suggested} ${r.unit} (giacenza attuale ${r.current} ${r.unit})`).join("\n") +
    `\n\nGrazie,\nMikiLab`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
      toast.success("Ordine copiato negli appunti");
    } catch {
      toast.error("Copia non riuscita");
    }
  };

  const mailto = `mailto:?subject=${encodeURIComponent("Ordine riacquisto MikiLab")}&body=${encodeURIComponent(orderText)}`;

  return (
    <div data-testid="ordine-riacquisto" className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-2">
      <button
        data-testid="ordine-riacquisto-toggle"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 text-xs font-bold text-amber-300"
      >
        <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Ordine di riacquisto pronto ({rows.length})</span>
        <span className="text-[10px] text-amber-400/70">{open ? "Nascondi" : "Mostra"}</span>
      </button>

      {open && (
        <div className="space-y-2">
          <pre data-testid="ordine-riacquisto-text" className="text-[10px] text-[#cbd5e1] whitespace-pre-wrap bg-[#030712] border border-[#1e293b] rounded-lg p-2.5 leading-relaxed">{orderText}</pre>
          <div className="flex gap-2">
            <button data-testid="ordine-riacquisto-copy" onClick={copy} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold bg-[#1e293b] text-white border border-[#334155] hover:border-amber-500 active:scale-95 transition-all">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Copiato" : "Copia ordine"}
            </button>
            <a data-testid="ordine-riacquisto-email" href={mailto} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-[#030712] active:scale-95 transition-all">
              <Mail className="w-3.5 h-3.5" /> Invia al fornitore
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
