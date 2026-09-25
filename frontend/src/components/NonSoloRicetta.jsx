import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// V118 — "Una ricetta non è tutto": due righe oneste per chi fa il pane da una vita.
// Compare in Home e in cima alle ricette. Parole di Michele (non di Sitor).
export default function NonSoloRicetta({ testid = "non-solo-ricetta", className = "" }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  return (
    <section data-testid={testid} className={`rounded-3xl border border-primary/30 bg-background/70 p-5 sm:p-6 mb-4 ${className}`}>
      <h2 className="font-display text-xl font-black text-foreground">{tri("Una ricetta non è tutto", "Ein Rezept ist nicht alles", "A recipe isn't everything")}</h2>
      <p className="text-[14px] text-foreground/90 leading-relaxed mt-2">
        {tri(
          "MikiLab non vuole insegnare il mestiere a chi lo fa da una vita. Le mani, la farina, il forno di casa e il tempo cambiano sempre qualcosa.",
          "MikiLab will niemandem das Handwerk beibringen, der es schon sein Leben lang ausübt. Die Hände, das Mehl, der Ofen zu Hause und die Zeit verändern immer etwas.",
          "MikiLab doesn't want to teach the craft to anyone who has practised it all their life. Hands, flour, the home oven and time always change something.")}
      </p>
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
    </section>
  );
}
