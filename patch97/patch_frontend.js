// MikiLab v97 — righe aggiunte (idempotente; ancora mancante = errore, nessuna scrittura).
const fs = require("fs"); const edits = []; let failed = false;
function load(p) { if (!fs.existsSync(p)) { console.error("ERRORE: non trovo " + p); process.exit(1); } return fs.readFileSync(p, "utf8"); }
function need(s, a, p) { if (!s.includes(a)) { console.error("ERRORE: ancora non trovata in " + p + ": " + JSON.stringify(a.slice(0, 80))); failed = true; return false; } return true; }
function insertAfterLine(s, a, line, tag, p) { if (s.includes(tag)) return s; if (!need(s, a, p)) return s; const i = s.indexOf(a); const e = s.indexOf("\n", i); const ls = s.lastIndexOf("\n", i) + 1; const ind = s.slice(ls).match(/^\s*/)[0]; return s.slice(0, e + 1) + ind + line + "\n" + s.slice(e + 1); }
function insertBeforeLine(s, a, line, tag, p) { if (s.includes(tag)) return s; if (!need(s, a, p)) return s; const i = s.indexOf(a); const ls = s.lastIndexOf("\n", i) + 1; const ind = s.slice(ls, i).match(/^\s*/)[0]; return s.slice(0, ls) + ind + line + "\n" + s.slice(ls); }
function commit(p, a, b) { if (a !== b) edits.push([p, b]); }
{ const p = "frontend/src/App.js"; const s0 = load(p); let s = s0;
  s = insertAfterLine(s, 'import BancoProve from "@/components/BancoProve";', 'import Valigia from "@/components/Valigia"; // V97', 'import Valigia from', p);
  s = insertAfterLine(s, 'import BancoProve from "@/components/BancoProve";', 'import LibroDiPane from "@/components/LibroDiPane"; // V97', 'import LibroDiPane from', p);
  s = insertAfterLine(s, '{route === "banco" && <BancoProve onBack={() => setRoute("strumenti")} />}', '{route === "valigia" && <Valigia onBack={() => setRoute("strumenti")} />} {/* V97 */}', 'route === "valigia"', p);
  s = insertAfterLine(s, '{route === "banco" && <BancoProve onBack={() => setRoute("strumenti")} />}', '{route === "libro" && <LibroDiPane onBack={() => setRoute("strumenti")} />} {/* V97 */}', 'route === "libro"', p);
  s = insertAfterLine(s, 'if (p.startsWith("/volantino")) return "volantino";', 'if (p.startsWith("/valigia")) return "valigia"; // V97', 'startsWith("/valigia")', p);
  s = insertAfterLine(s, 'if (p.startsWith("/volantino")) return "volantino";', 'if (p.startsWith("/libro")) return "libro"; // V97', 'startsWith("/libro")', p);
  commit(p, s0, s); }
{ const p = "frontend/src/components/Strumenti.jsx"; const s0 = load(p); let s = s0;
  s = insertAfterLine(s, 'from "lucide-react";', 'import { Briefcase as BriefcaseIcon, BookOpen as BookIcon } from "lucide-react"; // V97', 'BriefcaseIcon', p);
  s = insertBeforeLine(s, '{ route: "banco", Icon: FlaskConical,', '{ route: "libro", Icon: BookIcon, show: true, t: tri("Il mio libro di pane", "Mein Brotbuch", "My bread book"), d: tri("Le ricette nel cuore impaginate come un libretto da stampare o salvare in PDF", "Die Lieblingsrezepte als Büchlein zum Drucken oder als PDF", "Your favourite recipes as a booklet to print or save as PDF") }, // V97', 'route: "libro"', p);
  s = insertBeforeLine(s, '{ route: "banco", Icon: FlaskConical,', '{ route: "valigia", Icon: BriefcaseIcon, show: true, t: tri("La valigia della bottega", "Der Koffer der Bottega", "The bottega suitcase"), d: tri("Salva tutto quello che MikiLab sa di te in un file e riaprilo sul telefono nuovo", "Sichere alles, was MikiLab über dich weiß, in einer Datei und pack es auf dem neuen Handy aus", "Save everything MikiLab knows about you to a file and unpack it on a new phone") }, // V97', 'route: "valigia"', p);
  commit(p, s0, s); }
if (failed) { console.error("ERRORE: nessun file modificato."); process.exit(1); }
edits.forEach(([p, s]) => fs.writeFileSync(p, s));
console.log("Frontend: " + (edits.length ? edits.map((e) => e[0].split("/").pop()).join(", ") + " aggiornati" : "già aggiornato, nessuna modifica"));
