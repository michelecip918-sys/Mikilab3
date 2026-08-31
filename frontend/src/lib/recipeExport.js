import { exportPlanPdf } from "@/lib/planPdf";

const val = (r, keys) => { for (const k of keys) { if (r[k] != null && r[k] !== "") return r[k]; } return ""; };
const ingText = (r) => {
  const ing = r.ingredients || r.ingredienti;
  if (Array.isArray(ing)) return ing.map((i) => (typeof i === "string" ? i : [i.name || i.nome, i.qty || i.quantita, i.unit || i.unita].filter(Boolean).join(" "))).join("; ");
  return typeof ing === "string" ? ing : "";
};

const csvCell = (s) => {
  const t = String(s ?? "").replace(/"/g, '""');
  return /[",\n;]/.test(t) ? `"${t}"` : t;
};

export function recipesToCsv(recipes) {
  const head = ["Nome", "Categoria", "Ingredienti", "Procedimento", "Note", "Costo", "Prezzo"];
  const rows = (recipes || []).map((r) => [
    val(r, ["name", "title", "nome"]),
    val(r, ["category", "cat", "categoria"]),
    ingText(r),
    val(r, ["procedure", "procedimento", "steps"]),
    val(r, ["notes", "note"]),
    val(r, ["cost", "cost_total", "costo"]),
    val(r, ["price", "price_b2b", "prezzo"]),
  ].map(csvCell).join(","));
  return "\ufeff" + [head.join(","), ...rows].join("\n");
}

export function downloadCsv(recipes, fileName = "mie-ricette-mikilab.csv") {
  const blob = new Blob([recipesToCsv(recipes)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadRecipesPdf(recipes, lang = "it") {
  const lines = ["## Le mie ricette\n"];
  (recipes || []).forEach((r) => {
    lines.push(`### ${val(r, ["name", "title", "nome"]) || "Ricetta"}`);
    const cat = val(r, ["category", "cat", "categoria"]);
    if (cat) lines.push(`- Categoria: ${cat}`);
    const ing = ingText(r);
    if (ing) lines.push(`- Ingredienti: ${ing}`);
    const proc = val(r, ["procedure", "procedimento", "steps"]);
    if (proc) lines.push(`- Procedimento: ${proc}`);
    const notes = val(r, ["notes", "note"]);
    if (notes) lines.push(`- Note: ${notes}`);
    lines.push("");
  });
  await exportPlanPdf({
    title: "Backup Ricette", plan: lines.join("\n"), lang, showDisclaimer: false,
    fileName: `mie-ricette-mikilab-${new Date().toISOString().slice(0, 10)}.pdf`,
  });
}
