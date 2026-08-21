import { useState, useEffect } from "react";
import { ListChecks, RotateCcw, CheckCircle2, Circle, DoorOpen, DoorClosed, Snowflake, Wrench } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const TEMPLATES = [
  {
    id: "apertura", Icon: DoorOpen, it: "Apertura Laboratorio", de: "Öffnung der Backstube",
    items: {
      it: ["Accendere forni e preriscaldare", "Controllare temperature celle frigo/freezer", "Verificare lievito madre / prefermenti", "Preparare postazioni e attrezzi", "Controllare scorte farina e ingredienti", "Igiene mani e divisa"],
      de: ["Öfen einschalten und vorheizen", "Temperaturen der Kühl-/Gefrierzellen prüfen", "Sauerteig / Vorteige kontrollieren", "Arbeitsplätze und Werkzeuge vorbereiten", "Mehl- und Zutatenvorräte prüfen", "Händehygiene und Arbeitskleidung"],
    },
  },
  {
    id: "chiusura", Icon: DoorClosed, it: "Chiusura Laboratorio", de: "Schließung der Backstube",
    items: {
      it: ["Spegnere forni e macchinari", "Pulire piani e attrezzi", "Coprire e riporre impasti/prefermenti", "Svuotare e pulire impastatrici", "Controllare chiusura celle", "Portare fuori i rifiuti", "Chiudere acqua e gas"],
      de: ["Öfen und Maschinen ausschalten", "Flächen und Werkzeuge reinigen", "Teige/Vorteige abdecken und lagern", "Kneter leeren und reinigen", "Zellen-Verschluss prüfen", "Müll rausbringen", "Wasser und Gas schließen"],
    },
  },
  {
    id: "celle", Icon: Snowflake, it: "Controllo Celle & Frigoriferi", de: "Kontrolle Zellen & Kühlschränke",
    items: {
      it: ["Temperatura cella frigo (0–4°C)", "Temperatura freezer (-18°C)", "Temperatura/umidità cella lievitazione", "Pulizia guarnizioni e ripiani", "Verifica assenza brina/ghiaccio", "Registrare le temperature (HACCP)"],
      de: ["Temperatur Kühlzelle (0–4°C)", "Temperatur Gefrierzelle (-18°C)", "Temperatur/Feuchte Gärzelle", "Dichtungen und Regale reinigen", "Auf Reif/Eis prüfen", "Temperaturen dokumentieren (HACCP)"],
    },
  },
  {
    id: "manutenzione", Icon: Wrench, it: "Manutenzione & Sanificazione Macchine", de: "Wartung & Reinigung Maschinen",
    items: {
      it: ["Pulire e sanificare impastatrici", "Controllare cinghie/olio impastatrice", "Pulire camere e teglie del forno", "Verificare sonde e vapore forno", "Pulire spezzatrice/formatrice", "Segnalare guasti o pezzi da ordinare"],
      de: ["Kneter reinigen und desinfizieren", "Riemen/Öl des Kneters prüfen", "Ofenkammern und Bleche reinigen", "Sonden und Dampf des Ofens prüfen", "Teigteiler/Former reinigen", "Störungen oder Ersatzteile melden"],
    },
  },
];

const KEY = "mikilab_checklists";

export default function Checklists() {
  const { lang } = useLang();
  const L = lang === "de" ? "de" : "it";
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
        <div className="w-11 h-11 rounded-2xl bg-[#5E8B7E] flex items-center justify-center"><ListChecks className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#EAF0EC]">{lang === "de" ? "Checklisten" : lang === "en" ? "Checklists" : "Check-list"}</h1>
          <p className="text-sm text-[#7E8A93]">{lang === "de" ? "Standard-Kontrollen der Backstube" : lang === "en" ? "Standard bakery checks" : "Controlli standard del laboratorio"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {TEMPLATES.map((tp) => {
          const on = tp.id === active;
          const st = checked[tp.id] || {};
          const d = tp.items[L].filter((_, i) => st[i]).length;
          return (
            <button key={tp.id} data-testid={`cl-tab-${tp.id}`} onClick={() => setActive(tp.id)}
              className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-colors ${on ? "bg-[#5E8B7E] text-white border-[#5E8B7E]" : "bg-white dark:bg-[#232A31] text-[#3F4A54] dark:text-[#AEB8BF] border-[#D7E1DB] dark:border-[#38424B]"}`}>
              <tp.Icon className={`w-5 h-5 shrink-0 ${on ? "text-white" : "text-[#5E8B7E]"}`} />
              <span className="text-xs font-semibold leading-tight">{tp[L]}<span className={`block text-[10px] font-mono-data ${on ? "text-white/80" : "text-[#7E8A93]"}`}>{d}/{tp.items[L].length}</span></span>
            </button>
          );
        })}
      </div>

      <div data-testid="cl-items" className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#EAF0EC] dark:bg-[#2A323A]">
          <span className="font-display font-semibold text-sm text-[#2B303B] dark:text-[#EAF0EC]">{tpl[L]}</span>
          <span className="font-mono-data text-xs font-bold text-[#5E8B7E]">{done}/{items.length}</span>
        </div>
        {items.map((it, i) => {
          const on = !!state[i];
          return (
            <button key={i} data-testid={`cl-item-${active}-${i}`} onClick={() => toggle(i)}
              className="w-full flex items-center gap-3 px-4 py-3 border-t border-[#D7E1DB] dark:border-[#38424B] text-left active:bg-[#EAF0EC] dark:active:bg-[#2A323A]">
              {on ? <CheckCircle2 className="w-5 h-5 text-[#6B8E62] shrink-0" /> : <Circle className="w-5 h-5 text-[#AEB8BF] shrink-0" />}
              <span className={`text-sm ${on ? "line-through text-[#9AA6AE]" : "text-[#2B303B] dark:text-[#EAF0EC]"}`}>{it}</span>
            </button>
          );
        })}
      </div>

      <button data-testid="cl-reset" onClick={reset} className="mt-3 text-sm text-[#7E8A93] flex items-center gap-1 mx-auto">
        <RotateCcw className="w-4 h-4" /> {lang === "de" ? "Zurücksetzen" : lang === "en" ? "Reset" : "Azzera"}
      </button>
    </div>
  );
}
