// Punti Vendita — persistiti in localStorage (nessun backend richiesto).
// Usati nel Passo 3 (Logistica) e come destinazione degli ordini nel Piano Settimanale (Passo 4).
const KEY = "mikilab_sales_points";

export function getSalesPoints() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveSalesPoints(points) {
  try {
    localStorage.setItem(KEY, JSON.stringify(points || []));
    // notifica altre viste (es. Piano Settimanale) nella stessa sessione
    window.dispatchEvent(new Event("mikilab-salespoints-changed"));
  } catch {
    /* storage pieno o non disponibile */
  }
}
