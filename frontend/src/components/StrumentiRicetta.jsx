import { useState, useEffect } from "react";
import { Thermometer, Clock, Ruler, Scale, Euro, Calendar, Gift, Layers, Scissors, ChevronDown, BookOpen, AlertTriangle, Wine } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { LS } from "@/lib/sitorTools"; // V94
import { computeDough, recipeKind, num } from "@/lib/sitorTools";
import AcquaGiusta from "@/components/officina/AcquaGiusta";
import LievitazioneACasa from "@/components/officina/LievitazioneACasa";
import StampoGiusto from "@/components/officina/StampoGiusto";
import RighelloCiotola from "@/components/officina/RighelloCiotola";
import PesaInUnaCiotola from "@/components/officina/PesaInUnaCiotola";
import QuantoTiCosta from "@/components/officina/QuantoTiCosta";
import PaneInAgenda from "@/components/officina/PaneInAgenda";
import CartolinaDelPane from "@/components/officina/CartolinaDelPane";
import DisegnaIlTaglio from "@/components/officina/DisegnaIlTaglio";
import ParoleRicetta from "@/components/officina/ParoleRicetta"; // V93
import PrimaCheSucceda from "@/components/officina/PrimaCheSucceda"; // V93

// V92 — GLI ATTREZZI DI SITOR PER QUESTA RICETTA. Sezione nella scheda ricetta: una fila di attrezzi,
// ne apri uno alla volta. Tutto calcolato nel browser dalle dosi della ricetta (mai modificate).

export default function StrumentiRicetta({ r, t, target, scaleVal, onScaleChange }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [openTool, setOpenTool] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { setOpenTool(null); }, [r && r.id]);
  if (!r || r.locked || num(r.flour_grams) <= 0) return null;
  const dough = computeDough(r, target);
  const kind = recipeKind(r);

  const tools = [
    { k: "prima", I: AlertTriangle, l: tri("Prima che succeda", "Bevor es passiert", "Before it happens"), C: () => <PrimaCheSucceda r={r} lang={lang} /> },
    { k: "parole", I: BookOpen, l: tri("Le parole della ricetta", "Die Wörter des Rezepts", "The recipe's words"), C: () => <ParoleRicetta r={r} lang={lang} /> },
    { k: "acqua", I: Thermometer, l: tri("Acqua giusta", "Das richtige Wasser", "The right water"), C: () => <AcquaGiusta r={r} dough={dough} lang={lang} /> },
    { k: "lievita", I: Clock, l: tri("Lievitazione a casa tua", "Gare bei dir zu Hause", "Rising at your place"), C: () => <LievitazioneACasa r={r} lang={lang} /> },
    { k: "stampo", I: Layers, l: tri("Lo stampo giusto", "Die richtige Form", "The right tin"), C: () => <StampoGiusto r={r} lang={lang} onScaleChange={onScaleChange} scaleVal={scaleVal} /> },
    { k: "righello", I: Ruler, l: tri("Righello della ciotola", "Schüssel-Lineal", "Bowl ruler"), C: () => <RighelloCiotola r={r} lang={lang} /> },
    { k: "pesa", I: Scale, l: tri("Pesa tutto in una ciotola", "Alles in eine Schüssel wiegen", "Weigh it all in one bowl"), C: () => <PesaInUnaCiotola r={r} dough={dough} lang={lang} t={t} /> },
    { k: "costa", I: Euro, l: tri("Quanto ti costa", "Was es dich kostet", "What it costs you"), C: () => <QuantoTiCosta r={r} dough={dough} lang={lang} t={t} /> },
    { k: "agenda", I: Calendar, l: tri("Il pane in agenda", "Brot im Kalender", "Bread in the diary"), C: () => <PaneInAgenda r={r} lang={lang} /> },
    { k: "cartolina", I: Gift, l: tri("La cartolina del pane", "Die Brot-Postkarte", "The bread postcard"), C: () => <CartolinaDelPane r={r} dough={dough} lang={lang} /> },
    ...(kind === "pane" || kind === "panini" ? [{ k: "taglio", I: Scissors, l: tri("Disegna il taglio", "Zeichne den Schnitt", "Draw the score"), C: () => <DisegnaIlTaglio r={r} lang={lang} /> }] : []),
  ];
  const cur = tools.find((x) => x.k === openTool);
  const goSommelier = () => { LS.set("mikilab_sommelier_recipe", { id: r.id, name: rLoc(r, "name", lang) }); window.dispatchEvent(new CustomEvent("mikilab-nav", { detail: { route: "sommelier" } })); }; // V94

  return (
    <section data-testid={`strumenti-ricetta-${r.id}`} className="no-print rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
      <button data-testid="strumenti-toggle" onClick={() => setCollapsed((c) => !c)} className="w-full flex items-center justify-between gap-2 text-left">
        <div>
          <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary">{tri("Gli attrezzi di Sitor", "Sitors Werkzeuge", "Sitor's tools")}</p>
          <p className="text-[12px] text-muted-foreground">{tri("per questa ricetta, con le tue dosi", "für dieses Rezept, mit deinen Mengen", "for this recipe, with your quantities")}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${collapsed ? "" : "rotate-180"}`} />
      </button>
      {!collapsed && (
        <>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tools.map((x) => (
              <button key={x.k} data-testid={`strumento-${x.k}`} onClick={() => setOpenTool(openTool === x.k ? null : x.k)}
                className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-full border active:scale-95 transition-all ${openTool === x.k ? "bg-primary text-white border-primary" : "bg-card text-foreground border-border hover:border-primary/60"}`}>
                <x.I className="w-3.5 h-3.5" />{x.l}
              </button>
            ))}
            <button data-testid="strumento-sommelier" onClick={goSommelier} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-full border bg-salvia/10 text-foreground border-salvia/40 active:scale-95 transition-all"><Wine className="w-3.5 h-3.5 text-salvia" />{tri("Assaggialo da sommelier", "Als Sommelier verkosten", "Taste it like a sommelier")}</button>
          </div>
          {cur && (
            <div data-testid={`strumento-panel-${cur.k}`} className="mt-3 rounded-xl border border-border bg-background p-3">
              <p className="text-[13px] font-bold text-foreground mb-2 flex items-center gap-1.5"><cur.I className="w-4 h-4 text-primary" />{cur.l}</p>
              <cur.C />
            </div>
          )}
        </>
      )}
    </section>
  );
}
