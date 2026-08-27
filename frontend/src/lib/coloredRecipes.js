// Ricette colorate NATURALMENTE (metodo indiretto). Usata da RecipeList (filtro + badge) e dalla vetrina.
export const COLORED_RECIPES = [
  "Cornetto Bicolore Cacao e Vaniglia",
  "Cornetto Doppio Gusto Pistacchio e Cioccolato",
  "Pane all'Nduja",
  "Pane alla Barbabietola",
  "Panini Basilico e Pomodoro",
  "Pane alla Curcuma e Zenzero",
  "Pane agli Spinaci",
  "Pane Nero al Carbone Vegetale",
  "Cornetto Bicolore Carbone e Vaniglia",
  "Pane allo Zafferano",
  "Pane alla Spirulina",
  "Cornetto Bicolore Rosa (Rapa Rossa) e Vaniglia",
];

export const isColored = (name) => COLORED_RECIPES.includes(name);
