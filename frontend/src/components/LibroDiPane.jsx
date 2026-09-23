import { useEffect, useState } from "react";
import { ChevronLeft, BookOpen, Printer } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { rLoc } from "@/lib/loc";
import { getFavs } from "@/lib/favorites";
import { getName } from "@/lib/bottega";
import { computeDough, itemLabel, num, fmtDateLong } from "@/lib/sitorTools";
import { getAppunti } from "@/components/officina/MieiAppunti"; // V98

// V97 — IL MIO LIBRO DI PANE. Le ricette che hai messo nel cuore, impaginate come un libretto da stampare (o PDF):
// copertina con il tuo soprannome, una ricetta per pagina, dosi originali, procedimento. Il ricettario di casa, su carta.

export default function LibroDiPane({ onBack }) {
  const { t, lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [recipes, setRecipes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const nick = getName();
  useEffect(() => { let ok = true; recipesApi.list("mikilab").then((d) => { if (ok) { const favs = getFavs(); setRecipes((d || []).filter((r) => r && !r.locked && favs.has(r.id))); setLoaded(true); } }).catch(() => setLoaded(true)); return () => { ok = false; }; }, []);
  return (
    <div data-testid="libro-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="libro-back" onClick={onBack} className="no-print inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div className="no-print">
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary flex items-center gap-1.5"><BookOpen className="w-3 h-3" />MikiLab</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Il mio libro di pane", "Mein Brotbuch", "My bread book")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{tri("Le ricette che hai messo nel cuore, impaginate come un libretto: una per pagina, dosi originali, procedimento. Stampalo o salvalo in PDF: è il ricettario di casa, su carta.", "Deine Lieblingsrezepte als Büchlein: eines pro Seite, Originalmengen, Ablauf. Drucken oder als PDF speichern: das Rezeptbuch des Hauses, auf Papier.", "Your favourite recipes laid out as a booklet: one per page, original quantities, method. Print it or save as PDF: the house recipe book, on paper.")}</p>
        {loaded && recipes.length === 0 && <p className="mt-2 text-[13px] text-muted-foreground rounded-xl border border-border bg-card p-3">{tri("Nessuna ricetta nel cuore ancora: nel Ricettario tocca il cuore sulle ricette che vuoi nel libro.", "Noch keine Lieblingsrezepte: tipp im Rezeptbuch auf das Herz bei den Rezepten, die ins Buch sollen.", "No favourites yet: in the recipe book tap the heart on the recipes you want in the book.")}</p>}
        {recipes.length > 0 && <button data-testid="libro-print" onClick={() => window.print()} className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl bg-primary text-white active:scale-95"><Printer className="w-4 h-4" />{tri(`Stampa il libro (${recipes.length} ricette)`, `Buch drucken (${recipes.length} Rezepte)`, `Print the book (${recipes.length} recipes)`)}</button>}
      </div>
      {recipes.length > 0 && (
        <div data-testid="libro-print-area" className="print-area space-y-6">
          <div className="rounded-2xl border border-border bg-background px-6 py-12 text-center" style={{ pageBreakAfter: "always" }}>
            <img src="/logo.webp" alt="" className="w-14 h-14 mx-auto rounded-full object-cover mb-4" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <p className="font-mono-data text-[10px] tracking-[0.35em] uppercase text-muted-foreground">MikiLab · {tri("Il Manuale di Sitor", "Sitors Handbuch", "Sitor's Manual")}</p>
            <h2 className="font-display text-4xl font-bold text-foreground mt-3">{tri("Il libro di pane", "Das Brotbuch", "The bread book")}</h2>
            <p className="font-display italic text-lg text-muted-foreground mt-2">{nick ? tri(`di ${nick}`, `von ${nick}`, `of ${nick}`) : tri("di casa", "des Hauses", "of the house")}</p>
            <div className="w-16 h-px bg-primary mx-auto my-6" />
            <p className="text-[12.5px] text-muted-foreground">{recipes.length} {tri("ricette", "Rezepte", "recipes")} · {fmtDateLong(new Date(), lang)}</p>
            <p className="text-[11px] text-muted-foreground mt-8">{tri("Ricette di Michele Signorella · mikilab.de", "Rezepte von Michele Signorella · mikilab.de", "Recipes by Michele Signorella · mikilab.de")}</p>
          </div>
          {recipes.map((r, idx) => {
            const d = num(r.flour_grams) > 0 ? computeDough(r, r.flour_grams) : null;
            const proc = rLoc(r, "procedure", lang) || r.procedure || "";
            const ap = getAppunti(r.id); // V98
            return (
              <article key={r.id} data-testid={`libro-ricetta-${idx}`} className="rounded-2xl border border-border bg-background px-6 py-6" style={{ pageBreakAfter: "always", breakInside: "avoid" }}>
                <p className="font-mono-data text-[10px] tracking-[0.3em] uppercase text-muted-foreground">{idx + 1} / {recipes.length}</p>
                <h3 className="font-display text-2xl font-bold text-foreground mt-1">{rLoc(r, "name", lang)}</h3>
                {r.flour_type && <p className="text-[12.5px] text-muted-foreground">{rLoc(r, "flour_type", lang) || r.flour_type}</p>}
                <div className="w-12 h-px bg-primary my-3" />
                {d && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[13px]">
                    {d.biga && <p className="col-span-2 text-[11px] font-bold uppercase tracking-wide text-primary">{d.biga.kind === "poolish" ? "Poolish" : "Biga"}: {Math.round(d.biga.flour)} g {t("ing_flour").toLowerCase()} · {Math.round(d.biga.water)} g {t("ing_water").toLowerCase()} · {d.biga.yeast} g {tri("lievito", "Hefe", "yeast")}{d.biga.hours ? ` · ${d.biga.hours} h` : ""}</p>}
                    {d.items.map((it, k) => <p key={k} className="flex justify-between border-b border-border/60 py-0.5"><span className="text-foreground/85">{itemLabel(it, t, lang, tri)}</span><span className="font-mono-data font-semibold text-foreground">{Math.round(it.grams)} g</span></p>)}
                  </div>
                )}
                {(num(r.bake_temp) > 0 || num(r.bulk_fermentation_hours) > 0) && <p className="text-[12.5px] text-muted-foreground mt-2">{num(r.bulk_fermentation_hours) > 0 ? `${tri("Massa", "Stockgare", "Bulk")} ${r.bulk_fermentation_hours} h · ` : ""}{num(r.proofing_hours) > 0 ? `${tri("Forma", "Stückgare", "Proof")} ${r.proofing_hours} h · ` : ""}{num(r.bake_temp) > 0 ? `${tri("Forno", "Ofen", "Oven")} ${r.bake_temp} °C${num(r.bake_minutes) > 0 ? ` · ${r.bake_minutes} min` : ""}` : ""}</p>}
                {proc && <p className="text-[13px] text-foreground/90 leading-relaxed whitespace-pre-line mt-3">{proc}</p>}
                {(ap.text || ap.stars > 0 || ap.made.length > 0) && (
                  <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{tri("I miei appunti", "Meine Notizen", "My notes")}{ap.stars > 0 ? ` · ${"★".repeat(ap.stars)}` : ""}{ap.made.length > 0 ? ` · ${tri(`fatta ${ap.made.length} volte`, `${ap.made.length} Mal gebacken`, `made ${ap.made.length} times`)}` : ""}</p>
                    {ap.text && <p className="text-[12.5px] text-foreground/90 whitespace-pre-line mt-1">{ap.text}</p>}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-4">mikilab.de/ricetta/{r.id}</p>
              </article>
            );
          })}
        </div>
      )}
      <p className="no-print text-[11px] text-muted-foreground">{tri("Le dosi sono quelle originali della ricetta. Per un'altra scala, apri la ricetta e stampala da lì.", "Die Mengen sind die Originalmengen. Für einen anderen Maßstab öffne das Rezept und drucke es dort.", "Quantities are the recipe's originals. For another scale, open the recipe and print from there.")}</p>
    </div>
  );
}
