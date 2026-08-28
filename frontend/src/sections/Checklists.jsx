import { mkTri } from "@/i18n/triMaps";
import { useState, useEffect } from "react";
import { ListChecks, RotateCcw, CheckCircle2, Circle, DoorOpen, DoorClosed, Snowflake, Wrench } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const TEMPLATES = [
  {
    id: "apertura", Icon: DoorOpen, it: "Apertura Laboratorio", de: "Öffnung der Backstube", en: "Opening the Lab",
    items: {
      it: ["Accendere forni e preriscaldare", "Controllare temperature celle frigo/freezer", "Verificare lievito madre / prefermenti", "Preparare postazioni e attrezzi", "Controllare scorte farina e ingredienti", "Igiene mani e divisa"],
      de: ["Öfen einschalten und vorheizen", "Temperaturen der Kühl-/Gefrierzellen prüfen", "Sauerteig / Vorteige kontrollieren", "Arbeitsplätze und Werkzeuge vorbereiten", "Mehl- und Zutatenvorräte prüfen", "Händehygiene und Arbeitskleidung"],
      en: ["Turn on and preheat the ovens", "Check fridge/freezer cell temperatures", "Check sourdough / preferments", "Prepare stations and tools", "Check flour and ingredient stock", "Hand hygiene and uniform"],
    },
  },
  {
    id: "chiusura", Icon: DoorClosed, it: "Chiusura Laboratorio", de: "Schließung der Backstube", en: "Closing the Lab",
    items: {
      it: ["Spegnere forni e macchinari", "Pulire piani e attrezzi", "Coprire e riporre impasti/prefermenti", "Svuotare e pulire impastatrici", "Controllare chiusura celle", "Portare fuori i rifiuti", "Chiudere acqua e gas"],
      de: ["Öfen und Maschinen ausschalten", "Flächen und Werkzeuge reinigen", "Teige/Vorteige abdecken und lagern", "Kneter leeren und reinigen", "Zellen-Verschluss prüfen", "Müll rausbringen", "Wasser und Gas schließen"],
      en: ["Turn off ovens and machines", "Clean surfaces and tools", "Cover and store doughs/preferments", "Empty and clean the mixers", "Check the cells are closed", "Take out the rubbish", "Shut off water and gas"],
    },
  },
  {
    id: "celle", Icon: Snowflake, it: "Controllo Celle & Frigoriferi", de: "Kontrolle Zellen & Kühlschränke", en: "Cells & Fridges Check",
    items: {
      it: ["Temperatura cella frigo (0–4°C)", "Temperatura freezer (-18°C)", "Temperatura/umidità cella lievitazione", "Pulizia guarnizioni e ripiani", "Verifica assenza brina/ghiaccio", "Registrare le temperature (HACCP)"],
      de: ["Temperatur Kühlzelle (0–4°C)", "Temperatur Gefrierzelle (-18°C)", "Temperatur/Feuchte Gärzelle", "Dichtungen und Regale reinigen", "Auf Reif/Eis prüfen", "Temperaturen dokumentieren (HACCP)"],
      en: ["Fridge cell temperature (0–4°C)", "Freezer temperature (-18°C)", "Proofing cell temperature/humidity", "Clean seals and shelves", "Check for frost/ice", "Record temperatures (HACCP)"],
    },
  },
  {
    id: "manutenzione", Icon: Wrench, it: "Manutenzione & Sanificazione Macchine", de: "Wartung & Reinigung Maschinen", en: "Machine Maintenance & Sanitising",
    items: {
      it: ["Pulire e sanificare impastatrici", "Controllare cinghie/olio impastatrice", "Pulire camere e teglie del forno", "Verificare sonde e vapore forno", "Pulire spezzatrice/formatrice", "Segnalare guasti o pezzi da ordinare"],
      de: ["Kneter reinigen und desinfizieren", "Riemen/Öl des Kneters prüfen", "Ofenkammern und Bleche reinigen", "Sonden und Dampf des Ofens prüfen", "Teigteiler/Former reinigen", "Störungen oder Ersatzteile melden"],
      en: ["Clean and sanitise the mixers", "Check mixer belts/oil", "Clean oven chambers and trays", "Check oven probes and steam", "Clean divider/moulder", "Report faults or parts to order"],
    },
  },
];

const KEY = "mikilab_checklists";

export default function Checklists() {
  const { lang } = useLang();
  const L = mkTri(lang)("it", "de", "en");
  const [active, setActive] = useState("apertura");
  const [checked, setChecked] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(checked)); }, [checked]);

  const tpl = TEMPLATES.find((x) => x.id === active);
  const items = tpl.items[L];
  const state = checked[active] || {};
  const done = items.filter((_, i) => state[i]).length;

  const toggle = (i) => setChecked((c) => ({ ...c, [active]: { ...(c[active] || {}), [i]: !(c[active] || {})[i] } }));
  const reset = () => setChecked((c) => ({ ...c, [active]: {} }));

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#8C4A27] flex items-center justify-center"><ListChecks className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{mkTri(lang)("Check-list", "Checklisten", "Checklists")}</h1>
          <p className="text-sm text-[#7E8A93]">{mkTri(lang)("Controlli standard del laboratorio", "Standard-Kontrollen der Backstube", "Standard bakery checks")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {TEMPLATES.map((tp) => {
          const on = tp.id === active;
          const st = checked[tp.id] || {};
          const d = tp.items[L].filter((_, i) => st[i]).length;
          return (
            <button key={tp.id} data-testid={`cl-tab-${tp.id}`} onClick={() => setActive(tp.id)}
              className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-colors ${on ? "bg-[#8C4A27] text-white border-[#8C4A27]" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#E6D8C3] dark:border-[#38424B]"}`}>
              <tp.Icon className={`w-5 h-5 shrink-0 ${on ? "text-white" : "text-[#8C4A27]"}`} />
              <span className="text-xs font-semibold leading-tight">{tp[L]}<span className={`block text-[10px] font-mono-data ${on ? "text-white/80" : "text-[#7E8A93]"}`}>{d}/{tp.items[L].length}</span></span>
            </button>
          );
        })}
      </div>

      <div data-testid="cl-items" className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#e4eff8] dark:bg-[#2A323A]">
          <span className="font-display font-semibold text-sm text-[#2B303B] dark:text-[#e4eff8]">{tpl[L]}</span>
          <span className="font-mono-data text-xs font-bold text-[#8C4A27]">{done}/{items.length}</span>
        </div>
        {items.map((it, i) => {
          const on = !!state[i];
          return (
            <button key={i} data-testid={`cl-item-${active}-${i}`} onClick={() => toggle(i)}
              className="w-full flex items-center gap-3 px-4 py-3 border-t border-[#E6D8C3] dark:border-[#38424B] text-left active:bg-[#e4eff8] dark:active:bg-[#2A323A]">
              {on ? <CheckCircle2 className="w-5 h-5 text-[#B45309] shrink-0" /> : <Circle className="w-5 h-5 text-[#AEB8BF] shrink-0" />}
              <span className={`text-sm ${on ? "line-through text-[#9AA6AE]" : "text-[#2B303B] dark:text-[#e4eff8]"}`}>{it}</span>
            </button>
          );
        })}
      </div>

      <button data-testid="cl-reset" onClick={reset} className="mt-3 text-sm text-[#7E8A93] flex items-center gap-1 mx-auto">
        <RotateCcw className="w-4 h-4" /> {mkTri(lang)("Azzera", "Zurücksetzen", "Reset")}
      </button>
    </div>
  );
}
