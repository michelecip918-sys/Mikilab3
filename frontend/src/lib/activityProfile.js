// Profilo attività CONDIVISO: panificio / pizzeria / pasticceria.
// L'attività scelta in onboarding (localStorage "mikilab_activity") cambia DAVVERO
// contenuti e suggerimenti in PianoUnico, sezione Strumenti e PublicGate,
// non solo lo stile grafico.
import { mkTri } from "@/i18n/triMaps";

export function getActivity() {
  try { return localStorage.getItem("mikilab_activity") || "panificio"; } catch { return "panificio"; }
}

const PROFILES = {
  panificio: {
    id: "panificio", icon: "🥖", accent: "#E0A106",
    label: (l) => mkTri(l)("Panificio", "Backstube", "Bakery", "Panadería", "Boulangerie", "نانوایی"),
    paradigm: (l) => mkTri(l)(
      "Produzione a catena: impasto → lievitazione in celle grandi → cottura in sequenza.",
      "Fließproduktion: Teig → Gärung in großen Zellen → Backen in Folge.",
      "Chain production: dough → proofing in large cells → baking in sequence.",
      "Producción en cadena: masa → fermentación en cámaras grandes → cocción.",
      "Production en chaîne : pâte → pousse en chambres → cuisson.",
      "تولید زنجیره‌ای: خمیر ← تخمیر ← پخت."),
    planHint: (l) => mkTri(l)(
      "Sitor pianifica a lotti per saturare i forni, con lievitazioni in celle grandi.",
      "Sitor plant in Chargen, um die Öfen auszulasten.",
      "Sitor plans in batches to saturate the ovens, with large proofing cells.",
      "Sitor planifica por lotes para saturar los hornos.",
      "Sitor planifie par lots pour saturer les fours.",
      "سیتور دسته‌ای برنامه‌ریزی می‌کند تا فرها پر شوند."),
    orderPlaceholder: (l) => mkTri(l)(
      "Es: 200 baguette, 100 ciabatta, 50 pane integrale…",
      "Z.B.: 200 Baguette, 100 Ciabatta…",
      "e.g. 200 baguettes, 100 ciabatta, 50 wholewheat…",
      "Ej: 200 baguettes, 100 chapata…",
      "Ex : 200 baguettes, 100 ciabatta…",
      "مثلاً: ۲۰۰ باگت، ۱۰۰ چاباتا…"),
    toolsFocus: (l) => [
      mkTri(l)("Celle di lievitazione grandi e forni in sequenza", "Große Gärzellen und Öfen", "Large proofing cells & sequential ovens", "Cámaras grandes y hornos", "Grandes chambres & fours", "سلول‌های تخمیر بزرگ و فرها"),
      mkTri(l)("Silos e bilance per farine e sfarinati in volume", "Silos & Waagen für Mehl", "Silos & scales for bulk flours", "Silos y balanzas para harinas", "Silos & balances pour farines", "سیلو و ترازو برای آرد"),
      mkTri(l)("Controllo cottura ottico all'uscita del forno", "Optische Backkontrolle", "Optical bake control at oven exit", "Control óptico de cocción", "Contrôle optique de cuisson", "کنترل نوری پخت"),
    ],
    publicBlurb: (l) => mkTri(l)(
      "Il panificio come catena viva: impasti, celle e forni orchestrati da Sitor a lotti continui.",
      "Die Backstube als lebende Kette.",
      "The bakery as a living chain: doughs, cells and ovens orchestrated in continuous batches.",
      "La panadería como cadena viva.",
      "La boulangerie comme chaîne vivante.",
      "نانوایی به‌مثابه زنجیره‌ای زنده."),
    publicFeatures: (l) => [
      mkTri(l)("Piano a lotti per saturare i forni", "Chargenplan für Öfen", "Batch plan to saturate ovens", "Plan por lotes", "Plan par lots", "برنامه دسته‌ای"),
      mkTri(l)("Celle di lievitazione di grande volume", "Große Gärzellen", "Large-volume proofing cells", "Cámaras de gran volumen", "Grandes chambres de pousse", "سلول‌های تخمیر بزرگ"),
      mkTri(l)("Magazzino farine e sfarinati in volume", "Mehllager in Menge", "Bulk flour warehouse", "Almacén de harinas", "Stock de farines", "انبار آرد حجمی"),
    ],
  },
  pizzeria: {
    id: "pizzeria", icon: "🍕", accent: "#3E9C93",
    label: () => "Pizzeria",
    paradigm: (l) => mkTri(l)(
      "Produzione a flusso continuo / su richiesta: celle piccole ma più macchine (impastatrici, banco topping).",
      "Fließende Produktion: kleine Zellen, mehr Maschinen.",
      "Continuous / on-demand flow: small cells but more machines (mixers, topping bench).",
      "Flujo continuo / bajo pedido: cámaras pequeñas, más máquinas.",
      "Flux continu / à la demande : petites chambres, plus de machines.",
      "جریان پیوسته: سلول کوچک، ماشین بیشتر."),
    planHint: (l) => mkTri(l)(
      "Sitor pianifica panetti a scaglioni per il servizio, con impastatrici in parallelo e maturazione in frigo.",
      "Sitor plant Teiglinge in Schüben für den Service.",
      "Sitor plans dough balls in waves for service, parallel mixers and cold maturation.",
      "Sitor planifica bollos por tandas para el servicio.",
      "Sitor planifie les pâtons par vagues pour le service.",
      "سیتور چانه‌ها را مرحله‌ای برنامه‌ریزی می‌کند."),
    orderPlaceholder: (l) => mkTri(l)(
      "Es: 300 panetti da 260g, biga in frigo, servizio 18:00–23:00…",
      "Z.B.: 300 Teiglinge 260g, Biga…",
      "e.g. 300 dough balls 260g, cold biga, service 6–11pm…",
      "Ej: 300 bollos 260g, biga en frío…",
      "Ex : 300 pâtons 260g, biga au froid…",
      "مثلاً: ۳۰۰ چانه ۲۶۰ گرمی…"),
    toolsFocus: (l) => [
      mkTri(l)("Più impastatrici in parallelo e banco topping", "Mehrere Kneter & Topping-Bank", "Multiple parallel mixers & topping bench", "Varias amasadoras y mesa de topping", "Plusieurs pétrins & banc garniture", "چند خمیرگیر و میز تاپینگ"),
      mkTri(l)("Frigoriferi piccoli per maturazione panetti", "Kleine Kühlschränke", "Small fridges for dough-ball maturation", "Frigos pequeños para maduración", "Petits frigos de maturation", "یخچال‌های کوچک"),
      mkTri(l)("Forno pizza a ciclo rapido e continuo", "Schneller Pizzaofen", "Fast continuous pizza oven", "Horno de pizza rápido", "Four à pizza rapide", "فر پیتزای سریع"),
    ],
    publicBlurb: (l) => mkTri(l)(
      "La pizzeria a flusso continuo: impastatrici, maturazione in frigo e sfornate a ritmo di servizio.",
      "Die Pizzeria im kontinuierlichen Fluss.",
      "The pizzeria in continuous flow: mixers, cold maturation and bakes at service pace.",
      "La pizzería en flujo continuo.",
      "La pizzeria en flux continu.",
      "پیتزا در جریان پیوسته."),
    publicFeatures: (l) => [
      mkTri(l)("Piano a flusso continuo, non a lotti fissi", "Fließplan statt Chargen", "Continuous-flow plan, not fixed batches", "Plan de flujo continuo", "Plan en flux continu", "برنامه جریان پیوسته"),
      mkTri(l)("Più macchine: impastatrici multiple e topping", "Mehr Maschinen", "More machines: multiple mixers & topping", "Más máquinas", "Plus de machines", "ماشین‌های بیشتر"),
      mkTri(l)("Celle piccole per maturazione dei panetti", "Kleine Zellen", "Small cells for dough-ball maturation", "Cámaras pequeñas", "Petites chambres", "سلول‌های کوچک"),
    ],
  },
  pasticceria: {
    id: "pasticceria", icon: "🧁", accent: "#7FB0A6",
    label: (l) => mkTri(l)("Pasticceria", "Konditorei", "Pastry", "Pastelería", "Pâtisserie", "قنادی"),
    paradigm: (l) => mkTri(l)(
      "Produzione su commessa/eventi (torte, matrimoni): non a catena, pianificata a ritroso dalla consegna.",
      "Auftragsproduktion: keine Kette, rückwärts geplant.",
      "Made-to-order / events (cakes, weddings): not a chain, planned backward from delivery.",
      "Por encargo/eventos: no en cadena, planificada hacia atrás.",
      "Sur commande / événements : pas en chaîne, planifiée à rebours.",
      "سفارشی/رویداد: نه زنجیره‌ای، معکوس."),
    planHint: (l) => mkTri(l)(
      "Sitor pianifica a ritroso dalle date di consegna, con abbattitore e precisione al grammo.",
      "Sitor plant rückwärts ab Lieferdatum.",
      "Sitor plans backward from delivery dates, with blast chiller and gram precision.",
      "Sitor planifica hacia atrás desde las entregas.",
      "Sitor planifie à rebours depuis les livraisons.",
      "سیتور معکوس از تاریخ تحویل برنامه می‌ریزد."),
    orderPlaceholder: (l) => mkTri(l)(
      "Es: torta matrimonio 3 piani consegna sabato 15:00, 40 mignon domenica…",
      "Z.B.: Hochzeitstorte Samstag 15:00…",
      "e.g. 3-tier wedding cake delivery Sat 3pm, 40 mignon Sunday…",
      "Ej: tarta de boda sábado 15:00…",
      "Ex : pièce montée samedi 15h…",
      "مثلاً: کیک عروسی شنبه ۱۵:۰۰…"),
    toolsFocus: (l) => [
      mkTri(l)("Abbattitore e celle piccole per le commesse", "Schockfroster & kleine Zellen", "Blast chiller & small cells for orders", "Abatidor y cámaras pequeñas", "Cellule de refroidissement & petites chambres", "شوک‌سرد و سلول‌های کوچک"),
      mkTri(l)("Bilance di precisione al grammo per le ricette", "Präzisionswaagen", "Gram-precision scales for recipes", "Balanzas de precisión", "Balances de précision", "ترازوی دقیق"),
      mkTri(l)("Consegne & Eventi collegati al piano di produzione", "Lieferungen & Events im Plan", "Deliveries & Events linked to the plan", "Entregas y eventos en el plan", "Livraisons & événements dans le plan", "تحویل و رویداد در برنامه"),
    ],
    publicBlurb: (l) => mkTri(l)(
      "La pasticceria per commesse ed eventi: ogni torta pianificata a ritroso dalla consegna, con abbattitore e precisione al grammo.",
      "Die Konditorei für Aufträge und Events.",
      "The pastry shop for orders and events: every cake planned backward from delivery, blast chiller and gram precision.",
      "La pastelería por encargos y eventos.",
      "La pâtisserie pour commandes et événements.",
      "قنادی برای سفارش و رویداد."),
    publicFeatures: (l) => [
      mkTri(l)("Piano a ritroso da consegne ed eventi", "Rückwärtsplan ab Lieferung", "Backward plan from deliveries & events", "Plan hacia atrás", "Plan à rebours", "برنامه معکوس"),
      mkTri(l)("Abbattitore e celle piccole di precisione", "Schockfroster & kleine Zellen", "Blast chiller & small precision cells", "Abatidor y cámaras", "Cellule & petites chambres", "شوک‌سرد و سلول کوچک"),
      mkTri(l)("Consegne & Eventi collegati alla produzione", "Lieferungen & Events verknüpft", "Deliveries & Events linked to production", "Entregas y eventos", "Livraisons & événements", "تحویل و رویداد"),
    ],
  },
};

export function activityProfile(activity) {
  const a = (activity || "panificio").toLowerCase();
  if (a.startsWith("pizz")) return PROFILES.pizzeria;
  if (a.startsWith("pastic")) return PROFILES.pasticceria;
  return PROFILES.panificio;
}
