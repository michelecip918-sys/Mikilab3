import { useRef } from "react";
import { Printer, Share2 } from "lucide-react";
import { toast } from "sonner";

// STADIO 2 — Stampa/PDF (scheda dedicata con logo) + Condividi (immagine 1080x1350 con logo).
// Tutto nel browser: nessun dato inviato al server. Le stampe/condivisioni portano SEMPRE il logo MikiLab.
export default function RecipeShareActions({ recipe, ex, doses = [], tri, lang = "it" }) {
  const busy = useRef(false);
  const base = process.env.PUBLIC_URL || "";
  const li3 = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);
  const rname = li3(recipe.name, recipe.name_de || recipe.name, recipe.name_en || recipe.name);
  const proc = li3(recipe.procedure, recipe.procedure_de || recipe.procedure, recipe.procedure_en || recipe.procedure) || "";
  const ALL = {
    glutine: ["Glutine", "Gluten", "Gluten"], uova: ["Uova", "Eier", "Eggs"], latte: ["Latte", "Milch", "Milk"],
    frutta_a_guscio: ["Frutta a guscio", "Schalenfrüchte", "Tree nuts"], sesamo: ["Sesamo", "Sesam", "Sesame"],
    soia: ["Soia", "Soja", "Soy"], lupino: ["Lupino", "Lupine", "Lupin"], arachidi: ["Arachidi", "Erdnüsse", "Peanuts"],
  };
  const allergens = (ex?.allergens || []).map((a) => li3(...(ALL[a] || [a, a, a])));
  const diff = ex?.difficulty ? li3(
    { facile: "Facile", media: "Media", sfida: "Sfida" }[ex.difficulty] || ex.difficulty,
    { facile: "Einfach", media: "Mittel", sfida: "Herausforderung" }[ex.difficulty] || ex.difficulty,
    { facile: "Easy", media: "Medium", sfida: "Challenge" }[ex.difficulty] || ex.difficulty,
  ) : "";
  const totH = (Number(recipe.bulk_fermentation_hours) || 0) + (Number(recipe.proofing_hours) || 0);
  const timeTxt = totH > 0 ? `~${Math.round(totH)} h` : (recipe.bake_minutes ? `${recipe.bake_minutes} min` : "");
  const copyright = tri(
    "© MikiLab — Il Manuale di Sitor · mikilab.de · Vietato riprodurre o vendere senza il logo e il consenso",
    "© MikiLab — Das Handbuch von Sitor · mikilab.de · Ohne Logo und Zustimmung darf nicht reproduziert oder verkauft werden",
    "© MikiLab — Sitor's Manual · mikilab.de · Do not reproduce or sell without the logo and consent",
  );

  const share = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const W = 1080, H = 1350;
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      const c = cv.getContext("2d");
      c.fillStyle = "#12211c"; c.fillRect(0, 0, W, H);
      c.fillStyle = "#173029"; c.fillRect(0, 0, W, 220);
      // logo
      await new Promise((res) => {
        const img = new Image(); img.crossOrigin = "anonymous";
        img.onload = () => { const s = 140; c.drawImage(img, 70, 40, s, s); res(); };
        img.onerror = res; img.src = `${base}/logo.webp`;
      });
      c.fillStyle = "#f4efe6"; c.textBaseline = "top";
      c.font = "800 56px Georgia, serif"; c.fillText("MikiLab", 230, 62);
      c.fillStyle = "#c9a24a"; c.font = "600 26px Arial";
      c.fillText(tri("Il Manuale di Sitor", "Das Handbuch von Sitor", "Sitor's Manual"), 232, 132);
      // nome ricetta (wrap)
      c.fillStyle = "#f4efe6"; c.font = "800 60px Georgia, serif";
      const words = rname.split(" "); let line = ""; let y = 320;
      for (const w of words) {
        if (c.measureText(line + w).width > W - 140 && line) { c.fillText(line.trim(), 70, y); y += 76; line = w + " "; }
        else line += w + " ";
      }
      if (line.trim()) { c.fillText(line.trim(), 70, y); y += 76; }
      // tempo + difficoltà
      c.fillStyle = "#c9a24a"; c.font = "700 40px Arial";
      const meta = [timeTxt, diff].filter(Boolean).join("   ·   ");
      if (meta) c.fillText(meta, 70, y + 20);
      // riga invito
      c.fillStyle = "#f4efe6"; c.font = "600 44px Arial";
      c.fillText(tri("Ricetta completa su", "Vollständiges Rezept auf", "Full recipe on"), 70, 1080);
      c.fillStyle = "#c9a24a"; c.font = "800 56px Arial";
      c.fillText("mikilab.de", 70, 1140);
      c.fillStyle = "#8a9b91"; c.font = "500 30px Arial";
      c.fillText("https://mikilab.de", 70, 1230);

      const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
      const file = new File([blob], `mikilab-${(recipe.id || "ricetta").slice(0, 8)}.png`, { type: "image/png" });
      const shareData = { files: [file], title: rname, text: `${rname} — mikilab.de` };
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = file.name; a.click();
        URL.revokeObjectURL(url);
        toast.success(tri("Immagine scaricata", "Bild heruntergeladen", "Image downloaded"));
      }
    } catch (e) {
      if (e && e.name !== "AbortError") toast.error(tri("Condivisione non riuscita", "Teilen fehlgeschlagen", "Sharing failed"));
    } finally { busy.current = false; }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 no-print" data-testid="recipe-share-actions">
        <button data-testid="recipe-print-btn" onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-background border border-border text-foreground font-bold text-sm hover:border-primary/50 active:scale-95 transition-all">
          <Printer className="w-4 h-4" /> {tri("Stampa / PDF", "Drucken / PDF", "Print / PDF")}
        </button>
        <button data-testid="recipe-share-btn" onClick={share}
          className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-background border border-border text-foreground font-bold text-sm hover:border-primary/50 active:scale-95 transition-all">
          <Share2 className="w-4 h-4" /> {tri("Condividi", "Teilen", "Share")}
        </button>
      </div>

      {/* Scheda dedicata: visibile SOLO in stampa (il resto della pagina è nascosto da @media print). */}
      <div className="print-recipe-card" data-testid="recipe-print-card" aria-hidden="true">
        <div className="prc-head">
          <img src={`${base}/logo-light-256.png`} alt="MikiLab" className="prc-logo" />
          <div>
            <div className="prc-brand">MikiLab</div>
            <div className="prc-sub">{tri("Il Manuale di Sitor", "Das Handbuch von Sitor", "Sitor's Manual")}</div>
          </div>
        </div>
        <h1 className="prc-title">{rname}</h1>
        <div className="prc-meta">
          {[recipe.flour_type, timeTxt && `${tri("Lievitazione", "Gare", "Proof")}: ${timeTxt}`, diff && `${tri("Difficoltà", "Schwierigkeit", "Difficulty")}: ${diff}`]
            .filter(Boolean).join("  ·  ")}
        </div>
        {doses.length > 0 && (
          <table className="prc-table">
            <tbody>{doses.map(([n, g], i) => (<tr key={i}><td>{n}</td><td>{g} g</td></tr>))}</tbody>
          </table>
        )}
        {(recipe.bake_temp || recipe.bake_minutes) && (
          <p className="prc-line"><b>{tri("Cottura", "Backen", "Baking")}:</b> {recipe.bake_temp ? `${recipe.bake_temp}°C` : ""}{recipe.bake_minutes ? ` · ${recipe.bake_minutes} min` : ""}</p>
        )}
        {proc && (
          <div className="prc-proc"><b>{tri("Procedimento", "Zubereitung", "Method")}</b><p>{proc}</p></div>
        )}
        {allergens.length > 0 && (
          <p className="prc-line"><b>{tri("Allergeni", "Allergene", "Allergens")}:</b> {allergens.join(", ")}</p>
        )}
        <div className="prc-foot">{copyright}</div>
      </div>
    </>
  );
}
