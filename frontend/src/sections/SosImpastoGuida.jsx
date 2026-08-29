import { mkTri } from "@/i18n/triMaps";
import { useState } from "react";
import { ChevronRight, Stethoscope, ChevronDown, Camera } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const DEFECTS = [
  { emoji: "🫠", it: "Impasto troppo appiccicoso", cause: "Idratazione alta per la forza della farina, o glutine non sviluppato.",
    fix: "Usa una farina più forte (W maggiore), incorda bene prima del bassinage e fai pieghe di rinforzo. Bagna le mani, non aggiungere farina." },
  { emoji: "😴", it: "Non lievita / lievita poco", cause: "Lievito debole o poco, ambiente freddo, sale a contatto col lievito.",
    fix: "Verifica che il lievito madre sia al culmine (raddoppiato), tieni l'impasto a 24-26°C, non mettere mai sale e lievito insieme a secco." },
  { emoji: "🧱", it: "Alveolatura chiusa e compatta", cause: "Poca lievitazione, impasto troppo lavorato o troppa farina.",
    fix: "Allunga la puntata, aumenta leggermente l'idratazione, pieghe delicate e non sgonfiare in formatura." },
  { emoji: "🎈", it: "Alveolatura troppo grande / irregolare", cause: "Sovra-lievitazione o formatura poco stretta.",
    fix: "Riduci i tempi di appretto, dai una pirlatura più decisa e crea tensione superficiale in formatura." },
  { emoji: "😶", it: "Crosta pallida", cause: "Forno poco caldo, pochi zuccheri residui, troppa lievitazione.",
    fix: "Alza la temperatura, aggiungi un filo di malto, non far sovra-maturare l'impasto." },
  { emoji: "🪨", it: "Crosta troppo dura o spessa", cause: "Troppa cottura a secco o assenza di vapore all'inizio.",
    fix: "Vapore nei primi 10 minuti, poi asciuga; abbassa un po' la temperatura negli ultimi minuti." },
  { emoji: "🫓", it: "Il pane si spiana in cottura", cause: "Impasto sovra-lievitato o poca forza/tensione.",
    fix: "Inforna leggermente prima del punto massimo, migliora la formatura e usa una farina più forte." },
  { emoji: "🍋", it: "Sapore troppo acido", cause: "Lievito madre gestito male o maturazione troppo lunga/calda.",
    fix: "Rinfresca più spesso il lievito madre, riduci i tempi o abbassa la temperatura di maturazione." },
];

export default function SosImpastoGuida({ onBack, onOpenTool }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [open, setOpen] = useState(null);

  return (
    <div className="pb-8" data-testid="sos-impasto">
      {onBack && <button data-testid="sos-back" onClick={onBack} className="flex items-center gap-1 text-[#ff6b00] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back", "Atrás")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#161616] shadow-xl mb-5" style={{ background: "linear-gradient(135deg,#ff6b00,#ff6b00 60%,#ff6b00)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><Stethoscope className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("SOS Impasto — Trova il Tuo Errore", "SOS Teig — Finde deinen Fehler", "Dough SOS — Find Your Mistake", "SOS Masa — Encuentra tu Error")}</h1>
        <p className="text-[#161616]/85 text-sm mt-2 leading-snug">{L("Scegli il problema che vedi: ti spiego la causa e come rimediare.", "Wähle dein Problem: Ursache und Lösung.", "Pick the problem you see: cause and fix.", "Elige el problema: causa y solución.")}</p>
      </div>

      <div className="space-y-2.5" data-testid="sos-list">
        {DEFECTS.map((d, i) => {
          const isOpen = open === i;
          return (
            <div key={i} data-testid={`sos-item-${i}`} className="rounded-2xl bg-[#121212] dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] overflow-hidden shadow-sm">
              <button data-testid={`sos-toggle-${i}`} onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center gap-3 p-4 text-left">
                <span className="text-2xl">{d.emoji}</span>
                <p className="flex-1 font-display text-[15px] font-bold text-[#ff6b00] dark:text-[#e4eff8] leading-tight">{d.it}</p>
                <ChevronDown className={`w-5 h-5 text-[#ff6b00] transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-2 text-[13.5px] leading-relaxed">
                  <p className="text-[#ff6b00] dark:text-[#AEB8BF]"><span className="font-bold text-[#ff6b00]">{L("Causa:", "Ursache:", "Cause:", "Causa:")} </span>{d.cause}</p>
                  <p className="text-[#ff6b00] dark:text-[#AEB8BF]"><span className="font-bold text-[#2e8b6f]">{L("Rimedio:", "Lösung:", "Fix:", "Solución:")} </span>{d.fix}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {onOpenTool && (
        <button data-testid="sos-open-ai" onClick={() => onOpenTool("diagnosi")}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#ff6b00] hover:bg-[#ff6b00] text-[#161616] font-semibold px-5 py-3.5 active:scale-98 transition-all">
          <Camera className="w-5 h-5" /> {L("Non lo trovi? Prova la Diagnosi Foto IA", "Nicht dabei? Foto-Diagnose testen", "Not listed? Try AI Photo Diagnosis", "¿No está? Prueba la Diagnosis por Foto")}
        </button>
      )}
    </div>
  );
}
