// MikiLab v95 — righe aggiunte (idempotente; ancora mancante = errore, nessuna scrittura).
const fs = require("fs"); const edits = []; let failed = false;
function load(p) { if (!fs.existsSync(p)) { console.error("ERRORE: non trovo " + p); process.exit(1); } return fs.readFileSync(p, "utf8"); }
function need(s, a, p) { if (!s.includes(a)) { console.error("ERRORE: ancora non trovata in " + p + ": " + JSON.stringify(a.slice(0, 80))); failed = true; return false; } return true; }
function insertAfterLine(s, a, line, tag, p) { if (s.includes(tag)) return s; if (!need(s, a, p)) return s; const i = s.indexOf(a); const e = s.indexOf("\n", i); const ls = s.lastIndexOf("\n", i) + 1; const ind = s.slice(ls).match(/^\s*/)[0]; return s.slice(0, e + 1) + ind + line + "\n" + s.slice(e + 1); }
function insertBeforeLine(s, a, line, tag, p) { if (s.includes(tag)) return s; if (!need(s, a, p)) return s; const i = s.indexOf(a); const ls = s.lastIndexOf("\n", i) + 1; const ind = s.slice(ls, i).match(/^\s*/)[0]; return s.slice(0, ls) + ind + line + "\n" + s.slice(ls); }
function commit(p, a, b) { if (a !== b) edits.push([p, b]); }
{ const p = "frontend/src/App.js"; const s0 = load(p); let s = s0;
  s = insertAfterLine(s, 'import BancoProve from "@/components/BancoProve";', 'import Ospiti from "@/components/Ospiti"; // V95', 'import Ospiti from', p);
  s = insertAfterLine(s, 'import BancoProve from "@/components/BancoProve";', 'import CartaDeiPani from "@/components/CartaDeiPani"; // V95', 'import CartaDeiPani from', p);
  s = insertAfterLine(s, '{route === "banco" && <BancoProve onBack={() => setRoute("strumenti")} />}', '{route === "ospiti" && <Ospiti onBack={() => setRoute("strumenti")} />} {/* V95 */}', 'route === "ospiti"', p);
  s = insertAfterLine(s, '{route === "banco" && <BancoProve onBack={() => setRoute("strumenti")} />}', '{route === "carta" && <CartaDeiPani onBack={() => setRoute("strumenti")} />} {/* V95 */}', 'route === "carta"', p);
  s = insertAfterLine(s, 'if (p.startsWith("/volantino")) return "volantino";', 'if (p.startsWith("/ospiti")) return "ospiti"; // V95', 'startsWith("/ospiti")', p);
  s = insertAfterLine(s, 'if (p.startsWith("/volantino")) return "volantino";', 'if (p.startsWith("/carta")) return "carta"; // V95', 'startsWith("/carta")', p);
  commit(p, s0, s); }
{ const p = "frontend/src/components/Strumenti.jsx"; const s0 = load(p); let s = s0;
  s = insertAfterLine(s, 'from "lucide-react";', 'import { Users as UsersIcon, ScrollText as ScrollIcon } from "lucide-react"; // V95', 'UsersIcon', p);
  s = insertBeforeLine(s, '{ route: "banco", Icon: FlaskConical,', '{ route: "ospiti", Icon: UsersIcon, show: true, t: tri("Stasera ho ospiti", "Heute kommen Gäste", "Guests tonight"), d: tri("Occasione, persone, orario: i pani giusti, le dosi a persona, quando iniziare, la spesa", "Anlass, Personen, Uhrzeit: die richtigen Brote, Mengen pro Person, wann anfangen, der Einkauf", "Occasion, people, time: the right breads, per-person amounts, when to start, the shopping") }, // V95', 'route: "ospiti"', p);
  s = insertBeforeLine(s, '{ route: "banco", Icon: FlaskConical,', '{ route: "carta", Icon: ScrollIcon, show: true, t: tri("La carta dei pani", "Die Brotkarte", "The bread menu"), d: tri("Un menu elegante da stampare: cena, regalo, banco", "Eine elegante Karte zum Drucken: Abendessen, Geschenk, Theke", "An elegant menu to print: dinner, gift, counter") }, // V95', 'route: "carta"', p);
  commit(p, s0, s); }
if (failed) { console.error("ERRORE: nessun file modificato."); process.exit(1); }
edits.forEach(([p, s]) => fs.writeFileSync(p, s));
console.log("Frontend: " + (edits.length ? edits.map((e) => e[0].split("/").pop()).join(", ") + " aggiornati" : "già aggiornato, nessuna modifica"));
