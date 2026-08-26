import { useState } from "react";
import { Sparkles, Loader2, Printer, Wheat, Droplets, Thermometer, Euro, AlertTriangle, Package, ChevronDown, Info } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageContext";
import { recipesApi } from "@/lib/api";

// Generatore di Ricette Custom — metodo Mickey Lab.
// Calcolo grammi lato server (percentuali del panificatore) + procedimento AI nella lingua attiva.
const PREFERMENTS = [
  { id: "diretto", it: "Lievito di Birra (diretto)", de: "Hefe (direkt)", en: "Yeast (direct)", es: "Levadura (directo)" },
  { id: "poolish", it: "Poolish", de: "Poolish", en: "Poolish", es: "Poolish" },
  { id: "biga", it: "Biga", de: "Biga", en: "Biga", es: "Biga" },
  { id: "lm", it: "Lievito Madre", de: "Sauerteig", en: "Sourdough", es: "Masa madre" },
  { id: "misto", it: "Misto (Poolish + LM)", de: "Gemischt (Poolish + ST)", en: "Mixed (Poolish + Sourdough)", es: "Mixto (Poolish + MM)" },
];

const EXTRAS = [
  { id: "olio_oliva", it: "Olio d'oliva", de: "Olivenöl", en: "Olive oil", es: "Aceite de oliva" },
  { id: "farina_canapa", it: "Farina di canapa", de: "Hanfmehl", en: "Hemp flour", es: "Harina de cáñamo" },
  { id: "semi_misti", it: "Semi misti", de: "Saatenmix", en: "Mixed seeds", es: "Semillas variadas" },
  { id: "erbe", it: "Erbe aromatiche", de: "Kräuter", en: "Herbs", es: "Hierbas" },
  { id: "olive", it: "Olive", de: "Oliven", en: "Olives", es: "Aceitunas" },
  { id: "pomodori_secchi", it: "Pomodori secchi", de: "Getr. Tomaten", en: "Sun-dried tomatoes", es: "Tomates secos" },
  { id: "noci", it: "Noci", de: "Walnüsse", en: "Walnuts", es: "Nueces" },
  { id: "uvetta", it: "Uvetta", de: "Rosinen", en: "Raisins", es: "Pasas" },
  { id: "burro", it: "Burro", de: "Butter", en: "Butter", es: "Mantequilla" },
  { id: "zucchero", it: "Zucchero", de: "Zucker", en: "Sugar", es: "Azúcar" },
  { id: "miele", it: "Miele", de: "Honig", en: "Honey", es: "Miel" },
  { id: "uova", it: "Uova", de: "Eier", en: "Eggs", es: "Huevos" },
  { id: "malto", it: "Malto", de: "Malz", en: "Malt", es: "Malta" },
];

export default function RecipeGenerator() {
  const { lang } = useLang();
  const T = (i, d, e, s) => (lang === "de" ? d : lang === "es" ? (s ?? e ?? i) : lang === "en" ? (e ?? i) : i);
  const [product, setProduct] = useState("");
  const [preferment, setPreferment] = useState("diretto");
  const [hydration, setHydration] = useState(70);
  const [weight, setWeight] = useState(1000);
  const [extras, setExtras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("weight");
  const [pieces, setPieces] = useState(20);
  const [pieceWeight, setPieceWeight] = useState(90);
  const [waste, setWaste] = useState(10);
  const [showAdv, setShowAdv] = useState(false);
  const [doughTemp, setDoughTemp] = useState(24);
  const [ambient, setAmbient] = useState(20);
  const [flourTemp, setFlourTemp] = useState(20);
  const [friction, setFriction] = useState(3);
  const [flourPrice, setFlourPrice] = useState(1.2);
  const [fcRatio, setFcRatio] = useState(30);

  const toggleExtra = (id) => setExtras((x) => (x.includes(id) ? x.filter((e) => e !== id) : [...x, id]));

  const generate = async () => {
    if (!product.trim()) { toast.error(T("Scrivi che prodotto vuoi fare", "Gib an, was du backen willst", "Enter what you want to bake", "Escribe qué quieres hacer")); return; }
    setLoading(true); setResult(null);
    try {
      const d = await recipesApi.generate({
        product: product.trim(), preferment, hydration: Number(hydration), extras,
        total_weight: Number(weight), lang,
        mode, pieces: Number(pieces), piece_weight: Number(pieceWeight), waste_percent: Number(waste),
        target_dough_temp: Number(doughTemp), ambient_temp: Number(ambient), flour_temp: Number(flourTemp),
        friction: Number(friction), flour_price_kg: Number(flourPrice), food_cost_ratio: Number(fcRatio) / 100,
      });
      setResult(d);
    } catch (e) {
      const msg = e?.response?.status === 403
        ? T("Serve l'abbonamento PRO", "PRO erforderlich", "PRO required", "Se requiere PRO")
        : T("Errore nella generazione", "Fehler bei der Generierung", "Generation error", "Error en la generación");
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const ing = result?.ingredients;

  return (
    <div data-testid="recipe-generator" className="pb-28">
      <div className="rounded-3xl bg-gradient-to-br from-[#3f7cac] to-[#234b6e] text-white p-5 mb-4">
        <div className="flex items-center gap-2 mb-1"><Sparkles className="w-6 h-6" />
          <h1 className="font-display text-2xl font-bold">{T("Generatore di Ricette", "Rezept-Generator", "Recipe Generator", "Generador de Recetas")}</h1>
        </div>
        <p className="text-white/85 text-sm">{T("Crea una ricetta su misura col metodo Mickey Lab: dosi precise e procedimento personalizzato.", "Erstelle ein maßgeschneidertes Rezept nach der Mickey-Lab-Methode.", "Create a custom recipe with the Mickey Lab method: precise weights and a tailored process.", "Crea una receta a medida con el método Mickey Lab: cantidades precisas y procedimiento personalizado.")}</p>
      </div>

      <div className="space-y-4 bg-white dark:bg-[#232A31] rounded-2xl p-4 border border-[#d5e4f0] dark:border-[#38424B]">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{T("Prodotto", "Produkt", "Product", "Producto")}</label>
          <input data-testid="gen-product" value={product} onChange={(e) => setProduct(e.target.value)}
            placeholder={T("es. Focaccia al basilico, Ciabatta, Panini alla canapa…", "z. B. Focaccia mit Basilikum, Ciabatta…", "e.g. Basil focaccia, Ciabatta, Hemp rolls…", "p. ej. Focaccia de albahaca, Chapata, Bollos de cáñamo…")}
            className="mt-1 w-full rounded-xl border border-[#d5e4f0] dark:border-[#38424B] bg-transparent px-3 py-2.5 text-sm" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{T("Pre-fermento / Lievitazione", "Vorteig / Triebmittel", "Preferment / Leavening", "Prefermento / Fermentación")}</label>
          <select data-testid="gen-preferment" value={preferment} onChange={(e) => setPreferment(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#d5e4f0] dark:border-[#38424B] bg-transparent px-3 py-2.5 text-sm">
            {PREFERMENTS.map((p) => <option key={p.id} value={p.id}>{T(p.it, p.de, p.en, p.es)}</option>)}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93] flex items-center gap-1"><Droplets className="w-3.5 h-3.5" /> {T("Idratazione", "Hydration", "Hydration", "Hidratación")}</label>
            <span data-testid="gen-hydration-val" className="text-sm font-bold text-[#3f7cac]">{hydration}%</span>
          </div>
          <input data-testid="gen-hydration" type="range" min={50} max={100} step={1} value={hydration}
            onChange={(e) => setHydration(e.target.value)} className="mt-2 w-full accent-[#3f7cac]" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93] flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {T("Quantità", "Menge", "Quantity", "Cantidad")}</label>
          <div className="mt-1.5 flex gap-1.5">
            <button data-testid="gen-mode-weight" onClick={() => setMode("weight")}
              className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-all active:scale-95 ${mode === "weight" ? "bg-[#3f7cac] text-white border-[#3f7cac]" : "bg-transparent text-[#3f7cac] border-[#d5e4f0] dark:border-[#38424B]"}`}>
              {T("Peso totale", "Gesamtgewicht", "Total weight", "Peso total")}
            </button>
            <button data-testid="gen-mode-pieces" onClick={() => setMode("pieces")}
              className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-all active:scale-95 ${mode === "pieces" ? "bg-[#3f7cac] text-white border-[#3f7cac]" : "bg-transparent text-[#3f7cac] border-[#d5e4f0] dark:border-[#38424B]"}`}>
              {T("Per pezzatura", "Nach Stückzahl", "By pieces", "Por piezas")}
            </button>
          </div>
          {mode === "weight" ? (
            <input data-testid="gen-weight" type="number" min={200} step={100} value={weight} onChange={(e) => setWeight(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d5e4f0] dark:border-[#38424B] bg-transparent px-3 py-2.5 text-sm" placeholder={T("Peso impasto totale (g)", "Gesamtteig (g)", "Total dough (g)", "Peso total (g)")} />
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <div>
                <span className="text-[10px] text-[#7E8A93]">{T("N° pezzi", "Stückzahl", "Pieces", "Piezas")}</span>
                <input data-testid="gen-pieces" type="number" min={1} value={pieces} onChange={(e) => setPieces(e.target.value)} className="w-full rounded-xl border border-[#d5e4f0] dark:border-[#38424B] bg-transparent px-2 py-2 text-sm" />
              </div>
              <div>
                <span className="text-[10px] text-[#7E8A93]">{T("g a pezzo", "g/Stück", "g/piece", "g/pieza")}</span>
                <input data-testid="gen-piece-weight" type="number" min={10} value={pieceWeight} onChange={(e) => setPieceWeight(e.target.value)} className="w-full rounded-xl border border-[#d5e4f0] dark:border-[#38424B] bg-transparent px-2 py-2 text-sm" />
              </div>
              <div>
                <span className="text-[10px] text-[#7E8A93]">{T("Sfrido %", "Verschnitt %", "Waste %", "Merma %")}</span>
                <input data-testid="gen-waste" type="number" min={0} max={30} value={waste} onChange={(e) => setWaste(e.target.value)} className="w-full rounded-xl border border-[#d5e4f0] dark:border-[#38424B] bg-transparent px-2 py-2 text-sm" />
              </div>
            </div>
          )}
        </div>

        <div>
          <button data-testid="gen-adv-toggle" onClick={() => setShowAdv((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-[#3f7cac]">
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdv ? "rotate-180" : ""}`} />
            {T("Temperatura & costo (avanzato)", "Temperatur & Kosten (erweitert)", "Temperature & cost (advanced)", "Temperatura y coste (avanzado)")}
          </button>
          {showAdv && (
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-[#3f7cac]/5 p-3">
              {[
                ["dough", T("Temp. impasto °C", "Teigtemp. °C", "Dough temp °C", "Temp. masa °C"), doughTemp, setDoughTemp],
                ["ambient", T("Temp. ambiente °C", "Raumtemp. °C", "Room temp °C", "Temp. ambiente °C"), ambient, setAmbient],
                ["flour", T("Temp. farina °C", "Mehltemp. °C", "Flour temp °C", "Temp. harina °C"), flourTemp, setFlourTemp],
                ["friction", T("Attrito macchina °C", "Reibung °C", "Friction °C", "Fricción °C"), friction, setFriction],
                ["fprice", T("Prezzo farina €/kg", "Mehlpreis €/kg", "Flour price €/kg", "Precio harina €/kg"), flourPrice, setFlourPrice],
                ["ratio", T("Food cost % target", "Food-Cost % Ziel", "Food cost % target", "Food cost % objetivo"), fcRatio, setFcRatio],
              ].map(([k, lbl, val, setter]) => (
                <div key={k}>
                  <span className="text-[10px] text-[#7E8A93]">{lbl}</span>
                  <input data-testid={`gen-adv-${k}`} type="number" step="0.1" value={val} onChange={(e) => setter(e.target.value)}
                    className="w-full rounded-lg border border-[#d5e4f0] dark:border-[#38424B] bg-white dark:bg-[#232A31] px-2 py-1.5 text-sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[#7E8A93]">{T("Ingredienti speciali / aromi", "Spezielle Zutaten / Aromen", "Special ingredients / aromas", "Ingredientes especiales / aromas")}</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXTRAS.map((x) => (
              <button key={x.id} data-testid={`gen-extra-${x.id}`} onClick={() => toggleExtra(x.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-95 ${extras.includes(x.id) ? "bg-[#3f7cac] text-white border-[#3f7cac]" : "bg-transparent text-[#3f7cac] border-[#d5e4f0] dark:border-[#38424B]"}`}>
                {T(x.it, x.de, x.en, x.es)}
              </button>
            ))}
          </div>
        </div>

        <button data-testid="gen-submit" onClick={generate} disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#3f7cac] text-white font-semibold py-3 rounded-2xl active:scale-98 transition-all disabled:opacity-60">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {loading ? T("Genero la ricetta…", "Erstelle Rezept…", "Generating recipe…", "Generando receta…") : T("Genera Ricetta", "Rezept generieren", "Generate Recipe", "Generar Receta")}
        </button>
      </div>

      {result && ing && (
        <div data-testid="gen-result" className="mt-5 bg-white dark:bg-[#232A31] rounded-2xl p-4 border border-[#d5e4f0] dark:border-[#38424B]">
          <h2 className="font-display text-xl font-bold text-[#2B303B] dark:text-[#e4eff8] mb-3">{result.title}</h2>

          {(result.warnings || []).length > 0 && (
            <div data-testid="gen-warnings" className="mb-4 space-y-1.5">
              {result.warnings.map((w, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs rounded-xl px-3 py-2 border ${w.level === "danger" ? "bg-[#E7513A]/10 border-[#E7513A]/40 text-[#b23a28]" : w.level === "warn" ? "bg-[#C88A2B]/10 border-[#C88A2B]/40 text-[#8a5e15]" : "bg-[#3f7cac]/10 border-[#3f7cac]/30 text-[#2e5f86]"}`}>
                  {w.level === "info" ? <Info className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{w.text}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs font-bold uppercase tracking-wide text-[#3f7cac] mb-2 flex items-center gap-1"><Wheat className="w-4 h-4" /> {T("Ingredienti (dosi calcolate)", "Zutaten (berechnet)", "Ingredients (calculated)", "Ingredientes (calculados)")}</p>
          {ing.preferment && (
            <div className="mb-2 rounded-xl bg-[#C88A2B]/10 border border-[#C88A2B]/30 p-2.5 text-sm">
              <b>{ing.preferment.type}</b> ({ing.preferment.hours}): {ing.preferment.flour_g}g {T("farina","Mehl","flour","harina")} · {ing.preferment.water_g}g {T("acqua","Wasser","water","agua")}{ing.preferment.yeast_g ? ` · ${ing.preferment.yeast_g}g ${T("lievito","Hefe","yeast","levadura")}` : ""}
            </div>
          )}
          <ul className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] space-y-1 mb-4">
            <li className="flex justify-between border-b border-dashed border-[#e4eff8] dark:border-[#38424B] py-1"><span>{T("Farina totale","Mehl gesamt","Total flour","Harina total")}</span><b>{ing.flour_total_g} g</b></li>
            <li className="flex justify-between border-b border-dashed border-[#e4eff8] dark:border-[#38424B] py-1"><span>{T("Acqua totale","Wasser gesamt","Total water","Agua total")} ({ing.hydration_percent}%)</span><b>{ing.water_total_g} g</b></li>
            <li className="flex justify-between border-b border-dashed border-[#e4eff8] dark:border-[#38424B] py-1"><span>{T("Sale","Salz","Salt","Sal")}</span><b>{ing.salt_g} g</b></li>
            {ing.yeast_g ? <li className="flex justify-between border-b border-dashed border-[#e4eff8] dark:border-[#38424B] py-1"><span>{T("Lievito di birra","Hefe","Yeast","Levadura")}</span><b>{ing.yeast_g} g</b></li> : null}
            {ing.sourdough_g ? <li className="flex justify-between border-b border-dashed border-[#e4eff8] dark:border-[#38424B] py-1"><span>{T("Lievito Madre","Sauerteig","Sourdough","Masa madre")}</span><b>{ing.sourdough_g} g</b></li> : null}
            {(ing.extras || []).map((e, i) => (
              <li key={i} className="flex justify-between border-b border-dashed border-[#e4eff8] dark:border-[#38424B] py-1"><span>{e.name}</span><b>{e.grams} g</b></li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {result.water_temp && (
              <div data-testid="gen-water-temp" className="rounded-xl bg-[#3f7cac]/10 border border-[#3f7cac]/25 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#3f7cac] flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> {T("Acqua d'impasto", "Schüttwasser", "Dough water", "Agua de amasado")}</p>
                <p className="text-2xl font-display font-bold text-[#2B303B] dark:text-[#e4eff8]">{result.water_temp.water_c}°C</p>
                <p className="text-[10px] text-[#7E8A93]">{T("per impasto a", "für Teig bei", "for dough at", "para masa a")} {result.water_temp.target_dough_c}°C</p>
                {result.water_temp.status !== "ok" && (
                  <p className="text-[10px] font-semibold text-[#C88A2B] mt-0.5">{result.water_temp.status === "hot" ? T("ambiente caldo: usa acqua fredda/ghiaccio", "warm: kaltes Wasser/Eis", "hot room: use cold water/ice", "ambiente cálido: agua fría/hielo") : T("ambiente freddo: acqua tiepida", "kalt: lauwarmes Wasser", "cold room: warm water", "ambiente frío: agua tibia")}</p>
                )}
              </div>
            )}
            {result.food_cost && (
              <div data-testid="gen-food-cost" className="rounded-xl bg-[#3E7C59]/10 border border-[#3E7C59]/25 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#3E7C59] flex items-center gap-1"><Euro className="w-3.5 h-3.5" /> {T("Food cost", "Food-Cost", "Food cost", "Food cost")}</p>
                <p className="text-2xl font-display font-bold text-[#2B303B] dark:text-[#e4eff8]">€ {result.food_cost.cost_per_piece.toFixed(2)}</p>
                <p className="text-[10px] text-[#7E8A93]">{T("a pezzo", "pro Stück", "per piece", "por pieza")} · {result.food_cost.pieces} {T("pz", "St.", "pcs", "pzs")}</p>
                <p className="text-[11px] font-semibold text-[#3E7C59] mt-0.5">{T("Prezzo suggerito", "Empf. Preis", "Suggested price", "Precio sugerido")}: € {result.food_cost.suggested_price_piece.toFixed(2)} <span className="text-[#7E8A93] font-normal">({result.food_cost.food_cost_ratio}%)</span></p>
              </div>
            )}
          </div>

          {result.procedure && (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-[#3f7cac] mb-2">{T("Procedimento su misura","Maßgeschneiderter Ablauf","Tailored process","Procedimiento a medida")}</p>
              <div data-testid="gen-procedure" className="text-sm text-[#3F4A54] dark:text-[#AEB8BF] whitespace-pre-wrap leading-relaxed">{result.procedure}</div>
            </>
          )}

          <button data-testid="gen-print" onClick={() => window.print()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#3f7cac] border border-[#3f7cac]/40 px-4 py-2 rounded-xl active:scale-95">
            <Printer className="w-4 h-4" /> {T("Stampa / Salva PDF","Drucken / PDF","Print / Save PDF","Imprimir / Guardar PDF")}
          </button>
        </div>
      )}
    </div>
  );
}
