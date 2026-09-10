import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Check, X, Loader2, Clock, User, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { sitorFloorApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// Richieste di modifica al piano proposte dagli operai. Le grandi attendono l'OK del Capo;
// le piccole Sitor le ha già applicate e sono mostrate come informazione.
export default function FloorChangeApprovals() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [reqs, setReqs] = useState([]);
  const [pending, setPending] = useState(0);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(() => {
    sitorFloorApi.changeList().then((d) => { setReqs(d.requests || []); setPending(d.pending || 0); }).catch(() => {});
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 20000); return () => clearInterval(id); }, [load]);

  const decide = async (r, decision) => {
    setBusyId(r.id);
    try {
      await sitorFloorApi.changeDecide(r.id, decision);
      toast.success(decision === "approve"
        ? tri("Modifica approvata. Sitor aggiorna la produzione.", "Genehmigt.", "Approved. Sitor updates production.", "Aprobado.", "Approuvé.", "تأیید شد.")
        : tri("Modifica rifiutata.", "Abgelehnt.", "Rejected.", "Rechazado.", "Refusé.", "رد شد."));
      load();
    } catch { toast.error(tri("Errore, riprova.", "Fehler.", "Error, retry.", "Error.", "Erreur.", "خطا.")); }
    finally { setBusyId(""); }
  };

  const pendingReqs = reqs.filter((r) => r.status === "pending");
  const recent = reqs.filter((r) => r.status !== "pending").slice(0, 6);

  const badge = (r) => {
    const map = {
      pending: { c: "#EAB308", t: tri("In attesa", "Wartet", "Pending", "Pendiente", "En attente", "منتظر"), I: Clock },
      auto_applied: { c: "#22c55e", t: tri("Applicata da Sitor", "Von Sitor angewandt", "Applied by Sitor", "Aplicada por Sitor", "Appliquée par Sitor", "توسط سیتور اعمال شد"), I: CheckCircle2 },
      approved: { c: "#22c55e", t: tri("Approvata", "Genehmigt", "Approved", "Aprobada", "Approuvée", "تأیید"), I: Check },
      rejected: { c: "#f87171", t: tri("Rifiutata", "Abgelehnt", "Rejected", "Rechazada", "Refusée", "رد"), I: XCircle },
    };
    return map[r.status] || map.pending;
  };

  return (
    <div data-testid="floor-change-approvals" className="rounded-2xl border border-[#EAB308]/25 bg-[#0C1019]/50 p-4">
      <div className="flex items-center justify-between mb-2.5">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#EAB308]">
          <Wand2 className="w-4 h-4" /> {tri("Modifiche proposte dagli operai", "Vorschläge der Bediener", "Changes proposed by operators", "Cambios propuestos", "Changements proposés", "پیشنهادهای اپراتورها")}
          {pending > 0 && <span data-testid="change-pending-count" className="ml-1 px-1.5 py-0.5 rounded-full bg-[#EAB308] text-[#060A10] text-[10px] font-black">{pending}</span>}
        </p>
      </div>

      {pendingReqs.length === 0 && recent.length === 0 && (
        <p data-testid="change-empty" className="text-[12px] text-[#64748B] py-3 text-center">{tri("Nessuna proposta. Gli operai possono suggerirti modifiche dal reparto: le grandi arrivano qui.", "Keine Vorschläge.", "No proposals yet. Operators can suggest changes from the floor; big ones land here.", "Sin propuestas.", "Aucune proposition.", "پیشنهادی نیست.")}</p>
      )}

      <AnimatePresence>
        {pendingReqs.map((r) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            data-testid={`change-req-${r.id}`} className="rounded-xl bg-[#060A10] border border-[#EAB308]/30 p-3 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF9D42]"><User className="w-3 h-3" /> {r.operator}</span>
              {r.dept && <span className="text-[9px] uppercase text-[#64748B]">· {r.dept}</span>}
              <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded" style={{ color: "#EAB308", background: "#EAB30818", border: "1px solid #EAB30840" }}><Clock className="w-3 h-3" /> {tri("In attesa", "Wartet", "Pending", "Pendiente", "En attente", "منتظر")}</span>
            </div>
            {r.task && <p className="text-[10px] text-[#64748B] mb-0.5">{tri("Compito", "Aufgabe", "Task", "Tarea", "Tâche", "وظیفه")}: {r.task}</p>}
            <p className="text-[13px] text-white leading-snug font-semibold">{r.capo_summary || r.proposal}</p>
            {r.suggested_action && <p className="text-[11px] text-[#EAB308]/90 mt-1 leading-snug">✦ {r.suggested_action}</p>}
            <div className="flex items-center gap-2 mt-2.5">
              <button data-testid={`change-approve-${r.id}`} onClick={() => decide(r, "approve")} disabled={busyId === r.id}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#22c55e]/12 border border-[#22c55e]/45 text-[#22c55e] font-bold text-xs active:scale-95 disabled:opacity-50">
                {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} {tri("Approva", "Genehmigen", "Approve", "Aprobar", "Approuver", "تأیید")}
              </button>
              <button data-testid={`change-reject-${r.id}`} onClick={() => decide(r, "reject")} disabled={busyId === r.id}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#f87171]/10 border border-[#f87171]/40 text-[#f87171] font-bold text-xs active:scale-95 disabled:opacity-50">
                <X className="w-3.5 h-3.5" /> {tri("Rifiuta", "Ablehnen", "Reject", "Rechazar", "Refuser", "رد")}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {recent.length > 0 && (
        <div className="mt-1 space-y-1">
          {recent.map((r) => { const b = badge(r); const I = b.I; return (
            <div key={r.id} data-testid={`change-log-${r.id}`} className="flex items-center gap-2 text-[11px] px-2 py-1.5 rounded-lg bg-[#060A10]/60 border border-[#1e293b]">
              <I className="w-3.5 h-3.5 shrink-0" style={{ color: b.c }} />
              <span className="text-[#94A3B8] shrink-0">{r.operator}</span>
              <span className="text-white truncate flex-1">{r.capo_summary || r.proposal}</span>
              <span className="text-[9px] font-black uppercase shrink-0" style={{ color: b.c }}>{b.t}</span>
            </div>
          ); })}
        </div>
      )}
    </div>
  );
}
