// XP reale accumulato dall'uso (ricette create, diagnosi fatte, ecc.).
export function addXP(n = 1) {
  try {
    const v = (parseInt(localStorage.getItem("mikilab_xp") || "0", 10) || 0) + n;
    localStorage.setItem("mikilab_xp", String(v));
  } catch { /* */ }
}

export function getXP() {
  try { return parseInt(localStorage.getItem("mikilab_xp") || "0", 10) || 0; } catch { return 0; }
}

// Livello combinato: passi del percorso Impara (0-3) + XP reale.
export function getLevel(L = (i) => i) {
  let steps = 0;
  try { const p = JSON.parse(localStorage.getItem("mikilab_impara_path") || "[]"); steps = ["ricettario", "farine", "corsi"].filter((x) => p.includes(x)).length; } catch { /* */ }
  const total = steps + getXP();
  if (total >= 10) return { icon: "🏅", name: L("Maestro", "Meister", "Master"), cls: "bg-[#5aa0cf] text-white", total };
  if (total >= 4) return { icon: "🥐", name: L("Fornaio", "Bäcker", "Baker"), cls: "bg-[#C9A24B] text-white", total };
  return { icon: "🥖", name: L("Apprendista", "Lehrling", "Apprentice"), cls: "bg-[#d5e4f0] dark:bg-[#2e2e2e] text-[#7E8A93]", total };
}

// Progresso verso il prossimo livello: punti mancanti e percentuale barra.
export function getLevelProgress(L = (i) => i) {
  const lvl = getLevel(L);
  const total = lvl.total;
  if (total >= 10) return { ...lvl, isMax: true, remaining: 0, pct: 100, nextName: null };
  const base = total >= 4 ? 4 : 0;
  const target = total >= 4 ? 10 : 4;
  const nextIcon = total >= 4 ? "🏅" : "🥐";
  const nextName = total >= 4 ? L("Maestro", "Meister", "Master") : L("Fornaio", "Bäcker", "Baker");
  const remaining = Math.max(0, target - total);
  const pct = Math.min(100, Math.max(4, Math.round(((total - base) / (target - base)) * 100)));
  return { ...lvl, isMax: false, remaining, target, nextName, nextIcon, pct };
}
