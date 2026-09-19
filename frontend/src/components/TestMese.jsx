import { useState, useEffect } from "react";
import { ChevronLeft, FlaskConical, Check } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import SitorBadge from "@/components/SitorBadge";

const VOTED_KEY = "mikilab_exp_voted";
const getVoted = () => { try { return JSON.parse(localStorage.getItem(VOTED_KEY) || "{}"); } catch { return {}; } };
const setVotedSlug = (s) => { try { const v = getVoted(); v[s] = 1; localStorage.setItem(VOTED_KEY, JSON.stringify(v)); } catch { /* */ } };

// STADIO J2 — "Il Test del Mese": esperimento di panificazione votato a tocchi. Nessun testo, nessuna foto.
export default function TestMese({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [data, setData] = useState(null);
  const [choices, setChoices] = useState({});
  const [voted, setVoted] = useState(false);

  const load = (reveal) => api.get(`/experiments${reveal ? "?reveal=1" : ""}`).then((r) => setData(r.data)).catch(() => setData({ open: null, archive: [] }));
  useEffect(() => { load(false); }, []); // eslint-disable-line

  useEffect(() => {
    if (data && data.open && getVoted()[data.open.slug]) { setVoted(true); load(true).then(() => {}); }
  }, [data && data.open && data.open.slug]); // eslint-disable-line

  const open = data && data.open;
  const OPTS = [
    { k: "A", l: open ? (open.variant_a[lang] || open.variant_a.it) : "A" },
    { k: "B", l: open ? (open.variant_b[lang] || open.variant_b.it) : "B" },
    { k: "same", l: tri("Uguali", "Gleich", "Same") },
    { k: "nocompare", l: tri("Non sono riuscito a confrontare", "Konnte nicht vergleichen", "Couldn't compare") },
  ];

  const submit = async () => {
    if (!open) return;
    try {
      await api.post(`/experiments/vote/${open.slug}`, { choices });
      setVotedSlug(open.slug); setVoted(true);
      load(true);
    } catch { /* */ }
  };

  const pct = (counts, crit, k) => {
    const c = counts && counts[crit]; if (!c) return null;
    const tot = c.A + c.B + c.same + c.nocompare; if (!tot) return 0;
    return Math.round((c[k] / tot) * 100);
  };
  const revealResults = (exp) => (voted || (exp && exp.status === "closed")) && exp && exp.enough && exp.results && Object.keys(exp.results).length;

  return (
    <div data-testid="testmese-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="testmese-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2"><FlaskConical className="w-6 h-6 text-primary" /><h1 className="font-display text-2xl font-black text-foreground">{tri("Il Test del Mese", "Der Test des Monats", "Test of the Month")}</h1></div>
      <SitorBadge size={22} />
      <p className="text-[13px] text-muted-foreground">{tri(
        "Risultati dichiarati dagli utenti, non sono un esperimento di laboratorio: servono a capire, non a dimostrare.",
        "Von Nutzern gemeldete Ergebnisse, kein Laborexperiment: zum Verstehen, nicht zum Beweisen.",
        "Results declared by users, not a lab experiment: to understand, not to prove.")}</p>

      {!open && (
        <div data-testid="testmese-none" className="rounded-2xl border border-border bg-background p-6 text-center text-muted-foreground">
          {tri("Nessun test aperto in questo momento. Torna presto!", "Gerade kein Test offen. Schau bald wieder vorbei!", "No open test right now. Check back soon!")}
        </div>
      )}

      {open && (
        <div data-testid="testmese-open" className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
          <h2 className="font-display text-xl font-bold text-foreground">{open.title[lang] || open.title.it}</h2>
          <p className="text-[15px] text-foreground">{open.question[lang] || open.question.it}</p>
          {!open.single_dough && <p className="text-xs font-bold text-mattone">{tri("Servono due impasti separati.", "Es braucht zwei getrennte Teige.", "Two separate doughs are needed.")}</p>}

          {!voted ? (<>
            <p className="text-[11px] font-black uppercase tracking-wide text-primary">{tri("Ho fatto il test:", "Ich habe getestet:", "I did the test:")}</p>
            {open.evaluates.map((crit) => (
              <div key={crit} data-testid={`testmese-crit-${crit}`} className="space-y-1.5">
                <p className="text-sm font-bold text-foreground">{(open.eval_labels[crit] && (open.eval_labels[crit][lang] || open.eval_labels[crit].it)) || crit}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {OPTS.map((o) => (
                    <button key={o.k} data-testid={`testmese-${crit}-${o.k}`} onClick={() => setChoices((c) => ({ ...c, [crit]: o.k }))}
                      className={`px-2 py-2 rounded-lg text-xs font-bold border active:scale-95 transition-all ${choices[crit] === o.k ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground"}`}>{o.l}</button>
                  ))}
                </div>
              </div>
            ))}
            <button data-testid="testmese-submit" onClick={submit} disabled={Object.keys(choices).length === 0}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold active:scale-95 disabled:opacity-40">{tri("Invia il mio risultato", "Ergebnis senden", "Send my result")}</button>
          </>) : (
            <div data-testid="testmese-results" className="space-y-3">
              <p className="inline-flex items-center gap-1.5 text-sm font-bold text-salvia"><Check className="w-4 h-4" />{tri("Grazie per aver partecipato!", "Danke fürs Mitmachen!", "Thanks for taking part!")}</p>
              {revealResults(open) ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{open.total_votes} {tri("partecipanti", "Teilnehmer", "participants")}</p>
                  {open.evaluates.map((crit) => (
                    <div key={crit} className="rounded-lg bg-background border border-border p-2">
                      <p className="text-xs font-bold text-foreground mb-1">{(open.eval_labels[crit] && (open.eval_labels[crit][lang] || open.eval_labels[crit].it)) || crit}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {OPTS.map((o) => <span key={o.k}>{o.l}: <b className="text-foreground">{pct(open.results, crit, o.k)}%</b></span>)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{tri("Stiamo ancora raccogliendo i dati.", "Wir sammeln noch Daten.", "We're still collecting data.")}</p>
              )}
            </div>
          )}
        </div>
      )}

      {data && data.archive && data.archive.length > 0 && (
        <div data-testid="testmese-archive" className="space-y-2">
          <h3 className="font-display text-lg font-bold text-foreground">{tri("Cosa abbiamo scoperto", "Was wir herausfanden", "What we found")}</h3>
          {data.archive.map((a) => (
            <div key={a.slug} className="rounded-xl border border-border bg-background p-3">
              <p className="font-bold text-foreground text-sm">{a.title[lang] || a.title.it}</p>
              {a.michele_comment && (a.michele_comment[lang] || a.michele_comment.it) && <p className="text-[13px] text-foreground/80 mt-1">{a.michele_comment[lang] || a.michele_comment.it}</p>}
              {a.verdict && <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{tri("Verdetto", "Urteil", "Verdict")}: {a.verdict}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
