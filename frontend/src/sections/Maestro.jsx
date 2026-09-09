import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle, CalendarDays, ChefHat, Flame, Wheat, ChevronLeft, ChevronRight,
  ClipboardList, Thermometer, ScanLine, Clock, ShoppingCart, Users, CheckSquare, ListChecks, Snowflake, Droplets, FlaskConical,
  Cog, BookOpen, LayoutDashboard, Scale, Euro, Recycle, Timer as TimerIcon, CloudSun, Store, QrCode, CalendarCheck, Sparkles, Camera, Building2, Wrench, ChevronDown, ChevronUp, Maximize2, Mic, Bluetooth, Zap,
} from "lucide-react";
import RecipeList from "@/components/RecipeList";
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
import WebRecipe from "@/sections/WebRecipe";
import ScanFlour from "@/sections/ScanFlour";
import BackwardScheduler from "@/sections/BackwardScheduler";
import ShoppingList from "@/sections/ShoppingList";
import ShiftRoles from "@/sections/ShiftRoles";
import RegistroScarti from "@/sections/RegistroScarti";
import BraccioLab from "@/sections/BraccioLab";
import RicettaDelGiorno from "@/sections/RicettaDelGiorno";
import Emergenze from "@/sections/Emergenze";
import Magazzino from "@/sections/Magazzino";
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
import BatchTraceability from "@/sections/BatchTraceability";
import DoughTwin from "@/sections/DoughTwin";
import GuidedWeighing from "@/sections/GuidedWeighing";
import DoughLog from "@/sections/DoughLog";
import SalesPoints from "@/sections/SalesPoints";
import HighFive from "@/components/HighFive";
import LabWizard from "@/components/LabWizard";
import FlourTable from "@/components/FlourTable";
import PhotoDiagnosi from "@/sections/PhotoDiagnosi";
import SoundDiagnosi from "@/sections/SoundDiagnosi";
import EnterpriseHub from "@/sections/EnterpriseHub";
import { useLang } from "@/i18n/LanguageContext";
import { useBackClose } from "@/lib/backNav";
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
import SmartPlannerStressZero from "@/sections/SmartPlannerStressZero";
import VoiceCore from "@/sections/VoiceCore";
import ThermalGuard from "@/sections/ThermalGuard";
import ReportGiornata from "@/sections/ReportGiornata";
import TeamWorkflow from "@/sections/TeamWorkflow";
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
import ManualePage from "@/sections/ManualePage";
import ToolsDirectory from "@/components/ToolsDirectory";
import { toast } from "sonner";
import { mkTri } from "@/i18n/triMaps";
import LabModeBig from "@/components/LabModeBig";
import VoiceCommand from "@/components/VoiceCommand"; // eslint-disable-line no-unused-vars
import BluetoothConnect from "@/components/BluetoothConnect";
import TimetableLievitazione from "@/sections/TimetableLievitazione";
import { useProfile } from "@/profile/ProfileContext";
import { isPassion } from "@/lib/labHubs";


export default function Maestro() {
  const [tool, setTool] = useState(null);
  const [showTools, setShowTools] = useState(() => { try { return localStorage.getItem("mikilab_lab_show_tools") === "1"; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem("mikilab_lab_show_tools", showTools ? "1" : "0"); } catch { /* */ } }, [showTools]);
  const [bigMode, setBigMode] = useState(() => { try { return localStorage.getItem("mikilab_lab_big") === "1"; } catch { return false; } });
  const setBig = (v) => { setBigMode(v); try { localStorage.setItem("mikilab_lab_big", v ? "1" : "0"); } catch { /* */ } window.scrollTo(0, 0); };
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
  const { profile } = useProfile();
  const passion = isPassion(profile);
  const tri = (i, d, e, s) => mkTri(lang)(i, d, e, s);
  const [labView, setLabView] = useState(() => { try { return localStorage.getItem("mikilab_lab_view") || "braccio"; } catch { return "braccio"; } });
  const setView = (v) => { setLabView(v); try { localStorage.setItem("mikilab_lab_view", v); } catch { /* */ } };
  // Ri-tap del tab "Lab" dalla bottom nav: chiude il tool aperto o torna alla vista operativa (per raggiungere il banner turno).
  useEffect(() => {
    const onRetap = (e) => {
      if (!e?.detail || e.detail.tab !== "maestro") return;
      if (tool) setTool(null); else setLabView("braccio");
      window.scrollTo(0, 0);
    };
    window.addEventListener("mikilab-nav-retap", onRetap);
    return () => window.removeEventListener("mikilab-nav-retap", onRetap);
  }, [tool]);
  useBackClose(!!tool, back);

  if (tool) {
    return (
      <div>
        <HighFive />
        <button data-testid="maestro-back-btn" onClick={back}
          className="inline-flex items-center gap-1.5 mb-4 px-4 py-2 rounded-full font-bold text-sm shadow-sm active:scale-95 transition-all"
          style={{ background: "#FBF6E8", border: "2px solid #64748B", color: "#8A5A16" }}>
          <ChevronLeft className="w-5 h-5" /> {tri("Indietro", "Zurück", "Back", "Atrás", "Retour", "بازگشت")}
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
        {tool === "planner" && <SmartPlannerStressZero />}
        {tool === "voicecore" && <VoiceCore />}
        {tool === "thermalguard" && <ThermalGuard />}
        {tool === "report" && <ReportGiornata />}
        {tool === "manuale" && <ManualePage />}
        {tool === "teamos" && <TeamWorkflow />}
        {tool === "scarti" && <RegistroScarti />}
        {tool === "ricettadelgiorno" && <RicettaDelGiorno />}
        {tool === "emergenze" && <Emergenze />}
        {tool === "magazzino" && <Magazzino />}
        {tool === "check" && <Checklists />}
        {tool === "sveglia" && <SvegliaLievito />}
        {tool === "salespoints" && <SalesPoints />}
        {tool === "timetable" && <TimetableLievitazione />}
        {tool === "diagnosi" && <PhotoDiagnosi />}
        {tool === "scanflour" && <ScanFlour />}
        {tool === "webrecipe" && <WebRecipe />}
        {tool === "bluetooth" && <BluetoothConnect />}
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
        {tool === "labpizzeria" && <LabPizzeria onOpenTool={openTool} />}
        {tool === "labpasticceria" && <LabPasticceria onOpenTool={openTool} />}
        {tool === "custodite" && <RicetteCustodite />}
        {tool === "manisporche" && <ManiSporche />}
        {tool === "suono" && <SoundDiagnosi />}
        {tool === "enterprise" && <EnterpriseHub />}
      </div>
    );
  }

  if (bigMode && !passion) {
    return <LabModeBig onExit={() => setBig(false)} onOpenTool={openTool} onOpenPlan={() => setBig(false)} />;
  }

  // HOME "Braccio": schermata operativa mobile (default). La "Mente" (pianificazione/tool) è in Gestione.
  if (labView === "braccio") {
    return (
      <div className="pb-4">
        <HighFive />
        <BraccioLab onOpenTool={openTool} onGestione={() => setView("gestione")} />
      </div>
    );
  }

  return (
    <div className="pb-28">
      <HighFive />
      <button data-testid="maestro-to-braccio" onClick={() => setView("braccio")}
        className="inline-flex items-center gap-1.5 mb-3 px-3.5 py-2 rounded-full bg-[#3E9C93]/12 border border-[#3E9C93]/40 text-[#3E9C93] font-semibold text-[13px] active:scale-95 transition-all">
        <ChevronLeft className="w-4 h-4" /> {tri("Laboratorio operativo", "Betriebsmodus", "Operative mode", "Modo operativo")}
      </button>

      {/* Banner: La Tua Tecnologia Unica — 6 killer feature */}
      <div data-testid="maestro-tech-banner" className="mb-3 rounded-2xl border border-[#3E9C93]/45 bg-gradient-to-br from-[#14212C] to-[#14212C] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#3E9C93] shrink-0" />
          <h3 className="font-display text-[13px] font-extrabold uppercase tracking-wider text-[#3E9C93] leading-tight">
            {mkTri(lang)("La Tua Tecnologia Unica", "Deine einzigartige Technologie", "Your Unique Technology", "Tu Tecnología Única", "Ta Technologie Unique", "فناوری منحصربه‌فرد تو")}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { Icon: Bluetooth, t: mkTri(lang)("Sonde & Sensori Live", "Live-Sonden & Sensoren", "Live Probes & Sensors", "Sondas y Sensores en Vivo", "Sondes & Capteurs Live", "سنسور و پروب زنده"), sub: "BLE" },
            { Icon: Mic, t: mkTri(lang)("Assistente Vocale Multilingua", "Mehrsprachiger Sprachassistent", "Multilingual Voice Assistant", "Asistente de Voz Multilingüe", "Assistant Vocal Multilingue", "دستیار صوتی چندزبانه"), sub: "IT·DE·EN·ES·FR·FA" },
            { Icon: Camera, t: mkTri(lang)("Analisi Visiva IA", "Visuelle KI-Analyse", "Visual AI Analysis", "Análisis Visual IA", "Analyse Visuelle IA", "تحلیل تصویری هوش مصنوعی"), sub: null },
            { Icon: Wheat, t: mkTri(lang)("Calcolo & Bilanciamento Farine", "Mehl-Berechnung & Balance", "Flour Calc & Balancing", "Cálculo y Balance de Harinas", "Calcul & Équilibrage Farines", "محاسبه و تعادل آرد"), sub: "W · P/L" },
            { Icon: Zap, t: mkTri(lang)("Ottimizzatore Consumi & Cottura", "Verbrauchs- & Back-Optimierung", "Consumption & Bake Optimizer", "Optimizador Consumo y Cocción", "Optimiseur Conso & Cuisson", "بهینه‌ساز مصرف و پخت"), sub: null },
            { Icon: TimerIcon, t: mkTri(lang)("Timer Lievitazione Smart", "Smart Gär-Timer", "Smart Proofing Timer", "Temporizador Fermentación Smart", "Minuteur Levée Intelligent", "تایمر هوشمند ور آمدن"), sub: mkTri(lang)("Offline First", "Offline First", "Offline First", "Sin conexión", "Hors-ligne", "آفلاین") },
          ].map(({ Icon, t, sub }, i) => (
            <button key={i} data-testid={`tech-feat-${i}`} onClick={() => openTool(["bluetooth", "manisporche", "diagnosi", "trovafarina", "energia", "timer"][i])}
              className="w-full text-start flex items-center gap-2.5 rounded-2xl shadow-md border border-amber-900/40 bg-[#3E9C93]/8 border border-[#3E9C93]/25 px-2.5 py-2 min-h-[52px] active:scale-97 hover:border-[#3E9C93]/60 transition-all">
              <span className="w-8 h-8 rounded-lg bg-[#3E9C93]/18 border border-[#3E9C93]/35 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#3E9C93]" />
              </span>
              <span className="min-w-0 text-start">
                <span className="block text-[11.5px] font-bold text-[#e4eff8] leading-tight">{t}</span>
                {sub && <span className="block text-[10px] font-semibold text-[#3E9C93]/85 leading-tight mt-0.5">{sub}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA gigante: avvia subito la generazione guidata */}
      <button data-testid="maestro-cta-generate" onClick={() => openTool("generatore")}
        className="w-full flex items-center justify-center gap-3 min-h-[76px] rounded-2xl px-5 mb-4 bg-gradient-to-r from-[#3E9C93] to-[#3E9C93] text-white font-extrabold text-lg shadow-[0_6px_0_rgba(0,0,0,.35),0_10px_20px_rgba(255,107,0,.4)] active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,.35)] transition-all">
        <Sparkles className="w-7 h-7 shrink-0" />
        <span className="font-display tracking-tight text-center">{mkTri(lang)("✨ NUOVA RICETTA / WORKFLOW", "✨ NEUES REZEPT / WORKFLOW", "✨ NEW RECIPE / WORKFLOW", "✨ NUEVA RECETA / WORKFLOW", "✨ NOUVELLE RECETTE / WORKFLOW", "✨ دستور / گردش‌کار جدید")}</span>
      </button>

      {/* Header pulito e professionale: solo titolo, nessuna immagine decorativa (lab = lavoro veloce). */}
      <div data-testid="maestro-title" className="mb-4">
        <h1 className="font-display text-2xl font-extrabold text-white leading-tight">{mkTri(lang)("Modalità Chef · Laboratorio", "Chef-Modus · Labor", "Chef Mode · Lab", "Modo Chef · Laboratorio", "Mode Chef · Atelier", "حالت شف · کارگاه")}</h1>
        <p className="text-[13px] text-[#AEB8BF] leading-snug mt-0.5">{mkTri(lang)("Inserisci la produzione di oggi: l'IA calcola dosi esatte, orari e gestione del freddo.", "Gib die heutige Produktion ein: die KI berechnet Mengen, Zeiten und Kältesteuerung.", "Enter today's production: the AI computes exact doses, timing and cold management.", "Introduce la producción de hoy: la IA calcula dosis exactas, horarios y gestión del frío.", "Saisis la production du jour : l'IA calcule doses, horaires et gestion du froid.", "تولید امروز را وارد کن: هوش مصنوعی مقدار، زمان و مدیریت سرما را حساب می‌کند.")}</p>
      </div>

      {/* Modalità Laboratorio: pulsanti giganti per lavorare con le mani infarinate (solo Pro) */}
      {!passion && (
      <button data-testid="maestro-lab-big-toggle" onClick={() => setBig(true)}
        className="w-full flex items-center gap-3 min-h-[64px] rounded-2xl px-4 mb-3 bg-[#1B2A38] border-2 border-[#3E9C93]/60 hover:border-[#3E9C93] text-white active:scale-98 transition-all text-left">
        <span className="w-11 h-11 rounded-2xl bg-[#3E9C93]/15 border border-[#3E9C93]/40 flex items-center justify-center shrink-0"><Maximize2 className="w-6 h-6 text-[#3E9C93]" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[15px] font-extrabold leading-tight">{mkTri(lang)("Modalità Laboratorio", "Labor-Modus", "Bakery Mode", "Modo Laboratorio", "Mode Atelier", "حالت کارگاه")}</span>
          <span className="block text-[11.5px] text-[#7E8A93] leading-snug">{mkTri(lang)("Pulsanti giganti, per mani infarinate e voce", "Große Tasten, für mehlige Hände & Stimme", "Giant buttons, for floury hands & voice", "Botones gigantes, para manos enharinadas y voz")}</span>
        </span>
        <ChevronRight className="w-5 h-5 text-[#3E9C93] shrink-0" />
      </button>
      )}

      {/* Generatore di Piano IA — il flusso unico di produzione (solo Pro) */}
      {!passion && (
      <div data-testid="maestro-plan" className="mb-4">
        <PianoProduzioneAI onOpenTool={openTool} />
      </div>
      )}

      {/* 4 Macro-Hub: tutti gli strumenti in ordine. Ognuno si apre come schermata sovrapposta. */}
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#3E9C93] mb-2 flex items-center gap-1.5">
        <Wrench className="w-4 h-4" /> {mkTri(lang)("Strumenti del Laboratorio", "Labor-Werkzeuge", "Lab tools", "Herramientas del Lab", "Outils de l'atelier", "ابزارهای کارگاه")}
      </p>
      <ToolsDirectory onOpenTool={openTool} />

      {/* WhatsApp SOLO qui (Laboratorio) e nei Corsi */}
      <div className="mt-4">
        <WhatsAppHelp context="laboratorio" />
      </div>

      {/* Comandi vocali: Miki-Voice è globale (montato in App.js) */}
    </div>
  );
}
