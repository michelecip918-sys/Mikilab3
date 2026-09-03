import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Volume2, Square, Sparkles } from "lucide-react";
import { playTTS, stopTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";

// CYBER-BAKERY TRIO: Miki (Capo), Mohamed (braccio destro), Bake Mix (robot).
// Banner interattivo: clic su un personaggio → micro-guida a step con lettura vocale hands-free.
const TRIO = [
  {
    id: "miki", name: "Miki", role: "Il Capo", img: "avatar_miki.jpg", accent: "#E0A106",
    intro: "Sono Miki, il Capo. Dalla Plancia Capo pianifico la giornata, leggo i colli di bottiglia e coordino la squadra.",
    steps: [
      { t: "Plancia Capo", d: "Nel Laboratorio apri la Plancia: vedi carichi, radar del team e manutenzione predittiva." },
      { t: "Smart Planner", d: "Livella il carico con lo Stress-Zero e sposta la produzione sulle fasce a energia più economica." },
      { t: "Report & Storico", d: "A fine giornata il report si archivia da solo: confronti i giorni e i grafici del carico." },
    ],
  },
  {
    id: "mohamed", name: "Mohamed", role: "Braccio destro", img: "avatar_mohamed.jpg", accent: "#3E9C93",
    intro: "Sono Mohamed, il braccio destro in laboratorio. Eseguo la produzione, seguo i timer e i passaggi di consegna.",
    steps: [
      { t: "Voice Core", d: "Lavoro a mani libere: avvio impastatrici e forni con la voce, senza toccare lo schermo." },
      { t: "Parco Macchine", d: "Tengo d'occhio impastatrice, forni e celle con i timer sempre attivi tra le schermate." },
      { t: "Team OS", d: "Ricevo i passaggi di consegna vocali e le note del turno dal Capo." },
    ],
  },
  {
    id: "bigmix", name: "Bake Mix", role: "Assistente Robot", img: "avatar_bigmix.jpg", accent: "#6EA8FE",
    intro: "Sono Bake Mix. Ti accompagno a mani libere: comandi vocali, previsioni e allarmi termici in tempo reale.",
    steps: [
      { t: "Comandi vocali", d: "Dì «Miki, quanto manca» o «avvia forno»: rispondo a voce, chiaro e pulito." },
      { t: "AI predittiva", d: "Anticipo idratazione, maturazione del lievito e clima delle celle." },
      { t: "Thermal Guard", d: "Se una cella esce dalla soglia, suono l'allarme e mando la notifica al Capo." },
    ],
  },
];

function Guide({ p, onClose }) {
  const { lang } = useLang();
  const [i, setI] = useState(-1);
  const [speaking, setSpeaking] = useState(false);
  const total = p.steps.length;
  const body = i < 0 ? p.intro : p.steps[i].d;
  const title = i < 0 ? `${p.name} · ${p.role}` : p.steps[i].t;

  const speak = () => {
    if (speaking) { stopTTS(); setSpeaking(false); return; }
    playTTS(`${title}. ${body}`, { lang, onStart: () => setSpeaking(true), onEnded: () => setSpeaking(false) });
  };
  const close = () => { stopTTS(); onClose(); };

  return (
    <div data-testid="trio-guide" className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3" onClick={close}>
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-44 bg-slate-950" style={{ boxShadow: `inset 0 -40px 60px -20px ${p.accent}55` }}>
          <img src={`${process.env.PUBLIC_URL}/${p.img}`} alt={p.name} className="w-full h-full object-cover object-top" />
          <button data-testid="trio-guide-close" onClick={close} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
          <span className="absolute bottom-2 left-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: `${p.accent}30`, color: p.accent, border: `1px solid ${p.accent}66` }}>{p.role}</span>
        </div>
        <div className="p-5 space-y-3">
          <h3 className="font-display text-lg font-extrabold" style={{ color: p.accent }}>{title}</h3>
          <p className="text-sm text-slate-300 leading-relaxed min-h-[64px]">{body}</p>
          <div className="flex items-center gap-2">
            <button data-testid="trio-guide-listen" onClick={speak} className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 text-xs font-bold">
              {speaking ? <><Square className="w-3.5 h-3.5" /> Ferma</> : <><Volume2 className="w-3.5 h-3.5" /> Ascolta</>}
            </button>
            <div className="ms-auto flex items-center gap-1.5">
              <button data-testid="trio-guide-prev" disabled={i < 0} onClick={() => setI((x) => Math.max(-1, x - 1))} className="w-9 h-9 rounded-full bg-slate-800 disabled:opacity-30 text-slate-200 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-[11px] font-mono text-slate-500 w-10 text-center">{i < 0 ? "intro" : `${i + 1}/${total}`}</span>
              {i < total - 1 ? (
                <button data-testid="trio-guide-next" onClick={() => setI((x) => x + 1)} className="w-9 h-9 rounded-full text-slate-900 flex items-center justify-center" style={{ background: p.accent }}><ChevronRight className="w-4 h-4" /></button>
              ) : (
                <button data-testid="trio-guide-done" onClick={close} className="px-3 h-9 rounded-full text-slate-900 text-xs font-bold" style={{ background: p.accent }}>Fatto</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CyberBakeryTrio({ compact = false }) {
  const [open, setOpen] = useState(null);
  return (
    <div data-testid="cyber-bakery-trio" className="rounded-3xl border border-teal-500/25 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-teal-400" />
        <h3 className="font-display text-sm font-bold text-teal-300 uppercase tracking-wide">Cyber-Bakery Trio</h3>
        <span className="text-[11px] text-slate-500 ms-auto">Tocca un personaggio per la mini-guida</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {TRIO.map((p) => (
          <button key={p.id} data-testid={`trio-card-${p.id}`} onClick={() => setOpen(p)}
            className="group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 hover:border-slate-600 active:scale-[0.97] transition-all text-left">
            <div className="relative aspect-square bg-slate-900" style={{ boxShadow: `inset 0 -30px 40px -20px ${p.accent}55` }}>
              <img src={`${process.env.PUBLIC_URL}/${p.img}`} alt={p.name} loading="lazy" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform" />
            </div>
            <div className="px-2 py-2">
              <p className="text-[13px] font-bold text-white leading-tight">{p.name}</p>
              <p className="text-[10px] font-semibold" style={{ color: p.accent }}>{p.role}</p>
            </div>
          </button>
        ))}
      </div>
      {open && <Guide p={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
