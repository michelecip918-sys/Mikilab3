import { ChevronRight, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useAuth } from "@/auth/AuthContext";
import ShareInstall from "@/components/ShareInstall";

const PUB = process.env.PUBLIC_URL;

// Home minimal e ordinata: hero + 5 blocchi-sezione (copertina, badge, titolo, frase breve) + condivisione.
export default function Home({ onNavigate }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const go = (t) => onNavigate && onNavigate(t);

  const BLOCKS = [
    {
      tab: "maestro", img: "hero-laboratorio.jpg",
      title: L("Panificio Virtuale 3D", "Virtuelle 3D-Backstube", "3D Virtual Bakery", "Panadería Virtual 3D"),
      badge: L("Novità · 3D", "Neu · 3D", "New · 3D", "Nuevo · 3D"),
      desc: L(
        "Entra nel panificio 3D con Miki e Mohamed: MikiLab Elite Engine, dosi, forni e radio.",
        "Betritt die 3D-Backstube mit Miki und Mohamed: MikiLab Elite Engine, Mengen, Öfen und Radio.",
        "Enter the 3D bakery with Miki and Mohamed: MikiLab Elite Engine, doses, ovens and radio.",
        "Entra en la panadería 3D con Miki y Mohamed: MikiLab Elite Engine, dosis, hornos y radio."),
    },
    {
      tab: "ricette", img: "hero-ricette.jpg",
      title: L("Ricette", "Rezepte", "Recipes", "Recetas"),
      badge: L("Ricettario", "Rezeptbuch", "Recipe book", "Recetario"),
      desc: L(
        "Ricette esclusive con dosi e passaggi, pronte da seguire.",
        "Exklusive Rezepte mit Mengen und Schritten, sofort umsetzbar.",
        "Exclusive recipes with quantities and steps, ready to follow.",
        "Recetas exclusivas con cantidades y pasos, listas para seguir."),
    },
    {
      tab: "imparacon", img: "hero-bakery.jpg",
      title: L("Scienza & Guide", "Wissen & Guides", "Science & Guides", "Ciencia y Guías"),
      badge: L("Impara", "Lernen", "Learn", "Aprende"),
      desc: L(
        "Lezioni, quiz ed esercizi per iniziare passo passo.",
        "Lektionen, Quiz und Übungen, um Schritt für Schritt zu starten.",
        "Lessons, quizzes and exercises to start step by step.",
        "Lecciones, cuestionarios y ejercicios para empezar paso a paso."),
    },
    {
      tab: "maestro", img: "hero-laboratorio.jpg",
      title: L("Laboratorio", "Labor", "Lab", "Laboratorio"),
      badge: L("Pro", "Pro", "Pro", "Pro"),
      desc: L(
        "Strumenti avanzati per progettare e produrre in autonomia.",
        "Fortschrittliche Werkzeuge zum eigenständigen Planen und Produzieren.",
        "Advanced tools to plan and produce on your own.",
        "Herramientas avanzadas para planificar y producir con autonomía."),
    },
    {
      tab: "community", img: "hero-social.jpg",
      title: "Community",
      badge: L("Social", "Social", "Social", "Social"),
      desc: L(
        "Condividi i tuoi risultati e confrontati con altri appassionati.",
        "Teile deine Ergebnisse und tausche dich mit anderen aus.",
        "Share your results and connect with other enthusiasts.",
        "Comparte tus resultados y conecta con otros apasionados."),
    },
  ];

  return (
    <div className="pb-24" data-testid="home">
      {/* Hero */}
      <div className="text-center mb-8">
        <img src={`${PUB}/logo.png`} alt="MikiLab" className="w-16 h-16 rounded-2xl object-cover mx-auto ring-2 ring-[#d4a373]/40 shadow-lg" />
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#d4a373] mt-3">MikiLab</h1>
        <p className="mt-2 text-[15px] leading-snug text-[#C9D4DC] max-w-sm mx-auto">
          {L(
            "Il laboratorio del fornaio: ricette, guide e strumenti.",
            "Die Backstube des Bäckers: Rezepte, Anleitungen und Werkzeuge.",
            "The baker's workshop: recipes, guides and tools.",
            "El taller del panadero: recetas, guías y herramientas.")}
        </p>
        <span className="inline-block mt-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#d4a373]/15 text-[#d4a373] border border-[#d4a373]/40">
          {L("100% gratis", "100% kostenlos", "100% free", "100% gratis")}
        </span>
        {/* Badge stato sistema */}
        <div data-testid="home-system-badge" className="mt-3 flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#8F9B5E]/15 text-[#8F9B5E] border border-[#8F9B5E]/40">
            <WifiOff className="w-3 h-3" /> {L("Sistema 100% offline pronto", "System 100% offline bereit", "System 100% offline ready", "Sistema 100% offline listo")}
          </span>
          {user && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#d4a373]/15 text-[#d4a373] border border-[#d4a373]/40">
              {L("Account aziendale attivo", "Firmenkonto aktiv", "Company account active", "Cuenta de empresa activa")}
            </span>
          )}
        </div>
      </div>

      {/* 5 sezioni */}
      <div className="space-y-4">
        {BLOCKS.map((b, i) => (
          <motion.button
            key={b.tab}
            data-testid={`home-block-${b.tab}`}
            onClick={() => go(b.tab)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="lab-3d-card group block w-full text-start rounded-3xl overflow-hidden bg-[#161616] border border-[#2C2C2C] hover:border-[#d4a373]/60 active:scale-[0.99] transition-all duration-300 shadow-lg"
          >
            <div className="relative h-40">
              <img src={`${PUB}/${b.img}`} alt={b.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/45 to-transparent" />
              <span className="absolute top-3 start-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/45 text-[#e6c79a] border border-[#e6c79a]/30 backdrop-blur-sm">
                {b.badge}
              </span>
              <h2 className="absolute bottom-3 start-4 end-4 font-display text-2xl sm:text-3xl font-extrabold text-white drop-shadow">{b.title}</h2>
            </div>
            <div className="flex items-center gap-3 p-4">
              <p className="flex-1 text-[14px] leading-snug text-[#C9D4DC]">{b.desc}</p>
              <span className="shrink-0 w-10 h-10 rounded-full bg-[#d4a373]/15 border border-[#d4a373]/40 flex items-center justify-center text-[#d4a373] group-hover:bg-[#d4a373] group-hover:text-white transition-all duration-300">
                <ChevronRight className="w-5 h-5 rtl:rotate-180" />
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="mt-8" data-testid="home-share"><ShareInstall /></div>
    </div>
  );
}
