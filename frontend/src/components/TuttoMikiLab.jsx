import { ChevronRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { STANZE, voceVisibile } from "@/components/Mappa";
import { useFeatures } from "@/lib/features";
import { usePublicContent } from "@/lib/publicContent";

// V128 — TUTTO MIKILAB in Home: otto porte grandi al posto di sessanta bottoni. Ogni porta apre la sua stanza
// nella pagina «Tutto MikiLab», dove ogni pagina ha una riga che dice a cosa serve. Le stanze sono le stesse della Mappa.
export default function TuttoMikiLab({ onNav }) {
  const { lang } = useLang();
  const feats = useFeatures();
  const pub = usePublicContent();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (lang === "de" ? o.de : lang === "en" ? o.en : o.it);
  const go = (r) => { try { onNav(r); } catch { /* */ } };
  return (
    <section data-testid="home-tutto-mikilab">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-black text-foreground">{tri("Tutto MikiLab", "Ganz MikiLab", "All of MikiLab")}</h2>
        <button data-testid="tutto-mappa" onClick={() => go("mappa")} className="text-[13px] font-bold text-primary inline-flex items-center gap-0.5">{tri("Vedi tutto", "Alles zeigen", "See all")}<ChevronRight className="w-4 h-4" /></button>
      </div>
      <p className="text-[13px] text-muted-foreground mt-0.5 mb-3">{tri("Otto stanze: dentro trovi ogni pagina del sito.", "Acht Räume: darin findest du jede Seite der Website.", "Eight rooms: inside you'll find every page of the site.")}</p>
      <div className="grid grid-cols-2 gap-2.5">
        {STANZE.map((s) => {
          const n = s.items.filter((it) => voceVisibile(it, feats, pub)).length;
          return (
            <button key={s.k} data-testid={`tutto-${s.k}`} onClick={() => go(`mappa:${s.k}`)}
              className="flex flex-col items-start gap-1.5 text-left rounded-2xl border border-border bg-card p-3 active:scale-[0.98] hover:border-primary/60 transition-all min-w-0">
              <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><s.I className="w-5 h-5 text-primary" /></span>
              <span className="font-display text-[16px] font-black text-foreground leading-tight">{L(s.t)}</span>
              <span className="text-[12px] text-muted-foreground leading-snug">{L(s.d)}</span>
              <span className="text-[11.5px] font-bold text-primary mt-auto">{n === 1 ? tri("1 pagina", "1 Seite", "1 page") : tri(`${n} pagine`, `${n} Seiten`, `${n} pages`)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
