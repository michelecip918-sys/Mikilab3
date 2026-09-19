// Metadati SEO / Open Graph per lingua (aggiornati lato client + usati dall'endpoint /api/share).
export const META = {
  it: {
    title: "MikiLab — Il Manuale di Sitor | ricette gratis per casa",
    description:
      "Il Manuale di Sitor: le ricette di pane, pizza e dolci spiegate passo-passo per farle a casa. Dosi ricalcolate per il forno di casa e la guida di Sitor. Gratis.",
    ogTitle: "MikiLab — Il Manuale di Sitor",
    ogDescription:
      "Ricette di pane, pizza e dolci spiegate passo-passo per la cucina di casa, con la guida di Sitor. Gratis.",
    locale: "it_IT",
  },
  en: {
    title: "MikiLab — Sitor's Manual | free home recipes",
    description:
      "Sitor's Manual: bread, pizza and pastry recipes explained step-by-step to make at home. Doses recalculated for the home oven, guided by Sitor. Free.",
    ogTitle: "MikiLab — Sitor's Manual",
    ogDescription:
      "Bread, pizza and pastry recipes explained step-by-step for home cooking, guided by Sitor. Free.",
    locale: "en_US",
  },
  es: {
    title: "MikiLab — Panadería, Pizzería y Pastelería | 100% gratis",
    description:
      "MikiLab es el laboratorio completo del panadero, 100% gratis: recetas con el método de Michele, planes de producción con IA, food cost y diagnóstico de la masa. Panadería, pizzería y pastelería en una app.",
    ogTitle: "MikiLab — Panadería, Pizzería y Pastelería",
    ogDescription:
      "El laboratorio completo del panadero: recetas, planes de producción con IA y food cost. 100% gratis, sin pagos.",
    locale: "es_ES",
  },
  fr: {
    title: "MikiLab — Boulangerie, Pizzeria & Pâtisserie | 100% gratuit",
    description:
      "MikiLab est le laboratoire complet du boulanger, 100% gratuit : recettes avec la méthode de Michele, plans de production IA, food cost et diagnostic de la pâte. Boulangerie, pizzeria et pâtisserie dans une seule app.",
    ogTitle: "MikiLab — Boulangerie, Pizzeria & Pâtisserie",
    ogDescription:
      "Le laboratoire complet du boulanger : recettes, plans de production IA et food cost. 100% gratuit, sans paiement.",
    locale: "fr_FR",
  },
  de: {
    title: "MikiLab — Sitors Handbuch | kostenlose Rezepte für zu Hause",
    description:
      "Sitors Handbuch: Rezepte für Brot, Pizza und Süßes, Schritt für Schritt erklärt zum Nachmachen zu Hause. Mengen für den Hausofen umgerechnet, geführt von Sitor. Kostenlos.",
    ogTitle: "MikiLab — Sitors Handbuch",
    ogDescription:
      "Rezepte für Brot, Pizza und Süßes, Schritt für Schritt für die Küche zu Hause, geführt von Sitor. Kostenlos.",
    locale: "de_DE",
  },
  fa: {
    title: "MikiLab — نانوایی، پیتزا و شیرینی‌پزی | ۱۰۰٪ رایگان",
    description:
      "میکی‌لب کارگاه کامل نانوا است، ۱۰۰٪ رایگان: دستورها به روش میکله، برنامه‌های تولید با هوش مصنوعی، محاسبه هزینه و تشخیص خمیر.",
    ogTitle: "MikiLab — نانوایی، پیتزا و شیرینی‌پزی",
    ogDescription: "کارگاه کامل نانوا: دستورها، برنامه تولید با هوش مصنوعی و محاسبه هزینه. ۱۰۰٪ رایگان.",
    locale: "fa_IR",
  },
};

export function metaFor(lang) {
  return META[lang] || META.it;
}

// Aggiorna <title> e i meta tag OG/Twitter lato client in base alla lingua.
export function applyMeta(lang) {
  if (typeof document === "undefined") return;
  const m = metaFor(lang);
  const origin = window.location.origin;
  const ogImg = `${origin}/hero-ricette.jpg`;
  document.title = m.title;

  const set = (sel, attr, val) => {
    let el = document.head.querySelector(sel);
    if (!el) {
      el = document.createElement("meta");
      const [a, v] = sel.replace(/^meta\[/, "").replace(/\]$/, "").split("=");
      el.setAttribute(a, v.replace(/["']/g, ""));
      document.head.appendChild(el);
    }
    el.setAttribute(attr, val);
  };

  set('meta[name="description"]', "content", m.description);
  set('meta[property="og:title"]', "content", m.ogTitle);
  set('meta[property="og:description"]', "content", m.ogDescription);
  set('meta[property="og:image"]', "content", ogImg);
  set('meta[property="og:locale"]', "content", m.locale);
  set('meta[property="og:url"]', "content", origin + "/");
  set('meta[name="twitter:title"]', "content", m.ogTitle);
  set('meta[name="twitter:description"]', "content", m.ogDescription);
  set('meta[name="twitter:image"]', "content", ogImg);
}
