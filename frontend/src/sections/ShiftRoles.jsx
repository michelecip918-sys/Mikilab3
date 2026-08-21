import { useState, useEffect } from "react";
import { Users, Plus, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const KEY = "mikilab_shifts";
const ROLES = {
  it: ["Operatore Impastatrice", "Operatore Formatura / Tavolo", "Operatore Forni", "Celle & Lievitazione", "Pulizie & Sanificazione", "Vendita / Banco"],
  de: ["Kneter-Bediener", "Formen / Tisch", "Öfen-Bediener", "Gärzellen", "Reinigung & Hygiene", "Verkauf / Theke"],
};

export default function ShiftRoles() {
  const { lang } = useLang();
  const roles = ROLES[lang === "de" ? "de" : "it"];
  const [people, setPeople] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(people)); }, [people]);

  const add = () => setPeople((p) => [...p, { id: `${Date.now()}`, name: "", role: roles[0], task: "" }]);
  const upd = (id, patch) => setPeople((p) => p.map((x) => x.id === id ? { ...x, ...patch } : x));
  const del = (id) => setPeople((p) => p.filter((x) => x.id !== id));

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#5E8B7E] flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#EAF0EC]">{lang === "de" ? "Schichten & Aufgaben" : lang === "en" ? "Shifts & Roles" : "Turni & Mansioni"}</h1>
          <p className="text-sm text-[#7E8A93]">{lang === "de" ? "Rollen im Team zuweisen" : lang === "en" ? "Assign roles to the team" : "Assegna i ruoli al team"}</p>
        </div>
      </div>

      <div className="space-y-3" data-testid="shift-list">
        {people.length === 0 && <p className="text-sm text-[#9AA6AE] text-center py-6">{lang === "de" ? "Noch niemand im Einsatz." : lang === "en" ? "No one on shift yet." : "Nessuno in turno."}</p>}
        {people.map((p) => (
          <div key={p.id} data-testid={`shift-${p.id}`} className="rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input data-testid={`shift-name-${p.id}`} value={p.name} placeholder={lang === "de" ? "Name" : lang === "en" ? "Name" : "Nome"}
                onChange={(e) => upd(p.id, { name: e.target.value })}
                className="flex-1 min-w-0 bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#5E8B7E]" />
              <button onClick={() => del(p.id)} className="text-[#C0574D] p-1"><X className="w-4 h-4" /></button>
            </div>
            <select data-testid={`shift-role-${p.id}`} value={p.role} onChange={(e) => upd(p.id, { role: e.target.value })}
              className="w-full bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#5E8B7E]">
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input data-testid={`shift-task-${p.id}`} value={p.task} placeholder={lang === "de" ? "Aufgabe / Notiz (optional)" : lang === "en" ? "Task / note (optional)" : "Compito / nota (opzionale)"}
              onChange={(e) => upd(p.id, { task: e.target.value })}
              className="w-full bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg p-2 text-sm outline-none focus:border-[#5E8B7E]" />
          </div>
        ))}
      </div>

      <button data-testid="shift-add" onClick={add} className="w-full mt-4 bg-[#5E8B7E] hover:bg-[#4C7368] text-white font-semibold px-5 py-3 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" /> {lang === "de" ? "Person hinzufügen" : lang === "en" ? "Add person" : "Aggiungi persona"}
      </button>
    </div>
  );
}
