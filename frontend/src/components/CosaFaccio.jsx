import { useState, useEffect } from "react";
import { ChevronLeft, Wand2, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";
import CalendarReminder from "@/components/CalendarReminder";

// G2: "Cosa faccio con quello che ho?" — usa POST /api/sitor/plan (Sitor sceglie solo id validi).
export default function CosaFaccio({ onBack, onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [byId, setById] = useState({});

  useEffect(() => {
    api.get(`/recipes?collection_name=mikilab`).then((r) => {
      const m = {}; (r.data || []).forEach((x) => { m[x.id] = x; }); setById(m);
    }).catch(() => { /* */ });
  }, []);

  const ask = async () => {
    if (!q.trim() || loading) return;
    setLoading(true); setRes(null);
    try {
      const r = await api.post(`/sitor/plan`, { prompt: q.trim().slice(0, 300), lang });
      setRes(r.data);
    } catch (e) {
      setRes({ ok: false, reply: tri("Ho avuto un intoppo. Riprova.", "Kleiner Fehler. Versuch es nochmal.", "Small glitch. Try again.") });
    } finally { setLoading(false); }
  };

  return (
    <div data-testid="cosa-faccio-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="cf-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>

      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground flex items-center gap-2"><Wand2 className="w-7 h-7 text-primary" />{tri("Cosa faccio con quello che ho?", "Was mache ich mit dem, was ich habe?", "What can I make with what I have?")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{tri("Raccontami tempo, forno e ingredienti: Sitor sceglie fino a 3 ricette da questo manuale.", "Sag mir Zeit, Ofen und Zutaten: Sitor wählt bis zu 3 Rezepte aus diesem Handbuch.", "Tell me your time, oven and ingredients: Sitor picks up to 3 recipes from this manual.")}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <textarea data-testid="cf-input" value={q} maxLength={300} rows={3}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tri("Es. ho 3 ore, un forno piccolo e niente lievito madre, voglio qualcosa per cena", "Z. B. ich habe 3 Stunden, einen kleinen Ofen und keinen Sauerteig, ich will etwas fürs Abendessen", "E.g. I have 3 hours, a small oven and no sourdough, I want something for dinner")}
          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm outline-none focus:border-primary resize-none" />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-muted-foreground">{q.length}/300</span>
          <button data-testid="cf-ask" onClick={ask} disabled={loading || !q.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50 active:scale-95 transition-all">
            {loading ? tri("Sto pensando…", "Ich denke nach…", "Thinking…") : tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}
          </button>
        </div>
      </div>

      {res && res.resting && <p data-testid="cf-resting" className="text-center text-muted-foreground text-sm">{tri("Sitor sta riposando: usa i corsi già scritti.", "Sitor macht Pause: nutze die fertigen Kurse.", "Sitor is resting: use the ready courses.")}</p>}
      {res && res.limited && <p data-testid="cf-limited" className="text-center text-muted-foreground text-sm">{res.reply}</p>}
      {res && res.ok && res.recipes && res.recipes.length === 0 && <p className="text-center text-muted-foreground text-sm">{tri("Non ho trovato una buona corrispondenza. Prova a cambiare la richiesta.", "Keine gute Übereinstimmung. Ändere die Anfrage.", "No good match. Try changing your request.")}</p>}

      {res && res.ok && res.warning ? <p className="text-sm text-mattone font-semibold">⚠ {res.warning}</p> : null}

      {res && res.ok && (res.recipes || []).map((p) => {
        const r = byId[p.id];
        if (!r) return null;
        return (
          <div key={p.id} data-testid={`cf-result-${p.id}`} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">{r.name}</h3>
                {p.reason && <p className="text-muted-foreground text-sm mt-0.5">{p.reason}</p>}
                {p.flour_g ? <p className="text-xs text-primary font-bold mt-1">{tri("Farina consigliata", "Empfohlenes Mehl", "Suggested flour")}: {p.flour_g} g</p> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button data-testid={`cf-open-${p.id}`} onClick={() => onOpenRecipe && onOpenRecipe(p.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95">
                {tri("Apri", "Öffnen", "Open")} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {((Number(r.bulk_fermentation_hours) || 0) + (Number(r.proofing_hours) || 0)) >= 4 && <CalendarReminder recipe={r} />}
          </div>
        );
      })}
    </div>
  );
}
