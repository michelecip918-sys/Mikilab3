import { useState } from "react";
import { Volume2, Check, ListChecks, Sparkles, Loader2 } from "lucide-react";
import { deusApi } from "@/lib/api";
import { playTTS, isTTSMuted } from "@/lib/tts";

// Checklist di apertura standard per reparto: l'operaio sa SEMPRE cosa fare,
// anche quando il Capo non ha ancora inviato il piano del giorno.
const LISTS = {
  panificio: {
    it: ["Accendi i forni e imposta le temperature", "Controlla e rinfresca il lievito madre", "Prepara teglie, farina di servizio e attrezzi", "Verifica le celle di lievitazione", "Pulizia e sanificazione del piano"],
    en: ["Turn on ovens and set temperatures", "Check and refresh the sourdough", "Prepare trays, dusting flour and tools", "Check the proofing cells", "Clean and sanitize the workbench"],
  },
  pasticceria: {
    it: ["Accendi forni e abbattitore", "Controlla frigo ingredienti e scadenze", "Prepara creme base e bagne", "Verifica la vetrina refrigerata", "Pulizia e sanificazione del piano"],
    en: ["Turn on ovens and blast chiller", "Check ingredient fridge and expiries", "Prepare base creams and syrups", "Check the refrigerated display", "Clean and sanitize the workbench"],
  },
  pizzeria: {
    it: ["Accendi il forno pizza", "Controlla la maturazione degli impasti", "Prepara condimenti e banco", "Porziona le palline", "Pulizia della postazione"],
    en: ["Turn on the pizza oven", "Check dough maturation", "Prepare toppings and the counter", "Portion the dough balls", "Clean the station"],
  },
  banco: {
    it: ["Controlla giacenze e scadenze", "Rifornisci il banco di vendita", "Verifica gli ordini in arrivo", "Etichetta e prezza i prodotti", "Pulizia banco e vetrine"],
    en: ["Check stock and expiries", "Restock the sales counter", "Check incoming orders", "Label and price the products", "Clean counter and displays"],
  },
};

export default function FloorOpeningChecklist({ lang, role }) {
  const it = lang === "it";
  const dept = (() => { try { return localStorage.getItem("mikilab_activity") || "panificio"; } catch { return "panificio"; } })();
  const list = (LISTS[dept] || LISTS.panificio)[it ? "it" : "en"];
  const [done, setDone] = useState({});
  const [ask, setAsk] = useState("");
  const [busy, setBusy] = useState(false);
  const toggle = (i) => setDone((d) => ({ ...d, [i]: !d[i] }));
  const read = (t) => { try { playTTS(t, { lang, voice: "mikemix" }); } catch { /* */ } };

  const askSitor = async () => {
    if (busy) return;
    setBusy(true); setAsk("");
    const q = it
      ? `Sono ${role || "un operaio"} nel reparto ${dept}. Non ho ancora un piano dal Capo: dimmi in modo semplice cosa devo fare adesso, passo per passo.`
      : `I'm ${role || "an operator"} in the ${dept} department. I don't have a plan from the Capo yet: tell me simply what to do now, step by step.`;
    try {
      const r = await deusApi.ask({ question: q, lang });
      setAsk(r.reply || "…");
      if (!isTTSMuted()) read(r.reply || "");
    } catch {
      setAsk(it ? "Sitor non risponde ora. Intanto segui la checklist qui sopra." : "Sitor is offline. Follow the checklist above for now.");
    }
    setBusy(false);
  };

  return (
    <div data-testid="floor-opening-checklist" className="rounded-2xl border border-[#8a97a6]/40 bg-[#0b0f19] p-4 space-y-3">
      <div>
        <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-[#8a97a6]"><ListChecks className="w-4 h-4" /> {it ? "Checklist di apertura" : "Opening checklist"}</p>
        <p className="text-[12px] text-[#94A3B8] mt-1">{it ? "Il piano non è ancora arrivato. Intanto parti da qui — tocca 🔊 per farti leggere ogni punto." : "The plan isn't in yet. Start here meanwhile — tap 🔊 to hear each point."}</p>
      </div>
      <ul className="space-y-2">
        {list.map((t, i) => (
          <li key={i} data-testid={`floor-opening-item-${i}`} className="flex items-center gap-2">
            <button data-testid={`floor-opening-check-${i}`} onClick={() => toggle(i)}
              className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border active:scale-95 transition-all ${done[i] ? "bg-[#6e9e85] border-[#6e9e85] text-[#030712]" : "border-[#334155] text-[#334155]"}`}>
              <Check className="w-4 h-4" />
            </button>
            <span className={`flex-1 text-[13px] leading-snug ${done[i] ? "text-[#64748B] line-through" : "text-white"}`}>{t}</span>
            <button data-testid={`floor-opening-read-${i}`} onClick={() => read(t)} className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-[#8a97a6]/15 text-[#8a97a6] active:scale-95 transition-all">
              <Volume2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="pt-2 border-t border-[#1e293b]">
        <button data-testid="floor-ask-sitor-btn" onClick={askSitor} disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm text-[#030712] active:scale-95 transition-all disabled:opacity-60"
          style={{ background: "linear-gradient(90deg,#8a97a6,#9aa6b2)" }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {it ? "Chiedi a Sitor cosa fare" : "Ask Sitor what to do"}
        </button>
        {ask && <p data-testid="floor-ask-sitor-reply" className="mt-2 text-[12.5px] text-[#E8EEF5] leading-relaxed whitespace-pre-line">{ask}</p>}
      </div>
    </div>
  );
}
