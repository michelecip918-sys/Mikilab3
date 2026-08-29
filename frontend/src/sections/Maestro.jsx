import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle, CalendarDays, ChefHat, Flame, Wheat, ChevronLeft, ChevronRight,
  ClipboardList, Thermometer, ScanLine, Clock, ShoppingCart, Users, CheckSquare, ListChecks, Snowflake, Droplets, FlaskConical,
  Cog, BookOpen, LayoutDashboard, Scale, Euro, Recycle, Timer as TimerIcon, CloudSun, Store, QrCode, CalendarCheck, Sparkles, Camera, Building2,
} from "lucide-react";
import RecipeList from "@/components/RecipeList";
import SectionHero from "@/components/SectionHero";
import WhatsAppHelp from "@/components/WhatsAppHelp";
import MyData from "@/sections/MyData";
import MachinePark from "@/components/MachinePark";
import WeeklyPlan from "@/sections/WeeklyPlan";
import StartDoughs from "@/sections/StartDoughs";
import AdattaForno from "@/sections/AdattaForno";
import SvegliaLievito from "@/sections/SvegliaLievito";
import CapoLaboratorio from "@/sections/CapoLaboratorio";
import PianoProduzioneAI from "@/sections/PianoProduzioneAI";
import ClimaTermostato from "@/sections/ClimaTermostato";
import ScanRecipe from "@/sections/ScanRecipe";
import ScanFlour from "@/sections/ScanFlour";
import BackwardScheduler from "@/sections/BackwardScheduler";
import ShoppingList from "@/sections/ShoppingList";
import ShiftRoles from "@/sections/ShiftRoles";
import Checklists from "@/sections/Checklists";
import FreezerStock from "@/sections/FreezerStock";
import WaterTempCalc from "@/sections/WaterTempCalc";
import SourdoughTracker from "@/sections/SourdoughTracker";
import SmartScale from "@/sections/SmartScale";
import FoodCost from "@/sections/FoodCost";
import ShelfLife from "@/sections/ShelfLife";
import AntiWaste from "@/sections/AntiWaste";
import Timer from "@/sections/Timer";
import Meteo from "@/sections/Meteo";
import Marketplace from "@/sections/Marketplace";
import BatchTraceability from "@/sections/BatchTraceability";
import DoughTwin from "@/sections/DoughTwin";
import GuidedWeighing from "@/sections/GuidedWeighing";
import DoughLog from "@/sections/DoughLog";
import HaccpLog from "@/sections/HaccpLog";
import SalesPoints from "@/sections/SalesPoints";
import DayClose from "@/sections/DayClose";
import HighFive from "@/components/HighFive";
import LabWizard from "@/components/LabWizard";
import FlourTable from "@/components/FlourTable";
import PhotoDiagnosi from "@/sections/PhotoDiagnosi";
import SoundDiagnosi from "@/sections/SoundDiagnosi";
import EnterpriseHub from "@/sections/EnterpriseHub";
import { useLang } from "@/i18n/LanguageContext";
import { useBackClose } from "@/lib/backNav";
import MohammedAssistant from "@/sections/MohammedAssistant";
import AvatarBubbles from "@/components/AvatarBubbles";
import RecipeGenerator from "@/components/RecipeGenerator";
import FermentazionePredittiva from "@/sections/FermentazionePredittiva";
import CosaPosso from "@/components/CosaPosso";
import CostoEnergia from "@/components/CostoEnergia";
import CalcolatoreMetodo from "@/sections/CalcolatoreMetodo";
import CalcolatoreSequenze from "@/sections/CalcolatoreSequenze";
import ConvertitoreLieviti from "@/sections/ConvertitoreLieviti";
import CalcolatoreStampi from "@/sections/CalcolatoreStampi";
import SosImpastoGuida from "@/sections/SosImpastoGuida";
import AngoloRecupero from "@/sections/AngoloRecupero";
import SaporiCasa from "@/sections/SaporiCasa";
import TrovaFarina from "@/sections/TrovaFarina";
import EsuberoZero from "@/sections/EsuberoZero";
import SmartWeatherBaker from "@/sections/SmartWeatherBaker";
import SimulatoreForno from "@/sections/SimulatoreForno";
import TimeLapseTracker from "@/sections/TimeLapseTracker";
import BancaLievito from "@/sections/BancaLievito";
import CantiereRicetta from "@/sections/CantiereRicetta";
import LabPizzeria from "@/sections/LabPizzeria";
import LabPasticceria from "@/sections/LabPasticceria";
import RicetteCustodite from "@/sections/RicetteCustodite";
import ManiSporche from "@/sections/ManiSporche";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";

export default function Maestro() {
  const [tool, setTool] = useState(null);
  const scrollRef = useRef(0);
  const openTool = (id) => { scrollRef.current = window.scrollY; setTool(id); window.scrollTo(0, 0); };
  const back = () => setTool(null);
  useEffect(() => {
    const readPending = () => {
      try {
        const pending = localStorage.getItem("mikilab_pending_tool");
        if (pending) { localStorage.removeItem("mikilab_pending_tool"); setTool(pending); window.scrollTo(0, 0); }
      } catch { /* */ }
    };
    readPending();
    const openTool = (e) => {
      const id = e?.detail?.id;
      if (id) { try { localStorage.removeItem("mikilab_pending_tool"); } catch { /* */ } setTool(id); window.scrollTo(0, 0); }
    };
    window.addEventListener("mikilab-open-lab-tool", openTool);
    return () => window.removeEventListener("mikilab-open-lab-tool", openTool);
  }, []);
  useEffect(() => {
    if (!tool) requestAnimationFrame(() => window.scrollTo(0, scrollRef.current || 0));
    else window.scrollTo(0, 0);
  }, [tool]);
  // All'ingresso nel Laboratorio: sempre in cima, così si vede subito "Inserisci Ricetta" e il Percorso.
  useEffect(() => {
    window.scrollTo(0, 0);
    const r = requestAnimationFrame(() => window.scrollTo(0, 0));
    const t = setTimeout(() => window.scrollTo(0, 0), 80);
    return () => { cancelAnimationFrame(r); clearTimeout(t); };
  }, []);
  const { t, lang } = useLang();
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  useBackClose(!!tool, back);

  if (tool) {
    return (
      <div>
        <HighFive />
        <button data-testid="maestro-back-btn" onClick={back}
          className="inline-flex items-center gap-1.5 mb-4 px-4 py-2 rounded-full bg-white dark:bg-[#1e1e1e] border border-[#2e2e2e] dark:border-[#2e2e2e] text-[#ff6b00] dark:text-[#a9d2ec] font-semibold text-sm shadow-sm active:scale-95 transition-all">
          <ChevronLeft className="w-4.5 h-4.5" /> {tri("Torna agli strumenti", "Zurück zu den Werkzeugen", "Back to tools", "Volver a las herramientas")}
        </button>
        {tool === "aggiungi" && (
          <RecipeList collectionName="personal"
            heroImage="https://images.unsplash.com/photo-1732565649629-eb4932a1ec09?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
            heroTitle={t("personal_hero_title")} heroSubtitle={t("personal_hero_sub")} emptyText={t("personal_empty")}
            extraHeader={<ScanRecipe embedded />} />
        )}
        {tool === "capo" && <CapoLaboratorio />}
        {tool === "generatore" && <RecipeGenerator />}
        {tool === "fermentazione" && <FermentazionePredittiva />}
        {tool === "cosafare" && <CosaPosso />}
        {tool === "energia" && <CostoEnergia />}
        {tool === "pianoai" && <PianoProduzioneAI onOpenTool={openTool} />}
        {tool === "mydata" && <MyData onOpenTool={openTool} />}
        {tool === "macchine" && <MachinePark />}
        {tool === "bilancia" && <SmartScale />}
        {tool === "pesata" && <GuidedWeighing />}
        {tool === "sessioni" && <DoughLog />}
        {tool === "haccp" && <HaccpLog />}
        {tool === "foodcost" && <FoodCost />}
        {tool === "shelf" && <ShelfLife />}
        {tool === "spreco" && <AntiWaste />}
        {tool === "timer" && <Timer />}
        {tool === "meteo" && <Meteo />}
        {tool === "twin" && <DoughTwin />}
        {tool === "lotti" && <BatchTraceability />}
        {tool === "settimana" && <WeeklyPlan />}
        {tool === "inversa" && <BackwardScheduler />}
        {tool === "lavoro" && <StartDoughs />}
        {tool === "adatta" && <AdattaForno />}
        {tool === "termo" && <ClimaTermostato />}
        {tool === "acqua" && <WaterTempCalc />}
        {tool === "ph" && <SourdoughTracker />}
        {tool === "freezer" && <FreezerStock />}
        {tool === "spesa" && <ShoppingList />}
        {tool === "turni" && <ShiftRoles />}
        {tool === "check" && <Checklists />}
        {tool === "sveglia" && <SvegliaLievito />}
        {tool === "salespoints" && <SalesPoints />}
        {tool === "dayclose" && <DayClose />}
        {tool === "diagnosi" && <PhotoDiagnosi />}
        {tool === "scanflour" && <ScanFlour />}
        {tool === "metodo" && <CalcolatoreMetodo />}
        {tool === "sequenze" && <CalcolatoreSequenze />}
        {tool === "convlievito" && <ConvertitoreLieviti />}
        {tool === "stampi" && <CalcolatoreStampi />}
        {tool === "sosimpasto" && <SosImpastoGuida onOpenTool={openTool} />}
        {tool === "recupero" && <AngoloRecupero />}
        {tool === "saporicasa" && <SaporiCasa />}
        {tool === "trovafarina" && <TrovaFarina />}
        {tool === "esuberozero" && <EsuberoZero />}
        {tool === "weatherbaker" && <SmartWeatherBaker />}
        {tool === "simforno" && <SimulatoreForno />}
        {tool === "timelapse" && <TimeLapseTracker />}
        {tool === "bancalievito" && <BancaLievito />}
        {tool === "cantiere" && <CantiereRicetta />}
        {tool === "labpizzeria" && <LabPizzeria />}
        {tool === "labpasticceria" && <LabPasticceria />}
        {tool === "custodite" && <RicetteCustodite />}
        {tool === "manisporche" && <ManiSporche />}
        {tool === "suono" && <SoundDiagnosi />}
        {tool === "enterprise" && <EnterpriseHub />}
      </div>
    );
  }

  return (
    <div className="pb-28">
      <HighFive />

      <SectionHero testid="maestro-title" image="hero-laboratorio.jpg" position="50% 30%"
        title={mkTri(lang)("Il Tuo Laboratorio", "Dein Labor", "Your Lab", "Tu Laboratorio", "Ton Atelier", "کارگاه تو")}
        subtitle={mkTri(lang)("Pianifica la produzione e usa gli strumenti del fornaio", "Plane die Produktion und nutze die Bäcker-Werkzeuge", "Plan production and use the baker's tools", "Planifica la producción y usa las herramientas del panadero", "Planifie la production et utilise les outils du boulanger", "برنامه‌ریزی تولید و ابزارهای نانوا")} />

      {/* DA DOVE INIZIARE: inserisci ricetta + calcolatori, poi il percorso guidato */}
      <div data-testid="maestro-top-tools" className="mb-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff6b00] mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> {mkTri(lang)("Da dove iniziare", "Wo anfangen", "Where to start", "Por dónde empezar", "Par où commencer", "از کجا شروع کنی")}
        </p>
        {/* Azione principale ben visibile: inserire una ricetta */}
        <button data-testid="maestro-top-aggiungi" onClick={() => openTool("aggiungi")}
          className="w-full flex items-center gap-3.5 min-h-[68px] rounded-2xl px-4 mb-2.5 bg-gradient-to-r from-[#ff6b00] to-[#c94f00] text-white shadow-[0_5px_0_rgba(0,0,0,.35),0_8px_16px_rgba(255,107,0,.32)] active:translate-y-0.5 active:shadow-[0_2px_0_rgba(0,0,0,.35)] transition-all text-left">
          <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-extrabold leading-tight">{mkTri(lang)("Inserisci una Ricetta", "Rezept einfügen", "Add a Recipe", "Añadir una Receta", "Ajouter une Recette", "افزودن دستور")}</p>
            <p className="text-[12px] text-white/85 leading-snug">{mkTri(lang)("Aggiungi o scansiona le tue ricette", "Füge deine Rezepte hinzu oder scanne sie", "Add or scan your recipes", "Añade o escanea tus recetas", "Ajoute ou scanne tes recettes", "دستورهایت را اضافه یا اسکن کن")}</p>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0" />
        </button>
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-[#7E8A93] mb-1.5 mt-1">{mkTri(lang)("Calcolatori rapidi", "Schnellrechner", "Quick calculators", "Calculadoras rápidas", "Calculateurs rapides", "ماشین‌حساب‌های سریع")}</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: "settimana", Icon: CalendarDays, label: mkTri(lang)("Piano Settimanale", "Wochenplan", "Weekly Plan", "Plan Semanal", "Plan Hebdo", "برنامهٔ هفتگی") },
            { id: "metodo", Icon: Droplets, label: mkTri(lang)("Calcolatore Idratazione", "Hydratations-Rechner", "Hydration Calculator", "Calc. Hidratación", "Calc. Hydratation", "ماشین‌حساب آب") },
            { id: "sequenze", Icon: ListChecks, label: mkTri(lang)("Sequenze & Orari", "Reihenfolge & Zeiten", "Sequences & Timing", "Secuencias y Horarios", "Séquences & Horaires", "توالی و زمان‌ها") },
            { id: "convlievito", Icon: FlaskConical, label: mkTri(lang)("Convertitore Lieviti", "Hefe-Umrechner", "Yeast Converter", "Convertidor Levaduras", "Convertisseur Levures", "مبدل خمیرمایه") },
          ].map(({ id, Icon, label }) => (
            <button key={id} data-testid={`maestro-top-${id}`} onClick={() => openTool(id)}
              className="flex items-center gap-3 min-h-[60px] rounded-2xl px-4 bg-[#1e1e1e] border border-[#ff6b00]/40 text-white shadow-sm active:scale-97 hover:border-[#ff6b00] transition-all text-left">
              <span className="w-9 h-9 rounded-xl bg-[#ff6b00]/15 border border-[#ff6b00]/30 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-[#ff6b00]" /></span>
              <span className="font-display text-sm font-bold leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* PERCORSO GUIDATO: la sequenza logica passo-passo (Settimana → Ricetta → Extra) */}
      <LabWizard onOpenTool={openTool} />

      {/* Il GENERATORE del piano IA (scegli ricette → genera) */}
      <PianoProduzioneAI onOpenTool={openTool} />

      {/* Avatar del Laboratorio: Michele operativo + Mohammadreza pronto ad aiutare */}
      <AvatarBubbles variant="lab" />

      {/* Firma personale: Michele al lavoro (identità del laboratorio) */}
      <div data-testid="maestro-signature" className="mt-5 relative overflow-hidden rounded-2xl border border-[#2e2e2e]">
        <img src="/bio-dough-2.jpg" alt={mkTri(lang)("Michele al lavoro", "Michele bei der Arbeit", "Michele at work", "Michele trabajando", "Michele au travail", "میکله در حال کار")}
          className="w-full h-28 object-cover object-center" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/50 to-transparent" />
        <p className="absolute inset-y-0 left-0 flex items-center px-4 max-w-[70%] text-white font-display text-sm font-bold leading-tight drop-shadow">
          {mkTri(lang)("Ogni impasto passa dalle mie mani, prima che dalle tue.", "Jeder Teig geht durch meine Hände, bevor er zu deinen kommt.", "Every dough passes through my hands, before yours.", "Cada masa pasa por mis manos, antes que por las tuyas.", "Chaque pâte passe par mes mains, avant les tiennes.", "هر خمیر پیش از دستان تو، از دستان من می‌گذرد.")}
        </p>
      </div>

      {/* Assistente e aiuto: sotto il piano, per chi vuole approfondire */}
      <div className="mt-5">
        <MohammedAssistant />
      </div>

      {/* WhatsApp SOLO qui (Laboratorio) e nei Corsi */}
      <div className="mt-4">
        <WhatsAppHelp context="laboratorio" />
      </div>
    </div>
  );
}
