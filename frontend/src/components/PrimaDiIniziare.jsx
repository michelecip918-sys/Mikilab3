import { ChevronLeft, Wheat, BookOpen, Layers, FlaskConical, Sprout, GraduationCap, ChefHat } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// V76 — "Prima di iniziare": tutto ciò che serve per usare bene MikiLab, in un solo posto.
// Prima le informazioni (farine, enciclopedia, basi, miglioratore, lievito, tecniche), poi la pratica (ricette).
export default function PrimaDiIniziare({ onBack, onNav }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);

  const items = [
    { key: "farine", Icon: Wheat, go: "ricette-view:farine",
      t: tri("Tabelle & Farine", "Tabellen & Mehle", "Tables & Flours"),
      d: tri("Che farina usare, forza (W), idratazioni e equivalenze in Germania (Type 405, 550…).", "Welches Mehl, Stärke (W), Hydration und Entsprechungen in Deutschland (Type 405, 550…).", "Which flour, strength (W), hydration and German equivalents (Type 405, 550…).") },
    { key: "guida", Icon: BookOpen, go: "ricette-view:guida",
      t: tri("Enciclopedia del Pane", "Brot-Lexikon", "Bread Encyclopedia"),
      d: tri("Il mestiere spiegato: impasti, lievitazioni, cotture, difetti e rimedi.", "Das Handwerk erklärt: Teige, Gare, Backen, Fehler und Lösungen.", "The craft explained: doughs, proofing, baking, faults and fixes.") },
    { key: "basi", Icon: Layers, go: "ricette-cat:basi",
      t: tri("Basi & Lieviti", "Basis & Sauerteige", "Bases & Starters"),
      d: tri("Lievito madre, poolish, licoli e le preparazioni da cui partono le ricette.", "Sauerteig, Poolish, Licoli und die Grundzubereitungen, von denen die Rezepte ausgehen.", "Sourdough, poolish, licoli and the preparations the recipes start from.") },
    { key: "migl", Icon: FlaskConical, go: "miglioratore",
      t: tri("Il mio miglioratore", "Mein Verbesserer", "My improver"),
      d: tri("Il Miglioratore Naturale MikiLab: cos'è e come si usa.", "Der natürliche MikiLab-Verbesserer: was er ist und wie man ihn nutzt.", "The MikiLab Natural Improver: what it is and how to use it.") },
    { key: "lievito", Icon: Sprout, go: "crealievito",
      t: tri("Crea il tuo lievito", "Sauerteig erschaffen", "Create your starter"),
      d: tri("Fai nascere il tuo lievito madre passo dopo passo.", "Züchte deinen eigenen Sauerteig Schritt für Schritt.", "Grow your own sourdough starter step by step.") },
    { key: "tecniche", Icon: GraduationCap, go: "tecniche",
      t: tri("Tecniche", "Techniken", "Techniques"),
      d: tri("Pieghe, formatura, incordatura, laminazione: le tecniche una per una.", "Falten, Formen, Kneten, Laminieren: die Techniken einzeln.", "Folds, shaping, gluten development, lamination: techniques one by one.") },
  ];

  return (
    <div data-testid="prima-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="prima-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold">
        <ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}
      </button>
      <div>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Prima di iniziare", "Bevor du anfängst", "Before you start")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {tri(
            "Queste informazioni sono importanti per usare bene MikiLab: prima si capisce, poi si impasta. Qui trovi tutto in un posto solo.",
            "Diese Infos sind wichtig, um MikiLab gut zu nutzen: erst verstehen, dann kneten. Hier findest du alles an einem Ort.",
            "This information matters for getting the most from MikiLab: first understand, then knead. Everything is in one place.")}
        </p>
      </div>

      <div className="grid gap-2.5" data-testid="prima-list">
        {items.map((it, i) => (
          <button key={it.key} data-testid={`prima-${it.key}`} onClick={() => onNav(it.go)}
            className="flex items-start gap-3 text-left rounded-2xl border border-border bg-background p-3.5 active:scale-[0.99] hover:border-primary/60 transition-all">
            <span className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0"><it.Icon className="w-5 h-5 text-primary" /></span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold text-muted-foreground">{i + 1}</span>
              <span className="block font-bold text-foreground text-[15px] leading-tight">{it.t}</span>
              <span className="block text-[13px] text-foreground/75 mt-0.5">{it.d}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
        <p className="font-bold text-foreground text-sm mb-2">{tri("Poi la pratica", "Dann die Praxis", "Then the practice")}</p>
        <button data-testid="prima-ricette" onClick={() => onNav("recipes")}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95">
          <ChefHat className="w-4 h-4" />{tri("Vai alle ricette", "Zu den Rezepten", "Go to the recipes")}
        </button>
      </div>
    </div>
  );
}
