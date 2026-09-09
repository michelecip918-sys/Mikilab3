import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Menu a sezioni: riduce la plancia a poche righe. Ogni sezione raccoglie i suoi pannelli.
export const SECTIONS = [
  { key: "regia", icon: "🧠" },
  { key: "piani", icon: "📅" },
  { key: "ricette", icon: "🥖" },
  { key: "squadra", icon: "👥" },
  { key: "impianto", icon: "🏭" },
  { key: "magazzino", icon: "📦" },
  { key: "sicurezza", icon: "🛡️" },
];

export default function ConsoleSectionMenu({ active, onPick }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const label = (k) => ({
    regia: tri("BakoMix · Regia", "BakoMix · Leitstand", "BakoMix · Cockpit", "BakoMix · Cabina", "BakoMix · Régie", "بوکومیکس · مرکز"),
    piani: tri("Piani & Produzione", "Pläne & Produktion", "Plans & Production", "Planes & Producción", "Plans & Production", "برنامه و تولید"),
    ricette: tri("Ricette", "Rezepte", "Recipes", "Recetas", "Recettes", "دستورها"),
    squadra: tri("Squadra & Turni", "Team & Schichten", "Team & Shifts", "Equipo & Turnos", "Équipe & Services", "تیم و شیفت"),
    impianto: tri("Impianto & Qualità", "Anlage & Qualität", "Plant & Quality", "Planta & Calidad", "Usine & Qualité", "کارخانه و کیفیت"),
    magazzino: tri("Magazzino & Materie", "Lager & Rohstoffe", "Warehouse & Materials", "Almacén & Materias", "Entrepôt & Matières", "انبار و مواد"),
    sicurezza: tri("Sicurezza & Documenti", "Sicherheit & Dokumente", "Security & Documents", "Seguridad & Documentos", "Sécurité & Documents", "امنیت و اسناد"),
  }[k]);
  const desc = (k) => ({
    regia: tri("Cabina di comando, AI e piani live", "Leitstand, KI & Live-Pläne", "Command, AI & live plans", "Mando, IA y planes", "Commande, IA & plans", "فرمان، هوش مصنوعی و برنامه"),
    piani: tri("Piano del giorno, settimanale, ordini", "Tages-/Wochenplan, Aufträge", "Day/weekly plan, orders", "Plan diario/semanal, pedidos", "Plan jour/semaine, commandes", "برنامه روز/هفته، سفارش"),
    ricette: tri("Ricettario e flusso termico", "Rezepte & Thermal Flow", "Recipe book & thermal flow", "Recetario y flujo térmico", "Recettes & flux thermique", "دستورها و جریان حرارتی"),
    squadra: tri("Assegnazioni, presenze, turni-tipo", "Zuweisungen, Anwesenheit, Vorlagen", "Assignments, presence, templates", "Asignaciones, presencia, plantillas", "Affectations, présence, modèles", "واگذاری، حضور، الگو"),
    impianto: tri("Gemello 3D, QC, celle, forni, AGV", "3D-Zwilling, QC, Öfen, AGV", "3D twin, QC, cells, ovens, AGV", "Gemelo 3D, QC, hornos, AGV", "Jumeau 3D, QC, fours, AGV", "دوقلوی سه‌بعدی، کنترل کیفیت"),
    magazzino: tri("Silos, materie prime, scorte", "Silos, Rohstoffe, Bestand", "Silos, raw materials, stock", "Silos, materias, stock", "Silos, matières, stock", "سیلو، مواد، موجودی"),
    sicurezza: tri("PIN, accessi, report e documenti", "PINs, Zugriffe, Dokumente", "PINs, access, reports & docs", "PIN, accesos, documentos", "PIN, accès, documents", "پین، دسترسی، اسناد"),
  }[k]);

  return (
    <div data-testid="console-sections" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {SECTIONS.map((s) => {
        const on = active === s.key;
        return (
          <button key={s.key} data-testid={`console-section-${s.key}`} onClick={() => onPick(on ? "" : s.key)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all active:scale-[0.99] ${on ? "border-[#00F0FF]/70 bg-[#00F0FF]/10 shadow-[0_0_18px_rgba(0,240,255,0.15)]" : "border-[#1e293b] bg-[#0C1019] hover:border-[#00F0FF]/40"}`}>
            <span className="text-2xl shrink-0">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-tech font-black text-sm uppercase tracking-wide ${on ? "text-[#00F0FF]" : "text-white"}`}>{label(s.key)}</p>
              <p className="text-[11px] text-[#8aa0b4] truncate">{desc(s.key)}</p>
            </div>
            <span className={`text-lg font-black transition-transform ${on ? "text-[#00F0FF] rotate-90" : "text-[#334155]"}`}>›</span>
          </button>
        );
      })}
    </div>
  );
}
