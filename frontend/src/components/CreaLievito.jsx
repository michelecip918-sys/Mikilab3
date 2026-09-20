import { useState, useMemo } from "react";
import { ChevronLeft, Wheat, Check, CalendarClock, Download, HelpCircle, MessageCircle } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { toast } from "sonner";
import SitorBadge from "@/components/SitorBadge";

// STADIO Y — "Crea il tuo lievito": licoli/solido di grano e Sauerteig di segale, da zero.
// Tutto sul dispositivo (localStorage). Nessun dato lascia il telefono. BOZZA da verificare da Michele.

const DONE_KEY = (v) => `mikilab_lievito_${v}`;
const getDone = (v) => { try { return JSON.parse(localStorage.getItem(DONE_KEY(v)) || "{}"); } catch { return {}; } };
const setDone = (v, obj) => { try { localStorage.setItem(DONE_KEY(v), JSON.stringify(obj)); } catch { /* */ } };

// Costruttore .ics: un evento al giorno alla stessa ora, per N giorni da OGGI, con allarme.
function pad(n) { return String(n).padStart(2, "0"); }
function icsStamp(d) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}
function esc(s) { return String(s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); }
function buildDailyIcs(title, days, when) {
  const [hh, mm] = when.split(":").map((x) => parseInt(x, 10));
  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}@mikilab`;
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MikiLab//Sitor//IT", "CALSCALE:GREGORIAN"];
  for (let i = 0; i < days; i++) {
    const start = new Date(); start.setHours(hh, mm, 0, 0); start.setDate(start.getDate() + i);
    const end = new Date(start.getTime() + 10 * 60000);
    ics.push("BEGIN:VEVENT", `UID:${uid()}`, `DTSTAMP:${icsStamp(new Date())}`,
      `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
      `SUMMARY:${esc(title)} — ${esc(`${i + 1}`)}`,
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(title)}`, "TRIGGER:PT0M", "END:VALARM",
      "END:VEVENT");
  }
  ics.push("END:VCALENDAR");
  return ics.join("\r\n");
}

// --- Contenuti (BOZZA di Sitor) ------------------------------------------------
const D = (it, de, en) => ({ it, de, en });

const LICOLI_DAYS = [
  { do: D("50 g di farina + 50 g di acqua a temperatura ambiente. Mescola fino a una pastella liscia.", "50 g Mehl + 50 g Wasser bei Zimmertemperatur. Zu einem glatten Brei rühren.", "50 g flour + 50 g water at room temperature. Stir to a smooth batter."),
    see: D("Ancora nulla: è presto.", "Noch nichts: es ist früh.", "Nothing yet: it's early."),
    normal: D("Nessuna bolla il primo giorno è normale.", "Keine Blasen am ersten Tag ist normal.", "No bubbles on day one is normal."),
    avoid: D("Non chiudere il barattolo a tenuta: appoggia solo il coperchio.", "Das Glas nicht luftdicht verschließen: Deckel nur auflegen.", "Do not seal the jar airtight: just rest the lid on top.") },
  { do: D("Tieni 50 g di impasto, butta il resto. Aggiungi 50 g di farina + 50 g di acqua.", "Behalte 50 g Teig, wirf den Rest weg. Gib 50 g Mehl + 50 g Wasser dazu.", "Keep 50 g of starter, discard the rest. Add 50 g flour + 50 g water."),
    see: D("Poche bolle qua e là.", "Ein paar Blasen hier und da.", "A few scattered bubbles."),
    normal: D("Poche bolle sono normali. Odore ancora neutro o di farina.", "Wenige Blasen sind normal. Geruch noch neutral oder mehlig.", "Few bubbles are normal. Smell still neutral or flour-like."),
    avoid: D("Non aggiungere lievito di birra per «aiutarlo».", "Keine Backhefe zum «Nachhelfen» dazugeben.", "Don't add baker's yeast to «help» it.") },
  { do: D("Rinfresca come al giorno 2 (50 g impasto + 50 g farina + 50 g acqua), ogni 24 ore.", "Wie an Tag 2 auffrischen (50 g Teig + 50 g Mehl + 50 g Wasser), alle 24 Stunden.", "Refresh like day 2 (50 g starter + 50 g flour + 50 g water), every 24 hours."),
    see: D("L'attività può calare, l'odore può diventare sgradevole (formaggio, acetone).", "Die Aktivität kann nachlassen, der Geruch unangenehm werden (Käse, Aceton).", "Activity may drop, the smell may turn unpleasant (cheese, acetone)."),
    normal: D("Odore sgradevole e poca attività nei primi giorni: è NORMALE.", "Unangenehmer Geruch und wenig Aktivität in den ersten Tagen: NORMAL.", "Bad smell and little activity in the first days: NORMAL."),
    avoid: D("Non buttarlo per l'odore: sta cambiando la flora.", "Nicht wegen des Geruchs wegwerfen: die Flora ändert sich.", "Don't throw it away over the smell: the flora is changing.") },
  { do: D("Continua a rinfrescare come al giorno 2, ogni 24 ore.", "Weiter wie an Tag 2 auffrischen, alle 24 Stunden.", "Keep refreshing like day 2, every 24 hours."),
    see: D("Forse qualche bolla in più, odore ancora acido.", "Vielleicht etwas mehr Blasen, Geruch noch sauer.", "Maybe a few more bubbles, smell still sour."),
    normal: D("Alti e bassi di attività: è NORMALE.", "Auf und Ab der Aktivität: NORMAL.", "Ups and downs in activity: NORMAL."),
    avoid: D("Non tenerlo al freddo: cerca i 26-28 °C.", "Nicht kühl stellen: ziel auf 26-28 °C.", "Don't keep it cold: aim for 26-28 °C.") },
  { do: D("Ora rinfresca OGNI 12 ORE (50 g impasto + 50 g farina + 50 g acqua).", "Jetzt ALLE 12 STUNDEN auffrischen (50 g Teig + 50 g Mehl + 50 g Wasser).", "Now refresh EVERY 12 HOURS (50 g starter + 50 g flour + 50 g water)."),
    see: D("Bolle regolari, il profumo diventa lattico, di yogurt.", "Regelmäßige Blasen, Duft wird milchig, nach Joghurt.", "Regular bubbles, the smell turns milky, yogurt-like."),
    normal: D("Il volume comincia a salire dopo il rinfresco.", "Das Volumen beginnt nach dem Auffrischen zu steigen.", "Volume starts to rise after refreshing."),
    avoid: D("Non saltare i rinfreschi: adesso ha fame.", "Auffrischungen nicht auslassen: jetzt hat er Hunger.", "Don't skip refreshes: now it's hungry.") },
  { do: D("Continua ogni 12 ore. Segna il livello con un elastico dopo il rinfresco.", "Weiter alle 12 Stunden. Stand nach dem Auffrischen mit Gummiband markieren.", "Keep going every 12 hours. Mark the level with a rubber band after refreshing."),
    see: D("Cresce e fa bolle in superficie.", "Er wächst und bildet Blasen an der Oberfläche.", "It grows and bubbles on the surface."),
    normal: D("Profumo lattico stabile, cresce di volume.", "Stabiler milchiger Duft, wächst im Volumen.", "Stable milky smell, growing in volume."),
    avoid: D("Non usarlo ancora: aspetta la prova dei 3 rinfreschi.", "Noch nicht verwenden: warte auf die 3-Auffrischungs-Probe.", "Don't use it yet: wait for the 3-refresh test.") },
  { do: D("Rinfresca e cronometra. Cerca il RADDOPPIO in 4-6 ore con bolle in superficie.", "Auffrischen und stoppen. Ziel: VERDOPPELUNG in 4-6 Stunden mit Oberflächenblasen.", "Refresh and time it. Look for DOUBLING in 4-6 hours with surface bubbles."),
    see: D("Se raddoppia in 4-6 ore, ci siamo quasi.", "Verdoppelt es in 4-6 Stunden, fast geschafft.", "If it doubles in 4-6 hours, almost there."),
    normal: D("A volte servono ancora un paio di giorni.", "Manchmal braucht es noch ein paar Tage.", "Sometimes it needs a couple more days."),
    avoid: D("Non fidarti di un solo raddoppio: servono TRE di fila.", "Nicht einem einzigen Verdoppeln trauen: DREI in Folge nötig.", "Don't trust a single doubling: you need THREE in a row.") },
  { do: D("Ripeti: rinfresco, elastico, cronometro. È il 2° raddoppio buono di fila?", "Wiederholen: auffrischen, Gummiband, Stoppuhr. Ist es die 2. gute Verdoppelung in Folge?", "Repeat: refresh, rubber band, timer. Is this the 2nd good doubling in a row?"),
    see: D("Raddoppio regolare in 4-6 ore.", "Regelmäßige Verdoppelung in 4-6 Stunden.", "Regular doubling in 4-6 hours."),
    normal: D("Profumo pieno di yogurt, tante bolle.", "Voller Joghurtduft, viele Blasen.", "Full yogurt smell, lots of bubbles."),
    avoid: D("Non lasciarlo affamato tra un rinfresco e l'altro.", "Zwischen Auffrischungen nicht aushungern lassen.", "Don't let it starve between refreshes.") },
  { do: D("Ancora un rinfresco cronometrato: è il 3° raddoppio buono di fila?", "Noch eine gestoppte Auffrischung: ist es die 3. gute Verdoppelung in Folge?", "One more timed refresh: is this the 3rd good doubling in a row?"),
    see: D("Tre raddoppi buoni di fila = è PRONTO.", "Drei gute Verdoppelungen in Folge = FERTIG.", "Three good doublings in a row = READY."),
    normal: D("Se non è ancora costante, dagli il giorno 10.", "Ist es noch nicht konstant, gib ihm Tag 10.", "If not steady yet, give it day 10."),
    avoid: D("Non passare al panettone: quello serve un lievito stabile da settimane.", "Nicht zum Panettone übergehen: dafür braucht es einen wochenlang stabilen Sauerteig.", "Don't jump to panettone: that needs a starter stable for weeks.") },
  { do: D("È pronto: passa al rinfresco 1:1:1 della scheda LiCoLi e tienilo in frigo tra un uso e l'altro.", "Fertig: wechsle zur 1:1:1-Auffrischung der LiCoLi-Karte und lagere ihn zwischen den Nutzungen im Kühlschrank.", "It's ready: switch to the 1:1:1 refresh in the LiCoLi card and keep it in the fridge between uses."),
    see: D("Raddoppia con costanza, profumo di yogurt.", "Verdoppelt konstant, Joghurtduft.", "Doubles consistently, yogurt smell."),
    normal: D("Se non raddoppia ancora, vedi «Come va?».", "Wenn es noch nicht verdoppelt, siehe «Wie läuft's?».", "If it doesn't double yet, see «How's it going?»."),
    avoid: D("Non chiuderlo a tenuta nemmeno in frigo.", "Auch im Kühlschrank nicht luftdicht verschließen.", "Don't seal it airtight even in the fridge.") },
];

// Solido di grano (idratazione 50%): stessa cadenza, dosi diverse.
const SOLIDO_DAYS = LICOLI_DAYS.map((d, i) => {
  const c = { ...d };
  if (i === 0) c.do = D("100 g di farina + 50 g di acqua: impasto SODO (idratazione 50%). Lavora fino a una palla liscia.", "100 g Mehl + 50 g Wasser: FESTER Teig (50% Hydration). Zu einer glatten Kugel kneten.", "100 g flour + 50 g water: a STIFF dough (50% hydration). Work to a smooth ball.");
  else if (i === 1) c.do = D("Tieni 50 g di impasto, butta il resto. Aggiungi 100 g di farina + 50 g di acqua.", "Behalte 50 g Teig, wirf den Rest weg. Gib 100 g Mehl + 50 g Wasser dazu.", "Keep 50 g of starter, discard the rest. Add 100 g flour + 50 g water.");
  else if (i >= 2 && i <= 3) c.do = D("Rinfresca come al giorno 2 (50 g impasto + 100 g farina + 50 g acqua), ogni 24 ore.", "Wie an Tag 2 auffrischen (50 g Teig + 100 g Mehl + 50 g Wasser), alle 24 Stunden.", "Refresh like day 2 (50 g starter + 100 g flour + 50 g water), every 24 hours.");
  else if (i >= 4 && i <= 5) c.do = D("Rinfresca OGNI 12 ORE (50 g impasto + 100 g farina + 50 g acqua).", "ALLE 12 STUNDEN auffrischen (50 g Teig + 100 g Mehl + 50 g Wasser).", "Refresh EVERY 12 HOURS (50 g starter + 100 g flour + 50 g water).");
  else if (i === 9) c.do = D("È pronto: passa al rinfresco della scheda «Lievito Madre Solido» e tienilo in frigo tra un uso e l'altro.", "Fertig: wechsle zur Auffrischung der Karte «Fester Sauerteig» und lagere ihn zwischen den Nutzungen im Kühlschrank.", "It's ready: switch to the refresh in the «Stiff Sourdough» card and keep it in the fridge between uses.");
  return c;
});

// Sauerteig di segale (7 giorni): segale integrale, acqua ~30 °C, più veloce e acido.
const SEGALE_DAYS = [
  { do: D("50 g di farina di segale integrale + 50 g di acqua a ~30 °C. Mescola: sarà appiccicoso.", "50 g Roggen-Vollkornmehl + 50 g Wasser bei ~30 °C. Rühren: es wird klebrig.", "50 g wholemeal rye flour + 50 g water at ~30 °C. Stir: it will be sticky."),
    see: D("Impasto denso e appiccicoso.", "Dichter, klebriger Teig.", "Thick, sticky paste."),
    normal: D("La segale resta più appiccicosa: è normale.", "Roggen bleibt klebriger: normal.", "Rye stays stickier: that's normal."),
    avoid: D("Non usare farina di grano qui: serve segale integrale.", "Hier kein Weizenmehl: es braucht Roggen-Vollkorn.", "Don't use wheat flour here: you need wholemeal rye.") },
  { do: D("Tieni 50 g, butta il resto. Aggiungi 50 g segale + 50 g acqua a ~30 °C.", "Behalte 50 g, wirf den Rest weg. Gib 50 g Roggen + 50 g Wasser bei ~30 °C dazu.", "Keep 50 g, discard the rest. Add 50 g rye + 50 g water at ~30 °C."),
    see: D("Prime bolle, odore acidulo.", "Erste Blasen, säuerlicher Geruch.", "First bubbles, slightly sour smell."),
    normal: D("La segale parte in fretta: bene.", "Roggen startet schnell: gut.", "Rye starts fast: good."),
    avoid: D("Non tenerlo sotto i 26 °C: rallenta.", "Nicht unter 26 °C halten: bremst.", "Don't keep it below 26 °C: it slows down.") },
  { do: D("Rinfresca ogni 24 ore (50 g impasto + 50 g segale + 50 g acqua ~30 °C).", "Alle 24 Stunden auffrischen (50 g Teig + 50 g Roggen + 50 g Wasser ~30 °C).", "Refresh every 24 hours (50 g starter + 50 g rye + 50 g water ~30 °C)."),
    see: D("Bolle e odore più acido, di frutta acida.", "Blasen und säuerlicher, fruchtiger Geruch.", "Bubbles and a more acidic, fruity smell."),
    normal: D("Diventa più acido del grano: è normale.", "Wird saurer als Weizen: normal.", "Turns more acidic than wheat: normal."),
    avoid: D("Non spaventarti dell'acidità.", "Vor der Säure nicht erschrecken.", "Don't be scared of the acidity.") },
  { do: D("Continua ogni 24 ore. Segna il livello con un elastico.", "Weiter alle 24 Stunden. Stand mit Gummiband markieren.", "Keep going every 24 hours. Mark the level with a rubber band."),
    see: D("Sale e ricade tra un rinfresco e l'altro.", "Steigt und fällt zwischen den Auffrischungen.", "Rises and falls between refreshes."),
    normal: D("Crescita rapida tipica della segale.", "Schnelles Wachstum typisch für Roggen.", "Fast growth typical of rye."),
    avoid: D("Non lasciarlo affamato troppo a lungo.", "Nicht zu lange aushungern lassen.", "Don't let it starve too long.") },
  { do: D("Rinfresca e cronometra: cerca il raddoppio in 3-4 ore.", "Auffrischen und stoppen: Verdoppelung in 3-4 Stunden anpeilen.", "Refresh and time it: aim for doubling in 3-4 hours."),
    see: D("Raddoppia in fretta con tante bolle.", "Verdoppelt schnell mit vielen Blasen.", "Doubles fast with lots of bubbles."),
    normal: D("La segale è più veloce del grano.", "Roggen ist schneller als Weizen.", "Rye is faster than wheat."),
    avoid: D("Non aspettare che ricada per usarlo.", "Nicht warten, bis er zusammenfällt.", "Don't wait until it collapses to use it.") },
  { do: D("Ripeti il rinfresco cronometrato: 2° raddoppio buono di fila?", "Gestoppte Auffrischung wiederholen: 2. gute Verdoppelung in Folge?", "Repeat the timed refresh: 2nd good doubling in a row?"),
    see: D("Raddoppio regolare in 3-4 ore.", "Regelmäßige Verdoppelung in 3-4 Stunden.", "Regular doubling in 3-4 hours."),
    normal: D("Odore acido pieno, tante bolle.", "Voller säuerlicher Geruch, viele Blasen.", "Full sour smell, lots of bubbles."),
    avoid: D("Non passare a ricette impegnative subito.", "Nicht sofort zu anspruchsvollen Rezepten.", "Don't jump to demanding recipes right away.") },
  { do: D("3° raddoppio buono di fila: è PRONTO. Passa alla scheda «Lievito Madre di Segale» e tienilo in frigo.", "3. gute Verdoppelung in Folge: FERTIG. Wechsle zur Karte «Roggensauerteig» und lagere ihn im Kühlschrank.", "3rd good doubling in a row: READY. Switch to the «Rye Sourdough» card and keep it in the fridge."),
    see: D("Raddoppia con costanza in 3-4 ore.", "Verdoppelt konstant in 3-4 Stunden.", "Doubles consistently in 3-4 hours."),
    normal: D("Usalo con i pani di segale e per acidità nei pani misti.", "Für Roggenbrote und Säure in Mischbroten.", "Use it for rye breads and acidity in mixed breads."),
    avoid: D("Non chiuderlo a tenuta nemmeno in frigo.", "Auch im Kühlschrank nicht luftdicht verschließen.", "Don't seal it airtight even in the fridge.") },
];

const VARIANTS = [
  { key: "grano_licoli", days: LICOLI_DAYS,
    name: D("Lievito madre di grano — licoli (100%)", "Weizensauerteig — LiCoLi (100%)", "Wheat sourdough — licoli (100%)"),
    intro: D("Il più semplice: pari peso di farina e acqua (100% di idratazione), tutto in un barattolo di vetro trasparente con un elastico sul livello e il coperchio appoggiato (non a tenuta). Tienilo a 26-28 °C, per esempio nel forno spento con la luce accesa; controlla con un termometro. Farina: 0 o 00 (in Germania Type 550) oppure integrale — con l'integrale spesso parte più in fretta.", "Der einfachste: gleiches Gewicht Mehl und Wasser (100% Hydration), alles in einem durchsichtigen Glas mit Gummiband am Stand und aufgelegtem Deckel (nicht dicht). Bei 26-28 °C halten, z. B. im ausgeschalteten Ofen mit Licht; mit Thermometer prüfen. Mehl: Type 550 oder Vollkorn — mit Vollkorn startet er oft schneller.", "The simplest: equal weights of flour and water (100% hydration), all in a clear glass jar with a rubber band on the level and the lid resting on top (not sealed). Keep at 26-28 °C, e.g. in the oven off with the light on; check with a thermometer. Flour: type 550 or wholemeal — wholemeal often starts faster.") },
  { key: "grano_solido", days: SOLIDO_DAYS,
    name: D("Lievito madre di grano — solido (50%)", "Weizensauerteig — fest (50%)", "Wheat sourdough — stiff (50%)"),
    intro: D("Impasto sodo: doppia farina rispetto all'acqua (idratazione 50%). Stesso barattolo e stessa temperatura del licoli. Più lento da gestire ma più dolce e stabile; è la base per i grandi lievitati.", "Fester Teig: doppelt so viel Mehl wie Wasser (50% Hydration). Gleiches Glas und gleiche Temperatur wie beim LiCoLi. Aufwändiger, aber milder und stabiler; die Basis für große Hefeteige.", "Stiff dough: twice as much flour as water (50% hydration). Same jar and temperature as the licoli. Slower to manage but sweeter and steadier; the base for large enriched doughs.") },
  { key: "segale", days: SEGALE_DAYS,
    name: D("Sauerteig di segale", "Roggensauerteig", "Rye sourdough"),
    intro: D("Un lievito diverso e più acido, con farina di segale integrale (Roggenmehl) e acqua a circa 30 °C (temperatura tra 26 e 30 °C). La segale fermenta più in fretta: di solito è pronto in 5-7 giorni. Resta più appiccicoso: è normale. Si usa con le ricette di segale e per dare acidità ai pani misti.", "Ein anderer, saurerer Sauerteig, mit Roggen-Vollkornmehl und Wasser bei etwa 30 °C (Temperatur zwischen 26 und 30 °C). Roggen fermentiert schneller: meist in 5-7 Tagen fertig. Bleibt klebriger: normal. Für Roggenrezepte und Säure in Mischbroten.", "A different, more acidic starter, with wholemeal rye flour and water at about 30 °C (temperature between 26 and 30 °C). Rye ferments faster: usually ready in 5-7 days. It stays stickier: that's normal. Used for rye recipes and to add acidity to mixed breads.") },
];

const TROUBLES = [
  { q: D("Nessuna bolla al giorno 3", "Keine Blasen an Tag 3", "No bubbles on day 3"),
    a: D("È normale: continua a rinfrescare ogni 24 ore e tieni i 26-28 °C.", "Normal: weiter alle 24 Stunden auffrischen und 26-28 °C halten.", "Normal: keep refreshing every 24 hours and hold 26-28 °C.") },
  { q: D("Odore di acetone o solvente", "Geruch nach Aceton oder Lösungsmittel", "Acetone or solvent smell"),
    a: D("Ha fame: rinfrescalo più spesso (passa ai rinfreschi ogni 12 ore).", "Er hat Hunger: öfter auffrischen (auf alle 12 Stunden umstellen).", "It's hungry: refresh more often (switch to every 12 hours).") },
  { q: D("Strato di liquido sopra", "Flüssigkeitsschicht oben", "Layer of liquid on top"),
    a: D("Non è muffa: mescola e rinfresca.", "Kein Schimmel: umrühren und auffrischen.", "It's not mould: stir and refresh.") },
  { q: D("Muffa a peluria o strisce rosa/arancioni", "Pelziger Schimmel oder rosa/orange Streifen", "Fuzzy mould or pink/orange streaks"),
    a: D("Butta tutto e ricomincia da capo.", "Alles wegwerfen und neu beginnen.", "Throw everything away and start over.") },
  { q: D("Non raddoppia al giorno 10", "Verdoppelt sich an Tag 10 nicht", "Not doubling by day 10"),
    a: D("Tienilo più caldo, aggiungi un po' di farina integrale e dagli altri 3 giorni.", "Wärmer stellen, etwas Vollkornmehl zugeben und 3 weitere Tage geben.", "Keep it warmer, add a little wholemeal flour and give it 3 more days.") },
];

export default function CreaLievito({ onBack }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const L = (o) => (o && (o[lang] || o.it)) || "";
  const [variant, setVariant] = useState(null);
  const [when, setWhen] = useState("18:00");
  const [done, setDoneState] = useState({});
  const [openTrouble, setOpenTrouble] = useState(null);

  const cur = useMemo(() => VARIANTS.find((v) => v.key === variant) || null, [variant]);

  const selectVariant = (k) => { setVariant(k); setDoneState(getDone(k)); setOpenTrouble(null); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const toggleDay = (n) => {
    setDoneState((prev) => { const next = { ...prev, [n]: !prev[n] }; setDone(variant, next); return next; });
  };
  const doneCount = cur ? cur.days.filter((_, i) => done[i + 1]).length : 0;

  const downloadIcs = () => {
    const title = `${tri("Crea il tuo lievito", "Erschaffe deinen Sauerteig", "Create your starter")} · ${L(cur.name)} · ${tri("Giorno", "Tag", "Day")}`;
    const ics = buildDailyIcs(title, cur.days.length, when);
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lievito_${variant}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast.success(tri("Promemoria scaricato!", "Erinnerung heruntergeladen!", "Reminder downloaded!"));
  };

  const askSitor = (dayIdx) => {
    const text = tri(
      `Sto creando il mio lievito (${L(cur.name)}), sono al giorno ${dayIdx + 1}. `,
      `Ich erschaffe meinen Sauerteig (${L(cur.name)}), ich bin an Tag ${dayIdx + 1}. `,
      `I'm creating my starter (${L(cur.name)}), I'm on day ${dayIdx + 1}. `);
    window.dispatchEvent(new CustomEvent("mikilab-open-chat"));
    setTimeout(() => window.dispatchEvent(new CustomEvent("mikilab-chat-prefill", { detail: { text } })), 120);
  };

  return (
    <div data-testid="crealievito-page" className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <button data-testid="crealievito-back" onClick={onBack} className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold"><ChevronLeft className="w-4 h-4" />{tri("Indietro", "Zurück", "Back")}</button>

      <div className="flex items-center gap-2"><Wheat className="w-6 h-6 text-primary" /><h1 className="font-display text-2xl font-black text-foreground">{tri("Crea il tuo lievito", "Erschaffe deinen Sauerteig", "Create your starter")}</h1></div>
      <SitorBadge size={22} />
      <span data-testid="crealievito-bozza" className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-foreground/10 text-muted-foreground">{tri("Bozza di Sitor: da verificare da Michele", "Sitor-Entwurf: von Michele zu prüfen", "Sitor draft: to be verified by Michele")}</span>
      <p className="text-[13px] text-muted-foreground">{tri(
        "Qui impari a farti il lievito DA ZERO. Tutti i tempi sono indicativi e dipendono dalla temperatura. Niente promesse: il lievito è vivo. Tutto resta sul tuo dispositivo.",
        "Hier lernst du, deinen Sauerteig VON GRUND AUF zu machen. Alle Zeiten sind Richtwerte und hängen von der Temperatur ab. Keine Versprechen: Sauerteig lebt. Alles bleibt auf deinem Gerät.",
        "Here you learn to make your starter FROM SCRATCH. All times are indicative and depend on temperature. No promises: a starter is alive. Everything stays on your device.")}</p>

      {!cur && (
        <>
          <div data-testid="crealievito-variants" className="space-y-3">
            {VARIANTS.map((v) => (
              <button key={v.key} data-testid={`crealievito-pick-${v.key}`} onClick={() => selectVariant(v.key)}
                className="w-full text-left rounded-2xl border border-border bg-background p-4 hover:border-primary active:scale-[0.99] transition-all">
                <p className="font-display text-lg font-bold text-foreground">{L(v.name)}</p>
                <p className="text-[13px] text-muted-foreground mt-1">{L(v.intro)}</p>
              </button>
            ))}
          </div>
          <div data-testid="crealievito-skip" className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm text-foreground font-bold mb-1">{tri("Ho già un lievito", "Ich habe schon einen Sauerteig", "I already have a starter")}</p>
            <p className="text-[13px] text-muted-foreground">{tri(
              "Se te l'ha dato un panificio o è secco da riattivare, salta la creazione: apri una ricetta con lievito madre o licoli e segui la scheda «Controllo del lievito».",
              "Wenn du ihn aus einer Bäckerei hast oder ihn aus Trockensauerteig reaktivierst, überspringe die Erschaffung: öffne ein Rezept mit Sauerteig/LiCoLi und folge der Karte «Kontrolle des Sauerteigs».",
              "If a bakery gave it to you or you're reactivating a dried one, skip the creation: open a recipe with sourdough or licoli and follow the «Starter check» card.")}</p>
          </div>
        </>
      )}

      {cur && (
        <div className="space-y-4">
          <button data-testid="crealievito-change" onClick={() => setVariant(null)} className="text-xs font-bold text-primary">{tri("← Cambia percorso", "← Weg wechseln", "← Change path")}</button>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="font-display text-lg font-bold text-foreground">{L(cur.name)}</p>
            <p className="text-[13px] text-foreground/80 mt-1">{L(cur.intro)}</p>
          </div>

          {/* Progressi */}
          <div data-testid="crealievito-progress" className="rounded-2xl border border-border bg-background p-3.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-black uppercase tracking-wide text-primary">{tri("I miei progressi", "Mein Fortschritt", "My progress")}</p>
              <p className="text-xs font-bold text-foreground">{doneCount}/{cur.days.length} {tri("giorni", "Tage", "days")}</p>
            </div>
            <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${(doneCount / cur.days.length) * 100}%` }} />
            </div>
          </div>

          {/* Promemoria .ics */}
          <div data-testid="crealievito-ics" className="rounded-2xl border border-accent/40 bg-accent/10 p-3.5">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-accent-foreground mb-2"><CalendarClock className="w-3.5 h-3.5" />{tri("Promemoria nel calendario", "Erinnerung im Kalender", "Calendar reminders")}</p>
            <p className="text-[12px] text-muted-foreground mb-2">{tri("Un promemoria al giorno alla stessa ora, da oggi. Il file resta sul tuo dispositivo.", "Eine Erinnerung pro Tag zur gleichen Zeit, ab heute. Die Datei bleibt auf deinem Gerät.", "One reminder a day at the same time, starting today. The file stays on your device.")}</p>
            <div className="flex items-center gap-2">
              <input data-testid="crealievito-time" type="time" value={when} onChange={(e) => setWhen(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm font-bold bg-background border border-border text-foreground outline-none" />
              <button data-testid="crealievito-download" onClick={downloadIcs} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-95">
                <Download className="w-4 h-4" />{tri("Scarica .ics", "Als .ics laden", "Download .ics")}
              </button>
            </div>
          </div>

          {/* Giorni */}
          <div className="space-y-3">
            {cur.days.map((d, i) => {
              const n = i + 1; const isDone = !!done[n];
              return (
                <div key={n} data-testid={`crealievito-day-${n}`} className={`rounded-2xl border p-4 transition-all ${isDone ? "border-salvia/50 bg-salvia/8" : "border-border bg-background"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-display text-base font-black text-foreground">{tri("Giorno", "Tag", "Day")} {n}</p>
                    <button data-testid={`crealievito-done-${n}`} onClick={() => toggleDay(n)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border active:scale-95 transition-all ${isDone ? "bg-salvia text-white border-salvia" : "bg-background border-border text-muted-foreground"}`}>
                      <Check className="w-3.5 h-3.5" />{isDone ? tri("Fatto", "Erledigt", "Done") : tri("Ho fatto oggi", "Heute erledigt", "Done today")}
                    </button>
                  </div>
                  <p className="text-[14px] text-foreground font-medium">{L(d.do)}</p>
                  <div className="grid gap-1.5 mt-2 text-[12.5px]">
                    <p className="text-muted-foreground"><b className="text-foreground">{tri("Cosa vedi/annusi:", "Was du siehst/riechst:", "What you see/smell:")}</b> {L(d.see)}</p>
                    <p className="text-salvia"><b>{tri("È normale:", "Ist normal:", "Normal:")}</b> {L(d.normal)}</p>
                    <p className="text-mattone"><b>{tri("Non fare:", "Nicht tun:", "Don't:")}</b> {L(d.avoid)}</p>
                  </div>
                  <button data-testid={`crealievito-ask-${n}`} onClick={() => askSitor(i)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                    <MessageCircle className="w-3.5 h-3.5" />{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Come va? */}
          <div data-testid="crealievito-troubles" className="rounded-2xl border border-border bg-background p-3.5">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-primary mb-2"><HelpCircle className="w-3.5 h-3.5" />{tri("Come va?", "Wie läuft's?", "How's it going?")}</p>
            <div className="space-y-1.5">
              {TROUBLES.map((t, i) => (
                <div key={i} className="rounded-lg border border-border/60 overflow-hidden">
                  <button data-testid={`crealievito-trouble-${i}`} onClick={() => setOpenTrouble(openTrouble === i ? null : i)}
                    className="w-full text-left px-3 py-2 text-[13px] font-bold text-foreground bg-foreground/[0.03] active:scale-[0.99]">{L(t.q)}</button>
                  {openTrouble === i && <p className="px-3 py-2 text-[13px] text-muted-foreground border-t border-border/60">{L(t.a)}</p>}
                </div>
              ))}
            </div>
            <button data-testid="crealievito-ask-general" onClick={() => askSitor(doneCount)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              <MessageCircle className="w-3.5 h-3.5" />{tri("Chiedi a Sitor", "Frag Sitor", "Ask Sitor")}
            </button>
          </div>

          {/* Nota finale */}
          <div data-testid="crealievito-note" className="rounded-2xl border border-mattone/30 bg-mattone/5 p-4">
            <p className="text-[13px] text-foreground">{tri(
              "Nota: prima di un panettone il lievito deve essere stabile da settimane (rinfrescato con regolarità). I tempi qui sopra sono indicativi e cambiano con la temperatura.",
              "Hinweis: vor einem Panettone muss der Sauerteig seit Wochen stabil sein (regelmäßig aufgefrischt). Die Zeiten oben sind Richtwerte und ändern sich mit der Temperatur.",
              "Note: before a panettone the starter must be stable for weeks (refreshed regularly). The times above are indicative and change with temperature.")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
