import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import RecipeAuditMatrix from "@/components/RecipeAuditMatrix";

// Audit Ricetta (Matrice Sovrana) incorporato nel Ricettario: e' qui il suo contesto naturale.
export default function RecipeAuditButton() {
  const { lang } = useLang();
  const tri = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3">
      <button data-testid="ricette-audit-btn" onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-sm border border-border/50 text-muted-foreground bg-muted/10 active:scale-95 transition-transform">
        <Sparkles className="w-4 h-4" /> {tri("Audit Ricetta (Matrice Sovrana)", "Rezept-Audit", "Recipe Audit (Sovereign Matrix)", "Auditoría de Receta", "Audit Recette", "بازبینی دستور")}
      </button>
      <p className="mt-1 text-[11px] text-muted-foreground text-center">{tri("Sitor analizza idratazione, sale, costo e coerenza di ogni ricetta.", "Sitor prüft Hydration, Salz, Kosten & Konsistenz.", "Sitor analyses hydration, salt, cost and consistency of each recipe.", "Sitor analiza hidratación, sal, coste y coherencia.", "Sitor analyse hydratation, sel, coût et cohérence.", "سیتور هیدراتاسیون، نمک، هزینه و سازگاری را بررسی می‌کند.")}</p>
      {open && <RecipeAuditMatrix onClose={() => setOpen(false)} />}
    </div>
  );
}
