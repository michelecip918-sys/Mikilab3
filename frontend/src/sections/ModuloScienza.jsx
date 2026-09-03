import { FlaskConical } from "lucide-react";

const GUIDE = [
  {
    id: "lievito-madre",
    title: "Gestione Lievito Madre & pH",
    desc: "Mantenimento del range di pH ottimale (4.1 - 4.3) per il bilanciamento acido lattico/acetico.",
    color: "#E0A458",
    detail: "Un rinfresco costante 1:1:1 e una temperatura di 26 °C favoriscono l'acido lattico e un profumo dolce, evitando un'eccessiva acidità acetica.",
  },
  {
    id: "alveolatura",
    title: "Risoluzione Difetti Alveolatura",
    desc: "Diagnosi visiva per collassi di struttura o mollica compatta causata da sotto-lievitazione.",
    color: "#3E9C93",
    detail: "La mollica compatta indica una lievitazione incompleta o una farina troppo debole. Alveoli grandi e irregolari con crosta staccata segnalano una sovra-maturazione dell'impasto.",
  },
  {
    id: "idratazione",
    title: "Idratazione & Bassinage",
    desc: "Aggiunta graduale dell'acqua a impasto già incordato per raggiungere alte idratazioni senza perdere struttura.",
    color: "#5E8CA8",
    detail: "Oltre l'80% di idratazione usa il bassinage: incorda prima l'impasto, poi aggiungi l'acqua poco alla volta a bassa velocità, attendendo che venga assorbita prima di ogni aggiunta.",
  },
  {
    id: "temperatura",
    title: "Temperatura Finale Impasto",
    desc: "Controllo della temperatura di fine impasto (24-26°C) tramite la formula dell'acqua.",
    color: "#C2612E",
    detail: "Regola la temperatura dell'acqua sottraendo, alla temperatura desiderata moltiplicata per il coefficiente della macchina, la temperatura della farina e dell'ambiente.",
  },
];

export default function ModuloScienza({ activeTab = "scienza" }) {
  if (activeTab !== "scienza") return null;

  return (
    <div data-testid="modulo-scienza" className="bg-slate-900/80 p-6 rounded-2xl border border-teal-500/30 space-y-6">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-2xl bg-teal-500/15 border border-teal-500/40 flex items-center justify-center shrink-0">
          <FlaskConical className="w-6 h-6 text-teal-400" />
        </span>
        <div>
          <h3 className="text-xl font-bold text-teal-400">Polo Didattico & Schede Tecniche Fermentazione</h3>
          <p className="text-slate-400 text-sm mt-0.5">Guide scientifiche visive per il laboratorio.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GUIDE.map((g) => (
          <div key={g.id} data-testid={`scienza-card-${g.id}`} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold" style={{ color: g.color }}>{g.title}</h4>
            <p className="text-xs text-slate-400">{g.desc}</p>
            <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800">{g.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
