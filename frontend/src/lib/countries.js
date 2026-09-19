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
  { code: "it", name: "Italia", colors: ["hsl(var(--muted-foreground))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"] },
  { code: "de", name: "Germania", colors: ["hsl(var(--secondary))", "hsl(var(--muted-foreground))", "hsl(var(--foreground))"] },
  { code: "fr", name: "Francia", colors: ["hsl(var(--secondary))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"] },
  { code: "at", name: "Austria", colors: ["hsl(var(--muted-foreground))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"] },
  { code: "ch", name: "Svizzera", colors: ["hsl(var(--muted-foreground))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"] },
  { code: "es", name: "Spagna", colors: ["hsl(var(--secondary))", "hsl(var(--foreground))", "hsl(var(--secondary))"] },
  { code: "pt", name: "Portogallo", colors: ["hsl(var(--secondary))", "hsl(var(--secondary))", "hsl(var(--muted-foreground))"] },
  { code: "gb", name: "Regno Unito", colors: ["hsl(var(--card))", "hsl(var(--foreground))", "hsl(var(--secondary))"] },
  { code: "gr", name: "Grecia", colors: ["hsl(var(--muted-foreground))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"] },
  { code: "tr", name: "Turchia", colors: ["hsl(var(--secondary))", "hsl(var(--foreground))", "hsl(var(--secondary))"] },
  { code: "cn", name: "Cina", colors: ["hsl(var(--muted-foreground))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"] },
  { code: "jp", name: "Giappone", colors: ["hsl(var(--foreground))", "hsl(var(--secondary))", "hsl(var(--foreground))"] },
  { code: "in", name: "India", colors: ["hsl(var(--muted-foreground))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"] },
  { code: "us", name: "Stati Uniti", colors: ["hsl(var(--secondary))", "hsl(var(--foreground))", "hsl(var(--secondary))"] },
  { code: "mx", name: "Messico", colors: ["hsl(var(--muted-foreground))", "hsl(var(--foreground))", "hsl(var(--secondary))"] },
  { code: "br", name: "Brasile", colors: ["hsl(var(--muted-foreground))", "hsl(var(--foreground))", "hsl(var(--card))"] },
  { code: "ma", name: "Marocco", colors: ["hsl(var(--secondary))", "hsl(var(--secondary))", "hsl(var(--secondary))"] },
  { code: "eg", name: "Egitto", colors: ["hsl(var(--secondary))", "hsl(var(--foreground))", "hsl(var(--card))"] },
  { code: "ru", name: "Russia", colors: ["hsl(var(--foreground))", "hsl(var(--secondary))", "hsl(var(--muted-foreground))"] },
  { code: "pl", name: "Polonia", colors: ["hsl(var(--foreground))", "hsl(var(--secondary))", "hsl(var(--foreground))"] },
  { code: "nl", name: "Paesi Bassi", colors: ["hsl(var(--secondary))", "hsl(var(--foreground))", "hsl(var(--secondary))"] },
  { code: "be", name: "Belgio", colors: ["hsl(var(--card))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"] },
  { code: "se", name: "Svezia", colors: ["hsl(var(--muted-foreground))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"] },
  { code: "dk", name: "Danimarca", colors: ["hsl(var(--secondary))", "hsl(var(--foreground))", "hsl(var(--secondary))"] },
  { code: "ie", name: "Irlanda", colors: ["hsl(var(--muted-foreground))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"] },
  { code: "hu", name: "Ungheria", colors: ["hsl(var(--muted-foreground))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"] },
  { code: "ua", name: "Ucraina", colors: ["hsl(var(--secondary))", "hsl(var(--secondary))", "hsl(var(--muted-foreground))"] },
  { code: "lb", name: "Libano", colors: ["hsl(var(--secondary))", "hsl(var(--foreground))", "hsl(var(--muted-foreground))"] },
  { code: "il", name: "Israele", colors: ["hsl(var(--secondary))", "hsl(var(--foreground))", "hsl(var(--secondary))"] },
  { code: "th", name: "Thailandia", colors: ["hsl(var(--secondary))", "hsl(var(--secondary))", "hsl(var(--secondary))"] },
];

export const countryColors = (code) => {
  const c = COUNTRIES.find((x) => x.code === code);
  return c ? c.colors : null;
};

export const countryName = (code) => {
  const c = COUNTRIES.find((x) => x.code === code);
  return c ? c.name : (code ? code.toUpperCase() : "");
};
