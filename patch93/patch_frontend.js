// MikiLab v93 — modifiche mirate a file esistenti del frontend (idempotenti; se un'ancora manca: errore, nessuna scrittura).
const fs = require("fs");
const edits = []; let failed = false;
function load(p) { if (!fs.existsSync(p)) { console.error("ERRORE: non trovo " + p); process.exit(1); } return fs.readFileSync(p, "utf8"); }
function need(s, anchor, p) { if (!s.includes(anchor)) { console.error("ERRORE: ancora non trovata in " + p + ": " + JSON.stringify(anchor.slice(0, 80))); failed = true; return false; } return true; }
function replaceOnce(s, from, to, tag, p) { if (s.includes(tag)) return s; if (!need(s, from, p)) return s; return s.replace(from, to); }
function insertAfterLine(s, anchor, line, tag, p) {
  if (s.includes(tag)) return s; if (!need(s, anchor, p)) return s;
  const i = s.indexOf(anchor); const end = s.indexOf("\n", i); const ls = s.lastIndexOf("\n", i) + 1; const indent = s.slice(ls).match(/^\s*/)[0];
  return s.slice(0, end + 1) + indent + line + "\n" + s.slice(end + 1);
}
function insertBeforeLine(s, anchor, line, tag, p) {
  if (s.includes(tag)) return s; if (!need(s, anchor, p)) return s;
  const i = s.indexOf(anchor); const ls = s.lastIndexOf("\n", i) + 1; const indent = s.slice(ls, i).match(/^\s*/)[0];
  return s.slice(0, ls) + indent + line + "\n" + s.slice(ls);
}
function commit(p, s0, s1) { if (s1 !== s0) edits.push([p, s1]); }

// 1) App.js: due pagine nuove
{ const p = "frontend/src/App.js"; const s0 = load(p); let s = s0;
  s = insertAfterLine(s, 'import BancoProve from "@/components/BancoProve";', 'import Laboratorio from "@/components/Laboratorio"; // V93', 'import Laboratorio from', p);
  s = insertAfterLine(s, 'import BancoProve from "@/components/BancoProve";', 'import PrimoPane from "@/components/PrimoPane"; // V93', 'import PrimoPane from', p);
  s = insertAfterLine(s, '{route === "banco" && <BancoProve onBack={() => setRoute("strumenti")} />}', '{route === "laboratorio" && <Laboratorio onBack={() => setRoute("strumenti")} />} {/* V93 */}', 'route === "laboratorio"', p);
  s = insertAfterLine(s, '{route === "banco" && <BancoProve onBack={() => setRoute("strumenti")} />}', '{route === "primopane" && <PrimoPane onBack={() => setRoute("strumenti")} />} {/* V93 */}', 'route === "primopane"', p);
  s = insertAfterLine(s, 'if (p.startsWith("/volantino")) return "volantino";', 'if (p.startsWith("/laboratorio")) return "laboratorio"; // V93', 'startsWith("/laboratorio")', p);
  s = insertAfterLine(s, 'if (p.startsWith("/volantino")) return "volantino";', 'if (p.startsWith("/primopane")) return "primopane"; // V93', 'startsWith("/primopane")', p);
  commit(p, s0, s); }

// 2) Strumenti.jsx: due voci
{ const p = "frontend/src/components/Strumenti.jsx"; const s0 = load(p); let s = s0;
  s = insertAfterLine(s, 'from "lucide-react";', 'import { Factory as FactoryIcon, Footprints as FootprintsIcon } from "lucide-react"; // V93', 'FactoryIcon', p);
  s = insertBeforeLine(s, '{ route: "banco", Icon: FlaskConical,', '{ route: "primopane", Icon: FootprintsIcon, show: true, t: tri("Il tuo primo pane", "Dein erstes Brot", "Your first bread"), d: tri("7 giorni, un passo al giorno, con Sitor accanto", "7 Tage, ein Schritt pro Tag, mit Sitor an der Seite", "7 days, one step a day, with Sitor beside you") }, // V93', 'route: "primopane"', p);
  s = insertBeforeLine(s, '{ route: "banco", Icon: FlaskConical,', '{ route: "laboratorio", Icon: FactoryIcon, show: true, t: tri("Il laboratorio", "Die Backstube", "The bakery"), d: tri("Foglio di produzione, cella, conversioni, carico del forno: per chi panifica di mestiere", "Produktionsblatt, Kühlzelle, Umrechnungen, Ofenbelegung: für alle, die beruflich backen", "Production sheet, cold room, conversions, oven loading: for those who bake for a living") }, // V93', 'route: "laboratorio"', p);
  commit(p, s0, s); }

// 3) SitorChat.jsx: prima risponde la bottega
{ const p = "frontend/src/components/SitorChat.jsx"; const s0 = load(p); let s = s0;
  s = insertAfterLine(s, 'import SitorBadge from "@/components/SitorBadge";', 'import { bottegaAnswer } from "@/lib/bottega"; // V93', 'bottegaAnswer', p);
  s = insertAfterLine(s, 'import SitorBadge from "@/components/SitorBadge";', 'import { recipesApi } from "@/lib/api"; // V93', 'import { recipesApi }', p);
  s = insertAfterLine(s, 'const [path, setPath] = useState([]);', 'const [recs, setRecs] = useState([]); // V93', 'setRecs', p);
  s = insertAfterLine(s, 'useEffect(() => { api.get(`/learning-path`)', 'useEffect(() => { recipesApi.list("mikilab").then((d) => setRecs(d || [])).catch(() => {}); }, []); // V93', 'recipesApi.list("mikilab")', p);
  s = replaceOnce(s, 'const send = async (override) => {\n    const voiceMode = typeof override === "string";', 'const send = async (override, opts = {}) => { // V93: opts.ai = salta la bottega, vai all\'IA\n    const voiceMode = typeof override === "string" && !opts.ai;', 'opts.ai', p);
  s = replaceOnce(s, '    const next = [...msgs, { role: "user", content: q }];\n    setMsgs(next); setBusy(true);',
    '    const next = opts.ai ? [...msgs] : [...msgs, { role: "user", content: q }];\n    setMsgs(next); setBusy(true);\n    if (!opts.ai) { // V93: prima risponde la bottega (glossario, pronto soccorso, dati della ricetta), senza IA e senza crediti\n      const curId = ((typeof window !== "undefined" && window.__mkCur) || {}).id;\n      const local = bottegaAnswer(q, lang, { recipe: recs.find((x) => x && x.id === curId) });\n      if (local) { setMsgs((m) => [...m, { role: "assistant", content: local, bottega: true, q }]); if (voiceMode) speak(local); setBusy(false); return; }\n    }', 'bottegaAnswer(q, lang', p);
  s = replaceOnce(s, 'messages: next.slice(-10),', 'messages: next.filter((m) => !m.bottega).slice(-10),', 'next.filter((m) => !m.bottega)', p);
  s = replaceOnce(s, '{m.role === "assistant" && <button onClick={() => speak(m.content)} className="ml-2 text-foreground/40 hover:text-muted-foreground align-middle"><Volume2 className="w-3.5 h-3.5 inline" /></button>}',
    '{m.role === "assistant" && <button onClick={() => speak(m.content)} className="ml-2 text-foreground/40 hover:text-muted-foreground align-middle"><Volume2 className="w-3.5 h-3.5 inline" /></button>}\n                {m.bottega && <span className="block mt-1.5 text-[10.5px] text-salvia">{tri("Dalla bottega, senza IA.", "Aus der Werkstatt, ohne KI.", "From the workshop, no AI.")} <button data-testid="chat-ask-ai" disabled={busy} onClick={() => send(m.q, { ai: true })} className="underline decoration-dotted font-bold disabled:opacity-40">{tri("Chiedi a Sitor IA →", "Sitor KI fragen →", "Ask Sitor AI →")}</button></span>}', 'chat-ask-ai', p);
  commit(p, s0, s); }

// 4) tts.js: voce del telefono di default, server solo se acceso
{ const p = "frontend/src/lib/tts.js"; const s0 = load(p); let s = s0;
  s = replaceOnce(s, 'function nativeSpeak(clean, lang, voice, onStart, onEnded) {\n  try {\n    const v = pickVoice(lang);',
    '// V93: la voce del server (a pagamento) si usa solo se accesa dall\'admin nella pagina Costi (FEATURE_VOICE_SERVER).\nfunction serverVoiceOn() { try { return !!(window.__mikilabFeatures && window.__mikilabFeatures.FEATURE_VOICE_SERVER); } catch { return false; } }\n// V93: testo ancora in italiano (ricetta non tradotta) con app in DE/EN → meglio la voce italiana che un tedesco che legge italiano.\nfunction guessLang(text, lang) {\n  if (lang === "it") return lang;\n  const n = ` ${String(text).toLowerCase()} `;\n  const it = [" il ", " la ", " di ", " che ", " con ", " per ", " una ", " gli ", " nel ", " dell", " farina ", " impasto ", " lievito "].filter((w) => n.includes(w)).length;\n  const other = (lang === "de" ? [" der ", " die ", " und ", " mit ", " den ", " ist ", " nicht ", " mehl ", " teig "] : [" the ", " and ", " with ", " is ", " of ", " to ", " flour ", " dough "]).filter((w) => n.includes(w)).length;\n  return it >= 3 && it > other * 2 ? "it" : lang;\n}\nfunction nativeSpeak(clean, lang, voice, onStart, onEnded) {\n  try {\n    lang = guessLang(clean, lang); // V93\n    const v = pickVoice(lang);', 'serverVoiceOn', p);
  s = replaceOnce(s, '  if (!API) { nativeSpeak(clean, L, vEff, onStart, onEnded); return; }', '  if (!API || !serverVoiceOn()) { nativeSpeak(clean, L, vEff, onStart, onEnded); return; } // V93: gratis di default', '!serverVoiceOn()', p);
  commit(p, s0, s); }

// 5) features.js: interruttori leggibili anche da tts.js
{ const p = "frontend/src/lib/features.js"; const s0 = load(p); let s = s0;
  s = replaceOnce(s, '.then((r) => { _cache = r.data || {}; return _cache; })', '.then((r) => { _cache = r.data || {}; try { window.__mikilabFeatures = _cache; } catch { /* */ } return _cache; }) // V93', '__mikilabFeatures', p);
  commit(p, s0, s); }

// 6) AdminCosts.jsx: interruttore della voce del server
{ const p = "frontend/src/components/AdminCosts.jsx"; const s0 = load(p); let s = s0;
  s = replaceOnce(s, 'const FEATS = ["FEATURE_PHOTO_DIAG", "FEATURE_PLAN", "FEATURE_LIVE", "FEATURE_VOICE_CHAT"];', 'const FEATS = ["FEATURE_PHOTO_DIAG", "FEATURE_PLAN", "FEATURE_LIVE", "FEATURE_VOICE_CHAT", "FEATURE_VOICE_SERVER"]; // V93: VOICE_SERVER = voce a pagamento (spenta: parla il telefono, gratis)', 'FEATURE_VOICE_SERVER', p);
  commit(p, s0, s); }

if (failed) { console.error("ERRORE: nessun file modificato."); process.exit(1); }
edits.forEach(([p, s]) => fs.writeFileSync(p, s));
console.log("Frontend: " + (edits.length ? edits.map((e) => e[0].split("/").pop()).join(", ") + " aggiornati" : "già aggiornato, nessuna modifica"));
