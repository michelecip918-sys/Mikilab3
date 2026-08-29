import { mkTri } from "@/i18n/triMaps";
import { useState, useEffect } from "react";
import { Users, Plus, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

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

  const add = () => setPeople((p) => [...p, { id: `${Date.now()}`, name: "", role: roles[0], task: "" }]);
  const upd = (id, patch) => setPeople((p) => p.map((x) => x.id === id ? { ...x, ...patch } : x));
  const del = (id) => setPeople((p) => p.filter((x) => x.id !== id));

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#ff6b00] flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{mkTri(lang)("Turni & Mansioni", "Schichten & Aufgaben", "Shifts & Roles")}</h1>
          <p className="text-sm text-[#7E8A93]">{mkTri(lang)("Assegna i ruoli al team", "Rollen im Team zuweisen", "Assign roles to the team")}</p>
        </div>
      </div>

      <div className="space-y-3" data-testid="shift-list">
        {people.length === 0 && <p className="text-sm text-[#9AA6AE] text-center py-6">{mkTri(lang)("Nessuno in turno.", "Noch niemand im Einsatz.", "No one on shift yet.")}</p>}
        {people.map((p) => (
          <div key={p.id} data-testid={`shift-${p.id}`} className="rounded-2xl bg-white dark:bg-[#1e1e1e] border border-[#2b2b2b] dark:border-[#2e2e2e] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input data-testid={`shift-name-${p.id}`} value={p.name} placeholder={mkTri(lang)("Nome", "Name", "Name")}
                onChange={(e) => upd(p.id, { name: e.target.value })}
                className="flex-1 min-w-0 bg-[#e4eff8] dark:bg-[#242424] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-lg p-2 text-sm outline-none focus:border-[#ff6b00]" />
              <button onClick={() => del(p.id)} className="text-[#ff6b00] p-1"><X className="w-4 h-4" /></button>
            </div>
            <select data-testid={`shift-role-${p.id}`} value={p.role} onChange={(e) => upd(p.id, { role: e.target.value })}
              className="w-full bg-[#e4eff8] dark:bg-[#242424] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-lg p-2 text-sm outline-none focus:border-[#ff6b00]">
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input data-testid={`shift-task-${p.id}`} value={p.task} placeholder={mkTri(lang)("Compito / nota (opzionale)", "Aufgabe / Notiz (optional)", "Task / note (optional)")}
              onChange={(e) => upd(p.id, { task: e.target.value })}
              className="w-full bg-[#e4eff8] dark:bg-[#242424] border border-[#2b2b2b] dark:border-[#2e2e2e] rounded-lg p-2 text-sm outline-none focus:border-[#ff6b00]" />
          </div>
        ))}
      </div>

      <button data-testid="shift-add" onClick={add} className="w-full mt-4 bg-[#ff6b00] hover:bg-[#ff8a33] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" /> {mkTri(lang)("Aggiungi persona", "Person hinzufügen", "Add person")}
      </button>
    </div>
  );
}
