// V90 — LE MEDAGLIE DELLA BOTTEGA: piccoli traguardi che il sito riconosce mentre lo usi.
// Solo localStorage ("mikilab_medaglie": { id: timestamp }). Nessun invio, nessun confronto con altri:
// è un gioco con se stessi. award(id) assegna una volta sola e manda l'evento "mikilab-medaglia".
const KEY = "mikilab_medaglie";
const T = (it, de, en) => ({ it, de, en });

export const MEDAGLIE = [
  { id: "primo_giro", icon: "🧭", t: T("Il primo giro", "Die erste Runde", "The first tour"), how: T("Fai il giro con Sitor fino in fondo", "Mach die Runde mit Sitor bis zum Ende", "Finish the tour with Sitor") },
  { id: "primo_pane", icon: "🥖", t: T("Il primo pane", "Das erste Brot", "The first bread"), how: T("Segna una ricetta come fatta", "Markiere ein Rezept als gemacht", "Mark a recipe as done") },
  { id: "cinque_pani", icon: "🍞", t: T("Cinque pani", "Fünf Brote", "Five breads"), how: T("Cinque ricette fatte", "Fünf Rezepte gemacht", "Five recipes done") },
  { id: "dieci_pani", icon: "🏆", t: T("Il forno non si spegne", "Der Ofen geht nicht aus", "The oven never goes out"), how: T("Dieci ricette fatte", "Zehn Rezepte gemacht", "Ten recipes done") },
  { id: "lievito_nato", icon: "🌱", t: T("È nato!", "Er ist da!", "It's born!"), how: T("Registra il tuo lievito madre", "Trag deinen Sauerteig ein", "Register your starter") },
  { id: "nutrice", icon: "🍼", t: T("Mamma del lievito", "Sauerteig-Mama", "Starter parent"), how: T("Dieci pasti segnati al lievito", "Zehn Mahlzeiten beim Sauerteig eingetragen", "Ten feeds noted for the starter") },
  { id: "primo_pane_lm", icon: "🎂", t: T("Il primo pane del piccolo", "Das erste Brot des Kleinen", "The little one's first bread"), how: T("Il tuo lievito fa il primo pane", "Dein Sauerteig backt sein erstes Brot", "Your starter makes its first bread") },
  { id: "quaderno", icon: "📓", t: T("Il quaderno", "Das Heft", "The notebook"), how: T("Prima prova nel Mio forno", "Erster Eintrag in Mein Ofen", "First entry in My oven") },
  { id: "fotografo", icon: "📷", t: T("Fotografo di pani", "Brotfotograf", "Bread photographer"), how: T("Cinque foto nel Mio forno", "Fünf Fotos in Mein Ofen", "Five photos in My oven") },
  { id: "prova_dito", icon: "👆", t: T("Il dito sa", "Der Finger weiß", "The finger knows"), how: T("Usa il banco delle prove", "Nutze die Prüfbank", "Use the test bench") },
  { id: "orecchio", icon: "👂", t: T("Orecchio da fornaio", "Bäckerohr", "Baker's ear"), how: T("Il pane parla: suona cavo", "Das Brot spricht: klingt hohl", "The bread speaks: hollow") },
  { id: "cartografo", icon: "🗺️", t: T("Cartografo del forno", "Ofenkartograf", "Oven cartographer"), how: T("Salva la mappa del tuo forno", "Speichere die Karte deines Ofens", "Save your oven map") },
  { id: "ambasciatore", icon: "📣", t: T("Ambasciatore", "Botschafter", "Ambassador"), how: T("Stampa o condividi il volantino", "Druck oder teile den Flyer", "Print or share the flyer") },
  { id: "radici", icon: "🌍", t: T("Le radici", "Die Wurzeln", "Roots"), how: T("Scegli il pane del tuo paese", "Wähle das Brot deiner Heimat", "Choose the bread of your homeland") },
  { id: "fornaio_notte", icon: "🌙", t: T("Fornaio di notte", "Nachtbäcker", "Night baker"), how: T("Apri MikiLab tra le 4 e le 6 del mattino", "Öffne MikiLab zwischen 4 und 6 Uhr morgens", "Open MikiLab between 4 and 6 a.m.") },
  { id: "segreto", icon: "🐙", t: T("Il segreto del polpo", "Das Geheimnis des Kraken", "The octopus secret"), how: T("Trova il segreto", "Finde das Geheimnis", "Find the secret") },
  { id: "primo_giorno", icon: "🎉", t: T("C'ero il primo giorno", "Ich war am ersten Tag dabei", "I was there on day one"), how: T("La festa del 16 ottobre", "Die Feier am 16. Oktober", "The 16 October party") },
  { id: "sorpresa", icon: "🎲", t: T("Mi fido di Sitor", "Ich vertraue Sitor", "I trust Sitor"), how: T("Apri una ricetta a sorpresa", "Öffne ein Überraschungsrezept", "Open a surprise recipe") },
];

export const getMedaglie = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { return {}; } };
export const hasMedaglia = (id) => !!getMedaglie()[id];
export function award(id) {
  try {
    const m = getMedaglie(); if (m[id]) return false;
    const def = MEDAGLIE.find((x) => x.id === id); if (!def) return false;
    m[id] = Date.now(); localStorage.setItem(KEY, JSON.stringify(m));
    window.dispatchEvent(new CustomEvent("mikilab-medaglia", { detail: { id } }));
    return true;
  } catch { return false; }
}
