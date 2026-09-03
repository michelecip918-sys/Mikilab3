import { BookOpen, Cpu, Thermometer, Radio, Headphones, Zap, ExternalLink, Wrench, Mic, Snowflake, Volume2, Square } from "lucide-react";
import { useState } from "react";
import { playTTS, stopTTS } from "@/lib/tts";
import { useLang } from "@/i18n/LanguageContext";

// Manuale d'Uso + Hardware consigliato per il laboratorio MikiLab (pagina dedicata).
// Stile cyber-industrial teal/oro. Contenuto in italiano (mondo operativo del laboratorio).

const USAGE = [
  { Icon: Wrench, t: "Modalità Laboratorio (PRO)", d: "L'interruttore in alto nel Voice Core ingrandisce i tasti touch: pensato per lavorare con le mani in pasta, senza sbagliare bersaglio." },
  { Icon: Zap, t: "Parco Macchine & Timer persistenti", d: "Impastatrice 50 kg, forno rotativo e armadio fermo-lievitazione con timer che continuano a girare anche quando cambi schermata." },
  { Icon: Snowflake, t: "Zero-Night Production", d: "Chiusura serale in cella, blocco termico notturno e infornata autonoma alle 05:00 / 06:00. Il sistema calcola gli orari a ritroso dai tempi di lievitazione." },
  { Icon: Thermometer, t: "IoT Thermal Guard", d: "Le sonde reali inviano la temperatura all'endpoint /api/sensors/reading. Se una cella supera la soglia parte l'allarme acustico in cuffia e la notifica push al Capo." },
  { Icon: Mic, t: "Voice Core hands-free", d: "Comandi vocali con cuffie wireless a cancellazione di rumore: «avvia impastatrice due», «quanto manca», «ferma». Zero contatto, mani sempre pulite." },
];

const HARDWARE = [
  {
    Icon: Thermometer, name: "Milesight EM300-TH", img: "hw_milesight.jpg",
    role: "Sonda temperatura + umidità (celle & ambiente)",
    d: "Sensore LoRaWAN a batteria per monitorare temperatura e umidità di celle di lievitazione e ambiente. Lunga autonomia, display e-paper, ideale per il Thermal Guard.",
    buy: "Rivenditori LoRaWAN / IoT B2B (es. IoT-Shop, distributori Milesight EU).",
    url: "https://www.milesight.com/iot/product/lorawan-sensor/em300-th",
    color: "#3E9C93",
  },
  {
    Icon: Cpu, name: "Efento (NB-IoT / BLE)", img: "hw_efento.jpg",
    role: "Data-logger temperatura HACCP",
    d: "Sensori e logger certificati per la catena del freddo. Ottimi per freezer e frigo: registrano lo storico e allertano al superamento soglia. Compatibili con report HACCP.",
    buy: "Store Efento ufficiale o distributori HACCP/IoT europei.",
    url: "https://getefento.com",
    color: "#5E8CA8",
  },
  {
    Icon: Radio, name: "Sonde PT100 / DS18B20", img: "hw_pt100.jpg",
    role: "Sonde a filo per cuore impasto & forno",
    d: "Sonde industriali a contatto: PT100 (alta precisione, forni) e DS18B20 (digitali, economiche). Si collegano a un gateway/ESP che inoltra i dati all'endpoint sensori.",
    buy: "Elettronica industriale (RS, Mouser, Amazon Business).",
    url: "https://www.rs-online.com",
    color: "#C2612E",
  },
  {
    Icon: Zap, name: "Relè Shelly / Sonoff", img: "hw_relay.jpg",
    role: "Accensione/spegnimento macchine da remoto",
    d: "Relè Wi-Fi per pilotare forni, luci e resistenze delle celle. Shelly (Plus 1 / Pro) e Sonoff (basic R2 / TH) permettono di automatizzare il blocco termico notturno.",
    buy: "Shelly.com, Sonoff (ITEAD) o Amazon.",
    url: "https://www.shelly.com",
    color: "#E0A458",
  },
  {
    Icon: Headphones, name: "Cuffie wireless Jabra", img: "hw_headset.jpg",
    role: "Comandi vocali hands-free",
    d: "Auricolari a cancellazione di rumore (Jabra Evolve2 / Elite) per il Voice Core: senti gli avvisi e parli i comandi anche con l'impastatrice in funzione, senza toccare lo schermo.",
    buy: "Jabra.com o rivenditori audio professionali.",
    url: "https://www.jabra.com",
    color: "#3E9C93",
  },
];

export default function ManualePage() {
  const { lang } = useLang();
  const [speaking, setSpeaking] = useState(false);

  const readManual = () => {
    if (speaking) { stopTTS(); setSpeaking(false); return; }
    const txt = "Manuale d'uso MikiLab. " + USAGE.map((m) => `${m.t}. ${m.d}`).join(" ") +
      " Hardware consigliato. " + HARDWARE.map((h) => `${h.name}: ${h.role}. ${h.d}`).join(" ");
    playTTS(txt, { lang, onStart: () => setSpeaking(true), onEnded: () => setSpeaking(false) });
  };

  return (
    <div data-testid="manuale-page" className="space-y-6">
      {/* Hero */}
      <div className="rounded-3xl overflow-hidden border border-teal-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
        <div className="flex items-start gap-3">
          <span className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/40 flex items-center justify-center shrink-0">
            <BookOpen className="w-7 h-7 text-teal-400" />
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-extrabold text-teal-400 leading-tight">Manuale & Hardware</h1>
            <p className="text-slate-400 text-sm mt-1 leading-snug">Come usare MikiLab in laboratorio e quale hardware collegare per sensori, relè e comandi vocali.</p>
          </div>
        </div>
        <button data-testid="manuale-listen" onClick={readManual}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 px-4 py-2 text-sm font-bold active:scale-95 transition-all">
          {speaking ? <><Square className="w-4 h-4" /> Ferma la lettura</> : <><Volume2 className="w-4 h-4" /> Ascolta il manuale</>}
        </button>
      </div>

      {/* Manuale d'uso */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wide flex items-center gap-2"><Wrench className="w-4 h-4" /> Manuale d'Uso</h2>
        <div className="grid grid-cols-1 gap-2.5">
          {USAGE.map((m) => (
            <div key={m.t} data-testid={`manuale-usage-${m.t.slice(0, 6)}`} className="flex items-start gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <span className="w-10 h-10 rounded-xl bg-teal-500/12 border border-teal-500/30 flex items-center justify-center shrink-0"><m.Icon className="w-5 h-5 text-teal-400" /></span>
              <div>
                <p className="text-sm font-bold text-slate-100">{m.t}</p>
                <p className="text-[12.5px] text-slate-400 mt-0.5 leading-relaxed">{m.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hardware consigliato */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2"><Cpu className="w-4 h-4" /> Hardware consigliato · dove trovarlo</h2>
        <p className="text-[12px] text-slate-500 leading-snug">Componenti testati per collegare sensori, relè e voce al laboratorio. Tocca «Vai al fornitore» per aprire il sito e verificare prezzi e disponibilità.</p>
        <div className="grid grid-cols-1 gap-3">
          {HARDWARE.map((h) => (
            <div key={h.name} data-testid={`manuale-hw-${h.name.split(" ")[0].toLowerCase()}`} className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="relative h-36 bg-slate-950 border-b border-slate-800">
                <img src={`${process.env.PUBLIC_URL}/${h.img}`} alt={h.name} loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <span className="absolute top-2 left-2 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${h.color}33`, border: `1px solid ${h.color}77`, backdropFilter: "blur(4px)" }}>
                  <h.Icon className="w-5 h-5" style={{ color: h.color }} />
                </span>
              </div>
              <div className="p-4 space-y-2">
                <div>
                  <p className="text-base font-bold text-slate-100 leading-tight">{h.name}</p>
                  <p className="text-[11.5px] font-semibold" style={{ color: h.color }}>{h.role}</p>
                </div>
                <p className="text-[12.5px] text-slate-400 leading-relaxed">{h.d}</p>
                <p className="text-[11.5px] text-slate-500"><b className="text-slate-400">Dove comprarlo:</b> {h.buy}</p>
                <a data-testid={`manuale-hw-link-${h.name.split(" ")[0].toLowerCase()}`} href={h.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-1 px-3 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all"
                  style={{ background: `${h.color}1f`, border: `1px solid ${h.color}66`, color: h.color }}>
                  <ExternalLink className="w-4 h-4" /> Vai al fornitore
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-[11px] text-slate-600 pt-2">MikiLab · Il laboratorio connesso di Michele</p>
    </div>
  );
}
