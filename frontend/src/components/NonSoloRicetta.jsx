import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// V118 — "Una ricetta non è tutto": due righe oneste per chi fa il pane da una vita.
// Compare in Home e in cima alle ricette. Parole di Michele (non di Sitor).
// V128 — in cima alle ricette è compatto (titolo e prima frase, il resto con un tocco), così le ricette si vedono subito.
export default function NonSoloRicetta({ testid = "non-solo-ricetta", className = "", compact = false }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [open, setOpen] = useState(!compact);
  const p1 = tri(
    "MikiLab non vuole insegnare il mestiere a chi lo fa da una vita. Le mani, la farina, il forno di casa e il tempo cambiano sempre qualcosa.",
    "MikiLab will niemandem das Handwerk beibringen, der es schon sein Leben lang ausübt. Die Hände, das Mehl, der Ofen zu Hause und die Zeit verändern immer etwas.",
    "MikiLab doesn't want to teach the craft to anyone who has practised it all their life. Hands, flour, the home oven and time always change something.");
  const titolo = tri("Una ricetta non è tutto", "Ein Rezept ist nicht alles", "A recipe isn't everything");
  return (
    <section data-testid={testid} className={`rounded-3xl border border-primary/30 bg-background/70 ${compact ? "p-4" : "p-5 sm:p-6"} ${className}`}>
      {compact ? (
        <button data-testid={`${testid}-apri`} onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full flex items-center justify-between gap-2 text-left">
          <h2 className="font-display text-lg font-black text-foreground">{titolo}</h2>
          <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      ) : (
        <h2 className="font-display text-xl font-black text-foreground">{titolo}</h2>
      )}
      <p className={`text-[14px] text-foreground/90 leading-relaxed mt-2 ${!open ? "line-clamp-2" : ""}`}>{p1}</p>
      {open && (<>
        <p className="text-[14px] text-foreground/90 leading-relaxed mt-2">
          {tri(
            "Qui ho solo messo ordine: dosi chiare e passi semplici, uno alla volta. Perché quando tutto è organizzato bene, anche un bambino può fare il suo primo pane.",
            "Hier habe ich nur Ordnung geschaffen: klare Mengen und einfache Schritte, einer nach dem anderen. Denn wenn alles gut organisiert ist, kann sogar ein Kind sein erstes Brot backen.",
            "Here I've only put things in order: clear quantities and simple steps, one at a time. Because when everything is well organised, even a child can bake their first bread.")}
        </p>
        <p className="text-[14px] text-foreground leading-relaxed mt-2 font-semibold">
          {tri(
            "Sei un professionista e vedi qualcosa da migliorare? Scrivimi su TikTok, @mikilab.de: lo correggo volentieri. Il pane si fa insieme.",
            "Bist du Profi und siehst etwas, das man verbessern kann? Schreib mir auf TikTok, @mikilab.de: ich korrigiere es gern. Brot backt man gemeinsam.",
            "Are you a professional and see something to improve? Write to me on TikTok, @mikilab.de: I'll gladly fix it. Bread is made together.")}
        </p>
      </>)}
    </section>
  );
}
