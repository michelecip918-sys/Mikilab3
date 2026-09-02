import { mkTri } from "@/i18n/triMaps";
import { useState, useEffect } from "react";
import { Users, Plus, X, Bluetooth, Headphones } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { ZONES, zoneLabel } from "@/lib/brigata";

const KEY = "mikilab_shifts";
const ROLES = {
  it: ["Operatore Impastatrice", "Operatore Formatura / Tavolo", "Operatore Forni", "Celle & Lievitazione", "Pulizie & Sanificazione", "Vendita / Banco"],
  de: ["Kneter-Bediener", "Formen / Tisch", "Öfen-Bediener", "Gärzellen", "Reinigung & Hygiene", "Verkauf / Theke"],
  en: ["Mixer operator", "Shaping / Bench", "Oven operator", "Cells & Proofing", "Cleaning & Sanitising", "Sales / Counter"],
};

export default function ShiftRoles() {
  const { lang } = useLang();
  const roles = ROLES[mkTri(lang)("it", "de", "en")];
  const [people, setPeople] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(people)); }, [people]);

  const add = () => setPeople((p) => [...p, { id: `${Date.now()}`, name: "", role: roles[0], task: "", earphone: "", zone: "impasti", shiftStart: "", changeTo: "", changeAt: "" }]);
  const upd = (id, patch) => setPeople((p) => p.map((x) => x.id === id ? { ...x, ...patch } : x));
  const del = (id) => setPeople((p) => p.filter((x) => x.id !== id));

  // Associa un auricolare Bluetooth all'operatore (best-effort via Web Bluetooth).
  const pairEarphone = async (id) => {
    try {
      if (!navigator.bluetooth) { toast.error(mkTri(lang)("Bluetooth non supportato dal browser.", "Bluetooth nicht unterstützt.", "Bluetooth not supported.", "Bluetooth no soportado.")); return; }
      const dev = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
      const nm = dev && (dev.name || dev.id) ? (dev.name || dev.id) : mkTri(lang)("Auricolare", "Headset", "Headset", "Auricular");
      upd(id, { earphone: nm });
      toast.success(mkTri(lang)(`Auricolare «${nm}» associato.`, `Headset «${nm}» verbunden.`, `Headset «${nm}» paired.`, `Auricular «${nm}» asociado.`));
    } catch { /* annullato dall'utente */ }
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#c94f00] flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{mkTri(lang)("Turni & Mansioni", "Schichten & Aufgaben", "Shifts & Roles")}</h1>
          <p className="text-sm text-[#7E8A93]">{mkTri(lang)("Assegna i ruoli al team", "Rollen im Team zuweisen", "Assign roles to the team")}</p>
        </div>
      </div>

      <div className="space-y-3 pb-24" data-testid="shift-list">
        {people.length === 0 && <p className="text-sm text-[#9AA6AE] text-center py-6">{mkTri(lang)("Nessuno in turno.", "Noch niemand im Einsatz.", "No one on shift yet.")}</p>}
        {people.map((p) => (
          <div key={p.id} data-testid={`shift-${p.id}`} className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input data-testid={`shift-name-${p.id}`} value={p.name} placeholder={mkTri(lang)("Nome", "Name", "Name")}
                onChange={(e) => upd(p.id, { name: e.target.value })}
                className="flex-1 min-w-0 bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg p-2 text-sm outline-none focus:border-[#c94f00]" />
              <button onClick={() => del(p.id)} className="text-[#c94f00] p-1"><X className="w-4 h-4" /></button>
            </div>
            <select data-testid={`shift-role-${p.id}`} value={p.role} onChange={(e) => upd(p.id, { role: e.target.value })}
              className="w-full bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg p-2 text-sm outline-none focus:border-[#c94f00]">
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input data-testid={`shift-task-${p.id}`} value={p.task} placeholder={mkTri(lang)("Compito / nota (opzionale)", "Aufgabe / Notiz (optional)", "Task / note (optional)")}
              onChange={(e) => upd(p.id, { task: e.target.value })}
              className="w-full bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] rounded-lg p-2 text-sm outline-none focus:border-[#c94f00]" />
            {/* Auricolare Bluetooth associato all'operatore */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 flex items-center gap-2 bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg p-2">
                <Headphones className="w-4 h-4 text-[#c94f00] shrink-0" />
                <input data-testid={`shift-earphone-${p.id}`} value={p.earphone || ""} placeholder={mkTri(lang)("Auricolare Bluetooth (nome)", "Bluetooth-Headset (Name)", "Bluetooth earphone (name)", "Auricular Bluetooth (nombre)")}
                  onChange={(e) => upd(p.id, { earphone: e.target.value })}
                  className="flex-1 min-w-0 bg-transparent text-sm outline-none" />
              </div>
              <button data-testid={`shift-pair-${p.id}`} onClick={() => pairEarphone(p.id)}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#3B82F6] hover:bg-[#2f6fd6] px-3 py-2 rounded-lg active:scale-95">
                <Bluetooth className="w-3.5 h-3.5" /> {mkTri(lang)("Collega", "Verbinden", "Pair", "Conectar")}
              </button>
            </div>
            {/* Brigata: zona di lavoro + orario turno */}
            <div className="grid grid-cols-2 gap-2">
              <select data-testid={`shift-zone-${p.id}`} value={p.zone || "impasti"} onChange={(e) => upd(p.id, { zone: e.target.value })}
                className="bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg p-2 text-sm outline-none focus:border-[#c94f00]">
                {ZONES.map((z) => <option key={z.id} value={z.id}>{zoneLabel(z.id, lang)}</option>)}
              </select>
              <input type="time" data-testid={`shift-start-${p.id}`} value={p.shiftStart || ""} onChange={(e) => upd(p.id, { shiftStart: e.target.value })}
                className="bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg p-2 text-sm outline-none focus:border-[#c94f00]" title={mkTri(lang)("Inizio turno", "Schichtbeginn", "Shift start", "Inicio turno")} />
            </div>
            {/* Cambio mansione programmato (avviso vocale automatico) */}
            <div className="grid grid-cols-2 gap-2 items-center rounded-lg bg-[#c94f00]/8 border border-[#c94f00]/25 p-2">
              <div className="col-span-2 text-[11px] font-bold uppercase tracking-wide text-[#c94f00]">{mkTri(lang)("Cambio mansione (avviso vocale)", "Aufgabenwechsel (Sprachhinweis)", "Role change (voice alert)", "Cambio de tarea (aviso de voz)")}</div>
              <select data-testid={`shift-changeto-${p.id}`} value={p.changeTo || ""} onChange={(e) => upd(p.id, { changeTo: e.target.value })}
                className="bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg p-2 text-sm outline-none focus:border-[#c94f00]">
                <option value="">{mkTri(lang)("Nessuno", "Keiner", "None", "Ninguno")}</option>
                {ZONES.map((z) => <option key={z.id} value={z.id}>{zoneLabel(z.id, lang)}</option>)}
              </select>
              <input type="time" data-testid={`shift-changeat-${p.id}`} value={p.changeAt || ""} onChange={(e) => upd(p.id, { changeAt: e.target.value })}
                className="bg-[#e4eff8] dark:bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg p-2 text-sm outline-none focus:border-[#c94f00]" title={mkTri(lang)("Orario cambio", "Wechselzeit", "Change time", "Hora del cambio")} />
            </div>
          </div>
        ))}
      </div>

      <button data-testid="shift-add" onClick={add} className="w-full mt-4 bg-[#c94f00] hover:bg-[#d4a373] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" /> {mkTri(lang)("Aggiungi persona", "Person hinzufügen", "Add person")}
      </button>
    </div>
  );
}
