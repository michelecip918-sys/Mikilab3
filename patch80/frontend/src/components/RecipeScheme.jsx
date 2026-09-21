import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { rLoc } from "@/lib/loc";
import { recipeCategory } from "@/lib/recipeCats";

const PUB = process.env.PUBLIC_URL || "";

// V77 — Schema disegnato del procedimento, costruito dai dati della ricetta (nessuna IA, nessun costo).
// Mostra le fasi in ordine con tempi e temperature, con il logo MikiLab.
const fmtH = (h) => {
  if (h == null || !(h > 0)) return "";
  if (h >= 1) { const v = Math.round(h * 10) / 10; return `${String(v).replace(".", ",")} h`; }
  return `${Math.round(h * 60)} min`;
};

export function isBakeOrFry(r) {
  return !!(r && (r.bake_temp || r.bake_minutes || recipeCategory(r).key === "fritti"));
}

export function buildPhases(r, tri) {
  const cat = recipeCategory(r).key;
  const name = (r.name || "").toLowerCase();
  const pref = `${r.preferment_type || ""}`.toLowerCase();
  const hasPref = (r.sourdough_grams || 0) > 0 || /madre|lm|poolish|biga|licoli|sourdough/.test(pref);
  const laminated = /sfogliat/i.test(r.method_type || "") || /croissant|danish|plunder|cornett|sfoglia/.test(name);
  const fried = cat === "fritti";
  const phases = [];
  if (hasPref) {
    const label = /poolish/.test(pref) ? "Poolish" : /biga/.test(pref) ? "Biga" : /licoli/.test(pref) ? "Licoli" : tri("Lievito madre", "Sauerteig", "Sourdough");
    phases.push({ icon: "🫙", title: tri("Prefermento", "Vorteig", "Preferment"), sub: label });
  }
  phases.push({ icon: "🥣", title: tri("Impasto", "Teig kneten", "Mixing"), sub: r.mix_minutes ? `${Math.round(r.mix_minutes)} min` : "" });
  if (laminated) phases.push({ icon: "📚", title: tri("Laminazione", "Laminieren", "Lamination"), sub: tri("burro e pieghe", "Butter und Touren", "butter and folds") });
  if ((r.bulk_fermentation_hours || 0) > 0) phases.push({ icon: "⏳", title: tri("Puntata", "Stockgare", "Bulk rise"), sub: fmtH(r.bulk_fermentation_hours) });
  phases.push({ icon: "🤲", title: tri("Formatura", "Formen", "Shaping"), sub: "" });
  if ((r.proofing_hours || 0) > 0) phases.push({ icon: "🫧", title: tri("Lievitazione finale", "Endgare", "Final proof"), sub: fmtH(r.proofing_hours) });
  if (fried) {
    phases.push({ icon: "🍳", title: tri("Frittura", "Frittieren", "Frying"), sub: "170-180 °C" });
  } else if (r.bake_temp || r.bake_minutes) {
    const parts = [];
    if (r.bake_temp) parts.push(`${Math.round(r.bake_temp)} °C`);
    if (r.bake_minutes) parts.push(`${Math.round(r.bake_minutes)} min`);
    phases.push({ icon: "🔥", title: tri("Cottura", "Backen", "Baking"), sub: parts.join(" · ") });
  }
  phases.push({ icon: "🌬️", title: tri("Raffreddamento", "Abkühlen", "Cooling"), sub: cat === "panettoni" && /panettone/.test(name) ? tri("a testa in giù", "kopfüber", "upside down") : "" });
  return phases;
}

export default function RecipeScheme({ recipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  if (!recipe || !isBakeOrFry(recipe)) return null; // basi, creme e preparazioni senza cottura: nessuno schema di panificazione
  const phases = buildPhases(recipe, tri);
  const W = 340, top = 62, row = 62, H = top + phases.length * row + 40;
  const title = rLoc(recipe, "name", lang) || recipe.name || "";
  const txt = { fill: "hsl(var(--foreground))" };
  const mut = { fill: "hsl(var(--muted-foreground))" };
  return (
    <div data-testid="recipe-scheme" className="rounded-2xl border border-border bg-background/60 p-3 no-print">
      <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground mb-1">{tri("Schema del procedimento", "Ablaufschema", "Process diagram")}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${tri("Schema del procedimento", "Ablaufschema", "Process diagram")}: ${title}`}>
        <image href={`${PUB}/logo-emblem.webp`} x="10" y="10" width="34" height="34" />
        <text x="52" y="24" fontSize="13" fontWeight="700" style={txt}>MikiLab</text>
        <text x="52" y="40" fontSize="11" style={mut}>{title.length > 38 ? `${title.slice(0, 37)}…` : title}</text>
        {/* V80 — la firma di Michele: il suo polpo, disegnato a timbro */}
        <image data-testid="scheme-polpo" href={`${PUB}/polpo-firma.svg`} x={W - 50} y="7" width="40" height="40" />
        <line x1="10" y1="52" x2={W - 10} y2="52" strokeWidth="1" style={{ stroke: "hsl(var(--border))" }} />
        {phases.map((p, i) => {
          const cy = top + i * row + 22;
          return (
            <g key={i}>
              {i < phases.length - 1 && <line x1="40" y1={cy + 22} x2="40" y2={cy + row - 22} strokeWidth="2" strokeDasharray="4 3" style={{ stroke: "hsl(var(--primary))" }} />}
              <circle cx="40" cy={cy} r="21" strokeWidth="2" style={{ stroke: "hsl(var(--primary))", fill: "hsl(var(--primary) / 0.14)" }} />
              <text x="40" y={cy + 7} fontSize="20" textAnchor="middle">{p.icon}</text>
              <text x="74" y={cy - 2} fontSize="14" fontWeight="700" style={txt}>{i + 1}. {p.title}</text>
              {p.sub ? <text x="74" y={cy + 15} fontSize="12" style={mut}>{p.sub}</text> : null}
            </g>
          );
        })}
        <text x={W / 2} y={H - 12} fontSize="10" textAnchor="middle" style={mut}>mikilab.de</text>
      </svg>
    </div>
  );
}
