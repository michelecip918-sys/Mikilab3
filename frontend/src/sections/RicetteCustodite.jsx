import { useState, useMemo, useEffect } from "react";
import QRCode from "qrcode";
import { Landmark, Wheat, Share2, Printer, ChevronLeft, Scale, MapPin, Clock, Sparkles } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { toast } from "sonner";

// "Le Ricette Custodite" — pani tradizionali del Sud d'Italia con il metodo di Michele.
// Ogni ingrediente è espresso in % sul peso della farina → "Adatta alle mie dosi" ricalcola tutto.

const RECIPES = [
  {
    id: "matera",
    it: "Pane di Matera IGP", de: "Materaner Brot", en: "Bread of Matera", es: "Pan de Matera",
    place: { it: "Matera, Basilicata", de: "Matera, Basilikata", en: "Matera, Basilicata", es: "Matera, Basilicata" },
    flag: "🇮🇹",
    img: "https://images.unsplash.com/photo-1590301157172-7ba48dd1c2b2?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    story: {
      it: "Forma a cornetto, mollica gialla e alveolata di semola di grano duro. Custodito da secoli, profuma di grano antico.",
      de: "Hörnchenform, gelbe, grobporige Krume aus Hartweizengrieß. Seit Jahrhunderten bewahrt.",
      en: "Croissant shape, yellow open crumb of durum semolina. Guarded for centuries.",
      es: "Forma de cuerno, miga amarilla y alveolada de sémola de trigo duro.",
    },
    ing: [
      { it: "Semola rimacinata di grano duro", de: "Hartweizengrieß (fein)", en: "Fine durum semolina", es: "Sémola remolida", pct: 100 },
      { it: "Acqua", de: "Wasser", en: "Water", es: "Agua", pct: 78 },
      { it: "Lievito Madre (rinfrescato)", de: "Sauerteig (aufgefrischt)", en: "Sourdough (refreshed)", es: "Masa madre", pct: 25 },
      { it: "Sale", de: "Salz", en: "Salt", es: "Sal", pct: 2.2 },
      { it: "Malto d'orzo", de: "Gerstenmalz", en: "Barley malt", es: "Malta de cebada", pct: 0.5 },
    ],
    proc: {
      it: "1. Rinfresca il lievito madre.\n2. Autolisi semola+acqua 30 min.\n3. Impasta con lievito madre, poi sale.\n4. Puntata 2-3 h a 26°C.\n5. Forma a cornetto, appretto 1 h.\n6. Cottura 250°C con vapore, poi 210°C per 55-60 min.",
      de: "1. Sauerteig auffrischen.\n2. Autolyse 30 Min.\n3. Kneten, dann Salz.\n4. Stockgare 2-3 h bei 26°C.\n5. Hörnchen formen, 1 h Stückgare.\n6. Backen 250°C mit Dampf, dann 210°C, 55-60 Min.",
      en: "1. Refresh sourdough.\n2. Autolyse 30 min.\n3. Mix, then salt.\n4. Bulk 2-3 h at 26°C.\n5. Shape horn, 1 h final proof.\n6. Bake 250°C with steam, then 210°C 55-60 min.",
      es: "1. Refresca la masa madre.\n2. Autólisis 30 min.\n3. Amasa, luego sal.\n4. Fermentación 2-3 h a 26°C.\n5. Forma cuerno, 1 h.\n6. Hornea 250°C con vapor, luego 210°C 55-60 min.",
    },
  },
  {
    id: "altamura",
    it: "Pane di Altamura DOP", de: "Altamura-Brot", en: "Altamura Bread", es: "Pan de Altamura",
    place: { it: "Altamura, Puglia", de: "Altamura, Apulien", en: "Altamura, Apulia", es: "Altamura, Apulia" },
    flag: "🇮🇹",
    img: "https://images.unsplash.com/photo-1549413468-cd78edb7e75c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    story: {
      it: "L'unico pane DOP d'Europa. Crosta spessa, profumo intenso, si conserva per giorni. Semola di grano duro delle Murge.",
      de: "Das einzige DOP-Brot Europas. Dicke Kruste, hält tagelang.",
      en: "The only DOP bread in Europe. Thick crust, keeps for days.",
      es: "El único pan DOP de Europa. Corteza gruesa, se conserva días.",
    },
    ing: [
      { it: "Semola rimacinata di grano duro", de: "Hartweizengrieß (fein)", en: "Fine durum semolina", es: "Sémola remolida", pct: 100 },
      { it: "Acqua", de: "Wasser", en: "Water", es: "Agua", pct: 62 },
      { it: "Lievito Madre (rinfrescato)", de: "Sauerteig (aufgefrischt)", en: "Sourdough (refreshed)", es: "Masa madre", pct: 20 },
      { it: "Sale", de: "Salz", en: "Salt", es: "Sal", pct: 2 },
    ],
    proc: {
      it: "1. Rinfresca il lievito madre.\n2. Impasta semola, acqua e lievito madre; aggiungi il sale.\n3. Puntata 1 h.\n4. Forma a filone, appretto 1 h.\n5. Capovolgi il pane prima di infornare (forma tradizionale).\n6. Cottura 250°C con vapore, poi 220°C per 60-70 min.",
      de: "1. Sauerteig auffrischen.\n2. Kneten, Salz zugeben.\n3. Stockgare 1 h.\n4. Formen, 1 h Stückgare.\n5. Vor dem Backen wenden.\n6. Backen 250°C mit Dampf, dann 220°C 60-70 Min.",
      en: "1. Refresh sourdough.\n2. Mix, add salt.\n3. Bulk 1 h.\n4. Shape loaf, 1 h proof.\n5. Flip before baking (traditional shape).\n6. Bake 250°C steam, then 220°C 60-70 min.",
      es: "1. Refresca la masa madre.\n2. Amasa, añade sal.\n3. Fermenta 1 h.\n4. Forma, 1 h.\n5. Voltea antes de hornear.\n6. Hornea 250°C vapor, luego 220°C 60-70 min.",
    },
  },
  {
    id: "focaccia",
    it: "Focaccia Barese", de: "Focaccia aus Bari", en: "Bari Focaccia", es: "Focaccia de Bari",
    place: { it: "Bari, Puglia", de: "Bari, Apulien", en: "Bari, Apulia", es: "Bari, Apulia" },
    flag: "🇮🇹",
    img: "https://images.unsplash.com/photo-1784822109223-20ceba260902?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    story: {
      it: "Soffice e alta, con pomodorini e olive. La patata lessa nell'impasto la rende umida per giorni.",
      de: "Weich und hoch, mit Tomaten und Oliven. Kartoffel im Teig hält sie tagelang saftig.",
      en: "Soft and tall, with cherry tomatoes and olives. Boiled potato keeps it moist.",
      es: "Blanda y alta, con tomates y aceitunas. La patata la mantiene húmeda.",
    },
    ing: [
      { it: "Farina 0 (media forza)", de: "Mehl Typ 550", en: "Bread flour", es: "Harina de fuerza media", pct: 70 },
      { it: "Semola rimacinata", de: "Hartweizengrieß", en: "Durum semolina", es: "Sémola", pct: 30 },
      { it: "Acqua", de: "Wasser", en: "Water", es: "Agua", pct: 80 },
      { it: "Patata lessa schiacciata", de: "Gekochte Kartoffel", en: "Boiled mashed potato", es: "Patata cocida", pct: 20 },
      { it: "Olio extravergine", de: "Olivenöl", en: "Olive oil", es: "Aceite de oliva", pct: 6 },
      { it: "Lievito Madre (o 0,4% birra)", de: "Sauerteig (o. 0,4% Hefe)", en: "Sourdough (or 0.4% yeast)", es: "Masa madre", pct: 15 },
      { it: "Sale", de: "Salz", en: "Salt", es: "Sal", pct: 2.2 },
    ],
    proc: {
      it: "1. Lessa la patata il giorno prima, schiacciala.\n2. Impasta farine, acqua, patata, lievito; poi olio e sale.\n3. Puntata 2 h a 26°C.\n4. Stendi in teglia oliata, fossette con le dita.\n5. Pomodorini, olive, origano, olio, sale grosso.\n6. Appretto 45 min.\n7. Cottura 230°C per 25-30 min.",
      de: "1. Kartoffel am Vortag kochen, zerdrücken.\n2. Kneten, dann Öl und Salz.\n3. Stockgare 2 h bei 26°C.\n4. In geölte Form ziehen, Mulden drücken.\n5. Tomaten, Oliven, Oregano, Öl, grobes Salz.\n6. 45 Min Stückgare.\n7. Backen 230°C 25-30 Min.",
      en: "1. Boil potato the day before, mash.\n2. Mix, then oil and salt.\n3. Bulk 2 h at 26°C.\n4. Spread in oiled pan, dimple.\n5. Tomatoes, olives, oregano, oil, coarse salt.\n6. Proof 45 min.\n7. Bake 230°C 25-30 min.",
      es: "1. Cuece la patata la víspera, tritúrala.\n2. Amasa, luego aceite y sal.\n3. Fermenta 2 h a 26°C.\n4. Extiende en molde aceitado, haz hoyuelos.\n5. Tomates, aceitunas, orégano, aceite, sal gruesa.\n6. 45 min.\n7. Hornea 230°C 25-30 min.",
    },
  },
];

const FALLBACK_IMG = "https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";
const onImgErr = (e) => { if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG; };

export default function RicetteCustodite() {
  const { lang } = useLang();
  const tri = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : ((lang === "en" || lang === "fr" || lang === "fa") ? (e ?? i) : i));
  const [openId, setOpenId] = useState(null);
  const [flour, setFlour] = useState(1000);
  const [qr, setQr] = useState("");

  const recipe = RECIPES.find((r) => r.id === openId);

  const rows = useMemo(() => {
    if (!recipe) return [];
    const f = Math.max(0, Number(flour) || 0);
    return recipe.ing.map((g) => ({ name: tri(g.it, g.de, g.en, g.es), pct: g.pct, grams: Math.round((g.pct / 100) * f) }));
  }, [recipe, flour, lang]); // eslint-disable-line

  const shareText = useMemo(() => {
    if (!recipe) return "";
    const lines = rows.map((r) => `• ${r.name}: ${r.grams} g (${r.pct}%)`).join("\n");
    return `${tri(recipe.it, recipe.de, recipe.en, recipe.es)} — MikiLab\n${tri("Farina", "Mehl", "Flour", "Harina")}: ${flour} g\n\n${lines}\n\n${recipe.proc[lang] || recipe.proc.it}`;
  }, [recipe, rows, flour, lang]); // eslint-disable-line

  useEffect(() => {
    if (!recipe) { setQr(""); return; }
    QRCode.toDataURL(shareText.slice(0, 900), { margin: 1, width: 220 }).then(setQr).catch(() => setQr(""));
  }, [recipe, shareText]);

  const doShare = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: "MikiLab", text: shareText }); return; }
    } catch { /* */ }
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };
  const copyText = () => { try { navigator.clipboard.writeText(shareText); toast.success(tri("Copiata!", "Kopiert!", "Copied!", "¡Copiada!")); } catch { /* */ } };

  const inp = "bg-[#FAF5EC] dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] rounded-xl px-3 py-2.5 outline-none text-[#2B303B] dark:text-[#e4eff8] focus:border-[#8C4A27] font-mono-data text-center w-28";

  if (recipe) {
    return (
      <div className="pb-40" data-testid="custodite-detail">
        <button data-testid="custodite-back" onClick={() => setOpenId(null)}
          className="inline-flex items-center gap-1.5 mb-4 px-4 py-2 rounded-full bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] text-[#6E371C] dark:text-[#a9d2ec] font-semibold text-sm shadow-sm active:scale-95 transition-all">
          <ChevronLeft className="w-4 h-4" /> {tri("Tutte le ricette", "Alle Rezepte", "All recipes", "Todas")}
        </button>

        <div className="print-area">
          <div className="rounded-3xl overflow-hidden border border-[#E6D8C3] dark:border-[#38424B] bg-white dark:bg-[#232A31] shadow-sm">
            <div className="relative h-40">
              <img src={recipe.img} onError={onImgErr} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3a2415]/80 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <h1 className="font-display text-2xl font-bold drop-shadow">{recipe.flag} {tri(recipe.it, recipe.de, recipe.en, recipe.es)}</h1>
                <p className="text-xs opacity-90 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {tri(recipe.place.it, recipe.place.de, recipe.place.en, recipe.place.es)}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] leading-relaxed italic">{recipe.story[lang] || recipe.story.it}</p>
            </div>
          </div>

          {/* Adatta alle mie dosi */}
          <div className="mt-4 bg-[#B45309]/10 border border-[#B45309]/30 rounded-2xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#8C4A27] mb-2 flex items-center gap-1.5"><Scale className="w-4 h-4" /> {tri("Adatta alle mie dosi", "An meine Mengen anpassen", "Adapt to my amounts", "Adapta a mis dosis")}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-[#3F4A54] dark:text-[#AEB8BF]">{tri("Quanta farina hai?", "Wie viel Mehl hast du?", "How much flour do you have?", "¿Cuánta harina tienes?")}</span>
              <input data-testid="custodite-flour" type="number" inputMode="numeric" value={flour} onChange={(e) => setFlour(e.target.value)} className={inp} />
              <span className="text-sm text-[#7E8A93]">g</span>
              <div className="flex gap-1.5 ml-auto">
                {[500, 1000, 2000].map((v) => (
                  <button key={v} data-testid={`custodite-quick-${v}`} onClick={() => setFlour(v)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#1F252B] border border-[#E6D8C3] dark:border-[#38424B] active:scale-95">{v >= 1000 ? `${v / 1000}kg` : `${v}g`}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredienti ricalcolati */}
          <div className="mt-4 rounded-2xl border border-[#E6D8C3] dark:border-[#38424B] bg-white dark:bg-[#232A31] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#FAF5EC] dark:bg-[#1F252B] flex items-center gap-2 border-b border-[#E6D8C3] dark:border-[#38424B]">
              <Wheat className="w-4 h-4 text-[#B45309]" />
              <span className="font-display font-semibold text-[#2B303B] dark:text-[#e4eff8]">{tri("Ingredienti", "Zutaten", "Ingredients", "Ingredientes")}</span>
            </div>
            <div data-testid="custodite-ingredients">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b last:border-0 border-[#F0E7D6] dark:border-[#2C343C]">
                  <span className="text-sm text-[#2B303B] dark:text-[#e4eff8]">{r.name}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono-data font-bold text-[#8C4A27] dark:text-[#d8a679]">{r.grams} g</span>
                    <span className="text-xs text-[#7E8A93]">{r.pct}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Procedimento */}
          <div className="mt-4 rounded-2xl border border-[#E6D8C3] dark:border-[#38424B] bg-white dark:bg-[#232A31] p-4">
            <p className="font-display font-semibold text-[#2B303B] dark:text-[#e4eff8] mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#B45309]" /> {tri("Procedimento", "Zubereitung", "Method", "Procedimiento")}</p>
            <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] whitespace-pre-line leading-relaxed">{recipe.proc[lang] || recipe.proc.it}</p>
          </div>

          {/* Scheda condivisibile con QR */}
          <div className="mt-4 rounded-2xl border-2 border-dashed border-[#B45309]/40 bg-[#FAF5EC] dark:bg-[#1F252B] p-4 flex items-center gap-4">
            {qr && <img data-testid="custodite-qr" src={qr} alt="QR" className="w-24 h-24 rounded-lg bg-white p-1 shrink-0" />}
            <div className="min-w-0">
              <p className="font-display font-semibold text-[#2B303B] dark:text-[#e4eff8] flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#B45309]" /> {tri("Scheda da condividere", "Karte zum Teilen", "Shareable card", "Ficha para compartir")}</p>
              <p className="text-xs text-[#7E8A93] mt-0.5">{tri("Inquadra il QR per avere ricetta e dosi.", "QR scannen für Rezept und Mengen.", "Scan the QR for recipe and amounts.", "Escanea el QR.")}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 no-print">
          <button data-testid="custodite-share" onClick={doShare} className="flex items-center justify-center gap-2 bg-[#8C4A27] text-white font-semibold py-3 rounded-xl active:scale-97"><Share2 className="w-5 h-5" /> {tri("Condividi", "Teilen", "Share", "Compartir")}</button>
          <button data-testid="custodite-copy" onClick={copyText} className="flex items-center justify-center gap-2 bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] text-[#2B303B] dark:text-[#e4eff8] font-semibold py-3 rounded-xl active:scale-97">{tri("Copia", "Kopieren", "Copy", "Copiar")}</button>
          <button data-testid="custodite-print" onClick={() => window.print()} className="flex items-center justify-center gap-2 bg-white dark:bg-[#232A31] border border-[#E6D8C3] dark:border-[#38424B] text-[#2B303B] dark:text-[#e4eff8] font-semibold py-3 rounded-xl active:scale-97"><Printer className="w-5 h-5" /> {tri("Stampa", "Druck", "Print", "Imprimir")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-40" data-testid="custodite-list">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl bg-[#8C4A27] flex items-center justify-center"><Landmark className="w-6 h-6 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#e4eff8]">{tri("Le Ricette Custodite", "Bewahrte Rezepte", "Treasured Recipes", "Recetas Custodiadas")}</h1>
          <p className="text-sm text-[#7E8A93]">{tri("I pani della tradizione, adattati alle tue dosi", "Traditionsbrote, an deine Mengen angepasst", "Traditional breads, adapted to your amounts", "Panes de la tradición")}</p>
        </div>
      </div>

      <div className="grid gap-3 mt-4">
        {RECIPES.map((r) => (
          <button key={r.id} data-testid={`custodite-open-${r.id}`} onClick={() => setOpenId(r.id)}
            className="flex items-center gap-3 text-left rounded-2xl overflow-hidden border border-[#E6D8C3] dark:border-[#38424B] bg-white dark:bg-[#232A31] shadow-sm active:scale-98 transition-all hover:border-[#B45309]/50">
            <img src={r.img} onError={onImgErr} alt="" className="w-24 h-24 object-cover shrink-0" />
            <div className="py-2 pr-3 min-w-0">
              <p className="font-display font-bold text-[#2B303B] dark:text-[#e4eff8]">{r.flag} {tri(r.it, r.de, r.en, r.es)}</p>
              <p className="text-xs text-[#7E8A93] flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {tri(r.place.it, r.place.de, r.place.en, r.place.es)}</p>
              <p className="text-xs text-[#3F4A54] dark:text-[#AEB8BF] mt-1 line-clamp-2">{r.story[lang] || r.story.it}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
