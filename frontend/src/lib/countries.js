// Bandiere di tutto il mondo: l'emoji si genera dal codice ISO a 2 lettere.
// I colori (per la striscia sulla card) sono definiti per i paesi piu' comuni;
// per gli altri si usa comunque la bandiera emoji.

export const flagEmoji = (code) => {
  if (!code || code.length !== 2) return "";
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
};

// code: ISO2, name: italiano, colors: strisce per la card (opzionale)
export const COUNTRIES = [
  { code: "it", name: "Italia", colors: ["#5aa0cf", "#ffffff", "#6E8CA0"] },
  { code: "de", name: "Germania", colors: ["#2B303B", "#6E8CA0", "#A9C5D4"] },
  { code: "fr", name: "Francia", colors: ["#0055A4", "#ffffff", "#EF4135"] },
  { code: "at", name: "Austria", colors: ["#ED2939", "#ffffff", "#ED2939"] },
  { code: "ch", name: "Svizzera", colors: ["#D52B1E", "#ffffff", "#D52B1E"] },
  { code: "es", name: "Spagna", colors: ["#AA151B", "#F1BF00", "#AA151B"] },
  { code: "pt", name: "Portogallo", colors: ["#006600", "#FF0000", "#C68B59"] },
  { code: "gb", name: "Regno Unito", colors: ["#012169", "#ffffff", "#C8102E"] },
  { code: "gr", name: "Grecia", colors: ["#0D5EAF", "#ffffff", "#0D5EAF"] },
  { code: "tr", name: "Turchia", colors: ["#E30A17", "#ffffff", "#E30A17"] },
  { code: "cn", name: "Cina", colors: ["#DE2910", "#FFDE00", "#DE2910"] },
  { code: "jp", name: "Giappone", colors: ["#ffffff", "#BC002D", "#ffffff"] },
  { code: "in", name: "India", colors: ["#FF9933", "#ffffff", "#138808"] },
  { code: "us", name: "Stati Uniti", colors: ["#3C3B6E", "#ffffff", "#B22234"] },
  { code: "mx", name: "Messico", colors: ["#006847", "#ffffff", "#CE1126"] },
  { code: "br", name: "Brasile", colors: ["#009C3B", "#FFDF00", "#002776"] },
  { code: "ma", name: "Marocco", colors: ["#C1272D", "#006233", "#C1272D"] },
  { code: "eg", name: "Egitto", colors: ["#CE1126", "#ffffff", "#000000"] },
  { code: "ru", name: "Russia", colors: ["#ffffff", "#0039A6", "#D52B1E"] },
  { code: "pl", name: "Polonia", colors: ["#ffffff", "#DC143C", "#ffffff"] },
  { code: "nl", name: "Paesi Bassi", colors: ["#21468B", "#ffffff", "#AE1C28"] },
  { code: "be", name: "Belgio", colors: ["#000000", "#FDDA24", "#EF3340"] },
  { code: "se", name: "Svezia", colors: ["#006AA7", "#FECC00", "#006AA7"] },
  { code: "dk", name: "Danimarca", colors: ["#C60C30", "#ffffff", "#C60C30"] },
  { code: "ie", name: "Irlanda", colors: ["#169B62", "#ffffff", "#FF883E"] },
  { code: "hu", name: "Ungheria", colors: ["#CD2A3E", "#ffffff", "#436F4D"] },
  { code: "ua", name: "Ucraina", colors: ["#0057B7", "#0057B7", "#C68B59"] },
  { code: "lb", name: "Libano", colors: ["#ED1C24", "#ffffff", "#00A651"] },
  { code: "il", name: "Israele", colors: ["#0038B8", "#ffffff", "#0038B8"] },
  { code: "th", name: "Thailandia", colors: ["#A51931", "#2D2A4A", "#A51931"] },
];

export const countryColors = (code) => {
  const c = COUNTRIES.find((x) => x.code === code);
  return c ? c.colors : null;
};

export const countryName = (code) => {
  const c = COUNTRIES.find((x) => x.code === code);
  return c ? c.name : (code ? code.toUpperCase() : "");
};
