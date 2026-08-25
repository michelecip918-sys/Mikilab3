// Audit: chiavi DE/EN identiche all'italiano (probabili traduzioni mancanti)
const path = "/app/frontend/src/i18n/translations.js";
const src = require("fs").readFileSync(path, "utf8");
const mod = { exports: {} };
const fn = new Function("exports", "module", src.replace(/^export const/m, "const") + "\nmodule.exports = translations;");
fn(mod.exports, mod);
const t = mod.exports;
const it = t.it, de = t.de, en = t.en;
const skipVals = new Set(["MikiLab", "PRO", "Community", "Home", "Radio", "Poolish", "Biga", "LiCoLi", "Quark", "Focaccia", "Panettoni", "HACCP", "pH"]);
for (const lang of ["de", "en"]) {
  const dict = t[lang];
  const same = [];
  const missing = [];
  for (const k of Object.keys(it)) {
    if (!(k in dict)) { missing.push(k); continue; }
    const a = it[k], b = dict[k];
    if (typeof a === "string" && typeof b === "string" && a.trim() === b.trim() && a.trim().length > 2 && !skipVals.has(a.trim())) same.push(`${k} = "${a}"`);
  }
  console.log(`\n=== ${lang.toUpperCase()} : chiavi mancanti (${missing.length}) ===`);
  console.log(missing.join(", "));
  console.log(`=== ${lang.toUpperCase()} : valori identici all'IT (${same.length}) ===`);
  same.forEach((s) => console.log(" -", s));
}
