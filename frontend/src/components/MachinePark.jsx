import { useState } from "react";
import { Cog, Check, Bookmark, Plus, X } from "lucide-react";
import ModuleParams from "@/components/ModuleParams";
import { MACHINE_CATEGORIES, getActiveMachineIds, setActiveMachineIds, BUILTIN_PRESETS, getUserPresets, saveUserPreset, deleteUserPreset, presetLabel } from "@/lib/machines";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Parco Macchine: ON/OFF dei macchinari professionali. Le scelte adattano ricette e piani via AI.
export default function MachinePark() {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [active, setActive] = useState(() => new Set(getActiveMachineIds()));
  const [userPresets, setUserPresets] = useState(() => getUserPresets());

  const commit = (set) => { setActive(new Set(set)); setActiveMachineIds([...set]); };
  const toggle = (id) => {
    const next = new Set(active);
    next.has(id) ? next.delete(id) : next.add(id);
    commit(next);
  };
  const applyPreset = (ids) => commit(new Set(ids));
  const savePreset = () => {
    const name = (window.prompt(tri("Nome del preset (es. Linea Pane):", "Preset-Name (z.B. Brotlinie):", "Preset name (e.g. Bread line):")) || "").trim();
    if (!name || active.size === 0) return;
    setUserPresets(saveUserPreset(name, [...active]));
  };
  const removePreset = (id) => setUserPresets(deleteUserPreset(id));

  const total = active.size;
  const allPresets = [...BUILTIN_PRESETS, ...userPresets];

  return (
    <div data-testid="machine-park" className="pb-4">
      <ModuleParams screen="parco" />
      <div className="rounded-3xl bg-gradient-to-br from-[#3E9C93] to-[#3E9C93] text-white p-5 mb-4 shadow-lg">
        <Cog className="w-7 h-7 mb-2" />
        <h2 className="font-display text-xl font-bold">{tri("Parco Macchine", "Maschinenpark", "Machine Park")}</h2>
        <p className="text-white/85 text-sm mt-1 leading-snug">
          {tri("Accendi i macchinari del tuo laboratorio: le ricette e i piani verranno adattati automaticamente (modalità di produzione, resa oraria, stress meccanico e punti d'attenzione).",
            "Aktiviere deine Maschinen: Rezepte und Pläne werden automatisch angepasst (Produktionsmodus, Stundenleistung, mechanischer Stress, Hinweise).",
            "Turn on your machines: recipes and plans adapt automatically (production mode, hourly yield, mechanical stress and attention points).")}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-block text-xs font-bold bg-white/20 px-3 py-1 rounded-full" data-testid="machine-count">{total} {tri("attivi", "aktiv", "active")}</span>
          {total > 0 && (
            <button data-testid="machine-reset" onClick={() => { setActive(new Set()); setActiveMachineIds([]); }}
              className="text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full active:scale-95 transition-all">
              {tri("Spegni tutte", "Alle aus", "Turn all off")}
            </button>
          )}
        </div>
      </div>

      <div data-testid="machine-presets" className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#3E9C93] dark:text-[#a9d2ec] flex items-center gap-1.5"><Bookmark className="w-4 h-4" />{tri("Preset laboratorio", "Labor-Presets", "Lab presets")}</p>
          <button data-testid="machine-save-preset" onClick={savePreset}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3E9C93] border border-[#2A3B49] dark:border-[#2A3B49] bg-white dark:bg-[#1B2A38] px-2.5 py-1 rounded-full active:scale-95">
            <Plus className="w-3.5 h-3.5" />{tri("Salva attuali", "Aktuelle speichern", "Save current")}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {allPresets.map((p) => (
            <span key={p.id} data-testid={`preset-${p.id}`} className="inline-flex items-center gap-1 rounded-full bg-[#3E9C93]/12 border border-[#3E9C93]/40 pl-3 pr-2 py-1">
              <button onClick={() => applyPreset(p.ids)} className="text-xs font-semibold text-[#3E9C93] dark:text-[#a9d2ec]">{presetLabel(p, lang)}</button>
              {!p.builtin && <button data-testid={`preset-del-${p.id}`} onClick={() => removePreset(p.id)} className="text-[#3E9C93]"><X className="w-3.5 h-3.5" /></button>}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {MACHINE_CATEGORIES.map((c) => (
          <div key={c.id} data-testid={`machine-cat-${c.id}`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#3E9C93] dark:text-[#a9d2ec] mb-2 px-1">{tri(c.it, c.de, c.en)}</p>
            <div className="space-y-2">
              {c.machines.map((m) => {
                const on = active.has(m.id);
                return (
                  <button key={m.id} data-testid={`machine-${m.id}`} onClick={() => toggle(m.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl p-3.5 text-left border transition-all active:scale-98 ${on ? "bg-[#3E9C93] text-white border-[#3E9C93] shadow" : "bg-white dark:bg-[#1B2A38] text-[#2B303B] dark:text-[#EAF0EC] border-[#2A3B49] dark:border-[#2A3B49]"}`}>
                    <span className={`w-10 h-6 rounded-full flex items-center px-0.5 shrink-0 transition-colors ${on ? "bg-white/30 justify-end" : "bg-[#2A3B49] dark:bg-[#2A3B49] justify-start"}`}>
                      <span className={`w-5 h-5 rounded-full bg-white flex items-center justify-center ${on ? "text-[#3E9C93]" : "text-transparent"}`}>{on && <Check className="w-3.5 h-3.5" />}</span>
                    </span>
                    <span className="flex-1 min-w-0 text-sm font-semibold leading-tight">{tri(m.it, m.de, m.en)}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${on ? "bg-white/25 text-white" : "bg-[#e4eff8] dark:bg-[#1B2A38] text-[#9aa4ac]"}`}>{on ? "ON" : "OFF"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
