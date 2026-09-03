import { mkTri } from "@/i18n/triMaps";
import { useState } from "react";
import { ChevronRight, Recycle, Croissant, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const RAFFERMO = [
  { emoji: "🍲", name: "Pancotto", body: "Pane raffermo ammollato e cotto con acqua o brodo, olio, aglio e alloro. Piatto povero lucano, cremoso e confortante." },
  { emoji: "🧆", name: "Polpette di pane (Pallotte)", body: "Pane bagnato e strizzato, uova, pecorino, prezzemolo e aglio. Si friggono o si cuociono nel sugo: svuotano la cesta del pane vecchio." },
  { emoji: "🥣", name: "Panzanella", body: "Pane raffermo bagnato e strizzato con pomodoro, cipolla, basilico e olio. Fresca d'estate, zero sprechi." },
  { emoji: "🍞", name: "Pangrattato aromatico", body: "Pane secco frullato con scorza di limone, aglio e erbe. Perfetto per gratinare e per la 'mollica atterrata' pugliese." },
  { emoji: "🥪", name: "French toast salato/dolce", body: "Fette di pane in uovo e latte, in padella. Dolce con zucchero e cannella, salato con formaggio." },
  { emoji: "🍮", name: "Budino di pane", body: "Pane, latte, uova, zucchero e uvetta in forno: dolce di recupero della nonna." },
];

const ESUBERO = [
  { emoji: "🧇", name: "Waffle/Pancake con esubero", body: "Esubero di lievito madre + farina, uovo, latte e un pizzico di lievito: colazione soffice e digeribile." },
  { emoji: "🫓", name: "Crackers all'esubero", body: "Esubero + farina, olio, sale ed erbe. Stendi sottile, buchi con la forchetta e cuoci croccante." },
  { emoji: "🥖", name: "Grissini rapidi", body: "Esubero, farina, olio: cordoncini sottili in forno caldo. Croccanti in 15 minuti." },
  { emoji: "🥯", name: "Piadina/Focaccina veloce", body: "Esubero + farina e acqua per un impasto rapido in padella quando non hai tempo di lievitare." },
  { emoji: "🍪", name: "Biscotti dell'esubero", body: "Esubero, burro, zucchero e gocce di cioccolato: nessuno spreco, tanto gusto." },
];

export default function AngoloRecupero({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [tab, setTab] = useState("raffermo");
  const list = tab === "raffermo" ? RAFFERMO : ESUBERO;

  return (
    <div className="pb-8" data-testid="angolo-recupero">
      {onBack && <button data-testid="recupero-back" onClick={onBack} className="flex items-center gap-1 text-[#F26419] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back", "Atrás")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#0B0E14] shadow-xl mb-5" style={{ background: "linear-gradient(135deg,#2e8b6f,#1c5c49 70%,#F26419)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><Recycle className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("L'Angolo del Recupero", "Die Resteverwertung", "The Recovery Corner", "El Rincón del Aprovechamiento")}</h1>
        <p className="text-[#0B0E14]/85 text-sm mt-2 leading-snug">{L("Niente si butta: idee per il pane raffermo e per l'esubero del lievito madre.", "Nichts wird weggeworfen: Ideen für altes Brot und Sauerteig-Reste.", "Nothing is wasted: ideas for stale bread and sourdough discard.", "Nada se tira: ideas para pan duro y descarte de masa madre.")}</p>
      </div>

      <div className="flex gap-1.5 bg-[#18202E] p-1.5 rounded-2xl mb-5 border border-[#26324A]">
        {[["raffermo", L("Pane raffermo", "Altes Brot", "Stale bread", "Pan duro"), Croissant], ["esubero", L("Esubero LM", "Sauerteig-Rest", "Sourdough discard", "Descarte MM"), Sparkles]].map(([id, label, Icon]) => (
          <button key={id} data-testid={`recupero-tab-${id}`} onClick={() => setTab(id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl shadow-md border border-amber-900/40 text-[13px] font-bold transition-all ${tab === id ? "bg-[#2e8b6f] text-[#0B0E14] shadow" : "text-[#F26419]"}`}><Icon className="w-4 h-4" /> {label}</button>
        ))}
      </div>

      <div className="space-y-3" data-testid="recupero-list">
        {list.map((r, i) => (
          <div key={i} data-testid={`recupero-item-${i}`} className="rounded-2xl bg-[#0B0E14] dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{r.emoji}</span>
              <p className="font-display text-lg font-bold text-[#F26419] dark:text-[#e4eff8] leading-tight">{r.name}</p>
            </div>
            <p className="text-[13.5px] text-[#F26419] dark:text-[#AEB8BF] leading-relaxed">{r.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
