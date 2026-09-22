// MikiLab v92 — inserisce l'Officina di Sitor in RecipeList.jsx senza sovrascrivere il file.
// Idempotente: se una riga c'è già, non la aggiunge. Se un'ancora manca, esce con errore (codice 1).
const fs = require("fs");
const path = "frontend/src/components/RecipeList.jsx";
if (!fs.existsSync(path)) { console.error("ERRORE: non trovo " + path + " (lancia dalla radice del progetto)"); process.exit(1); }
let s = fs.readFileSync(path, "utf8");
const orig = s;
let changes = 0;
function insertBefore(anchor, line, tag) {
  if (s.includes(tag)) return;
  const i = s.indexOf(anchor);
  if (i < 0) { console.error("ERRORE: ancora non trovata in RecipeList.jsx: " + JSON.stringify(anchor)); process.exit(1); }
  const lineStart = s.lastIndexOf("\n", i) + 1;
  const indent = s.slice(lineStart, i).match(/^\s*/)[0];
  s = s.slice(0, lineStart) + indent + line + "\n" + s.slice(lineStart);
  changes++;
}
function insertAfter(anchor, line, tag) {
  if (s.includes(tag)) return;
  const i = s.indexOf(anchor);
  if (i < 0) { console.error("ERRORE: ancora non trovata in RecipeList.jsx: " + JSON.stringify(anchor)); process.exit(1); }
  const lineEnd = s.indexOf("\n", i);
  const lineStart = s.lastIndexOf("\n", i) + 1;
  const indent = s.slice(lineStart).match(/^\s*/)[0];
  s = s.slice(0, lineEnd + 1) + indent + line + "\n" + s.slice(lineEnd + 1);
  changes++;
}
// 1) import (V91 se manca, poi V92)
insertAfter('import { renderProcedureWithImprover } from "@/lib/improverText";', 'import EtichettaMikiLab from "@/components/EtichettaMikiLab"; // V91', "EtichettaMikiLab from");
insertAfter('import { renderProcedureWithImprover } from "@/lib/improverText";', 'import OfficinaSitor from "@/components/OfficinaSitor"; // V92', "OfficinaSitor from");
insertAfter('import { renderProcedureWithImprover } from "@/lib/improverText";', 'import StrumentiRicetta from "@/components/StrumentiRicetta"; // V92', "StrumentiRicetta from");
// 2) etichetta nella scheda (V91)
insertAfter("<RecipeExtrasPanel recipe={r} isAdmin={canEdit} scaleG={target} />", "<EtichettaMikiLab recipe={r} />", "<EtichettaMikiLab recipe={r} />");
// 3) Officina nel Ricettario mikilab, sopra la barra di ricerca
insertBefore("{/* Barra di ricerca */}", '{collectionName === "mikilab" && <OfficinaSitor recipes={recipes} t={t} />} {/* V92 */}', "<OfficinaSitor recipes=");
// 4) attrezzi della ricetta, dopo il blocco ingredienti
insertBefore("{isPro && !isPanettone && !r.locked && flourG > 0 && (() => {", '{!r.locked && <StrumentiRicetta r={r} t={t} target={target} scaleVal={scaleVal} onScaleChange={onScaleChange} />} {/* V92 */}', "<StrumentiRicetta r={r}");
if (s !== orig) fs.writeFileSync(path, s);
console.log("RecipeList.jsx: " + (changes ? changes + " righe aggiunte" : "già aggiornato, nessuna modifica"));
