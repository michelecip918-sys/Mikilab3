// MikiLab v94 — righe aggiunte a file esistenti (idempotente; ancora mancante = errore, nessuna scrittura).
const fs = require("fs"); const edits = []; let failed = false;
function load(p) { if (!fs.existsSync(p)) { console.error("ERRORE: non trovo " + p); process.exit(1); } return fs.readFileSync(p, "utf8"); }
function need(s, a, p) { if (!s.includes(a)) { console.error("ERRORE: ancora non trovata in " + p + ": " + JSON.stringify(a.slice(0, 80))); failed = true; return false; } return true; }
function insertAfterLine(s, a, line, tag, p) { if (s.includes(tag)) return s; if (!need(s, a, p)) return s; const i = s.indexOf(a); const e = s.indexOf("\n", i); const ls = s.lastIndexOf("\n", i) + 1; const ind = s.slice(ls).match(/^\s*/)[0]; return s.slice(0, e + 1) + ind + line + "\n" + s.slice(e + 1); }
function insertBeforeLine(s, a, line, tag, p) { if (s.includes(tag)) return s; if (!need(s, a, p)) return s; const i = s.indexOf(a); const ls = s.lastIndexOf("\n", i) + 1; const ind = s.slice(ls, i).match(/^\s*/)[0]; return s.slice(0, ls) + ind + line + "\n" + s.slice(ls); }
function replaceOnce(s, f, t, tag, p) { if (s.includes(tag)) return s; if (!need(s, f, p)) return s; return s.replace(f, t); }
function commit(p, a, b) { if (a !== b) edits.push([p, b]); }
{ const p = "frontend/src/App.js"; const s0 = load(p); let s = s0;
  s = insertAfterLine(s, 'import BancoProve from "@/components/BancoProve";', 'import Sommelier from "@/components/Sommelier"; // V94', 'import Sommelier from', p);
  s = insertAfterLine(s, '{route === "banco" && <BancoProve onBack={() => setRoute("strumenti")} />}', '{route === "sommelier" && <Sommelier onBack={() => setRoute("strumenti")} />} {/* V94 */}', 'route === "sommelier"', p);
  s = insertAfterLine(s, 'if (p.startsWith("/volantino")) return "volantino";', 'if (p.startsWith("/sommelier")) return "sommelier"; // V94', 'startsWith("/sommelier")', p);
  commit(p, s0, s); }
{ const p = "frontend/src/components/Strumenti.jsx"; const s0 = load(p); let s = s0;
  s = insertAfterLine(s, 'from "lucide-react";', 'import { Wine as WineIcon } from "lucide-react"; // V94', 'WineIcon', p);
  s = insertBeforeLine(s, '{ route: "banco", Icon: FlaskConical,', '{ route: "sommelier", Icon: WineIcon, show: true, t: tri("Il sommelier del pane", "Der Brot-Sommelier", "The bread sommelier"), d: tri("Assaggia il tuo pane con cinque sensi: scheda, verdetto di Sitor, abbinamenti", "Verkoste dein Brot mit fünf Sinnen: Karte, Sitors Urteil, Kombinationen", "Taste your bread with five senses: card, Sitor\'s verdict, pairings") }, // V94', 'route: "sommelier"', p);
  commit(p, s0, s); }
{ const p = "frontend/src/components/PaneDelPaese.jsx"; const s0 = load(p); let s = s0;
  s = replaceOnce(s, '{ detail: { route: "miglionico" } }', '{ detail: { route: "dedica" } } /* V94: il bottone apriva una pagina inesistente */', 'V94: il bottone', p);
  commit(p, s0, s); }
if (failed) { console.error("ERRORE: nessun file modificato."); process.exit(1); }
edits.forEach(([p, s]) => fs.writeFileSync(p, s));
console.log("Frontend: " + (edits.length ? edits.map((e) => e[0].split("/").pop()).join(", ") + " aggiornati" : "già aggiornato, nessuna modifica"));
