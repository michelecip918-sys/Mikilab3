// V132 — MIKILAB E TIKTOK. Tutto nel browser: niente server, e nessuno script di TikTok finché la persona non tocca
// «Carica il video». Qui: il numero del video da un link, il lettore ufficiale, la didascalia pronta e il copione di una ricetta.
import { rLoc } from "@/lib/loc";

export const TIKTOK_HANDLE = "mikilab.de";
export const TIKTOK_PROFILO = "https://www.tiktok.com/@mikilab.de";
export const TIKTOK_LINK_RE = /^https:\/\/(www\.|vm\.|vt\.|m\.)?tiktok\.com\/[A-Za-z0-9@._/?=&%-]+$/;

// Il numero del video (…/video/7412345678901234567). I link corti (vm.tiktok.com) non lo contengono: il server li allunga.
export function videoIdTikTok(url) {
  const m = String(url || "").match(/\/video\/(\d{8,25})/);
  return m ? m[1] : null;
}
// Il lettore ufficiale di TikTok (si carica solo dopo il tocco della persona).
export function playerTikTok(id) {
  return `https://www.tiktok.com/player/v1/${id}?music_info=1&description=1&rel=0&native_context_menu=0&closed_caption=1`;
}
export function autoreTikTok(url) {
  const m = String(url || "").match(/tiktok\.com\/@([A-Za-z0-9._]{2,40})/);
  return m ? m[1] : "";
}

const L3 = (lang, it, de, en) => (lang === "de" ? de : lang === "en" ? en : it);
const TAG_BASE = { it: ["#panefattoincasa", "#artebianca"], de: ["#brotbacken", "#selbstgebacken"], en: ["#breadmaking", "#homemadebread"] };
const TAG_CAT = {
  pane: ["#pane", "#brot", "#bread"], panini: ["#panini", "#brötchen", "#rolls"], focacce: ["#focaccia", "#focaccia", "#focaccia"],
  pizza: ["#pizzafattaincasa", "#pizzateig", "#homemadepizza"], panettoni: ["#panettone", "#panettone", "#panettone"],
  viennoiserie: ["#cornetti", "#croissant", "#croissant"], snack: ["#stuzzichini", "#snack", "#snack"],
  pasticceria: ["#pasticceria", "#konditorei", "#pastry"], rosticceria: ["#rosticceria", "#fingerfood", "#fingerfood"], fritti: ["#fritti", "#frittiert", "#fried"],
};

export function hashtagTikTok(recipe, lang, base = "#MikiLab") {
  const i = lang === "de" ? 1 : lang === "en" ? 2 : 0;
  const tags = [base || "#MikiLab", ...(TAG_BASE[lang] || TAG_BASE.it)];
  const cat = TAG_CAT[String((recipe && recipe.menu_category) || "").toLowerCase()];
  if (cat) tags.push(cat[i]);
  const pt = String((recipe && recipe.preferment_type) || "").toLowerCase();
  if (/lievito madre|^lm$|licoli/.test(pt) || Number(recipe && recipe.sourdough_grams) > 0) tags.push(["#lievitomadre", "#sauerteig", "#sourdough"][i]);
  if (/canapa/i.test((recipe && recipe.name) || "")) tags.push(["#canapa", "#hanf", "#hemp"][i]);
  return [...new Set(tags)];
}

// La didascalia pronta: per Michele («la ricetta intera sul mio sito») o per chi ha rifatto la ricetta (tag @mikilab.de).
export function didascaliaTikTok({ recipe, lang, codice, mia = false, handle = TIKTOK_HANDLE, hashtag = "#MikiLab" }) {
  const nome = rLoc(recipe, "name", lang);
  const h = String(handle || TIKTOK_HANDLE).replace(/^@/, "");
  const dove = codice ? L3(lang, `Ricetta n. ${codice}: mikilab.de/${codice}`, `Rezept Nr. ${codice}: mikilab.de/${codice}`, `Recipe no. ${codice}: mikilab.de/${codice}`) : "mikilab.de";
  const tags = hashtagTikTok(recipe, lang, hashtag).join(" ");
  const testa = mia
    ? `${nome} 🍞 ${L3(lang, "La ricetta intera, gratis, sul mio sito.", "Das ganze Rezept, kostenlos, auf meiner Seite.", "The full recipe, free, on my site.")}`
    : `${L3(lang, `Ho fatto «${nome}» con la ricetta di @${h}`, `Ich habe «${nome}» nach dem Rezept von @${h} gebacken`, `I made «${nome}» with @${h}'s recipe`)} 🍞`;
  return `${testa}\n${dove}\n\n${tags}`;
}

// Il copione: poche scene da pochi secondi, costruite con i dati della ricetta (prefermento, forma, forno, numero).
export function copioneTikTok(recipe, lang, codice) {
  const T = (it, de, en) => L3(lang, it, de, en);
  const nome = rLoc(recipe, "name", lang);
  const cat = String(recipe.menu_category || "").toLowerCase();
  const pt = String(recipe.preferment_type || "").toLowerCase();
  const b = recipe.biga || null;
  const pre = b && b.kind === "poolish" ? "poolish" : (b || pt === "biga") ? "biga" : pt === "poolish" ? "poolish" : (/lievito madre|^lm$|licoli/.test(pt) || Number(recipe.sourdough_grams) > 0) ? "lm" : "";
  const ore = b ? ((lang === "de" ? b.hours_de : lang === "en" ? b.hours_en : b.hours) || b.hours || "") : "";
  const forno = recipe.bake_temp ? `${Math.round(Number(recipe.bake_temp))} °C${recipe.bake_minutes ? ` · ${Math.round(Number(recipe.bake_minutes))} min` : ""}` : T("In forno", "In den Ofen", "Into the oven");
  const dove = codice ? `${T("Ricetta n.", "Rezept Nr.", "Recipe no.")} ${codice} · mikilab.de/${codice}` : "mikilab.de";
  const scene = [
    { sec: "0-2", cosa: T("Parti dalla fine: il pane pronto. Rompi la crosta vicino al telefono, che si senta il rumore.", "Fang mit dem Ende an: das fertige Brot. Brich die Kruste nah am Handy, damit man das Knacken hört.", "Start with the end: the finished bake. Break the crust close to the phone so the crackle is heard."), scritta: nome },
    { sec: "2-5", cosa: T("Gli ingredienti sul tavolo, visti dall'alto.", "Die Zutaten auf dem Tisch, von oben.", "The ingredients on the table, from above."), scritta: T("Pochi ingredienti, tanto tempo", "Wenige Zutaten, viel Zeit", "Few ingredients, lots of time") },
  ];
  if (pre === "lm") scene.push({ sec: "5-8", cosa: T("Il lievito madre al picco: il barattolo pieno di bolle.", "Der Sauerteig auf dem Höhepunkt: das Glas voller Blasen.", "The starter at its peak: the jar full of bubbles."), scritta: T("Il lievito madre, al picco", "Der Sauerteig, auf dem Höhepunkt", "The starter, at its peak") });
  else if (pre) scene.push({ sec: "5-8", cosa: T(`La ${pre} della sera prima: aprila davanti al telefono.`, `${pre === "biga" ? "Die Biga" : "Der Poolish"} vom Vorabend: vor dem Handy öffnen.`, `The ${pre} from the evening before: open it in front of the phone.`), scritta: `${pre === "biga" ? "Biga" : "Poolish"}${ore ? ` · ${ore}` : ""}` });
  scene.push({ sec: "8-12", cosa: T("Le mani nell'impasto; poi tira un pezzetto di impasto fino a vedere il velo.", "Die Hände im Teig; dann ein Stück Teig dünn ziehen, bis man das Fenster sieht.", "Hands in the dough; then stretch a small piece until you see the windowpane."), scritta: T("L'impasto giusto fa il velo", "Richtiger Teig zeigt das Fenster", "The right dough makes a windowpane") });
  scene.push({ sec: "12-15", cosa: T("La lievitazione in un attimo: una foto prima e una dopo, o un time-lapse.", "Die Gare im Zeitraffer: ein Foto vorher und eins nachher.", "The rise in a moment: a photo before and after, or a time-lapse."), scritta: T("Tempo, non fretta", "Zeit, keine Eile", "Time, not hurry") });
  const forma = cat === "focacce" ? T("Le dita che fanno i buchi nella focaccia in teglia.", "Die Finger drücken Mulden in die Focaccia im Blech.", "Fingers dimpling the focaccia in the pan.")
    : cat === "pizza" ? T("La pizza allargata con le dita nella teglia.", "Die Pizza wird mit den Fingern im Blech ausgebreitet.", "The pizza stretched with fingers in the pan.")
    : cat === "panini" ? T("I panini in fila: stringi ogni pallina sul tavolo.", "Die Brötchen in einer Reihe: jede Kugel auf dem Tisch straffen.", "The rolls in a row: tighten each ball on the table.")
    : cat === "panettoni" ? T("La pirlatura e il panettone nel pirottino.", "Das Rundwirken und der Panettone in der Papierform.", "Rounding and the panettone in its paper mould.")
    : cat === "snack" ? T("Le mani che chiudono gli anelli o formano i pezzi.", "Die Hände schließen die Ringe oder formen die Stücke.", "Hands closing the rings or shaping the pieces.")
    : T("La formatura: le mani che danno forma al pane.", "Das Formen: die Hände geben dem Brot seine Form.", "Shaping: hands giving the bread its form.");
  scene.push({ sec: "15-20", cosa: forma, scritta: T("Con le mani", "Mit den Händen", "By hand") });
  scene.push({ sec: "20-25", cosa: T("Il forno: lo sportello che si apre, o il pane che cresce dietro il vetro.", "Der Ofen: die Tür geht auf, oder das Brot wächst hinter der Scheibe.", "The oven: the door opening, or the bread rising behind the glass."), scritta: forno });
  scene.push({ sec: "25-30", cosa: T("Il taglio: la fetta che si apre e mostra la mollica. Poi il primo morso.", "Der Anschnitt: die Scheibe zeigt die Krume. Dann der erste Biss.", "The cut: the slice opens and shows the crumb. Then the first bite."), scritta: dove });
  const consigli = [
    T("Gira in verticale, vicino a una finestra, con il telefono fermo su un appoggio.", "Filme hochkant, nah an einem Fenster, das Handy fest aufgestellt.", "Film vertically, near a window, with the phone resting steady."),
    T("I primi 2 secondi decidono se la gente resta: parti sempre dal risultato.", "Die ersten 2 Sekunden entscheiden, ob man bleibt: fang immer mit dem Ergebnis an.", "The first 2 seconds decide if people stay: always start with the result."),
    T("20-40 secondi bastano. Scritte grandi e corte, e di' anche a voce il numero della ricetta.", "20-40 Sekunden reichen. Große, kurze Texte, und sag die Rezeptnummer auch laut.", "20-40 seconds is enough. Big, short captions, and say the recipe number out loud too."),
    T("Nella didascalia di TikTok i link non si toccano: per questo c'è il numero della ricetta.", "In der TikTok-Beschreibung kann man Links nicht antippen: dafür gibt es die Rezeptnummer.", "Links in a TikTok caption can't be tapped: that's what the recipe number is for."),
    T("Rispondi ai commenti con un video: è il modo più facile per trovare l'idea del prossimo.", "Antworte auf Kommentare mit einem Video: so findest du am leichtesten die nächste Idee.", "Answer comments with a video: it's the easiest way to find your next idea."),
  ];
  return { scene, consigli };
}
