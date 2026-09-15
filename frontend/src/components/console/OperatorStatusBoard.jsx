import { useEffect, useState } from "react";
import { Users, Clock3, Lock, CircleDot } from "lucide-react";
import { delegationApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Plancia live dello stato operatori: libero/occupato, compito corrente e tempo stimato.
// Si aggiorna ogni 15s (e resta consultabile offline dall'ultima copia).
export default function OperatorStatusBoard() {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = () => delegationApi.workerBoard().then((d) => { if (alive) setData(d); }).catch(() => {});
    load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const board = (data && data.board) || [];
  const totals = (data && data.totals) || { total: 0, busy: 0, free: 0 };

  return (
    <div data-testid="operator-status-board" className="rounded-2xl border border-[#8a97a6]/25 bg-[#060A10]/70 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Users className="w-4 h-4 text-[#8a97a6]" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8a97a6]">
          {tri("Plancia operatori · live", "Bediener-Tafel · live", "Operator board · live", "Panel de operadores · en vivo", "Tableau opérateurs · live", "تابلوی اپراتورها · زنده")}
        </span>
        <span className="ml-auto inline-flex items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 text-[#3E9C93]"><CircleDot className="w-3 h-3" />{totals.free} {tri("liberi", "frei", "free", "libres", "libres", "آزاد")}</span>
          <span className="inline-flex items-center gap-1 text-[#c9a24a]"><CircleDot className="w-3 h-3" />{totals.busy} {tri("occupati", "belegt", "busy", "ocupados", "occupés", "مشغول")}</span>
        </span>
      </div>

      {board.length === 0 ? (
        <p data-testid="board-empty" className="text-[12px] text-[#64748B] text-center py-6">
          {tri("Nessun operatore nel turno corrente.", "Keine Bediener in der Schicht.", "No operators in the current shift.", "Sin operadores en el turno.", "Aucun opérateur dans le poste.", "اپراتوری در شیفت نیست.")}
        </p>
      ) : (
        <div className="space-y-2">
          {board.map((o, i) => {
            const busy = o.status === "busy";
            return (
              <div key={o.name + i} data-testid={`board-row-${i}`} className="flex items-center gap-3 rounded-xl bg-[#0b0f19]/60 border border-[#1e293b] px-3 py-2.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${busy ? "bg-[#c9a24a]" : "bg-[#3E9C93]"}`} title={busy ? "occupato" : "libero"} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-bold text-white truncate">{o.name}</span>
                    {o.position && <span className="text-[10px] text-[#64748B]">· {o.position}</span>}
                    {o.locked_by_capo && (
                      <span data-testid={`board-capo-lock-${i}`} className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wide text-[#D95200] bg-[#D95200]/12 border border-[#D95200]/30 rounded px-1.5 py-0.5">
                        <Lock className="w-2.5 h-2.5" /> {tri("Direzione", "Leitung", "Direction", "Dirección", "Direction", "مدیریت")}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#94A3B8] truncate">
                    {busy
                      ? (o.task || tri("Al lavoro", "In Arbeit", "Working", "Trabajando", "Au travail", "در حال کار"))
                      : tri("Libero · in attesa di compito", "Frei · wartet auf Aufgabe", "Free · awaiting task", "Libre · esperando tarea", "Libre · en attente", "آزاد · منتظر وظیفه")}
                  </p>
                </div>
                {busy && o.eta_min ? (
                  <span data-testid={`board-eta-${i}`} className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#c9a24a] bg-[#c9a24a]/10 rounded-full px-2.5 py-1">
                    <Clock3 className="w-3 h-3" /> ~{o.eta_min}′
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
