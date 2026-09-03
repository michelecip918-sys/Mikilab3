import { useState } from "react";
import { Wine, ClipboardCheck, UtensilsCrossed } from "lucide-react";

const SOMMELIER = {
  segale_miele: {
    nome: "Pane di Segale Integrale & Miele di Melata",
    profilo: "Note terrose intense, crosta spessa, acidità bilanciata.",
    abbinamento: "Formaggi erborinati d'alpeggio e salumi di selvaggina stagionati.",
    notaSommelier: "La struttura compatta della segale pulisce perfettamente il palato grasso.",
    sensoriale: { crosta: "Spessa, croccante, colore bruno scuro, aroma di tostatura.", mollica: "Compatta e umida, alveolatura fitta e regolare.", aroma: "Terroso, note di melassa e cereale integrale.", acidita: "Media-alta, tipica della segale a pasta acida.", persistenza: "Lunga, finale dolce-amaro persistente." },
  },
  pasta_madre_crisp: {
    nome: "Ciabatta idratazione 80% con Metodo a Freddo",
    profilo: "Alveolatura aperta, mollica fondente, croccantezza cristallina.",
    abbinamento: "Culatta di Zibello riserva e burro d'alpeggio montato.",
    notaSommelier: "La leggerezza dell'alveolo esalta la scioglievolezza dei salumi nobili.",
    sensoriale: { crosta: "Sottile e vetrosa, croccantezza cristallina, colore dorato.", mollica: "Alveolatura aperta e irregolare, lucida e fondente.", aroma: "Lattico delicato, cereale dolce, lievi note di burro.", acidita: "Bassa ed equilibrata, molto pulita.", persistenza: "Media, finale fresco e leggero." },
  },
  enkir_spezie: {
    nome: "Monococco Enkir & Spezie Dolci",
    profilo: "Profumo di nocciola tostata, colore dorato antico, basso glutine.",
    abbinamento: "Foie gras scottato o confettura di fichi neri e caprini freschi.",
    notaSommelier: "Un pane ancestrale che richiede delicatezza e rispetta le consistenze cremose.",
    sensoriale: { crosta: "Fine, ambrata, aroma di nocciola tostata.", mollica: "Densa e vellutata, alveolatura chiusa e morbida.", aroma: "Nocciola, spezie dolci, miele di acacia.", acidita: "Molto bassa, dolce e rotonda.", persistenza: "Lunga, retrogusto di frutta secca." },
  },
};

const SENS_ROWS = [
  { key: "crosta", label: "Crosta" },
  { key: "mollica", label: "Mollica & Alveolatura" },
  { key: "aroma", label: "Aroma" },
  { key: "acidita", label: "Acidità" },
  { key: "persistenza", label: "Persistenza" },
];

export default function BrotSommelier() {
  const [sel, setSel] = useState("segale_miele");
  const [mode, setMode] = useState("pairing"); // pairing | sensoriale
  const d = SOMMELIER[sel];

  return (
    <div data-testid="brot-sommelier" className="bg-slate-900/80 p-6 rounded-2xl border border-amber-500/30 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Wine className="w-6 h-6 text-amber-400" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-amber-400">Brot Sommelier · Pro</h3>
            <p className="text-slate-400 text-sm mt-0.5">Analisi sensoriale avanzata e abbinamenti gastronomici d'eccellenza.</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(SOMMELIER).map((k) => (
            <button
              key={k}
              data-testid={`sommelier-pick-${k}`}
              onClick={() => setSel(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                sel === k ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {k.split("_")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Sotto-schede Pro */}
      <div className="flex gap-2">
        <button
          data-testid="sommelier-mode-pairing"
          onClick={() => setMode("pairing")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
            mode === "pairing" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" /> Food Pairing Pro
        </button>
        <button
          data-testid="sommelier-mode-sensoriale"
          onClick={() => setMode("sensoriale")}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
            mode === "sensoriale" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" /> Analisi Sensoriale
        </button>
      </div>

      {mode === "pairing" ? (
        <div data-testid={`sommelier-detail-${sel}`} className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
          <h4 className="text-2xl font-black text-slate-100">{d.nome}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">Profilo Sensoriale</span>
              <p className="text-slate-300">{d.profilo}</p>
            </div>
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-1">Abbinamento Consigliato</span>
              <p className="text-slate-300">{d.abbinamento}</p>
            </div>
          </div>
          <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl">
            <span className="text-xs font-bold text-amber-300 block mb-1 uppercase tracking-wider">Nota del Brot Sommelier</span>
            <p className="text-xs text-amber-200 italic">{d.notaSommelier}</p>
          </div>
        </div>
      ) : (
        <div data-testid={`sommelier-sensoriale-${sel}`} className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
          <h4 className="text-2xl font-black text-slate-100">{d.nome}</h4>
          <p className="text-xs text-slate-400">Scheda di valutazione sensoriale — crosta, mollica, aroma, acidità e persistenza.</p>
          <div className="divide-y divide-slate-800">
            {SENS_ROWS.map((r) => (
              <div key={r.key} className="grid grid-cols-1 sm:grid-cols-4 gap-2 py-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">{r.label}</span>
                <span className="sm:col-span-3 text-sm text-slate-300">{d.sensoriale[r.key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
