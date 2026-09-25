import { LayoutGrid, Map, MessageCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { GROUPS } from "@/components/Mappa";
import { useFeatures } from "@/lib/features"; // V123

// V119 — TUTTO MIKILAB in Home: ogni pagina del sito, raggruppata, a un tocco. Niente di nascosto.
// Stessa lista della Mappa (GROUPS), così le due non possono mai essere diverse.
export default function TuttoMikiLab({ onNav }) {
  const { lang } = useLang();
  const feats = useFeatures(); // V123
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const go = (r) => { try { onNav(r); } catch { /* */ } };
  return (
    <section data-testid="home-tutto-mikilab" className="mt-6 rounded-3xl border border-border/30 bg-background/70 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <LayoutGrid className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-black text-foreground">{tri("Tutto MikiLab", "Ganz MikiLab", "All of MikiLab")}</h2>
      </div>
      <p className="text-[13px] text-muted-foreground mt-1">{tri("Ogni pagina del sito, a un tocco. Niente da cercare.", "Jede Seite, mit einem Tipp. Nichts zu suchen.", "Every page of the site, one tap away. Nothing to search for.")}</p>
      <div className="mt-4 space-y-4">
        {GROUPS.map((g) => (
          <div key={g.k} data-testid={`tutto-${g.k}`}>
            <p className="font-mono-data text-[10px] tracking-[0.22em] uppercase text-primary mb-1.5">{L(g.t)}</p>
            <div className="flex flex-wrap gap-1.5">
              {g.items.filter((it) => !(it.r === "live" && feats && feats.FEATURE_LIVE === false)).map((it, i) => (
                <button key={i} data-testid={`tutto-${g.k}-${i}`} onClick={() => go(it.r)} title={L(it.d)}
                  className="px-3 py-1.5 rounded-full border border-border bg-card text-foreground text-[12.5px] font-bold leading-tight text-left hover:border-primary/60 active:scale-95 transition-all">
                  {L(it.t)}
                </button>
              ))}
              {g.k === "inizio" && (
                <button data-testid="tutto-chat" onClick={() => go("chat")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-foreground text-[12.5px] font-bold active:scale-95 transition-all">
                  <MessageCircle className="w-3.5 h-3.5 text-primary" />{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button data-testid="tutto-mappa" onClick={() => go("mappa")} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary">
        <Map className="w-4 h-4" />{tri("La mappa: ogni pagina con la sua spiegazione", "Die Karte: jede Seite mit ihrer Erklärung", "The map: every page with its explanation")}
      </button>
    </section>
  );
}
