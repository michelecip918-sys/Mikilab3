import { ChevronRight, WifiOff, ChefHat } from "lucide-react";
import { motion } from "framer-motion";
import { useLang } from "@/i18n/LanguageContext";
import { mkTri } from "@/i18n/triMaps";
import { useAuth } from "@/auth/AuthContext";
import ShareInstall from "@/components/ShareInstall";
import CyberBakeryTrio from "@/components/CyberBakeryTrio";
import BachecaMiki from "@/components/BachecaMiki";

const PUB = process.env.PUBLIC_URL;

// Home minimal e ordinata: hero + 5 blocchi-sezione (copertina, badge, titolo, frase breve) + condivisione.
export default function Home({ onNavigate }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const L = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const go = (t) => onNavigate && onNavigate(t);

  const BLOCKS = [
    {
      tab: "maestro", img: "bg-lab.jpg",
      title: L("Modalità Chef · Laboratorio", "Chef-Modus · Labor", "Chef Mode · Lab", "Modo Chef · Laboratorio"),
      badge: L("Pro · 3D", "Pro · 3D", "Pro · 3D", "Pro · 3D"),
      desc: L(
        "Elite Engine, banco impasti 3D, dosi dal database, forni, radio e comandi vocali.",
        "Elite Engine, 3D-Teigbank, Mengen aus der DB, Öfen, Radio und Sprachbefehle.",
        "Elite Engine, 3D dough bench, DB doses, ovens, radio and voice commands.",
        "Elite Engine, banco de masas 3D, dosis del DB, hornos, radio y comandos de voz."),
    },
    {
      tab: "ricette", img: "bg-ricette.jpg",
      title: L("Le Mie Ricette di MikiLab", "MikiLab-Rezepte", "My MikiLab Recipes", "Mis Recetas de MikiLab"),
      badge: L("Personali", "Persönlich", "Personal", "Personales"),
      desc: L(
        "Le mie ricette personali di MikiLab, con dosi e passaggi pronti da seguire.",
        "Meine persönlichen MikiLab-Rezepte mit Mengen und Schritten.",
        "My personal MikiLab recipes, with quantities and steps ready to follow.",
        "Mis recetas personales de MikiLab, con cantidades y pasos listos."),
    },
    {
      tab: "imparacon", img: "bg-accademia.jpg",
      title: L("Scienza & Guide", "Wissen & Guides", "Science & Guides", "Ciencia y Guías"),
      badge: L("Impara", "Lernen", "Learn", "Aprende"),
      desc: L(
        "Lezioni, quiz ed esercizi per iniziare passo passo.",
        "Lektionen, Quiz und Übungen, um Schritt für Schritt zu starten.",
        "Lessons, quizzes and exercises to start step by step.",
        "Lecciones, cuestionarios y ejercicios para empezar paso a paso."),
    },
    {
      tab: "shop", img: "bg-farine.jpg",
      title: L("Centro Formule", "Formelzentrum", "Formula Center", "Centro de Fórmulas"),
      badge: L("Analisi Farine", "Mehlanalyse", "Flour Analysis", "Análisis de Harinas"),
      desc: L(
        "Analisi delle farine (forza W, proteine, assorbimento) e registro test con foto IA.",
        "Mehlanalyse (W-Kraft, Protein, Aufnahme) und Testregister mit KI-Foto.",
        "Flour analysis (W strength, protein, absorption) and a test log with AI photo.",
        "Análisis de harinas (fuerza W, proteína, absorción) y registro de pruebas con foto IA."),
    },
    {
      tab: "community", img: "bg-community.jpg",
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
      {/* Modalità Chef · Laboratorio — comando operativo primario, in cima */}
      <button data-testid="home-chef-mode" onClick={() => go("maestro")}
        className="w-full mb-6 flex items-center gap-3 rounded-3xl p-4 bg-gradient-to-r from-[#3E9C93] to-[#2E7D75] text-white shadow-[0_0_26px_rgba(62,156,147,0.45)] active:scale-[0.99] transition-all border border-[#3E9C93]/50 animate-pulse-slow">
        <span className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0"><ChefHat className="w-7 h-7" /></span>
        <span className="text-start min-w-0 flex-1">
          <span className="block font-display text-lg font-extrabold leading-tight">{L("Modalità Chef · Laboratorio", "Chef-Modus · Labor", "Chef Mode · Lab", "Modo Chef · Laboratorio")}</span>
          <span className="block text-[12px] text-white/85 leading-snug">{L("Entra subito nel laboratorio operativo", "Direkt ins operative Labor", "Jump straight into the operative lab", "Entra directo al laboratorio operativo")}</span>
        </span>
        <ChevronRight className="w-6 h-6 shrink-0 rtl:rotate-180" />
      </button>

      {/* Hero */}
      <div className="text-center mb-8">
        <img src={`${PUB}/logo.png`} alt="MikiLab" className="w-16 h-16 rounded-2xl object-cover mx-auto ring-2 ring-[#64748B]/40 shadow-lg" />
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#64748B] mt-3">MikiLab</h1>
        <p className="mt-2 text-[15px] leading-snug text-[#C9D4DC] max-w-sm mx-auto">
          {L(
            "Il laboratorio del fornaio: ricette, guide e strumenti.",
            "Die Backstube des Bäckers: Rezepte, Anleitungen und Werkzeuge.",
            "The baker's workshop: recipes, guides and tools.",
            "El taller del panadero: recetas, guías y herramientas.")}
        </p>
        <span className="inline-block mt-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#64748B]/15 text-[#64748B] border border-[#64748B]/40">
          {L("100% gratis", "100% kostenlos", "100% free", "100% gratis")}
        </span>
        {/* Badge stato sistema */}
        <div data-testid="home-system-badge" className="mt-3 flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#8F9B5E]/15 text-[#8F9B5E] border border-[#8F9B5E]/40">
            <WifiOff className="w-3 h-3" /> {L("Sistema 100% offline pronto", "System 100% offline bereit", "System 100% offline ready", "Sistema 100% offline listo")}
          </span>
          {user && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#64748B]/15 text-[#64748B] border border-[#64748B]/40">
              {L("Account aziendale attivo", "Firmenkonto aktiv", "Company account active", "Cuenta de empresa activa")}
            </span>
          )}
        </div>
      </div>

      {/* Intro navigazione snella (sostituisce la vecchia Guida separata) */}
      <div data-testid="home-intro" className="mb-5 rounded-3xl border border-[#3E9C93]/25 bg-[#14212C] p-4">
        <p className="font-display text-sm font-bold text-[#3E9C93] uppercase tracking-wide mb-1.5">{L("Come muoverti", "Navigation", "How to navigate", "Cómo moverte")}</p>
        <p className="text-[13px] leading-relaxed text-[#C9D4DC]">
          {L(
            "Tocca Modalità Chef per il laboratorio operativo, Le Mie Ricette per dosi e passaggi, Scienza & Guide per imparare, Centro Formule per le farine e Community per confrontarti. Tutto funziona anche offline, a mani libere con la voce.",
            "Tippe auf Chef-Modus für das Labor, Meine Rezepte für Mengen, Wissen & Guides zum Lernen, Formelzentrum für Mehle und Community zum Austausch. Alles offline und freihändig per Stimme.",
            "Tap Chef Mode for the lab, My Recipes for doses, Science & Guides to learn, Formula Center for flours and Community to connect. Everything works offline, hands-free by voice.",
            "Toca Modo Chef para el laboratorio, Mis Recetas para dosis, Ciencia y Guías para aprender, Centro de Fórmulas para harinas y Community. Todo funciona offline y manos libres por voz.")}
        </p>
      </div>

      {/* Cyber-Bakery Trio: banner interattivo con mini-guide */}
      <div className="mb-4"><CyberBakeryTrio /></div>

      {/* La Bacheca di Miki: messaggio quotidiano del Capo */}
      <div className="mb-6"><BachecaMiki /></div>

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
            className="lab-3d-card group block w-full text-start rounded-3xl overflow-hidden bg-[#14212C] border border-[#2A3B49] hover:border-[#64748B]/60 active:scale-[0.99] transition-all duration-300 shadow-lg"
          >
            <div className="relative h-40">
              <img src={`${PUB}/${b.img}`} alt={b.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1520] via-[#0D1520]/45 to-transparent" />
              <span className="absolute top-3 start-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/45 text-[#e6c79a] border border-[#e6c79a]/30 backdrop-blur-sm">
                {b.badge}
              </span>
              <h2 className="absolute bottom-3 start-4 end-4 font-display text-2xl sm:text-3xl font-extrabold text-white drop-shadow">{b.title}</h2>
            </div>
            <div className="flex items-center gap-3 p-4">
              <p className="flex-1 text-[14px] leading-snug text-[#C9D4DC]">{b.desc}</p>
              <span className="shrink-0 w-10 h-10 rounded-full bg-[#64748B]/15 border border-[#64748B]/40 flex items-center justify-center text-[#64748B] group-hover:bg-[#64748B] group-hover:text-white transition-all duration-300">
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
