import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Search, ChevronRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { GROUPS } from "@/components/Mappa";
import { GLOSSARIO, glossEntry, normText } from "@/lib/glossario";
import { PASTA } from "@/lib/pastaDiCasa";
import { CLASSI as SCUOLA_CLASSI } from "@/lib/scuolaDiPane"; // V112
import { SEZIONI } from "@/lib/paneCheSalva";
import { TRADIZIONI } from "@/components/Almanacco";
import { S as SOCCORSO } from "@/components/officina/ProntoSoccorso";
import { num } from "@/lib/sitorTools";

// V108 — CERCA IN TUTTO MIKILAB. Una casella sola per ricette (nome e ingredienti), attrezzi e pagine, parole del mestiere,
// forme di pasta, il pane che salva, le feste dell'almanacco, i sintomi del pronto soccorso. Tutto nel browser.

export const CERCA_KEY = "mikilab_cerca_q";
const nav = (route) => window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route } }));

export default function Cerca({ onBack, onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const [q, setQ] = useState(() => { try { return sessionStorage.getItem(CERCA_KEY) || ""; } catch { return ""; } });
  const [recipes, setRecipes] = useState([]);
  useEffect(() => { let ok = true; recipesApi.list("mikilab").then((d) => { if (ok) setRecipes((d || []).filter((r) => r && !r.locked)); }).catch(() => {}); return () => { ok = false; }; }, []);
  const go = (r) => (onNav ? onNav(r) : nav(r));
  const openRecipe = (id) => { go("recipes"); setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-open-recipe", { detail: { id } })), 200); };

  const res = useMemo(() => {
    const n = normText(q.trim()); if (n.length < 2) return null;
    const hit = (s) => normText(s).includes(n);
    const rec = recipes.filter((r) => hit(rLoc(r, "name", lang)) || hit(r.name) || hit(r.flour_type) || (r.extra_ingredients || []).some((e) => e && hit(e.name))).slice(0, 12);
    const tools = []; GROUPS.forEach((g) => g.items.forEach((it) => { if (hit(L(it.t)) || hit(L(it.d))) tools.push(it); })); 
    const words = GLOSSARIO.filter((g) => hit(glossEntry(g, lang).title) || g.kw.some((k) => hit(k)) || hit(glossEntry(g, lang).body)).slice(0, 6);
    const pasta = PASTA.filter((p) => hit(L(p.name)) || hit(L(p.reg)) || hit(L(p.sauce))).slice(0, 6);
    const salva = []; SEZIONI.forEach((s) => s.items.forEach((it) => { if (hit(L(it.t)) || hit(L(it.how))) salva.push({ s, it }); }));
    const scuola = []; SCUOLA_CLASSI.forEach((c) => c.lezioni.forEach((l, i) => { const tt = l.titolo[lang] || l.titolo.it; const im = l.impara[lang] || l.impara.it; if (hit(tt) || hit(im)) scuola.push({ c, l, i, tt }); })); // V112
    const feste = TRADIZIONI.filter((t) => hit(L(t))).slice(0, 4);
    const socc = SOCCORSO.filter((s) => hit(L(s.t)) || hit(L(s.why))).slice(0, 5);
    return { rec, tools: tools.slice(0, 8), words, pasta, salva: salva.slice(0, 5), scuola: scuola.slice(0, 6), feste, socc, total: rec.length + tools.length + words.length + pasta.length + salva.length + scuola.length + feste.length + socc.length };
  }, [q, recipes, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const Row = ({ testid, onClick, title, sub }) => (
    <button data-testid={testid} onClick={onClick} className="w-full flex items-center gap-2 px-3 py-2.5 text-left border-t border-border first:border-0"><span className="flex-1 min-w-0"><span className="block text-[13.5px] font-bold text-foreground leading-tight">{title}</span>{sub && <span className="block text-[12px] text-muted-foreground leading-snug line-clamp-2">{sub}</span>}</span><ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" /></button>
  );
  const Block = ({ k, title, children }) => <section data-testid={`cerca-${k}`}><p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-salvia mb-1.5">{title}</p><div className="rounded-2xl border border-border bg-card">{children}</div></section>;

  return (
    <div data-testid="cerca-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="cerca-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><Search className="w-3 h-3" />MikiLab</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Cerca in tutto MikiLab", "In ganz MikiLab suchen", "Search all of MikiLab")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
      </div>
      <div className="relative"><Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" /><input data-testid="cerca-input" autoFocus value={q} onChange={(e) => { setQ(e.target.value); try { sessionStorage.setItem(CERCA_KEY, e.target.value); } catch { /* */ } }} placeholder={tri("Ricette, ingredienti, parole, attrezzi, feste…", "Rezepte, Zutaten, Wörter, Werkzeuge, Feste…", "Recipes, ingredients, words, tools, feasts…")} className="w-full text-[15px] bg-card text-foreground border border-border rounded-xl pl-9 pr-3 py-3 outline-none focus:border-primary" /></div>
      {!res && <p className="text-[12.5px] text-muted-foreground">{tri("Scrivi almeno due lettere. Esempi: semola, biga, patate, orecchiette, San Martino, non cresce, forno.", "Mindestens zwei Buchstaben. Beispiele: Grieß, Biga, Kartoffel, Orecchiette, Martinstag, geht nicht auf, Ofen.", "At least two letters. Examples: semolina, biga, potato, orecchiette, St Martin, won't rise, oven.")}</p>}
      {res && res.total === 0 && <div className="rounded-2xl border border-border bg-card p-4 space-y-2"><p className="text-[13px] text-foreground">{tri("Niente con questo nome. Prova con una parola più corta, o chiedilo a Sitor.", "Nichts mit diesem Namen. Versuch ein kürzeres Wort, oder frag Sitor.", "Nothing by that name. Try a shorter word, or ask Sitor.")}</p><button data-testid="cerca-sitor" onClick={() => window.dispatchEvent(new CustomEvent("mikilab-open-chat"))} className="text-[12.5px] font-bold text-primary">{tri("Chiedi a Sitor →", "Sitor fragen →", "Ask Sitor →")}</button></div>}
      {res && res.rec.length > 0 && <Block k="ricette" title={tri("Ricette", "Rezepte", "Recipes")}>{res.rec.map((r) => <Row key={r.id} testid={`cerca-r-${r.id}`} onClick={() => openRecipe(r.id)} title={rLoc(r, "name", lang)} sub={[r.flour_type, num(r.flour_grams) > 0 ? `${tri("idratazione", "Hydration", "hydration")} ${Math.round((num(r.water_grams) / num(r.flour_grams)) * 100)} %` : ""].filter(Boolean).join(" · ")} />)}</Block>}
      {res && res.tools.length > 0 && <Block k="attrezzi" title={tri("Attrezzi e pagine", "Werkzeuge und Seiten", "Tools and pages")}>{res.tools.map((it, i) => <Row key={i} testid={`cerca-t-${it.r}-${i}`} onClick={() => go(it.r)} title={L(it.t)} sub={L(it.d)} />)}</Block>}
      {res && res.words.length > 0 && <Block k="parole" title={tri("Parole del mestiere", "Fachwörter", "Trade words")}>{res.words.map((g) => <div key={g.k} data-testid={`cerca-w-${g.k}`} className="px-3 py-2.5 border-t border-border first:border-0"><p className="text-[13.5px] font-bold text-foreground">{glossEntry(g, lang).title}</p><p className="text-[12px] text-foreground/85 leading-snug">{glossEntry(g, lang).body}</p></div>)}</Block>}
      {res && res.socc.length > 0 && <Block k="soccorso" title={tri("Pronto soccorso dell'impasto", "Erste Hilfe für den Teig", "Dough first aid")}>{res.socc.map((s) => <Row key={s.k} testid={`cerca-s-${s.k}`} onClick={() => go("recipes")} title={L(s.t)} sub={L(s.now)} />)}</Block>}
      {res && res.pasta.length > 0 && <Block k="pasta" title={tri("Le mani in pasta", "Die Hände im Teig", "Hands in the dough")}>{res.pasta.map((p) => <Row key={p.k} testid={`cerca-p-${p.k}`} onClick={() => go("pasta")} title={L(p.name)} sub={`${L(p.reg)} · ${L(p.sauce)}`} />)}</Block>}
      {res && res.salva.length > 0 && <Block k="salva" title={tri("Il pane che salva", "Das Brot, das rettet", "The bread that saves")}>{res.salva.map(({ s, it }, i) => <Row key={i} testid={`cerca-v-${s.k}-${i}`} onClick={() => go("salva")} title={L(it.t)} sub={L(s.t)} />)}</Block>}
      {res && res.scuola.length > 0 && <Block k="scuola" title={tri("MikiLab a scuola", "MikiLab in der Schule", "MikiLab at school")}>{res.scuola.map(({ c, i, tt }) => <Row key={`${c.n}-${i}`} testid={`cerca-s-${c.n}-${i}`} onClick={() => go("scuola")} title={tt} sub={`${c.nome[lang] || c.nome.it} · ${c.tema[lang] || c.tema.it}`} />)}</Block>} {/* V112 */}
      {res && res.feste.length > 0 && <Block k="feste" title={tri("Nell'almanacco", "Im Almanach", "In the almanac")}>{res.feste.map((t, i) => <Row key={i} testid={`cerca-f-${i}`} onClick={() => go("oggi")} title={`${String(t.d).padStart(2, "0")}/${String(t.m).padStart(2, "0")}`} sub={L(t)} />)}</Block>}
      <p className="text-[11px] text-muted-foreground">{tri("La ricerca legge tutto nel telefono: niente viene inviato.", "Die Suche liest alles im Handy: nichts wird gesendet.", "The search reads everything on your phone: nothing is sent.")}</p>
    </div>
  );
}
