import { useEffect, useState } from "react";
import { ChevronLeft, ClipboardList, Snowflake, ArrowLeftRight, Flame, Tag } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipesApi } from "@/lib/api";
import { num } from "@/lib/sitorTools";
import FoglioProduzione from "@/components/laboratorio/FoglioProduzione";
import Freddo from "@/components/laboratorio/Freddo";
import Conversioni from "@/components/laboratorio/Conversioni";
import CaricoForno from "@/components/laboratorio/CaricoForno";
import Cartellini from "@/components/laboratorio/Cartellini"; // V95

// V93 — IL LABORATORIO. La sezione per chi panifica di mestiere: foglio di produzione, programmazione a freddo,
// conversioni dei metodi, piano di carico del forno. Legge le ricette del sito; non le modifica; tutto nel browser.

const usable = (r) => r && !r.locked && num(r.flour_grams) > 0 && !/migliorator|backmittel|improver/i.test(r.name || "");

export default function Laboratorio({ onBack }) {
  const { t, lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [recipes, setRecipes] = useState([]);
  const [tab, setTab] = useState("foglio");
  useEffect(() => { let ok = true; recipesApi.list("mikilab").then((d) => { if (ok) setRecipes((d || []).filter(usable)); }).catch(() => {}); return () => { ok = false; }; }, []);

  const tabs = [
    { k: "foglio", I: ClipboardList, l: tri("Foglio di produzione", "Produktionsblatt", "Production sheet") },
    { k: "freddo", I: Snowflake, l: tri("Programmazione a freddo", "Kalte Führung", "Cold retard plan") },
    { k: "conv", I: ArrowLeftRight, l: tri("Conversioni", "Umrechnungen", "Conversions") },
    { k: "forno", I: Flame, l: tri("Carico del forno", "Ofenbelegung", "Oven loading") },
    { k: "cartellini", I: Tag, l: tri("Cartellini del banco", "Thekenschilder", "Counter tags") },
  ];

  return (
    <div data-testid="laboratorio-page" className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button data-testid="laboratorio-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>
      <div>
        <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-primary">{tri("So già panificare", "Ich backe schon", "I already bake")}</p>
        <h1 className="font-display text-2xl font-black text-foreground">{tri("Il laboratorio", "Die Backstube", "The bakery")}</h1>
        <div className="mk-oro-line mt-2 mb-1" />
        <p className="text-sm text-muted-foreground mt-1">{tri("Gli attrezzi di chi lavora con i chili e con l'orologio. Le ricette del sito, a scala di laboratorio, con i conti fatti.", "Die Werkzeuge für alle, die mit Kilos und mit der Uhr arbeiten. Die Rezepte der Seite im Backstubenmaßstab, fertig gerechnet.", "The tools of those who work in kilos and by the clock. The site's recipes at bakery scale, with the sums done.")}</p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((x) => (
          <button key={x.k} data-testid={`lab-tab-${x.k}`} onClick={() => setTab(x.k)} className={`shrink-0 inline-flex items-center gap-1.5 text-[12.5px] font-bold px-3 py-2 rounded-xl border active:scale-95 ${tab === x.k ? "bg-primary text-white border-primary" : "bg-card text-foreground border-border"}`}><x.I className="w-4 h-4" />{x.l}</button>
        ))}
      </div>
      {recipes.length === 0 && tab !== "forno" ? (
        <p className="text-[12.5px] text-muted-foreground">{tri("Carico le ricette…", "Lade Rezepte…", "Loading recipes…")}</p>
      ) : (
        <>
          {tab === "foglio" && <FoglioProduzione recipes={recipes} lang={lang} t={t} />}
          {tab === "freddo" && <Freddo recipes={recipes} lang={lang} />}
          {tab === "conv" && <Conversioni recipes={recipes} lang={lang} t={t} />}
          {tab === "forno" && <CaricoForno lang={lang} />}
          {tab === "cartellini" && <Cartellini recipes={recipes} lang={lang} t={t} />}
        </>
      )}
      <p className="text-[11px] text-muted-foreground">{tri("Tutto calcolato nel tuo telefono, niente inviato. I numeri sono di partenza: la tua farina, il tuo forno e la tua cella hanno l'ultima parola.", "Alles auf deinem Handy gerechnet, nichts gesendet. Die Zahlen sind Startwerte: dein Mehl, dein Ofen und deine Kühlzelle haben das letzte Wort.", "All calculated on your phone, nothing sent. The numbers are starting points: your flour, your oven and your cold room have the last word.")}</p>
    </div>
  );
}
