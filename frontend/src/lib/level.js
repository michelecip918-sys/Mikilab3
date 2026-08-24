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
  if (total >= 10) return { icon: "🏅", name: L("Maestro", "Meister", "Master"), cls: "bg-[#6B8E62] text-white", total };
  if (total >= 4) return { icon: "🥐", name: L("Fornaio", "Bäcker", "Baker"), cls: "bg-[#C9A24B] text-white", total };
  return { icon: "🥖", name: L("Apprendista", "Lehrling", "Apprentice"), cls: "bg-[#D7E1DB] dark:bg-[#38424B] text-[#7E8A93]", total };
}
