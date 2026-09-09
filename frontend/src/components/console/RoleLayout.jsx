import { useEffect, useState, useCallback } from "react";
import { LayoutGrid, Wheat, ClipboardList, Wrench } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// v14 · Layout per Ruolo: la plancia si adatta ISTANTANEAMENTE al ruolo attivo
// mostrando solo i moduli pertinenti (fornaio / capo linea / manutentore).
const ALL_PANELS = [
  "panel-emergency", "panel-autoplan", "panel-thermalflow", "panel-ovenqc", "panel-b2b", "panel-carbon",
  "panel-twin", "panel-ordine", "panel-ricette", "panel-magazzino", "panel-planner", "panel-ordini",
  "panel-radar", "panel-pin", "panel-docs", "panel-elite", "panel-hardware", "panel-security",
  "panel-silos", "panel-proofing", "panel-agv", "panel-timeline", "panel-packaging", "panel-shiftreport",
];
const ROLE_PANELS = {
  fornaio: ["panel-thermalflow", "panel-ovenqc", "panel-proofing", "panel-ricette", "panel-hardware", "panel-autoplan"],
  capolinea: ["panel-autoplan", "panel-emergency", "panel-shiftreport", "panel-b2b", "panel-radar", "panel-twin", "panel-ordine", "panel-planner", "panel-ordini", "panel-carbon", "panel-timeline", "panel-packaging"],
  manutentore: ["panel-twin", "panel-emergency", "panel-hardware", "panel-agv", "panel-silos", "panel-security"],
};
const ROLES = [
  { id: "tutto", icon: LayoutGrid, lbl: (t) => t("Tutto", "Alles", "All", "Todo", "Tout", "همه") },
  { id: "fornaio", icon: Wheat, lbl: (t) => t("Fornaio", "Bäcker", "Baker", "Panadero", "Boulanger", "نانوا") },
  { id: "capolinea", icon: ClipboardList, lbl: (t) => t("Capo linea", "Linienchef", "Line lead", "Jefe línea", "Chef ligne", "سرخط") },
  { id: "manutentore", icon: Wrench, lbl: (t) => t("Manutentore", "Techniker", "Maintenance", "Técnico", "Technicien", "تعمیرکار") },
];

export default function RoleLayout() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [role, setRole] = useState(() => { try { return localStorage.getItem("mikilab_plancia_role") || "tutto"; } catch { return "tutto"; } });

  const apply = useCallback((r) => {
    const allowed = r === "tutto" ? null : new Set(ROLE_PANELS[r] || []);
    ALL_PANELS.forEach((tid) => {
      const el = document.querySelector(`[data-testid="${tid}"]`);
      if (el) el.style.display = (!allowed || allowed.has(tid)) ? "" : "none";
    });
  }, []);

  useEffect(() => {
    apply(role);
    // Riprova per catturare i pannelli montati in ritardo (risposta immediata percepita).
    const t1 = setTimeout(() => apply(role), 300);
    const t2 = setTimeout(() => apply(role), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [role, apply]);

  const pick = (r) => { setRole(r); try { localStorage.setItem("mikilab_plancia_role", r); } catch { /* */ } apply(r); };

  return (
    <div data-testid="role-layout" className="flex items-center gap-1.5 overflow-x-auto pb-1">
      <span className="text-[10px] font-mono-data uppercase tracking-widest text-[#64748B] shrink-0 mr-1">{tri("Vista plancia", "Ansicht", "Console view", "Vista", "Vue", "نمای کنسول")}</span>
      {ROLES.map((r) => {
        const on = role === r.id;
        return (
          <button key={r.id} data-testid={`roleview-${r.id}`} onClick={() => pick(r.id)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border active:scale-95 transition-all ${on ? "bg-[#FF6B00]/15 border-[#FF6B00]/50 text-[#FF6B00]" : "bg-[#030712] border-[#1e293b] text-[#94A3B8]"}`}>
            <r.icon className="w-3.5 h-3.5" /> {r.lbl(tri)}
          </button>
        );
      })}
    </div>
  );
}
