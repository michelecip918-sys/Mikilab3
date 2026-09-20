import { useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { recipeCategory } from "@/lib/recipeCats";
import { isBakeOrFry } from "@/components/RecipeScheme";

const MODE_KEY = "mikilab_recipe_mode"; // "casa" | "esperto" (lo stesso usato da Cucina con Sitor)

// V77 — Casa o Laboratorio: cambiano la persona, il luogo, gli attrezzi e il modo di lavorare.
// Indicazioni generali costruite dai dati della ricetta (categoria, forno, lievitazione): nessuna IA.
export function buildRows(r, tri) {
  const cat = recipeCategory(r).key;
  const name = (r.name || "").toLowerCase();
  const laminated = /sfogliat/i.test(r.method_type || "") || /croissant|danish|plunder|cornett|sfoglia/.test(name);
  const fried = cat === "fritti";
  const crust = ["pane", "panini", "focacce", "pizza"].includes(cat);
  const festive = cat === "panettoni";
  const bt = r.bake_temp ? Math.round(r.bake_temp) : null;
  const long = (r.bulk_fermentation_hours || 0) >= 6;
  const rows = [];

  rows.push({ k: "chi", label: tri("Chi lavora", "Wer arbeitet", "Who works"),
    casa: tri("Tu, a casa, senza fretta: un impasto alla volta.", "Du, zu Hause, ohne Eile: ein Teig nach dem anderen.", "You, at home, no rush: one dough at a time."),
    lab: tri("Un panettiere professionista, con orari di produzione e, se serve, una squadra.", "Ein Bäcker vom Fach, mit Produktionszeiten und bei Bedarf einem Team.", "A professional baker, working to a production schedule and, if needed, a team.") });
  rows.push({ k: "dove", label: tri("Dove", "Wo", "Where"),
    casa: tri("Cucina di casa: piano di lavoro libero, forno e frigo domestici.", "Heimküche: freie Arbeitsfläche, Haushaltsofen und Kühlschrank.", "Home kitchen: a clear worktop, household oven and fridge."),
    lab: tri("Laboratorio: banco di lavoro, camera di lievitazione, cella frigo, forno professionale.", "Backstube: Arbeitstisch, Gärraum, Kühlzelle, Profi-Ofen.", "Bakery: work bench, proofing chamber, cold room, professional oven.") });
  rows.push({ k: "impasto", label: tri("Impasto", "Kneten", "Mixing"),
    casa: laminated
      ? tri("A mano o con planetaria; il burro si lavora con il mattarello e il frigo di casa tiene la sfoglia fredda.", "Von Hand oder mit Küchenmaschine; die Butter wird mit dem Nudelholz eingearbeitet, der Kühlschrank hält den Teig kühl.", "By hand or stand mixer; the butter is worked with a rolling pin and the home fridge keeps the dough cold.")
      : tri("A mano (con le pieghe) o con la planetaria da cucina.", "Von Hand (mit Dehnen und Falten) oder mit der Küchenmaschine.", "By hand (with folds) or with a kitchen stand mixer."),
    lab: laminated
      ? tri("Impastatrice a spirale, sfogliatrice e cella frigo per il burro: tutto a temperatura controllata.", "Spiralkneter, Ausrollmaschine und Kühlzelle für die Butter: alles temperaturkontrolliert.", "Spiral mixer, dough sheeter and cold room for the butter: everything at controlled temperature.")
      : tri("Impastatrice a spirale: 1ª e 2ª velocità, con controllo della temperatura finale dell'impasto (spesso 24-26 °C).", "Spiralkneter: 1. und 2. Stufe, mit Kontrolle der Teigtemperatur (oft 24-26 °C).", "Spiral mixer: 1st and 2nd speed, with control of the final dough temperature (often 24-26 °C).") });
  rows.push({ k: "lievitazione", label: tri("Lievitazione", "Gare", "Proofing"),
    casa: tri("Ambiente di casa (20-24 °C), forno spento con la luce accesa, oppure il frigo per i tempi lunghi.", "Raumtemperatur (20-24 °C), ausgeschalteter Ofen mit Licht, oder der Kühlschrank für lange Zeiten.", "Room temperature (20-24 °C), a switched-off oven with the light on, or the fridge for long rises."),
    lab: festive
      ? tri("Camera di lievitazione a 28-30 °C con umidità controllata.", "Gärraum bei 28-30 °C mit geregelter Feuchtigkeit.", "Proofing chamber at 28-30 °C with controlled humidity.")
      : tri("Camera di lievitazione a temperatura e umidità controllate (per esempio 26-28 °C); cella a 4 °C per la maturazione.", "Gärraum mit geregelter Temperatur und Feuchtigkeit (zum Beispiel 26-28 °C); Kühlzelle bei 4 °C zur Reifung.", "Proofing chamber with controlled temperature and humidity (for example 26-28 °C); cold room at 4 °C for maturation.") });
  if (fried) {
    rows.push({ k: "forno", label: tri("Frittura", "Frittieren", "Frying"),
      casa: tri("Pentola alta riempita al massimo a metà, olio a 170-180 °C con il termometro, mai incustodita.", "Hoher Topf, höchstens halb gefüllt, Öl bei 170-180 °C mit Thermometer, nie unbeaufsichtigt.", "Tall pot filled at most halfway, oil at 170-180 °C checked with a thermometer, never unattended."),
      lab: tri("Friggitrice professionale con termostato e cestello, olio filtrato e cambiato secondo le regole del laboratorio.", "Profi-Fritteuse mit Thermostat und Korb, Öl gefiltert und nach Betriebsregeln gewechselt.", "Professional fryer with thermostat and basket, oil filtered and changed according to bakery rules.") });
  } else {
    rows.push({ k: "forno", label: tri("Forno", "Ofen", "Oven"),
      casa: bt
        ? tri(`Forno di casa (al massimo circa 250 °C): preriscalda a ${Math.min(bt, 250)} °C con teglia o pietra${bt > 250 ? `. La ricetta prevede ${bt} °C: a casa il risultato sarà diverso` : ""}.`,
            `Haushaltsofen (maximal etwa 250 °C): auf ${Math.min(bt, 250)} °C vorheizen, mit Blech oder Stein${bt > 250 ? `. Das Rezept sieht ${bt} °C vor: zu Hause fällt das Ergebnis anders aus` : ""}.`,
            `Home oven (about 250 °C at most): preheat to ${Math.min(bt, 250)} °C with a tray or stone${bt > 250 ? `. The recipe calls for ${bt} °C: at home the result will differ` : ""}.`)
        : tri("Forno di casa (al massimo circa 250 °C), con teglia o pietra preriscaldata.", "Haushaltsofen (maximal etwa 250 °C), mit vorgeheiztem Blech oder Stein.", "Home oven (about 250 °C at most), with a preheated tray or stone."),
      lab: bt
        ? tri(`Forno a platea o rotativo, ${bt} °C come da ricetta.`, `Deck- oder Etagenofen, ${bt} °C laut Rezept.`, `Deck or rotary oven, ${bt} °C as per the recipe.`)
        : tri("Forno a platea o rotativo, temperatura come da ricetta.", "Deck- oder Etagenofen, Temperatur laut Rezept.", "Deck or rotary oven, temperature as per the recipe.") });
  }
  if (crust) rows.push({ k: "vapore", label: tri("Vapore", "Dampf", "Steam"),
    casa: tri("Pentola coperta oppure una teglia con acqua calda sul fondo, per i primi 10-15 minuti.", "Abgedeckter Topf oder ein Blech mit heißem Wasser am Boden, für die ersten 10-15 Minuten.", "A covered pot or a tray with hot water at the bottom, for the first 10-15 minutes."),
    lab: tri("Iniezione di vapore del forno.", "Dampfstoß des Ofens.", "The oven's steam injection.") });
  rows.push({ k: "quantita", label: tri("Quantità", "Menge", "Quantity"),
    casa: tri("Le dosi della ricetta: una o due infornate.", "Die Mengen des Rezepts: ein oder zwei Backvorgänge.", "The recipe's quantities: one or two batches."),
    lab: tri("Si lavora a lotti: le dosi si ricalcolano con la scala Laboratorio.", "Man arbeitet in Chargen: die Mengen werden mit der Laborskala neu berechnet.", "You work in batches: quantities are recalculated with the Laboratory scale.") });
  if (long) rows.push({ k: "tempi", label: tri("Organizzazione", "Organisation", "Planning"),
    casa: tri("Programma la giornata: impasto la sera, maturazione lunga di notte, si inforna al mattino.", "Plane den Tag: abends kneten, lange Reifung über Nacht, morgens backen.", "Plan your day: mix in the evening, long rise overnight, bake in the morning."),
    lab: tri("Si pianifica sui turni: impasto a fine giornata, cella di notte, infornata all'alba.", "Man plant nach Schichten: Kneten am Ende des Tages, Kühlzelle über Nacht, Backen im Morgengrauen.", "Planned around shifts: mix at the end of the day, cold room overnight, bake at dawn.") });
  rows.push({ k: "controllo", label: tri("Controlli", "Kontrollen", "Checks"),
    casa: tri("Bilancia da cucina e, se ce l'hai, una sonda per la temperatura al cuore.", "Küchenwaage und, wenn vorhanden, ein Einstechthermometer.", "Kitchen scale and, if you have one, a probe thermometer."),
    lab: tri("Bilancia di precisione, termometro, timer di produzione e registro dei lotti.", "Präzisionswaage, Thermometer, Produktions-Timer und Chargenprotokoll.", "Precision scale, thermometer, production timers and a batch log.") });
  return rows;
}

export default function CasaLab({ recipe }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [mode, setMode] = useState(() => { try { return localStorage.getItem(MODE_KEY) === "esperto" ? "esperto" : "casa"; } catch { return "casa"; } });
  const [open, setOpen] = useState(false);
  if (!recipe || !isBakeOrFry(recipe)) return null; // basi, creme e preparazioni senza cottura: niente confronto Casa/Laboratorio
  const pick = (m) => { setMode(m); try { localStorage.setItem(MODE_KEY, m); } catch { /* */ } };
  const rows = buildRows(recipe, tri);
  const isCasa = mode === "casa";
  return (
    <div data-testid="casa-lab" className="rounded-2xl border border-border bg-background/60 p-3 no-print">
      <button data-testid="casa-lab-toggle" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 text-left">
        <span>
          <span className="block text-[11px] font-black uppercase tracking-wide text-muted-foreground">{tri("Casa o Laboratorio", "Zu Hause oder Backstube", "Home or Bakery")}</span>
          <span className="block text-[13px] text-foreground/80">{tri("Cambiano la persona, il luogo, gli attrezzi e il modo di lavorare.", "Es ändern sich Person, Ort, Geräte und Arbeitsweise.", "The person, the place, the tools and the way of working all change.")}</span>
        </span>
        <span className="text-muted-foreground text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button data-testid="casa-lab-casa" onClick={() => pick("casa")} className={`py-2 rounded-xl text-sm font-bold border active:scale-95 ${isCasa ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground"}`}>🏠 {tri("Casa", "Zu Hause", "Home")}</button>
            <button data-testid="casa-lab-lab" onClick={() => pick("esperto")} className={`py-2 rounded-xl text-sm font-bold border active:scale-95 ${!isCasa ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground"}`}>👨‍🍳 {tri("Laboratorio", "Backstube", "Bakery")}</button>
          </div>
          <div className="space-y-2" data-testid="casa-lab-rows">
            {rows.map((row) => (
              <div key={row.k} className="rounded-xl bg-foreground/5 px-3 py-2">
                <p className="text-[11px] font-bold text-muted-foreground">{row.label}</p>
                <p data-testid={`casa-lab-${row.k}`} className="text-[14px] text-foreground leading-snug">{isCasa ? row.casa : row.lab}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">{tri("Le dosi della ricetta restano le stesse. Sono indicazioni generali, non provate ricetta per ricetta.", "Die Mengen des Rezepts bleiben gleich. Das sind allgemeine Hinweise, nicht Rezept für Rezept getestet.", "The recipe's quantities stay the same. These are general guidelines, not tested recipe by recipe.")}</p>
        </div>
      )}
    </div>
  );
}
