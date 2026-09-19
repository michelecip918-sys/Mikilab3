import { useState, useMemo } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { Printer, Scale, Thermometer, GitCompare } from "lucide-react";

const SCALE_KEY = "mikilab_pro_scale";
function r1(x) { return Math.round(x * 10) / 10; }
function rg(x) { return x >= 100 ? Math.round(x) : Math.round(x * 10) / 10; }

// Righe base del panettiere (nome, % sulla farina, grammi-per-1000g-farina)
function baseRows(recipe, tri) {
  const fg = Number(recipe.flour_grams) || 0;
  const pct = (g) => (fg > 0 && g ? (Number(g) / fg) * 100 : null);
  const rows = [{ name: tri("Farina", "Mehl", "Flour"), pct: 100 }];
  if (recipe.water_grams) rows.push({ name: tri("Acqua", "Wasser", "Water"), pct: pct(recipe.water_grams) });
  else if (recipe.hydration_percent) rows.push({ name: tri("Acqua", "Wasser", "Water"), pct: Number(recipe.hydration_percent) });
  if (recipe.sourdough_grams) rows.push({ name: tri("Lievito madre", "Sauerteig", "Sourdough"), pct: pct(recipe.sourdough_grams) });
  if (recipe.salt_grams) rows.push({ name: tri("Sale", "Salz", "Salt"), pct: pct(recipe.salt_grams) });
  (recipe.extra_ingredients || []).forEach((it) => {
    if (it && it.name && it.percent) rows.push({ name: it.name, pct: Number(it.percent) });
  });
  return rows.filter((x) => x.pct != null);
}

export default function EspertoPro({ recipe, ex, settings }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const presets = (settings && settings.pro_presets) || {}; // { laboratorio_kg, produzione_kg }

  const [state, setState] = useState(() => {
    try { return { ...JSON.parse(localStorage.getItem(SCALE_KEY) || "{}") }; } catch { return {}; }
  });
  const save = (patch) => { const s = { ...state, ...patch }; setState(s); try { localStorage.setItem(SCALE_KEY, JSON.stringify(s)); } catch { /* */ } };

  const scale = state.scale || "personalizzata";
  const mode = state.calcMode || "kg";           // "kg" | "pezzi"
  const rows = useMemo(() => baseRows(recipe, tri), [recipe, lang]); // eslint-disable-line
  const totalPct = rows.reduce((s, r) => s + (r.pct || 0), 0); // somma % (farina=100 + acqua + ...)
  const loss = Number(state.loss) || 0;

  // Farina totale (g) in base allo scenario scelto
  let flourG = 0;
  const presetKg = scale === "laboratorio" ? Number(presets.laboratorio_kg) : scale === "produzione" ? Number(presets.produzione_kg) : 0;
  if (mode === "pezzi") {
    const pieces = Number(state.pieces) || 0;
    let doughPiece = Number(state.doughPiece) || 0;
    if (!doughPiece && Number(state.bakedPiece) && loss < 100) doughPiece = Number(state.bakedPiece) / (1 - loss / 100);
    const totalDough = pieces * doughPiece;
    flourG = totalPct > 0 ? (totalDough * 100) / totalPct : 0;
  } else {
    const kg = Number(state.kg) || presetKg || 0;
    flourG = kg * 1000;
  }
  const doughTotal = flourG * (totalPct / 100);
  // resa in pezzi
  let doughPerPiece = Number(state.doughPiece) || 0;
  if (!doughPerPiece && Number(state.bakedPiece) && loss < 100) doughPerPiece = Number(state.bakedPiece) / (1 - loss / 100);
  const yieldPieces = doughPerPiece > 0 ? Math.floor(doughTotal / doughPerPiece) : (mode === "pezzi" ? Number(state.pieces) || 0 : 0);

  const grams = (pct) => (flourG * pct) / 100;

  // --- Tabella per impasto (prefermento vs impasto finale) ---
  const biga = recipe.biga && (recipe.biga.flour_g || recipe.biga.water_g) ? recipe.biga : null;
  const perDough = useMemo(() => {
    if (!biga) return null;
    const fg = Number(recipe.flour_grams) || 0;
    if (fg <= 0) return null;
    const factor = flourG / fg; // scala rispetto alla ricetta base
    const pfFlour = (Number(biga.flour_g) || 0) * factor;
    const pfWater = (Number(biga.water_g) || 0) * factor;
    const pfYeast = (Number(biga.yeast_g) || 0) * factor;
    return rows.map((row) => {
      const tot = grams(row.pct);
      let first = 0;
      if (row.name === tri("Farina", "Mehl", "Flour")) first = pfFlour;
      else if (row.name === tri("Acqua", "Wasser", "Water")) first = pfWater;
      const second = Math.max(0, tot - first);
      return { name: row.name, pct: row.pct, first, second, tot, extraYeast: row.name === tri("Farina", "Mehl", "Flour") ? pfYeast : 0 };
    });
  }, [biga, flourG, rows, lang]); // eslint-disable-line

  // --- Temperatura acqua (DDT) ---
  const [ddt, setDdt] = useState(state.ddt || "");
  const [room, setRoom] = useState(state.room || "");
  const [friction, setFriction] = useState(state.friction ?? 5);
  const waterTemp = (ddt !== "" && room !== "") ? r1(3 * Number(ddt) - Number(room) - Number(friction)) : null;

  // --- Confronta con la tua ricetta ---
  const [cmp, setCmp] = useState({ flour: "", water: "", salt: "", leaven: "", other: "" });
  const cmpRows = useMemo(() => {
    const uf = Number(cmp.flour) || 0;
    if (uf <= 0) return [];
    const upct = (v) => (v ? (Number(v) / uf) * 100 : null);
    const find = (names) => rows.find((r) => names.includes(r.name));
    const wRow = find([tri("Acqua", "Wasser", "Water")]);
    const sRow = find([tri("Sale", "Salz", "Salt")]);
    const lRow = find([tri("Lievito madre", "Sauerteig", "Sourdough")]);
    const out = [];
    const add = (label, mine, ref) => { if (mine != null && ref != null) out.push({ label, mine: r1(mine), ref: r1(ref), diff: r1(mine - ref) }); };
    add(tri("Acqua", "Wasser", "Water"), upct(cmp.water), wRow ? wRow.pct : null);
    add(tri("Sale", "Salz", "Salt"), upct(cmp.salt), sRow ? sRow.pct : null);
    add(tri("Lievito/Prefermento", "Hefe/Vorteig", "Leaven/Preferment"), upct(cmp.leaven), lRow ? lRow.pct : null);
    return out;
  }, [cmp, rows, lang]); // eslint-disable-line

  const verified = !!(ex && ex.verified);

  const printSheet = () => window.print();

  const RowNum = ({ label, value, onChange, step = "1", suffix }) => (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {label}
      <input type="number" step={step} value={value} onChange={onChange}
        className="w-20 px-2 py-1 rounded-lg bg-background border border-border text-foreground font-bold outline-none focus:border-primary" />
      {suffix && <span>{suffix}</span>}
    </label>
  );

  return (
    <div data-testid="esperto-pro" className="space-y-4">
      {/* SCALA PROFESSIONALE */}
      <div className="rounded-2xl border border-border bg-background p-3.5">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-2"><Scale className="w-3.5 h-3.5" /> {tri("Scala", "Skalierung", "Scale")}</p>
        <div data-testid="pro-scale-toggle" className="inline-flex rounded-xl border border-border overflow-hidden mb-3">
          {[["laboratorio", tri("Laboratorio", "Labor", "Lab")], ["produzione", tri("Produzione", "Produktion", "Production")], ["personalizzata", tri("Personalizzata", "Individuell", "Custom")]].map(([k, lbl]) => (
            <button key={k} data-testid={`pro-scale-${k}`} onClick={() => save({ scale: k })}
              className={`px-3 py-1.5 text-xs font-bold transition-all ${scale === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{lbl}</button>
          ))}
        </div>
        {(scale !== "personalizzata" && !presetKg) && (
          <p data-testid="pro-preset-empty" className="text-[11px] text-muted-foreground mb-2">{tri("Nessun preset impostato da Michele: usa i kg liberi qui sotto.", "Kein Preset von Michele: nutze die freien kg unten.", "No preset set by Michele: use free kg below.")}</p>
        )}
        <div className="inline-flex rounded-lg border border-border overflow-hidden mb-3 ml-0">
          {[["kg", tri("Farina totale", "Gesamtmehl", "Total flour")], ["pezzi", tri("N° pezzi × peso", "Stück × Gewicht", "Pieces × weight")]].map(([k, lbl]) => (
            <button key={k} data-testid={`pro-mode-${k}`} onClick={() => save({ calcMode: k })}
              className={`px-3 py-1 text-[11px] font-bold transition-all ${mode === k ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{lbl}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {mode === "kg" ? (
            <RowNum label={tri("Farina totale (kg)", "Gesamtmehl (kg)", "Total flour (kg)")} step="0.5"
              value={state.kg ?? (presetKg || "")} onChange={(e) => save({ kg: e.target.value })} suffix="kg" />
          ) : (
            <>
              <RowNum label={tri("N° pezzi", "Stückzahl", "Pieces")} value={state.pieces || ""} onChange={(e) => save({ pieces: e.target.value })} />
              <RowNum label={tri("Impasto/pezzo (g)", "Teig/Stück (g)", "Dough/piece (g)")} value={state.doughPiece || ""} onChange={(e) => save({ doughPiece: e.target.value })} suffix="g" />
            </>
          )}
          <RowNum label={tri("Perdita cottura", "Backverlust", "Bake loss")} value={state.loss || 0} onChange={(e) => save({ loss: e.target.value })} suffix="%" />
          <RowNum label={tri("Peso cotto/pezzo (g)", "Backgewicht/Stück (g)", "Baked weight/piece (g)")} value={state.bakedPiece || ""} onChange={(e) => save({ bakedPiece: e.target.value })} suffix="g" />
        </div>
        <div data-testid="pro-yield" className="mt-3 flex flex-wrap gap-4 text-sm">
          <span className="font-bold text-foreground">{tri("Farina totale", "Gesamtmehl", "Total flour")}: {rg(flourG)} g</span>
          <span className="font-bold text-foreground">{tri("Impasto totale", "Gesamtteig", "Total dough")}: {rg(doughTotal)} g</span>
          {yieldPieces > 0 && <span className="font-bold text-primary">{tri("Resa", "Ausbeute", "Yield")}: {yieldPieces} {tri("pezzi", "Stück", "pieces")}</span>}
        </div>
      </div>

      {/* TABELLA INGREDIENTI (per impasto se c'è prefermento) */}
      <div className="rounded-2xl border border-border bg-background p-3.5 overflow-x-auto">
        <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-2">{tri("Ingredienti", "Zutaten", "Ingredients")} · {tri("percentuali del panettiere", "Bäckerprozente", "baker's percentages")}</p>
        {perDough ? (
          <table data-testid="pro-perdough-table" className="w-full text-sm min-w-[420px]">
            <thead><tr className="text-[10px] uppercase text-muted-foreground">
              <th className="text-left font-bold py-1">{tri("Ingrediente", "Zutat", "Ingredient")}</th>
              <th className="text-right font-bold py-1">{tri("1° impasto", "1. Teig", "1st dough")}</th>
              <th className="text-right font-bold py-1">{tri("2° impasto", "2. Teig", "2nd dough")}</th>
              <th className="text-right font-bold py-1">{tri("Totale", "Gesamt", "Total")}</th>
              <th className="text-right font-bold py-1">%</th>
            </tr></thead>
            <tbody>
              {perDough.map((r, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 text-foreground">{r.name}</td>
                  <td className="py-1.5 text-right text-muted-foreground">{r.first ? `${rg(r.first)} g` : "—"}</td>
                  <td className="py-1.5 text-right text-muted-foreground">{r.second ? `${rg(r.second)} g` : "—"}</td>
                  <td className="py-1.5 text-right font-bold text-foreground">{rg(r.tot)} g</td>
                  <td className="py-1.5 text-right text-muted-foreground">{r1(r.pct)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table data-testid="pro-total-table" className="w-full text-sm">
            <thead><tr className="text-[10px] uppercase text-muted-foreground"><th className="text-left font-bold py-1">{tri("Ingrediente", "Zutat", "Ingredient")}</th><th className="text-right font-bold py-1">{tri("Totale", "Gesamt", "Total")}</th><th className="text-right font-bold py-1">%</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 text-foreground">{r.name}</td>
                  <td className="py-1.5 text-right font-bold text-foreground">{rg(grams(r.pct))} g</td>
                  <td className="py-1.5 text-right text-muted-foreground">{r1(r.pct)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* TEMPERATURA ACQUA (DDT) */}
      <div className="rounded-2xl border border-border bg-background p-3.5">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-2"><Thermometer className="w-3.5 h-3.5" /> {tri("Temperatura dell'acqua", "Wassertemperatur", "Water temperature")}</p>
        <div className="flex flex-wrap gap-3 items-center">
          <RowNum label={tri("Temp. impasto voluta", "Zieltemp. Teig", "Target dough temp")} value={ddt} onChange={(e) => { setDdt(e.target.value); save({ ddt: e.target.value }); }} suffix="°C" />
          <RowNum label={tri("Temp. ambiente", "Raumtemp.", "Room temp")} value={room} onChange={(e) => { setRoom(e.target.value); save({ room: e.target.value }); }} suffix="°C" />
          <RowNum label={tri("Attrito (spirale ~5, mano ~2)", "Reibung (Spirale ~5, Hand ~2)", "Friction (spiral ~5, hand ~2)")} value={friction} onChange={(e) => { setFriction(e.target.value); save({ friction: e.target.value }); }} />
        </div>
        <p data-testid="pro-water-temp" className="mt-2 text-sm font-bold text-primary">{waterTemp != null ? `${tri("Acqua", "Wasser", "Water")}: ${waterTemp} °C` : tri("Inserisci le temperature per il calcolo.", "Temperaturen eingeben zum Berechnen.", "Enter temperatures to calculate.")}</p>
      </div>

      {/* CONFRONTA CON LA TUA RICETTA */}
      <div className="rounded-2xl border border-border bg-background p-3.5">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-2"><GitCompare className="w-3.5 h-3.5" /> {tri("Confronta con la tua ricetta", "Mit deinem Rezept vergleichen", "Compare with your recipe")}</p>
        <div className="flex flex-wrap gap-3 mb-2">
          {[["flour", tri("Farina", "Mehl", "Flour")], ["water", tri("Acqua", "Wasser", "Water")], ["salt", tri("Sale", "Salz", "Salt")], ["leaven", tri("Lievito/Pref.", "Hefe/Vorteig", "Leaven/Pref.")]].map(([k, lbl]) => (
            <RowNum key={k} label={lbl} value={cmp[k]} onChange={(e) => setCmp({ ...cmp, [k]: e.target.value })} suffix="g" />
          ))}
        </div>
        {cmpRows.length > 0 && (
          <table data-testid="pro-compare-table" className="w-full text-sm">
            <thead><tr className="text-[10px] uppercase text-muted-foreground"><th className="text-left font-bold py-1">{tri("Ingrediente", "Zutat", "Ingredient")}</th><th className="text-right font-bold py-1">{tri("Tua %", "Deine %", "Yours %")}</th><th className="text-right font-bold py-1">MikiLab %</th><th className="text-right font-bold py-1">Δ</th></tr></thead>
            <tbody>
              {cmpRows.map((r, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 text-foreground">{r.label}</td>
                  <td className="py-1.5 text-right text-muted-foreground">{r.mine}%</td>
                  <td className="py-1.5 text-right text-muted-foreground">{r.ref}%</td>
                  <td className={`py-1.5 text-right font-bold ${r.diff > 0 ? "text-mattone" : r.diff < 0 ? "text-primary" : "text-foreground"}`}>{r.diff > 0 ? "+" : ""}{r.diff} pt</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-[11px] text-muted-foreground mt-2">{tri("Solo sul tuo dispositivo. Niente inviato al server.", "Nur auf deinem Gerät. Nichts an den Server gesendet.", "On your device only. Nothing sent to the server.")}</p>
      </div>

      {/* SCHEDA DI PRODUZIONE (stampa) */}
      <button data-testid="pro-print" onClick={printSheet}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-border text-foreground font-bold text-sm active:scale-[0.98] hover:border-primary transition-all">
        <Printer className="w-4 h-4" /> {tri("Scheda di produzione (stampa)", "Produktionsblatt (drucken)", "Production sheet (print)")}
      </button>

      {/* AREA DI STAMPA — visibile solo in stampa */}
      <div data-testid="pro-print-sheet" className="print-only hidden">
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>{recipe.name}</h1>
        <p style={{ fontSize: 12 }}>{tri("Scala", "Skalierung", "Scale")}: {scale} · {tri("Farina totale", "Gesamtmehl", "Total flour")} {rg(flourG)} g · {yieldPieces > 0 ? `${yieldPieces} ${tri("pezzi", "Stück", "pieces")}` : ""}</p>
        <p style={{ fontSize: 11, fontWeight: 700, color: verified ? "#6E8F7A" : "#A4472D" }}>{verified ? tri("Verificata da Michele", "Von Michele geprüft", "Verified by Michele") : tri("Bozza di Sitor", "Sitor-Entwurf", "Sitor draft")}</p>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", marginTop: 8 }}>
          <thead><tr><th style={{ textAlign: "left" }}>{tri("Ingrediente", "Zutat", "Ingredient")}</th><th style={{ textAlign: "right" }}>g</th><th style={{ textAlign: "right" }}>%</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (<tr key={i}><td>{r.name}</td><td style={{ textAlign: "right" }}>{rg(grams(r.pct))}</td><td style={{ textAlign: "right" }}>{r1(r.pct)}%</td></tr>))}
          </tbody>
        </table>
        {ex && ex.allergens && ex.allergens.length > 0 && <p style={{ fontSize: 11, marginTop: 6 }}>{tri("Allergeni", "Allergene", "Allergens")}: {ex.allergens.join(", ")}</p>}
        <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2, marginTop: 10 }}>ML</p>
        <p style={{ fontSize: 10, color: "#5B5F66", marginTop: 8 }}>{tri("Gratis per uso personale. Vietato riprodurre o vendere ricette e testi.", "Kostenlos für den privaten Gebrauch. Rezepte und Texte dürfen nicht reproduziert oder verkauft werden.", "Free for personal use. Reproducing or selling recipes and texts is prohibited.")}</p>
      </div>
    </div>
  );
}
