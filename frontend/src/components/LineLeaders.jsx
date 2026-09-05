import { useEffect, useState, useCallback } from "react";
import { UserCog, Check } from "lucide-react";
import { toast } from "sonner";
import { plantApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const LINE_META = {
  baguette: { icon: "🥖" }, pane: { icon: "🍞" }, pizzeria: { icon: "🍕" }, pasticceria: { icon: "🥐" },
};

// Delega ai Caposquadra: il Master assegna la supervisione di una linea prodotto
// a un leader (es. Christoph → Baguette). I task di qualità vanno SOLO a lui.
export default function LineLeaders({ workers = [] }) {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [lines, setLines] = useState([]);
  const [leaders, setLeaders] = useState({});
  const names = Array.from(new Set(workers.map((w) => w.name))).filter(Boolean);

  const load = useCallback(async () => {
    try { const r = await plantApi.lineLeaders(); setLines(r.lines || []); setLeaders(r.leaders || {}); } catch { /* */ }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener("mikilab-govern-executed", h); return () => window.removeEventListener("mikilab-govern-executed", h); }, [load]);

  const assign = async (line, leader) => {
    try {
      const r = await plantApi.setLeader(line, leader);
      setLeaders(r.leaders || {});
      if (leader) toast.success(`${leader} → ${line}`, { description: tri("Supervisione linea assegnata.", "Linien-Aufsicht zugewiesen.", "Line oversight assigned.", "Supervisión de línea asignada.", "Supervision de ligne assignée.", "نظارت خط واگذار شد.") });
    } catch { toast.error(tri("Errore", "Fehler", "Error", "Error", "Erreur", "خطا")); }
  };

  return (
    <div data-testid="line-leaders" className="rounded-2xl border border-[#8b5cf6]/40 bg-[#8b5cf60d] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <UserCog className="w-5 h-5 text-[#a78bfa]" />
        <div>
          <h3 className="text-sm font-extrabold text-[#a78bfa]">{tri("Delega Caposquadra", "Teamleiter-Delegation", "Line Leader Delegation", "Delegación de jefes", "Délégation chefs de ligne", "واگذاری سرتیم")}</h3>
          <p className="text-[11px] text-[#94A3B8]">{tri("Supervisione per linea prodotto, senza intasare il flusso operatori.", "Aufsicht je Produktlinie, ohne den Bediener-Flow zu stören.", "Per-line oversight, without cluttering the worker flow.", "Supervisión por línea, sin saturar el flujo.", "Supervision par ligne, sans encombrer le flux.", "نظارت هر خط، بدون شلوغی جریان.")}</p>
        </div>
      </div>
      <div className="space-y-2">
        {lines.map((ln) => (
          <div key={ln.id} data-testid={`leader-line-${ln.id}`} className="flex items-center gap-2">
            <span className="text-lg w-6 text-center shrink-0">{(LINE_META[ln.id] || {}).icon || "🏭"}</span>
            <span className="text-xs font-bold text-white flex-1 min-w-0 truncate">{ln.name}</span>
            <select data-testid={`leader-select-${ln.id}`} value={leaders[ln.id] || ""} onChange={(e) => assign(ln.id, e.target.value)}
              className="bg-[#030712] border border-[#1e293b] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#a78bfa] max-w-[55%]">
              <option value="">{tri("— nessuno —", "— keiner —", "— none —", "— ninguno —", "— aucun —", "— هیچ —")}</option>
              {names.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            {leaders[ln.id] && <Check className="w-4 h-4 text-[#a78bfa] shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}
