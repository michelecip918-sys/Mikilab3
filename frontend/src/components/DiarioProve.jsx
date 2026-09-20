import { useState, useEffect } from "react";
import { ChevronLeft, Loader2, CheckCircle2, RotateCcw, CircleDashed, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { api } from "@/lib/api";

const CAT_LABEL = {
  pane: ["Pane", "Brot", "Bread"],
  panini: ["Panini", "Brötchen", "Rolls"],
  focacce: ["Focacce", "Focaccia", "Focaccia"],
  panettoni: ["Panettoni", "Panettone", "Panettone"],
  pizza: ["Pizza", "Pizza", "Pizza"],
  dolci: ["Dolci", "Süßes", "Sweets"],
  viennoiserie: ["Viennoiserie", "Viennoiserie", "Viennoiserie"],
  pasticceria: ["Pasticceria", "Konditorei", "Pastry"],
  snack: ["Snack", "Snack", "Snack"],
  basi: ["Basi & Lieviti", "Grundlagen & Sauer", "Bases & Leavens"],
};

// Riepilogo Diario prove (solo admin): elenco bozze + consiglio di Sitor sulla prossima da provare.
export default function DiarioProve({ onBack, onOpenRecipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [data, setData] = useState(null);
  const [cat, setCat] = useState("all");

  const reload = () => { api.get(`/admin/test-diary`).then((r) => setData(r.data)).catch(() => setData({ items: [], next: null, to_test: 0, tested: 0 })); };
  useEffect(() => { reload(); }, []);

  const open = (id) => { if (onOpenRecipe) onOpenRecipe(id); };
  const catLabel = (c) => { const m = CAT_LABEL[c]; return m ? tri(m[0], m[1], m[2]) : c; };

  if (!data) return <div data-testid="diario-loading" className="max-w-2xl mx-auto px-4 py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const nextTip = data.sitor_tip ? (data.sitor_tip[lang] || data.sitor_tip.it) : "";
  const cats = [...new Set(data.items.map((i) => i.menu_category || ""))].filter(Boolean);
  const filteredItems = cat === "all" ? data.items : data.items.filter((it) => it.menu_category === cat);

  return (
    <div data-testid="diario-prove-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="diario-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>

      <div>
        <h1 className="text-2xl font-black text-foreground">{tri("Diario prove", "Test-Tagebuch", "Test log")}</h1>
        <p data-testid="diario-counts" className="text-sm text-muted-foreground mt-1">
          {tri(`${data.tested} provate · ${data.to_test} ancora da provare`, `${data.tested} erprobt · ${data.to_test} noch zu testen`, `${data.tested} tested · ${data.to_test} still to test`)}
        </p>
      </div>

      {/* Consiglio di Sitor: prossima da provare */}
      {data.next && (
        <div data-testid="diario-next" className="rounded-2xl border border-primary/40 bg-primary/8 p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <img src="/sitor_official.webp" alt="Sitor" className="w-9 h-9 rounded-full object-cover bg-primary/20" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <p className="text-[11px] font-black uppercase tracking-wide text-primary">{tri("Il consiglio di Sitor", "Sitors Rat", "Sitor's tip")}</p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{nextTip}</p>
          <button data-testid="diario-next-open" onClick={() => open(data.next.id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95">
            {tri("Apri", "Öffnen", "Open")} «{data.next.name}» <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Elenco bozze */}
      {data.items.length === 0 ? (
        <div data-testid="diario-empty" className="rounded-2xl border border-border bg-background p-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-accent mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground">{tri("Le hai provate tutte! 🎉", "Du hast alle getestet! 🎉", "You've tested them all! 🎉")}</p>
        </div>
      ) : (
        <>
        {/* Filtro per categoria */}
        <div data-testid="diario-filter" className="flex flex-wrap gap-2">
          <button data-testid="diario-filter-all" onClick={() => setCat("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 ${cat === "all" ? "bg-primary text-primary-foreground" : "bg-foreground/10 text-muted-foreground"}`}>
            {tri("Tutte", "Alle", "All")} ({data.items.length})
          </button>
          {cats.map((c) => (
            <button key={c} data-testid={`diario-filter-${c}`} onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 ${cat === c ? "bg-primary text-primary-foreground" : "bg-foreground/10 text-muted-foreground"}`}>
              {catLabel(c)} ({data.items.filter((i) => i.menu_category === c).length})
            </button>
          ))}
        </div>
        <div data-testid="diario-list" className="rounded-2xl border border-border bg-background overflow-hidden">
          {filteredItems.map((it) => (
            <button key={it.id} data-testid={`diario-row-${it.id}`} onClick={() => open(it.id)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-0 text-left hover:bg-muted/40 active:scale-[0.995] transition-colors">
              <span className="shrink-0">
                {it.test_outcome === "ok" ? <CheckCircle2 className="w-5 h-5 text-accent" />
                  : it.test_outcome === "da_rifare" ? <RotateCcw className="w-5 h-5 text-mattone" />
                    : <CircleDashed className="w-5 h-5 text-muted-foreground" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground truncate">{it.name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {catLabel(it.menu_category)}
                  {it.test_date ? ` · ${tri("provata il", "getestet am", "tested on")} ${it.test_date}` : ` · ${tri("mai provata", "nie getestet", "never tested")}`}
                  {it.test_outcome === "da_rifare" ? ` · ${tri("da rifare", "nochmal", "redo")}` : ""}
                </span>
                {it.test_notes ? <span className="block text-[11px] text-muted-foreground/80 italic truncate mt-0.5">“{it.test_notes}”</span> : null}
              </span>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
