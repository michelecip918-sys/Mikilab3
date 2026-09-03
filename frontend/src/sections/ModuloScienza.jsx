import { useEffect } from "react";
import { FlaskConical, Volume2 } from "lucide-react";

const speak = (msg) => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(msg);
    u.lang = "it-IT";
    window.speechSynthesis.speak(u);
  }
};

const GUIDE = [
  {
    id: "lievito-madre",
    title: "Gestione Lievito Madre & pH",
    desc: "Mantenimento del range di pH ottimale (4.1 - 4.3) per il bilanciamento acido lattico/acetico.",
    color: "#E0A458",
    audio: "Guida Lievito Madre: mantenere il pH tra 4.1 e 4.3 per evitare un'eccessiva acidità acetica. Un rinfresco costante 1 a 1 a 1 e una temperatura di 26 gradi favoriscono l'acido lattico e un profumo dolce.",
  },
  {
    id: "alveolatura",
    title: "Risoluzione Difetti Alveolatura",
    desc: "Diagnosi visiva per collassi di struttura o mollica compatta causata da sotto-lievitazione.",
    color: "#3E9C93",
    audio: "Guida Diagnostica: la mollica compatta indica solitamente una lievitazione incompleta o una farina troppo debole. Alveoli grandi e irregolari con crosta staccata segnalano invece una sovra-maturazione dell'impasto.",
  },
  {
    id: "idratazione",
    title: "Idratazione & Bassinage",
    desc: "Aggiunta graduale dell'acqua a impasto già incordato per raggiungere alte idratazioni senza perdere struttura.",
    color: "#5E8CA8",
    audio: "Guida Idratazione: per idratazioni superiori all'ottanta per cento usa la tecnica del bassinage. Incorda prima l'impasto, poi aggiungi l'acqua poco alla volta a bassa velocità, attendendo che venga assorbita prima di ogni aggiunta.",
  },
  {
    id: "temperatura",
    title: "Temperatura Finale Impasto",
    desc: "Controllo della temperatura di fine impasto (24-26°C) tramite la formula dell'acqua.",
    color: "#C2612E",
    audio: "Guida Temperatura: la temperatura ideale di fine impasto è tra 24 e 26 gradi. Regola la temperatura dell'acqua sottraendo alla temperatura desiderata, moltiplicata per il coefficiente della macchina, la temperatura della farina e dell'ambiente.",
  },
];

export default function ModuloScienza({ activeTab = "scienza" }) {
  // Ferma l'audio quando si esce dal modulo.
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  if (activeTab !== "scienza") return null;

  return (
    <div data-testid="modulo-scienza" className="bg-slate-900/80 p-6 rounded-2xl border border-teal-500/30 space-y-6">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-2xl bg-teal-500/15 border border-teal-500/40 flex items-center justify-center shrink-0">
          <FlaskConical className="w-6 h-6 text-teal-400" />
        </span>
        <div>
          <h3 className="text-xl font-bold text-teal-400">Polo Didattico & Schede Tecniche Fermentazione</h3>
          <p className="text-slate-400 text-sm mt-0.5">Guide scientifiche integrate con supporto vocale per il laboratorio.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GUIDE.map((g) => (
          <div key={g.id} data-testid={`scienza-card-${g.id}`} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col">
            <h4 className="font-bold mb-1" style={{ color: g.color }}>{g.title}</h4>
            <p className="text-xs text-slate-400 mb-3 flex-1">{g.desc}</p>
            <button
              data-testid={`scienza-audio-${g.id}`}
              onClick={() => speak(g.audio)}
              className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold rounded-lg border border-teal-500/30 active:scale-95 transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" /> Ascolta Audio Guida
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
