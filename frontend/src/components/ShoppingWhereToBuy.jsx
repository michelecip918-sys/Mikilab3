import { useMemo, useState } from "react";
import { ShoppingCart, Copy, Send, MapPin, Wheat, Droplets, FlaskConical, Sparkles, Wrench } from "lucide-react";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";
import { computeShopping, fmtQty, otherLabel, buildShoppingText, hasShoppingData } from "@/lib/shopping";
import { whereToBuy, toolsList } from "@/lib/whereToBuy";

const GRAM_FIELDS = ["flour_grams", "water_grams", "sourdough_grams", "salt_grams"];

export default function ShoppingWhereToBuy({ recipe, lang }) {
  const L = (i, d, e, s, f, fa) => mkTri(lang)(i, d, e, s, f, fa);
  const baseTotal = useMemo(
    () => GRAM_FIELDS.reduce((s, f) => s + Number(recipe?.[f] || 0), 0) || 1000,
    [recipe]
  );
  const [target, setTarget] = useState(Math.round(baseTotal));

  const totals = useMemo(
    () => computeShopping([{ recipe_id: recipe.id, grams: target }], { [recipe.id]: recipe }, lang),
    [recipe, target, lang]
  );

  const sections = useMemo(() => {
    const out = [];
    const flours = Object.entries(totals.flourByType).sort((a, b) => b[1] - a[1]);
    if (flours.length) out.push({ key: "farine", Icon: Wheat, title: L("Farine", "Mehl", "Flours", "Harinas", "Farines", "آردها"), items: flours.map(([k, v]) => `${k} · ${fmtQty(v)}`), buy: whereToBuy("farine", lang) });
    if (totals.others.water_grams) out.push({ key: "liquidi", Icon: Droplets, title: L("Liquidi & Grassi", "Flüssiges & Fette", "Liquids & Fats", "Líquidos y grasas", "Liquides & matières grasses", "مایعات و چربی‌ها"), items: [`${otherLabel("water_grams", lang)} · ${fmtQty(totals.others.water_grams)}`], buy: whereToBuy("liquidi", lang) });
    if (totals.others.sourdough_grams) out.push({ key: "lievito", Icon: FlaskConical, title: L("Lievito & Prefermenti", "Hefe & Vorteige", "Yeast & Preferments", "Levadura y prefermentos", "Levure & préférements", "مخمر و پیش‌خمیرها"), items: [`${otherLabel("sourdough_grams", lang)} · ${fmtQty(totals.others.sourdough_grams)}`], buy: whereToBuy("lievito", lang) });
    const extras = Object.entries(totals.extras).sort((a, b) => b[1] - a[1]);
    const saleItems = [];
    if (totals.others.salt_grams) saleItems.push(`${otherLabel("salt_grams", lang)} · ${fmtQty(totals.others.salt_grams)}`);
    extras.forEach(([k, v]) => saleItems.push(`${k} · ${fmtQty(v)}`));
    if (saleItems.length) out.push({ key: "sale", Icon: Sparkles, title: L("Sale, semi & extra", "Salz, Saaten & Extras", "Salt, seeds & extras", "Sal, semillas y extras", "Sel, graines & extras", "نمک، دانه‌ها و افزودنی‌ها"), items: saleItems, buy: whereToBuy("sale", lang) });
    return out;
  }, [totals, lang]); // eslint-disable-line

  const fullText = useMemo(() => {
    let t = buildShoppingText(totals, lang) + "\n\n";
    t += L("DOVE COMPRARE:", "WO KAUFEN:", "WHERE TO BUY:", "DÓNDE COMPRAR:", "OÙ ACHETER:", "از کجا بخریم:") + "\n";
    sections.forEach((s) => { t += `• ${s.title}: ${s.buy}\n`; });
    t += `• ${L("Attrezzi", "Werkzeuge", "Tools", "Utensilios", "Outils", "ابزارها")}: ${whereToBuy("attrezzi", lang)}\n`;
    return t.trim();
  }, [totals, sections, lang]); // eslint-disable-line

  const copy = async () => {
    try { await navigator.clipboard.writeText(fullText); toast.success(L("Lista copiata!", "Liste kopiert!", "List copied!", "¡Lista copiada!", "Liste copiée !", "لیست کپی شد!")); }
    catch { toast.error(L("Copia non riuscita", "Kopieren fehlgeschlagen", "Copy failed", "Error al copiar", "Échec de la copie", "کپی ناموفق")); }
  };

  const presets = [500, 1000, 2000];
  const empty = !hasShoppingData(totals);

  return (
    <div data-testid="shopping-where-to-buy" className="rounded-2xl bg-[#18202E] border border-[#26324A] p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-2xl shadow-md border border-amber-900/40 bg-[#F26419]/15 border border-[#F26419]/30 flex items-center justify-center shrink-0"><ShoppingCart className="w-5 h-5 text-[#F26419]" /></div>
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold text-white leading-tight">{L("Cosa e Dove Comprare", "Was & Wo kaufen", "What & Where to Buy", "Qué y dónde comprar", "Quoi et où acheter", "چه و از کجا")}</h3>
          <p className="text-[11px] text-[#AEB8BF] leading-snug">{L("Lista calcolata sul peso scelto + consigli su dove trovarli", "Liste nach gewähltem Gewicht + Einkaufstipps", "List by chosen weight + where-to-buy tips", "Lista por peso elegido + dónde encontrarlos", "Liste selon le poids + où les trouver", "لیست بر پایه وزن + راهنمای خرید")}</p>
        </div>
      </div>

      {/* Peso impasto target */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-[#AEB8BF]">{L("Peso impasto", "Teiggewicht", "Dough weight", "Peso de masa", "Poids de pâte", "وزن خمیر")}</label>
        <div className="flex items-center gap-2 mt-1.5">
          <input data-testid="shopping-target-input" type="number" min={100} step={100} value={target}
            onChange={(e) => setTarget(Math.max(100, Number(e.target.value) || 100))}
            className="w-28 bg-[#0B0E14] border border-[#26324A] rounded-2xl shadow-md border border-amber-900/40 px-3 py-2 text-sm text-white outline-none focus:border-[#F26419]" />
          <span className="text-sm text-[#AEB8BF]">g</span>
          <div className="flex gap-1.5 ml-1">
            {presets.map((p) => (
              <button key={p} data-testid={`shopping-preset-${p}`} onClick={() => setTarget(p)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${target === p ? "bg-[#F26419] text-[#0B0E14]" : "bg-[#0B0E14] text-[#AEB8BF] border border-[#26324A]"}`}>
                {p >= 1000 ? `${p / 1000}kg` : `${p}g`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {empty ? (
        <p className="text-sm text-[#AEB8BF] py-2">{L("Questa ricetta non ha dosi calcolabili.", "Kein berechenbares Rezept.", "This recipe has no computable doses.", "Sin dosis calculables.", "Pas de doses calculables.", "دُز قابل‌محاسبه ندارد.")}</p>
      ) : (
        <div className="space-y-3" data-testid="shopping-sections">
          {sections.map((s) => (
            <div key={s.key} data-testid={`shopping-cat-${s.key}`} className="rounded-2xl shadow-md border border-amber-900/40 bg-[#0B0E14] border border-[#26324A] p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <s.Icon className="w-4 h-4 text-[#F26419]" />
                <h4 className="font-display text-sm font-bold text-white">{s.title}</h4>
              </div>
              <ul className="space-y-1 mb-2.5">
                {s.items.map((it, i) => (
                  <li key={i} className="text-[13px] text-[#E2E8F0] flex items-start gap-1.5">
                    <span className="text-[#F26419] mt-0.5">•</span><span>{it}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-start gap-1.5 rounded-lg bg-[#F26419]/10 border border-[#F26419]/25 px-2.5 py-2">
                <MapPin className="w-3.5 h-3.5 text-[#F26419] mt-0.5 shrink-0" />
                <p className="text-[11.5px] text-[#E2E8F0] leading-snug"><b className="text-[#F26419]">{L("Dove:", "Wo:", "Where:", "Dónde:", "Où:", "کجا:")}</b> {s.buy}</p>
              </div>
            </div>
          ))}

          {/* Attrezzi & Teglie */}
          <div data-testid="shopping-cat-attrezzi" className="rounded-2xl shadow-md border border-amber-900/40 bg-[#0B0E14] border border-[#26324A] p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-[#F26419]" />
              <h4 className="font-display text-sm font-bold text-white">{L("Attrezzi & Teglie", "Werkzeuge & Bleche", "Tools & Pans", "Utensilios y bandejas", "Outils & plaques", "ابزار و قالب")}</h4>
            </div>
            <ul className="space-y-1 mb-2.5">
              {toolsList(lang).map((it, i) => (
                <li key={i} className="text-[13px] text-[#E2E8F0] flex items-start gap-1.5"><span className="text-[#F26419] mt-0.5">•</span><span>{it}</span></li>
              ))}
            </ul>
            <div className="flex items-start gap-1.5 rounded-lg bg-[#F26419]/10 border border-[#F26419]/25 px-2.5 py-2">
              <MapPin className="w-3.5 h-3.5 text-[#F26419] mt-0.5 shrink-0" />
              <p className="text-[11.5px] text-[#E2E8F0] leading-snug"><b className="text-[#F26419]">{L("Dove:", "Wo:", "Where:", "Dónde:", "Où:", "کجا:")}</b> {whereToBuy("attrezzi", lang)}</p>
            </div>
          </div>
        </div>
      )}

      {!empty && (
        <div className="grid grid-cols-2 gap-2">
          <button data-testid="shopping-copy-btn" onClick={copy}
            className="flex items-center justify-center gap-2 rounded-2xl shadow-md border border-amber-900/40 bg-[#18202E] border border-[#F26419]/40 text-white font-semibold px-3 py-2.5 text-sm active:scale-95 transition-all">
            <Copy className="w-4 h-4 text-[#F26419]" /> {L("Copia lista", "Kopieren", "Copy list", "Copiar", "Copier", "کپی")}
          </button>
          <a data-testid="shopping-whatsapp-btn" href={`https://wa.me/?text=${encodeURIComponent(fullText)}`} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl shadow-md border border-amber-900/40 bg-[#2e8b6f] text-white font-semibold px-3 py-2.5 text-sm active:scale-95 transition-all">
            <Send className="w-4 h-4" /> WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
