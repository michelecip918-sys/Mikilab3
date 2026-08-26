import { useState } from "react";
import { Cog, Check } from "lucide-react";
import { MACHINE_CATEGORIES, getActiveMachineIds, setActiveMachineIds } from "@/lib/machines";
import { useLang } from "@/i18n/LanguageContext";

// Parco Macchine: ON/OFF dei macchinari professionali. Le scelte adattano ricette e piani via AI.
export default function MachinePark() {
  const { lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const [active, setActive] = useState(() => new Set(getActiveMachineIds()));

  const toggle = (id) => {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      setActiveMachineIds([...next]);
      return next;
    });
  };

  const total = active.size;

  return (
    <div data-testid="machine-park" className="pb-4">
      <div className="rounded-3xl bg-gradient-to-br from-[#3f7cac] to-[#234b6e] text-white p-5 mb-4 shadow-lg">
        <Cog className="w-7 h-7 mb-2" />
        <h2 className="font-display text-xl font-bold">{tri("Parco Macchine", "Maschinenpark", "Machine Park")}</h2>
        <p className="text-white/85 text-sm mt-1 leading-snug">
          {tri("Accendi i macchinari del tuo laboratorio: le ricette e i piani verranno adattati automaticamente (modalità di produzione, resa oraria, stress meccanico e punti d'attenzione).",
            "Aktiviere deine Maschinen: Rezepte und Pläne werden automatisch angepasst (Produktionsmodus, Stundenleistung, mechanischer Stress, Hinweise).",
            "Turn on your machines: recipes and plans adapt automatically (production mode, hourly yield, mechanical stress and attention points).")}
        </p>
        <p className="mt-2 inline-block text-xs font-bold bg-white/20 px-3 py-1 rounded-full" data-testid="machine-count">{total} {tri("attivi", "aktiv", "active")}</p>
      </div>

      <div className="space-y-4">
        {MACHINE_CATEGORIES.map((c) => (
          <div key={c.id} data-testid={`machine-cat-${c.id}`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#234b6e] dark:text-[#a9d2ec] mb-2 px-1">{tri(c.it, c.de, c.en)}</p>
            <div className="space-y-2">
              {c.machines.map((m) => {
                const on = active.has(m.id);
                return (
                  <button key={m.id} data-testid={`machine-${m.id}`} onClick={() => toggle(m.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl p-3.5 text-left border transition-all active:scale-98 ${on ? "bg-[#3f7cac] text-white border-[#3f7cac] shadow" : "bg-white dark:bg-[#232A31] text-[#2B303B] dark:text-[#EAF0EC] border-[#d5e4f0] dark:border-[#38424B]"}`}>
                    <span className={`w-10 h-6 rounded-full flex items-center px-0.5 shrink-0 transition-colors ${on ? "bg-white/30 justify-end" : "bg-[#d5e4f0] dark:bg-[#38424B] justify-start"}`}>
                      <span className={`w-5 h-5 rounded-full bg-white flex items-center justify-center ${on ? "text-[#3f7cac]" : "text-transparent"}`}>{on && <Check className="w-3.5 h-3.5" />}</span>
                    </span>
                    <span className="flex-1 min-w-0 text-sm font-semibold leading-tight">{tri(m.it, m.de, m.en)}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${on ? "bg-white/25 text-white" : "bg-[#e4eff8] dark:bg-[#2A323A] text-[#9aa4ac]"}`}>{on ? "ON" : "OFF"}</span>
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
