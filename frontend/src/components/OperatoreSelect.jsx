import { X } from "lucide-react";

// Selezione OPERATORE attivo: riconosce chi sta lavorando in laboratorio (Capo / Floor).
// Nessuna sezione accademica: solo identità operativa per report, briefing e passaggi di consegna.
const OPERATORI = [
  { id: "michele", name: "Michele", role: "Capo · Lab Control", img: "avatar_miki.jpg", accent: "hsl(var(--primary))" },
  { id: "mikemix", name: "Sitor", role: "Reparto Produzione · Fornaio", img: "sitor_official.jpg", accent: "hsl(var(--muted-foreground))" },
];

export default function OperatoreSelect({ current, onSelect, onClose }) {
  return (
    <div data-testid="operatore-select" className="fixed inset-0 z-[9999] bg-background overflow-y-auto">
      <div className="max-w-md mx-auto px-5 py-12">
        {onClose && (
          <button data-testid="operatore-close" onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground active:scale-95">
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="text-center mb-8">
          <img src={`${process.env.PUBLIC_URL}/logo-emblem.png`} alt="MikiLab" className="w-16 h-16 rounded-2xl mx-auto mb-3 border border-primary/40 object-cover bg-background" />
          <h1 className="text-2xl font-black text-foreground uppercase tracking-wider">Chi è in laboratorio?</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Seleziona l'operatore attivo del turno. Puoi cambiarlo quando vuoi.</p>
        </div>
        <div className="space-y-3">
          {OPERATORI.map((op) => (
            <button
              key={op.id}
              data-testid={`operatore-${op.id}`}
              onClick={() => onSelect(op)}
              className={`w-full flex items-center gap-4 rounded-2xl p-4 bg-background border-2 transition-all active:scale-[0.98] ${current && current.id === op.id ? "border-primary" : "border-border hover:border-border"}`}
              style={{ boxShadow: `inset 0 -30px 50px -30px ${op.accent}55` }}
            >
              <img src={`${process.env.PUBLIC_URL}/${op.img}`} alt={op.name} className="w-14 h-14 rounded-xl object-cover object-top border" style={{ borderColor: op.accent }} />
              <div className="text-left flex-1 min-w-0">
                <p className="text-lg font-extrabold text-foreground leading-tight">{op.name}</p>
                <p className="text-xs font-semibold" style={{ color: op.accent }}>{op.role}</p>
              </div>
              {current && current.id === op.id && <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/40">Attivo</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
