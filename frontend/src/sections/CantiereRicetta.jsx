import { mkTri } from "@/i18n/triMaps";
import { useState, useEffect } from "react";
import { ChevronRight, FileText, Loader2, Printer } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { recipesApi } from "@/lib/api";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function CantiereRicetta({ onBack }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [recipes, setRecipes] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([recipesApi.list("personal"), recipesApi.list("recipes")])
      .then(([a, b]) => setRecipes([...(a || []), ...(b || [])]))
      .catch(() => setRecipes([]));
  }, []);

  const field = (r, base) => (lang === "de" ? r[`${base}_de`] : lang === "es" ? r[`${base}_es`] : (lang === "en" || lang === "fr" || lang === "fa") ? r[`${base}_en`] : null) || r[base] || "";

  const generate = (r) => {
    setBusy(true);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = 210; let y = 20;
      doc.setFillColor(140, 74, 39); doc.rect(0, 0, W, 34, "F");
      doc.setTextColor(255, 253, 249); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
      doc.text("MikiLab · " + L("RICETTA DI CANTIERE", "BAUSTELLEN-REZEPT", "WORKSITE RECIPE", "RECETA DE OBRA"), 14, 12);
      doc.setFontSize(22); doc.text((field(r, "name") || "Ricetta").toUpperCase(), 14, 26, { maxWidth: W - 28 });
      y = 46;
      const box = (title, rows) => {
        doc.setTextColor(140, 74, 39); doc.setFont("helvetica", "bold"); doc.setFontSize(13);
        doc.text(title, 14, y); y += 3;
        doc.setDrawColor(217, 119, 6); doc.setLineWidth(0.6); doc.line(14, y, W - 14, y); y += 7;
        doc.setTextColor(40, 30, 22); doc.setFont("helvetica", "normal"); doc.setFontSize(13);
        rows.forEach(([k, v]) => { if (v === null || v === undefined || v === "") return; doc.setFont("helvetica", "bold"); doc.text(`${k}: `, 16, y); const kw = doc.getTextWidth(`${k}: `); doc.setFont("helvetica", "normal"); doc.text(String(v), 16 + kw, y, { maxWidth: W - 30 - kw }); y += 8; });
        y += 4;
      };
      box(L("DOSI", "MENGEN", "DOSES", "DOSIS"), [
        [L("Farina", "Mehl", "Flour", "Harina"), r.flour_grams ? `${r.flour_grams} g (${field(r, "flour_type")})` : field(r, "flour_type")],
        [L("Acqua", "Wasser", "Water", "Agua"), r.water_grams ? `${r.water_grams} g` : (r.hydration_percent ? `${r.hydration_percent}%` : "")],
        [L("Lievito madre", "Sauerteig", "Sourdough", "Masa madre"), r.sourdough_grams ? `${r.sourdough_grams} g` : ""],
        [L("Sale", "Salz", "Salt", "Sal"), r.salt_grams ? `${r.salt_grams} g` : ""],
        [L("Idratazione", "Hydratation", "Hydration", "Hidratación"), r.hydration_percent ? `${r.hydration_percent}%` : ""],
      ]);
      box(L("TEMPI & FORNO", "ZEITEN & OFEN", "TIMING & OVEN", "TIEMPOS & HORNO"), [
        [L("Impasto", "Kneten", "Mixing", "Amasado"), r.mix_minutes ? `${r.mix_minutes} min` : ""],
        [L("Puntata", "Stockgare", "Bulk", "Fermentación"), r.bulk_fermentation_hours ? `${r.bulk_fermentation_hours} h` : ""],
        [L("Appretto", "Stückgare", "Proof", "Prueba"), r.proofing_hours ? `${r.proofing_hours} h` : ""],
        [L("Cottura", "Backen", "Bake", "Cocción"), r.bake_temp ? `${r.bake_temp}°C · ${r.bake_minutes || "?"} min` : ""],
      ]);
      const proc = field(r, "procedure"); const notes = field(r, "notes");
      if (proc) { box(L("PROCEDIMENTO", "ABLAUF", "METHOD", "PROCEDIMIENTO"), []); doc.setFontSize(12); doc.setFont("helvetica", "normal"); const lines = doc.splitTextToSize(proc, W - 30); doc.text(lines, 16, y); y += lines.length * 6 + 4; }
      if (notes) { doc.setFont("helvetica", "italic"); doc.setFontSize(11); doc.setTextColor(107, 85, 70); const nl = doc.splitTextToSize("★ " + notes, W - 30); doc.text(nl, 16, y); }
      doc.setFontSize(9); doc.setTextColor(140, 115, 98); doc.text("mikilab.de", W / 2, 288, { align: "center" });
      doc.save(`MikiLab-Cantiere-${(field(r, "name") || "ricetta").replace(/\s+/g, "-")}.pdf`);
      toast.success(L("PDF generato! 📄", "PDF erstellt! 📄", "PDF generated! 📄", "¡PDF generado! 📄"));
    } finally { setBusy(false); }
  };

  return (
    <div className="pb-8" data-testid="cantiere">
      {onBack && <button data-testid="cantiere-back" onClick={onBack} className="flex items-center gap-1 text-[#ff6b00] font-medium mb-4"><ChevronRight className="w-5 h-5 rotate-180" /> {L("Indietro", "Zurück", "Back")}</button>}
      <div className="relative overflow-hidden rounded-3xl p-6 text-[#121212] shadow-xl mb-5" style={{ background: "linear-gradient(135deg,#ff6b00,#ff6b00 60%,#ff6b00)" }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center mb-3"><FileText className="w-7 h-7" /></div>
        <h1 className="font-display text-2xl font-bold">{L("Ricetta di Cantiere", "Baustellen-Rezept", "Worksite Recipe", "Receta de Obra")}</h1>
        <p className="text-[#121212]/85 text-sm mt-2 leading-snug">{L("Genera il PDF stampabile a caratteri grandi da appendere in laboratorio: dosi, tempi e procedimento a colpo d'occhio.", "Druckbares Großdruck-PDF fürs Labor.", "A big-print PDF to hang in your kitchen.", "PDF imprimible de letra grande para el obrador.")}</p>
      </div>

      {recipes === null ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#ff6b00]" /></div>
      ) : recipes.length === 0 ? (
        <p className="text-center text-sm text-[#ff8a33] py-8">{L("Nessuna ricetta ancora. Aggiungine una da 'Le Mie Ricette'.", "Noch keine Rezepte.", "No recipes yet. Add one in 'My Recipes'.", "Aún no hay recetas.")}</p>
      ) : (
        <div className="space-y-2.5" data-testid="cantiere-list">
          {recipes.map((r, i) => (
            <div key={r.id || i} data-testid={`cantiere-recipe-${i}`} className="flex items-center gap-3 rounded-2xl bg-[#121212] dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] p-3.5 shadow-sm">
              {r.image_url ? <img src={r.image_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" /> : <div className="w-12 h-12 rounded-xl bg-[#ff6b00]/12 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-[#ff6b00]" /></div>}
              <p className="flex-1 min-w-0 font-display text-[15px] font-bold text-[#ff6b00] dark:text-[#e4eff8] leading-tight truncate">{field(r, "name") || "Ricetta"}</p>
              <button data-testid={`cantiere-pdf-${i}`} disabled={busy} onClick={() => generate(r)}
                className="flex items-center gap-1.5 bg-[#ff6b00] hover:bg-[#ff6b00] disabled:opacity-50 text-[#121212] text-[13px] font-semibold px-3.5 py-2 rounded-xl active:scale-95 transition-all shrink-0">
                <Printer className="w-4 h-4" /> PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
