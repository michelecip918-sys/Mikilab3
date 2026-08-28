// Metadati SEO / Open Graph per lingua (aggiornati lato client + usati dall'endpoint /api/share).
export const META = {
  it: {
    title: "MikiLab — Panificazione, Pizzeria & Pasticceria | 100% gratis",
    description:
      "MikiLab è il laboratorio completo del fornaio, 100% gratis: ricette col metodo di Michele, piani di produzione con l'IA, food cost e diagnosi dell'impasto. Panificazione, pizzeria e pasticceria in un'unica app.",
    ogTitle: "MikiLab — Panificazione, Pizzeria & Pasticceria",
    ogDescription:
      "Il laboratorio completo del fornaio: ricette, piani di produzione con l'IA e food cost. 100% gratis, nessun pagamento.",
    locale: "it_IT",
  },
  en: {
    title: "MikiLab — Bakery, Pizzeria & Pastry Lab | 100% free",
    description:
      "MikiLab is the baker's complete workshop, 100% free: recipes with Michele's method, AI production plans, food cost and dough diagnosis. Bakery, pizzeria and pastry in one app.",
    ogTitle: "MikiLab — Bakery, Pizzeria & Pastry Lab",
    ogDescription:
      "The baker's complete workshop: recipes, AI production plans and food cost. 100% free, no payment.",
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
    title: "MikiLab — Bäckerei, Pizzeria & Konditorei | 100% kostenlos",
    description:
      "MikiLab ist die komplette Backstube, 100% kostenlos: Rezepte nach Micheles Methode, KI-Produktionspläne, Food Cost und Teig-Diagnose. Bäckerei, Pizzeria und Konditorei in einer App.",
    ogTitle: "MikiLab — Bäckerei, Pizzeria & Konditorei",
    ogDescription:
      "Die komplette Backstube: Rezepte, KI-Produktionspläne und Food Cost. 100% kostenlos, keine Zahlung.",
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
  const ogImg = `${origin}/og-${META[lang] ? lang : "it"}.jpg`;
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
