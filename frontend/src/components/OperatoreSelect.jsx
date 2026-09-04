import { X } from "lucide-react";

// Selezione OPERATORE attivo: riconosce chi sta lavorando in laboratorio (Capo / Floor).
// Nessuna sezione accademica: solo identità operativa per report, briefing e passaggi di consegna.
const OPERATORI = [
  { id: "michele", name: "Michele", role: "Capo · Lab Control", img: "avatar_miki.jpg", accent: "#14b8a6" },
  { id: "mohamed", name: "Mohamed Reza", role: "Capo Turno · Floor", img: "avatar_mohamed.jpg", accent: "#f59e0b" },
];

export default function OperatoreSelect({ current, onSelect, onClose }) {
  return (
    <div data-testid="operatore-select" className="fixed inset-0 z-[9999] bg-[#030712] overflow-y-auto">
      <div className="max-w-md mx-auto px-5 py-12">
        {onClose && (
          <button data-testid="operatore-close" onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-white active:scale-95">
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="text-center mb-8">
          <img src={`${process.env.PUBLIC_URL}/logo-emblem.png`} alt="MikiLab" className="w-16 h-16 rounded-2xl mx-auto mb-3 border border-[#14b8a6]/40 object-contain bg-[#0b0f19]" />
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Chi è in laboratorio?</h1>
          <p className="text-sm text-[#94A3B8] mt-1.5">Seleziona l'operatore attivo del turno. Puoi cambiarlo quando vuoi.</p>
        </div>
        <div className="space-y-3">
          {OPERATORI.map((op) => (
            <button
              key={op.id}
              data-testid={`operatore-${op.id}`}
              onClick={() => onSelect(op)}
              className={`w-full flex items-center gap-4 rounded-2xl p-4 bg-[#0b0f19] border-2 transition-all active:scale-[0.98] ${current && current.id === op.id ? "border-[#14b8a6]" : "border-[#1e293b] hover:border-[#334155]"}`}
              style={{ boxShadow: `inset 0 -30px 50px -30px ${op.accent}55` }}
            >
              <img src={`${process.env.PUBLIC_URL}/${op.img}`} alt={op.name} className="w-14 h-14 rounded-xl object-cover object-top border" style={{ borderColor: op.accent }} />
              <div className="text-left flex-1 min-w-0">
                <p className="text-lg font-extrabold text-white leading-tight">{op.name}</p>
                <p className="text-xs font-semibold" style={{ color: op.accent }}>{op.role}</p>
              </div>
              {current && current.id === op.id && <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-[#14b8a6]/15 text-[#14b8a6] border border-[#14b8a6]/40">Attivo</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
