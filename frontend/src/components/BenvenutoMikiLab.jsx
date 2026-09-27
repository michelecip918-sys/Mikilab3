import { useEffect, useState } from "react";
import { Search, ChevronRight, ChevronDown, ChefHat } from "lucide-react";
import { CERCA_KEY } from "@/components/Cerca"; // V108
import { Saluto } from "@/components/LaTuaCucina"; // V128
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";

// V107 — BENVENUTO. V128 — più semplice: il saluto, una frase, la ricerca e UN solo bottone per le ricette.
// Cos'è MikiLab si legge aperto la prima volta; poi resta chiuso dietro «Cos'è MikiLab?». Le sei porte di prima
// ora stanno in «Comincia da qui» e nelle otto stanze di «Tutto MikiLab».

const KEY = "mikilab_benvenuto_visto";

export default function BenvenutoMikiLab({ onNav, count = 0 }) {
  const { lang } = useLang();
  const tri = (i, d, e) => mkTri(lang)(i, d, e);
  const [first] = useState(() => { try { return !localStorage.getItem(KEY); } catch { return true; } });
  const [about, setAbout] = useState(first);
  const [q, setQ] = useState("");
  useEffect(() => { try { if (!localStorage.getItem(KEY)) localStorage.setItem(KEY, String(Date.now())); } catch { /* */ } }, []);
  const cerca = (e) => { if (e) e.preventDefault(); try { sessionStorage.setItem(CERCA_KEY, q); } catch { /* */ } onNav("cerca"); };

  return (
    <section data-testid="benvenuto" className="pt-1">
      <Saluto first={first} />
      <p className="font-display italic text-[17px] text-foreground/85 mt-1">{tri("Farina, acqua, sale e le tue mani.", "Mehl, Wasser, Salz und deine Hände.", "Flour, water, salt and your hands.")}</p>
      <button data-testid="benvenuto-cose" onClick={() => setAbout((v) => !v)} aria-expanded={about} className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-bold text-primary">
        {tri("Cos'è MikiLab?", "Was ist MikiLab?", "What is MikiLab?")}<ChevronDown className={`w-4 h-4 transition-transform ${about ? "rotate-180" : ""}`} />
      </button>
      {about && (
        <div data-testid="benvenuto-testo" className="mt-1.5 text-[14px] text-foreground/90 leading-relaxed max-w-prose">
          <p>{tri("MikiLab insegna a fare il pane, la pizza, la pasta e i dolci lievitati a tutti: a chi non ha mai impastato, a chi lo fa di mestiere, a chi deve arrangiarsi con poco. Le ricette sono di Michele, panettiere; Sitor è la guida, un'intelligenza artificiale.", "MikiLab bringt allen bei, Brot, Pizza, Pasta und Hefegebäck zu machen: denen, die nie geknetet haben, denen, die es beruflich tun, denen, die mit wenig auskommen müssen. Die Rezepte sind von Michele, Bäcker; Sitor ist der Guide, eine künstliche Intelligenz.", "MikiLab teaches everyone to make bread, pizza, pasta and leavened sweets: those who have never kneaded, those who do it for a living, those who must get by with little. The recipes are Michele's, a baker; Sitor is the guide, an artificial intelligence.")}</p>
          <p className="text-[13px] text-muted-foreground mt-1.5">{tri("Gratis, senza registrazione e senza pubblicità. Quello che fai resta nel tuo telefono.", "Kostenlos, ohne Anmeldung und ohne Werbung. Was du tust, bleibt auf deinem Handy.", "Free, no sign-up and no ads. What you do stays on your phone.")} <button data-testid="benvenuto-storia" onClick={() => onNav("dedica")} className="font-bold text-primary underline decoration-dotted">{tri("La storia di Michele", "Micheles Geschichte", "Michele's story")}</button></p>
        </div>
      )}
      <form data-testid="benvenuto-cerca" onSubmit={cerca} className="relative mt-4">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label={tri("Cerca in tutto MikiLab", "In ganz MikiLab suchen", "Search all of MikiLab")} placeholder={tri("Cerca: ricette, ingredienti, parole…", "Suchen: Rezepte, Zutaten, Wörter…", "Search: recipes, ingredients, words…")} className="w-full text-[15px] bg-card text-foreground border border-border rounded-xl pl-9 pr-20 py-3 outline-none focus:border-primary" />
        <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[13px] font-bold px-3 py-2 rounded-lg bg-primary text-primary-foreground">{tri("Cerca", "Suchen", "Search")}</button>
      </form>
      <button data-testid="benvenuto-ricette" onClick={() => onNav("recipes")} className="mt-3 w-full flex items-center gap-3 rounded-2xl bg-primary text-primary-foreground px-4 py-3.5 text-left active:scale-[0.99] transition-all shadow-md">
        <ChefHat className="w-6 h-6 shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block font-display text-lg font-black leading-tight">{tri("Tutte le ricette", "Alle Rezepte", "All recipes")}</span>
          <span className="block text-[12.5px] opacity-90">{count > 0 ? tri(`${count} ricette: pane, panini, focacce, pizza e dolci`, `${count} Rezepte: Brot, Brötchen, Focaccia, Pizza und Süßes`, `${count} recipes: bread, rolls, focaccia, pizza and sweets`) : tri("Pane, panini, focacce, pizza e dolci", "Brot, Brötchen, Focaccia, Pizza und Süßes", "Bread, rolls, focaccia, pizza and sweets")}</span>
        </span>
        <ChevronRight className="w-5 h-5 shrink-0" />
      </button>
    </section>
  );
}
