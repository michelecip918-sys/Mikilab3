import { Hand, Timer as TimerIcon, Scale, Droplets, RefreshCw, Thermometer, Stethoscope, BookOpen, Sprout, CalendarDays, Sparkles, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Modalità Laboratorio: pulsanti giganti, alto contrasto, pensati per dita infarinate / guanti.
// Accesso rapido agli strumenti che si usano DURANTE il lavoro + voce in evidenza.
export default function LabModeBig({ onOpenTool, onExit, onOpenPlan }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);

  const TILES = [
    { id: "manisporche", Icon: Hand, primary: true, label: tri("Voce · Mani Sporche", "Stimme · Schmutzige Hände", "Voice · Dirty Hands", "Voz · Manos Sucias") },
    { id: "timer", Icon: TimerIcon, label: tri("Timer", "Timer", "Timer", "Temporizador") },
    { id: "timetable", Icon: TimerIcon, label: tri("Timetable Lievitazione", "Gär-Timetable", "Ferment. Timetable", "Cronograma") },
    { id: "pesata", Icon: Scale, label: tri("Pesata a Voce", "Wiegen per Stimme", "Voice Weighing", "Pesada por Voz") },
    { id: "metodo", Icon: Droplets, label: tri("Idratazione", "Hydratation", "Hydration", "Hidratación") },
    { id: "convlievito", Icon: RefreshCw, label: tri("Lieviti", "Hefe", "Yeast", "Levaduras") },
    { id: "acqua", Icon: Thermometer, label: tri("Temp. Acqua", "Wasser-Temp.", "Water Temp.", "Temp. Agua") },
    { id: "sosimpasto", Icon: Stethoscope, label: tri("SOS Impasto", "SOS Teig", "Dough SOS", "SOS Masa") },
    { id: "sessioni", Icon: BookOpen, label: tri("Diario", "Tagebuch", "Log", "Diario") },
    { id: "ph", Icon: Sprout, label: tri("Lievito Madre", "Sauerteig", "Sourdough", "Masa Madre") },
    { id: "aggiungi", Icon: BookOpen, label: tri("Ricette", "Rezepte", "Recipes", "Recetas") },
  ];

  return (
    <div data-testid="lab-mode-big" className="pb-28">
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold text-white leading-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F26419] animate-pulse" />
            {tri("Modalità Laboratorio", "Labor-Modus", "Bakery Mode", "Modo Laboratorio", "Mode Atelier", "حالت کارگاه")}
          </h1>
          <p className="text-[13px] text-[#AEB8BF] leading-snug mt-0.5">{tri("Pulsanti grandi, usali anche con le mani infarinate.", "Große Tasten, auch mit mehligen Händen.", "Big buttons, use them even with floury hands.", "Botones grandes, úsalos con las manos enharinadas.")}</p>
        </div>
        <button data-testid="lab-big-exit" onClick={onExit}
          className="shrink-0 flex items-center gap-1.5 rounded-2xl px-4 py-3 bg-[#18202E] border-2 border-[#26324A] text-white font-bold text-sm active:scale-95 transition-all">
          <X className="w-5 h-5" /> {tri("Esci", "Beenden", "Exit", "Salir")}
        </button>
      </div>

      {/* Piano di Produzione: tile largo in evidenza */}
      <button data-testid="lab-big-plan" onClick={onOpenPlan}
        className="w-full flex items-center gap-4 min-h-[92px] rounded-3xl px-5 mb-3 bg-gradient-to-r from-[#F26419] to-[#F26419] text-white shadow-[0_6px_0_rgba(0,0,0,.35)] active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,.35)] transition-all text-left">
        <span className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0"><CalendarDays className="w-8 h-8" /></span>
        <span className="min-w-0">
          <span className="block font-display text-xl font-extrabold leading-tight">{tri("Piano di Produzione", "Produktionsplan", "Production Plan", "Plan de Producción")}</span>
          <span className="block text-[13px] text-white/85 leading-snug">{tri("Genera il lavoro della giornata", "Erzeuge den Tagesplan", "Generate the day's work", "Genera el trabajo del día")}</span>
        </span>
      </button>

      <div className="grid grid-cols-2 gap-3">
        {TILES.map(({ id, Icon, label, primary }) => (
          <button key={id} data-testid={`lab-big-tile-${id}`} onClick={() => onOpenTool(id)}
            className={`flex flex-col items-center justify-center gap-2.5 min-h-[118px] rounded-3xl px-3 py-4 text-center active:scale-97 transition-all shadow-[0_5px_0_rgba(0,0,0,.3)] active:translate-y-0.5 ${
              primary
                ? "bg-gradient-to-br from-[#F26419] to-[#F26419] text-white border-2 border-[#F26419]"
                : "bg-[#18202E] text-white border-2 border-[#F26419]/70"
            }`}>
            <Icon className={`w-9 h-9 shrink-0 ${primary ? "text-white" : "text-[#F26419]"}`} />
            <span className="font-display text-[17px] font-extrabold leading-tight">{label}</span>
          </button>
        ))}
      </div>

      <p className="text-[12px] text-[#7E8A93] leading-snug mt-4 flex items-start gap-1.5">
        <Sparkles className="w-4 h-4 text-[#F26419] shrink-0 mt-0.5" />
        {tri("Suggerimento: tocca «Voce» per usare tutto a mani libere.", "Tipp: Tippe „Stimme“ für freihändige Bedienung.", "Tip: tap 'Voice' to use everything hands-free.", "Consejo: toca «Voz» para usar todo con manos libres.")}
      </p>
    </div>
  );
}
