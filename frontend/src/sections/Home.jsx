import { ChevronRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import ShareInstall from "@/components/ShareInstall";

const PUB = process.env.PUBLIC_URL;

// Home minimal: SOLO i 5 blocchi-sezione (copertina + titolo + descrizione) e la condivisione.
export default function Home({ onNavigate }) {
  const { lang } = useLang();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const go = (t) => onNavigate && onNavigate(t);

  const BLOCKS = [
    {
      tab: "ricette", img: "hero-ricette.jpg", title: "Ricette",
      desc: L(
        "Esplora le mie ricette esclusive, un regalo pensato per farti imparare subito le basi e le preparazioni passo passo.",
        "Entdecke meine exklusiven Rezepte – ein Geschenk, um sofort die Grundlagen und Zubereitungen Schritt für Schritt zu lernen.",
        "Explore my exclusive recipes, a gift to help you learn the basics and step-by-step preparations right away.",
        "Explora mis recetas exclusivas, un regalo para aprender enseguida las bases y las preparaciones paso a paso."),
    },
    {
      tab: "impara", img: "hero-impara.jpg", title: "ImparaDaCasa",
      desc: L(
        "Risorse, contenuti e guide pratiche da consultare comodamente da casa.",
        "Ressourcen, Inhalte und praktische Anleitungen bequem von zu Hause.",
        "Resources, content and practical guides to consult comfortably from home.",
        "Recursos, contenidos y guías prácticas para consultar cómodamente desde casa."),
    },
    {
      tab: "imparacon", img: "hero-bakery.jpg", title: "ImparaConMikiLab",
      desc: L(
        "L'hub per chi inizia: lezioni guidate, quiz interattivi ed esercizi per imparare da zero.",
        "Der Hub für Einsteiger: geführte Lektionen, interaktive Quiz und Übungen, um von Grund auf zu lernen.",
        "The hub for beginners: guided lessons, interactive quizzes and exercises to learn from scratch.",
        "El hub para principiantes: lecciones guiadas, cuestionarios interactivos y ejercicios para aprender desde cero."),
    },
    {
      tab: "maestro", img: "hero-laboratorio.jpg", title: "LavoraConMikiLab",
      desc: L(
        "Lo strumento avanzato e libero per professionisti: progetta, crea e sviluppa in autonomia.",
        "Das fortschrittliche, freie Werkzeug für Profis: planen, erstellen und entwickeln in Eigenregie.",
        "The advanced, free tool for professionals: design, create and develop on your own.",
        "La herramienta avanzada y libre para profesionales: diseña, crea y desarrolla con autonomía."),
    },
    {
      tab: "community", img: "hero-social.jpg", title: "ViviMikiLab",
      desc: L(
        "Entra nella community, condividi i tuoi risultati e interagisci con gli altri appassionati.",
        "Tritt der Community bei, teile deine Ergebnisse und tausche dich mit anderen Begeisterten aus.",
        "Join the community, share your results and interact with other enthusiasts.",
        "Únete a la comunidad, comparte tus resultados e interactúa con otros apasionados."),
    },
  ];

  return (
    <div className="pb-24" data-testid="home">
      <div className="text-center mb-6">
        <img src={`${PUB}/logo.png`} alt="MikiLab" className="w-16 h-16 rounded-2xl object-cover mx-auto ring-2 ring-[#ff6b00]/40 shadow" />
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#ff6b00] mt-2">MikiLab</h1>
      </div>

      <div className="space-y-4">
        {BLOCKS.map((b) => (
          <button key={b.tab} data-testid={`home-block-${b.tab}`} onClick={() => go(b.tab)}
            className="group block w-full text-left rounded-3xl overflow-hidden bg-[#161616] border border-[#2C2C2C] hover:border-[#ff6b00]/60 active:scale-[0.99] transition-all shadow-lg">
            <div className="relative h-40">
              <img src={`${PUB}/${b.img}`} alt={b.title} loading="lazy" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/45 to-transparent" />
              <h2 className="absolute bottom-3 left-4 right-4 font-display text-2xl sm:text-3xl font-extrabold text-white drop-shadow">{b.title}</h2>
            </div>
            <div className="flex items-start gap-3 p-4">
              <p className="flex-1 text-[14px] leading-snug text-[#C9D4DC]">{b.desc}</p>
              <span className="shrink-0 w-10 h-10 rounded-full bg-[#ff6b00]/15 border border-[#ff6b00]/40 flex items-center justify-center text-[#ff6b00] group-hover:bg-[#ff6b00] group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6" data-testid="home-share"><ShareInstall /></div>
    </div>
  );
}
