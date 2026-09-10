import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, Check, PencilLine, Ban, BrainCircuit } from "lucide-react";
import { recipesApi, recipeAuditApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

const PUB = process.env.PUBLIC_URL;
const LVL = { ok: "#22c55e", warn: "#f59e0b", high: "#ef4444" };

// DUAL-MODE STRATEGICO: Miki-Nexus (Master Baker) critica la ricetta e presenta al
// Boss la matrice sovrana a 3 opzioni. La decisione finale resta del Capo.
export default function RecipeAuditMatrix({ onClose }) {
  const { lang } = useLang();
  const tri = mkTri(lang);
  const [recipes, setRecipes] = useState([]);
  const [audit, setAudit] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { recipesApi.list("mikilab").then((r) => setRecipes((r || []).slice(0, 40))).catch(() => {}); }, []);

  const run = async (rid) => {
    setBusy(true); setAudit(null);
    const a = await recipeAuditApi.audit({ recipe_id: rid }).catch(() => null);
    setAudit(a); setBusy(false);
  };

  const decide = (opt) => {
    const m = { approve: tri("Approvata ✓", "Genehmigt ✓", "Approved ✓", "Aprobada ✓", "Approuvée ✓", "تأیید شد ✓"),
                modify: tri("In modifica…", "Wird geändert…", "Modifying…", "Modificando…", "Modification…", "در حال ویرایش…"),
                reject: tri("Rifiutata", "Abgelehnt", "Rejected", "Rechazada", "Rejetée", "رد شد") }[opt];
    toast.success(m);
    if (opt !== "modify") { setAudit(null); }
  };

  const goldState = audit && audit.recommended !== "approve";

  return (
    <div data-testid="recipe-audit" className="fixed inset-0 z-[80] bg-[#030712]/97 backdrop-blur-xl overflow-y-auto">
      <div className="max-w-lg mx-auto p-4 pb-16">
        <div className="flex items-center justify-between sticky top-0 bg-[#030712]/95 py-2 z-10">
          <h2 className="text-lg font-black text-white flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-[#f59e0b]" /> {tri("Audit Ricetta · Matrice Sovrana", "Rezept-Audit · Souveräne Matrix", "Recipe Audit · Sovereign Matrix", "Auditoría · Matriz Soberana", "Audit Recette · Matrice Souveraine", "بازبینی دستور · ماتریس حاکم")}</h2>
          <button data-testid="recipe-audit-close" onClick={onClose} className="w-9 h-9 rounded-full bg-[#0b0f19] border border-[#1e293b] flex items-center justify-center text-[#94A3B8] hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Robot Miki-Nexus: stato oro/ambra in modalità strategica */}
        <div className="flex items-center gap-3 my-3 rounded-2xl border p-3" style={{ borderColor: goldState ? "#f59e0b66" : "#1e293b", background: goldState ? "#f59e0b12" : "#0b0f19" }}>
          <div className="relative">
            {goldState && <span className="absolute inset-0 rounded-full bg-[#f59e0b]/50 blur-md animate-pulse" />}
            <img src={`${PUB}/avatar_nexus.jpg`} alt="Miki-Nexus" className="relative w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: goldState ? "#f59e0b" : "#5EEAD4" }} />
          </div>
          <p className="text-[12px] text-[#cfe0ec] flex-1">{audit ? audit.mike_note : tri("Scegli una ricetta: la analizzo come Master Baker.", "Wähle ein Rezept: ich prüfe es als Master Baker.", "Pick a recipe: I'll audit it as Master Baker.", "Elige una receta: la audito como Master Baker.", "Choisis une recette : je l'audite en Master Baker.", "دستوری انتخاب کن تا مثل استاد نان بررسی کنم.")}</p>
        </div>

        {!audit && (
          <div className="space-y-1.5">
            {recipes.map((r) => (
              <button key={r.id} data-testid={`audit-pick-${r.id}`} onClick={() => run(r.id)} className="w-full text-left rounded-xl bg-[#0b0f19] border border-[#1e293b] p-3 text-sm font-bold text-white hover:border-[#f59e0b]/50 active:scale-[0.99] transition-all">{r.name}</button>
            ))}
            {busy && <p className="text-center text-[#94A3B8] text-sm py-4">…</p>}
          </div>
        )}

        {audit && (
          <>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8] mb-2">{tri("Lettura del fornaio", "Bäcker-Analyse", "Baker's read", "Lectura del panadero", "Lecture du boulanger", "تحلیل نانوا")} · {audit.recipe}</p>
            <div className="space-y-1.5 mb-4">
              {audit.critique.map((c, i) => (
                <div key={i} data-testid={`audit-metric-${i}`} className="flex items-center gap-2 rounded-xl bg-[#0b0f19] border p-2.5" style={{ borderColor: `${LVL[c.level] || "#1e293b"}55` }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: LVL[c.level] || "#64748B" }} />
                  <span className="text-sm font-black text-white w-24">{c.metric}</span>
                  <span className="text-sm font-bold" style={{ color: LVL[c.level] }}>{c.value}</span>
                  <span className="text-[11px] text-[#94A3B8] flex-1">{c.note}</span>
                </div>
              ))}
            </div>

            {/* Matrice sovrana 3 opzioni */}
            <div className="grid grid-cols-3 gap-2">
              {["approve", "modify", "reject"].map((opt) => {
                const rec = audit.recommended === opt;
                const col = opt === "approve" ? "#22c55e" : opt === "modify" ? "#f59e0b" : "#ef4444";
                const Icon = opt === "approve" ? Check : opt === "modify" ? PencilLine : Ban;
                return (
                  <button key={opt} data-testid={`audit-${opt}`} onClick={() => decide(opt)} className="rounded-2xl border-2 p-3 text-center active:scale-95 transition-transform" style={{ borderColor: col, background: rec ? `${col}22` : "transparent" }}>
                    <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: col }} />
                    <p className="text-[12px] font-black" style={{ color: col }}>{audit.matrix[opt].label}</p>
                    {rec && <p className="text-[9px] font-bold text-[#94A3B8] mt-0.5">{tri("consigliato", "empfohlen", "recommended", "recomendado", "conseillé", "پیشنهادی")}</p>}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-3">{audit.matrix[audit.recommended].reason}</p>
            <button data-testid="audit-back" onClick={() => setAudit(null)} className="w-full mt-4 py-2 rounded-xl bg-[#0b0f19] border border-[#1e293b] text-[#94A3B8] text-sm font-bold">{tri("Altra ricetta", "Anderes Rezept", "Another recipe", "Otra receta", "Autre recette", "دستور دیگر")}</button>
          </>
        )}
      </div>
    </div>
  );
}
