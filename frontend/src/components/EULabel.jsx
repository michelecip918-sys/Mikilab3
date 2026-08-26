import { Tag, Printer } from "lucide-react";
import QRCode from "qrcode";
import { rLoc } from "@/lib/loc";

const L = (lang, i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);

export function hasLabelData(label) {
  if (!label) return false;
  const nums = ["energy_kcal", "fat", "saturates", "carbs", "sugars", "protein", "salt"];
  return nums.some((k) => label[k] != null && label[k] !== "") || (label.ingredients || "").trim() || (label.allergens || "").trim();
}

const num = (v, unit = "g") => (v == null || v === "" ? "—" : `${(Math.round(Number(v) * 10) / 10).toString().replace(".", ",")} ${unit}`);

function rows(label, lang) {
  const kj = label.energy_kj != null ? label.energy_kj : (label.energy_kcal != null && label.energy_kcal !== "" ? Math.round(Number(label.energy_kcal) * 4.184) : null);
  return [
    [L(lang, "Energia", "Energie", "Energy"), `${kj == null ? "—" : kj + " kJ"} / ${label.energy_kcal == null || label.energy_kcal === "" ? "—" : Math.round(Number(label.energy_kcal)) + " kcal"}`, true],
    [L(lang, "Grassi", "Fett", "Fat"), num(label.fat), true],
    [L(lang, "di cui acidi grassi saturi", "davon gesättigte Fettsäuren", "of which saturates"), num(label.saturates), false],
    [L(lang, "Carboidrati", "Kohlenhydrate", "Carbohydrate"), num(label.carbs), true],
    [L(lang, "di cui zuccheri", "davon Zucker", "of which sugars"), num(label.sugars), false],
    ...(label.fibre != null && label.fibre !== "" ? [[L(lang, "Fibre", "Ballaststoffe", "Fibre"), num(label.fibre), true]] : []),
    [L(lang, "Proteine", "Eiweiß", "Protein"), num(label.protein), true],
    [L(lang, "Sale", "Salz", "Salt"), num(label.salt), true],
  ];
}

// Tabella nutrizionale inline (dichiarazione UE per 100 g).
export default function EULabel({ recipe, lang }) {
  const label = recipe.label || {};
  if (!hasLabelData(label)) return null;
  const allergens = (label.allergens || "").split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div data-testid="eu-label" className="mt-4 rounded-2xl border border-[#d5e4f0] dark:border-[#38424B] bg-white dark:bg-[#232A31] p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#3f7cac]">
          <Tag className="w-3.5 h-3.5" /> {L(lang, "Etichetta UE", "EU-Etikett", "EU label")}
        </p>
        <button data-testid="eu-label-print-btn" onClick={() => printEULabel(recipe, lang)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#234b6e] dark:text-[#8FB0C2] bg-[#e4eff8] dark:bg-[#2A323A] border border-[#d5e4f0] dark:border-[#38424B] px-3 py-1.5 rounded-lg active:scale-95">
          <Printer className="w-3.5 h-3.5" /> {L(lang, "Stampa", "Drucken", "Print")}
        </button>
      </div>
      <p className="text-xs font-bold text-[#2B303B] dark:text-[#e4eff8] mb-1">{L(lang, "Dichiarazione nutrizionale (per 100 g)", "Nährwertdeklaration (pro 100 g)", "Nutrition declaration (per 100 g)")}</p>
      <table className="w-full text-xs">
        <tbody>
          {rows(label, lang).map(([k, v, bold], i) => (
            <tr key={i} className="border-b border-dashed border-[#e4eff8] dark:border-[#2A323A] last:border-0">
              <td className={`py-1 ${bold ? "font-semibold text-[#2B303B] dark:text-[#e4eff8]" : "pl-3 text-[#7E8A93]"}`}>{k}</td>
              <td className="py-1 text-right font-mono-data text-[#234b6e] dark:text-[#8FB0C2]">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(label.ingredients || "").trim() && (
        <p className="mt-2 text-[11px] text-[#3F4A54] dark:text-[#AEB8BF] leading-snug">
          <span className="font-semibold">{L(lang, "Ingredienti", "Zutaten", "Ingredients")}: </span>{label.ingredients}
        </p>
      )}
      {allergens.length > 0 && (
        <p className="mt-1 text-[11px] text-[#3F4A54] dark:text-[#AEB8BF]">
          <span className="font-semibold">{L(lang, "Allergeni", "Allergene", "Allergens")}: </span>
          {allergens.map((a, i) => (<span key={i} className="font-bold">{a}{i < allergens.length - 1 ? ", " : ""}</span>))}
        </p>
      )}
      {label.net_weight_g != null && label.net_weight_g !== "" && (
        <p className="mt-1 text-[11px] text-[#7E8A93]">{L(lang, "Peso netto", "Nettogewicht", "Net weight")}: {label.net_weight_g} g</p>
      )}
    </div>
  );
}

// Etichetta stampabile (finestra separata) conforme al layout UE, con QR alla scheda prodotto.
export async function printEULabel(recipe, lang) {
  const label = recipe.label || {};
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const name = rLoc(recipe, "name", lang) || recipe.name;
  const allergens = (label.allergens || "").split(",").map((s) => s.trim()).filter(Boolean);
  const tableRows = rows(label, lang).map(([k, v, bold]) =>
    `<tr><td class="${bold ? "b" : "sub"}">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`).join("");
  // Apri subito la finestra (gesture utente) con placeholder, poi genera il QR e scrivi.
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><meta charset="utf-8"><body style="font-family:Arial,sans-serif;padding:20px;color:#555">${L(lang, "Preparazione etichetta…", "Etikett wird vorbereitet…", "Preparing label…")}</body>`);
  let qrImg = "";
  try {
    const origin = window.location.origin + (process.env.PUBLIC_URL || "");
    const url = `${origin}/?prodotto=${encodeURIComponent(recipe.id)}`;
    const data = await QRCode.toDataURL(url, { margin: 1, width: 220 });
    qrImg = `<div class="qr"><img src="${data}" alt="QR" /><span>${L(lang, "Scheda prodotto", "Produktinfo", "Product info")}</span></div>`;
  } catch { /* QR opzionale */ }
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(name)} — ${L(lang, "Etichetta", "Etikett", "Label")}</title>
    <style>
      *{box-sizing:border-box}
      body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:8mm}
      .label{width:80mm;border:1px solid #111;border-radius:4px;padding:4mm}
      .brand{font-size:9px;font-weight:800;color:#3f7cac;letter-spacing:.05em}
      h1{font-size:15px;margin:2px 0 6px}
      h2{font-size:11px;margin:8px 0 2px;border-top:1px solid #111;padding-top:4px}
      table{width:100%;border-collapse:collapse;font-size:11px}
      td{padding:2px 0;border-bottom:1px dotted #bbb}
      td.b{font-weight:700} td.sub{padding-left:10px;color:#444}
      td.v{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
      .ing{font-size:10px;line-height:1.35;margin:6px 0 0}
      .alg b{font-weight:800}
      .net{font-size:11px;font-weight:700;margin-top:4px}
      .qr{display:flex;flex-direction:column;align-items:center;margin-top:8px;border-top:1px solid #111;padding-top:6px}
      .qr img{width:22mm;height:22mm}
      .qr span{font-size:8px;color:#444;margin-top:2px;text-transform:uppercase;letter-spacing:.04em}
      @media print{@page{margin:6mm}}
    </style></head><body>
    <div class="label">
      <div class="brand">🌾 MikiLab</div>
      <h1>${esc(name)}</h1>
      <h2>${L(lang, "Dichiarazione nutrizionale · per 100 g", "Nährwertdeklaration · pro 100 g", "Nutrition declaration · per 100 g")}</h2>
      <table><tbody>${tableRows}</tbody></table>
      ${(label.ingredients || "").trim() ? `<p class="ing"><b>${L(lang, "Ingredienti", "Zutaten", "Ingredients")}:</b> ${esc(label.ingredients)}</p>` : ""}
      ${allergens.length ? `<p class="ing alg"><b>${L(lang, "Allergeni", "Allergene", "Allergens")}:</b> ${allergens.map((a) => `<b>${esc(a)}</b>`).join(", ")}</p>` : ""}
      ${label.net_weight_g != null && label.net_weight_g !== "" ? `<p class="net">${L(lang, "Peso netto", "Nettogewicht", "Net weight")}: ${esc(label.net_weight_g)} g</p>` : ""}
      ${qrImg}
    </div>
  </body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}
