import { mkTri } from "@/i18n/triMaps";

// Suggerimenti "DOVE comprare" per categoria di ingrediente/attrezzo.
// mkTri(lang)(it, de, en, es, fr, fa)
const SUG = {
  farine: (lang) => mkTri(lang)(
    "Mulino di zona · negozio bio · online (farine tipo 0/1/integrale, semola, Manitoba)",
    "Regionale Mühle · Bioladen · online (Mehl Typ 0/1/Vollkorn, Hartweizen, Manitoba)",
    "Local mill · organic shop · online (type 0/1/wholemeal flour, semolina, Manitoba)",
    "Molino local · tienda bio · online (harina tipo 0/1/integral, sémola, Manitoba)",
    "Moulin local · magasin bio · en ligne (farine T55/T80/complète, semoule, Manitoba)",
    "آسیاب محلی · فروشگاه ارگانیک · آنلاین (آرد تیپ ۰/۱/سبوس‌دار، سمولینا)"),
  lievito: (lang) => mkTri(lang)(
    "Lievito madre: fallo in casa · lievito di birra: supermercato · malto/miglioratore: online o negozio specializzato",
    "Sauerteig: selbst ansetzen · Hefe: Supermarkt · Malz/Backmittel: online oder Fachgeschäft",
    "Sourdough: make it at home · fresh yeast: supermarket · malt/improver: online or specialty shop",
    "Masa madre: hazla en casa · levadura: supermercado · malta/mejorante: online o tienda especializada",
    "Levain: à faire maison · levure: supermarché · malt/améliorant: en ligne ou magasin spécialisé",
    "خمیرمایه: خانگی · مخمر: سوپرمارکت · مالت/بهبوددهنده: آنلاین"),
  liquidi: (lang) => mkTri(lang)(
    "Acqua: rubinetto (a ~temperatura indicata) · olio EVO: frantoio o supermercato · burro/uova: supermercato o azienda locale",
    "Wasser: Leitung · Olivenöl: Ölmühle oder Supermarkt · Butter/Eier: Supermarkt oder Hofladen",
    "Water: tap · EVO oil: oil mill or supermarket · butter/eggs: supermarket or local farm",
    "Agua: grifo · aceite AOVE: almazara o supermercado · mantequilla/huevos: supermercado o granja",
    "Eau: robinet · huile d'olive: moulin ou supermarché · beurre/œufs: supermarché ou ferme",
    "آب: شیر · روغن زیتون: کارخانه روغن یا سوپرمارکت · کره/تخم‌مرغ: سوپرمارکت"),
  sale: (lang) => mkTri(lang)(
    "Sale marino/fino: supermercato · semi & spezie: negozio bio o online",
    "Meersalz/Feinsalz: Supermarkt · Saaten & Gewürze: Bioladen oder online",
    "Sea/fine salt: supermarket · seeds & spices: organic shop or online",
    "Sal marina/fina: supermercado · semillas y especias: tienda bio u online",
    "Sel marin/fin: supermarché · graines & épices: magasin bio ou en ligne",
    "نمک دریا/ریز: سوپرمارکت · دانه‌ها و ادویه: فروشگاه ارگانیک یا آنلاین"),
  attrezzi: (lang) => mkTri(lang)(
    "Teglia in ferro blu, raschietto inox, pietra/acciaio refrattario, termometro a sonda, cestino di lievitazione (banneton): online o casalinghi specializzati",
    "Blaustahl-Blech, Edelstahl-Teigkarte, Backstein/-stahl, Kernthermometer, Gärkörbchen (Banneton): online oder Fachhandel",
    "Blue steel pan, stainless dough scraper, baking stone/steel, probe thermometer, proofing basket (banneton): online or specialty kitchenware",
    "Bandeja de acero azulado, rasqueta inox, piedra/acero refractario, termómetro de sonda, banneton: online o menaje especializado",
    "Plaque acier bleu, corne inox, pierre/acier de cuisson, thermomètre-sonde, banneton: en ligne ou boutique spécialisée",
    "قالب فولاد آبی، کاردک، سنگ/فولاد پخت، دماسنج، سبد تخمیر: آنلاین یا لوازم آشپزی"),
};

export function whereToBuy(kind, lang) {
  const fn = SUG[kind];
  return fn ? fn(lang) : "";
}

// Attrezzi consigliati per una teglia/pane (statico, mostrato sempre).
export function toolsList(lang) {
  return [
    mkTri(lang)("Teglia (in ferro blu per la focaccia)", "Backblech (Blaustahl für Focaccia)", "Baking pan (blue steel for focaccia)", "Bandeja (acero azulado para focaccia)", "Plaque (acier bleu pour focaccia)", "قالب پخت"),
    mkTri(lang)("Raschietto / tarocco", "Teigkarte", "Dough scraper", "Rasqueta", "Corne à pâte", "کاردک خمیر"),
    mkTri(lang)("Termometro a sonda", "Kernthermometer", "Probe thermometer", "Termómetro de sonda", "Thermomètre-sonde", "دماسنج"),
    mkTri(lang)("Ciotola capiente + pellicola/coperchio", "Große Schüssel + Folie/Deckel", "Large bowl + film/lid", "Bol grande + film/tapa", "Grand saladier + film/couvercle", "کاسه بزرگ"),
  ];
}
