// V137 — L'INDIRIZZO DECIDE LA LINGUA. Ogni pagina pubblica ha tre indirizzi, uno per lingua:
//   mikilab.de/it/…  italiano   ·   mikilab.de/de/…  tedesco   ·   mikilab.de/en/…  inglese
// L'indirizzo senza prefisso (mikilab.de/…) resta valido per sempre: sceglie la lingua di chi entra (scelta salvata,
// poi lingua del telefono) e dichiara come pagina «buona» quella col prefisso. Così Google trova l'italiano a un
// indirizzo tutto suo, senza che il sito debba riconoscerlo. Prima l'italiano stava solo sull'indirizzo senza
// prefisso: lì Google, che ha il browser in inglese, vedeva l'inglese e scartava la pagina italiana come doppione.
// Qui stanno le funzioni comuni alle ricette (recipeSeo) e alle pagine (pagine). Niente rete, niente dati.
export const SITO = "https://mikilab.de";
export const LINGUE = ["it", "de", "en"];

// La lingua che va nell'indirizzo: it, de oppure en (qualunque altra cosa → it).
export function linguaIndirizzo(lang) {
  return lang === "de" || lang === "en" ? lang : "it";
}

// <link rel="canonical">: sempre uno solo. Lo crea se manca (in index.html non c'è più quello fisso).
export function setCanonical(href) {
  try {
    const tutti = document.head.querySelectorAll('link[rel="canonical"]');
    let el = tutti[0];
    for (let i = 1; i < tutti.length; i += 1) tutti[i].remove();
    if (!el) { el = document.createElement("link"); el.setAttribute("rel", "canonical"); document.head.appendChild(el); }
    el.setAttribute("href", href);
  } catch { /* */ }
}

// <link rel="alternate" hreflang>: la stessa pagina nelle tre lingue. x-default (chi parla un'altra lingua) va
// all'inglese, come fa già il sito con le lingue che non ha.
export function setHreflang(perLingua) {
  try {
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    if (!perLingua) return;
    const voci = [["it", perLingua.it], ["de", perLingua.de], ["en", perLingua.en], ["x-default", perLingua.en]];
    for (const [codice, href] of voci) {
      if (!href) continue;
      const el = document.createElement("link");
      el.setAttribute("rel", "alternate");
      el.setAttribute("hreflang", codice);
      el.setAttribute("href", href);
      document.head.appendChild(el);
    }
  } catch { /* */ }
}

// Home nelle tre lingue (serve a pagine.js e a recipeSeo.js quando si chiude una ricetta).
export function indirizziHome() {
  return { it: `${SITO}/it/`, de: `${SITO}/de/`, en: `${SITO}/en/` };
}
