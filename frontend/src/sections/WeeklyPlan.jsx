import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { CalendarDays, Plus, Trash2, Save, Wheat, AlertTriangle, Printer, Share2, FileText, Store, Tag, ShoppingBasket } from "lucide-react";
import { recipesApi, weeklyApi } from "@/lib/api";
import { useLang } from "@/i18n/LanguageContext";
import { fmtQty, computeShopping, otherLabel } from "@/lib/shopping";
import { rLoc, ingLoc } from "@/lib/loc";
import { getSalesPoints } from "@/lib/salesPoints";
import { fireHighFive } from "@/components/HighFive";
import { jsPDF } from "jspdf";

const DAYS = [
  { id: "lun" }, { id: "mar" }, { id: "mer" }, { id: "gio" },
  { id: "ven" }, { id: "sab" }, { id: "dom" },
];

// Peso predefinito a pezzo in base al nome della ricetta (modificabile)
function defaultGrams(name = "") {
  const n = name.toLowerCase();
  if (n.includes("baguette")) return 250;
  if (n.includes("panin") || n.includes("rosett") || n.includes("all'olio")) return 80;
  if (n.includes("ciabatt")) return 400;
  if (n.includes("focacc")) return 500;
  if (n.includes("pane") || n.includes("pagnott") || n.includes("filon") || n.includes("brot")) return 800;
  return 100;
}

const GRAM_FIELDS = [
  { key: "flour_grams", labelKey: "ing_flour" },
  { key: "water_grams", labelKey: "ing_water" },
  { key: "sourdough_grams", labelKey: "ing_sourdough" },
  { key: "salt_grams", labelKey: "ing_salt" },
];

// Giorni di conservazione consigliati per tipo di prodotto (come Shelf-Life):
// fermentazioni lunghe = pane fresco più a lungo.
function recipeShelfDays(r) {
  if (!r) return 3;
  const n = `${r.name || ""} ${r.menu_category || ""} ${r.dough_category || ""}`.toLowerCase();
  let base = 3;
  if (n.includes("panettone") || (r.menu_category || "") === "panettoni") base = 30;
  else if (n.includes("brezel") || n.includes("brezn") || n.includes("bretzel")) base = 2;
  else if (n.includes("cornetto") || n.includes("brioche") || n.includes("dolc") || n.includes("croissant") || n.includes("focacc")) base = 4;
  else if (n.includes("baguette") || n.includes("panin") || n.includes("brötchen") || n.includes("brotchen") || n.includes("ciabatt")) base = 2;
  const h = Number(r.bulk_fermentation_hours || 0) + Number(r.proofing_hours || 0);
  return Math.max(1, Math.round(base * (1 + Math.min(h, 48) / 48 * 0.6)));
}

export default function WeeklyPlan() {
  const [recipes, setRecipes] = useState([]);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [salesPoints, setSalesPoints] = useState([]);
  const { t, lang } = useLang();
  const tri = (i, d, e) => (lang === "de" ? d : lang === "en" ? e : i);

  useEffect(() => {
    setSalesPoints(getSalesPoints());
    const onChange = () => setSalesPoints(getSalesPoints());
    window.addEventListener("mikilab-salespoints-changed", onChange);
    return () => window.removeEventListener("mikilab-salespoints-changed", onChange);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [miki, personal, saved] = await Promise.all([
          recipesApi.list("mikilab"),
          recipesApi.list("personal"),
          weeklyApi.get(),
        ]);
        setRecipes([...miki, ...personal]);
        if (saved && saved.items) setItems(saved.items);
      } catch {
        toast.error(t("toast_load_error"));
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recipeById = useMemo(() => {
    const m = {};
    recipes.forEach((r) => { m[r.id] = r; });
    return m;
  }, [recipes]);

  const addItem = (day) => {
    if (recipes.length === 0) return;
    const r = recipes[0];
    setItems((it) => [
      ...it,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, day, recipe_id: r.id, recipe_name: r.name, pieces: 10, grams_per_piece: defaultGrams(r.name) },
    ]);
  };

  const updateItem = (id, patch) => setItems((it) => it.map((x) => x.id === id ? { ...x, ...patch } : x));
  const removeItem = (id) => setItems((it) => it.filter((x) => x.id !== id));

  const onRecipeChange = (id, recipeId) => {
    const r = recipeById[recipeId];
    updateItem(id, { recipe_id: recipeId, recipe_name: r?.name || "", grams_per_piece: defaultGrams(r?.name) });
  };

  const save = async () => {
    try {
      await weeklyApi.save({
        items: items.map(({ id, day, recipe_id, recipe_name, pieces, grams_per_piece, to_proof, to_fridge, to_freezer, sale_point }) => ({
          id, day, recipe_id, recipe_name,
          pieces: Number(pieces || 0), grams_per_piece: Number(grams_per_piece || 0),
          to_proof: to_proof === "" || to_proof == null ? null : Number(to_proof),
          to_fridge: to_fridge === "" || to_fridge == null ? null : Number(to_fridge),
          to_freezer: to_freezer === "" || to_freezer == null ? null : Number(to_freezer),
          sale_point: sale_point || null,
        })),
      });
      toast.success(t("toast_weekly_saved"));
      fireHighFive(t("toast_weekly_saved"));
    } catch {
      toast.error(t("toast_save_error"));
    }
  };

  // Build the plan summary (days -> items with computed, up-to-date doses)
  const buildSummary = () => {
    return DAYS.map((d) => {
      const dayItems = items.filter((x) => x.day === d.id).map((it) => {
        const r = recipeById[it.recipe_id];
        const pieces = Number(it.pieces || 0);
        const gpp = Number(it.grams_per_piece || 0);
        const totalDough = pieces * gpp;
        const currentTotal = r ? GRAM_FIELDS.reduce((s, f) => s + Number(r[f.key] || 0), 0) : 0;
        const factor = currentTotal > 0 ? totalDough / currentTotal : null;
        const doses = r && factor
          ? GRAM_FIELDS.filter((f) => r[f.key] != null).map((f) => `${t(f.labelKey)} ${fmtQty(r[f.key] * factor)}`)
          : [];
        return { name: it.recipe_name, pieces, gpp, totalDough, doses, missing: !r };
      });
      return { day: t(`day_${d.id}`), items: dayItems };
    }).filter((d) => d.items.length > 0);
  };

  const buildPlainText = () => {
    const summary = buildSummary();
    let out = `${t("weekly_print_title")}\n\n`;
    summary.forEach((d) => {
      out += `${d.day}:\n`;
      d.items.forEach((it) => {
        out += `  • ${it.name} — ${it.pieces} × ${it.gpp}g = ${fmtQty(it.totalDough)}\n`;
        if (it.doses.length) out += `    ${t("weekly_doses_label")}: ${it.doses.join(" · ")}\n`;
      });
      out += "\n";
    });
    return out.trim();
  };

  const printPlan = () => {
    const summary = buildSummary();
    if (summary.length === 0) { toast.error(t("weekly_empty_share")); return; }
    const rows = summary.map((d) => `
      <section>
        <h2>${d.day}</h2>
        <ul>
          ${d.items.map((it) => `
            <li>
              <strong>${it.name}</strong> — ${it.pieces} × ${it.gpp}g = <b>${fmtQty(it.totalDough)}</b>
              ${it.missing ? `<div class="warn">${t("weekly_recipe_gone")}</div>` : ""}
              ${it.doses.length ? `<div class="doses">${t("weekly_doses_label")}: ${it.doses.join(" &middot; ")}</div>` : ""}
            </li>`).join("")}
        </ul>
      </section>`).join("");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${t("weekly_print_title")}</title>
      <style>
        body{font-family:Georgia,serif;color:#2B303B;max-width:720px;margin:32px auto;padding:0 20px}
        h1{color:#5E8B7E} h2{color:#33564E;border-bottom:2px solid #A9C5D4;padding-bottom:4px;margin-top:28px}
        ul{list-style:none;padding:0} li{padding:10px 0;border-bottom:1px solid #EEE}
        .doses{font-family:monospace;color:#33564E;font-size:13px;margin-top:4px}
        .warn{color:#C0574D;font-size:13px}
      </style></head><body>
      <h1>🌾 ${t("weekly_print_title")}</h1>${rows}
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const pdfPlan = () => {
    const summary = buildSummary();
    if (summary.length === 0) { toast.error(t("weekly_empty_share")); return; }
    const doc = new jsPDF();
    let y = 18;
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(179, 74, 38);
    doc.text(t("weekly_print_title"), 14, y); y += 10;
    summary.forEach((d) => {
      if (y > 275) { doc.addPage(); y = 18; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(140, 58, 29);
      doc.text(d.day, 14, y); y += 7;
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(44, 34, 30);
      d.items.forEach((it) => {
        if (y > 280) { doc.addPage(); y = 18; }
        doc.text(`• ${it.name} — ${it.pieces} x ${it.gpp}g = ${fmtQty(it.totalDough)}`, 18, y); y += 6;
        if (it.doses.length) {
          doc.setTextColor(140, 58, 29); doc.setFontSize(9);
          doc.text(`   ${t("weekly_doses_label")}: ${it.doses.join(" · ")}`, 18, y); y += 6;
          doc.setTextColor(44, 34, 30); doc.setFontSize(11);
        }
      });
      y += 4;
    });
    doc.save("piano-settimanale-mikilab.pdf");
  };

  const sharePlan = async () => {    const summary = buildSummary();
    if (summary.length === 0) { toast.error(t("weekly_empty_share")); return; }
    const text = buildPlainText();
    try {
      if (navigator.share) {
        await navigator.share({ title: t("weekly_print_title"), text });
        toast.success(t("toast_shared"));
      } else {
        await navigator.clipboard.writeText(text);
        toast.success(t("toast_copied"));
      }
    } catch {
      /* utente ha annullato la condivisione */
    }
  };

  // PDF Multi-Ricetta / per Punto Vendita: costruisce le ricette complete raggruppate per
  // giorno, con dosi SCALATE (pezzi × grammi). `filterItem` permette di filtrare per negozio.
  const buildFullByDay = (filterItem = () => true) => {
    return DAYS.map((d) => {
      const dayItems = items.filter((x) => x.day === d.id && filterItem(x)).map((it) => {
        const r = recipeById[it.recipe_id];
        const pieces = Number(it.pieces || 0);
        const gpp = Number(it.grams_per_piece || 0);
        const totalDough = pieces * gpp;
        const baseTotal = r ? GRAM_FIELDS.reduce((s, f) => s + Number(r[f.key] || 0), 0) : 0;
        const factor = baseTotal > 0 ? totalDough / baseTotal : null;
        return { it, r, pieces, gpp, totalDough, factor };
      });
      return { day: t(`day_${d.id}`), items: dayItems };
    }).filter((d) => d.items.length > 0);
  };

  // Scrive il documento PDF stampabile (logo + riepilogo + ricette complete) da un byDay.
  const writeRecipesPdf = ({ subtitle, byDay }) => {
    if (byDay.length === 0) { toast.error(t("weekly_empty_share")); return; }
    const origin = window.location.origin + (process.env.PUBLIC_URL || "");
    const logo = `${origin}/logo-256.png`;
    const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const L = {
      ingredients: tri("Ingredienti", "Zutaten", "Ingredients"),
      procedure: tri("Procedimento", "Zubereitung", "Procedure"),
      phases: tri("Fasi di lavorazione", "Arbeitsphasen", "Work phases"),
      bake: tri("Cottura", "Backen", "Baking"),
      summary: tri("Riepilogo", "Übersicht", "Summary"),
      recipes: tri("Le ricette", "Die Rezepte", "The recipes"),
      doses: t("weekly_doses_label"),
    };

    const summaryHtml = byDay.map((d) => `
      <div class="sum-day">
        <h3>${esc(d.day)}</h3>
        <ul>
          ${d.items.map(({ it, r, pieces, gpp, totalDough, factor }) => {
            const doses = (r && factor)
              ? GRAM_FIELDS.filter((f) => r[f.key] != null).map((f) => `${t(f.labelKey)} ${fmtQty(r[f.key] * factor)}`)
              : [];
            return `<li><b>${esc(rLoc(r, "name", lang) || it.recipe_name)}</b> — ${pieces} × ${gpp}g = <b>${fmtQty(totalDough)}</b>${doses.length ? ` <span class="doses">(${doses.map(esc).join(" · ")})</span>` : ""}</li>`;
          }).join("")}
        </ul>
      </div>`).join("");

    const recipeHtml = byDay.map((d) => `
      <section class="day">
        <h2>${esc(d.day)}</h2>
        ${d.items.map(({ it, r, pieces, gpp, totalDough, factor }) => {
          if (!r) return `<div class="recipe"><h3>${esc(it.recipe_name)}</h3><p class="warn">${t("weekly_recipe_gone")}</p></div>`;
          const ings = [];
          GRAM_FIELDS.forEach((f) => {
            if (r[f.key] != null) {
              const v = factor ? r[f.key] * factor : r[f.key];
              ings.push(`${t(f.labelKey)}: <b>${fmtQty(v)}</b>`);
            }
          });
          const scaledFlour = (r.flour_grams != null && factor) ? r.flour_grams * factor : r.flour_grams;
          (r.extra_ingredients || []).forEach((e) => {
            if (!e || !e.name) return;
            let g = null;
            if (e.grams != null) g = factor ? e.grams * factor : e.grams;
            else if (e.percent != null && scaledFlour != null) g = scaledFlour * e.percent / 100;
            ings.push(`${esc(ingLoc(e.name, lang))}${g != null ? `: <b>${fmtQty(g)}</b>` : ""}`);
          });
          const proc = rLoc(r, "procedure", lang);
          const phases = (r.work_phases || []).filter((p) => p && (p.name || p.time || p.temp));
          const bake = [r.bake_temp ? `${r.bake_temp}°C` : "", r.bake_minutes ? `${r.bake_minutes} min` : "", r.oven_type || ""].filter(Boolean).join(" · ");
          const flourT = rLoc(r, "flour_type", lang);
          return `
            <div class="recipe">
              <h3>${esc(rLoc(r, "name", lang))} <span class="meta">${pieces} × ${gpp}g = ${fmtQty(totalDough)}</span></h3>
              ${flourT ? `<p class="flour">${esc(flourT)}</p>` : ""}
              <div class="block"><h4>${L.ingredients}</h4><ul class="ings">${ings.map((x) => `<li>${x}</li>`).join("")}</ul></div>
              ${proc ? `<div class="block"><h4>${L.procedure}</h4><p class="proc">${esc(proc).replace(/\n/g, "<br>")}</p></div>` : ""}
              ${phases.length ? `<div class="block"><h4>${L.phases}</h4><ul>${phases.map((p) => `<li>${[p.name, p.time, p.temp].filter(Boolean).map(esc).join(" — ")}</li>`).join("")}</ul></div>` : ""}
              ${bake ? `<div class="block bake"><h4>${L.bake}</h4><p>${esc(bake)}</p></div>` : ""}
            </div>`;
        }).join("")}
      </section>`).join("");

    const docTitle = subtitle ? `${t("weekly_print_title")} · ${subtitle}` : t("weekly_print_title");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(docTitle)}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Georgia,serif;color:#2B303B;max-width:760px;margin:0 auto;padding:28px 22px}
        .head{display:flex;align-items:center;gap:12px;border-bottom:3px solid #5E8B7E;padding-bottom:10px;margin-bottom:18px}
        .head img{height:44px;width:auto}
        .head .brand{font-weight:800;font-size:22px;color:#2B303B}
        .head .sub{font-size:12px;color:#666}
        .shop{display:inline-block;margin:0 0 6px;background:#5E8B7E;color:#fff;font-weight:800;font-size:15px;padding:4px 14px;border-radius:20px}
        h1{color:#33564E;font-size:20px;margin:18px 0 8px}
        h2{color:#5E8B7E;border-bottom:2px solid #A9C5D4;padding-bottom:4px;margin-top:26px;font-size:18px}
        .sum-day{margin-bottom:6px} .sum-day h3{margin:8px 0 2px;font-size:14px;color:#33564E}
        .sum-day ul{margin:0;padding-left:18px} .sum-day li{font-size:13px;margin:2px 0}
        .doses{color:#5E8B7E;font-size:12px}
        .recipe{border:1px solid #D7E1DB;border-radius:10px;padding:14px 16px;margin:12px 0;page-break-inside:avoid}
        .recipe h3{margin:0 0 2px;font-size:16px;color:#2B303B}
        .recipe h3 .meta{font-size:12px;color:#5E8B7E;font-weight:normal}
        .flour{margin:0 0 8px;font-size:12px;color:#7E8A93}
        .block{margin-top:10px} .block h4{margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#4d6b45}
        .block ul{margin:0;padding-left:18px} .block li{font-size:13px;margin:2px 0}
        .ings li{list-style:none;display:inline-block;background:#EAF0EC;border:1px solid #D7E1DB;border-radius:20px;padding:2px 10px;margin:2px 4px 2px 0;font-size:12px}
        .proc{font-size:13px;line-height:1.5;margin:0}
        .bake p{font-size:13px;margin:0;color:#33564E}
        .warn{color:#C0574D;font-size:13px}
        @media print{.recipe{page-break-inside:avoid}}
      </style></head><body>
      <div class="head"><img src="${logo}" alt="MikiLab" onerror="this.style.display='none'"><div><div class="brand">MikiLab</div><div class="sub">${esc(t("weekly_print_title"))} · ${new Date().toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT")}</div></div></div>
      ${subtitle ? `<div class="shop">🏪 ${esc(subtitle)}</div>` : ""}
      <h1>${L.summary}</h1>${summaryHtml}
      <h1>${L.recipes}</h1>${recipeHtml}
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  const pdfMultiRicetta = () => writeRecipesPdf({ byDay: buildFullByDay() });

  // PDF separato per un singolo punto vendita: solo le ricette assegnate a quel negozio.
  const pdfPerSalePoint = (pointName) => {
    const byDay = buildFullByDay((x) => (x.sale_point || "") === pointName);
    writeRecipesPdf({ subtitle: pointName, byDay });
  };

  // Punti vendita che hanno almeno una ricetta assegnata nel piano.
  const assignedPoints = useMemo(() => {
    const used = new Set(items.map((x) => x.sale_point).filter(Boolean));
    return salesPoints.filter((p) => used.has(p.name)).map((p) => p.name);
  }, [items, salesPoints]);

  // Etichette Sacchetti: foglio di etichette stampabili (nome pane, peso, data, negozio),
  // una per pezzo (max 40 per prodotto), da attaccare ai sacchetti.
  const printLabels = (filterItem = () => true, subtitle = "") => {
    const rows = items.filter(filterItem).map((it) => {
      const r = recipeById[it.recipe_id];
      const days = recipeShelfDays(r);
      const exp = new Date(); exp.setDate(exp.getDate() + days);
      return {
        name: rLoc(r, "name", lang) || it.recipe_name,
        weight: Number(it.grams_per_piece || 0),
        pieces: Number(it.pieces || 0),
        shop: it.sale_point || "",
        expiry: exp.toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT"),
      };
    }).filter((x) => x.name);
    if (rows.length === 0) { toast.error(t("weekly_empty_share")); return; }
    const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const date = new Date().toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT");
    const CAP = 40;
    const labels = [];
    rows.forEach((x) => {
      const n = Math.min(Math.max(1, x.pieces || 1), CAP);
      for (let i = 0; i < n; i++) labels.push(x);
    });
    const title = tri("Etichette Sacchetti", "Beutel-Etiketten", "Bag Labels");
    const cards = labels.map((x) => `
      <div class="label">
        <div class="brand">🌾 MikiLab</div>
        <div class="name">${esc(x.name)}</div>
        <div class="meta">${x.weight ? `<span class="w">${fmtQty(x.weight)}</span>` : "<span></span>"}<span class="d">${esc(date)}</span></div>
        <div class="exp">${tri("Da consumarsi entro", "Zu verbrauchen bis", "Best before")}: <b>${esc(x.expiry)}</b></div>
        ${x.shop ? `<div class="shop">🏪 ${esc(x.shop)}</div>` : ""}
      </div>`).join("");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}${subtitle ? " · " + esc(subtitle) : ""}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Georgia,serif;margin:0;padding:10mm;color:#2B303B}
        .grid{display:flex;flex-wrap:wrap;gap:4mm}
        .label{width:58mm;height:38mm;border:1px dashed #9AA6AE;border-radius:6px;padding:3mm 4mm;display:flex;flex-direction:column;justify-content:space-between;page-break-inside:avoid}
        .brand{font-size:9px;font-weight:800;color:#5E8B7E;letter-spacing:.04em}
        .name{font-size:15px;font-weight:800;line-height:1.1;color:#2B303B}
        .meta{display:flex;justify-content:space-between;align-items:flex-end;font-size:11px}
        .meta .w{font-weight:800;color:#33564E}
        .meta .d{color:#7E8A93}
        .exp{font-size:10px;color:#B34A26}
        .shop{font-size:10px;font-weight:700;color:#5E8B7E;border-top:1px solid #EAF0EC;padding-top:2px}
        @media print{ @page{margin:8mm} .label{border-color:#c9c9c9} }
      </style></head><body>
      <div class="grid">${cards}</div>
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  // PDF Lista della Spesa divisa per Punto Vendita: ingredienti totali per ogni negozio.
  const pdfShoppingPerShop = () => {
    const groups = {};
    const NOSHOP = tri("Senza negozio assegnato", "Ohne Verkaufspunkt", "No sales point");
    items.forEach((it) => {
      const key = it.sale_point || NOSHOP;
      const grams = Number(it.pieces || 0) * Number(it.grams_per_piece || 0);
      if (grams <= 0) return;
      (groups[key] = groups[key] || []).push({ recipe_id: it.recipe_id, grams });
    });
    const shopNames = Object.keys(groups);
    if (shopNames.length === 0) { toast.error(t("weekly_empty_share")); return; }
    shopNames.sort((a, b) => (a === NOSHOP ? 1 : b === NOSHOP ? -1 : a.localeCompare(b)));
    const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const origin = window.location.origin + (process.env.PUBLIC_URL || "");
    const logo = `${origin}/logo-256.png`;
    const L = {
      flours: tri("Farine", "Mehle", "Flours"),
      others: tri("Base impasto", "Teigbasis", "Dough base"),
      extras: tri("Altri ingredienti", "Weitere Zutaten", "Other ingredients"),
      title: tri("Lista della Spesa per Punto Vendita", "Einkaufsliste pro Verkaufspunkt", "Shopping List per Sales Point"),
    };

    const sections = shopNames.map((shop) => {
      const totals = computeShopping(groups[shop], recipeById, lang);
      const flours = Object.entries(totals.flourByType).sort((a, b) => b[1] - a[1]);
      const others = Object.entries(totals.others);
      const extras = Object.entries(totals.extras).sort((a, b) => b[1] - a[1]);
      const li = (name, val) => `<li><span>${esc(name)}</span><b>${fmtQty(val)}</b></li>`;
      return `
        <section class="shop">
          <h2>🏪 ${esc(shop)}</h2>
          ${flours.length ? `<div class="grp"><h3>${L.flours}</h3><ul>${flours.map(([k, v]) => li(k, v)).join("")}</ul></div>` : ""}
          ${others.length ? `<div class="grp"><h3>${L.others}</h3><ul>${others.map(([f, v]) => li(otherLabel(f, lang), v)).join("")}</ul></div>` : ""}
          ${extras.length ? `<div class="grp"><h3>${L.extras}</h3><ul>${extras.map(([k, v]) => li(ingLoc(k, lang), v)).join("")}</ul></div>` : ""}
        </section>`;
    }).join("");

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(L.title)}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:Georgia,serif;color:#2B303B;max-width:720px;margin:0 auto;padding:28px 22px}
        .head{display:flex;align-items:center;gap:12px;border-bottom:3px solid #5E8B7E;padding-bottom:10px;margin-bottom:14px}
        .head img{height:44px;width:auto}
        .head .brand{font-weight:800;font-size:22px;color:#2B303B}
        .head .sub{font-size:12px;color:#666}
        .shop{margin-top:18px;page-break-inside:avoid}
        h2{color:#fff;background:#5E8B7E;display:inline-block;padding:4px 14px;border-radius:20px;font-size:16px;margin:0 0 8px}
        .grp{margin:6px 0 10px} .grp h3{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#4d6b45;margin:0 0 4px}
        .grp ul{list-style:none;margin:0;padding:0}
        .grp li{display:flex;justify-content:space-between;border-bottom:1px dotted #D7E1DB;padding:3px 0;font-size:14px}
        .grp li b{font-family:monospace;color:#33564E}
      </style></head><body>
      <div class="head"><img src="${logo}" alt="MikiLab" onerror="this.style.display='none'"><div><div class="brand">MikiLab</div><div class="sub">${esc(L.title)} · ${new Date().toLocaleDateString(lang === "de" ? "de-DE" : lang === "en" ? "en-GB" : "it-IT")}</div></div></div>
      ${sections}
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-2xl bg-[#5E8B7E] flex items-center justify-center">
          <CalendarDays className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2B303B] dark:text-[#EAF0EC]">{t("weekly_title")}</h1>
          <p className="text-sm text-[#7E8A93]">{t("weekly_subtitle")}</p>
        </div>
      </div>

      {loaded && recipes.length === 0 && (
        <div className="mt-5 flex items-start gap-3 bg-[#6E8CA0]/15 border border-[#6E8CA0]/30 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-[#5E8B7E] shrink-0 mt-0.5" />
          <p className="text-sm text-[#3F4A54] dark:text-[#AEB8BF]">{t("weekly_no_recipes")}</p>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {DAYS.map((d) => {
          const dayItems = items.filter((x) => x.day === d.id);
          return (
            <div key={d.id} data-testid={`weekly-day-${d.id}`} className="bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-lg font-semibold text-[#2B303B] dark:text-[#EAF0EC]">{t(`day_${d.id}`)}</h3>
                <button
                  data-testid={`weekly-add-${d.id}`}
                  onClick={() => addItem(d.id)}
                  disabled={recipes.length === 0}
                  className="flex items-center gap-1 text-sm font-medium text-[#5E8B7E] disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" /> {t("weekly_add")}
                </button>
              </div>

              {dayItems.length === 0 ? (
                <p className="text-sm text-[#9AA6AE]">{t("weekly_none")}</p>
              ) : (
                <div className="space-y-3">
                  {dayItems.map((it) => (
                    <WeeklyItemRow
                      key={it.id}
                      item={it}
                      recipes={recipes}
                      recipe={recipeById[it.recipe_id]}
                      salesPoints={salesPoints}
                      t={t}
                      onRecipeChange={(rid) => onRecipeChange(it.id, rid)}
                      onChange={(patch) => updateItem(it.id, patch)}
                      onRemove={() => removeItem(it.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        data-testid="weekly-save-btn"
        onClick={save}
        className="w-full mt-5 bg-[#5E8B7E] hover:bg-[#4C7368] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" /> {t("weekly_save")}
      </button>

      <div className="grid grid-cols-3 gap-2 mt-2">
        <button
          data-testid="weekly-print-btn"
          onClick={printPlan}
          className="bg-[#EAF0EC] dark:bg-[#2A323A] text-[#2B303B] dark:text-[#EAF0EC] font-medium px-3 py-3 rounded-2xl border border-[#D7E1DB] dark:border-[#38424B] flex items-center justify-center gap-1.5 active:scale-98 transition-all"
        >
          <Printer className="w-5 h-5" /> {t("weekly_print")}
        </button>
        <button
          data-testid="weekly-pdf-btn"
          onClick={pdfPlan}
          className="bg-[#EAF0EC] dark:bg-[#2A323A] text-[#2B303B] dark:text-[#EAF0EC] font-medium px-3 py-3 rounded-2xl border border-[#D7E1DB] dark:border-[#38424B] flex items-center justify-center gap-1.5 active:scale-98 transition-all"
        >
          <FileText className="w-5 h-5" /> {t("weekly_pdf")}
        </button>
        <button
          data-testid="weekly-share-btn"
          onClick={sharePlan}
          className="bg-[#EAF0EC] dark:bg-[#2A323A] text-[#2B303B] dark:text-[#EAF0EC] font-medium px-3 py-3 rounded-2xl border border-[#D7E1DB] dark:border-[#38424B] flex items-center justify-center gap-1.5 active:scale-98 transition-all"
        >
          <Share2 className="w-5 h-5" /> {t("weekly_share")}
        </button>
      </div>

      <button
        data-testid="weekly-pdf-multi-btn"
        onClick={pdfMultiRicetta}
        className="w-full mt-2 bg-[#6B8E62] hover:bg-[#5a7a53] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        <FileText className="w-5 h-5" /> {tri("PDF Multi-Ricetta", "PDF Mehr-Rezepte", "Multi-Recipe PDF")}
      </button>

      <button
        data-testid="weekly-labels-btn"
        onClick={() => printLabels()}
        className="w-full mt-2 bg-[#C9A24B] hover:bg-[#b38f3f] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        <Tag className="w-5 h-5" /> {tri("Etichette Sacchetti", "Beutel-Etiketten", "Bag Labels")}
      </button>

      <button
        data-testid="weekly-shopping-shop-btn"
        onClick={pdfShoppingPerShop}
        className="w-full mt-2 bg-[#6E8CA0] hover:bg-[#5c788b] text-white font-semibold px-5 py-3.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        <ShoppingBasket className="w-5 h-5" /> {tri("Lista Spesa per Negozio", "Einkaufsliste pro Laden", "Shopping List per Shop")}
      </button>

      {assignedPoints.length > 0 && (
        <div data-testid="weekly-salepoint-pdf" className="mt-4 rounded-2xl bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-5 h-5 text-[#5E8B7E]" />
            <h3 className="font-display text-base font-semibold text-[#2B303B] dark:text-[#EAF0EC]">
              {tri("Per Punto Vendita", "Pro Verkaufspunkt", "Per Sales Point")}
            </h3>
          </div>
          <p className="text-xs text-[#7E8A93] mb-3 leading-snug">
            {tri("Per ogni negozio: il PDF con solo le sue ricette e le etichette per i suoi sacchetti — pronti da consegnare al team.",
                 "Für jeden Laden: das PDF mit nur seinen Rezepten und die Etiketten für seine Beutel — bereit fürs Team.",
                 "For each shop: the PDF with only its recipes and the labels for its bags — ready to hand to the team.")}
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {assignedPoints.map((name) => (
              <div key={name} className="rounded-xl bg-[#EAF0EC] dark:bg-[#2A323A] border border-[#D7E1DB] dark:border-[#38424B] p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-[#2B303B] dark:text-[#EAF0EC] mb-2 min-w-0">
                  <Store className="w-4 h-4 text-[#5E8B7E] shrink-0" /><span className="truncate">{name}</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    data-testid={`weekly-salepoint-pdf-${name}`}
                    onClick={() => pdfPerSalePoint(name)}
                    className="flex items-center justify-center gap-1.5 bg-[#6B8E62] hover:bg-[#5a7a53] text-white text-sm font-semibold px-3 py-2.5 rounded-xl active:scale-98 transition-all"
                  >
                    <FileText className="w-4 h-4" /> {tri("Ricette PDF", "Rezepte PDF", "Recipes PDF")}
                  </button>
                  <button
                    data-testid={`weekly-salepoint-labels-${name}`}
                    onClick={() => printLabels((x) => (x.sale_point || "") === name, name)}
                    className="flex items-center justify-center gap-1.5 bg-[#C9A24B] hover:bg-[#b38f3f] text-white text-sm font-semibold px-3 py-2.5 rounded-xl active:scale-98 transition-all"
                  >
                    <Tag className="w-4 h-4" /> {tri("Etichette", "Etiketten", "Labels")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WeeklyItemRow({ item, recipes, recipe, salesPoints, t, onRecipeChange, onChange, onRemove }) {
  const pieces = Number(item.pieces || 0);
  const gpp = Number(item.grams_per_piece || 0);
  const totalDough = pieces * gpp;

  const currentTotal = recipe
    ? GRAM_FIELDS.reduce((s, f) => s + Number(recipe[f.key] || 0), 0)
    : 0;
  const factor = currentTotal > 0 ? totalDough / currentTotal : null;

  const scaled = GRAM_FIELDS.map((f) => ({
    ...f,
    value: recipe && recipe[f.key] != null && factor ? Math.round(recipe[f.key] * factor) : null,
  }));

  return (
    <div className="bg-[#EAF0EC] dark:bg-[#1F252B] border border-[#D7E1DB] dark:border-[#38424B] rounded-xl p-3">
      <div className="flex items-center gap-2">
        <select
          data-testid={`weekly-recipe-select-${item.id}`}
          value={item.recipe_id}
          onChange={(e) => onRecipeChange(e.target.value)}
          className="flex-1 min-w-0 bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg px-2 py-2 text-sm outline-none focus:border-[#5E8B7E]"
        >
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button onClick={onRemove} data-testid={`weekly-remove-${item.id}`} className="w-8 h-8 rounded-lg bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] flex items-center justify-center text-[#C0574D] shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-1 flex-1">
          <input
            data-testid={`weekly-pieces-${item.id}`}
            type="number" value={item.pieces}
            onChange={(e) => onChange({ pieces: e.target.value })}
            className="w-20 text-right font-mono-data font-bold text-[#33564E] dark:text-[#8FB0C2] bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg px-2 py-1.5 outline-none"
          />
          <span className="text-xs text-[#7E8A93]">{t("weekly_pieces")}</span>
          <input
            data-testid={`weekly-gpp-${item.id}`}
            type="number" value={item.grams_per_piece}
            onChange={(e) => onChange({ grams_per_piece: e.target.value })}
            className="w-16 text-right font-mono-data font-bold text-[#33564E] dark:text-[#8FB0C2] bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg px-2 py-1.5 outline-none"
          />
          <span className="text-xs text-[#7E8A93]">{t("weekly_gpp")}</span>
        </div>
        <span className="font-mono-data text-sm font-bold text-[#3F4A54] dark:text-[#AEB8BF]">= {fmtQty(totalDough)}</span>
      </div>

      {!recipe ? (
        <p className="text-xs text-[#C0574D] mt-2">{t("weekly_recipe_gone")}</p>
      ) : factor ? (
        <div className="flex flex-wrap gap-1.5 mt-2" data-testid={`weekly-doses-${item.id}`}>
          {scaled.map((f) => f.value != null && (
            <span key={f.key} className="inline-flex items-center gap-1 bg-[#6E8CA0]/15 text-[#33564E] dark:text-[#8FB0C2] font-mono-data text-xs px-2 py-0.5 rounded-full font-bold border border-[#6E8CA0]/30">
              <Wheat className="w-3 h-3" /> {t(f.labelKey)} {fmtQty(f.value)}
            </span>
          ))}
        </div>
      ) : null}

      {/* Destinazione pezzi: lievitazione (oggi) / frigo (domani) / freezer (resto) */}
      <div className="mt-3 pt-2 border-t border-dashed border-[#D7E1DB] dark:border-[#38424B]">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7E8A93]">{t("weekly_dest_title")}</p>
        <div className="grid grid-cols-3 gap-2 mt-1.5">
          {[
            ["to_proof", t("weekly_dest_proof")],
            ["to_fridge", t("weekly_dest_fridge")],
            ["to_freezer", t("weekly_dest_freezer")],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-[10px] text-[#7E8A93] block leading-tight">{label}</label>
              <input
                data-testid={`weekly-${key}-${item.id}`}
                type="number" value={item[key] ?? ""} placeholder="—"
                onChange={(e) => onChange({ [key]: e.target.value })}
                className="mt-0.5 w-full text-center font-mono-data font-bold text-[#6B8E62] bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg px-1 py-1.5 outline-none focus:border-[#6B8E62]"
              />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#9AA6AE] mt-1 leading-snug">{t("weekly_dest_hint")}</p>
      </div>

      {/* Destinazione: Punto Vendita (dai Punti Vendita del Passo 3) */}
      {salesPoints.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <Store className="w-4 h-4 text-[#5E8B7E] shrink-0" />
          <select
            data-testid={`weekly-salepoint-${item.id}`}
            value={item.sale_point || ""}
            onChange={(e) => onChange({ sale_point: e.target.value })}
            className="flex-1 min-w-0 bg-white dark:bg-[#232A31] border border-[#D7E1DB] dark:border-[#38424B] rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#5E8B7E] text-[#2B303B] dark:text-[#EAF0EC]"
          >
            <option value="">{t("weekly_salepoint_none")}</option>
            {salesPoints.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
