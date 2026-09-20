import { useState, useEffect } from "react";
import { ChevronLeft, CalendarDays, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";

const FLAG = { world: "🌍", de: "🇩🇪", it: "🇮🇹" };

// STADIO P3 — Calendario del pane + "Che pane faccio oggi?". Eventi pubblicati dall'admin.
export default function Calendario({ onBack, onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [events, setEvents] = useState([]);
  const [easter, setEaster] = useState(null);
  const [country, setCountry] = useState("all");

  useEffect(() => { api.get(`/bread-calendar`).then((r) => { setEvents(r.data.events || []); setEaster(r.data.easter); }).catch(() => {}); }, []);
  const shown = events.filter((e) => country === "all" || e.country === country).filter((e) => e.status === "published");
  const next = shown.find((e) => e.days_until != null && e.days_until >= 0);

  const daysLabel = (n) => n === 0 ? tri("oggi", "heute", "today") : n === 1 ? tri("domani", "morgen", "tomorrow") : tri(`tra ${n} giorni`, `in ${n} Tagen`, `in ${n} days`);

  return (
    <div data-testid="calendario-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="calendario-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="flex items-center gap-2"><CalendarDays className="w-6 h-6 text-primary" /><h1 className="font-display text-2xl font-black text-foreground">{tri("Calendario del pane", "Brot-Kalender", "Bread calendar")}</h1></div>

      {next && (
        <div data-testid="calendario-oggi" className="rounded-2xl border border-primary/40 bg-primary/8 p-5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-primary mb-1"><Sparkles className="w-3.5 h-3.5" />{tri("Che pane faccio oggi?", "Welches Brot backe ich heute?", "What bread today?")}</p>
          <p className="font-display text-lg font-bold text-foreground">{FLAG[next.country]} {next.title[lang] || next.title.it}</p>
          <p className="text-sm text-foreground/80 mt-1">{next.text[lang] || next.text.it}</p>
          <p className="text-xs font-bold text-primary mt-1">{daysLabel(next.days_until)}</p>
          {(next.recipes || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {next.recipes.map((rn, i) => <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-background border border-border text-foreground">{rn}</span>)}
            </div>
          )}
        </div>
      )}

      <div data-testid="calendario-filter" className="flex gap-2 flex-wrap">
        {["all", "it", "de", "world"].map((c) => (
          <button key={c} data-testid={`calendario-f-${c}`} onClick={() => setCountry(c)}
            className={`px-3 py-1.5 rounded-full font-bold text-xs border active:scale-95 ${country === c ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground"}`}>
            {c === "all" ? tri("Tutti", "Alle", "All") : `${FLAG[c] || ""} ${c.toUpperCase()}`}
          </button>
        ))}
      </div>

      {easter && <p className="text-[12px] text-muted-foreground">{tri("Pasqua", "Ostern", "Easter")}: {new Date(easter).toLocaleDateString(lang)}</p>}

      <div data-testid="calendario-events" className="space-y-2">
        {shown.map((e) => (
          <div key={e.slug} data-testid={`calendario-ev-${e.slug}`} className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-foreground text-sm">{FLAG[e.country]} {e.title[lang] || e.title.it}</p>
              {e.days_until != null && <span className="text-[11px] font-bold text-primary shrink-0">{daysLabel(e.days_until)}</span>}
            </div>
            <p className="text-[13px] text-foreground/80 mt-0.5">{e.text[lang] || e.text.it}</p>
          </div>
        ))}
        {shown.length === 0 && <p data-testid="calendario-empty" className="text-sm text-muted-foreground">{tri("Presto qui troverai le ricorrenze del pane.", "Hier findest du bald die Brot-Anlässe.", "Bread occasions will appear here soon.")}</p>}
      </div>
    </div>
  );
}
