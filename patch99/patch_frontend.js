// MikiLab v99 — Strumenti: casella di ricerca e "usati di recente" (idempotente; ancora mancante = errore).
const fs = require("fs"); let failed = false;
function load(p) { if (!fs.existsSync(p)) { console.error("ERRORE: non trovo " + p); process.exit(1); } return fs.readFileSync(p, "utf8"); }
function need(s, a, p) { if (!s.includes(a)) { console.error("ERRORE: ancora non trovata in " + p + ": " + JSON.stringify(a.slice(0, 80))); failed = true; return false; } return true; }
function replaceOnce(s, f, t, tag, p) { if (s.includes(tag)) return s; if (!need(s, f, p)) return s; return s.replace(f, t); }
const p = "frontend/src/components/Strumenti.jsx"; const s0 = load(p); let s = s0;
if (!/^import \{[^}]*\buseState\b[^}]*\} from "react";/m.test(s) && !s.includes("V99 react")) s = 'import { useState } from "react"; // V99 react\n' + s;
s = replaceOnce(s, '  ].filter((x) => x.show);\n', `  ].filter((x) => x.show);
  // V99: cerca un attrezzo per nome e ritrova quelli usati di recente
  const [q, setQ] = useState("");
  const norm = (v) => String(v || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
  const shown = q.trim() ? all.filter((x) => norm(x.t + " " + x.d).includes(norm(q))) : all;
  const readRecent = () => { try { return JSON.parse(localStorage.getItem("mikilab_recenti") || "[]"); } catch { return []; } };
  const recent = readRecent().map((r) => all.find((x) => x.route === r)).filter(Boolean).slice(0, 4);
  const go = (route) => { try { localStorage.setItem("mikilab_recenti", JSON.stringify([route, ...readRecent().filter((r) => r !== route)].slice(0, 8))); } catch { /* */ } onNav(route); };
`, "mikilab_recenti", p);
s = replaceOnce(s, '      <div className="grid grid-cols-2 gap-2.5" data-testid="strumenti-grid">\n        {all.map((x) => (\n          <button key={x.route} data-testid={`strumenti-${x.route}`} onClick={() => onNav(x.route)}',
`      <input data-testid="strumenti-cerca" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tri("Cerca un attrezzo… (es. lievito, forno, stampa)", "Werkzeug suchen… (z. B. Sauerteig, Ofen, Drucken)", "Search a tool… (e.g. starter, oven, print)")} className="w-full text-[14px] bg-card text-foreground border border-border rounded-xl px-3 py-2.5 outline-none focus:border-primary" />
      {!q.trim() && recent.length > 0 && (
        <div data-testid="strumenti-recenti">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{tri("Usati di recente", "Zuletzt benutzt", "Recently used")}</p>
          <div className="flex flex-wrap gap-1.5">{recent.map((x) => <button key={x.route} data-testid={\`recente-\${x.route}\`} onClick={() => go(x.route)} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-full border border-primary/40 bg-primary/8 text-foreground active:scale-95"><x.Icon className="w-3.5 h-3.5 text-primary" />{x.t}</button>)}</div>
        </div>
      )}
      {shown.length === 0 && <p className="text-[13px] text-muted-foreground">{tri("Nessun attrezzo con questo nome. Prova con un'altra parola.", "Kein Werkzeug mit diesem Namen. Versuch ein anderes Wort.", "No tool with that name. Try another word.")}</p>}
      <div className="grid grid-cols-2 gap-2.5" data-testid="strumenti-grid">
        {shown.map((x) => (
          <button key={x.route} data-testid={\`strumenti-\${x.route}\`} onClick={() => go(x.route)}`, "strumenti-cerca", p);
if (failed) { console.error("ERRORE: nessun file modificato."); process.exit(1); }
if (s !== s0) fs.writeFileSync(p, s);
console.log("Frontend: " + (s !== s0 ? "Strumenti.jsx aggiornato" : "già aggiornato, nessuna modifica"));
