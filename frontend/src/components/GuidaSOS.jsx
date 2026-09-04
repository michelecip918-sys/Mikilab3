import { useState } from "react";
import { ChevronDown, Sparkles, ShieldCheck, Mic, HelpCircle } from "lucide-react";

const FAQ = [
  { q: "Come mi registro?", a: "Al primo avvio registrati con la tua email (o Google): quell'account diventa il profilo CAPO ed è collegato alla Sezione 'MikiLab Control'. Gli operai entrano invece con un PIN rapido scelto dal Capo." },
  { q: "A cosa serve il PIN?", a: "Il PIN protegge i dati e l'archivio del panificio e apre l'accesso rapido alla Produzione (Floor Mode) a mani libere, senza dover digitare email e password ad ogni turno." },
  { q: "Cosa sono gli 'Ordini Extra'?", a: "Nella plancia Capo puoi inserire le variazioni urgenti dell'ultimo minuto: l'intelligenza artificiale rigenera all'istante il piano di produzione giornaliero aggiornato, con priorità e orari." },
  { q: "Come funziona la voce?", a: "I comandi vocali sono attivi ovunque: usa le cuffie Bluetooth e parla con l'assistente per navigare, avviare timer o farti guidare passo-passo in una ricetta durante la produzione." },
  { q: "Magazzino e scorte?", a: "In 'Magazzino & Scorte' registri farine e ingredienti con una soglia minima: quando scendi sotto soglia ricevi un avviso vocale e un ordine di riacquisto già pronto da inviare al fornitore." },
];

function Acc({ q, a, testid }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-[#030712] border border-[#1e293b] overflow-hidden">
      <button data-testid={testid} onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left">
        <span className="text-xs font-bold text-white">{q}</span>
        <ChevronDown className={`w-4 h-4 text-[#14b8a6] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-4 pb-3 text-[11px] text-[#94A3B8] leading-relaxed">{a}</p>}
    </div>
  );
}

export default function GuidaSOS() {
  return (
    <div data-testid="guida-sos" className="space-y-5">
      <div className="p-5 rounded-2xl bg-[#0b0f19] border border-[#1e293b]">
        <h3 className="text-sm font-extrabold text-[#14b8a6] flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Il laboratorio MikiLab</h3>
        <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
          MikiLab è un panificio artigianale dove <strong className="text-white">tradizione e innovazione</strong> lavorano insieme.
          L'intelligenza artificiale e il robot assistente non sostituiscono il fornaio: sono nati per <strong className="text-white">supportare il lavoro quotidiano</strong>,
          alleggerire i compiti ripetitivi e far girare il laboratorio a mani libere, mantenendo intatta la qualità del Pane di Matera e delle nostre ricette.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#1e293b]"><Sparkles className="w-5 h-5 text-[#14b8a6] mb-2" /><h4 className="text-xs font-bold text-white">AI a supporto</h4><p className="text-[11px] text-[#94A3B8] mt-1">Rigenera piani, guida in cuffia e risponde alle domande.</p></div>
        <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#1e293b]"><Mic className="w-5 h-5 text-[#14b8a6] mb-2" /><h4 className="text-xs font-bold text-white">Voce ovunque</h4><p className="text-[11px] text-[#94A3B8] mt-1">Comandi vocali in ogni sezione, hands-free.</p></div>
        <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#1e293b]"><ShieldCheck className="w-5 h-5 text-[#14b8a6] mb-2" /><h4 className="text-xs font-bold text-white">Dati protetti</h4><p className="text-[11px] text-[#94A3B8] mt-1">PIN e ruoli separati: Capo e Produzione.</p></div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2"><HelpCircle className="w-4 h-4 text-[#14b8a6]" /> Guida completa · SOS · FAQ</h3>
        <div className="space-y-2">
          {FAQ.map((f, i) => <Acc key={i} testid={`faq-${i}`} q={f.q} a={f.a} />)}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#14b8a6]/5 border border-[#14b8a6]/30">
        <p className="text-xs text-[#cbd5e1]">Hai altre domande sul funzionamento del sito? Tocca l'<strong className="text-[#14b8a6]">assistente AI</strong> in basso a destra: risponde in tempo reale su impostazioni, pulsanti e funzioni.</p>
      </div>
    </div>
  );
}
