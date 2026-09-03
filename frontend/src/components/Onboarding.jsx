import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Cog, Target, ChevronRight, Check } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

export const ONBOARD_KEY = "mikilab_onboarding";
export const getProfile = () => { try { return JSON.parse(localStorage.getItem(ONBOARD_KEY)); } catch { return null; } };

export default function Onboarding({ onDone }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [step, setStep] = useState(0);
  const [p, setP] = useState({ labName: "", type: "panificio", equip: [], focus: "pane" });
  const set = (patch) => setP((x) => ({ ...x, ...patch }));
  const toggleEquip = (e) => set({ equip: p.equip.includes(e) ? p.equip.filter((x) => x !== e) : [...p.equip, e] });

  const TYPES = [
    { id: "panificio", label: tri("Panificio", "Bäckerei", "Bakery") },
    { id: "pasticceria", label: tri("Pasticceria", "Konditorei", "Pastry shop") },
    { id: "misto", label: tri("Panificio + Pasticceria", "Bäckerei + Konditorei", "Bakery + Pastry") },
    { id: "home", label: tri("Home baker", "Hobbybäcker", "Home baker") },
  ];
  const EQUIP = [
    { id: "impastatrice", label: tri("Impastatrice", "Kneter", "Mixer") },
    { id: "forno_rotativo", label: tri("Forno rotativo", "Rotationsofen", "Rotary oven") },
    { id: "forno_statico", label: tri("Forno statico", "Etagenofen", "Deck oven") },
    { id: "cella", label: tri("Cella lievitazione", "Gärzelle", "Proofer") },
    { id: "abbattitore", label: tri("Abbattitore", "Schockfroster", "Blast chiller") },
  ];
  const FOCUS = [
    { id: "pane", label: tri("Pane", "Brot", "Bread") },
    { id: "panettoni", label: tri("Panettoni & lievitati", "Panettone & Hefegebäck", "Panettone & sweet") },
    { id: "brezel", label: tri("Brezel & tedeschi", "Brezel & Deutsch", "Pretzels & German") },
    { id: "dolci", label: tri("Dolci & pasticceria", "Süßes & Konditorei", "Sweets & pastry") },
  ];

  const finish = () => {
    localStorage.setItem(ONBOARD_KEY, JSON.stringify({ ...p, done: true, at: new Date().toISOString() }));
    onDone && onDone(p);
  };

  const STEPS = [
    {
      icon: Store, title: tri("La tua attività", "Dein Betrieb", "Your business"),
      body: (
        <div className="space-y-3">
          <input data-testid="ob-labname" value={p.labName} onChange={(e) => set({ labName: e.target.value })}
            placeholder={tri("Nome del laboratorio", "Name der Backstube", "Bakery name")}
            className="w-full bg-[#0B0E14] dark:bg-[#18202E] border border-[#26324A] dark:border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 px-3 py-3 outline-none text-[#2B303B] dark:text-[#e4eff8]" />
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((tp) => (
              <button key={tp.id} data-testid={`ob-type-${tp.id}`} onClick={() => set({ type: tp.id })}
                className={`px-3 py-2.5 rounded-2xl shadow-md border border-amber-900/40 text-sm font-semibold border ${p.type === tp.id ? "bg-[#F26419] text-white border-[#F26419]" : "bg-white dark:bg-[#18202E] text-[#3F4A54] dark:text-[#AEB8BF] border-[#26324A] dark:border-[#26324A]"}`}>{tp.label}</button>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: Cog, title: tri("Le tue attrezzature", "Deine Ausstattung", "Your equipment"),
      body: (
        <div className="flex flex-wrap gap-2">
          {EQUIP.map((e) => (
            <button key={e.id} data-testid={`ob-equip-${e.id}`} onClick={() => toggleEquip(e.id)}
              className={`px-3 py-2 rounded-full text-sm font-semibold border ${p.equip.includes(e.id) ? "bg-[#F26419] text-white border-[#F26419]" : "bg-white dark:bg-[#18202E] text-[#3F4A54] dark:text-[#AEB8BF] border-[#26324A] dark:border-[#26324A]"}`}>
              {p.equip.includes(e.id) && <Check className="w-3.5 h-3.5 inline mr-1" />}{e.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      icon: Target, title: tri("Cosa produci di più?", "Was produzierst du am meisten?", "What do you make most?"),
      body: (
        <div className="grid grid-cols-2 gap-2">
          {FOCUS.map((f) => (
            <button key={f.id} data-testid={`ob-focus-${f.id}`} onClick={() => set({ focus: f.id })}
              className={`px-3 py-3 rounded-2xl shadow-md border border-amber-900/40 text-sm font-semibold border ${p.focus === f.id ? "bg-[#F26419] text-white border-[#F26419]" : "bg-white dark:bg-[#18202E] text-[#3F4A54] dark:text-[#AEB8BF] border-[#26324A] dark:border-[#26324A]"}`}>{f.label}</button>
          ))}
        </div>
      ),
    },
  ];
  const cur = STEPS[step];

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3" data-testid="onboarding">
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md bg-white dark:bg-[#0B0E14] rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-1">
          {STEPS.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#F26419]" : "bg-[#26324A] dark:bg-[#26324A]"}`} />)}
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#F26419] mt-3">{tri("Passo", "Schritt", "Step")} {step + 1}/3</p>
        <div className="flex items-center gap-2 mb-4">
          <cur.icon className="w-6 h-6 text-[#F26419]" />
          <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{cur.title}</h2>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
            {cur.body}
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center justify-between mt-6">
          <button data-testid="ob-skip" onClick={finish} className="text-sm text-[#7E8A93]">{tri("Salta", "Überspringen", "Skip")}</button>
          {step < 2 ? (
            <button data-testid="ob-next" onClick={() => setStep((x) => x + 1)}
              className="flex items-center gap-1 px-5 py-2.5 rounded-2xl bg-[#F26419] hover:bg-[#E8A838] text-white font-semibold">
              {tri("Avanti", "Weiter", "Next")} <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button data-testid="ob-finish" onClick={finish}
              className="flex items-center gap-1 px-5 py-2.5 rounded-2xl bg-[#F26419] hover:bg-[#E8A838] text-white font-semibold">
              <Check className="w-5 h-5" /> {tri("Inizia!", "Los geht's!", "Start!")}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
